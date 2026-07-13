// SEO Title Engine
// Centralized dynamic title builders for review, best, and compare pages.
// All titles target high-CTR patterns: year, real testing, verdict.

const CURRENT_YEAR = 2026;

/**
 * Build SEO title for a single-product review page.
 * Example: "Dell U2723QE Review (2026): Real Testing, Pros, Cons & Verdict"
 */
export function buildReviewTitle(productName: string): string {
  return `${productName} Review (${CURRENT_YEAR}): Real Testing, Pros, Cons & Verdict`;
}

/**
 * Build SEO title for a "Best X" list page.
 * Example: "Best Standing Desk (2026): Ranked, Tested & Compared"
 */
export function buildBestTitle(category: string): string {
  // Strip leading "Best " if caller already included it
  const cleanCategory = category.replace(/^Best\s+/i, '');
  return `Best ${cleanCategory} (${CURRENT_YEAR}): Ranked, Tested & Compared`;
}

/**
 * Build SEO title for a comparison page.
 * Example: "FlexiSpot E7 vs Uplift V2: Which Is Better in 2026?"
 */
export function buildCompareTitle(productAName: string, productBName: string): string {
  return `${productAName} vs ${productBName}: Which Is Better in ${CURRENT_YEAR}?`;
}

/**
 * Build SEO title for an alternatives page.
 * Example: "10 Best Notion Alternatives (2026): Free & Paid, Ranked"
 */
export function buildAlternativesTitle(toolName: string): string {
  return `10 Best ${toolName} Alternatives (${CURRENT_YEAR}): Free & Paid, Ranked`;
}

// Internal Link Graph
// Builds the semantic link structure that connects related pages.
// Used to surface "Best alternatives", "Compare with", "Who should buy this" sections.

export interface InternalLink {
  title: string;
  href: string;
  desc: string;
}

export interface ReviewLinkCluster {
  best: InternalLink | null;
  alternatives: InternalLink | null;
  compare: InternalLink[];
}

/**
 * Build the internal link cluster for a review page.
 * Returns links to the parent "Best" page, "Alternatives" page, and related comparisons.
 */
export function buildReviewLinkCluster(opts: {
  productSlug: string;
  productName: string;
  categorySlug?: string;
  categoryTitle?: string;
  compareSlugs?: string[];
  compareTitles?: string[];
}): ReviewLinkCluster {
  const { productSlug, productName, categorySlug, categoryTitle, compareSlugs = [], compareTitles = [] } = opts;

  const best: InternalLink | null = categorySlug && categoryTitle
    ? {
        title: `Best ${categoryTitle}`,
        href: `/best/${categorySlug}/`,
        desc: `See where ${productName} ranks among the top ${categoryTitle.toLowerCase()} we analyzed.`,
      }
    : null;

  const alternatives: InternalLink | null = {
    title: `${productName} Alternatives`,
    href: `/alternatives/${productSlug.replace(/-review$/, '')}/`,
    desc: `Compare ${productName} with similar products in the same price range.`,
  };

  const compare: InternalLink[] = compareSlugs.map((slug, i) => ({
    title: compareTitles[i] || slug,
    href: `/compare/${slug}/`,
    desc: `Side-by-side comparison with detailed scoring.`,
  }));

  return { best, alternatives, compare };
}

/**
 * Build "Who should buy this" decision framework content.
 * Returns plain-text guidance used for intent matching.
 */
export function buildAudienceGuidance(opts: {
  bestFor: string[];
  notFor: string[];
}): { bestFor: string[]; notFor: string[] } {
  return {
    bestFor: opts.bestFor,
    notFor: opts.notFor,
  };
}
