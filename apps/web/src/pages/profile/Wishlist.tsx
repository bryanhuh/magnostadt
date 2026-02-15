import { useState } from 'react';
import { trpc } from '../../utils/trpc';
import { ProductCard } from '../../components/ProductCard';
import { Loader2, Heart, Share2, Bell, Check } from 'lucide-react';
import { toast } from 'sonner';

export function Wishlist() {
  const { data: wishlist, isLoading } = trpc.wishlist.getMine.useQuery();
  const { data: alerts } = trpc.stockAlert.getMyAlerts.useQuery();
  const { data: shareToken } = trpc.wishlist.getShareToken.useQuery();
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    if (!shareToken) return;
    const url = `${window.location.origin}/wishlist/${shareToken}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success('Wishlist link copied to clipboard!');
      setTimeout(() => setCopied(false), 3000);
    } catch {
      // Fallback: select and copy
      prompt('Copy this link:', url);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600 dark:text-[#F0E6CA]" />
      </div>
    );
  }

  if (!wishlist || wishlist.length === 0) {
    return (
      <div className="space-y-6">
        {/* Share button even when empty */}
        <div className="flex justify-end">
          <button
            onClick={handleShare}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-100 dark:bg-[#1a2333]/50 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-[#1a2333] transition-all font-bold uppercase tracking-wider text-xs font-exo-2 border border-gray-200 dark:border-[#F0E6CA]/10"
          >
            {copied ? <Check className="w-4 h-4 text-green-500" /> : <Share2 className="w-4 h-4" />}
            {copied ? 'Copied!' : 'Share Wishlist'}
          </button>
        </div>

        <div className="flex flex-col items-center justify-center py-20 bg-gray-50 dark:bg-[#1a2333] rounded-2xl border-2 border-dashed border-gray-200 dark:border-[#F0E6CA]/10 transition-colors">
          <Heart className="w-16 h-16 text-gray-200 dark:text-gray-700 mb-4" />
          <h3 className="text-xl font-black uppercase text-gray-400 dark:text-gray-500 font-exo-2">Your wishlist is empty</h3>
          <p className="text-gray-400 dark:text-gray-600 mt-2 font-exo-2">Save items you want to buy later!</p>
        </div>
      </div>
    );
  }

  // Separate out-of-stock items
  const outOfStockItems = wishlist.filter((item) => item.product.stock === 0);
  const inStockItems = wishlist.filter((item) => item.product.stock > 0);

  return (
    <div className="space-y-8">
      {/* Header with Share Button */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500 dark:text-gray-400 font-exo-2">
          {wishlist.length} {wishlist.length === 1 ? 'item' : 'items'} saved
        </p>
        <button
          onClick={handleShare}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-100 dark:bg-[#1a2333]/50 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-[#1a2333] transition-all font-bold uppercase tracking-wider text-xs font-exo-2 border border-gray-200 dark:border-[#F0E6CA]/10"
        >
          {copied ? <Check className="w-4 h-4 text-green-500" /> : <Share2 className="w-4 h-4" />}
          {copied ? 'Copied!' : 'Share Wishlist'}
        </button>
      </div>

      {/* Active Stock Alerts */}
      {alerts && alerts.length > 0 && (
        <div className="bg-amber-50 dark:bg-amber-500/5 border border-amber-200 dark:border-amber-500/20 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <Bell className="w-5 h-5 text-amber-500" />
            <h3 className="text-sm font-black uppercase tracking-wider text-amber-700 dark:text-amber-400 font-exo-2">
              Active Stock Alerts ({alerts.length})
            </h3>
          </div>
          <div className="flex flex-wrap gap-3">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className="inline-flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-[#0a0f1c]/50 rounded-lg text-xs font-bold text-gray-700 dark:text-gray-300 font-exo-2 border border-gray-200 dark:border-[#F0E6CA]/10"
              >
                <Bell className="w-3 h-3 text-amber-500" />
                {alert.product.name}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Out of Stock Items */}
      {outOfStockItems.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <span className="w-2 h-2 rounded-full bg-red-500" />
            <h3 className="text-xs font-black uppercase tracking-widest text-gray-500 font-exo-2">
              Out of Stock ({outOfStockItems.length})
            </h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 opacity-75">
            {outOfStockItems.map((item) => (
              <ProductCard key={item.id} product={item.product} />
            ))}
          </div>
        </div>
      )}

      {/* In Stock Items */}
      {inStockItems.length > 0 && (
        <div>
          {outOfStockItems.length > 0 && (
            <div className="flex items-center gap-2 mb-4">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <h3 className="text-xs font-black uppercase tracking-widest text-gray-500 font-exo-2">
                In Stock ({inStockItems.length})
              </h3>
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {inStockItems.map((item) => (
              <ProductCard key={item.id} product={item.product} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
