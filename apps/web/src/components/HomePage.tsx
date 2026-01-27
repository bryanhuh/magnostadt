import { trpc } from '../utils/trpc';
import { Showcase } from './home/Showcase';
import { ProductCarousel } from './home/ProductCarousel';
import { SeriesCarousel } from './home/SeriesCarousel';
import { SectionHeader } from './home/SectionHeader';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export function HomePage() {
  // Queries
  const { data: saleProducts, isLoading: salesLoading } = trpc.getProducts.useQuery({ isSale: true, limit: 10 });
  const { data: preorderProducts, isLoading: preorderLoading } = trpc.getProducts.useQuery({ isPreorder: true, limit: 10 });
  const { data: latestProducts, isLoading: latestLoading } = trpc.getProducts.useQuery({ orderBy: 'newest', limit: 10 });
  const { data: featuredAnime, isLoading: animeLoading } = trpc.getAnimeSeries.useQuery({ featured: true });
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
      <section className="w-full bg-gray-900 py-20">
         <div className="max-w-[1400px] mx-auto px-4 md:px-8">
           <SectionHeader title="Shop by Category" className="mb-12" />
           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="relative h-[500px] group overflow-hidden rounded-3xl bg-gray-950 border border-gray-800">
              <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-transparent to-transparent z-10" />
               <img 
                 src="https://images.unsplash.com/photo-1612036782180-6f0b6cd846fe?q=80&w=2670&auto=format&fit=crop" 
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

            <div className="relative h-[500px] group overflow-hidden rounded-3xl bg-gray-950 border border-gray-800">
              <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-transparent to-transparent z-10" />
               <img 
                 src="https://images.unsplash.com/photo-1629654153578-18e3a241979b?q=80&w=2692&auto=format&fit=crop" 
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
        {/* 6. Top Anime Shop Section */}
        <section>
          <SectionHeader title="Top Series" subtitle="Shop by your favorite anime" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
             {featuredAnime?.slice(0, 3).map((anime, index) => (
               <Link 
                 key={anime.id} 
                 to={`/?animeId=${anime.id}`}
                 className="relative h-[500px] group overflow-hidden rounded-3xl bg-gray-900"
               >
                  <img 
                    src={anime.coverImage ?? 'https://via.placeholder.com/600x800'} 
                    alt={anime.name}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-80 group-hover:opacity-100"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
                  
                  <div className="absolute bottom-0 left-0 p-8 w-full z-10">
                    <span className="text-yellow-500 font-bold tracking-widest uppercase text-sm mb-2 block">
                      Top Pick #{index + 1}
                    </span>
                    <h3 className="text-4xl font-black text-white italic uppercase tracking-tighter mb-4 leading-none">
                      {anime.name}
                    </h3>
                     <div className="flex items-center gap-2 text-gray-300 font-bold uppercase tracking-wider text-sm group-hover:text-yellow-500 transition-colors">
                       Shop Collection <ArrowRight className="w-4 h-4" />
                     </div>
                  </div>
               </Link>
             ))}
          </div>
        </section>

        {/* 7. Latest Drops Section */}
        <section>
          <SectionHeader title="Latest Drops" subtitle="Fresh arrivals just for you" />
          <ProductCarousel products={latestProducts ?? []} isLoading={latestLoading} />
        </section>

        {/* 8. Popular Series Section */}
        <section>
           <SectionHeader title="Popular Series" />
           <SeriesCarousel series={seriesList ?? []} isLoading={animeLoading} />
        </section>
      </div>

      {/* 9. Shop By Series Grid - Full width */}
      <section className="w-full bg-gradient-to-b from-gray-900 to-black py-20">
        <div className="max-w-[1400px] mx-auto px-4 md:px-8">
          <SectionHeader title="All Series" linkText="View All" />
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {seriesList?.map((anime) => (
              <Link 
                key={anime.id} 
                to={`/?animeId=${anime.id}`}
                className="group flex flex-col items-center text-center gap-3 p-4 rounded-xl hover:bg-gray-800 transition-colors"
              >
                <div className="w-full aspect-square rounded-full overflow-hidden border-2 border-gray-800 group-hover:border-yellow-500 transition-colors">
                   <img 
                     src={anime.coverImage ?? 'https://via.placeholder.com/200'} 
                     alt={anime.name}
                     className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                   />
                </div>
                <span className="font-bold text-gray-400 group-hover:text-white transition-colors uppercase text-sm">
                  {anime.name}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
