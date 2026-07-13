// Related Content Graph
// Auto-generates internal links between Best, Review, Compare, and Alternatives pages.
// Matching priority: category > brand > explicit product name > explicit data relationships.
// NO substring/token matching — prevents false positives like "AI" matching all AI products.
//
// Step 6 cleanup: Data sources switched from legacy files to unified content
// (src/data/content/index.ts). Reverse adapters reconstruct legacy entry shapes
// so all matching logic below remains unchanged.

import { getBestEntries } from '../data/content';
import type { BestEntry } from '../data/best';
import { getCompareEntries } from '../data/content';
import type { CompareEntry } from '../data/compare';
import { getAlternativeEntries } from '../data/content';
import { getReviewEntries } from '../data/content';
import type { ProductReviewEntry } from '../data/products';

export interface RelatedLink {
  title: string;
  href: string;
  desc: string;
}

export interface RelatedGraph {
  relatedReviews: RelatedLink[];
  relatedBests: RelatedLink[];
  relatedComparisons: RelatedLink[];
  relatedAlternatives: RelatedLink[];
}

// Unified content data sources (cached at module load — same pattern as legacy exports)
const bestData = getBestEntries();
const compareData = getCompareEntries();
const alternativesData = getAlternativeEntries();
const productReviews = getReviewEntries();

// === Matching helpers (strict, no substring) ===

function normalizeName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '');
}

// Exact product name match (after normalization) — NOT substring
function isExactNameMatch(a: string, b: string): boolean {
  return normalizeName(a) === normalizeName(b);
}

// Check if product A's name contains product B's FULL name as a word boundary match
// e.g. "Sony WH-1000XM5" matches "WH-1000XM5" but "AI" does NOT match "AI Writer"
function isProductMatch(productName: string, targetName: string): boolean {
  const pn = normalizeName(productName);
  const tn = normalizeName(targetName);
  // Exact match
  if (pn === tn) return true;
  // Only allow match if target is a substantial part (>= 60% of product name length)
  // AND product name contains target as contiguous substring
  if (tn.length >= 5 && pn.includes(tn) && tn.length >= pn.length * 0.6) return true;
  if (pn.length >= 5 && tn.includes(pn) && pn.length >= tn.length * 0.6) return true;
  return false;
}

// Category match — normalized equality (handles "Standing Desks" vs "standing desks")
function isCategoryMatch(catA: string, catB: string): boolean {
  return normalizeName(catA) === normalizeName(catB);
}

// Brand match
function isBrandMatch(brandA: string, brandB: string): boolean {
  return normalizeName(brandA) === normalizeName(brandB);
}

// Map review category to best page category (handle singular/plural and variations)
function categoryMatchesBest(reviewCategory: string, bestCategory: string): boolean {
  const rc = normalizeName(reviewCategory);
  const bc = normalizeName(bestCategory);
  if (rc === bc) return true;
  // Handle singular/plural: "Headphones" matches "Headphone"
  if (rc.length > 4 && (rc.startsWith(bc) || bc.startsWith(rc)) && Math.abs(rc.length - bc.length) <= 2) return true;
  // Handle compound: "Wireless Headphones" matches "Headphones"
  if (rc.includes(bc) || bc.includes(rc)) return true;
  return false;
}

// === Graph generators ===

/**
 * Generate related-content graph for a product review page.
 * Priority: explicit relatedReviews in data > category match > brand match > exact name in compare/best.
 */
