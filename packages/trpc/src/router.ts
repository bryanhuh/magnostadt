import { z } from 'zod';
import { prisma } from '@shonen-mart/db';
import { router, publicProcedure, adminProcedure, protectedProcedure } from './trpc';
import { wishlistRouter } from './routers/wishlist';
import { addressRouter } from './routers/address';

// Force rebuild for headerImage schema update
export const appRouter = router({
  wishlist: wishlistRouter,
  address: addressRouter,
  auth: router({
    me: protectedProcedure.query(async ({ ctx }) => {
      return await ctx.prisma.user.findUnique({
        where: { id: ctx.userId },
      });
    }),
    sync: protectedProcedure
      .input(z.object({ email: z.string().optional() }))
      .mutation(async ({ ctx, input }) => {
       const { email } = input;
       
       // 1. Find by ID (Clerk ID)
       const userById = await ctx.prisma.user.findUnique({ where: { id: ctx.userId } });
       if (userById) return userById;

       // 2. If email provided, try to find by email (Account Linking)
       if (email) {
         const userByEmail = await ctx.prisma.user.findUnique({ where: { email } });
         if (userByEmail) {
           // Link the existing record to the new Clerk ID
           // Note: This assumes email ownership is verified by Clerk.
           return await ctx.prisma.user.update({
             where: { email },
             data: { id: ctx.userId }, // Update ID to match Clerk ID
           });
         }
       }

       // 3. Create new user
       return await ctx.prisma.user.create({
         data: {
            id: ctx.userId,
            email: email || `user_${ctx.userId}@placeholder.com`,
         }
       });
    }),
    
    getUsers: adminProcedure.query(async ({ ctx }) => {
      return await ctx.prisma.user.findMany({
        orderBy: { createdAt: 'desc' },
      });
    }),
  }),

  myOrders: protectedProcedure.query(async ({ ctx }) => {
    return await ctx.prisma.order.findMany({
      where: { userId: ctx.userId },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }),

  getProducts: publicProcedure
    .input(
      z.object({
        categoryId: z.string().optional(),
        categoryName: z.string().optional(),
        animeId: z.string().optional(),
        isSale: z.boolean().optional(),
        isPreorder: z.boolean().optional(),
        featured: z.boolean().optional(),
        limit: z.number().optional(),
        orderBy: z.enum(['newest', 'price_asc', 'price_desc']).optional(),
      }).optional()
    )
    .query(async ({ input }) => {
      const { categoryId, categoryName, animeId, isSale, isPreorder, featured, limit, orderBy } = input || {};
      
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
          ...(categoryName ? { category: { name: categoryName } } : {}),
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

  getProductById: publicProcedure
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

  getProductBySlug: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ input }) => {
      // Decode slug just in case, though usually backend handles raw
      return await prisma.product.findUniqueOrThrow({
        where: { slug: input.slug },
        include: {
          category: true,
          anime: true,
        },
      });
    }),

  getRelatedProducts: publicProcedure
    .input(z.object({ productId: z.string() }))
    .query(async ({ input }) => {
      const product = await prisma.product.findUniqueOrThrow({
        where: { id: input.productId },
      });

      return await prisma.product.findMany({
        where: {
          animeId: product.animeId,
          id: { not: input.productId },
        },
        include: {
          category: true,
          anime: true,
        },
      });
    }),

  getCategories: publicProcedure.query(async () => {
    return await prisma.category.findMany();
  }),

  getAnimeSeries: publicProcedure
    .input(z.object({ 
      featured: z.boolean().optional(),
      slug: z.string().optional(),
      names: z.array(z.string()).optional(),
    }).optional())
    .query(async ({ input }) => {
      const { featured, slug, names } = input || {};
      
      const results = await prisma.animeSeries.findMany({
        where: {
          featured,
          slug,
          ...(names ? { name: { in: names } } : {}),
        },
        include: {
          products: {
            take: slug ? undefined : 3, // Fetch all products if querying by slug (Collection Page), else 3 (Preview)
            include: {
              category: true,
              anime: true,
            }
          }
        }
      });

      // If specific names were requested, sort the results to match the order of the input array
      if (names && names.length > 0) {
        return results.sort((a, b) => {
          const indexA = names.indexOf(a.name);
          const indexB = names.indexOf(b.name);
          return indexA - indexB;
        });
      }

      return results;
    }),

  createAnimeSeries: adminProcedure
    .input(z.object({
      name: z.string(),
      description: z.string().optional(),
      coverImage: z.string().optional(),
      featured: z.boolean().optional(),
    }))
    .mutation(async ({ input }) => {
      const slug = input.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
      return await prisma.animeSeries.create({
        data: {
          ...input,
          slug, 
        },
      });
    }),

  updateAnimeSeries: adminProcedure
    .input(z.object({
      id: z.string(),
      data: z.object({
        name: z.string().optional(),
        description: z.string().optional(),
        coverImage: z.string().optional(),
        featured: z.boolean().optional(),
      }),
    }))
    .mutation(async ({ input }) => {
      const { id, data } = input;
      // If setting to featured, optionally unset others if valid? 
      // For now, allow multiple featured or just trust admin to toggle off others.
      // Let's keep it simple: just update the record.
      return await prisma.animeSeries.update({
        where: { id },
        data,
      });
    }),

  deleteAnimeSeries: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      // Optional: Check if products exist and warn/block? 
      // For now, let's just delete. Prisma might throw if relation strict.
      // But typically we might want to set products animeId to null or something if we could.
      // Schema says: `anime AnimeSeries @relation...` usually defaults. 
      // Checking schema: products Product[]
      // Delete series (Cascade delete handles products)
      return await prisma.animeSeries.delete({
        where: { id: input.id },
      });
    }),

  // Admin Procedures
  createProduct: adminProcedure
    .input(
      z.object({
        name: z.string(),
        description: z.string(),
        price: z.number(),
        stock: z.number(),
        categoryId: z.string(),
        animeId: z.string(),
        imageUrl: z.string().optional(),
        images: z.array(z.string()).optional(),
        isSale: z.boolean().optional(),
        salePrice: z.number().optional().nullable(),
        isPreorder: z.boolean().optional(),
        featured: z.boolean().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const slug = input.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
      return await prisma.product.create({
        data: {
          ...input,
          slug: `${slug}-${Date.now()}`, // Ensure uniqueness with timestamp
          price: input.price, 
          salePrice: input.salePrice,
        },
      });
    }),

  updateProduct: adminProcedure
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
          images: z.array(z.string()).optional(),
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

  deleteProduct: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      return await prisma.product.delete({
        where: { id: input.id },
      });
    }),

  getOrders: adminProcedure
    .query(async () => {
      return await prisma.order.findMany({
        orderBy: { createdAt: 'desc' },
        include: { items: { include: { product: true } } }
      });
    }),

  updateOrderStatus: adminProcedure
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

  createOrder: publicProcedure
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
    .mutation(async ({ ctx, input }) => {
      const { items, ...shippingDetails } = input;

      return await prisma.$transaction(async (tx) => {
        let total = 0;
        const orderItemsData = [];

        for (const item of items) {
          const product = await tx.product.findUniqueOrThrow({
            where: { id: item.productId },
          });

          // if (product.stock < item.quantity) { }

          const itemTotal = Number(product.price) * item.quantity;
          total += itemTotal;

          orderItemsData.push({
            productId: item.productId,
            quantity: item.quantity,
            price: product.price, 
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
            userId: ctx.userId || null,
          },
        });

        return order;
      });
    }),

  getOrderById: publicProcedure
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
