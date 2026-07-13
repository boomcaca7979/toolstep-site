# Unified Schema Migration Execution Plan

> Generated: 2026-07-09
> Based on: CONTENT_SCHEMA_IMPLEMENTATION_BLUEPRINT.md, CONTENT_SCHEMA_EVOLUTION_PLAN.md
> Goal: Define the actual code migration execution plan with zero production impact
> Constraint: Planning document only — no code modified, no files created, no data migrated

---

## Phase 1: Current Dependency Mapping

### 1.1 Data Source Inventory

| Data Source | File | Interface | Records | Type |
|---|---|---|---|---|
| `reviewEntries` | `src/data/reviewEntries.ts` | `ProductReviewEntry` | 35 | Aggregator (imports group1-5) |
| `products` (type) | `src/data/products.ts` | `ProductReviewEntry` | 5 (inline, unused) | Interface definition + dead data |
| `best` | `src/data/best.ts` | `BestEntry` | 100 | Leaf data source |
| `compare` | `src/data/compare.ts` | `CompareEntry` | 50 | Leaf data source |
| `alternatives` | `src/data/alternatives.ts` | `AlternativeEntry` | ~10 | Leaf data source |
| `comparisons` | `src/data/comparisons.ts` | Re-export of `CompareEntry` | 0 | **Dead code** — no consumers |
| `reviews` (metadata) | `src/data/reviews.ts` | Inline objects | ~35 | Lightweight metadata (title/desc/href) |
| `categories` | `src/data/categories.ts` | `Category` | ~15 | **Dead code** — no consumers |
| `tools` (categories) | `src/data/tools.ts` | `Category` (duplicate) | ~15 | Active category source |

### 1.2 Dependency Graph: Component → Data Source → Page Route

#### Review Pipeline

```
src/data/reviews/group1.ts ─┐
src/data/reviews/group2.ts ─┤
src/data/reviews/group3.ts ─┼─► src/data/reviewEntries.ts ─► src/pages/reviews/[slug].astro ─► /reviews/{slug}/
src/data/reviews/group4.ts ─┤         │
src/data/reviews/group5.ts ─┘         └─► (type) src/templates/ProductReviewTemplate.astro
         │
         └─► (type import) src/data/products.ts (ProductReviewEntry interface)

src/data/reviews.ts ─► src/pages/reviews/index.astro ─► /reviews/
                   ─► src/pages/compare/[slug].astro ─► /compare/{slug}/ (title lookup)
                   ─► src/pages/authors/[slug].astro ─► /authors/{slug}/ (review metadata)
                   ─► src/pages/authors/index.astro ─► /authors/
                   ─► src/pages/rss.xml.js ─► /rss.xml
```

#### Best List Pipeline

```
src/data/best.ts ─► src/pages/best/[slug].astro ─► /best/{slug}/
                ─► src/pages/best/index.astro ─► /best/
                ─► src/pages/rss.xml.js ─► /rss.xml
                ─► (type) src/templates/BestReviewTemplate.astro
```

#### Comparison Pipeline

```
src/data/compare.ts ─► src/pages/compare/[slug].astro ─► /compare/{slug}/
                   ─► src/pages/compare/index.astro ─► /compare/
                   ─► src/pages/rss.xml.js ─► /rss.xml
                   ─► src/components/RelatedLinks.astro ─► (used in review pages)
                   ─► (type) src/templates/CompareTemplate.astro

src/data/comparisons.ts ─► (DEAD CODE — no consumers)
```

#### Alternatives Pipeline

```
src/data/alternatives.ts ─► src/pages/alternatives/[slug].astro ─► /alternatives/{slug}/
                       ─► src/pages/alternatives/index.astro ─► /alternatives/
                       ─► src/pages/rss.xml.js ─► /rss.xml
                       ─► src/components/RelatedLinks.astro ─► (used in review pages)
```

#### Cross-Cutting Dependencies

```
src/data/authors.ts ─► src/pages/reviews/[slug].astro
                   ─► src/pages/best/[slug].astro
                   ─► src/pages/compare/[slug].astro
                   ─► src/pages/alternatives/[slug].astro
                   ─► src/pages/authors/[slug].astro
                   ─► src/pages/authors/index.astro
                   ─► src/pages/about.astro
                   ─► src/pages/team.astro
                   ─► src/components/ReviewMeta.astro

src/data/tools.ts (categories) ─► src/components/Sidebar.astro
                              ─► src/components/ToolCard.astro
                              ─► src/pages/index.astro
                              ─► src/pages/tools/[id].astro
                              ─► src/pages/tools/index.astro
```

### 1.3 Critical Dependency Summary

