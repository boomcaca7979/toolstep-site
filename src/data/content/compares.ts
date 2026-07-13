// ToolStep Unified Content Schema — Migrated Comparison Content
// Step 5A of UNIFIED_SCHEMA_MIGRATION_EXECUTION_PLAN.md
//
// Migrates all CompareEntry records from legacy compare.ts to unified ComparisonContent.
// Uses the compareEntryToContent() adapter for field mapping, then enriches with
// SEO fields (primaryKeyword, secondaryKeywords, priorityScore, difficulty, searchVolume)
// based on KEYWORD_EXPANSION_MATRIX.md logic.
//
// Legacy data file (compare.ts) is NOT modified. This file reads it via the adapter
// and produces new unified records.
//
// Old pages (compare/[slug].astro) continue to read from compareData (compare.ts).
// This file is the new source of truth for future unified queries.

import type { ComparisonContent } from './schema';
import { compareEntryToContent } from './adapter';
import { compareData } from '../compare';

// ============================================================
// Priority Score Model
// ============================================================
//
// Priority Score = Search Demand 30% + Buyer Intent 30% + Affiliate Value 20% + Competition 20%
// Scale: 0-100
//
// For Comparisons, buyer intent is very high (users are deciding between 2 products).
// Scoring rules:
// - High-value hardware comparisons (chairs, desks, monitors) → 85-95
// - Popular software comparisons (Claude vs ChatGPT, Notion vs Obsidian) → 90-95
// - Medium-value hardware (keyboards, mice, docks) → 75-85
// - Niche/specific comparisons → 65-75

interface PriorityRule {
  match: RegExp;
  score: number;
}

