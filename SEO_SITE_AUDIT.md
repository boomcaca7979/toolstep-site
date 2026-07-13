# ToolStep SEO Site Audit Report

**Audit Date:** 2026-07-09
**Site:** https://www.toolstep.top
**Framework:** Astro (SSG)
**Audit Scope:** Full-site scan of all pages, data files, components, schemas, affiliate links, internal links, and SEO metadata.

---

## 1. Executive Summary

| Metric | Value |
|---|---|
| Total Page Templates | 101 review pages + 6 dynamic route families + 10 static pages |
| Total Generated URLs (estimated) | ~250+ |
| Page Types | Single Review, Best-Of, Compare, Alternatives, Tools, Stories, Authors, Blog, Static |
| Amazon Affiliate Density | 53% of review pages (54 of 101) |
| Thin Content Pages | 19-24 simple best-of pages (~100-200 words each) |
| Duplicate/Near-Duplicate Pages | 4 pairs identified |
| Pages Missing Required JSON-LD | 7 comparison pages + 24 simple best-of pages |
| Fake AggregateRating Found | 0 (clean — none emitted anywhere) |
| Editorial Authority Pages | 3 exist (`/how-we-test`, `/editorial-policy`, `/affiliate-disclosure`) |
| Internal Link Graph Density | Low on thin pages (0 links), high on developed pages (5-51 links) |

---

## 2. Page Count by Type

### 2.1 Hand-Authored Pages in `/src/pages/reviews/`

| Page Type | Filename Pattern | Count | Status |
|---|---|---|---|
| Single Product Reviews | `{product-name}-review.astro` | 35 | Well-developed (~2500-3500 words) |
| Developed Best-Of (Review Template) | `best-{category}.astro` | 9 | Full template (~2500-5000 words) |
| Thin Best-Of (Minimal) | `best-{category}.astro` | 19 | **THIN CONTENT** (~100-200 words) |
| SaaS Best-Of | `best-{category}.astro` | 5 | Mixed (1 developed, 4 thin) |
| Comparison Pages | `{a}-vs-{b}.astro` | 31 | Moderately developed (~2000-4000 words) |
| Miscategorized Guide | `obs-studio-complete-guide.astro` | 1 | Tutorial, not a review |
| Index Page | `index.astro` | 1 | Listing page |
| **Total** | | **101** | |

### 2.2 Dynamic Routes (SSG via `getStaticPaths`)

| Route | Data Source | Entry Count | Template |
|---|---|---|---|
| `/best/[slug]` | `src/data/best.ts` | 100 | `best/[slug].astro` |
| `/compare/[slug]` | `src/data/compare.ts` | 50 | `compare/[slug].astro` |
| `/alternatives/[slug]` | `src/data/alternatives.ts` | ~35 | `alternatives/[slug].astro` |
| `/tools/[id]` | `src/data/tools.ts` | 10 | `tools/[id].astro` |
| `/authors/[slug]` | `src/data/authors.ts` | 3 | `authors/[slug].astro` |
| `/stories/[slug]` | `src/data/stories.ts` | ~35 | `stories/[slug].astro` |
| `/blog/[...slug]` | `src/content/blog/` | 5 | `blog/[...slug].astro` |

### 2.3 Static Pages

| Page | Path | Status |
|---|---|---|
| Homepage | `/src/pages/index.astro` | Has ItemList schema |
| About | `/src/pages/about.astro` | Exists |
| Contact | `/src/pages/contact.astro` | Exists |
| Team | `/src/pages/team.astro` | Exists |
| Guides | `/src/pages/guides.astro` | Exists |
| How We Test | `/src/pages/how-we-test.astro` | **Substantial content** (testing protocols, scoring, 12-step process) |
| Editorial Policy | `/src/pages/editorial-policy.astro` | **Substantial content** (9 sections) |
| Affiliate Disclosure | `/src/pages/affiliate-disclosure.astro` | **Substantial content** (Amazon, Best Buy, Walmart disclosure) |
| Privacy | `/src/pages/privacy.astro` | Exists |
| RSS | `/src/pages/rss.xml.js` | Exists |

---

## 3. Duplicate Content Analysis

### 3.1 Duplicate/Near-Duplicate Best-Of Page Pairs (Keyword Cannibalization)