| Data Source | Direct Page Consumers | Component Consumers | Template Consumers | Risk Level |
|---|---|---|---|---|
| `reviewEntries` | 1 (`reviews/[slug].astro`) | 0 | 1 (`ProductReviewTemplate`) | Medium |
| `best` | 3 (`best/[slug]`, `best/index`, `rss.xml`) | 0 | 1 (`BestReviewTemplate`) | Medium |
| `compare` | 3 (`compare/[slug]`, `compare/index`, `rss.xml`) | 1 (`RelatedLinks`) | 1 (`CompareTemplate`) | High |
| `alternatives` | 3 (`alternatives/[slug]`, `alternatives/index`, `rss.xml`) | 1 (`RelatedLinks`) | 0 | Medium |
| `reviews` (metadata) | 5 (index pages, authors, rss) | 0 | 0 | Low |
| `authors` | 6+ pages | 1 (`ReviewMeta`) | 0 | Low (not migrating) |
| `tools` (categories) | 3 pages | 2 (`Sidebar`, `ToolCard`) | 0 | Low (not migrating) |

### 1.4 Dead Code Identified

| File | Status | Action |
|---|---|---|
| `src/data/comparisons.ts` | Dead code — no consumers | Delete in Step 7 |
| `src/data/categories.ts` | Dead code — superseded by `tools.ts` | Delete in Step 7 |
| `src/data/products.ts` (`productReviews` array) | Dead data — `reviewEntries` is the actual source | Remove array, keep interface |
| `src/data/products-extracted.ts` | Dead data — no direct consumers | Delete in Step 7 |
| `src/data/products-catalog.ts` | Dead data — no direct consumers | Move to `products/catalog.ts` or delete |

---

## Phase 2: Migration Order Design

### 2.1 Migration Principles

1. **Never break production** — every step must leave the site in a buildable state
2. **Add before remove** — new schema coexists with old until fully switched
3. **One pipeline at a time** — migrate review, then best, then compare, then alternatives
4. **Switch last** — page components switch to new data source only after data is validated
5. **Delete last** — old files removed only after all consumers migrated

### 2.2 Seven-Step Migration Sequence

```
Step 1: Add Unified Schema (additive only, zero risk)
   ↓
Step 2: Add Adapter Layer (additive only, zero risk)
   ↓
Step 3: Migrate Review Data (data only, pages unchanged)
   ↓
Step 4: Migrate Best List Data (data only, pages unchanged)
   ↓
Step 5: Migrate Comparison Data (data only, pages unchanged)
   ↓
Step 6: Switch Page Entry Points (pages read from new source)
   ↓
Step 7: Delete Legacy Files (cleanup)
```

### 2.3 Step Details

#### Step 1: Add Unified Schema

**Goal:** Create new schema files without touching any existing code.

**Actions:**
| # | Action | File | Type |
|---|---|---|---|
| 1.1 | Create `ToolStepContent` interface | `src/data/content/schema.ts` | New file |
| 1.2 | Create shared sub-interfaces (`Faq`, `Spec`, `ProductRef`, etc.) | `src/data/content/types.ts` | New file |
| 1.3 | Create Zod validation schemas | `src/data/content/validate.ts` | New file |
| 1.4 | Create unified query API stubs | `src/data/content/index.ts` | New file |
| 1.5 | Create empty content data files | `src/data/content/reviews.ts` etc. | 5 new files |

**Why safe:** Pure addition — no existing imports change, no existing files modified.

#### Step 2: Add Adapter Layer

**Goal:** Create adapter functions that convert old data to new schema, without changing any existing data flow.

**Actions:**
| # | Action | File | Type |
|---|---|---|---|
| 2.1 | Create review adapter (`ProductReviewEntry` → `ToolStepContent`) | `src/data/content/adapters/review-adapter.ts` | New file |
| 2.2 | Create best-list adapter (`BestEntry` → `ToolStepContent`) | `src/data/content/adapters/best-adapter.ts` | New file |
| 2.3 | Create comparison adapter (`CompareEntry` → `ToolStepContent`) | `src/data/content/adapters/compare-adapter.ts` | New file |
| 2.4 | Create alternatives adapter (`AlternativeEntry` → `ToolStepContent`) | `src/data/content/adapters/alternative-adapter.ts` | New file |
| 2.5 | Create unified index that aggregates all adapted content | `src/data/content/index.ts` | Modify (add implementation) |

**Why safe:** Adapters are new functions — existing page components still import from old data sources. The new `index.ts` provides `getContentBySlug()` but nothing calls it yet.

**Adapter example:**
```typescript
// src/data/content/adapters/review-adapter.ts
import type { ProductReviewEntry } from '../../products';
import type { ToolStepContent } from '../schema';

export function adaptReview(entry: ProductReviewEntry): ToolStepContent {
  return {
    id: `rev_${entry.slug}`,
    slug: entry.slug,
    contentType: 'review',
    status: 'published',
    // ... full mapping per BLUEPRINT Phase 5B
  };
}
```

#### Step 3: Migrate Review Data

**Goal:** Populate `src/data/content/reviews.ts` with adapted review data. Pages still read from old source.

