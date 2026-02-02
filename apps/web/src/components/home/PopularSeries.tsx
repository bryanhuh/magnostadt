import { SectionHeader } from './SectionHeader';
import { SeriesCarousel } from './SeriesCarousel';

interface PopularSeriesProps {
  series: any[]; // Using any[] for now to match flexible TRPC types, ideally should be typed
  isLoading: boolean;
}

export function PopularSeries({ series, isLoading }: PopularSeriesProps) {
  return (
    <section>
       <SectionHeader title="Popular Series" />
       <SeriesCarousel series={series} isLoading={isLoading} />
    </section>
  );
}
