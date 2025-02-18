/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Bind resources to your worker in `wrangler.jsonc`. After adding bindings, a type definition for the
 * `Env` object can be regenerated with `npm run cf-typegen`.
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

export default {
	async fetch(request, env) {
		if (!env.RSS_FEED_CACHE) {
			return new Response('KV Namespace not found', { status: 500 });
		}

		const url = new URL(request.url);
		const category = url.searchParams.get('category') || 'general';
		const country = url.searchParams.get('country') || 'global';

		// KV Storage Keys
		const SPECIFIC_FEED_KEY = `rss_feed:${category}:${country}`;
		const GLOBAL_FEED_KEY = `rss_feed:${category}:global`;

		// Try fetching country-specific feed first
		let rssData = await env.RSS_FEED_CACHE.get(SPECIFIC_FEED_KEY);

		// If not found, fallback to global feed
		if (!rssData) {
			rssData = await env.RSS_FEED_CACHE.get(GLOBAL_FEED_KEY);
		}

		// If still not found, return error
		if (!rssData) {
			return new Response('No RSS feed available for this category.', { status: 404 });
		}

		return new Response(rssData, {
			headers: {
				'Content-Type': 'application/xml',
				'Cache-Control': 'public, max-age=600',
			},
		});
	},

	async scheduled(event, env) {
		const feeds = [
			{ category: 'tech', country: 'us', url: 'https://rss.app/feeds/tzCUQZ9WynNvVWwk.xml' },
			{ category: 'tech', country: 'in', url: 'https://rss.app/feeds/thfLJNJu5h8jxOSy.xml' },
			{ category: 'tech', country: 'global', url: 'https://rss.app/feeds/tbIDeyra4ZnaA36V.xml' },
			{ category: 'sports', country: 'us', url: 'https://rss.app/feeds/twElsFlCKj2veocC.xml' },
			{ category: 'sports', country: 'global', url: 'https://rss.app/feeds/tcxlazmrJnWn8KLb.xml' },
			{ category: 'crypto', country: 'global', url: 'https://rss.app/feeds/tdj9XXOgnIXNxXXX.xml' },
		];

		for (const feed of feeds) {
			const response = await fetch(feed.url);
			if (response.ok) {
				const data = await response.text();
				const CACHE_KEY = `rss_feed:${feed.category}:${feed.country}`;
				await env.RSS_FEED_CACHE.put(CACHE_KEY, data, { expirationTtl: 600 });
			}
		}
	},
} satisfies ExportedHandler<Env>;
