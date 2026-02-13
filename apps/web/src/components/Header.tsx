import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ShoppingBag, Search } from 'lucide-react';
import { useCartStore } from '../store/useCartStore';
import { useUser } from '@clerk/clerk-react';
import { SearchModal } from './SearchModal';

export function Header() {
  const { toggleCart, getTotalItems } = useCartStore();
  const totalItems = getTotalItems();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const location = useLocation();
  const { isSignedIn } = useUser();

  const links = [
    { name: 'Collection', path: '/collections' },
    { name: 'Products', path: '/shop' },
    ...(isSignedIn ? [{ name: 'My Profile', path: '/profile' }] : []),
  ];

  return (
    <>
      <header className="sticky top-0 z-[100] bg-white/80 dark:bg-[#0a0f1c]/80 backdrop-blur-md border-b border-gray-200 dark:border-[#F0E6CA]/10 transition-colors duration-300">
        <div className="max-w-[1400px] mx-auto px-4 md:px-8 h-20 flex items-center justify-between gap-4">
          {/* Left: Logo */}
          <div className="flex-shrink-0">
            <Link to="/" className="block">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl md:text-3xl font-black font-libre-bodoni uppercase tracking-[0.15em] text-gray-900 dark:text-[#F0E6CA] transition-colors">
                  Magnostadt
                </span>
                <span className="text-lg md:text-xl font-bold font-libre-bodoni uppercase tracking-[0.1em] text-gray-900 dark:text-[#F0E6CA] transition-colors">
                  District
                </span>
              </div>
            </Link>
          </div>
          
          {/* Spacer to push everything else to the right */}
          <div className="flex-1" />

          {/* Right: Navigation + Actions */}
          <div className="flex items-center gap-6">
            {/* Navigation Links */}
            <nav className="hidden md:flex items-center gap-6">
              {links.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`text-sm md:text-base uppercase tracking-widest transition-colors font-orbitron ${
                    location.pathname === link.path 
                      ? 'text-gray-900 dark:text-[#F0E6CA] font-bold' 
                      : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
                  }`}
                >
                  {link.name}
                </Link>
              ))}
            </nav>

            {/* Actions (Search + Cart) - Tight gap */}
            <div className="flex items-center gap-2">
              {/* Search Icon */}
              <button
                onClick={() => setIsSearchOpen(true)}
                className="p-2 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-[#F0E6CA] transition-colors"
                aria-label="Search"
              >
                <Search className="w-6 h-6" />
              </button>

              <button 
                onClick={toggleCart}
                className="relative p-2 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-[#F0E6CA] transition-colors group"
                aria-label="Cart"
              >
                <ShoppingBag className="w-6 h-6 group-hover:text-gray-900 dark:group-hover:text-[#F0E6CA] transition-colors" />
                {totalItems > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-gray-900 dark:bg-[#F0E6CA] text-white dark:text-[#0a0f1c] font-bold text-[10px] w-5 h-5 flex items-center justify-center rounded-full border-2 border-white dark:border-[#0a0f1c]">
                    {totalItems}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Search Modal */}
      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </>
  );
}
