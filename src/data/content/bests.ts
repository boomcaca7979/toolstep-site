// ToolStep Unified Content Schema — Migrated Best List Content
// Step 4 of UNIFIED_SCHEMA_MIGRATION_EXECUTION_PLAN.md
//
// Migrates all BestEntry records from legacy best.ts to unified BestListContent.
// Uses the bestEntryToContent() adapter for field mapping, then enriches with
// SEO fields (primaryKeyword, secondaryKeywords, priorityScore, difficulty, searchVolume)
// based on KEYWORD_EXPANSION_MATRIX.md logic.
//
// Legacy data file (best.ts) is NOT modified. This file reads it via the adapter
// and produces new unified records.
//
// Old pages (best/[slug].astro) continue to read from bestData (best.ts).
// This file is the new source of truth for future unified queries.

import type { BestListContent } from './schema';
import { bestEntryToContent } from './adapter';
import { bestData } from '../best';

// ============================================================
// Priority Score Model
// ============================================================
//
// Priority Score = Search Demand 30% + Buyer Intent 30% + Affiliate Value 20% + Competition 20%
// Scale: 0-100
//
// For Best Lists, buyer intent is very high (users are ready to buy).
// Scoring rules:
// - High-value categories (chairs, desks, monitors, headphones) → 85-95
// - Medium-value categories (keyboards, mice, docks, webcams) → 75-85
// - Software/subscription categories → 70-85
// - Niche/specific long-tail (under $X, for Y) → 65-80
// - Budget categories → 60-75

interface PriorityRule {
  match: RegExp;
  score: number;
}

