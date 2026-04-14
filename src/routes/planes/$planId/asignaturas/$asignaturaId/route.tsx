import { useQueryClient } from '@tanstack/react-query'
import {
  createFileRoute,
  Outlet,
  Link,
  useLocation,
  useParams,
  useRouterState,
} from '@tanstack/react-router'
import { ArrowLeft, GraduationCap } from 'lucide-react'
import { useEffect, useState } from 'react'

import { AlertaConflicto } from '@/components/asignaturas/detalle/mapa/AlertaConflicto'
import { Badge } from '@/components/ui/badge'
import { lateralConfetti } from '@/components/ui/lateral-confetti'
import { usePlanAsignaturas, useSubject, useUpdateAsignatura } from '@/data'

export const Route = createFileRoute(
  '/planes/$planId/asignaturas/$asignaturaId',
)({
  component: AsignaturaLayout,
})

function EditableHeaderField({
  value,
  onSave,
}: {
  value: string | number
  onSave: (val: string) => void
}) {
  const [localValue, setLocalValue] = useState(String(value))

  // Sincronizar si el valor externo cambia (por ejemplo, tras el onSuccess)
  useEffect(() => {
    setLocalValue(String(value))
  }, [value])

  return (
    <span
      contentEditable
      suppressContentEditableWarning
      onBlur={(e) => {
        const newValue = e.currentTarget.innerText
        if (newValue !== String(value)) onSave(newValue)
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter') e.currentTarget.blur()
      }}
      dangerouslySetInnerHTML={{ __html: localValue }}
    />
  )
}
interface DatosPlan {
  nombre?: string
}

