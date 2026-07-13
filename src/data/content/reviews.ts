// ToolStep Unified Content Schema — Migrated Product Reviews
// Step 3 of UNIFIED_SCHEMA_MIGRATION_EXECUTION_PLAN.md
//
// Migrates 35 ProductReviewEntry records from legacy data to unified ReviewContent.
// Uses the reviewEntryToContent() adapter for field mapping, then enriches with
// SEO fields (primaryKeyword, secondaryKeywords, priorityScore, difficulty)
// based on KEYWORD_EXPANSION_MATRIX.md logic.
//
// Legacy data files (products.ts, reviews/group1-5.ts, reviewEntries.ts) are
// NOT modified. This file reads them via the adapter and produces new unified records.
//
// Old pages (reviews/[slug].astro) continue to read from reviewEntries.ts.
// This file is the new source of truth for future unified queries.

import type { ReviewContent } from './schema';
import { reviewEntryToContent } from './adapter';
import { reviewEntries } from '../reviewEntries';

// ============================================================
// Priority Score Overrides
// ============================================================
//
// Priority Score = Search Demand 30% + Buyer Intent 30% + Affiliate Value 20% + Competition 20%
// Scale: 0-100
//
// Scores assigned per KEYWORD_EXPANSION_MATRIX.md logic:
// - High-price products ($300+) with strong buyer intent → 80-95
// - Mid-price products ($100-300) → 65-80
// - Lower-price products (<$100) or niche → 50-65

const PRIORITY_SCORES: Record<string, number> = {
  // Tier 1 — High-value hardware (80-95)
  'sony-wh-1000xm5-review': 92,
  'herman-miller-aeron-review': 93,
  'steelcase-leap-v2-review': 88,
  'uplift-v2-review': 91,
  'flexispot-e7-review': 89,
  'caldigit-ts4-review': 90,
  'logitech-mx-keys-s-review': 87,
  'logitech-mx-master-3s-review': 88,
  'dell-u2723qe-review': 90,
  'lg-c2-oled-review': 91,
  'sennheiser-momentum-4-review': 86,
  'secretlab-titan-evo-2022-review': 85,
  'branch-ergonomic-chair-review': 82,
  'steelcase-gesture-review': 84,
  'apple-magic-keyboard-review': 82,
  'benq-screenbar-halo-review': 81,

  // Tier 1 — High-value software (80-85)
  'obsidian-review': 86,
  'trello-review': 82,
  'linear-review': 83,

  // Tier 2 — Medium-value hardware (65-79)
  'keychron-k8-review': 78,
  'keychron-q1-review': 76,
  'satechi-thunderbolt-4-dock-review': 74,
  'plugable-usb-c-triple-review': 68,
  'elgato-stream-deck-mk2-review': 77,
  'razer-kiyo-pro-review': 73,
  'razer-deathadder-v3-pro-review': 72,
  'logitech-brio-4k-review': 75,
  'logitech-mx-anywhere-3s-review': 74,
  'autonomous-smartdesk-2-review': 70,
  'samsung-t7-shield-review': 73,
  'airpods-pro-2-review': 79,
  'anker-prime-20000-review': 66,

  // Tier 2 — Medium-value software (65-79)
  'things-3-review': 80,
  'bear-notes-review': 71,

  // Tier 3 — Lower value or niche (50-64)
  'anker-powercore-10000-review': 58,
};

// ============================================================
// Difficulty Overrides
// ============================================================
//
// Difficulty = estimated SEO competition (0-100)
// Based on competitor analysis from COMPETITOR_KEYWORD_GAP.md:
// - Products heavily covered by Wirecutter/Tom's Hardware → 70-90
// - Products with moderate competitor coverage → 50-70
// - Niche products with fewer competitors → 30-50

