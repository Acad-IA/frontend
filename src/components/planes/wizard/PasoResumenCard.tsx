import type { NewPlanWizardState } from '@/features/planes/nuevo/types'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  PLANTILLAS_ANEXO_1,
  PLANTILLAS_ANEXO_2,
} from '@/features/planes/nuevo/catalogs'

export function PasoResumenCard({ wizard }: { wizard: NewPlanWizardState }) {
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
          {/* Plantillas seleccionadas */}
          <div className="mt-2">
            <span className="text-muted-foreground">Plantilla plan: </span>
            <span className="font-medium">
              {(() => {
                const t = PLANTILLAS_ANEXO_1.find(
                  (x) => x.id === wizard.datosBasicos.plantillaPlanId,
                )
                const name =
                  t?.name || wizard.datosBasicos.plantillaPlanId || '—'
                const ver = wizard.datosBasicos.plantillaPlanVersion || '—'
                return `${name} · ${ver}`
              })()}
            </span>
          </div>
          <div>
            <span className="text-muted-foreground">Mapa curricular: </span>
            <span className="font-medium">
              {(() => {
                const t = PLANTILLAS_ANEXO_2.find(
                  (x) => x.id === wizard.datosBasicos.plantillaMapaId,
                )
                const name =
                  t?.name || wizard.datosBasicos.plantillaMapaId || '—'
                const ver = wizard.datosBasicos.plantillaMapaVersion || '—'
                return `${name} · ${ver}`
              })()}
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
          {modo === 'IA' && (
            <div className="bg-muted/50 mt-2 rounded-md p-3">
              <div>
                <span className="text-muted-foreground">Enfoque: </span>
                <span className="font-medium">
                  {wizard.iaConfig?.descripcionEnfoque || '—'}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Notas: </span>
                <span className="font-medium">
                  {wizard.iaConfig?.notasAdicionales || '—'}
                </span>
              </div>
              {!!(wizard.iaConfig?.archivosReferencia?.length || 0) && (
                <div className="text-muted-foreground text-xs">
                  Archivos existentes:{' '}
                  {wizard.iaConfig?.archivosReferencia?.length}
                </div>
              )}
              {!!(wizard.iaConfig?.repositoriosReferencia?.length || 0) && (
                <div className="text-muted-foreground text-xs">
                  Repositorios:{' '}
                  {wizard.iaConfig?.repositoriosReferencia?.length}
                </div>
              )}
              {!!(wizard.iaConfig?.archivosAdjuntos?.length || 0) && (
                <div className="mt-2">
                  <div className="font-medium">Adjuntos</div>
                  <ul className="text-muted-foreground list-disc pl-5 text-xs">
                    {wizard.iaConfig?.archivosAdjuntos?.map((f) => (
                      <li key={f.id}>
                        <span className="text-foreground">{f.name}</span>{' '}
                        <span>· {f.size}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
          {modo === 'CLONADO' && sub === 'TRADICIONAL' && (
            <div className="mt-2">
              <span className="text-muted-foreground">
                Archivo Word del plan:{' '}
              </span>
              <span className="font-medium">
                {wizard.clonTradicional?.archivoWordPlanId?.name || '—'}
              </span>
            </div>
          )}
          {wizard.resumen.previewPlan && (
            <div className="bg-muted mt-2 rounded-md p-3">
              <div className="font-medium">Preview IA</div>
              <div className="text-muted-foreground">
                Asignaturas aprox.:{' '}
                {wizard.resumen.previewPlan.numAsignaturasAprox}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
