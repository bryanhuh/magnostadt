import { X, Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react';
import { formatPrice } from '../utils/format';
import { Link } from 'react-router-dom';
import { useCartStore } from '../store/useCartStore';
import { captureEvent } from '../utils/analytics';

export function CartDrawer() {
  const { 
    items, 
    isOpen, 
    closeCart, 
    updateQuantity, 
    removeItem, 
    getSubtotal 
  } = useCartStore();

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 z-50 backdrop-blur-sm transition-opacity"
        onClick={closeCart}
      />

      {/* Drawer */}
      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-white border-l border-gray-200 shadow-2xl transform transition-transform duration-300 ease-in-out flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ShoppingBag className="w-6 h-6 text-yellow-600" />
            <h2 className="text-2xl font-black uppercase italic tracking-wider text-gray-900">Your Cart</h2>
          </div>
          <button 
            onClick={closeCart}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-6 h-6 text-gray-400 hover:text-gray-900" />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
              <ShoppingBag className="w-16 h-16 text-gray-800" />
              <p className="text-gray-500 text-lg">Your cart is empty.</p>
              <button 
                onClick={closeCart}
                className="text-yellow-500 hover:text-yellow-400 font-bold hover:underline"
              >
                Continue Shopping
              </button>
            </div>
          ) : (
            items.map((item) => (
              <div key={item.id} className="flex gap-4">
                <div className="w-24 h-32 bg-white rounded-lg overflow-hidden border border-gray-200 flex-shrink-0">
                  <img 
                    src={item.imageUrl ?? ''} 
                    alt={item.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://via.placeholder.com/150x200?text=No+Image';
                    }}
                  />
                </div>
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-bold text-lg leading-tight mb-1">{item.name}</h3>
                    <p className="text-sm text-gray-500 uppercase font-bold">{item.animeName}</p>
                  </div>
                  
                  <div className="flex items-center justify-between mt-4">
                    <div className="flex items-center gap-3 bg-gray-50 rounded-lg p-1 border border-gray-200">
                      <button 
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="p-1 hover:text-yellow-600 transition-colors text-gray-600"
                      >
                        <Minus className="w-4 h-4" />
                      </button>

                      <span className="font-mono font-bold w-4 text-center text-gray-900">{item.quantity}</span>
                      <button 
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="p-1 hover:text-yellow-600 transition-colors text-gray-600"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                    
                    <div className="text-right">
                       <p className="font-bold text-yellow-600 text-lg">
                         {formatPrice(item.price * item.quantity)}
                       </p>
                       <button 
                         onClick={() => {
                           removeItem(item.id);
                           captureEvent('remove_from_cart', { product_id: item.id });
                         }}
                         className="text-xs text-red-500 hover:text-red-400 flex items-center gap-1 mt-1"
                       >
                         <Trash2 className="w-3 h-3" /> Remove
                       </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="p-6 border-t border-gray-200 bg-gray-50">
            <div className="flex justify-between items-center mb-6">
              <span className="text-gray-500">Subtotal</span>
              <span className="text-3xl font-black text-gray-900">
                {formatPrice(getSubtotal())}
              </span>
            </div>
              <Link 
                to="/checkout"
                onClick={() => {
                  closeCart();
                  captureEvent('checkout_started', { 
                    cart_value: getSubtotal(),
                    item_count: items.length
                  });
                }}
                className="w-full bg-yellow-500 hover:bg-yellow-400 text-black font-black py-4 rounded-xl text-lg uppercase tracking-wider transition-all hover:shadow-[0_0_20px_rgba(234,179,8,0.4)] active:scale-95 block text-center"
              >
                Checkout
              </Link>
            <p className="text-center text-xs text-gray-500 mt-4">
              Shipping and taxes calculated at next step.
            </p>
          </div>
        )}
      </div>
    </>
  );
}