**Actions:**
| # | Action | File | Type |
|---|---|---|---|
| 3.1 | Import all 35 reviews via `reviewEntries` | `src/data/content/reviews.ts` | New content |
| 3.2 | Run adapter on each review | `src/data/content/reviews.ts` | Transform |
| 3.3 | Export `reviewContent: ToolStepContent[]` | `src/data/content/reviews.ts` | Export |
| 3.4 | Add SEO fields (keywords, priorityScore, etc.) | `src/data/content/reviews.ts` | Enrich |
| 3.5 | Run Zod validation on all 35 records | `src/data/content/reviews.ts` | Validate |
| 3.6 | Update `content/index.ts` to include reviews in unified API | `src/data/content/index.ts` | Modify |

**Why safe:** New data file exists alongside old. `reviews/[slug].astro` still imports from `reviewEntries.ts`. No page behavior changes.

**Validation checkpoint:**
```
- All 35 slugs present in new data
- All 35 slugs match old data exactly
- Zod validation passes for all 35 records
- npm run build succeeds
- npx tsc --noEmit passes
```

#### Step 4: Migrate Best List Data

**Goal:** Populate `src/data/content/best.ts` with adapted best-list data.

**Actions:**
| # | Action | File | Type |
|---|---|---|---|
| 4.1 | Import all 100 best lists via `bestData` | `src/data/content/best.ts` | New content |
| 4.2 | Run adapter on each best list | `src/data/content/best.ts` | Transform |
| 4.3 | Export `bestContent: ToolStepContent[]` | `src/data/content/best.ts` | Export |
| 4.4 | Add SEO fields | `src/data/content/best.ts` | Enrich |
| 4.5 | Run Zod validation on all 100 records | `src/data/content/best.ts` | Validate |
| 4.6 | Update `content/index.ts` to include best lists | `src/data/content/index.ts` | Modify |

**Why safe:** Same as Step 3 — new data coexists with old. `best/[slug].astro` still imports from `best.ts` (old).

**Validation checkpoint:**
```
- All 100 slugs present in new data
- All 100 slugs match old data exactly
- Zod validation passes for all 100 records
- npm run build succeeds
```

#### Step 5: Migrate Comparison Data

**Goal:** Populate `src/data/content/comparisons.ts` with adapted comparison data.

**Actions:**
| # | Action | File | Type |
|---|---|---|---|
| 5.1 | Import all 50 comparisons via `compareData` | `src/data/content/comparisons.ts` | New content |
| 5.2 | Run adapter on each comparison | `src/data/content/comparisons.ts` | Transform |
| 5.3 | Export `comparisonContent: ToolStepContent[]` | `src/data/content/comparisons.ts` | Export |
| 5.4 | Add SEO fields | `src/data/content/comparisons.ts` | Enrich |
| 5.5 | Run Zod validation on all 50 records | `src/data/content/comparisons.ts` | Validate |
| 5.6 | Update `content/index.ts` to include comparisons | `src/data/content/index.ts` | Modify |
| 5.7 | Migrate alternatives data (same pattern) | `src/data/content/alternatives.ts` | New content |

**Why safe:** Same pattern. `compare/[slug].astro` and `alternatives/[slug].astro` still import from old sources.

**Validation checkpoint:**
```
- All 50 comparison slugs present and match
- All alternative slugs present and match
- Zod validation passes
- npm run build succeeds
```

#### Step 6: Switch Page Entry Points

**Goal:** Update page components to read from unified `content/index.ts` instead of old data sources. **This is the highest-risk step.**

**Actions (one pipeline at a time):**

| # | Action | File | Risk |
|---|---|---|---|
| 6.1 | Switch `reviews/[slug].astro` to `getContentBySlug()` | `src/pages/reviews/[slug].astro` | Medium |
| 6.2 | Update `ProductReviewTemplate.astro` field access | `src/templates/ProductReviewTemplate.astro` | Medium |
| 6.3 | Verify review pages render correctly | — | — |
| 6.4 | Switch `best/[slug].astro` to `getContentBySlug()` | `src/pages/best/[slug].astro` | Medium |
| 6.5 | Switch `best/index.astro` to unified API | `src/pages/best/index.astro` | Low |
| 6.6 | Verify best pages render correctly | — | — |
| 6.7 | Switch `compare/[slug].astro` to `getContentBySlug()` | `src/pages/compare/[slug].astro` | High |
| 6.8 | Switch `compare/index.astro` to unified API | `src/pages/compare/index.astro` | Low |
| 6.9 | Switch `RelatedLinks.astro` to unified API | `src/components/RelatedLinks.astro` | High |
| 6.10 | Verify comparison pages render correctly | — | — |
| 6.11 | Switch `alternatives/[slug].astro` to `getContentBySlug()` | `src/pages/alternatives/[slug].astro` | Medium |
| 6.12 | Switch `alternatives/index.astro` to unified API | `src/pages/alternatives/index.astro` | Low |
| 6.13 | Update `rss.xml.js` to use unified API | `src/pages/rss.xml.js` | Medium |
| 6.14 | Full build + smoke test | — | — |

