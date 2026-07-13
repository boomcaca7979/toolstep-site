# ToolStep Unified Content Schema Implementation Blueprint

> Generated: 2026-07-09
> Based on: CONTENT_SCHEMA_EVOLUTION_PLAN.md, KEYWORD_EXPANSION_MATRIX.md, FIRST_100_REVIEW_QUEUE.md, COMPETITOR_KEYWORD_GAP.md
> Goal: Design the code modification plan for unified content schema supporting 1000+ SEO pages
> Constraint: Design document only — no code modified, no data migrated, no files created

---

## Phase 1: File Architecture Design

### 1.1 Current `src/data/` Structure

```
src/data/
├── reviews/
│   ├── group1.ts          # 7 review entries (ProductReviewEntry)
│   ├── group2.ts          # 7 review entries
│   ├── group3.ts          # 7 review entries
│   ├── group4.ts          # 7 review entries
│   └── group5.ts          # 7 review entries
├── products.ts            # ProductReviewEntry interface + 5 product reviews (duplicate)
├── reviewEntries.ts       # Re-exports + aggregates all review groups + query helpers
├── reviews.ts             # Legacy reviews array (different shape)
├── best.ts                # BestEntry interface + 100 best-list entries
├── compare.ts             # CompareEntry interface + 50 comparison entries
├── comparisons.ts         # Re-exports compare.ts + query helpers
├── alternatives.ts        # AlternativeEntry interface + alternative pages
├── products-catalog.ts    # CatalogProduct interface + 250+ catalog products
├── products-extracted.ts  # ExtractedProduct interface + legacy extracted data
├── categories.ts          # Category interface + category registry
├── tools.ts               # Tool interface + DUPLICATE Category interface
├── authors.ts             # Author interface + author registry
└── stories.ts             # StoryEntry interface + story pages
```

### 1.2 Current Architecture Problems

| Problem | Impact | Severity |
|---|---|---|
| `ProductReviewEntry` defined in `products.ts` but data split across 5 group files | Fragmented source of truth | High |
| `products.ts` contains both interface AND 5 inline reviews (duplicating group files) | Data duplication, drift risk | High |
| `reviews.ts` exists as legacy array with different shape than `ProductReviewEntry` | Confusion, dead code | Medium |
| `Category` interface defined in BOTH `categories.ts` and `tools.ts` | Type collision, maintenance burden | High |
| `products-catalog.ts` (250+ products) and `products-extracted.ts` overlap in purpose | Redundant data layers | Medium |
| `comparisons.ts` just re-exports `compare.ts` | Unnecessary indirection | Low |
| `reviewEntries.ts` aggregates groups but `products.ts` also exports reviews | Two entry points for same data | High |
| No unified schema — 4 separate interfaces (`ProductReviewEntry`, `BestEntry`, `CompareEntry`, `AlternativeEntry`) | Cannot query across content types | Critical |
| No SEO fields (keywords, intent, priorityScore, affiliate) in any schema | Cannot manage 1000-page SEO strategy | Critical |
| `color` field embedded in data schemas | Presentation leaking into data layer | Low |

### 1.3 Future `src/data/content/` Structure

```
src/data/
├── content/                    # NEW — Unified content layer
│   ├── schema.ts               # ToolStepContent interface + all sub-interfaces
│   ├── types.ts                # Shared types (Faq, Spec, ProductRef, etc.)
│   ├── index.ts                # Unified query API (getContentBySlug, etc.)
│   ├── validate.ts             # Zod validation schemas
│   ├── inventory.ts            # Content inventory + production tracker
│   ├── reviews.ts              # Review content (migrated from 5 group files)
│   ├── comparisons.ts          # Comparison content (migrated from compare.ts)
│   ├── best.ts                 # Best-list content (migrated from best.ts)
│   ├── alternatives.ts         # Alternative content (migrated from alternatives.ts)
│   └── guides.ts               # Buying-guide content (NEW content type)
├── products/                   # NEW — Product catalog (separated from content)
│   ├── schema.ts               # Product interface (unified)
│   ├── catalog.ts              # Migrated from products-catalog.ts
│   └── index.ts                # Product query API
├── taxonomy/                   # NEW — Categories, keywords, clusters
│   ├── categories.ts           # Migrated from categories.ts (single source)
│   ├── keywords.ts             # NEW — Keyword cluster registry
│   └── index.ts                # Taxonomy query API
├── authors.ts                  # KEEP — Author registry (no changes needed)
├── stories.ts                  # KEEP — Story pages (separate content type)
└── legacy/                     # DEPRECATED — Old files kept for reference
    ├── products.ts             # Old interface (alias to content/schema.ts)
    ├── reviewEntries.ts        # Old query helpers (alias to content/index.ts)
    ├── reviews.ts              # Old legacy array (to be deleted)
    ├── compare.ts              # Old interface (alias to content/schema.ts)
    ├── comparisons.ts          # Old re-exports (alias to content/index.ts)
    ├── best.ts                 # Old interface (alias to content/schema.ts)
    ├── alternatives.ts         # Old interface (alias to content/schema.ts)
    ├── tools.ts                # Old Tool + duplicate Category (to be deleted)
    └── products-extracted.ts   # Old extracted data (to be deleted)
```

### 1.4 Design Rationale

| Decision | Reason |
|---|---|
| **`content/` subdirectory** | Separates content data from product catalog and taxonomy — single responsibility |
| **`schema.ts` + `types.ts` split** | `types.ts` holds reusable primitives (Faq, Spec, ProductRef); `schema.ts` holds the main `ToolStepContent` interface |
| **One file per content type** | Each content type (reviews, comparisons, best, alternatives, guides) has its own data file for maintainability at 1000+ pages |
| **`index.ts` as unified API** | Single entry point for all content queries regardless of type — `getContentBySlug()` works across all types |
| **`validate.ts` with Zod** | Runtime validation ensures every content record conforms to schema before build |
| **`inventory.ts`** | Production tracker for the 1000-page roadmap — tracks what exists, what's queued, priority scores |
| **`products/` separated** | Products are referenced by content but are not content themselves — separation enables reuse |
| **`taxonomy/` separated** | Categories and keyword clusters are metadata about content, not content itself |
| **`legacy/` directory** | Old files kept as aliases during migration to avoid breaking existing imports — deleted after full migration |
| **`guides.ts` new file** | Buying Guide is a new content type not currently supported |
| **`color` field removed from schema** | Moved to theme configuration — data layer should be presentation-agnostic |

