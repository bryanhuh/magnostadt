
import { prisma } from '@shonen-mart/db';

async function main() {
  const featured = await prisma.animeSeries.findMany({
    where: { featured: true },
    include: { products: true }
  });

  console.log('Featured Anime Count:', featured.length);
  featured.forEach(f => {
    console.log(`- ${f.name} (ID: ${f.id})`);
    console.log(`  Products: ${f.products.length}`);
    f.products.forEach(p => console.log(`    - ${p.name}`));
  });
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
