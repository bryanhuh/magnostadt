import { Link } from 'react-router-dom';
import { trpc } from '../../utils/trpc';
import { ArrowRight, ShoppingBag, Plus, Star } from 'lucide-react';

export function Showcase() {
  const { data: featuredAnime } = trpc.getAnimeSeries.useQuery({ featured: true });

  // Fallback defaults
  const showcaseItem = featuredAnime?.[0] || {
    id: 'placeholder',
    name: 'Demon Slayer: Kimetsu no Yaiba',
    description: 'Tanjiro Kamado lives a modest but blissful life in the mountains with his family.',
    coverImage: 'https://store.aniplexusa.com/demonslayer/images/header.jpg', // Fallback interesting image
    products: []
  };

  const products = showcaseItem.products || [];

  return (
    <section className="relative w-full h-[90vh] min-h-[700px] bg-black overflow-hidden group">
      
      {/* --- BACKGROUND LAYER (Atmospheric) --- */}
      <div className="absolute inset-0 z-0">
         {/* Blurry Background Version */}
         <img 
            src={showcaseItem.coverImage ?? ''} 
            alt="Atmosphere" 
            className="w-full h-full object-cover opacity-40 blur-3xl scale-110"
         />
         
         {/* Darkness Overlays */}
         <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
         <div className="absolute inset-0 bg-gradient-to-r from-black via-black/60 to-transparent" />
         
         {/* Noise Texture */}
         <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay" />
      </div>

      {/* --- CONTENT LAYER --- */}
      <div className="relative z-10 w-full h-full max-w-[1600px] mx-auto px-4 md:px-8 flex flex-col justify-center h-full">
        
        <div className="flex flex-col md:flex-row items-center gap-12 md:gap-20 h-full pt-20">
            
            {/* 1. TEXT INFO (Left - 45%) */}
            <div className="w-full md:w-[45%] space-y-8 flex flex-col justify-center">
                
                {/* Badge */}
                <div className="flex items-center gap-3">
                     <div className="flex items-center gap-2 px-3 py-1.5 bg-yellow-400 text-black font-black uppercase tracking-widest text-xs rounded-sm shadow-lg shadow-yellow-500/20">
                        <Star className="w-3 h-3 fill-black" />
                        Spotlight
                     </div>
                     <div className="h-[1px] w-12 bg-white/50" />
                     <span className="text-white/80 uppercase tracking-widest text-xs font-bold shadow-black drop-shadow-md">
                         Premium Edition
                     </span>
                </div>

                <h1 className="text-6xl md:text-7xl lg:text-8xl font-black text-white uppercase italic tracking-tighter leading-[0.9] drop-shadow-xl">
                    {showcaseItem.name}
                </h1>
                
                <p className="text-gray-200 text-lg md:text-xl font-medium max-w-xl leading-relaxed line-clamp-3 drop-shadow-md border-l-4 border-yellow-500 pl-6">
                   {showcaseItem.description ?? "Experience the thrill of the hunt. Official merchandise, figures, and apparel available now."}
                </p>

                <div className="flex flex-wrap gap-4 pt-4">
                    <Link 
                        to={`/?animeId=${showcaseItem.id}`}
                        className="bg-white text-black px-10 py-5 rounded-sm font-black text-lg uppercase tracking-wider hover:bg-yellow-400 hover:scale-105 transition-all flex items-center gap-3 shadow-[0_0_20px_rgba(255,255,255,0.3)]"
                    >
                        Shop Collection <ArrowRight className="w-5 h-5" />
                    </Link>
                    <button className="px-10 py-5 rounded-sm font-bold text-white border border-white/30 hover:bg-white/10 backdrop-blur-md uppercase tracking-wider transition-all">
                        Watch Trailer
                    </button>
                </div>
            </div>

            {/* 2. VISUAL COMPOSITION (Right - 55%) */}
            <div className="relative w-full md:w-[55%] h-full flex items-center justify-center md:justify-end perspective-[2000px]">
                
                 {/* The "Cinematic Poster" */}
                 <div className="hidden md:block relative z-10 w-auto h-[70%] max-h-[800px] aspect-[2/3] transform rotate-y-[-10deg] rotate-x-[5deg] hover:rotate-0 transition-transform duration-700 ease-out preserve-3d group-hover:scale-105">
                    <img 
                        src={showcaseItem.coverImage ?? ''} 
                        alt="Series Poster"
                        className="w-full h-full object-cover rounded-xl shadow-[20px_40px_80px_-20px_rgba(0,0,0,0.8)] border border-white/10"
                    />
                    {/* Gloss / Reflection */}
                    <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent rounded-xl pointer-events-none mix-blend-overlay" />
                 </div>

                 {/* Floating Products (Overlapping the Poster) */}
                 {products.length > 0 && (
                    <div className="absolute bottom-20 right-10 md:right-auto md:left-20 z-20 flex gap-4 md:gap-[calc(-3rem)]">
                        {products.slice(0, 3).map((product, idx) => (
                            <Link 
                                to={`/product/${product.slug}`}
                                key={product.id}
                                className={`
                                    relative w-40 md:w-48 aspect-[3/4] 
                                    bg-black/60 backdrop-blur-xl border border-white/20 rounded-xl overflow-hidden shadow-2xl
                                    transition-all duration-300 hover:scale-110 hover:z-50 hover:bg-black/80 hover:border-yellow-500/50
                                    ${idx % 2 === 0 ? '-translate-y-10' : 'translate-y-0'} /* Dynamic staggered look */
                                `}
                            >
                                <img 
                                    src={product.imageUrl ?? ''} 
                                    alt={product.name} 
                                    className="w-full h-full object-cover opacity-90 group-hover:opacity-100"
                                />
                                <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black via-black/80 to-transparent">
                                    <p className="text-white text-xs font-bold line-clamp-1">{product.name}</p>
                                    <p className="text-yellow-400 text-xs font-mono font-bold">${product.price}</p>
                                </div>
                            </Link>
                        ))}
                    </div>
                 )}
            </div>

        </div>
      </div>
    </section>
  );
}