const PRIORITY_RULES: PriorityRule[] = [
  // Tier 1 — Very high commercial value (90-95)
  { match: /best-office-chair$/, score: 93 },
  { match: /best-ergonomic-chair$/, score: 92 },
  { match: /best-standing-desk$/, score: 91 },
  { match: /best-mechanical-keyboard$/, score: 90 },
  { match: /best-monitor$/, score: 90 },
  { match: /best-headphones$/, score: 89 },
  { match: /best-gaming-chair$/, score: 88 },
  { match: /best-noise-cancel/, score: 88 },

  // Tier 1 — High-value specific (85-90)
  { match: /best-ergonomic-chair-under/, score: 89 },
  { match: /best-standing-desk-under/, score: 87 },
  { match: /best-gaming-chair-under/, score: 86 },
  { match: /best-office-chair-under/, score: 88 },
  { match: /best-monitor-for/, score: 86 },
  { match: /best-wireless-keyboard$/, score: 85 },
  { match: /best-wireless-mouse$/, score: 85 },
  { match: /best-gaming-mouse$/, score: 85 },
  { match: /best-4k-webcam$/, score: 85 },
  { match: /best-thunderbolt/, score: 85 },
  { match: /best-external-ssd$/, score: 85 },
  { match: /best-portable-ssd$/, score: 84 },

  // Tier 2 — Medium commercial value (75-85)
  { match: /best-usb-c-dock$/, score: 82 },
  { match: /best-usb-c-hub$/, score: 80 },
  { match: /best-webcam$/, score: 83 },
  { match: /best-microphone$/, score: 80 },
  { match: /best-streaming/, score: 78 },
  { match: /best-podcast/, score: 77 },
  { match: /best-desk/, score: 76 },
  { match: /best-monitor-light$/, score: 75 },
  { match: /best-screen-bar/, score: 75 },
  { match: /best-laptop-stand$/, score: 76 },
  { match: /best-speakers$/, score: 77 },
  { match: /best-wifi/, score: 76 },
  { match: /best-printer$/, score: 75 },
  { match: /best-projector$/, score: 78 },
  { match: /best-gaming-monitor/, score: 82 },
  { match: /best-curved-monitor/, score: 80 },
  { match: /best-4k-monitor$/, score: 81 },
  { match: /best-ultrawide/, score: 80 },
  { match: /best-wireless-earbuds$/, score: 82 },
  { match: /best-wireless-headphones$/, score: 83 },
  { match: /best-studio-headphones/, score: 79 },
  { match: /best-gaming-headset/, score: 81 },
  { match: /best-mechanical-keyboard-for/, score: 80 },
  { match: /best-mechanical-keyboard-under/, score: 78 },
  { match: /best-keyboard-for/, score: 80 },
  { match: /best-keyboard-under/, score: 75 },
  { match: /best-tkl-keyboard/, score: 77 },
  { match: /best-trackball/, score: 73 },
  { match: /best-wireless-gaming/, score: 79 },
  { match: /best-gaming-mouse-under/, score: 74 },
  { match: /best-budget/, score: 72 },
  { match: /best-portable-monitor/, score: 78 },
  { match: /best-usb-c-monitor/, score: 77 },
  { match: /best-mini-pc/, score: 80 },

  // Tier 2 — Software (75-85)
  { match: /best-productivity-software$/, score: 84 },
  { match: /best-note-taking/, score: 82 },
  { match: /best-project-management$/, score: 83 },
  { match: /best-project-management-for/, score: 80 },
  { match: /best-time-tracking/, score: 78 },
  { match: /best-password-manager/, score: 82 },
  { match: /best-task-management/, score: 80 },
  { match: /best-vpn-service/, score: 79 },
  { match: /best-ai-writing/, score: 78 },
  { match: /best-markdown-editor/, score: 75 },
  { match: /best-video-editing/, score: 78 },
  { match: /best-pomodoro/, score: 74 },
  { match: /best-screen-recorder/, score: 76 },
  { match: /best-mind-mapping/, score: 75 },
  { match: /best-whiteboard/, score: 76 },
  { match: /best-antivirus/, score: 78 },
  { match: /best-online-backup/, score: 77 },
  { match: /best-grammar-checker/, score: 76 },
  { match: /best-weather-app/, score: 68 },

  // Tier 3 — Lower commercial value (60-75)
  { match: /best-laptop-riser/, score: 70 },
  { match: /best-portable-laptop/, score: 72 },
  { match: /best-cooling-laptop/, score: 70 },
  { match: /best-adjustable-laptop/, score: 71 },
  { match: /best-bluetooth-speaker/, score: 73 },
  { match: /best-desktop-speakers/, score: 72 },
  { match: /best-2-1-speakers/, score: 70 },
  { match: /best-ethernet-switch/, score: 68 },
  { match: /best-vpn-router/, score: 70 },
  { match: /best-nas/, score: 74 },
  { match: /best-usb-flash/, score: 66 },
  { match: /best-cloud-storage/, score: 72 },
  { match: /best-external-hdd/, score: 68 },
  { match: /best-photo-printer/, score: 69 },
  { match: /best-all-in-one-printer/, score: 71 },
  { match: /best-portable-projector/, score: 73 },
  { match: /best-smart-display/, score: 68 },
  { match: /best-drawing-tablet/, score: 72 },
  { match: /best-streaming-deck/, score: 74 },
  { match: /best-standing-mat/, score: 68 },
  { match: /best-anti-fatigue/, score: 67 },
  { match: /best-desk-chair-cushion/, score: 65 },
  { match: /best-wrist-rest/, score: 64 },
  { match: /best-keyboard-wrist-rest/, score: 64 },
  { match: /best-monitor-arm/, score: 70 },
  { match: /best-desk-fan/, score: 62 },
  { match: /best-headphone-stand/, score: 60 },
  { match: /best-smart-speaker/, score: 68 },
  { match: /best-desk-lamp-with/, score: 70 },
];

// ============================================================
// Difficulty Model
// ============================================================
//
// Difficulty = estimated SEO competition (0-100)
// Best lists are highly competitive — Wirecutter/Tom's Hardware dominate.
// Scoring rules:
// - Broad keywords (best X) → 75-90 (very competitive)
// - Specific keywords (best X for Y) → 55-70
// - Budget/under keywords → 60-75
// - Software keywords → 50-70
// - Niche keywords → 40-60

interface DifficultyRule {
  match: RegExp;
  score: number;
}

