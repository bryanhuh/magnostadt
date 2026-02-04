import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';

export const addressRouter = router({
  create: protectedProcedure
    .input(
      z.object({
        name: z.string(),
        street: z.string(),
        city: z.string(),
        state: z.string(),
        zipCode: z.string(),
        country: z.string().default('US'),
        isDefault: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // If setting as default, unset other defaults first
      if (input.isDefault) {
        await ctx.prisma.address.updateMany({
          where: { userId: ctx.userId, isDefault: true },
          data: { isDefault: false },
        });
      }
      
      // Check if it's the first address, make it default automatically if so
      const count = await ctx.prisma.address.count({ where: { userId: ctx.userId } });
      const isDefault = count === 0 ? true : input.isDefault;

      return await ctx.prisma.address.create({
        data: {
          ...input,
          isDefault,
          userId: ctx.userId,
        },
      });
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        data: z.object({
          name: z.string().optional(),
          street: z.string().optional(),
          city: z.string().optional(),
          state: z.string().optional(),
          zipCode: z.string().optional(),
          country: z.string().optional(),
          isDefault: z.boolean().optional(),
        }),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, data } = input;

      // Verify ownership
      const address = await ctx.prisma.address.findUnique({
        where: { id },
      });

      if (!address || address.userId !== ctx.userId) {
        throw new Error('Address not found or unauthorized');
      }

      if (data.isDefault) {
        await ctx.prisma.address.updateMany({
          where: { userId: ctx.userId, isDefault: true },
          data: { isDefault: false },
        });
      }

      return await ctx.prisma.address.update({
        where: { id },
        data,
      });
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const address = await ctx.prisma.address.findUnique({
        where: { id: input.id },
      });

      if (!address || address.userId !== ctx.userId) {
        throw new Error('Address not found or unauthorized');
      }

      return await ctx.prisma.address.delete({
        where: { id: input.id },
      });
    }),

  getAll: protectedProcedure.query(async ({ ctx }) => {
    return await ctx.prisma.address.findMany({
      where: { userId: ctx.userId },
      orderBy: { isDefault: 'desc' }, // Defaults first
    });
  }),
});
