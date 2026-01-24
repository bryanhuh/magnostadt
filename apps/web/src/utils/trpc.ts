import { createTRPCReact } from '@trpc/react-query';
import type { AppRouter } from '@shonen-mart/trpc';

export const trpc = createTRPCReact<AppRouter>();
