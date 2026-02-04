import { useState } from 'react';
import { trpc } from '../../utils/trpc';
import { Loader2, Plus, MapPin, Trash2, Edit2 } from 'lucide-react';
import { toast } from 'sonner';

interface AddressFormProps {
  initialData?: any;
  onCancel: () => void;
  onSuccess: () => void;
}

function AddressForm({ initialData, onCancel, onSuccess }: AddressFormProps) {
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    street: initialData?.street || '',
    city: initialData?.city || '',
    state: initialData?.state || '',
    zipCode: initialData?.zipCode || '',
    country: initialData?.country || 'US',
    isDefault: initialData?.isDefault || false,
  });

  const utils = trpc.useUtils();
  
  const createMutation = trpc.address.create.useMutation({
    onSuccess: () => {
      toast.success('Address created');
      utils.address.getAll.invalidate();
      onSuccess();
    },
    onError: (err) => toast.error(err.message),
  });

  const updateMutation = trpc.address.update.useMutation({
    onSuccess: () => {
      toast.success('Address updated');
      utils.address.getAll.invalidate();
      onSuccess();
    },
    onError: (err) => toast.error(err.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (initialData?.id) {
      updateMutation.mutate({ id: initialData.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-xl p-6 space-y-4 animate-in fade-in slide-in-from-top-4">
      <h3 className="font-bold uppercase tracking-wide mb-4">
        {initialData ? 'Edit Address' : 'New Address'}
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Address Label</label>
          <input
            type="text"
            placeholder="e.g. Home, Office"
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
        </div>
        <div>
           <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Country</label>
            <select
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
              value={formData.country}
              onChange={(e) => setFormData({ ...formData, country: e.target.value })}
            >
              <option value="US">United States</option>
              <option value="CA">Canada</option>
              <option value="UK">United Kingdom</option>
              <option value="JP">Japan</option>
              {/* Add more as needed */}
            </select>
        </div>
        <div className="md:col-span-2">
          <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Street Address</label>
          <input
            type="text"
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
            value={formData.street}
            onChange={(e) => setFormData({ ...formData, street: e.target.value })}
            required
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-400 uppercase mb-1">City</label>
          <input
            type="text"
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
            value={formData.city}
            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
            required
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase mb-1">State</label>
            <input
              type="text"
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
              value={formData.state}
              onChange={(e) => setFormData({ ...formData, state: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Zip Code</label>
            <input
              type="text"
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
              value={formData.zipCode}
              onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
              required
            />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 pt-2">
        <input
          type="checkbox"
          id="isDefault"
          checked={formData.isDefault}
          onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
          className="w-4 h-4 text-yellow-600 border-gray-300 rounded focus:ring-yellow-500"
        />
        <label htmlFor="isDefault" className="text-sm font-medium text-gray-700">Set as default address</label>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 mt-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-gray-500 hover:text-black font-bold uppercase text-sm transition-colors"
          disabled={isPending}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-6 py-2 bg-black text-white rounded-lg hover:bg-yellow-500 hover:text-black font-bold uppercase transition-all flex items-center gap-2"
          disabled={isPending}
        >
          {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
          Save Address
        </button>
      </div>
    </form>
  );
}

export function Addresses() {
  const { data: addresses, isLoading } = trpc.address.getAll.useQuery();
  const utils = trpc.useUtils();
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const deleteMutation = trpc.address.delete.useMutation({
    onSuccess: () => {
      toast.success('Address deleted');
      utils.address.getAll.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-yellow-500" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
         <h2 className="text-xl font-black uppercase tracking-tight">Saved Addresses</h2>
         {!isAdding && !editingId && (
           <button
             onClick={() => setIsAdding(true)}
             className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-yellow-500 hover:text-black font-bold uppercase transition-all text-sm"
           >
             <Plus className="w-4 h-4" />
             Add New
           </button>
         )}
      </div>

      {isAdding && (
        <AddressForm 
          onCancel={() => setIsAdding(false)} 
          onSuccess={() => setIsAdding(false)} 
        />
      )}

      {addresses?.length === 0 && !isAdding && (
         <div className="flex flex-col items-center justify-center py-16 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
          <MapPin className="w-12 h-12 text-gray-200 mb-4" />
          <h3 className="text-lg font-black uppercase text-gray-400">No Addresses Found</h3>
          <p className="text-gray-400 text-sm mt-1 mb-6">Add an address for faster checkout</p>
          <button
             onClick={() => setIsAdding(true)}
             className="flex items-center gap-2 px-6 py-2 bg-white border border-gray-200 text-black rounded-lg hover:border-black font-bold uppercase transition-all text-sm shadow-sm"
           >
             <Plus className="w-4 h-4" />
             Add Address
           </button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4">
        {addresses?.map((address) => (
          editingId === address.id ? (
            <AddressForm
              key={address.id}
              initialData={address}
              onCancel={() => setEditingId(null)}
              onSuccess={() => setEditingId(null)}
            />
          ) : (
            <div key={address.id} className={`group bg-white border rounded-xl p-6 relative flex items-start justify-between transition-all hover:shadow-md
              ${address.isDefault ? 'border-yellow-500 ring-1 ring-yellow-500/20' : 'border-gray-200'}`}>
              
              <div className="space-y-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className="font-bold text-lg">{address.name}</span>
                  {address.isDefault && (
                    <span className="bg-yellow-100 text-yellow-700 text-[10px] font-black uppercase px-2 py-0.5 rounded-full tracking-wider">
                      Default
                    </span>
                  )}
                </div>
                <p className="text-gray-600">{address.street}</p>
                <p className="text-gray-600">
                  {address.city}, {address.state} {address.zipCode}
                </p>
                <p className="text-gray-400 text-sm uppercase font-bold tracking-wider mt-2">{address.country}</p>
              </div>

              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => setEditingId(address.id)}
                  className="p-2 text-gray-400 hover:text-black hover:bg-gray-50 rounded-lg transition-colors"
                  title="Edit"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    if (confirm('Are you sure you want to delete this address?')) {
                      deleteMutation.mutate({ id: address.id });
                    }
                  }}
                  className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          )
        ))}
      </div>
    </div>
  );
}
