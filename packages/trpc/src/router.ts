import { initTRPC } from '@trpc/server';
import { z } from 'zod';
import { prisma } from '@shonen-mart/db';

const t = initTRPC.create();

export const appRouter = t.router({
  getProducts: t.procedure
    .input(
      z.object({
        categoryId: z.string().optional(),
        animeId: z.string().optional(),
      }).optional()
    )
    .query(async ({ input }) => {
      const { categoryId, animeId } = input || {};
      return await prisma.product.findMany({
        where: {
          categoryId,
          animeId,
        },
        include: {
          category: true,
          anime: true,
        },
      });
    }),

  getProductById: t.procedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      return await prisma.product.findUniqueOrThrow({
        where: { id: input.id },
        include: {
          category: true,
          anime: true,
        },
      });
    }),

  getCategories: t.procedure.query(async () => {
    return await prisma.category.findMany();
  }),

  getAnimeSeries: t.procedure.query(async () => {
    return await prisma.animeSeries.findMany();
  }),
});

export type AppRouter = typeof appRouter;