### 1.5 Import Path Migration

| Current Import | Future Import | Transition Strategy |
|---|---|---|
| `import { ProductReviewEntry } from '../data/products'` | `import { ToolStepContent } from '../data/content/schema'` | Alias old type to new during transition |
| `import { productReviews } from '../data/products'` | `import { reviews } from '../data/content/reviews'` | Re-export from legacy file |
| `import { bestData } from '../data/best'` | `import { bestLists } from '../data/content/best'` | Re-export from legacy file |
| `import { compareData } from '../data/compare'` | `import { comparisons } from '../data/content/comparisons'` | Re-export from legacy file |
| `import { alternativesData } from '../data/alternatives'` | `import { alternatives } from '../data/content/alternatives'` | Re-export from legacy file |
| `import { categories } from '../data/categories'` | `import { categories } from '../data/taxonomy/categories'` | Re-export from legacy file |
| `import { getReviewBySlug } from '../data/products'` | `import { getContentBySlug } from '../data/content'` | Wrapper function delegates to new API |

---

## Phase 2: Unified Schema Definition

### 2.1 Complete `ToolStepContent` Interface

```typescript
// src/data/content/schema.ts

// ============================================================
// ToolStepContent — Unified Content Schema v2.0
// Supports: review, comparison, list, guide content types
// Scales to 1000+ pages
// ============================================================

export interface ToolStepContent {
  // ========================================
  // CORE IDENTITY
  // ========================================
  id: string;                          // Unique identifier (e.g., 'rev_keychron-k8-review')
  slug: string;                        // URL slug (e.g., 'keychron-k8-review')
  contentType: ContentType;            // Discriminator: 'review' | 'comparison' | 'list' | 'guide'
  listSubtype?: ListSubtype;           // Only for contentType: 'list' → 'best' | 'alternative'
  status: ContentStatus;               // 'published' | 'draft' | 'queued' | 'deprecated'

  // ========================================
  // SEO METADATA
  // ========================================
  title: string;                       // Page title (40-70 chars)
  metaDescription: string;             // Meta description (120-160 chars)
  primaryKeyword: string;              // Main target keyword
  secondaryKeywords: string[];         // Supporting keywords (3-8)
  keywordCluster: string;              // Cluster ID (e.g., 'mechanical-keyboard')
  searchIntent: SearchIntent;          // 'commercial' | 'informational' | 'transactional'
  canonicalUrl: string;                // Full canonical URL

  // ========================================
  // COMMERCIAL / MONETIZATION
  // ========================================
  affiliate: AffiliateValue;           // 'very-high' | 'high' | 'medium' | 'low' | 'none'
  affiliateProgram: AffiliateProgram;  // 'amazon' | 'subscription' | 'direct' | 'none'
  estimatedValue: EstimatedValue;      // Estimated monthly revenue tier
  commissionRate?: number;             // Commission percentage (e.g., 4 for Amazon)

  // ========================================
  // PRODUCT REFERENCES
  // ========================================
  products: ProductRef[];              // Products referenced in this content
  brand: string;                       // Primary brand (for reviews) or 'Multiple'
  category: string;                    // Display category name (e.g., 'Mechanical Keyboards')
  categorySlug: string;                // Category slug for navigation

  // ========================================
  // CONTENT BODY
  // ========================================
  quickVerdict: string;                // 1-2 sentence verdict (appears above fold)
  sections: ContentSection[];          // Main content sections
  pros: string[];                      // Global pros (for reviews) or top pick pros
  cons: string[];                      // Global cons
  faqs: Faq[];                         // FAQ entries (minimum 4)

  // ========================================
  // RELATIONSHIPS / INTERNAL LINKING
  // ========================================
  relatedContent: RelatedLink[];       // Related pages across all content types
  compareWith: string[];               // Slugs of comparison pages involving this product
  alternatives: string[];              // Slugs of alternative pages involving this product

  // ========================================
  // ANALYTICS / PRODUCTION
  // ========================================
  priorityScore: number;               // 0-100 (from KEYWORD_EXPANSION_MATRIX.md)
  difficulty: number;                  // SEO difficulty 0-100
  searchVolume?: number;               // Estimated monthly search volume
  publishDate: string;                 // ISO date string
  lastUpdated: string;                 // Human-readable date
  authorSlug: string;                  // Author identifier
  testingDuration: string;             // Testing period description
  productsTested?: number;             // Number of products tested

  // ========================================
  // TYPE-SPECIFIC FIELDS (optional, discriminated by contentType)
  // ========================================
  // For review
  testingSummary?: string;             // Detailed testing methodology
  bestFor?: string[];                  // Who should buy this
  notFor?: string[];                   // Who should avoid this

  // For comparison
  comparison?: ComparisonData;         // Head-to-head comparison data

  // For list (best/alternative)
  introduction?: string;               // List intro paragraph
  methodology?: string;                // How the list was compiled
  anchorProduct?: ProductRef;          // For alternatives — the product being replaced

  // For guide
  recommendedProducts?: RecommendedProduct[]; // Products recommended in guide

  // ========================================
  // PRESENTATION (optional)
  // ========================================
  heroImage?: string;                  // Hero image URL
  ogImage?: string;                    // Open Graph image
  wordCount?: number;                  // Content word count
  readingTime?: number;                // Estimated reading minutes
}

// ========================================
// SUB-INTERFACES
// ========================================

export type ContentType = 'review' | 'comparison' | 'list' | 'guide';
export type ListSubtype = 'best' | 'alternative';
export type ContentStatus = 'published' | 'draft' | 'queued' | 'deprecated';
export type SearchIntent = 'commercial' | 'informational' | 'transactional';
export type AffiliateValue = 'very-high' | 'high' | 'medium' | 'low' | 'none';
export type AffiliateProgram = 'amazon' | 'subscription' | 'direct' | 'none';
export type EstimatedValue = '$1000+' | '$500-1000' | '$100-500' | '$50-100' | '<$50' | 'none';

export interface Faq {
  question: string;
  answer: string;
}

export interface Spec {
  label: string;
  value: string;
}

export interface ProductRef {
  name: string;
  brand: string;
  price: number;
  rating?: number;
  rank?: number;                       // For best lists
  amazonUrl?: string;
  summary?: string;
  pros?: string[];
  cons?: string[];
  why?: string;                        // For alternatives — why this over anchor
  specs?: Spec[];
  reviewSlug?: string;                 // Link to full review if exists
}

export interface ContentSection {
  heading: string;
  content: string;
  recommendation?: string;
}

export interface ComparisonData {
  quickWinner: 'A' | 'B' | 'tie';
  quickWinnerReason: string;
  specTable: ComparisonSpec[];
  scenarios: ComparisonScenario[];
}

export interface ComparisonSpec {
  label: string;
  productA: string;
  productB: string;
  winner: 'A' | 'B' | 'tie';
}

export interface ComparisonScenario {
  scenario: string;
  winner: 'A' | 'B' | 'tie';
}

export interface RelatedLink {
  slug: string;
  label: string;
  type: ContentType;
  relationship: 'related' | 'compare' | 'alternative' | 'category';
}

export interface RecommendedProduct {
  name: string;
  slug: string;
  reason: string;
}
```

