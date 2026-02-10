import { trpc } from '../../utils/trpc';
import { Loader2, Package } from 'lucide-react';
import { formatPrice } from '../../utils/format';
import { Link } from 'react-router-dom';

export function Orders() {
  const { data: orders, isLoading } = trpc.myOrders.useQuery();

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600 dark:text-[#F0E6CA]" />
      </div>
    );
  }

  if (!orders || orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-gray-50 dark:bg-[#1a2333] rounded-2xl border-2 border-dashed border-gray-200 dark:border-[#F0E6CA]/10 transition-colors">
        <Package className="w-16 h-16 text-gray-200 dark:text-gray-700 mb-4" />
        <h3 className="text-xl font-black uppercase text-gray-400 dark:text-gray-500 font-exo-2">No Orders Yet</h3>
        <p className="text-gray-400 dark:text-gray-600 mt-2 font-exo-2">Time to start your collection!</p>
        <Link 
          to="/shop" 
          className="mt-6 px-6 py-2 bg-gray-900 dark:bg-[#F0E6CA] text-white dark:text-[#0a0f1c] rounded-lg hover:bg-gray-800 dark:hover:bg-white font-bold uppercase tracking-wide transition-all"
        >
          Browse Shop
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {orders.map((order) => (
        <div key={order.id} className="bg-white dark:bg-[#0a0f1c] border border-gray-200 dark:border-[#F0E6CA]/10 rounded-xl overflow-hidden hover:shadow-lg transition-all shadow-sm">
          {/* Header */}
          <div className="bg-gray-50 dark:bg-[#1a2333] px-6 py-4 border-b border-gray-100 dark:border-[#F0E6CA]/10 flex flex-wrap gap-4 justify-between items-center transition-colors">
             <div className="flex gap-8">
               <div>
                 <span className="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wide">Order Placed</span>
                 <span className="font-bold text-gray-900 dark:text-white">{new Date(order.createdAt).toLocaleDateString()}</span>
               </div>
               <div>
                 <span className="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wide">Total</span>
                 <span className="font-bold text-gray-900 dark:text-[#F0E6CA]">{formatPrice(Number(order.total))}</span>
               </div>
               <div>
                 <span className="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wide">Status</span>
                 <span className={`font-bold uppercase text-xs px-2 py-0.5 rounded-full
                   ${order.status === 'DELIVERED' ? 'bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400' : 
                     order.status === 'SHIPPED' ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' :
                     order.status === 'CANCELLED' ? 'bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400' :
                     'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400'}`}>
                   {order.status}
                 </span>
               </div>
             </div>
             <div className="text-xs font-mono text-gray-400 dark:text-gray-600">
               #{order.id.slice(-8)}
             </div>
          </div>

          {/* Items */}
          <div className="p-6">
            <div className="space-y-4">
              {order.items.map((item) => (
                <div key={item.id} className="flex gap-4">
                  <div className="w-16 h-16 bg-gray-100 dark:bg-[#1a2333] rounded-lg overflow-hidden flex-shrink-0 border border-gray-200 dark:border-[#F0E6CA]/10">
                    <img 
                      src={item.product.imageUrl || ''} 
                      alt={item.product.name} 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1">
                    <Link to={`/product/${item.product.slug}`} className="font-bold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-[#F0E6CA] transition-colors line-clamp-1">
                      {item.product.name}
                    </Link>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Qty: {item.quantity}</p>
                  </div>
                  <div className="font-bold text-gray-900 dark:text-[#F0E6CA]">
                    {formatPrice(Number(item.price))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
