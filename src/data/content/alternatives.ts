// ToolStep Unified Content Schema — Migrated Alternative Content
// Step 5B of UNIFIED_SCHEMA_MIGRATION_EXECUTION_PLAN.md
//
// Migrates all AlternativeEntry records from legacy alternatives.ts to unified
// AlternativeContent. Uses the alternativeEntryToContent() adapter for field
// mapping, then enriches with SEO fields (primaryKeyword, secondaryKeywords,
// priorityScore, difficulty, searchVolume) based on the priority model:
//   Priority = Search Demand 30% + Buyer Intent 30% + Affiliate Value 20% + Competition 20%
//
// Legacy data file (alternatives.ts) is NOT modified. This file reads it via the
// adapter and produces new unified records.
//
// Old pages (alternatives/[slug].astro) continue to read from alternativesData
// (alternatives.ts). This file is the new source of truth for future unified queries.

import type { AlternativeContent } from './schema';
import { alternativeEntryToContent } from './adapter';
import { alternativesData } from '../alternatives';

// ============================================================
// Priority Score Model
// ============================================================
//
// Priority Score = Search Demand 30% + Buyer Intent 30% + Affiliate Value 20% + Competition 20%
// Scale: 0-100
//
// For Alternatives lists, buyer intent is high (users are actively looking to switch
// tools). Alternatives keywords ("X alternatives") are highly commercial.
// Scoring rules:
// - Tier 1 flagships (Notion, Slack, Photoshop, GitHub, Mailchimp) → 88-95
// - Tier 2 popular tools (Obsidian, Evernote, Trello, Figma, Dropbox) → 82-88
// - Tier 3 mid-popularity tools → 76-82
// - Tier 4 niche tools → 70-76

interface PriorityRule {
  match: RegExp;
  score: number;
}

