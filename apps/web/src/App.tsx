import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { httpBatchLink } from '@trpc/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ShoppingBag, Heart } from 'lucide-react';
import { trpc } from './utils/trpc';
import * as Sentry from '@sentry/react';
import { Toaster } from 'sonner';
import { initAnalytics } from './utils/analytics';
import { ProductList } from './components/ProductList';
import { Link } from 'react-router-dom';

// Initialize Analytics
initAnalytics();

// Initialize Sentry
if (import.meta.env.VITE_SENTRY_DSN) {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration(),
    ],
    tracesSampleRate: 1.0,
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
  });
}
import { ProductDetails } from './components/ProductDetails';
import { CartDrawer } from './components/CartDrawer';
import { CheckoutPage } from './components/CheckoutPage';
import { OrderConfirmationPage } from './components/OrderConfirmationPage';
import { HomePage } from './components/HomePage';
import { CollectionPage } from './pages/CollectionPage';
import { CollectionsPage } from './pages/CollectionsPage'; // [NEW]
import { AuthCallback } from './pages/AuthCallback';
import { useCartStore } from './store/useCartStore';
import { Navigation } from './components/Navigation'; // [NEW]

import { SignedIn, UserButton } from '@clerk/clerk-react';
import { ThemeProvider } from './context/ThemeContext';
import { ThemeToggle } from './components/ThemeToggle';

