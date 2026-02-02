
import { prisma } from '@shonen-mart/db';

async function main() {
  const animeWithProducts = await prisma.animeSeries.findFirst({
    where: {
      products: {
        some: {} // At least one product
      }
    },
    include: {
      _count: {
        select: { products: true }
      }
    }
  });

  if (animeWithProducts) {
    console.log(`Found candidate: ${animeWithProducts.name} (ID: ${animeWithProducts.id}) with ${animeWithProducts._count.products} products.`);
    
    // Update it to be featured
    await prisma.animeSeries.updateMany({ data: { featured: false } });
    await prisma.animeSeries.update({
      where: { id: animeWithProducts.id },
      data: { featured: true }
    });
    console.log('Updated to FEATURED.');
  } else {
    console.log('No anime with products found.');
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
