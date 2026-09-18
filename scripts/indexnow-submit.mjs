#!/usr/bin/env node
/**
 * IndexNow URL 提交脚本（ToolStep）
 *
 * 工作模式：
 * 1. 生产部署自动模式（Vercel production build 后自动执行）：
 *    对比本次构建产物 dist/sitemap 与线上 sitemap，向 IndexNow 提交
 *    新增 + 删除 的 URL；并额外对比 title/description/正文内容 hash manifest，
 *    提交「URL 不变但 SEO 字段或正文内容变化」的 URL（覆盖页面内容更新）。
 * 2. 手动模式（覆盖「页面重要修改」）：
 *    node scripts/indexnow-submit.mjs https://www.toolstep.top/reviews/xxx/ [more urls...]
 *    或     INDEXNOW_URLS="url1,url2" node scripts/indexnow-submit.mjs
 *
 * Manifest 机制：
 * - 构建后从 dist HTML 提取每个 URL 的 <title>、<meta name="description">
 *   与正文内容（剔除 script/style/nav/footer 后的可见文本），分别计算 sha256，
 *   生成 dist/indexnow-manifest.json 随部署发布。
 * - 下次构建时拉取线上 manifest（= 上一部署状态）做 diff：
 *   新增 ∪ 删除 ∪ title/desc/正文 hash 变化 → 提交；其余不提交。
 * - 纯 CSS/JS/layout 变化不改变 hash，不会触发提交（<style>/<link> 不进正文 hash）。
 * - 正文 hash 兼容发布：旧版 manifest（无正文 hash 字段）仍可用于 title/desc diff，
 *   正文 diff 在首个携带 hash 的部署落地后自动生效。
 * - 线上 manifest 缺失/损坏 → 安全降级为仅 URL diff；不会把全站当成更新页。
 * - 防滥用阀：hash 变化 URL 数超过阈值（默认 100 且占比 >50%）时只告警不提交。
 * - 可用 INDEXNOW_LIVE_MANIFEST_URL 覆盖线上 manifest 地址（仅测试用）。
 *
 * Key 解析顺序：INDEXNOW_KEY 环境变量 -> public/<key>.txt（文件名即 key）。
 * IndexNow 协议要求 key 文件必须公开可访问（非机密信息，与域名验证文件同类）。
 *
 * 安全阀：INDEXNOW_DRY_RUN=1 或 --dry-run 只打印不发送。
 * 自动模式下的任何失败都只告警、不阻断构建（postbuild 不应弄挂部署）。
 */
