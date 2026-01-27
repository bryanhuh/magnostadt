import { useState } from 'react';
import { Plus, Search, Edit, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { trpc } from '../../utils/trpc';
import { toast } from 'sonner';

export function AdminProducts() {
  const [search, setSearch] = useState('');
  const utils = trpc.useUtils();
  
  const { data: products, isLoading } = trpc.getProducts.useQuery({
    orderBy: 'newest',
  });

  const deleteProduct = trpc.deleteProduct.useMutation({
    onSuccess: () => {
      toast.success('Product deleted successfully');
      utils.getProducts.invalidate();
    },
    onError: (error) => {
      toast.error(`Error deleting product: ${error.message}`);
    }
  });

  const filteredProducts = products?.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    p.category.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Products</h1>
          <p className="text-gray-400">Manage your store inventory</p>
        </div>
        
        <Link 
          to="/admin/products/new" 
          className="bg-yellow-500 hover:bg-yellow-400 text-black px-4 py-2 rounded-lg font-bold flex items-center gap-2 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Add Product
        </Link>
      </div>

      <div className="bg-gray-950 border border-gray-800 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-gray-800">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search products..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-gray-900 border border-gray-800 text-white pl-10 pr-4 py-2 rounded-lg focus:outline-none focus:border-yellow-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-400">
            <thead className="bg-gray-900 uppercase font-bold text-xs">
              <tr>
                <th className="px-6 py-4">Product</th>
                <th className="px-6 py-4">Price</th>
                <th className="px-6 py-4">Stock</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center">Loading...</td>
                </tr>
              ) : filteredProducts?.length === 0 ? (
                <tr>
                   <td colSpan={5} className="px-6 py-8 text-center">No products found.</td>
                </tr>
              ) : (
                filteredProducts?.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-900/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-white flex items-center gap-3">
                      <div className="w-10 h-10 rounded bg-gray-800 overflow-hidden shrink-0">
                         {product.imageUrl && <img src={product.imageUrl} alt="" className="w-full h-full object-cover" />}
                      </div>
                      <div>
                        <div>{product.name}</div>
                        <div className="text-xs text-gray-500">{product.anime.name}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {product.isSale && product.salePrice ? (
                        <div>
                          <span className="text-red-500 font-bold">${Number(product.salePrice).toFixed(2)}</span>
                          <span className="text-xs line-through ml-2">${Number(product.price).toFixed(2)}</span>
                        </div>
                      ) : (
                        <span>${Number(product.price).toFixed(2)}</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${
                        product.stock > 10 ? 'bg-green-900/30 text-green-500' : 
                        product.stock > 0 ? 'bg-yellow-900/30 text-yellow-500' : 
                        'bg-red-900/30 text-red-500'
                      }`}>
                        {product.stock} in stock
                      </span>
                    </td>
                    <td className="px-6 py-4">{product.category.name}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link 
                          to={`/admin/products/${product.id}/edit`}
                          className="p-2 hover:bg-gray-800 rounded-lg text-blue-400 transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </Link>
                        <button 
                          onClick={() => {
                            if (window.confirm('Are you sure you want to delete this product?')) {
                              deleteProduct.mutate({ id: product.id });
                            }
                          }}
                          className="p-2 hover:bg-gray-800 rounded-lg text-red-400 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
