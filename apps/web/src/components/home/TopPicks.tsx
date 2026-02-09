import { Link } from 'react-router-dom';
import { trpc } from '../../utils/trpc';
import { ArrowRight } from 'lucide-react';

import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import { useEffect, useRef } from 'react';

export function TopPicks() {
  const containerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        const duration = 3000;
        const animationEnd = Date.now() + duration;
        const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

        const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

        const interval: any = setInterval(function() {
          const timeLeft = animationEnd - Date.now();

          if (timeLeft <= 0) {
            return clearInterval(interval);
          }

          const particleCount = 50 * (timeLeft / duration);
          
          // since particles fall down, start a bit higher than random
          confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
          confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
        }, 250);

        observer.disconnect();
      }
    }, { threshold: 0.1 }); // Trigger earlier

    if (containerRef.current) {
        observer.observe(containerRef.current);
    }
    return () => observer.disconnect();
  }, []);

  const { data: topPicks } = trpc.getAnimeSeries.useQuery({ 
    names: [
      'Fate/Zero',
      'Fate/stay night [Unlimited Blade Works]',
      'Fate/stay night [Heaven’s Feel]',
      'Fate/Grand Order - Absolute Demonic Front: Babylonia',
      'Fate/Apocrypha',
      // 'Fate/Grand Order',
      // 'Demon Slayer: Kimetsu no Yaiba',
      // 'BOCCHI THE ROCK!',
      // 'Sword Art Online'
    ] 
  });

  return (
    <section ref={containerRef} className="relative w-full">
      {/* Marquee Header */}
      {/* The Exhibit Header */}
      <div className="w-full bg-gray-50 dark:bg-gray-950 pt-24 pb-12 px-6 md:px-12 flex flex-col items-center relative z-20 transition-colors duration-300">
        <div className="w-full max-w-[1400px]">
          <div className="flex flex-col md:flex-row items-end justify-between gap-6 mb-8">
            <div className="relative">
              <motion.div
                initial={{ width: 0 }}
                whileInView={{ width: "100%" }}
                viewport={{ once: true }}
                transition={{ duration: 1, ease: "easeInOut" }}
                className="absolute -top-6 left-0 h-[1px] bg-gradient-to-r from-gray-900 to-transparent dark:from-[#F0E6CA] dark:to-transparent"
              />
              <motion.h2 
                initial={{ y: 20, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="text-5xl md:text-7xl font-libre-bodoni text-gray-900 dark:text-[#F0E6CA] leading-none transition-colors"
              >
                Staff Top Picks
              </motion.h2>
              <motion.p 
                initial={{ y: 20, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
                className="text-gray-600 dark:text-gray-400 mt-4 text-sm md:text-base max-w-md font-exo-2 tracking-wide transition-colors"
              >
                Curated collections from the most acclaimed series in modern anime history.
              </motion.p>
            </div>

            <Link
              to="/collections"
              className="group flex items-center gap-3 text-gray-900 dark:text-[#F0E6CA] hover:text-gray-600 dark:hover:text-white transition-colors pb-2 border-b border-transparent hover:border-gray-900 dark:hover:border-[#F0E6CA] font-exo-2 uppercase tracking-widest text-xs"
            >
              View Full Collection
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
          
          <motion.div 
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1.2, ease: "easeInOut" }}
            className="w-full h-[1px] bg-gray-200 dark:bg-[#F0E6CA]/20 origin-left transition-colors"
          />
        </div>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 bg-gray-50 dark:bg-gray-950 transition-colors duration-300">
         {topPicks?.map((anime, index) => (
           <motion.div
             key={anime.id}
             initial={{ opacity: 0, scale: 0.95 }}
             whileInView={{ opacity: 1, scale: 1 }}
             viewport={{ once: true }}
             transition={{ duration: 0.6, delay: index * 0.1, ease: "easeOut" }}
             className="relative group overflow-hidden border-r border-[#F0E6CA]/20 first:border-l last:border-r h-[600px]"
           >
             <Link 
               to={`/collection/${(anime as any).slug ?? anime.id}`}
               className="block w-full h-full relative"
             >
                {/* 1. Atmospheric Background (Heavily Blurred) */}
                <div className="absolute inset-0 z-0">
                  <img 
                    src={anime.coverImage ?? anime.headerImage ?? 'https://via.placeholder.com/600x800'} 
                    alt=""
                    className="h-full w-full object-cover blur-3xl scale-150 opacity-50 saturate-150 transition-opacity duration-700 group-hover:opacity-70"
                  />
                </div>

                {/* 2. Texture Overlay */}
                <div className="absolute inset-0 z-10 opacity-40 mix-blend-overlay" 
                     style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='1'/%3E%3C/svg%3E")` }} 
                />

                {/* 3. Main Image Layer */}
                <div className="absolute inset-0 z-0">
                   <img 
                    src={anime.coverImage ?? anime.headerImage ?? 'https://via.placeholder.com/600x800'} 
                    alt={anime.name}
                    className="h-full w-full object-cover opacity-100 grayscale-[30%] group-hover:grayscale-0 transition-all duration-700 group-hover:scale-105"
                  />
                </div>

                {/* 4. Deep Gradient */}
                <div className="absolute inset-0 z-20 bg-gradient-to-t from-gray-50 via-gray-50/20 to-transparent dark:from-gray-950 dark:via-gray-900/20 dark:to-transparent transition-colors" />
                
                {/* Badge - Absolute Top Left */}
                {/* <div className="absolute top-6 left-6 z-30 flex flex-col items-center">
                   <img 
                     src="/ranking-badge.png" 
                     alt="Ranking Badge" 
                     className="w-10 h-10 object-contain drop-shadow-xl mb-1"
                   />
                   <span className="text-[#F0E6CA] font-black tracking-widest uppercase text-[10px] bg-black/50 px-2 py-0.5 rounded backdrop-blur-sm border border-[#F0E6CA]/30">
                     #{index + 1}
                   </span>
                </div> */}

                {/* 5. Content */}
                <div className="absolute bottom-0 left-0 p-8 w-full z-30 translate-y-4 transition-transform duration-500 group-hover:translate-y-0">
                  
                  <h3 className="text-2xl md:text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tighter mb-4 leading-[0.9] drop-shadow-lg line-clamp-2 transition-colors">
                    {anime.name}
                  </h3>
                  
                     <div className="flex items-center gap-3 text-gray-900 dark:text-white font-bold uppercase tracking-wider text-sm opacity-0 transform translate-y-4 transition-all duration-500 group-hover:opacity-100 group-hover:translate-y-0">
                       <div className="h-[2px] w-8 bg-gray-900 dark:bg-[#F0E6CA] transition-colors" />
                       Shop Now <ArrowRight className="w-4 h-4 text-gray-900 dark:text-[#F0E6CA] transition-colors" />
                     </div>
                </div>
             </Link>
           </motion.div>
         ))}
         {(!topPicks || topPicks.length === 0) && (
           <div className="col-span-full py-10 text-center text-gray-400">Loading Top Picks...</div>
         )}
      </div>
    </section>
  );
}
