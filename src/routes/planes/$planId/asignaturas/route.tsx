import { createFileRoute, Outlet } from '@tanstack/react-router'

export const Route = createFileRoute('/planes/$planId/asignaturas')({
  component: AsignaturasLayout,
})

function AsignaturasLayout() {
  return <Outlet />
}
