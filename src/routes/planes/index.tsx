import { createFileRoute } from '@tanstack/react-router'
import { AppLayout } from '@/components/layout/AppLayout'
import { PlanGrid } from '@/components/plans/PlanGrid'

export const Route = createFileRoute('/planes/')({
  component: PlanesPage,
})

function PlanesPage() {
  return (
    <AppLayout>
      <PlanGrid />
    </AppLayout>
  )
}
