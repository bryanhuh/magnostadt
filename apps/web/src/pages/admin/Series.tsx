import { useState } from 'react';
import { trpc } from '../../utils/trpc';
import { Plus, Search, Star, Edit, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

export function AdminSeries() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingSeries, setEditingSeries] = useState<{id: string, name: string, description: string, coverImage: string} | null>(null);
  const [formData, setFormData] = useState({ name: '', description: '', coverImage: '' });

  const { data: series, refetch } = trpc.getAnimeSeries.useQuery();

  const createMutation = trpc.createAnimeSeries.useMutation({
    onSuccess: () => {
      toast.success('Series created successfully');
      handleCloseModal();
      refetch();
    },
    onError: (error) => toast.error(`Failed to create: ${error.message}`)
  });

  const updateMutation = trpc.updateAnimeSeries.useMutation({
    onSuccess: () => {
      toast.success('Series updated successfully');
      handleCloseModal();
      refetch();
    },
    onError: (error) => toast.error(`Failed to update: ${error.message}`)
  });

  const deleteMutation = trpc.deleteAnimeSeries.useMutation({
    onSuccess: () => {
      toast.success('Series deleted successfully');
      refetch();
    },
    onError: (error) => toast.error(`Failed to delete: ${error.message}`)
  });

  const handleToggleFeatured = (id: string, currentFeatured: boolean) => {
    updateMutation.mutate({
      id,
      data: { featured: !currentFeatured }
    });
  };

  const handleOpenCreate = () => {
    setEditingSeries(null);
    setFormData({ name: '', description: '', coverImage: '' });
    setIsCreateModalOpen(true);
  };

  const handleOpenEdit = (s: any) => {
    setEditingSeries(s);
    setFormData({ 
      name: s.name, 
      description: s.description || '', 
      coverImage: s.coverImage || '' 
    });
    setIsCreateModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsCreateModalOpen(false);
    setEditingSeries(null);
    setFormData({ name: '', description: '', coverImage: '' });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingSeries) {
      updateMutation.mutate({
        id: editingSeries.id,
        data: formData
      });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this series? Products associated with it might be affected.')) {
      deleteMutation.mutate({ id });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Anime Series</h1>
          <p className="text-gray-500">Manage anime series and showcase settings.</p>
        </div>
        <button 
          onClick={handleOpenCreate}
          className="bg-yellow-500 hover:bg-yellow-400 text-black px-4 py-2 rounded-lg font-bold flex items-center gap-2 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Add Series
        </button>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input 
              type="text"
              placeholder="Search series..."
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-yellow-500 transition-colors"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-gray-500 font-medium">
              <tr>
                <th className="px-6 py-4">Name</th>
                <th className="px-6 py-4">Description</th>
                <th className="px-6 py-4">Products</th>
                <th className="px-6 py-4">Featured</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {series?.map((s) => (
                <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">{s.name}</div>
                  </td>
                  <td className="px-6 py-4 max-w-xs truncate text-gray-500">
                    {s.description || '-'}
                  </td>
                  <td className="px-6 py-4 text-gray-500">
                    {s.products?.length || 0}
                  </td>
                  <td className="px-6 py-4">
                    <button
                        onClick={() => handleToggleFeatured(s.id, s.featured)}
                        className={`p-2 rounded-full transition-colors ${s.featured ? 'text-yellow-500 bg-yellow-50' : 'text-gray-300 hover:text-gray-400'}`}
                        title={s.featured ? "Currently Featured" : "Set as Featured"}
                    >
                        <Star className={`w-5 h-5 ${s.featured ? 'fill-yellow-500' : ''}`} />
                    </button>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => handleOpenEdit(s)}
                        className="p-2 text-gray-400 hover:text-blue-500 transition-colors"
                        title="Edit Series"
                      >
                        <Edit className="w-5 h-5" />
                      </button>
                      <button 
                        onClick={() => handleDelete(s.id)}
                        className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                        title="Delete Series"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {series?.length === 0 && (
                <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                        No series found. Add one to get started.
                    </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create/Edit Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 animate-fade-in-up">
                <h2 className="text-2xl font-bold mb-4">
                  {editingSeries ? 'Edit Series' : 'Add New Series'}
                </h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Series Name</label>
                        <input 
                            required
                            className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 focus:outline-none focus:border-yellow-500"
                            value={formData.name}
                            onChange={e => setFormData({...formData, name: e.target.value})}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                        <textarea 
                            className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 focus:outline-none focus:border-yellow-500"
                            rows={3}
                            value={formData.description}
                            onChange={e => setFormData({...formData, description: e.target.value})}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Cover Image URL</label>
                        <input 
                            className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 focus:outline-none focus:border-yellow-500"
                            value={formData.coverImage}
                            onChange={e => setFormData({...formData, coverImage: e.target.value})}
                        />
                    </div>
                    <div className="flex justify-end gap-2 pt-4">
                        <button 
                            type="button"
                            onClick={handleCloseModal}
                            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            Cancel
                        </button>
                        <button 
                            type="submit"
                            disabled={createMutation.isPending || updateMutation.isPending}
                            className="bg-yellow-500 hover:bg-yellow-400 text-black px-4 py-2 rounded-lg font-bold transition-colors disabled:opacity-50"
                        >
                            {createMutation.isPending || updateMutation.isPending ? 'Saving...' : (editingSeries ? 'Update Series' : 'Create Series')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
      )}
    </div>
  );
}
