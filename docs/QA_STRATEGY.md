# QA Strategy — Magnostadt (Shonen Mart)

**Version:** 1.0  
**Date:** 2026-02-20  
**Status:** Active  
**Owner:** QA Engineering  

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Application Architecture Overview](#2-application-architecture-overview)
3. [Risk Assessment](#3-risk-assessment)
4. [Testing Pyramid](#4-testing-pyramid)
5. [Critical Test Scenarios (Prioritized by Risk)](#5-critical-test-scenarios-prioritized-by-risk)
6. [Test Tooling Recommendations](#6-test-tooling-recommendations)
7. [Coverage Targets](#7-coverage-targets)
8. [CI/CD Integration Plan](#8-cicd-integration-plan)
9. [Security Testing Checklist](#9-security-testing-checklist)
10. [Defect Catalog (Known Bugs)](#10-defect-catalog-known-bugs)
11. [Test Environment Strategy](#11-test-environment-strategy)
12. [Implementation Roadmap](#12-implementation-roadmap)

---

## 1. Executive Summary

Magnostadt is a monorepo e-commerce platform selling anime merchandise (figures, manga, collectibles). The application currently has **zero test coverage** across all packages. This document defines the full QA strategy to bring the application to production-grade quality, sequenced by business risk.

**Current State:**
- 0% test coverage
- 4 confirmed defects, 3 of which are security/financial severity
- No CI/CD quality gates
- No test infrastructure configured

**Target State (90 days):**
- Unit test coverage: >= 90% on business logic (`packages/trpc`, `packages/db`)
- Integration test coverage: >= 80% on all tRPC procedures
- E2E coverage: 100% of critical user flows (purchase, auth, admin)
- Zero P0/P1 defects in production
- All security vulnerabilities remediated
- Test suite runs on every pull request in under 10 minutes

---

## 2. Application Architecture Overview

```
shonen-mart/
├── apps/
│   ├── web/          React 18 + Vite + TailwindCSS + Zustand
│   │                 Clerk auth (client-side), tRPC client, React Router v7
│   └── api/          Hono (Bun runtime), tRPC adapter, sitemap endpoint
│
├── packages/
│   ├── trpc/         Business logic — all tRPC routers + procedures
│   │                 Stripe integration, Resend email, Clerk token verification
│   └── db/           Prisma ORM, PostgreSQL schema, migrations
```

**Key Data Flows to Test:**

| Flow | Packages Involved | Risk |
|------|------------------|------|
| Product browsing | web → trpc → db | Low |
| Cart management | web (Zustand, localStorage) | Medium |
| Checkout + Stripe | web → trpc → db + Stripe API | Critical |
| Order confirmation | trpc → Resend email | High |
| Auth + role gating | web → api → Clerk + db | Critical |
| Admin operations | web → trpc (adminProcedure) → db | High |
| Wishlist sharing | trpc → db (shareToken) | Medium |
| Back-in-stock alerts | trpc → db → Resend | Medium |
| Sitemap generation | api → db | Medium (security) |

---

## 3. Risk Assessment

### Risk Matrix

| Defect Area | Likelihood | Business Impact | Risk Score | Priority |
|---|---|---|---|---|
| Sale price not applied to order total | High (confirmed) | Financial — customers overcharged | CRITICAL | P0 |
| `getOrderById` public (unauthenticated) | High (confirmed) | Data privacy, PII exposure | CRITICAL | P0 |
| Wildcard CORS (`app.use('*', cors())`) | High (confirmed) | Security — CSRF, data theft | HIGH | P1 |
| XML injection in sitemap via product slug | High (confirmed) | SEO poisoning, data corruption | HIGH | P1 |
| Stock not enforced server-side at order time | Medium | Overselling, negative inventory | HIGH | P1 |
| `createOrder` is `publicProcedure` | Medium | Guest checkout — intended, but unlinked orders | Medium | P2 |
| Email sent before payment confirmation | High | Fraud — confirmation sent for unpaid orders | HIGH | P1 |
| Cart price not re-validated on checkout | High | Price manipulation via stale cart | HIGH | P1 |
| `auth.sync` account linking by email only | Medium | Account takeover risk | HIGH | P1 |
| `deleteAnimeSeries` cascades to products | Low | Accidental data loss | Medium | P2 |
| `formatPrice` uses PHP locale (en-PH) | Low (confirmed) | Currency display incorrect (USD store) | Low | P3 |
| Hardcoded API URL in `App.tsx` | Medium | Breaks in staging/production | Medium | P2 |
| `Promise.all` without await in stock alerts | Low | Silent email failures | Low | P3 |

### P0/P1 Defects Requiring Immediate Remediation

These defects must be fixed before any test automation is considered "passing."

---

## 4. Testing Pyramid

```
                    ┌─────────────────────────────┐
                    │         E2E Tests            │  ~15% of tests
                    │    Playwright (browser)      │  ~25 critical flows
                    │    Full user journeys        │
                   ┌┴─────────────────────────────┴┐
                   │      Integration Tests         │  ~35% of tests
                   │   Vitest + tRPC test client    │  ~80 procedure tests
                   │   Real DB (test schema)        │
                  ┌┴───────────────────────────────┴┐
                  │          Unit Tests              │  ~50% of tests
                  │   Vitest (fast, isolated)        │  ~150+ test cases
                  │   Mocked dependencies            │
                  └─────────────────────────────────┘
```

### Layer Definitions

**Unit Tests (50% — ~150 tests)**
- Target: Pure functions, business logic helpers, Zustand store actions, price calculation utilities, Zod schema validation, sitemap XML generation logic
- No network calls, no database, no browser
- Tools: Vitest
- Speed target: Full suite under 30 seconds

**Integration Tests (35% — ~80 tests)**
- Target: Every tRPC procedure end-to-end against a real test PostgreSQL database
- Uses tRPC's `createCaller` for direct procedure invocation (no HTTP layer)
- Covers: auth middleware, adminProcedure gating, transaction behavior, email mocking
- Tools: Vitest + `@prisma/client` with test database
- Speed target: Full suite under 3 minutes

**E2E Tests (15% — ~25 flows)**
- Target: Critical user journeys in a real browser against running services
- Covers: purchase funnel, auth flow, admin CRUD, wishlist share, back-in-stock
- Tools: Playwright
- Speed target: Full suite under 10 minutes

---

## 5. Critical Test Scenarios (Prioritized by Risk)

### 5.1 P0 — Financial Correctness: Sale Price in Order Calculation

**Bug location:** `packages/trpc/src/router.ts`, `createOrder` mutation, line 464

```typescript
// CURRENT (BROKEN) — always uses full price
const itemTotal = Number(product.price) * item.quantity;

// ALSO BROKEN — Stripe line item also ignores salePrice
amount: Number(product.price) * 100,
```

**Test file:** `packages/trpc/src/__tests__/createOrder.test.ts`

```typescript
describe('createOrder — sale price calculation', () => {
  it('uses salePrice instead of price when isSale=true and salePrice is set', async () => {
    // Seed: product with price=50, salePrice=30, isSale=true, stock=10
    const { orderId } = await caller.createOrder({
      customerName: 'Test User',
      email: 'test@example.com',
      address: '123 Test St',
      city: 'Konoha',
      zipCode: '12345',
      items: [{ productId: saleProduct.id, quantity: 2 }],
    });

    const order = await prisma.order.findUnique({ where: { id: orderId } });

    // 2 × $30 = $60, plus $10 shipping = $70
    expect(Number(order!.total)).toBe(70);
    // Stripe line item must also use salePrice
    expect(stripeCreateSessionMock).toHaveBeenCalledWith(
      expect.objectContaining({
        line_items: expect.arrayContaining([
          expect.objectContaining({ price_data: expect.objectContaining({ unit_amount: 3000 }) })
        ])
      })
    );
  });

  it('uses full price when isSale=false even if salePrice exists', async () => {
    // product with price=50, salePrice=30, isSale=false
    const { orderId } = await caller.createOrder({ /* ... */ });
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    expect(Number(order!.total)).toBe(110); // 2×50 + 10 shipping
  });

  it('uses full price when isSale=true but salePrice is null', async () => {
    // product with price=50, salePrice=null, isSale=true
    const { orderId } = await caller.createOrder({ /* ... */ });
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    expect(Number(order!.total)).toBe(110);
  });

  it('cart store getSubtotal uses salePrice when applicable', () => {
    // Unit test of useCartStore
    const { result } = renderHook(() => useCartStore());
    act(() => {
      result.current.addItem({
        id: 'prod-1', name: 'Figure', price: 30, // salePrice passed as price
        imageUrl: null, anime: { name: 'Naruto' }, stock: 5
      });
    });
    expect(result.current.getSubtotal()).toBe(30);
  });
});
```

---

### 5.2 P0 — Authorization: `getOrderById` Must Require Auth

**Bug location:** `packages/trpc/src/router.ts`, line 547 — `publicProcedure` should be `protectedProcedure`

**Test file:** `packages/trpc/src/__tests__/getOrderById.test.ts`

```typescript
describe('getOrderById — authorization', () => {
  it('returns order data for the order owner', async () => {
    const authedCaller = createAuthenticatedCaller({ userId: order.userId! });
    const result = await authedCaller.getOrderById({ id: order.id });
    expect(result.id).toBe(order.id);
  });

  it('throws UNAUTHORIZED when called without a session', async () => {
    const publicCaller = createUnauthenticatedCaller();
    await expect(
      publicCaller.getOrderById({ id: order.id })
    ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
  });

  it('throws FORBIDDEN when a different authenticated user requests another users order', async () => {
    const otherUserCaller = createAuthenticatedCaller({ userId: 'other-user-id' });
    await expect(
      otherUserCaller.getOrderById({ id: order.id })
    ).rejects.toMatchObject({ code: 'FORBIDDEN' });
  });

  it('exposes PII (email, address) — must be auth-gated', async () => {
    // Verify the response shape contains sensitive fields that must not leak
    const authedCaller = createAuthenticatedCaller({ userId: order.userId! });
    const result = await authedCaller.getOrderById({ id: order.id });
    expect(result).toHaveProperty('email');
    expect(result).toHaveProperty('address');
    // This assertion documents why the auth gate is required
  });
});
```

---

### 5.3 P1 — Security: CORS Configuration

**Bug location:** `apps/api/src/index.ts`, line 10 — `app.use('*', cors())` allows all origins

**Test file:** `apps/api/src/__tests__/cors.test.ts`

```typescript
describe('CORS configuration', () => {
  it('allows requests from the configured frontend origin', async () => {
    const response = await app.request('/', {
      method: 'OPTIONS',
      headers: {
        Origin: 'https://magnostadt.store',
        'Access-Control-Request-Method': 'POST',
      },
    });
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe('https://magnostadt.store');
  });

  it('does not reflect arbitrary origins', async () => {
    const response = await app.request('/', {
      method: 'OPTIONS',
      headers: {
        Origin: 'https://evil.com',
        'Access-Control-Request-Method': 'POST',
      },
    });
    expect(response.headers.get('Access-Control-Allow-Origin')).not.toBe('https://evil.com');
    expect(response.headers.get('Access-Control-Allow-Origin')).not.toBe('*');
  });

  it('blocks credential requests from untrusted origins', async () => {
    const response = await app.request('/trpc/createOrder', {
      method: 'POST',
      headers: {
        Origin: 'https://evil.com',
        'Content-Type': 'application/json',
      },
    });
    // Should either 403 or not set Allow-Origin for evil.com
    const allowOrigin = response.headers.get('Access-Control-Allow-Origin');
    expect(allowOrigin).not.toBe('*');
  });
});
```

---

### 5.4 P1 — Security: XML Injection in Sitemap

**Bug location:** `apps/api/src/index.ts`, lines 46-51 — product slugs are interpolated directly into XML

**Test file:** `apps/api/src/__tests__/sitemap.test.ts`

```typescript
describe('sitemap.xml — XML injection', () => {
  it('sanitizes product slugs before interpolating into XML', async () => {
    // Seed a product with a malicious slug
    await prisma.product.create({
      data: {
        slug: 'valid-slug</loc><loc>https://evil.com',
        // ... other required fields
      }
    });

    const response = await app.request('/sitemap.xml');
    const xml = await response.text();

    // The malicious injection should be escaped or the slug should be rejected
    expect(xml).not.toContain('https://evil.com');
    expect(xml).not.toContain('</loc><loc>');
  });

  it('escapes special XML characters in all URL fields', async () => {
    // Slugs with &, <, >, ", ' characters
    const maliciousSlug = 'product-&-slug';
    // After sanitization: product-&amp;-slug
    const response = await app.request('/sitemap.xml');
    const xml = await response.text();
    expect(xml).toContain('&amp;');
    expect(xml).not.toContain('&&');
  });

  it('returns valid parseable XML', async () => {
    const response = await app.request('/sitemap.xml');
    expect(response.headers.get('content-type')).toContain('application/xml');
    const xml = await response.text();
    // Must parse without errors
    expect(() => new DOMParser().parseFromString(xml, 'application/xml')).not.toThrow();
  });

  it('does not expose internal server errors in XML output', async () => {
    // Even if db fails, response must be valid XML or a proper HTTP error
    const response = await app.request('/sitemap.xml');
    expect(response.status).toBeLessThan(500);
  });
});
```

---

### 5.5 P1 — Cart Price Manipulation: Server-Side Re-validation

**Bug location:** `packages/trpc/src/router.ts`, `createOrder` — prices are taken from the database (correct), but the client displays `item.price` from the Zustand cart which could be stale.

**Test file:** `packages/trpc/src/__tests__/createOrder.test.ts`

```typescript
describe('createOrder — server-side price validation', () => {
  it('uses database price, not any client-supplied price', async () => {
    // The createOrder input does NOT accept price — only productId + quantity
    // This verifies the schema enforces this
    const input = {
      customerName: 'Test',
      email: 'test@example.com',
      address: '1 St',
      city: 'City',
      zipCode: '00000',
      items: [{ productId: 'prod-1', quantity: 1 }],
      // Attempting to inject a price field
    };

    // Zod schema should strip/reject any extra 'price' field
    const parsed = createOrderInputSchema.safeParse({ ...input, items: [{ productId: 'prod-1', quantity: 1, price: 0.01 }] });
    // price should not be accepted
    expect(parsed.data?.items[0]).not.toHaveProperty('price');
  });

  it('total matches product.price × quantity + shipping for all items', async () => {
    const { orderId } = await caller.createOrder({
      customerName: 'Test',
      email: 'test@example.com',
      address: '1 St',
      city: 'City',
      zipCode: '00000',
      items: [
        { productId: productA.id, quantity: 2 }, // $25 each
        { productId: productB.id, quantity: 1 }, // $40 each
      ],
    });
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    // 2×25 + 1×40 + 10 shipping = 100
    expect(Number(order!.total)).toBe(100);
  });
});
```

---

### 5.6 P1 — Inventory: Stock Enforcement Under Concurrency

**Test file:** `packages/trpc/src/__tests__/inventory.test.ts`

```typescript
describe('createOrder — stock enforcement', () => {
  it('decrements stock atomically on successful order', async () => {
    const initialStock = 5;
    // product with stock=5
    await caller.createOrder({ items: [{ productId: product.id, quantity: 3 }], /* ... */ });
    const updated = await prisma.product.findUnique({ where: { id: product.id } });
    expect(updated!.stock).toBe(2);
  });

  it('throws BAD_REQUEST when requested quantity exceeds available stock', async () => {
    // product with stock=2
    await expect(
      caller.createOrder({ items: [{ productId: product.id, quantity: 5 }], /* ... */ })
    ).rejects.toMatchObject({
      code: 'BAD_REQUEST',
      message: expect.stringContaining('only has 2 left in stock'),
    });
  });

  it('throws BAD_REQUEST when stock is 0 (out of stock)', async () => {
    // product with stock=0
    await expect(
      caller.createOrder({ items: [{ productId: outOfStockProduct.id, quantity: 1 }], /* ... */ })
    ).rejects.toMatchObject({ code: 'BAD_REQUEST' });
  });

  it('rolls back stock decrement when order creation fails mid-transaction', async () => {
    // Simulate a DB failure after the first product is decremented
    // Stock should be fully restored
    const initialStock = product.stock;
    // Inject error scenario via mock
    jest.spyOn(prisma, '$transaction').mockImplementationOnce(async (fn) => {
      // Let the first item decrement succeed, then throw
      throw new Error('Simulated DB failure');
    });
    await expect(caller.createOrder({ /* ... */ })).rejects.toThrow();
    const product = await prisma.product.findUnique({ where: { id: product.id } });
    expect(product!.stock).toBe(initialStock); // Stock must be unchanged
  });

  it('restores stock when order is CANCELLED', async () => {
    const order = await createTestOrder(3); // created with quantity=3
    await adminCaller.updateOrderStatus({ id: order.id, status: 'CANCELLED' });
    const product = await prisma.product.findUnique({ where: { id: productId } });
    expect(product!.stock).toBe(initialStock); // fully restored
  });

  it('does NOT restore stock when order is SHIPPED or DELIVERED', async () => {
    const order = await createTestOrder(3);
    await adminCaller.updateOrderStatus({ id: order.id, status: 'SHIPPED' });
    const product = await prisma.product.findUnique({ where: { id: productId } });
    expect(product!.stock).toBe(initialStock - 3); // still decremented
  });
});
```

---

### 5.7 P1 — Admin Authorization: All Admin Procedures Must Enforce `ADMIN` Role

**Test file:** `packages/trpc/src/__tests__/auth.test.ts`

```typescript
describe('adminProcedure — role enforcement', () => {
  const adminProcedures = [
    { name: 'createProduct', input: { /* valid product input */ } },
    { name: 'updateProduct', input: { id: 'any', data: {} } },
    { name: 'deleteProduct', input: { id: 'any' } },
    { name: 'getOrders', input: undefined },
    { name: 'updateOrderStatus', input: { id: 'any', status: 'SHIPPED' } },
    { name: 'getLowStockProducts', input: undefined },
    { name: 'getInventoryStats', input: undefined },
    { name: 'createAnimeSeries', input: { name: 'Test' } },
    { name: 'updateAnimeSeries', input: { id: 'any', data: {} } },
    { name: 'deleteAnimeSeries', input: { id: 'any' } },
    { name: 'auth.getUsers', input: undefined },
  ];

  describe('unauthenticated caller', () => {
    adminProcedures.forEach(({ name, input }) => {
      it(`${name} — throws UNAUTHORIZED`, async () => {
        const caller = createUnauthenticatedCaller();
        await expect((caller as any)[name](input)).rejects.toMatchObject({
          code: 'UNAUTHORIZED',
        });
      });
    });
  });

  describe('authenticated but non-admin user', () => {
    adminProcedures.forEach(({ name, input }) => {
      it(`${name} — throws FORBIDDEN`, async () => {
        const caller = createAuthenticatedCaller({ userId: 'user-id', role: 'USER' });
        await expect((caller as any)[name](input)).rejects.toMatchObject({
          code: 'FORBIDDEN',
        });
      });
    });
  });

  it('admin user can access all admin procedures', async () => {
    const adminCaller = createAuthenticatedCaller({ userId: 'admin-id', role: 'ADMIN' });
    const stats = await adminCaller.getInventoryStats();
    expect(stats).toHaveProperty('totalProducts');
  });
});
```

---

### 5.8 P2 — Cart Store: Zustand State Management

**Test file:** `apps/web/src/store/__tests__/useCartStore.test.ts`

```typescript
describe('useCartStore', () => {
  beforeEach(() => {
    useCartStore.getState().clearCart();
  });

  describe('addItem', () => {
    it('adds a new item with quantity 1', () => {
      const { addItem, items } = useCartStore.getState();
      addItem(mockProduct);
      expect(useCartStore.getState().items).toHaveLength(1);
      expect(useCartStore.getState().items[0].quantity).toBe(1);
    });

    it('increments quantity for duplicate items', () => {
      const { addItem } = useCartStore.getState();
      addItem(mockProduct);
      addItem(mockProduct);
      expect(useCartStore.getState().items).toHaveLength(1);
      expect(useCartStore.getState().items[0].quantity).toBe(2);
    });

    it('does not exceed available stock when adding duplicates', () => {
      const { addItem } = useCartStore.getState();
      const lowStockProduct = { ...mockProduct, stock: 2 };
      addItem(lowStockProduct);
      addItem(lowStockProduct);
      addItem(lowStockProduct); // should be capped at 2
      expect(useCartStore.getState().items[0].quantity).toBe(2);
    });

    it('does not add out-of-stock items', () => {
      const { addItem } = useCartStore.getState();
      addItem({ ...mockProduct, stock: 0 });
      expect(useCartStore.getState().items).toHaveLength(0);
    });

    it('stores salePrice as price when product is on sale', () => {
      // This tests the fix to the known sale price bug
      const { addItem } = useCartStore.getState();
      addItem({ ...mockProduct, price: 30 }); // price field should already be salePrice from caller
      expect(useCartStore.getState().items[0].price).toBe(30);
    });
  });

  describe('updateQuantity', () => {
    it('updates quantity within stock bounds', () => {
      useCartStore.getState().addItem(mockProduct);
      useCartStore.getState().updateQuantity(mockProduct.id, 3);
      expect(useCartStore.getState().items[0].quantity).toBe(3);
    });

    it('removes item when quantity updated to 0', () => {
      useCartStore.getState().addItem(mockProduct);
      useCartStore.getState().updateQuantity(mockProduct.id, 0);
      expect(useCartStore.getState().items).toHaveLength(0);
    });

    it('caps quantity at stock limit', () => {
      useCartStore.getState().addItem({ ...mockProduct, stock: 3 });
      useCartStore.getState().updateQuantity(mockProduct.id, 100);
      expect(useCartStore.getState().items[0].quantity).toBe(3);
    });
  });

  describe('getSubtotal', () => {
    it('calculates correct subtotal for single item', () => {
      useCartStore.getState().addItem({ ...mockProduct, price: 25 });
      useCartStore.getState().updateQuantity(mockProduct.id, 3);
      expect(useCartStore.getState().getSubtotal()).toBe(75);
    });

    it('calculates correct subtotal for multiple items', () => {
      useCartStore.getState().addItem({ ...mockProduct, id: 'a', price: 20 });
      useCartStore.getState().addItem({ ...mockProduct, id: 'b', price: 30 });
      expect(useCartStore.getState().getSubtotal()).toBe(50);
    });

    it('returns 0 for empty cart', () => {
      expect(useCartStore.getState().getSubtotal()).toBe(0);
    });
  });

  describe('persistence', () => {
    it('persists cart to localStorage under correct key', () => {
      useCartStore.getState().addItem(mockProduct);
      const stored = localStorage.getItem('akashic-district-cart');
      expect(stored).not.toBeNull();
      const parsed = JSON.parse(stored!);
      expect(parsed.state.items).toHaveLength(1);
    });
  });
});
```

---

### 5.9 P2 — formatPrice Utility

**Bug location:** `apps/web/src/utils/format.ts` — uses `en-PH` locale despite store selling in USD

**Test file:** `apps/web/src/utils/__tests__/format.test.ts`

```typescript
describe('formatPrice', () => {
  it('formats a number as USD currency', () => {
    expect(formatPrice(29.99)).toBe('$29.99'); // after locale fix
  });

  it('formats string input', () => {
    expect(formatPrice('49.99')).toBe('$49.99');
  });

  it('formats zero', () => {
    expect(formatPrice(0)).toBe('$0.00');
  });

  it('returns empty string for null', () => {
    expect(formatPrice(null)).toBe('');
  });

  it('returns empty string for undefined', () => {
    expect(formatPrice(undefined)).toBe('');
  });

  it('returns empty string for NaN string', () => {
    expect(formatPrice('not-a-number')).toBe('');
  });

  it('handles Decimal-like string from Prisma', () => {
    // Prisma returns Decimal as string in some contexts
    expect(formatPrice('1234.50')).toBe('$1,234.50');
  });
});
```

---

### 5.10 P2 — Wishlist: Share Token Security

**Test file:** `packages/trpc/src/__tests__/wishlist.test.ts`

```typescript
describe('wishlist.getShareToken', () => {
  it('generates a token for users without one', async () => {
    const token = await authedCaller.wishlist.getShareToken();
    expect(token).toBeTruthy();
    expect(typeof token).toBe('string');
    expect(token.length).toBe(16); // as defined in implementation
  });

  it('returns same token on subsequent calls (stable)', async () => {
    const token1 = await authedCaller.wishlist.getShareToken();
    const token2 = await authedCaller.wishlist.getShareToken();
    expect(token1).toBe(token2);
  });

  it('token is only accessible by the authenticated user', async () => {
    // The getShareToken endpoint is protectedProcedure — unauthenticated access throws
    await expect(unauthCaller.wishlist.getShareToken()).rejects.toMatchObject({
      code: 'UNAUTHORIZED',
    });
  });
});

describe('wishlist.getSharedWishlist', () => {
  it('returns wishlist items for a valid share token', async () => {
    const token = await authedCaller.wishlist.getShareToken();
    const shared = await publicCaller.wishlist.getSharedWishlist({ token });
    expect(shared).not.toBeNull();
    expect(shared!.items).toBeDefined();
  });

  it('returns null for an invalid or expired token', async () => {
    const shared = await publicCaller.wishlist.getSharedWishlist({ token: 'invalid-token' });
    expect(shared).toBeNull();
  });

  it('does not expose full user email — only username prefix', async () => {
    const token = await authedCaller.wishlist.getShareToken();
    const shared = await publicCaller.wishlist.getSharedWishlist({ token });
    // ownerName should be 'username' part of 'username@example.com'
    expect(shared!.ownerName).not.toContain('@');
    expect(shared!.ownerName).not.toContain('.com');
  });
});
```

---

### 5.11 P2 — Back-in-Stock Alert Flow

**Test file:** `packages/trpc/src/__tests__/stockAlert.test.ts`

```typescript
describe('updateProduct — back-in-stock alert trigger', () => {
  it('sends emails to all subscribers when stock goes from 0 to positive', async () => {
    const sendEmailMock = vi.fn();
    vi.mock('../services/email', () => ({
      sendBackInStockAlert: sendEmailMock,
    }));

    // Create product with stock=0
    // Create 2 stock alerts for that product
    // Update product stock to 5
    await adminCaller.updateProduct({
      id: outOfStockProduct.id,
      data: { stock: 5 },
    });

    // Allow Promise.all to resolve (await next tick)
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(sendEmailMock).toHaveBeenCalledTimes(2);
  });

  it('does NOT send emails when stock remains 0', async () => {
    const sendEmailMock = vi.fn();
    vi.mock('../services/email', () => ({ sendBackInStockAlert: sendEmailMock }));

    await adminCaller.updateProduct({ id: product.id, data: { stock: 0 } });
    expect(sendEmailMock).not.toHaveBeenCalled();
  });

  it('does NOT send emails when stock was already positive', async () => {
    const sendEmailMock = vi.fn();
    vi.mock('../services/email', () => ({ sendBackInStockAlert: sendEmailMock }));

    // product.stock = 5, update to 10
    await adminCaller.updateProduct({ id: product.id, data: { stock: 10 } });
    expect(sendEmailMock).not.toHaveBeenCalled();
  });

  it('marks alerts as notified=true after sending', async () => {
    await adminCaller.updateProduct({ id: outOfStockProduct.id, data: { stock: 5 } });
    await new Promise(resolve => setTimeout(resolve, 50));
    const alerts = await prisma.stockAlert.findMany({ where: { productId: outOfStockProduct.id } });
    expect(alerts.every(a => a.notified)).toBe(true);
  });
});
```

---

### 5.12 P2 — Auth Sync: Account Linking

**Test file:** `packages/trpc/src/__tests__/auth.test.ts`

```typescript
describe('auth.sync', () => {
  it('creates a new user when no existing user found', async () => {
    const caller = createAuthenticatedCaller({ userId: 'new-clerk-id' });
    const user = await caller.auth.sync({ email: 'new@example.com' });
    expect(user.id).toBe('new-clerk-id');
    expect(user.email).toBe('new@example.com');
  });

  it('returns existing user if Clerk ID already in DB', async () => {
    // Pre-create user with Clerk ID
    const existing = await prisma.user.create({ data: { id: 'existing-clerk-id', email: 'existing@example.com' } });
    const caller = createAuthenticatedCaller({ userId: 'existing-clerk-id' });
    const user = await caller.auth.sync({ email: 'existing@example.com' });
    expect(user.id).toBe(existing.id);
  });

  it('links existing email-based account to new Clerk ID', async () => {
    // User exists by email but with different ID (pre-Clerk account)
    await prisma.user.create({ data: { id: 'old-db-id', email: 'legacy@example.com' } });
    const caller = createAuthenticatedCaller({ userId: 'new-clerk-id' });
    const user = await caller.auth.sync({ email: 'legacy@example.com' });
    expect(user.id).toBe('new-clerk-id'); // ID updated to Clerk ID
    expect(user.email).toBe('legacy@example.com');
  });

  it('creates placeholder email when no email provided', async () => {
    const caller = createAuthenticatedCaller({ userId: 'no-email-id' });
    const user = await caller.auth.sync({});
    expect(user.email).toContain('no-email-id@placeholder.com');
  });
});
```

---

### 5.13 P3 — E2E: Complete Purchase Flow

**Test file:** `apps/web/e2e/checkout.spec.ts`

```typescript
import { test, expect } from '@playwright/test';
import { mockStripeCheckout, seedTestProducts } from './helpers';

test.describe('purchase flow', () => {
  test.beforeAll(async () => {
    await seedTestProducts();
  });

  test('unauthenticated user can complete checkout with sale price', async ({ page }) => {
    await page.goto('/');

    // Navigate to a sale product
    await page.click('[data-testid="flash-sale-link"]');
    const saleProductCard = page.locator('[data-testid="product-card"]').filter({
      has: page.locator('[data-testid="sale-badge"]')
    }).first();

    // Verify sale price is shown (not original price)
    const salePrice = await saleProductCard.locator('[data-testid="sale-price"]').textContent();
    const originalPrice = await saleProductCard.locator('[data-testid="original-price"]').textContent();
    expect(salePrice).not.toBe(originalPrice);

    // Add to cart
    await saleProductCard.locator('[data-testid="add-to-cart"]').click();
    await expect(page.locator('[data-testid="cart-count"]')).toHaveText('1');

    // Open cart and verify sale price
    await page.click('[data-testid="cart-icon"]');
    const cartSubtotal = await page.locator('[data-testid="cart-subtotal"]').textContent();
    expect(cartSubtotal).toContain(salePrice!.replace('$', ''));

    // Proceed to checkout
    await page.click('[data-testid="checkout-button"]');
    await page.waitForURL('**/checkout');

    // Fill shipping form
    await page.fill('[name="customerName"]', 'Naruto Uzumaki');
    await page.fill('[name="email"]', 'naruto@konoha.com');
    await page.fill('[name="address"]', '1 Hokage Mountain Rd');
    await page.fill('[name="city"]', 'Konoha');
    await page.fill('[name="zipCode"]', '10101');

    // Verify order summary shows sale price (not original)
    const orderSummaryItemPrice = page.locator('[data-testid="order-item-price"]').first();
    await expect(orderSummaryItemPrice).toContainText(salePrice!.replace('$', ''));

    // Submit (Stripe is mocked in test environment)
    await mockStripeCheckout(page);
    await page.click('[type="submit"]');

    // Verify redirect to order confirmation (via mocked Stripe success)
    await page.waitForURL('**/order/**?success=true');
    await expect(page.locator('[data-testid="order-confirmed-heading"]')).toBeVisible();
  });

  test('cart persists across page refresh', async ({ page }) => {
    await page.goto('/');
    await addProductToCart(page);
    await page.reload();
    await expect(page.locator('[data-testid="cart-count"]')).toHaveText('1');
  });

  test('empty cart redirects away from checkout', async ({ page }) => {
    await page.goto('/checkout');
    await expect(page.locator('text=Your cart is empty')).toBeVisible();
  });

  test('checkout form validation prevents submission with missing fields', async ({ page }) => {
    await addProductToCart(page);
    await page.goto('/checkout');
    await page.click('[type="submit"]');
    // HTML5 validation or error messages should appear
    await expect(page.locator('[name="customerName"]:invalid')).toBeVisible();
  });

  test('out-of-stock products cannot be added to cart', async ({ page }) => {
    await page.goto('/');
    const outOfStockCard = page.locator('[data-testid="out-of-stock-badge"]').first();
    // Add to cart button should be absent or disabled
    await expect(outOfStockCard.locator('[data-testid="add-to-cart"]')).not.toBeVisible();
  });
});
```

---

### 5.14 P3 — E2E: Admin Dashboard Access Control

**Test file:** `apps/web/e2e/admin.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('admin route protection', () => {
  test('unauthenticated user is redirected from /admin', async ({ page }) => {
    await page.goto('/admin');
    await page.waitForURL('**/', { timeout: 5000 });
    expect(page.url()).not.toContain('/admin');
  });

  test('non-admin authenticated user is redirected from /admin', async ({ page, context }) => {
    await loginAsRegularUser(context);
    await page.goto('/admin');
    await page.waitForURL('**/', { timeout: 5000 });
    expect(page.url()).not.toContain('/admin');
  });

  test('admin user can access /admin and all sub-pages', async ({ page, context }) => {
    await loginAsAdminUser(context);
    await page.goto('/admin');
    await expect(page.locator('h1', { hasText: 'Dashboard' })).toBeVisible();

    for (const route of ['/admin/products', '/admin/orders', '/admin/customers', '/admin/series']) {
      await page.goto(route);
      await expect(page).not.toHaveURL('/');
    }
  });

  test('admin can update order status and triggers email', async ({ page, context }) => {
    await loginAsAdminUser(context);
    const emailSendMock = await setupEmailCapture(context);

    await page.goto('/admin/orders');
    // Find PENDING order, change to SHIPPED
    await page.selectOption('[data-testid="order-status-select"]', 'SHIPPED');
    await page.click('[data-testid="update-status-button"]');

    // Wait for confirmation toast
    await expect(page.locator('[data-testid="toast-success"]')).toBeVisible();
    // Email mock should have been called
    expect(emailSendMock.calls).toHaveLength(1);
  });
});
```

---

### 5.15 P3 — E2E: Auth Flow

**Test file:** `apps/web/e2e/auth.spec.ts`

```typescript
test.describe('authentication', () => {
  test('wishlist requires sign-in', async ({ page }) => {
    await page.goto('/');
    const productCard = page.locator('[data-testid="product-card"]').first();
    await productCard.hover();
    await productCard.locator('[data-testid="wishlist-button"]').click();
    await expect(page.locator('text=Please sign in')).toBeVisible();
  });

  test('signed-in user can add and remove from wishlist', async ({ page, context }) => {
    await loginAsRegularUser(context);
    await page.goto('/');
    const productCard = page.locator('[data-testid="product-card"]').first();
    await productCard.hover();
    await productCard.locator('[data-testid="wishlist-button"]').click();
    await expect(page.locator('[data-testid="toast-success"]')).toContainText('Added to wishlist');
    
    // Toggle off
    await productCard.locator('[data-testid="wishlist-button"]').click();
    await expect(page.locator('[data-testid="toast-success"]')).toContainText('Removed from wishlist');
  });

  test('shared wishlist URL is publicly accessible', async ({ page }) => {
    const shareToken = await getShareToken(testUserId);
    await page.goto(`/wishlist/${shareToken}`);
    await expect(page.locator('[data-testid="shared-wishlist-heading"]')).toBeVisible();
  });
});
```

---

## 6. Test Tooling Recommendations

### 6.1 Primary Tools

#### Vitest — Unit and Integration Tests

Vitest is the recommended choice because:
- Native ESM support (required — monorepo uses `"type": "module"` throughout)
- First-class Bun compatibility (the runtime used in `apps/api`)
- Compatible with Vite's module resolution used in `apps/web`
- Fast parallel execution with built-in coverage via v8 or istanbul
- Identical API to Jest — minimal learning curve

**Installation (workspace root):**
```bash
bun add -d vitest @vitest/coverage-v8 @vitest/ui -w
```

**`vitest.config.ts` for `packages/trpc`:**
```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'json-summary'],
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.d.ts', 'src/index.ts'],
      thresholds: {
        statements: 90,
        branches: 85,
        functions: 90,
        lines: 90,
      },
    },
    setupFiles: ['./src/__tests__/setup.ts'],
    testTimeout: 15000, // Allow for DB operations
  },
});
```

**`vitest.config.ts` for `apps/web`:**
```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/__tests__/setup.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/main.tsx', 'src/**/*.d.ts'],
      thresholds: {
        statements: 80,
        branches: 75,
        functions: 80,
        lines: 80,
      },
    },
  },
});
```

#### Playwright — E2E Tests

Playwright is the recommended choice because:
- Cross-browser (Chromium, Firefox, WebKit)
- Built-in network interception for mocking Stripe redirects and Resend emails
- First-class TypeScript support
- Parallel test execution across workers
- Component testing mode available for React components when needed

**Installation:**
```bash
bun add -d @playwright/test -w
bunx playwright install --with-deps chromium
```

**`playwright.config.ts` (workspace root):**
```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './apps/web/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: [
    ['html'],
    ['junit', { outputFile: 'test-results/e2e-junit.xml' }],
  ],
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile-chrome', use: { ...devices['Pixel 7'] } },
  ],
  webServer: [
    {
      command: 'bun run dev',
      url: 'http://localhost:3000',
      reuseExistingServer: !process.env.CI,
      cwd: 'apps/api',
    },
    {
      command: 'bun run dev',
      url: 'http://localhost:5173',
      reuseExistingServer: !process.env.CI,
      cwd: 'apps/web',
    },
  ],
});
```

### 6.2 Supporting Tools

| Tool | Purpose | Package |
|------|---------|---------|
| `@testing-library/react` | React component rendering in Vitest | `@testing-library/react` |
| `@testing-library/user-event` | Simulating real user interactions | `@testing-library/user-event` |
| `msw` (Mock Service Worker) | Mocking tRPC HTTP calls in component tests | `msw` |
| `prisma` test utils | Database reset between integration tests | built into `@prisma/client` |
| `vitest-mock-extended` | Type-safe mocking for Prisma, Stripe, Resend | `vitest-mock-extended` |

### 6.3 Integration Test Setup Pattern

**`packages/trpc/src/__tests__/setup.ts`:**
```typescript
import { PrismaClient } from '@shonen-mart/db';
import { appRouter } from '../router';
import { beforeAll, afterAll, beforeEach } from 'vitest';

export const prisma = new PrismaClient({
  datasources: { db: { url: process.env.TEST_DATABASE_URL } },
});

// Helper: create tRPC caller with mocked context
export function createUnauthenticatedCaller() {
  return appRouter.createCaller({ userId: null, role: 'USER', prisma });
}

export function createAuthenticatedCaller(opts: { userId: string; role?: 'USER' | 'ADMIN' }) {
  return appRouter.createCaller({
    userId: opts.userId,
    role: opts.role ?? 'USER',
    prisma,
  });
}

beforeAll(async () => {
  await prisma.$connect();
});

afterAll(async () => {
  await prisma.$disconnect();
});

beforeEach(async () => {
  // Clean DB between tests (use transactions for speed)
  await prisma.$transaction([
    prisma.stockAlert.deleteMany(),
    prisma.wishlistItem.deleteMany(),
    prisma.orderItem.deleteMany(),
    prisma.order.deleteMany(),
    prisma.address.deleteMany(),
    prisma.user.deleteMany(),
    prisma.product.deleteMany(),
    prisma.animeSeries.deleteMany(),
    prisma.category.deleteMany(),
  ]);
});
```

---

## 7. Coverage Targets

### Per-Package Targets

| Package / App | Statements | Branches | Functions | Lines | Rationale |
|---|---|---|---|---|---|
| `packages/trpc` | 90% | 87% | 90% | 90% | Core business logic; financial + auth risk |
| `packages/db` | 70% | 65% | 70% | 70% | Schema + seed files; Prisma handles most logic |
| `apps/api` | 85% | 80% | 85% | 85% | Hono routes + sitemap; security critical |
| `apps/web` store/utils | 90% | 85% | 90% | 90% | Pure functions + Zustand; high unit testability |
| `apps/web` components | 70% | 65% | 70% | 70% | UI components; E2E covers remaining flows |

### Coverage Enforcement

Coverage thresholds are enforced at CI level — a PR that drops any metric below the threshold will fail the build. Thresholds are configured in each `vitest.config.ts` under `coverage.thresholds`.

### Critical Path Coverage — Must Be 100%

These specific code paths must maintain 100% branch coverage regardless of overall package metrics:

- `createOrder` — sale price selection logic (isSale + salePrice null check)
- `createOrder` — stock enforcement check
- `createOrder` — transaction rollback on error
- `updateOrderStatus` — status-to-email mapping (SHIPPED/DELIVERED/CANCELLED)
- `updateOrderStatus` — stock restoration on CANCEL
- `updateProduct` — back-in-stock alert trigger (stock 0 → positive branch)
- `isAdmin` middleware — FORBIDDEN when role !== 'ADMIN'
- `isAuthed` middleware — UNAUTHORIZED when userId is null

---

## 8. CI/CD Integration Plan

### GitHub Actions Workflow

**`.github/workflows/ci.yml`:**
```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true

jobs:
  # ─── Job 1: Unit + Integration Tests ──────────────────────────────────────
  test-unit-integration:
    name: Unit & Integration Tests
    runs-on: ubuntu-latest
    timeout-minutes: 15

    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
          POSTGRES_DB: magnostadt_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

    env:
      TEST_DATABASE_URL: postgresql://test:test@localhost:5432/magnostadt_test
      CLERK_SECRET_KEY: ${{ secrets.CLERK_SECRET_KEY_TEST }}
      STRIPE_SECRET_KEY: sk_test_placeholder
      RESEND_API_KEY: re_test_placeholder

    steps:
      - uses: actions/checkout@v4

      - uses: oven-sh/setup-bun@v2
        with:
          bun-version: latest

      - name: Install dependencies
        run: bun install --frozen-lockfile

      - name: Run DB migrations (test DB)
        run: bunx prisma migrate deploy
        env:
          DATABASE_URL: ${{ env.TEST_DATABASE_URL }}
        working-directory: packages/db

      - name: Run unit tests (web utilities + store)
        run: bun run test:unit --coverage --reporter=verbose
        working-directory: apps/web

      - name: Run integration tests (tRPC procedures)
        run: bun run test:integration --coverage --reporter=verbose
        working-directory: packages/trpc

      - name: Run API unit tests (Hono routes + sitemap)
        run: bun run test --coverage --reporter=verbose
        working-directory: apps/api

      - name: Upload coverage reports
        uses: codecov/codecov-action@v4
        with:
          files: |
            apps/web/coverage/lcov.info
            packages/trpc/coverage/lcov.info
            apps/api/coverage/lcov.info
          fail_ci_if_error: true

  # ─── Job 2: E2E Tests ─────────────────────────────────────────────────────
  test-e2e:
    name: E2E Tests (Playwright)
    runs-on: ubuntu-latest
    timeout-minutes: 20
    needs: test-unit-integration  # Only run if unit/integration pass

    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
          POSTGRES_DB: magnostadt_e2e
        ports:
          - 5432:5432

    steps:
      - uses: actions/checkout@v4

      - uses: oven-sh/setup-bun@v2

      - name: Install dependencies
        run: bun install --frozen-lockfile

      - name: Install Playwright browsers
        run: bunx playwright install --with-deps chromium

      - name: Seed E2E test database
        run: bun run db:seed:test
        env:
          DATABASE_URL: postgresql://test:test@localhost:5432/magnostadt_e2e

      - name: Run E2E tests
        run: bunx playwright test
        env:
          DATABASE_URL: postgresql://test:test@localhost:5432/magnostadt_e2e
          STRIPE_SECRET_KEY: sk_test_placeholder
          VITE_CLERK_PUBLISHABLE_KEY: ${{ secrets.CLERK_PUBLISHABLE_KEY_TEST }}

      - name: Upload Playwright report
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 14

  # ─── Job 3: Type Check + Lint ─────────────────────────────────────────────
  lint-typecheck:
    name: Lint & Type Check
    runs-on: ubuntu-latest
    timeout-minutes: 5
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v2
      - run: bun install --frozen-lockfile
      - name: TypeScript type check
        run: bun --filter "*" run build -- --noEmit
      - name: ESLint
        run: bun --filter "web" run lint
```

### Quality Gates (Pull Request Blocking)

The following conditions **block PR merge**:
1. Any unit or integration test failure
2. Coverage drops below thresholds in any package
3. TypeScript type errors
4. ESLint errors (warnings allowed)
5. Any E2E test failure (critical flows only on PR; full suite on merge to main)

### Branch Protection Rules

```
main branch:
  - Require status checks: [test-unit-integration, lint-typecheck]
  - Require E2E on merge: [test-e2e]
  - Require 1 approval for PRs
  - Dismiss stale reviews on new push
  - No force pushes
```

---

## 9. Security Testing Checklist

### 9.1 Authentication and Authorization

| Test | Method | Status |
|------|--------|--------|
| All `adminProcedure` endpoints return FORBIDDEN for USER role | Integration test | Not started |
| All `protectedProcedure` endpoints return UNAUTHORIZED without session | Integration test | Not started |
| `getOrderById` is auth-gated and user can only view own orders | Integration test | Not started (known bug) |
| Clerk token verification failure is handled gracefully (no 500) | Integration test | Not started |
| Expired/malformed JWT does not grant access | Integration test | Not started |
| Admin flag cannot be set from client via tRPC input | Integration test | Not started |
| `auth.sync` email-linking cannot be used to steal another user's account | Integration + Manual | Not started |

### 9.2 Injection Attacks

| Test | Method | Status |
|------|--------|--------|
| Product slugs are XML-escaped in sitemap output | Unit test + Manual | Not started (known bug) |
| Search input does not enable SQL injection (Prisma parameterizes queries) | Integration test | Not started |
| Product names/descriptions sanitized in email templates | Unit test | Not started |
| No raw SQL execution in codebase | Static code review | Passed — Prisma only |
| Share token cannot be brute-forced (16-char hex = sufficient entropy) | Security review | Acceptable |

### 9.3 CORS and Network

| Test | Method | Status |
|------|--------|--------|
| CORS restricted to known origins (not wildcard) | Integration test | Not started (known bug) |
| Stripe webhook endpoint (if added) validates `stripe-signature` header | Integration test | Not started |
| API does not expose internal error details in production | Manual / Integration | Not started |
| HTTP security headers present (X-Frame-Options, CSP, etc.) | Manual (curl) | Not started |
| HTTPS enforced in production (Hono redirect) | Manual | Not started |

### 9.4 Data Exposure

| Test | Method | Status |
|------|--------|--------|
| Order email/address not exposed to unauthenticated callers | Integration test | Not started (known bug) |
| `getSharedWishlist` does not expose full user email | Integration test | Not started |
| `auth.getUsers` only accessible to ADMIN | Integration test | Not started |
| Database credentials not exposed in error messages | Manual | Not started |
| `.env` files not committed to repository | Git scan (gitleaks) | Not started |

### 9.5 Business Logic Security

| Test | Method | Status |
|------|--------|--------|
| Price cannot be manipulated client-side (server always re-reads from DB) | Integration test | Not started |
| Stock cannot go negative (concurrent order protection) | Integration test + Load test | Not started |
| Order total matches sum of DB product prices (not client-supplied) | Integration test | Not started |
| Sale price applied correctly (not overcharging customer) | Integration test | Not started (known bug) |
| User cannot cancel another user's order | Integration test | Not started |
| Address CRUD verifies ownership before mutating | Integration test | Partially (code review shows ownership check exists) |

### 9.6 Security Testing Tools to Add

```bash
# Secret scanning (add to CI)
bun add -d -w @secretlint/secretlint-rule-preset-recommend

# Dependency vulnerability scanning
bun audit

# OWASP ZAP for API fuzzing (run against staging, not CI)
docker run -t owasp/zap2docker-stable zap-api-scan.py \
  -t http://staging-api.magnostadt.store/trpc \
  -f openapi

# gitleaks for git history scanning
brew install gitleaks
gitleaks detect --source=.
```

---

## 10. Defect Catalog (Known Bugs)

These defects were identified during code review and must be tracked to resolution. Each has a corresponding test case defined above.

### DEF-001 — Sale Price Not Used in Order Calculation
- **Severity:** P0 — Financial
- **Location:** `packages/trpc/src/router.ts:464`, `packages/trpc/src/router.ts:477`
- **Description:** `createOrder` calculates `itemTotal` using `product.price` unconditionally. When `product.isSale === true` and `product.salePrice` is set, the customer is charged the full price instead of the sale price. The Stripe line item amount also uses `product.price`.
- **Fix:** `const effectivePrice = product.isSale && product.salePrice ? Number(product.salePrice) : Number(product.price);`
- **Test:** Section 5.1 above
- **Status:** Open

### DEF-002 — `getOrderById` Is a Public Procedure (PII Exposure)
- **Severity:** P0 — Security / Privacy
- **Location:** `packages/trpc/src/router.ts:547`
- **Description:** `getOrderById` uses `publicProcedure`. Any caller knowing an order ID can retrieve full order details including customer name, email, address, city, zip code, and purchased items. Order IDs are cuid strings (not secret by design), and confirmation page URLs expose the order ID directly (`/order/:id`).
- **Fix:** Change to `protectedProcedure`. Add `userId` ownership check in the query. Consider also allowing by `email` + `orderId` for guest lookups with a rate-limited approach.
- **Test:** Section 5.2 above
- **Status:** Open

### DEF-003 — Wildcard CORS Configuration
- **Severity:** P1 — Security
- **Location:** `apps/api/src/index.ts:10`
- **Description:** `app.use('*', cors())` with no arguments enables wildcard CORS (`Access-Control-Allow-Origin: *`). This allows any origin to make credentialed cross-site requests to the API.
- **Fix:** `app.use('*', cors({ origin: process.env.ALLOWED_ORIGINS?.split(',') ?? ['https://magnostadt.store'] }))`
- **Test:** Section 5.3 above
- **Status:** Open

### DEF-004 — XML Injection via Product Slug in Sitemap
- **Severity:** P1 — Security
- **Location:** `apps/api/src/index.ts:46-51`
- **Description:** Product slugs are interpolated directly into XML template literals without escaping. A malicious slug like `</loc><loc>https://evil.com` would produce invalid or poisoned XML. While Prisma schema enforces `@unique` on slug and the slug generator in `createProduct` uses a regex (`/[^a-z0-9]+/g`), the sitemap does not re-sanitize slugs read from the database.
- **Fix:** Apply XML entity escaping to all interpolated values: `const escapeXml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');`
- **Test:** Section 5.4 above
- **Status:** Open

### DEF-005 — Order Confirmation Email Sent Before Payment
- **Severity:** P1 — Business Logic
- **Location:** `packages/trpc/src/router.ts:527-542`
- **Description:** `sendOrderConfirmation` is called immediately after `createOrder` succeeds, before the customer completes Stripe checkout. This results in confirmation emails being sent for orders that were never paid. The code comment acknowledges this: `"Note: In production, this should ideally happen in a webhook after payment is confirmed."`
- **Fix:** Remove the pre-payment email send. Implement a Stripe webhook handler for `checkout.session.completed` that sends the confirmation email after payment is verified.
- **Test:** Integration test verifying `sendOrderConfirmation` is NOT called in `createOrder`, and a webhook handler test verifying it IS called on `checkout.session.completed`.
- **Status:** Open

### DEF-006 — `formatPrice` Uses Philippine Locale for USD Store
- **Severity:** P3 — Display
- **Location:** `apps/web/src/utils/format.ts:8`
- **Description:** `Intl.NumberFormat('en-PH', ...)` formats numbers with PHP suffix. The store charges in USD. The checkout page shows `$` (hardcoded) but other display contexts use `formatPrice` which outputs `PHP`.
- **Fix:** Change locale to `en-US` and add `style: 'currency', currency: 'USD'` to the Intl.NumberFormat options, then remove the manually appended `+ ' PHP'`.
- **Test:** Section 5.9 above
- **Status:** Open

### DEF-007 — Hardcoded localhost API URL in App.tsx
- **Severity:** P2 — Configuration
- **Location:** `apps/web/src/App.tsx:65`
- **Description:** `url: 'http://localhost:3000/trpc'` is hardcoded. Production and staging deployments will fail to connect to the API.
- **Fix:** `url: import.meta.env.VITE_API_URL + '/trpc'` with fallback.
- **Test:** Build-time check / E2E test that verifies API connectivity in staging.
- **Status:** Open

### DEF-008 — Back-in-Stock `Promise.all` Not Awaited
- **Severity:** P3 — Reliability
- **Location:** `packages/trpc/src/router.ts:337`
- **Description:** `Promise.all(alerts.map(...)).catch(...)` is called without `await`. Errors are caught by `.catch()`, but test assertions on side effects (email send count, `notified` flag update) may exhibit race conditions in tests.
- **Fix:** The `.catch()` pattern is intentional for "fire and forget" semantics, which is acceptable. However, the `notified` flag update inside the same Promise.all should be robust. Consider wrapping each alert's email + DB update in a nested try/catch to prevent one failure from blocking others.
- **Test:** Section 5.11 — add explicit `await vi.runAllTimersAsync()` or use `vi.useFakeTimers()` to control timing.
- **Status:** Open (low priority)

---

## 11. Test Environment Strategy

### Environments

| Environment | Purpose | Database | External Services |
|---|---|---|---|
| Local (dev) | Developer testing | Local PostgreSQL | Mocked (Stripe test mode, Resend sandbox) |
| CI (GitHub Actions) | Automated test runs | PostgreSQL service container | Fully mocked |
| Staging | Pre-release validation + E2E | Dedicated staging DB | Stripe test mode, Resend sandbox |
| Production | Live monitoring | Production DB | Live Stripe, live Resend |

### Test Database Management

```bash
# Add to packages/db/package.json scripts
"db:test:setup": "DATABASE_URL=$TEST_DATABASE_URL prisma migrate deploy",
"db:test:reset": "DATABASE_URL=$TEST_DATABASE_URL prisma migrate reset --force",
"db:test:seed": "DATABASE_URL=$TEST_DATABASE_URL bun run prisma/seed.ts"
```

### Environment Variables for Testing

**`.env.test` (gitignored, per package):**
```bash
TEST_DATABASE_URL=postgresql://test:test@localhost:5432/magnostadt_test
CLERK_SECRET_KEY=sk_test_...
STRIPE_SECRET_KEY=sk_test_placeholder
RESEND_API_KEY=re_test_placeholder
VITE_API_URL=http://localhost:3000
```

### Service Mocking Strategy

| Service | Unit Tests | Integration Tests | E2E Tests |
|---|---|---|---|
| Stripe | `vi.mock()` — return fake session | `vi.mock()` — return fake session | Playwright network interception |
| Resend | `vi.mock()` — capture calls | `vi.mock()` — capture calls | Mock server (msw) |
| Clerk | `vi.mock()` — return fake context | Real token validation mocked at context level | Test Clerk environment |
| PostgreSQL | N/A (mocked) | Real test DB | Real test DB |

---

## 12. Implementation Roadmap

### Week 1-2: Foundation (Unblock Everything)

**Fix all P0/P1 defects first — no point testing known-broken code.**

Priority order:
1. Fix DEF-001 (sale price in createOrder + Stripe line item)
2. Fix DEF-002 (add auth to getOrderById + ownership check)
3. Fix DEF-003 (restrict CORS origins)
4. Fix DEF-004 (XML escape in sitemap)
5. Fix DEF-005 (move email to Stripe webhook)

Install test tooling:
```bash
bun add -d vitest @vitest/coverage-v8 @testing-library/react @testing-library/user-event jsdom -w
bun add -d @playwright/test -w
```

Create `vitest.config.ts` in each package/app.
Create test setup files and DB helpers.

### Week 3-4: Unit Tests

Target packages in risk order:
1. `packages/trpc/src/router.ts` — price calculation, stock logic (pure branches)
2. `apps/web/src/store/useCartStore.ts` — all Zustand actions
3. `apps/web/src/utils/format.ts` — formatPrice
4. `apps/api/src/index.ts` — sitemap XML generation
5. `packages/trpc/src/routers/` — wishlist, stockAlert, address helpers

**Milestone:** Unit test coverage >= 90% on all pure functions and store.

### Week 5-6: Integration Tests

Target all tRPC procedures via `appRouter.createCaller()`:
1. `createOrder` — sale price, stock, transaction rollback, Stripe mock
2. `getOrderById` — auth enforcement (after DEF-002 fix)
3. `updateOrderStatus` — email triggers, stock restore on cancel
4. `updateProduct` — back-in-stock alert trigger
5. `auth.*` — sync, me, getUsers (admin only)
6. `wishlist.*` — CRUD, share token, shared view
7. `stockAlert.*` — subscribe, unsubscribe, checkStatus
8. `address.*` — ownership verification

**Milestone:** Integration test coverage >= 80% on all procedures.

### Week 7-8: E2E Tests

Implement Playwright flows in priority order:
1. Complete purchase flow (sale product → checkout → Stripe mock → confirmation)
2. Admin route protection (unauthenticated + USER role redirect)
3. Admin order status update + email trigger
4. Wishlist toggle (auth-gated) + share link
5. Back-in-stock alert subscription
6. Product search and filtering
7. Cart persistence across page refresh
8. Empty cart redirect from checkout

**Milestone:** All 25 critical E2E flows passing in CI.

### Week 9-10: CI/CD + Coverage Enforcement

1. Add `.github/workflows/ci.yml`
2. Configure branch protection rules in GitHub
3. Add Codecov badge and PR coverage diff comments
4. Run `gitleaks` scan on git history
5. Add `bun audit` to CI for dependency vulnerabilities
6. Document runbook for failing CI locally

### Ongoing: Quality Maintenance

- Weekly: Review new coverage reports for regression
- Each PR: Require tests for new procedures and components
- Monthly: Review and update E2E test suite for new features
- Quarterly: Run full OWASP ZAP scan against staging
- Each release: Run full E2E suite against staging before promoting to production

---

## Appendix A: Test File Structure

```
shonen-mart/
├── packages/
│   └── trpc/
│       ├── vitest.config.ts
│       └── src/
│           └── __tests__/
│               ├── setup.ts               # DB + caller helpers
│               ├── createOrder.test.ts    # P0 — financial correctness
│               ├── getOrderById.test.ts   # P0 — auth enforcement
│               ├── auth.test.ts           # P1 — all admin procedures
│               ├── inventory.test.ts      # P1 — stock enforcement
│               ├── wishlist.test.ts       # P2 — wishlist + sharing
│               ├── stockAlert.test.ts     # P2 — alert flow
│               ├── address.test.ts        # P2 — ownership checks
│               └── updateOrderStatus.test.ts # P1 — email triggers
│
├── apps/
│   ├── api/
│   │   ├── vitest.config.ts
│   │   └── src/
│   │       └── __tests__/
│   │           ├── cors.test.ts           # P1 — CORS security
│   │           └── sitemap.test.ts        # P1 — XML injection
│   │
│   └── web/
│       ├── vitest.config.ts
│       ├── playwright.config.ts
│       ├── src/
│       │   └── __tests__/
│       │       ├── setup.ts
│       │       ├── store/
│       │       │   └── useCartStore.test.ts  # P2 — Zustand store
│       │       └── utils/
│       │           └── format.test.ts        # P3 — formatPrice
│       └── e2e/
│           ├── helpers/
│           │   ├── auth.ts               # Login helpers
│           │   ├── seed.ts               # Test data seeding
│           │   └── stripe.ts             # Stripe mock
│           ├── checkout.spec.ts          # P3 E2E — purchase flow
│           ├── admin.spec.ts             # P3 E2E — admin access
│           └── auth.spec.ts              # P3 E2E — auth flows
│
└── .github/
    └── workflows/
        └── ci.yml
```

---

## Appendix B: Quick Reference — Running Tests

```bash
# Run all unit tests across the monorepo
bun --filter "*" run test

# Run integration tests for tRPC procedures only
bun run test --run
# (from packages/trpc)

# Run with coverage
bun run test --coverage --run

# Run a specific test file
bun run vitest run src/__tests__/createOrder.test.ts

# Run E2E tests (requires running services)
bunx playwright test

# Run E2E tests in headed mode (for debugging)
bunx playwright test --headed

# Run E2E tests for a single file
bunx playwright test apps/web/e2e/checkout.spec.ts

# View interactive coverage report
bun run vitest --coverage --ui
```

---

*This document is a living artifact. Update it when new features are added, defects are found, or coverage thresholds are revised.*