**Why risky:** This is where field name changes (`productName` → `title`, `performance` → `sections[0].content`) take effect. If any field mapping is wrong, pages break.

**Mitigation:** Switch one pipeline at a time (reviews first, then best, then compare, then alternatives). Build and test after each switch.

#### Step 7: Delete Legacy Files

**Goal:** Remove old files after all pages confirmed working with new schema.

**Actions:**
| # | Action | File | Prerequisite |
|---|---|---|---|
| 7.1 | Delete `src/data/comparisons.ts` | Dead code | None (already unused) |
| 7.2 | Delete `src/data/categories.ts` | Dead code | None (already unused) |
| 7.3 | Delete `src/data/products-extracted.ts` | Dead data | None (already unused) |
| 7.4 | Remove `productReviews` array from `products.ts` | Dead data | Step 6.3 complete |
| 7.5 | Remove `extractedProducts` / `catalogProducts` re-exports from `products.ts` | Dead re-exports | Step 7.3 complete |
| 7.6 | Delete `src/data/reviewEntries.ts` | Old aggregator | Step 6.3 complete |
| 7.7 | Delete `src/data/reviews/group1-5.ts` | Old group files | Step 7.6 complete |
| 7.8 | Move `ProductReviewEntry` interface to `legacy/` or delete | Old interface | Step 6.3 complete |
| 7.9 | Delete old `best.ts`, `compare.ts`, `alternatives.ts` (or convert to re-exports) | Old data sources | Steps 6.6, 6.10, 6.12 complete |
| 7.10 | Final build + full test suite | — | All deletions complete |

**Why safe:** All consumers now read from `content/` directory. Old files are dead code.

---

## Phase 3: Risk Analysis

### 3.1 Per-Step Risk Matrix

| Step | Risk | Impact | Probability | Rollback |
|---|---|---|---|---|
| **1. New schema** | TypeScript compilation error in new files | Low — only new files affected | Low | Delete new files |
| **2. Adapter layer** | Adapter mapping error (field mismatch) | Low — adapters not yet consumed | Medium | Fix adapter, no production impact |
| **3. Migrate review data** | Data loss during adaptation | Medium — 35 pages at risk if switched | Low (not switched yet) | Re-run adapter, old data untouched |
| **4. Migrate best data** | Data loss during adaptation | Medium — 100 pages at risk if switched | Low (not switched yet) | Re-run adapter, old data untouched |
| **5. Migrate compare data** | Data loss during adaptation | Medium — 50 pages at risk if switched | Low (not switched yet) | Re-run adapter, old data untouched |
| **6. Switch pages** | Field access errors after switch | **High** — pages break | Medium | Revert import to old data source |
| **7. Delete legacy** | Accidental deletion of still-needed file | Medium — build breaks | Low | Restore from git |

### 3.2 Critical Risk Areas

#### URL Change Risk

| Step | URL Risk | Mitigation |
|---|---|---|
| Steps 1-5 | **None** — pages still use old data | N/A |
| Step 6 | **None** — `getStaticPaths` generates same slugs from new data | Verify slug arrays match before switch |
| Step 7 | **None** — slugs come from `content/` data which preserves old slugs | N/A |

**Verification:** Before Step 6, run slug comparison:
```bash
# Conceptual verification
old_slugs = reviewEntries.map(e => e.slug).sort()
new_slugs = reviewContent.map(e => e.slug).sort()
assert(old_slugs === new_slugs)  # Must be identical
```

#### Google Indexing Risk

| Risk | Impact | Mitigation |
|---|---|---|
| Canonical URL changes | De-indexing | `canonicalUrl` field preserves exact URLs |
| Meta title/description changes | Ranking fluctuation | `title` and `metaDescription` fields preserve old values |
| Content body changes | Ranking drop | All text content preserved in `sections` / `products` |
| 404 errors | De-indexing | Slugs unchanged — no URL changes |
| Sitemap changes | Crawl errors | Sitemap generated from same slugs — no change |

**Critical:** The migration must NOT change any of the following for any page:
- URL (`/reviews/{slug}/` stays the same)
- `<title>` tag
- `<meta name="description">` tag
- `<canonical>` tag
- `<h1>` text
- Main content text
- Internal link count

#### Schema.org Impact

| Schema Type | Current Source | Migration Impact | Risk |
|---|---|---|---|
| Article | `ProductReviewEntry` fields | Fields remapped but schema output unchanged | Low |
| ItemList | `BestEntry` fields | Fields remapped but schema output unchanged | Low |
| FAQPage | `faqs` array | Direct copy — no change | None |
| BreadcrumbList | Generated from `categorySlug` | No change | None |
| Organization | Static | No change | None |
| WebSite | Static | No change | None |

**Verification:** After Step 6, compare Schema.org JSON-LD output before/after for 10 random pages.