### 2.2 Schema Field Groups

| Group | Fields | Purpose |
|---|---|---|
| **Core** | `id`, `slug`, `contentType`, `listSubtype`, `status` | Identity and lifecycle |
| **SEO** | `title`, `metaDescription`, `primaryKeyword`, `secondaryKeywords`, `keywordCluster`, `searchIntent`, `canonicalUrl` | Search engine optimization |
| **Commercial** | `affiliate`, `affiliateProgram`, `estimatedValue`, `commissionRate` | Monetization tracking |
| **Product** | `products`, `brand`, `category`, `categorySlug` | Product references |
| **Content** | `quickVerdict`, `sections`, `pros`, `cons`, `faqs` | Main content body |
| **Relationship** | `relatedContent`, `compareWith`, `alternatives` | Internal linking graph |
| **Analytics** | `priorityScore`, `difficulty`, `searchVolume`, `publishDate`, `lastUpdated`, `authorSlug`, `testingDuration`, `productsTested` | Production and performance tracking |

---

## Phase 3: Content Type Rules

### 3.1 Field Matrix

| Field | Review | Compare | Best | Alternative | Guide |
|---|---|---|---|---|---|
| **CORE** | | | | | |
| `id` | ✅ Required | ✅ Required | ✅ Required | ✅ Required | ✅ Required |
| `slug` | ✅ Required | ✅ Required | ✅ Required | ✅ Required | ✅ Required |
| `contentType` | `'review'` | `'comparison'` | `'list'` | `'list'` | `'guide'` |
| `listSubtype` | ❌ N/A | ❌ N/A | `'best'` | `'alternative'` | ❌ N/A |
| `status` | ✅ Required | ✅ Required | ✅ Required | ✅ Required | ✅ Required |
| **SEO** | | | | | |
| `title` | ✅ Required | ✅ Required | ✅ Required | ✅ Required | ✅ Required |
| `metaDescription` | ✅ Required | ✅ Required | ✅ Required | ✅ Required | ✅ Required |
| `primaryKeyword` | ✅ Required | ✅ Required | ✅ Required | ✅ Required | ✅ Required |
| `secondaryKeywords` | ✅ Required (min 3) | ✅ Required (min 3) | ✅ Required (min 3) | ✅ Required (min 3) | ✅ Required (min 3) |
| `keywordCluster` | ✅ Required | ✅ Required | ✅ Required | ✅ Required | ✅ Required |
| `searchIntent` | `'commercial'` | `'commercial'` | `'commercial'` | `'commercial'` | `'informational'` |
| `canonicalUrl` | ✅ Required | ✅ Required | ✅ Required | ✅ Required | ✅ Required |
| **COMMERCIAL** | | | | | |
| `affiliate` | ✅ Required | ✅ Required | ✅ Required | ✅ Required | ✅ Required |
| `affiliateProgram` | ✅ Required | ✅ Required | ✅ Required | ✅ Required | ✅ Required |
| `estimatedValue` | ✅ Required | ✅ Required | ✅ Required | ✅ Required | ✅ Required |
| `commissionRate` | ✅ Optional | ✅ Optional | ✅ Optional | ✅ Optional | ❌ Usually none |
| **PRODUCT** | | | | | |
| `products` | ✅ Exactly 1 | ✅ Exactly 2 | ✅ Min 3, Max 15 | ✅ Min 3, Max 15 | ❌ Empty |
| `brand` | ✅ Required | `'Multiple'` | `'Multiple'` | `'Multiple'` | `'Multiple'` |
| `category` | ✅ Required | ✅ Required | ✅ Required | ✅ Required | ✅ Required |
| `categorySlug` | ✅ Required | ✅ Required | ✅ Required | ✅ Required | ✅ Required |
| **CONTENT** | | | | | |
| `quickVerdict` | ✅ Required | ✅ Required | ✅ Required | ✅ Required | ✅ Required |
| `sections` | ✅ Min 3 | ❌ Optional | ❌ Optional | ❌ Optional | ✅ Min 3 |
| `pros` | ✅ Min 3 | ❌ Empty (use products) | ❌ Empty (use products) | ❌ Empty (use products) | ❌ Empty |
| `cons` | ✅ Min 3 | ❌ Empty (use products) | ❌ Empty (use products) | ❌ Empty (use products) | ❌ Empty |
| `faqs` | ✅ Min 4 | ✅ Min 4 | ✅ Min 4 | ✅ Min 4 | ✅ Min 4 |
| **RELATIONSHIP** | | | | | |
| `relatedContent` | ✅ Min 3 | ✅ Min 3 | ✅ Min 3 | ✅ Min 3 | ✅ Min 3 |
| `compareWith` | ✅ Optional | ❌ Empty | ❌ Empty | ❌ Empty | ❌ Empty |
| `alternatives` | ✅ Optional | ❌ Empty | ❌ Empty | ❌ Empty | ❌ Empty |
| **ANALYTICS** | | | | | |
| `priorityScore` | ✅ Required | ✅ Required | ✅ Required | ✅ Required | ✅ Required |
| `difficulty` | ✅ Required | ✅ Required | ✅ Required | ✅ Required | ✅ Required |
| `searchVolume` | ✅ Optional | ✅ Optional | ✅ Optional | ✅ Optional | ✅ Optional |
| `publishDate` | ✅ Required | ✅ Required | ✅ Required | ✅ Required | ✅ Required |
| `lastUpdated` | ✅ Required | ✅ Required | ✅ Required | ✅ Required | ✅ Required |
| `authorSlug` | ✅ Required | ✅ Required | ✅ Required | ✅ Required | ✅ Required |
| `testingDuration` | ✅ Required | ✅ Required | ✅ Required | ✅ Required | ❌ Optional |
| `productsTested` | ✅ Required | ✅ Required | ✅ Required | ✅ Required | ❌ Optional |
| **TYPE-SPECIFIC** | | | | | |
| `testingSummary` | ✅ Required | ❌ Optional | ❌ Optional | ❌ Optional | ❌ Optional |
| `bestFor` | ✅ Required (min 3) | ❌ Optional | ❌ Optional | ❌ Optional | ❌ Optional |
| `notFor` | ✅ Required (min 3) | ❌ Optional | ❌ Optional | ❌ Optional | ❌ Optional |
| `comparison` | ❌ N/A | ✅ Required | ❌ N/A | ❌ N/A | ❌ N/A |
| `introduction` | ❌ Optional | ❌ Optional | ✅ Required | ✅ Required | ✅ Required |
| `methodology` | ❌ Optional | ❌ Optional | ✅ Required | ❌ Optional | ❌ Optional |
| `anchorProduct` | ❌ N/A | ❌ N/A | ❌ N/A | ✅ Required | ❌ N/A |
| `recommendedProducts` | ❌ N/A | ❌ N/A | ❌ N/A | ❌ N/A | ✅ Required (min 2) |

