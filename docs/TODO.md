# Features TODO List

This document tracks the missing features and planned improvements for the Shonen Mart application.

## 🔴 Priority: Critical Features (Must Have)

### 1. Payment Processing Integration (✅ Done)
- [x] **Provider**: Implemented **Stripe**.
- [x] **Backend**: Set up Stripe Checkout API integration in TRPC router.
- [x] **Frontend**: Redirect to Stripe Checkout page from `CheckoutPage`.
- [ ] **Webhooks**: Implement webhook handler to verify payment success (Future Polish).

### 2. Order Notifications (Email) [NEXT PRIORITY]
- [ ] **Service**: Set up email provider (Resend or SendGrid).
- [ ] **Templates**: Design email templates for:
    - [ ] Order Confirmation (sent immediately after payment).
    - [ ] Shipping Update (sent when admin marks order as SHIPPED).
- [ ] **Trigger**: Connect email sending to `createOrder` and `updateOrderStatus` procedures.

### 3. User Reviews & Ratings [SKIPPED FOR NOW]
- [ ] **Database**: Add `Review` model to Prisma schema (relation to Product and User).
- [ ] **API**: Create TRPC procedures for `createReview` and `getReviewsByProduct`.
- [ ] **UI**:
    - [ ] Component to display star rating and comments on `ProductDetails`.
    - [ ] Form for verified buyers to submit reviews.

### 4. Advanced Inventory Management
- [ ] **Stock Control**: Implement optimistic/transactional stock decrements.
- [ ] **Admin**: Add "Low Stock" dashboard widget or badging.
- [ ] **Prevention**: strict backend checks to prevent negative stock.

## 🟡 Priority: Improvements (Should Have)

### 1. Wishlist Enhancements
- [ ] **Back in Stock Alerts**: Allow users to sign up for email alerts on out-of-stock items.
- [ ] **Sharing**: Add ability to share wishlist via link.

### 2. SEO & Metadata
- [ ] **OpenGraph**: Add dynamic `meta` tags for Product Pages (`og:title`, `og:image`, `og:description`).
- [ ] **Sitemap**: Generate dynamic sitemap for all product/category pages.

### 3. Marketing & Promotions
- [ ] **Coupons**:
    - [ ] Add `Coupon` model to database.
    - [ ] Add discount input field in Checkout.
    - [ ] Logic to validate and apply percentage/flat discounts.
- [ ] **Bundles**: Support for "Buy X Get Y" or product bundles.

## 🟢 Priority: Nice to Have

- [ ] **Order Tracking**: Integration with shipping carrier APIs for real-time tracking updates.
- [ ] **User Avatar Upload**: Allow users to upload custom profile pictures.
- [ ] **Social Login**: Expand beyond current providers if needed.
