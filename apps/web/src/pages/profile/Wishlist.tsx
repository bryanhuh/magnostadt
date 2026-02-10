import { trpc } from '../../utils/trpc';
import { ProductCard } from '../../components/ProductCard';
import { Loader2, Heart } from 'lucide-react';

export function Wishlist() {
  const { data: wishlist, isLoading } = trpc.wishlist.getMine.useQuery();

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600 dark:text-[#F0E6CA]" />
      </div>
    );
  }

  if (!wishlist || wishlist.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-gray-50 dark:bg-[#1a2333] rounded-2xl border-2 border-dashed border-gray-200 dark:border-[#F0E6CA]/10 transition-colors">
        <Heart className="w-16 h-16 text-gray-200 dark:text-gray-700 mb-4" />
        <h3 className="text-xl font-black uppercase text-gray-400 dark:text-gray-500 font-exo-2">Your wishlist is empty</h3>
        <p className="text-gray-400 dark:text-gray-600 mt-2 font-exo-2">Save items you want to buy later!</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {wishlist.map((item) => (
        <ProductCard key={item.id} product={item.product} />
      ))}
    </div>
  );
}
