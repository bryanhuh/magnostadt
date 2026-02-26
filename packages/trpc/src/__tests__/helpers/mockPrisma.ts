import { vi } from 'vitest';

/**
 * Builds a deeply-nested mock of the PrismaClient.
 * Each model is an object whose methods are vi.fn() stubs.
 * Tests can override individual methods with mockResolvedValueOnce / mockRejectedValueOnce.
 */
function makeModelMock() {
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

export function createMockPrisma() {
  const $transaction = vi.fn();
  const mock = {
    $transaction,
    product: makeModelMock(),
    order: makeModelMock(),
    orderItem: makeModelMock(),
    user: makeModelMock(),
    category: makeModelMock(),
    animeSeries: makeModelMock(),
    wishlistItem: makeModelMock(),
    stockAlert: makeModelMock(),
    address: makeModelMock(),
  };

  // Default $transaction implementation: run the callback with the mock itself
  $transaction.mockImplementation(async (callback: (tx: typeof mock) => unknown) => {
    return callback(mock);
  });

  return mock;
}

export type MockPrisma = ReturnType<typeof createMockPrisma>;
