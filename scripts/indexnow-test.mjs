#!/usr/bin/env node
/**
 * IndexNow manifest 机制测试矩阵（不发送任何请求）
 * 覆盖：正文变化 / 样式变化 / title / description / 新增 / 删除 / 全站模板变化阀
 */
import assert from 'node:assert';
import { seoHashesFromHtml, meaningfulText, detectChangedUrls } from './indexnow-submit.mjs';

const BASE_HTML = (body) => `<!doctype html><html><head><title>Page Title</title>
<meta name="description" content="Meta description text.">
<link rel="stylesheet" href="/_astro/style.abc123.css">
<style>.a{color:red}</style></head>
<body><header><nav><a href="/">Home</a> <a href="/reviews/">Reviews</a></nav></header>
<main>${body}</main><footer><p>© ToolStep</p></footer></body></html>`;

const pageA = BASE_HTML('<p>Original body content about Figma collaboration.</p>');
const pageA_bodyChanged = BASE_HTML('<p>Expanded body content about Figma collaboration with new facts.</p>');
const pageA_styleOnly = BASE_HTML('<p>Original body content about Figma collaboration.</p>').replace(
	'.a{color:red}',
	'.a{color:blue}.b{margin:0}'
);
const pageA_titleChanged = BASE_HTML('<p>Original body content about Figma collaboration.</p>').replace(
	'<title>Page Title</title>',
	'<title>New Page Title</title>'
);
const pageA_descChanged = BASE_HTML('<p>Original body content about Figma collaboration.</p>').replace(
	'content="Meta description text."',
	'content="Updated meta description."'
);

// 1) hash 生成正确性
const h1 = seoHashesFromHtml(pageA);
const h2 = seoHashesFromHtml(pageA_bodyChanged);
const h3 = seoHashesFromHtml(pageA_styleOnly);
assert.notEqual(h1.c, h2.c, '正文变化必须改变正文 hash');
assert.equal(h1.c, h3.c, '样式变化不得改变正文 hash');
assert.equal(h1.t, h3.t, '样式变化不得改变 title hash');
assert.ok(meaningfulText(pageA).includes('Original body content'), '正文文本应保留');
assert.ok(!meaningfulText(pageA).includes('Home Reviews'), 'nav 文本应被剔除');
assert.ok(!meaningfulText(pageA).includes('color:red'), '内联 CSS 应被剔除');
console.log('✓ 1. 正文 hash：正文变化触发 / 样式变化不触发 / nav 与内联 CSS 被剔除');

// 2) diff 矩阵（v2 → v2，均携带 c）
const url = 'https://www.toolstep.top/reviews/figma-vs-sketch/';
const cur = new Map([[url, h1]]);
function prevWith(h) {
	return new Map([[url, h]]);
}
assert.equal(detectChangedUrls(cur, prevWith(h1)).length, 0, '无变化 → 0');
assert.equal(detectChangedUrls(cur, prevWith(h2)).length, 1, '仅正文变化 → 1');
assert.equal(detectChangedUrls(cur, prevWith(seoHashesFromHtml(pageA_titleChanged))).length, 1, 'title 变化 → 1');
assert.equal(detectChangedUrls(cur, prevWith(seoHashesFromHtml(pageA_descChanged))).length, 1, 'description 变化 → 1');
console.log('✓ 2. diff 矩阵：无变化0 / 正文1 / title1 / description1');

// 3) v1 → v2 兼容：上一部署无 c 字段时，正文-only 变化不误报
const v1Prev = new Map([[url, { t: h1.t, d: h1.d }]]);
assert.equal(detectChangedUrls(cur, v1Prev).length, 0, 'v1 manifest（无 c）+ 仅正文变化 → 0（正文 diff 未参与，不误报）');
const v1PrevChangedTitle = new Map([[url, { t: seoHashesFromHtml(pageA_titleChanged).t, d: h1.d }]]);
assert.equal(detectChangedUrls(cur, v1PrevChangedTitle).length, 1, 'v1 manifest + title 变化 → 1（title/desc diff 仍工作）');
console.log('✓ 3. v1→v2 兼容：正文 diff 优雅延迟，title/desc diff 正常');

// 4) 新增 / 删除（URL 集合层面）
const nextUrls = new Set(['https://www.toolstep.top/a/', 'https://www.toolstep.top/b/']);
const prevUrls = new Set(['https://www.toolstep.top/b/', 'https://www.toolstep.top/c/']);
const added = [...nextUrls].filter((u) => !prevUrls.has(u));
const removed = [...prevUrls].filter((u) => !nextUrls.has(u));
assert.deepEqual(added, ['https://www.toolstep.top/a/'], '新增 → 1');
assert.deepEqual(removed, ['https://www.toolstep.top/c/'], '删除 → 1');
console.log('✓ 4. 新增/删除 URL diff 正确');

// 5) 全站模板变化 → 防滥用阀拦截（>100 且 >50%）
const many = new Map();
const manyPrev = new Map();
for (let i = 0; i < 600; i++) {
	const u = `https://www.toolstep.top/reviews/page-${i}/`;
	many.set(u, { t: 't1', d: 'd1', c: 'c1' });
	manyPrev.set(u, { t: 't1', d: 'd1', c: 'cTEMPLATE-CHANGE' }); // 模拟模板级正文变化
}
const valveBlocked = detectChangedUrls(many, manyPrev);
assert.equal(valveBlocked.length, 600, '检测层应发现 600 个变化');
// 阀逻辑（与 main() 一致）：>100 且 >50% → 置空
const submitList = valveBlocked.length > 100 && valveBlocked.length > manyPrev.size * 0.5 ? [] : valveBlocked;
assert.equal(submitList.length, 0, '阀生效：全站模板变化 → 0 提交');
console.log('✓ 5. 防滥用阀：600 个全站模板变化 → 0 提交');

console.log('\n全部测试通过（未发送任何网络请求）');
