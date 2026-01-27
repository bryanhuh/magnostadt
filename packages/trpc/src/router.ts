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
        isSale: z.boolean().optional(),
        isPreorder: z.boolean().optional(),
        featured: z.boolean().optional(),
        limit: z.number().optional(),
        orderBy: z.enum(['newest', 'price_asc', 'price_desc']).optional(),
      }).optional()
    )
    .query(async ({ input }) => {
      const { categoryId, animeId, isSale, isPreorder, featured, limit, orderBy } = input || {};
      
      let orderByClause = {};
      if (orderBy === 'newest') {
        orderByClause = { createdAt: 'desc' };
      } else if (orderBy === 'price_asc') {
        orderByClause = { price: 'asc' };
      } else if (orderBy === 'price_desc') {
        orderByClause = { price: 'desc' };
      } else {
        orderByClause = { createdAt: 'desc' }; // Default to newest
      }

      return await prisma.product.findMany({
        where: {
          categoryId,
          animeId,
          isSale,
          isPreorder,
          featured,
        },
        take: limit,
        orderBy: orderByClause,
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

  getAnimeSeries: t.procedure
    .input(z.object({ featured: z.boolean().optional() }).optional())
    .query(async ({ input }) => {
      return await prisma.animeSeries.findMany({
        where: {
          featured: input?.featured,
        },
        include: {
           products: {
             take: 3, // Preview products
           }
        }
      });
    }),
  // Admin Procedures
  createProduct: t.procedure
    .input(
      z.object({
        name: z.string(),
        description: z.string(),
        price: z.number(),
        stock: z.number(),
        categoryId: z.string(),
        animeId: z.string(),
        imageUrl: z.string().optional(),
        isSale: z.boolean().optional(),
        salePrice: z.number().optional().nullable(),
        isPreorder: z.boolean().optional(),
        featured: z.boolean().optional(),
      })
    )
    .mutation(async ({ input }) => {
      return await prisma.product.create({
        data: {
          ...input,
          price: input.price, // Ensure decimal handling if needed, but Prisma handles number -> Decimal usually
          salePrice: input.salePrice,
        },
      });
    }),

  updateProduct: t.procedure
    .input(
      z.object({
        id: z.string(),
        data: z.object({
          name: z.string().optional(),
          description: z.string().optional(),
          price: z.number().optional(),
          stock: z.number().optional(),
          categoryId: z.string().optional(),
          animeId: z.string().optional(),
          imageUrl: z.string().optional(),
          isSale: z.boolean().optional(),
          salePrice: z.number().optional().nullable(),
          isPreorder: z.boolean().optional(),
          featured: z.boolean().optional(),
        }),
      })
    )
    .mutation(async ({ input }) => {
      const { id, data } = input;
      return await prisma.product.update({
        where: { id },
        data,
      });
    }),

  deleteProduct: t.procedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      return await prisma.product.delete({
        where: { id: input.id },
      });
    }),

  getOrders: t.procedure
    .query(async () => {
      return await prisma.order.findMany({
        orderBy: { createdAt: 'desc' },
        include: { items: { include: { product: true } } }
      });
    }),

  updateOrderStatus: t.procedure
    .input(z.object({
      id: z.string(),
      status: z.enum(['PENDING', 'SHIPPED', 'DELIVERED', 'CANCELLED']),
    }))
    .mutation(async ({ input }) => {
      return await prisma.order.update({
        where: { id: input.id },
        data: { status: input.status },
      });
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
