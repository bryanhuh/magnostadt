
import { prisma } from '../../../packages/db/index';
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
    const response = await fetch(showUrl);
    if (!response.ok) throw new Error(`Failed to fetch ${showUrl}: ${response.statusText}`);
    
    const html = await response.text();
    const $ = cheerio.load(html);

    // Extract Header Image
    // Browser findings: section#slider .container img
    let headerImage = $('section#slider .container img').attr('src');
    if (headerImage && !headerImage.startsWith('http')) {
       // It seems likely relative to the show URL or base
       // Aniplex usually puts images relative to the page 
       headerImage = `${showUrl}${headerImage}`; 
    }

    const slug = showName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

    const series = await prisma.animeSeries.upsert({
        where: { name: showName }, // We can still match by name to update, but we need to ensure slug is set
        update: {
            slug, // Ensure slug is set if missing
            // Update cover image if provided
            ...(coverImageUrl ? { coverImage: coverImageUrl } : {}),
            ...(headerImage ? { headerImage } : {})
        },
        create: {
            name: showName,
            slug,
            description: `Official merchandise for ${showName}`,
            featured: false,
            coverImage: coverImageUrl,
            headerImage
        }
    });

    const productCards = $('.iportfolio');

    console.log(`   Found ${productCards.length} products to process.`);
    console.log('   (This helps populate images and pre-order status by visiting each page...)');
    
    let addedCount = 0;

    // Use a regular for loop to await efficiently
    for (const card of productCards) {
        const $card = $(card);
        const title = $card.find('.portfolio-desc h3').text().trim();
        const href = $card.find('.portfolio-image a').attr('href');
        let listImgSrc = $card.find('.portfolio-image img').attr('src');
        
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

        if (!title || price === 0) continue;

        // Construct Full Product URL
        let productUrl = href || '';
        if (productUrl && !productUrl.startsWith('http')) {
            productUrl = `${BASE_URL}${productUrl}`; // Usually absolute relative to root or base
            // NOTE: href often comes as "/show/product/" so base url append is correct
            // But we'll double check if it doesn't start with /
            if (!href?.startsWith('/')) {
                 productUrl = `${showUrl}${href}`;
            }
        }

        // --- FETCH DETAIL PAGE ---
        let description = href ? `External Link: ${href}` : 'Imported from Aniplex Store';
        let images: string[] = [];
        let isPreorder = false;
        let releaseDate: Date | null = null;
        let detailImgSrc: string | null = null;

        if (productUrl) {
            try {
                // console.log(`      ...fetching detail: ${title}`);
                const detailRes = await fetch(productUrl);
                if (detailRes.ok) {
                    const detailHtml = await detailRes.text();
                    const $detail = cheerio.load(detailHtml);

                    // 1. Scrape Description
                    // Try .product-info or .description or just body text if needed
                    // Based on inspection, Aniplex might not have a clean description block easily.
                    // We'll leave the default description for now or try to grab a paragraph.
                    
                    // 2. Scrape Images
                    // Selector based on test: .slide img
                    // Some might be thumbnails in a different container, but .slide img usually covers the main slider
                    const scrapedImages = new Set<string>();
                    
                    // Get main images
                    $detail('img').each((_, el) => {
                         const src = $detail(el).attr('src');
                         // Heuristic to find gallery images: usually inside a slider or gallery container
                         // or just large images. 
                         // Refined strategy: check for 'slide' class in parents
                         const parentClass = $detail(el).parent().attr('class') || '';
                         const grandParentClass = $detail(el).parent().parent().attr('class') || '';
                         
                         if (parentClass.includes('slide') || grandParentClass.includes('slide')) {
                             if (src) scrapedImages.add(src);
                         }
                    });

                    // Convert to array and resolve URLs
                    images = Array.from(scrapedImages).map(img => {
                        if (!img.startsWith('http')) {
                            // Resolve relative
                            // If starts with /, relative to domain
                            if (img.startsWith('/')) return `${BASE_URL}${img}`;
                            // Else relative to page? Aniplex is tricky.
                            // Usually assets are absolute or root relative.
                            // Let's assume relative to current URL directory if not root
                            const urlObj = new URL(productUrl);
                            const path = urlObj.pathname.substring(0, urlObj.pathname.lastIndexOf('/') + 1);
                             return `${urlObj.origin}${path}${img}`; 
                        }
                        return img;
                    }).filter(url => !url.includes('pixel') && !url.includes('logo'));

                    if (images.length > 0) {
                        detailImgSrc = images[0]; // Use first gallery image as main if available
                    }

                    // 3. Scrape Pre-Order / Release Date
                    const bodyText = $detail('body').text();
                    
                    // Check for "Pre-Order" text
                    // Sometimes status is explicitly "Pre-order found"
                    if (bodyText.toLowerCase().includes('pre-order')) {
                        isPreorder = true;
                    }

                    // Check Release Date
                    const releaseDateMatch = bodyText.match(/Release Date:\s*([0-9\/]+)/i);
                    if (releaseDateMatch) {
                        const dateStr = releaseDateMatch[1];
                        const date = new Date(dateStr);
                        if (!isNaN(date.getTime())) {
                            releaseDate = date;
                            // If release date is in the future, it is a preorder
                            if (date > new Date()) {
                                isPreorder = true;
                            }
                        }
                    }

                }
            } catch (err) {
                console.warn(`      Failed to scrape detail page for ${title}:`, err);
            }
        }

        // Fallback for image
        let finalImgSrc = detailImgSrc || listImgSrc;
        if (finalImgSrc && !finalImgSrc.startsWith('http')) {
             if (finalImgSrc.startsWith('/')) {
                 finalImgSrc = `${BASE_URL}${finalImgSrc}`;
             } else {
                 finalImgSrc = `${showUrl}${finalImgSrc}`;
             }
        }

        // Normalize images array to absolute URLs if not already (logic above handled most, but duplicate check)
        // Also ensure main image is in images list?
        if (finalImgSrc && !images.includes(finalImgSrc)) {
            images.unshift(finalImgSrc);
        }

        // Ensure category
        const category = await getCategory(title);
        const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

        // Upsert Product
        await prisma.product.upsert({
            where: { slug }, // Use slug as unique identifier for scrape
            update: {
                price,
                stock: 20, // Restock if re-scraping
                imageUrl: finalImgSrc,
                isSale,
                salePrice: salePrice ?? undefined,
                images: images,      // Update images
                isPreorder: isPreorder, // Update pre-order status
                releaseDate: releaseDate, // Update release date
            },
            create: {
                name: title,
                slug,
                description: description,
                price,
                imageUrl: finalImgSrc,
                stock: 20,
                animeId: series.id,
                categoryId: category.id,
                isSale,
                salePrice: salePrice ?? undefined,
                images: images,
                isPreorder: isPreorder,
                releaseDate: releaseDate,
            }
        });
        addedCount++;
        
        // Small delay to be polite to the server since we are making many requests
        await new Promise(r => setTimeout(r, 200));
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
