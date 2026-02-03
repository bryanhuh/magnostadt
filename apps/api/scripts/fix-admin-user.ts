import { prisma } from '@shonen-mart/db';

async function fixAdmin() {
  const email = 'breelagrama@gmail.com';
  console.log(`Fixing admin user: ${email}`);

  const user = await prisma.user.upsert({
    where: { email },
    update: { role: 'ADMIN' },
    create: {
      email,
      role: 'ADMIN',
      id: `admin_${Date.now()}`, // Temporary ID if creating new, usually AuthCallback syncs this
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
