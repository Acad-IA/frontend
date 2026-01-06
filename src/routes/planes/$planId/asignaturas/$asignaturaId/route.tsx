import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute(
  '/planes/$planId/asignaturas/$asignaturaId'
)({
  component: RouteComponent,
})

function RouteComponent() {
  const { planId, asignaturaId } = Route.useParams()

  return (
    <div>
      Plan: {planId} <br />
      Asignatura: {asignaturaId}
    </div>
  )
}
