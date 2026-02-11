import { prisma } from '../../../packages/db/index';

async function updateBocchiHeader() {
  const animeName = 'BOCCHI THE ROCK!';
  const newHeaderImage = '/images/anime/bocchi.jpeg';

  console.log(`Updating header image for: ${animeName}`);

  try {
    const updatedAnime = await prisma.animeSeries.update({
      where: { name: animeName },
      data: { headerImage: newHeaderImage },
    });

    console.log('✅ Successfully updated header image!');
    console.log('New Record:', updatedAnime);
  } catch (error) {
    console.error('❌ Failed to update header image:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateBocchiHeader();
