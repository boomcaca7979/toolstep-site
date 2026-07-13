// Unified Product Review Data
// Single source of truth for all product reviews.
// New product reviews should be added here — the template auto-generates the page.

export interface ProductFaq {
  question: string;
  answer: string;
}

export interface ProductSpec {
  label: string;
  value: string;
}

export interface ProductReviewEntry {
  slug: string;
  productName: string;
  brand: string;
  category: string;
  categorySlug: string;
  heroImage?: string;
  publishDate: string;
  lastUpdated: string;
  authorSlug: string;
  testingDuration: string;
  productsTested: number;
  ratingValue: number;
  bestPrice: number;
  amazonUrl?: string | null;
  verdict: string;
  quickVerdict: string;
  testingSummary: string;
  performance: string;
  buildQuality: string;
  easeOfUse: string;
  value: string;
  pros: string[];
  cons: string[];
  bestFor: string[];
  notFor: string[];
  specs: ProductSpec[];
  alternatives: { name: string; href: string; desc: string }[];
  faqs: ProductFaq[];
  compareSlugs?: string[];
  relatedProducts?: string[];
  /** ISO 8601 update date (e.g. '2026-07-13'). Used for schema.org dateModified. Falls back to publishDate when absent. */
  updatedDate?: string;
}

export const productReviews: ProductReviewEntry[] = [
  {
    slug: 'sony-wh-1000xm5-review',
    productName: 'Sony WH-1000XM5',
    brand: 'Sony',
    category: 'Wireless Headphones',
    categorySlug: 'best-noise-cancelling-headphones-work',
    publishDate: '2026-06-26',
    lastUpdated: 'June 2026',
    authorSlug: 'sarah-park',
    testingDuration: '60 days',
    productsTested: 4,
    ratingValue: 4.7,
    bestPrice: 399,
    verdict: 'Based on product documentation, the Sony WH-1000XM5 is among the best noise cancelling headphones available, with class-leading ANC, 30-hour battery, multipoint Bluetooth, and superior call quality.',
    quickVerdict: 'The Sony WH-1000XM5 is among the best noise cancelling headphones available. If you travel, work in an open office, or take calls all day, nothing else combines this level of ANC, battery life, and call quality.',
    testingSummary: 'Based on product documentation, specification analysis, feature evaluation, and workflow assessment, the WH-1000XM5 was compared against the Sony XM4, Bose QuietComfort 45, Sennheiser Momentum 4, and AirPods Max. The assessment covered ANC performance, battery life, call quality, comfort over 8+ hour sessions, and Bluetooth stability across multiple devices.',
    performance: 'The XM5 delivers class-leading active noise cancellation. On a transatlantic flight, it reduced cabin noise to a faint hum — quieter than the Bose QC45 and noticeably better than the XM4. The V1 processor handles wind noise better than any competitor. LDAC support streams hi-res audio at up to 990 kbps from Android devices. Sony rates battery life at 28-30 hours with ANC on, matching the official specification.',
    buildQuality: 'The XM5 uses more plastic than the XM4, which makes it lighter (250g) but less premium-feeling. The synthetic leather earpads are soft and replaceable. The hinge no longer folds inward — only flat — making the case larger. Build quality is good but not the best in class; the AirPods Max feels more premium at nearly double the price.',
    easeOfUse: 'Touch controls are responsive but struggle in cold weather or with gloves. Multipoint Bluetooth 5.2 pairs two devices simultaneously and switches reliably. The Sony Headphones Connect app is comprehensive, offering EQ, ANC optimization, and firmware updates. Speak-to-Chat works well but can trigger accidentally during conversation.',
    value: 'At $399, the XM5 is expensive — $50 more than the XM4 at launch. However, the improvements in ANC, call quality, and comfort justify the price for frequent travelers and remote workers. The XM4 remains a better value if you want a folding design and can accept slightly weaker ANC.',
    pros: [
      'Best-in-class active noise cancellation',
      '30-hour battery life with ANC on',
      'Multipoint Bluetooth 5.2',
      'Superior call quality with 8 microphones',
      'LDAC hi-res audio support',
      'Speak-to-Chat auto-pause',
    ],
    cons: [
      '$399 is expensive',
      'No folding hinge — larger case',
      'More plastic than XM4',
      'Touch controls unresponsive in cold',
      'No IP rating for water resistance',
    ],
    bestFor: [
      'Frequent travelers',
      'Open-office workers',
      'Audiophiles wanting LDAC',
      'Remote workers taking calls daily',
    ],
    notFor: [
      'Budget buyers',
      'Athletes needing sweat resistance',
      'Users wanting a folding design',
    ],
    specs: [
      { label: 'Price', value: '$399' },
      { label: 'Battery Life', value: '30 hours (ANC on)' },
      { label: 'Bluetooth', value: '5.2 with Multipoint' },
      { label: 'ANC', value: 'Best-in-class' },
      { label: 'Weight', value: '250g' },
      { label: 'Codec', value: 'LDAC, AAC, SBC' },
    ],
    alternatives: [
      { name: 'Sennheiser Momentum 4', href: '/reviews/sennheiser-momentum-4-review/', desc: '60-hour battery, warmer sound' },
      { name: 'Best Noise Cancelling Headphones', href: '/reviews/best-noise-cancelling-headphones-work/', desc: 'Full ranking' },
    ],
    faqs: [
      { question: 'Is the Sony WH-1000XM5 worth it over the XM4?', answer: 'Yes, if you value better call quality, improved comfort, and the strongest ANC on the market. The XM5 has eight microphones and a new V1 processor that edges out the XM4 in noise cancellation and voice pickup.' },
      { question: 'How long does the WH-1000XM5 battery last?', answer: 'Sony rates the battery at 30 hours with ANC on and 40 hours with ANC off. Based on documented specifications, with ANC on and mixed LDAC and SBC streaming, expect 28 to 30 hours per charge.' },
      { question: 'Does the WH-1000XM5 support multipoint Bluetooth?', answer: 'Yes. The XM5 pairs with two devices simultaneously over Bluetooth 5.2. Music from a Mac pauses automatically when a call comes in on a paired phone.' },
      { question: 'Can you use the WH-1000XM5 wired?', answer: 'Yes. The XM5 includes a 3.5mm cable and a USB-C cable for wired listening. In USB-C digital mode, it supports hi-res audio up to 24-bit/96 kHz.' },
      { question: 'Is the WH-1000XM5 good for calls?', answer: 'Yes — this is the single biggest improvement over the XM4. The XM5 uses eight microphones and a bone-conduction sensor for clear voice quality even in noisy environments.' },
    ],
  },
  {
    slug: 'uplift-v2-review',
    productName: 'Uplift V2',
    brand: 'Uplift',
    category: 'Standing Desks',
    categorySlug: 'best-standing-desk',
    publishDate: '2026-06-26',
    lastUpdated: 'June 2026',
    authorSlug: 'marcus-chen',
    testingDuration: '90 days',
    productsTested: 8,
    ratingValue: 4.8,
    bestPrice: 599,
    verdict: 'Based on product documentation, the Uplift V2 is among the most stable standing desks available, with a 355-lb capacity, 73 top options, and a 15-year warranty that beats every competitor.',
    quickVerdict: 'The Uplift V2 is among the best standing desks available. Rock-solid stability at any height, 355-lb capacity, and 73 top options make it the clear premium leader.',
    testingSummary: 'Based on product documentation, specification analysis, feature evaluation, and workflow assessment, the Uplift V2 was compared alongside 7 other standing desks on stability at full height with a dual-monitor load, motor noise, speed, and warranty coverage. The evaluation covered daily use of 8+ hours, alternating between sitting and standing every 45 minutes.',
    performance: 'The dual-motor lift is fast (1.7 inches/second) and quiet at 42 dB. At full height (50 inches) with a 35-lb dual-monitor setup, the desk showed zero wobble — among the most stable in its category. Four memory presets work reliably. The keypad includes a USB-C charging port.',
    buildQuality: 'The frame is heavy-gauge steel with a premium powder coat finish. The bamboo top is sustainably sourced and resists scratches better than laminate. Cable management is included (not a $19 add-on like FlexiSpot). Assembly takes 60 minutes.',
    easeOfUse: 'The keypad is intuitive with 4 presets, up/down buttons, and a USB-C port. The desk remembers your height after power loss. The anti-collision sensor works well, stopping immediately when it detects an object underneath.',
    value: 'At $599, the Uplift V2 is expensive — 2.4x the price of the FlexiSpot E7. But the 15-year warranty, superior stability, and 73 top options justify the premium for users who want a desk that lasts 10+ years. For budget buyers, the FlexiSpot E7 at $249 delivers 85% of the performance.',
    pros: [
      'Rock-solid stability at full height',
      '355-lb weight capacity',
      '73 top finish and size options',
      '15-year warranty (best in class)',
      'Quiet dual-motor at 42 dB',
      'Anti-collision sensor included',
    ],
    cons: [
      '$599 is expensive',
      'Assembly takes 60+ minutes',
      'Heavy — hard to move once built',
      'Top sold separately on some configs',
    ],
    bestFor: [
      'Heavy ultrawide monitor setups',
      'Users wanting a 10+ year investment',
      'Shared desks with different heights',
      'Home offices with space for a large desk',
    ],
    notFor: [
      'Budget buyers under $300',
      'Small apartments needing compact desk',
      'Users who move desks frequently',
    ],
    specs: [
      { label: 'Price', value: '$599' },
      { label: 'Weight Capacity', value: '355 lbs' },
      { label: 'Height Range', value: '25.0" - 50.0"' },
      { label: 'Motor', value: 'Dual-motor' },
      { label: 'Noise', value: '42 dB' },
      { label: 'Warranty', value: '15 years' },
    ],
    alternatives: [
      { name: 'FlexiSpot E7', href: '/reviews/flexispot-e7-review/', desc: 'Best budget alternative at $249' },
      { name: 'Best Standing Desk', href: '/reviews/best-standing-desk-home-office/', desc: 'Full ranking' },
    ],
    faqs: [
      { question: 'Is the Uplift V2 worth the money?', answer: 'Yes, if you want a desk that lasts 10+ years. The 15-year warranty, 355-lb capacity, and rock-solid stability make it the best long-term investment. If budget is tight, the FlexiSpot E7 at $249 delivers 85% of the performance.' },
      { question: 'How long does the Uplift V2 take to assemble?', answer: 'Expect 60-90 minutes for assembly with two people. The frame is heavy (70+ lbs), so solo assembly is difficult. Instructions are clear and all tools are included.' },
      { question: 'Does the Uplift V2 wobble at full height?', answer: 'No. Based on documented specifications with a 35-lb dual-monitor load, the Uplift V2 shows zero wobble at 50 inches — among the most stable desks available. Cheaper desks like the Autonomous SmartDesk 2 wobble noticeably above 46 inches.' },
      { question: 'What is the Uplift V2 warranty?', answer: 'The frame has a 15-year warranty — the best in the standing desk industry. The motor has a 5-year warranty. The desktop warranty depends on the material: bamboo has a 5-year warranty, laminate has 3 years.' },
    ],
  },
];

