import { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { inferRouterOutputs } from '@trpc/server';
import type { AppRouter } from '@shonen-mart/trpc';

type AnimeSeries = inferRouterOutputs<AppRouter>['getAnimeSeries'][number];

interface SeriesCarouselProps {
  series: AnimeSeries[];
  isLoading?: boolean;
}

export function SeriesCarousel({ series, isLoading }: SeriesCarouselProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 400;
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
        {[1, 2, 3].map((i) => (
          <div key={i} className="min-w-[400px] h-[250px] bg-gray-900/50 rounded-2xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (!series.length) {
    return null;
  }

  return (
    <div className="relative group/carousel">
      {/* Scroll Controls */}
      <button 
        onClick={() => scroll('left')}
        className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 z-10 w-12 h-12 bg-gray-950 border border-gray-800 text-white rounded-full flex items-center justify-center opacity-0 group-hover/carousel:opacity-100 transition-all hover:bg-yellow-500 hover:text-black hover:border-yellow-500 shadow-xl"
      >
        <ChevronLeft className="w-6 h-6" />
      </button>
      
      <button 
        onClick={() => scroll('right')}
        className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 z-10 w-12 h-12 bg-gray-950 border border-gray-800 text-white rounded-full flex items-center justify-center opacity-0 group-hover/carousel:opacity-100 transition-all hover:bg-yellow-500 hover:text-black hover:border-yellow-500 shadow-xl"
      >
        <ChevronRight className="w-6 h-6" />
      </button>

      {/* Carousel Container */}
      <div 
        ref={scrollContainerRef}
        className="flex gap-6 overflow-x-auto pb-4 snap-x scrollbar-hide -mx-4 px-4 scroll-smooth"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {series.map((anime) => (
          <Link
            to={`/?animeId=${anime.id}`}
            key={anime.id}
            className="snap-start min-w-[300px] md:min-w-[400px] aspect-video group relative bg-gray-900 rounded-2xl overflow-hidden hover:ring-2 hover:ring-yellow-500 transition-all duration-300"
          >
             <img 
               src={anime.coverImage ?? 'https://via.placeholder.com/800x450?text=Anime+Banner'} 
               alt={anime.name}
               className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 opacity-60 group-hover:opacity-100"
             />
             <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
             
             <div className="absolute bottom-0 left-0 p-6 w-full">
               <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter mb-2 group-hover:text-yellow-500 transition-colors">
                 {anime.name}
               </h3>
               {anime.description && (
                 <p className="text-gray-300 line-clamp-2 text-sm max-w-[90%]">
                   {anime.description}
                 </p>
               )}
             </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
