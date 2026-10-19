// Contract layer for the published structured-data fix.
//
// Root cause locked here: buildReviewSchema() used to put an Offer (price, USD,
// InStock) on the Product node of editorial reviews. Google then read those
// pages as merchant listings and demanded shippingDetails /
// hasMerchantReturnPolicy — claims ToolStep cannot honestly make.
//
// These tests call the real generators in src/lib/seo.ts and assert on the
// objects they return. Nothing here touches dist/, the network, or the build.
// Built-output checks live in tests/build/ and run only via `npm run test:build`.

import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  findAppPricingViolations,
  findMerchantViolationsInNodes,
  findProductMerchantMarkup,
  findProductRatingFabrication,
  findProductViolations,
  findShippingOrReturnClaims,
} from './schema-merchant-markup.mjs';

// seo.ts is TypeScript and bare Node ESM cannot resolve the extensionless
// data-module specifiers used elsewhere in src/data, so the generators are
// reached directly and the review entries stay as local fixtures.
let seo = null;
let seoLoadError = null;
try {
  seo = await import('../src/lib/seo.ts');
} catch (err) {
  seoLoadError = err;
}

function seoLib() {
  if (!seo) {
    assert.fail(
      `src/lib/seo.ts could not be imported (${seoLoadError?.code ?? seoLoadError?.name}). ` +
        `Importing a .ts file needs Node's type stripping: Node >=22.18 or >=23.6, ` +
        `or add --experimental-strip-types. Running Node ${process.version}.`,
    );
  }
  return seo;
}

const SITE = 'https://www.toolstep.top';

const REVIEW_INPUT = {
  productName: 'Sony WH-1000XM5',
  productBrand: 'Sony',
  productCategory: 'Wireless Headphones',
  productImage: `${SITE}/sony.webp`,
  ratingValue: 4.7,
  authorName: 'Sarah Park',
  authorUrl: `${SITE}/authors/sarah-park`,
  authorJobTitle: 'Senior Reviews Editor',
  datePublished: '2026-05-12',
  dateModified: '2026-09-30',
  reviewBody: 'Class-leading ANC with a comfortable, travel-friendly fit.',
  url: `${SITE}/reviews/sony-wh-1000xm5-review/`,
};

// Shape-compatible with ProductReviewEntry for the fields buildProductReviewMeta
// reads. Both date paths are covered: one entry with an ISO updatedDate, one
// without it, which must fall back to publishDate.
const ENTRY_WITH_UPDATE = {
  slug: 'sony-wh-1000xm5-review',
  productName: 'Sony WH-1000XM5',
  brand: 'Sony',
  category: 'Wireless Headphones',
  categorySlug: 'best-noise-cancelling-headphones-work',
  heroImage: `${SITE}/sony.webp`,
  publishDate: '2026-06-26',
  lastUpdated: 'June 2026',
  updatedDate: '2026-10-02',
  authorSlug: 'sarah-park',
  testingDuration: '3 weeks',
  productsTested: 1,
  ratingValue: 4.7,
  // The data row carries affiliate pricing for the on-page CTA. It must stay
  // out of schema.org: no merchant of ToolStep's is stocking this product.
  bestPrice: 399,
  amazonUrl: 'https://www.amazon.com/s?k=sony+wh-1000xm5&tag=toolwise20-20',
  verdict: 'Class-leading ANC with a comfortable, travel-friendly fit.',
  quickVerdict: 'Best for frequent flyers.',
  testingSummary: 'Tested on three long-haul flights.',
  performance: 'Excellent',
  buildQuality: 'Very good',
  easeOfUse: 'Very good',
  value: 'Good',
  pros: ['Best-in-class ANC'],
  cons: ['No 3.5mm mic input'],
  bestFor: ['Commuters'],
  notFor: ['Audiophiles on a budget'],
  specs: [{ label: 'Weight', value: '250 g' }],
  alternatives: [],
  faqs: [{ question: 'Does it fold flat?', answer: 'No.' }],
};

const ENTRY_WITHOUT_UPDATE = {
  ...ENTRY_WITH_UPDATE,
  slug: 'logitech-brio-4k-review',
  productName: 'Logitech Brio 4K',
  brand: 'Logitech',
  category: 'Webcams',
  heroImage: `${SITE}/brio.webp`,
  publishDate: '2026-07-08',
  updatedDate: undefined,
  ratingValue: 4.6,
  verdict: 'Sharp 4K detail, but the software does the heavy lifting.',
  lastUpdated: 'July 2026',
};

const ENTRIES = [ENTRY_WITH_UPDATE, ENTRY_WITHOUT_UPDATE];

function reviewSchema(overrides = {}) {
  return seoLib().buildReviewSchema({ ...REVIEW_INPUT, ...overrides });
}