function Header() {
  const { toggleCart, getTotalItems } = useCartStore();
  const totalItems = getTotalItems();

  return (
    <header className="sticky top-0 z-[100] bg-white/80 dark:bg-[#0a0f1c]/80 backdrop-blur-md border-b border-gray-200 dark:border-[#F0E6CA]/10 transition-colors duration-300">
      <div className="max-w-[1400px] mx-auto px-4 md:px-8 h-20 flex items-center justify-between gap-4">
        {/* Left: Logo */}
        <div className="flex-shrink-0">
          <Link to="/" className="block">
            <img 
              src="/logo.png" 
              alt="Akashic District" 
              className="h-16 md:h-20 w-auto object-contain brightness-0 dark:invert transition-all"
            />
          </Link>
        </div>
        
        {/* Middle: Navigation */}
        <div className="hidden md:block">
          <Navigation />
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-4 flex-shrink-0">
          {/* Auth Buttons */}
          <div className="flex items-center gap-4">

            <SignedIn>
              <UserButton 
                afterSignOutUrl="/"
                userProfileUrl="/profile"
                appearance={{
                  elements: {
                    avatarBox: "w-9 h-9 border-2 border-[#F0E6CA]"
                  }
                }}
              >
                <UserButton.MenuItems>
                  <UserButton.Action label="Wishlist" labelIcon={<Heart className="w-4 h-4" />} onClick={() => window.location.href = '/profile/wishlist'} />
                </UserButton.MenuItems>
              </UserButton>
            </SignedIn>
          </div>

          <button 
            onClick={toggleCart}
            className="relative bg-gray-100 dark:bg-[#1a2333] hover:bg-gray-200 dark:hover:bg-[#F0E6CA]/10 text-gray-900 dark:text-[#F0E6CA] p-2.5 rounded-xl transition-all group border border-gray-200 dark:border-[#F0E6CA]/20"
          >
            <ShoppingBag className="w-5 h-5 group-hover:text-gray-900 dark:group-hover:text-white transition-colors" />
            {totalItems > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-gray-900 dark:bg-[#F0E6CA] text-white dark:text-[#0a0f1c] font-bold text-[10px] w-5 h-5 flex items-center justify-center rounded-full border-2 border-white dark:border-[#0a0f1c]">
                {totalItems}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
      

  );
}

function MainLayout({ children }: { children: React.ReactNode }) {
  return <div className="max-w-[1400px] mx-auto px-4 md:px-8">{children}</div>;
}

import { AdminLayout } from './layouts/AdminLayout';
import { Dashboard } from './pages/admin/Dashboard';
import { AdminProducts } from './pages/admin/Products';
import { AdminProductForm } from './pages/admin/ProductForm';
import { AdminOrders } from './pages/admin/Orders';
import { AdminCustomers } from './pages/admin/Customers';
import { AdminSeries } from './pages/admin/Series';
import { ProfileLayout } from './pages/profile/ProfileLayout';
import { Wishlist } from './pages/profile/Wishlist';
import { Addresses } from './pages/profile/Addresses';
import { Orders } from './pages/profile/Orders';

export default function App() {
  const [queryClient] = useState(() => new QueryClient());
  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [
        httpBatchLink({
          url: 'http://localhost:3000/trpc',
          async headers() {
            // @ts-ignore - Clerk attaches to window
            const token = await window.Clerk?.session?.getToken();
            return {
              Authorization: token ? `Bearer ${token}` : undefined,
            };
          },
        }),
      ],
    })
  );

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
          <BrowserRouter>
            <div className="min-h-screen bg-gray-50 dark:bg-[#0a0f1c] text-gray-900 dark:text-gray-100 font-exo-2 transition-colors duration-300">
              <ThemeToggle />
              <Routes>
              {/* Public Routes */}
              <Route path="/" element={
                 <>
                   <Header />
                   <main><HomePage /></main>
                 </>
              } />
              <Route 
                path="/collection/:slug" 
                element={
                  <>
                    <Header />
                    <CollectionPage />
                  </>
                } 
              />
              <Route 
                path="/collections" 
                element={
                  <>
                    <Header />
                    <CollectionsPage />
                  </>
                } 
              />
              <Route 
                path="/flash-sale" 
                element={
                  <>
                    <Header />
                    <MainLayout><ProductList initialFilter={{ isSale: true }} /></MainLayout>
                  </>
                } 
              />
              <Route 
                path="/pre-orders" 
                element={
                  <>
                    <Header />
                    <MainLayout><ProductList initialFilter={{ isPreorder: true }} /></MainLayout>
                  </>
                } 
              />
              <Route 
                path="/figures" 
                element={
                  <>
                    <Header />
                    <MainLayout><ProductList initialFilter={{ categoryName: 'Figures' }} /></MainLayout>
                  </>
                } 
              />
              <Route 
                path="/manga" 
                element={
                  <>
                    <Header />
                    <MainLayout><ProductList initialFilter={{ categoryName: 'Manga' }} /></MainLayout>
                  </>
                } 
              />
              <Route 
                path="/latest" 
                element={
                  <>
                    <Header />
                    <MainLayout><ProductList initialFilter={{ sortBy: 'newest' }} /></MainLayout>
                  </>
                } 
              />
              <Route 
                path="/shop" 
                element={
                  <>
                    <Header />
                    <MainLayout><ProductList /></MainLayout>
                  </>
                } 
              />
              <Route 
                path="/product/:slug" 
                element={
                  <>
                    <Header />
                    <MainLayout><ProductDetails /></MainLayout>
                  </>
                } 
              />
              <Route 
                path="/checkout" 
                element={
                  <>
                    <Header />
                    <MainLayout><CheckoutPage /></MainLayout>
                  </>
                } 
              />
              <Route 
                path="/order/:id" 
                element={
                  <>
                    <Header />
                    <MainLayout><OrderConfirmationPage /></MainLayout>
                  </>
                } 
              />
              <Route path="/auth-callback" element={<AuthCallback />} />

              {/* Profile Routes */}
              <Route path="/profile" element={
                <>
                  <Header />
                  <ProfileLayout />
                </>
              }>
                <Route index element={<Navigate to="orders" replace />} />
                <Route path="orders" element={<Orders />} />
                <Route path="wishlist" element={<Wishlist />} />
                <Route path="addresses" element={<Addresses />} />
              </Route>

              {/* Admin Routes */}
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<Dashboard />} />
                <Route path="products" element={<AdminProducts />} />
                <Route path="products/new" element={<AdminProductForm />} />
                <Route path="products/:id/edit" element={<AdminProductForm />} />
                <Route path="series" element={<AdminSeries />} />
                <Route path="orders" element={<AdminOrders />} />
                <Route path="customers" element={<AdminCustomers />} />
              </Route>
            </Routes>
          </div>
          <CartDrawer />
          <Toaster position="bottom-right" theme="light" />
          </BrowserRouter>
        </ThemeProvider>
      </QueryClientProvider>
    </trpc.Provider>
  );
}