const DIFFICULTY_RULES: DifficultyRule[] = [
  // Very high competition (80-90)
  { match: /best-office-chair$/, score: 88 },
  { match: /best-standing-desk$/, score: 85 },
  { match: /best-mechanical-keyboard$/, score: 82 },
  { match: /best-monitor$/, score: 84 },
  { match: /best-headphones$/, score: 86 },
  { match: /best-webcam$/, score: 80 },
  { match: /best-mouse$/, score: 82 },
  { match: /best-wifi-router$/, score: 80 },
  { match: /best-printer$/, score: 78 },
  { match: /best-laptop-stand$/, score: 80 },
  { match: /best-speakers$/, score: 80 },

  // High competition (70-80)
  { match: /best-ergonomic/, score: 75 },
  { match: /best-gaming/, score: 76 },
  { match: /best-wireless/, score: 74 },
  { match: /best-4k/, score: 73 },
  { match: /best-budget/, score: 72 },
  { match: /best-portable/, score: 70 },
  { match: /best-usb-c/, score: 70 },
  { match: /best-thunderbolt/, score: 68 },
  { match: /best-external/, score: 71 },
  { match: /best-cloud/, score: 72 },
  { match: /best-vpn/, score: 74 },
  { match: /best-antivirus/, score: 73 },
  { match: /best-project-management/, score: 72 },
  { match: /best-note-taking/, score: 73 },
  { match: /best-productivity/, score: 75 },

  // Medium competition (55-70)
  { match: /under-/, score: 62 },
  { match: /for-/, score: 60 },
  { match: /for-small/, score: 55 },
  { match: /for-mac/, score: 58 },
  { match: /for-conferencing/, score: 56 },
  { match: /for-calls/, score: 57 },
  { match: /for-startups/, score: 54 },
  { match: /for-programming/, score: 58 },
  { match: /for-home-office/, score: 60 },
  { match: /converter/, score: 55 },
  { match: /riser/, score: 52 },
  { match: /extender/, score: 54 },
  { match: /mat/, score: 50 },
  { match: /cushion/, score: 48 },
  { match: /wrist-rest/, score: 50 },
  { match: /fan/, score: 45 },
  { match: /stand$/, score: 58 },
];

// ============================================================
// Search Volume Model
// ============================================================
//
// Estimated monthly search volume (US) based on keyword patterns.
// "best X" broad terms have high volume; "best X for Y" are lower.

interface SearchVolumeRule {
  match: RegExp;
  volume: number;
}

