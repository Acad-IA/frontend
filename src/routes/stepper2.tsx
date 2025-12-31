import { createFileRoute } from '@tanstack/react-router'

import { CircularProgress } from '@/components/CircularProgress'
import { defineStepper } from '@/components/stepper' // Tu wrapper
import { Button } from '@/components/ui/button'

export const Route = createFileRoute('/stepper2')({
  component: MobileStepperView,
})

// 1. Definimos los pasos igual que siempre
const myStepper = defineStepper(
  { id: 'contact', title: 'Contact Details' },
  { id: 'shipping', title: 'Shipping Information' },
  { id: 'billing', title: 'Billing Address' },
  { id: 'review', title: 'Payment Review' },
)

export default function MobileStepperView() {
  return (
    // Usa el Provider del wrapper para tener el contexto
    <myStepper.Stepper.Provider>
      {({ methods }) => {
        // Calculamos índices para el gráfico
        const currentIndex =
          methods.all.findIndex((s) => s.id === methods.current.id) + 1
        const totalSteps = methods.all.length
        const nextStep = methods.all[currentIndex] // El paso siguiente (si existe)

        return (
          <div className="flex h-full flex-col bg-white p-4">
            {/* --- AQUÍ ESTÁ LA MAGIA (Tu UI Personalizada) --- */}
            <div className="mb-6 flex items-center gap-4">
              {/* El Gráfico Circular */}
              <CircularProgress current={currentIndex} total={totalSteps} />

              {/* Los Textos */}
              <div className="flex flex-col">
                <h2 className="text-lg font-bold text-slate-900">
                  {methods.current.title}
                </h2>
                {nextStep && (
                  <p className="text-sm text-slate-400">
                    Next: {nextStep.title}
                  </p>
                )}
              </div>
            </div>
            {/* ----------------------------------------------- */}

            {/* El contenido de los pasos (Switch) */}
            <div className="flex-1">
              {methods.switch({
                contact: () => <div>Formulario Contacto...</div>,
                shipping: () => <div>Formulario Envío...</div>,
                billing: () => <div>Formulario Facturación...</div>,
                review: () => <div>Resumen...</div>,
              })}
            </div>

            {/* Controles de Navegación (Footer) */}
            <div className="mt-4 flex justify-between">
              <Button
                variant="ghost"
                onClick={methods.prev}
                disabled={methods.isFirst}
              >
                Back
              </Button>
              <Button
                className="bg-red-500 text-white hover:bg-red-600"
                onClick={methods.next}
              >
                {methods.isLast ? 'Finish' : 'Next'}
              </Button>
            </div>
          </div>
        )
      }}
    </myStepper.Stepper.Provider>
  )
}