| Pair | URL A | URL B | Issue |
|---|---|---|---|
| 1 | `best-noise-canceling-headphones-work.astro` | `best-noise-cancelling-headphones-work.astro` | Single vs double-L spelling ("canceling" vs "cancelling") |
| 2 | `best-usb-c-hub-macbook.astro` | `best-usbc-dock-macbook.astro` | "hub" vs "dock" — same search intent |
| 3 | `best-webcam-remote-work.astro` | `best-webcam-work-from-home.astro` | "remote work" vs "work from home" — same intent |
| 4 | `best-wireless-mouse-productivity.astro` | `best-wireless-mouse-work.astro` | "productivity" vs "work" — same intent |

**Impact:** Each pair cannibalizes the other's rankings. Google may index only one or demote both.

**Recommendation:** 301 redirect the weaker variant to the stronger one, or merge content into a single canonical page.

### 3.2 Content Overlap Between `/reviews/` and `/best/`

- `/reviews/best-*` pages overlap with `/best/[slug]` dynamic pages.
- Example: `/reviews/best-ergonomic-chair-under-500` (hand-authored) vs `/best/ergonomic-chair-under-500` (data-driven).
- Both may target the same keyword, causing internal competition.

### 3.3 Duplicate Article JSON-LD Schema

- 23 of 35 single product reviews emit the `Article` schema **twice**: once via `articleSchema` prop to `BaseHead`, and once as an inline `<script type="application/ld+json">`.
- `best/[slug].astro`, `compare/[slug].astro`, and `alternatives/[slug].astro` all duplicate Article schema the same way.
- **Impact:** Confuses Google's parser; may trigger schema validation warnings.

---

## 4. Thin Content Analysis

### 4.1 Thin Best-Of Pages (19 pages, ~100-200 words each)

These pages contain only:
- 1 H1
- 1 intro paragraph
- 1 product box with Amazon CTA
- 0-2 short H3 sections ("Why it wins", "Who should buy it")
- Inline affiliate disclosure

**Missing on all thin pages:**
- Table of Contents
- Quick Verdict
- Pros/Cons grid
- FAQ section
- Comparison table
- Related links
- ReviewMeta (author, testing duration)
- StickyCTA
- JSON-LD (no Review, Product, Offer, FAQPage, BreadcrumbList — only basic Article via BaseHead)

| # | File | Word Count | Internal Links |
|---|---|---|---|
| 1 | `best-air-purifier-small.astro` | ~150 | 0 |
| 2 | `best-blue-light-glasses.astro` | ~150 | 0 |
| 3 | `best-cable-management-desk.astro` | ~150 | 0 |
| 4 | `best-desk-lamp-eye-care.astro` | ~150 | 0 |
| 5 | `best-desk-pad-large.astro` | ~150 | 0 |
| 6 | `best-external-ssd-backup.astro` | ~150 | 0 |
| 7 | `best-foot-rest-desk.astro` | ~150 | 0 |
| 8 | `best-laptop-stand-desk.astro` | ~150 | 0 |
| 9 | `best-mechanical-keyboard-work.astro` | ~150 | 0 |
| 10 | `best-monitor-riser-desk.astro` | ~150 | 0 |
| 11 | `best-noise-canceling-headphones-work.astro` | ~150 | 0 |
| 12 | `best-phone-stand-desk.astro` | ~150 | 0 |
| 13 | `best-portable-monitor-work.astro` | ~150 | 0 |
| 14 | `best-standing-desk-converter.astro` | ~150 | 0 |
| 15 | `best-usb-c-hub-macbook.astro` | ~150 | 0 |
| 16 | `best-webcam-work-from-home.astro` | ~150 | 0 |
| 17 | `best-wireless-charging-station-desk.astro` | ~150 | 0 |
| 18 | `best-wireless-mouse-work.astro` | ~150 | 0 |
| 19 | `best-password-managers-2026.astro` | ~200 | 0 |

### 4.2 Thin SaaS Best-Of Pages

| File | Word Count | JSON-LD | Internal Links |
|---|---|---|---|
| `best-cloud-storage-2026.astro` | ~300 | None | 0 |
| `best-password-managers-2026.astro` | ~200 | None | 0 |
| `best-screen-recorders-mac.astro` | ~200 | None | 0 |
| `best-video-editors-beginners.astro` | ~200 | None | 0 |

### 4.3 Miscategorized Page

- `obs-studio-complete-guide.astro` — A tutorial guide placed in `/reviews/`. Not a review, best-of, or comparison. Should be relocated to `/guides/` or `/blog/`.

