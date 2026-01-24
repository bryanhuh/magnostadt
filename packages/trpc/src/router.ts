import { initTRPC } from '@trpc/server';
import { z } from 'zod';
import { prisma } from '@shonen-mart/db';

const t = initTRPC.create();

export const appRouter = t.router({
  getProducts: t.procedure.query(async () => {
    return await prisma.product.findMany({
      include: {
        category: true,
        anime: true,
      },
    });
  }),
});

export type AppRouter = typeof appRouter;
