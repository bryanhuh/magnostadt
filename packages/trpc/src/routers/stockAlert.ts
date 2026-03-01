import { z } from 'zod';
import { router, protectedProcedure } from '../trpc.js';

export const stockAlertRouter = router({
  subscribe: protectedProcedure
    .input(z.object({ productId: z.string(), email: z.string().email() }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.prisma.stockAlert.upsert({
        where: {
          userId_productId: {
            userId: ctx.userId,
            productId: input.productId,
          },
        },
        update: {
          email: input.email,
          notified: false,
        },
        create: {
          userId: ctx.userId,
          productId: input.productId,
          email: input.email,
        },
      });
    }),

  unsubscribe: protectedProcedure
    .input(z.object({ productId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.prisma.stockAlert.delete({
        where: {
          userId_productId: {
            userId: ctx.userId,
            productId: input.productId,
          },
        },
      });
    }),

  checkStatus: protectedProcedure
    .input(z.object({ productId: z.string() }))
    .query(async ({ ctx, input }) => {
      const alert = await ctx.prisma.stockAlert.findUnique({
        where: {
          userId_productId: {
            userId: ctx.userId,
            productId: input.productId,
          },
        },
      });
      return !!alert && !alert.notified;
    }),

  // Issue #1 fix: batch endpoint for out-of-stock cards. ProductList passes all
  // out-of-stock product IDs in one call instead of each ProductCard issuing its
  // own individual checkStatus query.
  checkStatusBatch: protectedProcedure
    .input(z.object({ productIds: z.array(z.string()) }))
    .query(async ({ ctx, input }) => {
      if (input.productIds.length === 0) return {};

      const alerts = await ctx.prisma.stockAlert.findMany({
        where: {
          userId: ctx.userId,
          productId: { in: input.productIds },
          notified: false,
        },
        select: { productId: true },
      });

      // Return a map of productId → boolean (true = active alert exists)
      const result: Record<string, boolean> = {};
      for (const id of input.productIds) result[id] = false;
      for (const alert of alerts) result[alert.productId] = true;
      return result;
    }),

  getMyAlerts: protectedProcedure.query(async ({ ctx }) => {
    return await ctx.prisma.stockAlert.findMany({
      where: {
        userId: ctx.userId,
        notified: false,
      },
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
  }),
});