---

## 5. Amazon Affiliate Link Density

### 5.1 Overall Density

| Page Type | Total Files | Files with Amazon Affiliate (`tag=toolwise20-20`) | Density |
|---|---|---|---|
| Single Product Reviews | 35 | 27 | 77% |
| Developed Best-Of | 9 | 9 | 100% |
| Thin Best-Of (Hardware) | 19 | 19 | 100% |
| SaaS Best-Of | 5 | 0 | 0% |
| Comparison Pages | 31 | 0 | 0% |
| **Overall** | **101** | **54** | **53%** |

### 5.2 Affiliate Link Architecture

- **Centralized config:** `src/config/affiliate.ts`
- **Amazon Associate Tag:** `toolwise20-20`
- **URL format:** `https://www.amazon.com/s?k={keywords}&tag=toolwise20-20` (search-based, not direct product links)
- **Link attributes:** `rel="noopener sponsored"` (some pages use `rel="noopener sponsored nofollow"`)
- **Fallback:** `getAffiliateLinks(slug)` auto-generates Amazon search URL from slug if no explicit config exists
- **Also configured:** Best Buy, Walmart, Official site links (multi-retailer support via `ProductCTACard`)

### 5.3 Amazon CTA Placement Analysis

**Current placement (problematic):**
- Single product reviews: Amazon CTA appears in a "product box" H2 section **within the main content flow** (typically after Buying Advice / FAQ sections, but the `StickyCTA` component shows it persistently in sidebar/floating position)
- Developed best-of: Same as single reviews
- Thin best-of: Amazon CTA is the **primary and almost only content** on the page

**Issue:** On thin pages, Amazon links dominate the page content, signaling "affiliate-first" rather than "editorial-first" to Google's Quality Raters and Helpful Content algorithm.

### 5.4 Hardware Reviews Missing Affiliate Tag (3 pages)

| File | Issue |
|---|---|
| `autonomous-smartdesk-2-review.astro` | Has `amazon.com` text but no `tag=toolwise20-20` parameter |
| `satechi-thunderbolt-4-dock-review.astro` | Has `amazon.com` text but no `tag=toolwise20-20` parameter |
| `secretlab-titan-evo-2022-review.astro` | Has `amazon.com` text but no `tag=toolwise20-20` parameter |

---

## 6. Review Signal Completeness

### 6.1 Single Product Reviews (35 pages) — Signal Audit

| Review Signal | Present | Missing | Coverage |
|---|---|---|---|
| Quick Verdict | 35 | 0 | 100% |
| Pros & Cons (ProductSummary) | 35 | 0 | 100% |
| Who Should Buy | 35 | 0 | 100% |
| Detailed Review body | 35 | 0 | 100% |
| Comparison table | 35 | 0 | 100% |
| Buying Advice | 34 | 1 (typo "Using Advice" in obsidian) | 97% |
| FAQ section | 35 | 0 | 100% |
| ReviewMeta (author + testing duration) | 35 | 0 | 100% |
| RelatedLinks component | 0 | 35 | 0% (component exists but unused) |
| Testing Summary section | 0 | 35 | 0% |
| Performance section | 1 | 34 | 3% (only keychron-k8) |
| Build Quality section | 0 | 35 | 0% |
| Ease of Use section | 0 | 35 | 0% |
| Value section | 0 | 35 | 0% |
| Who Should Avoid section | 1 | 34 | 3% (only keychron-k8) |
| Alternatives section | 1 | 34 | 3% (only keychron-k8) |
| Final Verdict H2 | 1 | 34 | 3% (only keychron-k8) |
| Review JSON-LD | 35 | 0 | 100% |
| Product JSON-LD (nested in Review) | 35 | 0 | 100% |
| Offer JSON-LD (nested in Product) | 35 | 0 | 100% |
| FAQPage JSON-LD | 35 | 0 | 100% |
| BreadcrumbList JSON-LD | 35 | 0 | 100% |
| Article JSON-LD | 35 | 0 | 100% (but 23 have duplicate) |
| AggregateRating JSON-LD | 0 | 35 | 0% (correct — no fake ratings) |

### 6.2 Developed Best-Of Pages (9 pages) — Signal Audit

Same signal profile as single product reviews (they use the same template).

### 6.3 Thin Best-Of Pages (19 pages) — Signal Audit

