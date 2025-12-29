import { createFileRoute, useNavigate } from '@tanstack/react-router'
import * as Icons from 'lucide-react'
import { useMemo, useState } from 'react'

import { defineStepper } from '@/components/stepper'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export const Route = createFileRoute('/planes/_lista/nuevo')({
  component: NuevoPlanModal,
})

// Tipos del wizard (mock frontend)
type TipoCiclo = 'SEMESTRE' | 'CUATRIMESTRE' | 'TRIMESTRE'
type ModoCreacion = 'MANUAL' | 'IA' | 'CLONADO'
type SubModoClonado = 'INTERNO' | 'TRADICIONAL'

type PlanPreview = {
  nombrePlan: string
  nivel: string
  tipoCiclo: TipoCiclo
  numCiclos: number
  numMateriasAprox?: number
  secciones?: Array<{ id: string; titulo: string; resumen: string }>
}

type NewPlanWizardState = {
  step: 1 | 2 | 3 | 4
  modoCreacion: ModoCreacion | null
  subModoClonado?: SubModoClonado
  datosBasicos: {
    nombrePlan: string
    carreraId: string
    facultadId: string
    nivel: string
    tipoCiclo: TipoCiclo
    numCiclos: number
  }
  clonInterno?: { planOrigenId: string | null }
  clonTradicional?: {
    archivoWordPlanId: string | null
    archivoMapaExcelId: string | null
    archivoMateriasExcelId: string | null
  }
  iaConfig?: {
    descripcionEnfoque: string
    poblacionObjetivo: string
    notasAdicionales: string
    archivosReferencia: Array<string>
  }
  resumen: { previewPlan?: PlanPreview }
  isLoading: boolean
  errorMessage: string | null
}

// Mock de permisos/rol
const auth_get_current_user_role = () => 'JEFE_CARRERA' as const

// Mock catálogos
const FACULTADES = [
  { id: 'ing', nombre: 'Facultad de Ingeniería' },
  { id: 'med', nombre: 'Facultad de Medicina' },
  { id: 'neg', nombre: 'Facultad de Negocios' },
]

const CARRERAS = [
  { id: 'sis', nombre: 'Ing. en Sistemas', facultadId: 'ing' },
  { id: 'ind', nombre: 'Ing. Industrial', facultadId: 'ing' },
  { id: 'medico', nombre: 'Médico Cirujano', facultadId: 'med' },
  { id: 'act', nombre: 'Actuaría', facultadId: 'neg' },
]

const NIVELES = ['Licenciatura', 'Especialidad', 'Maestría', 'Doctorado']
const TIPOS_CICLO: Array<{ value: TipoCiclo; label: string }> = [
  { value: 'SEMESTRE', label: 'Semestre' },
  { value: 'CUATRIMESTRE', label: 'Cuatrimestre' },
  { value: 'TRIMESTRE', label: 'Trimestre' },
]

// Mock planes existentes para clonado interno
const PLANES_EXISTENTES = [
  {
    id: 'plan-2021-sis',
    nombre: 'ISC 2021',
    estado: 'Aprobado',
    anio: 2021,
    facultadId: 'ing',
    carreraId: 'sis',
  },
  {
    id: 'plan-2020-ind',
    nombre: 'I. Industrial 2020',
    estado: 'Aprobado',
    anio: 2020,
    facultadId: 'ing',
    carreraId: 'ind',
  },
  {
    id: 'plan-2019-med',
    nombre: 'Medicina 2019',
    estado: 'Vigente',
    anio: 2019,
    facultadId: 'med',
    carreraId: 'medico',
  },
]

// Definición de pasos con wrapper
const Wizard = defineStepper(
  {
    id: 'modo',
    title: 'Método',
    description: 'Selecciona cómo crearás el plan',
  },
  {
    id: 'basicos',
    title: 'Datos básicos',
    description: 'Nombre, carrera, nivel y ciclos',
  },
  { id: 'detalles', title: 'Detalles', description: 'IA, clonado o archivos' },
  { id: 'resumen', title: 'Resumen', description: 'Confirma y crea el plan' },
)

