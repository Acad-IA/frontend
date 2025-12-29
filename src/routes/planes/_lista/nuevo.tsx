import { createFileRoute, useNavigate } from '@tanstack/react-router'

import CheckoutStepper from '@/components/planes/exampleStepper'
import { Dialog, DialogContent } from '@/components/ui/dialog'

export const Route = createFileRoute('/planes/_lista/nuevo')({
  component: NuevoPlanModal,
})

function NuevoPlanModal() {
  const navigate = useNavigate()

  const handleClose = () => {
    // Navegamos de regreso a la lista manteniendo el scroll donde estaba
    navigate({ to: '/planes', resetScroll: false })
  }

  return (
    <Dialog open={true} onOpenChange={(open) => !open && handleClose()}>
      {/* DialogContent es la "caja" blanca del modal. 
         Le damos un ancho máximo un poco mayor a tu stepper (que mide 450px)
         para que quepa cómodamente.
      */}
      <DialogContent className="p-6 sm:max-w-[500px]">
        <CheckoutStepper />
      </DialogContent>
    </Dialog>
  )
}
