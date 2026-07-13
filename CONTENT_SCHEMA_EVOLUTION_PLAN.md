# Content Schema Evolution Plan — ToolStep 1000 Page Architecture

> Generated: 2026-07-09
> Based on: KEYWORD_EXPANSION_MATRIX.md, FIRST_100_REVIEW_QUEUE.md, COMPETITOR_KEYWORD_GAP.md
> Goal: Design a unified data architecture that supports 1000 SEO pages across 5 content types
> Constraint: Analysis only — no code modified, no pages created

---

## 1. Current Schema Audit

### 1.1 Existing Schema Inventory

ToolStep currently maintains **3 separate, non-unified schemas** across 3 data files:

| Data File | Interface | Records | Content Type | URL Pattern |
|---|---|---|---|---|
| `src/data/products.ts` | `ProductReviewEntry` | 35 | Product Review | `/reviews/{slug}/` |
| `src/data/best.ts` | `BestEntry` | 100 | Best List | `/best/{slug}/` |
| `src/data/compare.ts` | `CompareEntry` | 50 | Comparison | `/compare/{slug}/` |

**Total existing pages supported:** 185 (35 reviews + 100 best lists + 50 comparisons)

### 1.2 Current Schema Field Analysis

#### 1.2.1 ProductReviewEntry (src/data/products.ts)

```typescript
interface ProductReviewEntry {
  slug: string;                    // ✅ REUSABLE
  productName: string;             // ✅ REUSABLE (rename to title)
  brand: string;                   // ✅ REUSABLE
  category: string;                // ✅ REUSABLE
  categorySlug: string;            // ✅ REUSABLE
  heroImage?: string;              // ✅ REUSABLE
  publishDate: string;             // ✅ REUSABLE
  lastUpdated: string;             // ✅ REUSABLE
  authorSlug: string;              // ✅ REUSABLE
  testingDuration: string;         // ✅ REUSABLE
  productsTested: number;          // ✅ REUSABLE
  ratingValue: number;             // ✅ REUSABLE (review-only)
  bestPrice: number;               // ✅ REUSABLE
  amazonUrl?: string | null;       // ✅ REUSABLE
  verdict: string;                 // ⚠️ REVIEW-ONLY
  quickVerdict: string;            // ✅ REUSABLE (generalize)
  testingSummary: string;          // ✅ REUSABLE
  performance: string;             // ⚠️ REVIEW-ONLY
  buildQuality: string;            // ⚠️ REVIEW-ONLY
  easeOfUse: string;               // ⚠️ REVIEW-ONLY
  value: string;                   // ⚠️ REVIEW-ONLY
  pros: string[];                  // ✅ REUSABLE
  cons: string[];                  // ✅ REUSABLE
  bestFor: string[];               // ✅ REUSABLE
  notFor: string[];                // ⚠️ REVIEW-ONLY
  specs: ProductSpec[];            // ✅ REUSABLE
  alternatives: {...}[];           // ✅ REUSABLE
  faqs: ProductFaq[];              // ✅ REUSABLE
  compareSlugs?: string[];         // ✅ REUSABLE
  relatedProducts?: string[];      // ✅ REUSABLE
}
```

#### 1.2.2 BestEntry (src/data/best.ts)

```typescript
interface BestEntry {
  slug: string;                    // ✅ REUSABLE
  title: string;                   // ✅ REUSABLE
  category: string;                // ✅ REUSABLE
  color: string;                   // ⚠️ PRESENTATION-ONLY (drop or move to theme)
  description: string;             // ✅ REUSABLE (rename to metaDescription)
  intro: string;                   // ✅ REUSABLE (rename to introduction)
  products: BestProduct[];         // ✅ REUSABLE (product list)
  faqs: BestFaq[];                 // ✅ REUSABLE
  relatedReviews: string[];        // ✅ REUSABLE (rename to relatedSlugs)
  relatedBests: string[];          // ✅ REUSABLE
  lastUpdated: string;             // ✅ REUSABLE
  testingDuration: string;         // ✅ REUSABLE
  authorSlug: string;              // ✅ REUSABLE
}
```

#### 1.2.3 CompareEntry (src/data/compare.ts)