function NuevoPlanModal() {
  const navigate = useNavigate()

  const [wizard, setWizard] = useState<NewPlanWizardState>({
    step: 1,
    modoCreacion: null,
    datosBasicos: {
      nombrePlan: '',
      carreraId: '',
      facultadId: '',
      nivel: '',
      tipoCiclo: 'SEMESTRE',
      numCiclos: 8,
    },
    clonInterno: { planOrigenId: null },
    clonTradicional: {
      archivoWordPlanId: null,
      archivoMapaExcelId: null,
      archivoMateriasExcelId: null,
    },
    iaConfig: {
      descripcionEnfoque: '',
      poblacionObjetivo: '',
      notasAdicionales: '',
      archivosReferencia: [],
    },
    resumen: {},
    isLoading: false,
    errorMessage: null,
  })

  const role = auth_get_current_user_role()

  const handleClose = () => {
    navigate({ to: '/planes', resetScroll: false })
  }

  // Derivados
  const carrerasFiltradas = useMemo(() => {
    const fac = wizard.datosBasicos.facultadId
    return fac ? CARRERAS.filter((c) => c.facultadId === fac) : CARRERAS
  }, [wizard.datosBasicos.facultadId])

  const canContinueDesdeModo =
    wizard.modoCreacion === 'MANUAL' ||
    wizard.modoCreacion === 'IA' ||
    (wizard.modoCreacion === 'CLONADO' && !!wizard.subModoClonado)

  const canContinueDesdeBasicos =
    !!wizard.datosBasicos.nombrePlan &&
    !!wizard.datosBasicos.carreraId &&
    !!wizard.datosBasicos.facultadId &&
    !!wizard.datosBasicos.nivel &&
    wizard.datosBasicos.numCiclos > 0

  const canContinueDesdeDetalles = (() => {
    if (wizard.modoCreacion === 'MANUAL') return true
    if (wizard.modoCreacion === 'IA') {
      return !!wizard.iaConfig?.descripcionEnfoque
    }
    if (wizard.modoCreacion === 'CLONADO') {
      if (wizard.subModoClonado === 'INTERNO') {
        return !!wizard.clonInterno?.planOrigenId
      }
      if (wizard.subModoClonado === 'TRADICIONAL') {
        const t = wizard.clonTradicional
        if (!t) return false
        // Reglas mínimas: Word + al menos un Excel
        const tieneWord = !!t.archivoWordPlanId
        const tieneAlMenosUnExcel =
          !!t.archivoMapaExcelId || !!t.archivoMateriasExcelId
        return tieneWord && tieneAlMenosUnExcel
      }
    }
    return false
  })()

  const generarPreviewIA = async () => {
    setWizard((w) => ({ ...w, isLoading: true, errorMessage: null }))
    await new Promise((r) => setTimeout(r, 800))
    const preview: PlanPreview = {
      nombrePlan: wizard.datosBasicos.nombrePlan || 'Plan sin nombre',
      nivel: wizard.datosBasicos.nivel || 'Licenciatura',
      tipoCiclo: wizard.datosBasicos.tipoCiclo,
      numCiclos: wizard.datosBasicos.numCiclos,
      numMateriasAprox: wizard.datosBasicos.numCiclos * 6,
      secciones: [
        { id: 'obj', titulo: 'Objetivos', resumen: 'Borrador de objetivos…' },
        { id: 'perfil', titulo: 'Perfil de egreso', resumen: 'Borrador…' },
      ],
    }
    setWizard((w) => ({
      ...w,
      isLoading: false,
      resumen: { previewPlan: preview },
    }))
  }

  const crearPlan = async () => {
    setWizard((w) => ({ ...w, isLoading: true, errorMessage: null }))
    await new Promise((r) => setTimeout(r, 900))
    // Elegimos un id ficticio distinto según modo
    const nuevoId = (() => {
      if (wizard.modoCreacion === 'MANUAL') return 'plan_new_manual_001'
      if (wizard.modoCreacion === 'IA') return 'plan_new_ai_001'
      if (wizard.subModoClonado === 'INTERNO') return 'plan_new_clone_001'
      return 'plan_new_import_001'
    })()
    navigate({ to: `/planes/${nuevoId}` })
  }

  return (
    <Dialog open={true} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="p-0 sm:max-w-[840px]">
        <DialogHeader className="px-6 pt-6">
          <DialogTitle>Nuevo plan de estudios</DialogTitle>
        </DialogHeader>

        {role !== 'JEFE_CARRERA' ? (
          <div className="px-6 pb-6">
            <Card className="border-destructive/40">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icons.ShieldAlert className="text-destructive h-5 w-5" />
                  Sin permisos
                </CardTitle>
                <CardDescription>
                  No tienes permisos para crear planes de estudio.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex justify-end">
                <Button variant="secondary" onClick={handleClose}>
                  Volver
                </Button>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="px-6 pb-6">
            <Wizard.Stepper.Provider
              initialStep={Wizard.utils.getFirst().id}
              className="flex flex-col gap-6"
            >
              {({ methods }) => (
                <>
                  {/* Header + navegación */}
                  <Wizard.Stepper.Navigation className="border-border/60 rounded-xl border p-4">
                    <Wizard.Stepper.Step of={Wizard.steps[0].id}>
                      <Wizard.Stepper.Title>1. Método</Wizard.Stepper.Title>
                      <Wizard.Stepper.Description>
                        Selecciona cómo crearás el plan
                      </Wizard.Stepper.Description>
                    </Wizard.Stepper.Step>
                    <Wizard.Stepper.Step of={Wizard.steps[1].id}>
                      <Wizard.Stepper.Title>
                        2. Datos básicos
                      </Wizard.Stepper.Title>
                      <Wizard.Stepper.Description>
                        Nombre, carrera, nivel y ciclos
                      </Wizard.Stepper.Description>
                    </Wizard.Stepper.Step>
                    <Wizard.Stepper.Step of={Wizard.steps[2].id}>
                      <Wizard.Stepper.Title>3. Detalles</Wizard.Stepper.Title>
                      <Wizard.Stepper.Description>
                        IA, clonado o archivos
                      </Wizard.Stepper.Description>
                    </Wizard.Stepper.Step>
                    <Wizard.Stepper.Step of={Wizard.steps[3].id}>
                      <Wizard.Stepper.Title>4. Resumen</Wizard.Stepper.Title>
                      <Wizard.Stepper.Description>
                        Confirma y crea el plan
                      </Wizard.Stepper.Description>
                    </Wizard.Stepper.Step>
                  </Wizard.Stepper.Navigation>

                  {/* Info de paso actual */}
                  <div className="flex items-center justify-end px-1">
                    <span className="text-muted-foreground text-sm">
                      Paso {Wizard.utils.getIndex(methods.current.id) + 1} de{' '}
                      {Wizard.steps.length}
                    </span>
                  </div>

                  {/* Panel activo (solo uno visible) */}
                  <div className="grid gap-6 md:grid-cols-2">
                    <div className="md:col-span-2">
                      {Wizard.utils.getIndex(methods.current.id) === 0 && (
                        <Wizard.Stepper.Panel>
                          <PasoModo wizard={wizard} onChange={setWizard} />
                        </Wizard.Stepper.Panel>
                      )}
                      {Wizard.utils.getIndex(methods.current.id) === 1 && (
                        <Wizard.Stepper.Panel>
                          <PasoBasicos
                            wizard={wizard}
                            onChange={setWizard}
                            carrerasFiltradas={carrerasFiltradas}
                          />
                        </Wizard.Stepper.Panel>
                      )}
                      {Wizard.utils.getIndex(methods.current.id) === 2 && (
                        <Wizard.Stepper.Panel>
                          <PasoDetalles
                            wizard={wizard}
                            onChange={setWizard}
                            onGenerarIA={generarPreviewIA}
                            isLoading={wizard.isLoading}
                          />
                        </Wizard.Stepper.Panel>
                      )}
                      {Wizard.utils.getIndex(methods.current.id) === 3 && (
                        <Wizard.Stepper.Panel>
                          <PasoResumen wizard={wizard} />
                        </Wizard.Stepper.Panel>
                      )}
                    </div>
                  </div>

                  {/* Controles */}
                  <Wizard.Stepper.Controls>
                    {wizard.errorMessage && (
                      <span className="text-destructive mr-auto text-sm">
                        {wizard.errorMessage}
                      </span>
                    )}
                    <Button
                      variant="secondary"
                      onClick={() => methods.prev()}
                      disabled={
                        Wizard.utils.getIndex(methods.current.id) === 0 ||
                        wizard.isLoading
                      }
                    >
                      Anterior
                    </Button>
                    {Wizard.utils.getIndex(methods.current.id) <
                    Wizard.steps.length - 1 ? (
                      <Button
                        onClick={() => methods.next()}
                        disabled={
                          wizard.isLoading ||
                          (Wizard.utils.getIndex(methods.current.id) === 0 &&
                            !canContinueDesdeModo) ||
                          (Wizard.utils.getIndex(methods.current.id) === 1 &&
                            !canContinueDesdeBasicos) ||
                          (Wizard.utils.getIndex(methods.current.id) === 2 &&
                            !canContinueDesdeDetalles)
                        }
                      >
                        Siguiente
                      </Button>
                    ) : (
                      <Button onClick={crearPlan} disabled={wizard.isLoading}>
                        Crear plan
                      </Button>
                    )}
                  </Wizard.Stepper.Controls>
                </>
              )}
            </Wizard.Stepper.Provider>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

// Paso 1: selección de modo
function PasoModo({
  wizard,
  onChange,
}: {
  wizard: NewPlanWizardState
  onChange: React.Dispatch<React.SetStateAction<NewPlanWizardState>>
}) {
  const isSelected = (m: ModoCreacion) => wizard.modoCreacion === m
  const isSubSelected = (s: SubModoClonado) => wizard.subModoClonado === s
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <Card
        className={isSelected('MANUAL') ? 'ring-ring ring-2' : ''}
        onClick={() =>
          onChange((w) => ({
            ...w,
            modoCreacion: 'MANUAL',
            subModoClonado: undefined,
          }))
        }
        role="button"
        tabIndex={0}
      >
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Icons.Pencil className="text-primary h-5 w-5" /> Manual
          </CardTitle>
          <CardDescription>Plan vacío con estructura mínima.</CardDescription>
        </CardHeader>
      </Card>

      <Card
        className={isSelected('IA') ? 'ring-ring ring-2' : ''}
        onClick={() =>
          onChange((w) => ({
            ...w,
            modoCreacion: 'IA',
            subModoClonado: undefined,
          }))
        }
        role="button"
        tabIndex={0}
      >
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Icons.Sparkles className="text-primary h-5 w-5" /> Con IA
          </CardTitle>
          <CardDescription>
            Borrador completo a partir de datos base.
          </CardDescription>
        </CardHeader>
      </Card>

      <Card
        className={isSelected('CLONADO') ? 'ring-ring ring-2' : ''}
        onClick={() => onChange((w) => ({ ...w, modoCreacion: 'CLONADO' }))}
        role="button"
        tabIndex={0}
      >
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Icons.Copy className="text-primary h-5 w-5" /> Clonado
          </CardTitle>
          <CardDescription>Desde un plan existente o archivos.</CardDescription>
        </CardHeader>
        {wizard.modoCreacion === 'CLONADO' && (
          <CardContent className="flex gap-3">
            <Button
              variant={isSubSelected('INTERNO') ? 'default' : 'secondary'}
              onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                e.stopPropagation()
                onChange((w) => ({ ...w, subModoClonado: 'INTERNO' }))
              }}
            >
              Del sistema
            </Button>
            <Button
              variant={isSubSelected('TRADICIONAL') ? 'default' : 'secondary'}
              onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                e.stopPropagation()
                onChange((w) => ({ ...w, subModoClonado: 'TRADICIONAL' }))
              }}
            >
              Desde archivos
            </Button>
          </CardContent>
        )}
      </Card>
    </div>
  )
}

