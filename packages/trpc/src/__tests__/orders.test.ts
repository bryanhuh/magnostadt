/**
 * orders.test.ts
 *
 * Tests for the createOrder tRPC mutation and related order procedures.
 *
 * KNOWN BUG (documented here so the test proves it):
 *   createOrder currently calculates the item total as:
 *     const itemTotal = Number(product.price) * item.quantity;
 *   It does NOT use `product.salePrice` even when `product.isSale === true`.
 *   The test "sale price bug" below asserts the CORRECT expected behaviour
 *   (using salePrice) so that it FAILS against the current implementation,
 *   making the bug visible. Once the bug is fixed the test should pass.
 *
 *   Fix required in router.ts around line 464:
 *     const effectivePrice = product.isSale && product.salePrice
 *       ? Number(product.salePrice)
 *       : Number(product.price);
 *     const itemTotal = effectivePrice * item.quantity;
 *
 * ARCHITECTURE NOTE:
 *   Several procedures (createOrder, updateProduct, getOrders, etc.) use the
 *   module-level `prisma` singleton imported from @shonen-mart/db rather than
 *   `ctx.prisma`. Tests for these procedures configure `dbMock` (the stub that
 *   the module mock returns) instead of building a per-test MockPrisma.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { dbMock } from './setup';
import { createMainCaller } from './helpers/createCaller';

// ---------------------------------------------------------------------------
// Mock external services — these intercept BOTH static and dynamic imports.
// The paths must match exactly what router.ts uses in its dynamic imports.
// ---------------------------------------------------------------------------
vi.mock('../services/stripe', () => ({
  createCheckoutSession: vi.fn().mockResolvedValue({
    id: 'cs_test_session_123',
    url: 'https://checkout.stripe.com/test',
  }),
  stripe: {},
}));

vi.mock('../services/email', () => ({
  sendOrderConfirmation: vi.fn().mockResolvedValue(undefined),
  sendShippingUpdate: vi.fn().mockResolvedValue(undefined),
  sendDeliveredUpdate: vi.fn().mockResolvedValue(undefined),
  sendCancelledUpdate: vi.fn().mockResolvedValue(undefined),
  sendBackInStockAlert: vi.fn().mockResolvedValue(undefined),
}));

// ---------------------------------------------------------------------------
// Shared fixtures
// ---------------------------------------------------------------------------
const SHIPPING_COST = 10; // Flat rate hard-coded in router.ts

const mockProduct = {
  id: 'prod_1',
  name: 'Naruto Headband',
  description: 'Leaf Village headband',
  price: '25.00',
  salePrice: null,
  isSale: false,
  isPreorder: false,
  stock: 10,
  imageUrl: 'https://example.com/headband.jpg',
  slug: 'naruto-headband',
  categoryId: 'cat_1',
  animeId: 'anime_1',
  featured: false,
  images: [],
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockSaleProduct = {
  ...mockProduct,
  id: 'prod_2',
  name: 'Sasuke Cape (Sale)',
  price: '40.00',
  salePrice: '28.00',
  isSale: true,
  slug: 'sasuke-cape-sale',
};

const baseOrderInput = {
  customerName: 'Test Buyer',
  email: 'buyer@example.com',
  address: '1 Konoha St',
  city: 'Konoha',
  zipCode: '00001',
  items: [{ productId: 'prod_1', quantity: 2 }],
};

function makeMockOrder(id: string, total: number, extra: Record<string, unknown> = {}) {
  return {
    id,
    status: 'PENDING',
    total: String(total),
    customerName: baseOrderInput.customerName,
    email: baseOrderInput.email,
    address: baseOrderInput.address,
    city: baseOrderInput.city,
    zipCode: baseOrderInput.zipCode,
    userId: null,
    stripeSessionId: null,
    paymentStatus: 'UNPAID',
    createdAt: new Date(),
    updatedAt: new Date(),
    items: [],
    user: null,
    ...extra,
  };
}

// ---------------------------------------------------------------------------
// Helpers to configure dbMock for a standard createOrder flow
// ---------------------------------------------------------------------------
function setupCreateOrderMocks(
  product: typeof mockProduct,
  quantity: number,
  orderId: string,
  total: number,
  userId: string | null = null
) {
  const createdOrder = makeMockOrder(orderId, total, { userId });

  dbMock.$transaction.mockImplementationOnce(async (cb: any) => {
    dbMock.product.findUnique.mockResolvedValueOnce(product);
    dbMock.product.update.mockResolvedValueOnce({ ...product, stock: product.stock - quantity });
    dbMock.order.create.mockResolvedValueOnce(createdOrder);
    return cb(dbMock);
  });

  // After transaction: update with stripe session id
  dbMock.order.update.mockResolvedValueOnce({ ...createdOrder, stripeSessionId: 'cs_test_session_123' });
  // Fetch full order for confirmation email
  dbMock.order.findUnique.mockResolvedValueOnce({ ...createdOrder, items: [] });

  return createdOrder;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('createOrder', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    dbMock.$transaction.mockImplementation(async (cb: any) => cb(dbMock));
  });

  it('creates an order with correct total for regular-priced items', async () => {
    const quantity = 2;
    const expectedItemTotal = Number(mockProduct.price) * quantity; // 50
    const expectedTotal = expectedItemTotal + SHIPPING_COST; // 60

    setupCreateOrderMocks(mockProduct, quantity, 'order_1', expectedTotal);

    const caller = createMainCaller({ userId: null, prisma: dbMock as any });
    const result = await caller.createOrder({ ...baseOrderInput, items: [{ productId: 'prod_1', quantity }] });

    expect(result.orderId).toBe('order_1');
    expect(result.checkoutUrl).toBe('https://checkout.stripe.com/test');

    const createCall = dbMock.order.create.mock.calls[0][0];
    expect(createCall.data.total).toBe(expectedTotal);
    expect(createCall.data.status).toBe('PENDING');
    expect(createCall.data.customerName).toBe(baseOrderInput.customerName);
  });

  it('decrements stock for each ordered item', async () => {
    const quantity = 3;
    setupCreateOrderMocks(mockProduct, quantity, 'order_2', Number(mockProduct.price) * quantity + SHIPPING_COST);

    const caller = createMainCaller({ userId: null, prisma: dbMock as any });
    await caller.createOrder({ ...baseOrderInput, items: [{ productId: 'prod_1', quantity }] });

    const stockUpdateCall = dbMock.product.update.mock.calls[0][0];
    expect(stockUpdateCall.data).toEqual({ stock: { decrement: quantity } });
    expect(stockUpdateCall.where).toEqual({ id: 'prod_1' });
  });

  it('throws BAD_REQUEST when product is not found', async () => {
    dbMock.$transaction.mockImplementationOnce(async (cb: any) => {
      dbMock.product.findUnique.mockResolvedValueOnce(null);
      return cb(dbMock);
    });

    const caller = createMainCaller({ userId: null, prisma: dbMock as any });
    await expect(
      caller.createOrder({ ...baseOrderInput, items: [{ productId: 'prod_nonexistent', quantity: 1 }] })
    ).rejects.toMatchObject({
      code: 'BAD_REQUEST',
      message: expect.stringContaining('not found'),
    });
  });

  it('throws BAD_REQUEST when ordered quantity exceeds stock', async () => {
    const lowStockProduct = { ...mockProduct, stock: 1 };

    dbMock.$transaction.mockImplementationOnce(async (cb: any) => {
      dbMock.product.findUnique.mockResolvedValueOnce(lowStockProduct);
      return cb(dbMock);
    });

    const caller = createMainCaller({ userId: null, prisma: dbMock as any });
    await expect(
      caller.createOrder({ ...baseOrderInput, items: [{ productId: 'prod_1', quantity: 5 }] })
    ).rejects.toMatchObject({
      code: 'BAD_REQUEST',
      message: expect.stringContaining('only has 1 left in stock'),
    });
  });

  it('handles multi-item orders and sums totals correctly', async () => {
    const product2 = { ...mockProduct, id: 'prod_2', name: 'Shuriken Set', price: '15.00' };
    const expectedTotal = Number(mockProduct.price) * 1 + Number(product2.price) * 2 + SHIPPING_COST; // 65
    const createdOrder = makeMockOrder('order_3', expectedTotal);

    dbMock.$transaction.mockImplementationOnce(async (cb: any) => {
      dbMock.product.findUnique
        .mockResolvedValueOnce(mockProduct)
        .mockResolvedValueOnce(product2);
      dbMock.product.update
        .mockResolvedValueOnce({ ...mockProduct, stock: 9 })
        .mockResolvedValueOnce({ ...product2, stock: 8 });
      dbMock.order.create.mockResolvedValueOnce(createdOrder);
      return cb(dbMock);
    });

    dbMock.order.update.mockResolvedValueOnce({ ...createdOrder, stripeSessionId: 'cs_test_789' });
    dbMock.order.findUnique.mockResolvedValueOnce({ ...createdOrder, items: [] });

    const caller = createMainCaller({ userId: null, prisma: dbMock as any });
    await caller.createOrder({
      ...baseOrderInput,
      items: [
        { productId: 'prod_1', quantity: 1 },
        { productId: 'prod_2', quantity: 2 },
      ],
    });

    const createCall = dbMock.order.create.mock.calls[0][0];
    expect(createCall.data.total).toBe(expectedTotal);
  });

  it('associates the order with the authenticated user when logged in', async () => {
    const userId = 'user_abc';
    const quantity = 1;
    setupCreateOrderMocks(mockProduct, quantity, 'order_4', Number(mockProduct.price) + SHIPPING_COST, userId);

    const caller = createMainCaller({ userId, prisma: dbMock as any });
    await caller.createOrder({ ...baseOrderInput, items: [{ productId: 'prod_1', quantity }] });

    const createCall = dbMock.order.create.mock.calls[0][0];
    expect(createCall.data.userId).toBe(userId);
  });

  it('sets userId to null for guest checkouts', async () => {
    const quantity = 1;
    setupCreateOrderMocks(mockProduct, quantity, 'order_5', Number(mockProduct.price) + SHIPPING_COST, null);

    const caller = createMainCaller({ userId: null, prisma: dbMock as any });
    await caller.createOrder({ ...baseOrderInput, items: [{ productId: 'prod_1', quantity }] });

    const createCall = dbMock.order.create.mock.calls[0][0];
    expect(createCall.data.userId).toBeNull();
  });

  /**
   * SALE PRICE BUG
   *
   * When a product has isSale=true and a salePrice, the order total SHOULD
   * use salePrice instead of price. The current implementation always uses
   * product.price. This test asserts the CORRECT expected behaviour and
   * intentionally FAILS against the current buggy implementation.
   *
   * Fix required in router.ts around line 464:
   *   const effectivePrice = product.isSale && product.salePrice
   *     ? Number(product.salePrice)
   *     : Number(product.price);
   *   const itemTotal = effectivePrice * item.quantity;
   */
  it('BUG: uses salePrice instead of regular price when product.isSale is true', async () => {
    const quantity = 2;
    // Correct expected total uses salePrice (28.00), not price (40.00)
    const correctTotal = Number(mockSaleProduct.salePrice) * quantity + SHIPPING_COST; // 56 + 10 = 66
    // The buggy implementation computes: 40 * 2 + 10 = 90
    const buggyTotal = Number(mockSaleProduct.price) * quantity + SHIPPING_COST;

    const createdOrder = makeMockOrder('order_sale', buggyTotal);

    dbMock.$transaction.mockImplementationOnce(async (cb: any) => {
      dbMock.product.findUnique.mockResolvedValueOnce(mockSaleProduct);
      dbMock.product.update.mockResolvedValueOnce({ ...mockSaleProduct, stock: mockSaleProduct.stock - quantity });
      dbMock.order.create.mockResolvedValueOnce(createdOrder);
      return cb(dbMock);
    });

    dbMock.order.update.mockResolvedValueOnce({ ...createdOrder, stripeSessionId: 'cs_test_sale' });
    dbMock.order.findUnique.mockResolvedValueOnce({ ...createdOrder, items: [] });

    const caller = createMainCaller({ userId: null, prisma: dbMock as any });
    await caller.createOrder({ ...baseOrderInput, items: [{ productId: 'prod_2', quantity }] });

    const createCall = dbMock.order.create.mock.calls[0][0];
    // Asserts the CORRECT behaviour — will FAIL until the bug is fixed
    expect(createCall.data.total).toBe(correctTotal);
  });

  it('validates email format — rejects invalid email', async () => {
    const caller = createMainCaller({ userId: null, prisma: dbMock as any });
    await expect(
      caller.createOrder({ ...baseOrderInput, email: 'not-an-email' })
    ).rejects.toThrow();
  });

  it('validates items array — rejects quantity < 1', async () => {
    const caller = createMainCaller({ userId: null, prisma: dbMock as any });
    await expect(
      caller.createOrder({ ...baseOrderInput, items: [{ productId: 'prod_1', quantity: 0 }] })
    ).rejects.toThrow();
  });
});

