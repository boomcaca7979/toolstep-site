// SEO Metadata Engine
// Centralized generation of title, description, canonical, OpenGraph, Twitter, and JSON-LD.
// New pages should never hand-write metadata — call these helpers instead.

import type { BestEntry } from '../data/best';
import type { CompareEntry } from '../data/compare';
import type { ProductReviewEntry, ReviewEvidenceType } from '../data/products';

const CURRENT_YEAR = 2026;
const SITE_NAME = 'ToolStep';
const SITE_URL = 'https://www.toolstep.top';

// === Title Builders ===

export function buildReviewTitle(productName: string): string {
  // Strip a trailing year from data-driven product names (e.g. best-list
  // entries like "Best AI Assistants 2026") to avoid double-year titles
  // like "Best AI Assistants 2026 Review (2026)".
  const cleanName = productName.replace(/\s*2026$/, '');
  return `${cleanName} Review (${CURRENT_YEAR}): Features, Pros, Cons & Verdict`;
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

/**
 * Meta-description budget. Google truncates the snippet at roughly 155–160
 * characters, so anything longer is invisible text. The old builder hard-cut the
 * verdict at 120 chars and prefixed a 143-char generic sentence, which pushed
 * the only page-specific words past the cut on all 35 data-driven review pages.
 */
const DESCRIPTION_MAX = 160;

/** Honest, short evidence disclosure. Never claims testing that did not happen. */
function buildEvidenceDisclosure(evidenceType?: ReviewEvidenceType, testingDuration?: string): string {
  if (evidenceType === 'HANDS_ON') {
    const duration = (testingDuration ?? '').trim();
    return duration ? `Tested over ${duration}.` : 'Hands-on testing.';
  }
  // DOCUMENTATION / SPECIFICATION / PUBLIC_INFO / MIXED / undefined all render
  // the same honest label the page body uses: analysis, not lab measurement.
  return 'Based on published specs, not hands-on testing.';
}

/**
 * Words that cannot end a sentence. A cut that leaves one of these stranded
 * produces snippets like "…into a dual-4K workstation on." — grammatically
 * broken and visibly unfinished in a search result.
 */
const DANGLING_WORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'but', 'nor', 'of', 'to', 'for', 'with', 'without',
  'in', 'on', 'at', 'by', 'from', 'into', 'onto', 'over', 'under', 'between', 'than',
  'as', 'if', 'when', 'while', 'because', 'so', 'that', 'which', 'who', 'whose',
  'is', 'are', 'was', 'were', 'be', 'been', 'its', 'their', 'our', 'your', 'this',
  'these', 'those', 'via', 'per', 'plus', 'vs',
]);

/**
 * Trim prose to a character budget without cutting a word in half.
 * Preference order: whole text → first full sentence → last clause boundary →
 * last word boundary. Then repair the tail: drop stranded function words and
 * unfinished relative clauses so the snippet is a complete thought.
 * Always returns text ending in terminal punctuation.
 */
export function clipForMeta(text: string, max: number): string {
  const clean = text.replace(/\s+/g, ' ').trim();
  if (clean.length <= max) return clean;

  // 1. A complete first sentence that already fits.
  const sentence = clean.match(/^(.{30,}?[.!?])(?=\s|$)/);
  if (sentence && sentence[1].length <= max) return sentence[1];

  const slice = clean.slice(0, max);
  // 2. Clause boundary — keeps the claim that precedes it intact.
  const clause = Math.max(slice.lastIndexOf(', '), slice.lastIndexOf('; '), slice.lastIndexOf(' — '));
  if (clause >= Math.floor(max * 0.55)) {
    return finishClause(slice.slice(0, clause), max);
  }
  // 3. Word boundary.
  const word = slice.lastIndexOf(' ');
  return finishClause(word > 0 ? slice.slice(0, word) : slice, max);
}

/**
 * Clean up a candidate cut so it reads as a finished clause:
 *   - drop a stranded trailing function word ("…workstation on" → "…workstation")
 *   - drop an unfinished relative clause ("…Mac users who want a slim" → "…Mac users")
 * Never returns fewer than half the budget: if repairing would gut the snippet,
 * the original cut is returned instead.
 */
function finishClause(candidate: string, max: number): string {
  let body = candidate.replace(/[,;:\s—]+$/, '');
  const floor = Math.floor(max * 0.5);

  // Stranded function word: back off word by word.
  for (;;) {
    const cut = body.lastIndexOf(' ');
    if (cut <= 0) break;
    const last = body.slice(cut + 1).toLowerCase().replace(/[^a-z]/g, '');
    if (!DANGLING_WORDS.has(last)) break;
    if (cut < floor) break;
    body = body.slice(0, cut).replace(/[,;:\s—]+$/, '');
  }

  // Unfinished relative clause: "… users who want a slim" has no noun left.
  const relative = body.match(/\s(who|which|whose)\s+\S+(\s+\S+){0,3}$/i);
  if (relative && relative.index !== undefined && relative.index >= floor) {
    body = body.slice(0, relative.index).replace(/[,;:\s—]+$/, '');
  }

  return `${body}.`;
}

export function buildReviewDescription(
  productName: string,
  testingDuration: string,
  verdict: string,
  evidenceType?: ReviewEvidenceType,
): string {
  // Some verdicts open with a heading line ("The Most Capable Standing Desk
  // You Can Buy") separated from the prose by a blank line. Collapsing it into
  // the next sentence produced "…You Can Buy Based on manufacturer
  // specifications." — a run-on that never names the product. Drop the heading.
  const deheaded = verdict.replace(/^\s*[^\n.!?]{5,90}\n\s*\n/, '');

  // Collapse whitespace/newlines so the meta description attribute stays single-line
  const cleanVerdict = deheaded
    .replace(/\s+/g, ' ')
    .replace(/^(final\s+)?verdict\s*:\s*/i, '')
    .trim();

  const disclosure = buildEvidenceDisclosure(evidenceType, testingDuration);
  const budget = DESCRIPTION_MAX - disclosure.length - 1;

  const lead = cleanVerdict
    ? clipForMeta(cleanVerdict, budget)
    : `${productName} review: what it does well, where it falls short, and who should buy it.`;

  return `${lead} ${disclosure}`;
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

// ToolStep reviews products; it does not sell them. The Product node therefore
// carries no Offer: an affiliate link is not a merchant listing, and marking one
// up would claim stock, shipping and return policies we do not have.
export function buildReviewSchema(opts: {
  productName: string;
  productBrand: string;
  productCategory: string;
  productImage?: string;
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
    '@type': 'Product',
    name: opts.productName,
    ...(opts.productImage ? { image: opts.productImage } : {}),
    brand: { '@type': 'Brand', name: opts.productBrand },
    category: opts.productCategory,
    review: {
      '@type': 'Review',
      name: `${opts.productName} review`,
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
      url: opts.url,
      datePublished: opts.datePublished,
      dateModified: opts.dateModified || opts.datePublished,
      reviewBody: opts.reviewBody,
    },
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
      item: item.url,
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
  const description = buildReviewDescription(
    entry.productName,
    entry.testingDuration,
    entry.verdict,
    entry.editorial?.evidenceType,
  );
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
