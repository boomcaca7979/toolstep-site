// Affiliate link configuration for ToolStep reviews.
// Add or update links here — every review page pulls from this config.
// To enable a real affiliate link, replace the placeholder URL below.

export interface AffiliateLink {
  /** Retailer identifier */
  retailer: 'amazon' | 'bestbuy' | 'walmart' | 'official';
  /** Button label shown to the user */
  label: string;
  /** Destination URL (placeholder until real affiliate ID is configured) */
  url: string;
  /** Whether this retailer is currently active */
  enabled: boolean;
}

export interface AffiliateConfig {
  /** Product slug, matches the review page URL slug */
  slug: string;
  /** Retailer links for this product */
  links: {
    amazon?: AffiliateLink;
    bestbuy?: AffiliateLink;
    walmart?: AffiliateLink;
    official?: AffiliateLink;
  };
}

// Default Amazon affiliate tag used across all links
export const AFFILIATE_TAG = 'toolwise20-20';

// Generic search-based Amazon links (fallback when no product-specific URL exists)
function amazonSearch(query: string): string {
  return `https://www.amazon.com/s?k=${encodeURIComponent(query)}&tag=${AFFILIATE_TAG}`;
}

// Product affiliate configurations.
// To add a new product: copy an entry, update slug and link URLs.
// To disable a retailer: set enabled: false.
export const affiliateLinks: Record<string, AffiliateConfig> = {
  'best-standing-desk-under-300': {
    slug: 'best-standing-desk-under-300',
    links: {
      amazon: { retailer: 'amazon', label: 'Check Price', url: amazonSearch('flexispot e7 standing desk'), enabled: true },
      official: { retailer: 'official', label: 'Official Website', url: 'https://www.flexispot.com', enabled: true },
      bestbuy: { retailer: 'bestbuy', label: 'Compare Prices', url: 'https://www.bestbuy.com/site/searchpage.jsp?st=standing+desk', enabled: true },
    },
  },
  'best-standing-desk-home-office': {
    slug: 'best-standing-desk-home-office',
    links: {
      amazon: { retailer: 'amazon', label: 'Check Price', url: amazonSearch('branch standing desk'), enabled: true },
      official: { retailer: 'official', label: 'Official Website', url: 'https://www.branchfurniture.com', enabled: true },
      bestbuy: { retailer: 'bestbuy', label: 'Compare Prices', url: 'https://www.bestbuy.com/site/searchpage.jsp?st=standing+desk', enabled: true },
    },
  },
  'flexispot-e7-review': {
    slug: 'flexispot-e7-review',
    links: {
      amazon: { retailer: 'amazon', label: 'Check Price', url: amazonSearch('flexispot e7 standing desk'), enabled: true },
      official: { retailer: 'official', label: 'Official Website', url: 'https://www.flexispot.com', enabled: true },
      bestbuy: { retailer: 'bestbuy', label: 'Compare Prices', url: 'https://www.bestbuy.com/site/searchpage.jsp?st=flexispot', enabled: true },
    },
  },
  'uplift-v2-review': {
    slug: 'uplift-v2-review',
    links: {
      amazon: { retailer: 'amazon', label: 'Check Price', url: amazonSearch('uplift v2 standing desk'), enabled: true },
      official: { retailer: 'official', label: 'Official Website', url: 'https://www.upliftdesk.com', enabled: true },
      bestbuy: { retailer: 'bestbuy', label: 'Compare Prices', url: 'https://www.bestbuy.com/site/searchpage.jsp?st=uplift+desk', enabled: true },
    },
  },
  'branch-ergonomic-chair-review': {
    slug: 'branch-ergonomic-chair-review',
    links: {
      amazon: { retailer: 'amazon', label: 'Check Price', url: amazonSearch('branch ergonomic chair'), enabled: true },
      official: { retailer: 'official', label: 'Official Website', url: 'https://www.branchfurniture.com', enabled: true },
      bestbuy: { retailer: 'bestbuy', label: 'Compare Prices', url: 'https://www.bestbuy.com/site/searchpage.jsp?st=ergonomic+chair', enabled: true },
    },
  },
  'best-ergonomic-chair-under-500': {
    slug: 'best-ergonomic-chair-under-500',
    links: {
      amazon: { retailer: 'amazon', label: 'Check Price', url: amazonSearch('ergonomic office chair under 500'), enabled: true },
      official: { retailer: 'official', label: 'Official Website', url: 'https://www.branchfurniture.com', enabled: true },
      bestbuy: { retailer: 'bestbuy', label: 'Compare Prices', url: 'https://www.bestbuy.com/site/searchpage.jsp?st=ergonomic+chair', enabled: true },
    },
  },
  'herman-miller-aeron-review': {
    slug: 'herman-miller-aeron-review',
    links: {
      amazon: { retailer: 'amazon', label: 'Check Price', url: amazonSearch('herman miller aeron chair'), enabled: true },
      official: { retailer: 'official', label: 'Official Website', url: 'https://www.hermanmiller.com', enabled: true },
      bestbuy: { retailer: 'bestbuy', label: 'Compare Prices', url: 'https://www.bestbuy.com/site/searchpage.jsp?st=herman+miller+aeron', enabled: true },
    },
  },
  'steelcase-leap-v2-review': {
    slug: 'steelcase-leap-v2-review',
    links: {
      amazon: { retailer: 'amazon', label: 'Check Price', url: amazonSearch('steelcase leap v2 chair'), enabled: true },
      official: { retailer: 'official', label: 'Official Website', url: 'https://www.steelcase.com', enabled: true },
      bestbuy: { retailer: 'bestbuy', label: 'Compare Prices', url: 'https://www.bestbuy.com/site/searchpage.jsp?st=steelcase+leap', enabled: true },
    },
  },
  'best-office-mechanical-keyboard': {
    slug: 'best-office-mechanical-keyboard',
    links: {
      amazon: { retailer: 'amazon', label: 'Check Price', url: amazonSearch('keychron k8 mechanical keyboard'), enabled: true },
      official: { retailer: 'official', label: 'Official Website', url: 'https://www.keychron.com', enabled: true },
      bestbuy: { retailer: 'bestbuy', label: 'Compare Prices', url: 'https://www.bestbuy.com/site/searchpage.jsp?st=mechanical+keyboard', enabled: true },
    },
  },
  'keychron-k8-review': {
    slug: 'keychron-k8-review',
    links: {
      amazon: { retailer: 'amazon', label: 'Check Price', url: amazonSearch('keychron k8 keyboard'), enabled: true },
      official: { retailer: 'official', label: 'Official Website', url: 'https://www.keychron.com', enabled: true },
      bestbuy: { retailer: 'bestbuy', label: 'Compare Prices', url: 'https://www.bestbuy.com/site/searchpage.jsp?st=keychron', enabled: true },
    },
  },
  'logitech-mx-keys-s-review': {
    slug: 'logitech-mx-keys-s-review',
    links: {
      amazon: { retailer: 'amazon', label: 'Check Price', url: amazonSearch('logitech mx keys s'), enabled: true },
      official: { retailer: 'official', label: 'Official Website', url: 'https://www.logitech.com', enabled: true },
      bestbuy: { retailer: 'bestbuy', label: 'Compare Prices', url: 'https://www.bestbuy.com/site/searchpage.jsp?st=logitech+mx+keys', enabled: true },
    },
  },
  'best-wireless-mouse-productivity': {
    slug: 'best-wireless-mouse-productivity',
    links: {
      amazon: { retailer: 'amazon', label: 'Check Price', url: amazonSearch('logitech mx master 3s'), enabled: true },
      official: { retailer: 'official', label: 'Official Website', url: 'https://www.logitech.com', enabled: true },
      bestbuy: { retailer: 'bestbuy', label: 'Compare Prices', url: 'https://www.bestbuy.com/site/searchpage.jsp?st=wireless+mouse', enabled: true },
    },
  },
  'logitech-mx-master-3s-review': {
    slug: 'logitech-mx-master-3s-review',
    links: {
      amazon: { retailer: 'amazon', label: 'Check Price', url: amazonSearch('logitech mx master 3s mouse'), enabled: true },
      official: { retailer: 'official', label: 'Official Website', url: 'https://www.logitech.com', enabled: true },
      bestbuy: { retailer: 'bestbuy', label: 'Compare Prices', url: 'https://www.bestbuy.com/site/searchpage.jsp?st=mx+master+3s', enabled: true },
    },
  },
  'best-usbc-dock-macbook': {
    slug: 'best-usbc-dock-macbook',
    links: {
      amazon: { retailer: 'amazon', label: 'Check Price', url: amazonSearch('caldigit ts4 thunderbolt dock'), enabled: true },
      official: { retailer: 'official', label: 'Official Website', url: 'https://www.caldigit.com', enabled: true },
      bestbuy: { retailer: 'bestbuy', label: 'Compare Prices', url: 'https://www.bestbuy.com/site/searchpage.jsp?st=thunderbolt+dock', enabled: true },
    },
  },
  'caldigit-ts4-review': {
    slug: 'caldigit-ts4-review',
    links: {
      amazon: { retailer: 'amazon', label: 'Check Price', url: amazonSearch('caldigit ts4 dock'), enabled: true },
      official: { retailer: 'official', label: 'Official Website', url: 'https://www.caldigit.com', enabled: true },
      bestbuy: { retailer: 'bestbuy', label: 'Compare Prices', url: 'https://www.bestbuy.com/site/searchpage.jsp?st=caldigit', enabled: true },
    },
  },
  'best-monitor-light-bar': {
    slug: 'best-monitor-light-bar',
    links: {
      amazon: { retailer: 'amazon', label: 'Check Price', url: amazonSearch('benq screenbar halo'), enabled: true },
      official: { retailer: 'official', label: 'Official Website', url: 'https://www.benq.com', enabled: true },
      bestbuy: { retailer: 'bestbuy', label: 'Compare Prices', url: 'https://www.bestbuy.com/site/searchpage.jsp?st=monitor+light+bar', enabled: true },
    },
  },
  'benq-screenbar-halo-review': {
    slug: 'benq-screenbar-halo-review',
    links: {
      amazon: { retailer: 'amazon', label: 'Check Price', url: amazonSearch('benq screenbar halo'), enabled: true },
      official: { retailer: 'official', label: 'Official Website', url: 'https://www.benq.com', enabled: true },
      bestbuy: { retailer: 'bestbuy', label: 'Compare Prices', url: 'https://www.bestbuy.com/site/searchpage.jsp?st=benq+screenbar', enabled: true },
    },
  },
  'best-webcam-remote-work': {
    slug: 'best-webcam-remote-work',
    links: {
      amazon: { retailer: 'amazon', label: 'Check Price', url: amazonSearch('logitech brio 4k webcam'), enabled: true },
      official: { retailer: 'official', label: 'Official Website', url: 'https://www.logitech.com', enabled: true },
      bestbuy: { retailer: 'bestbuy', label: 'Compare Prices', url: 'https://www.bestbuy.com/site/searchpage.jsp?st=webcam', enabled: true },
    },
  },
  'logitech-brio-4k-review': {
    slug: 'logitech-brio-4k-review',
    links: {
      amazon: { retailer: 'amazon', label: 'Check Price', url: amazonSearch('logitech brio 4k webcam'), enabled: true },
      official: { retailer: 'official', label: 'Official Website', url: 'https://www.logitech.com', enabled: true },
      bestbuy: { retailer: 'bestbuy', label: 'Compare Prices', url: 'https://www.bestbuy.com/site/searchpage.jsp?st=logitech+brio', enabled: true },
    },
  },
  'best-noise-cancelling-headphones-work': {
    slug: 'best-noise-cancelling-headphones-work',
    links: {
      amazon: { retailer: 'amazon', label: 'Check Price', url: amazonSearch('sony wh-1000xm5 headphones'), enabled: true },
      official: { retailer: 'official', label: 'Official Website', url: 'https://www.sony.com', enabled: true },
      bestbuy: { retailer: 'bestbuy', label: 'Compare Prices', url: 'https://www.bestbuy.com/site/searchpage.jsp?st=noise+cancelling+headphones', enabled: true },
    },
  },
};

/**
 * Get affiliate links for a product slug.
 * Returns default placeholder config if slug is not found.
 */
export function getAffiliateLinks(slug: string): AffiliateConfig {
  return affiliateLinks[slug] || {
    slug,
    links: {
      amazon: { retailer: 'amazon', label: 'Check Price', url: amazonSearch(slug.replace(/-/g, ' ')), enabled: true },
      official: { retailer: 'official', label: 'Official Website', url: '#', enabled: false },
    },
  };
}
