import { appRouter } from '../../router';
import { wishlistRouter } from '../../routers/wishlist';
import { stockAlertRouter } from '../../routers/stockAlert';
import { router } from '../../trpc';
import type { MockPrisma } from './mockPrisma';

export type ContextOptions = {
  userId?: string | null;
  role?: 'USER' | 'ADMIN';
  prisma: MockPrisma;
};

/**
 * Build a minimal tRPC Context from the given options.
 * This bypasses Clerk/JWT verification entirely.
 */
export function buildContext(opts: ContextOptions) {
  return {
    userId: opts.userId ?? null,
    role: opts.role ?? 'USER',
    prisma: opts.prisma as any, // cast — PrismaClient shape matches
  };
}

// Isolated sub-routers — lets wishlist / stockAlert tests work without
// spinning up the full appRouter (and all its top-level imports).
const wishlistOnlyRouter = router({ wishlist: wishlistRouter });
const stockAlertOnlyRouter = router({ stockAlert: stockAlertRouter });

/**
 * Create a direct caller for the full appRouter.
 * In tRPC v11 the API is `router.createCaller(ctx)`.
 */
export function createMainCaller(opts: ContextOptions) {
  return appRouter.createCaller(buildContext(opts));
}

export function createWishlistCaller(opts: ContextOptions) {
  return wishlistOnlyRouter.createCaller(buildContext(opts));
}

export function createStockAlertCaller(opts: ContextOptions) {
  return stockAlertOnlyRouter.createCaller(buildContext(opts));
}
