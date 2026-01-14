import { useMemo } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import {
  GitBranch,
  Edit3,
  PlusCircle,
  FileText,
  RefreshCw,
  User,
  Loader2,
  Clock,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { usePlanHistorial } from '@/data/hooks/usePlans'
import { format, formatDistanceToNow, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'

export const Route = createFileRoute('/planes/$planId/_detalle/historial')({
  component: RouteComponent,
})

// Función para determinar el icono y tipo según la respuesta de la API
const getEventConfig = (tipo: string, campo: string) => {
  if (tipo === 'CREACION')
    return {
      label: 'Creación',
      icon: <PlusCircle className="h-4 w-4" />,
      color: 'teal',
    }
  if (campo === 'estado')
    return {
      label: 'Cambio de estado',
      icon: <GitBranch className="h-4 w-4" />,
      color: 'blue',
    }
  if (campo === 'datos')
    return {
      label: 'Edición de Datos',
      icon: <Edit3 className="h-4 w-4" />,
      color: 'amber',
    }
  return {
    label: 'Actualización',
    icon: <RefreshCw className="h-4 w-4" />,
    color: 'slate',
  }
}

function RouteComponent() {
  const { planId } = Route.useParams()
  const { data: rawData, isLoading } = usePlanHistorial(
    '0e0aea4d-b8b4-4e75-8279-6224c3ac769f' /*planId*/,
  )

  // Transformación de datos de la API al formato de la UI
  const historyEvents = useMemo(() => {
    if (!rawData) return []

    return rawData.map((item: any) => {
      const config = getEventConfig(item.tipo, item.campo)
      return {
        id: item.id,
        type: config.label,
        user:
          item.cambiado_por === '11111111-1111-1111-1111-111111111111'
            ? 'Administrador'
            : 'Usuario Staff',
        description:
          item.campo === 'datos'
            ? `Actualización general de: ${item.valor_nuevo?.nombre || 'información del plan'}`
            : `Se modificó el campo ${item.campo}`,
        date: parseISO(item.cambiado_en),
        icon: config.icon,
        details:
          item.valor_anterior && item.valor_nuevo
            ? {
                from: String(item.valor_anterior),
                to: String(item.valor_nuevo),
              }
            : null,
      }
    })
  }, [rawData])

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-5xl p-6">
      <div className="mb-8">
        <h1 className="flex items-center gap-2 text-xl font-bold text-slate-800">
          <Clock className="h-5 w-5 text-teal-600" />
          Historial de Cambios del Plan
        </h1>
        <p className="text-muted-foreground text-sm">
          Registro cronológico de modificaciones realizadas
        </p>
      </div>

      <div className="relative space-y-0">
        {/* Línea vertical de fondo */}
        <div className="absolute top-0 bottom-0 left-9 w-px bg-slate-200" />

        {historyEvents.length === 0 ? (
          <div className="ml-20 py-10 text-slate-500">
            No hay registros en el historial.
          </div>
        ) : (
          historyEvents.map((event) => (
            <div key={event.id} className="group relative flex gap-6 pb-8">
              {/* Indicador con Icono */}
              <div className="relative z-10 flex h-18 flex-col items-center">
                <div className="flex h-[42px] w-[42px] items-center justify-center rounded-full border-4 border-white bg-slate-100 text-slate-600 shadow-sm transition-colors group-hover:bg-teal-50 group-hover:text-teal-600">
                  {event.icon}
                </div>
              </div>

              {/* Tarjeta de Contenido */}
              <Card className="flex-1 border-slate-200 shadow-none transition-colors hover:border-teal-200">
                <CardContent className="p-4">
                  <div className="mb-2 flex flex-col justify-between gap-2 md:flex-row md:items-center">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-800">
                        {event.type}
                      </span>
                      <Badge
                        variant="outline"
                        className="py-0 text-[10px] font-normal capitalize"
                      >
                        {formatDistanceToNow(event.date, {
                          addSuffix: true,
                          locale: es,
                        })}
                      </Badge>
                    </div>
                    <div className="text-muted-foreground flex items-center gap-2 text-xs">
                      <Avatar className="h-5 w-5 border">
                        <AvatarFallback className="bg-slate-50 text-[8px]">
                          <User size={10} />
                        </AvatarFallback>
                      </Avatar>
                      {event.user}
                    </div>
                  </div>

                  <p className="mb-1 text-sm text-slate-600">
                    {event.description}
                  </p>

                  <p className="mb-3 text-[10px] text-slate-400">
                    {format(event.date, "PPP 'a las' HH:mm", { locale: es })}
                  </p>

                  {/* Badges de transición (Si aplica para estados) */}
                  {event.details && (
                    <div className="mt-2 flex items-center gap-2">
                      <Badge
                        variant="secondary"
                        className="bg-slate-100 text-[10px]"
                      >
                        {event.details.from}
                      </Badge>
                      <span className="text-xs text-slate-400">→</span>
                      <Badge
                        variant="secondary"
                        className="bg-teal-50 text-[10px] text-teal-700"
                      >
                        {event.details.to}
                      </Badge>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
