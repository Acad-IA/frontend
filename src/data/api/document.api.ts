// document.api.ts

import { supabaseBrowser } from '../supabase/client'
import { invokeEdge } from '../supabase/invokeEdge'

import { requireData, throwIfError } from './_helpers'

import type { Tables } from '@/types/supabase'

import { columnParsers } from '@/lib/asignaturaColumnParsers'

const EDGE = {
  carbone_io_wrapper: 'carbone-io-wrapper',
} as const

interface GeneratePdfParams {
  plan_estudio_id: string
}
interface GeneratePdfParamsAsignatura {
  asignatura_id: string
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function toStringValue(value: unknown): string {
  if (typeof value === 'string') return value
  if (typeof value === 'number' || typeof value === 'boolean')
    return String(value)
  if (value === null || value === undefined) return ''
  try {
    return JSON.stringify(value)
  } catch {
    return String(value)
  }
}

function buildAsignaturaReportData(
  row: Pick<
    Tables<'asignaturas'>,
    'datos' | 'contenido_tematico' | 'criterios_de_evaluacion'
  >,
): Record<string, string> {
  const out: Record<string, string> = {}

  const datosRaw = row.datos
  if (isPlainRecord(datosRaw)) {
    for (const [k, v] of Object.entries(datosRaw)) {
      if (v === null || v === undefined) continue
      out[k] = toStringValue(v)
    }
  }

  for (const [key, parser] of Object.entries(columnParsers)) {
    if (!parser) continue

    const current = out[key]
    if (typeof current === 'string' && current.trim()) continue

    const rawValue = (row as any)?.[key]
    const parsed = parser(rawValue)
    if (parsed.trim()) out[key] = parsed
  }

  return out
}

export async function fetchPlanPdf({
  plan_estudio_id,
}: GeneratePdfParams): Promise<Blob> {
  return await invokeEdge<Blob>(
    EDGE.carbone_io_wrapper,
    {
      action: 'downloadReport',
      plan_estudio_id,
      body: { convertTo: 'pdf' },
    },
    {
      headers: {
        'Content-Type': 'application/json',
      },
      responseType: 'blob',
    },
  )
}

export async function fetchAsignaturaPdf({
  asignatura_id,
}: GeneratePdfParamsAsignatura): Promise<Blob> {
  const supabase = supabaseBrowser()

  const { data, error } = await supabase
    .from('asignaturas')
    .select('*')
    .eq('id', asignatura_id)
    .single()

  throwIfError(error)

  const row = requireData(
    data as Pick<
      Tables<'asignaturas'>,
      'datos' | 'contenido_tematico' | 'criterios_de_evaluacion'
    >,
    'Asignatura no encontrada',
  )

  // const reportData = buildAsignaturaReportData(row)

  return await invokeEdge<Blob>(
    EDGE.carbone_io_wrapper,
    {
      action: 'downloadReport',
      asignatura_id,
      body: {
        data: row,
        convertTo: 'pdf',
      },
    },
    {
      headers: {
        'Content-Type': 'application/json',
      },
      responseType: 'blob',
    },
  )
}
