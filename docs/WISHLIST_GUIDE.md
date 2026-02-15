# Wishlist Enhancements — Implementation Guide

This document covers the full implementation of the Wishlist Enhancement features for the Shonen Mart / Akashic District e-commerce platform.

## Overview

Two features were added to the existing wishlist system:
1. **Back in Stock Alerts** — Users subscribe to email notifications when out-of-stock products become available
2. **Wishlist Sharing** — Users share their wishlist via a unique public link

### What Was Done

| Feature | File(s) Modified |
|---------|-----------------|
| `StockAlert` database model | `packages/db/prisma/schema.prisma` |
| `shareToken` on User model | `packages/db/prisma/schema.prisma` |
| Stock alert TRPC router | `packages/trpc/src/routers/stockAlert.ts` [NEW] |
| Wishlist sharing procedures | `packages/trpc/src/routers/wishlist.ts` |
| Router registration + restock trigger | `packages/trpc/src/router.ts` |
| Back in Stock email template | `packages/trpc/src/services/email/templates/BackInStock.tsx` [NEW] |
| Email sender function | `packages/trpc/src/services/email/index.ts` |
| Notify Me on ProductDetails | `apps/web/src/components/ProductDetails.tsx` |
| Notify Me on ProductCard | `apps/web/src/components/ProductCard.tsx` |
| Wishlist page (share + alerts) | `apps/web/src/pages/profile/Wishlist.tsx` |
| Shared wishlist public page | `apps/web/src/pages/SharedWishlist.tsx` [NEW] |
| Shared wishlist route | `apps/web/src/App.tsx` |

---

## 1. Database Schema

### 1.1 `StockAlert` Model

**File**: `packages/db/prisma/schema.prisma`

Tracks which users want to be notified when a product is back in stock:

```prisma
model StockAlert {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  productId String
  product   Product  @relation(fields: [productId], references: [id], onDelete: Cascade)
  email     String
  notified  Boolean  @default(false)
  createdAt DateTime @default(now())

  @@unique([userId, productId])
}
```

**Key design decisions:**
- `@@unique([userId, productId])` — One alert per user per product (upsert on re-subscribe)
- `notified: Boolean` — Marks alerts as sent so they aren't re-triggered on subsequent restocks
- `email: String` — Stored explicitly so the email address is captured at subscription time
- `onDelete: Cascade` — Alerts are cleaned up if the user or product is deleted

### 1.2 `shareToken` on User

```prisma
model User {
  ...
  shareToken String? @unique @default(cuid())
  ...
}
```

A unique token generated per user for sharing their wishlist publicly. The `@default(cuid())` auto-generates one on user creation. If missing, it's generated on-demand via the `getShareToken` procedure.

---

## 2. Backend — TRPC Routers

### 2.1 Stock Alert Router

**File**: `packages/trpc/src/routers/stockAlert.ts`

| Procedure | Type | Auth | Description |
|-----------|------|------|-------------|
| `subscribe` | mutation | protected | Creates or resets alert (upsert) |
| `unsubscribe` | mutation | protected | Deletes alert by userId+productId |
| `checkStatus` | query | protected | Returns `true` if active (un-notified) alert exists |
| `getMyAlerts` | query | protected | Returns all active alerts with product details |

**Subscribe uses upsert** to handle re-subscribing after a product goes out of stock again:

```typescript
return await ctx.prisma.stockAlert.upsert({
  where: { userId_productId: { userId, productId } },
  update: { email, notified: false },  // Reset notified flag
  create: { userId, productId, email },
});
```

### 2.2 Wishlist Sharing Procedures

**File**: `packages/trpc/src/routers/wishlist.ts`

Two new procedures added to the existing `wishlistRouter`:

**`getShareToken`** (protectedProcedure) — Returns the current user's share token. If none exists, generates a short random token:

```typescript
data: { shareToken: crypto.randomUUID().replace(/-/g, '').slice(0, 16) }
```

**`getSharedWishlist`** (publicProcedure) — Takes a `token` string, looks up the user, and returns their wishlist items. Returns `null` if the token is invalid. The response includes `ownerName` (derived from email) and the full `items` array with product relations.

### 2.3 Back-in-Stock Trigger

**File**: `packages/trpc/src/router.ts` — `updateProduct` procedure

When an admin updates a product's stock, the system checks if stock went from `0 → >0`:

```typescript
if (currentProduct.stock === 0 && data.stock && data.stock > 0) {
  // Find all un-notified alerts for this product
  const alerts = await prisma.stockAlert.findMany({
    where: { productId: id, notified: false },
  });

  // Send emails & mark as notified (fire and forget)
  Promise.all(
    alerts.map(async (alert) => {
      await sendBackInStockAlert({ name, imageUrl, slug, price }, alert.email);
      await prisma.stockAlert.update({
        where: { id: alert.id },
        data: { notified: true },
      });
    })
  ).catch(console.error);
}
```

> **Note**: Emails are sent as "fire and forget" — the admin's response isn't blocked by email delivery. Errors are logged but don't fail the product update.

---

## 3. Email

### 3.1 Back in Stock Template

**File**: `packages/trpc/src/services/email/templates/BackInStock.tsx`

React-email template following the same pattern as `OrderConfirmation.tsx`. Includes:
- Product name and price
- Product image (if available)
- "Shop Now" CTA button linking to the product page
- Footer explaining why the user received the email

