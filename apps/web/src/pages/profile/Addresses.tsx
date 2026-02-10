import { useState, useEffect } from 'react';
import { trpc } from '../../utils/trpc';
import { Loader2, Plus, MapPin, Trash2, Edit2, Navigation, Check } from 'lucide-react';
import { toast } from 'sonner';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default Leaflet marker icons in React
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

interface AddressFormProps {
  initialData?: any;
  onCancel: () => void;
  onSuccess: () => void;
}

// Map Component to handle clicks and updates
function LocationMarker({ position, setPosition, onLocationFound }: { position: [number, number] | null, setPosition: (pos: [number, number]) => void, onLocationFound?: (lat: number, lng: number) => void }) {
  const map = useMap();
  
  useEffect(() => {
    if (position) {
      map.flyTo(position, map.getZoom());
    }
  }, [position, map]);

  useMapEvents({
    click(e) {
      setPosition([e.latlng.lat, e.latlng.lng]);
      if (onLocationFound) onLocationFound(e.latlng.lat, e.latlng.lng);
    },
  });

  return position === null ? null : (
    <Marker position={position} />
  );
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

  const [mapPosition, setMapPosition] = useState<[number, number] | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);

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

  // Reverse Geocoding Function
  const fetchAddressFromCoords = async (lat: number, lng: number) => {
    try {
      setIsLoadingLocation(true);
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
      const data = await response.json();
      
      if (data.address) {
        setFormData(prev => ({
          ...prev,
          street: data.address.road || data.address.house_number || '',
          city: data.address.city || data.address.town || data.address.village || '',
          state: data.address.state || '',
          zipCode: data.address.postcode || '',
          country: data.address.country_code?.toUpperCase() || 'US'
        }));
        toast.success("Location found!", { description: "Address fields updated." });
      }
    } catch (error) {
      console.error("Geocoding error:", error);
      toast.error("Could not fetch address details from map.");
    } finally {
      setIsLoadingLocation(false);
    }
  };

  const getUserLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }

    setIsLoadingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setMapPosition([latitude, longitude]);
        fetchAddressFromCoords(latitude, longitude);
      },
      (error) => {
        console.error("Geolocation error:", error);
        toast.error("Unable to retrieve your location");
        setIsLoadingLocation(false);
      }
    );
  };

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
    <form onSubmit={handleSubmit} className="bg-white dark:bg-[#0a0f1c] border border-gray-200 dark:border-[#F0E6CA]/10 rounded-2xl overflow-hidden shadow-lg animate-in fade-in zoom-in-95 duration-300">
      <div className="bg-gray-50 dark:bg-[#1a2333] px-6 py-4 border-b border-gray-100 dark:border-[#F0E6CA]/10 flex justify-between items-center transition-colors">
        <h3 className="font-black uppercase tracking-wide text-lg flex items-center gap-2 text-gray-900 dark:text-white font-exo-2">
          {initialData ? <Edit2 className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
          {initialData ? 'Edit Address' : 'New Address'}
        </h3>
        <button 
            type="button" 
            onClick={getUserLocation}
            className="text-xs bg-gray-900 dark:bg-[#F0E6CA] text-white dark:text-[#0a0f1c] px-3 py-1.5 rounded-lg font-bold uppercase hover:bg-gray-800 dark:hover:bg-white transition-colors flex items-center gap-2"
        >
            {isLoadingLocation ? <Loader2 className="w-3 h-3 animate-spin"/> : <Navigation className="w-3 h-3" />}
            Use My Location
        </button>
      </div>
      
      <div className="p-6 space-y-8">
        {/* Map Section */}
        <div className="rounded-xl overflow-hidden border border-gray-200 dark:border-[#F0E6CA]/10 h-64 relative bg-gray-100 dark:bg-[#1a2333] group">
             {/* Fallback/Initial View centering on US or User Location */}
             <MapContainer 
                center={mapPosition || [37.7749, -122.4194]} 
                zoom={13} 
                style={{ height: '100%', width: '100%' }}
                className="z-0"
             >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <LocationMarker 
                    position={mapPosition} 
                    setPosition={setMapPosition}
                    onLocationFound={fetchAddressFromCoords}
                />
             </MapContainer>
             {!mapPosition && (
                 <div className="absolute inset-0 z-[400] bg-black/5 flex items-center justify-center pointer-events-none">
                     <p className="bg-white/90 backdrop-blur px-4 py-2 rounded-lg text-xs font-bold uppercase shadow-sm text-gray-500">
                        Click on map or use location button
                     </p>
                 </div>
             )}
             {isLoadingLocation && (
                 <div className="absolute inset-0 z-[500] bg-white/50 backdrop-blur-sm flex items-center justify-center">
                     <Loader2 className="w-8 h-8 animate-spin text-black" />
                 </div>
             )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <label className="block text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2">Address Label</label>
            <div className="relative">
                <MapPin className="absolute left-4 top-3 w-4 h-4 text-gray-300" />
                <input
                    type="text"
                    placeholder="e.g. Home, Office, Secret Base"
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-[#1a2333] border-none rounded-xl focus:ring-2 focus:ring-gray-900 dark:focus:ring-[#F0E6CA] transition-all font-medium placeholder:text-gray-300 dark:placeholder:text-gray-600 text-gray-900 dark:text-white"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                />
            </div>
          </div>

           <div className="md:col-span-2">
            <label className="block text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2">Street Address</label>
            <input
              type="text"
              placeholder="123 Anime Street"
              className="w-full px-4 py-2.5 bg-gray-50 dark:bg-[#1a2333] border-none rounded-xl focus:ring-2 focus:ring-gray-900 dark:focus:ring-[#F0E6CA] transition-all font-medium text-gray-900 dark:text-white"
              value={formData.street}
              onChange={(e) => setFormData({ ...formData, street: e.target.value })}
              required
            />
          </div>

          <div>
             <label className="block text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2">Country</label>
              <select
                className="w-full px-4 py-2.5 bg-gray-50 dark:bg-[#1a2333] border-none rounded-xl focus:ring-2 focus:ring-gray-900 dark:focus:ring-[#F0E6CA] transition-all font-medium appearance-none text-gray-900 dark:text-white"
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
              >
                <option value="US">United States</option>
                <option value="CA">Canada</option>
                <option value="UK">United Kingdom</option>
                <option value="JP">Japan</option>
                <option value="PH">Philippines</option>
              </select>
          </div>

          <div>
            <label className="block text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2">City</label>
            <input
              type="text"
              className="w-full px-4 py-2.5 bg-gray-50 dark:bg-[#1a2333] border-none rounded-xl focus:ring-2 focus:ring-gray-900 dark:focus:ring-[#F0E6CA] transition-all font-medium text-gray-900 dark:text-white"
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              required
            />
          </div>

          <div>
             <label className="block text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2">State / Province</label>
            <input
              type="text"
              className="w-full px-4 py-2.5 bg-gray-50 dark:bg-[#1a2333] border-none rounded-xl focus:ring-2 focus:ring-gray-900 dark:focus:ring-[#F0E6CA] transition-all font-medium text-gray-900 dark:text-white"
              value={formData.state}
              onChange={(e) => setFormData({ ...formData, state: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="block text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2">Zip Code</label>
            <input
              type="text"
              className="w-full px-4 py-2.5 bg-gray-50 dark:bg-[#1a2333] border-none rounded-xl focus:ring-2 focus:ring-gray-900 dark:focus:ring-[#F0E6CA] transition-all font-medium text-gray-900 dark:text-white"
              value={formData.zipCode}
              onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
              required
            />
          </div>
        </div>

        <div className="flex items-center gap-3 pt-2 group cursor-pointer" onClick={() => setFormData({ ...formData, isDefault: !formData.isDefault })}>
            <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors 
                ${formData.isDefault 
                    ? 'bg-gray-900 dark:bg-[#F0E6CA] border-gray-900 dark:border-[#F0E6CA] text-white dark:text-[#0a0f1c]' 
                    : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-[#1a2333]'}`}>
                {formData.isDefault && <Check className="w-3 h-3" />}
            </div>
            <label className="text-sm font-bold text-gray-700 dark:text-gray-300 select-none cursor-pointer">Set as default address</label>
        </div>
      </div>

      <div className="bg-gray-50 dark:bg-[#1a2333] px-6 py-4 flex justify-end gap-3 border-t border-gray-100 dark:border-[#F0E6CA]/10">
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-2.5 text-gray-500 hover:text-black dark:text-gray-400 dark:hover:text-white font-bold uppercase text-xs tracking-wider transition-colors"
          disabled={isPending}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-8 py-2.5 bg-gray-900 dark:bg-[#F0E6CA] text-white dark:text-[#0a0f1c] rounded-xl hover:bg-gray-800 dark:hover:bg-white font-bold uppercase text-xs tracking-wider transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0"
          disabled={isPending}
        >
          {isPending ? (
             <span className='flex items-center gap-2'><Loader2 className="w-3 h-3 animate-spin" /> Saving...</span>
          ) : (
             'Save Address'
          )}
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
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600 dark:text-[#F0E6CA] mb-4" />
        <span className="text-xs font-bold uppercase text-gray-400 tracking-widest animate-pulse">Loading Addresses...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between border-b border-gray-100 dark:border-[#F0E6CA]/10 pb-6 transition-colors">
         <div>
            <h2 className="text-2xl font-black uppercase tracking-tighter text-gray-900 dark:text-white font-exo-2">My Addresses</h2>
            <p className="text-gray-400 dark:text-gray-500 text-sm font-medium mt-1 font-exo-2">Manage your shipping destinations</p>
         </div>
         {!isAdding && !editingId && (
           <button
             onClick={() => setIsAdding(true)}
             className="flex items-center gap-2 px-5 py-2.5 bg-gray-900 dark:bg-[#F0E6CA] text-white dark:text-[#0a0f1c] rounded-xl hover:bg-gray-800 dark:hover:bg-white font-bold uppercase transition-all text-xs tracking-wider shadow-lg hover:shadow-xl hover:-translate-y-0.5"
           >
             <Plus className="w-4 h-4" />
             Add New Address
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
         <div className="flex flex-col items-center justify-center py-24 bg-gray-50 dark:bg-[#1a2333] rounded-3xl border-2 border-dashed border-gray-200 dark:border-[#F0E6CA]/10 group hover:border-gray-300 dark:hover:border-[#F0E6CA]/30 transition-colors">
          <div className="bg-white dark:bg-[#0a0f1c] p-4 rounded-full shadow-sm mb-6 group-hover:scale-110 transition-transform duration-300">
             <MapPin className="w-8 h-8 text-gray-300 dark:text-gray-600 group-hover:text-blue-600 dark:group-hover:text-[#F0E6CA] transition-colors" />
          </div>
          <h3 className="text-lg font-black uppercase text-gray-900 dark:text-white mb-2 font-exo-2">No Addresses Found</h3>
          <p className="text-gray-400 dark:text-gray-500 text-sm mb-8 font-medium">Add an address to speed up your checkout process functionality.</p>
          <button
             onClick={() => setIsAdding(true)}
             className="flex items-center gap-2 px-8 py-3 bg-gray-900 dark:bg-[#F0E6CA] text-white dark:text-[#0a0f1c] rounded-xl hover:bg-gray-800 dark:hover:bg-white font-bold uppercase transition-all text-xs tracking-wider shadow-lg"
           >
             <Plus className="w-4 h-4" />
             Add First Address
           </button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6">
        {addresses?.map((address) => (
          editingId === address.id ? (
            <AddressForm
              key={address.id}
              initialData={address}
              onCancel={() => setEditingId(null)}
              onSuccess={() => setEditingId(null)}
            />
          ) : (
            <div key={address.id} className={`group bg-white dark:bg-[#0a0f1c] border rounded-2xl p-6 relative flex flex-col md:flex-row md:items-center justify-between transition-all duration-300 hover:shadow-xl shadow-sm
              ${address.isDefault 
                ? 'border-gray-900 dark:border-[#F0E6CA] ring-1 ring-gray-900/5 dark:ring-[#F0E6CA]/20' 
                : 'border-gray-200 dark:border-[#F0E6CA]/10 hover:border-gray-300 dark:hover:border-[#F0E6CA]/30'}`}>
              
              <div className="flex items-start gap-5">
                <div className={`mt-1 p-3 rounded-xl flex-shrink-0 transition-colors
                    ${address.isDefault 
                        ? 'bg-gray-900 dark:bg-[#F0E6CA] text-white dark:text-[#0a0f1c]' 
                        : 'bg-gray-50 dark:bg-[#1a2333] text-gray-300 dark:text-gray-600 group-hover:text-gray-900 dark:group-hover:text-white group-hover:bg-gray-100 dark:group-hover:bg-[#1a2333]/80'}`}>
                    <MapPin className="w-6 h-6" />
                </div>
                
                <div className="space-y-1">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="font-black text-lg uppercase tracking-tight text-gray-900 dark:text-white">{address.name}</span>
                    {address.isDefault && (
                      <span className="bg-[#F0E6CA] dark:bg-[#F0E6CA] text-[#0a0f1c] text-[10px] font-black uppercase px-2 py-0.5 rounded-md tracking-wider">
                        Default
                      </span>
                    )}
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 font-medium leading-relaxed">{address.street}</p>
                  <p className="text-gray-500 dark:text-gray-500 font-medium">
                    {address.city}, {address.state} <span className="text-gray-300 dark:text-gray-700">|</span> {address.zipCode}
                  </p>
                  <p className="text-gray-400 dark:text-gray-600 text-xs uppercase font-bold tracking-widest mt-2">{address.country}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 mt-4 md:mt-0 pl-16 md:pl-0 opacity-100 md:opacity-0 md:translate-x-4 md:group-hover:opacity-100 md:group-hover:translate-x-0 transition-all duration-300">
                <button
                  onClick={() => setEditingId(address.id)}
                  className="px-4 py-2 text-gray-500 hover:text-black dark:text-gray-400 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-[#1a2333] rounded-lg transition-colors font-bold uppercase text-xs tracking-wider flex items-center gap-2"
                >
                  <Edit2 className="w-3 h-3" />
                  Edit
                </button>
                <div className="w-px h-4 bg-gray-200 dark:bg-gray-700 hidden md:block"></div>
                <button
                  onClick={() => {
                    if (confirm('Are you sure you want to delete this address?')) {
                      deleteMutation.mutate({ id: address.id });
                    }
                  }}
                  className="px-4 py-2 text-red-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-lg transition-colors font-bold uppercase text-xs tracking-wider flex items-center gap-2"
                >
                  <Trash2 className="w-3 h-3" />
                  Delete
                </button>
              </div>
            </div>
          )
        ))}
      </div>
    </div>
  );
}
