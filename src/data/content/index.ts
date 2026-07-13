// ToolStep Unified Content Schema — Query API
// Single entry point for all content queries regardless of content type.
//
// This module provides two layers:
// 1. Unified query API (allContent) — empty until Steps 3-5 populate it
// 2. Legacy-bridged query API — converts legacy data on-the-fly via adapters
//
// Legacy data files are NOT modified. Adapters read them and return unified records.

import type { ToolStepContent } from './schema';
import type { ReviewContent, ComparisonContent, BestListContent, AlternativeContent } from './schema';
import type { ContentType, ContentStatus } from './types';
import {
  reviewEntryToContent,
  bestEntryToContent,
  compareEntryToContent,
  alternativeEntryToContent,
  reviewContentToEntry,
  bestListContentToEntry,
  comparisonContentToEntry,
  alternativeContentToEntry,
} from './adapter';

// Legacy type imports (for legacy-compatible query methods)
import type { ProductReviewEntry } from '../products';
import type { BestEntry } from '../best';
import type { CompareEntry } from '../compare';
import type { AlternativeEntry } from '../alternatives';

// Legacy data imports (runtime — read-only, not modified)
import { reviewEntries } from '../reviewEntries';
import { bestData } from '../best';
import { compareData } from '../compare';
import { alternativesData } from '../alternatives';

// Migrated content imports (Steps 3-5B)
import { reviewContent } from './reviews';
import { bestListContent } from './bests';
import { comparisonContent } from './compares';
import { alternativeContent } from './alternatives';

// ============================================================
// Unified Content Registry
// ============================================================

/**
 * All unified content records.
 * Empty until Steps 3-5 populate it with pre-migrated data.
 * Use the legacy-bridged functions below for now.
 */
export const allContent: ToolStepContent[] = [];

// ============================================================
// Legacy-Bridged Content (on-the-fly conversion via adapters)
// ============================================================

/**
 * All review content, converted on-the-fly from legacy reviewEntries.
 * No data is modified — adapters produce new unified records.
 */
export function getReviewContent(): ReviewContent[] {
  return reviewEntries.map(reviewEntryToContent);
}

/**
 * All best-list content, converted on-the-fly from legacy bestData.
 */
export function getBestContent(): BestListContent[] {
  return bestData.map(bestEntryToContent);
}

// ============================================================
// Migrated Best List Content (Step 4 — with SEO enrichment)
// ============================================================

/**
 * All best-list content from migrated data (with SEO fields).
 * Returns pre-migrated BestListContent from src/data/content/bests.ts.
 */
export function getAllBestLists(): BestListContent[] {
  return bestListContent;
}

/**
 * Get a best list content record by slug (from migrated data).
 */
export function getBestListBySlug(slug: string): BestListContent | undefined {
  return bestListContent.find((b) => b.slug === slug);
}

/**
 * Get best lists by category (from migrated data).
 */
export function getBestListsByCategory(category: string): BestListContent[] {
  return bestListContent.filter((b) => b.category === category);
}

/**
 * All comparison content, converted on-the-fly from legacy compareData.
 */
export function getCompareContent(): ComparisonContent[] {
  return compareData.map(compareEntryToContent);
}

// ============================================================
// Migrated Comparison Content (Step 5A — with SEO enrichment)
// ============================================================

/**
 * All comparison content from migrated data (with SEO fields).
 * Returns pre-migrated ComparisonContent from src/data/content/compares.ts.
 */
export function getAllComparisons(): ComparisonContent[] {
  return comparisonContent;
}

/**
 * Get a comparison content record by slug (from migrated data).
 */
export function getComparisonBySlug(slug: string): ComparisonContent | undefined {
  return comparisonContent.find((c) => c.slug === slug);
}

/**
 * Get comparisons by category (from migrated data).
 */
export function getComparisonsByCategory(category: string): ComparisonContent[] {
  return comparisonContent.filter((c) => c.category === category);
}

// ============================================================
// Migrated Alternative Content (Step 5B — with SEO enrichment)
// ============================================================

/**
 * All alternative content from migrated data (with SEO fields).
 * Returns pre-migrated AlternativeContent from src/data/content/alternatives.ts.
 */
