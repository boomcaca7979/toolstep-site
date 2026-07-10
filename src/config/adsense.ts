// Google AdSense configuration for ToolStep.
// Replace ADSENSE_CLIENT with your real ca-pub-XXX publisher ID and
// the slot IDs below with the ones from your AdSense dashboard.
// Set ADSENSE_ENABLED to false to disable all ads site-wide (e.g. during
// development or before AdSense approval) without touching templates.

export type AdSlotPosition =
  | 'hero-below'   // directly below the hero section
  | 'content-mid'  // middle of the main article body
  | 'content-end'  // end of the main article body
  | 'sidebar'      // sidebar / aside column
  | 'mobile-bottom'; // sticky mobile bottom banner

export interface AdSlotConfig {
  /** AdSense slot ID (digits only). Empty string = slot disabled. */
  id: string;
  /** Reserved min height in px — guarantees CLS = 0 by reserving layout space. */
  minHeight: number;
  /** Reserved min width in px. */
  minWidth: number;
  /** Default ad format hint passed to AdSense. */
  format: 'auto' | 'horizontal' | 'vertical' | 'rectangle';
  /** Human-readable label for the slot (used in placeholder + ARIA). */
  label: string;
}

export interface AdsenseConfig {
  enabled: boolean;
  /** Publisher ID, e.g. ca-pub-1234567890123456 */
  client: string;
  /** Per-position slot configuration. */
  slots: Record<AdSlotPosition, AdSlotConfig>;
}

export const ADSENSE_CONFIG: AdsenseConfig = {
  // Master switch — flip to false to disable ads site-wide without code changes.
  enabled: true,
  // Replace with your real publisher ID. Placeholder keeps build clean.
  client: 'ca-pub-4267926791604017',
  slots: {
    'hero-below': {
      id: '1111111111',
      minHeight: 90,
      minWidth: 728,
      format: 'horizontal',
      label: 'Sponsored — Top Leaderboard',
    },
    'content-mid': {
      id: '2222222222',
      minHeight: 120,
      minWidth: 728,
      format: 'horizontal',
      label: 'Sponsored — In-Article',
    },
    'content-end': {
      id: '3333333333',
      minHeight: 250,
      minWidth: 300,
      format: 'rectangle',
      label: 'Sponsored — End of Article',
    },
    'sidebar': {
      id: '4444444444',
      minHeight: 600,
      minWidth: 300,
      format: 'vertical',
      label: 'Sponsored — Sidebar',
    },
    'mobile-bottom': {
      id: '5555555555',
      minHeight: 50,
      minWidth: 320,
      format: 'horizontal',
      label: 'Sponsored — Mobile Anchor',
    },
  },
};

/** Get a slot config by position. Returns null if disabled. */
export function getAdSlot(position: AdSlotPosition): AdSlotConfig | null {
  if (!ADSENSE_CONFIG.enabled) return null;
  const slot = ADSENSE_CONFIG.slots[position];
  if (!slot?.id) return null;
  return slot;
}