const PRIORITY_RULES: PriorityRule[] = [
  // Tier 1 — Very high commercial value (90-95) — popular software matchups
  { match: /claude-vs-chatgpt/, score: 95 },
  { match: /chatgpt-vs-gemini/, score: 93 },
  { match: /claude-vs-gemini/, score: 92 },
  { match: /notion-vs-obsidian/, score: 94 },
  { match: /notion-vs-todoist/, score: 91 },
  { match: /chatgpt-vs-copilot/, score: 90 },
  { match: /cursor-vs-windsurf/, score: 92 },
  { match: /cursor-vs-github-copilot/, score: 91 },
  { match: /figma-vs-sketch/, score: 90 },
  { match: /midjourney-vs-dalle/, score: 90 },
  { match: /slack-vs-teams/, score: 91 },
  { match: /expressvpn-vs-nordvpn/, score: 89 },
  { match: /1password-vs-bitwarden/, score: 88 },
  { match: /trello-vs-asana/, score: 90 },
  { match: /sony-wh-1000xm5-vs-bose/, score: 92 },
  { match: /airpods-pro-2-vs-galaxy/, score: 90 },
  { match: /herman-miller-aeron-vs-steelcase/, score: 91 },
  { match: /ipad-pro-vs-samsung/, score: 90 },

  // Tier 1 — High-value hardware (85-90)
  { match: /herman-miller-aeron-vs/, score: 88 },
  { match: /steelcase-leap-v2-vs/, score: 86 },
  { match: /flexispot-e7-vs-uplift/, score: 87 },
  { match: /uplift-v2-vs/, score: 85 },
  { match: /caldigit-ts4-vs/, score: 85 },
  { match: /sony-wh-1000xm5-vs/, score: 87 },
  { match: /logitech-brio-4k-vs/, score: 84 },
  { match: /lg-c2-vs/, score: 85 },
  { match: /secretlab-titan-vs-herman/, score: 86 },
  { match: /apple-studio-display-vs/, score: 85 },
  { match: /asus-proart-vs-dell/, score: 84 },
  { match: /premiere-pro-vs-davinci/, score: 86 },
  { match: /final-cut-pro-vs-davinci/, score: 85 },

  // Tier 2 — Medium-value (75-85)
  { match: /keychron-k8-vs/, score: 82 },
  { match: /keychron-q1-vs/, score: 80 },
  { match: /logitech-mx-keys-s-vs/, score: 81 },
  { match: /logitech-mx-master-3s-vs/, score: 80 },
  { match: /logitech-anywhere-3s-vs/, score: 78 },
  { match: /satechi-thunderbolt-4-vs/, score: 79 },
  { match: /benq-screenbar-halo-vs/, score: 77 },
  { match: /logitech-mx-master-3s-vs-razer/, score: 78 },
  { match: /sennheiser-momentum-4-vs/, score: 79 },
  { match: /bose-qc45-vs/, score: 80 },
  { match: /midjourney-vs-stable/, score: 82 },
  { match: /claude-vs-perplexity/, score: 85 },
  { match: /claude-vs-github-copilot/, score: 84 },
  { match: /grammarly-vs-prowritingaid/, score: 81 },
  { match: /1password-vs-dashlane/, score: 80 },
  { match: /notion-vs-confluence/, score: 80 },
  { match: /notion-vs-coda/, score: 79 },
  { match: /obsidian-vs-roam/, score: 78 },
  { match: /obsidian-vs-logseq/, score: 77 },
  { match: /canva-vs-figma/, score: 82 },
  { match: /figma-vs-adobe-xd/, score: 80 },
  { match: /figma-vs-framer/, score: 79 },
  { match: /todoist-vs-ticktick/, score: 78 },
  { match: /bitwarden-vs-lastpass/, score: 80 },
  { match: /surfshark-vs-nordvpn/, score: 78 },
  { match: /ableton-vs-fl-studio/, score: 79 },
  { match: /microsoft-teams-vs-zoom/, score: 80 },
  { match: /elgato-stream-deck-vs-razer/, score: 77 },
  { match: /logitech-g915-vs-razer/, score: 78 },
  { match: /logitech-g-pro-x-vs-razer/, score: 76 },

  // Tier 3 — Lower value or niche (65-75)
  { match: /keychron-k8-vs-redragon/, score: 70 },
  { match: /keychron-k8-vs-royal/, score: 68 },
  { match: /keychron-k8-vs-keychron-k1/, score: 72 },
  { match: /logitech-mx-keys-s-vs-keychron-k3/, score: 73 },
  { match: /logitech-mx-keys-s-vs-apple/, score: 74 },
  { match: /logitech-mx-master-3s-vs-magic/, score: 72 },
  { match: /logitech-mx-master-3s-vs-microsoft/, score: 71 },
  { match: /logitech-mx-master-3s-vs-mx-master-3$/, score: 70 },
  { match: /logitech-anywhere-3s-vs-mx-anywhere-2s/, score: 68 },
  { match: /caldigit-ts4-vs-anker/, score: 72 },
  { match: /caldigit-ts4-vs-owc/, score: 70 },
  { match: /caldigit-ts4-vs-belkin/, score: 71 },
  { match: /caldigit-ts4-vs-plugable/, score: 69 },
  { match: /satechi-vs-anker/, score: 68 },
  { match: /satechi-thunderbolt-4-vs-plugable/, score: 67 },
  { match: /benq-screenbar-halo-vs-baseus/, score: 66 },
  { match: /benq-screenbar-halo-vs-quntis/, score: 65 },
  { match: /benq-screenbar-halo-vs-yeelight/, score: 64 },
  { match: /logitech-brio-4k-vs-insta360/, score: 72 },
  { match: /logitech-brio-4k-vs-logitech-c920x/, score: 70 },
  { match: /logitech-brio-4k-vs-anzarow/, score: 66 },
  { match: /logitech-brio-4k-vs-razer-kiyo/, score: 71 },
  { match: /logitech-brio-4k-vs-elgato/, score: 70 },
  { match: /sony-wh-1000xm5-vs-apple-airpods/, score: 75 },
  { match: /sony-wh-1000xm5-vs-soundcore/, score: 70 },
  { match: /sony-wh-1000xm5-vs-jabra/, score: 68 },
  { match: /branch-ergonomic-chair-vs/, score: 72 },
  { match: /branch-ergonomic-chair-vs-hon/, score: 68 },
  { match: /steelcase-leap-v2-vs-haworth/, score: 70 },
  { match: /herman-miller-embody-vs-steelcase/, score: 75 },
  { match: /flexispot-e7-vs-branch/, score: 73 },
  { match: /flexispot-e7-vs-vari/, score: 72 },
  { match: /flexispot-e7-vs-autonomous/, score: 70 },
  { match: /uplift-v2-vs-vari/, score: 71 },
  { match: /branch-standing-desk-vs-vari/, score: 69 },
  { match: /apple-magic-keyboard-vs-logitech-craft/, score: 70 },
  { match: /mx-keys-mini-vs-magic-keyboard/, score: 68 },
  { match: /logitech-mx-keys-s-vs-keychron-q1/, score: 71 },
];

