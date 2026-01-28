import { initTRPC, TRPCError } from '@trpc/server';
import type { Context } from './context';

const t = initTRPC.context<Context>().create();

export const router = t.router;
export const middleware = t.middleware;
export const publicProcedure = t.procedure;

const isAuthed = t.middleware(({ ctx, next }) => {
  if (!ctx.userId) {
    throw new TRPCError({ code: 'UNAUTHORIZED' });
  }
  return next({
    ctx: {
      userId: ctx.userId,
      role: ctx.role,
    },
  });
});

export const protectedProcedure = t.procedure.use(isAuthed);

const isAdmin = t.middleware(({ ctx, next }) => {
  if (!ctx.userId || ctx.role !== 'ADMIN') {
    throw new TRPCError({ code: 'FORBIDDEN' });
  }
  return next({
    ctx: {
      userId: ctx.userId,
      role: 'ADMIN',
    },
  });
});

export const adminProcedure = t.procedure.use(isAdmin);
