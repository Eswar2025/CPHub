# High Throughput CP Page

A vanilla HTML/CSS/JavaScript dashboard with an Express.js backend for competitive programming profile metrics.

The backend fetches real Codeforces data, combines it with mock LeetCode and CodeChef adapters, caches profile responses, stores searched profiles in JSON, builds a leaderboard, and exposes system metrics.

## Tech Stack

- Frontend: HTML, CSS, JavaScript, Tailwind CDN
- Backend: Node.js, Express.js, JavaScript
- Cache: Redis when available, in-memory Map fallback when Redis is unavailable
- Storage: JSON files in `backend/data/`

## Backend Environment Variables

Create `backend/.env` manually if you want, or set these values in your terminal.

Defaults:

```txt
PORT=5003
REDIS_URL=redis://localhost:6379
CACHE_TTL_SECONDS=300
```

The sample file is:

```txt
backend/.env.example
```

Note: this project reads environment variables from the terminal process. If you create a `.env` file, load those values in your shell before running the backend.

## Install Backend Dependencies

```powershell
cd C:\Users\varap\OneDrive\Desktop\high_throughput_cp_page\high_throughput_cp_page\high_throughput_cp_page\backend
npm install
```

## Run Without Redis

Redis is optional. If Redis is not running, the backend automatically uses the in-memory Map cache.

```powershell
cd C:\Users\varap\OneDrive\Desktop\high_throughput_cp_page\high_throughput_cp_page\high_throughput_cp_page\backend
npm start
```

Expected terminal log:

```txt
Redis unavailable. Using in-memory cache fallback.
High Throughput CP API running on http://localhost:5003
```

To run on port `5000`:

```powershell
$env:PORT=5000
npm start
```

## Run With Redis Using Docker Compose

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

Expected terminal log:

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

If the frontend points to `http://localhost:5000/api`, run the backend with `PORT=5000` or update `frontend/app.js` to match the backend port.

## Backend Test Commands

Use the backend port you started. These examples use `5003`.

```powershell
curl.exe http://localhost:5003/api/health
curl.exe http://localhost:5003/api/profile/tourist
curl.exe http://localhost:5003/api/profile/tourist
curl.exe -X POST http://localhost:5003/api/profile/tourist/refresh
curl.exe http://localhost:5003/api/leaderboard
curl.exe http://localhost:5003/api/metrics
```

Expected cache behavior:

- first profile request: `source` is `cache_miss`
- second same profile request: `source` is `cache_hit`
- refresh request: `source` is `fresh_fetch`
- profile responses include `cacheProvider` as either `redis` or `memory`

## Benchmarking

Load testing should focus on cached backend responses. Do not repeatedly benchmark fresh Codeforces fetches or the refresh endpoint.

Start backend with a higher local rate limit:

```powershell
cd C:\Users\varap\OneDrive\Desktop\high_throughput_cp_page\high_throughput_cp_page\high_throughput_cp_page\backend
$env:PORT=5003
$env:RATE_LIMIT_MAX_REQUESTS=100000
$env:RATE_LIMIT_WINDOW_MS=60000
npm start
```

Warm the profile cache:

```powershell
curl.exe http://localhost:5003/api/profile/tourist
curl.exe http://localhost:5003/api/profile/tourist
```

The second response should show `source: "cache_hit"`.

Run benchmarks from the backend folder:

```powershell
npm run bench:profile
npm run bench:metrics
```

Record measured numbers in:

```txt
docs/load-test-results.md
```

## Demo Flow

1. Start the backend:

```powershell
cd C:\Users\varap\OneDrive\Desktop\high_throughput_cp_page\high_throughput_cp_page\high_throughput_cp_page\backend
npm start
```

2. Open the frontend with VS Code Live Server, or run:

```powershell
cd C:\Users\varap\OneDrive\Desktop\high_throughput_cp_page\high_throughput_cp_page\high_throughput_cp_page\frontend
python -m http.server 8080
```

Then open:

```txt
http://localhost:8080
```

3. Search `tourist` to show `cache_miss`, profile cards, platform cards, leaderboard, and metrics.

4. Search `tourist` again to show `cache_hit`.

5. Click `Refresh` to show `fresh_fetch`.

6. Click `Load Leaderboard` and `Load Metrics` during the walkthrough to explain JSON storage, cache counters, response time, and backend reliability.