// ============================================================
// Difficulty Model
// ============================================================
//
// Difficulty = estimated SEO competition (0-100)
// Comparison keywords are competitive but less than "best X" keywords.
// Scoring rules:
// - Popular software matchups (Claude vs ChatGPT) → 70-85
// - Popular hardware matchups → 65-80
// - Niche matchups → 40-60

interface DifficultyRule {
  match: RegExp;
  score: number;
}

const DIFFICULTY_RULES: DifficultyRule[] = [
  // Very high competition (75-85)
  { match: /claude-vs-chatgpt/, score: 82 },
  { match: /chatgpt-vs-gemini/, score: 80 },
  { match: /notion-vs-obsidian/, score: 78 },
  { match: /notion-vs-todoist/, score: 76 },
  { match: /trello-vs-asana/, score: 77 },
  { match: /slack-vs-teams/, score: 75 },
  { match: /expressvpn-vs-nordvpn/, score: 76 },
  { match: /1password-vs-bitwarden/, score: 75 },
  { match: /sony-wh-1000xm5-vs-bose/, score: 78 },
  { match: /airpods-pro-2-vs-galaxy/, score: 75 },
  { match: /figma-vs-sketch/, score: 74 },
  { match: /midjourney-vs-dalle/, score: 75 },
  { match: /ipad-pro-vs-samsung/, score: 76 },
  { match: /herman-miller-aeron-vs-steelcase/, score: 72 },
  { match: /cursor-vs-windsurf/, score: 70 },
  { match: /cursor-vs-github-copilot/, score: 72 },

  // High competition (60-75)
  { match: /herman-miller-aeron-vs/, score: 68 },
  { match: /steelcase-leap-v2-vs/, score: 65 },
  { match: /flexispot-e7-vs/, score: 60 },
  { match: /uplift-v2-vs/, score: 62 },
  { match: /caldigit-ts4-vs/, score: 55 },
  { match: /keychron-k8-vs/, score: 58 },
  { match: /keychron-q1-vs/, score: 55 },
  { match: /logitech-mx-keys-s-vs/, score: 60 },
  { match: /logitech-mx-master-3s-vs/, score: 62 },
  { match: /sony-wh-1000xm5-vs/, score: 65 },
  { match: /logitech-brio-4k-vs/, score: 58 },
  { match: /benq-screenbar-halo-vs/, score: 48 },
  { match: /notion-vs/, score: 68 },
  { match: /obsidian-vs/, score: 58 },
  { match: /claude-vs/, score: 65 },
  { match: /chatgpt-vs/, score: 66 },
  { match: /figma-vs/, score: 62 },
  { match: /1password-vs/, score: 60 },
  { match: /midjourney-vs/, score: 60 },
  { match: /premiere-pro-vs/, score: 62 },
  { match: /final-cut-pro-vs/, score: 60 },
  { match: /microsoft-teams-vs/, score: 64 },
  { match: /ableton-vs/, score: 55 },
  { match: /canva-vs/, score: 60 },

  // Medium competition (45-60)
  { match: /satechi/, score: 48 },
  { match: /branch-ergonomic/, score: 45 },
  { match: /branch-standing/, score: 45 },
  { match: /vari/, score: 50 },
  { match: /autonomous/, score: 48 },
  { match: /logitech-anywhere/, score: 50 },
  { match: /logitech-mx-master-3s-vs-magic/, score: 52 },
  { match: /logitech-mx-master-3s-vs-microsoft/, score: 52 },
  { match: /logitech-mx-master-3s-vs-mx-master-3$/, score: 50 },
  { match: /logitech-mx-master-3s-vs-razer/, score: 54 },
  { match: /redragon/, score: 42 },
  { match: /royal/, score: 40 },
  { match: /keychron-k1/, score: 45 },
  { match: /keychron-k3/, score: 46 },
  { match: /apple-magic-keyboard/, score: 55 },
  { match: /logitech-craft/, score: 50 },
  { match: /mx-keys-mini/, score: 48 },
  { match: /anker/, score: 45 },
  { match: /owc/, score: 42 },
  { match: /belkin/, score: 44 },
  { match: /plugable/, score: 42 },
  { match: /baseus/, score: 38 },
  { match: /quntis/, score: 36 },
  { match: /yeelight/, score: 38 },
  { match: /insta360/, score: 48 },
  { match: /c920x/, score: 45 },
  { match: /anzarow/, score: 35 },
  { match: /kiyo/, score: 46 },
  { match: /elgato/, score: 48 },
  { match: /soundcore/, score: 42 },
  { match: /jabra/, score: 44 },
  { match: /airpods-max/, score: 55 },
  { match: /sennheiser/, score: 50 },
  { match: /bose-qc45/, score: 52 },
  { match: /embody/, score: 50 },
  { match: /haworth/, score: 42 },
  { match: /hon/, score: 40 },
  { match: /secretlab/, score: 55 },
  { match: /lg-c2/, score: 58 },
  { match: /samsung-s95b/, score: 52 },
  { match: /apple-studio-display/, score: 55 },
  { match: /lg-ultrafine/, score: 48 },
  { match: /asus-proart/, score: 52 },
  { match: /dell-ultrasharp/, score: 50 },
  { match: /dashlane/, score: 52 },
  { match: /lastpass/, score: 55 },
  { match: /surfshark/, score: 50 },
  { match: /confluence/, score: 52 },
  { match: /coda/, score: 48 },
  { match: /roam/, score: 45 },
  { match: /logseq/, score: 42 },
  { match: /adobe-xd/, score: 48 },
  { match: /framer/, score: 46 },
  { match: /ticktick/, score: 45 },
  { match: /prowritingaid/, score: 42 },
  { match: /perplexity/, score: 52 },
  { match: /github-copilot/, score: 55 },
  { match: /stable-diffusion/, score: 50 },
  { match: /davinci/, score: 48 },
  { match: /fl-studio/, score: 45 },
  { match: /zoom/, score: 50 },
  { match: /razer-stream-controller/, score: 42 },
  { match: /g915/, score: 48 },
  { match: /huntsman/, score: 46 },
  { match: /g-pro-x/, score: 50 },
  { match: /deathadder/, score: 48 },
];

