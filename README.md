# Shonen-Mart

A professional anime e-commerce store built with the B3 Stack (Bun, Hono, tRPC).

## Stack
- **Runtime**: Bun
- **Backend**: Hono
- **Frontend**: React (Vite) + Tailwind + Shadcn UI
- **Database**: Prisma v6 + PostgreSQL (Neon.tech)
- **Type Safety**: tRPC

## Project Structure
- `apps/api`: Hono backend
- `apps/web`: React frontend
- `packages/db`: Prisma schema and client
- `packages/trpc`: Shared tRPC router

## Getting Started
1. Install dependencies: `bun install`
2. Set up environment variables in `packages/db/.env`
3. Generate Prisma client: `bun run db:generate`
4. Start development server: `bun dev`
