export function StatusBadge({ status }: { status: string }) {
  const styles: any = {
    revision: 'bg-blue-100 text-blue-700',
    aprobado: 'bg-green-100 text-green-700',
    borrador: 'bg-gray-200 text-gray-600',
  }

  return (
    <span
      className={`text-xs px-3 py-1 rounded-full font-medium ${styles[status]}`}
    >
      {status === 'revision'
        ? 'En Revisión'
        : status === 'aprobado'
        ? 'Aprobado'
        : 'Borrador'}
    </span>
  )
}
