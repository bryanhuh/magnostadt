import { useParams, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { formatPrice } from '../utils/format';
import { trpc } from '../utils/trpc';
import { Loader2, ArrowLeft, ShoppingCart, Heart } from 'lucide-react';
import { useCartStore } from '../store/useCartStore';
import { captureEvent } from '../utils/analytics';
import { ProductCarousel } from './home/ProductCarousel';
import { useUser } from '@clerk/clerk-react';

export function ProductDetails() {
  const { slug } = useParams<{ slug: string }>();
  const { addItem } = useCartStore();
  const { user } = useUser();
  const utils = trpc.useUtils();
  
  const { data: product, isLoading, error } = trpc.getProductBySlug.useQuery(
    { slug: slug! },
    { enabled: !!slug }
  );

  const { data: isInWishlist } = trpc.wishlist.checkStatus.useQuery(
    { productId: product?.id! },
    { enabled: !!product?.id && !!user }
  );

  const addToWishlist = trpc.wishlist.add.useMutation({
    onSuccess: () => {
      toast.success('Added to wishlist');
      utils.wishlist.checkStatus.invalidate({ productId: product?.id });
      utils.wishlist.getMine.invalidate();
    },
    onError: (err) => {
      toast.error(err.message);
    }
  });

  const removeFromWishlist = trpc.wishlist.remove.useMutation({
    onSuccess: () => {
      toast.success('Removed from wishlist');
      utils.wishlist.checkStatus.invalidate({ productId: product?.id });
      utils.wishlist.getMine.invalidate();
    },
    onError: (err) => {
      toast.error(err.message);
    }
  });

  const { data: relatedProducts } = trpc.getRelatedProducts.useQuery(
    { productId: product?.id! },
    { enabled: !!product?.id }
  );

  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // Update selected image when product loads or changes
  useEffect(() => {
    if (product?.imageUrl) {
      setSelectedImage(product.imageUrl);
    }
  }, [product, slug]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 min-h-[60vh]">
        <Loader2 className="w-12 h-12 animate-spin text-yellow-500" />
        <p className="mt-4 text-gray-400 font-medium animate-pulse tracking-wide">SUMMONING PRODUCT DATA...</p>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="flex flex-col items-center justify-center py-20 min-h-[50vh]">
        <div className="text-red-500 mb-6 text-2xl font-black uppercase">Product Not Found</div>
        <Link 
          to="/" 
          className="px-8 py-3 bg-black text-white hover:bg-yellow-500 hover:text-black transition-all font-bold uppercase tracking-wider rounded-lg"
        >
          Return to Base
        </Link>
      </div>
    );
  }

  const allImages = [product.imageUrl, ...(product.images || [])].filter(Boolean) as string[];

  return (
    <div className="animate-in fade-in duration-500 pb-20">
      {/* Breadcrumb / Back Navigation */}
      <div className="container mx-auto px-4 py-6">
        <Link
          to="/"
          className="inline-flex items-center text-gray-400 hover:text-black mb-8 transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
          <span className="font-bold uppercase tracking-wide text-xs">Back to Collection</span>
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 xl:gap-20">
          
          {/* Gallery Section */}
          <div className="space-y-6">
            <div className="relative group bg-gray-50 rounded-2xl p-8 border border-gray-100">
               {/* Badges */}
               <div className="absolute top-6 left-6 z-10 flex gap-2">
                  {product.stock <= 5 && product.stock > 0 && (
                    <span className="bg-red-500 text-white text-[10px] font-black uppercase px-2 py-1 tracking-widest rounded-sm">
                      Low Stock
                    </span>
                  )}
                  {product.isSale && (
                    <span className="bg-yellow-400 text-black text-[10px] font-black uppercase px-2 py-1 tracking-widest rounded-sm">
                      Sale
                    </span>
                  )}
               </div>

              <div className="relative aspect-[4/5] flex items-center justify-center">
                <img
                  src={selectedImage || product.imageUrl || ''}
                  alt={product.name}
                  className="w-full h-full object-contain filter drop-shadow-xl transition-all duration-500 group-hover:scale-105"
                />
              </div>
            </div>
            
            {/* Thumbnails */}
            {allImages.length > 1 && (
              <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                {allImages.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(img)}
                    className={`relative w-24 h-24 rounded-xl overflow-hidden border-2 transition-all flex-shrink-0 bg-gray-50 ${
                      selectedImage === img 
                        ? 'border-black ring-1 ring-black/10' 
                        : 'border-transparent hover:border-gray-200'
                    }`}
                  >
                    <img src={img} alt={`View ${idx + 1}`} className="w-full h-full object-contain p-2" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details Section */}
          <div className="flex flex-col pt-4">
            {/* Series & Category */}
            <div className="flex items-center gap-3 mb-6">
              <span className="text-yellow-600 font-bold uppercase tracking-widest text-xs border-b-2 border-yellow-400 pb-0.5">
                {product.anime.name}
              </span>
              <span className="text-gray-300">•</span>
              <span className="text-gray-400 font-bold uppercase tracking-widest text-xs">
                {product.category.name}
              </span>
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black mb-6 uppercase tracking-tight leading-[0.9] text-black">
              {product.name}
            </h1>

            {/* Price Block */}
            <div className="flex items-baseline gap-4 mb-8 pb-8 border-b border-gray-100">
              <span className={`text-4xl font-black ${product.isSale ? 'text-red-600' : 'text-black'}`}>
                {formatPrice(Number(product.isSale && product.salePrice ? product.salePrice : product.price))}
              </span>
              {product.isSale && (
                <span className="text-xl text-gray-400 line-through font-bold decoration-2">
                  {formatPrice(Number(product.price))}
                </span>
              )}
            </div>

            {/* Description */}
            <div className="mb-10">
              <h3 className="text-xs font-black uppercase text-gray-400 tracking-widest mb-4">Description</h3>
              <p className="text-gray-600 text-lg leading-relaxed font-medium max-w-xl">
                {product.description}
              </p>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-4 mt-auto">
              <div className="flex gap-4">
                 <button 
                  onClick={() => {
                    addItem({
                      id: product.id,
                      name: product.name,
                      price: Number(product.isSale && product.salePrice ? product.salePrice : product.price),
                      imageUrl: product.imageUrl,
                      anime: { name: product.anime.name }
                    });
                    toast.success(`Added ${product.name} to cart`);
                    captureEvent('add_to_cart', {
                      product_id: product.id,
                      product_name: product.name,
                      price: Number(product.price),
                      location: 'product_details'
                    });
                  }}
                  disabled={product.stock === 0}
                  className={`flex-1 py-5 rounded-xl font-black uppercase tracking-widest text-base transition-all flex items-center justify-center gap-3
                    ${product.stock > 0 
                      ? 'bg-black text-white hover:bg-yellow-500 hover:text-black hover:shadow-lg' 
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
                >
                  <ShoppingCart className="w-5 h-5" />
                  {product.stock > 0 ? 'Add to Cart' : 'Out of Stock'}
                </button>
                
                <button 
                  onClick={() => {
                    if (!user) {
                      toast.error('Please sign in to add to wishlist');
                      return;
                    }
                    if (isInWishlist) {
                      removeFromWishlist.mutate({ productId: product.id });
                    } else {
                      addToWishlist.mutate({ productId: product.id });
                    }
                  }}
                  disabled={addToWishlist.isPending || removeFromWishlist.isPending}
                  className={`w-16 h-auto rounded-xl border-2 flex items-center justify-center transition-colors
                    ${isInWishlist 
                      ? 'border-red-200 bg-red-50 text-red-500' 
                      : 'border-gray-100 hover:border-red-200 hover:bg-red-50 hover:text-red-500'
                    }`}
                >
                  <Heart className={`w-6 h-6 ${isInWishlist ? 'fill-current' : ''}`} />
                </button>
              </div>
              
              <div className="flex items-center gap-2 justify-center mt-2 text-xs font-bold text-gray-400 uppercase tracking-widest">
                 <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                 Free Shipping on orders over $50
              </div>
            </div>
          </div>
        </div>

        {/* Related Items Section */}
        {relatedProducts && relatedProducts.length > 0 && (
          <div className="mt-32 border-t pt-16 border-gray-100">
            <div className="flex items-center justify-between mb-10">
              <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tight">
                More from {product.anime.name}
              </h2>
            </div>
            
            {/* Reuse the ProductCarousel component including its scroll handling */}
            <ProductCarousel products={relatedProducts} />
          </div>
        )}

      </div>
    </div>
  );
}
