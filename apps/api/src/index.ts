import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { trpcServer } from '@hono/trpc-server';
import { appRouter, createContext } from '@shonen-mart/trpc';
import { PrismaClient } from '@shonen-mart/db';

const prisma = new PrismaClient();
const app = new Hono();

app.use('*', cors());

app.use(
  '/trpc/*',
  trpcServer({
    router: appRouter,
    createContext,
  })
);

app.get('/sitemap.xml', async (c) => {
  const siteUrl = process.env.VITE_APP_URL || 'https://magnostadt.store';

  const products = await prisma.product.findMany({
    select: { slug: true, updatedAt: true },
    orderBy: { updatedAt: 'desc' },
  });

  const staticPages = [
    { loc: '/', priority: '1.0', changefreq: 'daily' },
    { loc: '/shop', priority: '0.9', changefreq: 'daily' },
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${staticPages
  .map(
    (page) => `  <url>
    <loc>${siteUrl}${page.loc}</loc>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`
  )
  .join('\n')}
${products
  .map(
    (p) => `  <url>
    <loc>${siteUrl}/product/${p.slug}</loc>
    <lastmod>${p.updatedAt.toISOString().split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`
  )
  .join('\n')}
</urlset>`;

  return c.text(xml, 200, { 'Content-Type': 'application/xml' });
});

app.get('/', (c) => c.text('Magnostadt API is running!'));

export default app;
