
import { prisma } from '@shonen-mart/db';
import * as cheerio from 'cheerio';

const BASE_URL = 'https://store.aniplexusa.com';
const SHOWS_URL = `${BASE_URL}/shows/`;

// Helper to determine category based on product title
async function getCategory(title: string) {
  const t = title.toLowerCase();
  let categoryName = 'Collectibles'; // Default

  if (t.includes('figure') || t.includes('statue') || t.includes('nendoroid') || t.includes('scale')) {
    categoryName = 'Figures';
  } else if (t.includes('manga') || t.includes('volume') || t.includes('book') || t.includes('artworks')) {
    categoryName = 'Manga';
  } else if (t.includes('shirt') || t.includes('hoodie') || t.includes('jacket') || t.includes('apparel')) {
    categoryName = 'Apparel';
  } else if (t.includes('keychain') || t.includes('charm') || t.includes('cushion') || t.includes('stand') || t.includes('strap') || t.includes('accessories')) {
    categoryName = 'Accessories';
  } else if (t.includes('blu-ray') || t.includes('dvd') || t.includes('box set') || t.includes('cd') || t.includes('soundtrack')) {
    categoryName = 'Blu-ray & DVD';
  }

  return await prisma.category.upsert({
    where: { name: categoryName },
    update: {},
    create: { name: categoryName },
  });
}

async function scrapeShow(showName: string, showUrl: string, coverImageUrl?: string) {
  console.log(`\n📺 Scraping Series: "${showName}" (${showUrl})...`);
  
  try {
    const series = await prisma.animeSeries.upsert({
        where: { name: showName },
        update: {
            // Update cover image if provided
            ...(coverImageUrl ? { coverImage: coverImageUrl } : {})
        },
        create: {
            name: showName,
            description: `Official merchandise for ${showName}`,
            featured: false,
            coverImage: coverImageUrl
        }
    });

    const response = await fetch(showUrl);
    if (!response.ok) throw new Error(`Failed to fetch ${showUrl}: ${response.statusText}`);
    
    const html = await response.text();
    const $ = cheerio.load(html);
    const productCards = $('.iportfolio');

    console.log(`   Found ${productCards.length} products.`);
    
    let addedCount = 0;

    for (const card of productCards) {
        const $card = $(card);
        const title = $card.find('.portfolio-desc h3').text().trim();
        const href = $card.find('.portfolio-image a').attr('href');
        let imgSrc = $card.find('.portfolio-image img').attr('src');
        
        // Price extraction
        const priceText = $card.find('.item-price').text().trim();
        const priceMatches = priceText.match(/\$[\d,]+\.?\d*/g);
        
        let price = 0;
        let isSale = false;
        let salePrice = null;

        if (priceMatches && priceMatches.length > 0) {
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

        // Image URL normalization
        if (imgSrc && !imgSrc.startsWith('http')) {
             if (imgSrc.startsWith('/')) {
                 imgSrc = `${BASE_URL}${imgSrc}`;
             } else {
                 // Often relative to current path, but showUrl ends in /, so simple append usually works
                 // But safer to check. Generally images are /assets/... or similar?
                 // Let's assume Aniplex uses relative or root-relative.
                 // Inspecting site: <img src="images/..." > relative to /shows/name/
                 imgSrc = `${showUrl}${imgSrc}`;
             }
        }

        if (!title || price === 0) continue;

        // Ensure category
        const category = await getCategory(title);

        const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

        // Upsert Product
        await prisma.product.upsert({
            where: { slug }, // Use slug as unique identifier for scrape
            update: {
                price,
                stock: 20, // Restock if re-scraping
                imageUrl: imgSrc,
                isSale,
                salePrice: salePrice ?? undefined,
            },
            create: {
                name: title,
                slug,
                description: href ? `External Link: ${href}` : 'Imported from Aniplex Store',
                price,
                imageUrl: imgSrc,
                stock: 20,
                animeId: series.id,
                categoryId: category.id,
                isSale,
                salePrice: salePrice ?? undefined,
            }
        });
        addedCount++;
    }
    console.log(`   ✅ Added/Updated ${addedCount} items.`);

  } catch (error) {
      console.error(`   ❌ Error scraping ${showName}:`, error);
  }
}

async function main() {
  console.log('🚀 Starting Global Content Scraper...');
  
  try {
    const response = await fetch(SHOWS_URL);
    if (!response.ok) throw new Error(`Failed to fetch ${SHOWS_URL}`);
    
    const html = await response.text();
    const $ = cheerio.load(html);
    
    const showLinks: {name: string, url: string, img?: string}[] = [];

    // Select all show links. Based on inspection: .iportfolio .portfolio-image a
    $('.iportfolio').each((_, el) => {
        const $el = $(el);
        // Sometimes the name is in h3 in description
        // Inspection showed: .portfolio-desc h3 a  OR  just text in h3
        let name = $el.find('.portfolio-desc h3').text().trim();
        let url = $el.find('.portfolio-image a').attr('href');
        let img = $el.find('.portfolio-image img').attr('src');
        
        if (name && url) {
            if (!url.startsWith('http')) {
                url = `${BASE_URL}${url}`;
            }
            // Normalize image url if relative
            if (img && !img.startsWith('http')) {
                if (img.startsWith('/')) {
                    img = `${BASE_URL}${img}`;
                } else {
                    img = `${BASE_URL}/shows/${img}`; // Usually shows/images/...
                }
            }
            showLinks.push({ name, url, img });
        }
    });

    console.log(`Found ${showLinks.length} shows to scrape.`);
    console.log('-------------------------------------------');

    for (const show of showLinks) {
        await scrapeShow(show.name, show.url, show.img);
        // Small delay to be nice
        await new Promise(r => setTimeout(r, 500));
    }

    console.log('\n✨ Global Scraper Completed Successfully!');

  } catch (error) {
      console.error('Fatal scrape error:', error);
  } finally {
      await prisma.$disconnect();
  }
}

main();
