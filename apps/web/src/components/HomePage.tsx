import { trpc } from '../utils/trpc';
import { Showcase } from './home/Showcase';
import { TopPicks } from './home/TopPicks';
import { ProductCarousel } from './home/ProductCarousel';
import { SeriesCarousel } from './home/SeriesCarousel';
import { SectionHeader } from './home/SectionHeader';
import { SeriesGrid } from './home/SeriesGrid';
import { PopularSeries } from './home/PopularSeries';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export function HomePage() {
  // Queries
  const { data: saleProducts, isLoading: salesLoading } = trpc.getProducts.useQuery({ isSale: true, limit: 10 });
  const { data: preorderProducts, isLoading: preorderLoading } = trpc.getProducts.useQuery({ isPreorder: true, limit: 10 });
  const { data: latestProducts, isLoading: latestLoading } = trpc.getProducts.useQuery({ orderBy: 'newest', limit: 10 });
  
  // Showcase Featured Anime (Single)
  const { data: featuredAnimeList, isLoading: animeLoading } = trpc.getAnimeSeries.useQuery({ featured: true });

  const { data: seriesList } = trpc.getAnimeSeries.useQuery();

  return (
    <div className="space-y-20 pb-20">
      {/* 1. Showcase Section - Full Width handled by component */}
      <Showcase />

      <div className="max-w-[1400px] mx-auto px-4 md:px-8 space-y-20">
        {/* 2. Sale Products Section */}
        <section>
          <SectionHeader 
            title="Flash Sale" 
            subtitle="Limited time offers on premium items"
            linkText="View All Sales"
            onLinkClick={() => { /* Navigate to sales */ }}
          />
          <ProductCarousel products={saleProducts ?? []} isLoading={salesLoading} />
        </section>

        {/* 4. Pre-order Items Section */}
        <section>
          <SectionHeader 
            title="Pre-Orders" 
            subtitle="Be the first to own these upcoming treasures"
            linkText="View All Pre-orders"
          />
          <ProductCarousel products={preorderProducts ?? []} isLoading={preorderLoading} />
        </section>
      </div>

      {/* 5. Shop Figures and Manga (Grid) - Full Width */}
      <section className="w-full bg-gray-100 py-20">
         <div className="max-w-[1400px] mx-auto px-4 md:px-8">
           <SectionHeader title="Shop by Category" className="mb-12" />
           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="relative h-[500px] group overflow-hidden rounded-3xl bg-white border border-gray-200">
              <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-transparent to-transparent z-10" />
               <img 
                 src="/figures.png" 
                 alt="Figures"
                 className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-70"
               />
               <div className="absolute bottom-0 left-0 p-12 z-20">
                 <h3 className="text-5xl font-black text-white uppercase italic tracking-tighter mb-6">
                   Figures & Statues
                 </h3>
                 <Link 
                   to="/?category=figures"
                   className="inline-flex items-center gap-2 bg-yellow-500 hover:bg-yellow-400 text-black px-8 py-4 rounded-xl font-bold uppercase tracking-wider transition-colors"
                 >
                   Shop Now <ArrowRight className="w-5 h-5" />
                 </Link>
               </div>
            </div>



            <div className="relative h-[500px] group overflow-hidden rounded-3xl bg-white border border-gray-200">
              <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-transparent to-transparent z-10" />
               <img 
                 src="manga.png" 
                 alt="Manga"
                 className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-70"
               />
               <div className="absolute bottom-0 left-0 p-12 z-20">
                 <h3 className="text-5xl font-black text-white uppercase italic tracking-tighter mb-6">
                   Manga & Books
                 </h3>
                 <Link 
                    to="/?category=manga"
                    className="inline-flex items-center gap-2 bg-white text-black hover:bg-gray-200 px-8 py-4 rounded-xl font-bold uppercase tracking-wider transition-colors"
                 >
                   Start Reading <ArrowRight className="w-5 h-5" />
                 </Link>
               </div>
            </div>
           </div>
         </div>
      </section>

      <div className="max-w-[1400px] mx-auto px-4 md:px-8 space-y-20">
        {/* 6. Top Anime Shop Section (Top Picks) */}
        <TopPicks />

        {/* 7. Latest Drops Section */}
        <section>
          <SectionHeader title="Latest Drops" subtitle="Fresh arrivals just for you" />
          <ProductCarousel products={latestProducts ?? []} isLoading={latestLoading} />
        </section>

        {/* 8. Popular Series Section */}
        <PopularSeries series={seriesList ?? []} isLoading={animeLoading} />
      </div>

      {/* 9. Shop By Series Grid - Full width */}
      <SeriesGrid series={seriesList ?? []} />
    </div>
  );
}
