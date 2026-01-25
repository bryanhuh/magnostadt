# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]
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
