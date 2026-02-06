import { useState, useEffect } from 'react';
import { trpc } from '../utils/trpc';
import { Filter, X, Check } from 'lucide-react';
import { ProductCard } from './ProductCard';
import { useSearchParams } from 'react-router-dom';

interface ProductListProps {
  initialFilter?: {
    isSale?: boolean;
    isPreorder?: boolean;
    categoryName?: string;
    sortBy?: 'newest' | 'price_asc' | 'price_desc';
  };
}

export function ProductList({ initialFilter }: ProductListProps) {
  const [searchParams] = useSearchParams();
  const categoryFromUrl = searchParams.get('category');

  const [selectedCategory, setSelectedCategory] = useState<string | undefined>();
  const [selectedAnime, setSelectedAnime] = useState<string | undefined>();
  const [isSaleOnly, setIsSaleOnly] = useState(initialFilter?.isSale || false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  // const { addItem } = useCartStore(); // Unused here now

  const { data: products, isLoading: isProductsLoading, error } = trpc.getProducts.useQuery({
    categoryId: selectedCategory,
    // Use categoryName from URL if available, otherwise from initialFilter
    // If selectedCategory (ID) is set, it takes precedence (via categoryId)
    categoryName: selectedCategory ? undefined : (categoryFromUrl ?? initialFilter?.categoryName),
    animeId: selectedAnime,
    isSale: isSaleOnly ? true : undefined,
    ...initialFilter,
  });

  const { data: categories } = trpc.getCategories.useQuery();
  const { data: animeSeries } = trpc.getAnimeSeries.useQuery();

  // Sync URL category with selectedCategory state for sidebar highlighting
  useEffect(() => {
    if (categoryFromUrl && categories) {
      const category = categories.find(c => c.name.toLowerCase() === categoryFromUrl.toLowerCase());
      if (category) {
        setSelectedCategory(category.id);
      }
    } else if (!categoryFromUrl && !initialFilter?.categoryName) {
      // Clear selection if no URL param and no initial filter (e.g. user navigated to /shop)
      setSelectedCategory(undefined);
    }
  }, [categoryFromUrl, categories, initialFilter]);

  const isLoading = isProductsLoading;

  if (isLoading) {
    return (
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Skeleton Sidebar */}
        <div className="hidden lg:block w-64 space-y-8">
          {[1, 2].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="h-6 w-32 bg-gray-800 rounded mb-4" />
              <div className="space-y-2">
                {[1, 2, 3, 4].map((j) => (
                  <div key={j} className="h-10 w-full bg-gray-200 rounded" />
                ))}
              </div>
            </div>
          ))}
        </div>
        
        {/* Skeleton Grid */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white border border-gray-200 rounded-2xl overflow-hidden h-[400px] animate-pulse">
              <div className="h-[250px] bg-gray-200" />
              <div className="p-5 space-y-3">
                <div className="h-6 w-3/4 bg-gray-200 rounded" />
                <div className="flex gap-2">
                   <div className="h-4 w-16 bg-gray-200 rounded" />
                   <div className="h-4 w-16 bg-gray-200 rounded" />
                </div>
                <div className="pt-4 flex justify-between">
                   <div className="h-8 w-20 bg-gray-200 rounded" />
                   <div className="h-8 w-8 bg-gray-200 rounded" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-900/20 border border-red-500/50 rounded-lg text-red-500">
        Error loading products: {error.message}
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row gap-8 mt-10">
      {/* Mobile Filter Toggle */}
      <button
        className="lg:hidden flex items-center gap-2 bg-gray-800 p-3 rounded-lg text-yellow-500 mb-4"
        onClick={() => setIsFilterOpen(!isFilterOpen)}
      >
        <Filter className="w-5 h-5" />
        Filters
      </button>

      {/* Sidebar Filters */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white p-6 transform transition-transform duration-300 ease-in-out border-r border-gray-200
        lg:static lg:translate-x-0 lg:bg-transparent lg:p-0 lg:border-none lg:w-64 lg:block
        ${isFilterOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex justify-between items-center lg:hidden mb-6">
          <h2 className="text-xl font-bold text-yellow-500">Filters</h2>
          <button onClick={() => setIsFilterOpen(false)}>
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="space-y-8">
          {/* Status Filters */}
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-4 uppercase tracking-wider border-b border-gray-200 pb-2">
              Status
            </h3>
            <div className="space-y-2">
               <label className="flex items-center gap-3 cursor-pointer group">
                  <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${isSaleOnly ? 'bg-yellow-500 border-yellow-500 text-black' : 'border-gray-300 bg-white group-hover:border-yellow-500'}`}>
                      {isSaleOnly && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>
                  <input 
                      type="checkbox" 
                      className="hidden" 
                      checked={isSaleOnly} 
                      onChange={(e) => setIsSaleOnly(e.target.checked)} 
                  />
                  <span className={`text-sm font-bold uppercase tracking-wide transition-colors ${isSaleOnly ? 'text-black' : 'text-gray-500 group-hover:text-black'}`}>
                      On Sale
                  </span>
               </label>
            </div>
          </div>

          {/* Categories */}
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-4 uppercase tracking-wider border-b border-gray-200 pb-2">
              Categories
            </h3>
            <div className="space-y-2">
              <button
                onClick={() => setSelectedCategory(undefined)}
                className={`block w-full text-left px-3 py-2 rounded-lg transition-colors ${
                  !selectedCategory ? 'bg-yellow-500 text-black font-bold' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                All Categories
              </button>
              {categories?.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`block w-full text-left px-3 py-2 rounded-lg transition-colors ${
                    selectedCategory === category.id
                      ? 'bg-yellow-500 text-black font-bold'
                      : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  {category.name}
                </button>
              ))}
            </div>
          </div>

          {/* Anime Series */}
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-4 uppercase tracking-wider border-b border-gray-200 pb-2">
              Series
            </h3>
            <div className="space-y-2">
              <button
                onClick={() => setSelectedAnime(undefined)}
                className={`block w-full text-left px-3 py-2 rounded-lg transition-colors ${
                  !selectedAnime ? 'bg-yellow-500 text-black font-bold' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                All Series
              </button>
              {animeSeries?.map((anime) => (
                <button
                  key={anime.id}
                  onClick={() => setSelectedAnime(anime.id)}
                  className={`block w-full text-left px-3 py-2 rounded-lg transition-colors ${
                    selectedAnime === anime.id
                      ? 'bg-yellow-500 text-black font-bold'
                      : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  {anime.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {isFilterOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsFilterOpen(false)}
        />
      )}

      {/* Product Grid */}
      <div className="flex-1">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products?.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
          
          {products?.length === 0 && (
            <div className="col-span-full text-center py-20 border-2 border-dashed border-gray-200 rounded-3xl">
              <p className="text-gray-500 text-lg">No products found matching your filters.</p>
              <button 
                onClick={() => {
                  setSelectedCategory(undefined);
                  setSelectedAnime(undefined);
                }}
                className="mt-4 text-yellow-500 hover:underline"
              >
                Clear all filters
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
