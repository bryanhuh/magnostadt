import { useRef } from 'react';
import { formatPrice } from '../../utils/format';
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
          <div key={i} className="min-w-[280px] h-[400px] bg-gray-200 dark:bg-gray-900/50 rounded-2xl animate-pulse" />
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
        className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 z-10 w-12 h-12 bg-white dark:bg-[#1a2333] border border-gray-200 dark:border-[#F0E6CA]/20 text-gray-900 dark:text-[#F0E6CA] rounded-full flex items-center justify-center opacity-0 group-hover/carousel:opacity-100 transition-all hover:bg-gray-100 dark:hover:bg-[#F0E6CA] hover:text-gray-900 dark:hover:text-[#0a0f1c] hover:border-gray-300 dark:hover:border-[#F0E6CA] shadow-xl"
        aria-label="Scroll left"
      >
        <ChevronLeft className="w-6 h-6" />
      </button>
      
      <button 
        onClick={() => scroll('right')}
        className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 z-10 w-12 h-12 bg-white dark:bg-[#1a2333] border border-gray-200 dark:border-[#F0E6CA]/20 text-gray-900 dark:text-[#F0E6CA] rounded-full flex items-center justify-center opacity-0 group-hover/carousel:opacity-100 transition-all hover:bg-gray-100 dark:hover:bg-[#F0E6CA] hover:text-gray-900 dark:hover:text-[#0a0f1c] hover:border-gray-300 dark:hover:border-[#F0E6CA] shadow-xl"
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
            to={`/product/${product.slug}`}
            key={product.id}
            className="snap-start min-w-[280px] w-[280px] group relative border border-gray-200 dark:border-[#F0E6CA]/10 bg-white dark:bg-[#1a2333]/30 rounded-xl overflow-hidden hover:border-gray-900 dark:hover:border-[#F0E6CA]/30 hover:shadow-xl hover:shadow-gray-200 dark:hover:shadow-[#F0E6CA]/5 transition-all duration-300 flex flex-col"
          >
            {/* Image */}
            <div className="relative overflow-hidden aspect-[3/4]">
               <img 
                 src={product.imageUrl ?? undefined} 
                 alt={product.name}
                 className="w-full h-full object-cover transition-transform scale-100 duration-500 group-hover:scale-110"
                 onError={(e) => {
                   (e.target as HTMLImageElement).src = 'https://via.placeholder.com/300x400?text=No+Image';
                 }}
               />
               <div className="absolute inset-0 bg-gradient-to-t from-gray-900/10 to-transparent dark:from-[#0a0f1c] dark:to-transparent opacity-60 group-hover:opacity-30 transition-opacity duration-300" />
               
               {/* Badges */}
               <div className="absolute top-3 left-0 flex flex-col gap-2 px-3">
                 {product.isSale && (
                   <span className="bg-red-500 text-white text-xs font-black uppercase tracking-wider px-2 py-1 rounded shadow-lg">
                     Sale
                   </span>
                 )}
                 {product.isPreorder && (
                   <span className="bg-blue-600 text-white text-xs font-black uppercase tracking-wider px-2 py-1 rounded shadow-lg">
                     Pre-Order
                   </span>
                 )}
               </div>
            </div>
            
            {/* Content */}
            <div className="p-4 flex flex-col flex-1">
              <div className="flex-1">
                <h3 className="text-base font-bold text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-[#F0E6CA] transition-colors font-exo-2 line-clamp-2 mb-1 tracking-wide">
                  {product.name}
                </h3>
                <p className="text-xs text-gray-400 uppercase font-bold font-exo-2">{product.anime.name}</p>
              </div>
              
              <div className="mt-4 flex items-end justify-between gap-2">
                <div>
                   {product.isSale && product.salePrice ? (
                     <div className="flex flex-col">
                       <span className="text-gray-500 line-through text-xs font-bold font-exo-2">{formatPrice(Number(product.price))}</span>
                       <span className="text-red-400 font-bold text-lg font-exo-2">{formatPrice(Number(product.salePrice))}</span>
                     </div>
                   ) : (
                     <span className="text-[#F0E6CA] font-bold text-lg font-exo-2">{formatPrice(Number(product.price))}</span>
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
                  className="bg-gray-900 dark:bg-[#F0E6CA] hover:bg-gray-700 dark:hover:bg-white text-white dark:text-[#0a0f1c] p-2 rounded-lg transition-transform active:scale-95 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 shadow-lg shadow-gray-200 dark:shadow-[#F0E6CA]/20"
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