### 3.2 Validation Rules Summary

| Content Type | Required Field Count | Optional Field Count | Product Count | FAQ Min | Sections Min |
|---|---|---|---|---|---|
| Review | 25 | 8 | Exactly 1 | 4 | 3 |
| Comparison | 22 | 6 | Exactly 2 | 4 | 0 |
| Best List | 21 | 7 | 3-15 | 4 | 0 |
| Alternative | 22 | 6 | 3-15 | 4 | 0 |
| Guide | 20 | 8 | 0 | 4 | 3 |

### 3.3 URL Pattern Rules

| Content Type | URL Pattern | Example |
|---|---|---|
| Review | `/reviews/{slug}/` | `/reviews/keychron-k8-review/` |
| Comparison | `/compare/{slug}/` | `/compare/sony-wh-1000xm5-vs-xm4/` |
| Best List | `/best/{slug}/` | `/best/best-ergonomic-chair-under-500/` |
| Alternative | `/alternatives/{slug}/` | `/alternatives/best-notion-alternatives/` |
| Guide | `/guides/{slug}/` | `/guides/how-to-choose-mechanical-keyboard/` |

---

## Phase 4: Generation Pipeline

### 4.1 Pipeline Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    KEYWORD MATRIX                            │
│  (KEYWORD_EXPANSION_MATRIX.md + FIRST_100_REVIEW_QUEUE.md)  │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│              CONTENT BRIEF GENERATOR                         │
│  Input:  Keyword + contentType + priorityScore              │
│  Output: Content brief with:                                │
│    - Target keyword + secondary keywords                    │
│    - Required sections (per content type rules)             │
│    - Product list to research                               │
│    - Internal link targets                                  │
│    - Affiliate value estimate                               │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                   AI DRAFT GENERATOR                         │
│  Input:  Content brief + product research data              │
│  Output: Draft ToolStepContent object with:                 │
│    - quickVerdict                                           │
│    - sections[] (heading + content)                         │
│    - pros[] + cons[]                                        │
│    - faqs[] (minimum 4)                                     │
│    - relatedContent[] (auto-linked from cluster)            │
│  Status: 'draft'                                            │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                   HUMAN REVIEW                              │
│  - Editorial review of AI draft                             │
│  - Fact-check product specs and prices                      │
│  - Add testing notes (for reviews)                          │
│  - Verify internal links resolve                            │
│  - Approve or request revisions                            │
│  Status: 'draft' → 'queued'                                 │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│              SCHEMA VALIDATION (Zod)                         │
│  - Validate against content type rules (Phase 3)            │
│  - Check required fields present                            │
│  - Check product count constraints                          │
│  - Check FAQ minimum                                        │
│  - Check section minimum                                    │
│  - Check internal link minimum                              │
│  - Check SEO field lengths (title, metaDescription)         │
│  - Check slug format (lowercase, hyphenated)                │
│  - Fail build if validation errors                          │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                    PUBLISH                                   │
│  - Set status: 'published'                                  │
│  - Set publishDate                                          │
│  - Generate static page via Astro                           │
│  - Update sitemap                                           │
│  - Update internal link graph                               │
│  - Update content inventory                                 │
└─────────────────────────────────────────────────────────────┘
```

### 4.2 Pipeline Stage Details

#### Stage 1: Keyword Matrix → Content Brief

```typescript
interface ContentBrief {
  // From keyword matrix
  primaryKeyword: string;
  secondaryKeywords: string[];
  keywordCluster: string;
  contentType: ContentType;
  listSubtype?: ListSubtype;
  searchIntent: SearchIntent;
  priorityScore: number;
  difficulty: number;
  searchVolume?: number;

  // Generated by brief generator
  slug: string;                    // Auto-generated from primaryKeyword
  title: string;                   // Auto-generated from primaryKeyword
  metaDescription: string;         // Template + keyword
  category: string;                // From cluster mapping
  categorySlug: string;            // From cluster mapping
  affiliate: AffiliateValue;       // From product price estimation
  affiliateProgram: AffiliateProgram;

  // Research directives
  productsToResearch: string[];    // Product names to investigate
  requiredSections: string[];      // Per content type rules
  internalLinkTargets: string[];   // From cluster + existing content
  competitorReferences: string[];  // From COMPETITOR_KEYWORD_GAP.md
}
```

#### Stage 2: Content Brief → AI Draft

```typescript
interface AIDraftRequest {
  brief: ContentBrief;
  productData: ProductRef[];       // From product research
  existingReviews?: ToolStepContent[]; // For comparison/best list context
  template: ContentTemplate;       // Per content type
}

interface AIDraftResponse {
  draft: Partial<ToolStepContent>;
  confidence: number;              // 0-1, how confident the AI is
  needsHumanReview: string[];      // Fields that need verification
}
```

#### Stage 3: Human Review Checklist

| Check | Reviewer | Tool |
|---|---|---|
| Product specs accuracy | Editorial | Manual verification |
| Price accuracy | Editorial | Amazon price check |
| Testing notes authenticity | Editorial | Testing log review |
| Internal link relevance | SEO | Link audit tool |
| Keyword density | SEO | SEO checker |
| Content quality | Editorial | Style guide checklist |
| Fact-checking | Editorial | Source verification |

#### Stage 4: Schema Validation (Zod)

```typescript
// src/data/content/validate.ts

