import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { trpcServer } from '@hono/trpc-server';
import { appRouter, createContext } from '@shonen-mart/trpc';
import { prisma } from '@shonen-mart/db';
import Stripe from 'stripe';
import { rateLimiter } from 'hono-rate-limiter';

// Issue #5 fix: removed duplicate `new PrismaClient()` — now uses the shared singleton
// from @shonen-mart/db so the process holds exactly one connection pool.

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-01-27.acacia' as any,
});

const limiter = rateLimiter({
  windowMs: 60 * 1000,
  limit: 60,
  standardHeaders: 'draft-6',
  keyGenerator: (c) =>
    c.req.header('x-forwarded-for')?.split(',')[0]?.trim() ??
    c.req.header('x-real-ip') ??
    'unknown',
});

const app = new Hono();

app.use('*', cors());

app.use('/trpc/*', limiter);

app.post('/webhook/stripe', async (c) => {
  const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;
  const sig = c.req.header('stripe-signature');

  if (!sig || !STRIPE_WEBHOOK_SECRET) {
    return c.json({ error: 'Missing signature or webhook secret' }, 400);
  }

  let event: Stripe.Event;
  try {
    const rawBody = await c.req.text();
    event = stripe.webhooks.constructEvent(rawBody, sig, STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return c.json({ error: 'Webhook signature verification failed' }, 400);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const orderId = session.metadata?.orderId;
    if (orderId) {
      await prisma.order.update({
        where: { id: orderId },
        data: { paymentStatus: 'PAID' },
      });
    }
  } else if (event.type === 'checkout.session.expired') {
    const session = event.data.object as Stripe.Checkout.Session;
    const orderId = session.metadata?.orderId;
    if (orderId) {
      await prisma.$transaction(async (tx) => {
        const order = await tx.order.findUnique({
          where: { id: orderId },
          include: { items: true },
        });
        if (!order || order.paymentStatus !== 'UNPAID') return;
        for (const item of order.items) {
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: { increment: item.quantity } },
          });
        }
        await tx.order.update({
          where: { id: orderId },
          data: { paymentStatus: 'FAILED', status: 'CANCELLED' },
        });
      });
    }
  }

  return c.json({ received: true });
});

app.use(
  '/trpc/*',
  trpcServer({
    router: appRouter,
    createContext,
  })
);

// Issue #2 fix: cache the generated sitemap XML in memory and regenerate at most
// once every 24 hours. Previously, every request hit the DB with a full table
// scan of all products. With the cache, only the first request (or the first
// one after the TTL expires) queries the database.
const SITEMAP_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
let sitemapCache: { xml: string; generatedAt: number } | null = null;

app.get('/sitemap.xml', async (c) => {
  const now = Date.now();

  if (sitemapCache && now - sitemapCache.generatedAt < SITEMAP_TTL_MS) {
    return c.text(sitemapCache.xml, 200, {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=86400',
    });
  }

  const siteUrl = process.env.VITE_APP_URL || 'https://magnostadt.store';

  // Only select the two columns we need — no full row scans.
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

  sitemapCache = { xml, generatedAt: now };

  return c.text(xml, 200, {
    'Content-Type': 'application/xml',
    'Cache-Control': 'public, max-age=86400',
  });
});

app.get('/', (c) => c.text('Magnostadt API is running!'));

export default app;