const SEARCH_VOLUME_RULES: SearchVolumeRule[] = [
  // Very high volume (20000+)
  { match: /best-office-chair$/, volume: 33100 },
  { match: /best-standing-desk$/, volume: 27100 },
  { match: /best-mechanical-keyboard$/, volume: 22200 },
  { match: /best-monitor$/, volume: 18100 },
  { match: /best-headphones$/, volume: 33100 },
  { match: /best-webcam$/, volume: 27100 },
  { match: /best-wireless-mouse$/, volume: 18100 },
  { match: /best-gaming-mouse$/, volume: 14800 },
  { match: /best-wifi-router$/, volume: 18100 },
  { match: /best-printer$/, volume: 22200 },
  { match: /best-laptop-stand$/, volume: 14800 },
  { match: /best-gaming-chair$/, volume: 18100 },
  { match: /best-wireless-keyboard$/, volume: 12100 },
  { match: /best-gaming-headset$/, volume: 14800 },
  { match: /best-wireless-earbuds$/, volume: 18100 },

  // High volume (8000-20000)
  { match: /best-ergonomic-chair$/, volume: 12100 },
  { match: /best-gaming-monitor/, volume: 9900 },
  { match: /best-4k-monitor$/, volume: 8100 },
  { match: /best-ultrawide/, volume: 6600 },
  { match: /best-curved-monitor/, volume: 5400 },
  { match: /best-portable-monitor/, volume: 4400 },
  { match: /best-noise-cancel/, volume: 12100 },
  { match: /best-wireless-headphones$/, volume: 9900 },
  { match: /best-budget-headphones/, volume: 4400 },
  { match: /best-studio-headphones/, volume: 3600 },
  { match: /best-usb-c-dock$/, volume: 6600 },
  { match: /best-usb-c-hub$/, volume: 8100 },
  { match: /best-thunderbolt-dock$/, volume: 4400 },
  { match: /best-thunderbolt-4/, volume: 2900 },
  { match: /best-external-ssd$/, volume: 8100 },
  { match: /best-portable-ssd$/, volume: 6600 },
  { match: /best-nas$/, volume: 4400 },
  { match: /best-cloud-storage/, volume: 6600 },
  { match: /best-desk-lamp$/, volume: 8100 },
  { match: /best-monitor-light$/, volume: 4400 },
  { match: /best-screen-bar/, volume: 1900 },
  { match: /best-microphone$/, volume: 9900 },
  { match: /best-usb-microphone/, volume: 6600 },
  { match: /best-streaming-microphone$/, volume: 4400 },
  { match: /best-podcast-microphone/, volume: 3600 },
  { match: /best-desk-mat$/, volume: 5400 },
  { match: /best-desk-organizer/, volume: 4400 },
  { match: /best-cable-management/, volume: 3600 },
  { match: /best-monitor-stand$/, volume: 4400 },
  { match: /best-monitor-arm/, volume: 3600 },
  { match: /best-productivity-software$/, volume: 8100 },
  { match: /best-note-taking-app/, volume: 9900 },
  { match: /best-project-management$/, volume: 6600 },
  { match: /best-time-tracking/, volume: 4400 },
  { match: /best-password-manager/, volume: 12100 },
  { match: /best-vpn-service/, volume: 9900 },
  { match: /best-antivirus/, volume: 8100 },
  { match: /best-video-editing/, volume: 6600 },
  { match: /best-grammar-checker/, volume: 5400 },
  { match: /best-mind-mapping/, volume: 2900 },
  { match: /best-pomodoro/, volume: 3600 },
  { match: /best-screen-recorder/, volume: 4400 },
  { match: /best-whiteboard/, volume: 2900 },
  { match: /best-markdown-editor/, volume: 2400 },
  { match: /best-ai-writing/, volume: 4400 },
  { match: /best-mini-pc/, volume: 6600 },
  { match: /best-projector$/, volume: 8100 },
  { match: /best-portable-projector/, volume: 4400 },
  { match: /best-drawing-tablet/, volume: 3600 },
  { match: /best-streaming-deck/, volume: 2900 },

  // Medium volume (2000-8000)
  { match: /best-standing-desk-under/, volume: 3600 },
  { match: /best-ergonomic-chair-under/, volume: 4400 },
  { match: /best-office-chair-under/, volume: 5400 },
  { match: /best-gaming-chair-under/, volume: 2900 },
  { match: /best-keyboard-under/, volume: 2400 },
  { match: /best-mechanical-keyboard-under/, volume: 1900 },
  { match: /best-gaming-mouse-under/, volume: 1900 },
  { match: /best-webcam-for/, volume: 2400 },
  { match: /best-4k-webcam$/, volume: 3600 },
  { match: /best-webcam-for-mac/, volume: 1600 },
  { match: /best-budget-webcam/, volume: 1900 },
  { match: /best-streaming-webcam/, volume: 1600 },
  { match: /best-desk-pad$/, volume: 2400 },
  { match: /best-standing-mat/, volume: 1900 },
  { match: /best-anti-fatigue/, volume: 1300 },
  { match: /best-wrist-rest/, volume: 1900 },
  { match: /best-keyboard-wrist-rest/, volume: 1300 },
  { match: /best-desk-fan$/, volume: 1600 },
  { match: /best-headphone-stand/, volume: 1300 },
  { match: /best-laptop-riser/, volume: 1600 },
  { match: /best-portable-laptop/, volume: 1900 },
  { match: /best-cooling-laptop/, volume: 1300 },
  { match: /best-adjustable-laptop/, volume: 1300 },
  { match: /best-bluetooth-speaker/, volume: 6600 },
  { match: /best-desktop-speakers/, volume: 2900 },
  { match: /best-budget-speakers/, volume: 1900 },
  { match: /best-2-1-speakers/, volume: 1600 },
  { match: /best-smart-speaker/, volume: 2400 },
  { match: /best-mesh-wifi/, volume: 8100 },
  { match: /best-ethernet-switch/, volume: 1900 },
  { match: /best-wifi-extender/, volume: 4400 },
  { match: /best-vpn-router/, volume: 1300 },
  { match: /best-usb-flash/, volume: 2900 },
  { match: /best-external-hdd/, volume: 2400 },
  { match: /best-home-printer/, volume: 4400 },
  { match: /best-office-printer/, volume: 2900 },
  { match: /best-photo-printer/, volume: 1900 },
  { match: /best-budget-printer/, volume: 2400 },
  { match: /best-all-in-one-printer/, volume: 3600 },
  { match: /best-task-management/, volume: 2900 },
  { match: /best-project-management-for/, volume: 1300 },
  { match: /best-online-backup/, volume: 1900 },
  { match: /best-weather-app/, volume: 2900 },

  // Lower volume (500-2000)
  { match: /best-standing-desk-converter/, volume: 1600 },
  { match: /best-standing-desk-for-small/, volume: 720 },
  { match: /best-standing-desk-for-home/, volume: 1300 },
  { match: /best-portable-standing-desk/, volume: 880 },
  { match: /best-office-mechanical-keyboard/, volume: 880 },
  { match: /best-ergonomic-keyboard/, volume: 1900 },
  { match: /best-keyboard-for-programming/, volume: 1300 },
  { match: /best-mechanical-keyboard-for-mac/, volume: 880 },
  { match: /best-tkl-keyboard/, volume: 1300 },
  { match: /best-trackball/, volume: 880 },
  { match: /best-wireless-gaming-mouse/, volume: 1900 },
  { match: /best-budget-wireless-mouse/, volume: 1300 },
  { match: /best-ergonomic-mouse/, volume: 1900 },
  { match: /best-monitor-for-work/, volume: 1900 },
  { match: /best-usb-c-monitor/, volume: 880 },
  { match: /best-monitor-under/, volume: 1600 },
  { match: /best-portable-monitor-for-mac/, volume: 590 },
  { match: /best-gaming-monitor-under/, volume: 1300 },
  { match: /best-budget-monitor$/, volume: 1900 },
  { match: /best-headphones-for-work/, volume: 1300 },
  { match: /best-wireless-earbuds-for-calls/, volume: 880 },
  { match: /best-noise-canceling-earbuds/, volume: 1600 },
  { match: /best-desk-lamp-with/, volume: 880 },
  { match: /best-led-monitor-light/, volume: 720 },
  { match: /best-rgb-monitor-light/, volume: 590 },
  { match: /best-budget-microphone/, volume: 1300 },
  { match: /best-condenser-microphone/, volume: 880 },
  { match: /best-streaming-microphone-under/, volume: 720 },
  { match: /best-desk-chair-cushion/, volume: 880 },
  { match: /best-smart-display/, volume: 1300 },
  { match: /best-docking-station$/, volume: 2400 },
  { match: /best-laptop-dock$/, volume: 1600 },
  { match: /best-usb-c-hub-for-macbook/, volume: 1300 },
  { match: /best-budget-usb-c-hub/, volume: 880 },
];

