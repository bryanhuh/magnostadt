import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { ShoppingCart } from 'lucide-react';
import { useCartStore } from '../store/useCartStore';
import { captureEvent } from '../utils/analytics';
import { formatPrice } from '../utils/format';
import type { inferRouterOutputs } from '@trpc/server';
import type { AppRouter } from '@shonen-mart/trpc';

type Product = inferRouterOutputs<AppRouter>['getProducts'][number];

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { addItem } = useCartStore();

  return (
    <Link
      to={`/product/${product.slug}`}
      className="group relative bg-white border border-gray-200 rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300 flex flex-col"
    >
      <div className="aspect-[4/5] bg-gray-100 relative overflow-hidden">
         <img 
           src={product.imageUrl ?? undefined} 
           alt={product.name}
           className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
           onError={(e) => {
             (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x500?text=No+Image';
           }}
         />
         <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors duration-300" />
      </div>
      
      <div className="p-5 flex flex-col flex-1">
        <div className="flex-1">
          <div className="flex justify-between items-start mb-2 gap-2">
            <h3 className="text-lg font-bold group-hover:text-yellow-600 transition-colors uppercase italic tracking-wider leading-tight text-gray-900">
              {product.name}
            </h3>
          </div>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs font-bold text-gray-500 uppercase">{product.category.name}</span>
            <span className="w-1 h-1 bg-gray-700 rounded-full"></span>
            <span className="text-xs font-bold text-gray-500 uppercase">{product.anime.name}</span>
          </div>
        </div>
        
        <div className="mt-4 pt-4 border-t border-gray-200 flex items-center justify-between">
          <span className="text-yellow-600 font-black text-xl">{formatPrice(Number(product.price))}</span>
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
