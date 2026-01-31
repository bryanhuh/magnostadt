import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { trpc } from '../../utils/trpc';
import { toast } from 'sonner';
import { ChevronLeft } from 'lucide-react';

export function AdminProductForm() {
  const { id } = useParams();
  const isEditing = !!id;
  const navigate = useNavigate();
  
  const { data: product, isLoading: isProductLoading } = trpc.getProductById.useQuery(
    { id: id! },
    { enabled: isEditing }
  );

  const { data: categories } = trpc.getCategories.useQuery();
  const { data: animeSeries } = trpc.getAnimeSeries.useQuery();

  const createMutation = trpc.createProduct.useMutation({
    onSuccess: () => {
      toast.success('Product created successfully');
      navigate('/admin/products');
    }
  });

  const updateMutation = trpc.updateProduct.useMutation({
    onSuccess: () => {
      toast.success('Product updated successfully');
      navigate('/admin/products');
    }
  });

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    stock: '',
    categoryId: '',
    animeId: '',
    imageUrl: '',
    images: [] as string[],
    isSale: false,
    salePrice: '',
    isPreorder: false,
    featured: false,
  });

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name,
        description: product.description,
        price: product.price.toString(),
        stock: product.stock.toString(),
        categoryId: product.categoryId,
        animeId: product.animeId,
        imageUrl: product.imageUrl || '',
        images: product.images || [],
        isSale: product.isSale,
        salePrice: product.salePrice?.toString() || '',
        isPreorder: product.isPreorder,
        featured: product.featured,
      });
    }
  }, [product]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const data = {
      ...formData,
      price: Number(formData.price),
      stock: Number(formData.stock),
      salePrice: formData.salePrice ? Number(formData.salePrice) : null,
      imageUrl: formData.imageUrl || undefined,
      images: formData.images.filter(img => img.trim() !== ''),
    };

    if (isEditing) {
      updateMutation.mutate({ id: id!, data });
    } else {
      createMutation.mutate(data);
    }
  };

  if (isEditing && isProductLoading) return <div>Loading...</div>;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/admin/products')} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
          <ChevronLeft className="w-5 h-5 text-gray-500" />
        </button>
        <h1 className="text-3xl font-bold text-gray-900">
          {isEditing ? 'Edit Product' : 'New Product'}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-xl p-6 space-y-6 shadow-sm">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Product Name</label>
            <input 
              required
              className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-lg px-4 py-2 focus:border-yellow-500 focus:outline-none focus:bg-white transition-colors"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div>
             <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
             <textarea 
               required
               rows={4}
               className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-lg px-4 py-2 focus:border-yellow-500 focus:outline-none focus:bg-white transition-colors"
               value={formData.description}
               onChange={(e) => setFormData({ ...formData, description: e.target.value })}
             />
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div>
               <label className="block text-sm font-medium text-gray-700 mb-1">Price ($)</label>
               <input 
                 required
                 type="number"
                 step="0.01"
                 className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-lg px-4 py-2 focus:border-yellow-500 focus:outline-none focus:bg-white transition-colors"
                 value={formData.price}
                 onChange={(e) => setFormData({ ...formData, price: e.target.value })}
               />
             </div>
             <div>
               <label className="block text-sm font-medium text-gray-700 mb-1">Stock</label>
               <input 
                 required
                 type="number"
                 className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-lg px-4 py-2 focus:border-yellow-500 focus:outline-none focus:bg-white transition-colors"
                 value={formData.stock}
                 onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
               />
             </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div>
               <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
               <select 
                 required
                 className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-lg px-4 py-2 focus:border-yellow-500 focus:outline-none focus:bg-white transition-colors"
                 value={formData.categoryId}
                 onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
               >
                 <option value="">Select Category</option>
                 {categories?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
               </select>
             </div>
             <div>
               <label className="block text-sm font-medium text-gray-700 mb-1">Anime Series</label>
               <select 
                 required
                 className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-lg px-4 py-2 focus:border-yellow-500 focus:outline-none focus:bg-white transition-colors"
                 value={formData.animeId}
                 onChange={(e) => setFormData({ ...formData, animeId: e.target.value })}
               >
                 <option value="">Select Anime</option>
                 {animeSeries?.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
               </select>
             </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Main Image URL</label>
            <input 
              className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-lg px-4 py-2 focus:border-yellow-500 focus:outline-none focus:bg-white transition-colors"
              value={formData.imageUrl}
              onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
            />
          </div>

          <div>
             <label className="block text-sm font-medium text-gray-700 mb-2">Additional Images</label>
             <div className="space-y-2">
               {formData.images.map((img, index) => (
                 <div key={index} className="flex gap-2">
                   <input 
                     className="flex-1 bg-gray-50 border border-gray-200 text-gray-900 rounded-lg px-4 py-2 focus:border-yellow-500 focus:outline-none focus:bg-white transition-colors"
                     value={img}
                     onChange={(e) => {
                       const newImages = [...formData.images];
                       newImages[index] = e.target.value;
                       setFormData({ ...formData, images: newImages });
                     }}
                   />
                   <button
                     type="button"
                     onClick={() => {
                        const newImages = formData.images.filter((_, i) => i !== index);
                        setFormData({ ...formData, images: newImages });
                     }}
                     className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                   >
                     Remove
                   </button>
                 </div>
               ))}
               <button
                 type="button"
                 onClick={() => setFormData({ ...formData, images: [...formData.images, ''] })}
                 className="text-sm text-yellow-600 hover:text-yellow-700 font-medium"
               >
                 + Add another image
               </button>
             </div>
          </div>

          <div className="space-y-3 pt-4 border-t border-gray-100">
             <label className="flex items-center gap-2 text-gray-900 cursor-pointer">
               <input 
                 type="checkbox"
                 checked={formData.isSale}
                 onChange={(e) => setFormData({ ...formData, isSale: e.target.checked })}
                 className="w-4 h-4 rounded border-gray-300 text-yellow-500 focus:ring-yellow-500"
               />
               <span>Is on Sale?</span>
             </label>

             {formData.isSale && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sale Price ($)</label>
                  <input 
                    type="number"
                    step="0.01"
                    className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-lg px-4 py-2 focus:border-yellow-500 focus:outline-none focus:bg-white transition-colors"
                    value={formData.salePrice}
                    onChange={(e) => setFormData({ ...formData, salePrice: e.target.value })}
                  />
                </div>
             )}

             <label className="flex items-center gap-2 text-gray-900 cursor-pointer">
               <input 
                 type="checkbox"
                 checked={formData.isPreorder}
                 onChange={(e) => setFormData({ ...formData, isPreorder: e.target.checked })}
                 className="w-4 h-4 rounded border-gray-300 text-yellow-500 focus:ring-yellow-500"
               />
               <span>Is Pre-order?</span>
             </label>

             <label className="flex items-center gap-2 text-gray-900 cursor-pointer">
               <input 
                 type="checkbox"
                 checked={formData.featured}
                 onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                 className="w-4 h-4 rounded border-gray-300 text-yellow-500 focus:ring-yellow-500"
               />
               <span>Featured Product?</span>
             </label>
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <button 
            type="submit"
            disabled={createMutation.isPending || updateMutation.isPending}
            className="bg-yellow-500 hover:bg-yellow-400 text-black px-6 py-3 rounded-lg font-bold transition-all hover:shadow-[0_0_20px_rgba(234,179,8,0.2)]"
          >
            {createMutation.isPending || updateMutation.isPending ? 'Saving...' : (isEditing ? 'Update Product' : 'Create Product')}
          </button>
        </div>
      </form>
    </div>
  );
}
