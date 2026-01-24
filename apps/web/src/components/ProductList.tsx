import { trpc } from '../utils/trpc';
import { Loader2, ShoppingCart } from 'lucide-react';

export function ProductList() {
  const { data: products, isLoading, error } = trpc.getProducts.useQuery();

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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {products?.map((product) => (
        <div
          key={product.id}
          className="group relative bg-gray-900/50 border border-gray-800 rounded-2xl overflow-hidden hover:border-yellow-500/50 transition-all duration-300 hover:shadow-[0_0_30px_rgba(234,179,8,0.1)]"
        >
          <div className="aspect-[4/5] bg-gray-800 relative">
             {/* Placeholder for actual image */}
             <div className="absolute inset-0 flex items-center justify-center text-gray-700">
               <span className="text-sm font-bold uppercase tracking-widest">Image Coming Soon</span>
             </div>
          </div>
          <div className="p-6">
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-xl font-bold group-hover:text-yellow-500 transition-colors uppercase italic tracking-wider">
                {product.name}
              </h3>
              <span className="text-yellow-500 font-black text-lg">${product.price.toString()}</span>
            </div>
            <p className="text-gray-400 text-sm line-clamp-2 mb-6">
              Exclusive anime merchandise for true fans.
            </p>
            <button className="w-full bg-yellow-500 hover:bg-yellow-400 text-black font-black py-3 rounded-xl flex items-center justify-center gap-2 transition-transform active:scale-95">
              <ShoppingCart className="w-5 h-5" />
              ADD TO CART
            </button>
          </div>
        </div>
      ))}
      
      {products?.length === 0 && (
        <div className="col-span-full text-center py-20 border-2 border-dashed border-gray-800 rounded-3xl">
          <p className="text-gray-500 text-lg">No products found. Start by adding some to your database!</p>
        </div>
      )}
    </div>
  );
}
