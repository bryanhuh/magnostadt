# Advanced Inventory Management — Implementation Guide

This document covers the full implementation of the Advanced Inventory Management feature for the Shonen Mart / Akashic District e-commerce platform.

## Overview

The inventory management system ensures products cannot be oversold, restores stock on cancellations, enforces quantity limits on the frontend, and gives admins a live low-stock dashboard.

### What Was Done

| Feature | File(s) Modified |
|---------|-----------------|
| Stock validation on order | `packages/trpc/src/router.ts` |
| Atomic stock decrement | `packages/trpc/src/router.ts` |
| Stock restore on cancel | `packages/trpc/src/router.ts` |
| Admin inventory stats API | `packages/trpc/src/router.ts` |
| Admin low-stock query API | `packages/trpc/src/router.ts` |
| Cart stock enforcement | `apps/web/src/store/useCartStore.ts` |
| ProductDetails stock pass | `apps/web/src/components/ProductDetails.tsx` |
| ProductCard stock pass | `apps/web/src/components/ProductCard.tsx` |
| ProductCarousel stock pass | `apps/web/src/components/home/ProductCarousel.tsx` |
| CartDrawer max quantity UI | `apps/web/src/components/CartDrawer.tsx` |
| Admin Dashboard live data | `apps/web/src/pages/admin/Dashboard.tsx` |

---

## 1. Backend — Stock Control (tRPC Router)

### 1.1 Stock Validation & Atomic Decrement in `createOrder`

**File**: `packages/trpc/src/router.ts` — `createOrder` procedure

The `createOrder` procedure already ran inside a Prisma `$transaction`. We added two things inside that transaction:

**Stock Check** — before processing each item, we verify the product has enough stock:
```typescript
if (product.stock < item.quantity) {
  throw new TRPCError({
    code: 'BAD_REQUEST',
    message: `"${product.name}" only has ${product.stock} left in stock.`,
  });
}
```

**Atomic Decrement** — immediately after the check, we decrement stock within the same transaction:
```typescript
await tx.product.update({
  where: { id: item.productId },
  data: { stock: { decrement: item.quantity } },
});
```

> **Why `$transaction`?** Prisma's `$transaction` ensures atomicity. If any item fails the stock check, the entire order (including decrements for previously-processed items) is rolled back. This prevents partial decrements and race conditions.

### 1.2 Stock Restoration on Cancellation

**File**: `packages/trpc/src/router.ts` — `updateOrderStatus` procedure

When an admin changes an order's status to `CANCELLED`, we restore the stock for all items:

```typescript
if (input.status === 'CANCELLED') {
  await prisma.$transaction(async (tx) => {
    for (const item of order.items) {
      await tx.product.update({
        where: { id: item.productId },
        data: { stock: { increment: item.quantity } },
      });
    }
  });
}
```

This runs **before** the email notifications, so if the restore fails, the admin gets an error instead of silently losing stock.

### 1.3 New Admin Procedures

**`getLowStockProducts`** — Returns all products with `stock <= 10`, sorted by stock ascending (most critical first). Includes `category` and `anime` relations for display context.

**`getInventoryStats`** — Returns aggregate counts using `Promise.all` for parallel execution:
- `totalProducts` — total number of products
- `outOfStock` — products with `stock === 0`
- `lowStock` — products with `stock > 0 && stock <= 10`
- `totalOrders` — total number of orders

---

## 2. Frontend — Cart & Checkout Guards

### 2.1 Cart Store (`useCartStore.ts`)

**Added `stock` field** to both `CartItem` and `ProductToAdd` interfaces. This tracks how much stock was available when the product was added.

**Stock enforcement in `addItem`**:
- Existing items: `Math.min(existingItem.quantity + 1, product.stock)` caps the quantity
- New items: checks `product.stock <= 0` and rejects out-of-stock additions
- Updates the `stock` field on existing items to stay current

**Stock enforcement in `updateQuantity`**:
- Caps at `Math.min(quantity, item.stock)` to prevent exceeding available stock

### 2.2 Callsites Updated

All 3 places that call `addItem()` were updated to pass `stock: product.stock`:

