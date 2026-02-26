/**
 * useCartStore.test.ts
 *
 * Tests for the Zustand cart store (apps/web/src/store/useCartStore.ts).
 *
 * Covers:
 *   - addItem (new item, duplicate, stock cap, out-of-stock guard)
 *   - removeItem
 *   - updateQuantity (normal, above stock cap, at/below zero → removes item)
 *   - clearCart
 *   - toggleCart / openCart / closeCart
 *   - getTotalItems (derived count)
 *   - getSubtotal (derived price)
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { act } from '@testing-library/react';

// ---------------------------------------------------------------------------
// Mock localStorage (happy-dom provides one but we want isolation per test)
// ---------------------------------------------------------------------------
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
  };
})();

Object.defineProperty(globalThis, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

// ---------------------------------------------------------------------------
// Import store — must be after localStorage mock
// ---------------------------------------------------------------------------
import { useCartStore, type ProductToAdd } from '../useCartStore';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------
const makeProduct = (overrides: Partial<ProductToAdd> = {}): ProductToAdd => ({
  id: 'prod_1',
  name: 'Naruto Headband',
  price: 25.0,
  imageUrl: 'https://example.com/headband.jpg',
  anime: { name: 'Naruto' },
  stock: 10,
  ...overrides,
});

// ---------------------------------------------------------------------------
// Reset store state before each test to guarantee isolation
// ---------------------------------------------------------------------------
beforeEach(() => {
  localStorageMock.clear();
  // Reset the store to its initial state by calling clearCart + closeCart
  act(() => {
    useCartStore.setState({ items: [], isOpen: false });
  });
});

// ---------------------------------------------------------------------------
// addItem
// ---------------------------------------------------------------------------
describe('addItem', () => {
  it('adds a new product to the cart', () => {
    const product = makeProduct();

    act(() => {
      useCartStore.getState().addItem(product);
    });

    const { items } = useCartStore.getState();
    expect(items).toHaveLength(1);
    expect(items[0].id).toBe('prod_1');
    expect(items[0].name).toBe('Naruto Headband');
    expect(items[0].price).toBe(25.0);
    expect(items[0].quantity).toBe(1);
    expect(items[0].animeName).toBe('Naruto');
  });

  it('increments quantity when adding an item already in the cart', () => {
    const product = makeProduct();

    act(() => {
      useCartStore.getState().addItem(product);
      useCartStore.getState().addItem(product);
    });

    const { items } = useCartStore.getState();
    expect(items).toHaveLength(1);
    expect(items[0].quantity).toBe(2);
  });

  it('does not exceed available stock when incrementing', () => {
    const product = makeProduct({ stock: 2 });

    act(() => {
      useCartStore.getState().addItem(product);
      useCartStore.getState().addItem(product);
      useCartStore.getState().addItem(product); // would exceed stock=2
    });

    const { items } = useCartStore.getState();
    expect(items[0].quantity).toBe(2); // capped at stock
  });

  it('does not add out-of-stock products (stock <= 0)', () => {
    const outOfStockProduct = makeProduct({ stock: 0 });

    act(() => {
      useCartStore.getState().addItem(outOfStockProduct);
    });

    expect(useCartStore.getState().items).toHaveLength(0);
  });

  it('adds multiple distinct products independently', () => {
    const product1 = makeProduct({ id: 'prod_1', name: 'Headband' });
    const product2 = makeProduct({ id: 'prod_2', name: 'Shuriken', price: 15.0 });

    act(() => {
      useCartStore.getState().addItem(product1);
      useCartStore.getState().addItem(product2);
    });

    const { items } = useCartStore.getState();
    expect(items).toHaveLength(2);
  });

  it('stores imageUrl as-is (including null)', () => {
    const product = makeProduct({ imageUrl: null });

    act(() => {
      useCartStore.getState().addItem(product);
    });

    expect(useCartStore.getState().items[0].imageUrl).toBeNull();
  });

  it('updates the stored stock value when re-adding an existing item', () => {
    // If the same product is added again with a lower stock (e.g., someone else bought some),
    // the cart item's stock field should reflect the latest value.
    const product = makeProduct({ stock: 10 });
    const productWithLessStock = makeProduct({ stock: 3 }); // same id

    act(() => {
      useCartStore.getState().addItem(product);
      useCartStore.getState().addItem(productWithLessStock);
    });

    expect(useCartStore.getState().items[0].stock).toBe(3);
  });
});

// ---------------------------------------------------------------------------
// removeItem
// ---------------------------------------------------------------------------
describe('removeItem', () => {
  it('removes the item from the cart by product id', () => {
    act(() => {
      useCartStore.getState().addItem(makeProduct({ id: 'prod_1' }));
      useCartStore.getState().addItem(makeProduct({ id: 'prod_2', name: 'Shuriken', price: 15 }));
      useCartStore.getState().removeItem('prod_1');
    });

    const { items } = useCartStore.getState();
    expect(items).toHaveLength(1);
    expect(items[0].id).toBe('prod_2');
  });

  it('does nothing when removing a product that is not in the cart', () => {
    act(() => {
      useCartStore.getState().addItem(makeProduct());
      useCartStore.getState().removeItem('prod_nonexistent');
    });

    expect(useCartStore.getState().items).toHaveLength(1);
  });

  it('results in an empty cart when the only item is removed', () => {
    act(() => {
      useCartStore.getState().addItem(makeProduct());
      useCartStore.getState().removeItem('prod_1');
    });

    expect(useCartStore.getState().items).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// updateQuantity
// ---------------------------------------------------------------------------
describe('updateQuantity', () => {
  it('updates the quantity for a specific product', () => {
    act(() => {
      useCartStore.getState().addItem(makeProduct({ stock: 10 }));
      useCartStore.getState().updateQuantity('prod_1', 5);
    });

    expect(useCartStore.getState().items[0].quantity).toBe(5);
  });

  it('caps quantity at the available stock', () => {
    act(() => {
      useCartStore.getState().addItem(makeProduct({ stock: 3 }));
      useCartStore.getState().updateQuantity('prod_1', 99); // way over stock
    });

    expect(useCartStore.getState().items[0].quantity).toBe(3);
  });

  it('removes the item when quantity is updated to 0', () => {
    act(() => {
      useCartStore.getState().addItem(makeProduct());
      useCartStore.getState().updateQuantity('prod_1', 0);
    });

    expect(useCartStore.getState().items).toHaveLength(0);
  });

  it('removes the item when quantity is set to a negative number', () => {
    act(() => {
      useCartStore.getState().addItem(makeProduct());
      useCartStore.getState().updateQuantity('prod_1', -1);
    });

    expect(useCartStore.getState().items).toHaveLength(0);
  });

  it('does not affect other items in the cart', () => {
    act(() => {
      useCartStore.getState().addItem(makeProduct({ id: 'prod_1', stock: 10 }));
      useCartStore.getState().addItem(makeProduct({ id: 'prod_2', name: 'Shuriken', price: 15, stock: 5 }));
      useCartStore.getState().updateQuantity('prod_1', 4);
    });

    const { items } = useCartStore.getState();
    const prod2 = items.find((i) => i.id === 'prod_2');
    expect(prod2?.quantity).toBe(1); // unchanged
  });
});

// ---------------------------------------------------------------------------
// clearCart
// ---------------------------------------------------------------------------
describe('clearCart', () => {
  it('removes all items from the cart', () => {
    act(() => {
      useCartStore.getState().addItem(makeProduct({ id: 'prod_1' }));
      useCartStore.getState().addItem(makeProduct({ id: 'prod_2', name: 'Shuriken', price: 15 }));
      useCartStore.getState().clearCart();
    });

    expect(useCartStore.getState().items).toHaveLength(0);
  });

  it('is idempotent — clearing an already empty cart does not error', () => {
    act(() => {
      useCartStore.getState().clearCart();
    });

    expect(useCartStore.getState().items).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// Cart visibility (toggleCart / openCart / closeCart)
// ---------------------------------------------------------------------------
describe('cart visibility', () => {
  it('toggleCart switches isOpen from false to true', () => {
    act(() => { useCartStore.getState().toggleCart(); });
    expect(useCartStore.getState().isOpen).toBe(true);
  });

  it('toggleCart switches isOpen from true to false', () => {
    act(() => {
      useCartStore.getState().openCart();
      useCartStore.getState().toggleCart();
    });
    expect(useCartStore.getState().isOpen).toBe(false);
  });

  it('openCart sets isOpen to true', () => {
    act(() => { useCartStore.getState().openCart(); });
    expect(useCartStore.getState().isOpen).toBe(true);
  });

  it('closeCart sets isOpen to false', () => {
    act(() => {
      useCartStore.getState().openCart();
      useCartStore.getState().closeCart();
    });
    expect(useCartStore.getState().isOpen).toBe(false);
  });

  it('openCart is idempotent', () => {
    act(() => {
      useCartStore.getState().openCart();
      useCartStore.getState().openCart();
    });
    expect(useCartStore.getState().isOpen).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// getTotalItems
// ---------------------------------------------------------------------------
describe('getTotalItems', () => {
  it('returns 0 for an empty cart', () => {
    expect(useCartStore.getState().getTotalItems()).toBe(0);
  });

  it('returns the sum of all item quantities', () => {
    act(() => {
      useCartStore.getState().addItem(makeProduct({ id: 'prod_1', stock: 10 }));
      useCartStore.getState().addItem(makeProduct({ id: 'prod_1', stock: 10 })); // qty → 2
      useCartStore.getState().addItem(makeProduct({ id: 'prod_2', name: 'Shuriken', price: 15, stock: 5 }));
    });

    // prod_1: qty=2, prod_2: qty=1 → total=3
    expect(useCartStore.getState().getTotalItems()).toBe(3);
  });

  it('reflects quantity updates', () => {
    act(() => {
      useCartStore.getState().addItem(makeProduct({ stock: 10 }));
      useCartStore.getState().updateQuantity('prod_1', 7);
    });

    expect(useCartStore.getState().getTotalItems()).toBe(7);
  });
});

// ---------------------------------------------------------------------------
// getSubtotal
// ---------------------------------------------------------------------------
describe('getSubtotal', () => {
  it('returns 0 for an empty cart', () => {
    expect(useCartStore.getState().getSubtotal()).toBe(0);
  });

  it('calculates subtotal correctly for a single item', () => {
    act(() => {
      useCartStore.getState().addItem(makeProduct({ price: 25.0, stock: 10 }));
      useCartStore.getState().addItem(makeProduct({ price: 25.0, stock: 10 })); // qty → 2
    });

    expect(useCartStore.getState().getSubtotal()).toBe(50.0);
  });

  it('calculates subtotal correctly for multiple different items', () => {
    act(() => {
      useCartStore.getState().addItem(makeProduct({ id: 'prod_1', price: 25.0, stock: 10 }));
      useCartStore.getState().addItem(makeProduct({ id: 'prod_2', name: 'Shuriken', price: 15.0, stock: 5 }));
    });

    // 25 * 1 + 15 * 1 = 40
    expect(useCartStore.getState().getSubtotal()).toBe(40.0);
  });

  it('updates after quantity change', () => {
    act(() => {
      useCartStore.getState().addItem(makeProduct({ price: 10.0, stock: 10 }));
      useCartStore.getState().updateQuantity('prod_1', 3);
    });

    expect(useCartStore.getState().getSubtotal()).toBe(30.0);
  });

  it('updates after item removal', () => {
    act(() => {
      useCartStore.getState().addItem(makeProduct({ id: 'prod_1', price: 25.0, stock: 5 }));
      useCartStore.getState().addItem(makeProduct({ id: 'prod_2', name: 'Cape', price: 40.0, stock: 3 }));
      useCartStore.getState().removeItem('prod_2');
    });

    expect(useCartStore.getState().getSubtotal()).toBe(25.0);
  });

  it('returns 0 after clearCart', () => {
    act(() => {
      useCartStore.getState().addItem(makeProduct({ price: 99.0, stock: 5 }));
      useCartStore.getState().clearCart();
    });

    expect(useCartStore.getState().getSubtotal()).toBe(0);
  });
});