import { z } from 'zod';

const FaqSchema = z.object({
  question: z.string().min(10).max(150),
  answer: z.string().min(50).max(1000)
});

const ProductRefSchema = z.object({
  name: z.string().min(2),
  brand: z.string().min(1),
  price: z.number().min(0),
  rating: z.number().min(0).max(5).optional(),
  rank: z.number().int().positive().optional(),
  amazonUrl: z.string().url().optional(),
  summary: z.string().optional(),
  pros: z.array(z.string()).optional(),
  cons: z.array(z.string()).optional(),
  why: z.string().optional(),
  specs: z.array(z.object({
    label: z.string(),
    value: z.string()
  })).optional(),
  reviewSlug: z.string().optional()
});

const BaseContentSchema = z.object({
  id: z.string().regex(/^(rev|cmp|bst|alt|gde)_[a-z0-9-]+$/),
  slug: z.string().regex(/^[a-z0-9-]+$/),
  contentType: z.enum(['review', 'comparison', 'list', 'guide']),
  listSubtype: z.enum(['best', 'alternative']).optional(),
  status: z.enum(['published', 'draft', 'queued', 'deprecated']),

  title: z.string().min(40).max(70),
  metaDescription: z.string().min(120).max(160),
  primaryKeyword: z.string().min(3),
  secondaryKeywords: z.array(z.string()).min(3).max(8),
  keywordCluster: z.string().min(3),
  searchIntent: z.enum(['commercial', 'informational', 'transactional']),
  canonicalUrl: z.string().url(),

  affiliate: z.enum(['very-high', 'high', 'medium', 'low', 'none']),
  affiliateProgram: z.enum(['amazon', 'subscription', 'direct', 'none']),
  estimatedValue: z.enum(['$1000+', '$500-1000', '$100-500', '$50-100', '<$50', 'none']),
  commissionRate: z.number().min(0).max(100).optional(),

  products: z.array(ProductRefSchema),
  brand: z.string(),
  category: z.string(),
  categorySlug: z.string(),

  quickVerdict: z.string().min(50).max(300),
  sections: z.array(z.object({
    heading: z.string(),
    content: z.string(),
    recommendation: z.string().optional()
  })),
  pros: z.array(z.string()),
  cons: z.array(z.string()),
  faqs: z.array(FaqSchema).min(4),

  relatedContent: z.array(z.object({
    slug: z.string(),
    label: z.string(),
    type: z.enum(['review', 'comparison', 'list', 'guide']),
    relationship: z.enum(['related', 'compare', 'alternative', 'category'])
  })).min(3),
  compareWith: z.array(z.string()),
  alternatives: z.array(z.string()),

  priorityScore: z.number().int().min(0).max(100),
  difficulty: z.number().int().min(0).max(100),
  searchVolume: z.number().int().positive().optional(),
  publishDate: z.string(),
  lastUpdated: z.string(),
  authorSlug: z.string(),
  testingDuration: z.string(),
  productsTested: z.number().int().positive().optional()
});

// Content-type-specific refinement
const ReviewSchema = BaseContentSchema.extend({
  contentType: z.literal('review'),
  products: z.array(ProductRefSchema).length(1),
  sections: z.array(z.object({
    heading: z.string(),
    content: z.string(),
    recommendation: z.string().optional()
  })).min(3),
  pros: z.array(z.string()).min(3),
  cons: z.array(z.string()).min(3),
  testingSummary: z.string(),
  bestFor: z.array(z.string()).min(3),
  notFor: z.array(z.string()).min(3)
});

const ComparisonSchema = BaseContentSchema.extend({
  contentType: z.literal('comparison'),
  products: z.array(ProductRefSchema).length(2),
  comparison: z.object({
    quickWinner: z.enum(['A', 'B', 'tie']),
    quickWinnerReason: z.string(),
    specTable: z.array(z.object({
      label: z.string(),
      productA: z.string(),
      productB: z.string(),
      winner: z.enum(['A', 'B', 'tie'])
    })),
    scenarios: z.array(z.object({
      scenario: z.string(),
      winner: z.enum(['A', 'B', 'tie'])
    }))
  })
});

const BestListSchema = BaseContentSchema.extend({
  contentType: z.literal('list'),
  listSubtype: z.literal('best'),
  products: z.array(ProductRefSchema).min(3).max(15),
  introduction: z.string(),
  methodology: z.string()
});

const AlternativeSchema = BaseContentSchema.extend({
  contentType: z.literal('list'),
  listSubtype: z.literal('alternative'),
  products: z.array(ProductRefSchema).min(3).max(15),
  introduction: z.string(),
  anchorProduct: ProductRefSchema
});

const GuideSchema = BaseContentSchema.extend({
  contentType: z.literal('guide'),
  products: z.array(ProductRefSchema).length(0),
  searchIntent: z.literal('informational'),
  sections: z.array(z.object({
    heading: z.string(),
    content: z.string(),
    recommendation: z.string().optional()
  })).min(3),
  introduction: z.string(),
  recommendedProducts: z.array(z.object({
    name: z.string(),
    slug: z.string(),
    reason: z.string()
  })).min(2)
});

export const ToolStepContentSchema = z.discriminatedUnion('contentType', [
  ReviewSchema,
  ComparisonSchema,
  BestListSchema,
  AlternativeSchema,
  GuideSchema
]);

// Validation helper
export function validateContent(content: unknown): ToolStepContent {
  const result = ToolStepContentSchema.safeParse(content);
  if (!result.success) {
    throw new Error(`Content validation failed: ${result.error.message}`);
  }
  return result.data;
}
```

### 4.3 Production Queue Tracker

```typescript
// src/data/content/inventory.ts

interface ContentInventory {
  total: number;
  byType: Record<ContentType, number>;
  byStatus: Record<ContentStatus, number>;
  byPriorityTier: { tier1: number; tier2: number; tier3: number };
  byCluster: Record<string, number>;
  productionQueue: QueueItem[];
}