#### Sitemap Impact

| Aspect | Risk | Mitigation |
|---|---|---|
| URL count | None — same slugs | Verify count matches |
| URL structure | None — same patterns | Verify patterns match |
| Last modified dates | Low — dates preserved in `lastUpdated` | Verify dates match |
| Priority/changefreq | None — generated from same logic | N/A |

**Verification:** After Step 6, diff sitemap before/after — must be identical.

#### Internal Linking Impact

| Link Type | Source | Migration Impact | Risk |
|---|---|---|---|
| Review → Best List | `alternatives` array → `relatedContent` | Links preserved, structure changed | Medium |
| Review → Comparison | `compareSlugs` → `compareWith` | Links preserved | Low |
| Best → Review | `relatedReviews` → `relatedContent` | Links preserved | Low |
| Compare → Review | `relatedReviews` → `relatedContent` | Links preserved | Low |
| Alternative → Review | `internalLinks` → `relatedContent` | Links preserved | Low |
| `RelatedLinks.astro` component | Reads from `compare` + `alternatives` | Must update to read from `content/` | High |

**Critical:** `RelatedLinks.astro` component reads from `compareData` and `alternativesData` directly. This component must be updated in Step 6.9, or internal links will break.

### 3.3 Risk Mitigation Summary

| Risk Category | Severity | Mitigation | Verification |
|---|---|---|---|
| URL changes | Critical | Slugs preserved in adapter | Slug array comparison |
| SEO ranking drop | High | All meta fields preserved | HTML diff before/after |
| Schema.org breakage | Medium | Schema generation logic unchanged | JSON-LD validation |
| Sitemap changes | Medium | Sitemap from same slugs | Sitemap diff |
| Internal link breakage | High | `RelatedLinks.astro` updated | Link crawler check |
| Build failure | Medium | Build after each step | `npm run build` |
| TypeScript errors | Medium | Type check after each step | `npx tsc --noEmit` |

---

## Phase 4: Testing Strategy

### 4.1 Build Testing

| Test | Command | When | Pass Criteria |
|---|---|---|---|
| Build succeeds | `npm run build` | After every step | 0 errors, all pages generated |
| Page count matches | `npm run build` output | After Steps 3-6 | Same page count as before migration |
| Build time | `npm run build` timing | After every step | No more than 10% increase |

### 4.2 TypeScript Testing

| Test | Command | When | Pass Criteria |
|---|---|---|---|
| Type check passes | `npx tsc --noEmit` | After every step | 0 errors |
| No implicit any | `npx tsc --noEmit --strict` | After Steps 1-2 | 0 errors |
| Schema validation | Custom Zod validation script | After Steps 3-5 | All records pass validation |

### 4.3 SEO Testing

| Test | What | How | When | Pass Criteria |
|---|---|---|---|---|
| Sitemap identical | Compare sitemap XML | Diff before/after | After Step 6 | 0 differences in URLs |
| Canonical tags | Check `<link rel="canonical">` | HTML diff | After Step 6 | All canonical URLs match |
| Meta titles | Check `<title>` tags | HTML diff | After Step 6 | All titles match |
| Meta descriptions | Check `<meta name="description">` | HTML diff | After Step 6 | All descriptions match |
| Schema.org JSON-LD | Validate structured data | Google Rich Results Test | After Step 6 | All schemas valid |
| H1 tags | Check `<h1>` text | HTML diff | After Step 6 | All H1s match |
| Internal links | Count internal links per page | Crawl before/after | After Step 6 | Link count matches ±2 |

### 4.4 Page Smoke Testing

**Sample size:** 10 random pages per content type (30 total)

| Content Type | Pages to Test | What to Check |
|---|---|---|
| Review (10) | Random sample from 35 reviews | Page renders, all sections present, pros/cons displayed, FAQ visible, Amazon CTA present, related links work |
| Comparison (10) | Random sample from 50 comparisons | Page renders, both products shown, spec table present, winner declared, FAQ visible |
| Best List (10) | Random sample from 100 best lists | Page renders, product ranking displayed, all products shown, methodology visible, FAQ visible |

**Testing checklist per page:**
```
[ ] Page loads without 500 error
[ ] H1 matches expected title
[ ] Meta description present and correct
[ ] Canonical URL correct
[ ] Schema.org JSON-LD present and valid
[ ] All content sections render
[ ] Pros/cons lists render
[ ] FAQ section renders
[ ] Amazon affiliate link present (where applicable)
[ ] Related links render and resolve
[ ] No broken images
[ ] No console errors
```

### 4.5 Automated Regression Testing

| Test | Tool | Frequency |
|---|---|---|
| Build success | `npm run build` | After every step |
| Type checking | `npx tsc --noEmit` | After every step |
| Sitemap generation | Build output check | After Step 6 |
| Slug preservation | Custom script comparing old/new slug arrays | Before Step 6 |
| HTML diff | Custom script comparing rendered HTML | After Step 6 |
| Link checking | Crawler checking all internal links | After Step 6 |