| Review Signal | Present | Coverage |
|---|---|---|
| Quick Verdict | 0 | 0% |
| Pros & Cons | 0 | 0% |
| Who Should Buy | ~5 | 26% (short H3) |
| FAQ | 0 | 0% |
| ReviewMeta | 0 | 0% |
| Any JSON-LD beyond Article | 0 | 0% |
| Internal Links | 0 | 0% |
| Word count > 2500 | 0 | 0% |

### 6.4 Comparison Pages (31 pages) — Signal Audit

| Review Signal | Present | Missing | Coverage |
|---|---|---|---|
| Quick Comparison table | 31 | 0 | 100% |
| Feature-by-Feature analysis | 31 | 0 | 100% |
| Pricing Comparison | 31 | 0 | 100% |
| Pros and Cons (per product) | 31 | 0 | 100% |
| Who Should Use Which | 31 | 0 | 100% |
| Final Verdict | 31 | 0 | 100% |
| FAQ section | 31 | 0 | 100% |
| BreadcrumbList JSON-LD | 24 | 7 | 77% |
| FAQPage JSON-LD | 24 | 7 | 77% |
| Review JSON-LD | 0 | 31 | 0% |
| RelatedLinks / nav-links | 0 | 31 | 0% |

### 6.5 Comparison Pages Missing JSON-LD (7 pages)

1. `canva-vs-figma.astro`
2. `claude-vs-chatgpt.astro`
3. `deepl-vs-google-translate.astro`
4. `midjourney-vs-dalle3.astro`
5. `notion-ai-vs-grammarly.astro`
6. `smallpdf-vs-ilovepdf.astro`
7. `tinypng-vs-squoosh.astro`

---

## 7. Compare Coverage Analysis

### 7.1 Hand-Authored Comparison Pages in `/reviews/`

31 comparison pages exist in `/src/pages/reviews/` covering SaaS/software tools:
- AI Tools: claude-vs-chatgpt, claude-vs-gemini, chatgpt-vs-copilot, chatgpt-vs-gemini, midjourney-vs-dalle3, midjourney-vs-stable-diffusion, perplexity-vs-chatgpt, jasper-vs-copyai, runway-vs-pika, claude-code-vs-cursor, cursor-vs-windsurf, github-copilot-vs-cursor
- Design: canva-vs-figma, canva-vs-adobe-express, figma-vs-sketch, squarespace-vs-wix, wordpress-vs-webflow
- Productivity: notion-vs-confluence, notion-vs-obsidian, slack-vs-teams, todoist-vs-ticktick, monday-vs-asana, linear-vs-jira
- Writing: grammarly-vs-prowritingaid, notion-ai-vs-grammarly
- Utilities: deepl-vs-google-translate, smallpdf-vs-ilovepdf, tinypng-vs-squoosh, expressvpn-vs-nordvpn, zoom-vs-google-meet
- Storage: google-drive-vs-dropbox-vs-onedrive

### 7.2 Data-Driven Comparison Pages in `/compare/`

50 comparison entries in `src/data/compare.ts` rendered via `/compare/[slug].astro`.

### 7.3 Coverage Gaps

**Hardware comparisons missing:** The 35 single product reviews cover hardware (desks, chairs, keyboards, mice, monitors, webcams, headphones, docks, SSDs), but there are **zero hardware comparison pages** (e.g., "herman-miller-aeron-vs-steelcase-gesture", "uplift-v2-vs-flexispot-e7", "sony-wh-1000xm5-vs-sennheiser-momentum-4").

**Cross-type comparisons missing:** No "product vs alternative" comparisons bridging the `/reviews/` and `/alternatives/` ecosystems.

### 7.4 Auto-Generation Opportunity

Per Phase 5 requirements, if single reviews for products A and B both exist, a comparison page "A vs B" should be auto-generated. Current candidates:
- herman-miller-aeron vs steelcase-gesture
- herman-miller-aeron vs steelcase-leap-v2
- steelcase-gesture vs steelcase-leap-v2
- uplift-v2 vs flexispot-e7
- sony-wh-1000xm5 vs sennheiser-momentum-4
- logitech-mx-master-3s vs razer-deathadder-v3-pro
- keychron-k8 vs keychron-q1
- caldigit-ts4 vs satechi-thunderbolt-4-dock
- caldigit-ts4 vs plugable-usb-c-triple
- samsung-t7-shield vs anker-prime-20000

