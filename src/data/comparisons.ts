// Comparisons Data Layer
// Re-exports the compare data and adds convenience helpers.
// This is the single import point for comparison data across the site.

export { compareData } from './compare';
export type { CompareEntry, CompareProduct, CompareSpec, CompareFaq } from './compare';

import { compareData } from './compare';
import type { CompareEntry } from './compare';

/**
 * Get a comparison by slug.
 */
export function getComparisonBySlug(slug: string): CompareEntry | undefined {
  return compareData.find(c => c.slug === slug);
}

/**
 * Get all comparisons in a category.
 */
export function getComparisonsByCategory(category: string): CompareEntry[] {
  return compareData.filter(c => c.category === category);
}

/**
 * Find comparisons that include a specific product (by name token matching).
 */
export function getComparisonsForProduct(productName: string): CompareEntry[] {
  const tokens = productName.toLowerCase().split(/[\s-]+/).filter(t => t.length >= 3);
  return compareData.filter(c => {
    const a = c.productA.name.toLowerCase();
    const b = c.productB.name.toLowerCase();
    return tokens.some(t => a.includes(t) || b.includes(t));
  });
}
