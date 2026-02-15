import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';

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