interface QueueItem {
  rank: number;
  slug: string;
  primaryKeyword: string;
  contentType: ContentType;
  priorityScore: number;
  status: ContentStatus;
  estimatedEffort: 'low' | 'medium' | 'high';
}
```

---

## Phase 5: Migration Strategy

### 5.1 Migration Principles

| Principle | Enforcement |
|---|---|
| **URLs must not change** | Slugs preserved exactly — only data structure transforms |
| **SEO must not drop** | Canonical URLs, meta descriptions, and content preserved |
| **No downtime** | Old files kept as aliases during transition |
| **Rollback possible** | Migration is reversible until old files are deleted |
| **Incremental migration** | One content type at a time, not all at once |

### 5.2 Migration Sequence

```
Phase 5A: Schema Setup (no data changes)
    ↓
Phase 5B: Migrate Reviews (35 pages)
    ↓
Phase 5C: Migrate Best Lists (100 pages)
    ↓
Phase 5D: Migrate Comparisons (50 pages)
    ↓
Phase 5E: Migrate Alternatives (existing count)
    ↓
Phase 5F: Add SEO fields to all migrated content
    ↓
Phase 5G: Update page components to use new schema
    ↓
Phase 5H: Delete legacy files
```

### 5.3 Phase 5A: Schema Setup

**Goal:** Create new schema files without touching existing data.

| Step | Action | Files Created |
|---|---|---|
| 5A.1 | Create `src/data/content/schema.ts` with `ToolStepContent` interface | 1 new file |
| 5A.2 | Create `src/data/content/types.ts` with shared sub-interfaces | 1 new file |
| 5A.3 | Create `src/data/content/validate.ts` with Zod schemas | 1 new file |
| 5A.4 | Create `src/data/content/index.ts` with query API stubs | 1 new file |
| 5A.5 | Create empty data files: `reviews.ts`, `comparisons.ts`, `best.ts`, `alternatives.ts`, `guides.ts` | 5 new files |
| 5A.6 | Create `src/data/products/schema.ts` with unified `Product` interface | 1 new file |
| 5A.7 | Create `src/data/taxonomy/categories.ts` (copy from current `categories.ts`) | 1 new file |
| 5A.8 | Create `src/data/taxonomy/keywords.ts` with keyword cluster registry | 1 new file |

**Risk:** Zero — no existing files modified.

### 5.4 Phase 5B: Migrate Reviews (35 pages)

**Goal:** Transform 35 `ProductReviewEntry` records to `ToolStepContent` with `contentType: 'review'`.

#### Field Mapping

| Source Field (`ProductReviewEntry`) | Target Field (`ToolStepContent`) | Transformation |
|---|---|---|
| `slug` | `slug` | Direct copy |
| (generate) | `id` | `'rev_' + slug` |
| (set) | `contentType` | `'review'` |
| (set) | `status` | `'published'` |
| `productName` | `title` | Direct copy |
| (generate from slug) | `metaDescription` | First 150 chars of `quickVerdict` |
| (generate from slug) | `primaryKeyword` | Slug → readable keyword |
| (generate) | `secondaryKeywords` | Derive from category + product name |
| (map from category) | `keywordCluster` | Map via category → cluster |
| (set) | `searchIntent` | `'commercial'` |
| (generate) | `canonicalUrl` | `https://toolstep.com/reviews/{slug}/` |
| (derive from price) | `affiliate` | Price ≥$300 → 'very-high', $100-300 → 'high', $50-100 → 'medium', <$50 → 'low' |
| (set) | `affiliateProgram` | `'amazon'` if `amazonUrl` exists, else `'none'` |
| (derive) | `estimatedValue` | Based on price × estimated commission |
| (set) | `commissionRate` | `4` (Amazon default) |
| `productName` + `brand` + `bestPrice` + `ratingValue` + `amazonUrl` + `specs` + `pros` + `cons` | `products[0]` | Consolidate into single `ProductRef` |
| `brand` | `brand` | Direct copy |
| `category` | `category` | Direct copy |
| `categorySlug` | `categorySlug` | Direct copy |
| `quickVerdict` | `quickVerdict` | Direct copy |
| `performance` + `buildQuality` + `easeOfUse` + `value` | `sections` | Transform each into `ContentSection` |
| `pros` | `pros` | Direct copy |
| `cons` | `cons` | Direct copy |
| `faqs` | `faqs` | Direct copy |
| `alternatives` + `compareSlugs` + `relatedProducts` | `relatedContent` | Merge and transform to `RelatedLink[]` |
| `compareSlugs` | `compareWith` | Direct copy |
| `alternatives[].href` | `alternatives` | Extract slugs from hrefs |
| (assign from matrix) | `priorityScore` | From FIRST_100_REVIEW_QUEUE.md |
| (assign from matrix) | `difficulty` | From KEYWORD_EXPANSION_MATRIX.md |
| `publishDate` | `publishDate` | Direct copy |
| `lastUpdated` | `lastUpdated` | Direct copy |
| `authorSlug` | `authorSlug` | Direct copy |
| `testingDuration` | `testingDuration` | Direct copy |
| `productsTested` | `productsTested` | Direct copy |
| `testingSummary` | `testingSummary` | Direct copy |
| `bestFor` | `bestFor` | Direct copy |
| `notFor` | `notFor` | Direct copy |
| `heroImage` | `heroImage` | Direct copy |

#### Migration Script Logic

