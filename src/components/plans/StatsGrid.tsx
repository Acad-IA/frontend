import { StatCard } from "./StatCard";

export function StatsGrid() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      <StatCard icon="📘" value="12" label="Planes Activos" />
      <StatCard icon="🕒" value="4" label="En Revisión" />
      <StatCard icon="✅" value="8" label="Aprobados" />
      <StatCard icon="👥" value="6" label="Carreras" />
    </div>
  )
}
