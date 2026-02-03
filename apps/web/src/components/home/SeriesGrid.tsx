import { Link } from 'react-router-dom';
import { SectionHeader } from './SectionHeader';

interface SeriesGridProps {
  series: {
    id: string;
    name: string;
    coverImage: string | null;
  }[];
}

export function SeriesGrid({ series }: SeriesGridProps) {
  return (
    <section className="w-full bg-gradient-to-b from-gray-100 to-white py-20">
      <div className="max-w-[1400px] mx-auto px-4 md:px-8">
        <SectionHeader title="All Series" linkText="View All" />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {series.map((anime) => (
            <Link 
              key={anime.id} 
              to={`/collection/${(anime as any).slug ?? anime.id}`}
              className="group flex flex-col items-center text-center gap-3 p-4 rounded-xl hover:bg-white transition-colors"
            >
              <div className="w-full aspect-square rounded-full overflow-hidden border-2 border-gray-200 group-hover:border-yellow-500 transition-colors relative bg-gray-100">
                 {/* Fallback pattern if image is missing/loading */}
                 <div className="absolute inset-0 flex items-center justify-center text-gray-300 text-xs uppercase font-bold">
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
              <span className="font-bold text-gray-600 group-hover:text-black transition-colors uppercase text-sm line-clamp-2">
                {anime.name}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
