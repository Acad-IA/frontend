export function Header() {
  return (
    <div className="flex items-center gap-4 bg-white border-b shadow-[0_1px_2px_rgba(0,0,0,0.05)] z-10 relative">
      <div className="h-12 w-12 rounded-full bg-emerald-600 flex items-center justify-center text-white">
        🎓
      </div>

      <div>
        <h1 className="text-xl font-semibold text-gray-900">
          Gestión Curricular
        </h1>
        <p className="text-sm text-gray-500">
          Sistema de Planes de Estudio
        </p>
      </div>
    </div>
  )
}
