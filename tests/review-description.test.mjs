// Contract tests for the review meta-description builder.
//
// Root cause locked here: buildReviewDescription() used to emit a fixed
// 143-character generic sentence first and hard-cut the verdict at 120 chars,
// so every data-driven review page produced a snippet whose page-specific part
// fell past Google's ~160-character cut (35/35 pages over budget, max 303).
//
// These tests call the real generator in src/lib/seo.ts. Nothing here touches
// dist/, the network, or the build.

import { test } from 'node:test';
import assert from 'node:assert/strict';

let seo = null;
let seoLoadError = null;
try {
  seo = await import('../src/lib/seo.ts');
} catch (err) {
  seoLoadError = err;
}

function build(...args) {
  if (!seo) {
    assert.fail(
      `src/lib/seo.ts could not be imported (${seoLoadError?.code ?? seoLoadError?.name}). ` +
        `Importing a .ts file needs Node's type stripping: Node >=22.18 or >=23.6, ` +
        `or add --experimental-strip-types. Running Node ${process.version}.`,
    );
  }
  return seo.buildReviewDescription(...args);
}

const MAX = 160;
const DOC = 'Based on published specs, not hands-on testing.';

const LONG_VERDICT =
  'Final Verdict: The Plugable USB-C Triple 4K Dock (UD-ULTC4K) is the best $199 dock for ' +
  'multi-monitor laptop users in 2026, driving three 4K60 displays while charging the laptop ' +
  'at 100W through one cable. DisplayLink means lower bandwidth than Thunderbolt, and the ' +
  'brick is large, but nothing else at this price runs three screens reliably.';

test('long verdict: fits the 160-char budget and leads with the verdict', () => {
  const out = build('Plugable USB-C Triple 4K Dock', 'Specification Analysis', LONG_VERDICT, 'DOCUMENTATION');
  assert.ok(out.length <= MAX, `expected <= ${MAX} chars, got ${out.length}: ${out}`);
  assert.ok(out.startsWith('The Plugable USB-C Triple 4K Dock'), `unexpected lead: ${out}`);
  assert.ok(out.includes(DOC), 'evidence disclosure missing');
  assert.ok(!/^Plugable USB-C Triple 4K Dock review covering/.test(out), 'generic prefix still first');
});

test('long verdict: never cuts a word in half', () => {
  const out = build('Plugable USB-C Triple 4K Dock', 'Specification Analysis', LONG_VERDICT, 'DOCUMENTATION');
  const body = out.slice(0, out.lastIndexOf(DOC)).trim();
  assert.ok(/[.!?]$/.test(body), `lead should end with punctuation: ${body}`);
  const words = body.replace(/[.!?]+$/, '').split(' ');
  const withoutPunctuation = LONG_VERDICT.replace(/[^A-Za-z0-9 -]/g, ' ');
  const vocabulary = new Set(withoutPunctuation.split(/\s+/).filter(Boolean));
  for (const w of words) {
    const bare = w.replace(/[^A-Za-z0-9-]/g, '');
    if (bare.length <= 2) continue;
    assert.ok(vocabulary.has(bare), `truncation produced a partial word: "${bare}"`);
  }
});

test('short verdict is preserved verbatim', () => {
  const verdict = 'Bear is the best Markdown notes app for Apple users who write every day.';
  const out = build('Bear', 'Specification Analysis', verdict, 'DOCUMENTATION');
  assert.ok(out.startsWith(verdict), `short verdict should survive intact: ${out}`);
  assert.ok(out.endsWith(DOC));
  assert.ok(out.length <= MAX);
});

test('empty verdict falls back to a product-specific sentence', () => {
  const out = build('Keychron K8', 'Specification Analysis', '', 'DOCUMENTATION');
  assert.ok(out.includes('Keychron K8'), `fallback must name the product: ${out}`);
  assert.ok(out.length <= MAX);
  assert.ok(out.endsWith(DOC));
});

