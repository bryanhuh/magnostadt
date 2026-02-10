import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { trpc } from '../utils/trpc';
import { SearchBar } from './SearchBar';
import { useCartStore } from '../store/useCartStore';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const navigate = useNavigate();
  const { data: animeSeries, isLoading } = trpc.getAnimeSeries.useQuery();
  const openCart = useCartStore((state) => state.openCart);

  const topLinks = [
    { name: 'Anime Collections', path: '/collections' },
    { name: 'Products', path: '/shop' },
    { name: 'My Account', path: '/profile' },
    { name: 'Cart', path: '/cart', isAction: true }, // Special handling for Cart perhaps, or just a route? User said "Under My Profile there should be a Cart (just a test not icon)" - implying text link.
  ];

  const middleLinks = [
    { name: 'Blu-ray & DVD', path: '/shop?category=Blu-ray' },
    { name: 'Collectibles', path: '/shop?category=Collectibles' },
    { name: 'Figures', path: '/shop?category=Figures' },
    { name: 'Manga', path: '/shop?category=Manga' },
    { name: 'Accessories', path: '/shop?category=Accessories' },
    { name: 'Apparel', path: '/shop?category=Apparel' },
  ];

  const socialLinks = [
    { name: 'Twitter', href: '#' },
    { name: 'Facebook', href: '#' },
    { name: 'Instagram', href: '#' },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[150]"
          />

          {/* Modal Container - Pointy (rounded-none) */}
          <motion.div
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-x-0 bottom-0 top-20 z-[160] bg-white dark:bg-[#0a0f1c] flex flex-col md:flex-row shadow-2xl overflow-hidden rounded-none"
          >
             {/* Close Button (Absolute) */}
             <button 
                onClick={onClose}
                className="absolute top-4 right-4 p-2 bg-gray-100 dark:bg-[#1a2333] rounded-full hover:bg-red-500 hover:text-white transition-colors z-50"
              >
                <X className="w-6 h-6" />
              </button>

            {/* Sidebar (Left) */}
            <div className="w-full md:w-1/3 lg:w-1/4 bg-gray-50 dark:bg-[#1a2333]/50 p-8 md:p-12 flex flex-col gap-12 border-r border-gray-200 dark:border-[#F0E6CA]/10 overflow-y-auto">
              
              {/* Top Links (4xl/5xl) */}
              <nav className="flex flex-col space-y-6">
                {topLinks.map((link) => (
                  <button
                    key={link.name}
                    onClick={() => {
                        if (link.path === '/cart') {
                            openCart();
                        } else {
                            navigate(link.path);
                        }
                        onClose();
                    }}
                    className="text-left text-4xl md:text-5xl font-black text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-[#F0E6CA] transition-colors uppercase tracking-tighter font-exo-2 leading-[0.8]"
                  >
                    {link.name}
                  </button>
                ))}
              </nav>

              {/* Middle Links (2xl) */}
              <nav className="flex flex-col space-y-4">
                 {middleLinks.map((link) => (
                    <button
                        key={link.name}
                        onClick={() => {
                            navigate(link.path);
                            onClose();
                        }}
                        className="text-left text-2xl font-bold text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-[#F0E6CA] transition-colors uppercase tracking-tight font-exo-2"
                    >
                        {link.name}
                    </button>
                 ))}
              </nav>

              {/* Social Links (Text + Arrow) */}
              <div className="mt-auto pt-8 space-y-4">
                 <div className="flex flex-col gap-3">
                    {socialLinks.map((link, i) => (
                      <a key={i} href={link.href} className="group flex items-center gap-2 text-gray-400 hover:text-gray-900 dark:hover:text-[#F0E6CA] transition-colors uppercase tracking-widest text-sm font-bold">
                        {link.name}
                        <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                      </a>
                    ))}
                 </div>
              </div>
            </div>

            {/* Main Content (Right) */}
            <div className="flex-1 p-8 md:p-12 overflow-y-auto bg-white dark:bg-[#0a0f1c]">
              <div className="max-w-5xl mx-auto space-y-12">
                
                {/* 1. Search by Anime (Grid) - First */}
                <div className="space-y-6">
                  <h3 className="text-sm font-bold uppercase text-gray-500 tracking-wider font-exo-2">Search by Anime</h3>
                  
                  {isLoading ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-pulse">
                      {[...Array(8)].map((_, i) => (
                        <div key={i} className="h-8 bg-gray-200 dark:bg-[#1a2333] rounded-none" />
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-x-8 gap-y-4">
                      {animeSeries?.slice(0, 20).map((series) => (
                        <button
                          key={series.id}
                          onClick={() => {
                            navigate(`/shop?search=${encodeURIComponent(series.name)}`);
                            onClose();
                          }}
                          className="text-lg md:text-xl font-bold text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-[#F0E6CA] transition-colors font-exo-2"
                        >
                          {series.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="border-t border-gray-100 dark:border-[#F0E6CA]/10" />

                {/* 2. Search by Keyword - Second */}
                <div className="space-y-6">
                   <h3 className="text-sm font-bold uppercase text-gray-500 tracking-wider font-exo-2">Search by Keyword</h3>
                   <div className="max-w-2xl">
                      <SearchBar onSearchSubmit={onClose} />
                   </div>
                </div>

              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
