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

## [0.0.4] - User Profile & Wishlist - 2026-02-04
### Added
- [2026-02-04] **User Dashboard**: Dedicated `/profile` area with Orders, Wishlist, and Addresses.
- [2026-02-04] **Wishlist System**:
    - Database schema for `WishlistItem`.
    - Heart button on Product Cards and Details page.
    - Dedicated `/profile/wishlist` view.
- [2026-02-04] **Address Book**:
    - Full CRUD for managing shipping addresses.
    - Default address selection logic.
- [2026-02-04] **Order History**: Visual history of past orders with status tracking.
- [2026-02-04] **Clerk Integration**: Custom "Wishlist" action in User Button menu.

### Changed
- [2026-02-04] **Schema**: Linked `Order` to `User` model properly.
- [2026-02-04] **Navigation**: User Avatar now redirects to `/profile`.

### Fixed
- [2026-02-04] **Prisma Client**: Resolved missing table error by syncing schema.
- [2026-02-04] **Links**: Fixed "Browse Shop" link in Orders page.

## [0.0.5] - Map Integration & UI Polish - 2026-02-05
### Added
- [2026-02-05] **Interactive Map**: Added `Leaflet` map to Address form with "Use My Location" feature.
- [2026-02-05] **Reverse Geocoding**: Integrated Nominatim API to auto-fill address from map coordinates.

### Changed
- [2026-02-05] **Product UI**: Removed hover scale effects and transition colors from `ProductCard` and `ProductDetails` for a cleaner look.
- [2026-02-05] **Address Form**: Redesigned UI with tiered layout (Map -> Details) and improved card styling.

### Fixed
- [2026-02-05] **Authentication Crash**: Added safety checks for `CLERK_SECRET_KEY` in tRPC context creation.

## [0.0.6] - Visual Identity & UX Polish - 2026-02-06
### Added
- [2026-02-06] **Text-Based Logo**: Replaced image logo with "Akashic District" text using `Libre Bodoni` font for a cleaner, high-end look.
- [2026-02-06] **Redesigned Shop Categories**:
    -   New "Shonen" aesthetic with Black/Yellow high-contrast cards.
    -   Dot pattern backgrounds.
    -   Double-character layout for Figures (Naruto & Sasuke).
- [2026-02-06] **Sales Features**:
    -   Added `isSale` filtering to Product List.
    -   Implemented "View All Sales" button and filtering logic.
    -   Added "Sale" and "Pre-order" badges to Product Cards.

### Changed
- [2026-02-06] **Product Cards**: Stripped `italic` styles for cleaner typography. Added price comparison (original vs sale price).
- [2026-02-06] **Typography**: Removed italic styles from sidebar filters.
- [2026-02-06] **Layout**: Increased Header z-index (`z-[100]`) to fix overlap with filters∏.

### Fixed
- [2026-02-06] **Filtering Logic**: Fixed bug where "All Categories" excluded sale items by default.
- [2026-02-06] **Image Rendering**: Added fallback logic (`imageUrl` -> `images[0]`) to ensure products always display a cover.

### Refactored
- [2026-02-06] **Home Components**: Extracted "Shop Category" section into dedicated `CategoryGrid` component.
- [2026-02-06] **Manga Display**:
    -   Implemented diagonal "fanning" animation for manga covers.
    -   Added "Speed Lines" background pattern (conic gradient).
- [2026-02-06] **Navigation Flow**:
    -   Updated Homepage category links to use URL query params (`/shop?category=...`).

## [0.0.7] - Top Picks & Visual Quality - 2026-02-08
### Added
- [2026-02-08] **Top Picks Redesign**:
    -   Implemented **Marquee Header** with infinite scrolling text ("CURRENT TOP HITS").
    -   Updated layout to full-width 5-column grid.
    -   Added "Ranking Badge" system (Top 1-5).
    -   Added Entrance Animations (Framer Motion) and Confetti effects.
- [2026-02-08] **Image Quality System**:
    -   Created `download_anime_images.ts` script to bypass hotlink protection.
    -   Downloaded high-resolution key visuals for top series (FMAB, Demon Slayer, etc.) to local storage.
    -   Updated database to serve images locally (`/images/anime/...`).

### Changed
- [2026-02-08] **Layout Alignment**:
    -   Aligned `TopPicks` section width with `FlashSale` container (`max-w-[1400px]`).
    -   Refined card visuals (removed rounded corners, added gold borders).

## [0.0.8] - Scraper & Product Enhancements - 2026-02-09
### Added
- [2026-02-09] **Advanced Scraper**:
    -   Updated `seed-all.ts` to scrape individual product detail pages.
    -   Added support for detecting **Pre-Order** status based on "Release Date" or explicit flags.
    -   Implemented **Multiple Image** scraping to populate product galleries.
- [2026-02-09] **Data Integrity**:
    -   Populated `isPreorder` and `images` fields for over 70 products.
    -   Verified correct mapping of release dates.

### Fixed
- [2026-02-09] **Pre-Order Section**: Fixed "No products found" in Home Page Pre-Order section by correctly populating `isPreorder` field.
- [2026-02-09] **Product Gallery**: Resolved missing multiple images in `ProductDetails` by scraping full gallery from source.


## [0.0.9] - Theme Overhaul & Global Dark Mode - 2026-02-09
### Added
- [2026-02-09] **Global Light/Dark Theme**:
    - Implemented `ThemeContext` and floating `ThemeToggle`.
    - Integrated `tailwindcss` dark mode strategy.
    - Added "Akashic District" logo to Admin Sidebar.
- [2026-02-09] **Admin Theme Support**:
    - Refactored all Admin pages (`Dashboard`, `Products`, `Orders`, `Series`) to support both Light and Dark modes.
    - Updated Admin Layout with improved contrast and branding.

### Changed
- [2026-02-09] **Default Theme**:
    - Set application default to **Light Mode** for better initial accessibility.
- [2026-02-09] **Public Pages Refactor**:
    - Updated `HomePage` components (`Showcase`, `TopPicks`, `CategoryGrid`, `SeriesGrid`) to be theme-aware.
    - Refactored `ProductList`, `ProductDetails`, and `CartDrawer` for consistent theming.
    - **Category Grid**: Adjusted text colors and backgrounds for legibility in both modes.
    - **Series Grid**: Fixed background color issues in Dark Mode.
    - **Collections Page**: Added full Dark Mode support.

### Fixed
- [2026-02-09] **Theme Toggle**: Resolved issue where toggle button was not persisting state or updating DOM correctly.
- [2026-02-09] **Visual Bugs**:
    - Fixed "FIGURES STATUES" text visibility in Light Mode.
    - Fixed "Manga & Books" card background contrast.
    - Fixed `ProductDetails` Sale badge styling.
