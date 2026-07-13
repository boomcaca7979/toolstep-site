// SEO Metadata Engine
// Centralized generation of title, description, canonical, OpenGraph, Twitter, and JSON-LD.
// New pages should never hand-write metadata — call these helpers instead.

import type { BestEntry } from '../data/best';
import type { CompareEntry } from '../data/compare';
import type { ProductReviewEntry } from '../data/products';

const CURRENT_YEAR = 2026;
const SITE_NAME = 'ToolStep';
const SITE_URL = 'https://www.toolstep.top';

// === Title Builders ===

export function buildReviewTitle(productName: string): string {
  return `${productName} Review (${CURRENT_YEAR}): Features, Pros, Cons & Verdict`;
}

export function buildBestTitle(category: string): string {
  const cleanCategory = category.replace(/^Best\s+/i, '');
  return `Best ${cleanCategory} (${CURRENT_YEAR}): Ranked & Compared`;
}

export function buildCompareTitle(productAName: string, productBName: string): string {
  return `${productAName} vs ${productBName}: Which Is Better in ${CURRENT_YEAR}?`;
}

export function buildAlternativesTitle(toolName: string): string {
  return `10 Best ${toolName} Alternatives (${CURRENT_YEAR}): Free & Paid, Ranked`;
}

// === Description Builders ===

export function buildReviewDescription(productName: string, _testingDuration: string, verdict: string): string {
  const cleanVerdict = verdict.slice(0, 120);
  return `${productName} review covering features, specifications, pricing, pros, cons, and practical use cases based on product documentation and detailed analysis. ${cleanVerdict}`;
}

export function buildBestDescription(category: string, count: number, _testingDuration: string): string {
  return `The ${count} best ${category.toLowerCase()} in ${CURRENT_YEAR}, ranked by features, specifications, pricing, and practical use cases based on product documentation and detailed analysis.`;
}

export function buildCompareDescription(productA: string, productB: string, winner: string): string {
  return `${productA} vs ${productB}: compared side-by-side for features, pricing, and value. ${winner}`;
}

// === Canonical URL ===

export function buildCanonical(path: string): string {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  const normalized = cleanPath.endsWith('/') ? cleanPath : `${cleanPath}/`;
  return `${SITE_URL}${normalized}`;
}

// === OpenGraph / Twitter ===

export interface OpenGraphMeta {
  title: string;
  description: string;
  url: string;
  type: 'website' | 'article';
  image?: string;
  siteName?: string;
}

export function buildOpenGraph(opts: {
  title: string;
  description: string;
  url: string;
  type?: 'website' | 'article';
  image?: string;
}): OpenGraphMeta {
  return {
    title: opts.title,
    description: opts.description,
    url: opts.url,
    type: opts.type || 'article',
    image: opts.image,
    siteName: SITE_NAME,
  };
}

export interface TwitterMeta {
  card: 'summary' | 'summary_large_image';
  title: string;
  description: string;
  image?: string;
}

export function buildTwitter(opts: {
  title: string;
  description: string;
  image?: string;
  largeImage?: boolean;
}): TwitterMeta {
  return {
    card: opts.largeImage === false ? 'summary' : 'summary_large_image',
    title: opts.title,
    description: opts.description,
    image: opts.image,
  };
}

// === JSON-LD Schema Builders ===

export interface ArticleSchemaInput {
  headline: string;
  description: string;
  datePublished: string;
  dateModified?: string;
  authorName: string;
  authorUrl?: string;
  authorJobTitle?: string;
  url: string;
  image?: string;
}

export function buildArticleSchema(input: ArticleSchemaInput) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: input.headline,
    description: input.description,
    datePublished: input.datePublished,
    dateModified: input.dateModified || input.datePublished,
    author: {
      '@type': 'Person',
      name: input.authorName,
      ...(input.authorUrl ? { url: input.authorUrl } : {}),
      ...(input.authorJobTitle ? { jobTitle: input.authorJobTitle } : {}),
    },
    publisher: { '@type': 'Organization', name: SITE_NAME },
    mainEntityOfPage: { '@type': 'WebPage', '@id': input.url },
    ...(input.image ? { image: input.image } : {}),
  };
}