export function getAllAlternatives(): AlternativeContent[] {
  return alternativeContent;
}

/**
 * Get alternatives by category (from migrated data).
 */
export function getAlternativesByCategory(category: string): AlternativeContent[] {
  return alternativeContent.filter((a) => a.category === category);
}

/**
 * All alternative content, converted on-the-fly from legacy alternativesData.
 */
export function getAlternativeContent(): AlternativeContent[] {
  return alternativesData.map(alternativeEntryToContent);
}

/**
 * Get all unified content (legacy-bridged).
 * Combines reviews, best lists, comparisons, and alternatives.
 */
export function getAllUnifiedContent(): ToolStepContent[] {
  return [
    ...getReviewContent(),
    ...getBestContent(),
    ...getCompareContent(),
    ...getAlternativeContent(),
  ];
}

// ============================================================
// Query Functions (legacy-bridged)
// ============================================================

/**
 * Get a single content record by slug.
 * Searches across all content types via legacy-bridged conversion.
 */
export function getContentBySlug(slug: string): ToolStepContent | undefined {
  return getAllUnifiedContent().find((c) => c.slug === slug);
}

/**
 * Get a single review content record by slug (from migrated data).
 */
export function getReviewBySlug(slug: string): ReviewContent | undefined {
  return reviewContent.find((c) => c.slug === slug);
}

/**
 * Get a single best-list content record by slug.
 */
export function getBestBySlug(slug: string): BestListContent | undefined {
  return getBestContent().find((c) => c.slug === slug);
}

/**
 * Get a single comparison content record by slug.
 */
export function getCompareBySlug(slug: string): ComparisonContent | undefined {
  return getCompareContent().find((c) => c.slug === slug);
}

/**
 * Get a single alternative content record by slug (from migrated data).
 */
export function getAlternativeBySlug(slug: string): AlternativeContent | undefined {
  return alternativeContent.find((a) => a.slug === slug);
}

// ============================================================
// Legacy-Compatible Query Methods (Step 6)
// ============================================================
//
// These return legacy entry shapes reconstructed from migrated unified content.
// Astro pages use these to switch data source to unified content while keeping
// template/SEO input structure unchanged.

/**
 * Get all review entries in legacy ProductReviewEntry shape (from migrated data).
 */
export function getReviewEntries(): ProductReviewEntry[] {
  return reviewContent.map(reviewContentToEntry);
}

/**
 * Get a single review entry in legacy ProductReviewEntry shape (from migrated data).
 */
export function getReviewEntryBySlug(slug: string): ProductReviewEntry | undefined {
  const content = reviewContent.find((c) => c.slug === slug);
  return content ? reviewContentToEntry(content) : undefined;
}

/**
 * Get all best entries in legacy BestEntry shape (from migrated data).
 */
export function getBestEntries(): BestEntry[] {
  return bestListContent.map(bestListContentToEntry);
}

/**
 * Get a single best entry in legacy BestEntry shape (from migrated data).
 */
export function getBestEntryBySlug(slug: string): BestEntry | undefined {
  const content = bestListContent.find((b) => b.slug === slug);
  return content ? bestListContentToEntry(content) : undefined;
}

/**
 * Get all compare entries in legacy CompareEntry shape (from migrated data).
 */
export function getCompareEntries(): CompareEntry[] {
  return comparisonContent.map(comparisonContentToEntry);
}

/**
 * Get a single compare entry in legacy CompareEntry shape (from migrated data).
 */
export function getCompareEntryBySlug(slug: string): CompareEntry | undefined {
  const content = comparisonContent.find((c) => c.slug === slug);
  return content ? comparisonContentToEntry(content) : undefined;
}

/**
 * Get all alternative entries in legacy AlternativeEntry shape (from migrated data).
 */
export function getAlternativeEntries(): AlternativeEntry[] {
  return alternativeContent.map(alternativeContentToEntry);
}

/**
 * Get a single alternative entry in legacy AlternativeEntry shape (from migrated data).
 */
export function getAlternativeEntryBySlug(slug: string): AlternativeEntry | undefined {
  const content = alternativeContent.find((a) => a.slug === slug);
  return content ? alternativeContentToEntry(content) : undefined;
}

