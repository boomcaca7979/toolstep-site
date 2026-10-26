// Build-output layer for URL-form hygiene.
//
// Production runs on Vercel (server: Vercel), so public/_redirects and
// netlify.toml never take effect there: vercel.json is the only routing surface
// that ships. Two classes of defect are guarded here.
//
//   1. Trailing-slash normalisation must come from the platform primitive
//      (`trailingSlash: true`), not from a hand-maintained list of `:slug`
//      rules. The hand-written list is what drifted: it covered 6 of 17
//      indexable route families, and every uncovered family was served as a 200
//      duplicate that Google filed under "Alternate page with proper canonical
//      tag". A rule whose only effect is appending a slash is therefore a
//      regression, not a fix.
//
//   2. Internal anchors and the sitemap must only ever point at the canonical
//      trailing-slash form. The site declares trailingSlash: 'always', so a
//      slashed and an unslashed link are two URLs for one page.
//
// Runs only through `npm run test:build`, never through the default `npm test`,
// because it reads the untracked dist/ tree. A stale dist/ would certify links
// the current templates no longer emit, so the tests fail loudly instead of
// skipping green.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const DIST = path.join(REPO_ROOT, 'dist');
const VERCEL_JSON = path.join(REPO_ROOT, 'vercel.json');
const ORIGIN = 'https://www.toolstep.top';

const BUILD_INPUTS = ['src', 'public', 'astro.config.mjs', 'vercel.json'];

// Directories in dist/ that hold static assets, not routes.
const NON_ROUTE_DIRS = new Set(['_astro', '_pagefind', 'fonts', 'images', 'pagefind']);

// Every legacy path that must keep resolving after the switch to native
// trailing-slash handling. Kept explicit so a config edit cannot drop one.
const REQUIRED_REDIRECTS = [
  ['/reviews/best-webcam-work-from-home', '/reviews/best-webcam-remote-work/'],
  ['/reviews/best-webcam-work-from-home/', '/reviews/best-webcam-remote-work/'],
  ['/reviews/best-noise-canceling-headphones-work', '/reviews/best-noise-cancelling-headphones-work/'],
  ['/reviews/best-noise-canceling-headphones-work/', '/reviews/best-noise-cancelling-headphones-work/'],
  ['/sitemap.xml', '/sitemap-index.xml'],
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

function assertDistIsFresh() {
  assert.ok(existsSync(DIST), 'dist/ is missing — run `npm run build` first');
  const distStart = statSync(path.join(DIST, 'index.html')).mtimeMs;
  for (const input of BUILD_INPUTS) {
    const newest = newestMtime(path.join(REPO_ROOT, input));
    assert.ok(
      newest <= distStart,
      `dist/ is older than ${input} — rebuild before trusting this test`,
    );
  }
}

function* walkHtml(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) yield* walkHtml(full);
    else if (entry.name.endsWith('.html')) yield full;
  }
}

/** dist-relative pathname for an html file: /reviews/x/index.html -> /reviews/x/ */
function pathnameOf(file) {
  return '/' + path.relative(DIST, file).split(path.sep).join('/')
    .replace(/index\.html$/, '')
    .replace(/\.html$/, '/');
}

function canonicalOf(html) {
  const match = /<link[^>]+rel="canonical"[^>]*href="([^"]*)"/.exec(html);
  return match ? match[1] : null;
}

/**
 * Indexable route families the build emits: top-level dirs serving an
 * index.html that is not deliberately `noindex` (e.g. /blog/, which lists only
 * demo posts and is excluded from the sitemap).
 */
