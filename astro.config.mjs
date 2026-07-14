// @ts-check

import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import { defineConfig, fontProviders } from 'astro/config';

// https://astro.build/config
export default defineConfig({
	site: 'https://www.toolstep.top',
	integrations: [
		mdx(),
		sitemap({
			serialize(item) {
				// Priority hierarchy: homepage > category hub > category pages > content pages
				if (item.url === 'https://www.toolstep.top/') {
					item.priority = 1.0;
				} else if (item.url === 'https://www.toolstep.top/category/') {
					item.priority = 0.9;
				} else if (item.url.startsWith('https://www.toolstep.top/category/')) {
					item.priority = 0.8;
				} else if (
					item.url === 'https://www.toolstep.top/reviews/' ||
					item.url === 'https://www.toolstep.top/compare/' ||
					item.url === 'https://www.toolstep.top/best/' ||
					item.url === 'https://www.toolstep.top/tools/'
				) {
					item.priority = 0.8;
				} else if (
					item.url.startsWith('https://www.toolstep.top/reviews/') ||
					item.url.startsWith('https://www.toolstep.top/compare/') ||
					item.url.startsWith('https://www.toolstep.top/best/')
				) {
					item.priority = 0.7;
				} else if (item.url.startsWith('https://www.toolstep.top/tools/')) {
					item.priority = 0.6;
				} else {
					item.priority = 0.5;
				}
				return item;
			},
		}),
	],
	image: {
		remotePatterns: [
			{ protocol: 'https', hostname: 'trae-api-cn.mchost.guru' },
			{ protocol: 'https', hostname: 'i.pravatar.cc' },
		],
	},
	fonts: [
		{
			provider: fontProviders.local(),
			name: 'Atkinson',
			cssVariable: '--font-atkinson',
			fallbacks: ['sans-serif'],
			options: {
				variants: [
					{
						src: ['./src/assets/fonts/atkinson-regular.woff'],
						weight: 400,
						style: 'normal',
						display: 'swap',
					},
					{
						src: ['./src/assets/fonts/atkinson-bold.woff'],
						weight: 700,
						style: 'normal',
						display: 'swap',
					},
				],
			},
		},
	],
});