export function buildReviewSchema(opts: {
  productName: string;
  productBrand: string;
  productCategory: string;
  productImage?: string;
  price: number;
  ratingValue: number;
  authorName: string;
  authorUrl?: string;
  authorJobTitle?: string;
  datePublished: string;
  dateModified?: string;
  reviewBody: string;
  url: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Review',
    itemReviewed: {
      '@type': 'Product',
      name: opts.productName,
      ...(opts.productImage ? { image: opts.productImage } : {}),
      brand: { '@type': 'Brand', name: opts.productBrand },
      category: opts.productCategory,
      offers: {
        '@type': 'Offer',
        price: opts.price,
        priceCurrency: 'USD',
        availability: 'https://schema.org/InStock',
      },
    },
    reviewRating: {
      '@type': 'Rating',
      ratingValue: opts.ratingValue,
      bestRating: 5,
      worstRating: 1,
    },
    author: {
      '@type': 'Person',
      name: opts.authorName,
      ...(opts.authorUrl ? { url: opts.authorUrl } : {}),
      ...(opts.authorJobTitle ? { jobTitle: opts.authorJobTitle } : {}),
    },
    publisher: { '@type': 'Organization', name: SITE_NAME },
    datePublished: opts.datePublished,
    dateModified: opts.dateModified || opts.datePublished,
    reviewBody: opts.reviewBody,
  };
}

export function buildFaqSchema(faqs: { question: string; answer: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(f => ({
      '@type': 'Question',
      name: f.question,
      acceptedAnswer: { '@type': 'Answer', text: f.answer },
    })),
  };
}

export function buildBreadcrumbSchema(items: { name: string; url: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

export function buildItemListSchema(opts: { name: string; description: string; items: { name: string; url: string }[] }) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: opts.name,
    description: opts.description,
    numberOfItems: opts.items.length,
    itemListElement: opts.items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      url: item.url,
    })),
  };
}

export function buildOrganizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_NAME,
    url: SITE_URL,
    logo: `${SITE_URL}/logo.png`,
    sameAs: [],
  };
}

