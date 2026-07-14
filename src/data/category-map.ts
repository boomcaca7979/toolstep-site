// Category Compatibility Mapping
// Maps free-form category strings used in reviews.ts / compare.ts / best.ts
// to the canonical slug system defined in categories.ts.
// Legacy data is NOT modified — this module only translates at read time.

import { categories } from './categories';

/**
 * Direct string mapping for unambiguous category labels.
 * Keys are the raw `category` field values found in data files.
 * Values are canonical slugs from categories.ts.
 */
const RAW_TO_SLUG: Record<string, string> = {
  // AI — direct matches
  'AI Image': 'ai-image',
  'AI Coding': 'ai-coding',
  'AI Video': 'ai-video',
  // AI — collapsed into ai-assistants (chatbots / search)
  'AI Chatbot': 'ai-assistants',
  'AI Search': 'ai-assistants',
  'Translation': 'ai-assistants',
  // AI writing — maps to dedicated ai-writing slug
  'AI Writing': 'ai-writing',

  // Productivity family
  'Productivity': 'productivity',
  'Productivity Software': 'productivity',
  'Collaboration Software': 'productivity',
  'Software': 'productivity',
  'Tablets': 'productivity',
  'Mini PCs': 'productivity',
  'Smart Home': 'productivity',
  'Weather Apps': 'productivity',

  // Design
  'Design Tools': 'design-tools',
  'Design': 'design-tools',
  'Design Software': 'design-tools',
  'Image Tools': 'design-tools',

  // Video
  'Video Tools': 'video-tools',
  'Video Software': 'video-tools',
  'Video & Audio': 'video-tools',
  'Streaming': 'video-tools',
  'Music Software': 'video-tools',

  // Security
  'Security': 'security',
  'VPN Software': 'security',
  'Security Software': 'security',

  // Cloud
  'Cloud Storage': 'cloud-storage',
  'Online Backup': 'cloud-storage',

  // AI writing — Writing Tools also maps here
  'Writing Tools': 'ai-writing',

  // Hardware — direct matches
  'Standing Desks': 'standing-desks',
  'Office Chairs': 'office-chairs',
  'Ergonomic Chairs': 'ergonomic-chairs',
  'Gaming Chairs': 'office-chairs',
  'Keyboards': 'keyboards',
  'Mice': 'mice',
  'Monitors': 'monitors',
  'Webcams': 'webcams',
  'Headphones': 'headphones',
  'Earbuds': 'headphones',
  'USB-C Docks': 'docks',
  'Storage': 'storage',

  // Hardware accessories — collapsed into desk-accessories
  'Desk Accessories': 'desk-accessories',
  'Monitor Lights': 'desk-accessories',
  'Microphones': 'desk-accessories',
  'Laptop Stands': 'desk-accessories',
  'Speakers': 'desk-accessories',
  'Smart Speakers': 'desk-accessories',
  'Networking': 'desk-accessories',
  'Printers': 'desk-accessories',
  'Controllers': 'desk-accessories',

  // Display-adjacent
  'TVs': 'monitors',
  'Projectors': 'monitors',
  'Gaming Monitors': 'monitors',

  // Keyboard variants
  'Mechanical Keyboards': 'keyboards',

  // Utilities
  'PDF Tools': 'productivity',
};

/**
 * Title-keyword rules for the catch-all 'Hardware' category used in reviews.ts.
 * The reviews.ts file labels 40+ entries simply as 'Hardware'; the real
 * sub-category is recoverable from the title. This is rule-based, not
 * per-page hardcoding.
 */
const HARDWARE_TITLE_RULES: { keywords: string[]; slug: string }[] = [
  // Most-specific multi-word matches first to avoid keyword collisions
  { keywords: ['standing desk', 'desk converter', 'flexispot', 'uplift v2'], slug: 'standing-desks' },
  { keywords: ['ergonomic chair', 'office chair', 'aeron', 'steelcase', 'leap', 'gesture', 'branch ergonomic', 'sihoo', 'hbada'], slug: 'ergonomic-chairs' },
  { keywords: ['mechanical keyboard', 'keyboard', 'keychron', 'logitech mx keys'], slug: 'keyboards' },
  { keywords: ['mouse', 'logitech mx master', 'logitech mx anywhere'], slug: 'mice' },
  // Desk accessories — check before storage/monitor to avoid "with Storage" collision
  { keywords: ['monitor light', 'desk lamp', 'screenbar', 'light bar', 'desk pad', 'cable management', 'phone stand', 'air purifier', 'foot rest', 'blue light', 'wireless charging', 'monitor riser', 'usb-c hub', 'laptop stand'], slug: 'desk-accessories' },
  { keywords: ['webcam', 'brio', 'insta360'], slug: 'webcams' },
  { keywords: ['headphones', 'noise cancel', 'anc', 'sony wh', 'soundcore', 'airpods'], slug: 'headphones' },
  { keywords: ['dock', 'thunderbolt', 'usb-c dock', 'caldigit', 'satechi'], slug: 'docks' },
  // Storage — use specific terms only to avoid matching "with Storage" in titles
  { keywords: ['external ssd', 'samsung t7', 'ssd for backup'], slug: 'storage' },
  { keywords: ['monitor', 'portable monitor', 'oled', 'dell u'], slug: 'monitors' },
];

/**
 * Map a raw category string (and optional title for disambiguation) to a
 * canonical categories.ts slug. Returns null when no mapping exists.
 */
export function mapCategoryToSlug(rawCategory: string, title?: string): string | null {
  // Direct lookup first
  const direct = RAW_TO_SLUG[rawCategory];
  if (direct) return direct;

  // Disambiguate the 'Hardware' catch-all via title keywords
  if (rawCategory === 'Hardware' && title) {
    const lower = title.toLowerCase();
    for (const rule of HARDWARE_TITLE_RULES) {
      if (rule.keywords.some((k) => lower.includes(k))) {
        return rule.slug;
      }
    }
  }

  // Fall back: try matching raw string to a slug directly (already a slug)
  if (categories.some((c) => c.slug === rawCategory)) {
    return rawCategory;
  }

  return null;
}

/**
 * Reverse lookup: given a canonical slug, return all raw category strings
 * that map to it (plus the slug itself). Used by category landing pages to
 * filter content from reviews.ts / compare.ts / best.ts.
 */
export function rawCategoriesForSlug(slug: string): string[] {
  const raws = Object.entries(RAW_TO_SLUG)
    .filter(([, s]) => s === slug)
    .map(([raw]) => raw);
  // Include the slug itself in case any data already uses the slug directly
  if (!raws.includes(slug)) raws.push(slug);
  // 'Hardware' catch-all contributes to hardware slugs via title rules
  if (['standing-desks', 'ergonomic-chairs', 'keyboards', 'mice', 'webcams', 'headphones', 'docks', 'storage', 'monitors', 'desk-accessories', 'office-chairs'].includes(slug)) {
    if (!raws.includes('Hardware')) raws.push('Hardware');
  }
  return raws;
}

/**
 * Check whether a content item's category (and optional title) belongs to a
 * given canonical slug. Convenience wrapper used by landing page filters.
 */
export function categoryMatches(rawCategory: string, slug: string, title?: string): boolean {
  return mapCategoryToSlug(rawCategory, title) === slug;
}
