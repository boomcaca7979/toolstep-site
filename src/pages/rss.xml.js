import { getCollection } from 'astro:content';
import rss from '@astrojs/rss';
import { SITE_DESCRIPTION } from '../consts';
import { reviews } from '../data/reviews';
import { bestData } from '../data/best';
import { compareData } from '../data/compare';
import { alternativesData } from '../data/alternatives';

export async function GET(context) {
	const posts = await getCollection('blog');

	// Blog posts carry their own pubDate; the curated content sources do not,
	// so they share a single consistent pubDate so they sort near the top.
	const curatedPubDate = new Date();

	const blogItems = posts.map((post) => ({
		title: post.data.title,
		description: post.data.description,
		pubDate: post.data.pubDate,
		link: `/blog/${post.id}/`,
	}));

	const reviewItems = reviews.map((review) => ({
		title: review.title,
		description: review.desc,
		pubDate: curatedPubDate,
		link: review.href,
	}));

	const bestItems = bestData.map((entry) => ({
		title: entry.title,
		description: entry.description,
		pubDate: curatedPubDate,
		link: `/best/${entry.slug}/`,
	}));

	const compareItems = compareData.map((entry) => ({
		title: entry.title,
		description: entry.description,
		pubDate: curatedPubDate,
		link: `/compare/${entry.slug}/`,
	}));

	const alternativeItems = alternativesData.map((entry) => ({
		title: entry.title,
		description: entry.description,
		pubDate: curatedPubDate,
		link: `/alternatives/${entry.slug}/`,
	}));

	const items = [...blogItems, ...reviewItems, ...bestItems, ...compareItems, ...alternativeItems].sort(
		(a, b) => b.pubDate.valueOf() - a.pubDate.valueOf()
	);

	return rss({
		title: 'ToolStep — Latest Reviews, Best Picks & Comparisons',
		description: SITE_DESCRIPTION,
		site: context.site,
		items,
	});
}
