import { useState } from 'react';
import { formatPrice } from '../utils/format';
import { useNavigate } from 'react-router-dom';
import { useCartStore } from '../store/useCartStore';
import { trpc } from '../utils/trpc';
import { useUser } from '@clerk/clerk-react';
import { Loader2, ArrowLeft, MapPin } from 'lucide-react';
import { captureEvent } from '../utils/analytics';

export function CheckoutPage() {
  const navigate = useNavigate();
  const { user } = useUser();
  const { items, getSubtotal, clearCart } = useCartStore();
  const [formData, setFormData] = useState({
    customerName: user?.fullName || '',
    email: user?.primaryEmailAddress?.emailAddress || '',
    address: '',
    city: '',
    zipCode: '',
  });

  const { data: savedAddresses, isLoading: isLoadingAddresses } = trpc.address.getAll.useQuery(undefined, {
    enabled: !!user,
  });

  const subtotal = getSubtotal();
  const shipping = 10; // Flat rate for MVP

  const createOrderMutation = trpc.createOrder.useMutation({
    onSuccess: (data: any) => {
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
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        navigate(`/order/${data.orderId}`);
      }
    },
  });

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <h2 className="text-2xl font-black text-gray-400 font-exo-2 uppercase tracking-wide">Your cart is empty</h2>
        <button
          onClick={() => navigate('/')}
          className="text-gray-900 dark:text-[#F0E6CA] hover:underline font-exo-2 font-bold"
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
    <div className="max-w-screen-2xl mx-auto py-12 px-4 md:px-8">
      <button
        onClick={() => navigate('/')}
        className="flex items-center gap-2 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-[#F0E6CA] mb-8 transition-colors font-exo-2 font-bold uppercase tracking-wide text-sm"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Shop
      </button>

      <div className="grid lg:grid-cols-2 gap-12 lg:gap-24 items-start">
        {/* Shipping Form */}
        <div>
          <div className="mb-6">
            <h2 className="text-4xl font-black text-gray-900 dark:text-white font-exo-2 uppercase tracking-tighter mb-2">
              Shipping <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-500 to-yellow-600 dark:from-[#F0E6CA] dark:to-[#C5BCA0]">Info</span>
            </h2>
            <p className="text-gray-500 dark:text-gray-400 font-exo-2 text-sm">Please enter your shipping details.</p>
          </div>

          {user && (
            <div className="mb-8">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider font-exo-2 mb-4 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-emerald-500" />
                Saved Addresses
              </h3>
              {isLoadingAddresses ? (
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Loader2 className="w-4 h-4 animate-spin" /> Loading addresses...
                </div>
              ) : savedAddresses && savedAddresses.length > 0 ? (
                <div className="flex flex-col gap-3">
                  {savedAddresses.map((addr) => (
                    <button
                      key={addr.id}
                      type="button"
                      onClick={() => setFormData({
                        ...formData,
                        customerName: addr.name || formData.customerName,
                        address: addr.street,
                        city: addr.city,
                        zipCode: addr.zipCode,
                      })}
                      className="text-left w-full p-4 rounded-xl border border-gray-200 dark:border-[#F0E6CA]/20 bg-white dark:bg-[#1a2333]/30 hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-all group flex items-start gap-4"
                    >
                      <div className="w-4 h-4 rounded-full border border-gray-300 dark:border-gray-600 group-hover:border-emerald-500 flex items-center justify-center mt-0.5 shrink-0">
                        {formData.address === addr.street && formData.zipCode === addr.zipCode && (
                          <div className="w-2 h-2 rounded-full bg-emerald-500" />
                        )}
                      </div>
                      <div>
                        <div className="font-bold text-gray-900 dark:text-white font-exo-2 text-sm mb-1 flex items-center gap-2">
                          {addr.name}
                          {addr.isDefault && (
                            <span className="text-[10px] bg-gray-100 dark:bg-[#F0E6CA]/10 text-gray-600 dark:text-[#F0E6CA] px-2 py-0.5 rounded font-black tracking-widest uppercase">
                              Default
                            </span>
                          )}
                        </div>
                        <p className="text-gray-500 dark:text-gray-400 text-xs leading-relaxed">
                          {addr.street}, {addr.city} {addr.zipCode}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400 font-exo-2">No saved addresses found. Add one in your profile.</p>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wider font-exo-2">Full Name</label>
              <input
                type="text"
                name="customerName"
                required
                value={formData.customerName}
                onChange={handleChange}
                className="w-full bg-gray-50 dark:bg-[#0a0f1c] border border-gray-200 dark:border-[#F0E6CA]/20 rounded-xl p-4 text-gray-900 dark:text-gray-100 font-exo-2 focus:border-gray-900 dark:focus:border-[#F0E6CA] focus:ring-0 outline-none transition-all placeholder:text-gray-400 dark:placeholder:text-gray-600"
                placeholder="Naruto Uzumaki"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wider font-exo-2">Email</label>
              <input
                type="email"
                name="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="w-full bg-gray-50 dark:bg-[#0a0f1c] border border-gray-200 dark:border-[#F0E6CA]/20 rounded-xl p-4 text-gray-900 dark:text-gray-100 font-exo-2 focus:border-gray-900 dark:focus:border-[#F0E6CA] focus:ring-0 outline-none transition-all placeholder:text-gray-400 dark:placeholder:text-gray-600"
                placeholder="hokage@konoha.com"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wider font-exo-2">Address</label>
              <input
                type="text"
                name="address"
                required
                value={formData.address}
                onChange={handleChange}
                className="w-full bg-gray-50 dark:bg-[#0a0f1c] border border-gray-200 dark:border-[#F0E6CA]/20 rounded-xl p-4 text-gray-900 dark:text-gray-100 font-exo-2 focus:border-gray-900 dark:focus:border-[#F0E6CA] focus:ring-0 outline-none transition-all placeholder:text-gray-400 dark:placeholder:text-gray-600"
                placeholder="123 Ninja Way"
              />
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wider font-exo-2">City</label>
                <input
                  type="text"
                  name="city"
                  required
                  value={formData.city}
                  onChange={handleChange}
                  className="w-full bg-gray-50 dark:bg-[#0a0f1c] border border-gray-200 dark:border-[#F0E6CA]/20 rounded-xl p-4 text-gray-900 dark:text-gray-100 font-exo-2 focus:border-gray-900 dark:focus:border-[#F0E6CA] focus:ring-0 outline-none transition-all placeholder:text-gray-400 dark:placeholder:text-gray-600"
                  placeholder="Konoha"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wider font-exo-2">Zip Code</label>
                <input
                  type="text"
                  name="zipCode"
                  required
                  value={formData.zipCode}
                  onChange={handleChange}
                  className="w-full bg-gray-50 dark:bg-[#0a0f1c] border border-gray-200 dark:border-[#F0E6CA]/20 rounded-xl p-4 text-gray-900 dark:text-gray-100 font-exo-2 focus:border-gray-900 dark:focus:border-[#F0E6CA] focus:ring-0 outline-none transition-all placeholder:text-gray-400 dark:placeholder:text-gray-600"
                  placeholder="10101"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={createOrderMutation.isPending}
              className="w-full bg-gray-900 text-white hover:bg-gray-800 dark:bg-[#F0E6CA] dark:hover:bg-white dark:text-[#0a0f1c] font-black py-5 rounded-xl text-lg uppercase tracking-wider transition-all hover:shadow-lg dark:hover:shadow-[0_0_20px_rgba(240,230,202,0.4)] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-exo-2 mt-8"
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
              <p className="text-red-500 text-sm font-bold text-center font-exo-2 mt-2">{createOrderMutation.error.message}</p>
            )}
          </form>
        </div>

        {/* Order Summary */}
        <div className="bg-gray-50 dark:bg-[#0a0f1c] mt-[-50px] rounded-2xl p-8 h-fit border border-gray-200 dark:border-[#F0E6CA]/10 shadow-sm sticky top-8">
          <div className="pb-6 border-b border-gray-200 dark:border-[#F0E6CA]/10 mb-6">
            <h2 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-wider font-exo-2">Order Summary</h2>
          </div>

          <div className="space-y-6 mb-8 max-h-[400px] overflow-y-auto pr-2">
            {items.map((item) => (
              <div key={item.id} className="flex gap-4">
                <div className="w-20 h-28 bg-white dark:bg-[#1a2333] border border-gray-200 dark:border-[#F0E6CA]/10 rounded-lg overflow-hidden flex-shrink-0">
                  <img src={item.imageUrl ?? ''} alt={item.name} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 flex flex-col justify-between py-1">
                  <div>
                    <p className="font-bold text-base text-gray-900 dark:text-gray-100 font-exo-2 leading-tight mb-1">{item.name}</p>
                    <p className="text-xs font-bold text-gray-500 dark:text-gray-400 font-exo-2 uppercase tracking-wide">Qty: {item.quantity}</p>
                  </div>
                  <span className="font-mono font-bold text-gray-900 dark:text-[#F0E6CA]">{formatPrice(item.price * item.quantity)}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-3 font-exo-2">
            <div className="flex justify-between text-gray-500 dark:text-gray-400 font-medium">
              <span>Subtotal</span>
              <span className="text-gray-900 dark:text-gray-100">{formatPrice(subtotal)}</span>
            </div>
            <div className="flex justify-between text-gray-500 dark:text-gray-400 font-medium">
              <span>Shipping</span>
              <span className="text-gray-900 dark:text-gray-100">{formatPrice(shipping)}</span>
            </div>
          </div>

          <div className="border-t border-gray-200 dark:border-[#F0E6CA]/10 pt-6 mt-6 flex justify-between items-end">
            <span className="font-bold text-lg text-gray-500 dark:text-gray-400 font-exo-2 uppercase tracking-wider mb-1">Total</span>
            <span className="font-black text-4xl text-gray-900 dark:text-[#F0E6CA] font-libre-bodoni">{formatPrice(total)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
