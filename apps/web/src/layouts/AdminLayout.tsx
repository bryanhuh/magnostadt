import { Link, Outlet, useLocation, Navigate } from 'react-router-dom';
import { LayoutDashboard, Package, ShoppingCart, Users, LogOut, Loader2 } from 'lucide-react';
import { useClerk, useUser } from '@clerk/clerk-react';
import { trpc } from '../utils/trpc';

export function AdminLayout() {
  const location = useLocation();
  const { signOut } = useClerk();
  const { isLoaded, isSignedIn } = useUser();
  
  // Fetch user role from DB
  const { data: dbUser, isLoading: isDbLoading } = trpc.auth.me.useQuery(undefined, {
    enabled: !!isSignedIn,
    retry: false,
  });

  if (!isLoaded || (isSignedIn && isDbLoading)) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-gray-50 dark:bg-[#0a0f1c]">
        <Loader2 className="w-12 h-12 text-gray-900 dark:text-[#F0E6CA] animate-spin" />
      </div>
    );
  }

  if (!isSignedIn || dbUser?.role !== 'ADMIN') {
    return <Navigate to="/" replace />;
  }

  const navigation = [
    { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    { name: 'Products', href: '/admin/products', icon: Package },
    { name: 'Series', href: '/admin/series', icon: Package }, // Reusing Package icon for now, or could use another
    { name: 'Orders', href: '/admin/orders', icon: ShoppingCart },
    { name: 'Customers', href: '/admin/customers', icon: Users },
  ];

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-[#0a0f1c] text-gray-900 dark:text-white font-exo-2 transition-colors duration-300">
      {/* Sidebar */}
      <div className="w-64 bg-white dark:bg-[#0a0f1c] border-r border-gray-200 dark:border-[#F0E6CA]/10 flex flex-col shadow-xl shadow-black/5 dark:shadow-black/20 transition-colors duration-300">
        <div className="p-6">
          <img 
            src="/logo.png" 
            alt="Magnostadt" 
            className="h-10 w-auto object-contain brightness-0 dark:invert transition-all"
          />
        </div>

        <nav className="flex-1 px-4 space-y-2">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                  isActive 
                    ? 'bg-gray-100 dark:bg-[#F0E6CA] text-gray-900 dark:text-[#0a0f1c] font-black shadow-lg shadow-gray-200 dark:shadow-[#F0E6CA]/20' 
                    : 'text-gray-700 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[#1a2333] hover:text-gray-900 dark:hover:text-[#F0E6CA]'
                }`}
              >
                <item.icon className={`w-5 h-5 ${isActive ? 'text-gray-900 dark:text-[#0a0f1c]' : 'text-gray-400 group-hover:text-gray-900 dark:group-hover:text-[#F0E6CA]'}`} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-200 dark:border-[#F0E6CA]/10">
          <button 
            onClick={() => signOut()}
            className="flex items-center gap-3 px-4 py-3 w-full text-red-500 hover:bg-red-500/10 rounded-xl transition-colors font-bold"
          >
            <LogOut className="w-5 h-5" />
            Sign Out
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto bg-gray-50 dark:bg-[#0a0f1c] transition-colors duration-300">
        <div className="p-8 max-w-7xl mx-auto">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
