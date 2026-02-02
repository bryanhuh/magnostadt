
import { prisma } from '@shonen-mart/db';

async function main() {
  const series = await prisma.animeSeries.findFirst({
    where: { name: 'anohana' } // or featured one
  });

  console.log('Series:', series?.name);
  console.log('Cover Image:', series?.coverImage);
  console.log('Header Image:', series?.headerImage);
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
