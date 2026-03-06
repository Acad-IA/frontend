import { useNavigate } from '@tanstack/react-router'
import CSL from 'citeproc'
import { Loader2, Plus, RefreshCw, Sparkles } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'

import type { BuscarBibliografiaRequest } from '@/data'
import type { GoogleBooksVolume } from '@/data/api/subjects.api'

import { defineStepper } from '@/components/stepper'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { WizardLayout } from '@/components/wizard/WizardLayout'
import { WizardResponsiveHeader } from '@/components/wizard/WizardResponsiveHeader'
import { buscar_bibliografia } from '@/data'
import { useCreateBibliografia } from '@/data/hooks/useSubjects'
import { cn } from '@/lib/utils'

type MetodoBibliografia = 'MANUAL' | 'IA' | null
export type FormatoCita = 'apa' | 'ieee' | 'vancouver' | 'chicago'

type CSLAuthor = {
  family: string
  given: string
}

type CSLItem = {
  id: string
  type: 'book'
  title: string
  author: Array<CSLAuthor>
  publisher?: string
  issued?: { 'date-parts': Array<Array<number>> }
  ISBN?: string
}

type BibliografiaRef = {
  id: string
  source: 'IA' | 'MANUAL'
  raw?: GoogleBooksVolume
  title: string
  authors: Array<string>
  publisher?: string
  year?: number
  isbn?: string

  tipo: 'BASICA' | 'COMPLEMENTARIA'
}

type WizardState = {
  metodo: MetodoBibliografia
  ia: {
    q: string
    cantidadDeSugerencias: number
    sugerencias: Array<{
      id: string
      selected: boolean
      volume: GoogleBooksVolume
    }>
    isLoading: boolean
    errorMessage: string | null
  }
  manual: {
    draft: {
      title: string
      authorsText: string
      publisher: string
      yearText: string
      isbn: string
    }
    refs: Array<BibliografiaRef>
  }
  formato: FormatoCita | null
  refs: Array<BibliografiaRef>
  citaEdits: Record<FormatoCita, Record<string, string>>
  generatingIds: Set<string>
  isSaving: boolean
  errorMessage: string | null
}

const Wizard = defineStepper(
  { id: 'metodo', title: 'Método', description: 'Manual o Con IA' },
  {
    id: 'paso2',
    title: 'Datos básicos',
    description: 'Seleccionar o capturar',
  },
  { id: 'paso3', title: 'Detalles', description: 'Formato y citas' },
  { id: 'resumen', title: 'Resumen', description: 'Confirmar' },
)

function parsearAutor(nombreCompleto: string): CSLAuthor {
  if (nombreCompleto.includes(',')) {
    return {
      family: nombreCompleto.split(',')[0]?.trim() ?? '',
      given: nombreCompleto.split(',')[1]?.trim() ?? '',
    }
  }
  const partes = nombreCompleto.trim().split(/\s+/).filter(Boolean)
  if (partes.length === 1) return { family: partes[0] ?? '', given: '' }
  const family = partes.pop() ?? ''
  const given = partes.join(' ')
  return { family, given }
}

function tryParseYear(publishedDate?: string): number | undefined {
  if (!publishedDate) return undefined
  const match = String(publishedDate).match(/\d{4}/)
  if (!match) return undefined
  const year = Number.parseInt(match[0], 10)
  return Number.isFinite(year) ? year : undefined
}

function volumeToRef(volume: GoogleBooksVolume): BibliografiaRef {
  const info = volume.volumeInfo ?? {}
  const title = (info.title ?? '').trim() || 'Sin título'
  const authors = Array.isArray(info.authors) ? info.authors : []
  const publisher = info.publisher
  const year = tryParseYear(info.publishedDate)
  const isbn =
    info.industryIdentifiers?.find((x) => x.identifier)?.identifier ?? undefined

  return {
    id: volume.id,
    source: 'IA',
    raw: volume,
    title,
    authors,
    publisher,
    year,
    isbn,
    tipo: 'BASICA',
  }
}

