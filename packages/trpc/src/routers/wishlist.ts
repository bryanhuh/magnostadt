import { z } from 'zod';
import { router, protectedProcedure, publicProcedure } from '../trpc';

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