```typescript
// scripts/migrate-reviews.ts (conceptual — not created)

function migrateReview(entry: ProductReviewEntry): ToolStepContent {
  return {
    id: `rev_${entry.slug}`,
    slug: entry.slug,
    contentType: 'review',
    status: 'published',

    title: entry.productName,
    metaDescription: entry.quickVerdict.slice(0, 155),
    primaryKeyword: slugToKeyword(entry.slug),
    secondaryKeywords: deriveSecondaryKeywords(entry),
    keywordCluster: mapCategoryToCluster(entry.category),
    searchIntent: 'commercial',
    canonicalUrl: `https://toolstep.com/reviews/${entry.slug}/`,

    affiliate: deriveAffiliateValue(entry.bestPrice),
    affiliateProgram: entry.amazonUrl ? 'amazon' : 'none',
    estimatedValue: deriveEstimatedValue(entry.bestPrice),
    commissionRate: 4,

    products: [{
      name: entry.productName,
      brand: entry.brand,
      price: entry.bestPrice,
      rating: entry.ratingValue,
      amazonUrl: entry.amazonUrl ?? undefined,
      pros: entry.pros,
      cons: entry.cons,
      specs: entry.specs
    }],
    brand: entry.brand,
    category: entry.category,
    categorySlug: entry.categorySlug,

    quickVerdict: entry.quickVerdict,
    sections: [
      { heading: 'Performance', content: entry.performance },
      { heading: 'Build Quality', content: entry.buildQuality },
      { heading: 'Ease of Use', content: entry.easeOfUse },
      { heading: 'Value', content: entry.value }
    ],
    pros: entry.pros,
    cons: entry.cons,
    faqs: entry.faqs,

    relatedContent: mergeRelatedLinks(entry),
    compareWith: entry.compareSlugs ?? [],
    alternatives: extractSlugsFromAlternatives(entry.alternatives),

    priorityScore: lookupPriorityScore(entry.slug),
    difficulty: lookupDifficulty(entry.slug),
    publishDate: entry.publishDate,
    lastUpdated: entry.lastUpdated,
    authorSlug: entry.authorSlug,
    testingDuration: entry.testingDuration,
    productsTested: entry.productsTested,

    testingSummary: entry.testingSummary,
    bestFor: entry.bestFor,
    notFor: entry.notFor,

    heroImage: entry.heroImage
  };
}
```

#### Validation Checkpoints

| Checkpoint | Action |
|---|---|
| All 35 slugs preserved | Compare old vs new slug arrays |
| All URLs render correctly | Build site + smoke test all 35 URLs |
| All pros/cons preserved | Compare array lengths |
| All FAQs preserved | Compare FAQ counts |
| All internal links resolve | Check every `relatedContent` slug exists |
| No data loss in sections | Compare content string lengths |

### 5.5 Phase 5C: Migrate Best Lists (100 pages)

**Goal:** Transform 100 `BestEntry` records to `ToolStepContent` with `contentType: 'list'`, `listSubtype: 'best'`.

#### Field Mapping

| Source Field (`BestEntry`) | Target Field (`ToolStepContent`) | Transformation |
|---|---|---|
| `slug` | `slug` | Direct copy |
| `title` | `title` | Direct copy |
| `description` | `metaDescription` | Direct copy (check length) |
| `intro` | `introduction` | Direct copy |
| `products[]` | `products[]` | Map `BestProduct` → `ProductRef` (add `rank` field) |
| `faqs` | `faqs` | Direct copy |
| `relatedReviews` + `relatedBests` | `relatedContent` | Merge and transform |
| `color` | (drop) | Move to theme config |
| `lastUpdated` | `lastUpdated` | Direct copy |
| `testingDuration` | `testingDuration` | Direct copy |
| `authorSlug` | `authorSlug` | Direct copy |
| (generate) | `methodology` | Template: "We tested {products.length} products over {testingDuration}..." |

#### Best Product Mapping

```typescript
function mapBestProduct(bp: BestProduct): ProductRef {
  return {
    name: bp.name,
    brand: bp.brand,
    price: bp.price,
    rating: bp.rating,
    rank: bp.rank,
    summary: bp.summary,
    pros: bp.pros,
    cons: bp.cons
  };
}
```

### 5.6 Phase 5D: Migrate Comparisons (50 pages)

**Goal:** Transform 50 `CompareEntry` records to `ToolStepContent` with `contentType: 'comparison'`.

#### Field Mapping

| Source Field (`CompareEntry`) | Target Field (`ToolStepContent`) | Transformation |
|---|---|---|
| `slug` | `slug` | Direct copy |
| `title` | `title` | Direct copy |
| `description` | `metaDescription` | Direct copy |
| `productA` | `products[0]` | Map `CompareProduct` → `ProductRef` |
| `productB` | `products[1]` | Map `CompareProduct` → `ProductRef` |
| `quickWinner` | `comparison.quickWinner` | Direct copy |
| `quickWinnerReason` | `comparison.quickWinnerReason` | Direct copy |
| `specs` | `comparison.specTable` | Direct copy |
| `whoWins` | `comparison.scenarios` | Direct copy |
| `faqs` | `faqs` | Direct copy |
| `relatedReviews` | `relatedContent` | Transform to `RelatedLink[]` |
| `color` | (drop) | Move to theme config |
| `lastUpdated` | `lastUpdated` | Direct copy |
| `testingDuration` | `testingDuration` | Direct copy |
| `authorSlug` | `authorSlug` | Direct copy |

### 5.7 Phase 5E: Migrate Alternatives

**Goal:** Transform existing `AlternativeEntry` records to `ToolStepContent` with `contentType: 'list'`, `listSubtype: 'alternative'`.

#### Field Mapping

| Source Field (`AlternativeEntry`) | Target Field (`ToolStepContent`) | Transformation |
|---|---|---|
| `slug` | `slug` | Direct copy |
| `title` | `title` | Direct copy |
| `toolName` | `anchorProduct.name` | Transform to `ProductRef` |
| `description` | `metaDescription` | Direct copy |
| `intro` | `introduction` | Direct copy |
| `alternatives[]` | `products[]` | Map `AlternativeProduct` → `ProductRef` |
| `whyChoose` | (distribute to `products[].why`) | Split across products |
| `faqs` | `faqs` | Direct copy |
| `internalLinks` | `relatedContent` | Transform to `RelatedLink[]` |
| `color` | (drop) | Move to theme config |
| `category` | `category` | Direct copy |
| `lastUpdated` | `lastUpdated` | Direct copy |
| `testingDuration` | `testingDuration` | Direct copy |
| `authorSlug` | `authorSlug` | Direct copy |

### 5.8 Phase 5F: Add SEO Fields to All Migrated Content

**Goal:** Populate `primaryKeyword`, `secondaryKeywords`, `keywordCluster`, `priorityScore`, `difficulty`, `affiliate`, `estimatedValue` for all 185+ migrated pages.

| Step | Action | Data Source |
|---|---|---|
| 5F.1 | Assign `primaryKeyword` from slug | Auto-generate: `keychron-k8-review` → `keychron k8 review` |
| 5F.2 | Assign `secondaryKeywords` from category + product | Auto-generate: 3-5 keywords per page |
| 5F.3 | Assign `keywordCluster` from category mapping | Map via `taxonomy/keywords.ts` |
| 5F.4 | Assign `priorityScore` from FIRST_100_REVIEW_QUEUE.md | Lookup by slug |
| 5F.5 | Assign `difficulty` from KEYWORD_EXPANSION_MATRIX.md | Lookup by cluster |
| 5F.6 | Assign `affiliate` from product price | Auto-derive: price ≥$300 → 'very-high', etc. |
| 5F.7 | Assign `estimatedValue` from price × commission | Auto-calculate |
| 5F.8 | Validate all fields via Zod schema | Run validation |

### 5.9 Phase 5G: Update Page Components

**Goal:** Update Astro page components to consume `ToolStepContent` instead of old interfaces.

| Page Component | Current Data Source | Future Data Source | Changes Required |
|---|---|---|---|
| `src/pages/reviews/[slug].astro` | `getReviewBySlug()` → `ProductReviewEntry` | `getContentBySlug()` → `ToolStepContent` | Update field access (e.g., `productName` → `title`, `performance` → `sections[0]`) |
| `src/pages/best/[slug].astro` | `getBestBySlug()` → `BestEntry` | `getContentBySlug()` → `ToolStepContent` | Update field access (e.g., `intro` → `introduction`, `products[].rank` preserved) |
| `src/pages/compare/[slug].astro` | `getComparisonBySlug()` → `CompareEntry` | `getContentBySlug()` → `ToolStepContent` | Update field access (e.g., `productA` → `products[0]`, `specs` → `comparison.specTable`) |
| `src/pages/alternatives/[slug].astro` | `getAlternativeBySlug()` → `AlternativeEntry` | `getContentBySlug()` → `ToolStepContent` | Update field access (e.g., `toolName` → `anchorProduct.name`, `alternatives` → `products`) |
| `src/pages/guides/[slug].astro` | (new page) | `getContentBySlug()` → `ToolStepContent` | New page component for guide content type |

#### Component Update Strategy

```typescript
// Before (current)
---
import { getReviewBySlug } from '../../data/products';
const { slug } = Astro.params;
const review = getReviewBySlug(slug!);
---
<h1>{review.productName}</h1>
<p>{review.quickVerdict}</p>
<div>{review.performance}</div>