const PRIORITY_RULES: PriorityRule[] = [
  // Tier 1 — Flagship tools with massive search demand (90-95)
  { match: /notion-alternatives$/, score: 94 },
  { match: /slack-alternatives$/, score: 93 },
  { match: /photoshop-alternatives$/, score: 93 },
  { match: /github-alternatives$/, score: 92 },
  { match: /mailchimp-alternatives$/, score: 91 },
  { match: /shopify-alternatives$/, score: 91 },
  { match: /figma-alternatives$/, score: 90 },
  { match: /wordpress-alternatives$/, score: 92 },
  { match: /evernote-alternatives$/, score: 90 },
  { match: /trello-alternatives$/, score: 90 },
  { match: /zoom-alternatives$/, score: 90 },
  { match: /dropbox-alternatives$/, score: 90 },
  { match: /gmail-alternatives$/, score: 90 },
  { match: /nordvpn-alternatives$/, score: 90 },
  { match: /1password-alternatives$/, score: 90 },

  // Tier 2 — Popular tools with high demand (85-90)
  { match: /obsidian-alternatives$/, score: 88 },
  { match: /todoist-alternatives$/, score: 87 },
  { match: /asana-alternatives$/, score: 87 },
  { match: /monday-alternatives$/, score: 87 },
  { match: /clickup-alternatives$/, score: 88 },
  { match: /airtable-alternatives$/, score: 86 },
  { match: /coda-alternatives$/, score: 85 },
  { match: /onenote-alternatives$/, score: 86 },
  { match: /microsoft-teams-alternatives$/, score: 87 },
  { match: /discord-alternatives$/, score: 87 },
  { match: /whatsapp-alternatives$/, score: 86 },
  { match: /telegram-alternatives$/, score: 85 },
  { match: /sketch-alternatives$/, score: 85 },
  { match: /canva-alternatives$/, score: 86 },
  { match: /webflow-alternatives$/, score: 85 },
  { match: /illustrator-alternatives$/, score: 86 },
  { match: /indesign-alternatives$/, score: 84 },
  { match: /gitlab-alternatives$/, score: 85 },
  { match: /jira-alternatives$/, score: 86 },
  { match: /docker-alternatives$/, score: 85 },
  { match: /vscode-alternatives$/, score: 85 },
  { match: /google-drive-alternatives$/, score: 87 },
  { match: /onedrive-alternatives$/, score: 85 },
  { match: /hubspot-alternatives$/, score: 85 },
  { match: /wix-alternatives$/, score: 86 },
  { match: /squarespace-alternatives$/, score: 85 },
  { match: /medium-alternatives$/, score: 84 },
  { match: /premiere-pro-alternatives$/, score: 86 },
  { match: /final-cut-pro-alternatives$/, score: 85 },
  { match: /davinci-resolve-alternatives$/, score: 85 },
  { match: /ableton-alternatives$/, score: 85 },
  { match: /fl-studio-alternatives$/, score: 84 },
  { match: /outlook-alternatives$/, score: 86 },
  { match: /proton-mail-alternatives$/, score: 85 },
  { match: /google-calendar-alternatives$/, score: 86 },
  { match: /bitwarden-alternatives$/, score: 86 },
  { match: /lastpass-alternatives$/, score: 86 },
  { match: /expressvpn-alternatives$/, score: 86 },

  // Tier 3 — Mid-popularity tools (80-85)
  { match: /tana-alternatives$/, score: 82 },
  { match: /roam-research-alternatives$/, score: 82 },
  { match: /logseq-alternatives$/, score: 83 },
  { match: /workflowy-alternatives$/, score: 81 },
  { match: /mem-alternatives$/, score: 80 },
  { match: /amplenote-alternatives$/, score: 80 },
  { match: /bear-alternatives$/, score: 82 },
  { match: /apple-notes-alternatives$/, score: 83 },
  { match: /google-keep-alternatives$/, score: 82 },
  { match: /google-meet-alternatives$/, score: 84 },
  { match: /signal-alternatives$/, score: 82 },
  { match: /skype-alternatives$/, score: 83 },
  { match: /webex-alternatives$/, score: 81 },
  { match: /adobe-xd-alternatives$/, score: 82 },
  { match: /framer-alternatives$/, score: 82 },
  { match: /penpot-alternatives$/, score: 80 },
  { match: /bitbucket-alternatives$/, score: 82 },
  { match: /postman-alternatives$/, score: 82 },
  { match: /sublime-text-alternatives$/, score: 81 },
  { match: /intellij-alternatives$/, score: 82 },
  { match: /terminal-alternatives$/, score: 80 },
  { match: /icloud-alternatives$/, score: 82 },
  { match: /box-alternatives$/, score: 82 },
  { match: /mega-alternatives$/, score: 80 },
  { match: /pcloud-alternatives$/, score: 80 },
  { match: /nextcloud-alternatives$/, score: 81 },
  { match: /proton-drive-alternatives$/, score: 81 },
  { match: /tresorit-alternatives$/, score: 80 },
  { match: /ghost-alternatives$/, score: 82 },
  { match: /substack-alternatives$/, score: 82 },
  { match: /convertkit-alternatives$/, score: 81 },
  { match: /audacity-alternatives$/, score: 82 },
  { match: /garageband-alternatives$/, score: 82 },
  { match: /logic-pro-alternatives$/, score: 82 },
  { match: /obs-alternatives$/, score: 82 },
  { match: /streamlabs-alternatives$/, score: 80 },
  { match: /superhuman-alternatives$/, score: 80 },
  { match: /hey-alternatives$/, score: 80 },
  { match: /spark-alternatives$/, score: 81 },
  { match: /fantastical-alternatives$/, score: 80 },
  { match: /notion-calendar-alternatives$/, score: 80 },
  { match: /tutanota-alternatives$/, score: 80 },
  { match: /protonvpn-alternatives$/, score: 81 },
  { match: /surfshark-alternatives$/, score: 82 },
  { match: /mullvad-alternatives$/, score: 80 },
  { match: /proton-pass-alternatives$/, score: 80 },
  { match: /keepassxc-alternatives$/, score: 80 },
];

// ============================================================
// Difficulty Model
// ============================================================
//
// Difficulty = estimated SEO competition (0-100)
// "X alternatives" keywords are competitive — major review sites and listicles
// dominate. Slightly less competitive than "best X" keywords.
// Scoring rules:
// - Flagship tools (Notion, Slack, Photoshop) → 70-82
// - Popular tools → 60-72
// - Niche tools → 48-60

interface DifficultyRule {
  match: RegExp;
  score: number;
}

