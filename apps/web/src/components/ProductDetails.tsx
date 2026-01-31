import { useParams, Link } from 'react-router-dom';
import { useState } from 'react';
import { toast } from 'sonner';
import { formatPrice } from '../utils/format';
import { trpc } from '../utils/trpc';
import { Loader2, ArrowLeft, ShoppingCart, Star } from 'lucide-react';
import { useCartStore } from '../store/useCartStore';
import { captureEvent } from '../utils/analytics';

export function ProductDetails() {
  const { id } = useParams<{ id: string }>();
  const { addItem } = useCartStore();
  // Use non-null assertion or check for id being undefined, but route matching ensures it.
  const { data: product, isLoading, error } = trpc.getProductById.useQuery(
    { id: id! },
    { enabled: !!id }
  );
  
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // Update selected image when product loads
  if (product && !selectedImage && product.imageUrl) {
    setSelectedImage(product.imageUrl);
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="w-12 h-12 animate-spin text-yellow-500" />
        <p className="mt-4 text-gray-400 animate-pulse">Summoning product details...</p>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="p-8 text-center">
        <div className="text-red-500 mb-4 text-xl">
          {error?.message || 'Product not found'}
        </div>
        <Link to="/" className="text-yellow-500 hover:underline">
          Return to directory
        </Link>
      </div>
    );
  }

  const allImages = [product.imageUrl, ...(product.images || [])].filter(Boolean) as string[];

  return (
    <div className="animate-in fade-in duration-500">
      <Link
        to="/"
        className="inline-flex items-center text-gray-400 hover:text-yellow-500 mb-8 transition-colors"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Products
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        {/* Gallery Section */}
        <div className="space-y-4">
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-2xl blur opacity-25 group-hover:opacity-75 transition duration-1000 group-hover:duration-200"></div>
            <div className="relative rounded-2xl overflow-hidden bg-white border border-gray-200 aspect-[4/5]">
              <img
                src={selectedImage || product.imageUrl || ''}
                alt={product.name}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
            </div>
          </div>
          
          {/* Thumbnails */}
          {allImages.length > 1 && (
            <div className="flex gap-4 overflow-x-auto pb-2">
              {allImages.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImage(img)}
                  className={`relative w-20 h-20 rounded-lg overflow-hidden border-2 transition-all flex-shrink-0 ${
                    selectedImage === img ? 'border-yellow-500 ring-2 ring-yellow-500/50' : 'border-gray-200 hover:border-yellow-300'
                  }`}
                >
                  <img src={img} alt={`View ${idx + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Details Section */}
        <div className="flex flex-col justify-center">
          <div className="flex items-center gap-2 mb-4">
            <span className="px-3 py-1 bg-yellow-500/10 text-yellow-600 border border-yellow-500/20 rounded-full text-xs font-bold uppercase tracking-wider">
              {product.category.name}
            </span>
            <span className="px-3 py-1 bg-gray-100 text-gray-600 border border-gray-200 rounded-full text-xs font-bold uppercase tracking-wider">
              {product.anime.name}
            </span>
          </div>

          <h1 className="text-4xl md:text-5xl font-black mb-4 uppercase italic tracking-wider leading-none">
            {product.name}
          </h1>

          <div className="flex items-center gap-4 mb-6">
             <div className="flex text-yellow-500">
               {[...Array(5)].map((_, i) => (
                 <Star key={i} className="w-5 h-5 fill-current" />
               ))}
             </div>
             <span className="text-gray-500 text-sm">(42 reviews)</span>
          </div>

           <p className="text-gray-600 text-lg leading-relaxed mb-8 border-l-4 border-yellow-500 pl-4">
            {product.description}
          </p>

          <div className="flex items-baseline gap-4 mb-8">
            <span className="text-4xl font-black text-yellow-600">
              {formatPrice(Number(product.price))}
            </span>
            {product.stock > 0 ? (
              <span className="text-green-500 font-medium">
                In Stock ({product.stock} available)
              </span>
            ) : (
              <span className="text-red-500 font-medium">Out of Stock</span>
            )}
          </div>

          <button 
            onClick={() => {
              addItem({
                id: product.id,
                name: product.name,
                price: Number(product.price),
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
            className="w-full max-w-md bg-yellow-500 hover:bg-yellow-400 text-black font-black py-4 rounded-xl flex items-center justify-center gap-3 transition-all hover:shadow-[0_0_20px_rgba(234,179,8,0.4)] active:scale-95 text-lg"
          >
            <ShoppingCart className="w-6 h-6" />
            ADD TO CART
          </button>
        </div>
      </div>
    </div>
  );
}
