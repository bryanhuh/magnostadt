import { useEffect } from 'react';
import { formatPrice } from '../utils/format';
import { useParams, Link } from 'react-router-dom';
import { trpc } from '../utils/trpc';
import { Loader2, CheckCircle, Home } from 'lucide-react';
import { captureEvent } from '../utils/analytics';

export function OrderConfirmationPage() {
  const { id } = useParams<{ id: string }>();
  const { data: order, isLoading, error } = trpc.getOrderById.useQuery(
    { id: id! },
    { enabled: !!id }
  );

  useEffect(() => {
    if (order) {
      captureEvent('order_confirmation_viewed', {
        order_id: order.id,
        status: order.status
      });
    }
  }, [order]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-yellow-600" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-red-500">Order not found</h2>
        <Link to="/" className="text-yellow-500 hover:underline mt-4 inline-block">
          Return Home
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-12 text-center">
      <div className="flex justify-center mb-6">
        <CheckCircle className="w-24 h-24 text-green-500" />
      </div>
      
      <h1 className="text-4xl font-black text-gray-900 uppercase italic mb-2">Order Confirmed!</h1>
      <p className="text-gray-500 text-lg mb-8">Thank you, {order.customerName}. Your gear is on the way.</p>

      <div className="bg-white rounded-2xl p-8 border border-gray-200 text-left mb-8 shadow-sm">
        <div className="flex justify-between items-center border-b border-gray-200 pb-4 mb-4">
           <div>
             <p className="text-sm text-gray-500 font-bold uppercase">Order ID</p>
             <p className="font-mono text-yellow-600">{order.id}</p>
           </div>
           <div className="text-right">
             <p className="text-sm text-gray-500 font-bold uppercase">Status</p>
             <p className="font-bold text-green-700 bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm inline-block">
               {order.status}
             </p>
           </div>
        </div>

        <div className="space-y-4 mb-6">
          {order.items.map((item) => (
             <div key={item.id} className="flex justify-between items-center">
               <div className="flex items-center gap-3">
                 <div className="w-10 h-10 bg-white border border-gray-200 rounded overflow-hidden">
                   {item.product.imageUrl && (
                     <img src={item.product.imageUrl} alt={item.product.name} className="w-full h-full object-cover" />
                   )}
                 </div>
                 <div>
                   <p className="font-bold text-sm text-gray-900">{item.product.name}</p>
                   <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                 </div>
               </div>
               <span className="font-mono text-gray-500">{formatPrice(Number(item.price))}</span>
            </div>
          ))}
        </div>

        <div className="flex justify-between items-center pt-4 border-t border-gray-200">
          <span className="font-bold text-lg text-gray-900">Total Paid</span>
          <span className="font-black text-2xl text-yellow-600">{formatPrice(Number(order.total))}</span>
        </div>
      </div>

      <div className="space-y-4">
        <p className="text-gray-500 text-sm">
          A confirmation email has been sent to <span className="text-gray-900 font-bold">{order.email}</span>
        </p>
        <Link 
          to="/"
          className="inline-flex items-center gap-2 bg-yellow-500 hover:bg-yellow-400 text-black font-black py-3 px-8 rounded-xl uppercase tracking-wider transition-transform active:scale-95"
        >
          <Home className="w-5 h-5" /> Continue Shopping
        </Link>
      </div>
    </div>
  );
}
