import { useRef } from 'react';
import { ChevronLeft, ChevronRight, ShoppingCart } from 'lucide-react';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { useCartStore } from '../../store/useCartStore';
import { captureEvent } from '../../utils/analytics';
import type { inferRouterOutputs } from '@trpc/server';
import type { AppRouter } from '@shonen-mart/trpc';

type Product = inferRouterOutputs<AppRouter>['getProducts'][number];

interface ProductCarouselProps {
  products: Product[];
  isLoading?: boolean;
}

export function ProductCarousel({ products, isLoading }: ProductCarouselProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const { addItem } = useCartStore();

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 300;
      const currentScroll = scrollContainerRef.current.scrollLeft;
      const targetScroll = direction === 'left' 
        ? currentScroll - scrollAmount 
        : currentScroll + scrollAmount;
      
      scrollContainerRef.current.scrollTo({
        left: targetScroll,
        behavior: 'smooth'
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex gap-6 overflow-hidden">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="min-w-[280px] h-[400px] bg-gray-900/50 rounded-2xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (!products.length) {
    return <div className="text-gray-500 py-10">No products found.</div>;
  }

  return (
    <div className="relative group/carousel">
      {/* Scroll Controls */}
      <button 
        onClick={() => scroll('left')}
        className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 z-10 w-12 h-12 bg-gray-950 border border-gray-800 text-white rounded-full flex items-center justify-center opacity-0 group-hover/carousel:opacity-100 transition-all hover:bg-yellow-500 hover:text-black hover:border-yellow-500 shadow-xl"
        aria-label="Scroll left"
      >
        <ChevronLeft className="w-6 h-6" />
      </button>
      
      <button 
        onClick={() => scroll('right')}
        className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 z-10 w-12 h-12 bg-gray-950 border border-gray-800 text-white rounded-full flex items-center justify-center opacity-0 group-hover/carousel:opacity-100 transition-all hover:bg-yellow-500 hover:text-black hover:border-yellow-500 shadow-xl"
        aria-label="Scroll right"
      >
        <ChevronRight className="w-6 h-6" />
      </button>

      {/* Carousel Container */}
      <div 
        ref={scrollContainerRef}
        className="flex gap-6 overflow-x-auto pb-8 snap-x scrollbar-hide -mx-4 px-4 scroll-smooth"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {products.map((product) => (
          <Link
            to={`/product/${product.id}`}
            key={product.id}
            className="snap-start min-w-[280px] w-[280px] group relative bg-gray-900/50 border border-gray-800 rounded-2xl overflow-hidden hover:border-yellow-500/50 transition-all duration-300 hover:shadow-[0_0_30px_rgba(234,179,8,0.1)] flex flex-col"
          >
            {/* Image */}
            <div className="aspect-[3/4] bg-gray-800 relative overflow-hidden">
               <img 
                 src={product.imageUrl ?? undefined} 
                 alt={product.name}
                 className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                 onError={(e) => {
                   (e.target as HTMLImageElement).src = 'https://via.placeholder.com/300x400?text=No+Image';
                 }}
               />
               <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors duration-300" />
               
               {/* Badges */}
               <div className="absolute top-3 left-3 flex flex-col gap-2">
                 {product.isSale && (
                   <span className="bg-red-500 text-white text-xs font-black uppercase tracking-wider px-2 py-1 rounded">
                     Sale
                   </span>
                 )}
                 {product.isPreorder && (
                   <span className="bg-blue-500 text-white text-xs font-black uppercase tracking-wider px-2 py-1 rounded">
                     Pre-Order
                   </span>
                 )}
               </div>
            </div>
            
            {/* Content */}
            <div className="p-4 flex flex-col flex-1">
              <div className="flex-1">
                <h3 className="text-base font-bold text-white group-hover:text-yellow-500 transition-colors line-clamp-2 mb-1">
                  {product.name}
                </h3>
                <p className="text-xs text-gray-500 uppercase font-bold">{product.anime.name}</p>
              </div>
              
              <div className="mt-4 flex items-end justify-between gap-2">
                <div>
                   {product.isSale && product.salePrice ? (
                     <div className="flex flex-col">
                       <span className="text-gray-500 line-through text-xs font-bold">${Number(product.price).toFixed(2)}</span>
                       <span className="text-red-500 font-black text-lg">${Number(product.salePrice).toFixed(2)}</span>
                     </div>
                   ) : (
                     <span className="text-yellow-500 font-black text-lg">${Number(product.price).toFixed(2)}</span>
                   )}
                </div>
                
                <button 
                  onClick={(e) => {
                    e.preventDefault();
                    addItem({
                      id: product.id,
                      name: product.name,
                      price: product.isSale && product.salePrice ? Number(product.salePrice) : Number(product.price),
                      imageUrl: product.imageUrl,
                      anime: { name: product.anime.name }
                    });
                    toast.success(`Added ${product.name} to cart`);
                    captureEvent('add_to_cart', {
                      product_id: product.id,
                      product_name: product.name,
                      price: product.isSale && product.salePrice ? Number(product.salePrice) : Number(product.price),
                    });
                  }}
                  className="bg-yellow-500 hover:bg-yellow-400 text-black p-2 rounded-lg transition-transform active:scale-95 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0"
                >
                  <ShoppingCart className="w-4 h-4" />
                </button>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
