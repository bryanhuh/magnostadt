import { useParams, Link } from 'react-router-dom';
import { trpc } from '../utils/trpc';
import { ProductCard } from '../components/ProductCard';
import { Loader2, Heart, ArrowLeft } from 'lucide-react';
import { SEO } from '../components/SEO';

export function SharedWishlist() {
  const { token } = useParams<{ token: string }>();
  const { data, isLoading } = trpc.wishlist.getSharedWishlist.useQuery(
    { token: token! },
    { enabled: !!token }
  );

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600 dark:text-[#F0E6CA]" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
        <Heart className="w-20 h-20 text-gray-200 dark:text-gray-700 mb-6" />
        <h2 className="text-2xl font-black uppercase text-gray-400 dark:text-gray-500 font-exo-2 mb-2">
          Wishlist Not Found
        </h2>
        <p className="text-gray-400 dark:text-gray-600 font-exo-2 mb-6">
          This wishlist link may be invalid or expired.
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-6 py-3 bg-gray-900 dark:bg-[#F0E6CA] text-white dark:text-[#0a0f1c] rounded-xl font-bold uppercase tracking-wider text-sm hover:bg-gray-700 dark:hover:bg-white transition-all font-exo-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Store
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-[1400px] mx-auto px-4 md:px-8 py-10 animate-in fade-in duration-500">
      <SEO
        title={`${data.ownerName}'s Wishlist`}
        description={`Check out ${data.ownerName}'s wishlist — ${data.items.length} items saved on Magnostadt.`}
        url={`/wishlist/${token}`}
      />
      {/* Header */}
      <div className="mb-10">
        <Link
          to="/"
          className="inline-flex items-center text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-[#F0E6CA] mb-6 transition-colors group font-exo-2"
        >
          <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
          <span className="font-bold uppercase tracking-wide text-xs">Back to Store</span>
        </Link>

        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-pink-500 to-red-500 flex items-center justify-center shadow-lg shadow-pink-500/20">
            <Heart className="w-7 h-7 text-white fill-current" />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tight text-gray-900 dark:text-gray-100 font-libre-bodoni transition-colors">
              {data.ownerName}'s Wishlist
            </h1>
            <p className="text-gray-500 dark:text-gray-400 font-exo-2 text-sm mt-1">
              {data.items.length} {data.items.length === 1 ? 'item' : 'items'} saved
            </p>
          </div>
        </div>
      </div>

      {/* Items Grid */}
      {data.items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-gray-50 dark:bg-[#1a2333] rounded-2xl border-2 border-dashed border-gray-200 dark:border-[#F0E6CA]/10">
          <Heart className="w-16 h-16 text-gray-200 dark:text-gray-700 mb-4" />
          <h3 className="text-xl font-black uppercase text-gray-400 dark:text-gray-500 font-exo-2">
            This wishlist is empty
          </h3>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {data.items.map((item) => (
            <ProductCard key={item.id} product={item.product} />
          ))}
        </div>
      )}
    </div>
  );
}