const DIFFICULTY_RULES: DifficultyRule[] = [
  // Very high competition (75-82)
  { match: /notion-alternatives$/, score: 80 },
  { match: /slack-alternatives$/, score: 78 },
  { match: /photoshop-alternatives$/, score: 80 },
  { match: /github-alternatives$/, score: 75 },
  { match: /mailchimp-alternatives$/, score: 76 },
  { match: /shopify-alternatives$/, score: 77 },
  { match: /figma-alternatives$/, score: 75 },
  { match: /wordpress-alternatives$/, score: 78 },
  { match: /evernote-alternatives$/, score: 75 },
  { match: /trello-alternatives$/, score: 75 },
  { match: /zoom-alternatives$/, score: 76 },
  { match: /dropbox-alternatives$/, score: 75 },
  { match: /gmail-alternatives$/, score: 76 },
  { match: /nordvpn-alternatives$/, score: 75 },
  { match: /1password-alternatives$/, score: 74 },

  // High competition (65-75)
  { match: /obsidian-alternatives$/, score: 68 },
  { match: /todoist-alternatives$/, score: 65 },
  { match: /asana-alternatives$/, score: 66 },
  { match: /monday-alternatives$/, score: 65 },
  { match: /clickup-alternatives$/, score: 67 },
  { match: /airtable-alternatives$/, score: 64 },
  { match: /coda-alternatives$/, score: 62 },
  { match: /onenote-alternatives$/, score: 66 },
  { match: /microsoft-teams-alternatives$/, score: 68 },
  { match: /discord-alternatives$/, score: 70 },
  { match: /whatsapp-alternatives$/, score: 72 },
  { match: /telegram-alternatives$/, score: 68 },
  { match: /sketch-alternatives$/, score: 65 },
  { match: /canva-alternatives$/, score: 66 },
  { match: /webflow-alternatives$/, score: 64 },
  { match: /illustrator-alternatives$/, score: 65 },
  { match: /indesign-alternatives$/, score: 62 },
  { match: /gitlab-alternatives$/, score: 65 },
  { match: /jira-alternatives$/, score: 66 },
  { match: /docker-alternatives$/, score: 65 },
  { match: /vscode-alternatives$/, score: 64 },
  { match: /google-drive-alternatives$/, score: 67 },
  { match: /onedrive-alternatives$/, score: 65 },
  { match: /hubspot-alternatives$/, score: 65 },
  { match: /wix-alternatives$/, score: 66 },
  { match: /squarespace-alternatives$/, score: 64 },
  { match: /medium-alternatives$/, score: 63 },
  { match: /premiere-pro-alternatives$/, score: 65 },
  { match: /final-cut-pro-alternatives$/, score: 64 },
  { match: /davinci-resolve-alternatives$/, score: 62 },
  { match: /ableton-alternatives$/, score: 63 },
  { match: /fl-studio-alternatives$/, score: 62 },
  { match: /outlook-alternatives$/, score: 66 },
  { match: /proton-mail-alternatives$/, score: 63 },
  { match: /google-calendar-alternatives$/, score: 65 },
  { match: /bitwarden-alternatives$/, score: 65 },
  { match: /lastpass-alternatives$/, score: 66 },
  { match: /expressvpn-alternatives$/, score: 65 },

  // Medium competition (55-65)
  { match: /tana-alternatives$/, score: 55 },
  { match: /roam-research-alternatives$/, score: 56 },
  { match: /logseq-alternatives$/, score: 57 },
  { match: /workflowy-alternatives$/, score: 54 },
  { match: /mem-alternatives$/, score: 52 },
  { match: /amplenote-alternatives$/, score: 52 },
  { match: /bear-alternatives$/, score: 58 },
  { match: /apple-notes-alternatives$/, score: 59 },
  { match: /google-keep-alternatives$/, score: 58 },
  { match: /google-meet-alternatives$/, score: 62 },
  { match: /signal-alternatives$/, score: 60 },
  { match: /skype-alternatives$/, score: 62 },
  { match: /webex-alternatives$/, score: 56 },
  { match: /adobe-xd-alternatives$/, score: 58 },
  { match: /framer-alternatives$/, score: 57 },
  { match: /penpot-alternatives$/, score: 50 },
  { match: /bitbucket-alternatives$/, score: 58 },
  { match: /postman-alternatives$/, score: 55 },
  { match: /sublime-text-alternatives$/, score: 52 },
  { match: /intellij-alternatives$/, score: 54 },
  { match: /terminal-alternatives$/, score: 50 },
  { match: /icloud-alternatives$/, score: 58 },
  { match: /box-alternatives$/, score: 57 },
  { match: /mega-alternatives$/, score: 52 },
  { match: /pcloud-alternatives$/, score: 52 },
  { match: /nextcloud-alternatives$/, score: 54 },
  { match: /proton-drive-alternatives$/, score: 54 },
  { match: /tresorit-alternatives$/, score: 50 },
  { match: /ghost-alternatives$/, score: 57 },
  { match: /substack-alternatives$/, score: 57 },
  { match: /convertkit-alternatives$/, score: 55 },
  { match: /audacity-alternatives$/, score: 58 },
  { match: /garageband-alternatives$/, score: 58 },
  { match: /logic-pro-alternatives$/, score: 58 },
  { match: /obs-alternatives$/, score: 60 },
  { match: /streamlabs-alternatives$/, score: 56 },
  { match: /superhuman-alternatives$/, score: 52 },
  { match: /hey-alternatives$/, score: 50 },
  { match: /spark-alternatives$/, score: 54 },
  { match: /fantastical-alternatives$/, score: 52 },
  { match: /notion-calendar-alternatives$/, score: 52 },
  { match: /tutanota-alternatives$/, score: 53 },
  { match: /protonvpn-alternatives$/, score: 55 },
  { match: /surfshark-alternatives$/, score: 57 },
  { match: /mullvad-alternatives$/, score: 50 },
  { match: /proton-pass-alternatives$/, score: 50 },
  { match: /keepassxc-alternatives$/, score: 53 },
];