test('src/lib/seo.ts loads as a real module, not a source-text scan', () => {
  assert.equal(seoLoadError, null, `import failed on Node ${process.version}: ${seoLoadError?.message}`);
  assert.equal(typeof seo.buildReviewSchema, 'function');
  assert.equal(typeof seo.buildProductReviewMeta, 'function');
});

test('buildReviewSchema emits one Product root and no merchant sale claims', () => {
  const schema = reviewSchema();

  assert.equal(schema['@type'], 'Product');
  assert.ok(!Array.isArray(schema['@type']), 'Product root must not use an @type array');
  assert.equal(schema['@graph'], undefined, 'a single Product root is emitted, not a graph wrapper');
  assert.deepEqual(findProductMerchantMarkup(schema), []);
});

test('buildReviewSchema keeps the nested editorial Review contract', () => {
  const { review } = reviewSchema();

  assert.equal(review['@type'], 'Review');
  assert.equal(review.reviewRating['@type'], 'Rating');
  assert.equal(review.reviewRating.ratingValue, REVIEW_INPUT.ratingValue);
  assert.equal(review.reviewRating.bestRating, 5);
  assert.equal(review.reviewRating.worstRating, 1);
  assert.equal(review.author['@type'], 'Person');
  assert.equal(review.author.name, REVIEW_INPUT.authorName);
  assert.equal(review.author.url, REVIEW_INPUT.authorUrl);
  assert.equal(review.author.jobTitle, REVIEW_INPUT.authorJobTitle);
  assert.equal(review.publisher['@type'], 'Organization');
  assert.equal(review.datePublished, REVIEW_INPUT.datePublished);
  assert.equal(review.dateModified, REVIEW_INPUT.dateModified);
  assert.equal(review.reviewBody, REVIEW_INPUT.reviewBody);
  assert.equal(review.url, REVIEW_INPUT.url);
});

test('buildReviewSchema ignores caller-supplied pricing and policy keys', () => {
  // A caller regressing by forwarding affiliate data, or a future edit that
  // spreads the options object, must still not put an Offer on the Product.
  const schema = reviewSchema({
    price: 399,
    priceCurrency: 'USD',
    priceRange: '$399',
    availability: 'https://schema.org/InStock',
    offers: { '@type': 'Offer', price: 399 },
    shippingDetails: { '@type': 'OfferShippingDetails' },
    hasMerchantReturnPolicy: { '@type': 'MerchantReturnPolicy' },
  });

  assert.deepEqual(findProductMerchantMarkup(schema), []);
  assert.equal(schema.price, undefined);
  assert.equal(schema.availability, undefined);
});

test('buildReviewSchema keeps invented crowd ratings off the Product node', () => {
  const schema = reviewSchema({
    aggregateRating: { '@type': 'AggregateRating', ratingValue: 4.6, reviewCount: 1200 },
    reviewCount: 1200,
    ratingCount: 1200,
  });

  assert.deepEqual(findProductRatingFabrication(schema), []);
  // The one honest rating is the editor's own, still present and unchanged.
  assert.equal(schema.review.reviewRating.ratingValue, REVIEW_INPUT.ratingValue);
});

test('each buildReviewSchema call returns independent objects', () => {
  // Detector guards mutate a returned object on purpose; shared or memoised
  // state would then make later tests check an already-corrupted node.
  const first = reviewSchema();
  const second = reviewSchema();

  first.review.reviewBody = 'MUTATED';
  first.brand.name = 'MUTATED';

  assert.notEqual(first, second);
  assert.equal(second.review.reviewBody, REVIEW_INPUT.reviewBody);
  assert.equal(second.brand.name, REVIEW_INPUT.productBrand);
  assert.deepEqual(findProductViolations(second), []);
});

test('the Product detector catches a reinjected Offer at depth, in arrays, and via multi-type @type', () => {
  const deep = reviewSchema();
  deep.review.itemOffered = { '@type': 'Offer', price: 399 };

  const arrayForm = reviewSchema();
  arrayForm.offers = [{ '@type': 'Offer', priceCurrency: 'USD', availability: 'https://schema.org/InStock' }];

  // '@type' may legally be an array; the old string-only check was blind here.
  const multiType = reviewSchema();
  multiType['@type'] = ['Product', 'AggregateOffer'];

  assert.ok(findProductMerchantMarkup(deep).some((hit) => hit.endsWith('.itemOffered')), 'nested Offer missed');
  assert.ok(findProductMerchantMarkup(arrayForm).some((hit) => hit.endsWith('.offers')), 'array-valued offers missed');
  assert.ok(
    findProductMerchantMarkup(multiType).some((hit) => hit.includes('@type=AggregateOffer')),
    'multi-type @type missed',
  );
  assert.equal(findProductMerchantMarkup(reviewSchema()).length, 0, 'detector fires on clean generator output');
});

