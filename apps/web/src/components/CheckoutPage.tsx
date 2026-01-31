import { useState } from 'react';
import { formatPrice } from '../utils/format';
import { useNavigate } from 'react-router-dom';
import { useCartStore } from '../store/useCartStore';
import { trpc } from '../utils/trpc';
import { Loader2, ArrowLeft } from 'lucide-react';
import { captureEvent } from '../utils/analytics';

export function CheckoutPage() {
  const navigate = useNavigate();
  const { items, getSubtotal, clearCart } = useCartStore();
  const [formData, setFormData] = useState({
    customerName: '',
    email: '',
    address: '',
    city: '',
    zipCode: '',
  });

  const subtotal = getSubtotal();
  const shipping = 10; // Flat rate for MVP

  const createOrderMutation = trpc.createOrder.useMutation({
    onSuccess: (data) => {
      // Capture order completion event
      captureEvent('order_completed', {
        order_id: data.id,
        subtotal: subtotal,
        shipping: shipping,
        total: subtotal + shipping,
        item_count: items.reduce((acc, item) => acc + item.quantity, 0),
        currency: 'USD'
      });

      clearCart();
      navigate(`/order/${data.id}`);
    },
  });

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <h2 className="text-2xl font-black text-gray-500">Your cart is empty</h2>
        <button
          onClick={() => navigate('/')}
          className="text-yellow-600 hover:underline"
        >
          Go back to shopping
        </button>
      </div>
    );
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createOrderMutation.mutate({
      ...formData,
      items: items.map((item) => ({
        productId: item.id,
        quantity: item.quantity,
      })),
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const total = subtotal + shipping;

  return (
    <div className="max-w-4xl mx-auto py-8">
      <button
        onClick={() => navigate('/')}
        className="flex items-center gap-2 text-gray-500 hover:text-gray-900 mb-8 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Shop
      </button>

      <div className="grid md:grid-cols-2 gap-12">
        {/* Shipping Form */}
        <div>
          <h2 className="text-3xl font-black text-yellow-600 italic uppercase mb-8">Shipping Info</h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-gray-500 mb-2">Full Name</label>
              <input
                type="text"
                name="customerName"
                required
                value={formData.customerName}
                onChange={handleChange}
                className="w-full bg-white border border-gray-200 rounded-lg p-3 text-gray-900 focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 outline-none transition-all"
                placeholder="Naruto Uzumaki"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-500 mb-2">Email</label>
              <input
                type="email"
                name="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="w-full bg-white border border-gray-200 rounded-lg p-3 text-gray-900 focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 outline-none transition-all"
                placeholder="hokage@konoha.com"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-500 mb-2">Address</label>
              <input
                type="text"
                name="address"
                required
                value={formData.address}
                onChange={handleChange}
                className="w-full bg-white border border-gray-200 rounded-lg p-3 text-gray-900 focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 outline-none transition-all"
                placeholder="123 Ninja Way"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-500 mb-2">City</label>
                <input
                  type="text"
                  name="city"
                  required
                  value={formData.city}
                  onChange={handleChange}
                  className="w-full bg-white border border-gray-200 rounded-lg p-3 text-gray-900 focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 outline-none transition-all"
                  placeholder="Konoha"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-500 mb-2">Zip Code</label>
                <input
                  type="text"
                  name="zipCode"
                  required
                  value={formData.zipCode}
                  onChange={handleChange}
                  className="w-full bg-white border border-gray-200 rounded-lg p-3 text-gray-900 focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 outline-none transition-all"
                  placeholder="10101"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={createOrderMutation.isPending}
              className="w-full bg-yellow-500 hover:bg-yellow-400 text-black font-black py-4 rounded-xl text-lg uppercase tracking-wider transition-all hover:shadow-[0_0_20px_rgba(234,179,8,0.4)] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {createOrderMutation.isPending ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" /> Processing...
                </>
              ) : (
                'Place Order'
              )}
            </button>
            {createOrderMutation.error && (
               <p className="text-red-500 text-sm font-bold text-center">{createOrderMutation.error.message}</p>
            )}
          </form>
        </div>

        {/* Order Summary */}
        <div className="bg-white rounded-2xl p-8 h-fit border border-gray-200 shadow-sm">
          <h2 className="text-2xl font-black text-gray-900 italic uppercase mb-6">Order Summary</h2>
          <div className="space-y-4 mb-6 max-h-[400px] overflow-y-auto pr-2">
            {items.map((item) => (
              <div key={item.id} className="flex justify-between items-start">
                <div className="flex gap-3">
                  <div className="w-12 h-16 bg-white border border-gray-200 rounded overflow-hidden flex-shrink-0">
                    <img src={item.imageUrl ?? ''} alt={item.name} className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <p className="font-bold text-sm line-clamp-2 text-gray-900">{item.name}</p>
                    <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                  </div>
                </div>
                <span className="font-mono text-gray-500">{formatPrice(item.price * item.quantity)}</span>
              </div>
            ))}
          </div>
          
          <div className="border-t border-gray-200 pt-4 space-y-2">
            <div className="flex justify-between text-gray-500">
              <span>Subtotal</span>
              <span>{formatPrice(subtotal)}</span>
            </div>
            <div className="flex justify-between text-gray-500">
              <span>Shipping</span>
              <span>{formatPrice(shipping)}</span>
            </div>
          </div>
          
          <div className="border-t border-gray-200 pt-4 mt-4 flex justify-between items-center">
            <span className="font-bold text-xl text-gray-900">Total</span>
            <span className="font-black text-3xl text-yellow-600">{formatPrice(total)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