// ============================================================
// Search Volume Model
// ============================================================
//
// Estimated monthly search volume (US) for "X alternatives" keywords.
// Flagship tools draw massive search volume; niche tools much less.

interface SearchVolumeRule {
  match: RegExp;
  volume: number;
}

const SEARCH_VOLUME_RULES: SearchVolumeRule[] = [
  // Very high volume (15000+)
  { match: /notion-alternatives$/, volume: 33100 },
  { match: /slack-alternatives$/, volume: 27100 },
  { match: /photoshop-alternatives$/, volume: 22200 },
  { match: /wordpress-alternatives$/, volume: 18100 },
  { match: /shopify-alternatives$/, volume: 14800 },
  { match: /evernote-alternatives$/, volume: 14800 },
  { match: /trello-alternatives$/, volume: 12100 },
  { match: /zoom-alternatives$/, volume: 12100 },
  { match: /figma-alternatives$/, volume: 12100 },
  { match: /dropbox-alternatives$/, volume: 9900 },
  { match: /gmail-alternatives$/, volume: 9900 },
  { match: /mailchimp-alternatives$/, volume: 8100 },
  { match: /github-alternatives$/, volume: 8100 },

  // High volume (3000-10000)
  { match: /obsidian-alternatives$/, volume: 6600 },
  { match: /todoist-alternatives$/, volume: 6600 },
  { match: /clickup-alternatives$/, volume: 6600 },
  { match: /asana-alternatives$/, volume: 5400 },
  { match: /monday-alternatives$/, volume: 4400 },
  { match: /onenote-alternatives$/, volume: 5400 },
  { match: /microsoft-teams-alternatives$/, volume: 4400 },
  { match: /discord-alternatives$/, volume: 6600 },
  { match: /whatsapp-alternatives$/, volume: 5400 },
  { match: /telegram-alternatives$/, volume: 4400 },
  { match: /canva-alternatives$/, volume: 6600 },
  { match: /illustrator-alternatives$/, volume: 4400 },
  { match: /webflow-alternatives$/, volume: 3600 },
  { match: /jira-alternatives$/, volume: 4400 },
  { match: /docker-alternatives$/, volume: 3600 },
  { match: /vscode-alternatives$/, volume: 4400 },
  { match: /google-drive-alternatives$/, volume: 4400 },
  { match: /onedrive-alternatives$/, volume: 3600 },
  { match: /hubspot-alternatives$/, volume: 3600 },
  { match: /wix-alternatives$/, volume: 4400 },
  { match: /squarespace-alternatives$/, volume: 3600 },
  { match: /medium-alternatives$/, volume: 3600 },
  { match: /premiere-pro-alternatives$/, volume: 3600 },
  { match: /final-cut-pro-alternatives$/, volume: 2900 },
  { match: /davinci-resolve-alternatives$/, volume: 2400 },
  { match: /ableton-alternatives$/, volume: 2900 },
  { match: /fl-studio-alternatives$/, volume: 2400 },
  { match: /outlook-alternatives$/, volume: 4400 },
  { match: /proton-mail-alternatives$/, volume: 2900 },
  { match: /google-calendar-alternatives$/, volume: 3600 },
  { match: /bitwarden-alternatives$/, volume: 4400 },
  { match: /lastpass-alternatives$/, volume: 4400 },
  { match: /nordvpn-alternatives$/, volume: 6600 },
  { match: /expressvpn-alternatives$/, volume: 4400 },
  { match: /1password-alternatives$/, volume: 3600 },

  // Medium volume (1000-3000)
  { match: /airtable-alternatives$/, volume: 2400 },
  { match: /coda-alternatives$/, volume: 1600 },
  { match: /tana-alternatives$/, volume: 720 },
  { match: /roam-research-alternatives$/, volume: 1300 },
  { match: /logseq-alternatives$/, volume: 1600 },
  { match: /workflowy-alternatives$/, volume: 880 },
  { match: /mem-alternatives$/, volume: 590 },
  { match: /amplenote-alternatives$/, volume: 480 },
  { match: /bear-alternatives$/, volume: 1900 },
  { match: /apple-notes-alternatives$/, volume: 1900 },
  { match: /google-keep-alternatives$/, volume: 1900 },
  { match: /google-meet-alternatives$/, volume: 2400 },
  { match: /signal-alternatives$/, volume: 1900 },
  { match: /skype-alternatives$/, volume: 1900 },
  { match: /webex-alternatives$/, volume: 1000 },
  { match: /sketch-alternatives$/, volume: 1600 },
  { match: /adobe-xd-alternatives$/, volume: 1600 },
  { match: /framer-alternatives$/, volume: 1300 },
  { match: /penpot-alternatives$/, volume: 480 },
  { match: /indesign-alternatives$/, volume: 1300 },
  { match: /gitlab-alternatives$/, volume: 1900 },
  { match: /bitbucket-alternatives$/, volume: 1300 },
  { match: /postman-alternatives$/, volume: 1000 },
  { match: /sublime-text-alternatives$/, volume: 720 },
  { match: /intellij-alternatives$/, volume: 880 },
  { match: /terminal-alternatives$/, volume: 480 },
  { match: /icloud-alternatives$/, volume: 1300 },
  { match: /box-alternatives$/, volume: 1300 },
  { match: /mega-alternatives$/, volume: 880 },
  { match: /pcloud-alternatives$/, volume: 720 },
  { match: /nextcloud-alternatives$/, volume: 880 },
  { match: /proton-drive-alternatives$/, volume: 720 },
  { match: /tresorit-alternatives$/, volume: 480 },
  { match: /ghost-alternatives$/, volume: 1600 },
  { match: /substack-alternatives$/, volume: 1300 },
  { match: /convertkit-alternatives$/, volume: 880 },
  { match: /audacity-alternatives$/, volume: 1600 },
  { match: /garageband-alternatives$/, volume: 1300 },
  { match: /logic-pro-alternatives$/, volume: 1300 },
  { match: /obs-alternatives$/, volume: 1900 },
  { match: /streamlabs-alternatives$/, volume: 880 },
  { match: /superhuman-alternatives$/, volume: 320 },
  { match: /hey-alternatives$/, volume: 260 },
  { match: /spark-alternatives$/, volume: 880 },
  { match: /fantastical-alternatives$/, volume: 480 },
  { match: /notion-calendar-alternatives$/, volume: 590 },
  { match: /tutanota-alternatives$/, volume: 720 },
  { match: /protonvpn-alternatives$/, volume: 1300 },
  { match: /surfshark-alternatives$/, volume: 1600 },
  { match: /mullvad-alternatives$/, volume: 590 },
  { match: /proton-pass-alternatives$/, volume: 480 },
  { match: /keepassxc-alternatives$/, volume: 880 },
];

