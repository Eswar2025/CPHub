# Demo Script

This script is for a 4-6 minute walkthrough. Keep the pace calm and show the backend behavior through the UI.

## 1. Start The Backend

Open PowerShell:

```powershell
cd C:\Users\varap\OneDrive\Desktop\high_throughput_cp_page\high_throughput_cp_page\high_throughput_cp_page\backend
npm start
```

What to say:

```txt
This starts the Express API on port 5003. If Redis is available, the backend uses Redis. If Redis is not running, it automatically falls back to an in-memory cache.
```

## 2. Open The Frontend

Open another PowerShell terminal:

```powershell
cd C:\Users\varap\OneDrive\Desktop\high_throughput_cp_page\high_throughput_cp_page\high_throughput_cp_page\frontend
python -m http.server 8080
```

Open:

```txt
http://localhost:8080
```

What to say:

```txt
The frontend is a vanilla HTML, CSS, and JavaScript dashboard. It calls the backend at http://localhost:5003/api.
```

## 3. Show The Hero And Search Area

Point out:

- Product name: CP Hub
- API Online chip
- Redis Cache chip
- Rate Limited chip
- Load Tested chip
- Codeforces API chip

What to say:

```txt
The UI is intentionally simple, but it exposes backend concepts like cache provider, source, response time, metrics, and leaderboard.
```

## 4. Search `tourist`

Type or use the existing example handle:

```txt
tourist
```

Click `Search`.

Expected result:

- Profile overview loads.
- Platform cards load.
- Source badge should usually show `Cache Miss` on the first request.
- Cache provider shows `Redis` or `Memory`.

What to say:

```txt
The first request is usually a cache miss. The backend validates the handle, calls Codeforces, combines the result with mock adapters, stores the profile in JSON, writes it to cache, and returns it to the dashboard.
```

## 5. Search `tourist` Again

Click `Search` again or click `tourist` in recent searches.

Expected result:

- Source badge should show `Cache Hit`.
- Response time should usually be faster than the fresh request.

What to say:

```txt
Now the same profile is served from cache, so the backend avoids repeatedly calling Codeforces.
```

## 6. Click Refresh

Click `Refresh`.

Expected result:

- Source badge should show `Fresh Fetch`.

What to say:

```txt
Refresh intentionally ignores the cache. This is useful when a user wants the latest available data instead of the cached copy.
```

## 7. Show Metrics

Open `Actions` and click `Load Metrics`.

Point out:

- totalRequests
- cacheHits
- cacheMisses
- freshFetches
- staleCacheUses
- externalApiFailures
- rateLimitedRequests
- averageResponseTimeMs

What to say:

```txt
The backend tracks its own behavior, so the demo can show whether requests are hitting cache, missing cache, being refreshed, or being rate limited.
```

## 8. Show Leaderboard

Open `Actions` and click `Load Leaderboard`.

What to say:

```txt
The leaderboard is generated from profiles saved in JSON storage. It ranks by best rating first, then total solved.
```

## 9. Explain Benchmark Results

Open `docs/load-test-results.md` or summarize:

```txt
For local cached-response benchmarking, the warmed profile endpoint handled about 639 requests/sec with 30.85 ms average latency and 0 observed errors. The metrics endpoint handled about 546 requests/sec with 36.05 ms average latency and 0 observed errors.
```

Important:

```txt
These are local development results, not production claims. The profile cache was warmed first so the benchmark did not repeatedly stress Codeforces.
```

## 10. Explain Architecture Briefly

Use this flow:

```txt
Browser UI -> Express API -> Rate Limiter -> Cache -> Codeforces API -> JSON Storage -> Dashboard
```

What to say:

```txt
The main idea is to protect external APIs and make repeated reads fast. Redis improves scaling, memory fallback improves demo reliability, TTL controls freshness, and stale-cache fallback improves availability when Codeforces fails.
```

## 11. Final Closing Line

```txt
This project is not meant to be a huge production app. It is a focused prototype that demonstrates backend reliability, caching, metrics, and performance trade-offs in a way that is easy to demo and explain.
```
