import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🖼️  Starting anime image update...');

  const updates = [
    {
      name: 'FULLMETAL ALCHEMIST: BROTHERHOOD',
      coverImage: 'https://cdn.anime-planet.com/anime/primary/fullmetal-alchemist-brotherhood-1.jpg?t=1625770353', // FMAB High Res
    },
    {
      name: 'Demon Slayer: Kimetsu no Yaiba',
      coverImage: 'https://cdn.anime-planet.com/anime/primary/demon-slayer-kimetsu-no-yaiba-movie-infinity-castle-part-1-1.webp?t=1753752988', // Demon Slayer High Res
    },
    {
      name: 'BOCCHI THE ROCK!',
      coverImage: 'https://cdn.anime-planet.com/anime/primary/bocchi-the-rock-1.webp?t=1671405672', // Bocchi High Res
    },
    {
      name: 'Fate/Grand Order',
      coverImage: 'https://cdn.anime-planet.com/anime/primary/fate-grand-order-absolute-demonic-front-babylonia-1.jpg?t=1625784961b', // FGO Babylonia (Best guess for high res)
    },
    {
      name: 'Sword Art Online',
      coverImage: 'https://cdn.anime-planet.com/anime/primary/sword-art-online-1.jpg?t=1625775113f', // SAO High Res
    }
  ];

  for (const update of updates) {
    try {
      // Try to find the anime by name (fuzzy or exact)
      // The name in DB might differ slightly (e.g. 'Naruto Shippuden' vs 'Naruto'), 
      // but the TopPicks component queries these exact strings, so they MUST exist with these names.
      // However, TopPicks uses `names: [...]` in trpc call.
      
      const anime = await prisma.animeSeries.findFirst({
        where: {
          name: {
            equals: update.name,
            mode: 'insensitive', // Handle case differences
          }
        }
      });

      if (anime) {
        await prisma.animeSeries.update({
          where: { id: anime.id },
          data: { coverImage: update.coverImage },
        });
        console.log(`✅ Updated ${update.name}`);
      } else {
        console.warn(`⚠️  Could not find anime: ${update.name}`);
        // Optional: Create it if it doesn't exist? 
        // For now, assume it exists as the UI is displaying it (albeit with bad images).
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
