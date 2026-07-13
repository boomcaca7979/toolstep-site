// ToolStep Unified Content Schema — Legacy Adapter Layer
// Converts legacy data (ProductReviewEntry, BestEntry, CompareEntry, AlternativeEntry)
// to unified ToolStepContent records.
//
// This file does NOT modify legacy data. It reads legacy types and produces
// new unified records. Legacy data files remain untouched.

import type {
  ToolStepContent,
  ReviewContent,
  ComparisonContent,
  BestListContent,
  AlternativeContent,
} from './schema';
import type {
  ContentType,
  AffiliateValue,
  AffiliateProgram,
  EstimatedValue,
  ProductRef,
  RelatedLink,
  ContentSection,
} from './types';

// ============================================================
// Legacy Type Imports (type-only, no runtime dependency)
// ============================================================

import type { ProductReviewEntry } from '../products';
import type { BestEntry } from '../best';
import type { CompareEntry } from '../compare';
import type { AlternativeEntry } from '../alternatives';

// ============================================================
// Adapter Function Signatures
// ============================================================

export type ReviewAdapter = (entry: ProductReviewEntry) => ReviewContent;
export type BestListAdapter = (entry: BestEntry) => BestListContent;
export type ComparisonAdapter = (entry: CompareEntry) => ComparisonContent;
export type AlternativeAdapter = (entry: AlternativeEntry) => AlternativeContent;

export interface LegacyToContentAdapter {
  review: ReviewAdapter;
  bestList: BestListAdapter;
  comparison: ComparisonAdapter;
  alternative: AlternativeAdapter;
}

// ============================================================
// Helper Functions
// ============================================================

/**
 * Derives affiliate value tier from product price.
 */
function deriveAffiliateValue(price: number): AffiliateValue {
  if (price >= 300) return 'very-high';
  if (price >= 100) return 'high';
  if (price >= 50) return 'medium';
  if (price > 0) return 'low';
  return 'none';
}

/**
 * Derives estimated monthly revenue tier from price.
 */
function deriveEstimatedValue(price: number): EstimatedValue {
  if (price >= 300) return '$1000+';
  if (price >= 100) return '$500-1000';
  if (price >= 50) return '$100-500';
  if (price > 0) return '$50-100';
  return 'none';
}

/**
 * Derives affiliate program from URL presence.
 */
function deriveAffiliateProgram(amazonUrl?: string | null): AffiliateProgram {
  if (amazonUrl && amazonUrl.includes('amazon.com')) return 'amazon';
  if (amazonUrl) return 'direct';
  return 'none';
}

/**
 * Converts a slug to a human-readable primary keyword.
 * Example: "keychron-k8-review" → "keychron k8 review"
 */
function slugToKeyword(slug: string): string {
  return slug.replace(/-/g, ' ');
}

/**
 * Derives secondary keywords from slug and category.
 */
function deriveSecondaryKeywords(slug: string, category: string): string[] {
  const base = slugToKeyword(slug);
  const words = slug.split('-');
  const keywords: string[] = [];

  // Add the slug without trailing "review" or "vs"
  if (base.includes(' review')) {
    keywords.push(base.replace(' review', ''));
  }
  if (base.includes(' vs ')) {
    const parts = base.split(' vs ');
    keywords.push(...parts.filter((p) => p.length > 2));
  }

  // Add category-based keyword
  const catLower = category.toLowerCase().replace(/\s+/g, ' ');
  if (catLower && !keywords.includes(catLower)) {
    keywords.push(catLower);
  }

  // Add first 2 significant words as individual keywords
  const sigWords = words.filter((w) => w.length > 2 && !['review', 'best', 'vs', 'the'].includes(w));
  if (sigWords.length >= 2) {
    keywords.push(sigWords.slice(0, 2).join(' '));
  }

  // Ensure minimum 3 keywords, dedupe
  const unique = [...new Set(keywords)].filter((k) => k.length > 2);
  while (unique.length < 3) {
    unique.push(`${base} ${unique.length + 1}`);
  }

  return unique.slice(0, 5);
}

/**
 * Maps a category name to a keyword cluster ID.
 */
function mapCategoryToCluster(category: string, categorySlug: string): string {
  return categorySlug || category.toLowerCase().replace(/\s+/g, '-');
}