const DIFFICULTY_SCORES: Record<string, number> = {
  'sony-wh-1000xm5-review': 82,
  'herman-miller-aeron-review': 78,
  'steelcase-leap-v2-review': 72,
  'uplift-v2-review': 75,
  'flexispot-e7-review': 68,
  'caldigit-ts4-review': 55,
  'logitech-mx-keys-s-review': 72,
  'logitech-mx-master-3s-review': 74,
  'dell-u2723qe-review': 65,
  'lg-c2-oled-review': 80,
  'sennheiser-momentum-4-review': 70,
  'secretlab-titan-evo-2022-review': 73,
  'branch-ergonomic-chair-review': 58,
  'steelcase-gesture-review': 68,
  'apple-magic-keyboard-review': 80,
  'benq-screenbar-halo-review': 52,
  'obsidian-review': 58,
  'trello-review': 65,
  'linear-review': 50,
  'keychron-k8-review': 68,
  'keychron-q1-review': 62,
  'satechi-thunderbolt-4-dock-review': 56,
  'plugable-usb-c-triple-review': 48,
  'elgato-stream-deck-mk2-review': 70,
  'razer-kiyo-pro-review': 64,
  'razer-deathadder-v3-pro-review': 66,
  'logitech-brio-4k-review': 72,
  'logitech-mx-anywhere-3s-review': 71,
  'autonomous-smartdesk-2-review': 60,
  'samsung-t7-shield-review': 65,
  'airpods-pro-2-review': 85,
  'anker-prime-20000-review': 52,
  'things-3-review': 52,
  'bear-notes-review': 45,
  'anker-powercore-10000-review': 48,
};

// ============================================================
// Search Volume Estimates
// ============================================================
//
// Estimated monthly search volume (US) based on keyword research patterns.

const SEARCH_VOLUMES: Record<string, number> = {
  'sony-wh-1000xm5-review': 22000,
  'herman-miller-aeron-review': 18100,
  'steelcase-leap-v2-review': 8100,
  'uplift-v2-review': 5400,
  'flexispot-e7-review': 3600,
  'caldigit-ts4-review': 4400,
  'logitech-mx-keys-s-review': 6600,
  'logitech-mx-master-3s-review': 9900,
  'dell-u2723qe-review': 2900,
  'lg-c2-oled-review': 14800,
  'sennheiser-momentum-4-review': 4400,
  'secretlab-titan-evo-2022-review': 8100,
  'branch-ergonomic-chair-review': 1900,
  'steelcase-gesture-review': 3600,
  'apple-magic-keyboard-review': 12100,
  'benq-screenbar-halo-review': 1600,
  'obsidian-review': 18100,
  'trello-review': 27100,
  'linear-review': 4400,
  'keychron-k8-review': 8100,
  'keychron-q1-review': 4400,
  'satechi-thunderbolt-4-dock-review': 1300,
  'plugable-usb-c-triple-review': 880,
  'elgato-stream-deck-mk2-review': 2900,
  'razer-kiyo-pro-review': 1900,
  'razer-deathadder-v3-pro-review': 5400,
  'logitech-brio-4k-review': 6600,
  'logitech-mx-anywhere-3s-review': 4400,
  'autonomous-smartdesk-2-review': 2400,
  'samsung-t7-shield-review': 6600,
  'airpods-pro-2-review': 33100,
  'anker-prime-20000-review': 1900,
  'things-3-review': 8100,
  'bear-notes-review': 2400,
  'anker-powercore-10000-review': 3600,
};

// ============================================================
// Primary Keyword Overrides
// ============================================================
//
// For most reviews, the primary keyword is derived from the slug.
// These overrides provide more search-accurate keywords where needed.

