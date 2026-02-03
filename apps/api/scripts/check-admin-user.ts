import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkAdmin() {
  const email = 'breelagrama@gmail.com';
  console.log(`Checking user with email: ${email}`);

  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    console.log('User NOT FOUND in database.');
  } else {
    console.log('User FOUND:', user);
    console.log('Role:', user.role);
    if (user.role !== 'ADMIN') {
      console.log('User is present but NOT ADMIN.');
    }
  }
}

checkAdmin()
  .catch((e) => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
