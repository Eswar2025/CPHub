# CP Hub v2 API Plan

This document defines v2 endpoints. It does not change the current v1 API.

Phase `v2-student-apis` has implemented the student and platform-handle foundation under `/api/v2/students`. Phase `v2-selected-refresh` has implemented selected-platform Codeforces refresh and PostgreSQL `ProfileSnapshot` storage. v2 leaderboard migration and scoring endpoints are still pending.

## Student Endpoints

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/api/v2/students` | Implemented foundation: list students with platform handles |
| `POST` | `/api/v2/students` | Implemented foundation: create a student record |
| `GET` | `/api/v2/students/:id` | Implemented foundation: get one student with handles, latest snapshots, and score |
| `PUT` | `/api/v2/students/:id` | Implemented foundation: update student details |
| `DELETE` | `/api/v2/students/:id` | Implemented foundation: delete a student record |
| `GET` | `/api/v2/students/:id/snapshots` | Implemented: list latest profile snapshots for a student, optionally filtered by platform |

## Platform Handle Endpoints

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `POST` | `/api/v2/students/:id/handles` | Implemented foundation: add or upsert a platform-specific handle for a student |
| `PUT` | `/api/v2/students/:id/handles/:platform` | Implemented foundation: update, enable, disable, or replace a platform handle |

## Refresh Endpoints

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `POST` | `/api/v2/students/:id/refresh` | Implemented: refresh selected enabled platforms for one student and store snapshots |
| `POST` | `/api/v2/students/bulk-refresh` | Pending: refresh selected enabled platforms for a batch of students |

## Leaderboard Endpoints

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/api/leaderboard?platform=codeforces` | Codeforces leaderboard |
| `GET` | `/api/leaderboard?platform=leetcode` | LeetCode leaderboard |
| `GET` | `/api/leaderboard?platform=codechef` | CodeChef leaderboard |
| `GET` | `/api/leaderboard?platform=overall` | Overall coding-score leaderboard |

## Metrics And Score Endpoints

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/api/metrics` | Current backend/system metrics |
| `GET` | `/api/score/:studentId` | Latest explainable coding score for one student |

## Selected-Platform Refresh

The refresh endpoint supports refreshing one platform or all enabled platforms. Example request body:

```json
{
  "platform": "codeforces"
}
```

If `platform` is omitted, the backend refreshes all enabled handles for the student. Disabled handles are skipped. Codeforces is the only real refresh integration in this phase; successful Codeforces refreshes store normalized `ProfileSnapshot` rows in PostgreSQL.

LeetCode and CodeChef are intentionally not refreshed through external APIs yet. If enabled, they return skipped results:

```json
{
  "platform": "leetcode",
  "status": "skipped",
  "reason": "Adapter not enabled yet"
}
```

## Platform-Specific Handles

CP Hub v2 should not assume one handle works across every platform. Each student can have one handle per platform:

```json
{
  "studentId": "stu_001",
  "handles": [
    { "platform": "codeforces", "handle": "student_cf", "enabled": true },
    { "platform": "leetcode", "handle": "student_lc", "enabled": true },
    { "platform": "codechef", "handle": "student_cc", "enabled": false }
  ]
}
```

## Cache-First Strategy

V2 should preserve the v1 cache behavior:

```txt
API request
  -> validate student and selected platforms
  -> check Redis cache
  -> return cache_hit if available
  -> fetch enabled platform adapters on cache miss or refresh
  -> store snapshots in PostgreSQL
  -> update Redis cache
  -> return normalized response
```

Redis, including Upstash Redis in deployment, remains a cache layer. It should not be the source of truth.

## DB Fallback

If a requested profile is not in Redis, the backend can use PostgreSQL to load the latest saved snapshot before deciding whether a fresh external fetch is needed. PostgreSQL becomes the source of truth for student records, platform handles, profile snapshots, and coding scores.

## Stale-Cache Fallback

If an external platform request fails, the backend should return the most recent DB snapshot or cache entry when available. The response should clearly communicate stale data with a source such as:

```txt
stale_cache
```

Codeforces should remain the real official API integration. LeetCode and CodeChef should remain adapters that can be upgraded later, and CP Hub should avoid unstable scraping-heavy integrations.