test('"Final Verdict:" label is stripped, not shipped into the snippet', () => {
  const out = build('Things 3', 'Specification Analysis', 'Final Verdict: Things 3 is an Apple-only task manager.', 'DOCUMENTATION');
  assert.ok(!/final verdict/i.test(out), `label leaked: ${out}`);
  assert.ok(out.startsWith('Things 3 is'));
});

test('hands-on entries disclose the testing window instead of "not hands-on"', () => {
  const out = build('Sony WH-1000XM5', '21 days', LONG_VERDICT, 'HANDS_ON');
  assert.ok(out.includes('Tested over 21 days.'), `expected hands-on disclosure: ${out}`);
  assert.ok(!out.includes('not hands-on'));
  assert.ok(out.length <= MAX);
});

test('documentation entries never claim hands-on testing', () => {
  for (const kind of ['DOCUMENTATION', 'SPECIFICATION', 'PUBLIC_INFO', 'MIXED', undefined]) {
    const out = build('Sony WH-1000XM5', 'Specification Analysis', LONG_VERDICT, kind);
    assert.ok(!/we tested|our test|hand-tested/i.test(out), `unsupported testing claim for ${kind}: ${out}`);
    assert.ok(out.includes('not hands-on testing'), `missing disclosure for ${kind}: ${out}`);
  }
});

test('special characters are collapsed to a single line and stay in budget', () => {
  const verdict =
    'The "Q&A" tool & its 5.3" sibling\n\n  — both ship & both work — ' +
    'but the 100 % price gap makes the cheaper one the pick for most teams.';
  const out = build('Q&A Tool', 'Specification Analysis', verdict, 'DOCUMENTATION');
  assert.ok(!out.includes('\n'), 'description must be single-line');
  assert.ok(!/\s{2,}/.test(out), `double spaces present: ${out}`);
  assert.ok(out.includes('&'), 'ampersand should survive for Astro to escape');
  assert.ok(out.length <= MAX);
});

test('different verdicts produce different descriptions', () => {
  const a = build('A', 'x', 'Product A is the best cheap option for students on a budget.', 'DOCUMENTATION');
  const b = build('B', 'x', 'Product B is the best premium option for studios that need colour accuracy.', 'DOCUMENTATION');
  assert.notEqual(a, b);
});

test('clipForMeta keeps a whole clause when one is available', () => {
  const text = 'Alpha is the best pick for small teams, with strong reporting and a low entry price that scales predictably.';
  const out = seo.clipForMeta(text, 60);
  assert.ok(out.length <= 60, `got ${out.length}: ${out}`);
  assert.ok(out.startsWith('Alpha is the best pick for small teams.'), `clause cut failed: ${out}`);
});

// --- Data-level invariants ------------------------------------------------
//
// These read the real review data, not fixtures. They exist because two defects
// reached production markup once already:
//
//   1. Five entries shipped without `editorial.evidenceType`. ReviewMeta treats
//      a missing type as legacy and falls back to "Evaluation Period: 90 days",
//      so a page whose own body says "we do not claim hands-on testing that did
//      not happen" simultaneously advertised a 90-day measurement window.
//   2. The same absence made the description fall back to the documented
//      default, which happened to be honest — but nothing enforced that.
//
// The map is only loaded if the group modules import cleanly, so a bundler-only
// construct in the data layer cannot turn these into phantom passes.

const groups = {};
for (const name of ['group1', 'group2', 'group3', 'group4', 'group5']) {
  try {
    const mod = await import(`../src/data/reviews/${name}.ts`);
    groups[name] = Object.values(mod)[0] ?? [];
  } catch (err) {
    assert.fail(`could not import ${name}.ts: ${err.message}`);
  }
}
const entries = Object.values(groups).flat();

