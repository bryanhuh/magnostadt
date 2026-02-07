import { trpc } from '../utils/trpc';
import { Showcase } from './home/Showcase';
import { TopPicks } from './home/TopPicks';
import { ProductCarousel } from './home/ProductCarousel';
import { SectionHeader } from './home/SectionHeader';
import { SeriesGrid } from './home/SeriesGrid';
import { CategoryGrid } from './home/CategoryGrid';
import { useNavigate } from 'react-router-dom';

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
      <CategoryGrid />

      {/* 6. Top Anime Shop Section (Top Picks) */}
      <TopPicks />

      <div className="max-w-[1400px] mx-auto px-4 md:px-8 space-y-20">
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
