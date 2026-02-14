import { useState, useMemo } from 'react';
import { trpc } from '../../utils/trpc';
import { Plus, Search, Star, Edit, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { ConfirmDialog } from '../../components/ui/ConfirmDialog';

export function AdminSeries() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [seriesToDelete, setSeriesToDelete] = useState<string | null>(null);
  const [editingSeries, setEditingSeries] = useState<{id: string, name: string, description: string, coverImage: string} | null>(null);
  const [formData, setFormData] = useState({ name: '', description: '', coverImage: '' });
  const [searchQuery, setSearchQuery] = useState('');

  const { data: series, refetch } = trpc.getAnimeSeries.useQuery();

  const filteredSeries = useMemo(() => {
    if (!series) return [];
    
    return series
      .filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase()))
      .sort((a, b) => {
        // Featured items first
        if (a.featured && !b.featured) return -1;
        if (!a.featured && b.featured) return 1;
        
        // Then alphabetical
        return a.name.localeCompare(b.name);
      });
  }, [series, searchQuery]);

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
      setSeriesToDelete(null);
      refetch();
    },
    onError: (error) => toast.error(`Failed to delete: ${error.message}`)
  });

  const handleToggleFeatured = async (id: string, currentFeatured: boolean) => {
    // If we are enabling featured status
    if (!currentFeatured) {
        // Find currently featured item
        const currentlyFeatured = series?.find(s => s.featured);
        
        // If there is another featured item, unfeature it first
        if (currentlyFeatured && currentlyFeatured.id !== id) {
             await updateMutation.mutateAsync({
                id: currentlyFeatured.id,
                data: { featured: false }
             });
        }
    }

    // Toggle the target item
    await updateMutation.mutateAsync({
      id,
      data: { featured: !currentFeatured }
    });

    // If we just featured an item, scroll to top to see it
    if (!currentFeatured) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
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
    setSeriesToDelete(id);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white font-libre-bodoni transition-colors">Anime Series</h1>
          <p className="text-gray-500 dark:text-gray-400 font-exo-2 transition-colors">Manage anime series and showcase settings.</p>
        </div>
        <button 
          onClick={handleOpenCreate}
          className="bg-gray-900 dark:bg-[#F0E6CA] hover:bg-gray-800 dark:hover:bg-white text-white dark:text-[#0a0f1c] px-4 py-2 rounded-lg font-bold flex items-center gap-2 transition-all shadow-lg shadow-gray-200 dark:shadow-[#F0E6CA]/20 font-exo-2"
        >
          <Plus className="w-5 h-5" />
          Add Series
        </button>
      </div>

      <div className="bg-white dark:bg-[#1a2333] border border-gray-200 dark:border-[#F0E6CA]/10 rounded-xl shadow-sm overflow-hidden transition-colors duration-300">
        <div className="p-4 border-b border-gray-200 dark:border-[#F0E6CA]/10 flex gap-4 transition-colors">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 w-5 h-5" />
            <input 
              type="text"
              placeholder="Search series..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-[#0a0f1c] border border-gray-200 dark:border-[#F0E6CA]/10 rounded-lg focus:outline-none focus:border-gray-900 dark:focus:border-[#F0E6CA] focus:bg-white dark:focus:bg-[#0a0f1c] text-gray-900 dark:text-white transition-colors placeholder:text-gray-400 dark:placeholder:text-gray-600 font-exo-2"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-500 dark:text-gray-400 font-exo-2 transition-colors">
            <thead className="bg-gray-100 dark:bg-[#0a0f1c] text-gray-900 dark:text-[#F0E6CA] font-bold uppercase text-xs font-exo-2 transition-colors">
              <tr>
                <th className="px-6 py-4">Name</th>
                <th className="px-6 py-4">Description</th>
                <th className="px-6 py-4">Products</th>
                <th className="px-6 py-4">Featured</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-[#F0E6CA]/5 transition-colors">
              {filteredSeries?.map((s) => (
                <tr key={s.id} className={`hover:bg-gray-50 dark:hover:bg-[#0a0f1c]/50 transition-colors font-exo-2 text-sm text-gray-500 dark:text-gray-400 ${s.featured ? 'bg-yellow-50 dark:bg-[#F0E6CA]/5' : ''}`}>
                  <td className="px-6 py-4">
                    <div className="font-bold text-gray-900 dark:text-white text-base transition-colors">{s.name}</div>
                  </td>
                  <td className="px-6 py-4 max-w-xs truncate text-gray-500">
                    {s.description || '-'}
                  </td>
                  <td className="px-6 py-4 text-gray-400">
                    {s.products?.length || 0}
                  </td>
                  <td className="px-6 py-4">
                    <button
                        onClick={() => handleToggleFeatured(s.id, s.featured)}
                        className={`p-2 rounded-full transition-colors ${s.featured ? 'text-yellow-600 dark:text-[#F0E6CA] bg-yellow-100 dark:bg-[#F0E6CA]/10' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-400'}`}
                        title={s.featured ? "Currently Featured" : "Set as Featured"}
                    >
                        <Star className={`w-5 h-5 ${s.featured ? 'fill-yellow-600 dark:fill-[#F0E6CA]' : ''}`} />
                    </button>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => handleOpenEdit(s)}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-[#F0E6CA]/10 rounded-lg text-blue-600 dark:text-blue-400 transition-colors"
                        title="Edit Series"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(s.id)}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-[#F0E6CA]/10 rounded-lg text-red-600 dark:text-red-400 transition-colors"
                        title="Delete Series"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredSeries?.length === 0 && (
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
        <div className="fixed inset-0 bg-black/50 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-colors">
            <div className="bg-white dark:bg-[#1a2333] border border-gray-200 dark:border-[#F0E6CA]/10 rounded-xl shadow-2xl w-full max-w-md p-6 animate-fade-in-up transition-colors duration-300">
                <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white font-libre-bodoni transition-colors">
                  {editingSeries ? 'Edit Series' : 'Add New Series'}
                </h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 font-exo-2 transition-colors">Series Name</label>
                        <input 
                            required
                            className="w-full bg-gray-50 dark:bg-[#0a0f1c] border border-gray-200 dark:border-[#F0E6CA]/10 text-gray-900 dark:text-white rounded-lg px-4 py-2 focus:outline-none focus:border-gray-900 dark:focus:border-[#F0E6CA] focus:bg-white dark:focus:bg-[#0a0f1c] transition-colors"
                            value={formData.name}
                            onChange={e => setFormData({...formData, name: e.target.value})}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 font-exo-2 transition-colors">Description</label>
                        <textarea 
                            className="w-full bg-gray-50 dark:bg-[#0a0f1c] border border-gray-200 dark:border-[#F0E6CA]/10 text-gray-900 dark:text-white rounded-lg px-4 py-2 focus:outline-none focus:border-gray-900 dark:focus:border-[#F0E6CA] focus:bg-white dark:focus:bg-[#0a0f1c] transition-colors"
                            rows={3}
                            value={formData.description}
                            onChange={e => setFormData({...formData, description: e.target.value})}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 font-exo-2 transition-colors">Cover Image URL</label>
                        <input 
                            className="w-full bg-gray-50 dark:bg-[#0a0f1c] border border-gray-200 dark:border-[#F0E6CA]/10 text-gray-900 dark:text-white rounded-lg px-4 py-2 focus:outline-none focus:border-gray-900 dark:focus:border-[#F0E6CA] focus:bg-white dark:focus:bg-[#0a0f1c] transition-colors"
                            value={formData.coverImage}
                            onChange={e => setFormData({...formData, coverImage: e.target.value})}
                        />
                    </div>
                    <div className="flex justify-end gap-2 pt-4">
                        <button 
                            type="button"
                            onClick={handleCloseModal}
                            className="px-4 py-2 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-[#0a0f1c] hover:bg-gray-100 rounded-lg transition-colors font-exo-2"
                        >
                            Cancel
                        </button>
                        <button 
                            type="submit"
                            disabled={createMutation.isPending || updateMutation.isPending}
                            className="bg-gray-900 dark:bg-[#F0E6CA] hover:bg-gray-800 dark:hover:bg-white text-white dark:text-[#0a0f1c] px-4 py-2 rounded-lg font-bold transition-all disabled:opacity-50 font-exo-2 shadow-lg shadow-gray-200 dark:shadow-[#F0E6CA]/20"
                        >
                            {createMutation.isPending || updateMutation.isPending ? 'Saving...' : (editingSeries ? 'Update Series' : 'Create Series')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
      )}
      
      <ConfirmDialog
        isOpen={!!seriesToDelete}
        onClose={() => setSeriesToDelete(null)}
        onConfirm={() => {
          if (seriesToDelete) {
            deleteMutation.mutate({ id: seriesToDelete });
          }
        }}
        title="Delete Series"
        description="Are you sure you want to delete this series? Products associated with it might be affected."
        variant="danger"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
