const StatCard = ({ label, value, icon = '📊', tone = 'text-gray-800' }) => (
  <div className="card p-5 flex items-center gap-4">
    <div className="w-12 h-12 rounded-xl bg-indigo-50 grid place-items-center text-xl">{icon}</div>
    <div>
      <p className="text-xs uppercase tracking-wide text-gray-500">{label}</p>
      <p className={`text-2xl font-semibold ${tone}`}>{value}</p>
    </div>
  </div>
)

export default StatCard
