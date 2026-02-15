import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { httpBatchLink } from '@trpc/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
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
import { CollectionPage } from './pages/CollectionPage';
import { CollectionsPage } from './pages/CollectionsPage'; // [NEW]
import { AuthCallback } from './pages/AuthCallback';
import { ThemeProvider } from './context/ThemeContext';
import { ThemeToggle } from './components/ThemeToggle';
import { Header } from './components/Header';

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
import { SharedWishlist } from './pages/SharedWishlist';

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
    <HelmetProvider>
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
              <Route path="/wishlist/:token" element={
                <>
                  <Header />
                  <SharedWishlist />
                </>
              } />

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
    </HelmetProvider>
  );
}