```typescript
interface CompareEntry {
  slug: string;                    // ✅ REUSABLE
  title: string;                   // ✅ REUSABLE
  category: string;                // ✅ REUSABLE
  color: string;                   // ⚠️ PRESENTATION-ONLY
  description: string;             // ✅ REUSABLE
  productA: CompareProduct;        // ✅ REUSABLE (product slot)
  productB: CompareProduct;        // ✅ REUSABLE (product slot)
  quickWinner: 'A' | 'B' | 'tie'; // ⚠️ COMPARISON-ONLY
  quickWinnerReason: string;       // ⚠️ COMPARISON-ONLY
  specs: CompareSpec[];            // ✅ REUSABLE (spec comparison)
  whoWins: {...}[];                // ⚠️ COMPARISON-ONLY
  faqs: CompareFaq[];              // ✅ REUSABLE
  relatedReviews: string[];        // ✅ REUSABLE
  lastUpdated: string;             // ✅ REUSABLE
  testingDuration: string;         // ✅ REUSABLE
  authorSlug: string;              // ✅ REUSABLE
}
```

### 1.3 Schema Gap Analysis by Content Type

| Content Type | Currently Supported? | Schema Source | Gaps |
|---|---|---|---|
| **Product Review** | ✅ Yes | `ProductReviewEntry` | No contentType field, no priorityScore, no keyword mapping |
| **Best List** | ✅ Yes | `BestEntry` | No contentType field, no intent classification, no affiliate tracking per product |
| **Comparison** | ✅ Yes | `CompareEntry` | No contentType field, no priorityScore, no keyword cluster mapping |
| **Alternative Page** | ❌ No | — | No schema exists for "best X alternatives" pages |
| **Buying Guide** | ❌ No | — | No schema exists for "how to choose X" educational pages |

### 1.4 Cross-Schema Problems

| Problem | Impact |
|---|---|
| 3 separate schemas with overlapping fields | Maintenance burden, data duplication |
| No unified `contentType` discriminator | Cannot query "all commercial pages" across types |
| No `intent` field | Cannot segment money vs informational pages for SEO |
| No `keywords` field | No keyword-to-page mapping for SEO tracking |
| No `affiliate` object | Cannot track affiliate value per page or per product |
| No `priorityScore` field | Cannot sequence production by ROI |
| No `cluster` field | Cannot group pages by keyword cluster |
| `color` field embedded in data | Presentation concern leaking into data layer |
| No shared `Product` interface | Product data duplicated across review/best/compare schemas |

### 1.5 Reusable Fields Summary

| Field | Review | Best List | Comparison | Alternative | Buying Guide | Reusable? |
|---|---|---|---|---|---|---|
| slug | ✅ | ✅ | ✅ | ✅ | ✅ | Yes |
| title | ✅ (productName) | ✅ | ✅ | ✅ | ✅ | Yes |
| category | ✅ | ✅ | ✅ | ✅ | ✅ | Yes |
| categorySlug | ✅ | ❌ | ❌ | ❌ | ❌ | Yes (extend) |
| publishDate | ✅ | ❌ | ❌ | ✅ | ✅ | Yes |
| lastUpdated | ✅ | ✅ | ✅ | ✅ | ✅ | Yes |
| authorSlug | ✅ | ✅ | ✅ | ✅ | ✅ | Yes |
| testingDuration | ✅ | ✅ | ✅ | ✅ | ❌ | Yes |
| metaDescription | ❌ | ✅ (description) | ✅ (description) | ✅ | ✅ | Yes (new) |
| quickVerdict | ✅ | ❌ | ✅ (quickWinner) | ❌ | ❌ | Yes (generalize) |
| testingSummary | ✅ | ❌ | ❌ | ❌ | ❌ | Yes (optional) |
| pros | ✅ | ✅ (per product) | ✅ (per product) | ✅ (per product) | ❌ | Yes |
| cons | ✅ | ✅ (per product) | ✅ (per product) | ✅ (per product) | ❌ | Yes |
| faqs | ✅ | ✅ | ✅ | ✅ | ✅ | Yes |
| products | ❌ | ✅ | ✅ (A/B) | ✅ | ❌ | Yes (unified) |
| specs | ✅ | ❌ | ✅ | ❌ | ❌ | Yes (optional) |
| relatedSlugs | ✅ (alternatives) | ✅ (relatedReviews) | ✅ (relatedReviews) | ✅ | ✅ | Yes (unify) |
| amazonUrl | ✅ | ❌ | ❌ | ❌ | ❌ | Yes (per product) |
| priorityScore | ❌ | ❌ | ❌ | ❌ | ❌ | **NEW — required** |
| intent | ❌ | ❌ | ❌ | ❌ | ❌ | **NEW — required** |
| keywords | ❌ | ❌ | ❌ | ❌ | ❌ | **NEW — required** |
| cluster | ❌ | ❌ | ❌ | ❌ | ❌ | **NEW — required** |

