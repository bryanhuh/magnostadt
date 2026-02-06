import { trpc } from '../utils/trpc';
import { Link } from 'react-router-dom';
import { SectionHeader } from '../components/home/SectionHeader';

export function CollectionsPage() {
  const { data: seriesList, isLoading } = trpc.getAnimeSeries.useQuery();

  if (isLoading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-yellow-500"></div>
      </div>
    );
  }

  return (
    <div className="py-12 container mx-auto px-4">
      <SectionHeader 
        title="All Collections" 
        subtitle="Browse products by your favorite anime series" 
        className="mb-12"
      />
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-12 group/list">
        {seriesList?.map((series) => (
          <Link 
            key={series.id} 
            to={`/collection/${series.slug}`}
            className="group relative h-[300px] overflow-hidden rounded-xl transition-all duration-500 ease-out
              hover:!scale-110 hover:!opacity-100 hover:z-50 hover:shadow-2xl
              group-hover/list:scale-95 group-hover/list:opacity-50"
          >
            <img 
              src={series.headerImage || series.coverImage || ''} 
              alt={series.name}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-80 group-hover:opacity-100 transition-opacity" />
            
            <div className="absolute bottom-0 left-0 p-8 transform transition-transform duration-500 group-hover:translate-y-0 translate-y-2">
              <h3 className="text-3xl font-black text-white uppercase tracking-tighter mb-2 drop-shadow-lg">
                {series.name}
              </h3>
              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100">
                <span className="text-yellow-400 font-bold tracking-wide text-sm">Explore Collection</span>
                <span className="bg-yellow-500 text-black text-[10px] font-black px-2 py-0.5 rounded">
                  {(series as any).products?.length || 0} ITEMS
                </span>
              </div>
            </div>
          </Link>
        ))}

        {seriesList?.length === 0 && (
          <div className="col-span-full text-center py-20">
            <p className="text-gray-500 text-lg">No collections found.</p>
          </div>
        )}
      </div>
    </div>
  );
}
