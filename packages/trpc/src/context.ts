import { verifyToken } from '@clerk/backend';
import type { FetchCreateContextFnOptions } from '@trpc/server/adapters/fetch';
import { prisma } from '@shonen-mart/db';

export async function createContext({ req }: FetchCreateContextFnOptions) {
  const authHeader = req.headers.get('authorization');
  let userId: string | null = null;
  let role: 'USER' | 'ADMIN' = 'USER';

  if (authHeader) {
    try {
      const token = authHeader.startsWith('Bearer ') 
        ? authHeader.split(' ')[1] 
        : authHeader;

      if (token) {
        // verifyToken matches the token against the secret key
        const verified = await verifyToken(token, {
          secretKey: process.env.CLERK_SECRET_KEY,
        });
        
        userId = verified.sub;
        
        if (userId) {
            const user = await prisma.user.findUnique({
                where: { id: userId },
                select: { role: true },
            });
            if (user) {
                role = user.role;
            }
        }
      }
    } catch (err) {
      console.error("Auth error", err);
    }
  }

  return {
    userId,
    role,
    prisma,
  };
}

export type Context = Awaited<ReturnType<typeof createContext>>;
