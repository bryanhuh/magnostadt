import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { httpBatchLink } from '@trpc/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { trpc } from './utils/trpc';
import { ProductList } from './components/ProductList';
import { ProductDetails } from './components/ProductDetails';

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
            <header className="mb-12 text-center">
              <h1 className="text-5xl font-black tracking-tighter text-yellow-500 uppercase italic">
                Shonen-Mart
              </h1>
              <p className="text-gray-400 mt-2">Professional Anime E-Commerce</p>
            </header>
            <main className="max-w-6xl mx-auto">
              <Routes>
                <Route path="/" element={<ProductList />} />
                <Route path="/product/:id" element={<ProductDetails />} />
              </Routes>
            </main>
          </div>
        </BrowserRouter>
      </QueryClientProvider>
    </trpc.Provider>
  );
}
