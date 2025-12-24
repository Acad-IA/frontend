import { PlanCard } from './PlanCard'

const mockPlans = [
  {
    id: 1,
    name: 'Ingeniería en Sistemas',
    level: 'Licenciatura',
    status: 'Activo',
  },
  {
    id: 2,
    name: 'Arquitectura',
    level: 'Licenciatura',
    status: 'Activo',
  },
  {
    id: 3,
    name: 'Maestría en Educación',
    level: 'Maestría',
    status: 'Inactivo',
  },
]

export function PlanGrid() {
  return (
    <div>
      <h2 className="text-lg font-semibold mb-4">
        Planes disponibles
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {mockPlans.map(plan => (
          <PlanCard key={plan.id} plan={plan} />
        ))}
      </div>
    </div>
  )
}