| Component | File |
|-----------|------|
| `ProductDetails` | `apps/web/src/components/ProductDetails.tsx` |
| `ProductCard` | `apps/web/src/components/ProductCard.tsx` |
| `ProductCarousel` | `apps/web/src/components/home/ProductCarousel.tsx` |

### 2.3 CartDrawer Stock Limit UI

**File**: `apps/web/src/components/CartDrawer.tsx`

The `+` button is now disabled when `item.quantity >= item.stock` with visual feedback:
- Disabled state: `cursor-not-allowed` + grayed-out color
- "max X" label appears in amber when at the stock limit

### 2.4 CheckoutPage Error Display

**File**: `apps/web/src/components/CheckoutPage.tsx`

Already had `createOrderMutation.error.message` displayed — no changes needed. The backend's stock error messages (e.g., `"Naruto Figure" only has 2 left in stock.`) are shown directly to the user.

---

## 3. Admin Dashboard

**File**: `apps/web/src/pages/admin/Dashboard.tsx`

Completely rebuilt from static placeholder data to live tRPC queries:

**Stats Cards** (4 cards):
- Total Revenue (calculated from all orders)
- Total Products
- Low Stock count (1-10 remaining)
- Out of Stock count (0 remaining)

**Inventory Alerts Table**:
- Shows all products with `stock <= 10`
- Columns: Product (with thumbnail), Series, Category, Stock (color-coded badge), Action (edit link)
- Stock badges: 🔴 red for `OUT`, 🟡 amber for low stock
- Empty state: "All stocked up!" message

---

## 4. How Stock Flows Through the System

```
┌─────────────────────────────────────────────────────┐
│                   CUSTOMER FLOW                      │
├─────────────────────────────────────────────────────┤
│                                                      │
│  Browse Products ──→ Add to Cart ──→ Checkout        │
│       │                   │              │           │
│  stock shown on       quantity capped    stock check │
│  ProductDetails      at item.stock      + decrement  │
│  (low stock badge)   (useCartStore)     ($transaction)│
│                                                      │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│                    ADMIN FLOW                        │
├─────────────────────────────────────────────────────┤
│                                                      │
│  Dashboard ──→ Low Stock Table ──→ Edit Product      │
│      │              │                   │            │
│  getInventoryStats  getLowStockProducts  updateProduct│
│  (live counts)      (stock <= 10)       (set stock)  │
│                                                      │
│  Orders ──→ Cancel Order ──→ Stock Restored          │
│                  │                │                   │
│          updateOrderStatus    $transaction            │
│          (CANCELLED)          (increment stock)       │
│                                                      │
└─────────────────────────────────────────────────────┘
```

---

## 5. Important Notes

### No Schema Migration Required
The `Product.stock: Int` field already existed in the Prisma schema. No migration, `db push`, or `prisma generate` was needed.

### Edge Cases Handled
- **Race conditions**: Stock checks + decrements happen inside `$transaction`, so two simultaneous orders for the last item will not both succeed
- **Out-of-stock products**: Can't be added to cart at all (`product.stock <= 0` guard in `addItem`)
- **Cart quantity exceeding stock**: `Math.min()` prevents it silently, UI shows "max X" label
- **Cancelled orders**: Stock is always restored atomically

### Known Limitations (Future Improvements)
- **Cart staleness**: `stock` on `CartItem` is a snapshot from when the product was added. If stock changes (another customer buys), the cart doesn't auto-refresh. The backend `createOrder` is the final guard.
- **No webhook stock tracking**: Stock decrements happen on order creation, not on successful payment (no Stripe webhook yet). If a customer abandons payment, the stock is still decremented. This can be addressed when Stripe webhooks are implemented.
- **Double-cancel safety**: Cancelling the same order twice would double-increment stock. Consider adding a status check before restoring.

---

## 6. Testing Checklist

- [ ] Add a product with stock = 3 to cart → verify you can't set quantity > 3
- [ ] Complete checkout → verify product stock decremented by the ordered quantity
- [ ] Cancel the order in admin → verify stock is restored
- [ ] Set product stock to 0 → verify "Out of Stock" appears and add-to-cart is disabled
- [ ] Visit admin Dashboard → verify live stats and low-stock product table
- [ ] Try to order more than available stock → verify clear error message on CheckoutPage