// Paso 2: datos básicos
function PasoBasicos({
  wizard,
  onChange,
  carrerasFiltradas,
}: {
  wizard: NewPlanWizardState
  onChange: React.Dispatch<React.SetStateAction<NewPlanWizardState>>
  carrerasFiltradas: typeof CARRERAS
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <Label htmlFor="nombrePlan">Nombre del plan</Label>
        <Input
          id="nombrePlan"
          placeholder="Ej. Ingeniería en Sistemas 2026"
          value={wizard.datosBasicos.nombrePlan}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            onChange((w) => ({
              ...w,
              datosBasicos: { ...w.datosBasicos, nombrePlan: e.target.value },
            }))
          }
        />
      </div>

      <div>
        <Label htmlFor="facultad">Facultad</Label>
        <select
          id="facultad"
          className="bg-background text-foreground ring-offset-background focus-visible:ring-ring h-10 w-full rounded-md border px-3 text-sm shadow-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
          value={wizard.datosBasicos.facultadId}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
            onChange((w) => ({
              ...w,
              datosBasicos: {
                ...w.datosBasicos,
                facultadId: e.target.value,
                carreraId: '',
              },
            }))
          }
        >
          <option value="">Selecciona facultad…</option>
          {FACULTADES.map((f) => (
            <option key={f.id} value={f.id}>
              {f.nombre}
            </option>
          ))}
        </select>
      </div>

      <div>
        <Label htmlFor="carrera">Carrera</Label>
        <select
          id="carrera"
          className="bg-background text-foreground ring-offset-background focus-visible:ring-ring h-10 w-full rounded-md border px-3 text-sm shadow-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
          value={wizard.datosBasicos.carreraId}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
            onChange((w) => ({
              ...w,
              datosBasicos: { ...w.datosBasicos, carreraId: e.target.value },
            }))
          }
        >
          <option value="">Selecciona carrera…</option>
          {carrerasFiltradas.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nombre}
            </option>
          ))}
        </select>
      </div>

      <div>
        <Label htmlFor="nivel">Nivel</Label>
        <select
          id="nivel"
          className="bg-background text-foreground ring-offset-background focus-visible:ring-ring h-10 w-full rounded-md border px-3 text-sm shadow-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
          value={wizard.datosBasicos.nivel}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
            onChange((w) => ({
              ...w,
              datosBasicos: { ...w.datosBasicos, nivel: e.target.value },
            }))
          }
        >
          <option value="">Selecciona nivel…</option>
          {NIVELES.map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
      </div>

      <div>
        <Label htmlFor="tipoCiclo">Tipo de ciclo</Label>
        <select
          id="tipoCiclo"
          className="bg-background text-foreground ring-offset-background focus-visible:ring-ring h-10 w-full rounded-md border px-3 text-sm shadow-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
          value={wizard.datosBasicos.tipoCiclo}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
            onChange((w) => ({
              ...w,
              datosBasicos: {
                ...w.datosBasicos,
                tipoCiclo: e.target.value as TipoCiclo,
              },
            }))
          }
        >
          {TIPOS_CICLO.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <Label htmlFor="numCiclos">Número de ciclos</Label>
        <Input
          id="numCiclos"
          type="number"
          min={1}
          value={wizard.datosBasicos.numCiclos}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            onChange((w) => ({
              ...w,
              datosBasicos: {
                ...w.datosBasicos,
                numCiclos: Number(e.target.value || 0),
              },
            }))
          }
        />
      </div>
    </div>
  )
}

