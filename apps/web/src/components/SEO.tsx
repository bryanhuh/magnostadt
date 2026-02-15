import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: string;
}

const DEFAULTS = {
  title: 'Magnostadt — Anime Figures & Manga Store',
  description: 'Your premier destination for high-quality anime figures, manga, and collectibles from your favorite series.',
  image: '/og-default.png',
  type: 'website',
};

export function SEO({
  title,
  description = DEFAULTS.description,
  image,
  url,
  type = DEFAULTS.type,
}: SEOProps) {
  const pageTitle = title
    ? `${title} | Magnostadt`
    : DEFAULTS.title;

  const ogImage = image || DEFAULTS.image;
  const canonical = url
    ? `${window.location.origin}${url}`
    : window.location.href;

  return (
    <Helmet>
      <title>{pageTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonical} />

      {/* OpenGraph */}
      <meta property="og:title" content={pageTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:url" content={canonical} />
      <meta property="og:type" content={type} />
      <meta property="og:site_name" content="Magnostadt" />

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={pageTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />
    </Helmet>
  );
}
