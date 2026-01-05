import { PrismaClient } from '@prisma/client';

const prismaClientSingleton = () => {
  return new PrismaClient();
};

declare global {
  var prisma: undefined | ReturnType<typeof prismaClientSingleton>;
}

// Lazy initialization - only create client when first accessed
// This prevents build-time errors when DATABASE_URL isn't available
const getDb = () => {
  if (!globalThis.prisma) {
    globalThis.prisma = prismaClientSingleton();
  }
  return globalThis.prisma;
};

// Export a proxy that lazily initializes the client
const db = new Proxy({} as PrismaClient, {
  get(target, prop) {
    const client = getDb();
    return Reflect.get(client, prop);
  },
});

export default db;