---

## 8. Internal Link Graph Analysis

### 8.1 Current Link Topology

```
Homepage
  ├── /reviews/ (index → individual reviews)
  ├── /best/ (index → [slug] pages)
  ├── /compare/ (index → [slug] pages)
  ├── /alternatives/ (index → [slug] pages)
  ├── /tools/ (index → [id] pages)
  ├── /stories/ (index → [slug] pages)
  ├── /authors/ (index → [slug] pages)
  ├── /blog/ (index → [...slug] pages)
  └── Static pages (about, contact, how-we-test, etc.)
```

### 8.2 Cross-Type Linking (Current State)

| From → To | Linking Pattern | Status |
|---|---|---|
| Review → Best | Via `RelatedLinks` component (unused) | **Broken** (component exists but not imported) |
| Review → Compare | Via `RelatedLinks` component (unused) | **Broken** |
| Review → Alternatives | Via `RelatedLinks` component (unused) | **Broken** |
| Best → Review | Via `relatedReviews` data field | **Working** (in `/best/[slug]`) |
| Best → Best | Via `relatedBests` data field | **Working** (in `/best/[slug]`) |
| Compare → Review | Via `relatedReviews` data field | **Working** (in `/compare/[slug]`) |
| Alternatives → Alternatives | Via `internalLinks` data field | **Working** (in `/alternatives/[slug]`) |
| Tools → Tools | Via same-category matching | **Working** (in `/tools/[id]`) |
| Review → How We Test | Not implemented | **Missing** |
| All pages → Editorial Policy | Footer link | **Working** |
| All pages → Affiliate Disclosure | Footer link | **Working** |

### 8.3 Internal Link Density by Page Type

| Page Type | Avg Internal Links | Min | Max |
|---|---|---|---|
| Single Product Reviews | 6.8 | 2 | 51 (outlier: logitech-mx-keys-s) |
| Developed Best-Of | 15.4 | 5 | 49 |
| Thin Best-Of | 0.5 | 0 | 1 |
| Comparison Pages | 6.2 | 0 | 34 |
| `/best/[slug]` (dynamic) | ~3 | 2 | 5 |
| `/compare/[slug]` (dynamic) | ~3 | 2 | 5 |

### 8.4 Required Link Cycle (Per Phase 7)

Target topology:
```
Best → Review → Compare → Review → Best (cycle)
```

**Current state:** The cycle is **broken** because:
1. Individual review pages (`/reviews/*.astro`) do not link to `/best/` or `/compare/` pages (RelatedLinks component is unused)
2. `/best/[slug]` links to related reviews but those reviews don't link back
3. `/compare/[slug]` links to related reviews but those reviews don't link back
4. No review page links to `/compare/` pages for its product

### 8.5 Orphaned Pages

- 19 thin best-of pages have **0 internal links** (both inbound and outbound)
- 4 SaaS best-of pages have **0 internal links**
- `obs-studio-complete-guide.astro` is orphaned (miscategorized)

---

## 9. JSON-LD Schema Audit

### 9.1 Schema Types Currently Emitted

| Schema Type | Where | Count | Status |
|---|---|---|---|
| Organization | BaseHead (all pages) | All | Valid |
| WebSite (with SearchAction) | BaseHead (all pages) | All | Valid |
| Article | BaseHead + inline (duplicated) | Most pages | **Duplicated on 23+ pages** |
| SoftwareApplication | tools/[id] via BaseHead | 10 | Valid |
| Review (with Product itemReviewed) | compare/[slug] only | 50 | Valid |
| Review (with SoftwareApplication itemReviewed) | alternatives/[slug] only | ~35 | Valid |
| Review (with Product + Offer + Brand) | Single product reviews (inline) | 35 | Valid |
| Product | Nested in Review only | 35+50 | Valid (nested) |
| Offer | Nested in Product only | 35+50 | Valid (nested) |
| FAQPage | best/compare/alternatives [slug] + single reviews | ~120 | Valid |
| BreadcrumbList | PageLayout + inline on [slug] pages + single reviews | ~120 | Valid |
| ItemList | Homepage + best/[slug] + alternatives/[slug] | ~135 | Valid |
| AggregateRating | **None** | 0 | **Clean** (no fake ratings) |

### 9.2 Schema Gaps

