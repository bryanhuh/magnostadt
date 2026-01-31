
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const name = "Multi-Image Test Figure";
  let product = await prisma.product.findFirst({
    where: { name }
  });

  if (!product) {
    console.log("Creating product...");
    // Get a category and anime first
    const category = await prisma.category.findFirst();
    const anime = await prisma.animeSeries.findFirst();

    if (!category || !anime) {
      console.error("Missing category or anime to link to.");
      return;
    }

    product = await prisma.product.create({
      data: {
        name,
        description: "Test figure with multiple images.",
        price: 100,
        stock: 10,
        categoryId: category.id,
        animeId: anime.id,
        imageUrl: "https://store.aniplexusa.com/on/demandware.static/-/Sites-store-aniplex-catalog/default/dw83748231/images/conofig/conofig-giyu-tomioka-01.jpg",
        images: [
           "https://store.aniplexusa.com/on/demandware.static/-/Sites-store-aniplex-catalog/default/dwf22849e7/images/conofig/conofig-giyu-tomioka-02.jpg",
           "https://store.aniplexusa.com/on/demandware.static/-/Sites-store-aniplex-catalog/default/dw1ea553f1/images/conofig/conofig-giyu-tomioka-03.jpg"
        ]
      }
    });
  }

  console.log(`Product ID: ${product.id}`);
  console.log(`Images: ${JSON.stringify(product.images)}`);
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
