
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔄 Updating anime cover images (using provided local files)...');

  const updates = [
    {
      name: 'Fate/Zero',
      path: '/images/anime/fate-zero.jpg'
    },
    {
      name: 'Fate/stay night [Unlimited Blade Works]',
      path: '/images/anime/fate-ubw.jpg'
    },
    {
      name: 'Fate/stay night [Heaven’s Feel]',
      path: '/images/anime/fate-feel.jpg'
    },
    {
      name: 'Fate/Grand Order - Absolute Demonic Front: Babylonia',
      path: '/images/anime/fate-order.jpg'
    },
    {
      name: 'Fate/Apocrypha',
      path: '/images/anime/fate-apocrypha.jpg'
    }
  ];

  for (const update of updates) {
    try {
      const anime = await prisma.animeSeries.findFirst({
        where: {
          name: {
             equals: update.name,
             mode: 'insensitive',
          }
        }
      });

      if (anime) {
        await prisma.animeSeries.update({
          where: { id: anime.id },
          data: { coverImage: update.path },
        });
        console.log(`✅ Updated ${anime.name} -> ${update.path}`);
      } else {
        console.warn(`⚠️  Could not find anime matching: ${update.name}`);
      }
    } catch (error) {
      console.error(`❌ Failed to update ${update.name}:`, error);
    }
  }

  console.log('🏁 Anime image update completed.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