| Required Schema | Missing On | Action Needed |
|---|---|---|
| BreadcrumbList | 7 comparison pages in /reviews/ | Add inline schema |
| FAQPage | 7 comparison pages in /reviews/ | Add inline schema |
| Review | 31 comparison pages in /reviews/ | Add Review schema (itemReviewed = SoftwareApplication) |
| Article (deduplicated) | 23+ pages with duplicate Article | Remove duplicate inline schema |
| BreadcrumbList | 19 thin best-of pages | Add schema |
| FAQPage | 19 thin best-of pages | Add schema (requires FAQ content first) |
| WebPage | All pages | Consider adding for better content type signaling |

### 9.3 Schema Validation Issues

1. **Duplicate Article schema** on 23 single reviews + all [slug] dynamic pages
2. **`og:type` hardcoded to `website`** in BaseHead — should be `article` on article/review pages
3. **Publisher name inconsistency**: "Toolwise" in some JSON-LD vs "ToolStep" in Organization schema
4. **Hardcoded `publishDate = '2026-06-26'`** on all [slug] dynamic pages — not sourced from data
5. **`pageTitle`/`pageDescription` computed but unused** on how-we-test, editorial-policy, affiliate-disclosure pages

---

## 10. SEO Metadata Audit

### 10.1 Title Tag Patterns

| Page Type | Title Pattern | Helper Function | Consistency |
|---|---|---|---|
| Single Product Reviews | `"{Name} Review (2026): Real Testing, Pros, Cons & Verdict"` | `buildReviewTitle()` | Good (33/35) |
| Developed Best-Of | `"Best {Category} (2026): Ranked, Tested & Compared"` | `buildBestTitle()` | Good |
| Thin Best-Of | Plain strings | None | **Inconsistent** |
| Comparison Pages | Plain strings or template literals | None | **Inconsistent** |
| [slug] dynamic pages | From data `entry.title` | None | Good |
| Static pages | Plain strings | None | Good |

**Inconsistencies:**
- `uplift-v2-review.astro` uses plain string title, not `buildReviewTitle()`
- `logitech-mx-keys-s-review.astro` uses plain string title
- Comparison pages have no standardized title builder

### 10.2 Meta Description Patterns

- Single product reviews: Hand-written, unique per page
- [slug] dynamic pages: Sourced from `entry.description` in data files
- Thin best-of: Often missing or generic
- Comparison pages: Hand-written but inconsistent format

### 10.3 OpenGraph / Twitter Card

- **OG tags present on all pages** via BaseHead
- **`og:type` hardcoded to `website`** — should be `article` on review/blog pages
- **Twitter card:** `summary_large_image` on all pages
- **OG image:** Uses `blog-placeholder-1.jpg` as fallback; individual pages may override

### 10.4 Canonical URLs

- **Present on all pages** via BaseHead: `const canonicalURL = new URL(Astro.url.pathname, Astro.site)`
- **Site URL:** `https://www.toolstep.top` (defined in `astro.config.mjs`)
- **No canonical conflicts detected** — each page has a unique path

### 10.5 Sitemap

- `@astrojs/sitemap` integration enabled
- Auto-generates `/sitemap-index.xml`
- Referenced in BaseHead via `<link rel="sitemap">`

### 10.6 Robots.txt

- Present at `/public/robots.txt`
- Content not audited in this pass

---

## 11. Component & Infrastructure Audit

### 11.1 Key Components

| Component | Purpose | Used By | Issues |
|---|---|---|---|
| `BaseHead.astro` | Meta tags + site-wide schema | All pages | `og:type` hardcoded; duplicate Article support |
| `PageLayout.astro` | Static page layout + BreadcrumbList schema | Static pages | Unused `pageTitle`/`pageDescription` on some pages |
| `Header.astro` | Navigation | All pages | Links to `/stories` and `/guides` |
| `Footer.astro` | Footer links | All pages | Social links point to Astro (placeholder) |
| `ProductCTACard.astro` | Amazon/multi-retailer CTA | Single reviews + developed best-of | Button icons assigned by position, not retailer |
| `ProductSummary.astro` | Pros/Cons grid | Single reviews + developed best-of | None |
| `ReviewMeta.astro` | Author + testing duration display | Single reviews + developed best-of | Does not emit schema (visible only) |
| `RelatedLinks.astro` | Auto-discover related compare/alternatives | **UNUSED** | Component exists but not imported by any page |
| `StickyCTA.astro` | Floating CTA | Single reviews + developed best-of | None |
| `AffiliateDisclosure.astro` | Affiliate disclosure banner | Single reviews + developed best-of | None |
| `ToolCard.astro` | Tool card for listings | Homepage + tools index | None |