const PRIMARY_KEYWORDS: Record<string, string> = {
  'sony-wh-1000xm5-review': 'sony wh-1000xm5 review',
  'herman-miller-aeron-review': 'herman miller aeron review',
  'steelcase-leap-v2-review': 'steelcase leap v2 review',
  'uplift-v2-review': 'uplift v2 review',
  'flexispot-e7-review': 'flexispot e7 review',
  'caldigit-ts4-review': 'caldigit ts4 review',
  'logitech-mx-keys-s-review': 'logitech mx keys s review',
  'logitech-mx-master-3s-review': 'logitech mx master 3s review',
  'dell-u2723qe-review': 'dell u2723qe review',
  'lg-c2-oled-review': 'lg c2 oled review',
  'sennheiser-momentum-4-review': 'sennheiser momentum 4 review',
  'secretlab-titan-evo-2022-review': 'secretlab titan evo 2022 review',
  'branch-ergonomic-chair-review': 'branch ergonomic chair review',
  'steelcase-gesture-review': 'steelcase gesture review',
  'apple-magic-keyboard-review': 'apple magic keyboard review',
  'benq-screenbar-halo-review': 'benq screenbar halo review',
  'obsidian-review': 'obsidian review',
  'trello-review': 'trello review',
  'linear-review': 'linear app review',
  'keychron-k8-review': 'keychron k8 review',
  'keychron-q1-review': 'keychron q1 review',
  'satechi-thunderbolt-4-dock-review': 'satechi thunderbolt 4 dock review',
  'plugable-usb-c-triple-review': 'plugable usb c triple display review',
  'elgato-stream-deck-mk2-review': 'elgato stream deck mk2 review',
  'razer-kiyo-pro-review': 'razer kiyo pro review',
  'razer-deathadder-v3-pro-review': 'razer deathadder v3 pro review',
  'logitech-brio-4k-review': 'logitech brio 4k review',
  'logitech-mx-anywhere-3s-review': 'logitech mx anywhere 3s review',
  'autonomous-smartdesk-2-review': 'autonomous smartdesk 2 review',
  'samsung-t7-shield-review': 'samsung t7 shield review',
  'airpods-pro-2-review': 'airpods pro 2 review',
  'anker-prime-20000-review': 'anker prime 20000 review',
  'things-3-review': 'things 3 review',
  'bear-notes-review': 'bear notes app review',
  'anker-powercore-10000-review': 'anker powercore 10000 review',
};

// ============================================================
// Secondary Keywords Overrides
// ============================================================
//
// Enhanced secondary keywords based on actual search patterns.
// Falls back to adapter-generated keywords if not listed here.

