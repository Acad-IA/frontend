import '@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from '@supabase/supabase-js'
import { z } from 'zod'

import { corsHeaders } from '../_shared/cors.ts'
import { OpenAIService } from '../_shared/openai-service.ts'
import { HttpError, sendError, sendSuccess } from '../_shared/utils.ts'

import type { Database } from '../_shared/database.types.ts'
import type {
  OpenAIFileDeleted,
  OpenAIFileObject,
} from '../_shared/openai-service.ts'

type ArchivoRow = {
  id: string
  path: string
  openai_file_id: string | null
}

const filesPattern = new URLPattern({ pathname: '*/openai-files/files' })
const fileIdPattern = new URLPattern({ pathname: '*/openai-files/files/:id' })

const PostFilesBodySchema = z.preprocess(
  (val) => {
    if (!val || typeof val !== 'object' || Array.isArray(val)) return val
    const rec = val as Record<string, unknown>
    if (typeof rec.archivoId === 'string') return val
    if (typeof rec.id === 'string') return { archivoId: rec.id }
    return val
  },
  z
    .object({
      archivoId: z.string().uuid('archivoId debe ser un UUID'),
    })
    .strict(),
)

function basenameFromPath(path: string): string {
  const parts = path.split('/').filter(Boolean)
  return parts.length ? parts[parts.length - 1] : path
}

/**
 * If filenames are stored as `${uuid}-${originalName}`, return `originalName`.
 * Otherwise return the basename unchanged.
 */
function stripUuidPrefix(basename: string): string {
  const m = basename.match(
    /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}-(.+)$/,
  )
  return m ? m[1] : basename
}

function requireEnv(name: string): string {
  const v = Deno.env.get(name)
  if (!v) {
    throw new HttpError(
      500,
      'Configuración del servidor incompleta.',
      'MISSING_ENV',
      { missing: [name] },
    )
  }
  return v
}

console.info('openai-files: server started')

