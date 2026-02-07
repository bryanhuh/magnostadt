import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { trpc } from '../../utils/trpc';
import { SectionHeader } from './SectionHeader';

export function CategoryGrid() {
  // Fetch manga products for dynamic display
  const { data: mangaProducts } = trpc.getProducts.useQuery({ categoryName: 'Manga', limit: 4 });

  return (
    <section className="w-full bg-[#F0E6CA] py-20">
      <div className="max-w-[1700px] mx-auto">
        {/* <SectionHeader title="Shop by Category" className="mb-12" /> */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Figures & Statues Card */}
          <div className="relative h-[600px] group overflow-hidden rounded-3xl bg-gray-950 transition-all duration-500 hover:p-0">
            <div className="absolute inset-0 bg-yellow-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            
            {/* Inner Dot Container */}
            <div 
              className="relative h-full w-full bg-yellow-500 rounded-2xl overflow-hidden transition-all duration-500 group-hover:rounded-none"
              style={{ 
                backgroundImage: 'radial-gradient(#000 1.5px, transparent 1.5px)', 
                backgroundSize: '24px 24px' 
              }}
            >
              {/* Image Centered */}
              <div className="absolute inset-0 flex items-center justify-center pt-10 px-10 transition-transform duration-700">
                <div className="flex items-end px-10 justify-center w-full h-full relative">
                  <img 
                    src="/naruto.png" 
                    alt="Naruto"
                    className="h-[110%] w-auto object-contain z-10 translate-x-8 transition-transform duration-700 drop-shadow-2xl"
                  />
                  <img 
                    src="/sasuke.png" 
                    alt="Sasuke"
                    className="h-[105%] w-auto object-contain z-0 -translate-x-8 -ml-30 transition-transform duration-700 drop-shadow-2xl"
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
                to="/shop?category=Figures"
                className="inline-flex items-center gap-2 bg-black text-white hover:bg-yellow-400 px-8 py-4 rounded-xl font-bold uppercase tracking-wider transition-all hover:gap-4 font-orbitron shadow-xl pointer-events-auto"
              >
                Shop Now <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>

          {/* Manga & Books Card */}
          <div className="relative h-[600px] group overflow-hidden rounded-3xl bg-gray-950 transition-all duration-500 hover:p-0">
            <div className="absolute inset-0 bg-yellow-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            
            {/* Inner Container */}
            <div 
              className="relative h-full w-full rounded-2xl overflow-hidden transition-all duration-500 group-hover:rounded-none"
              style={{ 
                backgroundColor: '#0a0a0a',
                backgroundImage: `repeating-conic-gradient(
                  from 0deg at 50% 50%,
                  transparent 0deg,
                  transparent 10deg,
                  rgba(255, 255, 255, 0.03) 10deg,
                  rgba(255, 255, 255, 0.03) 20deg
                )`,
              }}
            >
              {/* Images Row */}
              <div className="absolute inset-0 flex items-center justify-center p-12 overflow-hidden">
                <div className="relative w-full h-full flex items-center justify-center perspective-[1000px]">
                  {/* Fallback to static image if no products or error */}
                  {!mangaProducts || mangaProducts.length === 0 ? (
                    <img 
                      src="manga.png" 
                      alt="Manga"
                      className="h-[100%] w-auto object-contain transition-transform duration-700 group-hover:scale-110 drop-shadow-2xl"
                    />
                  ) : (
                    mangaProducts.map((product, index) => (
                      <div 
                        key={product.id} 
                        className="absolute h-[75%] aspect-[2/3] transition-all duration-700 ease-out hover:z-50 hover:scale-110 shadow-2xl rounded-lg overflow-hidden group-hover:shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-white/10"
                        style={{
                          // Diagonal stacking logic: spread horizontally, rotate slightly, stagger z-index
                          transform: `translateX(${(index - 1.5) * 45}px) translateY(${(index % 2 === 0 ? 10 : -10)}px) rotate(${(index - 1.5) * 8}deg)`,
                          zIndex: 10 + index, 
                        }}
                      >
                        <img
                          src={product.imageUrl ?? product.images?.[0] ?? '/placeholder.png'}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Content Overlay */}
            <div className="absolute bottom-0 left-0 p-10 z-20 w-full pointer-events-none group-hover:pointer-events-auto">
              <h3 className="text-6xl font-black text-white uppercase tracking-tighter mb-6 font-orbitron leading-[0.85]">
                Manga<br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-white/50">Books</span>
              </h3>
              <Link 
                to="/shop?category=Manga"
                className="inline-flex items-center gap-2 bg-yellow-500 text-black hover:bg-yellow-400 px-8 py-4 rounded-xl font-bold uppercase tracking-wider transition-all hover:gap-4 font-orbitron shadow-xl pointer-events-auto"
              >
                Start Reading <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