const SECONDARY_KEYWORDS: Record<string, string[]> = {
  'sony-wh-1000xm5-review': [
    'sony wh-1000xm5',
    'sony headphones review',
    'best noise cancelling headphones',
    'sony xm5 vs xm4',
    'wireless headphones review',
  ],
  'herman-miller-aeron-review': [
    'herman miller aeron',
    'aeron chair review',
    'best office chair',
    'herman miller review',
    'ergonomic chair review',
  ],
  'steelcase-leap-v2-review': [
    'steelcase leap v2',
    'leap v2 review',
    'best office chair under 1000',
    'steelcase chair',
    'ergonomic office chair',
  ],
  'uplift-v2-review': [
    'uplift v2',
    'uplift v2 review',
    'best standing desk',
    'standing desk review',
    'uplift desk',
  ],
  'flexispot-e7-review': [
    'flexispot e7',
    'flexispot e7 review',
    'best standing desk under 500',
    'flexispot standing desk',
    'standing desk review',
  ],
  'caldigit-ts4-review': [
    'caldigit ts4',
    'caldigit ts4 review',
    'best thunderbolt 4 dock',
    'thunderbolt dock review',
    'caldigit dock',
  ],
  'logitech-mx-keys-s-review': [
    'logitech mx keys s',
    'mx keys s review',
    'best wireless keyboard',
    'logitech keyboard review',
    'low profile keyboard',
  ],
  'logitech-mx-master-3s-review': [
    'logitech mx master 3s',
    'mx master 3s review',
    'best wireless mouse',
    'logitech mx master',
    'productivity mouse',
  ],
  'dell-u2723qe-review': [
    'dell u2723qe',
    'dell u2723qe review',
    'best 4k monitor',
    'usb-c monitor review',
    '27 inch 4k monitor',
  ],
  'lg-c2-oled-review': [
    'lg c2 oled',
    'lg c2 review',
    'best oled tv',
    'oled monitor review',
    '42 inch oled',
  ],
  'sennheiser-momentum-4-review': [
    'sennheiser momentum 4',
    'momentum 4 review',
    'best wireless headphones',
    'sennheiser review',
    'audiophile headphones',
  ],
  'secretlab-titan-evo-2022-review': [
    'secretlab titan evo 2022',
    'titan evo review',
    'best gaming chair',
    'secretlab chair',
    'gaming chair review',
  ],
  'branch-ergonomic-chair-review': [
    'branch ergonomic chair',
    'branch chair review',
    'best budget office chair',
    'branch furniture',
    'affordable ergonomic chair',
  ],
  'steelcase-gesture-review': [
    'steelcase gesture',
    'gesture chair review',
    'best ergonomic office chair',
    'steelcase review',
    'high end office chair',
  ],
  'apple-magic-keyboard-review': [
    'apple magic keyboard',
    'magic keyboard review',
    'best mac keyboard',
    'apple keyboard review',
    'wireless mac keyboard',
  ],
  'benq-screenbar-halo-review': [
    'benq screenbar halo',
    'screenbar halo review',
    'best monitor light bar',
    'benq screenbar',
    'desk light review',
  ],
  'obsidian-review': [
    'obsidian md review',
    'obsidian notes review',
    'obsidian vs notion',
    'markdown notes app',
    'obsidian app',
  ],
  'trello-review': [
    'trello app review',
    'trello project management',
    'trello vs asana',
    'trello kanban',
    'is trello free',
  ],
  'linear-review': [
    'linear app',
    'linear app review',
    'linear vs jira',
    'best project management software',
    'linear project management',
  ],
  'keychron-k8-review': [
    'keychron k8',
    'keychron k8 wireless',
    'mechanical keyboard review',
    'best wireless mechanical keyboard',
    'keychron review',
  ],
  'keychron-q1-review': [
    'keychron q1',
    'keychron q1 review',
    'best custom keyboard',
    'keychron q series',
    'aluminum keyboard review',
  ],
  'satechi-thunderbolt-4-dock-review': [
    'satechi thunderbolt 4 dock',
    'satechi dock review',
    'best thunderbolt 4 dock',
    'satechi usb c dock',
    'thunderbolt dock review',
  ],
  'plugable-usb-c-triple-review': [
    'plugable usb c triple display',
    'plugable dock review',
    'best usb c dock',
    'plugable triple display',
    'budget usb c dock',
  ],
  'elgato-stream-deck-mk2-review': [
    'elgato stream deck mk2',
    'stream deck mk2 review',
    'best streaming controller',
    'elgato deck',
    'streaming tools',
  ],
  'razer-kiyo-pro-review': [
    'razer kiyo pro',
    'kiyo pro review',
    'best streaming webcam',
    'razer webcam',
    '4k webcam review',
  ],
  'razer-deathadder-v3-pro-review': [
    'razer deathadder v3 pro',
    'deathadder v3 pro review',
    'best gaming mouse',
    'razer mouse review',
    'wireless gaming mouse',
  ],
  'logitech-brio-4k-review': [
    'logitech brio 4k',
    'brio 4k review',
    'best 4k webcam',
    'logitech brio',
    'business webcam review',
  ],
  'logitech-mx-anywhere-3s-review': [
    'logitech mx anywhere 3s',
    'mx anywhere 3s review',
    'best travel mouse',
    'compact wireless mouse',
    'logitech mouse review',
  ],
  'autonomous-smartdesk-2-review': [
    'autonomous smartdesk 2',
    'smartdesk 2 review',
    'best budget standing desk',
    'autonomous desk',
    'electric standing desk',
  ],
  'samsung-t7-shield-review': [
    'samsung t7 shield',
    't7 shield review',
    'best portable ssd',
    'rugged external ssd',
    'samsung t7',
  ],
  'airpods-pro-2-review': [
    'airpods pro 2',
    'airpods pro 2 review',
    'best wireless earbuds',
    'apple airpods review',
    'noise cancelling earbuds',
  ],
  'anker-prime-20000-review': [
    'anker prime 20000',
    'anker 20000 power bank',
    'best power bank',
    'anker portable charger',
    '20000mah power bank review',
  ],
  'things-3-review': [
    'things 3',
    'things 3 review',
    'best ios todo app',
    'things app',
    'cultured code things',
  ],
  'bear-notes-review': [
    'bear notes',
    'bear notes app review',
    'best markdown notes app',
    'bear app',
    'apple notes alternative',
  ],
  'anker-powercore-10000-review': [
    'anker powercore 10000',
    'powercore 10000 review',
    'best portable charger',
    'anker power bank',
    '10000mah power bank',
  ],
};

