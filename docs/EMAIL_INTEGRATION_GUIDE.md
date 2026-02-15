# Email Notification System Guide

## Overview
This guide documents the implementation of the automated email notification system for **Magnostadt**. The system uses **Resend** for delivery and **React Email** for templating, ensuring high deliverability and a modern developer experience.

## Technology Stack
-   **Resend** (`resend`): A modern email sending API. Chosen for its superior DX, reliability, and ease of use compared to legacy providers like SendGrid or AWS SES.
-   **React Email** (`@react-email/components`): A collection of high-quality, unstyled components for creating responsive emails using React.
-   **React Email Render** (`@react-email/render`): Converts React components into compliant HTML for email clients.

## Architecture

### Service Location
The email service is located in `packages/trpc/src/services/email`.
-   **Structure**:
    -   `index.ts`: Exports sending functions (`sendOrderConfirmation`, `sendShippingUpdate`, etc.).
    -   `templates/`: Contains React components for each email type (`OrderConfirmation.tsx`, etc.).

### Integration with tRPC
The email service is integrated directly into the `packages/trpc/src/router.ts`.
-   **Order Creation**: Triggered in `createOrder` mutation.
-   **Status Updates**: Triggered in `updateOrderStatus` mutation.

## Implementation Details

### 1. Templates
We implemented four core templates:
1.  **Order Confirmation**: Sent when an order is placed. Lists items, total, and shipping address.
2.  **Shipping Update**: Sent when status -> `SHIPPED`. Includes tracking link (placeholder).
3.  **Delivered**: Sent when status -> `DELIVERED`.
4.  **Cancelled**: Sent when status -> `CANCELLED`. Includes refund notice.

### 2. Environment Variables
Required in `apps/api/.env`:
```env
RESEND_API_KEY=re_123...
SENDER_EMAIL=onboarding@resend.dev  # Use a verified domain in production (e.g., updates@magnostadt.com)
```

### 3. Challenges & Solutions
-   **Circular Dependencies**: Initially, the email service was in `apps/api`, but `packages/trpc` needed to call it. Since `apps/api` consumes `packages/trpc`, this created a cycle/import error.
    -   *Solution*: Moved the email service logic *down* into `packages/trpc` so it can be self-contained and used by the router.
-   **Domain Verification**: Resend requires a verified domain to send to external emails.
    -   *Workaround*: For development, we use `onboarding@resend.dev` which allows sending *only* to the account owner's email.

## Testing Guide

### Method 1: Manual Script
We created a test script to verify email delivery without placing an order.
1.  Run: `bun run apps/api/scripts/test-email.ts`
2.  Check your inbox for a "Test Order Confirmation" email.

### Method 2: End-to-End Flow
1.  **Place an Order**:
    -   Go to the storefront and complete a checkout.
    -   Verify you receive the **Order Confirmation** email.
2.  **Update Status**:
    -   Go to Admin Dashboard > Orders.
    -   Change status to `SHIPPED`.
    -   Verify you receive the **Shipping Update** email.
    -   Repeat for `DELIVERED` and `CANCELLED`.

## Future Improvements
-   **Webhooks**: Listen for Stripe webhooks to trigger emails only after successful payment (currently "best effort" on creation).
-   **Queueing**: Offload email sending to a background job queue (e.g., BullMQ) for better performance and reliability.
