import { TemplateSelectorCard } from './TemplateSelectorCard'

import type { NivelPlanEstudio, TipoCiclo } from '@/data/types/domain'
import type { CARRERAS } from '@/features/planes/nuevo/catalogs'
import type { NewPlanWizardState } from '@/features/planes/nuevo/types'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { useCatalogosPlanes } from '@/data/hooks/usePlans'
import {
  FACULTADES,
  NIVELES,
  TIPOS_CICLO,
  PLANTILLAS_ANEXO_1,
  PLANTILLAS_ANEXO_2,
} from '@/features/planes/nuevo/catalogs'
import { cn } from '@/lib/utils'

export function PasoBasicosForm({
  wizard,
  onChange,
  carrerasFiltradas,
}: {
  wizard: NewPlanWizardState
  onChange: React.Dispatch<React.SetStateAction<NewPlanWizardState>>
  carrerasFiltradas: typeof CARRERAS
}) {
  const { data: catalogos } = useCatalogosPlanes()

  // Preferir los catálogos remotos si están disponibles; si no, usar los locales
  const facultadesList = catalogos?.facultades ?? FACULTADES
  const rawCarreras = catalogos?.carreras ?? carrerasFiltradas

  const filteredCarreras = rawCarreras.filter((c: any) => {
    const facId = wizard.datosBasicos.facultadId
    if (!facId) return true
    // soportar ambos shapes: `facultad_id` (BD) o `facultadId` (local)
    return c.facultad_id ? c.facultad_id === facId : c.facultadId === facId
  })
  return (
    <div className="flex flex-col gap-2">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-1 sm:col-span-2">
          <Label htmlFor="nombrePlan">
            Nombre del plan <span className="text-destructive">*</span>
          </Label>
          <Input
            id="nombrePlan"
            placeholder="Ej. Ingeniería en Sistemas (2026)"
            value={wizard.datosBasicos.nombrePlan}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              onChange((w) => ({
                ...w,
                datosBasicos: { ...w.datosBasicos, nombrePlan: e.target.value },
              }))
            }
            className="placeholder:text-muted-foreground/70 font-medium not-italic placeholder:font-normal placeholder:italic"
          />
        </div>

        <div className="grid gap-1">
          <Label htmlFor="facultad">Facultad</Label>
          <Select
            value={wizard.datosBasicos.facultadId}
            onValueChange={(value) =>
              onChange((w) => ({
                ...w,
                datosBasicos: {
                  ...w.datosBasicos,
                  facultadId: value,
                  carreraId: '',
                },
              }))
            }
          >
            <SelectTrigger
              id="facultad"
              className={cn(
                'w-full min-w-0 [&>span]:block! [&>span]:truncate!',
                !wizard.datosBasicos.facultadId
                  ? 'text-muted-foreground font-normal italic opacity-70' // Es Placeholder
                  : 'font-medium not-italic', // Tiene Valor (Medium)
              )}
            >
              <SelectValue placeholder="Ej. Facultad de Ingeniería" />
            </SelectTrigger>
            <SelectContent>
              {facultadesList.map((f: any) => (
                <SelectItem key={f.id} value={f.id}>
                  {f.nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-1">
          <Label htmlFor="carrera">Carrera</Label>
          <Select
            value={wizard.datosBasicos.carreraId}
            onValueChange={(value) =>
              onChange((w) => ({
                ...w,
                datosBasicos: { ...w.datosBasicos, carreraId: value },
              }))
            }
            disabled={!wizard.datosBasicos.facultadId}
          >
            <SelectTrigger
              id="carrera"
              className={cn(
                'w-full min-w-0 [&>span]:block! [&>span]:truncate!',
                !wizard.datosBasicos.carreraId
                  ? 'text-muted-foreground font-normal italic opacity-70' // Es Placeholder
                  : 'font-medium not-italic', // Tiene Valor (Medium)
              )}
            >
              <SelectValue placeholder="Ej. Ingeniería en Cibernética y Sistemas Computacionales" />
            </SelectTrigger>
            <SelectContent>
              {filteredCarreras.map((c: any) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-1">
          <Label htmlFor="nivel">Nivel</Label>
          <Select
            value={wizard.datosBasicos.nivel}
            onValueChange={(value: NivelPlanEstudio) =>
              onChange(
                (w): NewPlanWizardState => ({
                  ...w,
                  datosBasicos: { ...w.datosBasicos, nivel: value },
                }),
              )
            }
          >
            <SelectTrigger
              id="nivel"
              className={cn(
                'w-full min-w-0 [&>span]:block! [&>span]:truncate!',
                !wizard.datosBasicos.nivel
                  ? 'text-muted-foreground font-normal italic opacity-70' // Es Placeholder
                  : 'font-medium not-italic', // Tiene Valor (Medium)
              )}
            >
              <SelectValue placeholder="Ej. Licenciatura" />
            </SelectTrigger>
            <SelectContent>
              {NIVELES.map((n) => (
                <SelectItem key={n} value={n}>
                  {n}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-1">
          <Label htmlFor="tipoCiclo">Tipo de ciclo</Label>
          <Select
            value={wizard.datosBasicos.tipoCiclo}
            onValueChange={(value: TipoCiclo) =>
              onChange((w) => ({
                ...w,
                datosBasicos: {
                  ...w.datosBasicos,
                  tipoCiclo: value as any,
                },
              }))
            }
          >
            <SelectTrigger
              id="tipoCiclo"
              className={cn(
                'w-full min-w-0 [&>span]:block! [&>span]:truncate!',
                !wizard.datosBasicos.tipoCiclo
                  ? 'text-muted-foreground font-normal italic opacity-70' // Es Placeholder
                  : 'font-medium not-italic', // Tiene Valor (Medium)
              )}
            >
              <SelectValue placeholder="Ej. Semestre" />
            </SelectTrigger>
            <SelectContent>
              {TIPOS_CICLO.map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-1">
          <Label htmlFor="numCiclos">Número de ciclos</Label>
          <Input
            id="numCiclos"
            type="number"
            min={1}
            value={wizard.datosBasicos.numCiclos ?? ''}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              onChange((w) => ({
                ...w,
                datosBasicos: {
                  ...w.datosBasicos,
                  // Keep undefined when the input is empty so the field stays optional
                  numCiclos:
                    e.target.value === '' ? undefined : Number(e.target.value),
                },
              }))
            }
            className="placeholder:text-muted-foreground/70 font-medium not-italic placeholder:font-normal placeholder:italic"
            placeholder="Ej. 8"
          />
        </div>
      </div>
      <Separator className="my-3" />
      <div className="grid gap-4 sm:grid-cols-2">
        <TemplateSelectorCard
          cardTitle="Plantilla de plan de estudios"
          cardDescription="Selecciona el Word para tu nuevo plan."
          templatesData={PLANTILLAS_ANEXO_1}
          selectedTemplateId={wizard.datosBasicos.plantillaPlanId || ''}
          selectedVersion={wizard.datosBasicos.plantillaPlanVersion || ''}
          onChange={({ templateId, version }) =>
            onChange((w) => ({
              ...w,
              datosBasicos: {
                ...w.datosBasicos,
                plantillaPlanId: templateId,
                plantillaPlanVersion: version,
              },
            }))
          }
        />
        <TemplateSelectorCard
          cardTitle="Plantilla de mapa curricular"
          cardDescription="Selecciona el Excel para tu mapa curricular."
          templatesData={PLANTILLAS_ANEXO_2}
          selectedTemplateId={wizard.datosBasicos.plantillaMapaId || ''}
          selectedVersion={wizard.datosBasicos.plantillaMapaVersion || ''}
          onChange={({ templateId, version }) =>
            onChange((w) => ({
              ...w,
              datosBasicos: {
                ...w.datosBasicos,
                plantillaMapaId: templateId,
                plantillaMapaVersion: version,
              },
            }))
          }
        />
      </div>
    </div>
  )
}
