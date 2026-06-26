# Interview Notes

These notes explain the backend design choices in CP Hub. The project is a prototype, so the strongest interview framing is: "I built a working, explainable system that demonstrates cache design, fallback behavior, metrics, and safe benchmarking without over-engineering."

## One-Line Explanation

CP Hub is a high-throughput competitive programming metrics dashboard that uses an Express.js backend, optional Redis caching, memory fallback, Codeforces API integration, JSON storage, and a vanilla JavaScript dashboard to show fast cached profile lookups and backend metrics.

## Why Caching?

Without caching, every repeated profile search could call Codeforces again. That makes responses slower, wastes external API calls, and increases the chance of failures or rate limits.

Caching lets the backend serve repeated searches from Redis or memory. In the demo, the first `tourist` request should show `cache_miss`, and the second request should show `cache_hit`.

Good interview answer:

```txt
I used caching because competitive programming profile data does not need second-by-second freshness. A cached profile response makes repeated reads faster and avoids unnecessary external API calls.
```

## Why Redis?

Redis is useful because it is an external cache service. Multiple backend instances can share the same Redis cache, while a JavaScript `Map` only exists inside one Node.js process.

In this project, Redis is optional. If it connects successfully, the cache provider is `redis`. If it is not running, the backend falls back to memory.

Good interview answer:

```txt
Redis is a better scaling path than a local Map because it can be shared across server instances and survives independently of one Node.js process. For this prototype, I made Redis optional so local development still works.
```

## Why Memory Fallback?

The memory fallback makes the app reliable for demos and local development. Docker or Redis might not be running, but the backend should still start and serve requests.

The fallback is intentionally simple: an in-memory `Map` stores cached profiles with expiry timestamps.

Trade-off: memory fallback is not shared between processes and is cleared when the backend restarts.

## Why TTL?

TTL means cached data expires after a fixed time. The default TTL is 300 seconds.

This balances speed and freshness:

- Short enough that profile data is not stale forever.
- Long enough that repeated demo/search traffic does not keep calling Codeforces.

Good interview answer:

```txt
I used a 300-second TTL because CP profile data changes slowly. TTL lets repeated reads stay fast while still allowing the system to refresh data periodically.
```

## Why Rate Limiting?

Rate limiting protects the backend from too many requests from one IP. This matters because search endpoints can eventually call external APIs.

Current default:

```txt
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=30
```

For load testing, the limit can be raised with environment variables so autocannon does not get blocked.

Good interview answer:

```txt
I added rate limiting to protect both my backend and the external Codeforces API. It prevents accidental request floods and returns a clean 429 JSON error.
```

## Why Promise.allSettled?

The backend fetches Codeforces, LeetCode mock, and CodeChef mock adapters together.

`Promise.all()` would reject the whole operation if one adapter fails. `Promise.allSettled()` lets the backend keep successful platform data and decide what to do about failures.

Good interview answer:

```txt
I used Promise.allSettled because one platform failure should not automatically break the whole profile response. It lets the system return partial data or stale data more gracefully.
```

## Why Stale Cache Fallback?

If an external API fails and an older profile exists in `profiles.json`, returning old data is better than returning nothing.

The backend returns:

```txt
source: "stale_cache"
warning: "External API failed. Showing last available stored data."
```

It also increments:

- `externalApiFailures`
- `staleCacheUses`

Good interview answer:

```txt
Stale fallback improves availability. If Codeforces fails temporarily, the user can still see the last known profile data with a warning instead of a hard error.
```

## Why JSON Storage Instead Of A Database?

This is a fast prototype. JSON storage keeps the project easy to run and explain without database setup.

JSON files store:

- `backend/data/profiles.json`
- `backend/data/metrics.json`

Trade-off: JSON files are not ideal for high-concurrency writes or production-scale data. A real deployment should move this to PostgreSQL, MongoDB, or another database.

Good interview answer:

```txt
I used JSON storage because the prototype needed simple persistence without database setup. The frontend and service boundaries are still structured so a database can replace JSON later.
```

## What Happens If Codeforces API Fails?

The Codeforces adapter throws an error if Codeforces returns a failed HTTP response or a non-OK API response.

Then the profile service:

1. Records the external API failure.
2. Checks `profiles.json` for an older stored profile.
3. Returns `stale_cache` with a warning if old data exists.
4. Returns a clean JSON error if no useful data exists.

This is the availability story of the backend.

## What Happens If Redis Fails?

The cache service attempts to connect to Redis using `REDIS_URL`.

If Redis is unavailable:

```txt
Redis unavailable. Using in-memory cache fallback.
```

The backend continues using the memory cache. API responses include:

```txt
cacheProvider: "memory"
```

If Redis connects:

```txt
Redis connected. Using Redis cache.
```

Profile responses include:

```txt
cacheProvider: "redis"
```

## How Would You Scale This?

Scaling path:

1. Keep Redis as a shared cache across multiple Express instances.
2. Move profile and metrics storage from JSON files to a database.
3. Move rate limiting into Redis so limits are shared across instances.
4. Add a background worker to refresh popular handles instead of refreshing during user requests.
5. Add queues for external API fetches if traffic grows.
6. Add structured logs, monitoring, and alerts.
7. Add tests for adapters, services, and API responses.
8. Deploy behind a reverse proxy or load balancer.

Important honesty:

```txt
The current project is not a production distributed system. It is a local prototype that demonstrates the design pieces needed for one.
```

## What Are The Trade-Offs?

Caching:

- Pro: faster repeated reads and fewer external calls.
- Con: data can be temporarily stale.

Redis:

- Pro: shared cache for scaling.
- Con: another service to run and monitor.

Memory fallback:

- Pro: demo and development resilience.
- Con: not shared across processes and lost on restart.

TTL:

- Pro: balances speed and freshness.
- Con: users may see data that is up to the TTL old.

JSON storage:

- Pro: simple and easy to inspect.
- Con: not suitable for high-concurrency production writes.

Mock adapters:

- Pro: demonstrate adapter architecture quickly.
- Con: only Codeforces is real data.

## Phase 1 Reliability Improvements

- Input validation trims profile handles, rejects empty values, and only allows letters, numbers, underscore, hyphen, and dot. Invalid handles return a clean `400` JSON error before reaching Codeforces.
- A simple in-memory IP rate limiter protects the API at 30 requests per minute per IP by default. Extra requests return `429` and increment `rateLimitedRequests`.
- Stale cache fallback returns the last stored profile from `profiles.json` when an external platform fetch fails and old data exists.
- API responses have a consistent shape: success responses include `success`, `responseTimeMs`, and `data`; profile responses also include `source` and `cacheProvider`.

## Phase 2 Redis Cache Upgrade

- Redis is used when available.
- The backend automatically falls back to memory if Redis is unavailable.
- Responses show the active `cacheProvider`.
- TTL remains configurable with `CACHE_TTL_SECONDS`.

## Phase 3 Frontend Demo Polish

- The frontend stays vanilla HTML/CSS/JavaScript.
- The page shows profile overview, cache badges, platform cards, metrics, leaderboard, recent searches, and project info.
- The frontend uses `http://localhost:5003/api`.

## Phase 4 Load Testing

- autocannon is used for local benchmarking.
- Benchmarks focus on warmed cached responses.
- The docs warn against repeatedly load testing fresh Codeforces fetches.

## Short Closing Answer

If asked what the project proves:

```txt
It proves I can build a working Express backend around an external API with caching, fallback behavior, metrics, rate limiting, and a frontend that makes those backend behaviors visible during a demo.
```
