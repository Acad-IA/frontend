import { useQuery } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { Loader2 } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

import type { AIGeneratePlanInput } from '@/data'
import type { NivelPlanEstudio, TipoCiclo } from '@/data/types/domain'
import type { NewPlanWizardState } from '@/features/planes/nuevo/types'
// import type { Database } from '@/types/supabase'

import { Button } from '@/components/ui/button'
import { plans_get_maybe } from '@/data/api/plans.api'
import {
  useCreatePlanManual,
  useDeletePlanEstudio,
  useGeneratePlanAI,
} from '@/data/hooks/usePlans'
import { qk } from '@/data/query/keys'

export function WizardControls({
  errorMessage,
  onPrev,
  onNext,
  disablePrev,
  disableNext,
  disableCreate,
  isLastStep,
  wizard,
  setWizard,
}: {
  errorMessage?: string | null
  onPrev: () => void
  onNext: () => void
  disablePrev: boolean
  disableNext: boolean
  disableCreate: boolean
  isLastStep: boolean
  wizard: NewPlanWizardState
  setWizard: React.Dispatch<React.SetStateAction<NewPlanWizardState>>
}) {
  const navigate = useNavigate()
  const generatePlanAI = useGeneratePlanAI()
  const createPlanManual = useCreatePlanManual()
  const deletePlan = useDeletePlanEstudio()
  const [isSpinningIA, setIsSpinningIA] = useState(false)
  const [pollPlanId, setPollPlanId] = useState<string | null>(null)
  const cancelledRef = useRef(false)
  const pollStartedAtRef = useRef<number | null>(null)
  // const supabaseClient = supabaseBrowser()
  // const persistPlanFromAI = usePersistPlanFromAI()

  useEffect(() => {
    cancelledRef.current = false
    return () => {
      cancelledRef.current = true
    }
  }, [])

  const planQuery = useQuery({
    queryKey: pollPlanId
      ? qk.planMaybe(pollPlanId)
      : ['planes', 'detail-maybe', null],
    queryFn: () => plans_get_maybe(pollPlanId as string),
    enabled: Boolean(pollPlanId),
    refetchInterval: () => {
      if (!pollPlanId) return false

      const startedAt = pollStartedAtRef.current ?? Date.now()
      if (!pollStartedAtRef.current) pollStartedAtRef.current = startedAt

      const elapsedMs = Date.now() - startedAt
      return elapsedMs >= 6 * 60 * 1000 ? false : 3000
    },
    refetchIntervalInBackground: true,
    staleTime: 0,
  })

  useEffect(() => {
    if (!pollPlanId) return
    if (cancelledRef.current) return

    // Si aún no existe en BDD, seguimos esperando.
    const plan = planQuery.data
    if (!plan) return

    const clave = String(plan.estados_plan?.clave ?? '').toUpperCase()

    if (clave.startsWith('GENERANDO')) return

    if (clave.startsWith('BORRADOR')) {
      setPollPlanId(null)
      pollStartedAtRef.current = null
      setIsSpinningIA(false)
      setWizard((w) => ({ ...w, isLoading: false }))
      navigate({
        to: `/planes/${plan.id}`,
        state: { showConfetti: true },
      })
      return
    }

    if (clave.startsWith('FALLID')) {
      // Detenemos el polling primero para evitar loops.
      setPollPlanId(null)
      pollStartedAtRef.current = null
      setIsSpinningIA(false)

      deletePlan
        .mutateAsync(plan.id)
        .catch(() => {
          // Si falla el borrado, igual mostramos el error.
        })
        .finally(() => {
          setWizard((w) => ({
            ...w,
            isLoading: false,
            errorMessage: 'La generación del plan falló',
          }))
        })
    }
  }, [pollPlanId, planQuery.data, navigate, setWizard, deletePlan])

  useEffect(() => {
    if (!pollPlanId) return
    if (!planQuery.isError) return
    setPollPlanId(null)
    pollStartedAtRef.current = null
    setIsSpinningIA(false)
    setWizard((w) => ({
      ...w,
      isLoading: false,
      errorMessage:
        (planQuery.error as any)?.message ??
        'Error consultando el estado del plan',
    }))
  }, [pollPlanId, planQuery.isError, planQuery.error, setWizard])

  const handleCreate = async () => {
    // Start loading
    setWizard(
      (w: NewPlanWizardState): NewPlanWizardState => ({
        ...w,
        isLoading: true,
        errorMessage: null,
      }),
    )

    try {
      if (wizard.tipoOrigen === 'IA') {
        const tipoCicloSafe = (wizard.datosBasicos.tipoCiclo ||
          'Semestre') as any
        const numCiclosSafe =
          typeof wizard.datosBasicos.numCiclos === 'number'
            ? wizard.datosBasicos.numCiclos
            : 1

        const aiInput: AIGeneratePlanInput = {
          datosBasicos: {
            nombrePlan: wizard.datosBasicos.nombrePlan,
            carreraId: wizard.datosBasicos.carrera.id,
            facultadId: wizard.datosBasicos.facultad.id,
            nivel: wizard.datosBasicos.nivel as string,
            tipoCiclo: tipoCicloSafe,
            numCiclos: numCiclosSafe,
            estructuraPlanId: wizard.datosBasicos.estructuraPlanId as string,
          },
          iaConfig: {
            descripcionEnfoqueAcademico:
              wizard.iaConfig?.descripcionEnfoqueAcademico || '',
            instruccionesAdicionalesIA:
              wizard.iaConfig?.instruccionesAdicionalesIA || '',
            archivosReferencia: wizard.iaConfig?.archivosReferencia || [],
            repositoriosIds: wizard.iaConfig?.repositoriosReferencia || [],
            archivosAdjuntos: wizard.iaConfig?.archivosAdjuntos || [],
          },
        }

        console.log(`${new Date().toISOString()} - Enviando a generar plan IA`)

        setIsSpinningIA(true)
        const resp: any = await generatePlanAI.mutateAsync(aiInput as any)
        const planId = resp?.plan?.id ?? resp?.id
        console.log(`${new Date().toISOString()} - Plan IA generado`, resp)

        if (!planId) {
          throw new Error('No se pudo obtener el id del plan generado por IA')
        }

        // Inicia polling con React Query; el efecto navega o marca error.
        pollStartedAtRef.current = Date.now()
        setPollPlanId(String(planId))
        return
      }

      if (wizard.tipoOrigen === 'MANUAL') {
        // Crear plan vacío manualmente usando el hook
        const plan = await createPlanManual.mutateAsync({
          carreraId: wizard.datosBasicos.carrera.id,
          estructuraId: wizard.datosBasicos.estructuraPlanId as string,
          nombre: wizard.datosBasicos.nombrePlan,
          nivel: wizard.datosBasicos.nivel as NivelPlanEstudio,
          tipoCiclo: wizard.datosBasicos.tipoCiclo as TipoCiclo,
          numCiclos: (wizard.datosBasicos.numCiclos as number) || 1,
          datos: {},
        })

        // Navegar al nuevo plan
        navigate({
          to: `/planes/${plan.id}`,
          state: { showConfetti: true },
        })
        return
      }
    } catch (err: any) {
      setIsSpinningIA(false)
      setPollPlanId(null)
      setWizard((w) => ({
        ...w,
        isLoading: false,
        errorMessage: err?.message ?? 'Error generando el plan',
      }))
    } finally {
      // Si entramos en polling, el loading se corta desde el efecto terminal.
      if (!pollPlanId) {
        setIsSpinningIA(false)
        setWizard((w) => ({ ...w, isLoading: false }))
      }
    }
  }

  return (
    <div className="flex grow items-center justify-between">
      <Button variant="secondary" onClick={onPrev} disabled={disablePrev}>
        Anterior
      </Button>
      <div className="mx-2 flex-1">
        {errorMessage && (
          <span className="text-destructive text-sm font-medium">
            {errorMessage}
          </span>
        )}
      </div>

      <div className="mx-2 flex w-5 items-center justify-center">
        <Loader2
          className={
            wizard.tipoOrigen === 'IA' && isSpinningIA
              ? 'text-muted-foreground h-6 w-6 animate-spin'
              : 'h-6 w-6 opacity-0'
          }
          aria-hidden={!(wizard.tipoOrigen === 'IA' && isSpinningIA)}
        />
      </div>
      {isLastStep ? (
        <Button onClick={handleCreate} disabled={disableCreate}>
          Crear plan
        </Button>
      ) : (
        <Button onClick={onNext} disabled={disableNext}>
          Siguiente
        </Button>
      )}
    </div>
  )
}
