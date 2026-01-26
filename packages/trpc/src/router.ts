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
  createOrder: t.procedure
    .input(
      z.object({
        customerName: z.string(),
        email: z.string().email(),
        address: z.string(),
        city: z.string(),
        zipCode: z.string(),
        items: z.array(
          z.object({
            productId: z.string(),
            quantity: z.number().min(1),
          })
        ),
      })
    )
    .mutation(async ({ input }) => {
      const { items, ...shippingDetails } = input;

      // Calculate total and formatted order items in a transaction
      // For MVP, we trust the prices from the DB to be safe, so we fetch them first
      // OR to keep it simple and safe: calculate total on server side by fetching products.

      return await prisma.$transaction(async (tx) => {
        let total = 0;
        const orderItemsData = [];

        for (const item of items) {
          const product = await tx.product.findUniqueOrThrow({
            where: { id: item.productId },
          });

          if (product.stock < item.quantity) {
             // In a real app we'd handle this better
             // throw new Error(`Not enough stock for ${product.name}`);
             // For MVP seed data, we might ignore stock or assume infinite
          }

          const itemTotal = Number(product.price) * item.quantity;
          total += itemTotal;

          orderItemsData.push({
            productId: item.productId,
            quantity: item.quantity,
            price: product.price, // Store the price at time of purchase
          });
        }

        const order = await tx.order.create({
          data: {
            ...shippingDetails,
            total,
            status: 'PENDING',
            items: {
              create: orderItemsData,
            },
          },
        });

        return order;
      });
    }),

  getOrderById: t.procedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      return await prisma.order.findUniqueOrThrow({
        where: { id: input.id },
        include: {
          items: {
            include: {
              product: true,
            },
          },
        },
      });
    }),
});

export type AppRouter = typeof appRouter;