// ============================================================
// Migrate Reviews to Unified Content
// ============================================================

/**
 * Migrates all 35 legacy ProductReviewEntry records to unified ReviewContent.
 * Applies SEO field overrides (priorityScore, difficulty, searchVolume,
 * primaryKeyword, secondaryKeywords) from the tables above.
 */
function migrateReviews(): ReviewContent[] {
  return reviewEntries.map((legacyEntry) => {
    // Run adapter to get base unified content
    const content = reviewEntryToContent(legacyEntry);

    // Apply SEO field overrides
    const slug = legacyEntry.slug;
    const priorityScore = PRIORITY_SCORES[slug] ?? 75;
    const difficulty = DIFFICULTY_SCORES[slug] ?? 50;
    const searchVolume = SEARCH_VOLUMES[slug];
    const primaryKeyword = PRIMARY_KEYWORDS[slug] ?? content.primaryKeyword;
    const secondaryKeywords = SECONDARY_KEYWORDS[slug] ?? content.secondaryKeywords;

    return {
      ...content,
      primaryKeyword,
      secondaryKeywords,
      priorityScore,
      difficulty,
      searchVolume,
    };
  });
}

// ============================================================
// Exports
// ============================================================

/**
 * All 35 product reviews in unified ReviewContent format.
 * This is the new source of truth for review content.
 *
 * Old pages (reviews/[slug].astro) still read from reviewEntries.ts.
 * Step 6 of the migration plan will switch them to read from here.
 */
export const reviewContent: ReviewContent[] = migrateReviews();

/**
 * Get a review content record by slug.
 */
export function getReviewContentBySlug(slug: string): ReviewContent | undefined {
  return reviewContent.find((r) => r.slug === slug);
}

/**
 * Get all review slugs (for getStaticPaths).
 */
export function getAllReviewContentSlugs(): string[] {
  return reviewContent.map((r) => r.slug);
}

/**
 * Get reviews by category slug.
 */
export function getReviewContentByCategory(categorySlug: string): ReviewContent[] {
  return reviewContent.filter((r) => r.categorySlug === categorySlug);
}

/**
 * Get reviews by keyword cluster.
 */
export function getReviewContentByCluster(cluster: string): ReviewContent[] {
  return reviewContent.filter((r) => r.keywordCluster === cluster);
}

/**
 * Get reviews by priority tier.
 * Tier 1: 80-100, Tier 2: 60-79, Tier 3: 0-59
 */
export function getReviewContentByPriorityTier(tier: 1 | 2 | 3): ReviewContent[] {
  const ranges: Record<1 | 2 | 3, [number, number]> = {
    1: [80, 100],
    2: [60, 79],
    3: [0, 59],
  };
  const [min, max] = ranges[tier];
  return reviewContent.filter((r) => r.priorityScore >= min && r.priorityScore <= max);
}

/**
 * Total migrated review count.
 */
export function getReviewContentCount(): number {
  return reviewContent.length;
}