// ============================================================
// Keyword Generation
// ============================================================

/**
 * Generates primary keyword from slug.
 * "notion-alternatives" → "notion alternatives"
 */
function generatePrimaryKeyword(slug: string): string {
  return slug.replace(/-/g, ' ');
}

/**
 * Generates secondary keywords from slug and anchor tool name.
 */
function generateSecondaryKeywords(slug: string, toolName: string): string[] {
  const base = slug.replace(/-/g, ' ');
  const keywords: string[] = [base];
  const tool = toolName.toLowerCase();

  // Add tool name alone
  keywords.push(tool);

  // Add "free" variant
  keywords.push(`free ${tool} alternatives`);

  // Add "open source" variant
  keywords.push(`open source ${tool} alternatives`);

  // Add "best" variant
  keywords.push(`best ${tool} alternatives`);

  // Add "like" variant
  keywords.push(`apps like ${tool}`);

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
  return 78;
}

function calculateDifficulty(slug: string): number {
  for (const rule of DIFFICULTY_RULES) {
    if (rule.match.test(slug)) return rule.score;
  }
  return 58;
}

function calculateSearchVolume(slug: string): number {
  for (const rule of SEARCH_VOLUME_RULES) {
    if (rule.match.test(slug)) return rule.volume;
  }
  return 800;
}

