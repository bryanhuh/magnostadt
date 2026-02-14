import { trpc } from '../../utils/trpc';
import { toast } from 'sonner';
import { Package, Clock, CheckCircle, XCircle } from 'lucide-react';

export function AdminOrders() {
  const utils = trpc.useUtils();
  const { data: orders, isLoading } = trpc.getOrders.useQuery();

  const updateStatus = trpc.updateOrderStatus.useMutation({
    onSuccess: () => {
      toast.success('Order status updated');
      utils.getOrders.invalidate();
    },
    onError: (error) => {
      toast.error(`Error updating status: ${error.message}`);
    }
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'text-yellow-500 bg-yellow-500/10 border border-yellow-500/20';
      case 'SHIPPED': return 'text-blue-400 bg-blue-500/10 border border-blue-500/20';
      case 'DELIVERED': return 'text-green-500 bg-green-500/10 border border-green-500/20';
      case 'CANCELLED': return 'text-red-500 bg-red-500/10 border border-red-500/20';
      default: return 'text-gray-400 bg-gray-500/10 border border-gray-500/20';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING': return Clock;
      case 'SHIPPED': return Package;
      case 'DELIVERED': return CheckCircle;
      case 'CANCELLED': return XCircle;
      default: return Clock;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white font-libre-bodoni transition-colors">Orders</h1>
        <p className="text-gray-500 dark:text-gray-400 font-exo-2 transition-colors">Manage customer orders</p>
      </div>

      <div className="bg-white dark:bg-[#1a2333] border border-gray-200 dark:border-[#F0E6CA]/10 rounded-xl overflow-hidden shadow-sm transition-colors duration-300">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-500 dark:text-gray-400 font-exo-2 transition-colors">
            <thead className="bg-gray-100 dark:bg-[#0a0f1c] uppercase font-bold text-xs text-gray-900 dark:text-[#F0E6CA] transition-colors">
              <tr>
                <th className="px-6 py-4">Order ID</th>
                <th className="px-6 py-4">Customer</th>
                <th className="px-6 py-4">Total ($)</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-[#F0E6CA]/5 transition-colors">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">Loading...</td>
                </tr>
              ) : orders?.length === 0 ? (
                <tr>
                   <td colSpan={5} className="px-6 py-8 text-center text-gray-500">No orders found.</td>
                </tr>
              ) : (
                orders?.map((order) => {
                  const StatusIcon = getStatusIcon(order.status);
                  return (
                    <tr key={order.id} className="hover:bg-gray-50 dark:hover:bg-[#0a0f1c]/50 transition-colors border-b border-gray-200 dark:border-[#F0E6CA]/5 last:border-0">
                      <td className="px-6 py-4 font-mono text-xs text-gray-500 dark:text-gray-500">{order.id}</td>
                      <td className="px-6 py-4">
                        <div className="text-gray-900 dark:text-white font-medium transition-colors">{order.customerName}</div>
                        <div className="text-xs text-gray-500">{order.email}</div>
                      </td>
                      <td className="px-6 py-4 text-gray-900 dark:text-[#F0E6CA] font-bold transition-colors">
                        ${Number(order.total).toFixed(2)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                           <span className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-bold ${getStatusColor(order.status)}`}>
                             <StatusIcon className="w-3 h-3" />
                             {order.status}
                           </span>
                           <select 
                             className="bg-gray-50 dark:bg-[#0a0f1c] border border-gray-200 dark:border-[#F0E6CA]/10 text-xs rounded text-gray-900 dark:text-white p-1 focus:outline-none focus:border-gray-900 dark:focus:border-[#F0E6CA] transition-colors font-exo-2"
                             value={order.status}
                             onChange={(e) => updateStatus.mutate({ 
                               id: order.id, 
                               status: e.target.value as any 
                             })}
                           >
                             <option value="PENDING">PENDING</option>
                             <option value="SHIPPED">SHIPPED</option>
                             <option value="DELIVERED">DELIVERED</option>
                             <option value="CANCELLED">CANCELLED</option>
                           </select>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-400">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
