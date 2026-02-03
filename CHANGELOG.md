# Changelog

All notable changes to this project will be documented in this file.

## [0.0.1] - MVP Launch - 2026-01-24
### Added
- [2026-01-24] **Project Structure**: Initialized Bun Workspaces (`apps/api`, `apps/web`, `packages/db`, `packages/trpc`).
- [2026-01-24] **Database**: Switched to Neon.tech (PostgreSQL). Defined schema for Product, Category, AnimeSeries, Order.
- [2026-01-24] **Seeding**: Created `seed.ts` with mock data.
- [2026-01-24] **Routing**: Implemented client-side routing with `react-router-dom`.
- [2026-01-25] **Product Features**:
    - Product Details Page (`/product/:id`).
    - Filtering by Category and Series.
    - tRPC integration for filtering.
- [2026-01-26] **Shopping Cart**:
    - `CartDrawer` component.
    - `zustand` state management with persistence.
- [2026-01-27] **Checkout & Orders**:
    - Secure Checkout Flow.
    - Order/OrderItem models.
    - Order Confirmation page.
    - `createOrder` mutation.
- [2026-01-27] **Integration**:
    - PostHog Analytics (Add to Cart, Checkout).
    - Sentry Error Tracking.
    - Toast notifications (`sonner`).

## [0.0.2] - Admin, Auth, & UI Overhaul - 2026-01-31
### Added
- [2026-01-28] **UI Overhaul**: Redesigned Homepage with "Crunchyroll Store" aesthetic (Showcase, Hero, Glassmorphism).
- [2026-01-28] **Admin Dashboard**:
    - Created secure `/admin` area with `AdminLayout`.
    - Dashboard for Product, Order, and Series management.
    - RBAC protection (Role-Based Access Control).
- [2026-01-29] **Authentication**:
    - Integrated Clerk (Sign In/Sign Up).
    - Added `User` model and `auth.sync` procedure.
- [2026-01-30] **Multi-Image Support**:
    - Updated schema for `images` array.
    - Updated Admin `ProductForm` for dynamic image uploads.
    - Added Gallery View to `ProductDetails`.
- [2026-01-31] **Series Management**:
    - Dynamic "Featured Series" system.
    - Admin CRUD for Series (`/admin/series`).
- [2026-01-31] **Global Scraper**:
    - Developed `seed-all.ts` to scrape 69+ series and 300+ products from Aniplex.

### Changed
- [2026-01-30] **Theme**: Fully migrated to **Light Theme** (gray-50/gray-900).
- [2026-01-31] **Routing**: Moved product list to `/shop`.
- [2026-01-31] **SEO**: Implemented `slug` based routing for Products.

### Fixed
- [2026-01-31] **Auth Loop**: Fixed `/auth-callback` infinite redirection.
- [2026-01-31] **Crash**: Resolved crash on `/admin/customers`.
- [2026-01-31] **Cascade Delete**: Fixed Foreign Key constraints when deleting Series.

## [0.0.3] - Series Collection & Fixes - 2026-02-03
### Added
- [2026-02-03] **Collections**: Implemented `/collection/:slug` page with hero header and product grid.
- [2026-02-03] **Top Picks**: Created dedicated `TopPicks` component for homepage.
- [2026-02-03] **SEO**: Added `slug` to `AnimeSeries` schema and updated all links.

### Changed
- [2026-02-03] **Showcase**: Restored "Cinematic" design logic (v4.5) to prioritize `headerImage`.
- [2026-02-03] **API**: Updated `getAnimeSeries` to support slugs and include product relations (`category`, `anime`).
- [2026-02-03] **Navigation**: Refactored Header to 3-column layout and simplified links (Collection, Products).

### Fixed
- [2026-02-03] **Regressions**: Fixed missing header image in Showcase.
- [2026-02-03] **Crashes**: Resolved `ProductCard` crash on Collection Page.
- [2026-02-03] **Admin Access**: Fixed permissions for admin user.