// ============================================================
// Search Volume Model
// ============================================================

interface SearchVolumeRule {
  match: RegExp;
  volume: number;
}

const SEARCH_VOLUME_RULES: SearchVolumeRule[] = [
  // Very high volume (20000+)
  { match: /claude-vs-chatgpt/, volume: 60500 },
  { match: /chatgpt-vs-gemini/, volume: 33100 },
  { match: /notion-vs-obsidian/, volume: 27100 },
  { match: /notion-vs-todoist/, volume: 18100 },
  { match: /trello-vs-asana/, volume: 18100 },
  { match: /slack-vs-teams/, volume: 14800 },
  { match: /expressvpn-vs-nordvpn/, volume: 12100 },
  { match: /1password-vs-bitwarden/, volume: 9900 },
  { match: /sony-wh-1000xm5-vs-bose/, volume: 12100 },
  { match: /airpods-pro-2-vs-galaxy/, volume: 14800 },
  { match: /midjourney-vs-dalle/, volume: 12100 },
  { match: /ipad-pro-vs-samsung/, volume: 9900 },
  { match: /claude-vs-perplexity/, volume: 8100 },
  { match: /cursor-vs-windsurf/, volume: 6600 },
  { match: /cursor-vs-github-copilot/, volume: 5400 },

  // High volume (5000-20000)
  { match: /herman-miller-aeron-vs-steelcase/, volume: 6600 },
  { match: /herman-miller-aeron-vs/, volume: 4400 },
  { match: /flexispot-e7-vs-uplift/, volume: 3600 },
  { match: /caldigit-ts4-vs/, volume: 2900 },
  { match: /sony-wh-1000xm5-vs/, volume: 4400 },
  { match: /figma-vs-sketch/, volume: 4400 },
  { match: /canva-vs-figma/, volume: 3600 },
  { match: /midjourney-vs-stable/, volume: 4400 },
  { match: /notion-vs-confluence/, volume: 2400 },
  { match: /notion-vs-coda/, volume: 1900 },
  { match: /obsidian-vs-roam/, volume: 1600 },
  { match: /obsidian-vs-logseq/, volume: 1900 },
  { match: /1password-vs-dashlane/, volume: 2900 },
  { match: /bitwarden-vs-lastpass/, volume: 3600 },
  { match: /surfshark-vs-nordvpn/, volume: 2400 },
  { match: /premiere-pro-vs-davinci/, volume: 2900 },
  { match: /final-cut-pro-vs-davinci/, volume: 2400 },
  { match: /microsoft-teams-vs-zoom/, volume: 2900 },
  { match: /chatgpt-vs-copilot/, volume: 3600 },
  { match: /claude-vs-gemini/, volume: 8100 },
  { match: /claude-vs-github-copilot/, volume: 2400 },
  { match: /todoist-vs-ticktick/, volume: 2900 },
  { match: /grammarly-vs-prowritingaid/, volume: 1900 },
  { match: /lg-c2-vs/, volume: 2900 },
  { match: /apple-studio-display-vs/, volume: 2400 },
  { match: /secretlab-titan-vs/, volume: 1900 },

  // Medium volume (1000-5000)
  { match: /keychron-k8-vs/, volume: 1900 },
  { match: /keychron-q1-vs/, volume: 1300 },
  { match: /logitech-mx-keys-s-vs/, volume: 1600 },
  { match: /logitech-mx-master-3s-vs/, volume: 1900 },
  { match: /logitech-anywhere/, volume: 880 },
  { match: /satechi/, volume: 880 },
  { match: /benq-screenbar/, volume: 590 },
  { match: /logitech-brio-4k-vs/, volume: 1300 },
  { match: /uplift-v2-vs/, volume: 1300 },
  { match: /flexispot-e7-vs/, volume: 1000 },
  { match: /steelcase-leap-v2-vs/, volume: 880 },
  { match: /branch-ergonomic/, volume: 590 },
  { match: /branch-standing/, volume: 590 },
  { match: /vari/, volume: 720 },
  { match: /autonomous/, volume: 590 },
  { match: /asus-proart/, volume: 880 },
  { match: /ableton-vs/, volume: 1300 },
  { match: /figma-vs-adobe-xd/, volume: 1300 },
  { match: /figma-vs-framer/, volume: 880 },
  { match: /elgato-stream-deck-vs/, volume: 880 },
  { match: /logitech-g915-vs/, volume: 880 },
  { match: /logitech-g-pro-x-vs/, volume: 720 },
  { match: /sennheiser-momentum-4-vs/, volume: 880 },
  { match: /bose-qc45/, volume: 1000 },
  { match: /herman-miller-embody/, volume: 880 },
  { match: /haworth/, volume: 480 },

  // Lower volume (300-1000)
  { match: /redragon/, volume: 480 },
  { match: /royal/, volume: 390 },
  { match: /keychron-k1/, volume: 390 },
  { match: /keychron-k3/, volume: 480 },
  { match: /apple-magic-keyboard/, volume: 720 },
  { match: /logitech-craft/, volume: 390 },
  { match: /mx-keys-mini/, volume: 480 },
  { match: /anker/, volume: 390 },
  { match: /owc/, volume: 320 },
  { match: /belkin/, volume: 360 },
  { match: /plugable/, volume: 320 },
  { match: /baseus/, volume: 260 },
  { match: /quntis/, volume: 210 },
  { match: /yeelight/, volume: 260 },
  { match: /insta360/, volume: 480 },
  { match: /c920x/, volume: 390 },
  { match: /anzarow/, volume: 170 },
  { match: /kiyo/, volume: 390 },
  { match: /elgato-facecam/, volume: 320 },
  { match: /soundcore/, volume: 390 },
  { match: /jabra/, volume: 320 },
  { match: /airpods-max/, volume: 590 },
  { match: /hon/, volume: 260 },
  { match: /samsung-s95b/, volume: 390 },
  { match: /lg-ultrafine/, volume: 320 },
  { match: /dell-ultrasharp/, volume: 390 },
  { match: /dashlane/, volume: 480 },
  { match: /lastpass/, volume: 590 },
  { match: /confluence/, volume: 480 },
  { match: /coda/, volume: 390 },
  { match: /roam/, volume: 320 },
  { match: /logseq/, volume: 390 },
  { match: /adobe-xd/, volume: 480 },
  { match: /framer/, volume: 360 },
  { match: /ticktick/, volume: 720 },
  { match: /prowritingaid/, volume: 320 },
  { match: /perplexity/, volume: 1900 },
  { match: /github-copilot/, volume: 880 },
  { match: /stable-diffusion/, volume: 880 },
  { match: /davinci/, volume: 720 },
  { match: /fl-studio/, volume: 590 },
  { match: /zoom/, volume: 880 },
  { match: /razer-stream-controller/, volume: 260 },
  { match: /huntsman/, volume: 320 },
  { match: /deathadder/, volume: 480 },
  { match: /magic-mouse/, volume: 390 },
  { match: /microsoft-surface/, volume: 320 },
  { match: /mx-anywhere-2s/, volume: 260 },
  { match: /razer-basilisk/, volume: 390 },
  { match: /razer-pro-click/, volume: 260 },
];