function routeFamilies() {
  const families = [];
  for (const entry of readdirSync(DIST, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    if (NON_ROUTE_DIRS.has(entry.name)) continue;
    const index = path.join(DIST, entry.name, 'index.html');
    if (!existsSync(index)) continue;
    if (readFileSync(index, 'utf8').includes('name="robots" content="noindex')) continue;
    families.push(entry.name);
  }
  return families.sort();
}

function readVercelConfig() {
  return JSON.parse(readFileSync(VERCEL_JSON, 'utf8'));
}

test('dist is newer than every build input', () => {
  assertDistIsFresh();
});

test('vercel.json normalises trailing slashes natively, not with hand-written rules', () => {
  const config = readVercelConfig();
  assert.equal(
    config.trailingSlash,
    true,
    'vercel.json must set "trailingSlash": true — otherwise the 17 indexable route ' +
      'families are only normalised where a manual rule happens to exist',
  );

  // A rule that only appends a slash re-implements the platform primitive and
  // reintroduces the drift this test exists to prevent.
  const slashOnly = (config.redirects ?? [])
    .filter((rule) => rule.destination === `${rule.source}/`)
    .map((rule) => rule.source);
  assert.deepEqual(
    slashOnly,
    [],
    `redundant slash-normalisation rules belong to trailingSlash, not redirects: ${slashOnly.join(', ')}`,
  );

  // The families really are emitted, so the assertion above is not vacuous.
  assert.ok(routeFamilies().length >= 17, 'expected at least 17 indexable route families in dist/');
});

test('special legacy redirects are preserved intact', () => {
  const rules = readVercelConfig().redirects ?? [];
  const bySource = new Map(rules.map((rule) => [rule.source, rule]));
  for (const [source, destination] of REQUIRED_REDIRECTS) {
    const rule = bySource.get(source);
    assert.ok(rule, `legacy redirect ${source} is missing from vercel.json`);
    assert.equal(rule.destination, destination, `legacy redirect ${source} points at the wrong target`);
    assert.equal(rule.permanent, true, `legacy redirect ${source} must stay permanent (308)`);
  }
});

test('no redirect rule shadows a page the site publishes as canonical', () => {
  const rules = readVercelConfig().redirects ?? [];
  const published = new Set();
  for (const file of walkHtml(DIST)) published.add(pathnameOf(file));

  const collisions = rules
    .filter((rule) => !rule.source.includes(':'))
    .map((rule) => rule.source)
    .filter((source) => published.has(source.endsWith('/') ? source : `${source}/`));

  assert.deepEqual(
    collisions,
    [],
    `redirect sources also served as live pages (would hijack a canonical URL): ${collisions.join(', ')}`,
  );
});

test('no internal anchor links to a path without a trailing slash', () => {
  const offenders = new Map();
  const anchor = /<a\b[^>]*href="([^"]*)"/g;

  for (const file of walkHtml(DIST)) {
    const html = readFileSync(file, 'utf8').replaceAll(ORIGIN, '');
    for (const match of html.matchAll(anchor)) {
      const href = match[1].split('#')[0].split('?')[0];
      if (!href.startsWith('/')) continue;          // external, relative, mailto:, tel:
      if (href === '/') continue;
      if (path.extname(href) !== '') continue;      // real files: /rss.xml, /_astro/*.css
      if (href.endsWith('/')) continue;
      if (!offenders.has(href)) offenders.set(href, new Set());
      offenders.get(href).add(pathnameOf(file));
    }
  }

  const report = [...offenders.entries()]
    .map(([href, sources]) => `${href}  (${sources.size} page(s))`)
    .sort();
  assert.deepEqual(report, [], `internal links missing a trailing slash:\n  ${report.join('\n  ')}`);
});

test('sitemap lists only self-canonical pages that the build actually emits', () => {
  const sitemapPath = path.join(DIST, 'sitemap-0.xml');
  assert.ok(existsSync(sitemapPath), 'dist/sitemap-0.xml is missing');

  const locs = [...readFileSync(sitemapPath, 'utf8').matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  assert.ok(locs.length > 0, 'sitemap contains no <loc> entries');

  const problems = [];
  for (const loc of locs) {
    assert.ok(loc.startsWith(ORIGIN), `sitemap URL is off-origin: ${loc}`);
    assert.ok(loc.endsWith('/'), `sitemap URL is not the canonical trailing-slash form: ${loc}`);
    const pathname = loc.slice(ORIGIN.length);
    const file = path.join(DIST, pathname, 'index.html');
    if (!existsSync(file)) { problems.push(`${pathname} — listed in sitemap but not built`); continue; }
    const canonical = canonicalOf(readFileSync(file, 'utf8'));
    if (canonical !== loc) problems.push(`${pathname} — canonical is ${canonical ?? 'absent'}, expected ${loc}`);
  }

  assert.deepEqual(problems, [], `sitemap / canonical mismatches:\n  ${problems.join('\n  ')}`);
});

test('a 404 page exists so unknown paths still terminate', () => {
  assert.ok(existsSync(path.join(DIST, '404.html')), 'dist/404.html is missing');
});
