import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // 1. Clean up existing data (optional, but good for dev)
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.animeSeries.deleteMany();

  // 2. Create Categories
  const figures = await prisma.category.create({ data: { name: 'Figures' } });
  const manga = await prisma.category.create({ data: { name: 'Manga' } });
  const apparel = await prisma.category.create({ data: { name: 'Apparel' } });
  const accessories = await prisma.category.create({ data: { name: 'Accessories' } });

  // 3. Create Anime Series
  const naruto = await prisma.animeSeries.create({ data: { name: 'Naruto Shippuden', slug: 'naruto-shippuden' } });
  const onePiece = await prisma.animeSeries.create({ data: { name: 'One Piece', slug: 'one-piece' } });
  const jjk = await prisma.animeSeries.create({ data: { name: 'Jujutsu Kaisen', slug: 'jujutsu-kaisen' } });
  const demonSlayer = await prisma.animeSeries.create({ data: { name: 'Demon Slayer', slug: 'demon-slayer' } });
  const spyXFamily = await prisma.animeSeries.create({ data: { name: 'Spy x Family', slug: 'spy-x-family' } });

  // 4. Create Products
  await prisma.product.createMany({
    data: [
      {
        name: 'Naruto Uzumaki "Rasengan" Scale Figure',
        slug: 'naruto-uzumaki-rasengan-scale-figure',
        description: 'High-quality 1/7 scale figure of Naruto using his signature Rasengan technique. Features dynamic wind effects and detailed base.',
        price: 129.99,
        stock: 50,
        categoryId: figures.id,
        animeId: naruto.id,
        imageUrl: 'https://images.unsplash.com/photo-1590959651373-a3db0f38a961?auto=format&fit=crop&w=800&q=80' // Placeholder
      },
      {
        name: 'Monkey D. Luffy "Gear 5" Statue',
        slug: 'monkey-d-luffy-gear-5-statue',
        description: 'The Warrior of Liberation! Massive stunning statue of Luffy in his Gear 5 form.',
        price: 249.99,
        stock: 10,
        categoryId: figures.id,
        animeId: onePiece.id,
        imageUrl: 'https://images.unsplash.com/photo-1621416894569-0f39ed31d247?auto=format&fit=crop&w=800&q=80'
      },
      {
        name: 'Jujutsu Kaisen Vol. 1',
        slug: 'jujutsu-kaisen-vol-1',
        description: 'The beginning of the Culling Game arc! Follow Itadori Yuji into the world of curses.',
        price: 9.99,
        stock: 100,
        categoryId: manga.id,
        animeId: jjk.id,
        imageUrl: 'https://images.unsplash.com/photo-1612036782180-6f0b6cd846fe?auto=format&fit=crop&w=800&q=80'
      },
      {
        name: 'Demon Slayer: Kimetsu no Yaiba Box Set',
        slug: 'demon-slayer-kimetsu-no-yaiba-box-set',
        description: 'Complete manga box set featuring the entire Demon Slayer saga. Includes exclusive art book.',
        price: 199.99,
        stock: 25,
        categoryId: manga.id,
        animeId: demonSlayer.id,
        imageUrl: 'https://images.unsplash.com/photo-1544376798-89aa6b82c6cd?auto=format&fit=crop&w=800&q=80'
      },
      {
        name: 'Anya Forger "Waku Waku" T-Shirt',
        slug: 'anya-forger-waku-waku-t-shirt',
        description: 'Cute 100% cotton t-shirt featuring Anya Forger iconic expression.',
        price: 24.99,
        stock: 200,
        categoryId: apparel.id,
        animeId: spyXFamily.id,
        imageUrl: 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?auto=format&fit=crop&w=800&q=80'
      },
       {
        name: 'Hidden Leaf Village Headband',
        slug: 'hidden-leaf-village-headband',
        description: 'Authentic metallic headband worn by shinobi of Konoha.',
        price: 14.99,
        stock: 500,
        categoryId: accessories.id,
        animeId: naruto.id,
        imageUrl: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=800&q=80'
      }
    ],
  });

  // 5. Create Admin User
  // We pre-seed the admin with a placeholder ID. 
  // When the real user logs in, the `sync` mutation will link them by email and update the ID.
  const adminEmail = 'breelagrama@gmail.com';
  await prisma.user.upsert({
    where: { email: adminEmail },
    update: { role: 'ADMIN' },
    create: {
      id: `preseeded_admin_${Date.now()}`, // Temporary ID
      email: adminEmail,
      role: 'ADMIN',
    },
  });
  console.log(`👤 Created/Updated Admin User: ${adminEmail}`);

  console.log('✅ Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
