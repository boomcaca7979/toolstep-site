// ToolStep Unified Content Schema — Shared Types
// Reusable sub-interfaces used by ToolStepContent and adapters.
// This file has zero dependencies on legacy data files.

// ============================================================
// Primitive Enums
// ============================================================

export type ContentType = 'review' | 'comparison' | 'list' | 'guide';
export type ListSubtype = 'best' | 'alternative';
export type ContentStatus = 'published' | 'draft' | 'queued' | 'deprecated';
export type SearchIntent = 'commercial' | 'informational' | 'transactional';
export type AffiliateValue = 'very-high' | 'high' | 'medium' | 'low' | 'none';
export type AffiliateProgram = 'amazon' | 'subscription' | 'direct' | 'none';
export type EstimatedValue = '$1000+' | '$500-1000' | '$100-500' | '$50-100' | '<$50' | 'none';

// ============================================================
// Shared Content Primitives
// ============================================================

export interface Faq {
  question: string;
  answer: string;
}

export interface Spec {
  label: string;
  value: string;
}

export interface ContentSection {
  heading: string;
  content: string;
  recommendation?: string;
}

// ============================================================
// Product Reference (unified across all content types)
// ============================================================

export interface ProductRef {
  name: string;
  brand: string;
  price: number;
  rating?: number;
  rank?: number;
  amazonUrl?: string;
  summary?: string;
  pros?: string[];
  cons?: string[];
  why?: string;
  specs?: Spec[];
  reviewSlug?: string;
  pricing?: string; // Legacy AlternativeProduct.pricing — preserved for reverse adapter
  bestFor?: string;
}

// ============================================================
// Comparison-Specific Types
// ============================================================

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

export interface ComparisonData {
  quickWinner: 'A' | 'B' | 'tie';
  quickWinnerReason: string;
  specTable: ComparisonSpec[];
  scenarios: ComparisonScenario[];
}

// ============================================================
// Related Content / Internal Linking
// ============================================================

export interface RelatedLink {
  slug: string;
  label: string;
  type: ContentType;
  relationship: 'related' | 'compare' | 'alternative' | 'category';
  description?: string; // Legacy alternatives[].desc — preserved for reverse adapter
}

export interface RecommendedProduct {
  name: string;
  slug: string;
  reason: string;
}
