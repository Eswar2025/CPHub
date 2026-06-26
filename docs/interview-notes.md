# Interview Notes

Initial placeholder for caching, TTL, stale fallback, and trade-off notes.

## Phase 1 Reliability Improvements

- Input validation trims profile handles, rejects empty values, and only allows letters, numbers, underscore, hyphen, and dot. Invalid handles return a clean `400` JSON error before reaching Codeforces.
- A simple in-memory IP rate limiter protects the API at 30 requests per minute per IP. Extra requests return `429` and increment `rateLimitedRequests`.
- Stale cache fallback returns the last stored profile from `profiles.json` when an external platform fetch fails and old data exists. This returns `source: "stale_cache"` and increments both `externalApiFailures` and `staleCacheUses`.
- API responses now have a consistent shape: success responses include `success`, `responseTimeMs`, and `data`; profile responses also include `source`. Error responses include `success`, `responseTimeMs`, and an `error` object with `code` and `message`.

## Phase 2 Redis Cache Upgrade

- Redis is better than only using in-memory cache when scaling because Redis can be shared by multiple backend processes, while a JavaScript `Map` only lives inside one running Node.js process.
- If Redis is not running or becomes unavailable, the app does not crash. The cache service logs `Redis unavailable. Using in-memory cache fallback.` and continues using the local Map cache.
- The fallback is useful for local development and demos because the backend still works even when Docker or Redis is not started.
- A `cache_miss` means the profile was not found in the active cache, so the backend fetched fresh platform data and stored it. A `cache_hit` means the profile was already available in the active cache and could be returned directly.
- TTL keeps cached competitive programming data from living forever. The default TTL is 300 seconds, which balances faster repeated reads with reasonably fresh profile data.
