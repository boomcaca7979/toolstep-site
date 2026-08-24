// Canonical Overrides — Cannibalization Whitelist (Phase 2B)
//
// Single source of truth for duplicate-intent URLs that must canonicalize
// to their hand-authored /reviews/ counterpart.
//
// Consumers:
//   - src/components/BaseHead.astro        (via page templates, canonical link)
//   - astro.config.mjs                     (sitemap exclusion of source URLs)
//
// Rules enforced by this map:
//   - Source pages keep returning 200 (no 301, no noindex, no deletion).
//   - Source pages are excluded from the sitemap.
//   - Target pages stay self-canonical and remain in the sitemap.
//
// Keys and values are full pathnames WITH trailing slash (site uses
// trailingSlash: 'always').

export const CANONICAL_OVERRIDES = {
  // ===== A. /compare/ vs /reviews/ — 17 exact-slug duplicates =====
  '/compare/claude-vs-chatgpt/': '/reviews/claude-vs-chatgpt/',
  '/compare/chatgpt-vs-gemini/': '/reviews/chatgpt-vs-gemini/',
  '/compare/claude-vs-gemini/': '/reviews/claude-vs-gemini/',
  '/compare/canva-vs-figma/': '/reviews/canva-vs-figma/',
  '/compare/chatgpt-vs-copilot/': '/reviews/chatgpt-vs-copilot/',
  '/compare/cursor-vs-windsurf/': '/reviews/cursor-vs-windsurf/',
  '/compare/expressvpn-vs-nordvpn/': '/reviews/expressvpn-vs-nordvpn/',
  '/compare/figma-vs-sketch/': '/reviews/figma-vs-sketch/',
  '/compare/github-copilot-vs-cursor/': '/reviews/github-copilot-vs-cursor/',
  '/compare/grammarly-vs-prowritingaid/': '/reviews/grammarly-vs-prowritingaid/',
  '/compare/midjourney-vs-dalle3/': '/reviews/midjourney-vs-dalle3/',
  '/compare/midjourney-vs-stable-diffusion/': '/reviews/midjourney-vs-stable-diffusion/',
  '/compare/notion-vs-confluence/': '/reviews/notion-vs-confluence/',
  '/compare/notion-vs-obsidian/': '/reviews/notion-vs-obsidian/',
  '/compare/slack-vs-teams/': '/reviews/slack-vs-teams/',
  '/compare/sony-wh-1000xm5-vs-sennheiser-momentum-4/': '/reviews/sony-wh-1000xm5-vs-sennheiser-momentum-4/',
  '/compare/todoist-vs-ticktick/': '/reviews/todoist-vs-ticktick/',

  // ===== B. /best/ vs /reviews/ — 5 duplicates =====
  '/best/best-ergonomic-chair-under-500/': '/reviews/best-ergonomic-chair-under-500/',
  '/best/best-office-mechanical-keyboard/': '/reviews/best-office-mechanical-keyboard/',
  '/best/best-standing-desk-converter/': '/reviews/best-standing-desk-converter/',
  '/best/best-standing-desk-under-300/': '/reviews/best-standing-desk-under-300/',
  '/best/best-standing-desk-for-home-office/': '/reviews/best-standing-desk-home-office/',

  // ===== C. /alternatives/ vs /reviews/ — 4 semantic duplicates =====
  '/alternatives/notion-alternatives/': '/reviews/notion-alternatives-2026/',
  '/alternatives/canva-alternatives/': '/reviews/canva-alternatives-2026/',
  '/alternatives/wordpress-alternatives/': '/reviews/wordpress-alternatives-2026/',
  '/alternatives/shopify-alternatives/': '/reviews/shopify-alternatives-2026/',
};

/**
 * Look up the canonical override target for a full pathname.
 * Returns undefined when the page must stay self-canonical.
 */
export function getCanonicalOverride(pathname) {
  return CANONICAL_OVERRIDES[pathname];
}