---

## 2. Future Content Types

### 2.1 Content Type: Review

**URL Pattern:** `/reviews/{product-name-review}/`
**Example:** `/reviews/keychron-k8-review/`
**Intent:** Commercial (transactional)

```typescript
{
  contentType: 'review',
  intent: 'commercial',
  slug: 'keychron-k8-review',
  title: 'Keychron K8 Review',
  category: 'Mechanical Keyboards',
  categorySlug: 'best-mechanical-keyboard-work',
  metaDescription: 'We tested the Keychron K8 for 60 days...',
  publishDate: '2026-06-26',
  lastUpdated: 'June 2026',
  authorSlug: 'marcus-chen',
  testingDuration: '60 days',
  productsTested: 3,
  quickVerdict: 'The Keychron K8 is the best $84 mechanical keyboard...',
  testingSummary: 'We tested the Keychron K8...',
  sections: {
    performance: '...',
    buildQuality: '...',
    easeOfUse: '...',
    value: '...'
  },
  products: [{
    name: 'Keychron K8',
    brand: 'Keychron',
    price: 84,
    rating: 4.5,
    amazonUrl: '...',
    pros: [...],
    cons: [...],
    specs: [...]
  }],
  bestFor: [...],
  notFor: [...],
  faqs: [...],
  relatedSlugs: [...],
  keywords: ['keychron k8 review', 'keychron k8', 'keychron k8 wireless'],
  cluster: 'mechanical-keyboard',
  affiliate: { value: 'medium', program: 'amazon', commission: 4 },
  priorityScore: 92
}
```

### 2.2 Content Type: Comparison

**URL Pattern:** `/compare/{product-a-vs-product-b}/`
**Example:** `/compare/sony-wh-1000xm5-vs-xm4/`
**Intent:** Commercial (investigation)

```typescript
{
  contentType: 'comparison',
  intent: 'commercial',
  slug: 'sony-wh-1000xm5-vs-xm4',
  title: 'Sony WH-1000XM5 vs XM4',
  category: 'Headphones',
  categorySlug: 'best-noise-cancelling-headphones',
  metaDescription: 'Sony WH-1000XM5 vs XM4 — which is worth buying in 2026?',
  publishDate: '2026-07-01',
  lastUpdated: 'July 2026',
  authorSlug: 'marcus-chen',
  testingDuration: '90 days',
  quickVerdict: 'The XM5 wins on noise cancellation and call quality...',
  products: [
    { name: 'Sony WH-1000XM5', brand: 'Sony', price: 399, rating: 4.8, amazonUrl: '...', pros: [...], cons: [...] },
    { name: 'Sony WH-1000XM4', brand: 'Sony', price: 278, rating: 4.6, amazonUrl: '...', pros: [...], cons: [...] }
  ],
  comparison: {
    quickWinner: 'A',
    quickWinnerReason: 'The XM5 wins for most buyers...',
    specTable: [
      { label: 'Noise Cancellation', productA: 'Superior', productB: 'Excellent', winner: 'A' },
      { label: 'Battery Life', productA: '30 hours', productB: '30 hours', winner: 'tie' }
    ],
    scenarios: [
      { scenario: 'If you want the best ANC', winner: 'A' },
      { scenario: 'If you want to save $120', winner: 'B' }
    ]
  },
  faqs: [...],
  relatedSlugs: ['sony-wh-1000xm5-review', 'best-noise-cancelling-headphones'],
  keywords: ['sony xm5 vs xm4', 'sony wh-1000xm5 vs xm4', 'sony xm5 comparison'],
  cluster: 'headphones-anc',
  affiliate: { value: 'high', program: 'amazon', commission: 4 },
  priorityScore: 92
}
```

### 2.3 Content Type: Best List

**URL Pattern:** `/best/{best-slug}/`
**Example:** `/best/best-ergonomic-chair-under-500/`
**Intent:** Commercial (transactional)

