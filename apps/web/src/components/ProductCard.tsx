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
      className="group relative bg-white dark:bg-[#1a2333]/20 hover:bg-gray-50 dark:hover:bg-[#1a2333] border border-gray-200 dark:border-[#F0E6CA]/10 rounded-2xl overflow-hidden hover:border-gray-900 dark:hover:border-[#F0E6CA]/30 hover:shadow-xl hover:shadow-gray-200 dark:hover:shadow-[#F0E6CA]/5 transition-all duration-300 flex flex-col"
    >
      <div className="aspect-[4/5] bg-[#1a2333]/50 relative overflow-hidden">
         <button
           onClick={toggleWishlist}
           className={`absolute top-3 right-3 z-10 p-2 rounded-full transition-all duration-300 ${
             isInWishlist 
               ? 'bg-red-500/10 text-red-500 shadow-sm opacity-100' 
               : 'bg-white/80 dark:bg-[#0a0f1c]/80 text-gray-400 hover:text-red-500 hover:bg-white opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 backdrop-blur-sm'
           }`}
         >
           <Heart className={`w-5 h-5 ${isInWishlist ? 'fill-current' : ''}`} />
         </button>

         <img 
           src={product.imageUrl ?? undefined} 
           alt={product.name}
           className="w-full h-full object-cover scale-110 transition-transform duration-500 group-hover:scale-125"
           onError={(e) => {
             (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x500?text=No+Image';
           }}
         />
         <div className="absolute inset-0 bg-gradient-to-t from-gray-900/10 to-transparent dark:from-[#0a0f1c] dark:to-transparent opacity-60 group-hover:opacity-40 transition-opacity duration-300" />

         {/* Badges */}
         <div className="absolute top-3 left-3 flex flex-col gap-2 z-10">
           {product.isSale && (
             <span className="bg-red-500/90 backdrop-blur-md text-white text-xs font-black uppercase tracking-wider px-2 py-1 rounded shadow-lg border border-red-400/20">
               Sale
             </span>
           )}
           {product.isPreorder && (
             <span className="bg-blue-600/90 backdrop-blur-md text-white text-xs font-black uppercase tracking-wider px-2 py-1 rounded shadow-lg border border-blue-400/20">
               Pre-Order
             </span>
           )}
         </div>
      </div>
      
      <div className="p-5 flex flex-col flex-1">
        <div className="flex-1">
          <div className="flex justify-between items-start mb-2 gap-2">
            <h3 className="text-lg font-bold uppercase tracking-wider leading-tight text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-[#F0E6CA] transition-colors font-exo-2">
              {product.name}
            </h3>
          </div>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs font-bold text-gray-500 uppercase font-exo-2">{product.category.name}</span>
            <span className="w-1 h-1 bg-gray-700 rounded-full"></span>
            <span className="text-xs font-bold text-gray-500 uppercase font-exo-2">{product.anime.name}</span>
          </div>
        </div>
        
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-[#F0E6CA]/10 flex items-end justify-between">
          <div>
            {product.isSale && product.salePrice ? (
              <div className="flex flex-col">
                <span className="text-gray-500 line-through text-xs font-bold font-exo-2">{formatPrice(Number(product.price))}</span>
                <span className="text-red-400 font-bold text-lg font-exo-2">{formatPrice(Number(product.salePrice))}</span>
              </div>
            ) : (
              <span className="text-gray-900 dark:text-[#F0E6CA] font-bold text-lg font-exo-2 transition-colors">{formatPrice(Number(product.price))}</span>
            )}
          </div>
          {/* <button 
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
            className="bg-[#F0E6CA] hover:bg-white text-[#0a0f1c] p-2 rounded-lg transition-transform active:scale-95 shadow-lg shadow-[#F0E6CA]/10"
          >
            <ShoppingCart className="w-5 h-5" />
          </button> */}
        </div>
      </div>
    </Link>
  );
}
