# CP Hub v2 API Plan

This document defines planned v2 endpoints. It does not change the current v1 API.

## Student Endpoints

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/api/students` | List students with filters such as branch, year, or section |
| `POST` | `/api/students` | Create a student record |
| `GET` | `/api/students/:id` | Get one student with handles, latest snapshots, and score |
| `PUT` | `/api/students/:id` | Update student details |
| `DELETE` | `/api/students/:id` | Delete or deactivate a student record |

## Platform Handle Endpoints

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `POST` | `/api/students/:id/handles` | Add a platform-specific handle for a student |
| `PUT` | `/api/students/:id/handles/:platform` | Update, enable, disable, or replace a platform handle |

## Refresh Endpoints

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `POST` | `/api/students/:id/refresh` | Refresh selected enabled platforms for one student |
| `POST` | `/api/students/bulk-refresh` | Refresh selected enabled platforms for a batch of students |

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

The refresh endpoint should support refreshing one platform or all enabled platforms. Example request body:

```json
{
  "platforms": ["codeforces"]
}
```

If `platforms` is omitted, the backend can refresh all enabled handles for the student. The backend should skip disabled handles.

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
