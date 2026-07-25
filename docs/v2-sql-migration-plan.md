# CP Hub v2 SQL Migration Plan

## Goal

Migrate CP Hub from JSON file persistence to PostgreSQL while keeping the existing v1 backend behavior stable during the transition. Database foundation can be added before the route migration, but v1 JSON-backed behavior should remain active until the replacement is intentionally implemented and tested.

Phase `v2-prisma-foundation` adds the Prisma schema and database health checks but does not replace JSON storage yet.

Phase `v2-student-apis` adds Prisma-backed student and platform-handle APIs under `/api/v2/students`. It still does not replace v1 profile, leaderboard, or metrics JSON storage.

## Why JSON Was Okay For The Prototype

JSON files were a good v1 choice because the first goal was to build a working, explainable backend quickly. They made local setup simple, avoided database provisioning, and kept stored profiles and metrics easy to inspect during demos.

That trade-off is acceptable for a prototype, but JSON files are not ideal for concurrent writes, structured queries, batch imports, filtering by student attributes, historical snapshots, or production deployment.

## Why SQL Is Needed For v2

CP Hub v2 is student-centered instead of handle-centered. The system needs durable records for students, platform handles, profile snapshots, scoring results, and system metrics. SQL is a better fit because it supports relationships, constraints, filtering, indexing, and safe updates.

PostgreSQL also gives CP Hub a clear production path while keeping Redis focused on caching.

## Recommended Database

**PostgreSQL**

Reasons:

- Strong relational model for students, handles, snapshots, scores, and metrics.
- Easy deployment options on managed platforms.
- Works well with Node.js and Prisma.
- Reliable source of truth for college-level records and reporting.

## Recommended ORM

**Prisma**

Prisma is a good next step because it gives a clear schema file, migrations, generated client, and readable JavaScript service code. It should be introduced during the implementation phase, not in this documentation-only phase.

## Deployment Database Options

- Neon PostgreSQL.
- Supabase PostgreSQL.
- Render PostgreSQL.

Choose one managed PostgreSQL provider for the first v2 implementation. Keep the connection string in a backend environment variable.

## Environment Variables

New v2 environment variable:

```txt
DATABASE_URL
```

Existing environment variables that remain:

```txt
REDIS_URL
CACHE_TTL_SECONDS
RATE_LIMIT_WINDOW_MS
RATE_LIMIT_MAX_REQUESTS
```

## Deployment Impact

- Vercel frontend remains mostly unchanged because the browser can keep calling the Render backend API.
- Render backend needs the new `DATABASE_URL` variable.
- Upstash Redis remains as the cache layer.
- PostgreSQL becomes the source of truth for student records, platform handles, profile snapshots, and scores.
- JSON files can remain temporarily during migration, but should be phased out after DB-backed services are verified.

## Migration Steps

1. Add Prisma and a PostgreSQL schema to the backend.
2. Create the `Student` table.
3. Create the `PlatformHandle` table.
4. Create the `ProfileSnapshot` table.
5. Create a `Metric` table or keep the existing metrics service separately until metrics need historical reporting.
6. Replace `profiles.json` reads/writes with a DB-backed storage service.
7. Keep Redis cache before DB/API fetch, so repeated profile reads still check cache first.
8. Add a seed script for demo students and common handles.
9. Update deployment environment variables on Render.
10. Test locally and redeploy the Render backend.

## Cache And Fetch Order

The v2 backend should preserve the v1 cache-first behavior:

```txt
Request
  -> validate student/handle/platform input
  -> check Redis or memory cache
  -> on cache hit, return cached normalized profile
  -> on cache miss, read last known DB record if needed
  -> fetch selected enabled platform adapters
  -> write ProfileSnapshot rows to PostgreSQL
  -> write short-lived result to Redis
  -> return response
```

If an external API fails, the backend should use the latest DB snapshot or stale cache fallback where available and clearly mark the response. Upstash Redis remains a cache, not the durable source of truth.
