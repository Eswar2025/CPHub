# CP Hub

**High-Throughput Competitive Programming Metrics Dashboard**

CP Hub is a JavaScript-based full-stack prototype that searches competitive programming handles, fetches public Codeforces profile data, caches repeated requests, stores searched profiles locally, and displays profile, leaderboard, and backend metrics in a clean vanilla dashboard.

The project is intentionally simple on the frontend and backend architecture, but it demonstrates practical backend concepts: API design, caching, TTL, Redis fallback, rate limiting, stale data fallback, concurrent adapter calls, metrics, and safe local benchmarking.

## Problem Statement

Coding clubs, internship screeners, hackathon teams, and student communities may need to check competitive programming profiles for many handles. Calling external APIs repeatedly can be slow, unreliable, and wasteful.

CP Hub solves this by placing an Express API between the browser and external coding platform data. The backend fetches profile data once, caches it, tracks system behavior, and serves repeated searches quickly from Redis or memory.

## Features

- Search a Codeforces handle from a vanilla HTML/CSS/JavaScript dashboard.
- Fetch real Codeforces data using `user.info` and `user.status`.
- Calculate unique solved problems from accepted Codeforces submissions.
- Include mock LeetCode and CodeChef adapters marked with `source: "mock_data"`.
- Fetch platform adapters concurrently with `Promise.allSettled()`.
- Cache profile responses with Redis when available.
- Automatically fall back to an in-memory `Map` cache when Redis is unavailable.
- Use a 300-second TTL for cached profile data by default.
- Return visible cache states: `cache_miss`, `cache_hit`, `fresh_fetch`, and `stale_cache`.
- Store searched profiles and metrics in JSON files under `backend/data/`.
- Generate a leaderboard from stored profiles.
- Track backend metrics such as cache hits, misses, fresh fetches, stale cache uses, rate-limited requests, and average response time.
- Protect the API with simple IP-based rate limiting.
- Provide autocannon scripts for safe cached-response load testing.

## Tech Stack

- Frontend: HTML, CSS, JavaScript, Tailwind CSS CDN
- Backend: Node.js, Express.js, JavaScript
- Cache: Redis when available, in-memory `Map` fallback when Redis is unavailable
- Storage: JSON files in `backend/data/`
- Benchmarking: autocannon
- Redis local setup: Docker Compose

## Architecture Flow

```txt
Browser UI
  -> Express API
  -> Rate Limiter
  -> Cache Layer: Redis or in-memory Map
  -> Platform Adapters: Codeforces real API + LeetCode/CodeChef mock adapters
  -> JSON Storage
  -> Dashboard, Leaderboard, and Metrics
```

Normal profile search:

```txt
User searches handle
  -> frontend calls GET /api/profile/:handle
  -> backend validates handle
  -> backend checks cache
  -> cache hit returns immediately
  -> cache miss fetches platform data
  -> profile is normalized, stored, cached, and returned
```

Failure path:

```txt
External API fails
  -> backend checks profiles.json
  -> old profile exists: return source "stale_cache" with warning
  -> no old profile exists: return clean JSON error
```

## API Endpoints

Base URL:

