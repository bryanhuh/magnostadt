import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';

export const wishlistRouter = router({
  add: protectedProcedure
    .input(z.object({ productId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.prisma.wishlistItem.create({
        data: {
          userId: ctx.userId,
          productId: input.productId,
        },
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
});
