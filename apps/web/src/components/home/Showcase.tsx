import { Link } from 'react-router-dom';
import { trpc } from '../../utils/trpc';
import { ArrowRight, ShoppingBag } from 'lucide-react';

export function Showcase() {
  const { data: featuredAnime } = trpc.getAnimeSeries.useQuery({ featured: true });

  // Fallback if no featured anime or loading
  const showcaseItem = featuredAnime?.[0] || {
    id: 'placeholder',
    name: 'Demon Slayer: Kimetsu no Yaiba',
    description: 'Tanjiro Kamado lives a modest but blissful life in the mountains with his family.',
    coverImage: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?q=80&w=2670&auto=format&fit=crop', // Placeholder anime bg
  };

  return (
    <section className="relative h-[600px] w-full overflow-hidden rounded-3xl mb-16 group">
      {/* Background Image */}
      <div className="absolute inset-0">
        <img 
          src={showcaseItem.coverImage ?? 'https://via.placeholder.com/1920x1080?text=Anime+Showcase'} 
          alt={showcaseItem.name} 
          className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/50 to-transparent" />
      </div>

      {/* Content */}
      <div className="absolute inset-0 flex flex-col justify-center px-8 md:px-16 max-w-3xl">
        <span className="text-yellow-500 font-bold tracking-widest uppercase mb-4 animate-fade-in-up">
          Featured Series
        </span>
        
        <h1 className="text-5xl md:text-7xl font-black text-white italic uppercase tracking-tighter mb-6 leading-[0.9] drop-shadow-2xl">
          {showcaseItem.name}
        </h1>
        
        <p className="text-gray-200 text-lg md:text-xl mb-8 line-clamp-3 max-w-xl font-medium drop-shadow-md">
          {showcaseItem.description ?? "Experience the latest merchandise from this incredible series. detailed figures, apparel, and more available now."}
        </p>

        <div className="flex flex-wrap gap-4">
          <Link 
            to={`/?animeId=${showcaseItem.id}`}
            className="bg-yellow-500 hover:bg-yellow-400 text-black px-8 py-4 rounded-xl font-black uppercase tracking-wider flex items-center gap-2 transition-transform hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(234,179,8,0.4)]"
          >
            Shop Collection <ShoppingBag className="w-5 h-5" />
          </Link>
          
          <button className="bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white px-8 py-4 rounded-xl font-bold uppercase tracking-wider flex items-center gap-2 transition-colors">
            View Trailer <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </section>
  );
}
