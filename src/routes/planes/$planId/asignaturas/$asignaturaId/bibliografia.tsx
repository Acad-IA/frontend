import { createFileRoute, Outlet } from '@tanstack/react-router'

export const Route = createFileRoute(
  '/planes/$planId/asignaturas/$asignaturaId/bibliografia',
)({
  component: RouteComponent,
})

function RouteComponent() {
  return <Outlet />
}
