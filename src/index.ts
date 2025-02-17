export default {
	async fetch(request, env) {
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
			{ category: 'tech', country: 'us', url: 'https://rss.app/feeds/YOUR_TECH_US_FEED.xml' },
			{ category: 'tech', country: 'in', url: 'https://rss.app/feeds/YOUR_TECH_IN_FEED.xml' },
			{ category: 'tech', country: 'global', url: 'https://rss.app/feeds/YOUR_TECH_GLOBAL_FEED.xml' },
			{ category: 'sports', country: 'us', url: 'https://rss.app/feeds/YOUR_SPORTS_US_FEED.xml' },
			{ category: 'sports', country: 'global', url: 'https://rss.app/feeds/YOUR_SPORTS_GLOBAL_FEED.xml' },
			{ category: 'crypto', country: 'global', url: 'https://rss.app/feeds/YOUR_CRYPTO_FEED.xml' },
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
};
