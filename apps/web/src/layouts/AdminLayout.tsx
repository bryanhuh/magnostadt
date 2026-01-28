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
      <div className="h-screen w-full flex items-center justify-center bg-gray-950">
        <Loader2 className="w-12 h-12 text-yellow-500 animate-spin" />
      </div>
    );
  }

  if (!isSignedIn || dbUser?.role !== 'ADMIN') {
    return <Navigate to="/" replace />;
  }

  const navigation = [
    { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    { name: 'Products', href: '/admin/products', icon: Package },
    { name: 'Orders', href: '/admin/orders', icon: ShoppingCart },
    { name: 'Customers', href: '/admin/customers', icon: Users },
  ];

  return (
    <div className="flex h-screen bg-gray-900 text-white">
      {/* Sidebar */}
      <div className="w-64 bg-gray-950 border-r border-gray-800 flex flex-col">
        <div className="p-6">
          <h1 className="text-xl font-black text-yellow-500 uppercase italic tracking-tighter">
            Shonen Admin
          </h1>
        </div>

        <nav className="flex-1 px-4 space-y-2">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                  isActive 
                    ? 'bg-yellow-500 text-black font-bold' 
                    : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                }`}
              >
                <item.icon className="w-5 h-5" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-800">
          <button 
            onClick={() => signOut()}
            className="flex items-center gap-3 px-4 py-3 w-full text-red-500 hover:bg-red-950/30 rounded-xl transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Sign Out
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="p-8 max-w-7xl mx-auto">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
