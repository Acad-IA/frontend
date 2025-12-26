import { createFileRoute } from '@tanstack/react-router'
import {
  Activity,
  BookOpenText,
  Calculator,
  FlaskConical,
  Laptop,
  PencilRuler,
  Plus,
  Scale,
  Stethoscope,
  X,
} from 'lucide-react'
import { useMemo, useState } from 'react'

import type { Option } from '@/components/planes/Filtro'

import BarraBusqueda from '@/components/planes/BarraBusqueda'
import Filtro from '@/components/planes/Filtro'
import PlanEstudiosCard from '@/components/planes/PlanEstudiosCard'

export const Route = createFileRoute('/planes')({
  component: RouteComponent,
})

function RouteComponent() {
  type Facultad = { id: string; nombre: string; color: string }
  type Carrera = { id: string; nombre: string; facultadId: string }
  type Plan = {
    id: string
    Icono: any
    nombrePrograma: string
    nivel: string
    ciclos: string
    facultadId: string
    carreraId: string
    estado:
      | 'Aprobado'
      | 'Pendiente'
      | 'En proceso'
      | 'Revisión expertos'
      | 'Actualización'
    claseColorEstado: string
  }

  // Simulación: datos provenientes de Supabase (hardcode)
  const facultades: Array<Facultad> = [
    { id: 'ing', nombre: 'Facultad de Ingeniería', color: '#2563eb' },
    { id: 'med', nombre: 'Facultad de Medicina', color: '#dc2626' },
    { id: 'neg', nombre: 'Facultad de Negocios', color: '#059669' },
    {
      id: 'arq',
      nombre: 'Facultad Mexicana de Arquitectura, Diseño y Comunicación',
      color: '#ea580c',
    },
    {
      id: 'sal',
      nombre: 'Escuela de Altos Estudios en Salud',
      color: '#0891b2',
    },
    { id: 'der', nombre: 'Facultad de Derecho', color: '#7c3aed' },
    { id: 'qui', nombre: 'Facultad de Ciencias Químicas', color: '#65a30d' },
  ]

  const carreras: Array<Carrera> = [
    {
      id: 'sis',
      nombre: 'Ingeniería en Sistemas Computacionales',
      facultadId: 'ing',
    },
    { id: 'medico', nombre: 'Médico Cirujano', facultadId: 'med' },
    { id: 'act', nombre: 'Licenciatura en Actuaría', facultadId: 'neg' },
    { id: 'arq', nombre: 'Licenciatura en Arquitectura', facultadId: 'arq' },
    { id: 'fisio', nombre: 'Licenciatura en Fisioterapia', facultadId: 'sal' },
    { id: 'der', nombre: 'Licenciatura en Derecho', facultadId: 'der' },
    { id: 'qfb', nombre: 'Químico Farmacéutico Biólogo', facultadId: 'qui' },
  ]

  const estados: Array<Option> = [
    { value: 'todos', label: 'Todos los estados' },
    { value: 'Aprobado', label: 'Aprobado' },
    { value: 'Pendiente', label: 'Pendiente' },
    { value: 'En proceso', label: 'En proceso' },
    { value: 'Revisión expertos', label: 'Revisión expertos' },
    { value: 'Actualización', label: 'Actualización' },
  ]

  const planes: Array<Plan> = [
    {
      id: 'p1',
      Icono: Laptop,
      nombrePrograma: 'Ingeniería en Sistemas Computacionales',
      nivel: 'Licenciatura',
      ciclos: '8 semestres',
      facultadId: 'ing',
      carreraId: 'sis',
      estado: 'Revisión expertos',
      claseColorEstado: 'bg-amber-600',
    },
    {
      id: 'p2',
      Icono: Stethoscope,
      nombrePrograma: 'Médico Cirujano',
      nivel: 'Licenciatura',
      ciclos: '10 semestres',
      facultadId: 'med',
      carreraId: 'medico',
      estado: 'Aprobado',
      claseColorEstado: 'bg-emerald-600',
    },
    {
      id: 'p3',
      Icono: Calculator,
      nombrePrograma: 'Licenciatura en Actuaría',
      nivel: 'Licenciatura',
      ciclos: '9 semestres',
      facultadId: 'neg',
      carreraId: 'act',
      estado: 'Aprobado',
      claseColorEstado: 'bg-emerald-600',
    },
    {
      id: 'p4',
      Icono: PencilRuler,
      nombrePrograma: 'Licenciatura en Arquitectura',
      nivel: 'Licenciatura',
      ciclos: '10 semestres',
      facultadId: 'arq',
      carreraId: 'arq',
      estado: 'En proceso',
      claseColorEstado: 'bg-orange-500',
    },
    {
      id: 'p5',
      Icono: Activity,
      nombrePrograma: 'Licenciatura en Fisioterapia',
      nivel: 'Licenciatura',
      ciclos: '8 semestres',
      facultadId: 'sal',
      carreraId: 'fisio',
      estado: 'Revisión expertos',
      claseColorEstado: 'bg-amber-600',
    },
    {
      id: 'p6',
      Icono: Scale,
      nombrePrograma: 'Licenciatura en Derecho',
      nivel: 'Licenciatura',
      ciclos: '10 semestres',
      facultadId: 'der',
      carreraId: 'der',
      estado: 'Pendiente',
      claseColorEstado: 'bg-yellow-500',
    },
    {
      id: 'p7',
      Icono: FlaskConical,
      nombrePrograma: 'Químico Farmacéutico Biólogo',
      nivel: 'Licenciatura',
      ciclos: '9 semestres',
      facultadId: 'qui',
      carreraId: 'qfb',
      estado: 'Actualización',
      claseColorEstado: 'bg-lime-600',
    },
  ]

  // Estado de filtros
  const [search, setSearch] = useState('')
  const [facultadSel, setFacultadSel] = useState<string>('todas')
  const [carreraSel, setCarreraSel] = useState<string>('todas')
  const [estadoSel, setEstadoSel] = useState<string>('todos')

  // Opciones para filtros
  const facultadesOptions: Array<Option> = useMemo(
    () => [
      { value: 'todas', label: 'Todas las facultades' },
      ...facultades.map((f) => ({ value: f.id, label: f.nombre })),
    ],
    [facultades],
  )

  const carrerasOptions: Array<Option> = useMemo(() => {
    const list =
      facultadSel === 'todas'
        ? carreras
        : carreras.filter((c) => c.facultadId === facultadSel)
    return [
      { value: 'todas', label: 'Todas las carreras' },
      ...list.map((c) => ({ value: c.id, label: c.nombre })),
    ]
  }, [carreras, facultadSel])

  // Filtrado de planes
  const filteredPlans = useMemo(() => {
    const term = search.trim().toLowerCase()
    return planes.filter((p) => {
      const matchName = term
        ? p.nombrePrograma.toLowerCase().includes(term)
        : true
      const matchFac =
        facultadSel === 'todas' ? true : p.facultadId === facultadSel
      const matchCar =
        carreraSel === 'todas' ? true : p.carreraId === carreraSel
      const matchEst = estadoSel === 'todos' ? true : p.estado === estadoSel
      return matchName && matchFac && matchCar && matchEst
    })
  }, [planes, search, facultadSel, carreraSel, estadoSel])

  const resetFilters = () => {
    setSearch('')
    setFacultadSel('todas')
    setCarreraSel('todas')
    setEstadoSel('todos')
  }

  return (
    <main className="bg-background min-h-screen w-full">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-6 md:px-6 lg:px-8">
        <div className="flex flex-col gap-4 lg:col-span-3">
          <div className="flex flex-col items-stretch justify-between gap-4 sm:flex-row sm:items-center">
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 text-primary flex h-10 w-10 items-center justify-center rounded-xl">
                <BookOpenText className="h-5 w-5" strokeWidth={2} />
              </div>

              <div>
                <h1 className="font-display text-foreground text-2xl font-bold">
                  Planes de Estudio
                </h1>
                <p className="text-muted-foreground text-sm">
                  Gestiona los planes curriculares de tu institución
                </p>
              </div>
            </div>

            <button
              type="button"
              className={
                'ring-offset-background focus-visible:ring-ring bg-primary text-primary-foreground hover:bg-primary/90 inline-flex h-11 items-center justify-center gap-2 rounded-md px-8 text-sm font-medium whitespace-nowrap shadow-md transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:h-4 [&_svg]:w-4 [&_svg]:shrink-0'
              }
              aria-label="Nuevo plan de estudios"
              title="Nuevo plan de estudios"
            >
              <Plus className="" />
              Nuevo plan de estudios
            </button>
          </div>
          <div className="flex flex-col items-stretch gap-2 lg:flex-row lg:items-center">
            <div className="min-w-0 flex-1">
              <BarraBusqueda
                value={search}
                onChange={setSearch}
                placeholder="Buscar por programa…"
              />
            </div>

            <div className="flex flex-col items-stretch justify-between gap-2 lg:flex-row lg:items-center">
              <div className="w-full lg:w-44">
                <Filtro
                  options={facultadesOptions}
                  value={facultadSel}
                  onChange={(v) => {
                    setFacultadSel(v)
                    // Reset carrera si ya no pertenece
                    setCarreraSel('todas')
                  }}
                  placeholder="Facultad"
                  ariaLabel="Filtro por facultad"
                />
              </div>
              <div className="w-full lg:w-44">
                <Filtro
                  options={carrerasOptions}
                  value={carreraSel}
                  onChange={setCarreraSel}
                  placeholder="Carrera"
                  ariaLabel="Filtro por carrera"
                />
              </div>
              <div className="w-full lg:w-44">
                <Filtro
                  options={estados}
                  value={estadoSel}
                  onChange={setEstadoSel}
                  placeholder="Estado"
                  ariaLabel="Filtro por estado"
                />
              </div>

              <button
                type="button"
                onClick={resetFilters}
                className={
                  'ring-offset-background focus-visible:ring-ring bg-secondary text-secondary-foreground hover:bg-secondary/90 inline-flex h-9 items-center justify-center gap-2 rounded-md px-4 text-sm font-medium whitespace-nowrap shadow-md transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50'
                }
                title="Reiniciar filtros"
                aria-label="Reiniciar filtros"
              >
                <X className="h-4 w-4" />
                Limpiar
              </button>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredPlans.map((p) => {
              const fac = facultades.find((f) => f.id === p.facultadId)!
              return (
                <PlanEstudiosCard
                  key={p.id}
                  Icono={p.Icono}
                  nombrePrograma={p.nombrePrograma}
                  nivel={p.nivel}
                  ciclos={p.ciclos}
                  facultad={fac.nombre}
                  estado={p.estado}
                  claseColorEstado={p.claseColorEstado}
                  colorFacultad={fac.color}
                  onClick={() => console.log('Ver', p.nombrePrograma)}
                />
              )
            })}
          </div>
        </div>
      </div>
    </main>
  )
}
