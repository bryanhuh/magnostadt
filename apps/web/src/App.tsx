import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { httpBatchLink } from '@trpc/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ShoppingBag } from 'lucide-react';
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

import { SignedIn, SignedOut, SignInButton, SignUpButton, UserButton } from '@clerk/clerk-react';

function Header() {
  const { toggleCart, getTotalItems } = useCartStore();
  const totalItems = getTotalItems();

  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
      <div className="max-w-[1400px] mx-auto px-4 md:px-8 h-20 flex items-center justify-between gap-4">
        {/* Left: Logo */}
        <div className="flex-shrink-0">
          <Link to="/" className="block">
            <h1 className="text-2xl md:text-3xl font-black tracking-tighter text-yellow-600 uppercase italic">
              Shonen-Mart
            </h1>
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
            <SignedOut>
              <SignInButton mode="modal" forceRedirectUrl="/auth-callback">
                <button className="text-gray-700 hover:text-yellow-600 font-bold transition-colors text-sm">
                  Sign In
                </button>
              </SignInButton>
              <SignUpButton mode="modal" forceRedirectUrl="/auth-callback">
                <button className="bg-gray-900 text-white hover:bg-black px-4 py-2 rounded-lg font-bold transition-colors text-sm">
                  Sign Up
                </button>
              </SignUpButton>
            </SignedOut>
            <SignedIn>
              <UserButton 
                afterSignOutUrl="/"
                appearance={{
                  elements: {
                    avatarBox: "w-9 h-9 border-2 border-yellow-600"
                  }
                }}
              />
            </SignedIn>
          </div>

          <button 
            onClick={toggleCart}
            className="relative bg-gray-100 hover:bg-yellow-50 text-gray-900 p-2.5 rounded-xl transition-all group"
          >
            <ShoppingBag className="w-5 h-5 group-hover:text-yellow-600 transition-colors" />
            {totalItems > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-yellow-600 text-white font-bold text-[10px] w-5 h-5 flex items-center justify-center rounded-full border-2 border-white">
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
        <BrowserRouter>
          <div className="min-h-screen bg-gray-50 text-gray-900">
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
      </QueryClientProvider>
    </trpc.Provider>
  );
}