Deno.serve(async (req: Request): Promise<Response> => {
  const functionName = 'openai-files'

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders })
  }

  try {
    const authHeaderRaw =
      req.headers.get('Authorization') ?? req.headers.get('authorization')
    if (!authHeaderRaw) {
      throw new HttpError(401, 'No autorizado.', 'UNAUTHORIZED', {
        reason: 'missing_authorization_header',
      })
    }

    const svc = OpenAIService.fromEnv()
    if (!(svc instanceof OpenAIService)) {
      throw new HttpError(
        500,
        'Configuración del servidor incompleta.',
        'OPENAI_MISCONFIGURED',
        svc,
      )
    }

    const SUPABASE_URL = requireEnv('SUPABASE_URL')
    const SERVICE_ROLE_KEY = requireEnv('SUPABASE_SERVICE_ROLE_KEY')
    const supabase = createClient<Database>(SUPABASE_URL, SERVICE_ROLE_KEY)

    const { method } = req

    switch (method) {
      // --- POST /openai-files/files ---
      case 'POST': {
        if (!filesPattern.test(req.url)) break

        const contentType = (
          req.headers.get('content-type') || ''
        ).toLowerCase()
        if (!contentType.includes('application/json')) {
          throw new HttpError(
            415,
            'Content-Type no soportado.',
            'UNSUPPORTED_MEDIA_TYPE',
            { contentType, expected: 'application/json' },
          )
        }

        let rawBody: unknown
        try {
          rawBody = await req.json()
        } catch (e) {
          throw new HttpError(400, 'Body JSON inválido.', 'INVALID_JSON', {
            cause: e,
          })
        }

        const parsed = PostFilesBodySchema.safeParse(rawBody)
        if (!parsed.success) {
          throw new HttpError(422, 'Body inválido.', 'VALIDATION_ERROR', {
            issues: parsed.error.issues,
          })
        }

        const archivoId = parsed.data.archivoId

        const { data: archivo, error: archivoError } = await supabase
          .from('archivos')
          .select('id,path,openai_file_id')
          .eq('id', archivoId)
          .single()

        if (archivoError) {
          const maybeCode = (archivoError as { code?: string }).code
          if (maybeCode === 'PGRST116') {
            throw new HttpError(404, 'Archivo no encontrado.', 'NOT_FOUND', {
              table: 'archivos',
              id: archivoId,
            })
          }
          throw new HttpError(
            500,
            'No se pudo resolver el archivo.',
            'SUPABASE_QUERY_FAILED',
            archivoError,
          )
        }

        const row = archivo as unknown as ArchivoRow
        const path = String(row.path)
        if (!path) {
          throw new HttpError(
            500,
            'El archivo no tiene path en la base de datos.',
            'INVALID_STATE',
            { id: archivoId },
          )
        }

        // Si ya fue subido a OpenAI, devolver el FileObject.
        if (row.openai_file_id) {
          const existing = await svc.retrieveFile(String(row.openai_file_id))
          return sendSuccess(existing satisfies OpenAIFileObject)
        }

        // Descargar desde Storage y subir a OpenAI.
        const { data: blob, error: dlError } = await supabase.storage
          .from('ai-storage')
          .download(path)

        if (dlError) {
          throw new HttpError(
            500,
            'No se pudo descargar el archivo desde Storage.',
            'SUPABASE_STORAGE_DOWNLOAD_FAILED',
            { error: dlError, bucket: 'ai-storage', path },
          )
        }

        const origBasename = basenameFromPath(path)
        const uploadName = stripUuidPrefix(origBasename)
        const file = new File([blob], uploadName, {
          type: blob.type || 'application/octet-stream',
        })

        let created: OpenAIFileObject
        try {
          created = await svc.createFile(file)
        } catch (e) {
          throw new HttpError(
            502,
            'No se pudo subir el archivo a OpenAI.',
            'OPENAI_FILE_UPLOAD_FAILED',
            { cause: e },
          )
        }

        const { error: upErr } = await supabase
          .from('archivos')
          .update({ openai_file_id: created.id })
          .eq('id', archivoId)
        if (upErr) {
          throw new HttpError(
            500,
            'No se pudo persistir openai_file_id.',
            'SUPABASE_UPDATE_FAILED',
            upErr,
          )
        }

        console.info(
          `[${new Date().toISOString()}][${functionName}] uploaded archivoId=${archivoId} openaiFileId=${created.id}`,
        )

        return sendSuccess(created)
      }

      // --- DELETE /openai-files/files/:id ---
      case 'DELETE': {
        const match = fileIdPattern.exec(req.url)
        if (!match) break

        const openaiFileId = String(match.pathname.groups.id ?? '')
        if (!openaiFileId) {
          throw new HttpError(400, 'file_id inválido.', 'VALIDATION_ERROR')
        }

        let deleted: OpenAIFileDeleted
        try {
          deleted = await svc.deleteFile(openaiFileId)
        } catch (e) {
          throw new HttpError(
            502,
            'No se pudo borrar el archivo en OpenAI.',
            'OPENAI_FILE_DELETE_FAILED',
            { cause: e },
          )
        }

        console.info(
          `[${new Date().toISOString()}][${functionName}] deleted openaiFileId=${openaiFileId}`,
        )

        return sendSuccess(deleted)
      }

      default:
        break
    }

    return sendError(404, 'Ruta o método no válido', 'NOT_FOUND')
  } catch (error) {
    if (error instanceof HttpError) {
      console.error(
        `[${new Date().toISOString()}][${functionName}] ⚠️ Handled Error:`,
        {
          message: error.message,
          code: error.code,
          internalDetails: error.internalDetails || 'N/A',
        },
      )
      return sendError(error.status, error.message, error.code)
    }

    const unexpectedError =
      error instanceof Error ? error : new Error(String(error))
    console.error(
      `[${new Date().toISOString()}][${functionName}] 💥 CRITICAL UNHANDLED ERROR:`,
      unexpectedError.stack || unexpectedError.message,
    )
    return sendError(
      500,
      'Ocurrió un error inesperado.',
      'INTERNAL_SERVER_ERROR',
    )
  }
})