// Paso 3: detalles por modo
function PasoDetalles({
  wizard,
  onChange,
  onGenerarIA,
  isLoading,
}: {
  wizard: NewPlanWizardState
  onChange: React.Dispatch<React.SetStateAction<NewPlanWizardState>>
  onGenerarIA: () => void
  isLoading: boolean
}) {
  if (wizard.modoCreacion === 'MANUAL') {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Creación manual</CardTitle>
          <CardDescription>
            Se creará un plan en blanco con estructura mínima.
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  if (wizard.modoCreacion === 'IA') {
    return (
      <div className="grid gap-4">
        <div>
          <Label htmlFor="desc">Descripción del enfoque</Label>
          <textarea
            id="desc"
            className="bg-background text-foreground ring-offset-background focus-visible:ring-ring min-h-24 w-full rounded-md border px-3 py-2 text-sm shadow-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
            placeholder="Describe el enfoque del programa…"
            value={wizard.iaConfig?.descripcionEnfoque || ''}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
              onChange((w) => ({
                ...w,
                iaConfig: {
                  ...(w.iaConfig || ({} as any)),
                  descripcionEnfoque: e.target.value,
                },
              }))
            }
          />
        </div>
        <div>
          <Label htmlFor="poblacion">Población objetivo</Label>
          <Input
            id="poblacion"
            placeholder="Ej. Egresados de bachillerato con perfil STEM"
            value={wizard.iaConfig?.poblacionObjetivo || ''}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              onChange((w) => ({
                ...w,
                iaConfig: {
                  ...(w.iaConfig || ({} as any)),
                  poblacionObjetivo: e.target.value,
                },
              }))
            }
          />
        </div>
        <div>
          <Label htmlFor="notas">Notas adicionales</Label>
          <textarea
            id="notas"
            className="bg-background text-foreground ring-offset-background focus-visible:ring-ring min-h-24 w-full rounded-md border px-3 py-2 text-sm shadow-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
            placeholder="Lineamientos institucionales, restricciones, etc."
            value={wizard.iaConfig?.notasAdicionales || ''}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
              onChange((w) => ({
                ...w,
                iaConfig: {
                  ...(w.iaConfig || ({} as any)),
                  notasAdicionales: e.target.value,
                },
              }))
            }
          />
        </div>
        <div className="flex items-center justify-between">
          <div className="text-muted-foreground text-sm">
            Opcional: se pueden adjuntar recursos IA más adelante.
          </div>
          <Button onClick={onGenerarIA} disabled={isLoading}>
            {isLoading ? 'Generando…' : 'Generar borrador con IA'}
          </Button>
        </div>

        {wizard.resumen.previewPlan && (
          <Card>
            <CardHeader>
              <CardTitle>Preview IA</CardTitle>
              <CardDescription>
                Materias aprox.: {wizard.resumen.previewPlan.numMateriasAprox}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-muted-foreground list-disc pl-5 text-sm">
                {wizard.resumen.previewPlan.secciones?.map((s) => (
                  <li key={s.id}>
                    <span className="text-foreground font-medium">
                      {s.titulo}:
                    </span>{' '}
                    {s.resumen}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
      </div>
    )
  }

  if (
    wizard.modoCreacion === 'CLONADO' &&
    wizard.subModoClonado === 'INTERNO'
  ) {
    return (
      <div className="grid gap-4">
        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <Label htmlFor="clonFacultad">Facultad</Label>
            <select
              id="clonFacultad"
              className="bg-background text-foreground ring-offset-background focus-visible:ring-ring h-10 w-full rounded-md border px-3 text-sm shadow-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
              value={wizard.datosBasicos.facultadId}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                onChange((w) => ({
                  ...w,
                  datosBasicos: {
                    ...w.datosBasicos,
                    facultadId: e.target.value,
                  },
                }))
              }
            >
              <option value="">Todas</option>
              {FACULTADES.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.nombre}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="clonCarrera">Carrera</Label>
            <select
              id="clonCarrera"
              className="bg-background text-foreground ring-offset-background focus-visible:ring-ring h-10 w-full rounded-md border px-3 text-sm shadow-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
              value={wizard.datosBasicos.carreraId}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                onChange((w) => ({
                  ...w,
                  datosBasicos: {
                    ...w.datosBasicos,
                    carreraId: e.target.value,
                  },
                }))
              }
            >
              <option value="">Todas</option>
              {CARRERAS.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="buscarPlan">Buscar</Label>
            <Input
              id="buscarPlan"
              placeholder="Nombre del plan…"
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                const term = e.target.value.toLowerCase()
                // Podrías guardar este término en estado local si quisieras.
                void term
              }}
            />
          </div>
        </div>

        <div className="grid gap-3">
          {PLANES_EXISTENTES.filter(
            (p) =>
              (!wizard.datosBasicos.facultadId ||
                p.facultadId === wizard.datosBasicos.facultadId) &&
              (!wizard.datosBasicos.carreraId ||
                p.carreraId === wizard.datosBasicos.carreraId),
          ).map((p) => (
            <Card
              key={p.id}
              className={
                p.id === wizard.clonInterno?.planOrigenId
                  ? 'ring-ring ring-2'
                  : ''
              }
              onClick={() =>
                onChange((w) => ({ ...w, clonInterno: { planOrigenId: p.id } }))
              }
              role="button"
              tabIndex={0}
            >
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{p.nombre}</span>
                  <span className="text-muted-foreground text-sm">
                    {p.estado} · {p.anio}
                  </span>
                </CardTitle>
                <CardDescription>ID: {p.id}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (
    wizard.modoCreacion === 'CLONADO' &&
    wizard.subModoClonado === 'TRADICIONAL'
  ) {
    return (
      <div className="grid gap-4">
        <div>
          <Label htmlFor="word">Word del plan (obligatorio)</Label>
          <input
            id="word"
            type="file"
            accept=".doc,.docx"
            className="bg-background text-foreground ring-offset-background focus-visible:ring-ring file:bg-secondary block w-full rounded-md border px-3 py-2 text-sm shadow-sm file:mr-4 file:rounded-md file:border-0 file:px-3 file:py-1.5 file:text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              onChange((w) => ({
                ...w,
                clonTradicional: {
                  ...(w.clonTradicional || ({} as any)),
                  archivoWordPlanId: e.target.files?.[0]
                    ? `file_${e.target.files[0].name}`
                    : null,
                },
              }))
            }
          />
        </div>
        <div>
          <Label htmlFor="mapa">Excel del mapa curricular</Label>
          <input
            id="mapa"
            type="file"
            accept=".xls,.xlsx"
            className="bg-background text-foreground ring-offset-background focus-visible:ring-ring file:bg-secondary block w-full rounded-md border px-3 py-2 text-sm shadow-sm file:mr-4 file:rounded-md file:border-0 file:px-3 file:py-1.5 file:text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              onChange((w) => ({
                ...w,
                clonTradicional: {
                  ...(w.clonTradicional || ({} as any)),
                  archivoMapaExcelId: e.target.files?.[0]
                    ? `file_${e.target.files[0].name}`
                    : null,
                },
              }))
            }
          />
        </div>
        <div>
          <Label htmlFor="materias">Excel/listado de materias</Label>
          <input
            id="materias"
            type="file"
            accept=".xls,.xlsx,.csv"
            className="bg-background text-foreground ring-offset-background focus-visible:ring-ring file:bg-secondary block w-full rounded-md border px-3 py-2 text-sm shadow-sm file:mr-4 file:rounded-md file:border-0 file:px-3 file:py-1.5 file:text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              onChange((w) => ({
                ...w,
                clonTradicional: {
                  ...(w.clonTradicional || ({} as any)),
                  archivoMateriasExcelId: e.target.files?.[0]
                    ? `file_${e.target.files[0].name}`
                    : null,
                },
              }))
            }
          />
        </div>
        <div className="text-muted-foreground text-sm">
          Sube al menos Word y uno de los Excel para continuar.
        </div>
      </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Selecciona un modo</CardTitle>
        <CardDescription>
          Elige una opción en el paso anterior para continuar.
        </CardDescription>
      </CardHeader>
    </Card>
  )
}

