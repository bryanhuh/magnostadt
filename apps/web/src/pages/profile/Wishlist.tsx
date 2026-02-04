import { trpc } from '../../utils/trpc';
import { ProductCard } from '../../components/ProductCard';
import { Loader2, Heart } from 'lucide-react';

export function Wishlist() {
  const { data: wishlist, isLoading } = trpc.wishlist.getMine.useQuery();

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-yellow-500" />
      </div>
    );
  }

  if (!wishlist || wishlist.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
        <Heart className="w-16 h-16 text-gray-200 mb-4" />
        <h3 className="text-xl font-black uppercase text-gray-400">Your wishlist is empty</h3>
        <p className="text-gray-400 mt-2">Save items you want to buy later!</p>
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
