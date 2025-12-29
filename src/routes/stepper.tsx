import { createFileRoute } from '@tanstack/react-router'

import { defineStepper } from '@/components/stepper'
import { Button } from '@/components/ui/button'

export const Route = createFileRoute('/stepper')({
  component: MyFirstStepper,
})

const stepperInstance = defineStepper(
  { id: 'step-1', title: 'Step 1' },
  { id: 'step-2', title: 'Step 2' },
  { id: 'step-3', title: 'Step 3' },
)

export function MyFirstStepper() {
  return (
    <stepperInstance.Stepper.Provider className="space-y-4">
      {({ methods }) => (
        <>
          <stepperInstance.Stepper.Navigation>
            {methods.all.map((step) => (
              <stepperInstance.Stepper.Step
                of={step.id}
                onClick={() => methods.goTo(step.id)}
              >
                <stepperInstance.Stepper.Title>
                  {step.title}
                </stepperInstance.Stepper.Title>
              </stepperInstance.Stepper.Step>
            ))}
          </stepperInstance.Stepper.Navigation>
          {methods.switch({
            'step-1': (step) => <Content id={step.id} />,
            'step-2': (step) => <Content id={step.id} />,
            'step-3': (step) => <Content id={step.id} />,
          })}
          <stepperInstance.Stepper.Controls>
            {!methods.isLast && (
              <Button
                type="button"
                variant="secondary"
                onClick={methods.prev}
                disabled={methods.isFirst}
              >
                Previous
              </Button>
            )}
            <Button onClick={methods.isLast ? methods.reset : methods.next}>
              {methods.isLast ? 'Reset' : 'Next'}
            </Button>
          </stepperInstance.Stepper.Controls>
        </>
      )}
    </stepperInstance.Stepper.Provider>
  )
}

const Content = ({ id }: { id: string }) => {
  return (
    <stepperInstance.Stepper.Panel className="h-50 content-center rounded border bg-slate-50 p-8">
      <p className="text-xl font-normal">Content for {id}</p>
    </stepperInstance.Stepper.Panel>
  )
}
