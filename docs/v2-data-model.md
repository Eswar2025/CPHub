# CP Hub v2 Data Model

This document describes the SQL schema for CP Hub v2. The Prisma foundation now implements these core tables; v1 JSON-backed routes still remain active until the later migration phase.

## Student

Represents one college student.

| Field | Purpose |
| --- | --- |
| `id` | Unique student identifier |
| `name` | Student full name |
| `rollNumber` | College roll number or registration number |
| `email` | Optional student email |
| `branch` | Department or branch, such as CSE or ECE |
| `year` | Academic year |
| `section` | Optional section or class group |
| `createdAt` | Record creation timestamp |
| `updatedAt` | Last record update timestamp |

## PlatformHandle

Maps a student to a handle on a selected coding platform.

| Field | Purpose |
| --- | --- |
| `id` | Unique platform-handle record identifier |
| `studentId` | Reference to `Student.id` |
| `platform` | Platform name, such as `codeforces`, `leetcode`, or `codechef` |
| `handle` | Student handle for that platform |
| `enabled` | Whether this platform should be included in refreshes and scoring |
| `createdAt` | Record creation timestamp |
| `updatedAt` | Last record update timestamp |

## ProfileSnapshot

Stores fetched platform data at a point in time.

| Field | Purpose |
| --- | --- |
| `id` | Unique snapshot identifier |
| `studentId` | Reference to `Student.id` |
| `platform` | Platform that produced the snapshot |
| `handle` | Handle used for the fetch |
| `rating` | Current rating at fetch time |
| `maxRating` | Maximum rating at fetch time |
| `rank` | Platform rank label if available |
| `solvedCount` | Number of solved problems at fetch time |
| `contests` | Contest participation count or normalized contest summary |
| `rawData` | Raw adapter response or platform-specific JSON payload |
| `source` | Data source, such as `real_api` or `mock_data` |
| `fetchedAt` | Fetch timestamp |

## CodingScore

Stores the latest explainable score for one student.

| Field | Purpose |
| --- | --- |
| `id` | Unique score identifier |
| `studentId` | Reference to `Student.id` |
| `overallScore` | Final weighted coding score |
| `ratingScore` | Rating-strength component |
| `solvedScore` | Solved-count component |
| `activityScore` | Recent-activity component |
| `consistencyScore` | Platform-consistency component |
| `review` | Human-readable score review label |
| `calculatedAt` | Score calculation timestamp |

## SystemMetric

Stores current system-level counters. This can start as a single-row table or remain in the existing metrics service until historical metric reporting is needed.

| Field | Purpose |
| --- | --- |
| `id` | Unique metric record identifier |
| `totalRequests` | Total API requests tracked |
| `cacheHits` | Number of cache-hit profile responses |
| `cacheMisses` | Number of cache-miss profile responses |
| `freshFetches` | Number of fresh external fetches |
| `staleCacheUses` | Number of stale fallback responses |
| `externalApiFailures` | Number of external adapter failures |
| `rateLimitedRequests` | Number of rate-limited requests |
| `totalResponseTimeMs` | Sum of response times for average calculation |
| `updatedAt` | Last metric update timestamp |

## Relationships

- One student has many platform handles.
- One student has many profile snapshots.
- One student has one latest coding score.

## Notes

The `PlatformHandle` table is the key v2 shift. CP Hub should no longer assume one searched handle works for every platform. Codeforces can continue using the official real API. LeetCode and CodeChef can remain mock adapters until stable, safe integrations are available.

PostgreSQL should be the source of truth. Redis should cache recent normalized results and selected refresh responses, but durable records belong in PostgreSQL.