```txt
http://localhost:5003/api
```

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/api/health` | Check backend health |
| `GET` | `/api/profile/:handle` | Fetch profile using cache when possible |
| `POST` | `/api/profile/:handle/refresh` | Ignore cache and fetch fresh profile data |
| `GET` | `/api/leaderboard` | Return leaderboard from stored profiles |
| `GET` | `/api/metrics` | Return backend metrics |

Profile responses include:

- `success`
- `source`
- `cacheProvider`
- `responseTimeMs`
- `data`
- optional `warning`

## Environment Variables

Defaults are shown in `backend/.env.example`:

```txt
PORT=5003
REDIS_URL=redis://localhost:6379
CACHE_TTL_SECONDS=300
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=30
```

This project reads environment variables from the terminal process. If you create a `.env` file, load those values into your shell before running the backend.

## Install Backend Dependencies

```powershell
cd C:\Users\varap\OneDrive\Desktop\high_throughput_cp_page\high_throughput_cp_page\high_throughput_cp_page\backend
npm install
```

## Run Backend Without Redis

Redis is optional. If Redis is not running, the backend automatically uses the in-memory `Map` cache.

```powershell
cd C:\Users\varap\OneDrive\Desktop\high_throughput_cp_page\high_throughput_cp_page\high_throughput_cp_page\backend
npm start
```

Expected terminal behavior:

```txt
Redis unavailable. Using in-memory cache fallback.
High Throughput CP API running on http://localhost:5003
```

## Run Backend With Redis

Start Redis from the project root:

```powershell
cd C:\Users\varap\OneDrive\Desktop\high_throughput_cp_page\high_throughput_cp_page\high_throughput_cp_page
docker compose up -d redis
```

Start the backend:

```powershell
cd C:\Users\varap\OneDrive\Desktop\high_throughput_cp_page\high_throughput_cp_page\high_throughput_cp_page\backend
npm start
```

Expected terminal behavior:

```txt
Redis connected. Using Redis cache.
High Throughput CP API running on http://localhost:5003
```

Stop Redis:

```powershell
cd C:\Users\varap\OneDrive\Desktop\high_throughput_cp_page\high_throughput_cp_page\high_throughput_cp_page
docker compose down
```

## Open Frontend

Use VS Code Live Server on `frontend/index.html`, or run:

```powershell
cd C:\Users\varap\OneDrive\Desktop\high_throughput_cp_page\high_throughput_cp_page\high_throughput_cp_page\frontend
python -m http.server 8080
```

Then open:

```txt
http://localhost:8080
```

The frontend is configured to call:

```txt
http://localhost:5003/api
```

## Quick API Test Commands

```powershell
curl.exe http://localhost:5003/api/health
curl.exe http://localhost:5003/api/profile/tourist
curl.exe http://localhost:5003/api/profile/tourist
curl.exe -X POST http://localhost:5003/api/profile/tourist/refresh
curl.exe http://localhost:5003/api/leaderboard
curl.exe http://localhost:5003/api/metrics
```

Expected cache behavior:

- First profile request: `source` is usually `cache_miss`.
- Second same profile request: `source` should be `cache_hit`.
- Refresh request: `source` should be `fresh_fetch`.
- Profile responses include `cacheProvider` as `redis` or `memory`.

## Demo Flow

1. Start the backend with `npm start`.
2. Open the frontend at `http://localhost:8080`.
3. Search `tourist` once to show profile data and `cache_miss`.
4. Search `tourist` again to show `cache_hit`.
5. Click `Refresh` to show `fresh_fetch`.
6. Open `Actions` and click `Load Metrics`.
7. Open `Actions` and click `Load Leaderboard`.
8. Explain the architecture flow: Browser UI -> Express API -> Cache -> Codeforces API -> JSON Storage -> Dashboard.

## Benchmark Summary

Benchmarks are local development measurements from `docs/load-test-results.md`. They are not production claims.

The profile endpoint was warmed before benchmarking, so the test measured cached backend responses and avoided repeatedly stressing the external Codeforces API.

| Endpoint | Duration | Connections | Avg Latency | Requests/sec | Errors |
| --- | ---: | ---: | ---: | ---: | ---: |
| `GET /api/profile/tourist` warmed cache | 10.06s | 20 | 30.85 ms | 639.3 req/sec | 0 observed |
| `GET /api/metrics` | 10.03s | 20 | 36.05 ms | 546.8 req/sec | 0 observed |

Run benchmark scripts from the backend folder:

```powershell
npm run bench:profile
npm run bench:metrics
```

Before benchmarking `/api/profile/tourist`, warm the cache:

```powershell
curl.exe http://localhost:5003/api/profile/tourist
curl.exe http://localhost:5003/api/profile/tourist
```

Do not repeatedly benchmark fresh fetches or refresh endpoints because those can call Codeforces.

## Limitations

- Only Codeforces is connected to a real external API.
- LeetCode and CodeChef are mock adapters for architecture demonstration.
- JSON file storage is suitable for a prototype, not high-concurrency production writes.
- The rate limiter is in-memory, so it is not shared across multiple backend instances.
- The frontend is intentionally vanilla and does not include authentication or admin workflows.
- Benchmark results are from a local machine and should not be treated as deployed production performance.

## Future Improvements

- Replace JSON storage with PostgreSQL or MongoDB.
- Move rate limiting to Redis so limits are shared across backend instances.
- Add background refresh jobs for popular handles.
- Add more real platform adapters where official APIs are available.
- Add tests for services, adapters, cache fallback, and controllers.
- Add deployment configuration for a real hosting environment.
- Add observability with structured logs and external monitoring.

## Resume Bullets

- Built CP Hub, a vanilla JavaScript and Express.js dashboard for competitive programming profile metrics with real Codeforces API integration.
- Implemented Redis caching with automatic in-memory fallback and TTL-based expiry to reduce repeated external API calls.
- Added input validation, IP-based rate limiting, stale-cache fallback, and consistent JSON responses for better backend reliability.
- Designed adapter-based profile aggregation using `Promise.allSettled()` so mock platform failures do not break the full response.
- Added leaderboard generation, backend metrics, cache-source badges, and autocannon load testing for cached endpoint performance analysis.
