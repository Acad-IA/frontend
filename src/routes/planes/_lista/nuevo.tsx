import { createFileRoute } from '@tanstack/react-router'

import NuevoPlanModalContainer from '@/features/planes/nuevo/NuevoPlanModalContainer'

export const Route = createFileRoute('/planes/_lista/nuevo')({
  component: NuevoPlanModalContainer,
})
