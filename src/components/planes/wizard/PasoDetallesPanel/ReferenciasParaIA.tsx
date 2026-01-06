import { FileText, FolderOpen, Upload } from 'lucide-react'

import { FileDropzone } from './FileDropZone'

import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  TabsContents,
} from '@/components/ui/motion-tabs'
import { ARCHIVOS, REPOSITORIOS } from '@/features/planes/nuevo/catalogs'

const tabs = [
  {
    name: 'Archivos existentes',

    value: 'archivos-existentes',

    icon: FileText,

    content: (
      <div className="flex flex-col gap-0.5">
        {ARCHIVOS.map((archivo) => (
          <Label
            key={archivo.id}
            className="border-border hover:border-primary/30 hover:bg-accent/50 m-0.5 flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors has-[[aria-checked=true]]:border-blue-600 has-[[aria-checked=true]]:bg-blue-50 dark:has-[[aria-checked=true]]:border-blue-900 dark:has-[[aria-checked=true]]:bg-blue-950"
          >
            <Checkbox className="peer border-primary ring-offset-background data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground focus-visible:ring-ring h-5 w-5 shrink-0 rounded-sm border focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50" />

            <FileText className="text-muted-foreground h-4 w-4" />

            <div className="min-w-0 flex-1">
              <p className="text-foreground truncate text-sm font-medium">
                {archivo.nombre}
              </p>

              <p className="text-muted-foreground text-xs">{archivo.tamaño}</p>
            </div>
          </Label>
        ))}
      </div>
    ),
  },

  {
    name: 'Repositorios',

    value: 'repositorios',

    icon: FolderOpen,

    content: (
      <div className="flex flex-col gap-0.5">
        {REPOSITORIOS.map((repositorio) => (
          <Label
            key={repositorio.id}
            className="border-border hover:border-primary/30 hover:bg-accent/50 m-0.5 flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors has-[[aria-checked=true]]:border-blue-600 has-[[aria-checked=true]]:bg-blue-50 dark:has-[[aria-checked=true]]:border-blue-900 dark:has-[[aria-checked=true]]:bg-blue-950"
          >
            <Checkbox className="peer border-primary ring-offset-background data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground focus-visible:ring-ring h-5 w-5 shrink-0 rounded-sm border focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50" />

            <FolderOpen className="text-muted-foreground h-4 w-4" />
            <div className="min-w-0 flex-1">
              <p className="text-foreground text-sm font-medium">
                {repositorio.nombre}
              </p>

              <p className="text-muted-foreground text-xs">
                {repositorio.descripcion} · {repositorio.cantidadArchivos}{' '}
                archivos
              </p>
            </div>
          </Label>
        ))}
      </div>
    ),
  },

  {
    name: 'Subir archivos',

    value: 'subir-archivos',

    icon: Upload,

    content: (
      <div>
        <FileDropzone
          // onFilesChange={(files) =>
          //   handleChange("archivosAdhocIds", files.map((f) => f.id))
          // }
          title="Sube archivos de referencia"
          description="Documentos que serán usados como contexto para la generación"
        />
      </div>
    ),
  },
]

const ReferenciasParaIA = () => {
  return (
    <div className="flex w-full flex-col gap-1">
      <Label>Referencias para la IA</Label>

      <Tabs defaultValue="archivos-existentes" className="gap-4">
        <TabsList className="w-full">
          {tabs.map(({ icon: Icon, name, value }) => (
            <TabsTrigger
              key={value}
              value={value}
              className="flex items-center gap-1 px-2.5 sm:px-3"
            >
              <Icon />

              <span className="hidden sm:inline">{name}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContents className="bg-background mx-1 -mt-2 mb-1 h-full rounded-sm">
          {tabs.map((tab) => (
            <TabsContent
              key={tab.value}
              value={tab.value}
              className="animate-in fade-in duration-300 ease-out"
            >
              {tab.content}
            </TabsContent>
          ))}
        </TabsContents>
      </Tabs>
    </div>
  )
}

export default ReferenciasParaIA