```typescript
{
  contentType: 'list',
  intent: 'commercial',
  slug: 'best-ergonomic-chair-under-500',
  title: 'Best Ergonomic Chair Under $500',
  category: 'Office Chairs',
  categorySlug: 'best-ergonomic-chair',
  metaDescription: 'The 10 best ergonomic chairs under $500 we tested...',
  publishDate: '2026-07-01',
  lastUpdated: 'July 2026',
  authorSlug: 'marcus-chen',
  testingDuration: '90 days',
  productsTested: 15,
  quickVerdict: 'The Branch Ergonomic Chair is our top pick under $500...',
  introduction: 'We spent 90 days testing 15 ergonomic chairs...',
  products: [
    { rank: 1, name: 'Branch Ergonomic Chair', brand: 'Branch', price: 329, rating: 4.5, amazonUrl: '...', summary: '...', pros: [...], cons: [...] },
    { rank: 2, name: 'Steelcase Leap V2', brand: 'Steelcase', price: 499, rating: 4.7, amazonUrl: '...', summary: '...', pros: [...], cons: [...] }
  ],
  methodology: 'We tested each chair for 90 days, evaluating lumbar support...',
  faqs: [...],
  relatedSlugs: ['herman-miller-aeron-review', 'best-ergonomic-chair'],
  keywords: ['best ergonomic chair under 500', 'best office chair under 500', 'ergonomic chair budget'],
  cluster: 'office-chair',
  affiliate: { value: 'very-high', program: 'amazon', commission: 4 },
  priorityScore: 96
}
```

### 2.4 Content Type: Alternative

**URL Pattern:** `/alternatives/{slug}/`
**Example:** `/alternatives/best-notion-alternatives/`
**Intent:** Commercial (investigation)

```typescript
{
  contentType: 'list',
  listSubtype: 'alternative',
  intent: 'commercial',
  slug: 'best-notion-alternatives',
  title: 'Best Notion Alternatives',
  category: 'Notes App',
  categorySlug: 'best-note-taking-app',
  metaDescription: 'The 10 best Notion alternatives we tested for note-taking...',
  publishDate: '2026-07-01',
  lastUpdated: 'July 2026',
  authorSlug: 'marcus-chen',
  testingDuration: '60 days',
  quickVerdict: 'Obsidian is our top Notion alternative for power users...',
  introduction: 'Notion is powerful, but it is not for everyone...',
  anchorProduct: {
    name: 'Notion',
    brand: 'Notion Labs',
    price: 10,
    rating: 4.3,
    pros: [...],
    cons: ['Slow with large databases', 'No offline mode', 'Privacy concerns']
  },
  products: [
    { rank: 1, name: 'Obsidian', brand: 'Obsidian', price: 0, rating: 4.7, summary: '...', pros: [...], cons: [...], why: 'Better for local-first note storage' },
    { rank: 2, name: 'Bear', brand: 'Bear', price: 2.99, rating: 4.5, summary: '...', pros: [...], cons: [...], why: 'Simpler, faster, more focused' }
  ],
  faqs: [...],
  relatedSlugs: ['obsidian-review', 'bear-review', 'notion-vs-obsidian'],
  keywords: ['notion alternatives', 'best notion alternatives', 'apps like notion'],
  cluster: 'notes-app',
  affiliate: { value: 'low', program: 'subscription', commission: 20 },
  priorityScore: 88
}
```

### 2.5 Content Type: Buying Guide

**URL Pattern:** `/guides/{slug}/`
**Example:** `/guides/how-to-choose-mechanical-keyboard/`
**Intent:** Informational

```typescript
{
  contentType: 'guide',
  intent: 'informational',
  slug: 'how-to-choose-mechanical-keyboard',
  title: 'How to Choose a Mechanical Keyboard',
  category: 'Mechanical Keyboards',
  categorySlug: 'best-mechanical-keyboard-work',
  metaDescription: 'Everything you need to know before buying a mechanical keyboard...',
  publishDate: '2026-07-01',
  lastUpdated: 'July 2026',
  authorSlug: 'marcus-chen',
  testingDuration: '0 days',
  quickVerdict: 'Focus on switch type, layout, and build material — in that order.',
  introduction: 'Choosing a mechanical keyboard is overwhelming...',
  sections: [
    {
      heading: 'Switch Types',
      content: 'The switch is the heart of a mechanical keyboard...',
      recommendation: 'Brown switches are the safest starting point for most users.'
    },
    {
      heading: 'Layout',
      content: 'Full-size, TKL, 75%, 60%...',
      recommendation: 'TKL (tenkeyless) is the most versatile layout.'
    }
  ],
  recommendedProducts: [
    { name: 'Keychron K8', slug: 'keychron-k8-review', reason: 'Best budget entry point' },
    { name: 'Keychron Q1', slug: 'keychron-q1-review', reason: 'Best premium pick' }
  ],
  faqs: [...],
  relatedSlugs: ['keychron-k8-review', 'best-mechanical-keyboard-2026'],
  keywords: ['how to choose mechanical keyboard', 'mechanical keyboard buying guide', 'mechanical keyboard switch types'],
  cluster: 'mechanical-keyboard',
  affiliate: { value: 'medium', program: 'amazon', commission: 4 },
  priorityScore: 60
}
```

