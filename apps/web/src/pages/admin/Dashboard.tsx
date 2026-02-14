import { Package, AlertTriangle, ShoppingBag, Boxes, Loader2 } from 'lucide-react';
import { trpc } from '../../utils/trpc';
import { Link } from 'react-router-dom';

export function Dashboard() {
  const { data: stats, isLoading: statsLoading } = trpc.getInventoryStats.useQuery();
  const { data: lowStockProducts, isLoading: lowStockLoading } = trpc.getLowStockProducts.useQuery();
  const { data: orders } = trpc.getOrders.useQuery();

  const totalRevenue = orders?.reduce((sum, order) => sum + Number(order.total), 0) ?? 0;

  const statCards = [
    { 
      name: 'Total Revenue', 
      value: statsLoading ? '...' : `$${totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, 
      icon: ShoppingBag, 
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
    },
    { 
      name: 'Total Products', 
      value: statsLoading ? '...' : `${stats?.totalProducts ?? 0}`, 
      icon: Boxes, 
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
    { 
      name: 'Low Stock', 
      value: statsLoading ? '...' : `${stats?.lowStock ?? 0}`, 
      icon: AlertTriangle, 
      color: 'text-amber-500',
      bgColor: 'bg-amber-500/10',
    },
    { 
      name: 'Out of Stock', 
      value: statsLoading ? '...' : `${stats?.outOfStock ?? 0}`, 
      icon: Package, 
      color: 'text-red-500',
      bgColor: 'bg-red-500/10',
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 font-libre-bodoni transition-colors">Dashboard</h1>
        <p className="text-gray-500 dark:text-gray-400 font-exo-2 transition-colors">Welcome back to your store overview.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => (
          <div key={stat.name} className="bg-white dark:bg-[#1a2333] border border-gray-200 dark:border-[#F0E6CA]/10 p-6 rounded-2xl shadow-sm transition-colors duration-300">
            <div className="flex items-center justify-between mb-4">
              <span className="text-gray-500 dark:text-gray-400 font-medium font-exo-2 transition-colors text-sm">{stat.name}</span>
              <div className={`w-10 h-10 rounded-xl ${stat.bgColor} flex items-center justify-center`}>
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
            </div>
            <p className="text-3xl font-black text-gray-900 dark:text-white font-libre-bodoni transition-colors">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Low Stock Alert Table */}
      <div className="bg-white dark:bg-[#1a2333] border border-gray-200 dark:border-[#F0E6CA]/10 rounded-2xl shadow-sm transition-colors duration-300 overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-[#F0E6CA]/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-[#F0E6CA] font-libre-bodoni transition-colors">Inventory Alerts</h2>
          </div>
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider font-exo-2">
            {lowStockProducts?.length ?? 0} items need attention
          </span>
        </div>
        
        {lowStockLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        ) : !lowStockProducts || lowStockProducts.length === 0 ? (
          <div className="text-gray-500 dark:text-gray-400 text-center py-12 font-exo-2 transition-colors">
            <Package className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-700" />
            <p className="font-bold">All stocked up!</p>
            <p className="text-sm text-gray-400">No products are running low.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-[#F0E6CA]/10">
                  <th className="text-left px-6 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider font-exo-2">Product</th>
                  <th className="text-left px-6 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider font-exo-2">Series</th>
                  <th className="text-left px-6 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider font-exo-2">Category</th>
                  <th className="text-center px-6 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider font-exo-2">Stock</th>
                  <th className="text-right px-6 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider font-exo-2">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-[#F0E6CA]/5">
                {lowStockProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50 dark:hover:bg-[#0a0f1c]/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-[#0a0f1c] overflow-hidden border border-gray-200 dark:border-[#F0E6CA]/10 flex-shrink-0">
                          {product.imageUrl && (
                            <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                          )}
                        </div>
                        <span className="font-bold text-sm text-gray-900 dark:text-gray-100 font-exo-2 transition-colors truncate max-w-[200px]">
                          {product.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 font-exo-2">{product.anime.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 font-exo-2">{product.category.name}</td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-black font-exo-2 ${
                        product.stock === 0 
                          ? 'bg-red-500/10 text-red-500 border border-red-500/20' 
                          : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                      }`}>
                        {product.stock === 0 ? 'OUT' : product.stock}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link 
                        to={`/admin/products/edit/${product.id}`}
                        className="text-xs font-bold text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-[#F0E6CA] uppercase tracking-wider font-exo-2 transition-colors"
                      >
                        Edit →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