import { existsSync } from 'node:fs';
import { readFile, readdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SITE = 'https://www.toolstep.top';
const HOST = 'www.toolstep.top';
const API_ENDPOINT = process.env.INDEXNOW_API_ENDPOINT || 'https://api.indexnow.org/indexnow';
const LIVE_MANIFEST_URL =
	process.env.INDEXNOW_LIVE_MANIFEST_URL || `${SITE}/indexnow-manifest.json`;
const DIST_MANIFEST_PATH = path.resolve('dist', 'indexnow-manifest.json');
// 防滥用阀：hash 变化的 URL 同时满足绝对数与占比阈值才提交，否则视为异常只告警
const CHANGED_SUBMIT_ABS_LIMIT = Number(process.env.INDEXNOW_CHANGED_LIMIT || 100);
const CHANGED_SUBMIT_RATIO_LIMIT = 0.5;
const DRY_RUN = process.argv.includes('--dry-run') || process.env.INDEXNOW_DRY_RUN === '1';
const CHUNK_SIZE = 10000; // IndexNow 单次请求上限 10000 条

function log(...args) {
	console.log('[indexnow]', ...args);
}

const sha = (s) => createHash('sha256').update(s, 'utf8').digest('hex').slice(0, 32);

/** HTML 转义还原（仅 SEO 字段提取所需的最小集合） */
export function unescapeHtml(s) {
	return s
		.replace(/&amp;/g, '&')
		.replace(/&lt;/g, '<')
		.replace(/&gt;/g, '>')
		.replace(/&quot;/g, '"')
		.replace(/&#0?39;|&#x0?27;/g, "'");
}

/**
 * 提取页面「有意义的正文文本」用于内容 hash：
 * - 剔除 script/style/template/noscript（非正文，且会被构建指纹/内联脚本污染）
 * - 剔除 header/footer/nav（导航与页脚属站点级 layout，不随单页内容变化）
 * - 剔除 HTML 注释与所有标签，还原转义，压缩空白
 * - 内联 CSS 位于 <style> 内已被剔除；外链 CSS 不在 HTML 内 —— 样式变更不会触发正文 hash
 */
export function meaningfulText(html) {
	return unescapeHtml(
		html
			.replace(/<!--[\s\S]*?-->/g, ' ')
			.replace(/<(script|style|template|noscript)\b[^>]*>[\s\S]*?<\/\1>/gi, ' ')
			.replace(/<(header|footer|nav)\b[^>]*>[\s\S]*?<\/\1>/gi, ' ')
			.replace(/<[^>]+>/g, ' ')
	)
		.replace(/\s+/g, ' ')
		.trim();
}

/** 从 dist HTML 提取 <title>、<meta description> 与正文内容 hash；缺失字段记为空串 hash */
export function seoHashesFromHtml(html) {
	const tMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
	const dMatch =
		html.match(/<meta\s+name=["']description["']\s+content=["']([^"']*)["']/i) ||
		html.match(/<meta\s+content=["']([^"']*)["']\s+name=["']description["']/i);
	return {
		t: sha(unescapeHtml((tMatch?.[1] ?? '').replace(/\s+/g, ' ').trim())),
		d: sha(unescapeHtml((dMatch?.[1] ?? '').replace(/\s+/g, ' ').trim())),
		c: sha(meaningfulText(html)),
	};
}

/** 提取 XML 中的 <loc> 值 */
function extractLocs(xml) {
	return [...xml.matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/g)].map((m) => m[1]);
}

async function fetchText(url) {
	const res = await fetch(url, { redirect: 'follow' });
	if (!res.ok) throw new Error(`GET ${url} -> HTTP ${res.status}`);
	return res.text();
}

/** 读取本次构建产物中的全部 sitemap URL */
async function urlsFromDist() {
	const distDir = path.resolve('dist');
	const indexPath = path.join(distDir, 'sitemap-index.xml');
	if (!existsSync(indexPath)) {
		throw new Error('dist/sitemap-index.xml 不存在，请先执行 astro build');
	}
	const urls = new Set();
	for (const loc of extractLocs(await readFile(indexPath, 'utf8'))) {
		const rel = loc.startsWith(SITE) ? loc.slice(SITE.length) : null;
		const local = rel ? path.join(distDir, rel) : null;
		if (local && existsSync(local)) {
			for (const u of extractLocs(await readFile(local, 'utf8'))) urls.add(u);
		} else {
			for (const u of extractLocs(await fetchText(loc))) urls.add(u);
		}
	}
	return urls;
}

/** 读取当前线上（上一次部署）的 sitemap URL */
async function urlsFromLive() {
	const urls = new Set();
	for (const loc of extractLocs(await fetchText(`${SITE}/sitemap-index.xml`))) {
		if (loc.endsWith('.xml')) {
			for (const u of extractLocs(await fetchText(loc))) urls.add(u);
		}
	}
	return urls;
}

/** dist 中 URL 对应的 HTML 文件路径（trailingSlash: 'always' -> 目录/index.html） */
function distHtmlPath(url) {
	const u = new URL(url);
	const rel = u.pathname === '/' ? 'index.html' : path.join(u.pathname, 'index.html');
	const p = path.join(path.resolve('dist'), rel);
	return existsSync(p) ? p : null;
}

/** 构建本次 manifest：{ urls: { [url]: {t,d,c} } } */
async function buildManifest(urls) {
	const entries = {};
	for (const url of urls) {
		const file = distHtmlPath(url);
		if (!file) {
			entries[url] = { t: '', d: '', c: '' };
			continue;
		}
		entries[url] = seoHashesFromHtml(await readFile(file, 'utf8'));
	}
	return { version: 2, generatedAt: new Date().toISOString(), urls: entries };
}

/**
 * 拉取并校验线上 manifest（上一部署状态）。
 * 任何缺失/格式错误/字段异常都返回 null（安全降级），绝不抛错阻断构建。
 * 兼容 v1（仅 t/d）：c 字段允许缺失，缺失时正文 diff 自动跳过。
 */
async function fetchLiveManifest() {
	try {
		const raw = await fetchText(LIVE_MANIFEST_URL);
		const parsed = JSON.parse(raw);
		if (!parsed || typeof parsed !== 'object' || !parsed.urls || typeof parsed.urls !== 'object') {
			return null;
		}
		const map = new Map();
		for (const [url, v] of Object.entries(parsed.urls)) {
			if (
				typeof url !== 'string' ||
				!url.startsWith(SITE) ||
				!v ||
				typeof v.t !== 'string' ||
				typeof v.d !== 'string' ||
				(v.c !== undefined && typeof v.c !== 'string')
			) {
				return null; // 任意一条结构异常即整体降级，避免局部误判
			}
			map.set(url, v);
		}
		return map;
	} catch {
		return null;
	}
}

/**
 * 找出 URL 不变但 title/desc/正文 hash 变化的页面。
 * 正文 hash 仅在上一部署也携带 c 字段时参与比较（版本兼容，防止首个携带 hash 的部署全站误报）。
 */
export function detectChangedUrls(current, previous) {
	const changed = [];
	for (const [url, cur] of current) {
		const prev = previous.get(url);
		if (!prev) continue;
		if (prev.t !== cur.t || prev.d !== cur.d) {
			changed.push(url);
			continue;
		}
		if (prev.c !== undefined && cur.c !== undefined && prev.c !== cur.c) {
			changed.push(url);
		}
	}
	return changed;
}

/** 将 manifest 写入 dist，随本次部署发布（供下一次构建 diff） */
async function publishManifest(manifest) {
	if (DRY_RUN) {
		log('[dry-run] 跳过写入 dist/indexnow-manifest.json');
		return;
	}
	await writeFile(DIST_MANIFEST_PATH, JSON.stringify(manifest));
	log(`manifest 已写入 dist/indexnow-manifest.json（${Object.keys(manifest.urls).length} 个 URL）`);
}

/** 规范化手动传入的 URL：仅接受本站 URL，并按 trailingSlash: 'always' 策略补齐斜杠 */
export function normalizeManualUrl(raw) {
	let u;
	try {
		u = new URL(raw);
	} catch {
		return null;
	}
	if (u.origin !== SITE) return null;
	u.hash = '';
	if (u.pathname !== '/' && !u.pathname.endsWith('/')) u.pathname += '/';
	return u.toString();
}

async function submit(key, urlList) {
	const keyLocation = `${SITE}/${key}.txt`;
	for (let i = 0; i < urlList.length; i += CHUNK_SIZE) {
		const chunk = urlList.slice(i, i + CHUNK_SIZE);
		if (DRY_RUN) {
			log(`[dry-run] 将提交 ${chunk.length} 个 URL（endpoint: ${API_ENDPOINT}）：`);
			for (const url of chunk) console.log('  ', url);
			continue;
		}
		const res = await fetch(API_ENDPOINT, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json; charset=utf-8' },
			body: JSON.stringify({ host: HOST, key, keyLocation, urlList: chunk }),
		});
		// 200/202=已接受 400=请求格式错误 403=key 无效 422=无有效 URL 429=请求过多
		log(`提交 ${chunk.length} 个 URL -> HTTP ${res.status}${res.status === 200 || res.status === 202 ? '（已接受）' : ''}`);
		if (res.status >= 400) {
			const body = await res.text().catch(() => '');
			log(`非预期响应：${body.slice(0, 300)}`);
		}
	}
}

/** 读取 IndexNow key（INDEXNOW_KEY 环境变量 -> public/<key>.txt） */
async function resolveKey() {
	if (process.env.INDEXNOW_KEY) {
		return process.env.INDEXNOW_KEY.trim();
	}
	const publicDir = path.resolve('public');
	if (existsSync(publicDir)) {
		for (const file of await readdir(publicDir)) {
			if (/^[a-f0-9-]{8,128}\.txt$/i.test(file)) {
				const key = file.replace(/\.txt$/, '');
				try {
					const content = (await readFile(path.join(publicDir, file), 'utf8')).trim();
					if (content === key) return key;
				} catch {
					// 读取失败则跳过该候选文件
				}
			}
		}
	}
	return null;
}

async function main() {
	const argUrls = process.argv.slice(2).filter((a) => !a.startsWith('--'));
	const envUrls = (process.env.INDEXNOW_URLS || '').split(/[\s,]+/).filter(Boolean);
	const manualUrls = [...argUrls, ...envUrls]
		.map(normalizeManualUrl)
		.filter((u) => u !== null);

	const isVercelProduction = process.env.VERCEL_ENV === 'production';
	const forcedAuto = process.env.INDEXNOW_AUTO === '1';
	const autoMode = manualUrls.length === 0 && (isVercelProduction || forcedAuto);

	if (manualUrls.length === 0 && !autoMode) {
		log('跳过：非 Vercel 生产构建且未指定 URL。手动提交示例：');
		log('  node scripts/indexnow-submit.mjs https://www.toolstep.top/reviews/xxx/');
		return;
	}

	const key = await resolveKey();
	if (!key) {
		const message = '未找到 IndexNow key（INDEXNOW_KEY 环境变量或 public/<key>.txt）';
		if (autoMode && !forcedAuto) {
			log(`警告：${message}，本次部署跳过提交。`);
			return;
		}
		throw new Error(message);
	}
	const keyLocation = `${SITE}/${key}.txt`;
	if (!existsSync(path.resolve('public', `${key}.txt`))) {
		const message = `key 文件缺失：public/${key}.txt（IndexNow 要求该文件可从 ${keyLocation} 公开访问）`;
		if (autoMode && !forcedAuto) {
			log(`警告：${message}，本次部署跳过提交。`);
			return;
		}
		throw new Error(message);
	}

	if (!autoMode) {
		log(`手动提交 ${manualUrls.length} 个 URL`);
		await submit(key, manualUrls);
		return;
	}

	// 自动模式：diff 本次构建 sitemap 与线上 sitemap
	let next;
	let prev;
	try {
		next = await urlsFromDist();
		prev = await urlsFromLive();
	} catch (err) {
		log(`警告：获取 sitemap 失败（${err.message}），本次部署跳过自动提交。`);
		return;
	}

	const added = [...next].filter((u) => !prev.has(u));
	const removed = [...prev].filter((u) => !next.has(u));

	// Manifest diff：识别「URL 不变但 title/description/正文变化」的页面。
	// 任何异常都安全降级为仅新增/删除 diff，绝不阻断构建。
	const manifest = await buildManifest(next);
	const currentMap = new Map(Object.entries(manifest.urls).map(([u, v]) => [u, v]));
	const prevManifest = await fetchLiveManifest();
	let changed = [];
	let hasContentHash = false;
	if (prevManifest) {
		hasContentHash = [...prevManifest.values()].some((v) => v.c !== undefined);
		changed = detectChangedUrls(currentMap, prevManifest);
		if (
			changed.length > CHANGED_SUBMIT_ABS_LIMIT &&
			changed.length > prevManifest.size * CHANGED_SUBMIT_RATIO_LIMIT
		) {
			log(
				`警告：hash 变化 URL 达 ${changed.length} 个（占上一部署 ${prevManifest.size} 个的多数），` +
					'疑似生成器级别变更或 manifest 异常，本轮不自动提交这些更新页，请人工确认后手动提交。'
			);
			changed = [];
		}
	} else {
		log('线上 manifest 不可用（首次部署或格式异常），本轮降级为仅新增/删除 diff，manifest 已生成本次发布。');
	}

	const urlList = [...added, ...removed, ...changed];

	log(
		`diff 结果：线上 ${prev.size} 条，本次构建 ${next.size} 条，新增 ${added.length}，删除 ${removed.length}，` +
			`更新(title/desc/正文) ${changed.length}${prevManifest ? (hasContentHash ? '' : '（上一部署无正文 hash，正文 diff 未参与）') : '（降级模式，未检测）'}`
	);

	if (urlList.length === 0) {
		log('无 URL 变更，跳过提交。');
		await publishManifest(manifest);
		return;
	}

	log(`keyLocation: ${keyLocation}`);
	try {
		await submit(key, urlList);
	} catch (err) {
		// IndexNow API 网络失败等：仅告警，不让 postbuild 失败而弄挂部署
		log(`警告：IndexNow 提交失败（${err.message}），已跳过，不影响本次部署。`);
	}
	await publishManifest(manifest);
}

// 仅在直接执行本脚本时运行 main（被测试脚本 import 时不运行）
const thisFile = fileURLToPath(import.meta.url);
const invokedFile = process.argv[1] ? path.resolve(process.argv[1]) : '';
if (invokedFile === thisFile) {
	main().catch((err) => {
		// postbuild 不应阻断部署；真正的失败原因已在上方输出
		console.error('[indexnow] 错误:', err.message);
		process.exitCode = 1;
	});
}
