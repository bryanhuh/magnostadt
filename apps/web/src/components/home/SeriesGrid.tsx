import { Link } from 'react-router-dom';
import { SectionHeader } from './SectionHeader';
import { ArrowRight } from 'lucide-react';

interface SeriesGridProps {
  series: {
    id: string;
    name: string;
    coverImage: string | null;
  }[];
}

export function SeriesGrid({ series }: SeriesGridProps) {
  return (
    <section className="w-full bg-gray-50 dark:bg-[#0a0f1c] py-20 border-t border-gray-200 dark:border-[#F0E6CA]/10 transition-colors duration-300">
      <div className="max-w-[1400px] mx-auto px-4 md:px-8">
        <SectionHeader title="All Series" linkText="View All" />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {series.slice(0, 18).map((anime) => (
            <Link 
              key={anime.id} 
              to={`/collection/${(anime as any).slug ?? anime.id}`}
              className="group flex flex-col items-center text-center gap-3 p-4 rounded-xl hover:bg-gray-100 dark:hover:bg-white/5 transition-colors border border-transparent hover:border-gray-200 dark:hover:border-[#F0E6CA]/20"
            >
              <div className="w-full aspect-square rounded-full overflow-hidden border-2 border-gray-200 dark:border-[#F0E6CA]/20 group-hover:border-gray-900 dark:group-hover:border-[#F0E6CA] transition-colors relative bg-gray-100 dark:bg-[#1a2333]">
                 {/* Fallback pattern if image is missing/loading */}
                 <div className="absolute inset-0 flex items-center justify-center text-gray-500 text-xs uppercase font-bold">
                    No Image
                 </div>
                 {anime.coverImage && (
                    <img 
                      src={anime.coverImage} 
                      alt={anime.name}
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                 )}
              </div>
              <span className="font-bold text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-[#F0E6CA] transition-colors uppercase text-sm line-clamp-2 font-exo-2">
                {anime.name}
              </span>
            </Link>
          ))}
          
          <div className="col-span-2 md:col-span-3 lg:col-span-6 flex justify-center mt-8">
            <Link 
              to="/collections"
              className="text-gray-900 dark:text-[#F0E6CA] font-black uppercase tracking-widest hover:text-gray-600 dark:hover:text-white transition-colors text-lg font-exo-2 border-b-2 border-gray-900 dark:border-[#F0E6CA] hover:border-gray-600 dark:hover:border-white pb-1 inline-flex items-center gap-2"
            >
              View Full Collection <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