test('the Product detector flags the policy fields named in the Search Console warning', () => {
  const regressed = reviewSchema();
  regressed.offers = {
    '@type': 'Offer',
    price: 399,
    priceCurrency: 'USD',
    availability: 'https://schema.org/InStock',
    shippingDetails: { '@type': 'OfferShippingDetails' },
    hasMerchantReturnPolicy: { '@type': 'MerchantReturnPolicy' },
  };

  const hits = findProductMerchantMarkup(regressed);
  for (const field of ['offers', 'price', 'priceCurrency', 'availability', 'shippingDetails', 'hasMerchantReturnPolicy']) {
    assert.ok(hits.some((hit) => hit.endsWith(`.${field}`)), `${field} missed by the detector`);
  }
  assert.ok(hits.some((hit) => hit.includes('@type=Offer')));
  assert.ok(hits.some((hit) => hit.includes('@type=OfferShippingDetails')));
  assert.ok(hits.some((hit) => hit.includes('@type=MerchantReturnPolicy')));
});

test('legitimate SoftwareApplication pricing is not read as a Product merchant listing', () => {
  // BaseHead.astro publishes the vendor's own subscription price under
  // SoftwareApplication. That is honest editorial data, not a ToolStep offer to
  // sell, so the Product-scoped checks must stay silent on it.
  const app = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Canva',
    applicationCategory: 'Design Tool',
    operatingSystem: 'Web, iOS, Android',
    offers: { '@type': 'Offer', price: '12.99', priceCurrency: 'USD' },
  };

  assert.deepEqual(findMerchantViolationsInNodes([app]), []);
  assert.deepEqual(findAppPricingViolations(app), []);

  const product = reviewSchema();
  product.offers = { '@type': 'Offer', price: 399, priceCurrency: 'USD' };
  assert.notDeepEqual(findMerchantViolationsInNodes([app, product]), [], 'Product rule went blind next to an app node');

  const dishonestApp = structuredClone(app);
  dishonestApp.offers.shippingDetails = { '@type': 'OfferShippingDetails' };
  assert.ok(findAppPricingViolations(dishonestApp).length > 0, 'shipping claim on app pricing missed');
  assert.ok(findShippingOrReturnClaims([dishonestApp]).length > 0, 'site-wide shipping guard missed it');
});

test('buildProductReviewMeta maps every entry into a merchant-free Product', (t) => {
  for (const entry of ENTRIES) {
    const meta = seoLib().buildProductReviewMeta(entry, 'Sarah Park', 'Senior Reviews Editor');
    const schema = meta.reviewSchema;

    assert.equal(schema['@type'], 'Product');
    assert.deepEqual(findProductViolations(schema), [], `${entry.slug}: merchant or rating claims leaked`);
    assert.equal(schema.name, entry.productName);
    assert.equal(schema.brand.name, entry.brand);
    assert.equal(schema.category, entry.category);
    assert.equal(schema.image, entry.heroImage);
    assert.equal(schema.review.reviewRating.ratingValue, entry.ratingValue);
    assert.equal(schema.review.reviewBody, entry.verdict);
    assert.equal(schema.review.author.name, 'Sarah Park');
    assert.equal(schema.review.author.jobTitle, 'Senior Reviews Editor');
    assert.equal(
      schema.review.url,
      `${SITE}/reviews/${entry.slug}/`,
      `${entry.slug}: review.url is not the page URL`,
    );
    t.diagnostic(`${entry.slug}: Product validated, ${Object.keys(schema).length} root fields`);
  }
});

test('buildProductReviewMeta maps dates without inventing a second review', () => {
  const updated = seoLib().buildProductReviewMeta(ENTRY_WITH_UPDATE, 'Sarah Park').reviewSchema;
  assert.equal(updated.review.datePublished, ENTRY_WITH_UPDATE.publishDate);
  assert.equal(updated.review.dateModified, ENTRY_WITH_UPDATE.updatedDate);

  const fallback = seoLib().buildProductReviewMeta(ENTRY_WITHOUT_UPDATE, 'Sarah Park').reviewSchema;
  assert.equal(fallback.review.datePublished, ENTRY_WITHOUT_UPDATE.publishDate);
  assert.equal(fallback.review.dateModified, ENTRY_WITHOUT_UPDATE.publishDate);

  // Exactly one Review per Product: a second node would fork the snippet.
  for (const schema of [updated, fallback]) {
    assert.equal(schema['@type'], 'Product');
    assert.ok(!Array.isArray(schema.review), 'review must stay a single nested Review');
    assert.equal(schema.review['@type'], 'Review');
  }
});

test('buildProductReviewMeta canonicalises to the absolute trailing-slash URL the pages resolve to', () => {
  for (const entry of ENTRIES) {
    const meta = seoLib().buildProductReviewMeta(entry, 'Sarah Park');

    assert.equal(meta.canonical, `${SITE}/reviews/${entry.slug}/`);
    assert.match(meta.canonical, /^https:\/\/www\.toolstep\.top\/reviews\/[^/]+\/$/);
    assert.equal(meta.reviewSchema.review.url, meta.canonical);
    assert.equal(meta.og.url, meta.canonical);
  }
});
