import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixAdmin() {
  const email = 'breelagrama@gmail.com';
  console.log(`Fixing admin user (from DB package): ${email}`);

  const user = await prisma.user.upsert({
    where: { email },
    update: { role: 'ADMIN' },
    create: {
      email,
      role: 'ADMIN',
      id: `admin_${Date.now()}`,
    },
  });

  console.log('User upserted:', user);
}

fixAdmin()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
