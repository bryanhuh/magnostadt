# Shonen-Mart MVP Checklist

## 🟢 Phase 1: Foundation (Completed)
- [x] **Monorepo Setup**: Bun Workspaces, Shared Types.
- [x] **Database**: Postgres (Neon) connected with Prisma Schema.
- [x] **API Core**: Hono server with tRPC + CORS.
- [x] **Frontend Core**: React + Vite + Tailwind v4.
- [x] **Type Safety**: End-to-end tRPC integration.

## 🟡 Phase 2: Data & Core Browsing (Next)
- [ ] **Seed Script**: Populate database with dummy anime products, categories, and series.
- [ ] **Enhanced Product List**:
    - [ ] Display real images.
    - [ ] Filter by Category (Manga, Figures).
    - [ ] Filter by Anime Series (Naruto, One Piece).
- [ ] **Product Details Page**:
    - [ ] Dynamic route `/product/:id`.
    - [ ] `getProductById` tRPC procedure.

## 🟠 Phase 3: Shopping Cart
- [ ] **Cart State**: Global state management (Zustand or React Context) for the cart.
- [ ] **Add to Cart**: Connect the "Add to Cart" button.
- [ ] **Cart Drawer/Page**: View selected items, update quantities, remove items.

## 🔴 Phase 4: Checkout & Orders
- [ ] **Create Order API**: mutation `createOrder` to save order to DB.
- [ ] **Checkout UI**: Simple form (Shipping info + "Pay").
- [ ] **Order Confirmation**: Success page showing Order ID.

## 🔵 Phase 5: Polish & Analytics
- [ ] **PostHog**: Integrate analytics.
- [ ] **Sentry**: Error tracking.
- [ ] **UI Polish**: Loading skeletons, toasts (notifications) for actions.