function citeprocHtmlToPlainText(value: string) {
  const input = value
  if (!input) return ''

  // citeproc suele devolver HTML + entidades (`&#38;`, `&amp;`, etc.).
  // Convertimos a texto plano usando el parser del navegador.
  try {
    const doc = new DOMParser().parseFromString(input, 'text/html')
    return (doc.body.textContent || '').replace(/\s+/g, ' ').trim()
  } catch {
    // Fallback ultra simple (por si DOMParser no existe en algún entorno).
    return input
      .replace(/<[^>]*>/g, ' ')
      .replace(/&#38;?/g, '&')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\s+/g, ' ')
      .trim()
  }
}

async function fetchTextCached(url: string, cache: Map<string, string>) {
  const cached = cache.get(url)
  if (cached) return cached
  const res = await fetch(url)
  if (!res.ok) throw new Error(`No se pudo cargar recurso: ${url}`)
  const text = await res.text()

  // En dev (SPA), una ruta inexistente puede devolver `index.html` con 200.
  // Eso rompe citeproc con errores poco claros.
  const trimmed = text.trim().toLowerCase()
  const looksLikeHtml =
    trimmed.startsWith('<!doctype html') || trimmed.startsWith('<html')
  if (looksLikeHtml) {
    throw new Error(
      `Recurso CSL/XML no encontrado en ${url}. ` +
        `Asegúrate de colocar los archivos en public/csl (ver public/csl/README.md).`,
    )
  }

  const looksLikeXml =
    trimmed.startsWith('<?xml') ||
    trimmed.startsWith('<style') ||
    trimmed.startsWith('<locale')
  if (!looksLikeXml) {
    throw new Error(
      `Recurso en ${url} no parece XML CSL válido. ` +
        `Verifica que sea un archivo .csl/.xml correcto.`,
    )
  }

  cache.set(url, text)
  return text
}

// Recursos locales servidos desde Vite `public/`.
// Colocar los archivos en `public/csl/styles/*` y `public/csl/locales/*`.
const PUBLIC_BASE_URL = import.meta.env.BASE_URL || '/'
function publicUrl(path: string) {
  return `${PUBLIC_BASE_URL}${path.replace(/^\//, '')}`
}

const CSL_STYLE_URL: Record<FormatoCita, string> = {
  apa: publicUrl('csl/styles/apa.csl'),
  ieee: publicUrl('csl/styles/ieee.csl'),
  chicago: publicUrl('csl/styles/chicago-author-date.csl'),
  vancouver: publicUrl('csl/styles/nlm-citation-sequence.csl'),
}

const CSL_LOCALE_URL = publicUrl('csl/locales/locales-es-MX.xml')

export function NuevaBibliografiaModalContainer({
  planId,
  asignaturaId,
}: {
  planId: string
  asignaturaId: string
}) {
  const navigate = useNavigate()
  const createBibliografia = useCreateBibliografia()

  const [wizard, setWizard] = useState<WizardState>({
    metodo: null,
    ia: {
      q: '',
      cantidadDeSugerencias: 10,
      sugerencias: [],
      isLoading: false,
      errorMessage: null,
    },
    manual: {
      draft: {
        title: '',
        authorsText: '',
        publisher: '',
        yearText: '',
        isbn: '',
      },
      refs: [],
    },
    formato: null,
    refs: [],
    citaEdits: {
      apa: {},
      ieee: {},
      chicago: {},
      vancouver: {},
    },
    generatingIds: new Set(),
    isSaving: false,
    errorMessage: null,
  })

  const styleCacheRef = useRef(new Map<string, string>())
  const localeCacheRef = useRef(new Map<string, string>())

  const titleOverrides =
    wizard.metodo === 'IA'
      ? { paso2: 'Sugerencias', paso3: 'Estructura' }
      : { paso2: 'Datos básicos', paso3: 'Detalles' }

  const handleClose = () => {
    navigate({
      to: `/planes/${planId}/asignaturas/${asignaturaId}/bibliografia/`,
      resetScroll: false,
    })
  }

  const refsForStep3: Array<BibliografiaRef> =
    wizard.metodo === 'IA'
      ? wizard.ia.sugerencias
          .filter((s) => s.selected)
          .map((s) => volumeToRef(s.volume))
      : wizard.manual.refs

  // Mantener `wizard.refs` como snapshot para pasos 3/4.
  useEffect(() => {
    setWizard((w) => ({ ...w, refs: refsForStep3 }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wizard.metodo, wizard.ia.sugerencias, wizard.manual.refs])

  const citationsForFormato = useMemo(() => {
    if (!wizard.formato) return {}
    return wizard.citaEdits[wizard.formato]
  }, [wizard.citaEdits, wizard.formato])

  const allCitationsReady = useMemo(() => {
    if (!wizard.formato) return false
    if (wizard.refs.length === 0) return false
    const map = wizard.citaEdits[wizard.formato]
    return wizard.refs.every(
      (r) => typeof map[r.id] === 'string' && map[r.id].trim().length > 0,
    )
  }, [wizard.citaEdits, wizard.formato, wizard.refs])

  const canContinueDesdeMetodo =
    wizard.metodo === 'MANUAL' || wizard.metodo === 'IA'

  const canContinueDesdePaso2 =
    wizard.metodo === 'IA'
      ? wizard.ia.sugerencias.some((s) => s.selected)
      : wizard.manual.refs.length > 0

  const canContinueDesdePaso3 = Boolean(wizard.formato) && allCitationsReady

  async function handleBuscarSugerencias() {
    setWizard((w) => ({
      ...w,
      ia: { ...w.ia, isLoading: true, errorMessage: null },
      errorMessage: null,
    }))

    try {
      const selectedCount = wizard.ia.sugerencias.filter(
        (s) => s.selected,
      ).length
      const req: BuscarBibliografiaRequest = {
        searchTerms: {
          q: wizard.ia.q,
          maxResults: wizard.ia.cantidadDeSugerencias + selectedCount,
          // orderBy: ignorado por ahora
        },
      }

      const items = await buscar_bibliografia(req)

      setWizard((w) => {
        const existingById = new Map(w.ia.sugerencias.map((s) => [s.id, s]))

        const newOnes = items
          .filter((it) => !existingById.has(it.id))
          .slice(0, w.ia.cantidadDeSugerencias)
          .map((it) => ({ id: it.id, selected: false, volume: it }))

        return {
          ...w,
          ia: {
            ...w.ia,
            sugerencias: [...w.ia.sugerencias, ...newOnes],
            isLoading: false,
            errorMessage: null,
          },
        }
      })
    } catch (e: any) {
      setWizard((w) => ({
        ...w,
        ia: {
          ...w.ia,
          isLoading: false,
          errorMessage:
            typeof e?.message === 'string'
              ? e.message
              : 'Error al buscar bibliografía',
        },
      }))
    }
  }

  async function generateCitasForFormato(
    formato: FormatoCita,
    refs: Array<BibliografiaRef>,
  ) {
    setWizard((w) => {
      const nextIds = new Set(w.generatingIds)
      refs.forEach((r) => nextIds.add(r.id))
      return {
        ...w,
        generatingIds: nextIds,
      }
    })

    try {
      const xmlStyle = await fetchTextCached(
        CSL_STYLE_URL[formato],
        styleCacheRef.current,
      )
      const xmlLocale = await fetchTextCached(
        CSL_LOCALE_URL,
        localeCacheRef.current,
      )

      const cslItems: Record<string, CSLItem> = {}
      for (const r of refs) {
        cslItems[r.id] = {
          id: r.id,
          type: 'book',
          title: r.title || 'Sin título',
          author: r.authors.map(parsearAutor),
          publisher: r.publisher,
          issued: r.year ? { 'date-parts': [[r.year]] } : undefined,
          ISBN: r.isbn,
        }
      }

      const sys = {
        retrieveLocale: (_lang: string) => xmlLocale,
        retrieveItem: (id: string) => cslItems[id],
      }

      const engine = new CSL.Engine(sys as any, xmlStyle)
      engine.updateItems(Object.keys(cslItems))
      const result = engine.makeBibliography()
      const entries = (result?.[1] ?? []) as Array<string>

      const byId = Object.keys(cslItems)
      const citations: Record<string, string> = {}
      for (let i = 0; i < byId.length; i++) {
        const id = byId[i]
        if (!id) continue
        const cita = citeprocHtmlToPlainText(entries[i] ?? '')
        citations[id] = cita
      }

      setWizard((w) => {
        const nextEdits = { ...w.citaEdits }
        const existing = nextEdits[formato]
        const merged: Record<string, string> = { ...existing }

        for (const id of Object.keys(citations)) {
          if (!merged[id] || merged[id].trim().length === 0) {
            merged[id] = citations[id] ?? ''
          }
        }
        nextEdits[formato] = merged

        const nextIds = new Set(w.generatingIds)
        refs.forEach((r) => nextIds.delete(r.id))

        return {
          ...w,
          citaEdits: nextEdits,
          generatingIds: nextIds,
        }
      })
    } catch (e: any) {
      setWizard((w) => {
        const nextIds = new Set(w.generatingIds)
        refs.forEach((r) => nextIds.delete(r.id))
        return {
          ...w,
          generatingIds: nextIds,
          errorMessage:
            typeof e?.message === 'string'
              ? e.message
              : 'Error al generar citas',
        }
      })
    }
  }

  useEffect(() => {
    if (!wizard.formato) return
    if (wizard.refs.length === 0) return
    const map = wizard.citaEdits[wizard.formato]
    const missing = wizard.refs.some(
      (r) => !map[r.id] || map[r.id].trim().length === 0,
    )
    if (!missing) return
    if (wizard.generatingIds.size > 0) return
    void generateCitasForFormato(wizard.formato, wizard.refs)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wizard.formato, wizard.refs])

  async function handleCreate() {
    setWizard((w) => ({ ...w, isSaving: true, errorMessage: null }))

    try {
      if (!wizard.formato) throw new Error('Selecciona un formato')
      const map = wizard.citaEdits[wizard.formato]
      if (wizard.refs.length === 0) throw new Error('No hay referencias')

      await Promise.all(
        wizard.refs.map((r) =>
          createBibliografia.mutateAsync({
            asignatura_id: asignaturaId,
            tipo: r.tipo,
            cita: map[r.id] ?? '',
            tipo_fuente: 'MANUAL',
            biblioteca_item_id: null,
          }),
        ),
      )

      setWizard((w) => ({ ...w, isSaving: false }))
      handleClose()
    } catch (e: any) {
      setWizard((w) => ({
        ...w,
        isSaving: false,
        errorMessage:
          typeof e?.message === 'string'
            ? e.message
            : 'Error al guardar bibliografía',
      }))
    }
  }

  return (
    <Wizard.Stepper.Provider
      initialStep={Wizard.utils.getFirst().id}
      className="flex h-full flex-col"
    >
      {({ methods }) => {
        const idx = Wizard.utils.getIndex(methods.current.id)
        const isLast = idx >= Wizard.steps.length - 1

        return (
          <WizardLayout
            title="Agregar Bibliografía"
            onClose={handleClose}
            headerSlot={
              <WizardResponsiveHeader
                wizard={Wizard}
                methods={methods}
                titleOverrides={titleOverrides}
              />
            }
            footerSlot={
              <Wizard.Stepper.Controls>
                <div className="flex items-center justify-between">
                  <Button
                    variant="secondary"
                    onClick={() => methods.prev()}
                    disabled={
                      idx === 0 || wizard.ia.isLoading || wizard.isSaving
                    }
                  >
                    Anterior
                  </Button>
                  {isLast ? (
                    <Button onClick={handleCreate} disabled={wizard.isSaving}>
                      {wizard.isSaving
                        ? 'Agregando...'
                        : 'Agregar Bibliografía'}
                    </Button>
                  ) : (
                    <Button
                      onClick={() => methods.next()}
                      disabled={
                        wizard.ia.isLoading ||
                        wizard.isSaving ||
                        (idx === 0 && !canContinueDesdeMetodo) ||
                        (idx === 1 && !canContinueDesdePaso2) ||
                        (idx === 2 && !canContinueDesdePaso3)
                      }
                    >
                      Siguiente
                    </Button>
                  )}
                </div>
              </Wizard.Stepper.Controls>
            }
          >
            <div className="mx-auto max-w-3xl">
              {wizard.errorMessage ? (
                <Card className="border-destructive/40 mb-4">
                  <CardHeader>
                    <CardTitle className="text-destructive">
                      {wizard.errorMessage}
                    </CardTitle>
                  </CardHeader>
                </Card>
              ) : null}

              {idx === 0 && (
                <Wizard.Stepper.Panel>
                  <MetodoStep
                    metodo={wizard.metodo}
                    onChange={(metodo) =>
                      setWizard((w) => ({
                        ...w,
                        metodo,
                        formato: null,
                        errorMessage: null,
                      }))
                    }
                  />
                </Wizard.Stepper.Panel>
              )}

              {idx === 1 && (
                <Wizard.Stepper.Panel>
                  {wizard.metodo === 'IA' ? (
                    <SugerenciasStep
                      q={wizard.ia.q}
                      cantidad={wizard.ia.cantidadDeSugerencias}
                      isLoading={wizard.ia.isLoading}
                      errorMessage={wizard.ia.errorMessage}
                      sugerencias={wizard.ia.sugerencias}
                      onChange={(patch) =>
                        setWizard((w) => ({
                          ...w,
                          ia: {
                            ...w.ia,
                            ...patch,
                          },
                          errorMessage: null,
                        }))
                      }
                      onGenerate={handleBuscarSugerencias}
                    />
                  ) : (
                    <DatosBasicosManualStep
                      draft={wizard.manual.draft}
                      refs={wizard.manual.refs}
                      onChangeDraft={(draft) =>
                        setWizard((w) => ({
                          ...w,
                          manual: { ...w.manual, draft },
                          errorMessage: null,
                        }))
                      }
                      onAddRef={(ref) =>
                        setWizard((w) => ({
                          ...w,
                          manual: {
                            ...w.manual,
                            refs: [...w.manual.refs, ref],
                          },
                          errorMessage: null,
                        }))
                      }
                      onRemoveRef={(id) =>
                        setWizard((w) => ({
                          ...w,
                          manual: {
                            ...w.manual,
                            refs: w.manual.refs.filter((r) => r.id !== id),
                          },
                        }))
                      }
                    />
                  )}
                </Wizard.Stepper.Panel>
              )}

              {idx === 2 && (
                <Wizard.Stepper.Panel>
                  <FormatoYCitasStep
                    refs={wizard.refs}
                    formato={wizard.formato}
                    citations={citationsForFormato}
                    generatingIds={wizard.generatingIds}
                    onChangeFormato={(formato) => {
                      setWizard((w) => ({ ...w, formato, errorMessage: null }))
                      if (formato) {
                        void generateCitasForFormato(formato, wizard.refs)
                      }
                    }}
                    onRegenerate={() => {
                      if (!wizard.formato) return
                      void generateCitasForFormato(wizard.formato, wizard.refs)
                    }}
                    onChangeTipo={(id, tipo) =>
                      setWizard((w) => ({
                        ...w,
                        refs: w.refs.map((r) =>
                          r.id === id ? { ...r, tipo } : r,
                        ),
                      }))
                    }
                    onChangeCita={(id, value) => {
                      if (!wizard.formato) return
                      setWizard((w) => ({
                        ...w,
                        citaEdits: {
                          ...w.citaEdits,
                          [wizard.formato!]: {
                            ...w.citaEdits[wizard.formato!],
                            [id]: value,
                          },
                        },
                      }))
                    }}
                  />
                </Wizard.Stepper.Panel>
              )}

              {idx === 3 && (
                <Wizard.Stepper.Panel>
                  <ResumenStep
                    metodo={wizard.metodo}
                    formato={wizard.formato}
                    refs={wizard.refs}
                    citations={
                      wizard.formato ? wizard.citaEdits[wizard.formato] : {}
                    }
                  />
                </Wizard.Stepper.Panel>
              )}
            </div>
          </WizardLayout>
        )
      }}
    </Wizard.Stepper.Provider>
  )
}

function MetodoStep({
  metodo,
  onChange,
}: {
  metodo: MetodoBibliografia
  onChange: (metodo: MetodoBibliografia) => void
}) {
  const isSelected = (m: Exclude<MetodoBibliografia, null>) => metodo === m

  return (
    <div className="grid gap-4">
      <Card
        className={cn(
          'cursor-pointer transition-all',
          isSelected('MANUAL') && 'ring-ring ring-2',
        )}
        role="button"
        tabIndex={0}
        onClick={() => onChange('MANUAL')}
      >
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="text-primary h-5 w-5" /> Manual
          </CardTitle>
          <CardDescription>
            Captura referencias y edita la cita.
          </CardDescription>
        </CardHeader>
      </Card>

      <Card
        className={cn(
          'cursor-pointer transition-all',
          isSelected('IA') && 'ring-ring ring-2',
        )}
        role="button"
        tabIndex={0}
        onClick={() => onChange('IA')}
      >
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="text-primary h-5 w-5" /> Con IA
          </CardTitle>
          <CardDescription>
            Busca sugerencias y selecciona las mejores.
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  )
}

function SugerenciasStep({
  q,
  cantidad,
  isLoading,
  errorMessage,
  sugerencias,
  onChange,
  onGenerate,
}: {
  q: string
  cantidad: number
  isLoading: boolean
  errorMessage: string | null
  sugerencias: Array<{
    id: string
    selected: boolean
    volume: GoogleBooksVolume
  }>
  onChange: (
    patch: Partial<{
      q: string
      cantidadDeSugerencias: number
      sugerencias: any
    }>,
  ) => void
  onGenerate: () => void
}) {
  const selectedCount = sugerencias.filter((s) => s.selected).length

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Buscar sugerencias</CardTitle>
          <CardDescription>
            Conserva las seleccionadas y agrega nuevas.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-2">
            <Label>Búsqueda</Label>
            <Input
              value={q}
              onChange={(e) => onChange({ q: e.target.value })}
              placeholder="Ej: ingeniería de software, bases de datos..."
            />
          </div>

          <div className="mt-3 flex w-full flex-col items-end justify-between gap-3 sm:flex-row">
            <div className="w-full sm:w-44">
              <Label className="mb-2 block">Cantidad de sugerencias</Label>
              <Input
                type="number"
                min={1}
                max={40}
                value={cantidad}
                onChange={(e) =>
                  onChange({
                    cantidadDeSugerencias:
                      Number.parseInt(e.target.value || '0', 10) || 0,
                  })
                }
              />
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={onGenerate}
              disabled={isLoading || q.trim().length === 0}
              className="gap-2"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-3.5 w-3.5" />
              )}
              {sugerencias.length > 0
                ? 'Generar más sugerencias'
                : 'Generar sugerencias'}
            </Button>
          </div>

          <div className="flex items-center justify-between gap-3">
            <div className="text-muted-foreground text-sm">
              {selectedCount} seleccionadas
            </div>
          </div>

          {errorMessage ? (
            <div className="text-destructive text-sm">{errorMessage}</div>
          ) : null}
        </CardContent>
      </Card>

      <div className="space-y-2">
        <div className="text-sm font-medium">Sugerencias</div>
        <div className="max-h-96 space-y-1 overflow-y-auto pr-1">
          {sugerencias.map((s) => {
            const info = s.volume.volumeInfo ?? {}
            const title = (info.title ?? 'Sin título').trim()
            const authors = (info.authors ?? []).join(', ')
            const year = tryParseYear(info.publishedDate)
            const selected = s.selected

            return (
              <Label
                key={s.id}
                aria-checked={selected}
                className={cn(
                  'border-border hover:border-primary/30 hover:bg-accent/50 m-0.5 flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors has-aria-checked:border-blue-600 has-aria-checked:bg-blue-50 dark:has-aria-checked:border-blue-900 dark:has-aria-checked:bg-blue-950',
                )}
              >
                <Checkbox
                  checked={selected}
                  onCheckedChange={(checked) =>
                    onChange({
                      sugerencias: sugerencias.map((x) =>
                        x.id === s.id ? { ...x, selected: !!checked } : x,
                      ),
                    })
                  }
                />
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium">{title}</div>
                  <div className="text-muted-foreground text-xs">
                    {authors || '—'}
                    {year ? ` • ${year}` : ''}
                  </div>
                </div>
              </Label>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function DatosBasicosManualStep({
  draft,
  refs,
  onChangeDraft,
  onAddRef,
  onRemoveRef,
}: {
  draft: WizardState['manual']['draft']
  refs: Array<BibliografiaRef>
  onChangeDraft: (draft: WizardState['manual']['draft']) => void
  onAddRef: (ref: BibliografiaRef) => void
  onRemoveRef: (id: string) => void
}) {
  const canAdd = draft.title.trim().length > 0

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Agregar referencia</CardTitle>
          <CardDescription>
            Captura los datos y agrégala a la lista.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3">
          <div className="grid gap-2">
            <Label>Título</Label>
            <Input
              value={draft.title}
              onChange={(e) =>
                onChangeDraft({ ...draft, title: e.target.value })
              }
            />
          </div>

          <div className="grid gap-2">
            <Label>Autores (uno por línea)</Label>
            <Textarea
              value={draft.authorsText}
              onChange={(e) =>
                onChangeDraft({ ...draft, authorsText: e.target.value })
              }
              className="min-h-22.5"
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label>Editorial</Label>
              <Input
                value={draft.publisher}
                onChange={(e) =>
                  onChangeDraft({ ...draft, publisher: e.target.value })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label>Año</Label>
              <Input
                value={draft.yearText}
                onChange={(e) =>
                  onChangeDraft({ ...draft, yearText: e.target.value })
                }
                placeholder="2024"
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label>ISBN</Label>
            <Input
              value={draft.isbn}
              onChange={(e) =>
                onChangeDraft({ ...draft, isbn: e.target.value })
              }
            />
          </div>

          <Button
            type="button"
            disabled={!canAdd}
            onClick={() => {
              const year = Number.parseInt(draft.yearText.trim(), 10)
              const ref: BibliografiaRef = {
                id: `manual-${crypto.randomUUID()}`,
                source: 'MANUAL',
                title: draft.title.trim(),
                authors: draft.authorsText
                  .split(/\r?\n/)
                  .map((x) => x.trim())
                  .filter(Boolean),
                publisher: draft.publisher.trim() || undefined,
                year: Number.isFinite(year) ? year : undefined,
                isbn: draft.isbn.trim() || undefined,
                tipo: 'BASICA',
              }
              onAddRef(ref)
              onChangeDraft({
                title: '',
                authorsText: '',
                publisher: '',
                yearText: '',
                isbn: '',
              })
            }}
          >
            <Plus className="mr-2 h-4 w-4" /> Agregar a la lista
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Referencias</CardTitle>
          <CardDescription>{refs.length} en total</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {refs.map((r) => (
            <div
              key={r.id}
              className="flex items-start justify-between gap-3 rounded-lg border bg-white p-3"
            >
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium">{r.title}</div>
                <div className="text-muted-foreground text-xs">
                  {r.authors.join(', ') || '—'}
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onRemoveRef(r.id)}
              >
                Quitar
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}

function FormatoYCitasStep({
  refs,
  formato,
  citations,
  generatingIds,
  onChangeFormato,
  onRegenerate,
  onChangeTipo,
  onChangeCita,
}: {
  refs: Array<BibliografiaRef>
  formato: FormatoCita | null
  citations: Record<string, string>
  generatingIds: Set<string>
  onChangeFormato: (formato: FormatoCita | null) => void
  onRegenerate: () => void
  onChangeTipo: (id: string, tipo: 'BASICA' | 'COMPLEMENTARIA') => void
  onChangeCita: (id: string, value: string) => void
}) {
  const isGeneratingAny = generatingIds.size > 0

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Formato</CardTitle>
          <CardDescription>
            Selecciona un formato para generar las citas.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-end justify-between gap-3">
          <div className="min-w-55 flex-1">
            <Label>Formato</Label>
            <Select
              value={formato ?? ''}
              onValueChange={(v) => onChangeFormato(v as any)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar…" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="apa">APA</SelectItem>
                <SelectItem value="ieee">IEEE</SelectItem>
                <SelectItem value="chicago">Chicago</SelectItem>
                <SelectItem value="vancouver">Vancouver</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button
            type="button"
            variant="outline"
            className="gap-2"
            onClick={onRegenerate}
            disabled={!formato || refs.length === 0 || isGeneratingAny}
          >
            <RefreshCw className="h-4 w-4" /> Regenerar
          </Button>
        </CardContent>
      </Card>

      <div className="space-y-3">
        {refs.map((r) => {
          const infoText = [
            r.title,
            r.authors.join(', '),
            r.publisher,
            r.year ? String(r.year) : undefined,
          ]
            .filter(Boolean)
            .join(' • ')

          const isGenerating = generatingIds.has(r.id)
          return (
            <Card key={r.id}>
              <CardHeader>
                <CardTitle className="text-base">{r.title}</CardTitle>
                <CardDescription className="wrap-break-word">
                  {infoText}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Cita</Label>
                    <Input
                      value={citations[r.id] ?? ''}
                      onChange={(e) => onChangeCita(r.id, e.target.value)}
                      disabled={isGenerating || isGeneratingAny}
                      placeholder="Cita generada…"
                    />
                    {isGenerating ? (
                      <div className="text-muted-foreground flex items-center gap-2 text-xs">
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />{' '}
                        Generando cita…
                      </div>
                    ) : null}
                  </div>

                  <div className="space-y-2">
                    <Label>Tipo</Label>
                    <Select
                      value={r.tipo}
                      onValueChange={(v) => onChangeTipo(r.id, v as any)}
                      disabled={isGenerating || isGeneratingAny}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="BASICA">Básica</SelectItem>
                        <SelectItem value="COMPLEMENTARIA">
                          Complementaria
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

function ResumenStep({
  metodo,
  formato,
  refs,
  citations,
}: {
  metodo: MetodoBibliografia
  formato: FormatoCita | null
  refs: Array<BibliografiaRef>
  citations: Record<string, string>
}) {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Resumen</CardTitle>
          <CardDescription>Revisa antes de agregar.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div>
            <span className="font-medium">Método:</span> {metodo ?? '—'}
          </div>
          <div>
            <span className="font-medium">Formato:</span> {formato ?? '—'}
          </div>
          <div>
            <span className="font-medium">Referencias:</span> {refs.length}
          </div>
        </CardContent>
      </Card>

      <div className="space-y-2">
        {refs.map((r) => (
          <Card key={r.id}>
            <CardHeader>
              <CardTitle className="text-base">{r.title}</CardTitle>
              <CardDescription>
                {r.tipo === 'BASICA' ? 'Básica' : 'Complementaria'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-sm">{citations[r.id] ?? ''}</div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
