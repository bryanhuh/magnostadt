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
import { AuthCallback } from './pages/AuthCallback';
import { useCartStore } from './store/useCartStore';

import { SignedIn, SignedOut, SignInButton, SignUpButton, UserButton } from '@clerk/clerk-react';

function Header() {
  const { toggleCart, getTotalItems } = useCartStore();
  const totalItems = getTotalItems();

  return (
    <header className="max-w-[1400px] mx-auto px-4 md:px-8 py-8 mb-4 flex flex-col md:flex-row items-center justify-between gap-6">
      <div className="text-center md:text-left">
        <h1 className="text-5xl font-black tracking-tighter text-yellow-500 uppercase italic">
          Shonen-Mart
        </h1>
        <p className="text-gray-400 mt-2">Professional Anime E-Commerce</p>
      </div>
      
      <div className="flex items-center gap-4">
        {/* Auth Buttons */}
        <div className="flex items-center gap-4">
          <SignedOut>
            <SignInButton mode="modal" forceRedirectUrl="/auth-callback">
              <button className="text-white hover:text-yellow-500 font-bold transition-colors">
                Sign In
              </button>
            </SignInButton>
            <SignUpButton mode="modal" forceRedirectUrl="/auth-callback">
              <button className="bg-white text-black hover:bg-gray-200 px-4 py-2 rounded-lg font-bold transition-colors">
                Sign Up
              </button>
            </SignUpButton>
          </SignedOut>
          <SignedIn>
            <UserButton 
              afterSignOutUrl="/"
              appearance={{
                elements: {
                  avatarBox: "w-10 h-10 border-2 border-yellow-500"
                }
              }}
            />
          </SignedIn>
        </div>

        <button 
          onClick={toggleCart}
          className="relative bg-gray-900 border border-gray-800 hover:border-yellow-500 text-white p-4 rounded-xl transition-all hover:shadow-[0_0_20px_rgba(234,179,8,0.2)] group"
        >
          <ShoppingBag className="w-6 h-6 group-hover:text-yellow-500 transition-colors" />
          {totalItems > 0 && (
            <span className="absolute -top-2 -right-2 bg-yellow-500 text-black font-bold text-xs w-6 h-6 flex items-center justify-center rounded-full border-2 border-gray-950">
              {totalItems}
            </span>
          )}
        </button>
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

export default function App() {
  const [queryClient] = useState(() => new QueryClient());
  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [
        httpBatchLink({
          url: 'http://localhost:3000/trpc',
        }),
      ],
    })
  );

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <div className="min-h-screen bg-gray-950 text-white">
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={
                 <>
                   <Header />
                   <main><HomePage /></main>
                 </>
              } />
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
                path="/product/:id" 
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
                <Route path="orders" element={<AdminOrders />} />
              </Route>
            </Routes>
          </div>
          <CartDrawer />
          <Toaster position="bottom-right" theme="dark" />
        </BrowserRouter>
      </QueryClientProvider>
    </trpc.Provider>
  );
}