### 4.6 Pre-Switch Validation Script (Conceptual)

```typescript
// scripts/validate-migration.ts (conceptual — not created)

import { reviewEntries } from '../src/data/reviewEntries';
import { reviewContent } from '../src/data/content/reviews';
import { bestData } from '../src/data/best';
import { bestContent } from '../src/data/content/best';
import { compareData } from '../src/data/compare';
import { comparisonContent } from '../src/data/content/comparisons';

function validateMigration() {
  // 1. Slug preservation
  const oldReviewSlugs = reviewEntries.map(e => e.slug).sort();
  const newReviewSlugs = reviewContent.map(e => e.slug).sort();
  assertSlugsMatch(oldReviewSlugs, newReviewSlugs, 'reviews');

  const oldBestSlugs = bestData.map(e => e.slug).sort();
  const newBestSlugs = bestContent.map(e => e.slug).sort();
  assertSlugsMatch(oldBestSlugs, newBestSlugs, 'best');

  const oldCompareSlugs = compareData.map(e => e.slug).sort();
  const newCompareSlugs = comparisonContent.map(e => e.slug).sort();
  assertSlugsMatch(oldCompareSlugs, newCompareSlugs, 'compare');

  // 2. Content preservation
  for (const oldReview of reviewEntries) {
    const newReview = reviewContent.find(r => r.slug === oldReview.slug);
    assert(newReview, `Review ${oldReview.slug} not found in new data`);
    assert(newReview.title === oldReview.productName, `Title mismatch for ${oldReview.slug}`);
    assert(newReview.faqs.length === oldReview.faqs.length, `FAQ count mismatch for ${oldReview.slug}`);
    assert(newReview.pros.length === oldReview.pros.length, `Pros count mismatch for ${oldReview.slug}`);
  }

  console.log('✅ Migration validation passed');
}
```

---

## Phase 5: Implementation Checklist

### Step 1: Add Unified Schema

| Status | Task | Owner | Dependency | Validation |
|---|---|---|---|---|
| [ ] | Create `src/data/content/schema.ts` with `ToolStepContent` interface | Backend | None | `npx tsc --noEmit` passes |
| [ ] | Create `src/data/content/types.ts` with shared sub-interfaces | Backend | None | `npx tsc --noEmit` passes |
| [ ] | Create `src/data/content/validate.ts` with Zod schemas | Backend | 1.1, 1.2 | `npx tsc --noEmit` passes |
| [ ] | Create `src/data/content/index.ts` with query API stubs | Backend | 1.1, 1.2 | `npx tsc --noEmit` passes |
| [ ] | Create empty `src/data/content/reviews.ts` | Backend | 1.1 | File exists |
| [ ] | Create empty `src/data/content/comparisons.ts` | Backend | 1.1 | File exists |
| [ ] | Create empty `src/data/content/best.ts` | Backend | 1.1 | File exists |
| [ ] | Create empty `src/data/content/alternatives.ts` | Backend | 1.1 | File exists |
| [ ] | Create empty `src/data/content/guides.ts` | Backend | 1.1 | File exists |
| [ ] | Verify build still succeeds | Backend | All above | `npm run build` — 0 errors |

### Step 2: Add Adapter Layer

| Status | Task | Owner | Dependency | Validation |
|---|---|---|---|---|
| [ ] | Create `src/data/content/adapters/review-adapter.ts` | Backend | Step 1 complete | Adapter function compiles |
| [ ] | Create `src/data/content/adapters/best-adapter.ts` | Backend | Step 1 complete | Adapter function compiles |
| [ ] | Create `src/data/content/adapters/compare-adapter.ts` | Backend | Step 1 complete | Adapter function compiles |
| [ ] | Create `src/data/content/adapters/alternative-adapter.ts` | Backend | Step 1 complete | Adapter function compiles |
| [ ] | Implement `getContentBySlug()` in `content/index.ts` | Backend | 2.1-2.4 | Function returns correct data |
| [ ] | Implement `getContentByType()` in `content/index.ts` | Backend | 2.1-2.4 | Function returns correct data |
| [ ] | Implement `getContentByCluster()` in `content/index.ts` | Backend | 2.1-2.4 | Function returns correct data |
| [ ] | Verify build still succeeds | Backend | All above | `npm run build` — 0 errors |
| [ ] | Verify old pages still render from old data | QA | All above | 10 random pages render correctly |

### Step 3: Migrate Review Data