---

## 3. Unified Content Model

### 3.1 Core Unified Schema

```typescript
// ============================================================
// ToolStep Unified Content Schema v2.0
// Supports: review, comparison, list, guide content types
// Scales to 1000+ pages
// ============================================================

// --- Shared Sub-Interfaces ---

interface Faq {
  question: string;
  answer: string;
}

interface Spec {
  label: string;
  value: string;
}

interface AffiliateInfo {
  value: 'very-high' | 'high' | 'medium' | 'low' | 'none';
  program: 'amazon' | 'subscription' | 'direct' | 'none';
  commission: number;  // percentage
  estimatedRevenue?: number;  // estimated $ per month
}

interface KeywordInfo {
  primary: string;          // main target keyword
  secondary: string[];      // supporting keywords
  cluster: string;          // keyword cluster ID
  searchVolume?: number;    // estimated monthly volume
  difficulty?: number;      // 0-100
}

interface ProductRef {
  name: string;
  brand: string;
  price: number;
  rating?: number;
  rank?: number;             // for best lists
  amazonUrl?: string;
  summary?: string;
  pros?: string[];
  cons?: string[];
  why?: string;              // for alternatives — why this over anchor
  specs?: Spec[];
  reviewSlug?: string;       // link to full review if exists
}

interface ContentSection {
  heading: string;
  content: string;
  recommendation?: string;
}

interface RelatedLink {
  slug: string;
  label: string;
  type: 'review' | 'list' | 'comparison' | 'guide' | 'alternative';
}

// --- Main Unified Interface ---

interface ToolStepContent {
  // === IDENTITY ===
  contentType: 'review' | 'comparison' | 'list' | 'guide';
  listSubtype?: 'best' | 'alternative';  // only for contentType: 'list'
  slug: string;
  title: string;
  category: string;
  categorySlug: string;

  // === METADATA ===
  metaDescription: string;
  publishDate: string;
  lastUpdated: string;
  authorSlug: string;
  testingDuration: string;
  productsTested?: number;
  heroImage?: string;

  // === INTENT & SEO ===
  intent: 'commercial' | 'informational';
  keywords: KeywordInfo;
  affiliate: AffiliateInfo;
  priorityScore: number;  // 0-100

  // === CONTENT BODY ===
  quickVerdict: string;
  testingSummary?: string;
  introduction?: string;
  methodology?: string;

  // === TYPE-SPECIFIC CONTENT ===
  // For review
  sections?: ContentSection[];        // performance, buildQuality, easeOfUse, value
  bestFor?: string[];
  notFor?: string[];

  // For comparison
  comparison?: {
    quickWinner: 'A' | 'B' | 'tie';
    quickWinnerReason: string;
    specTable: {
      label: string;
      productA: string;
      productB: string;
      winner: 'A' | 'B' | 'tie';
    }[];
    scenarios: { scenario: string; winner: 'A' | 'B' | 'tie' }[];
  };

  // For list/alternative
  anchorProduct?: ProductRef;         // for alternative pages
  products?: ProductRef[];            // for best lists and alternatives

  // For guide
  recommendedProducts?: { name: string; slug: string; reason: string }[];

  // === SHARED ELEMENTS ===
  faqs: Faq[];
  relatedSlugs: RelatedLink[];
}
```

### 3.2 Schema Discriminator Design

The `contentType` field acts as a discriminator. Each content type uses a subset of fields:

| Field | review | comparison | list (best) | list (alternative) | guide |
|---|---|---|---|---|---|
| quickVerdict | ✅ | ✅ | ✅ | ✅ | ✅ |
| testingSummary | ✅ | ❌ | ❌ | ❌ | ❌ |
| introduction | ❌ | ❌ | ✅ | ✅ | ✅ |
| methodology | ❌ | ❌ | ✅ | ❌ | ❌ |
| sections | ✅ | ❌ | ❌ | ❌ | ✅ |
| comparison | ❌ | ✅ | ❌ | ❌ | ❌ |
| products | ❌ | ✅ (A/B as array) | ✅ | ✅ | ❌ |
| anchorProduct | ❌ | ❌ | ❌ | ✅ | ❌ |
| recommendedProducts | ❌ | ❌ | ❌ | ❌ | ✅ |
| bestFor | ✅ | ❌ | ❌ | ❌ | ❌ |
| notFor | ✅ | ❌ | ❌ | ❌ | ❌ |

