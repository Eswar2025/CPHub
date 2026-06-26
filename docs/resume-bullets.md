# Resume Bullets

Use 3-5 of these depending on resume space.

- Built CP Hub, a vanilla JavaScript and Express.js dashboard that aggregates competitive programming profile metrics with real Codeforces API integration.
- Implemented Redis caching with automatic in-memory fallback and 300-second TTL expiry to reduce repeated external API calls during profile searches.
- Added backend reliability features including input validation, IP-based rate limiting, stale-cache fallback, consistent JSON responses, and request metrics tracking.
- Designed an adapter-based profile aggregation flow using `Promise.allSettled()` to combine real Codeforces data with clearly marked mock LeetCode and CodeChef adapters.
- Created a metrics dashboard and leaderboard backed by JSON file storage for a fast prototype with visible cache hits, misses, fresh fetches, and response-time tracking.
- Added autocannon benchmark scripts and documented local cached-response load test results, including average latency, requests/sec, and observed errors.

## Short Version

- Built a JavaScript/Express.js competitive programming metrics dashboard with Codeforces API integration, Redis caching, memory fallback, rate limiting, metrics, and local load testing.

## Interview-Friendly Version

- Built CP Hub, a resume-focused backend-heavy prototype that demonstrates caching, fallback behavior, external API integration, rate limiting, metrics, and benchmark analysis through a clean vanilla JavaScript dashboard.
