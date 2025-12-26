export function StatCard({ icon, value, label }: any) {
  return (
    <div className="bg-white rounded-xl border p-6">
      <div className="flex items-center gap-3 mb-2">
        <span className="text-xl">{icon}</span>
        <span className="text-2xl font-semibold">{value}</span>
      </div>
      <p className="text-sm text-gray-500">{label}</p>
    </div>
  )
}
