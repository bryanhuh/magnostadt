# Phase 3 Implementation Steps

This document details the changes made during Phase 3 (Shopping Cart).

## 1. Setup State Management
- Installed `zustand` for global state management.
- Created `useCartStore` in `apps/web/src/store/useCartStore.ts`.
- Configured persistence using `zustand/middleware` to save cart state to `localStorage` under the key `shonen-mart-cart`.

## 2. Drawer Component
- Created `CartDrawer.tsx` component.
- Features:
    - Lists items with images and details.
    - Quantity controls (+/-).
    - Remove button with trash icon.
    - Real-time subtotal calculation.
    - "Checkout" button (placeholder).

## 3. Integration
- Modified `App.tsx`:
    - Added `CartDrawer` to the root layout so it overlays all pages.
    - Added a Cart Button to the Header with a badge showing total items.
- Connected Components:
    - `ProductList.tsx`: "Add to Cart" button now adds items to store.
    - `ProductDetails.tsx`: Main CTA button adds current product to store.
    - Both interactions automatically open the drawer for immediate feedback.
