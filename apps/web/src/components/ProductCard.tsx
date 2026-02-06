import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { ShoppingCart, Heart } from 'lucide-react';
import { useCartStore } from '../store/useCartStore';
import { captureEvent } from '../utils/analytics';
import { formatPrice } from '../utils/format';
import type { inferRouterOutputs } from '@trpc/server';
import type { AppRouter } from '@shonen-mart/trpc';
import { trpc } from '../utils/trpc';
import { useUser } from '@clerk/clerk-react';

type Product = inferRouterOutputs<AppRouter>['getProducts'][number];

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { addItem } = useCartStore();
  const { user } = useUser();
  const utils = trpc.useUtils();

  const { data: isInWishlist } = trpc.wishlist.checkStatus.useQuery(
    { productId: product.id },
    { enabled: !!user }
  );

  const addToWishlist = trpc.wishlist.add.useMutation({
    onSuccess: () => {
      toast.success('Added to wishlist');
      utils.wishlist.checkStatus.invalidate({ productId: product.id });
      utils.wishlist.getMine.invalidate();
    },
    onError: (err) => toast.error(err.message)
  });

  const removeFromWishlist = trpc.wishlist.remove.useMutation({
    onSuccess: () => {
      toast.success('Removed from wishlist');
      utils.wishlist.checkStatus.invalidate({ productId: product.id });
      utils.wishlist.getMine.invalidate();
    },
    onError: (err) => toast.error(err.message)
  });

  const toggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error('Please sign in to add to wishlist');
      return;
    }
    if (isInWishlist) {
      removeFromWishlist.mutate({ productId: product.id });
    } else {
      addToWishlist.mutate({ productId: product.id });
    }
  };

  return (
    <Link
      to={`/product/${product.slug}`}
      className="group relative bg-transparent hover:bg-white border border-gray-200 rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300 flex flex-col"
    >
      <div className="aspect-[4/5] bg-gray-100 relative overflow-hidden">
         <button
           onClick={toggleWishlist}
           className={`absolute top-3 right-3 z-10 p-2 rounded-full transition-all duration-300 ${
             isInWishlist 
               ? 'bg-red-50 text-red-500 shadow-sm opacity-100' 
               : 'bg-white/80 text-gray-400 hover:text-red-500 hover:bg-white opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0'
           }`}
         >
           <Heart className={`w-5 h-5 ${isInWishlist ? 'fill-current' : ''}`} />
         </button>

         <div className="absolute inset-0 group-hover:bg-transparent transition-colors duration-300" />
         
         {/* Badges */}
         <div className="absolute top-3 left-3 flex flex-col gap-2 z-10">
           {product.isSale && (
             <span className="bg-red-500 text-white text-xs font-black uppercase tracking-wider px-2 py-1 rounded shadow-md">
               Sale
             </span>
           )}
           {product.isPreorder && (
             <span className="bg-blue-500 text-white text-xs font-black uppercase tracking-wider px-2 py-1 rounded shadow-md">
               Pre-Order
             </span>
           )}
         </div>

         <img 
           src={product.imageUrl ?? undefined} 
           alt={product.name}
           className="w-full h-full object-cover scale-110"
           onError={(e) => {
             (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x500?text=No+Image';
           }}
         />
      </div>
      
      <div className="p-5 flex flex-col flex-1">
        <div className="flex-1">
          <div className="flex justify-between items-start mb-2 gap-2">
            <h3 className="text-lg font-bold uppercase tracking-wider leading-tight text-gray-900 font-orbitron">
              {product.name}
            </h3>
          </div>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs font-bold text-gray-500 uppercase">{product.category.name}</span>
            <span className="w-1 h-1 bg-gray-700 rounded-full"></span>
            <span className="text-xs font-bold text-gray-500 uppercase">{product.anime.name}</span>
          </div>
        </div>
        
        <div className="mt-4 pt-4 border-t border-gray-200 flex items-end justify-between">
          <div>
            {product.isSale && product.salePrice ? (
              <div className="flex flex-col">
                <span className="text-gray-400 line-through text-xs font-bold">{formatPrice(Number(product.price))}</span>
                <span className="text-red-500 font-black text-xl font-orbitron">{formatPrice(Number(product.salePrice))}</span>
              </div>
            ) : (
              <span className="text-yellow-600 font-black text-xl font-orbitron">{formatPrice(Number(product.price))}</span>
            )}
          </div>
          <button 
            onClick={(e) => {
              e.preventDefault(); // Prevent navigation to details
              addItem({
                id: product.id,
                name: product.name,
                price: Number(product.price),
                imageUrl: product.imageUrl,
                anime: { name: product.anime.name }
              });
              toast.success(`Added ${product.name} to cart`);
              captureEvent('add_to_cart', {
                product_id: product.id,
                product_name: product.name,
                price: Number(product.price),
              });
            }}
            className="bg-yellow-500 hover:bg-yellow-400 text-black p-2 rounded-lg transition-transform active:scale-95"
          >
            <ShoppingCart className="w-5 h-5" />
          </button>
        </div>
      </div>
    </Link>
  );
}
