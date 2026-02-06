import { trpc } from '../utils/trpc';
import { Showcase } from './home/Showcase';
import { TopPicks } from './home/TopPicks';
import { ProductCarousel } from './home/ProductCarousel';
import { SectionHeader } from './home/SectionHeader';
import { SeriesGrid } from './home/SeriesGrid';
import { PopularSeries } from './home/PopularSeries';
import { ArrowRight } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export function HomePage() {
  const navigate = useNavigate();

  // Queries
  const { data: saleProducts, isLoading: salesLoading } = trpc.getProducts.useQuery({ isSale: true, limit: 10 });
  const { data: preorderProducts, isLoading: preorderLoading } = trpc.getProducts.useQuery({ isPreorder: true, limit: 10 });
  const { data: latestProducts, isLoading: latestLoading } = trpc.getProducts.useQuery({ orderBy: 'newest', limit: 10 });

  const { data: seriesList, isLoading: animeLoading } = trpc.getAnimeSeries.useQuery();

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
            onLinkClick={() => navigate('/flash-sale')}
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
         <div className="max-w-[1400px] mx-auto">
           {/* <SectionHeader title="Shop by Category" className="mb-12" /> */}
           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="relative h-[600px] group overflow-hidden rounded-3xl bg-gray-950 transition-all duration-500">
               <div className="absolute inset-0 bg-yellow-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
               
               {/* Inner Dot Container */}
               <div 
                className="relative h-full w-full bg-yellow-500 rounded-2xl overflow-hidden transition-all duration-500 group-hover:rounded-none"
                // style={{ 
                //   backgroundImage: 'radial-gradient(#000 1.5px, transparent 1.5px)', 
                //   backgroundSize: '24px 24px' 
                // }}
               >
                 {/* Image Centered */}
                 <div className="absolute inset-0 flex items-center justify-center pt-10 px-10 transition-transform duration-700">
                   <div className="flex items-end px-10 justify-center gap-[-20px] w-full h-full relative">
                     <img 
                       src="/naruto.png" 
                       alt="Naruto"
                       className="h-[110%] w-auto object-contain z-10 translate-x-10 transition-transform duration-700 drop-shadow-2xl"
                     />
                     <img 
                       src="/sasuke.png" 
                       alt="Sasuke"
                       className="h-[105%] w-auto object-contain z-0 -translate-x-10 transition-transform duration-700 drop-shadow-2xl"
                     />
                   </div>
                 </div>
               </div>

               {/* Content Overlay */}
               <div className="absolute bottom-0 left-0 p-10 z-20 w-full pointer-events-none group-hover:pointer-events-auto">
                  <h3 className="text-6xl font-black text-white uppercase tracking-tighter mb-6 font-orbitron leading-[0.85]">
                    Figures<br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-white/50">Statues</span>
                  </h3>
                  <Link 
                    to="/?category=figures"
                    className="inline-flex items-center gap-2 bg-black text-white hover:bg-yellow-400 px-8 py-4 rounded-xl font-bold uppercase tracking-wider transition-all hover:gap-4 font-orbitron shadow-xl pointer-events-auto"
                  >
                    Shop Now <ArrowRight className="w-5 h-5" />
                  </Link>
                </div>
            </div>

            <div className="relative h-[600px] group overflow-hidden rounded-3xl bg-gray-950 p-20 pb-40 transition-all duration-500 hover:p-0">
               <div className="absolute inset-0 bg-yellow-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
               
               {/* Inner Dot Container */}
               <div 
                className="relative h-full w-full bg-yellow-500 rounded-2xl overflow-hidden transition-all duration-500 group-hover:rounded-none"
                // style={{ 
                //   backgroundImage: 'radial-gradient(#000 1.5px, transparent 1.5px)', 
                //   backgroundSize: '24px 24px' 
                // }}
               >
                 {/* Image Centered */}
                 <div className="absolute inset-0 flex items-center justify-center p-12">
                   <img 
                     src="manga.png" 
                     alt="Manga"
                     className="w-full h-full object-contain transition-transform duration-700 group-hover:scale-110 drop-shadow-2xl"
                   />
                 </div>
               </div>

                 {/* Content Overlay */}
                 <div className="absolute bottom-0 left-0 p-10 z-20 w-full pointer-events-none group-hover:pointer-events-auto">
                   <h3 className="text-6xl font-black text-white uppercase tracking-tighter mb-6 font-orbitron leading-[0.85]">
                     Manga<br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-white/50">Books</span>
                   </h3>
                   <Link 
                      to="/?category=manga"
                      className="inline-flex items-center gap-2 bg-yellow-500 text-black hover:bg-yellow-400 px-8 py-4 rounded-xl font-bold uppercase tracking-wider transition-all hover:gap-4 font-orbitron shadow-xl pointer-events-auto"
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
        {/* <PopularSeries series={seriesList ?? []} isLoading={animeLoading} /> */}
      </div>

      {/* 9. Shop By Series Grid - Full width */}
      <SeriesGrid series={seriesList ?? []} />
    </div>
  );
}