### 3.3 Unified Query Functions

```typescript
// Future query functions enabled by unified schema

// Get all pages by content type
getContentByType(type: 'review' | 'comparison' | 'list' | 'guide'): ToolStepContent[]

// Get all commercial-intent pages (money pages)
getCommercialPages(): ToolStepContent[]

// Get all pages in a keyword cluster
getContentByCluster(cluster: string): ToolStepContent[]

// Get all pages in a category
getContentByCategory(categorySlug: string): ToolStepContent[]

// Get pages by priority tier
getContentByPriorityTier(tier: 1 | 2 | 3): ToolStepContent[]

// Get all pages with affiliate value
getMonetizablePages(minValue: 'low' | 'medium' | 'high' | 'very-high'): ToolStepContent[]

// Get internal link graph
getInternalLinks(slug: string): { incoming: string[]; outgoing: string[] }

// Get next 100 pages to build (by priority)
getProductionQueue(limit: number): ToolStepContent[]
```

### 3.4 SEO Metadata Fields (New)

```typescript
interface SeoMetadata {
  canonicalUrl: string;
  ogTitle: string;
  ogDescription: string;
  ogImage?: string;
  schemaType: 'Article' | 'ItemList' | 'FAQPage' | 'BreadcrumbList';
  noindex: boolean;
  wordCount?: number;
  readingTime?: number;
}
```

### 3.5 Content Inventory Tracking

```typescript
interface ContentInventory {
  total: number;
  byType: { review: number; comparison: number; list: number; guide: number };
  byIntent: { commercial: number; informational: number };
  byCategory: Record<string, number>;
  byCluster: Record<string, number>;
  byPriorityTier: { tier1: number; tier2: number; tier3: number };
  byAffiliateValue: { 'very-high': number; 'high': number; 'medium': number; 'low': number; 'none': number };
  lastUpdated: string;
}
```

---

## 4. Migration Plan

### Phase 1: Schema Design (No Data Changes)

**Goal:** Define the unified schema and create type definitions without migrating data.

| Step | Task | Output |
|---|---|---|
| 1.1 | Define `ToolStepContent` interface in `src/data/types.ts` | Type file |
| 1.2 | Define sub-interfaces (`ProductRef`, `KeywordInfo`, `AffiliateInfo`, etc.) | Type file |
| 1.3 | Define migration mapper interfaces | Type file |
| 1.4 | Create schema validation utility (Zod schema) | Validation utility |
| 1.5 | Document field mapping from old schemas to new | Migration map |

**Field Migration Map:**

| Old Field (ProductReviewEntry) | New Field (ToolStepContent) | Transformation |
|---|---|---|
| `productName` | `title` | Rename |
| `verdict` | `sections.verdict` (or drop, use quickVerdict) | Move to sections |
| `performance` | `sections[0]` | Convert to ContentSection |
| `buildQuality` | `sections[1]` | Convert to ContentSection |
| `easeOfUse` | `sections[2]` | Convert to ContentSection |
| `value` | `sections[3]` | Convert to ContentSection |
| `alternatives` | `relatedSlugs` | Transform to RelatedLink[] |
| `compareSlugs` | `relatedSlugs` | Merge into relatedSlugs |
| `relatedProducts` | `relatedSlugs` | Merge into relatedSlugs |
| `ratingValue` | `products[0].rating` | Move into product |
| `bestPrice` | `products[0].price` | Move into product |
| `amazonUrl` | `products[0].amazonUrl` | Move into product |
| `specs` | `products[0].specs` | Move into product |
| `pros` | `products[0].pros` | Move into product |
| `cons` | `products[0].cons` | Move into product |
| (missing) | `contentType: 'review'` | Add |
| (missing) | `intent: 'commercial'` | Add |
| (missing) | `keywords: {...}` | Add (derive from slug) |
| (missing) | `affiliate: {...}` | Add (derive from price) |
| (missing) | `priorityScore` | Add (from matrix) |

| Old Field (BestEntry) | New Field (ToolStepContent) | Transformation |
|---|---|---|
| `title` | `title` | Keep |
| `description` | `metaDescription` | Rename |
| `intro` | `introduction` | Rename |
| `products` | `products` | Map BestProduct → ProductRef |
| `color` | (drop) | Move to theme config |
| `relatedReviews` | `relatedSlugs` | Merge |
| `relatedBests` | `relatedSlugs` | Merge |
| (missing) | `contentType: 'list'` | Add |
| (missing) | `listSubtype: 'best'` | Add |
| (missing) | `intent: 'commercial'` | Add |
| (missing) | `keywords: {...}` | Add |
| (missing) | `affiliate: {...}` | Add |
| (missing) | `priorityScore` | Add |
| (missing) | `methodology` | Add |

