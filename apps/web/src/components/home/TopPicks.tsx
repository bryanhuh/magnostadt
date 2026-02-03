import { Link } from 'react-router-dom';
import { trpc } from '../../utils/trpc';
import { ArrowRight } from 'lucide-react';
import { SectionHeader } from './SectionHeader';

export function TopPicks() {
  const { data: topPicks } = trpc.getAnimeSeries.useQuery({ 
    names: [
      'FULLMETAL ALCHEMIST: BROTHERHOOD', 
      'Demon Slayer: Kimetsu no Yaiba', 
      'BOCCHI THE ROCK!'
    ] 
  });

  return (
    <section>
      <SectionHeader title="Top Series" subtitle="Shop by your favorite anime" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         {topPicks?.map((anime, index) => (
           <Link 
             key={anime.id} 
             to={`/collection/${(anime as any).slug ?? anime.id}`}
             className="relative h-[500px] group overflow-hidden rounded-3xl bg-gray-900"
           >
              <img 
                src={anime.headerImage ?? anime.coverImage ?? 'https://via.placeholder.com/600x800'} 
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
         {(!topPicks || topPicks.length === 0) && (
           <div className="col-span-full py-10 text-center text-gray-400">Loading Top Picks...</div>
         )}
      </div>
    </section>
  );
}