### 3.2 Sender Function

**File**: `packages/trpc/src/services/email/index.ts`

```typescript
export const sendBackInStockAlert = async (
  product: { name: string; imageUrl?: string | null; slug: string; price: string | number },
  email: string
) => { ... }
```

Same error handling pattern as all other email functions — gracefully skips if `RESEND_API_KEY` is missing.

---

## 4. Frontend

### 4.1 ProductDetails — Notify Me Button

**File**: `apps/web/src/components/ProductDetails.tsx`

When `product.stock === 0`, a full-width button appears below the "Free Shipping" text:
- **Not subscribed**: Blue "Notify Me When Available" with bell icon
- **Subscribed**: Amber "Remove Stock Alert" with bell-off icon
- Toggles between subscribe and unsubscribe

Uses `user.primaryEmailAddress?.emailAddress` from Clerk to auto-fill the email.

### 4.2 ProductCard — Out of Stock Badge + Bell

**File**: `apps/web/src/components/ProductCard.tsx`

When `product.stock === 0`, an overlay appears at the bottom of the card image:
- **"Out of Stock"** badge (left side)
- **Bell icon** button (right side) — subscribe to alert
- Once subscribed, bell turns solid amber with filled icon

### 4.3 Wishlist Page

**File**: `apps/web/src/pages/profile/Wishlist.tsx`

Redesigned with three sections:

1. **Header** — Item count + "Share Wishlist" button (copies URL to clipboard)
2. **Active Stock Alerts** — Amber banner showing all products user is watching
3. **Product Grid** — Separated into "Out of Stock" (dimmed) and "In Stock" groups

### 4.4 Shared Wishlist Page

**File**: `apps/web/src/pages/SharedWishlist.tsx`

Public page at `/wishlist/:token`:
- No authentication required
- Shows owner name, item count, and product grid
- Graceful "Wishlist Not Found" state for invalid/expired tokens
- Back to Store navigation

**Route** added in `apps/web/src/App.tsx`:
```tsx
<Route path="/wishlist/:token" element={<SharedWishlist />} />
```

---

## 5. How It All Flows

```
┌──────────────────────────────────────────────────────────┐
│              BACK IN STOCK ALERTS FLOW                    │
├──────────────────────────────────────────────────────────┤
│                                                           │
│  Customer sees           Customer clicks                  │
│  out-of-stock     ──→    "Notify Me"     ──→  StockAlert  │
│  product                                      created     │
│                                                           │
│  Admin restocks          System checks                    │
│  product          ──→    stock: 0 → >0   ──→  Email sent  │
│  (updateProduct)         triggers alerts      to customer  │
│                                                           │
└──────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────┐
│                WISHLIST SHARING FLOW                       │
├──────────────────────────────────────────────────────────┤
│                                                           │
│  User clicks             URL copied to                    │
│  "Share Wishlist"  ──→   clipboard        ──→  User shares│
│                          /wishlist/:token      the link    │
│                                                           │
│  Anyone opens            Public page                      │
│  the URL           ──→   fetches wishlist ──→  Read-only  │
│  (no login needed)       via shareToken       product grid │
│                                                           │
└──────────────────────────────────────────────────────────┘
```

---

## 6. Important Notes

### Re-subscribe Behavior
If a product goes out of stock again after being restocked, users can re-subscribe. The `subscribe` mutation uses `upsert` and resets `notified: false`, so the same user can be notified again for the same product.

### Privacy
- Shared wishlists only expose the owner's email prefix (before `@`) as the display name
- The share token is a random 16-character string — not guessable
- No user ID or email is exposed in the public API response

### Edge Cases Handled
- **Multiple restocks**: Only un-notified alerts are triggered — re-subscribing resets the flag
- **Deleted products**: `onDelete: Cascade` removes alerts when products are deleted
- **No email configured**: `sendBackInStockAlert` gracefully skips if `RESEND_API_KEY` is missing
- **Clipboard API unavailable**: Falls back to `prompt()` for copying share URL

### Known Limitations
- **No alert history**: Once notified, the alert is marked as `notified: true` but stays in the DB. Could add a cleanup job in the future.
- **Email at subscription time**: Uses the email at the time of subscribing. If the user changes their email later, the old email is used.
- **No share token regeneration UI**: Users can't regenerate their share token from the UI. The same token is used permanently.

---

## 7. Testing Checklist

### Back in Stock Alerts
- [ ] Find an out-of-stock product → verify "Notify Me When Available" button appears
- [ ] Click "Notify Me" → verify success toast and button changes to "Remove Stock Alert"
- [ ] Visit wishlist page → verify the Active Stock Alerts section shows the product
- [ ] As admin, set the product stock to >0 → verify email is sent (check Resend dashboard or server logs)
- [ ] Revisit the product → verify the notify button is gone (stock is available)

### Wishlist Sharing
- [ ] Visit `/profile/wishlist` → verify "Share Wishlist" button is visible
- [ ] Click "Share Wishlist" → verify link is copied to clipboard
- [ ] Open the copied link in incognito/private window → verify the shared wishlist page loads
- [ ] Verify the page shows the correct products and owner name
- [ ] Try an invalid token (e.g. `/wishlist/invalid`) → verify "Wishlist Not Found" page