// ---------------------------------------------------------------------------
// getOrderById
// ---------------------------------------------------------------------------
describe('getOrderById', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    dbMock.$transaction.mockImplementation(async (cb: any) => cb(dbMock));
  });

  it('returns order with items when it exists', async () => {
    const order = {
      ...makeMockOrder('order_found', 60),
      items: [
        {
          id: 'item_1',
          orderId: 'order_found',
          productId: 'prod_1',
          quantity: 2,
          price: '25.00',
          product: mockProduct,
        },
      ],
    };

    dbMock.order.findUniqueOrThrow.mockResolvedValueOnce(order);

    const caller = createMainCaller({ userId: null, prisma: dbMock as any });
    const result = await caller.getOrderById({ id: 'order_found' });

    expect(result.id).toBe('order_found');
    expect(result.items).toHaveLength(1);
    expect(result.items[0].product.name).toBe('Naruto Headband');
  });

  it('throws when order does not exist', async () => {
    dbMock.order.findUniqueOrThrow.mockRejectedValueOnce(
      new Error('Record not found')
    );

    const caller = createMainCaller({ userId: null, prisma: dbMock as any });
    await expect(caller.getOrderById({ id: 'order_missing' })).rejects.toThrow('Record not found');
  });
});

// ---------------------------------------------------------------------------
// myOrders (protected — requires auth, uses ctx.prisma)
// ---------------------------------------------------------------------------
describe('myOrders', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    dbMock.$transaction.mockImplementation(async (cb: any) => cb(dbMock));
  });

  it('returns orders for the authenticated user', async () => {
    const orders = [makeMockOrder('order_a', 60), makeMockOrder('order_b', 35)];
    dbMock.order.findMany.mockResolvedValueOnce(orders);

    const caller = createMainCaller({ userId: 'user_1', prisma: dbMock as any });
    const result = await caller.myOrders();

    expect(result).toHaveLength(2);
    expect(dbMock.order.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: 'user_1' } })
    );
  });

  it('throws UNAUTHORIZED when not authenticated', async () => {
    const caller = createMainCaller({ userId: null, prisma: dbMock as any });
    await expect(caller.myOrders()).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
  });
});

