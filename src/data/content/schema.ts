// ToolStep Unified Content Schema — Main Interface
// The single source of truth for all content types in ToolStep.
// Supports: review, comparison, list (best/alternative), guide
// Scales to 1000+ pages.

import type {
  ContentType,
  ListSubtype,
  ContentStatus,
  SearchIntent,
  AffiliateValue,
  AffiliateProgram,
  EstimatedValue,
  Faq,
  ContentSection,
  ProductRef,
  ComparisonData,
  RelatedLink,
  RecommendedProduct,
} from './types';

// ============================================================
// ToolStepContent — Unified Content Interface
// ============================================================

export interface ToolStepContent {
  // ========================================
  // CORE IDENTITY
  // ========================================
  id: string;
  slug: string;
  contentType: ContentType;
  listSubtype?: ListSubtype;
  status: ContentStatus;

  // ========================================
  // SEO METADATA
  // ========================================
  title: string;
  metaDescription: string;
  primaryKeyword: string;
  secondaryKeywords: string[];
  keywordCluster: string;
  searchIntent: SearchIntent;
  canonicalUrl: string;

  // ========================================
  // COMMERCIAL / MONETIZATION
  // ========================================
  affiliate: AffiliateValue;
  affiliateProgram: AffiliateProgram;
  estimatedValue: EstimatedValue;
  commissionRate?: number;

  // ========================================
  // PRODUCT REFERENCES
  // ========================================
  products: ProductRef[];
  brand: string;
  category: string;
  categorySlug: string;

  // ========================================
  // CONTENT BODY
  // ========================================
  quickVerdict: string;
  verdict?: string; // Legacy ProductReviewEntry.verdict — preserved for reverse adapter
  sections: ContentSection[];
  pros: string[];
  cons: string[];
  faqs: Faq[];

  // ========================================
  // RELATIONSHIPS / INTERNAL LINKING
  // ========================================
  relatedContent: RelatedLink[];
  compareWith: string[];
  alternatives: string[];

  // ========================================
  // ANALYTICS / PRODUCTION
  // ========================================
  priorityScore: number;
  difficulty: number;
  searchVolume?: number;
  publishDate: string;
  lastUpdated: string;
  authorSlug: string;
  testingDuration: string;
  productsTested?: number;
  /** ISO 8601 update date for schema.org dateModified. Falls back to publishDate. */
  updatedDate?: string;

  // ========================================
  // TYPE-SPECIFIC FIELDS (optional)
  // ========================================
  // For review
  testingSummary?: string;
  bestFor?: string[];
  notFor?: string[];

  // For comparison
  comparison?: ComparisonData;

  // For list (best/alternative)
  introduction?: string;
  methodology?: string;
  anchorProduct?: ProductRef;

  // For guide
  recommendedProducts?: RecommendedProduct[];

  // ========================================
  // PRESENTATION (optional)
  // ========================================
  heroImage?: string;
  ogImage?: string;
  color?: string; // Legacy category color tag — preserved for reverse adapter
  wordCount?: number;
  readingTime?: number;
}

// ============================================================
// Content Type Discriminator Helpers
// ============================================================

export type ReviewContent = ToolStepContent & {
  contentType: 'review';
  testingSummary: string;
  bestFor: string[];
  notFor: string[];
};

export type ComparisonContent = ToolStepContent & {
  contentType: 'comparison';
  comparison: ComparisonData;
};

export type BestListContent = ToolStepContent & {
  contentType: 'list';
  listSubtype: 'best';
  introduction: string;
  methodology: string;
};

export type AlternativeContent = ToolStepContent & {
  contentType: 'list';
  listSubtype: 'alternative';
  introduction: string;
  anchorProduct: ProductRef;
};

export type GuideContent = ToolStepContent & {
  contentType: 'guide';
  introduction: string;
  recommendedProducts: RecommendedProduct[];
};

// ============================================================
// Re-export shared types for convenience
// ============================================================

export type {
  ContentType,
  ListSubtype,
  ContentStatus,
  SearchIntent,
  AffiliateValue,
  AffiliateProgram,
  EstimatedValue,
  Faq,
  Spec,
  ContentSection,
  ProductRef,
  ComparisonData,
  ComparisonSpec,
  ComparisonScenario,
  RelatedLink,
  RecommendedProduct,
} from './types';
