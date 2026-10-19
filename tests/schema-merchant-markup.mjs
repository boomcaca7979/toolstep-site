// Shared JSON-LD structured-data checks.
// Not a test file: the runner only discovers *.test.mjs, so this stays inert.
//
// Two shapes must not be conflated:
//   * Product + sale claims (Offer, price, stock, shipping, returns) — the
//     published bug. ToolStep reviews products but never sells them, and such a
//     node makes Google read an editorial page as a merchant listing.
//   * SoftwareApplication + the vendor's own subscription price — honest data
//     the site publishes deliberately. Flagging it would be a false positive, so
//     the merchant rules are scoped to Product nodes only.

const PRODUCT_MERCHANT_FIELDS = new Set([
  'offers',
  'shippingDetails',
  'hasMerchantReturnPolicy',
  'itemOffered',
  'aggregateOffer',
  'price',
  'priceCurrency',
  'availability',
  'priceSpecification',
  'priceRange',
]);

const PRODUCT_MERCHANT_TYPES = new Set(['Offer', 'AggregateOffer', 'OfferShippingDetails', 'MerchantReturnPolicy']);

// ToolStep publishes one named editor's verdict per product, so a crowd
// aggregate on a Product node could only be invented.
const PRODUCT_RATING_FIELDS = new Set(['aggregateRating', 'reviewCount', 'ratingCount']);
const PRODUCT_RATING_TYPES = new Set(['AggregateRating']);

// Shipping/return claims are the fields Google asked for and the site cannot
// honestly answer; they must stay absent from every node type.
const SHIPPING_RETURN_FIELDS = new Set(['shippingDetails', 'hasMerchantReturnPolicy']);

// The shape BaseHead.astro emits for software pricing today. Widening it should
// be a deliberate edit here, not an accident in a page template.
const APP_OFFER_ALLOWED_FIELDS = new Set(['@context', '@type', 'price', 'priceCurrency']);
const APP_OFFER_ALLOWED_TYPES = new Set(['Offer']);

function walk(node, label, visit) {
  if (Array.isArray(node)) {
    node.forEach((child, i) => walk(child, `${label}[${i}]`, visit));
    return;
  }
  if (!node || typeof node !== 'object') return;
  visit(node, label);
  for (const [key, value] of Object.entries(node)) walk(value, `${label}.${key}`, visit);
}

/** '@type' is a string or, legally, an array of strings — both must be read. */
export function typeNamesOf(node) {
  const value = node && node['@type'];
  if (typeof value === 'string') return [value];
  if (Array.isArray(value)) return value.filter((entry) => typeof entry === 'string');
  return [];
}

export function isProductNode(node) {
  return typeNamesOf(node).includes('Product');
}

function collect(root, fieldSet, typeSet, label) {
  const hits = [];
  walk(root, label, (node, nodeLabel) => {
    for (const typeName of typeNamesOf(node)) {
      if (typeSet.has(typeName)) hits.push(`${nodeLabel}(@type=${typeName})`);
    }
    for (const key of Object.keys(node)) {
      if (fieldSet.has(key)) hits.push(`${nodeLabel}.${key}`);
    }
  });
  return hits;
}

/** Sale claims anywhere inside a Product subtree, including arrays and multi-type nodes. */
export function findProductMerchantMarkup(root) {
  return collect(root, PRODUCT_MERCHANT_FIELDS, PRODUCT_MERCHANT_TYPES, '<product>');
}

/** Invented crowd ratings anywhere inside a Product subtree. */
export function findProductRatingFabrication(root) {
  return collect(root, PRODUCT_RATING_FIELDS, PRODUCT_RATING_TYPES, '<product>');
}

export function findProductViolations(root) {
  return [...findProductMerchantMarkup(root), ...findProductRatingFabrication(root)];
}

/**
 * Page-level check: only nodes typed as Product are held to the merchant rules.
 * A page may still carry SoftwareApplication offers without failing here.
 */
export function findMerchantViolationsInNodes(nodes) {
  const hits = [];
  for (const node of nodes) {
    if (!isProductNode(node)) continue;
    for (const hit of findProductViolations(node)) hits.push(`Product "${node.name ?? '?'}": ${hit}`);
  }
  return hits;
}

/** Honest-shape check for the software pricing markup the site publishes on purpose. */
export function findAppPricingViolations(appNode) {
  const offers = Array.isArray(appNode.offers) ? appNode.offers : [appNode.offers];
  const hits = [];
  for (const offer of offers) {
    if (!offer || typeof offer !== 'object') continue;
    for (const typeName of typeNamesOf(offer)) {
      if (!APP_OFFER_ALLOWED_TYPES.has(typeName)) hits.push(`offers(@type=${typeName} is not allow-listed)`);
    }
    for (const key of Object.keys(offer)) {
      if (!APP_OFFER_ALLOWED_FIELDS.has(key)) hits.push(`offers.${key}`);
    }
  }
  hits.push(...collect(appNode, SHIPPING_RETURN_FIELDS, new Set(), '<app>'));
  return hits;
}

/** Shipping/return claims are forbidden on every node type, not just Product. */
export function findShippingOrReturnClaims(nodes) {
  const hits = [];
  for (const node of nodes) hits.push(...collect(node, SHIPPING_RETURN_FIELDS, new Set(), '<node>'));
  return hits;
}

export function jsonLdBlocks(html) {
  return [...html.matchAll(/<script[^>]*application\/ld\+json[^>]*>(.*?)<\/script>/gs)].map((m) => m[1]);
}

/** Parse every JSON-LD block on a page; a malformed block fails the caller's assertion. */
export function parseJsonLdNodes(html, assert, fileLabel) {
  const nodes = [];
  for (const [index, text] of jsonLdBlocks(html).entries()) {
    let parsed;
    assert.doesNotThrow(() => {
      parsed = JSON.parse(text);
    }, `${fileLabel}: JSON-LD block ${index} is not valid JSON`);
    if (parsed && Array.isArray(parsed['@graph'])) nodes.push(...parsed['@graph']);
    else if (Array.isArray(parsed)) nodes.push(...parsed);
    else nodes.push(parsed);
  }
  return nodes.filter((node) => node && typeof node === 'object');
}
