# Project Structure & File Guide

This document explains the file structure of **Shonen-Mart**, a monorepo built with the **B3 Stack** (Bun, Hono, tRPC). Since you are new to Bun and monorepos, this guide details exactly what each file and folder does.

## 📂 Root Directory
The root contains configuration that applies to the entire project (the "monorepo").

- **`package.json`**: The project's brain.
    - `workspaces`: Tells Bun that `apps/*` and `packages/*` contain separate sub-projects.
    - `scripts`: Commands like `bun dev` that triggers scripts in the sub-projects simultaneously.
- **`bun.lockb`**: (Binary file) Bun's version of `package-lock.json`. It locks your dependencies to specific versions for consistency.
- **`README.md`**: The entry point documentation for developers.
- **`CHANGELOG.md`**: A record of all changes made to the project.
- **`docs/`**: Folder containing project documentation (like this file).

---

## 📂 packages/ (Shared Logic)
Code in this folder is shared between your API and your Website. This prevents code duplication.

### `packages/db/`
Handles everything related to the database.
- **`package.json`**: Defines this folder as a package named `@shonen-mart/db`.
- **`prisma/schema.prisma`**: The "Blueprint" of your database. It defines your tables (Product, Order, etc.) and their relationships.
- **`.env`**: Stores the secret `DATABASE_URL` connection string. **Never commit this to GitHub.**
- **`index.ts`**:
    - Exports the `prisma` client so other apps can use `import { prisma } from '@shonen-mart/db'`.
    - Manages a single database connection instance (Singleton pattern) to prevent "too many connections" errors during development.

### `packages/trpc/`
The "bridge" between your Backend (API) and Frontend (Web).
- **`package.json`**: Defines this package as `@shonen-mart/trpc`.
- **`src/router.ts`**:
    - Defines the **API Contract**.
    - `appRouter`: A collection of all API endpoints (procedures).
    - `getProducts`: A specific endpoint that fetches data from the DB.
    - Exports `AppRouter` type, which allows the frontend to know *exactly* what data calls are available without importing the actual server code.

---

## 📂 apps/ (Runnables)
These are the actual applications that run on a server or in a browser.

### `apps/api/` (The Backend)
A separate server that handles logic and database requests.
- **`package.json`**: Defines dependencies like `hono` and `@shonen-mart/trpc`.
- **`src/index.ts`**:
    - The entry point for the Hono server.
    - `trpcServer`: A middleware that handles incoming requests at `/trpc/*` and forwards them to the logic defined in `packages/trpc`.
    - `cors()`: Allows your frontend (running on a different port) to talk to this backend.

### `apps/web/` (The Frontend)
The React application that users see.
- **`vite.config.ts`**: Configuration for Vite (the build tool that bundles your React code).
- **`tailwind.config.js` & `postcss.config.js`**: Configuration for the styling system.
- **`src/`**:
    - **`App.tsx`**: The main component. It sets up the `trpc` provider so the app can fetch data.
    - **`utils/trpc.ts`**: A helper file that creates the typed tRPC client hooks (like `useQuery`).
    - **`components/ProductList.tsx`**: A specific UI component that:
        - Uses `trpc.getProducts.useQuery()` to fetch data.
        - Using that hook gives you `data`, `isLoading`, and `error` states automatically.
        - Renders the UI using Tailwind CSS classes.

---

## 🔄 How it all connects
1. **Database**: `packages/db` talks to Neon (PostgreSQL).
2. **Logic**: `packages/trpc` defines *how* to talk to the database.
3. **Server**: `apps/api` runs the logic from `packages/trpc`.
4. **Browser**: `apps/web` asks `apps/api` for data using types from `packages/trpc`.

---

## 🛠️ tRPC Setup Guide (Step-by-Step)
Here is how we set up tRPC to work across the repository:

### Step 1: Create the Shared Package (`packages/trpc`)
We created a dedicated `packages/trpc` folder so that **both** the API (backend) and Web (frontend) can share the Type Definitions (`AppRouter`).
- **`package.json`**: Added `@trpc/server` and `@shonen-mart/db` as dependencies.
- **`src/router.ts`**: Initialized `t.router` and defined our procedures.

### Step 2: Define Procedures in the Router
In `packages/trpc/src/router.ts`, we defined a procedure called `getProducts`.
```typescript
export const appRouter = t.router({
  getProducts: t.procedure.query(async () => {
    // Fetches data using the shared Prisma client
    return await prisma.product.findMany(...);
  }),
});
// Crucial: We export the TYPE of the router, not the router itself
export type AppRouter = typeof appRouter;
```

### Step 3: Connect tRPC to Hono (`apps/api`)
We need a server to actually execute the router logic.
- In `apps/api/src/index.ts`, we imported `trpcServer` adapter from `@hono/trpc-server`.
- We mounted it at `/trpc/*`.
```typescript
app.use(
  '/trpc/*',
  trpcServer({ router: appRouter }) // Connects the HTTP requests to our router logic
);
```

### Step 4: Connect the Frontend (`apps/web`)
We need the React app to be able to "call" these functions.
- **`src/utils/trpc.ts`**: Created a helper using `createTRPCReact<AppRouter>()`. This is where the magic happens—it imports the **Type** from Step 2 to give you autocomplete.
- **`src/App.tsx`**: Wrapped the app in `trpc.Provider` and `QueryClientProvider` to manage the fetching state.
- **`src/components/ProductList.tsx`**: Used the hook `trpc.getProducts.useQuery()`.
