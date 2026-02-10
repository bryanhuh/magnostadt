import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X } from 'lucide-react';
import { trpc } from '../utils/trpc';
import { Link } from 'react-router-dom';

interface SearchBarProps {
  onSearchSubmit?: () => void;
}

export function SearchBar({ onSearchSubmit }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Debounce logic (2 seconds as requested)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 2000);

    return () => clearTimeout(timer);
  }, [query]);

  const { data: products, isLoading } = trpc.getProducts.useQuery(
    { search: debouncedQuery, limit: 6 },
    { enabled: debouncedQuery.length > 0 }
  );

  // Close search results when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
        setIsOpen(false);
        navigate(`/shop?search=${encodeURIComponent(query)}`);
        if (onSearchSubmit) onSearchSubmit();
    }
  };

  return (
    <div className="relative w-full max-w-xl" ref={wrapperRef}>
       <form onSubmit={handleSearch} className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          className="w-full pl-10 pr-4 py-4 bg-gray-100 dark:bg-[#1a2333] border-none rounded-none focus:ring-2 focus:ring-[#F0E6CA] focus:bg-white dark:focus:bg-[#0a0f1c] transition-all text-sm font-exo-2"
        />
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        {query && (
          <button
            type="button"
            onClick={() => {
                setQuery('');
                setDebouncedQuery('');
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </form>

      {/* Search Results Dropdown */}
      {isOpen && debouncedQuery && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-[#0a0f1c] rounded-none shadow-xl border border-gray-200 dark:border-[#F0E6CA]/10 overflow-hidden z-50">
          {isLoading ? (
            <div className="p-4 text-center text-gray-500 text-sm font-exo-2">Searching...</div>
          ) : products && products.length > 0 ? (
            <>
              <div className="py-2">
                {products.map((product) => (
                  <Link
                    key={product.id}
                    to={`/product/${product.slug}`}
                    className="flex items-center gap-4 px-4 py-3 hover:bg-gray-50 dark:hover:bg-[#F0E6CA]/5 transition-colors"
                    onClick={() => {
                        setIsOpen(false);
                        if (onSearchSubmit) onSearchSubmit();
                    }}
                  >
                     <img
                      src={product.imageUrl || (product.images && product.images.length > 0 ? product.images[0] : '/placeholder.png')}
                      alt={product.name}
                      className="w-10 h-10 object-cover rounded-md"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium truncate text-gray-900 dark:text-gray-100 font-exo-2">
                        {product.name}
                      </h4>
                      <p className="text-xs text-gray-500 truncate font-exo-2">
                        {product.category?.name} • ${product.price}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
              <div className="p-2 border-t border-gray-100 dark:border-[#F0E6CA]/10 bg-gray-50 dark:bg-[#1a2333]/50">
                <button
                    onClick={() => {
                        setIsOpen(false);
                        navigate(`/shop?search=${encodeURIComponent(debouncedQuery)}`);
                        if (onSearchSubmit) onSearchSubmit();
                    }}
                    className="w-full py-2 text-xs font-bold uppercase tracking-wider text-center text-gray-600 dark:text-[#F0E6CA] hover:text-[#F0E6CA] dark:hover:text-white transition-colors font-exo-2"
                >
                    View More Results
                </button>
              </div>
            </>
          ) : (
            <div className="p-4 text-center text-gray-500 text-sm font-exo-2">
              No results found for "{debouncedQuery}"
            </div>
          )}
        </div>
      )}
    </div>
  );
}