// ---------------------------------------------------------------------------
// updateOrderStatus (admin) — uses module-level prisma
// ---------------------------------------------------------------------------
describe('updateOrderStatus', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    dbMock.$transaction.mockImplementation(async (cb: any) => cb(dbMock));
  });

  it('throws FORBIDDEN for non-admin users', async () => {
    const caller = createMainCaller({ userId: 'user_1', role: 'USER', prisma: dbMock as any });
    await expect(
      caller.updateOrderStatus({ id: 'order_1', status: 'SHIPPED' })
    ).rejects.toMatchObject({ code: 'FORBIDDEN' });
  });

  it('throws FORBIDDEN for unauthenticated requests', async () => {
    const caller = createMainCaller({ userId: null, prisma: dbMock as any });
    await expect(
      caller.updateOrderStatus({ id: 'order_1', status: 'SHIPPED' })
    ).rejects.toMatchObject({ code: 'FORBIDDEN' });
  });

  it('updates order status as admin', async () => {
    const updatedOrder = {
      ...makeMockOrder('order_1', 60),
      status: 'SHIPPED',
      items: [],
      user: null,
    };
    dbMock.order.update.mockResolvedValueOnce(updatedOrder);

    const caller = createMainCaller({ userId: 'admin_1', role: 'ADMIN', prisma: dbMock as any });
    const result = await caller.updateOrderStatus({ id: 'order_1', status: 'SHIPPED' });

    expect(result.status).toBe('SHIPPED');
    expect(dbMock.order.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'order_1' }, data: { status: 'SHIPPED' } })
    );
  });

  it('restores stock for all items when order is cancelled', async () => {
    const cancelledOrder = {
      ...makeMockOrder('order_cancel', 60),
      status: 'CANCELLED',
      items: [
        { id: 'oi_1', orderId: 'order_cancel', productId: 'prod_1', quantity: 2, price: '25.00' },
        { id: 'oi_2', orderId: 'order_cancel', productId: 'prod_2', quantity: 1, price: '40.00' },
      ],
      user: null,
    };

    dbMock.order.update.mockResolvedValueOnce(cancelledOrder);
    dbMock.product.update.mockResolvedValue({ id: 'prod_1' } as any);

    const caller = createMainCaller({ userId: 'admin_1', role: 'ADMIN', prisma: dbMock as any });
    await caller.updateOrderStatus({ id: 'order_cancel', status: 'CANCELLED' });

    expect(dbMock.$transaction).toHaveBeenCalled();
  });

  it('rejects invalid status values', async () => {
    const caller = createMainCaller({ userId: 'admin_1', role: 'ADMIN', prisma: dbMock as any });
    await expect(
      caller.updateOrderStatus({ id: 'order_1', status: 'INVALID_STATUS' as any })
    ).rejects.toThrow();
  });
});

// ---------------------------------------------------------------------------
// getOrders (admin only) — uses module-level prisma
// ---------------------------------------------------------------------------
describe('getOrders (admin)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    dbMock.$transaction.mockImplementation(async (cb: any) => cb(dbMock));
  });

  it('returns all orders for admin', async () => {
    const orders = [makeMockOrder('o1', 60), makeMockOrder('o2', 35)];
    dbMock.order.findMany.mockResolvedValueOnce(orders);

    const caller = createMainCaller({ userId: 'admin_1', role: 'ADMIN', prisma: dbMock as any });
    const result = await caller.getOrders();

    expect(result).toHaveLength(2);
  });

  it('throws FORBIDDEN for regular users', async () => {
    const caller = createMainCaller({ userId: 'user_1', role: 'USER', prisma: dbMock as any });
    await expect(caller.getOrders()).rejects.toMatchObject({ code: 'FORBIDDEN' });
  });
});
