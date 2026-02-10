import { Link, Outlet, useLocation } from 'react-router-dom';
import { Heart, MapPin, Package, LogOut } from 'lucide-react';
import { useClerk, useUser } from '@clerk/clerk-react';

export function ProfileLayout() {
  const location = useLocation();
  const { signOut } = useClerk();
  const { user, isSignedIn } = useUser();

  const links = [
    { href: '/profile/orders', label: 'Order History', icon: Package },
    { href: '/profile/wishlist', label: 'Wishlist', icon: Heart },
    { href: '/profile/addresses', label: 'Addresses', icon: MapPin },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="container mx-auto px-4 py-12">
      {/* <h1 className="text-3xl font-black uppercase tracking-tight mb-8">My Account</h1> */}
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Sidebar */}
        <div className="md:col-span-1 space-y-2">
          {/* User Profile Card */}
          <div className="bg-gray-50 dark:bg-[#1a2333] p-6 rounded-2xl mb-6 border border-gray-100 dark:border-[#F0E6CA]/10 flex flex-col items-center text-center transition-colors">
            <div className="w-24 h-24 rounded-full border-4 border-white dark:border-[#0a0f1c] shadow-lg overflow-hidden mb-4">
              <img 
                src={user?.imageUrl} 
                alt={user?.fullName || 'User'} 
                className="w-full h-full object-cover"
              />
            </div>
            <h3 className="font-black text-lg uppercase tracking-tight mb-1 text-gray-900 dark:text-white font-exo-2">
              {user?.fullName || 'Guest User'}
            </h3>
            <p className="text-gray-400 dark:text-gray-500 text-xs font-bold uppercase tracking-widest truncate max-w-full px-2 font-exo-2">
              {user?.primaryEmailAddress?.emailAddress}
            </p>
          </div>

          <div className="space-y-2">
            {links.map((link) => (
              <Link
              key={link.href}
              to={link.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold uppercase tracking-wide transition-all font-exo-2
                ${isActive(link.href) 
                  ? 'bg-blue-600 dark:bg-[#F0E6CA] text-white dark:text-[#0a0f1c]' 
                  : 'bg-gray-50 dark:bg-[#1a2333] text-gray-400 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#1a2333]/80 hover:text-gray-900 dark:hover:text-[#F0E6CA]'}`}
            >
              <link.icon className="w-5 h-5" />
              {link.label}
            </Link>
          ))}
          
          {isSignedIn && (
            <button
              onClick={() => signOut()}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold uppercase tracking-wide bg-red-50 dark:bg-red-500/10 text-red-500 hover:bg-red-100 dark:hover:bg-red-500/20 transition-all mt-8 font-exo-2"
            >
              <LogOut className="w-5 h-5" />
              Sign Out
            </button>
          )}
          </div>
        </div>

        {/* Content */}
        <div className="md:col-span-3">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
