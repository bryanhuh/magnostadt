/**
 * Vitest setup file for @shonen-mart/trpc tests.
 *
 * Replaces the @shonen-mart/db module with a stub that avoids instantiating a
 * real PrismaClient (which requires `prisma generate` and a live DB).
 *
 * The exported `dbMock` object is the singleton that all production code in
 * the trpc package calls when it does `import { prisma } from '@shonen-mart/db'`.
 * Tests that exercise code paths going through the module-level prisma import
 * (e.g. updateProduct, createOrder) must configure dbMock directly.
 *
 * Tests that inject prisma via ctx use their own per-test MockPrisma instances.
 */
import { vi } from 'vitest';

function makePrismaModel() {
  return {
    findUnique: vi.fn(),
    findUniqueOrThrow: vi.fn(),
    findMany: vi.fn(),
    findFirst: vi.fn(),
    create: vi.fn(),
    createMany: vi.fn(),
    update: vi.fn(),
    updateMany: vi.fn(),
    upsert: vi.fn(),
    delete: vi.fn(),
    deleteMany: vi.fn(),
    count: vi.fn(),
    aggregate: vi.fn(),
    groupBy: vi.fn(),
  };
}

// Shared singleton — exported so individual test files can configure it
export const dbMock = {
  $transaction: vi.fn(),
  product: makePrismaModel(),
  order: makePrismaModel(),
  orderItem: makePrismaModel(),
  user: makePrismaModel(),
  category: makePrismaModel(),
  animeSeries: makePrismaModel(),
  wishlistItem: makePrismaModel(),
  stockAlert: makePrismaModel(),
  address: makePrismaModel(),
};

// Default $transaction behaviour: run the callback against the dbMock itself
dbMock.$transaction.mockImplementation(async (cb: (tx: typeof dbMock) => unknown) => {
  return cb(dbMock);
});

vi.mock('@shonen-mart/db', () => ({
  prisma: dbMock,
  Role: { USER: 'USER', ADMIN: 'ADMIN' },
}));