// ============================================================
// Keyword Generation
// ============================================================

/**
 * Generates primary keyword from slug.
 * "flexispot-e7-vs-uplift-v2" → "flexispot e7 vs uplift v2"
 */
function generatePrimaryKeyword(slug: string): string {
  return slug.replace(/-/g, ' ');
}

/**
 * Generates secondary keywords from slug and products.
 */
function generateSecondaryKeywords(slug: string, productAName: string, productBName: string): string[] {
  const base = slug.replace(/-/g, ' ');
  const keywords: string[] = [base];

  // Add individual product names
  keywords.push(productAName.toLowerCase());
  keywords.push(productBName.toLowerCase());

  // Add "which is better" variant
  keywords.push(`${productAName.toLowerCase()} or ${productBName.toLowerCase()}`);

  // Add "comparison" variant
  keywords.push(`${base} comparison`);

  // Add "review" variant
  keywords.push(`${base} review`);

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
  return 72;
}

function calculateDifficulty(slug: string): number {
  for (const rule of DIFFICULTY_RULES) {
    if (rule.match.test(slug)) return rule.score;
  }
  return 55;
}

function calculateSearchVolume(slug: string): number {
  for (const rule of SEARCH_VOLUME_RULES) {
    if (rule.match.test(slug)) return rule.volume;
  }
  return 500;
}

