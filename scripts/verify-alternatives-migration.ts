// Verification script for Unified Content Migration Step 5B
// Checks: count, slug match, field completeness, SEO field coverage, whyChoose preservation.
//
// Run: npx tsx scripts/verify-alternatives-migration.ts

import { alternativesData } from '../src/data/alternatives';
import { alternativeContent, getAllAlternatives, getAlternativeBySlug, getAlternativesByCategory } from '../src/data/content/alternatives';

interface CheckResult {
  name: string;
  passed: boolean;
  detail: string;
}

const results: CheckResult[] = [];

function check(name: string, passed: boolean, detail: string) {
  results.push({ name, passed, detail });
}

// ------------------------------------------------------------
// 1. Count match
// ------------------------------------------------------------
const legacyCount = alternativesData.length;
const migratedCount = alternativeContent.length;
check(
  'Count: legacy == migrated',
  legacyCount === migratedCount,
  `legacy=${legacyCount}, migrated=${migratedCount}`
);

// ------------------------------------------------------------
// 2. Slug match (100%)
// ------------------------------------------------------------
const legacySlugs = new Set(alternativesData.map((e) => e.slug));
const migratedSlugs = new Set(alternativeContent.map((c) => c.slug));
const missingInMigrated = [...legacySlugs].filter((s) => !migratedSlugs.has(s));
const extraInMigrated = [...migratedSlugs].filter((s) => !legacySlugs.has(s));
check(
  'Slug: 100% match',
  missingInMigrated.length === 0 && extraInMigrated.length === 0,
  `missing=${missingInMigrated.length}, extra=${extraInMigrated.length}`
);

// ------------------------------------------------------------
// 3. Field completeness (per entry, paired by slug)
// ------------------------------------------------------------
let fieldIssues = 0;
const fieldIssueList: string[] = [];

for (const legacy of alternativesData) {
  const migrated = alternativeContent.find((c) => c.slug === legacy.slug);
  if (!migrated) {
    fieldIssues++;
    fieldIssueList.push(`${legacy.slug}: not found in migrated`);
    continue;
  }

  // slug
  if (migrated.slug !== legacy.slug) {
    fieldIssues++;
    fieldIssueList.push(`${legacy.slug}: slug mismatch`);
  }
  // title
  if (migrated.title !== legacy.title) {
    fieldIssues++;
    fieldIssueList.push(`${legacy.slug}: title mismatch`);
  }
  // anchorProduct (from toolName)
  if (!migrated.anchorProduct || migrated.anchorProduct.name !== legacy.toolName) {
    fieldIssues++;
    fieldIssueList.push(`${legacy.slug}: anchorProduct.name mismatch (expected "${legacy.toolName}")`);
  }
  // products (alternatives -> products)
  if (!Array.isArray(migrated.products) || migrated.products.length !== legacy.alternatives.length) {
    fieldIssues++;
    fieldIssueList.push(`${legacy.slug}: products length mismatch (expected ${legacy.alternatives.length})`);
  } else {
    for (let i = 0; i < legacy.alternatives.length; i++) {
      const lp = legacy.alternatives[i];
      const mp = migrated.products[i];
      if (mp.name !== lp.name) {
        fieldIssues++;
        fieldIssueList.push(`${legacy.slug}: product[${i}].name mismatch`);
      }
      if (mp.rank !== lp.rank) {
        fieldIssues++;
        fieldIssueList.push(`${legacy.slug}: product[${i}].rank mismatch`);
      }
    }
  }
  // faqs
  if (!Array.isArray(migrated.faqs) || migrated.faqs.length !== legacy.faqs.length) {
    fieldIssues++;
    fieldIssueList.push(`${legacy.slug}: faqs length mismatch (expected ${legacy.faqs.length})`);
  }
  // relatedContent (internalLinks)
  const expectedLinks = legacy.internalLinks.length;
  const actualLinks = migrated.relatedContent.length;
  if (actualLinks !== expectedLinks) {
    fieldIssues++;
    fieldIssueList.push(`${legacy.slug}: relatedContent length mismatch (expected ${expectedLinks}, got ${actualLinks})`);
  }
}
check(
  'Field: slug/title/anchorProduct/products/faqs/relatedContent complete',
  fieldIssues === 0,
  fieldIssues === 0 ? 'all fields intact' : `${fieldIssues} issues, first: ${fieldIssueList[0]}`
);

// ------------------------------------------------------------
// 4. whyChoose preservation
// ------------------------------------------------------------
let whyChooseTotal = 0;
let whyPreservedTotal = 0;
const whyPerEntryIssues: string[] = [];

