import { DollarSign, ShoppingBag, Package } from 'lucide-react';

export function Dashboard() {
  const stats = [
    { name: 'Total Revenue', value: '$12,345.00', icon: DollarSign, color: 'text-green-500' },
    { name: 'Total Orders', value: '156', icon: ShoppingBag, color: 'text-blue-500' },
    { name: 'Low Stock Items', value: '4', icon: Package, color: 'text-red-500' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
        <p className="text-gray-400">Welcome back to your store overview.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat) => (
          <div key={stat.name} className="bg-gray-950 border border-gray-800 p-6 rounded-2xl">
            <div className="flex items-center justify-between mb-4">
              <span className="text-gray-400 font-medium">{stat.name}</span>
              <stat.icon className={`w-6 h-6 ${stat.color}`} />
            </div>
            <p className="text-3xl font-black text-white">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Recent Activity Placeholder */}
      <div className="bg-gray-950 border border-gray-800 rounded-2xl p-6">
        <h2 className="text-xl font-bold text-white mb-6">Recent Activity</h2>
        <div className="text-gray-500 text-center py-8">
          No recent orders to show.
        </div>
      </div>
    </div>
  );
}
