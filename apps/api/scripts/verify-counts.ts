
import { prisma } from '@shonen-mart/db';

async function main() {
  const seriesCount = await prisma.animeSeries.count();
  const productCount = await prisma.product.count();
  const categoryCount = await prisma.category.count();
  
  console.log('📊 Verification Report:');
  console.log(`   - Anime Series: ${seriesCount}`);
  console.log(`   - Products:     ${productCount}`);
  console.log(`   - Categories:   ${categoryCount}`);
  
  const sampleSeries = await prisma.animeSeries.findFirst({
      include: { products: { take: 3 } }
  });
  
  if (sampleSeries) {
      console.log(`\n🔎 Sample Series: ${sampleSeries.name}`);
      console.log('   Sample Products:');
      sampleSeries.products.forEach(p => console.log(`   - ${p.name} ($${p.price})`));
  }
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect());