| Status | Task | Owner | Dependency | Validation |
|---|---|---|---|---|
| [ ] | Import 35 reviews and run adapter in `content/reviews.ts` | Backend | Step 2 complete | 35 records produced |
| [ ] | Add `primaryKeyword` to all 35 reviews | SEO | 3.1 | All records have primaryKeyword |
| [ ] | Add `secondaryKeywords` to all 35 reviews | SEO | 3.1 | All records have 3+ secondary keywords |
| [ ] | Add `keywordCluster` to all 35 reviews | SEO | 3.1 | All records have cluster |
| [ ] | Add `priorityScore` from FIRST_100_REVIEW_QUEUE.md | SEO | 3.1 | All records have 0-100 score |
| [ ] | Add `difficulty` from KEYWORD_EXPANSION_MATRIX.md | SEO | 3.1 | All records have 0-100 score |
| [ ] | Add `affiliate` / `estimatedValue` / `commissionRate` | Backend | 3.1 | All records have affiliate fields |
| [ ] | Run Zod validation on all 35 records | Backend | 3.2-3.7 | All 35 pass validation |
| [ ] | Verify slug arrays match (old vs new) | QA | 3.8 | 0 slug mismatches |
| [ ] | Verify build still succeeds | Backend | 3.8 | `npm run build` — 0 errors |
| [ ] | Verify old pages still render from old data | QA | 3.10 | 10 random review pages render |

### Step 4: Migrate Best List Data

| Status | Task | Owner | Dependency | Validation |
|---|---|---|---|---|
| [ ] | Import 100 best lists and run adapter in `content/best.ts` | Backend | Step 3 complete | 100 records produced |
| [ ] | Add SEO fields (keywords, cluster, priorityScore, etc.) | SEO | 4.1 | All records have SEO fields |
| [ ] | Add commercial fields (affiliate, estimatedValue) | Backend | 4.1 | All records have commercial fields |
| [ ] | Run Zod validation on all 100 records | Backend | 4.2-4.3 | All 100 pass validation |
| [ ] | Verify slug arrays match (old vs new) | QA | 4.4 | 0 slug mismatches |
| [ ] | Verify build still succeeds | Backend | 4.4 | `npm run build` — 0 errors |

### Step 5: Migrate Comparison + Alternatives Data

| Status | Task | Owner | Dependency | Validation |
|---|---|---|---|---|
| [ ] | Import 50 comparisons and run adapter in `content/comparisons.ts` | Backend | Step 4 complete | 50 records produced |
| [ ] | Add SEO + commercial fields to comparisons | SEO/Backend | 5.1 | All records have fields |
| [ ] | Run Zod validation on all 50 comparison records | Backend | 5.2 | All 50 pass validation |
| [ ] | Import alternatives and run adapter in `content/alternatives.ts` | Backend | 5.3 | All records produced |
| [ ] | Add SEO + commercial fields to alternatives | SEO/Backend | 5.4 | All records have fields |
| [ ] | Run Zod validation on all alternative records | Backend | 5.5 | All pass validation |
| [ ] | Verify slug arrays match for both types | QA | 5.6 | 0 slug mismatches |
| [ ] | Verify build still succeeds | Backend | 5.6 | `npm run build` — 0 errors |

### Step 6: Switch Page Entry Points

| Status | Task | Owner | Dependency | Validation |
|---|---|---|---|---|
| [ ] | **6A. Switch Reviews** | | | |
| [ ] | Update `src/pages/reviews/[slug].astro` to import from `content/` | Frontend | Step 3 complete | Page renders |
| [ ] | Update `src/templates/ProductReviewTemplate.astro` field access | Frontend | 6.1 | Template compiles |
| [ ] | Build + test 10 random review pages | QA | 6.2 | All 10 render correctly |
| [ ] | Compare HTML output (old vs new) for 5 review pages | QA | 6.3 | Content identical |
| [ ] | **6B. Switch Best Lists** | | | |
| [ ] | Update `src/pages/best/[slug].astro` to import from `content/` | Frontend | Step 4 complete | Page renders |
| [ ] | Update `src/pages/best/index.astro` to import from `content/` | Frontend | 6.5 | Page renders |
| [ ] | Build + test 10 random best pages | QA | 6.6 | All 10 render correctly |
| [ ] | **6C. Switch Comparisons** | | | |
| [ ] | Update `src/pages/compare/[slug].astro` to import from `content/` | Frontend | Step 5 complete | Page renders |
| [ ] | Update `src/pages/compare/index.astro` to import from `content/` | Frontend | 6.8 | Page renders |
| [ ] | Update `src/components/RelatedLinks.astro` to import from `content/` | Frontend | 6.9 | Component renders |
| [ ] | Build + test 10 random comparison pages | QA | 6.10 | All 10 render correctly |
| [ ] | **6D. Switch Alternatives** | | | |
| [ ] | Update `src/pages/alternatives/[slug].astro` to import from `content/` | Frontend | Step 5 complete | Page renders |
| [ ] | Update `src/pages/alternatives/index.astro` to import from `content/` | Frontend | 6.12 | Page renders |
| [ ] | Build + test alternative pages | QA | 6.13 | All render correctly |
| [ ] | **6E. Switch RSS** | | | |
| [ ] | Update `src/pages/rss.xml.js` to import from `content/` | Frontend | 6.1-6.13 | RSS generates correctly |
| [ ] | **6F. Full Validation** | | | |
| [ ] | Full build succeeds | Backend | All 6A-6E | `npm run build` — 0 errors |
| [ ] | TypeScript passes | Backend | All 6A-6E | `npx tsc --noEmit` — 0 errors |
| [ ] | Sitemap matches pre-migration | QA | 6.15 | 0 URL differences |
| [ ] | HTML diff for 30 random pages (10 per type) | QA | 6.15 | Content identical |
| [ ] | Schema.org validation for 10 pages | QA | 6.15 | All schemas valid |
| [ ] | Internal link check (all links resolve) | QA | 6.15 | 0 broken links |

