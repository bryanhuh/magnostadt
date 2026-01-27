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
import { useCartStore } from './store/useCartStore';

function Header() {
  const { toggleCart, getTotalItems } = useCartStore();
  const totalItems = getTotalItems();

  return (
    <header className="mb-12 flex flex-col md:flex-row items-center justify-between gap-6">
      <div className="text-center md:text-left">
        <h1 className="text-5xl font-black tracking-tighter text-yellow-500 uppercase italic">
          Shonen-Mart
        </h1>
        <p className="text-gray-400 mt-2">Professional Anime E-Commerce</p>
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
    </header>
  );
}

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
          <div className="min-h-screen bg-gray-950 text-white p-8">
            <Header />
            <main className="max-w-6xl mx-auto">
              <Routes>
                <Route path="/" element={<ProductList />} />
                <Route path="/product/:id" element={<ProductDetails />} />
                <Route path="/checkout" element={<CheckoutPage />} />
                <Route path="/order/:id" element={<OrderConfirmationPage />} />
              </Routes>
            </main>
          </div>
          <CartDrawer />
          <Toaster position="bottom-right" theme="dark" />
        </BrowserRouter>
      </QueryClientProvider>
    </trpc.Provider>
  );
}