// ============================================================
// Migrate Comparisons to Unified Content
// ============================================================

/**
 * Migrates all legacy CompareEntry records to unified ComparisonContent.
 * Applies SEO field enrichment based on the scoring models above.
 */
function migrateComparisons(): ComparisonContent[] {
  return compareData.map((legacyEntry) => {
    // Run adapter to get base unified content
    const content = compareEntryToContent(legacyEntry);

    // Apply SEO field enrichment
    const slug = legacyEntry.slug;
    const priorityScore = calculatePriorityScore(slug);
    const difficulty = calculateDifficulty(slug);
    const searchVolume = calculateSearchVolume(slug);
    const primaryKeyword = generatePrimaryKeyword(slug);
    const secondaryKeywords = generateSecondaryKeywords(
      slug,
      legacyEntry.productA.name,
      legacyEntry.productB.name
    );
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
 * All comparison content in unified ComparisonContent format.
 * This is the new source of truth for comparison content.
 *
 * Old pages (compare/[slug].astro) still read from compareData (compare.ts).
 * Step 6 of the migration plan will switch them to read from here.
 */
export const comparisonContent: ComparisonContent[] = migrateComparisons();

/**
 * Get all comparison content.
 */
export function getAllComparisons(): ComparisonContent[] {
  return comparisonContent;
}

/**
 * Get a comparison content record by slug.
 */
export function getComparisonBySlug(slug: string): ComparisonContent | undefined {
  return comparisonContent.find((c) => c.slug === slug);
}

/**
 * Get comparisons by category.
 */
export function getComparisonsByCategory(category: string): ComparisonContent[] {
  return comparisonContent.filter((c) => c.category === category);
}

/**
 * Get comparisons by category slug.
 */
export function getComparisonsByCategorySlug(categorySlug: string): ComparisonContent[] {
  return comparisonContent.filter((c) => c.categorySlug === categorySlug);
}

/**
 * Get comparisons by keyword cluster.
 */
export function getComparisonsByCluster(cluster: string): ComparisonContent[] {
  return comparisonContent.filter((c) => c.keywordCluster === cluster);
}

/**
 * Get comparisons by priority tier.
 * Tier 1: 80-100, Tier 2: 60-79, Tier 3: 0-59
 */
export function getComparisonsByPriorityTier(tier: 1 | 2 | 3): ComparisonContent[] {
  const ranges: Record<1 | 2 | 3, [number, number]> = {
    1: [80, 100],
    2: [60, 79],
    3: [0, 59],
  };
  const [min, max] = ranges[tier];
  return comparisonContent.filter((c) => c.priorityScore >= min && c.priorityScore <= max);
}

/**
 * Find comparisons involving a specific product (by name, case-insensitive partial match).
 */
export function getComparisonsByProduct(productName: string): ComparisonContent[] {
  const lower = productName.toLowerCase();
  return comparisonContent.filter(
    (c) =>
      c.products[0]?.name.toLowerCase().includes(lower) ||
      c.products[1]?.name.toLowerCase().includes(lower)
  );
}

/**
 * Total migrated comparison count.
 */
export function getComparisonCount(): number {
  return comparisonContent.length;
}