### Step 7: Delete Legacy Files

| Status | Task | Owner | Dependency | Validation |
|---|---|---|---|---|
| [ ] | Delete `src/data/comparisons.ts` (dead code) | Backend | Step 6 complete | Build still succeeds |
| [ ] | Delete `src/data/categories.ts` (dead code) | Backend | Step 6 complete | Build still succeeds |
| [ ] | Delete `src/data/products-extracted.ts` | Backend | Step 6 complete | Build still succeeds |
| [ ] | Remove `productReviews` array from `products.ts` | Backend | Step 6.3 complete | Build still succeeds |
| [ ] | Remove `extractedProducts` / `catalogProducts` from `products.ts` | Backend | 7.3 | Build still succeeds |
| [ ] | Delete `src/data/reviewEntries.ts` | Backend | Step 6.3 complete | Build still succeeds |
| [ ] | Delete `src/data/reviews/group1-5.ts` | Backend | 7.6 | Build still succeeds |
| [ ] | Delete or alias old `best.ts` | Backend | Step 6.6 complete | Build still succeeds |
| [ ] | Delete or alias old `compare.ts` | Backend | Step 6.10 complete | Build still succeeds |
| [ ] | Delete or alias old `alternatives.ts` | Backend | Step 6.13 complete | Build still succeeds |
| [ ] | Final full build | Backend | All above | `npm run build` — 0 errors |
| [ ] | Final type check | Backend | All above | `npx tsc --noEmit` — 0 errors |
| [ ] | Final smoke test (30 pages) | QA | All above | All pages render correctly |

---

## 6. Rollback Plan

### 6.1 Rollback Triggers

| Trigger | Action | Rollback Step |
|---|---|---|
| Build fails after any step | Revert to last successful commit | Git revert |
| Page rendering breaks in Step 6 | Revert page import to old data source | Git revert specific file |
| SEO ranking drop detected (post-launch) | Revert all page imports to old sources | Git revert Step 6 commit |
| Data loss detected | Restore old data files from git | Git restore |

### 6.2 Rollback Strategy

**Git-based rollback:**
- Each step is a separate commit
- Step 6 is broken into sub-commits (6A, 6B, 6C, 6D) for granular rollback
- Rollback = `git revert <commit-hash>`
- Old data files remain until Step 7, so rollback is instant

**Rollback time targets:**
| Scenario | Rollback Time |
|---|---|
| Single page import revert | < 5 minutes |
| Full Step 6 revert | < 15 minutes |
| Full migration revert | < 30 minutes |

---

## 7. Summary

### 7.1 Migration Scope

| Metric | Value |
|---|---|
| Total pages affected | 185 (35 reviews + 100 best + 50 compare) |
| Total files to create | ~15 new files |
| Total files to modify | ~12 existing files |
| Total files to delete | ~10 legacy files |
| Migration steps | 7 |
| Risk level | Medium (mitigated by additive-first approach) |

### 7.2 Key Safety Guarantees

| Guarantee | How |
|---|---|
| URLs never change | Slugs preserved in adapter mapping |
| SEO never drops | All meta fields, content, and links preserved |
| No downtime | Old data coexists until Step 7 |
| Rollback possible | Git commits per step, old files retained until Step 7 |
| Zero production impact during Steps 1-5 | Additive only — no existing code touched |

### 7.3 Critical Path

```
Step 1 (Schema) → Step 2 (Adapters) → Step 3 (Review Data) → Step 6A (Switch Reviews)
                                         → Step 4 (Best Data) → Step 6B (Switch Best)
                                         → Step 5 (Compare Data) → Step 6C (Switch Compare)
                                                                   → Step 6D (Switch Alt)
                                                                   → Step 6E (Switch RSS)
                                                                   → Step 6F (Full Validation)
                                                                   → Step 7 (Cleanup)
```

**Steps 3, 4, 5 can run in parallel** (data migration is independent). **Step 6 must be sequential** (switch one pipeline at a time).

---

*End of Unified Schema Migration Execution Plan. Refer to CONTENT_SCHEMA_IMPLEMENTATION_BLUEPRINT.md for the schema design and CONTENT_SCHEMA_EVOLUTION_PLAN.md for the evolution rationale.*
