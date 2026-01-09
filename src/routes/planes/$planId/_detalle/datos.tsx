import { usePlan } from '@/data';
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/planes/$planId/_detalle/datos')({
  component: DatosGenerales,
})

function DatosGenerales() {
  const {data, isFetching} = usePlan('0e0aea4d-b8b4-4e75-8279-6224c3ac769f');
  if(!isFetching && !data) {
    return <div>No se encontró el plan de estudios.</div>
  }
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card title="Objetivo General">
        Formar profesionales altamente capacitados...
      </Card>

      <Card title="Perfil de Ingreso">
        Egresados de educación media superior...
      </Card>

      <Card title="Perfil de Egreso">
        Profesional capaz de diseñar...
      </Card>

      <Card title="Competencias Genéricas">
        Pensamiento crítico, comunicación efectiva...
      </Card>
    </div>
  )
}

interface CustomCardProps {
  title: string;
  children: React.ReactNode;
}

function Card({ title, children }: CustomCardProps) {
  return (
    <div className="rounded-lg border bg-white p-4">
      <h3 className="font-semibold mb-2">{title}</h3>
      <p className="text-sm text-gray-600">{children}</p>
    </div>
  )
}
