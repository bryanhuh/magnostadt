import { Link, Outlet, useLocation } from 'react-router-dom';
import { Heart, MapPin, Package, LogOut } from 'lucide-react';
import { useClerk } from '@clerk/clerk-react';

export function ProfileLayout() {
  const location = useLocation();
  const { signOut } = useClerk();

  const links = [
    { href: '/profile/orders', label: 'Order History', icon: Package },
    { href: '/profile/wishlist', label: 'Wishlist', icon: Heart },
    { href: '/profile/addresses', label: 'Addresses', icon: MapPin },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-3xl font-black uppercase tracking-tight mb-8">My Account</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Sidebar */}
        <div className="md:col-span-1 space-y-2">
          {links.map((link) => (
            <Link
              key={link.href}
              to={link.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold uppercase tracking-wide transition-all
                ${isActive(link.href) 
                  ? 'bg-black text-white' 
                  : 'bg-gray-50 text-gray-400 hover:bg-gray-100 hover:text-black'}`}
            >
              <link.icon className="w-5 h-5" />
              {link.label}
            </Link>
          ))}
          
          <button
            onClick={() => signOut()}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold uppercase tracking-wide bg-red-50 text-red-500 hover:bg-red-100 transition-all mt-8"
          >
            <LogOut className="w-5 h-5" />
            Sign Out
          </button>
        </div>

        {/* Content */}
        <div className="md:col-span-3">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
