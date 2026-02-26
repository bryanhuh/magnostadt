# SEO & Metadata — Implementation Guide

This document covers the SEO & Metadata feature implementation for the Magnostadt e-commerce platform, including dynamic OpenGraph tags, Twitter Cards, and a dynamic XML sitemap.

## Overview

The SEO system provides dynamic `<head>` meta tags per page for search engine indexing and social sharing, plus a server-side sitemap for crawler discoverability.

### What Was Done

| Feature | File(s) Modified |
|---------|-----------------|
| Reusable SEO component | `apps/web/src/components/SEO.tsx` [NEW] |
| HelmetProvider wrapper | `apps/web/src/App.tsx` |
| Default meta / OG fallbacks | `apps/web/index.html` |
| HomePage SEO | `apps/web/src/components/HomePage.tsx` |
| ProductDetails dynamic SEO | `apps/web/src/components/ProductDetails.tsx` |
| ProductList SEO | `apps/web/src/components/ProductList.tsx` |
| SharedWishlist SEO | `apps/web/src/pages/SharedWishlist.tsx` |
| Dynamic sitemap endpoint | `apps/api/src/index.ts` |

### Dependencies Added

| Package | Purpose |
|---------|---------|
| `react-helmet-async` | Manages `<head>` tags from React components |

---

## 1. Client-Side — SEO Component

### 1.1 `SEO.tsx` (Reusable Component)

**File**: `apps/web/src/components/SEO.tsx`

A single component that accepts optional props and renders all necessary meta tags via `react-helmet-async`:

```tsx
<SEO
  title="Product Name"        // → "<title>Product Name | Magnostadt</title>"
  description="Some text..."  // → <meta name="description">
  image="https://..."         // → og:image + twitter:image
  url="/product/slug"         // → og:url + <link rel="canonical">
  type="product"              // → og:type (defaults to "website")
/>
```

**Rendered tags**:
- `<title>` — page title with " | Magnostadt" suffix
- `<meta name="description">` — page description
- `<link rel="canonical">` — canonical URL
- `og:title`, `og:description`, `og:image`, `og:url`, `og:type`, `og:site_name`
- `twitter:card`, `twitter:title`, `twitter:description`, `twitter:image`

**Defaults** (when no props are passed):
- Title: `"Magnostadt — Anime Figures & Manga Store"`
- Description: `"Your premier destination for high-quality anime figures, manga, and collectibles from your favorite series."`
- Type: `"website"`

### 1.2 HelmetProvider Setup

**File**: `apps/web/src/App.tsx`

The entire app is wrapped with `<HelmetProvider>` at the root level so any child `<SEO>` component can inject tags into `<head>`:

```tsx
<HelmetProvider>
  <trpc.Provider ...>
    <QueryClientProvider ...>
      ...
    </QueryClientProvider>
  </trpc.Provider>
</HelmetProvider>
```

### 1.3 Default Fallback Meta Tags

**File**: `apps/web/index.html`

Static fallback tags are included directly in the HTML for crawlers that don't execute JavaScript (Facebook, Twitter, Discord):

```html
<meta name="description" content="Your premier destination for..." />
<meta property="og:title" content="Magnostadt — Anime Figures & Manga Store" />
<meta property="og:description" content="..." />
<meta property="og:type" content="website" />
<meta property="og:site_name" content="Magnostadt" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="Magnostadt — Anime Figures & Manga Store" />
<meta name="twitter:description" content="..." />
```

> **Note**: Since this is a client-side SPA, social media crawlers that don't execute JS will only see these static fallbacks. Google's crawler handles JS fine, so dynamic tags work for search indexing. Full social OG support would require SSR or a prerender service.

---

## 2. Per-Page SEO Usage

### 2.1 HomePage

```tsx
<SEO url="/" />
```

Uses all defaults — the Magnostadt branding title and description.

### 2.2 ProductDetails (Dynamic)

```tsx
<SEO
  title={product.name}
  description={product.description?.slice(0, 160) || `Shop ${product.name}...`}
  image={product.imageUrl || undefined}
  url={`/product/${product.slug}`}
  type="product"
/>
```