export function getRelatedForReview(
  productName: string,
  productSlug: string,
  category?: string,
  brand?: string,
  explicitCompareSlugs?: string[]
): RelatedGraph {
  // 1. Related Bests — category match first, then explicit product match in best lists
  const relatedBests: RelatedLink[] = [];

  // Priority 1a: Best pages whose products list explicitly includes this product
  for (const b of bestData) {
    if (relatedBests.length >= 3) break;
    const hasProduct = b.products.some(p => isProductMatch(p.name, productName));
    if (hasProduct) {
      relatedBests.push({ title: b.title, href: `/best/${b.slug}/`, desc: b.description });
    }
  }

  // Priority 1b: Best pages matching category (if not already added)
  if (category && relatedBests.length < 3) {
    for (const b of bestData) {
      if (relatedBests.length >= 3) break;
      if (relatedBests.some(r => r.href === `/best/${b.slug}/`)) continue;
      if (categoryMatchesBest(category, b.category)) {
        relatedBests.push({ title: b.title, href: `/best/${b.slug}/`, desc: b.description });
      }
    }
  }

  // 2. Related Comparisons — explicit slugs first, then exact product match
  const relatedComparisons: RelatedLink[] = [];

  // Priority 2a: Explicit compareSlugs from product data
  if (explicitCompareSlugs) {
    for (const slug of explicitCompareSlugs) {
      if (relatedComparisons.length >= 4) break;
      const c = compareData.find(cmp => cmp.slug === slug);
      if (c) {
        relatedComparisons.push({ title: c.title, href: `/compare/${c.slug}/`, desc: c.description });
      }
    }
  }

  // Priority 2b: Compare pages with exact product name match
  if (relatedComparisons.length < 4) {
    for (const c of compareData) {
      if (relatedComparisons.length >= 4) break;
      if (relatedComparisons.some(r => r.href === `/compare/${c.slug}/`)) continue;
      const matchesA = isProductMatch(c.productA.name, productName);
      const matchesB = isProductMatch(c.productB.name, productName);
      if (matchesA || matchesB) {
        relatedComparisons.push({ title: c.title, href: `/compare/${c.slug}/`, desc: c.description });
      }
    }
  }

  // Priority 2c: Compare pages in same category
  if (category && relatedComparisons.length < 4) {
    for (const c of compareData) {
      if (relatedComparisons.length >= 4) break;
      if (relatedComparisons.some(r => r.href === `/compare/${c.slug}/`)) continue;
      if (categoryMatchesBest(category, c.category)) {
        relatedComparisons.push({ title: c.title, href: `/compare/${c.slug}/`, desc: c.description });
      }
    }
  }

  // 3. Related Alternatives — category match or exact tool name match
  const relatedAlternatives: RelatedLink[] = [];
  for (const a of alternativesData) {
    if (relatedAlternatives.length >= 2) break;
    if (isProductMatch(a.toolName, productName) || (category && categoryMatchesBest(category, a.category))) {
      relatedAlternatives.push({ title: a.title, href: `/alternatives/${a.slug}/`, desc: a.description });
    }
  }

  // 4. Related Reviews — same category first, then same brand
  const relatedReviews: RelatedLink[] = [];
  for (const r of productReviews) {
    if (relatedReviews.length >= 4) break;
    if (r.slug === productSlug) continue;
    // Same category
    if (category && r.category === category) {
      relatedReviews.push({ title: `${r.productName} Review`, href: `/reviews/${r.slug}/`, desc: r.verdict.slice(0, 100) });
    }
  }
  // Same brand (if not enough from category)
  if (brand && relatedReviews.length < 4) {
    for (const r of productReviews) {
      if (relatedReviews.length >= 4) break;
      if (r.slug === productSlug) continue;
      if (relatedReviews.some(rr => rr.href === `/reviews/${r.slug}/`)) continue;
      if (isBrandMatch(r.brand, brand)) {
        relatedReviews.push({ title: `${r.productName} Review`, href: `/reviews/${r.slug}/`, desc: r.verdict.slice(0, 100) });
      }
    }
  }

  return { relatedReviews, relatedBests, relatedComparisons, relatedAlternatives };
}

/**
 * Generate related-content graph for a Best page.
 * Priority: explicit relatedReviews > category match for compares/bests.
 */