// Paso 4: resumen
function PasoResumen({ wizard }: { wizard: NewPlanWizardState }) {
  const modo = wizard.modoCreacion
  const sub = wizard.subModoClonado
  return (
    <Card>
      <CardHeader>
        <CardTitle>Resumen</CardTitle>
        <CardDescription>
          Verifica la información antes de crear.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-2 text-sm">
          <div>
            <span className="text-muted-foreground">Nombre: </span>
            <span className="font-medium">
              {wizard.datosBasicos.nombrePlan || '—'}
            </span>
          </div>
          <div>
            <span className="text-muted-foreground">Facultad/Carrera: </span>
            <span className="font-medium">
              {wizard.datosBasicos.facultadId || '—'} /{' '}
              {wizard.datosBasicos.carreraId || '—'}
            </span>
          </div>
          <div>
            <span className="text-muted-foreground">Nivel: </span>
            <span className="font-medium">
              {wizard.datosBasicos.nivel || '—'}
            </span>
          </div>
          <div>
            <span className="text-muted-foreground">Ciclos: </span>
            <span className="font-medium">
              {wizard.datosBasicos.numCiclos} ({wizard.datosBasicos.tipoCiclo})
            </span>
          </div>
          <div className="mt-2">
            <span className="text-muted-foreground">Modo: </span>
            <span className="font-medium">
              {modo === 'MANUAL' && 'Manual'}
              {modo === 'IA' && 'Generado con IA'}
              {modo === 'CLONADO' &&
                sub === 'INTERNO' &&
                'Clonado desde plan del sistema'}
              {modo === 'CLONADO' &&
                sub === 'TRADICIONAL' &&
                'Importado desde documentos tradicionales'}
            </span>
          </div>
          {wizard.resumen.previewPlan && (
            <div className="bg-muted mt-2 rounded-md p-3">
              <div className="font-medium">Preview IA</div>
              <div className="text-muted-foreground">
                Materias aprox.: {wizard.resumen.previewPlan.numMateriasAprox}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
