import { z } from 'zod';
import { router, protectedProcedure, publicProcedure } from '../trpc.js';

export const wishlistRouter = router({
  add: protectedProcedure
    .input(z.object({ productId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.prisma.wishlistItem.upsert({
        where: {
          userId_productId: {
            userId: ctx.userId,
            productId: input.productId,
          },
        },
        create: {
          userId: ctx.userId,
          productId: input.productId,
        },
        update: {},
      });
    }),

  remove: protectedProcedure
    .input(z.object({ productId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.prisma.wishlistItem.delete({
        where: {
          userId_productId: {
            userId: ctx.userId,
            productId: input.productId,
          },
        },
      });
    }),

  getMine: protectedProcedure.query(async ({ ctx }) => {
    return await ctx.prisma.wishlistItem.findMany({
      where: { userId: ctx.userId },
      include: {
        product: {
          include: {
            anime: true,
            category: true,
          }
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }),

  checkStatus: protectedProcedure
    .input(z.object({ productId: z.string() }))
    .query(async ({ ctx, input }) => {
      const item = await ctx.prisma.wishlistItem.findUnique({
        where: {
          userId_productId: {
            userId: ctx.userId,
            productId: input.productId,
          },
        },
      });
      return !!item;
    }),

  // Issue #1 fix: batch endpoint replaces N individual checkStatus calls fired
  // by each ProductCard. One query fetches all wishlist membership for the
  // given product IDs and returns a Set-friendly lookup map.
  checkStatusBatch: protectedProcedure
    .input(z.object({ productIds: z.array(z.string()) }))
    .query(async ({ ctx, input }) => {
      if (input.productIds.length === 0) return {};

      const items = await ctx.prisma.wishlistItem.findMany({
        where: {
          userId: ctx.userId,
          productId: { in: input.productIds },
        },
        select: { productId: true },
      });

      // Return a plain object keyed by productId → boolean so the client can
      // do an O(1) lookup per card without extra computation.
      const result: Record<string, boolean> = {};
      for (const id of input.productIds) result[id] = false;
      for (const item of items) result[item.productId] = true;
      return result;
    }),

  // --- Wishlist Sharing ---
  getShareToken: protectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.prisma.user.findUnique({
      where: { id: ctx.userId },
      select: { shareToken: true },
    });

    if (user?.shareToken) {
      return user.shareToken;
    }

    // Generate a new share token if one doesn't exist
    const updated = await ctx.prisma.user.update({
      where: { id: ctx.userId },
      data: { shareToken: crypto.randomUUID().replace(/-/g, '').slice(0, 16) },
      select: { shareToken: true },
    });

    return updated.shareToken!;
  }),

  getSharedWishlist: publicProcedure
    .input(z.object({ token: z.string() }))
    .query(async ({ ctx, input }) => {
      const user = await ctx.prisma.user.findUnique({
        where: { shareToken: input.token },
        select: { id: true, email: true },
      });

      if (!user) {
        return null;
      }

      const items = await ctx.prisma.wishlistItem.findMany({
        where: { userId: user.id },
        include: {
          product: {
            include: {
              anime: true,
              category: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      return {
        ownerName: user.email.split('@')[0],
        items,
      };
    }),
});