for (const legacy of alternativesData) {
  whyChooseTotal += legacy.whyChoose.length;
  const migrated = alternativeContent.find((c) => c.slug === legacy.slug);
  if (!migrated) continue;
  // Adapter assigns whyChoose[idx] -> products[idx].why
  let preserved = 0;
  for (let i = 0; i < legacy.whyChoose.length; i++) {
    if (migrated.products[i] && migrated.products[i].why === legacy.whyChoose[i]) {
      preserved++;
    }
  }
  whyPreservedTotal += preserved;
  if (preserved !== legacy.whyChoose.length) {
    whyPerEntryIssues.push(`${legacy.slug}: ${preserved}/${legacy.whyChoose.length} whyChoose preserved`);
  }
}
check(
  'whyChoose: 100% preserved in products[].why',
  whyPreservedTotal === whyChooseTotal,
  `${whyPreservedTotal}/${whyChooseTotal} preserved${whyPerEntryIssues.length ? `, issues: ${whyPerEntryIssues[0]}` : ''}`
);

// ------------------------------------------------------------
// 5. SEO field coverage (all migrated entries must have all 7 SEO fields)
// ------------------------------------------------------------
const seoFields = [
  'primaryKeyword',
  'secondaryKeywords',
  'keywordCluster',
  'searchIntent',
  'priorityScore',
  'difficulty',
  'searchVolume',
] as const;

let seoMissing = 0;
const seoIssueList: string[] = [];
for (const c of alternativeContent) {
  for (const f of seoFields) {
    const v = (c as unknown as Record<string, unknown>)[f];
    if (v === undefined || v === null) {
      seoMissing++;
      seoIssueList.push(`${c.slug}: missing ${f}`);
    }
    // secondaryKeywords must be non-empty array
    if (f === 'secondaryKeywords' && (!Array.isArray(v) || v.length === 0)) {
      seoMissing++;
      seoIssueList.push(`${c.slug}: secondaryKeywords empty`);
    }
  }
  // searchIntent must be 'commercial'
  if (c.searchIntent !== 'commercial') {
    seoMissing++;
    seoIssueList.push(`${c.slug}: searchIntent not commercial (got ${c.searchIntent})`);
  }
}
const totalSeoChecks = alternativeContent.length * seoFields.length;
check(
  `SEO: 7 fields covered (primaryKeyword, secondaryKeywords, keywordCluster, searchIntent, priorityScore, difficulty, searchVolume)`,
  seoMissing === 0,
  seoMissing === 0 ? `${totalSeoChecks}/${totalSeoChecks} covered` : `${seoMissing} missing, first: ${seoIssueList[0]}`
);

// ------------------------------------------------------------
// 6. Query method sanity
// ------------------------------------------------------------
const all = getAllAlternatives();
const first = all[0];
const bySlug = first ? getAlternativeBySlug(first.slug) : undefined;
const byCat = first ? getAlternativesByCategory(first.category) : [];
check(
  'Query API: getAllAlternatives/getAlternativeBySlug/getAlternativesByCategory',
  all.length === migratedCount && bySlug?.slug === first?.slug && byCat.length > 0,
  `all=${all.length}, bySlug=${bySlug?.slug ?? 'undefined'}, byCat=${byCat.length}`
);

// ------------------------------------------------------------
// Report
// ------------------------------------------------------------
const passed = results.filter((r) => r.passed).length;
const total = results.length;
console.log('\n============================================================');
console.log('  Unified Content Migration Step 5B — Verification Report');
console.log('============================================================');
console.log(`  Legacy Alternative count : ${legacyCount}`);
console.log(`  Migrated count           : ${migratedCount}`);
console.log(`  Slug match               : ${missingInMigrated.length === 0 && extraInMigrated.length === 0 ? '100%' : 'FAILED'}`);
console.log(`  whyChoose preserved      : ${whyPreservedTotal}/${whyChooseTotal}`);
console.log(`  SEO field coverage       : ${seoMissing === 0 ? '100%' : `${totalSeoChecks - seoMissing}/${totalSeoChecks}`}`);
console.log(`  Query API sanity         : ${all.length === migratedCount && bySlug?.slug === first?.slug && byCat.length > 0 ? 'OK' : 'FAILED'}`);
console.log('------------------------------------------------------------');
for (const r of results) {
  console.log(`  [${r.passed ? 'PASS' : 'FAIL'}] ${r.name}`);
  console.log(`        ${r.detail}`);
}
console.log('------------------------------------------------------------');
console.log(`  ${passed}/${total} checks passed`);
console.log('============================================================\n');

if (passed !== total) {
  process.exit(1);
}