// ============================================================
// Keyword Generation
// ============================================================

/**
 * Generates primary keyword from slug.
 * "best-standing-desk" → "best standing desk"
 */
function generatePrimaryKeyword(slug: string): string {
  return slug.replace(/-/g, ' ');
}

/**
 * Generates secondary keywords from slug and category.
 */
function generateSecondaryKeywords(slug: string, category: string): string[] {
  const base = slug.replace(/-/g, ' ');
  const keywords: string[] = [base];

  // Add year variant
  keywords.push(`${base} 2026`);

  // Add category-based keyword
  const catLower = category.toLowerCase();
  if (!keywords.includes(catLower)) {
    keywords.push(catLower);
  }

  // Add "review" variant
  if (base.startsWith('best ')) {
    keywords.push(base.replace('best ', '') + ' review');
  }

  // Add "buying guide" variant
  keywords.push(`${base} buying guide`);

  // Dedupe and limit to 5
  return [...new Set(keywords)].filter((k) => k.length > 2).slice(0, 5);
}

/**
 * Generates keyword cluster from category.
 */
function generateKeywordCluster(category: string): string {
  return category.toLowerCase().replace(/\s+/g, '-');
}

// ============================================================
// Score Calculation
// ============================================================

function calculatePriorityScore(slug: string): number {
  for (const rule of PRIORITY_RULES) {
    if (rule.match.test(slug)) return rule.score;
  }
  // Default for unmatched
  return 72;
}

