import { z } from 'zod';
import { prisma } from '@shonen-mart/db';
import { router, publicProcedure, adminProcedure, protectedProcedure } from './trpc';
import { TRPCError } from '@trpc/server';
import { wishlistRouter } from './routers/wishlist';
import { addressRouter } from './routers/address';
import { stockAlertRouter } from './routers/stockAlert';

// Force rebuild for headerImage schema update
export const appRouter = router({
  wishlist: wishlistRouter,
  address: addressRouter,
  stockAlert: stockAlertRouter,
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
        search: z.string().optional(),
      }).optional()
    )
    .query(async ({ input }) => {
      const { categoryId, categoryName, animeId, isSale, isPreorder, featured, limit, orderBy, search } = input || {};
      
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
          ...(search ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { description: { contains: search, mode: 'insensitive' } },
            ]
          } : {}),
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

      // Check current stock before update (for back-in-stock alerts)
      const currentProduct = await prisma.product.findUnique({
        where: { id },
        select: { stock: true },
      });

      const updatedProduct = await prisma.product.update({
        where: { id },
        data,
        include: { anime: true, category: true },
      });

      // Trigger back-in-stock alerts if stock went from 0 to > 0
      if (currentProduct && currentProduct.stock === 0 && data.stock && data.stock > 0) {
        const alerts = await prisma.stockAlert.findMany({
          where: { productId: id, notified: false },
        });

        if (alerts.length > 0) {
          const { sendBackInStockAlert } = await import('./services/email');

          // Send emails & mark as notified (fire and forget)
          Promise.all(
            alerts.map(async (alert) => {
              await sendBackInStockAlert(
                {
                  name: updatedProduct.name,
                  imageUrl: updatedProduct.imageUrl,
                  slug: updatedProduct.slug,
                  price: Number(updatedProduct.price),
                },
                alert.email
              );
              await prisma.stockAlert.update({
                where: { id: alert.id },
                data: { notified: true },
              });
            })
          ).catch((err) => console.error('Error sending back-in-stock alerts:', err));
        }
      }

      return updatedProduct;
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
      const order = await prisma.order.update({
        where: { id: input.id },
        data: { status: input.status },
        include: { items: { include: { product: true } }, user: true },
      });

      // Restore stock when an order is cancelled
      if (input.status === 'CANCELLED') {
        await prisma.$transaction(async (tx) => {
          for (const item of order.items) {
            await tx.product.update({
              where: { id: item.productId },
              data: { stock: { increment: item.quantity } },
            });
          }
        });
      }

      if (order.email) {
          const { sendShippingUpdate, sendDeliveredUpdate, sendCancelledUpdate } = await import('./services/email');
          
          if (input.status === 'SHIPPED') {
              await sendShippingUpdate(order, order.email);
          } else if (input.status === 'DELIVERED') {
              await sendDeliveredUpdate(order, order.email);
          } else if (input.status === 'CANCELLED') {
              await sendCancelledUpdate(order, order.email);
          }
      }

      return order;
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

      const order = await prisma.$transaction(async (tx) => {
        let total = 0;
        const orderItemsData = [];
        const stripeLineItems = [];

        for (const item of items) {
          const product = await tx.product.findUnique({
            where: { id: item.productId },
          });

          if (!product) {
            throw new TRPCError({
              code: 'BAD_REQUEST',
              message: `Product with ID ${item.productId} not found. Please clear your cart and try again.`,
            });
          }

          if (product.stock < item.quantity) {
            throw new TRPCError({
              code: 'BAD_REQUEST',
              message: `"${product.name}" only has ${product.stock} left in stock.`,
            });
          }

          // Atomic stock decrement
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: { decrement: item.quantity } },
          });

          const itemTotal = Number(product.price) * item.quantity;
          total += itemTotal;

          orderItemsData.push({
            productId: item.productId,
            quantity: item.quantity,
            price: product.price, 
          });

          stripeLineItems.push({
             name: product.name,
             description: product.description || undefined,
             images: product.imageUrl ? [product.imageUrl] : undefined,
             amount: Number(product.price) * 100, // Stripe expects cents
             quantity: item.quantity,
             currency: 'usd',
          });
        }
        
        // Add shipping (Flat rate $10 for now, matching frontend)
        // Ideally this should be passed in or calculated centrally
        const shippingCost = 10;
        total += shippingCost;
        stripeLineItems.push({
            name: 'Shipping',
            amount: shippingCost * 100,
            quantity: 1,
            currency: 'usd',
        });

        const newOrder = await tx.order.create({
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

        return { newOrder, stripeLineItems };
      });
      
      // Import dynamically to avoid circular deps if any, or just standard import at top
      const { createCheckoutSession } = await import('./services/stripe');

      // Create Stripe Session
      const session = await createCheckoutSession({
          items: order.stripeLineItems,
          orderId: order.newOrder.id,
          customerEmail: input.email,
          successUrl: `${process.env.VITE_APP_URL || 'http://localhost:5173'}/order/${order.newOrder.id}?success=true`,
          cancelUrl: `${process.env.VITE_APP_URL || 'http://localhost:5173'}/checkout?canceled=true`,
      });
      
      // Update Order with Session ID
      await prisma.order.update({
          where: { id: order.newOrder.id },
          data: { stripeSessionId: session.id },
      });

      // Send Order Confirmation Email (Async/Best Effort)
      // Note: In production, this should ideally happen in a webhook after payment is confirmed.
      // But for this MVP, we send it upon order creation (pending payment) or could wait.
      // Actually, plan says "sent immediately after payment" usually, but without webhooks we can send "Order Placed"
      // Let's send it now as "Order Received" to verify functionality.
      // We need to fetch the full order with product details to match the template props
      const fullOrder = await prisma.order.findUnique({
          where: { id: order.newOrder.id },
          include: { items: { include: { product: true } } }
      });
      
      if (fullOrder) {
          // Import from local service
          const { sendOrderConfirmation } = await import('./services/email'); 
          await sendOrderConfirmation(fullOrder, input.email);
      }

      return { orderId: order.newOrder.id, checkoutUrl: session.url };
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
  // Admin: Get low stock products (stock <= 10)
  getLowStockProducts: adminProcedure
    .query(async () => {
      return await prisma.product.findMany({
        where: { stock: { lte: 10 } },
        orderBy: { stock: 'asc' },
        include: {
          category: true,
          anime: true,
        },
      });
    }),

  // Admin: Get inventory stats for dashboard
  getInventoryStats: adminProcedure
    .query(async () => {
      const [totalProducts, outOfStock, lowStock, totalOrders] = await Promise.all([
        prisma.product.count(),
        prisma.product.count({ where: { stock: 0 } }),
        prisma.product.count({ where: { stock: { gt: 0, lte: 10 } } }),
        prisma.order.count(),
      ]);

      return { totalProducts, outOfStock, lowStock, totalOrders };
    }),
});

export type AppRouter = typeof appRouter;
