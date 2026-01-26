import { useState } from 'react';
import { Link } from 'react-router-dom';
import { trpc } from '../utils/trpc';
import { Loader2, ShoppingCart, Filter, X } from 'lucide-react';
import { useCartStore } from '../store/useCartStore';

export function ProductList() {
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>();
  const [selectedAnime, setSelectedAnime] = useState<string | undefined>();
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const { addItem } = useCartStore();

  const { data: products, isLoading: isProductsLoading, error } = trpc.getProducts.useQuery({
    categoryId: selectedCategory,
    animeId: selectedAnime,
  });

  const { data: categories } = trpc.getCategories.useQuery();
  const { data: animeSeries } = trpc.getAnimeSeries.useQuery();

  const isLoading = isProductsLoading;

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="w-12 h-12 animate-spin text-yellow-500" />
        <p className="mt-4 text-gray-400 animate-pulse">Summoning products...</p>
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
    <div className="flex flex-col lg:flex-row gap-8">
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
        fixed inset-y-0 left-0 z-50 w-64 bg-gray-950 p-6 transform transition-transform duration-300 ease-in-out border-r border-gray-800
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
          {/* Categories */}
          <div>
            <h3 className="text-lg font-bold text-white mb-4 uppercase italic tracking-wider border-b border-gray-800 pb-2">
              Categories
            </h3>
            <div className="space-y-2">
              <button
                onClick={() => setSelectedCategory(undefined)}
                className={`block w-full text-left px-3 py-2 rounded-lg transition-colors ${
                  !selectedCategory ? 'bg-yellow-500 text-black font-bold' : 'text-gray-400 hover:text-white hover:bg-gray-800'
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
                      : 'text-gray-400 hover:text-white hover:bg-gray-800'
                  }`}
                >
                  {category.name}
                </button>
              ))}
            </div>
          </div>

          {/* Anime Series */}
          <div>
            <h3 className="text-lg font-bold text-white mb-4 uppercase italic tracking-wider border-b border-gray-800 pb-2">
              Series
            </h3>
            <div className="space-y-2">
              <button
                onClick={() => setSelectedAnime(undefined)}
                className={`block w-full text-left px-3 py-2 rounded-lg transition-colors ${
                  !selectedAnime ? 'bg-yellow-500 text-black font-bold' : 'text-gray-400 hover:text-white hover:bg-gray-800'
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
                      : 'text-gray-400 hover:text-white hover:bg-gray-800'
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
            <Link
              to={`/product/${product.id}`}
              key={product.id}
              className="group relative bg-gray-900/50 border border-gray-800 rounded-2xl overflow-hidden hover:border-yellow-500/50 transition-all duration-300 hover:shadow-[0_0_30px_rgba(234,179,8,0.1)] flex flex-col"
            >
              <div className="aspect-[4/5] bg-gray-800 relative overflow-hidden">
                 <img 
                   src={product.imageUrl ?? undefined} 
                   alt={product.name}
                   className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                   onError={(e) => {
                     // Fallback if image fails
                     (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x500?text=No+Image';
                   }}
                 />
                 <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors duration-300" />
              </div>
              
              <div className="p-5 flex flex-col flex-1">
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-2 gap-2">
                    <h3 className="text-lg font-bold group-hover:text-yellow-500 transition-colors uppercase italic tracking-wider leading-tight">
                      {product.name}
                    </h3>
                  </div>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xs font-bold text-gray-500 uppercase">{product.category.name}</span>
                    <span className="w-1 h-1 bg-gray-700 rounded-full"></span>
                    <span className="text-xs font-bold text-gray-500 uppercase">{product.anime.name}</span>
                  </div>
                </div>
                
                <div className="mt-4 pt-4 border-t border-gray-800 flex items-center justify-between">
                  <span className="text-yellow-500 font-black text-xl">${product.price.toString()}</span>
                  <button 
                    onClick={(e) => {
                      e.preventDefault(); // Prevent navigation to details
                      addItem({
                        id: product.id,
                        name: product.name,
                        price: Number(product.price),
                        imageUrl: product.imageUrl,
                        anime: { name: product.anime.name }
                      });
                    }}
                    className="bg-yellow-500 hover:bg-yellow-400 text-black p-2 rounded-lg transition-transform active:scale-95"
                  >
                    <ShoppingCart className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </Link>
          ))}
          
          {products?.length === 0 && (
            <div className="col-span-full text-center py-20 border-2 border-dashed border-gray-800 rounded-3xl">
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
