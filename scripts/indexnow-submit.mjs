#!/usr/bin/env node
/**
 * IndexNow URL 提交脚本（ToolStep）
 *
 * 工作模式：
 * 1. 生产部署自动模式（Vercel production build 后自动执行）：
 *    对比本次构建产物 dist/sitemap 与线上 sitemap，向 IndexNow 提交
 *    新增 + 删除 的 URL（覆盖「新增页面」与「页面删除/失效」）。
 * 2. 手动模式（覆盖「页面重要修改」）：
 *    node scripts/indexnow-submit.mjs https://www.toolstep.top/reviews/xxx/ [more urls...]
 *    或     INDEXNOW_URLS="url1,url2" node scripts/indexnow-submit.mjs
 *
 * Key 解析顺序：INDEXNOW_KEY 环境变量 -> public/<key>.txt（文件名即 key）。
 * IndexNow 协议要求 key 文件必须公开可访问（非机密信息，与域名验证文件同类）。
 *
 * 安全阀：INDEXNOW_DRY_RUN=1 或 --dry-run 只打印不发送。
 * 自动模式下的任何失败都只告警、不阻断构建（postbuild 不应弄挂部署）。
 */
import { existsSync } from 'node:fs';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';

const SITE = 'https://www.toolstep.top';
const HOST = 'www.toolstep.top';
const API_ENDPOINT = process.env.INDEXNOW_API_ENDPOINT || 'https://api.indexnow.org/indexnow';
const DRY_RUN = process.argv.includes('--dry-run') || process.env.INDEXNOW_DRY_RUN === '1';
const CHUNK_SIZE = 10000; // IndexNow 单次请求上限 10000 条

function log(...args) {
	console.log('[indexnow]', ...args);
}

/** 从 public/ 目录按 IndexNow 规则识别 key 文件（文件名即 key，内容须等于文件名） */
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

/** 规范化手动传入的 URL：仅接受本站 URL，并按 trailingSlash: 'always' 策略补齐斜杠 */
function normalizeManualUrl(raw) {
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
	const urlList = [...added, ...removed];

	log(`sitemap 对比：线上 ${prev.size} 条，本次构建 ${next.size} 条，新增 ${added.length}，删除 ${removed.length}`);

	if (urlList.length === 0) {
		log('无 URL 变更，跳过提交。');
		return;
	}

	log(`keyLocation: ${keyLocation}`);
	await submit(key, urlList);
}

main().catch((err) => {
	// postbuild 不应阻断部署；真正的失败原因已在上方输出
	console.error('[indexnow] 错误:', err.message);
	process.exitCode = 1;
});
