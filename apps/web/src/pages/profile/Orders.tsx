import { trpc } from '../../utils/trpc';
import { Loader2, Package } from 'lucide-react';
import { formatPrice } from '../../utils/format';
import { Link } from 'react-router-dom';

export function Orders() {
  const { data: orders, isLoading } = trpc.myOrders.useQuery();

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-yellow-500" />
      </div>
    );
  }

  if (!orders || orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
        <Package className="w-16 h-16 text-gray-200 mb-4" />
        <h3 className="text-xl font-black uppercase text-gray-400">No Orders Yet</h3>
        <p className="text-gray-400 mt-2">Time to start your collection!</p>
        <Link 
          to="/shop" 
          className="mt-6 px-6 py-2 bg-black text-white rounded-lg hover:bg-yellow-500 hover:text-black font-bold uppercase tracking-wide transition-all"
        >
          Browse Shop
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {orders.map((order) => (
        <div key={order.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition-shadow">
          {/* Header */}
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex flex-wrap gap-4 justify-between items-center">
             <div className="flex gap-8">
               <div>
                 <span className="block text-xs font-bold text-gray-400 uppercase tracking-wide">Order Placed</span>
                 <span className="font-bold">{new Date(order.createdAt).toLocaleDateString()}</span>
               </div>
               <div>
                 <span className="block text-xs font-bold text-gray-400 uppercase tracking-wide">Total</span>
                 <span className="font-bold text-yellow-600">{formatPrice(Number(order.total))}</span>
               </div>
               <div>
                 <span className="block text-xs font-bold text-gray-400 uppercase tracking-wide">Status</span>
                 <span className={`font-bold uppercase text-xs px-2 py-0.5 rounded-full
                   ${order.status === 'DELIVERED' ? 'bg-green-100 text-green-600' : 
                     order.status === 'SHIPPED' ? 'bg-blue-100 text-blue-600' :
                     order.status === 'CANCELLED' ? 'bg-red-100 text-red-600' :
                     'bg-yellow-100 text-yellow-600'}`}>
                   {order.status}
                 </span>
               </div>
             </div>
             <div className="text-xs font-mono text-gray-400">
               #{order.id.slice(-8)}
             </div>
          </div>

          {/* Items */}
          <div className="p-6">
            <div className="space-y-4">
              {order.items.map((item) => (
                <div key={item.id} className="flex gap-4">
                  <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 border border-gray-200">
                    <img 
                      src={item.product.imageUrl || ''} 
                      alt={item.product.name} 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1">
                    <Link to={`/product/${item.product.slug}`} className="font-bold hover:text-yellow-600 transition-colors line-clamp-1">
                      {item.product.name}
                    </Link>
                    <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                  </div>
                  <div className="font-bold">
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
