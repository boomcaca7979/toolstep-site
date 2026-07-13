// Unified Review Entries
// Single source of truth for all product review data.
// Aggregates group1-5 extracted from 35 review pages.
// Used by src/pages/reviews/[slug].astro dynamic route.

import type { ProductReviewEntry } from './products';
import { group1Reviews } from './reviews/group1';
import { group2Reviews } from './reviews/group2';
import { group3Reviews } from './reviews/group3';
import { group4Reviews } from './reviews/group4';
import { group5Reviews } from './reviews/group5';

export type { ProductReviewEntry } from './products';

export const reviewEntries: ProductReviewEntry[] = [
  ...group1Reviews,
  ...group2Reviews,
  ...group3Reviews,
  ...group4Reviews,
  ...group5Reviews,
];

/**
 * Get a review entry by slug.
 */
export function getReviewEntryBySlug(slug: string): ProductReviewEntry | undefined {
  return reviewEntries.find(r => r.slug === slug);
}

/**
 * Get all review slugs (for getStaticPaths).
 */
export function getAllReviewSlugs(): string[] {
  return reviewEntries.map(r => r.slug);
}

/**
 * Get reviews by category.
 */
export function getReviewEntriesByCategory(categorySlug: string): ProductReviewEntry[] {
  return reviewEntries.filter(r => r.categorySlug === categorySlug);
}

/**
 * Total review count.
 */
export function getReviewCount(): number {
  return reviewEntries.length;
}
