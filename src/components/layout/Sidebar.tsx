import { LayoutGrid, BookOpen } from 'lucide-react'

export function Sidebar() {
  return (
    <aside className="w-64 bg-white border-r px-4 py-6">
      <h2 className="text-lg font-semibold mb-6">
        Planes de Estudio
      </h2>

      <nav className="space-y-2">
        <NavItem icon={LayoutGrid} label="Dashboard" active />
        <NavItem icon={BookOpen} label="Planes" />
      </nav>
    </aside>
  )
}

function NavItem({ icon: Icon, label, active }: any) {
  return (
    <div
      className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer
        ${
          active
            ? 'bg-gray-100 text-gray-900'
            : 'text-gray-500 hover:bg-gray-50'
        }`}
    >
      <Icon size={18} />
      <span className="text-sm font-medium">{label}</span>
    </div>
  )
}