function AsignaturaLayout() {
  const location = useLocation()
  const { asignaturaId, planId } = useParams({
    from: '/planes/$planId/asignaturas/$asignaturaId',
  })

  const { data: asignaturaApi, isLoading } = useSubject(asignaturaId)
  const { data: todasLasAsignaturas } = usePlanAsignaturas(planId)
  const [confirmState, setConfirmState] = useState<{
    isOpen: boolean
    resolve: (value: boolean) => void
    mensaje: string
  } | null>(null)
  const validarConInterrupcion = async (
    nuevoCiclo: number,
  ): Promise<boolean> => {
    if (!todasLasAsignaturas || !asignaturaApi) return true

    const materiasConflicto = todasLasAsignaturas.filter((a) => {
      const esPrerrequisitoConflictivo =
        asignaturaApi.prerrequisito_asignatura_id === a.id &&
        (a.numero_ciclo ?? 0) >= nuevoCiclo

      const esDependienteConflictiva =
        a.prerrequisito_asignatura_id === asignaturaApi.id &&
        (a.numero_ciclo ?? 0) <= nuevoCiclo

      return esPrerrequisitoConflictivo || esDependienteConflictiva
    })

    if (materiasConflicto.length === 0) return true

    const listaNombres = materiasConflicto.map((m) => m.nombre)

    return new Promise((resolve) => {
      setConfirmState({
        isOpen: true,
        resolve,
        mensaje: JSON.stringify({
          main: `Mover "${asignaturaApi.nombre}" al ciclo ${nuevoCiclo} genera conflictos con:`,
          materias: listaNombres,
        }),
      })
    })
  }
  const queryClient = useQueryClient()
  const updateAsignatura = useUpdateAsignatura({
    onSuccess: () => {
      // ESTO ES LO QUE FALTA: Obliga a react-query a traer los datos nuevos
      queryClient.invalidateQueries({ queryKey: ['subject', asignaturaId] })
    },
  })

  const handleUpdateHeader = async (key: string, value: string | number) => {
    // 1. Validación de ciclo
    if (key === 'ciclo') {
      const nuevoCiclo = Number(value)
      const acepto = await validarConInterrupcion(nuevoCiclo)

      // Si no aceptó, no hacemos nada más
      if (!acepto) {
        setConfirmState(null)
        return
      }
      setConfirmState(null)
    }

    // 2. Ejecutar mutación
    const patch = key === 'ciclo' ? { numero_ciclo: value } : { [key]: value }

    // Esto disparará el onSuccess de useUpdateAsignatura que ya tienes
    updateAsignatura.mutate({ asignaturaId, patch })
  }

  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  })

  // Confetti al llegar desde creación IA
  useEffect(() => {
    
    if ((location.state as any)?.showConfetti) {
      lateralConfetti()
      window.history.replaceState({}, document.title)
    }
  }, [location.state])

  if (isLoading || !asignaturaApi) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#0b1d3a] text-white">
        Cargando asignatura...
      </div>
    )
  }

  // Si no hay datos y no está cargando, algo falló
  if (!asignaturaApi) return null

  return (
    <div>
      <section className="bg-linear-to-b from-[#0b1d3a] to-[#0e2a5c] text-white">
        <div className="mx-auto p-4 py-10 md:px-6 lg:px-8">
          <Link
            to="/planes/$planId/asignaturas"
            params={{ planId }}
            className="mb-4 flex items-center gap-2 text-sm text-blue-200 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" /> Volver al plan
          </Link>

          <div className="flex items-start justify-between gap-6">
            <div className="space-y-3">
              {/* CÓDIGO EDITABLE */}
              <Badge className="border border-blue-700 bg-blue-900/50">
                <EditableHeaderField
                  value={asignaturaApi.codigo}
                  onSave={(val) => handleUpdateHeader('codigo', val)}
                />
              </Badge>

              {/* NOMBRE EDITABLE */}
              <h1 className="text-3xl font-bold">
                <EditableHeaderField
                  value={asignaturaApi.nombre}
                  onSave={(val) => handleUpdateHeader('nombre', val)}
                />
              </h1>
              <div className="flex flex-wrap gap-4 text-sm text-blue-200">
                <span className="flex items-center gap-1">
                  <GraduationCap className="h-4 w-4 shrink-0" />
                  Pertenece al plan:{' '}
                  <span className="text-blue-100">
                    {(asignaturaApi.planes_estudio as DatosPlan | undefined)
                      ?.nombre ?? ''}
                  </span>
                </span>
              </div>
            </div>

            <div className="flex flex-col items-end gap-2 text-right">
              {/* CRÉDITOS EDITABLES */}
              <Badge variant="secondary" className="gap-1">
                <span className="inline-flex max-w-fit">
                  <EditableHeaderField
                    value={asignaturaApi.creditos}
                    onSave={(val) =>
                      handleUpdateHeader('creditos', parseInt(val) || 0)
                    }
                  />
                </span>
                <span>créditos</span>
              </Badge>

              {/* SEMESTRE EDITABLE */}
              <Badge variant="secondary" className="gap-1">
                <EditableHeaderField
                  value={asignaturaApi.numero_ciclo}
                  onSave={(val) =>
                    handleUpdateHeader('ciclo', parseInt(val) || 0)
                  }
                />
                <span>° ciclo</span>
              </Badge>

              <Badge variant="secondary">{asignaturaApi.tipo}</Badge>
            </div>
          </div>
        </div>
      </section>

      {confirmState && (
        <AlertaConflicto
          isOpen={confirmState.isOpen}
          onOpenChange={(open) => {
            if (!open) {
              confirmState.resolve(false)
              setConfirmState(null)
            }
          }}
          onConfirm={() => confirmState.resolve(true)}
          titulo="Conflicto de Seriación"
          descripcion={confirmState.mensaje}
        />
      )}

      {/* TABS */}

      <nav className="sticky top-0 z-20 border-b bg-white">
        <div className="mx-auto p-4 py-2 md:px-6 lg:px-8">
          {/* CAMBIOS CLAVE:
        1. overflow-x-auto: Permite scroll horizontal.
        2. scrollbar-hide: (Opcional) para que no se vea la barra fea.
        3. justify-start md:justify-center: Alineado a la izquierda en móvil para que el scroll funcione, centrado en desktop.
    */}
          <div className="no-scrollbar flex items-center justify-start gap-8 overflow-x-auto whitespace-nowrap md:justify-start">
            {[
              { label: 'Datos', to: '' },
              { label: 'Contenido', to: 'contenido' },
              { label: 'Bibliografía', to: 'bibliografia' },
              { label: 'IA', to: 'iaasignatura' },
              { label: 'Documento SEP', to: 'documento' },
              { label: 'Historial', to: 'historial' },
            ].map((tab) => {
              const isActive =
                tab.to === ''
                  ? pathname === `/planes/${planId}/asignaturas/${asignaturaId}`
                  : pathname.includes(tab.to)

              return (
                <Link
                  key={tab.label}
                  to={
                    (tab.to === ''
                      ? '/planes/$planId/asignaturas/$asignaturaId'
                      : `/planes/$planId/asignaturas/$asignaturaId/${tab.to}`) as any
                  }
                  from="/planes/$planId/asignaturas/$asignaturaId"
                  params={{ planId, asignaturaId }}
                  className={`shrink-0 border-b-2 py-4 text-sm font-medium transition-colors ${
                    isActive
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700'
                  }`}
                >
                  {tab.label}
                </Link>
              )
            })}
          </div>
        </div>
      </nav>

      <div className="mx-auto p-4 py-8 md:px-6 lg:px-8">
        <Outlet />
      </div>
    </div>
  )
}
