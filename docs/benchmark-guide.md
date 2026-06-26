# Benchmark Guide

This guide explains how to load test the project safely and how to read the results.

## cache_miss

`cache_miss` means the backend did not find the requested profile in the active cache.

For `/api/profile/tourist`, a miss usually causes the backend to fetch fresh Codeforces data, combine it with mock platform adapters, save the profile, and put it into cache.

## cache_hit

`cache_hit` means the backend found the profile in Redis or the in-memory Map cache.

This is the safe path to load test because repeated requests should be served by your own backend cache instead of repeatedly calling Codeforces.

## Why Cached Endpoint Is Safe To Load Test

After warming the cache, `/api/profile/tourist` should return `source: "cache_hit"`.

That means autocannon is mostly testing:

- Express routing
- cache lookup
- JSON response formatting
- metrics and logging overhead

It is not repeatedly stressing the external Codeforces API.

## Why External API Should Not Be Stress Tested

Fresh profile requests can call Codeforces. Sending many fresh fetches can create unnecessary load on an external public API and may trigger failures or rate limits.

Do not benchmark refresh endpoints like:

```txt
POST /api/profile/tourist/refresh
```

Do not repeatedly clear cache just to force fresh fetches.

## How To Interpret Autocannon Results

Average latency is the average time each request takes. Lower is better.

P95 latency means 95 percent of requests completed at or below that time. It is useful because average latency can hide slow outliers.

Requests/sec means how many requests the backend handled each second during the test. Higher is better, as long as errors stay low.

Errors should usually be `0` for this local benchmark. If errors appear, check whether the backend was running, the cache was warmed, or the rate limiter blocked the test.

## Recommended Local Benchmark Flow

1. Start backend with a high local rate limit.
2. Warm `/api/profile/tourist` once.
3. Confirm the second profile request returns `cache_hit`.
4. Run `npm run bench:profile`.
5. Run `npm run bench:metrics`.
6. Copy measured numbers into `docs/load-test-results.md`.
