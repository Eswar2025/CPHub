# Load Test Results

This file records real local benchmark results. Do not invent or edit benchmark numbers unless you run a new benchmark.

## Safety Note

Do not repeatedly load test fresh Codeforces fetches. Fresh profile requests may call the external Codeforces API, and this project should not stress external public services.

For benchmarking, warm the cache first, then benchmark cached backend responses.

## Start Backend For Benchmarking

From the backend folder, raise the local rate limit so autocannon is not blocked:

```powershell
cd C:\Users\varap\OneDrive\Desktop\high_throughput_cp_page\high_throughput_cp_page\high_throughput_cp_page\backend
$env:PORT=5003
$env:RATE_LIMIT_MAX_REQUESTS=100000
$env:RATE_LIMIT_WINDOW_MS=60000
npm start
```

Redis is optional. If Redis is not running, the app uses in-memory cache fallback.

## Warm Cache

Run this once before benchmarking `/api/profile/tourist`:

```powershell
curl.exe http://localhost:5003/api/profile/tourist
```

Confirm the next request returns `source: "cache_hit"`:

```powershell
curl.exe http://localhost:5003/api/profile/tourist
```

## Autocannon Commands

From the backend folder:

```powershell
npm run bench:profile
npm run bench:metrics
```

Equivalent direct commands:

```powershell
npx autocannon -c 20 -d 10 http://localhost:5003/api/profile/tourist
npx autocannon -c 20 -d 10 http://localhost:5003/api/metrics
```

## Recorded Benchmark Context

| Field | Value |
| --- | --- |
| Date | 2026-06-26 |
| Machine | Local Windows development machine |
| Backend Port | 5003 |
| Tool | autocannon |
| Duration | 10 seconds |
| Connections | 20 |
| Cache State | Warmed cache before profile benchmark |

The profile endpoint was warmed before benchmarking. This benchmark mainly measures cached backend responses and does not repeatedly stress the external Codeforces API.

These results are local development benchmarks, not production deployment numbers.

## Benchmark 1: Cached Profile Endpoint

Command used:

```powershell
npm run bench:profile
```

Endpoint:

```txt
GET http://localhost:5003/api/profile/tourist
```

Results:

| Metric | Value |
| --- | ---: |
| Duration | 10.06s |
| Connections | 20 |
| Total Requests | ~6,000 |
| Average Latency | 30.85 ms |
| 50% Latency | 30 ms |
| 97.5% Latency | 42 ms |
| 99% Latency | 47 ms |
| Max Latency | 52 ms |
| Average Requests/sec | 639.3 req/sec |
| Average Bytes/sec | 832 kB/sec |
| Errors | 0 observed |
| Timeouts | 0 observed |

## Benchmark 2: Metrics Endpoint

Command used:

```powershell
npm run bench:metrics
```

Endpoint:

```txt
GET http://localhost:5003/api/metrics
```

Results:

| Metric | Value |
| --- | ---: |
| Duration | 10.03s |
| Connections | 20 |
| Total Requests | ~5,000 |
| Average Latency | 36.05 ms |
| 50% Latency | 35 ms |
| 97.5% Latency | 56 ms |
| 99% Latency | 62 ms |
| Max Latency | 72 ms |
| Average Requests/sec | 546.8 req/sec |
| Average Bytes/sec | 328 kB/sec |
| Errors | 0 observed |
| Timeouts | 0 observed |

## Interpretation

The cached profile endpoint handled around 639 requests/sec locally with an average latency of around 30.85 ms. This shows that once profile data is cached, repeated requests can be served quickly without repeatedly calling the external Codeforces API.

The metrics endpoint handled around 546 requests/sec locally with an average latency of around 36.05 ms. This confirms that the backend can serve internal monitoring data efficiently in the local benchmark setup.

## Template For Future Runs

Fill this table only with measured numbers from a real local run.

| Date | Environment | Endpoint | Cache Provider | Connections | Duration | Avg Latency | P95/P97.5 Latency | Requests/sec | Errors | Notes |
| --- | --- | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| TODO | Local | `/api/profile/tourist` | TODO: memory/redis | 20 | 10s | TODO | TODO | TODO | TODO | cache warmed first |
| TODO | Local | `/api/metrics` | N/A | 20 | 10s | TODO | TODO | TODO | TODO | backend-only endpoint |