function calculateDifficulty(slug: string): number {
  for (const rule of DIFFICULTY_RULES) {
    if (rule.match.test(slug)) return rule.score;
  }
  return 65;
}

function calculateSearchVolume(slug: string): number {
  for (const rule of SEARCH_VOLUME_RULES) {
    if (rule.match.test(slug)) return rule.volume;
  }
  return 1000;
}

// ============================================================
// Migrate Best Lists to Unified Content
// ============================================================

/**
 * Migrates all legacy BestEntry records to unified BestListContent.
 * Applies SEO field enrichment based on the scoring models above.
 */
function migrateBestLists(): BestListContent[] {
  return bestData.map((legacyEntry) => {
    // Run adapter to get base unified content
    const content = bestEntryToContent(legacyEntry);

    // Apply SEO field enrichment
    const slug = legacyEntry.slug;
    const priorityScore = calculatePriorityScore(slug);
    const difficulty = calculateDifficulty(slug);
    const searchVolume = calculateSearchVolume(slug);
    const primaryKeyword = generatePrimaryKeyword(slug);
    const secondaryKeywords = generateSecondaryKeywords(slug, legacyEntry.category);
    const keywordCluster = generateKeywordCluster(legacyEntry.category);

    return {
      ...content,
      primaryKeyword,
      secondaryKeywords,
      keywordCluster,
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
 * All best list content in unified BestListContent format.
 * This is the new source of truth for best list content.
 *
 * Old pages (best/[slug].astro) still read from bestData (best.ts).
 * Step 6 of the migration plan will switch them to read from here.
 */
export const bestListContent: BestListContent[] = migrateBestLists();

/**
 * Get all best list content (alias for consistency with task requirements).
 */
export function getAllBestLists(): BestListContent[] {
  return bestListContent;
}

/**
 * Get a best list content record by slug.
 */
export function getBestListBySlug(slug: string): BestListContent | undefined {
  return bestListContent.find((b) => b.slug === slug);
}

/**
 * Get best lists by category.
 */
export function getBestListsByCategory(category: string): BestListContent[] {
  return bestListContent.filter((b) => b.category === category);
}

/**
 * Get best lists by category slug.
 */
export function getBestListsByCategorySlug(categorySlug: string): BestListContent[] {
  return bestListContent.filter((b) => b.categorySlug === categorySlug);
}

/**
 * Get best lists by keyword cluster.
 */
export function getBestListsByCluster(cluster: string): BestListContent[] {
  return bestListContent.filter((b) => b.keywordCluster === cluster);
}

/**
 * Get best lists by priority tier.
 * Tier 1: 80-100, Tier 2: 60-79, Tier 3: 0-59
 */
export function getBestListsByPriorityTier(tier: 1 | 2 | 3): BestListContent[] {
  const ranges: Record<1 | 2 | 3, [number, number]> = {
    1: [80, 100],
    2: [60, 79],
    3: [0, 59],
  };
  const [min, max] = ranges[tier];
  return bestListContent.filter((b) => b.priorityScore >= min && b.priorityScore <= max);
}

/**
 * Total migrated best list count.
 */
export function getBestListCount(): number {
  return bestListContent.length;
}
