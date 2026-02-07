import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import { Readable } from 'stream';
import { finished } from 'stream/promises';

const prisma = new PrismaClient();

const OUTPUT_DIR = path.join(process.cwd(), 'apps/web/public/images/anime');

// Ensure directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Helper to download image
async function downloadImage(url: string, filepath: string) {
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Referer': 'https://www.anime-planet.com/',
    }
  });

  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status} ${res.statusText}`);

  const fileStream = fs.createWriteStream(filepath);
  // @ts-ignore - native fetch response body is a readable stream in node/bun
  await finished(Readable.fromWeb(res.body!).pipe(fileStream));
}

async function main() {
  console.log('⬇️  Starting anime image download...');

  const updates = [
    {
      name: 'FULLMETAL ALCHEMIST: BROTHERHOOD',
      // FMAB High Res
      url: 'https://cdn.anime-planet.com/anime/primary/fullmetal-alchemist-brotherhood-1.jpg?t=1625770353', 
      filename: 'fmab.jpg'
    },
    {
      name: 'Demon Slayer: Kimetsu no Yaiba',
      // Demon Slayer High Res
      url: 'https://cdn.anime-planet.com/anime/primary/demon-slayer-kimetsu-no-yaiba-movie-infinity-castle-part-1-1.webp?t=1753752988', 
      filename: 'demon-slayer.webp'
    },
    {
      name: 'BOCCHI THE ROCK!',
      // Bocchi High Res
      url: 'https://cdn.anime-planet.com/anime/primary/bocchi-the-rock-1.webp?t=1671405672', 
      filename: 'bocchi.webp'
    },
    {
      name: 'Fate/Grand Order',
      // FGO Babylonia
      url: 'https://cdn.anime-planet.com/anime/primary/fate-grand-order-absolute-demonic-front-babylonia-1.jpg?t=1625784961b', 
      filename: 'fgo.jpg'
    },
    {
      name: 'Sword Art Online',
      // SAO High Res
      url: 'https://cdn.anime-planet.com/anime/primary/sword-art-online-1.jpg?t=1625775113f', 
      filename: 'sao.jpg'
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
        const localPath = `/images/anime/${update.filename}`;
        const absPath = path.join(OUTPUT_DIR, update.filename);

        console.log(`Downloading ${update.name}...`);
        await downloadImage(update.url, absPath);
        
        await prisma.animeSeries.update({
          where: { id: anime.id },
          data: { coverImage: localPath },
        });
        console.log(`✅ Updated ${update.name} -> ${localPath}`);
      } else {
        console.warn(`⚠️  Could not find anime: ${update.name}`);
      }

    } catch (error) {
      console.error(`❌ Failed to process ${update.name}:`, error);
    }
  }

  console.log('🏁 Anime image download and update completed.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
