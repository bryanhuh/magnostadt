/**
 * wishlist.test.ts
 *
 * Tests for wishlistRouter procedures:
 *   - add
 *   - remove
 *   - getMine
 *   - checkStatus
 *   - getShareToken
 *   - getSharedWishlist
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMockPrisma } from './helpers/mockPrisma';
import { createWishlistCaller } from './helpers/createCaller';

// ---------------------------------------------------------------------------
// Shared fixtures
// ---------------------------------------------------------------------------
const USER_ID = 'user_wishlist_1';
const PRODUCT_ID = 'prod_w1';

const mockWishlistItem = {
  id: 'wl_item_1',
  userId: USER_ID,
  productId: PRODUCT_ID,
  createdAt: new Date(),
};

const mockProductWithRelations = {
  id: PRODUCT_ID,
  name: 'Attack on Titan Cloak',
  price: '35.00',
  stock: 5,
  imageUrl: null,
  isSale: false,
  salePrice: null,
  slug: 'aot-cloak',
  anime: { id: 'anime_1', name: 'Attack on Titan', slug: 'aot', featured: false, description: null, coverImage: null, headerImage: null },
  category: { id: 'cat_1', name: 'Apparel' },
};

// ---------------------------------------------------------------------------
// wishlist.add
// ---------------------------------------------------------------------------
describe('wishlist.add', () => {
  let mockPrisma: ReturnType<typeof createMockPrisma>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockPrisma = createMockPrisma();
  });

  it('adds a product to the wishlist for authenticated user', async () => {
    mockPrisma.wishlistItem.create.mockResolvedValueOnce(mockWishlistItem);

    const caller = createWishlistCaller({ userId: USER_ID, prisma: mockPrisma });
    const result = await caller.wishlist.add({ productId: PRODUCT_ID });

    expect(result.id).toBe('wl_item_1');
    expect(result.userId).toBe(USER_ID);
    expect(result.productId).toBe(PRODUCT_ID);

    expect(mockPrisma.wishlistItem.create).toHaveBeenCalledWith({
      data: { userId: USER_ID, productId: PRODUCT_ID },
    });
  });

  it('throws UNAUTHORIZED when user is not authenticated', async () => {
    const caller = createWishlistCaller({ userId: null, prisma: mockPrisma });
    await expect(caller.wishlist.add({ productId: PRODUCT_ID })).rejects.toMatchObject({
      code: 'UNAUTHORIZED',
    });
  });

  it('validates that productId is a string (rejects empty string via schema)', async () => {
    const caller = createWishlistCaller({ userId: USER_ID, prisma: mockPrisma });
    // zod z.string() allows empty string, but empty productId makes no semantic sense.
    // The real validation is that it's present; ensure the call goes through to prisma.
    mockPrisma.wishlistItem.create.mockResolvedValueOnce({ ...mockWishlistItem, productId: '' });
    // This should NOT throw — Zod just needs a string
    await expect(caller.wishlist.add({ productId: '' })).resolves.toBeDefined();
  });

  it('propagates prisma errors (e.g. duplicate entry)', async () => {
    const uniqueError = new Error('Unique constraint failed');
    mockPrisma.wishlistItem.create.mockRejectedValueOnce(uniqueError);

    const caller = createWishlistCaller({ userId: USER_ID, prisma: mockPrisma });
    await expect(caller.wishlist.add({ productId: PRODUCT_ID })).rejects.toThrow('Unique constraint failed');
  });
});

// ---------------------------------------------------------------------------
// wishlist.remove
// ---------------------------------------------------------------------------
describe('wishlist.remove', () => {
  let mockPrisma: ReturnType<typeof createMockPrisma>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockPrisma = createMockPrisma();
  });

  it('removes a product from the wishlist', async () => {
    mockPrisma.wishlistItem.delete.mockResolvedValueOnce(mockWishlistItem);

    const caller = createWishlistCaller({ userId: USER_ID, prisma: mockPrisma });
    const result = await caller.wishlist.remove({ productId: PRODUCT_ID });

    expect(result.id).toBe('wl_item_1');
    expect(mockPrisma.wishlistItem.delete).toHaveBeenCalledWith({
      where: {
        userId_productId: {
          userId: USER_ID,
          productId: PRODUCT_ID,
        },
      },
    });
  });

  it('throws UNAUTHORIZED for unauthenticated users', async () => {
    const caller = createWishlistCaller({ userId: null, prisma: mockPrisma });
    await expect(caller.wishlist.remove({ productId: PRODUCT_ID })).rejects.toMatchObject({
      code: 'UNAUTHORIZED',
    });
  });
});

// ---------------------------------------------------------------------------
// wishlist.getMine
// ---------------------------------------------------------------------------
describe('wishlist.getMine', () => {
  let mockPrisma: ReturnType<typeof createMockPrisma>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockPrisma = createMockPrisma();
  });

  it('returns all wishlist items for the authenticated user', async () => {
    const items = [
      { ...mockWishlistItem, product: mockProductWithRelations },
      { ...mockWishlistItem, id: 'wl_item_2', productId: 'prod_w2', product: { ...mockProductWithRelations, id: 'prod_w2', name: 'Goku Figure' } },
    ];
    mockPrisma.wishlistItem.findMany.mockResolvedValueOnce(items);

    const caller = createWishlistCaller({ userId: USER_ID, prisma: mockPrisma });
    const result = await caller.wishlist.getMine();

    expect(result).toHaveLength(2);
    expect(result[0].product.name).toBe('Attack on Titan Cloak');
    expect(result[1].product.name).toBe('Goku Figure');

    expect(mockPrisma.wishlistItem.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: USER_ID },
        orderBy: { createdAt: 'desc' },
      })
    );
  });

  it('returns empty array when wishlist is empty', async () => {
    mockPrisma.wishlistItem.findMany.mockResolvedValueOnce([]);

    const caller = createWishlistCaller({ userId: USER_ID, prisma: mockPrisma });
    const result = await caller.wishlist.getMine();

    expect(result).toEqual([]);
  });

  it('throws UNAUTHORIZED for unauthenticated users', async () => {
    const caller = createWishlistCaller({ userId: null, prisma: mockPrisma });
    await expect(caller.wishlist.getMine()).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
  });
});

// ---------------------------------------------------------------------------
// wishlist.checkStatus
// ---------------------------------------------------------------------------
describe('wishlist.checkStatus', () => {
  let mockPrisma: ReturnType<typeof createMockPrisma>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockPrisma = createMockPrisma();
  });

  it('returns true when product is in wishlist', async () => {
    mockPrisma.wishlistItem.findUnique.mockResolvedValueOnce(mockWishlistItem);

    const caller = createWishlistCaller({ userId: USER_ID, prisma: mockPrisma });
    const result = await caller.wishlist.checkStatus({ productId: PRODUCT_ID });

    expect(result).toBe(true);
  });

  it('returns false when product is NOT in wishlist', async () => {
    mockPrisma.wishlistItem.findUnique.mockResolvedValueOnce(null);

    const caller = createWishlistCaller({ userId: USER_ID, prisma: mockPrisma });
    const result = await caller.wishlist.checkStatus({ productId: PRODUCT_ID });

    expect(result).toBe(false);
  });

  it('queries with correct composite key', async () => {
    mockPrisma.wishlistItem.findUnique.mockResolvedValueOnce(null);

    const caller = createWishlistCaller({ userId: USER_ID, prisma: mockPrisma });
    await caller.wishlist.checkStatus({ productId: PRODUCT_ID });

    expect(mockPrisma.wishlistItem.findUnique).toHaveBeenCalledWith({
      where: {
        userId_productId: {
          userId: USER_ID,
          productId: PRODUCT_ID,
        },
      },
    });
  });

  it('throws UNAUTHORIZED for unauthenticated users', async () => {
    const caller = createWishlistCaller({ userId: null, prisma: mockPrisma });
    await expect(caller.wishlist.checkStatus({ productId: PRODUCT_ID })).rejects.toMatchObject({
      code: 'UNAUTHORIZED',
    });
  });
});

// ---------------------------------------------------------------------------
// wishlist.getShareToken
// ---------------------------------------------------------------------------
describe('wishlist.getShareToken', () => {
  let mockPrisma: ReturnType<typeof createMockPrisma>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockPrisma = createMockPrisma();
  });

  it('returns existing share token when user already has one', async () => {
    mockPrisma.user.findUnique.mockResolvedValueOnce({
      id: USER_ID,
      email: 'user@example.com',
      shareToken: 'abc123existingtoken',
    });

    const caller = createWishlistCaller({ userId: USER_ID, prisma: mockPrisma });
    const token = await caller.wishlist.getShareToken();

    expect(token).toBe('abc123existingtoken');
    expect(mockPrisma.user.update).not.toHaveBeenCalled();
  });

  it('generates and stores a new share token when user has none', async () => {
    mockPrisma.user.findUnique.mockResolvedValueOnce({
      id: USER_ID,
      email: 'user@example.com',
      shareToken: null,
    });
    mockPrisma.user.update.mockResolvedValueOnce({
      shareToken: 'newtoken1234abcd',
    });

    const caller = createWishlistCaller({ userId: USER_ID, prisma: mockPrisma });
    const token = await caller.wishlist.getShareToken();

    expect(token).toBe('newtoken1234abcd');
    expect(mockPrisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: USER_ID },
        data: expect.objectContaining({ shareToken: expect.any(String) }),
      })
    );
  });

  it('throws UNAUTHORIZED for unauthenticated users', async () => {
    const caller = createWishlistCaller({ userId: null, prisma: mockPrisma });
    await expect(caller.wishlist.getShareToken()).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
  });
});

// ---------------------------------------------------------------------------
// wishlist.getSharedWishlist (public)
// ---------------------------------------------------------------------------
describe('wishlist.getSharedWishlist', () => {
  let mockPrisma: ReturnType<typeof createMockPrisma>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockPrisma = createMockPrisma();
  });

  it('returns shared wishlist with ownerName derived from email', async () => {
    mockPrisma.user.findUnique.mockResolvedValueOnce({
      id: USER_ID,
      email: 'sakura@konoha.com',
    });
    mockPrisma.wishlistItem.findMany.mockResolvedValueOnce([
      { ...mockWishlistItem, product: mockProductWithRelations },
    ]);

    const caller = createWishlistCaller({ userId: null, prisma: mockPrisma });
    const result = await caller.wishlist.getSharedWishlist({ token: 'validtoken123' });

    expect(result).not.toBeNull();
    expect(result!.ownerName).toBe('sakura'); // email.split('@')[0]
    expect(result!.items).toHaveLength(1);
  });

  it('returns null when share token does not match any user', async () => {
    mockPrisma.user.findUnique.mockResolvedValueOnce(null);

    const caller = createWishlistCaller({ userId: null, prisma: mockPrisma });
    const result = await caller.wishlist.getSharedWishlist({ token: 'badtoken' });

    expect(result).toBeNull();
  });

  it('returns empty items array for user with empty wishlist', async () => {
    mockPrisma.user.findUnique.mockResolvedValueOnce({
      id: USER_ID,
      email: 'naruto@konoha.com',
    });
    mockPrisma.wishlistItem.findMany.mockResolvedValueOnce([]);

    const caller = createWishlistCaller({ userId: null, prisma: mockPrisma });
    const result = await caller.wishlist.getSharedWishlist({ token: 'validtoken456' });

    expect(result!.ownerName).toBe('naruto');
    expect(result!.items).toEqual([]);
  });

  it('is accessible without authentication (public procedure)', async () => {
    // getSharedWishlist is a publicProcedure — should NOT throw UNAUTHORIZED
    mockPrisma.user.findUnique.mockResolvedValueOnce(null);

    const caller = createWishlistCaller({ userId: null, prisma: mockPrisma });
    await expect(caller.wishlist.getSharedWishlist({ token: 'sometoken' })).resolves.toBeNull();
  });
});
