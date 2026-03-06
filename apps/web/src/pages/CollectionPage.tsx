import { useParams } from 'react-router-dom';
import { trpc } from '../utils/trpc';
import { SectionHeader } from '../components/home/SectionHeader';
import { ProductCard } from '../components/ProductCard';
import { Sparkles } from 'lucide-react';

export function CollectionPage() {
  const { slug } = useParams<{ slug: string }>();
  
  const { data: seriesList, isLoading } = trpc.getAnimeSeries.useQuery(
    { slug },
    { enabled: !!slug }
  );

  const series = seriesList?.[0]; // valid for single slug fetch logic

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#0a0f1c] flex items-center justify-center transition-colors duration-300">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-yellow-500 dark:border-[#F0E6CA]"></div>
      </div>
    );
  }

  if (!series) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#0a0f1c] flex flex-col items-center justify-center gap-4 transition-colors duration-300">
        <h1 className="text-4xl font-black text-gray-900 dark:text-[#F0E6CA]">Collection Not Found</h1>
        <p className="text-gray-500 dark:text-gray-400">The series you are looking for does not exist.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0a0f1c] pb-20 transition-colors duration-300">
      {/* Hero Header */}
      <div className="relative h-[60vh] min-h-[500px] w-full bg-black overflow-hidden">
        <img 
          src={series.headerImage || series.coverImage || ''} 
          alt={series.name}
          className={`w-full h-full object-cover opacity-60 ${!series.headerImage ? 'blur-xl scale-105' : ''}`}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-gray-50 dark:from-[#0a0f1c] via-transparent to-black/50 transition-colors duration-300" />
        
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
      <div className="max-w-[1400px] mx-auto px-4 md:px-8 -mt-20 relative z-10 text-gray-900 dark:text-gray-100">
        <div className="bg-white dark:bg-[#1a2333] rounded-3xl p-8 md:p-12 shadow-xl border border-gray-100 dark:border-[#F0E6CA]/10 transition-colors duration-300">
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
             <div className="flex flex-col items-center justify-center py-24 gap-6">
               <div className="relative">
                 <div className="w-32 h-32 rounded-full bg-gradient-to-br from-yellow-500/10 to-amber-500/5 dark:from-[#F0E6CA]/10 dark:to-amber-500/5 border border-yellow-500/20 dark:border-[#F0E6CA]/10 flex items-center justify-center">
                   <Sparkles className="w-12 h-12 text-yellow-500/40 dark:text-[#F0E6CA]/30" />
                 </div>
                 <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-yellow-500/30 dark:bg-[#F0E6CA]/20 animate-ping" />
                 <div className="absolute -bottom-2 -left-2 w-3 h-3 rounded-full bg-amber-500/20 dark:bg-[#F0E6CA]/10 animate-pulse" />
               </div>
               <div className="text-center">
                 <p className="text-gray-900 dark:text-[#F0E6CA] font-black uppercase tracking-widest text-lg font-exo-2 mb-2">
                   Coming Soon
                 </p>
                 <p className="text-gray-400 dark:text-gray-500 text-sm font-medium max-w-xs">
                   Products for this collection are on their way. Check back soon.
                 </p>
               </div>
             </div>
           )}
        </div>
      </div>
    </div>
  );
}