// After (future)
---
import { getContentBySlug } from '../../data/content';
const { slug } = Astro.params;
const content = getContentBySlug(slug!);
if (content.contentType !== 'review') return Astro.redirect('/404');
---
<h1>{content.title}</h1>
<p>{content.quickVerdict}</p>
<div>{content.sections.find(s => s.heading === 'Performance')?.content}</div>
```

### 5.10 Phase 5H: Delete Legacy Files

**Goal:** Remove old files after all components updated and verified.

| File | Action | Prerequisite |
|---|---|---|
| `src/data/products.ts` | Delete | All imports updated to `content/schema.ts` |
| `src/data/reviewEntries.ts` | Delete | All imports updated to `content/index.ts` |
| `src/data/reviews.ts` | Delete | Confirmed no imports (legacy array) |
| `src/data/compare.ts` | Delete | All imports updated to `content/comparisons.ts` |
| `src/data/comparisons.ts` | Delete | All imports updated to `content/index.ts` |
| `src/data/best.ts` | Delete | All imports updated to `content/best.ts` |
| `src/data/alternatives.ts` | Delete | All imports updated to `content/alternatives.ts` |
| `src/data/tools.ts` | Delete | `Category` import updated to `taxonomy/categories.ts` |
| `src/data/products-extracted.ts` | Delete | Confirmed no imports |
| `src/data/products-catalog.ts` | Move to `products/catalog.ts` | Update imports |
| `src/data/categories.ts` | Delete | Moved to `taxonomy/categories.ts` |
| `src/data/reviews/` | Delete (5 group files) | Data merged into `content/reviews.ts` |

### 5.11 SEO Preservation Checklist

| SEO Element | Preservation Strategy | Verification |
|---|---|---|
| **URL structure** | Slugs unchanged — only data structure transforms | Compare sitemap before/after |
| **Canonical URLs** | `canonicalUrl` field preserves exact URL | Check canonical tags in HTML |
| **Meta titles** | `title` field preserved from old `productName` or `title` | Compare title tags |
| **Meta descriptions** | `metaDescription` field preserved from `quickVerdict` or `description` | Compare meta tags |
| **H1 headings** | `title` field used for H1 | Compare H1 tags |
| **Content body** | All text content preserved in `sections` or `products` | Compare word counts |
| **Internal links** | `relatedContent` preserves all old links | Crawl internal links before/after |
| **Schema markup** | Article/ItemList/FAQPage schema preserved | Validate structured data |
| **Sitemap** | Same URLs in sitemap | Compare sitemap XML |
| **301 redirects** | None needed — URLs unchanged | N/A |
| **404 errors** | None expected — all slugs preserved | Monitor for 404s post-migration |

### 5.12 Migration Rollback Plan

| Trigger | Action |
|---|---|
| Build fails after migration | Revert to old import paths, keep new schema files unused |
| Page rendering breaks | Revert component changes, debug field mapping |
| SEO ranking drops | Revert to old data structure, investigate canonical issues |
| Data loss detected | Restore from git, re-run migration with fixes |

**Rollback mechanism:** Git branches — migration happens on `feature/unified-schema` branch, merged to `main` only after full validation.

---

## 6. Implementation Summary

### 6.1 Effort Estimation

| Phase | Scope | Key Deliverables |
|---|---|---|
| Phase 1 | File architecture design | `src/data/content/` directory structure |
| Phase 2 | Schema definition | `ToolStepContent` interface + Zod validation |
| Phase 3 | Content type rules | Field matrix + validation rules per type |
| Phase 4 | Generation pipeline | 6-stage pipeline from keyword to published |
| Phase 5 | Migration strategy | 8-step migration preserving 185 existing pages |

### 6.2 Risk Assessment

| Risk | Probability | Impact | Mitigation |
|---|---|---|---|
| URL changes during migration | Low | Critical | Slug preservation enforced in migration scripts |
| SEO ranking drop | Low | High | Canonical URLs preserved, no 301s needed |
| Data loss in field mapping | Medium | High | Zod validation + content comparison checkpoints |
| Component rendering breaks | Medium | Medium | Incremental component updates with testing |
| Import path breakage | High | Low | Legacy alias files during transition |

### 6.3 Success Metrics

| Metric | Target |
|---|---|
| URLs preserved | 100% of existing URLs render correctly |
| SEO rankings | No drop in rankings for top-10 keywords |
| Build time | No increase beyond 10% |
| Content validation | 100% of content passes Zod validation |
| Internal links | All internal links resolve correctly |
| Migration completeness | All 185 pages migrated to unified schema |

---

*End of Content Schema Implementation Blueprint. Refer to CONTENT_SCHEMA_EVOLUTION_PLAN.md for the schema evolution rationale and KEYWORD_EXPANSION_MATRIX.md for the 1000-page expansion map.*
