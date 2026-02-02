
import { prisma } from '@shonen-mart/db';

async function main() {
  console.log('🧪 Verifying Cascade Delete...');

  // 1. Create a dummy series
  const series = await prisma.animeSeries.create({
    data: {
      name: 'Test Series for Deletion',
      description: 'This should be deleted',
    }
  });
  console.log(`   ✅ Created Series: ${series.name} (${series.id})`);

  // 2. Create a dummy category (if needed, but we likely have one)
  let category = await prisma.category.findFirst();
  if (!category) {
      category = await prisma.category.create({ data: { name: 'Test Category' } });
  }

  // 3. Create a dummy product linked to the series
  const product = await prisma.product.create({
    data: {
      name: 'Test Product for Deletion',
      slug: `test-product-delete-${Date.now()}`,
      description: 'This should be deleted automatically',
      price: 10,
      animeId: series.id,
      categoryId: category.id
    }
  });
  console.log(`   ✅ Created Product: ${product.name} (${product.id})`);

  // 4. Delete the series
  await prisma.animeSeries.delete({
    where: { id: series.id }
  });
  console.log(`   🗑️ Deleted Series`);

  // 5. Verify product is gone
  const checkProduct = await prisma.product.findUnique({
    where: { id: product.id }
  });

  if (!checkProduct) {
    console.log('   ✅ SUCCESS: Product was automatically deleted!');
  } else {
    console.error('   ❌ FAILURE: Product still exists!');
    process.exit(1);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => await prisma.$disconnect());