| Old Field (CompareEntry) | New Field (ToolStepContent) | Transformation |
|---|---|---|
| `description` | `metaDescription` | Rename |
| `productA` | `products[0]` | Map to ProductRef |
| `productB` | `products[1]` | Map to ProductRef |
| `quickWinner` | `comparison.quickWinner` | Move into comparison object |
| `quickWinnerReason` | `comparison.quickWinnerReason` | Move into comparison object |
| `specs` | `comparison.specTable` | Rename and move |
| `whoWins` | `comparison.scenarios` | Rename |
| `color` | (drop) | Move to theme config |
| `relatedReviews` | `relatedSlugs` | Merge |
| (missing) | `contentType: 'comparison'` | Add |
| (missing) | `intent: 'commercial'` | Add |
| (missing) | `keywords: {...}` | Add |
| (missing) | `affiliate: {...}` | Add |
| (missing) | `priorityScore` | Add |

---

### Phase 2: Data Migration

**Goal:** Migrate 185 existing pages (35 reviews + 100 best lists + 50 comparisons) to the unified schema.

| Step | Task | Pages Affected | Approach |
|---|---|---|---|
| 2.1 | Create migration script: `ProductReviewEntry` → `ToolStepContent` | 35 reviews | Automated mapping per field map above |
| 2.2 | Create migration script: `BestEntry` → `ToolStepContent` | 100 best lists | Automated mapping, add `listSubtype: 'best'` |
| 2.3 | Create migration script: `CompareEntry` → `ToolStepContent` | 50 comparisons | Automated mapping, convert A/B to products[] |
| 2.4 | Add `keywords`, `affiliate`, `priorityScore` to all migrated records | 185 pages | Derive from FIRST_100_REVIEW_QUEUE.md + KEYWORD_EXPANSION_MATRIX.md |
| 2.5 | Create new content type stubs for Alternative and Buying Guide | 0 pages (schema only) | Create empty data arrays with type validation |
| 2.6 | Validate all migrated records against Zod schema | 185 pages | Run validation, fix any mismatches |
| 2.7 | Update query functions to work with unified schema | All | Refactor `getReviewBySlug` → `getContentBySlug` |
| 2.8 | Test all existing page routes still render correctly | 185 pages | Build + manual smoke test |

**Migration Risk Mitigation:**

| Risk | Mitigation |
|---|---|
| URL structure changes | None — slugs preserved, only data structure changes |
| Page rendering breaks | Keep old interfaces as aliases during transition |
| Data loss in field mapping | Migration script logs every field transformation |
| SEO ranking drops | Canonical URLs preserved, no 301 redirects needed |

---

### Phase 3: Factory Generation

**Goal:** Build automated page generation pipeline for the remaining 815 pages (to reach 1000).

| Step | Task | Output |
|---|---|---|
| 3.1 | Create content templates for each `contentType` | 4 Astro templates |
| 3.2 | Create automated keyword-to-slug generator | Slug utility |
| 3.3 | Create product data importer (from Amazon API / manual CSV) | Import utility |
| 3.4 | Create comparison page auto-generator (from 2 review slugs) | Generator |
| 3.5 | Create best-list auto-generator (from category + ranking rules) | Generator |
| 3.6 | Create buying-guide template generator (from keyword cluster) | Generator |
| 3.7 | Create alternative-page generator (from anchor product) | Generator |
| 3.8 | Create internal-link graph auto-builder | Link utility |
| 3.9 | Create priority-queue production tracker | Dashboard utility |
| 3.10 | Generate Batch 1: 100 pages from FIRST_100_REVIEW_QUEUE.md | 100 pages |
| 3.11 | Generate Batch 2-6: remaining 715 pages | 715 pages |

**Factory Pipeline:**

```
Keyword Matrix
     ↓
Slug Generator
     ↓
Product Data Importer
     ↓
Content Template (review/comparison/list/guide)
     ↓
Auto-Writer (AI-assisted draft)
     ↓
Internal Link Graph Builder
     ↓
Schema Validation (Zod)
     ↓
Build & Render
     ↓
SEO Audit (meta, schema, canonical)
     ↓
Publish
```

**Content Type Factory Matrix:**

