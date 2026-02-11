import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { trpc } from '../../utils/trpc';

export function CategoryGrid() {
  // Fetch manga products for dynamic display
  const { data: mangaProducts } = trpc.getProducts.useQuery({ categoryName: 'Manga', limit: 4 });

  return (

    <section className="w-full bg-gradient-to-b from-gray-50 via-gray-100 to-gray-50 dark:from-[#0a0f1c] dark:via-[#111827] dark:to-[#0a0f1c] py-20 border-y border-gray-200 dark:border-[#F0E6CA]/10 transition-colors duration-300">
      <div className="max-w-[1700px] mx-auto">
        {/* <SectionHeader title="Shop by Category" className="mb-12" /> */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Figures & Statues Card */}
          <div className="relative h-[600px] group overflow-hidden rounded-3xl bg-white dark:bg-[#1a2333] border border-gray-200 dark:border-[#F0E6CA]/10 transition-all duration-500 hover:border-gray-900 dark:hover:border-[#F0E6CA]/30 shadow-lg dark:shadow-none">
            <div className="absolute inset-0 bg-gray-900/5 dark:bg-[#F0E6CA]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            
            {/* Inner Dot Container */}
            <div 
              className="relative h-full w-full bg-gray-100 dark:bg-[#F0E6CA] rounded-2xl overflow-hidden transition-all duration-500 group-hover:rounded-none opacity-90 group-hover:opacity-100"
              style={{ 
                backgroundImage: 'radial-gradient(#0a0f1c 1.5px, transparent 1.5px)', 
                backgroundSize: '24px 24px' 
              }}
            >
              {/* Image Centered */}
              <div className="absolute inset-0 flex items-center justify-center pt-10 px-10 transition-transform duration-700">
                <div className="flex items-end px-10 justify-center w-full h-full relative">
                  <img 
                    src="/naruto.png" 
                    alt="Naruto"
                    className="h-[110%] w-auto object-contain z-10 translate-x-8 transition-transform duration-700 drop-shadow-2xl grayscale-[20%] group-hover:grayscale-0"
                  />
                  <img 
                    src="/sasuke.png" 
                    alt="Sasuke"
                    className="h-[105%] w-auto object-contain z-0 -translate-x-8 -ml-30 transition-transform duration-700 drop-shadow-2xl grayscale-[20%] group-hover:grayscale-0"
                  />
                </div>
              </div>
            </div>

            {/* Content Overlay */}
            <div className="absolute bottom-0 left-0 p-10 z-20 w-full pointer-events-none group-hover:pointer-events-auto">
              <h3 className="text-6xl font-black text-gray-900 dark:text-white uppercase tracking-tighter mb-6 font-libre-bodoni leading-[0.85] drop-shadow-lg transition-colors">
                Figures<br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-gray-900 to-gray-500 dark:from-white dark:to-white/50 transition-all">Statues</span>
              </h3>
              <Link 
                to="/shop?category=Figures"
                className="inline-flex items-center gap-2 bg-gray-900 text-white dark:bg-[#0a0f1c] dark:text-[#F0E6CA] hover:bg-gray-800 dark:hover:bg-[#F0E6CA] hover:text-white dark:hover:text-[#0a0f1c] px-8 py-4 rounded-xl font-bold uppercase tracking-wider transition-all hover:gap-4 font-exo-2 shadow-xl pointer-events-auto border border-gray-700 dark:border-[#F0E6CA]/20"
              >
                Shop Now <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>

          {/* Manga & Books Card */}
          <div className="relative h-[600px] group overflow-hidden rounded-3xl bg-white dark:bg-[#1a2333] border border-gray-200 dark:border-[#F0E6CA]/10 transition-all duration-500 hover:border-gray-900 dark:hover:border-[#F0E6CA]/30 shadow-lg dark:shadow-none">
            <div className="absolute inset-0 bg-gray-900/5 dark:bg-[#F0E6CA]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            
            {/* Inner Container */}
            <div 
              className="relative h-full w-full rounded-2xl overflow-hidden transition-all duration-500 group-hover:rounded-none bg-gray-100 dark:bg-[#151b2b] [--pattern-color:rgba(17,24,39,0.05)] dark:[--pattern-color:rgba(240,230,202,0.05)]"
              style={{ 
                backgroundImage: `repeating-conic-gradient(
                  from 0deg at 50% 50%,
                  transparent 0deg,
                  transparent 10deg,
                  var(--pattern-color) 10deg,
                  var(--pattern-color) 20deg
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
                      className="h-[100%] w-auto object-contain transition-transform duration-700 group-hover:scale-110 drop-shadow-2xl grayscale-[20%] group-hover:grayscale-0"
                    />
                  ) : (
                    mangaProducts.map((product, index) => (
                      <div 
                        key={product.id} 
                        className="absolute h-[75%] aspect-[2/3] transition-all duration-700 ease-out hover:z-50 hover:scale-110 shadow-2xl rounded-lg overflow-hidden group-hover:shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-[#F0E6CA]/20"
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
              <h3 className="text-6xl font-black text-gray-900 dark:text-white uppercase tracking-tighter mb-6 font-libre-bodoni leading-[0.85] drop-shadow-lg transition-colors">
                Manga<br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-gray-900 to-gray-500 dark:from-white dark:to-white/50 transition-all">Books</span>
              </h3>
              <Link 
                to="/shop?category=Manga"
                className="inline-flex items-center gap-2 bg-gray-900 text-white dark:bg-[#F0E6CA] dark:text-[#0a0f1c] hover:bg-gray-800 dark:hover:bg-white px-8 py-4 rounded-xl font-bold uppercase tracking-wider transition-all hover:gap-4 font-exo-2 shadow-xl pointer-events-auto"
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