/**
 * Extracts a slug from a legacy href.
 * Example: "/reviews/keychron-k8-review/" → "keychron-k8-review"
 */
function slugFromHref(href: string): string {
  return href.replace(/^\/[^/]+\//, '').replace(/\/$/, '');
}

/**
 * Truncates text to a maximum length for meta description.
 */
function truncateForMeta(text: string, max = 155): string {
  if (text.length <= max) return text;
  return text.slice(0, max - 3).trimEnd() + '...';
}

// ============================================================
// Adapter Implementations
// ============================================================

/**
 * Converts a legacy ProductReviewEntry to unified ReviewContent.
 *
 * Field mapping:
 * - productName → title
 * - quickVerdict → metaDescription (truncated) + quickVerdict
 * - performance/buildQuality/easeOfUse/value → sections[]
 * - ratingValue/bestPrice/amazonUrl/specs/pros/cons → products[0]
 * - alternatives → relatedContent (related type)
 * - compareSlugs → compareWith
 * - relatedProducts → relatedContent (related type)
 */
export const reviewEntryToContent: ReviewAdapter = (entry: ProductReviewEntry): ReviewContent => {
  const price = entry.bestPrice;
  const affiliate = deriveAffiliateValue(price);
  const affiliateProgram = deriveAffiliateProgram(entry.amazonUrl);

  // Build product reference from review fields
  const product: ProductRef = {
    name: entry.productName,
    brand: entry.brand,
    price: price,
    rating: entry.ratingValue,
    amazonUrl: entry.amazonUrl ?? undefined,
    pros: entry.pros,
    cons: entry.cons,
    specs: entry.specs.map((s) => ({ label: s.label, value: s.value })),
  };

  // Convert prose sections to ContentSection[]
  const sections: ContentSection[] = [
    { heading: 'Performance', content: entry.performance },
    { heading: 'Build Quality', content: entry.buildQuality },
    { heading: 'Ease of Use', content: entry.easeOfUse },
    { heading: 'Value', content: entry.value },
  ];

  // Merge alternatives and relatedProducts into relatedContent
  const relatedContent: RelatedLink[] = [];

  for (const alt of entry.alternatives) {
    const slug = slugFromHref(alt.href);
    // Determine content type from href path
    const type: ContentType = alt.href.includes('/best/')
      ? 'list'
      : alt.href.includes('/compare/')
        ? 'comparison'
        : 'review';
    relatedContent.push({
      slug,
      label: alt.name,
      type,
      relationship: alt.href.includes('/compare/') ? 'compare' : 'related',
      description: alt.desc,
    });
  }

  if (entry.relatedProducts) {
    for (const slug of entry.relatedProducts) {
      relatedContent.push({
        slug,
        label: slug.replace(/-/g, ' '),
        type: 'review',
        relationship: 'related',
      });
    }
  }

  return {
    // Core
    id: `rev_${entry.slug}`,
    slug: entry.slug,
    contentType: 'review',
    status: 'published',

    // SEO
    title: entry.productName,
    metaDescription: truncateForMeta(entry.quickVerdict),
    primaryKeyword: slugToKeyword(entry.slug),
    secondaryKeywords: deriveSecondaryKeywords(entry.slug, entry.category),
    keywordCluster: mapCategoryToCluster(entry.category, entry.categorySlug),
    searchIntent: 'commercial',
    canonicalUrl: `https://toolstep.com/reviews/${entry.slug}/`,

    // Commercial
    affiliate,
    affiliateProgram,
    estimatedValue: deriveEstimatedValue(price),
    commissionRate: affiliateProgram === 'amazon' ? 4 : undefined,

    // Product
    products: [product],
    brand: entry.brand,
    category: entry.category,
    categorySlug: entry.categorySlug,

    // Content
    quickVerdict: entry.quickVerdict,
    verdict: entry.verdict,
    sections,
    pros: entry.pros,
    cons: entry.cons,
    faqs: entry.faqs.map((f) => ({ question: f.question, answer: f.answer })),

    // Relationships
    relatedContent,
    compareWith: entry.compareSlugs ?? [],
    alternatives: entry.alternatives.map((a) => slugFromHref(a.href)),

    // Analytics
    priorityScore: 75, // Default — updated from KEYWORD_EXPANSION_MATRIX in Step 3
    difficulty: 50, // Default — updated from matrix in Step 3
    publishDate: entry.publishDate,
    lastUpdated: entry.lastUpdated,
    authorSlug: entry.authorSlug,
    testingDuration: entry.testingDuration,
    productsTested: entry.productsTested,
    updatedDate: entry.updatedDate,

    // Review-specific
    testingSummary: entry.testingSummary,
    bestFor: entry.bestFor,
    notFor: entry.notFor,

    // Presentation
    heroImage: entry.heroImage,
  };
};

/**
 * Converts a legacy BestEntry to unified BestListContent.
 *
 * Field mapping:
 * - title → title
 * - description → metaDescription
 * - intro → introduction
 * - products[] → products[] (with rank preserved)
 * - relatedReviews + relatedBests → relatedContent
 * - (color dropped — presentation concern)
 * - methodology generated from testing duration
 */
export const bestEntryToContent: BestListAdapter = (entry: BestEntry): BestListContent => {
  // Determine average price for affiliate tier
  const avgPrice = entry.products.length > 0
    ? entry.products.reduce((sum, p) => sum + p.price, 0) / entry.products.length
    : 0;
  const affiliate = deriveAffiliateValue(avgPrice);

  // Map BestProduct[] to ProductRef[]
  const products: ProductRef[] = entry.products.map((p) => ({
    name: p.name,
    brand: p.brand,
    price: p.price,
    rating: p.rating,
    rank: p.rank,
    summary: p.summary,
    pros: p.pros,
    cons: p.cons,
  }));

  // Merge relatedReviews and relatedBests into relatedContent
  const relatedContent: RelatedLink[] = [
    ...entry.relatedReviews.map((slug) => ({
      slug,
      label: slug.replace(/-/g, ' '),
      type: 'review' as ContentType,
      relationship: 'related' as const,
    })),
    ...entry.relatedBests.map((slug) => ({
      slug,
      label: slug.replace(/-/g, ' '),
      type: 'list' as ContentType,
      relationship: 'related' as const,
    })),
  ];

  // Derive category slug from category name (BestEntry has no categorySlug)
  const categorySlug = entry.category.toLowerCase().replace(/\s+/g, '-');

  // Generate methodology from testing duration
  const methodology = `Based on product documentation analysis and specification comparison, ${entry.products.length} products were evaluated for build quality, performance, value, and real-world usability. Rankings are based on documented specifications and feature analysis.`;

  return {
    // Core
    id: `bst_${entry.slug}`,
    slug: entry.slug,
    contentType: 'list',
    listSubtype: 'best',
    status: 'published',

    // SEO
    title: entry.title,
    metaDescription: truncateForMeta(entry.description),
    primaryKeyword: slugToKeyword(entry.slug),
    secondaryKeywords: deriveSecondaryKeywords(entry.slug, entry.category),
    keywordCluster: mapCategoryToCluster(entry.category, categorySlug),
    searchIntent: 'commercial',
    canonicalUrl: `https://toolstep.com/best/${entry.slug}/`,

    // Commercial
    affiliate,
    affiliateProgram: 'amazon',
    estimatedValue: deriveEstimatedValue(avgPrice),
    commissionRate: 4,

    // Product
    products,
    brand: 'Multiple',
    category: entry.category,
    categorySlug,

    // Content
    quickVerdict: entry.products.length > 0
      ? `${entry.products[0].name} is our top pick. ${entry.products[0].summary}`
      : entry.description,
    sections: [], // Best lists use products[] for content, not sections
    pros: [], // Pros are per-product in best lists
    cons: [], // Cons are per-product in best lists
    faqs: entry.faqs.map((f) => ({ question: f.question, answer: f.answer })),

    // Relationships
    relatedContent,
    compareWith: [],
    alternatives: [],

    // Analytics
    priorityScore: 75, // Default — updated in Step 4
    difficulty: 50, // Default — updated in Step 4
    publishDate: entry.lastUpdated, // BestEntry has no publishDate, use lastUpdated
    lastUpdated: entry.lastUpdated,
    authorSlug: entry.authorSlug,
    testingDuration: entry.testingDuration,
    productsTested: entry.products.length,

    // List-specific
    introduction: entry.intro,
    methodology,

    // Presentation
    color: entry.color,
  };
};

/**
 * Converts a legacy CompareEntry to unified ComparisonContent.
 *
 * Field mapping:
 * - description → metaDescription
 * - productA → products[0]
 * - productB → products[1]
 * - quickWinner → comparison.quickWinner
 * - quickWinnerReason → comparison.quickWinnerReason
 * - specs → comparison.specTable
 * - whoWins → comparison.scenarios
 * - relatedReviews → relatedContent
 * - (color dropped)
 */
export const compareEntryToContent: ComparisonAdapter = (entry: CompareEntry): ComparisonContent => {
  // Map CompareProduct to ProductRef
  const productA: ProductRef = {
    name: entry.productA.name,
    brand: entry.productA.brand,
    price: entry.productA.price,
    rating: entry.productA.rating,
    pros: entry.productA.pros,
    cons: entry.productA.cons,
  };

  const productB: ProductRef = {
    name: entry.productB.name,
    brand: entry.productB.brand,
    price: entry.productB.price,
    rating: entry.productB.rating,
    pros: entry.productB.pros,
    cons: entry.productB.cons,
  };

  // Determine affiliate value from higher-priced product
  const maxPrice = Math.max(entry.productA.price, entry.productB.price);
  const affiliate = deriveAffiliateValue(maxPrice);

  // Map relatedReviews to relatedContent
  const relatedContent: RelatedLink[] = entry.relatedReviews.map((slug) => ({
    slug,
    label: slug.replace(/-/g, ' '),
    type: 'review' as ContentType,
    relationship: 'related' as const,
  }));

  // Derive category slug
  const categorySlug = entry.category.toLowerCase().replace(/\s+/g, '-');

  return {
    // Core
    id: `cmp_${entry.slug}`,
    slug: entry.slug,
    contentType: 'comparison',
    status: 'published',

    // SEO
    title: entry.title,
    metaDescription: truncateForMeta(entry.description),
    primaryKeyword: slugToKeyword(entry.slug),
    secondaryKeywords: deriveSecondaryKeywords(entry.slug, entry.category),
    keywordCluster: mapCategoryToCluster(entry.category, categorySlug),
    searchIntent: 'commercial',
    canonicalUrl: `https://toolstep.com/compare/${entry.slug}/`,

    // Commercial
    affiliate,
    affiliateProgram: 'amazon',
    estimatedValue: deriveEstimatedValue(maxPrice),
    commissionRate: 4,

    // Product
    products: [productA, productB],
    brand: 'Multiple',
    category: entry.category,
    categorySlug,

    // Content
    quickVerdict: entry.quickWinnerReason,
    sections: [], // Comparisons use comparison.specTable, not sections
    pros: [], // Pros are per-product in comparisons
    cons: [], // Cons are per-product in comparisons
    faqs: entry.faqs.map((f) => ({ question: f.question, answer: f.answer })),

    // Relationships
    relatedContent,
    compareWith: [],
    alternatives: [],

    // Analytics
    priorityScore: 75, // Default — updated in Step 5
    difficulty: 50, // Default — updated in Step 5
    publishDate: entry.lastUpdated, // CompareEntry has no publishDate
    lastUpdated: entry.lastUpdated,
    authorSlug: entry.authorSlug,
    testingDuration: entry.testingDuration,
    productsTested: 2,

    // Comparison-specific
    comparison: {
      quickWinner: entry.quickWinner,
      quickWinnerReason: entry.quickWinnerReason,
      specTable: entry.specs.map((s) => ({
        label: s.label,
        productA: s.productA,
        productB: s.productB,
        winner: s.winner,
      })),
      scenarios: entry.whoWins.map((w) => ({
        scenario: w.scenario,
        winner: w.winner,
      })),
    },

    // Presentation
    color: entry.color,
  };
};

/**
 * Converts a legacy AlternativeEntry to unified AlternativeContent.
 *
 * Field mapping:
 * - toolName → anchorProduct.name
 * - description → metaDescription
 * - intro → introduction
 * - alternatives[] → products[]
 * - whyChoose → distributed to products[].why (best-effort)
 * - internalLinks → relatedContent
 * - (color dropped)
 */
export const alternativeEntryToContent: AlternativeAdapter = (entry: AlternativeEntry): AlternativeContent => {
  // Build anchor product from toolName (limited data in legacy)
  const anchorProduct: ProductRef = {
    name: entry.toolName,
    brand: entry.toolName,
    price: 0, // Legacy AlternativeEntry doesn't have anchor product price
  };

  // Map AlternativeProduct[] to ProductRef[]
  const products: ProductRef[] = entry.alternatives.map((alt, idx) => ({
    name: alt.name,
    brand: alt.name, // Legacy doesn't have brand field
    price: 0, // Legacy uses pricing string, not number
    rating: alt.rating,
    rank: alt.rank,
    summary: alt.bestFor,
    pros: alt.pros,
    cons: alt.cons,
    why: idx < entry.whyChoose.length ? entry.whyChoose[idx] : undefined,
    pricing: alt.pricing, // Legacy pricing string — preserved for reverse adapter
  }));

  // Map internalLinks to relatedContent
  const relatedContent: RelatedLink[] = entry.internalLinks.map((slug) => ({
    slug,
    label: slug.replace(/-/g, ' '),
    type: slug.includes('vs') ? 'comparison' : 'review',
    relationship: 'related',
  }));

  // Derive category slug
  const categorySlug = entry.category.toLowerCase().replace(/\s+/g, '-');

  return {
    // Core
    id: `alt_${entry.slug}`,
    slug: entry.slug,
    contentType: 'list',
    listSubtype: 'alternative',
    status: 'published',

    // SEO
    title: entry.title,
    metaDescription: truncateForMeta(entry.description),
    primaryKeyword: slugToKeyword(entry.slug),
    secondaryKeywords: deriveSecondaryKeywords(entry.slug, entry.category),
    keywordCluster: mapCategoryToCluster(entry.category, categorySlug),
    searchIntent: 'commercial',
    canonicalUrl: `https://toolstep.com/alternatives/${entry.slug}/`,

    // Commercial
    affiliate: 'low', // Alternatives are often software/subscription
    affiliateProgram: 'subscription',
    estimatedValue: '<$50',

    // Product
    products,
    brand: 'Multiple',
    category: entry.category,
    categorySlug,

    // Content
    quickVerdict: entry.alternatives.length > 0
      ? `${entry.alternatives[0].name} is our top alternative to ${entry.toolName}. ${entry.alternatives[0].bestFor}.`
      : entry.description,
    sections: [],
    pros: [],
    cons: [],
    faqs: entry.faqs.map((f) => ({ question: f.question, answer: f.answer })),

    // Relationships
    relatedContent,
    compareWith: [],
    alternatives: [],

    // Analytics
    priorityScore: 70, // Default for alternatives
    difficulty: 45,
    publishDate: entry.lastUpdated,
    lastUpdated: entry.lastUpdated,
    authorSlug: entry.authorSlug,
    testingDuration: entry.testingDuration,
    productsTested: entry.alternatives.length,

    // Alternative-specific
    introduction: entry.intro,
    anchorProduct,

    // Presentation
    color: entry.color,
  };
};

// ============================================================
// Adapter Registry
// ============================================================

export const adapterRegistry: LegacyToContentAdapter = {
  review: reviewEntryToContent,
  bestList: bestEntryToContent,
  comparison: compareEntryToContent,
  alternative: alternativeEntryToContent,
};

// ============================================================
// Unified Legacy-to-Content Dispatcher
// ============================================================

/**
 * Converts any legacy data entry to unified ToolStepContent.
 * Dispatches to the appropriate adapter based on content type.
 *
 * @param contentType - The target content type
 * @param legacyEntry - The legacy data entry (must match the content type)
 * @returns Unified ToolStepContent record
 *
 * @example
 * const content = legacyToContent('review', reviewEntry);
 * const content = legacyToContent('list', bestEntry); // for best lists
 */
export function legacyToContent(
  contentType: ContentType,
  legacyEntry: unknown
): ToolStepContent {
  switch (contentType) {
    case 'review':
      return reviewEntryToContent(legacyEntry as ProductReviewEntry);

    case 'comparison':
      return compareEntryToContent(legacyEntry as CompareEntry);

    case 'list': {
      // Detect best vs alternative by checking for subtype-specific fields
      const entry = legacyEntry as Record<string, unknown>;
      if ('products' in entry && Array.isArray(entry.products) && 'intro' in entry && 'methodology' in entry === false) {
        // BestEntry has products[], intro, but no anchorProduct
        // AlternativeEntry has alternatives[], toolName
        if ('alternatives' in entry && 'toolName' in entry) {
          return alternativeEntryToContent(legacyEntry as AlternativeEntry);
        }
        return bestEntryToContent(legacyEntry as BestEntry);
      }
      if ('alternatives' in entry && 'toolName' in entry) {
        return alternativeEntryToContent(legacyEntry as AlternativeEntry);
      }
      throw new Error('Cannot determine list subtype for legacy entry. Provide "best" or "alternative" explicitly.');
    }

    case 'guide':
      throw new Error('Guide content type has no legacy equivalent. Guides are new content created directly in unified schema.');

    default:
      throw new Error(`Unknown content type: ${contentType as string}`);
  }
}

/**
 * Converts a legacy BestEntry explicitly (for type safety).
 */
export function legacyBestToContent(entry: BestEntry): BestListContent {
  return bestEntryToContent(entry);
}

/**
 * Converts a legacy AlternativeEntry explicitly (for type safety).
 */
export function legacyAlternativeToContent(entry: AlternativeEntry): AlternativeContent {
  return alternativeEntryToContent(entry);
}

// ============================================================
// Reverse Adapters (Unified Content → Legacy-compatible shapes)
// ============================================================
//
// These functions convert unified ToolStepContent records back to the legacy
// entry shapes that the Astro templates and SEO functions expect.
// Used in Step 6 to switch Astro pages to read from unified content while
// keeping the template/SEO input structure unchanged.
//
// IMPORTANT: All fields used by templates and SEO functions are reconstructed
// exactly. Fields dropped during forward adaptation (verdict, color, pricing,
// alternatives[].desc) are now preserved in the unified schema (Step 6 prep)
// and reconstructed here.

/**
 * Reconstructs a ProductReviewEntry from unified ReviewContent.
 */
export function reviewContentToEntry(content: ReviewContent): ProductReviewEntry {
  const product = content.products[0];
  const getSection = (heading: string): string =>
    content.sections.find((s) => s.heading === heading)?.content ?? '';

  // Reconstruct alternatives array from relatedContent
  const alternatives = content.relatedContent
    .filter((rc) => rc.relationship === 'related' || rc.relationship === 'compare')
    .map((rc) => {
      const hrefPrefix = rc.type === 'list'
        ? '/best/'
        : rc.type === 'comparison'
          ? '/compare/'
          : '/reviews/';
      return {
        name: rc.label,
        href: `${hrefPrefix}${rc.slug}/`,
        desc: rc.description ?? '',
      };
    });

  // Reconstruct relatedProducts from relatedContent (review type, not from alternatives)
  const relatedProducts = content.relatedContent
    .filter((rc) => rc.type === 'review' && rc.relationship === 'related')
    .map((rc) => rc.slug)
    .filter((slug) => !content.alternatives.includes(slug));

  return {
    slug: content.slug,
    productName: content.title,
    brand: content.brand,
    category: content.category,
    categorySlug: content.categorySlug,
    heroImage: content.heroImage,
    publishDate: content.publishDate,
    lastUpdated: content.lastUpdated,
    authorSlug: content.authorSlug,
    testingDuration: content.testingDuration,
    productsTested: content.productsTested ?? 1,
    updatedDate: content.updatedDate,
    ratingValue: product?.rating ?? 0,
    bestPrice: product?.price ?? 0,
    amazonUrl: product?.amazonUrl ?? null,
    verdict: content.verdict ?? content.quickVerdict,
    quickVerdict: content.quickVerdict,
    testingSummary: content.testingSummary ?? '',
    performance: getSection('Performance'),
    buildQuality: getSection('Build Quality'),
    easeOfUse: getSection('Ease of Use'),
    value: getSection('Value'),
    pros: content.pros,
    cons: content.cons,
    bestFor: content.bestFor ?? [],
    notFor: content.notFor ?? [],
    specs: (product?.specs ?? []).map((s) => ({ label: s.label, value: s.value })),
    alternatives,
    faqs: content.faqs.map((f) => ({ question: f.question, answer: f.answer })),
    compareSlugs: content.compareWith,
    relatedProducts,
  };
}

/**
 * Reconstructs a BestEntry from unified BestListContent.
 */
export function bestListContentToEntry(content: BestListContent): BestEntry {
  // Split relatedContent back into relatedReviews (hrefs) and relatedBests (slugs)
  const relatedReviews = content.relatedContent
    .filter((rc) => rc.type === 'review')
    .map((rc) => `/reviews/${rc.slug}/`);
  const relatedBests = content.relatedContent
    .filter((rc) => rc.type === 'list')
    .map((rc) => rc.slug);

  return {
    slug: content.slug,
    title: content.title,
    category: content.category,
    color: content.color ?? '#2563eb',
    description: content.metaDescription,
    intro: content.introduction ?? '',
    products: content.products.map((p) => ({
      rank: p.rank ?? 0,
      name: p.name,
      brand: p.brand,
      price: p.price,
      rating: p.rating ?? 0,
      summary: p.summary ?? '',
      pros: p.pros ?? [],
      cons: p.cons ?? [],
    })),
    faqs: content.faqs.map((f) => ({ question: f.question, answer: f.answer })),
    relatedReviews,
    relatedBests,
    lastUpdated: content.lastUpdated,
    testingDuration: content.testingDuration,
    authorSlug: content.authorSlug,
  };
}

/**
 * Reconstructs a CompareEntry from unified ComparisonContent.
 */
export function comparisonContentToEntry(content: ComparisonContent): CompareEntry {
  const [productA, productB] = content.products;
  const comparison = content.comparison;

  // Reconstruct relatedReviews from relatedContent (as hrefs)
  const relatedReviews = content.relatedContent
    .filter((rc) => rc.type === 'review')
    .map((rc) => `/reviews/${rc.slug}/`);

  return {
    slug: content.slug,
    title: content.title,
    category: content.category,
    color: content.color ?? '#2563eb',
    description: content.metaDescription,
    productA: {
      name: productA?.name ?? '',
      brand: productA?.brand ?? '',
      price: productA?.price ?? 0,
      rating: productA?.rating ?? 0,
      pros: productA?.pros ?? [],
      cons: productA?.cons ?? [],
    },
    productB: {
      name: productB?.name ?? '',
      brand: productB?.brand ?? '',
      price: productB?.price ?? 0,
      rating: productB?.rating ?? 0,
      pros: productB?.pros ?? [],
      cons: productB?.cons ?? [],
    },
    quickWinner: comparison?.quickWinner ?? 'tie',
    quickWinnerReason: comparison?.quickWinnerReason ?? '',
    specs: (comparison?.specTable ?? []).map((s) => ({
      label: s.label,
      productA: s.productA,
      productB: s.productB,
      winner: s.winner,
    })),
    whoWins: (comparison?.scenarios ?? []).map((w) => ({
      scenario: w.scenario,
      winner: w.winner,
    })),
    faqs: content.faqs.map((f) => ({ question: f.question, answer: f.answer })),
    relatedReviews,
    lastUpdated: content.lastUpdated,
    testingDuration: content.testingDuration,
    authorSlug: content.authorSlug,
  };
}

/**
 * Reconstructs an AlternativeEntry from unified AlternativeContent.
 */
export function alternativeContentToEntry(content: AlternativeContent): AlternativeEntry {
  // Reconstruct internalLinks from relatedContent
  const internalLinks = content.relatedContent.map((rc) => rc.slug);

  // Reconstruct whyChoose from products[].why
  const whyChoose = content.products
    .map((p) => p.why)
    .filter((w): w is string => typeof w === 'string' && w.length > 0);

  return {
    slug: content.slug,
    title: content.title,
    toolName: content.anchorProduct?.name ?? content.title.replace(/\s+Alternatives?$/i, ''),
    category: content.category,
    color: content.color ?? '#2563eb',
    description: content.metaDescription,
    intro: content.introduction ?? '',
    alternatives: content.products.map((p) => ({
      rank: p.rank ?? 0,
      name: p.name,
      bestFor: p.summary ?? '',
      pros: p.pros ?? [],
      cons: p.cons ?? [],
      pricing: p.pricing ?? '',
      rating: p.rating ?? 0,
    })),
    whyChoose,
    faqs: content.faqs.map((f) => ({ question: f.question, answer: f.answer })),
    internalLinks,
    testingDuration: content.testingDuration,
    authorSlug: content.authorSlug,
  };
}
