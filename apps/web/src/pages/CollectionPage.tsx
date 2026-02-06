import { useParams } from 'react-router-dom';
import { trpc } from '../utils/trpc';
import { SectionHeader } from '../components/home/SectionHeader';
import { ProductCard } from '../components/ProductCard';

export function CollectionPage() {
  const { slug } = useParams<{ slug: string }>();
  
  const { data: seriesList, isLoading } = trpc.getAnimeSeries.useQuery(
    { slug },
    { enabled: !!slug }
  );

  const series = seriesList?.[0]; // valid for single slug fetch logic

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-yellow-500"></div>
      </div>
    );
  }

  if (!series) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4">
        <h1 className="text-4xl font-black text-gray-900">Collection Not Found</h1>
        <p className="text-gray-500">The series you are looking for does not exist.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Hero Header */}
      <div className="relative h-[60vh] min-h-[500px] w-full bg-black overflow-hidden">
        <img 
          src={series.headerImage || series.coverImage || ''} 
          alt={series.name}
          className={`w-full h-full object-cover opacity-60 ${!series.headerImage ? 'blur-xl scale-105' : ''}`}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-gray-50 via-transparent to-black/50" />
        
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8 mt-20">
          <h1 className="text-6xl md:text-8xl font-black text-white uppercase tracking-tighter drop-shadow-2xl mb-6">
            {series.name}
          </h1>
          {series.description && (
             <p className="max-w-2xl text-xl text-gray-200 font-medium leading-relaxed drop-shadow-md bg-black/30 backdrop-blur-sm p-6 rounded-2xl border border-white/10">
               {series.description}
             </p>
          )}
        </div>
      </div>

      {/* Products Grid */}
      <div className="max-w-[1400px] mx-auto px-4 md:px-8 -mt-20 relative z-10">
        <div className="bg-white rounded-3xl p-8 md:p-12 shadow-xl border border-gray-100">
           <SectionHeader 
             title={`${series.name} Collection`} 
             subtitle={`Explore exclusive products from ${series.name}`}
           />
           
           {/* Type casting to any for products due to intricate inference issues with TRPC include types in this context */}
           {(series as any).products?.length > 0 ? (
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
               {(series as any).products.map((product: any) => (
                 <ProductCard key={product.id} product={product} />
               ))}
             </div>
           ) : (
             <div className="text-center py-20 text-gray-400">
               <p className="text-xl">No products available yet.</p>
             </div>
           )}
        </div>
      </div>
    </div>
  );
}
