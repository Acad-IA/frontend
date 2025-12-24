import { StatusBadge } from "./StatusBadge";

export function PlanCard({ plan }: any) {
  return (
    <div className="bg-[#eaf6fa] rounded-2xl p-6 border hover:shadow-md transition">
      <div className="flex justify-between items-start mb-4">
        <span className="text-sm text-gray-500">⚙ Ingeniería</span>
        <StatusBadge status={plan.status} />
      </div>

      <h3 className="text-lg font-semibold text-gray-900">
        {plan.title}
      </h3>

      <p className="text-sm text-gray-600 mb-6">
        {plan.subtitle}
      </p>

      <div className="flex justify-between text-sm text-gray-500">
        <span>{plan.cycles} ciclos</span>
        <span>{plan.credits} créditos</span>
        <span>➜</span>
      </div>
    </div>
  )
}
