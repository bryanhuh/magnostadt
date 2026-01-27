# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Added
- **UI Overhaul**: Implemented a new premium Homepage design inspired by Crunchyroll Store.
- **New Sections**: 
  - Showcase Hero Section (featured series).
  - Sale Products Carousel.
  - Pre-order Showcase & Items.
  - Shop by Series.
  - Latest Drops & Popular Series.
- **Components**: Added `ProductCarousel`, `SeriesCarousel`, `SectionHeader`, and `Showcase` components.
- **Backend**: 
  - Updated `Product` and `AnimeSeries` schema with `isSale`, `isPreorder`, `featured`, etc.
  - Enhanced `getProducts` tRPC query with filters and sorting.
  - Added `getFeaturedAnime` query capability.

### Changed
- **Routing**: Moved original product list to `/shop` and set `HomePage` as the default route `/`.

## [0.0.1] - 2026-01-24
### Changed
- Switched database provider to Neon.tech (PostgreSQL) for native IPv4 support and ease of use.
- Downgraded Prisma to stable v6.x to resolve configuration breaking changes in v7.
- Updated Tailwind CSS configuration to support v4.0 (installed `@tailwindcss/postcss`).

### Added
- Initial project structure with Bun Workspaces (`apps/api`, `apps/web`, `packages/db`, `packages/trpc`).
- Prisma schema for e-commerce MVP (Product, Category, AnimeSeries, Order).
- **Database Seeding**: Created `seed.ts` with mock data (Naruto, One Piece, etc.).
- **Documentation**: Added `docs/PROJECT_STRUCTURE.md` and `docs/MVP_CHECKLIST.md`.
- Architecture documentation and implementation plan.
- **Phase 2 Features**:
    - implemented `react-router-dom` for client-side routing.
    - Added Product Details page (`/product/:id`).
    - Added Category and Anime Series filtering to Product List.
    - Enhanced tRPC router with filtering and single-product queries.
- **Phase 3 Features**:
    - Added Shopping Cart functionality with `zustand` for state management.
    - Implemented `CartDrawer` component for managing items.
    - Integrated "Add to Cart" flow in Product List and Details pages.
    - Added persistence (cart items survive page refreshes).
- **Phase 4 Features**:
    - Implemented secure Checkout Flow with shipping form.
    - Added `Order` and `OrderItem` models with shipping details suitable for MVP.
    - Created `OrderConfirmation` page with order summary.
    - Connected Frontend to Backend via `createOrder` tRPC mutation.
- **Phase 5 Features**:
    - **Analytics**: Integrated PostHog for event tracking (Add to Cart, Checkout, **Order Completion**).
    - **Error Tracking**: Integrated Sentry for frontend error monitoring.
    - **UI Polish**: Added Skeleton loaders for smoother initial load.
    - **UX**: Added Toast notifications (`sonner`) for immediate feedback on user actions.
    - **Fixes**: Resolved TSConfig collisions in `apps/web` build.
