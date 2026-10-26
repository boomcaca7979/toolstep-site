/**
 * Build-time internal link normalisation (FIX-1, 2026-10-25)
 *
 * Background
 * ----------
 * `src/data/canonical-overrides.mjs` declares 27 duplicate-intent pairs whose
 * source page canonicalises to a `/reviews/` target and is excluded from the
 * sitemap. The canonical tag and the sitemap exclusion already consume that map
 * (see BaseHead consumers in `src/pages/{best,compare,alternatives}/[slug].astro`
 * and `astro.config.mjs`), but internal `<a href>` still pointed at the source
 * URL: 304 anchors across the built site linked to pages the site itself tells
 * Google not to index.
 *
 * This integration rewrites those anchors at build time so the rendered HTML
 * links to the canonical target. It is deliberately *not* a second mapping:
 * every target is read from CANONICAL_OVERRIDES at build time.
 *
 * Why not rewrite all 27 pairs
 * ----------------------------
 * Only pairs whose target is already indexed in GSC (snapshot 2026-09-14) and
 * whose source/target share the same intent are listed here. The remaining 12
 * pairs stay untouched on purpose:
 *
 *   4 pairs  source indexed / target NOT indexed  -> no Google-selected
 *            canonical evidence, must not point links at an unindexed page.
 *   8 pairs  neither URL indexed (4 /alternatives/ targets created 2026-07-30
 *            plus 4 /compare/ pairs with zero exposure) -> nothing to gain,
 *            no evidence to justify the change.
 *
 * One pair was dropped from the map instead of being rewritten:
 * /compare/chatgpt-vs-copilot/ -> /reviews/chatgpt-vs-copilot/ was a genuine
 * intent mismatch (source: Microsoft Copilot / Microsoft 365; target: GitHub
 * Copilot / coding). The override was removed on 2026-10-25, so that page no
 * longer appears in CANONICAL_OVERRIDES and its anchors deliberately keep
 * pointing at /compare/chatgpt-vs-copilot/.
 *
 * Scope guarantees: this hook only edits `href` attributes of `<a>` tags in the
 * generated HTML. It never touches <link rel="canonical">, JSON-LD, page
 * content, URLs, sitemap membership or page count.
 */

import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { CANONICAL_OVERRIDES } from '../data/canonical-overrides.mjs';

/** Source paths whose anchors are rewritten to their canonical target. */
export const LINK_REWRITE_PAIRS = [
	// /compare/ -> /reviews/ : target indexed on 2026-09-14
	'/compare/claude-vs-chatgpt/',
	'/compare/chatgpt-vs-gemini/',
	'/compare/cursor-vs-windsurf/',
	'/compare/expressvpn-vs-nordvpn/',
	'/compare/figma-vs-sketch/',
	'/compare/github-copilot-vs-cursor/',
	'/compare/grammarly-vs-prowritingaid/',
	'/compare/midjourney-vs-stable-diffusion/',
	'/compare/notion-vs-confluence/',
	'/compare/notion-vs-obsidian/',
	'/compare/slack-vs-teams/',
	// /best/ -> /reviews/ : target indexed on 2026-09-14
	'/best/best-ergonomic-chair-under-500/',
	'/best/best-office-mechanical-keyboard/',
	'/best/best-standing-desk-under-300/',
	'/best/best-standing-desk-for-home-office/',
];

const SITE_ORIGIN = 'https://www.toolstep.top';
const ANCHOR_TAG = /<a\b[^>]*>/g;
const HREF_ATTR = /href="([^"]*)"/;

/** Normalise an href to a trailing-slash pathname, or return null if external. */
function toPath(value) {
	if (!value || value.startsWith('#') || value.startsWith('mailto:') || value.startsWith('tel:')) return null;
	let pathname = value;
	if (pathname.startsWith(SITE_ORIGIN)) pathname = pathname.slice(SITE_ORIGIN.length);
	else if (/^[a-z]+:/i.test(pathname) || pathname.startsWith('//')) return null;
	pathname = pathname.split('#')[0].split('?')[0];
	if (!pathname.startsWith('/')) return null;
	if (!pathname.endsWith('/')) pathname += '/';
	return pathname;
}

async function* walkHtml(dir) {
	const entries = await readdir(dir, { withFileTypes: true });
	for (const entry of entries) {
		const full = join(dir, entry.name);
		if (entry.isDirectory()) yield* walkHtml(full);
		else if (extname(entry.name) === '.html') yield full;
	}
}

export default function canonicalLinkRewrite() {
	return {
		name: 'canonical-link-rewrite',
		hooks: {
			'astro:build:done': async ({ dir, logger }) => {
				if (process.env.CANONICAL_LINK_REWRITE === 'off') {
					logger.info('canonical-link-rewrite: disabled via CANONICAL_LINK_REWRITE=off');
					return;
				}
				const allow = new Set(LINK_REWRITE_PAIRS);
				for (const source of allow) {
					if (!CANONICAL_OVERRIDES[source]) {
						throw new Error(`canonical-link-rewrite: "${source}" is not a key of CANONICAL_OVERRIDES`);
					}
				}

				let filesChanged = 0;
				let anchorsRewritten = 0;
				const perSource = new Map();

				for await (const file of walkHtml(fileURLToPath(dir))) {
					const html = await readFile(file, 'utf8');
					let touched = 0;
					const next = html.replace(ANCHOR_TAG, (tag) => {
						const match = HREF_ATTR.exec(tag);
						if (!match) return tag;
						const pathname = toPath(match[1]);
						if (!pathname || !allow.has(pathname)) return tag;
						const target = CANONICAL_OVERRIDES[pathname];
						touched += 1;
						perSource.set(pathname, (perSource.get(pathname) ?? 0) + 1);
						return tag.replace(HREF_ATTR, `href="${target}"`);
					});
					if (touched > 0) {
						await writeFile(file, next, 'utf8');
						filesChanged += 1;
						anchorsRewritten += touched;
					}
				}

				logger.info(
					`canonical-link-rewrite: ${anchorsRewritten} anchor(s) in ${filesChanged} file(s), ${perSource.size}/${LINK_REWRITE_PAIRS.length} pairs used`,
				);
			},
		},
	};
}
