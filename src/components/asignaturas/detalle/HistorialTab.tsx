import { useState } from 'react';
import { History, FileText, List, BookMarked, Sparkles, FileCheck, User, Filter, Calendar } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { CambioMateria } from '@/types/materia';
import { cn } from '@/lib/utils';
import { format, formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface HistorialTabProps {
  historial: CambioMateria[];
}

const tipoConfig: Record<string, { label: string; icon: React.ComponentType<{ className?: string }>; color: string }> = {
  datos: { label: 'Datos generales', icon: FileText, color: 'text-info' },
  contenido: { label: 'Contenido temático', icon: List, color: 'text-accent' },
  bibliografia: { label: 'Bibliografía', icon: BookMarked, color: 'text-success' },
  ia: { label: 'IA', icon: Sparkles, color: 'text-amber-500' },
  documento: { label: 'Documento SEP', icon: FileCheck, color: 'text-primary' },
};

export function HistorialTab({ historial }: HistorialTabProps) {
  const [filtros, setFiltros] = useState<Set<string>>(new Set(['datos', 'contenido', 'bibliografia', 'ia', 'documento']));

  const toggleFiltro = (tipo: string) => {
    const newFiltros = new Set(filtros);
    if (newFiltros.has(tipo)) {
      newFiltros.delete(tipo);
    } else {
      newFiltros.add(tipo);
    }
    setFiltros(newFiltros);
  };

  const filteredHistorial = historial.filter(cambio => filtros.has(cambio.tipo));

  // Group by date
  const groupedHistorial = filteredHistorial.reduce((groups, cambio) => {
    const dateKey = format(cambio.fecha, 'yyyy-MM-dd');
    if (!groups[dateKey]) {
      groups[dateKey] = [];
    }
    groups[dateKey].push(cambio);
    return groups;
  }, {} as Record<string, CambioMateria[]>);

  const sortedDates = Object.keys(groupedHistorial).sort((a, b) => b.localeCompare(a));

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-semibold text-foreground flex items-center gap-2">
            <History className="w-6 h-6 text-accent" />
            Historial de cambios
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {historial.length} cambios registrados
          </p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">
              <Filter className="w-4 h-4 mr-2" />
              Filtrar ({filtros.size})
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            {Object.entries(tipoConfig).map(([tipo, config]) => {
              const Icon = config.icon;
              return (
                <DropdownMenuCheckboxItem
                  key={tipo}
                  checked={filtros.has(tipo)}
                  onCheckedChange={() => toggleFiltro(tipo)}
                >
                  <Icon className={cn("w-4 h-4 mr-2", config.color)} />
                  {config.label}
                </DropdownMenuCheckboxItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {filteredHistorial.length === 0 ? (
        <Card className="card-elevated">
          <CardContent className="py-12 text-center">
            <History className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">
              {historial.length === 0 
                ? 'No hay cambios registrados aún' 
                : 'No hay cambios con los filtros seleccionados'
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {sortedDates.map((dateKey) => {
            const cambios = groupedHistorial[dateKey];
            const date = new Date(dateKey);
            const isToday = format(new Date(), 'yyyy-MM-dd') === dateKey;
            const isYesterday = format(new Date(Date.now() - 86400000), 'yyyy-MM-dd') === dateKey;

            return (
              <div key={dateKey}>
                {/* Date header */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-lg bg-muted">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">
                      {isToday ? 'Hoy' : isYesterday ? 'Ayer' : format(date, "EEEE, d 'de' MMMM", { locale: es })}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {cambios.length} {cambios.length === 1 ? 'cambio' : 'cambios'}
                    </p>
                  </div>
                </div>

                {/* Timeline */}
                <div className="ml-4 border-l-2 border-border pl-6 space-y-4">
                  {cambios.map((cambio) => {
                    const config = tipoConfig[cambio.tipo];
                    const Icon = config.icon;
                    return (
                      <div key={cambio.id} className="relative">
                        {/* Timeline dot */}
                        <div className={cn(
                          "absolute -left-[31px] w-4 h-4 rounded-full border-2 border-background",
                          `bg-current ${config.color}`
                        )} />
                        
                        <Card className="card-interactive">
                          <CardContent className="py-4">
                            <div className="flex items-start gap-4">
                              <div className={cn(
                                "p-2 rounded-lg bg-muted flex-shrink-0",
                                config.color
                              )}>
                                <Icon className="w-4 h-4" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2">
                                  <div>
                                    <p className="font-medium text-foreground">
                                      {cambio.descripcion}
                                    </p>
                                    <div className="flex items-center gap-2 mt-1">
                                      <Badge variant="outline" className="text-xs">
                                        {config.label}
                                      </Badge>
                                      {cambio.detalles?.campo && (
                                        <span className="text-xs text-muted-foreground">
                                          Campo: {cambio.detalles.campo}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                                    {format(cambio.fecha, 'HH:mm')}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
                                  <User className="w-3 h-3" />
                                  <span>{cambio.usuario}</span>
                                  <span className="text-muted-foreground/50">•</span>
                                  <span>
                                    {formatDistanceToNow(cambio.fecha, { addSuffix: true, locale: es })}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
