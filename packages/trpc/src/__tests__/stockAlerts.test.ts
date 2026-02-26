/**
 * stockAlerts.test.ts
 *
 * Tests for stockAlertRouter procedures:
 *   - subscribe
 *   - unsubscribe
 *   - checkStatus
 *   - getMyAlerts
 *
 * Also tests the back-in-stock notification trigger inside updateProduct.
 *
 * ARCHITECTURE NOTE:
 *   stockAlertRouter procedures use `ctx.prisma` (injected via context), so
 *   they use a per-test MockPrisma.
 *
 *   updateProduct uses the module-level `prisma` singleton from @shonen-mart/db,
 *   so those tests configure `dbMock` from setup.ts instead.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { dbMock } from './setup';
import { createMockPrisma } from './helpers/mockPrisma';
import { createStockAlertCaller, createMainCaller } from './helpers/createCaller';

// ---------------------------------------------------------------------------
// Mock email and stripe services.
// IMPORTANT: paths must match exactly what router.ts uses in its dynamic
// `await import(...)` calls — relative to the router module, not the test.
// ---------------------------------------------------------------------------
vi.mock('../services/email', () => ({
  sendBackInStockAlert: vi.fn().mockResolvedValue(undefined),
  sendOrderConfirmation: vi.fn().mockResolvedValue(undefined),
  sendShippingUpdate: vi.fn().mockResolvedValue(undefined),
  sendDeliveredUpdate: vi.fn().mockResolvedValue(undefined),
  sendCancelledUpdate: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../services/stripe', () => ({
  createCheckoutSession: vi.fn().mockResolvedValue({
    id: 'cs_test_session_123',
    url: 'https://checkout.stripe.com/test',
  }),
  stripe: {},
}));

// Import the mocked version so we can assert on it
import * as emailService from '../services/email';

// ---------------------------------------------------------------------------
// Shared fixtures
// ---------------------------------------------------------------------------
const USER_ID = 'user_alert_1';
const PRODUCT_ID = 'prod_alert_1';
const ALERT_EMAIL = 'alerts@example.com';

const mockAlert = {
  id: 'alert_1',
  userId: USER_ID,
  productId: PRODUCT_ID,
  email: ALERT_EMAIL,
  notified: false,
  createdAt: new Date(),
};

const mockProduct = {
  id: PRODUCT_ID,
  name: 'Dragon Ball Capsule',
  description: 'Collectible capsule',
  price: '19.99',
  salePrice: null,
  isSale: false,
  stock: 0,
  imageUrl: 'https://example.com/capsule.jpg',
  slug: 'dragonball-capsule',
  categoryId: 'cat_1',
  animeId: 'anime_1',
  featured: false,
  isPreorder: false,
  images: [],
  createdAt: new Date(),
  updatedAt: new Date(),
  anime: {
    id: 'anime_1',
    name: 'Dragon Ball Z',
    slug: 'dbz',
    featured: false,
    description: null,
    coverImage: null,
    headerImage: null,
  },
  category: { id: 'cat_1', name: 'Collectibles' },
};

// ---------------------------------------------------------------------------
// stockAlert.subscribe
// ---------------------------------------------------------------------------
describe('stockAlert.subscribe', () => {
  let mockPrisma: ReturnType<typeof createMockPrisma>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockPrisma = createMockPrisma();
  });

  it('creates a new stock alert for authenticated user', async () => {
    mockPrisma.stockAlert.upsert.mockResolvedValueOnce(mockAlert);

    const caller = createStockAlertCaller({ userId: USER_ID, prisma: mockPrisma });
    const result = await caller.stockAlert.subscribe({ productId: PRODUCT_ID, email: ALERT_EMAIL });

    expect(result.userId).toBe(USER_ID);
    expect(result.productId).toBe(PRODUCT_ID);
    expect(result.email).toBe(ALERT_EMAIL);
    expect(result.notified).toBe(false);

    expect(mockPrisma.stockAlert.upsert).toHaveBeenCalledWith({
      where: {
        userId_productId: { userId: USER_ID, productId: PRODUCT_ID },
      },
      update: { email: ALERT_EMAIL, notified: false },
      create: { userId: USER_ID, productId: PRODUCT_ID, email: ALERT_EMAIL },
    });
  });

  it('resets notified to false when re-subscribing (upsert update path)', async () => {
    const resetAlert = { ...mockAlert, notified: false };
    mockPrisma.stockAlert.upsert.mockResolvedValueOnce(resetAlert);

    const caller = createStockAlertCaller({ userId: USER_ID, prisma: mockPrisma });
    const result = await caller.stockAlert.subscribe({ productId: PRODUCT_ID, email: ALERT_EMAIL });

    expect(result.notified).toBe(false);
    const upsertCall = mockPrisma.stockAlert.upsert.mock.calls[0][0];
    expect(upsertCall.update.notified).toBe(false);
  });

  it('throws UNAUTHORIZED for unauthenticated users', async () => {
    const caller = createStockAlertCaller({ userId: null, prisma: mockPrisma });
    await expect(
      caller.stockAlert.subscribe({ productId: PRODUCT_ID, email: ALERT_EMAIL })
    ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
  });

  it('validates email format — rejects invalid emails', async () => {
    const caller = createStockAlertCaller({ userId: USER_ID, prisma: mockPrisma });
    await expect(
      caller.stockAlert.subscribe({ productId: PRODUCT_ID, email: 'not-a-valid-email' })
    ).rejects.toThrow();
  });

  it('accepts different email than the account email', async () => {
    const differentEmail = 'secondary@example.com';
    mockPrisma.stockAlert.upsert.mockResolvedValueOnce({ ...mockAlert, email: differentEmail });

    const caller = createStockAlertCaller({ userId: USER_ID, prisma: mockPrisma });
    const result = await caller.stockAlert.subscribe({ productId: PRODUCT_ID, email: differentEmail });

    expect(result.email).toBe(differentEmail);
  });
});

// ---------------------------------------------------------------------------
// stockAlert.unsubscribe
// ---------------------------------------------------------------------------
describe('stockAlert.unsubscribe', () => {
  let mockPrisma: ReturnType<typeof createMockPrisma>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockPrisma = createMockPrisma();
  });

  it('deletes the stock alert record', async () => {
    mockPrisma.stockAlert.delete.mockResolvedValueOnce(mockAlert);

    const caller = createStockAlertCaller({ userId: USER_ID, prisma: mockPrisma });
    const result = await caller.stockAlert.unsubscribe({ productId: PRODUCT_ID });

    expect(result.id).toBe('alert_1');
    expect(mockPrisma.stockAlert.delete).toHaveBeenCalledWith({
      where: {
        userId_productId: { userId: USER_ID, productId: PRODUCT_ID },
      },
    });
  });

  it('throws UNAUTHORIZED for unauthenticated users', async () => {
    const caller = createStockAlertCaller({ userId: null, prisma: mockPrisma });
    await expect(
      caller.stockAlert.unsubscribe({ productId: PRODUCT_ID })
    ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
  });
});

// ---------------------------------------------------------------------------
// stockAlert.checkStatus
// ---------------------------------------------------------------------------
describe('stockAlert.checkStatus', () => {
  let mockPrisma: ReturnType<typeof createMockPrisma>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockPrisma = createMockPrisma();
  });

  it('returns true when alert exists and is not yet notified', async () => {
    mockPrisma.stockAlert.findUnique.mockResolvedValueOnce({ ...mockAlert, notified: false });

    const caller = createStockAlertCaller({ userId: USER_ID, prisma: mockPrisma });
    const result = await caller.stockAlert.checkStatus({ productId: PRODUCT_ID });

    expect(result).toBe(true);
  });

  it('returns false when alert exists but was already notified', async () => {
    mockPrisma.stockAlert.findUnique.mockResolvedValueOnce({ ...mockAlert, notified: true });

    const caller = createStockAlertCaller({ userId: USER_ID, prisma: mockPrisma });
    const result = await caller.stockAlert.checkStatus({ productId: PRODUCT_ID });

    // !!alert && !alert.notified → true && !true → false
    expect(result).toBe(false);
  });

  it('returns false when no alert exists', async () => {
    mockPrisma.stockAlert.findUnique.mockResolvedValueOnce(null);

    const caller = createStockAlertCaller({ userId: USER_ID, prisma: mockPrisma });
    const result = await caller.stockAlert.checkStatus({ productId: PRODUCT_ID });

    expect(result).toBe(false);
  });

  it('queries with correct composite key', async () => {
    mockPrisma.stockAlert.findUnique.mockResolvedValueOnce(null);

    const caller = createStockAlertCaller({ userId: USER_ID, prisma: mockPrisma });
    await caller.stockAlert.checkStatus({ productId: PRODUCT_ID });

    expect(mockPrisma.stockAlert.findUnique).toHaveBeenCalledWith({
      where: {
        userId_productId: { userId: USER_ID, productId: PRODUCT_ID },
      },
    });
  });

  it('throws UNAUTHORIZED for unauthenticated users', async () => {
    const caller = createStockAlertCaller({ userId: null, prisma: mockPrisma });
    await expect(
      caller.stockAlert.checkStatus({ productId: PRODUCT_ID })
    ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
  });
});

// ---------------------------------------------------------------------------
// stockAlert.getMyAlerts
// ---------------------------------------------------------------------------
describe('stockAlert.getMyAlerts', () => {
  let mockPrisma: ReturnType<typeof createMockPrisma>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockPrisma = createMockPrisma();
  });

  it('returns only unnotified alerts for the authenticated user', async () => {
    const alerts = [{ ...mockAlert, product: mockProduct }];
    mockPrisma.stockAlert.findMany.mockResolvedValueOnce(alerts);

    const caller = createStockAlertCaller({ userId: USER_ID, prisma: mockPrisma });
    const result = await caller.stockAlert.getMyAlerts();

    expect(result).toHaveLength(1);
    expect(result[0].product.name).toBe('Dragon Ball Capsule');
    expect(mockPrisma.stockAlert.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: USER_ID, notified: false },
        orderBy: { createdAt: 'desc' },
      })
    );
  });

  it('returns empty array when there are no pending alerts', async () => {
    mockPrisma.stockAlert.findMany.mockResolvedValueOnce([]);

    const caller = createStockAlertCaller({ userId: USER_ID, prisma: mockPrisma });
    const result = await caller.stockAlert.getMyAlerts();

    expect(result).toEqual([]);
  });

  it('throws UNAUTHORIZED for unauthenticated users', async () => {
    const caller = createStockAlertCaller({ userId: null, prisma: mockPrisma });
    await expect(caller.stockAlert.getMyAlerts()).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
  });
});

// ---------------------------------------------------------------------------
// updateProduct: back-in-stock alert trigger
//
// updateProduct uses the module-level `prisma` singleton, so we configure
// dbMock directly (the same object that @shonen-mart/db exports as `prisma`).
// ---------------------------------------------------------------------------
describe('updateProduct — back-in-stock alert trigger', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    dbMock.$transaction.mockImplementation(async (cb: any) => cb(dbMock));
  });

  it('sends back-in-stock alerts when stock goes from 0 to positive', async () => {
    const pendingAlerts = [
      { id: 'alert_a', userId: 'userA', productId: PRODUCT_ID, email: 'a@example.com', notified: false },
      { id: 'alert_b', userId: 'userB', productId: PRODUCT_ID, email: 'b@example.com', notified: false },
    ];

    dbMock.product.findUnique.mockResolvedValueOnce({ ...mockProduct, stock: 0 });
    dbMock.product.update.mockResolvedValueOnce({ ...mockProduct, stock: 20 });
    dbMock.stockAlert.findMany.mockResolvedValueOnce(pendingAlerts);
    dbMock.stockAlert.update
      .mockResolvedValueOnce({ ...pendingAlerts[0], notified: true })
      .mockResolvedValueOnce({ ...pendingAlerts[1], notified: true });

    const caller = createMainCaller({ userId: 'admin_1', role: 'ADMIN', prisma: dbMock as any });
    await caller.updateProduct({ id: PRODUCT_ID, data: { stock: 20 } });

    // Wait for the fire-and-forget Promise.allSettled to complete
    await new Promise((r) => setTimeout(r, 100));

    expect(dbMock.product.findUnique).toHaveBeenCalledWith({
      where: { id: PRODUCT_ID },
      select: { stock: true },
    });
    expect(emailService.sendBackInStockAlert).toHaveBeenCalledTimes(2);
    expect(emailService.sendBackInStockAlert).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Dragon Ball Capsule' }),
      'a@example.com'
    );
    expect(emailService.sendBackInStockAlert).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Dragon Ball Capsule' }),
      'b@example.com'
    );
  });

  it('does NOT send alerts when stock was already positive', async () => {
    dbMock.product.findUnique.mockResolvedValueOnce({ ...mockProduct, stock: 5 });
    dbMock.product.update.mockResolvedValueOnce({ ...mockProduct, stock: 15 });

    const caller = createMainCaller({ userId: 'admin_1', role: 'ADMIN', prisma: dbMock as any });
    await caller.updateProduct({ id: PRODUCT_ID, data: { stock: 15 } });

    await new Promise((r) => setTimeout(r, 50));

    expect(dbMock.stockAlert.findMany).not.toHaveBeenCalled();
    expect(emailService.sendBackInStockAlert).not.toHaveBeenCalled();
  });

  it('does NOT send alerts when there are no pending subscriptions', async () => {
    dbMock.product.findUnique.mockResolvedValueOnce({ ...mockProduct, stock: 0 });
    dbMock.product.update.mockResolvedValueOnce({ ...mockProduct, stock: 10 });
    dbMock.stockAlert.findMany.mockResolvedValueOnce([]);

    const caller = createMainCaller({ userId: 'admin_1', role: 'ADMIN', prisma: dbMock as any });
    await caller.updateProduct({ id: PRODUCT_ID, data: { stock: 10 } });

    await new Promise((r) => setTimeout(r, 50));

    expect(emailService.sendBackInStockAlert).not.toHaveBeenCalled();
  });

  it('marks each alerted subscriber as notified after sending email', async () => {
    const pendingAlert = {
      id: 'alert_x',
      userId: 'userX',
      productId: PRODUCT_ID,
      email: 'x@example.com',
      notified: false,
    };

    dbMock.product.findUnique.mockResolvedValueOnce({ ...mockProduct, stock: 0 });
    dbMock.product.update.mockResolvedValueOnce({ ...mockProduct, stock: 5 });
    dbMock.stockAlert.findMany.mockResolvedValueOnce([pendingAlert]);
    dbMock.stockAlert.update.mockResolvedValueOnce({ ...pendingAlert, notified: true });

    const caller = createMainCaller({ userId: 'admin_1', role: 'ADMIN', prisma: dbMock as any });
    await caller.updateProduct({ id: PRODUCT_ID, data: { stock: 5 } });

    await new Promise((r) => setTimeout(r, 100));

    expect(dbMock.stockAlert.update).toHaveBeenCalledWith({
      where: { id: 'alert_x' },
      data: { notified: true },
    });
  });

  it('throws FORBIDDEN for non-admin users', async () => {
    const caller = createMainCaller({ userId: 'user_1', role: 'USER', prisma: dbMock as any });
    await expect(
      caller.updateProduct({ id: PRODUCT_ID, data: { stock: 10 } })
    ).rejects.toMatchObject({ code: 'FORBIDDEN' });
  });
});
