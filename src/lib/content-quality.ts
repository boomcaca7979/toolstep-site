// Content Quality Checker
// Runs at build time to validate word count minimums across all page types.
// Outputs warnings (not errors) for pages below minimum thresholds.

import { bestData } from '../data/best';
import { compareData } from '../data/compare';
import { productReviews } from '../data/products';

export interface QualityWarning {
  slug: string;
  type: 'best' | 'compare' | 'review';
  wordCount: number;
  minimum: number;
  message: string;
}

const MINIMUMS = {
  best: 1200,
  compare: 1500,
  review: 1800,
};

// Rough word count estimator from data fields
function estimateWordCount(text: string): number {
  return text.split(/\s+/).filter(w => w.length > 0).length;
}

function estimateBestWordCount(entry: typeof bestData[0]): number {
  let words = 0;
  words += estimateWordCount(entry.intro);
  words += estimateWordCount(entry.description);
  words += entry.products.reduce((sum, p) => sum + estimateWordCount(p.summary) + estimateWordCount(p.pros.join(' ')) + estimateWordCount(p.cons.join(' ')), 0);
  words += entry.faqs.reduce((sum, f) => sum + estimateWordCount(f.question) + estimateWordCount(f.answer), 0);
  // Add template boilerplate words (How We Tested, Ranking Methodology, etc.)
  words += 300;
  return words;
}

function estimateCompareWordCount(entry: typeof compareData[0]): number {
  let words = 0;
  words += estimateWordCount(entry.description);
  words += estimateWordCount(entry.quickWinnerReason);
  words += entry.productA.pros.join(' ').split(/\s+/).length;
  words += entry.productA.cons.join(' ').split(/\s+/).length;
  words += entry.productB.pros.join(' ').split(/\s+/).length;
  words += entry.productB.cons.join(' ').split(/\s+/).length;
  words += entry.specs.reduce((sum, s) => sum + estimateWordCount(s.label) + estimateWordCount(s.productA) + estimateWordCount(s.productB), 0);
  words += entry.whoWins.reduce((sum, w) => sum + estimateWordCount(w.scenario), 0);
  words += entry.faqs.reduce((sum, f) => sum + estimateWordCount(f.question) + estimateWordCount(f.answer), 0);
  // Add template boilerplate words
  words += 400;
  return words;
}

function estimateReviewWordCount(entry: typeof productReviews[0]): number {
  let words = 0;
  words += estimateWordCount(entry.verdict);
  words += estimateWordCount(entry.quickVerdict);
  words += estimateWordCount(entry.testingSummary);
  words += estimateWordCount(entry.performance);
  words += estimateWordCount(entry.buildQuality);
  words += estimateWordCount(entry.easeOfUse);
  words += estimateWordCount(entry.value);
  words += entry.pros.join(' ').split(/\s+/).length;
  words += entry.cons.join(' ').split(/\s+/).length;
  words += entry.bestFor.join(' ').split(/\s+/).length;
  words += entry.notFor.join(' ').split(/\s+/).length;
  words += entry.faqs.reduce((sum, f) => sum + estimateWordCount(f.question) + estimateWordCount(f.answer), 0);
  // Add template boilerplate words
  words += 300;
  return words;
}

export function runQualityChecks(): QualityWarning[] {
  const warnings: QualityWarning[] = [];

  for (const entry of bestData) {
    const wc = estimateBestWordCount(entry);
    if (wc < MINIMUMS.best) {
      warnings.push({
        slug: entry.slug,
        type: 'best',
        wordCount: wc,
        minimum: MINIMUMS.best,
        message: `Best page "${entry.title}" has ~${wc} words (minimum: ${MINIMUMS.best})`,
      });
    }
  }

  for (const entry of compareData) {
    const wc = estimateCompareWordCount(entry);
    if (wc < MINIMUMS.compare) {
      warnings.push({
        slug: entry.slug,
        type: 'compare',
        wordCount: wc,
        minimum: MINIMUMS.compare,
        message: `Compare page "${entry.title}" has ~${wc} words (minimum: ${MINIMUMS.compare})`,
      });
    }
  }

  for (const entry of productReviews) {
    const wc = estimateReviewWordCount(entry);
    if (wc < MINIMUMS.review) {
      warnings.push({
        slug: entry.slug,
        type: 'review',
        wordCount: wc,
        minimum: MINIMUMS.review,
        message: `Review page "${entry.productName}" has ~${wc} words (minimum: ${MINIMUMS.review})`,
      });
    }
  }

  return warnings;
}

export const QUALITY_MINIMUMS = MINIMUMS;
