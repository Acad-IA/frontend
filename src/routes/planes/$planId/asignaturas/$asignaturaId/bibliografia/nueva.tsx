import { createFileRoute } from '@tanstack/react-router'

import { NuevaBibliografiaModalContainer } from '@/features/bibliografia/nueva/NuevaBibliografiaModalContainer'

export const Route = createFileRoute(
  '/planes/$planId/asignaturas/$asignaturaId/bibliografia/nueva',
)({
  component: NuevaBibliografiaModal,
})

function NuevaBibliografiaModal() {
  const { planId, asignaturaId } = Route.useParams()
  return (
    <NuevaBibliografiaModalContainer
      planId={planId}
      asignaturaId={asignaturaId}
    />
  )
}
