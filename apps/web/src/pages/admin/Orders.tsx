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
      case 'PENDING': return 'text-yellow-500 bg-yellow-950/30';
      case 'SHIPPED': return 'text-blue-500 bg-blue-950/30';
      case 'DELIVERED': return 'text-green-500 bg-green-950/30';
      case 'CANCELLED': return 'text-red-500 bg-red-950/30';
      default: return 'text-gray-500 bg-gray-950/30';
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
        <h1 className="text-3xl font-bold text-white">Orders</h1>
        <p className="text-gray-400">Manage customer orders</p>
      </div>

      <div className="bg-gray-950 border border-gray-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-400">
            <thead className="bg-gray-900 uppercase font-bold text-xs">
              <tr>
                <th className="px-6 py-4">Order ID</th>
                <th className="px-6 py-4">Customer</th>
                <th className="px-6 py-4">Total</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center">Loading...</td>
                </tr>
              ) : orders?.length === 0 ? (
                <tr>
                   <td colSpan={5} className="px-6 py-8 text-center">No orders found.</td>
                </tr>
              ) : (
                orders?.map((order) => {
                  const StatusIcon = getStatusIcon(order.status);
                  return (
                    <tr key={order.id} className="hover:bg-gray-900/50 transition-colors">
                      <td className="px-6 py-4 font-mono text-xs">{order.id}</td>
                      <td className="px-6 py-4">
                        <div className="text-white font-medium">{order.customerName}</div>
                        <div className="text-xs">{order.email}</div>
                      </td>
                      <td className="px-6 py-4 text-white font-bold">
                        ${Number(order.total).toFixed(2)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                           <span className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-bold ${getStatusColor(order.status)}`}>
                             <StatusIcon className="w-3 h-3" />
                             {order.status}
                           </span>
                           <select 
                             className="bg-gray-900 border border-gray-700 text-xs rounded text-white p-1 focus:outline-none focus:border-yellow-500"
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
                      <td className="px-6 py-4">
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
