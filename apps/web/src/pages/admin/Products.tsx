import { useState } from 'react';
import { Plus, Search, Edit, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { trpc } from '../../utils/trpc';
import { toast } from 'sonner';
import { formatPrice } from '../../utils/format';

import { ConfirmDialog } from '../../components/ui/ConfirmDialog';

export function AdminProducts() {
  const [search, setSearch] = useState('');
  const [productToDelete, setProductToDelete] = useState<string | null>(null);
  const utils = trpc.useUtils();

  const { data: products, isLoading } = trpc.getProducts.useQuery({
    orderBy: 'newest',
  });

  const deleteProduct = trpc.deleteProduct.useMutation({
    onSuccess: () => {
      toast.success('Product deleted successfully');
      setProductToDelete(null);
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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white font-libre-bodoni transition-colors">Products</h1>
          <p className="text-gray-500 dark:text-gray-400 font-exo-2 transition-colors">Manage your store inventory</p>
        </div>

        <Link
          to="/admin/products/new"
          className="bg-gray-900 dark:bg-[#F0E6CA] hover:bg-gray-800 dark:hover:bg-white text-white dark:text-[#0a0f1c] px-4 py-2 rounded-lg font-bold flex items-center gap-2 transition-all shadow-lg shadow-gray-200 dark:shadow-[#F0E6CA]/20 font-exo-2"
        >
          <Plus className="w-5 h-5" />
          Add Product
        </Link>
      </div>

      <div className="bg-white dark:bg-[#1a2333] border border-gray-200 dark:border-[#F0E6CA]/10 rounded-xl overflow-hidden shadow-sm transition-colors duration-300">
        <div className="p-4 border-b border-gray-200 dark:border-[#F0E6CA]/10 transition-colors">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
            <input
              type="text"
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-gray-50 dark:bg-[#0a0f1c] border border-gray-200 dark:border-[#F0E6CA]/10 text-gray-900 dark:text-white pl-10 pr-4 py-2 rounded-lg focus:outline-none focus:border-gray-900 dark:focus:border-[#F0E6CA] focus:bg-white dark:focus:bg-[#0a0f1c] transition-colors font-exo-2 placeholder:text-gray-400 dark:placeholder:text-gray-600"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-500 dark:text-gray-400 font-exo-2 transition-colors">
            <thead className="bg-gray-100 dark:bg-[#0a0f1c] uppercase font-bold text-xs text-gray-900 dark:text-[#F0E6CA] transition-colors">
              <tr>
                <th className="px-6 py-4">Product</th>
                <th className="px-6 py-4">Price ($)</th>
                <th className="px-6 py-4">Stock</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-[#F0E6CA]/5 transition-colors">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">Loading...</td>
                </tr>
              ) : filteredProducts?.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">No products found.</td>
                </tr>
              ) : (
                filteredProducts?.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50 dark:hover:bg-[#0a0f1c]/50 transition-colors border-b border-gray-200 dark:border-[#F0E6CA]/5 last:border-0">
                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-white flex items-center gap-3 transition-colors">
                      <div className="w-10 h-10 rounded bg-gray-100 dark:bg-[#0a0f1c] overflow-hidden shrink-0 border border-gray-200 dark:border-[#F0E6CA]/10">
                        {product.imageUrl && <img src={product.imageUrl} alt="" className="w-full h-full object-cover" />}
                      </div>
                      <div>
                        <div className="font-bold">{product.name}</div>
                        <div className="text-xs text-gray-500 uppercase">{product.anime.name}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {product.isSale && product.salePrice ? (
                        <div>
                          <span className="text-red-400 font-bold">{formatPrice(product.salePrice)}</span>
                          <span className="text-xs line-through ml-2 text-gray-400 dark:text-gray-600">{formatPrice(product.price)}</span>
                        </div>
                      ) : (
                        <span className="text-gray-900 dark:text-gray-200 transition-colors">{formatPrice(product.price)}</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-xs font-black uppercase tracking-wider ${product.stock > 10 ? 'bg-green-500/10 text-green-500 border border-green-500/20' :
                        product.stock > 0 ? 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20' :
                          'bg-red-500/10 text-red-500 border border-red-500/20'
                        }`}>
                        {product.stock} in stock
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-300 transition-colors">{product.category.name}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          to={`/admin/products/${product.id}/edit`}
                          className="p-2 hover:bg-gray-100 dark:hover:bg-[#F0E6CA]/10 rounded-lg text-blue-600 dark:text-blue-400 transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => setProductToDelete(product.id)}
                          className="p-2 hover:bg-gray-100 dark:hover:bg-[#F0E6CA]/10 rounded-lg text-red-600 dark:text-red-400 transition-colors"
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
      <ConfirmDialog
        isOpen={!!productToDelete}
        onClose={() => setProductToDelete(null)}
        onConfirm={() => {
          if (productToDelete) {
            deleteProduct.mutate({ id: productToDelete });
          }
        }}
        title="Delete Product"
        description="Are you sure you want to delete this product? This action cannot be undone."
        variant="danger"
        isLoading={deleteProduct.isPending}
      />
    </div>
  );
}
