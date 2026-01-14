import { useState, useMemo } from 'react'
import {
  History,
  FileText,
  List,
  BookMarked,
  Sparkles,
  FileCheck,
  User,
  Filter,
  Calendar,
  Loader2,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { format, formatDistanceToNow, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import { useSubjectHistorial } from '@/data/hooks/useSubjects'

// Mapeo de tipos de la API a los tipos del componente
const TIPO_MAP: Record<string, string> = {
  ACTUALIZACION_CAMPO: 'contenido', // O 'datos' según el campo
  CREACION: 'datos',
}

const tipoConfig: Record<string, { label: string; icon: any; color: string }> =
  {
    datos: { label: 'Datos generales', icon: FileText, color: 'text-info' },
    contenido: {
      label: 'Contenido temático',
      icon: List,
      color: 'text-accent',
    },
    bibliografia: {
      label: 'Bibliografía',
      icon: BookMarked,
      color: 'text-success',
    },
    ia: { label: 'IA', icon: Sparkles, color: 'text-amber-500' },
    documento: {
      label: 'Documento SEP',
      icon: FileCheck,
      color: 'text-primary',
    },
  }

export function HistorialTab() {
  // 1. Obtenemos los datos directamente dentro del componente
  const { data: rawData, isLoading } = useSubjectHistorial(
    '9d4dda6a-488f-428a-8a07-38081592a641',
  )

  const [filtros, setFiltros] = useState<Set<string>>(
    new Set(['datos', 'contenido', 'bibliografia', 'ia', 'documento']),
  )

  // 2. Transformamos los datos de la API al formato que usa el componente
  const historialTransformado = useMemo(() => {
    if (!rawData) return []

    return rawData.map((item: any) => ({
      id: item.id,
      // Intentamos determinar el tipo basándonos en el campo o el tipo de la API
      tipo: item.campo === 'contenido_tematico' ? 'contenido' : 'datos',
      descripcion: `Se actualizó el campo ${item.campo.replace('_', ' ')}`,
      fecha: parseISO(item.cambiado_en),
      usuario: item.fuente === 'HUMANO' ? 'Usuario Staff' : 'Sistema IA',
      detalles: {
        campo: item.campo,
        valor_nuevo: item.valor_nuevo,
      },
    }))
  }, [rawData])

  const toggleFiltro = (tipo: string) => {
    const newFiltros = new Set(filtros)
    if (newFiltros.has(tipo)) newFiltros.delete(tipo)
    else newFiltros.add(tipo)
    setFiltros(newFiltros)
  }

  // 3. Aplicamos filtros y agrupamiento sobre los datos transformados
  const filteredHistorial = historialTransformado.filter((cambio) =>
    filtros.has(cambio.tipo),
  )

  const groupedHistorial = filteredHistorial.reduce(
    (groups, cambio) => {
      const dateKey = format(cambio.fecha, 'yyyy-MM-dd')
      if (!groups[dateKey]) groups[dateKey] = []
      groups[dateKey].push(cambio)
      return groups
    },
    {} as Record<string, any[]>,
  )

  const sortedDates = Object.keys(groupedHistorial).sort((a, b) =>
    b.localeCompare(a),
  )

  if (isLoading) {
    return (
      <div className="flex h-48 items-center justify-center">
        <Loader2 className="text-primary h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-foreground flex items-center gap-2 text-2xl font-semibold">
            <History className="text-accent h-6 w-6" />
            Historial de cambios
          </h2>
          <p className="text-muted-foreground mt-1 text-sm">
            {historialTransformado.length} cambios registrados
          </p>
        </div>

        {/* Dropdown de Filtros (Igual al anterior) */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">
              <Filter className="mr-2 h-4 w-4" />
              Filtrar ({filtros.size})
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            {Object.entries(tipoConfig).map(([tipo, config]) => (
              <DropdownMenuCheckboxItem
                key={tipo}
                checked={filtros.has(tipo)}
                onCheckedChange={() => toggleFiltro(tipo)}
              >
                <config.icon className={cn('mr-2 h-4 w-4', config.color)} />
                {config.label}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {filteredHistorial.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <History className="text-muted-foreground/50 mx-auto mb-4 h-12 w-12" />
            <p className="text-muted-foreground">No se encontraron cambios.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {sortedDates.map((dateKey) => (
            <div key={dateKey}>
              <div className="mb-4 flex items-center gap-3">
                <Calendar className="text-muted-foreground h-4 w-4" />
                <h3 className="text-foreground font-semibold">
                  {format(parseISO(dateKey), "EEEE, d 'de' MMMM", {
                    locale: es,
                  })}
                </h3>
              </div>

              <div className="border-border ml-4 space-y-4 border-l-2 pl-6">
                {groupedHistorial[dateKey].map((cambio) => {
                  const config = tipoConfig[cambio.tipo] || tipoConfig.datos
                  const Icon = config.icon
                  return (
                    <div key={cambio.id} className="relative">
                      <div
                        className={cn(
                          'border-background absolute -left-[31px] h-4 w-4 rounded-full border-2',
                          `bg-current ${config.color}`,
                        )}
                      />
                      <Card className="card-interactive">
                        <CardContent className="py-4">
                          <div className="flex items-start gap-4">
                            <div
                              className={cn(
                                'bg-muted rounded-lg p-2',
                                config.color,
                              )}
                            >
                              <Icon className="h-4 w-4" />
                            </div>
                            <div className="flex-1">
                              <div className="flex justify-between">
                                <p className="font-medium">
                                  {cambio.descripcion}
                                </p>
                                <span className="text-muted-foreground text-xs">
                                  {format(cambio.fecha, 'HH:mm')}
                                </span>
                              </div>
                              <div className="mt-2 flex items-center gap-2">
                                <Badge
                                  variant="outline"
                                  className="text-[10px]"
                                >
                                  {config.label}
                                </Badge>
                                <span className="text-muted-foreground text-xs italic">
                                  por {cambio.usuario}
                                </span>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