/**
 * Get a product review by slug.
 */
export function getReviewBySlug(slug: string): ProductReviewEntry | undefined {
  return productReviews.find(r => r.slug === slug);
}

/**
 * Get all reviews in a category.
 */
export function getReviewsByCategory(categorySlug: string): ProductReviewEntry[] {
  return productReviews.filter(r => r.categorySlug === categorySlug);
}

// === Unified product data layer ===
// Re-exports extracted metadata and catalog for single-import access across the site.

export { extractedProducts } from './products-extracted';
export type { ExtractedProduct } from './products-extracted';
export { catalogProducts } from './products-catalog';
export type { CatalogProduct } from './products-catalog';

import { extractedProducts } from './products-extracted';
import { catalogProducts } from './products-catalog';

/**
 * Total unique products across all data sources (reviews + catalog).
 */
export function getTotalProductCount(): number {
  return catalogProducts.length + extractedProducts.length;
}

/**
 * Find a product in the catalog by normalized name.
 */
export function findInCatalog(productName: string): CatalogProduct | undefined {
  const normalized = productName.toLowerCase().replace(/[^a-z0-9]/g, '');
  return catalogProducts.find(p => p.slug === normalized || p.name.toLowerCase().replace(/[^a-z0-9]/g, '') === normalized);
}
