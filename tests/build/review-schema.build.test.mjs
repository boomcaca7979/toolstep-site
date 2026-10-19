// Build-output layer for the structured-data contract.
//
// Runs only through `npm run test:build`, never through the default `npm test`,
// because it reads the untracked dist/ tree. A dist/ older than the sources that
// generate it would certify markup the current code no longer produces, so these
// tests fail loudly instead of skipping green.
//
// Publishing that tree is a separate, explicit act: `npm run build` triggers a
// postbuild that can notify IndexNow, and no test in this repository runs it.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  findAppPricingViolations,
  findMerchantViolationsInNodes,
  isProductNode,
  parseJsonLdNodes,
  typeNamesOf,
} from '../schema-merchant-markup.mjs';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const DIST = path.join(REPO_ROOT, 'dist');
const REVIEWS = path.join(DIST, 'reviews');

// Only inputs that change generated HTML. package.json and tests/ are excluded
// on purpose: editing them must not invalidate a good build.
const BUILD_INPUTS = ['src', 'public', 'astro.config.mjs'];

const RRT_VERIFIED = [
  'reviews/logitech-brio-4k-review',
  'reviews/sony-wh-1000xm5-review',
  'reviews/uplift-v2-review',
];

function newestMtime(target) {
  if (!existsSync(target)) return 0;
  const stats = statSync(target);
  if (!stats.isDirectory()) return stats.mtimeMs;
  let newest = stats.mtimeMs;
  for (const entry of readdirSync(target, { withFileTypes: true })) {
    const value = newestMtime(path.join(target, entry.name));
    if (value > newest) newest = value;
  }
  return newest;
}

function requireFreshDist() {
  assert.ok(
    existsSync(REVIEWS),
    `no built output at ${REVIEWS}. Run \`npm run build\` first — this layer must not silently pass without it. ` +
      `Note that build posts an IndexNow notification on Vercel production only.`,
  );

  const builtAt = newestMtime(DIST);
  const sourceAt = Math.max(...BUILD_INPUTS.map((entry) => newestMtime(path.join(REPO_ROOT, entry))));
  assert.ok(
    builtAt >= sourceAt,
    `dist/ is older than the sources (${new Date(builtAt).toISOString()} < ${new Date(sourceAt).toISOString()}). ` +
      `Rebuild before trusting these checks: the markup under test would not be what src/ produces today.`,
  );
  return builtAt;
}

function htmlFiles(dir) {
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...htmlFiles(full));
    else if (entry.name.endsWith('.html')) out.push(full);
  }
  return out;
}

function nodesOf(file) {
  return parseJsonLdNodes(readFileSync(file, 'utf8'), assert, path.relative(REPO_ROOT, file));
}

function builtPages() {
  const files = htmlFiles(DIST).filter((file) => !file.includes(`${path.sep}_astro${path.sep}`));
  assert.ok(files.length > 0, 'no built HTML pages found under dist/');
  return files;
}

test('built output exists and is at least as new as the sources that generate it', () => {
  const builtAt = requireFreshDist();
  const pages = builtPages();
  const withProduct = pages.filter((file) => nodesOf(file).some(isProductNode)).length;
  assert.ok(withProduct > 0, 'no built page carries a Product node — the review schema is missing entirely');
  assert.ok(
    pages.some((file) => file.startsWith(REVIEWS)),
    'no built review page found',
  );
});

test('every built page carries at most one Product node, free of merchant and rating claims', () => {
  requireFreshDist();

  let products = 0;
  for (const file of builtPages()) {
    const rel = path.relative(REPO_ROOT, file);
    const nodes = nodesOf(file);
    const found = nodes.filter(isProductNode);
    assert.ok(found.length <= 1, `${rel}: ${found.length} conflicting Product nodes`);
    products += found.length;

    for (const product of found) {
      assert.deepEqual(
        findMerchantViolationsInNodes([product]),
        [],
        `${rel}: Product node carries merchant markup or an invented crowd rating`,
      );
      assert.ok(product.name?.length > 0, `${rel}: Product without a name`);
      assert.ok(product.review?.reviewBody?.length > 0, `${rel}: Product without an editorial review body`);
    }
  }
  assert.ok(products > 0, 'no Product node found across the built site');
});

test('the review pages verified in the Rich Results Test still match their canonical URL', () => {
  requireFreshDist();

  for (const relDir of RRT_VERIFIED) {
    const file = path.join(DIST, relDir, 'index.html');
    assert.ok(existsSync(file), `${relDir}: missing build output`);
    const html = readFileSync(file, 'utf8');
    const product = nodesOf(file).filter(isProductNode);
    assert.equal(product.length, 1, `${relDir}: expected exactly one Product node`);

    const schema = product[0];
    assert.equal(typeNamesOf(schema).join(','), 'Product');
    assert.equal(schema.brand['@type'], 'Brand');
    assert.equal(schema.review['@type'], 'Review');
    assert.ok(schema.review.reviewRating.ratingValue > 0);
    assert.equal(schema.review.author['@type'], 'Person');

    const canonical = html.match(/<link[^>]*rel="canonical"[^>]*href="([^"]+)"/i)?.[1];
    assert.ok(canonical, `${relDir}: no canonical link in built HTML`);
    assert.equal(schema.review.url, canonical.replace(/\/?$/, '/'), `${relDir}: review.url diverges from canonical`);
  }
});

test('no built page pairs a Product node with any Offer on the page', () => {
  // The dangerous pairing for Merchant listings is an editorial Product sharing
  // a page with sale claims. SoftwareApplication pricing alone stays allowed.
  requireFreshDist();

  for (const file of builtPages()) {
    const nodes = nodesOf(file);
    if (!nodes.some(isProductNode)) continue;
    const offerBearing = nodes.filter((node) => node && 'offers' in node);
    assert.deepEqual(
      offerBearing.map((node) => typeNamesOf(node).join('+')),
      [],
      `${path.relative(REPO_ROOT, file)}: a Product page also publishes ${offerBearing.length} Offer-bearing node(s)`,
    );
  }
});

test('software pricing markup keeps its honest shape and is not misread as a Product listing', () => {
  requireFreshDist();

  let appsWithPricing = 0;
  for (const file of builtPages()) {
    const nodes = nodesOf(file);
    for (const node of nodes) {
      if (!typeNamesOf(node).includes('SoftwareApplication')) continue;
      appsWithPricing += 1;
      assert.deepEqual(
        findAppPricingViolations(node),
        [],
        `${path.relative(REPO_ROOT, file)}: software pricing drifted into shipping/return claims`,
      );
    }
    // Page-level guard stays silent on app pricing: if it ever reported these
    // nodes, the two schema shapes have been conflated again.
    const appOnly = nodes.filter((node) => typeNamesOf(node).includes('SoftwareApplication'));
    if (appOnly.length) assert.deepEqual(findMerchantViolationsInNodes(appOnly), []);
  }
  assert.ok(appsWithPricing > 0, 'expected the built site to carry software pricing markup');
});
