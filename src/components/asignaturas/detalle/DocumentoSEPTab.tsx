import { useState } from 'react';
import { FileText, Download, RefreshCw, Calendar, FileCheck, AlertTriangle, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import type { DocumentoMateria, Materia, MateriaStructure } from '@/types/materia';
import { cn } from '@/lib/utils';
//import { toast } from 'sonner';
//import { format } from 'date-fns';
//import { es } from 'date-fns/locale';

interface DocumentoSEPTabProps {
  documento: DocumentoMateria | null;
  materia: Materia;
  estructura: MateriaStructure;
  datosGenerales: Record<string, any>;
  onRegenerate: () => void;
  isRegenerating: boolean;
}

export function DocumentoSEPTab({ documento, materia, estructura, datosGenerales, onRegenerate, isRegenerating }: DocumentoSEPTabProps) {
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  // Check completeness
  const camposObligatorios = estructura.campos.filter(c => c.obligatorio);
  const camposCompletos = camposObligatorios.filter(c => datosGenerales[c.id]?.trim());
  const completeness = Math.round((camposCompletos.length / camposObligatorios.length) * 100);
  const isComplete = completeness === 100;

  const handleRegenerate = () => {
    setShowConfirmDialog(false);
    onRegenerate();
    //toast.success('Regenerando documento...');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-semibold text-foreground flex items-center gap-2">
            <FileCheck className="w-6 h-6 text-accent" />
            Documento SEP
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Previsualización del documento oficial para la SEP
          </p>
        </div>
        <div className="flex items-center gap-2">
          {documento?.estado === 'listo' && (
            <Button variant="outline" onClick={() => console.log("descargando") /*toast.info('Descarga iniciada')*/}>
              <Download className="w-4 h-4 mr-2" />
              Descargar
            </Button>
          )}
          <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
            <AlertDialogTrigger asChild>
              <Button disabled={isRegenerating || !isComplete}>
                {isRegenerating ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4 mr-2" />
                )}
                {isRegenerating ? 'Generando...' : 'Regenerar documento'}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>¿Regenerar documento SEP?</AlertDialogTitle>
                <AlertDialogDescription>
                  Se creará una nueva versión del documento con los datos actuales de la materia. 
                  La versión anterior quedará en el historial.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleRegenerate}>
                  Regenerar
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Document preview */}
        <div className="lg:col-span-2">
          <Card className="card-elevated h-[700px] overflow-hidden">
            {documento?.estado === 'listo' ? (
              <div className="h-full bg-muted/30 flex flex-col">
                {/* Simulated document header */}
                <div className="bg-card border-b p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileText className="w-5 h-5 text-primary" />
                      <span className="font-medium text-foreground">
                        Programa de Estudios - {materia.clave}
                      </span>
                    </div>
                    <Badge variant="outline">Versión {documento.version}</Badge>
                  </div>
                </div>
                
                {/* Document content simulation */}
                <div className="flex-1 overflow-y-auto p-8">
                  <div className="max-w-2xl mx-auto bg-card rounded-lg shadow-lg p-8 space-y-6">
                    {/* Header */}
                    <div className="text-center border-b pb-6">
                      <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">
                        Secretaría de Educación Pública
                      </p>
                      <h1 className="font-display text-2xl font-bold text-primary mb-1">
                        {materia.nombre}
                      </h1>
                      <p className="text-sm text-muted-foreground">
                        Clave: {materia.clave} | Créditos: {materia.creditos || 'N/A'}
                      </p>
                    </div>

                    {/* Datos de la institución */}
                    <div className="space-y-1 text-sm">
                      <p><strong>Carrera:</strong> {materia.carrera}</p>
                      <p><strong>Facultad:</strong> {materia.facultad}</p>
                      <p><strong>Plan de estudios:</strong> {materia.planNombre}</p>
                      {materia.ciclo && <p><strong>Ciclo:</strong> {materia.ciclo}</p>}
                    </div>

                    {/* Campos del documento */}
                    {estructura.campos.map((campo) => {
                      const valor = datosGenerales[campo.id];
                      if (!valor) return null;
                      return (
                        <div key={campo.id} className="space-y-2">
                          <h3 className="font-semibold text-foreground border-b pb-1">
                            {campo.nombre}
                          </h3>
                          <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                            {valor}
                          </p>
                        </div>
                      );
                    })}

                    {/* Footer */}
                    <div className="border-t pt-6 mt-8 text-center text-xs text-muted-foreground">
                      <p>Documento generado el {/*format(documento.fechaGeneracion, "d 'de' MMMM 'de' yyyy", { locale: es })*/}</p>
                      <p className="mt-1">Universidad La Salle</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : documento?.estado === 'generando' ? (
              <div className="h-full flex items-center justify-center">
                <div className="text-center">
                  <Loader2 className="w-12 h-12 mx-auto text-accent animate-spin mb-4" />
                  <p className="text-muted-foreground">Generando documento...</p>
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center">
                <div className="text-center max-w-sm">
                  <FileText className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                  <p className="text-muted-foreground mb-4">
                    No hay documento generado aún
                  </p>
                  {!isComplete && (
                    <div className="p-4 bg-warning/10 rounded-lg text-sm text-warning-foreground">
                      <AlertTriangle className="w-4 h-4 inline mr-2" />
                      Completa todos los campos obligatorios para generar el documento
                    </div>
                  )}
                </div>
              </div>
            )}
          </Card>
        </div>

        {/* Info sidebar */}
        <div className="space-y-4">
          {/* Status */}
          <Card className="card-elevated">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Estado del documento</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {documento && (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Versión</span>
                    <Badge variant="outline">{documento.version}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Generado</span>
                    <span className="text-sm">
                      {/*format(documento.fechaGeneracion, "d MMM yyyy, HH:mm", { locale: es })*/}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Estado</span>
                    <Badge className={cn(
                      documento.estado === 'listo' && "bg-success text-success-foreground",
                      documento.estado === 'generando' && "bg-info text-info-foreground",
                      documento.estado === 'error' && "bg-destructive text-destructive-foreground"
                    )}>
                      {documento.estado === 'listo' && 'Listo'}
                      {documento.estado === 'generando' && 'Generando'}
                      {documento.estado === 'error' && 'Error'}
                    </Badge>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Completeness */}
          <Card className="card-elevated">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Completitud de datos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Campos obligatorios</span>
                  <span className="font-medium">{camposCompletos.length}/{camposObligatorios.length}</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className={cn(
                      "h-full transition-all duration-500",
                      completeness === 100 ? "bg-success" : "bg-accent"
                    )}
                    style={{ width: `${completeness}%` }}
                  />
                </div>
                <p className={cn(
                  "text-xs",
                  completeness === 100 ? "text-success" : "text-muted-foreground"
                )}>
                  {completeness === 100 
                    ? 'Todos los campos obligatorios están completos'
                    : `Faltan ${camposObligatorios.length - camposCompletos.length} campos por completar`
                  }
                </p>
              </div>

              {/* Missing fields */}
              {!isComplete && (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">Campos faltantes:</p>
                  {camposObligatorios.filter(c => !datosGenerales[c.id]?.trim()).map((campo) => (
                    <div key={campo.id} className="flex items-center gap-2 text-sm">
                      <AlertTriangle className="w-3 h-3 text-warning" />
                      <span className="text-foreground">{campo.nombre}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Requirements */}
          <Card className="card-elevated">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Requisitos SEP</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <div className={cn(
                    "w-4 h-4 rounded-full flex items-center justify-center mt-0.5",
                    datosGenerales['objetivo_general'] ? "bg-success/20" : "bg-muted"
                  )}>
                    {datosGenerales['objetivo_general'] && <Check className="w-3 h-3 text-success" />}
                  </div>
                  <span className="text-muted-foreground">Objetivo general definido</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className={cn(
                    "w-4 h-4 rounded-full flex items-center justify-center mt-0.5",
                    datosGenerales['competencias'] ? "bg-success/20" : "bg-muted"
                  )}>
                    {datosGenerales['competencias'] && <Check className="w-3 h-3 text-success" />}
                  </div>
                  <span className="text-muted-foreground">Competencias especificadas</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className={cn(
                    "w-4 h-4 rounded-full flex items-center justify-center mt-0.5",
                    datosGenerales['evaluacion'] ? "bg-success/20" : "bg-muted"
                  )}>
                    {datosGenerales['evaluacion'] && <Check className="w-3 h-3 text-success" />}
                  </div>
                  <span className="text-muted-foreground">Criterios de evaluación</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Check({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
