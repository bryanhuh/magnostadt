
import { prisma } from '@shonen-mart/db';
import * as cheerio from 'cheerio';

const TARGET_URL = 'https://store.aniplexusa.com/sao/';

async function main() {
  console.log(`Starting scrape of ${TARGET_URL}...`);

  try {
    const response = await fetch(TARGET_URL);
    if (!response.ok) {
        throw new Error(`Failed to fetch ${TARGET_URL}: ${response.statusText}`);
    }
    const html = await response.text();
    const $ = cheerio.load(html);

    console.log('Page loaded, parsing products...');

    // 1. Ensure Series Exists
    const series = await prisma.animeSeries.upsert({
      where: { name: 'Sword Art Online' },
      update: {},
      create: {
        name: 'Sword Art Online',
        description: 'Sword Art Online products and merchandise',
        featured: true,
      },
    });

    console.log(`Series verified: ${series.name} (${series.id})`);

    // 2. Ensure Category Exists (We'll use a generic "Collectibles" for now if not sure)
    const category = await prisma.category.upsert({
      where: { name: 'Collectibles' },
      update: {},
      create: {
        name: 'Collectibles',
      },
    });
    
    console.log(`Category verified: ${category.name} (${category.id})`);

    const productCards = $('.iportfolio');
    console.log(`Found ${productCards.length} product cards.`);

    let addedCount = 0;

    for (const card of productCards) {
      const $card = $(card);
      
      const title = $card.find('.portfolio-desc h3').text().trim();
      const href = $card.find('.portfolio-image a').attr('href');
      let imgSrc = $card.find('.portfolio-image img').attr('src');
      
      // Price extraction is tricky, sometimes it has del, sometimes just text
      // We'll take the whole text and try to find a price pattern
      const priceText = $card.find('.item-price').text().trim();
      // Regex to find price at the end (current price) or just the first price found
      // Usually sale price is last.
      // E.g. "$100 $80" or "$50"
      const priceMatches = priceText.match(/\$[\d,]+\.?\d*/g);
      
      let price = 0;
      let isSale = false;
      let salePrice = null;

      if (priceMatches && priceMatches.length > 0) {
        // If multiple matches, usually first is original, last is sale.
        // But let's verify logic. If del exists, parsing might be different.
        // Simple logic: Take the last match as the current active price.
        const currentPriceStr = priceMatches[priceMatches.length - 1].replace(/[$,]/g, '');
        const currentPriceVal = parseFloat(currentPriceStr);
        
        if (priceMatches.length > 1) {
             const originalPriceStr = priceMatches[0].replace(/[$,]/g, '');
             price = parseFloat(originalPriceStr);
             salePrice = currentPriceVal;
             isSale = true;
        } else {
            price = currentPriceVal;
        }
      }

      // Handle relative URLs for images
      if (imgSrc && !imgSrc.startsWith('http')) {
        // Check if it's absolute path from root or relative
        if (imgSrc.startsWith('/')) {
             imgSrc = `https://store.aniplexusa.com${imgSrc}`;
        } else {
             imgSrc = `https://store.aniplexusa.com/sao/${imgSrc}`;
        }
      }

      // Generate slug from title
      const slug = title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');

      if (!title || price === 0) {
        console.log(`Skipping invalid card: Title="${title}", Price="${priceText}"`);
        continue;
      }

      // Upsert product
      const existing = await prisma.product.findFirst({
        where: {
            name: title,
            animeId: series.id
        }
      });

      if (existing) {
        console.log(`Updated: ${title}`);
        await prisma.product.update({
            where: { id: existing.id },
            data: {
                price: price, 
                imageUrl: imgSrc,
                isSale,
                salePrice: salePrice ?? undefined,
                slug, // Update slug just in case
            }
        });
      } else {
        await prisma.product.create({
            data: {
                name: title,
                description: href ? `External Link: ${href}` : 'Imported from Aniplex Store',
                price: price,
                imageUrl: imgSrc,
                stock: 10,
                animeId: series.id,
                categoryId: category.id,
                isSale,
                salePrice: salePrice ?? undefined,
                slug,
            }
        });
        console.log(`Created: ${title} (slug: ${slug})`);
        addedCount++;
      }
    }

    console.log(`\nSuccess! Added ${addedCount} new products.`);

  } catch (error) {
    console.error('Error scraping:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
