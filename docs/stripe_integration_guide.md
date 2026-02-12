# Stripe Payment Integration Guide

This guide documents the implementation of Stripe Checkout for Shonen Mart.

## Overview

The integration uses **Stripe Checkout** to handle secure payments. 
1.  **Backend**: Creates a Stripe Checkout Session via TRPC mutation.
2.  **Frontend**: Redirects the user to the hosted Stripe payment page.
3.  **Database**: Stores the `stripeSessionId` and `paymentStatus` in the `Order` record.

## Architecture

### 1. Database Schema (`packages/db`)

We extended the `Order` model in `prisma/schema.prisma` with two new fields:

```prisma
model Order {
  // ... existing fields
  stripeSessionId String?   @unique
  paymentStatus   String    @default("UNPAID") // UNPAID, PAID, FAILED
}
```

### 2. Backend Service (`packages/trpc`)

**Service File**: `src/services/stripe.ts`

-   Initializes the Stripe SDK using `STRIPE_SECRET_KEY` (from `apps/api/.env`).
-   Exports `createCheckoutSession` function.

**TRPC Router**: `src/router.ts`

-   **Mutation**: `createOrder`
-   **Logic**:
    1.  Calculates order total and shipping.
    2.  Creates the `Order` record in DB (Status: `PENDING`).
    3.  Calls `createCheckoutSession` with line items and order metadata.
    4.  Updates `Order` with the returned `session.id`.
    5.  Returns `{ orderId, checkoutUrl }` to the client.

### 3. Frontend Integration (`apps/web`)

**Component**: `CheckoutPage.tsx`

-   Calls the `createOrder` mutation.
-   On success:
    -   If `checkoutUrl` is present, redirects via `window.location.href`.
    -   Fallback to order confirmation page if no URL (for testing or zero-value orders).

**Environment Variables**:
-   `apps/api/.env`: Requires `STRIPE_SECRET_KEY`.
-   `apps/web/.env`: Requires `VITE_STRIPE_PUBLISHABLE_KEY` (optional for this flow, but good practice).

## Setup Instructions

1.  **Stripe Account**: 
    -   Create a Stripe account.
    -   Get your **Test Mode** API Keys (`sk_test_...`).

2.  **Environment Configuration**:
    -   Create/Update `apps/api/.env`:
        ```env
        STRIPE_SECRET_KEY=sk_test_your_secret_key
        ```

3.  **Running the Project**:
    -   `bun run dev` (Ensure database is running).

## Testing

1.  Add items to cart.
2.  Proceed to checkout.
3.  Enter shipping details and click "Place Order".
4.  You should be redirected to Stripe.
5.  Use a [Stripe Test Card](https://stripe.com/docs/testing) (e.g., `4242 4242 4242 4242`).
6.  Complete payment.
7.  You will be redirected back to the Order Confirmation page.

## Future Improvements

-   **Webhooks**: Implement a webhook handler in `apps/api` to listen for `checkout.session.completed` events and asynchronously update `paymentStatus` to `PAID`. This is more robust than relying on the redirect.
-   **Shipping Calculation**: Move shipping logic to a dedicated service or database configuration.
