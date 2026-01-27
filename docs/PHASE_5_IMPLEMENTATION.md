# Phase 5 Implementation Steps

This document details the changes made during Phase 5 (Polish & Analytics).

## 1. Analytics & Error Tracking
- Created `apps/web/.env.example` with structure for PostHog and Sentry keys.
- Created `apps/web/src/utils/analytics.ts` util for initializing PostHog and capturing events.
- Initialized PostHog and Sentry in `App.tsx`.
- Instrumented key events:
    - `add_to_cart` (Product List & Details)
    - `remove_from_cart` (Cart Drawer)
    - `checkout_started` (Cart Drawer)

## 2. UI Polish
- **Toast Notifications**:
    - Installed `sonner`.
    - Added `<Toaster />` to `App.tsx`.
    - Added success toasts when adding items to cart from List and Details views.
- **Loading Skeletons**:
    - Updated `ProductList.tsx` to display a skeleton grid and sidebar while fetching data, replacing the simple spinner for a better perceived performance.

## 3. Verification
- Verified skeletons appear on load.
- Verified toast notifications appear upon user interaction.
- Verified analytics events are fired (logged to console in dev mode without keys).

## 4. Verification & Operations Guide

### PostHog (Analytics)
To verify events in the PostHog dashboard:
1.  **Disable Filters**: Ensure "Filter out internal and test users" is **OFF**. Localhost traffic is often flagged as internal.
2.  **Live Events**: Use the **Activity > Explore** tab to see events streaming in real-time.
3.  **Expected Events**:
    -   `add_to_cart`: Triggered when clicking "Add to Cart" on Product List or Details. Properties: `product_id`, `price`, `name`.
    -   `remove_from_cart`: Triggered when removing an item from the drawer.
    -   `checkout_started`: Triggered when clicking "Checkout" in the cart drawer.
    -   `order_completed`: Triggered upon successful order placement. Properties: `order_id`, `total`, `item_count`.
    -   `order_confirmation_viewed`: Triggered when the confirmation page initializes.

### Sentry (Error Tracking)
To verify error tracking:
1.  **Triggers**: Sentry is initialized to capture unhandled exceptions and React error boundaries.
2.  **Dashboard**: Go to your Sentry Project > **Issues** to see captured errors.
3.  **Replays**: Session Replays are enabled (sample rate 0.1 for sessions, 1.0 for errors). You can watch a video-like replay of the user session leading up to an error.