// ============================================================
// Migrate Alternatives to Unified Content
// ============================================================

/**
 * Migrates all legacy AlternativeEntry records to unified AlternativeContent.
 * Applies SEO field enrichment based on the scoring models above.
 *
 * whyChoose[] content is preserved via the adapter mapping to products[].why
 * (each whyChoose item is assigned to the corresponding product by index).
 * This migration trusts that mapping and does not drop any whyChoose content.
 */
function migrateAlternatives(): AlternativeContent[] {
  return alternativesData.map((legacyEntry) => {
    // Run adapter to get base unified content
    const content = alternativeEntryToContent(legacyEntry);

    // Apply SEO field enrichment
    const slug = legacyEntry.slug;
    const priorityScore = calculatePriorityScore(slug);
    const difficulty = calculateDifficulty(slug);
    const searchVolume = calculateSearchVolume(slug);
    const primaryKeyword = generatePrimaryKeyword(slug);
    const secondaryKeywords = generateSecondaryKeywords(slug, legacyEntry.toolName);
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
 * All alternative content in unified AlternativeContent format.
 * This is the new source of truth for alternative content.
 *
 * Old pages (alternatives/[slug].astro) still read from alternativesData
 * (alternatives.ts). Step 6 of the migration plan will switch them to read
 * from here.
 */
export const alternativeContent: AlternativeContent[] = migrateAlternatives();

/**
 * Get all alternative content.
 */
export function getAllAlternatives(): AlternativeContent[] {
  return alternativeContent;
}

/**
 * Get an alternative content record by slug.
 */
export function getAlternativeBySlug(slug: string): AlternativeContent | undefined {
  return alternativeContent.find((a) => a.slug === slug);
}

/**
 * Get alternatives by category.
 */
export function getAlternativesByCategory(category: string): AlternativeContent[] {
  return alternativeContent.filter((a) => a.category === category);
}

/**
 * Get alternatives by category slug.
 */
export function getAlternativesByCategorySlug(categorySlug: string): AlternativeContent[] {
  return alternativeContent.filter((a) => a.categorySlug === categorySlug);
}

/**
 * Get alternatives by keyword cluster.
 */
export function getAlternativesByCluster(cluster: string): AlternativeContent[] {
  return alternativeContent.filter((a) => a.keywordCluster === cluster);
}

/**
 * Get alternatives by priority tier.
 * Tier 1: 80-100, Tier 2: 60-79, Tier 3: 0-59
 */
export function getAlternativesByPriorityTier(tier: 1 | 2 | 3): AlternativeContent[] {
  const ranges: Record<1 | 2 | 3, [number, number]> = {
    1: [80, 100],
    2: [60, 79],
    3: [0, 59],
  };
  const [min, max] = ranges[tier];
  return alternativeContent.filter((a) => a.priorityScore >= min && a.priorityScore <= max);
}

/**
 * Find alternatives for a specific anchor tool (by tool name, case-insensitive).
 */
export function getAlternativesByTool(toolName: string): AlternativeContent[] {
  const lower = toolName.toLowerCase();
  return alternativeContent.filter(
    (a) => a.anchorProduct?.name.toLowerCase() === lower
  );
}

/**
 * Total migrated alternative count.
 */
export function getAlternativeCount(): number {
  return alternativeContent.length;
}
