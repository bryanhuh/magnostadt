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
    <div className="py-12">
      <SectionHeader 
        title="All Collections" 
        subtitle="Browse products by your favorite anime series" 
      />
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-12">
        {seriesList?.map((series) => (
          <Link 
            key={series.id} 
            to={`/collection/${series.slug}`}
            className="group relative h-[300px] overflow-hidden rounded-3xl"
          >
            <img 
              src={series.headerImage || series.coverImage || ''} 
              alt={series.name}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
            
            <div className="absolute bottom-0 left-0 p-8">
              <h3 className="text-3xl font-black text-white italic uppercase tracking-tighter mb-2">
                {series.name}
              </h3>
              <div className="flex items-center gap-2">
                <span className="text-yellow-500 font-bold group-hover:underline">Explore Collection</span>
                <span className="bg-yellow-500 text-black text-xs font-bold px-2 py-0.5 rounded-full">
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
