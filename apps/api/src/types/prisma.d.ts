// Ambient type declarations for @prisma/client
// Provides fallback types when prisma generate hasn't run (e.g. on Vercel)
// When the generated client IS available, TypeScript merges/augments these

declare module '@prisma/client' {
    export class PrismaClient {
        constructor(options?: any);
        [model: string]: any;
        $transaction<T>(fn: (tx: any) => Promise<T>): Promise<T>;
        $transaction<T>(args: any[]): Promise<T>;
    }

    export namespace Prisma {
        type TransactionClient = Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>;
    }
}
