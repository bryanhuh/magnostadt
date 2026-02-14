import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Define the shape of a cart item
// Using a simplified product type for the cart to avoid circular dependencies or massive objects
export interface CartItem {
  id: string; // Product ID
  name: string;
  price: number;
  imageUrl: string | null;
  animeName: string;
  quantity: number;
  stock: number;
}

export interface ProductToAdd {
  id: string;
  name: string;
  price: number;
  imageUrl: string | null;
  anime: { name: string };
  stock: number;
}

interface CartState {
  items: CartItem[];
  isOpen: boolean;
  
  // Actions
  addItem: (product: ProductToAdd) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  toggleCart: () => void;
  openCart: () => void;
  closeCart: () => void;
  clearCart: () => void;
  
  // Getters (derived state can be calculated in components, but helpers here are fine too)
  getTotalItems: () => number;
  getSubtotal: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,

      addItem: (product) => {
        set((state) => {
          const existingItem = state.items.find((item) => item.id === product.id);
          
          if (existingItem) {
            // Don't exceed available stock
            const newQuantity = Math.min(existingItem.quantity + 1, product.stock);
            return {
              items: state.items.map((item) =>
                item.id === product.id
                  ? { ...item, quantity: newQuantity, stock: product.stock }
                  : item
              ),
            };
          }

          if (product.stock <= 0) return {}; // Can't add out-of-stock items

          return {
            items: [
              ...state.items,
              {
                id: product.id,
                name: product.name,
                price: product.price,
                imageUrl: product.imageUrl,
                animeName: product.anime.name,
                quantity: 1,
                stock: product.stock,
              },
            ],
          };
        });
      },

      removeItem: (productId) => {
        set((state) => ({
          items: state.items.filter((item) => item.id !== productId),
        }));
      },

      updateQuantity: (productId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(productId);
          return;
        }
        
        set((state) => ({
          items: state.items.map((item) =>
            item.id === productId ? { ...item, quantity: Math.min(quantity, item.stock) } : item
          ),
        }));
      },

      toggleCart: () => set((state) => ({ isOpen: !state.isOpen })),
      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),
      clearCart: () => set({ items: [] }),

      getTotalItems: () => {
        return get().items.reduce((total, item) => total + item.quantity, 0);
      },

      getSubtotal: () => {
        return get().items.reduce((total, item) => total + (item.price * item.quantity), 0);
      },
    }),
    {
      name: 'akashic-district-cart', // key in localStorage
    }
  )
);