### 11.2 SEO Utilities (`src/utils/seo.ts`)

| Function | Purpose | Used By | Issues |
|---|---|---|---|
| `buildReviewTitle(name)` | Title builder for reviews | Single reviews | Hardcodes year 2026 |
| `buildBestTitle(category)` | Title builder for best-of | Developed best-of | Hardcodes year 2026 |
| `buildCompareTitle(a, b)` | Title builder for comparisons | **UNUSED** | Not imported by comparison pages |
| `buildAlternativesTitle(tool)` | Title builder for alternatives | **UNUSED** | Not imported |
| `buildReviewLinkCluster(opts)` | Internal link cluster for reviews | **UNUSED** | Not imported by review pages |
| `buildAudienceGuidance(opts)` | Passthrough helper | **UNUSED** | Not imported |

### 11.3 Data Architecture

- **No CMS** — all content is static TypeScript files
- **No content collections** for reviews/best/compare/alternatives (only `blog` uses Astro content collections)
- **Individual review pages** are hand-authored `.astro` files (not data-driven)
- **[slug] dynamic pages** are data-driven via `getStaticPaths`

---

## 12. Priority Issues Summary

### Critical (P0)
1. **19 thin best-of pages** with ~150 words each — major quality signal risk
2. **RelatedLinks component unused** — internal link graph is broken
3. **7 comparison pages missing JSON-LD** — no rich snippet eligibility
4. **4 duplicate best-of page pairs** — keyword cannibalization
5. **Review pages missing editorial sections** — no Testing Summary, Performance, Build Quality, Ease of Use, Value, Who Should Avoid, Alternatives, Final Verdict (only 1 of 35 has these)

### High (P1)
6. **Duplicate Article JSON-LD** on 23+ pages
7. **`og:type` hardcoded to `website`** on article pages
8. **Amazon CTA placement** — on thin pages, it's the primary content
9. **No hardware comparison pages** despite 35 hardware reviews
10. **`buildCompareTitle` and `buildReviewLinkCluster` utilities unused**
11. **Footer social links** point to Astro, not ToolStep

### Medium (P2)
12. **3 hardware reviews missing Amazon affiliate tag**
13. **Duplicated H2 headings bug** in 3 comparison pages
14. **`obs-studio-complete-guide.astro` miscategorized**
15. **`obsidian-review.astro` typo** ("Using Advice" → "Buying Advice")
16. **Inconsistent title formatting** on some pages
17. **Hardcoded `publishDate`** on [slug] dynamic pages

### Low (P3)
18. **Thin pages have 0 internal links**
19. **Comparison pages lack prev/next navigation**
20. **ProductCTACard icon assignment by position** (icon may mismatch retailer)

---

## 13. Phase 2-10 Readiness Assessment

| Phase | Requirement | Current State | Effort |
|---|---|---|---|
| Phase 2: Editorial Review Signal | Restructure page, Amazon CTA last | CTA in middle of content flow | Medium |
| Phase 3: Review Template | Add 12 new sections to 35 reviews | Only 1/35 has full sections | High |
| Phase 4: Best Pages | Add How We Tested, Methodology, etc. | 9/33 developed, 24 thin | High |
| Phase 5: Compare Pages | Auto-generate A vs B from reviews | No auto-generation exists | Medium |
| Phase 6: Authority Layer | How We Test + Editorial Policy | **Already exist** with substantial content | Low |
| Phase 7: Internal Link Graph | Best→Review→Compare→Review→Best cycle | Cycle broken (RelatedLinks unused) | Medium |
| Phase 8: Schema | Review/Product/Offer keep, AggregateRating delete, Breadcrumb/Org/WebSite/Article add | AggregateRating already absent; Breadcrumb/Article exist but duplicated | Medium |
| Phase 9: SEO Metadata | Unify Title/Desc/OG/Twitter/Canonical | Title helpers exist but inconsistently used | Medium |
| Phase 10: Final Output | Build + lint pass | Not yet attempted | Low |

---

**Audit Complete.** This report informs Phases 2-10 of the ToolStep Review Authority System upgrade.