| Content Type | Template | Data Source | Auto-Generation Level |
|---|---|---|---|
| Review | `src/pages/reviews/[slug].astro` | Product research + testing notes | Semi-auto (AI draft + human edit) |
| Comparison | `src/pages/compare/[slug].astro` | 2 existing review slugs | High (auto-merge specs + pros/cons) |
| Best List | `src/pages/best/[slug].astro` | Category + ranking criteria | Semi-auto (AI draft + human edit) |
| Alternative | `src/pages/alternatives/[slug].astro` | Anchor product + competitor list | Semi-auto (AI draft + human edit) |
| Buying Guide | `src/pages/guides/[slug].astro` | Keyword cluster + expert outline | Low (mostly human-written) |

---

## 5. Implementation Timeline

| Phase | Scope | Pages | Dependencies |
|---|---|---|---|
| Phase 1 | Schema Design | 0 (types only) | None |
| Phase 2 | Data Migration | 185 (existing) | Phase 1 complete |
| Phase 3a | Factory Build | 0 (tooling only) | Phase 1 + 2 complete |
| Phase 3b | Batch 1 Production | 100 (new) | Phase 3a complete |
| Phase 3c | Batch 2-6 Production | 715 (new) | Phase 3b complete |
| **Total** | | **1000** | |

---

## 6. Schema Validation Rules

### 6.1 Required Fields by Content Type

```typescript
const validationRules = {
  review: {
    required: ['slug', 'title', 'category', 'metaDescription', 'quickVerdict',
               'testingSummary', 'sections', 'products', 'bestFor', 'notFor',
               'faqs', 'keywords', 'affiliate', 'priorityScore'],
    products: { min: 1, max: 1 },
    sections: { min: 3 }
  },
  comparison: {
    required: ['slug', 'title', 'category', 'metaDescription', 'quickVerdict',
               'products', 'comparison', 'faqs', 'keywords', 'affiliate', 'priorityScore'],
    products: { min: 2, max: 2 },
    comparison: { required: true }
  },
  list: {
    required: ['slug', 'title', 'category', 'metaDescription', 'quickVerdict',
               'introduction', 'products', 'faqs', 'keywords', 'affiliate', 'priorityScore'],
    products: { min: 3, max: 15 },
    listSubtype: { required: true }
  },
  guide: {
    required: ['slug', 'title', 'category', 'metaDescription', 'quickVerdict',
               'introduction', 'sections', 'recommendedProducts', 'faqs',
               'keywords', 'affiliate', 'priorityScore'],
    sections: { min: 3 }
  }
};
```

### 6.2 SEO Validation Rules

| Rule | Requirement |
|---|---|
| metaDescription length | 120-160 characters |
| title length | 40-70 characters |
| slug format | lowercase, hyphenated, no special chars |
| canonicalUrl | must match `/{contentType-route}/{slug}/` |
| faqs | minimum 4 FAQs per page |
| internal links | minimum 3 relatedSlugs per page |
| schemaType | must match contentType |
| priorityScore | must be 0-100 integer |

---

## 7. Summary

### Current State
- **3 separate schemas** (ProductReviewEntry, BestEntry, CompareEntry) supporting 185 pages
- **2 missing content types** (Alternative, Buying Guide)
- **No unified fields** for contentType, intent, keywords, affiliate, priorityScore
- **Data duplication** across schemas (product info repeated in review/best/compare)

### Target State
- **1 unified schema** (ToolStepContent) supporting 1000+ pages
- **5 content types** (review, comparison, list, guide, alternative)
- **SEO-native fields** (keywords, intent, priorityScore, affiliate)
- **Single source of truth** for all content
- **Factory pipeline** for automated page generation

### Migration Approach
- **Phase 1:** Design schema without touching data (zero risk)
- **Phase 2:** Migrate 185 existing pages with automated scripts (low risk, URLs preserved)
- **Phase 3:** Build factory and generate 815 new pages (scaled production)

### Key Decisions
1. **Discriminated union** via `contentType` field — single interface, type-specific optional fields
2. **URLs preserved** — no redirects needed, only data structure changes
3. **Old interfaces kept as aliases** during transition to avoid breaking existing imports
4. **Zod validation** enforced on every content record
5. **Factory pipeline** mixes AI-assisted drafting with human editorial review

---

*End of Content Schema Evolution Plan. Refer to KEYWORD_EXPANSION_MATRIX.md for the 1000-page expansion map and FIRST_100_REVIEW_QUEUE.md for the prioritized production queue.*