/**
 * Get all content by content type (legacy-bridged).
 */
export function getContentByType(contentType: ContentType): ToolStepContent[] {
  return getAllUnifiedContent().filter((c) => c.contentType === contentType);
}

/**
 * Get all content by keyword cluster (legacy-bridged).
 */
export function getContentByCluster(cluster: string): ToolStepContent[] {
  return getAllUnifiedContent().filter((c) => c.keywordCluster === cluster);
}

/**
 * Get all content by category slug (legacy-bridged).
 */
export function getContentByCategory(categorySlug: string): ToolStepContent[] {
  return getAllUnifiedContent().filter((c) => c.categorySlug === categorySlug);
}

/**
 * Get all content by search intent (legacy-bridged).
 */
export function getContentByIntent(intent: 'commercial' | 'informational' | 'transactional'): ToolStepContent[] {
  return getAllUnifiedContent().filter((c) => c.searchIntent === intent);
}

/**
 * Get all content by status (legacy-bridged).
 */
export function getContentByStatus(status: ContentStatus): ToolStepContent[] {
  return getAllUnifiedContent().filter((c) => c.status === status);
}

/**
 * Get all content by priority tier (legacy-bridged).
 * Tier 1: 80-100, Tier 2: 60-79, Tier 3: 0-59
 */
export function getContentByPriorityTier(tier: 1 | 2 | 3): ToolStepContent[] {
  const ranges: Record<1 | 2 | 3, [number, number]> = {
    1: [80, 100],
    2: [60, 79],
    3: [0, 59],
  };
  const [min, max] = ranges[tier];
  return getAllUnifiedContent().filter((c) => c.priorityScore >= min && c.priorityScore <= max);
}

/**
 * Get all monetizable content above a minimum affiliate value (legacy-bridged).
 */
export function getMonetizableContent(
  minValue: 'low' | 'medium' | 'high' | 'very-high'
): ToolStepContent[] {
  const order: Record<string, number> = { none: 0, low: 1, medium: 2, high: 3, 'very-high': 4 };
  const threshold = order[minValue];
  return getAllUnifiedContent().filter((c) => order[c.affiliate] >= threshold);
}

/**
 * Get internal links for a content record (legacy-bridged).
 * Returns both incoming and outgoing links.
 */
export function getInternalLinks(slug: string): {
  incoming: ToolStepContent[];
  outgoing: ToolStepContent[];
} {
  const all = getAllUnifiedContent();
  const outgoing = all
    .filter((c) => c.slug === slug)
    .flatMap((c) => c.relatedContent.map((r) => r.slug))
    .map((s) => all.find((c) => c.slug === s))
    .filter((c): c is ToolStepContent => c !== undefined);

  const incoming = all.filter((c) =>
    c.relatedContent.some((r) => r.slug === slug)
  );

  return { incoming, outgoing };
}

/**
 * Get the production queue — content sorted by priority score (descending).
 */
export function getProductionQueue(limit: number): ToolStepContent[] {
  return [...getAllUnifiedContent()]
    .sort((a, b) => b.priorityScore - a.priorityScore)
    .slice(0, limit);
}

/**
 * Get total content count (legacy-bridged).
 */
export function getContentCount(): number {
  return getAllUnifiedContent().length;
}

// ============================================================
// Re-exports
// ============================================================

export type { ToolStepContent, ReviewContent, ComparisonContent, BestListContent, AlternativeContent } from './schema';
export type {
  ContentType,
  ListSubtype,
  ContentStatus,
  SearchIntent,
  AffiliateValue,
  AffiliateProgram,
  EstimatedValue,
  Faq,
  Spec,
  ContentSection,
  ProductRef,
  ComparisonData,
  ComparisonSpec,
  ComparisonScenario,
  RelatedLink,
  RecommendedProduct,
} from './types';

export {
  reviewEntryToContent,
  bestEntryToContent,
  compareEntryToContent,
  alternativeEntryToContent,
  reviewContentToEntry,
  bestListContentToEntry,
  comparisonContentToEntry,
  alternativeContentToEntry,
  legacyToContent,
  adapterRegistry,
} from './adapter';