test('every review entry declares an explicit evidence type', () => {
  assert.ok(entries.length > 0, 'no review entries loaded');
  const missing = entries
    .filter((e) => !e.editorial?.evidenceType)
    .map((e) => e.slug);
  assert.deepEqual(
    missing,
    [],
    `these entries have no editorial.evidenceType, so ReviewMeta will render ` +
      `"Evaluation Period: <duration>" instead of an honest basis: ${missing.join(', ')}`,
  );
});

test('no review entry claims a testing window it did not run', () => {
  const offenders = [];
  for (const e of entries) {
    const type = e.editorial?.evidenceType;
    const out = build(e.productName, e.testingDuration ?? '', e.verdict ?? '', type);
    if (type === 'HANDS_ON') {
      if (!out.includes('Tested over')) offenders.push(`${e.slug}: HANDS_ON without disclosure`);
    } else {
      if (out.includes('Tested over')) offenders.push(`${e.slug}: ${type} claims a testing window`);
      if (!out.includes(DOC)) offenders.push(`${e.slug}: missing documentation disclosure`);
    }
  }
  assert.deepEqual(offenders, [], offenders.join('; '));
});

// --- Truncation quality ---------------------------------------------------
//
// These lock three specific snippets that shipped broken. They are not style
// preferences: each one is a sentence a reader would see cut mid-thought in a
// Google result.

test('a cut never strands a trailing preposition', () => {
  const verdict =
    'The Satechi Thunderbolt 4 Dock is the cleanest way to turn a Thunderbolt 4 ' +
    'laptop into a dual-4K workstation on one cable. According to manufacturer ' +
    'specifications, the 40Gbps bandwidth and 96W charging deliver ' +
    'workstation-grade performance.';
  const out = build('Satechi Thunderbolt 4 Dock', 'Specification Analysis', verdict, 'DOCUMENTATION');
  const lead = out.slice(0, out.lastIndexOf(DOC)).trim();
  assert.ok(!/\s(on|in|to|for|with|of|and|the|a)\.$/i.test(lead), `stranded function word: ${lead}`);
  assert.ok(lead.endsWith('workstation.'), `expected a clean clause: ${lead}`);
});

test('a cut never leaves an unfinished relative clause', () => {
  const verdict =
    'The Apple Magic Keyboard with Touch ID is the best keyboard for Mac users who ' +
    'want a slim, quiet typing experience and seamless ecosystem pairing. Touch ID ' +
    'is the killer feature for Apple Silicon owners.';
  const out = build('Apple Magic Keyboard with Touch ID', 'Specification Analysis', verdict, 'DOCUMENTATION');
  const lead = out.slice(0, out.lastIndexOf(DOC)).trim();
  assert.ok(!/\b(who|which|whose)\s+\S+\.$/.test(lead), `dangling relative clause: ${lead}`);
  assert.ok(lead.endsWith('Mac users.'), `expected the clause to close cleanly: ${lead}`);
});

test('a leading heading line does not swallow the product name', () => {
  const verdict =
    'The Most Capable Standing Desk You Can Buy\n\n' +
    'Based on manufacturer specifications, the Uplift V2 earns its 4.8/5 rating on ' +
    'the dimensions that matter for power users: 355-lb capacity and a 50.5-inch ' +
    'max height.';
  const out = build('Uplift V2', 'Specification Analysis', verdict, 'DOCUMENTATION');
  assert.ok(out.includes('Uplift V2'), `product name missing from snippet: ${out}`);
  assert.ok(!out.startsWith('The Most Capable Standing Desk You Can Buy'), `heading leaked: ${out}`);
  assert.ok(out.length <= MAX);
});

test('every generated description stays within the meta budget', () => {
  const over = entries
    .map((e) => ({
      slug: e.slug,
      len: build(e.productName, e.testingDuration ?? '', e.verdict ?? '', e.editorial?.evidenceType).length,
    }))
    .filter((r) => r.len > MAX);
  assert.deepEqual(over, [], `over ${MAX} chars: ${JSON.stringify(over)}`);
});