export function buildWebsiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    url: SITE_URL,
    potentialAction: {
      '@type': 'SearchAction',
      target: `${SITE_URL}/?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  };
}

// === Convenience: Build all metadata for a page type at once ===

export interface BestPageMeta {
  title: string;
  description: string;
  canonical: string;
  og: OpenGraphMeta;
  twitter: TwitterMeta;
  articleSchema: ReturnType<typeof buildArticleSchema>;
  itemListSchema: ReturnType<typeof buildItemListSchema>;
  faqSchema: ReturnType<typeof buildFaqSchema>;
  breadcrumbSchema: ReturnType<typeof buildBreadcrumbSchema>;
}

export function buildBestPageMeta(entry: BestEntry, authorName: string, publishDate: string): BestPageMeta {
  const title = buildBestTitle(entry.title);
  const description = entry.description;
  const canonical = buildCanonical(`/best/${entry.slug}`);
  const pageUrl = `${SITE_URL}/best/${entry.slug}/`;

  return {
    title,
    description,
    canonical,
    og: buildOpenGraph({ title, description, url: pageUrl, type: 'article' }),
    twitter: buildTwitter({ title, description }),
    articleSchema: buildArticleSchema({
      headline: entry.title,
      description,
      datePublished: publishDate,
      authorName,
      url: pageUrl,
    }),
    itemListSchema: buildItemListSchema({
      name: entry.title,
      description,
      items: entry.products.map(p => ({ name: p.name, url: pageUrl })),
    }),
    faqSchema: buildFaqSchema(entry.faqs),
    breadcrumbSchema: buildBreadcrumbSchema([
      { name: 'Home', url: SITE_URL },
      { name: 'Best', url: `${SITE_URL}/best/` },
      { name: entry.title, url: pageUrl },
    ]),
  };
}

export interface ComparePageMeta {
  title: string;
  description: string;
  canonical: string;
  og: OpenGraphMeta;
  twitter: TwitterMeta;
  articleSchema: ReturnType<typeof buildArticleSchema>;
  reviewSchema: ReturnType<typeof buildReviewSchema>;
  faqSchema: ReturnType<typeof buildFaqSchema>;
  breadcrumbSchema: ReturnType<typeof buildBreadcrumbSchema>;
}

export function buildComparePageMeta(entry: CompareEntry, authorName: string, publishDate: string): ComparePageMeta {
  const title = buildCompareTitle(entry.productA.name, entry.productB.name);
  const description = entry.description;
  const canonical = buildCanonical(`/compare/${entry.slug}`);
  const pageUrl = `${SITE_URL}/compare/${entry.slug}/`;
  const topRating = Math.max(entry.productA.rating, entry.productB.rating);
  const bestPrice = Math.min(entry.productA.price, entry.productB.price);

  return {
    title,
    description,
    canonical,
    og: buildOpenGraph({ title, description, url: pageUrl, type: 'article' }),
    twitter: buildTwitter({ title, description }),
    articleSchema: buildArticleSchema({
      headline: entry.title,
      description,
      datePublished: publishDate,
      authorName,
      url: pageUrl,
    }),
    reviewSchema: buildReviewSchema({
      productName: entry.title,
      productBrand: entry.productA.brand,
      productCategory: entry.category,
      price: bestPrice,
      ratingValue: topRating,
      authorName,
      datePublished: publishDate,
      reviewBody: entry.quickWinnerReason,
      url: pageUrl,
    }),
    faqSchema: buildFaqSchema(entry.faqs),
    breadcrumbSchema: buildBreadcrumbSchema([
      { name: 'Home', url: SITE_URL },
      { name: 'Compare', url: `${SITE_URL}/compare/` },
      { name: entry.title, url: pageUrl },
    ]),
  };
}

export interface ProductReviewPageMeta {
  title: string;
  description: string;
  canonical: string;
  og: OpenGraphMeta;
  twitter: TwitterMeta;
  articleSchema: ReturnType<typeof buildArticleSchema>;
  reviewSchema: ReturnType<typeof buildReviewSchema>;
  faqSchema: ReturnType<typeof buildFaqSchema>;
  breadcrumbSchema: ReturnType<typeof buildBreadcrumbSchema>;
}

export function buildProductReviewMeta(entry: ProductReviewEntry, authorName: string, authorJobTitle?: string): ProductReviewPageMeta {
  const title = buildReviewTitle(entry.productName);
  const description = buildReviewDescription(entry.productName, entry.testingDuration, entry.verdict);
  const canonical = buildCanonical(`/reviews/${entry.slug}`);
  const pageUrl = `${SITE_URL}/reviews/${entry.slug}/`;
  const authorUrl = `${SITE_URL}/authors/${entry.authorSlug}`;
  const dateModified = entry.updatedDate || entry.publishDate;

  return {
    title,
    description,
    canonical,
    og: buildOpenGraph({ title, description, url: pageUrl, type: 'article' }),
    twitter: buildTwitter({ title, description }),
    articleSchema: buildArticleSchema({
      headline: title,
      description,
      datePublished: entry.publishDate,
      dateModified,
      authorName,
      authorUrl,
      authorJobTitle,
      url: pageUrl,
    }),
    reviewSchema: buildReviewSchema({
      productName: entry.productName,
      productBrand: entry.brand,
      productCategory: entry.category,
      productImage: entry.heroImage,
      price: entry.bestPrice,
      ratingValue: entry.ratingValue,
      authorName,
      authorUrl,
      authorJobTitle,
      datePublished: entry.publishDate,
      dateModified,
      reviewBody: entry.verdict,
      url: pageUrl,
    }),
    faqSchema: buildFaqSchema(entry.faqs),
    breadcrumbSchema: buildBreadcrumbSchema([
      { name: 'Home', url: SITE_URL },
      { name: 'Reviews', url: `${SITE_URL}/reviews/` },
      { name: `${entry.productName} Review`, url: pageUrl },
    ]),
  };
}