- **Title** → product name (e.g. "Naruto Uzumaki Figure | Magnostadt")
- **Description** → first 160 chars of product description
- **Image** → product's primary image URL
- **Type** → `"product"` for rich snippets

### 2.3 ProductList

```tsx
<SEO
  title={searchQuery ? `Search: "${searchQuery}"` : 'Shop All Products'}
  description="Browse our full collection of anime figures, manga, and collectibles."
  url="/shop"
/>
```

Dynamically adjusts the title when the user is searching.

### 2.4 SharedWishlist

```tsx
<SEO
  title={`${data.ownerName}'s Wishlist`}
  description={`Check out ${data.ownerName}'s wishlist — ${data.items.length} items saved on Magnostadt.`}
  url={`/wishlist/${token}`}
/>
```

---

## 3. Server-Side — Dynamic Sitemap

### 3.1 Sitemap Endpoint

**File**: `apps/api/src/index.ts`

A `GET /sitemap.xml` route queries all products from the database and generates valid XML:

```typescript
app.get('/sitemap.xml', async (c) => {
  const siteUrl = process.env.VITE_APP_URL || 'https://magnostadt.store';

  const products = await prisma.product.findMany({
    select: { slug: true, updatedAt: true },
    orderBy: { updatedAt: 'desc' },
  });

  // Generates XML with static pages + all product pages
  return c.text(xml, 200, { 'Content-Type': 'application/xml' });
});
```

### 3.2 Sitemap Structure

The generated sitemap includes:

| URL Pattern | Priority | Change Frequency |
|-------------|----------|-----------------|
| `/` (homepage) | 1.0 | daily |
| `/shop` | 0.9 | daily |
| `/product/:slug` (each product) | 0.8 | weekly |

Each product URL includes a `<lastmod>` date from `product.updatedAt`.

### 3.3 Sample Output

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://magnostadt.store/</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://magnostadt.store/product/naruto-uzumaki-figure</loc>
    <lastmod>2026-02-15</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
</urlset>
```

---

## 4. Architecture Flow

```
┌─────────────────────────────────────────────┐
│  Browser / Crawler Request                  │
├──────────────┬──────────────────────────────┤
│              │                              │
│  index.html  │  Static OG fallbacks         │
│  (initial)   │  for non-JS crawlers         │
│              │                              │
├──────────────┼──────────────────────────────┤
│              │                              │
│  React App   │  <SEO /> injects dynamic     │
│  (hydrated)  │  <head> tags via Helmet      │
│              │                              │
├──────────────┴──────────────────────────────┤
│                                             │
│  GET /sitemap.xml  →  API generates XML     │
│                       from product database │
│                                             │
└─────────────────────────────────────────────┘
```

---

## 5. Configuration

| Variable | Default | Purpose |
|----------|---------|---------|
| `VITE_APP_URL` | `https://magnostadt.store` | Base URL used in sitemap `<loc>` tags |

---

## 6. Extending

### Adding SEO to a new page

1. Import the component: `import { SEO } from '../components/SEO';`
2. Add it inside the page's return JSX:
   ```tsx
   <SEO title="Page Title" description="Page description." url="/page-path" />
   ```

### Adding new pages to the sitemap

Edit `apps/api/src/index.ts` and add entries to the `staticPages` array:

```typescript
const staticPages = [
  { loc: '/', priority: '1.0', changefreq: 'daily' },
  { loc: '/shop', priority: '0.9', changefreq: 'daily' },
  { loc: '/new-page', priority: '0.7', changefreq: 'weekly' }, // ← add here
];
```

---

## 7. Verification Checklist

- [ ] Visit a product page → inspect `<head>` in DevTools → confirm `og:title`, `og:image`, `og:description` match the product
- [ ] Visit `http://localhost:3000/sitemap.xml` → confirm valid XML with product URLs
- [ ] Check `<title>` updates when navigating between pages
- [ ] Test sitemap with [Google Search Console](https://search.google.com/search-console)
- [ ] Validate OG tags with [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/)
