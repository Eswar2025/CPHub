# Google-Style Q&A

Use these answers as practice material. Keep your spoken answers shorter than the written version when interviewing.

## 1. Explain your project in 60 seconds.

CP Hub is a high-throughput competitive programming metrics dashboard. The frontend is vanilla HTML, CSS, and JavaScript, and the backend is an Express.js API.

The user searches a Codeforces handle. The backend checks Redis or an in-memory cache, fetches real Codeforces data on a cache miss, combines it with mock LeetCode and CodeChef adapters, stores the profile in JSON, and returns normalized profile metrics to the dashboard.

The main backend features are TTL caching, Redis fallback, stale-cache fallback, rate limiting, metrics tracking, leaderboard generation, and safe local load testing with autocannon.

## 2. What was the main problem you solved?

The problem is that repeatedly calling external coding platform APIs can be slow and unreliable. If many users search the same handle, the backend should not keep calling Codeforces for the same data.

I solved this by adding a cache layer. The first request fetches data and stores it. The second request for the same handle can be served from cache, which is faster and reduces external API pressure.

## 3. Why did you use Redis?

Redis is a common shared cache. If the backend later runs on multiple Node.js processes or servers, they can all use the same Redis cache.

For this prototype, Redis is optional. If Redis is unavailable, the app falls back to an in-memory `Map`, so the demo still works without Docker or Redis running.

## 4. How does cache hit differ from cache miss?

A `cache_miss` means the profile was not found in the active cache. The backend fetches fresh platform data, normalizes it, saves it to storage, writes it to cache, and returns it.

A `cache_hit` means the profile already exists in Redis or memory. The backend can return it directly without calling Codeforces again.

## 5. How did you measure performance?

I used autocannon for local backend benchmarking. Before benchmarking the profile endpoint, I warmed the cache so the test measured cached backend responses instead of repeatedly hitting Codeforces.

The recorded local results in `docs/load-test-results.md` show:

- Cached `/api/profile/tourist`: 30.85 ms average latency, 639.3 requests/sec, 0 observed errors.
- `/api/metrics`: 36.05 ms average latency, 546.8 requests/sec, 0 observed errors.

These are local development numbers, not production deployment claims.

## 6. Why should we not load test Codeforces directly?

Codeforces is an external public API. Stress testing fresh fetches would create unnecessary external load and could trigger rate limits or failures.

The safe benchmark is the warmed cache path because it measures my backend's routing, cache lookup, response formatting, metrics, and logging without repeatedly calling Codeforces.

## 7. How would this behave with 10,000 users?

The current project is a local prototype, so I would not claim it is ready for 10,000 users as-is.

The design has a scaling path:

- Use Redis as a shared cache.
- Run multiple Express instances behind a load balancer.
- Move JSON storage to a database.
- Move rate limiting to Redis.
- Add queues or background jobs for profile refreshes.
- Add monitoring and structured logs.

With those changes, cached reads could scale much better than repeated fresh API calls.

## 8. How would you deploy this?

I would deploy the Express backend to a Node.js hosting platform or container service, run Redis as a managed service, and serve the frontend as static files through a CDN or static hosting provider.

I would set environment variables for `PORT`, `REDIS_URL`, `CACHE_TTL_SECONDS`, and rate-limit settings. I would also replace JSON storage with a real database before treating it as production.

## 9. What would you improve if you had more time?

I would add automated tests, move JSON storage to a database, use Redis for shared rate limiting, add background refresh jobs, add more real platform adapters, and improve observability with structured logs and dashboards.

I would also add error-specific UI states so the frontend can explain whether a problem came from validation, rate limiting, external API failure, or backend availability.

## 10. What part of the project are you most proud of?

I am most proud of making backend behavior visible in the UI. The demo clearly shows `cache_miss`, `cache_hit`, `fresh_fetch`, Redis or memory cache provider, response time, metrics, and leaderboard updates.

That makes the project more than a profile page. It becomes a demo of backend reliability and performance concepts in a way an interviewer can see immediately.

## 11. What happens if Codeforces fails?

If Codeforces fails and an older profile exists in `profiles.json`, the backend returns that stored profile with `source: "stale_cache"` and a warning.

If no stored profile exists, the backend returns a clean JSON error instead of crashing.

## 12. What happens if Redis fails?

The backend logs that Redis is unavailable and switches to the in-memory cache fallback. The app continues working, and profile responses show `cacheProvider: "memory"`.

This makes the local demo reliable even when Redis or Docker is not running.

## 13. Why use JSON storage?

JSON storage is enough for this prototype because it keeps the project easy to run and inspect. It stores profiles and metrics without requiring database setup.

For production, I would replace JSON with a database because JSON files are not ideal for concurrent writes or larger datasets.

## 14. Why use mock adapters?

Only Codeforces has the real public API integration in this prototype. LeetCode and CodeChef mock adapters demonstrate how the architecture could support more platforms without depending on unstable APIs or scraping.

The mock data is clearly marked with `source: "mock_data"` so it is not presented as real platform data.

## 15. What is the biggest trade-off?

The biggest trade-off is simplicity versus production readiness. The project is easy to run and explain, but JSON storage, in-memory rate limiting, and mock adapters would need upgrades for production.

That trade-off was intentional because the goal was a resume-ready prototype focused on backend concepts.