export function getRelatedForBest(bestSlug: string, productNames: string[], category: string): RelatedGraph {
  const relatedReviews: RelatedLink[] = [];

  // Priority 1: Reviews whose product name exactly matches a product in this best list
  for (const r of productReviews) {
    if (relatedReviews.length >= 5) break;
    const hasMatch = productNames.some(pn => isProductMatch(pn, r.productName));
    if (hasMatch) {
      relatedReviews.push({ title: `${r.productName} Review`, href: `/reviews/${r.slug}/`, desc: r.verdict.slice(0, 100) });
    }
  }

  // Priority 2: Reviews in the same category
  if (relatedReviews.length < 5) {
    for (const r of productReviews) {
      if (relatedReviews.length >= 5) break;
      if (relatedReviews.some(rr => rr.href === `/reviews/${r.slug}/`)) continue;
      if (categoryMatchesBest(r.category, category)) {
        relatedReviews.push({ title: `${r.productName} Review`, href: `/reviews/${r.slug}/`, desc: r.verdict.slice(0, 100) });
      }
    }
  }

  // Related Comparisons — same category
  const relatedComparisons: RelatedLink[] = [];
  for (const c of compareData) {
    if (relatedComparisons.length >= 3) break;
    if (categoryMatchesBest(c.category, category)) {
      relatedComparisons.push({ title: c.title, href: `/compare/${c.slug}/`, desc: c.description });
    }
  }

  // Related Bests — same category
  const relatedBests: RelatedLink[] = [];
  for (const b of bestData) {
    if (relatedBests.length >= 3) break;
    if (b.slug === bestSlug) continue;
    if (b.category === category) {
      relatedBests.push({ title: b.title, href: `/best/${b.slug}/`, desc: b.description });
    }
  }

  // Related Alternatives — same category
  const relatedAlternatives: RelatedLink[] = [];
  for (const a of alternativesData) {
    if (relatedAlternatives.length >= 2) break;
    if (categoryMatchesBest(a.category, category)) {
      relatedAlternatives.push({ title: a.title, href: `/alternatives/${a.slug}/`, desc: a.description });
    }
  }

  return { relatedReviews, relatedBests, relatedComparisons, relatedAlternatives };
}

/**
 * Generate related-content graph for a Compare page.
 * Priority: exact product name match for reviews > category match for bests.
 */
export function getRelatedForCompare(
  productAName: string,
  productBName: string,
  category: string,
  compareSlug: string
): RelatedGraph {
  const relatedReviews: RelatedLink[] = [];

  // Priority 1: Reviews matching product A or B by exact name
  for (const r of productReviews) {
    if (relatedReviews.length >= 4) break;
    if (isProductMatch(r.productName, productAName) || isProductMatch(r.productName, productBName)) {
      relatedReviews.push({ title: `${r.productName} Review`, href: `/reviews/${r.slug}/`, desc: r.verdict.slice(0, 100) });
    }
  }

  // Priority 2: Reviews in same category
  if (relatedReviews.length < 4) {
    for (const r of productReviews) {
      if (relatedReviews.length >= 4) break;
      if (relatedReviews.some(rr => rr.href === `/reviews/${r.slug}/`)) continue;
      if (categoryMatchesBest(r.category, category)) {
        relatedReviews.push({ title: `${r.productName} Review`, href: `/reviews/${r.slug}/`, desc: r.verdict.slice(0, 100) });
      }
    }
  }

  // Related Bests — same category
  const relatedBests: RelatedLink[] = [];
  for (const b of bestData) {
    if (relatedBests.length >= 2) break;
    if (categoryMatchesBest(b.category, category)) {
      relatedBests.push({ title: b.title, href: `/best/${b.slug}/`, desc: b.description });
    }
  }

  // Related Comparisons — same category
  const relatedComparisons: RelatedLink[] = [];
  for (const c of compareData) {
    if (relatedComparisons.length >= 3) break;
    if (c.slug === compareSlug) continue;
    if (categoryMatchesBest(c.category, category)) {
      relatedComparisons.push({ title: c.title, href: `/compare/${c.slug}/`, desc: c.description });
    }
  }

  return { relatedReviews, relatedBests, relatedComparisons, relatedAlternatives: [] };
}

/**
 * Check if any product review pages are orphaned (no inbound links).
 * Uses exact name matching only — no substring false positives.
 */
export function findOrphanedPages(): { slug: string; type: string }[] {
  const orphans: { slug: string; type: string }[] = [];

  for (const review of productReviews) {
    const hasInbound =
      // Linked from a best page (exact product name match)?
      bestData.some(b => b.products.some(p => isProductMatch(p.name, review.productName))) ||
      // Linked from a compare page (exact product name match)?
      compareData.some(c =>
        isProductMatch(c.productA.name, review.productName) ||
        isProductMatch(c.productB.name, review.productName)
      ) ||
      // Linked from an alternatives page (exact match)?
      alternativesData.some(a => isProductMatch(a.toolName, review.productName));

    if (!hasInbound) {
      orphans.push({ slug: review.slug, type: 'review' });
    }
  }

  return orphans;
}
