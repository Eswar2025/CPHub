# CP Hub v2 PRD

## Product Name

**CP Hub v2**

## Product Subtitle

**College Coding Analytics Platform**

## Problem Statement

Colleges, placement cells, coding clubs, and faculty coordinators need a reliable way to understand student competitive programming progress across selected platforms. Today, this work is often done with spreadsheets, manual profile checks, screenshots, and inconsistent platform handles.

CP Hub v2 should turn the current profile-search prototype into a lightweight ATS-style coding analytics system for schools and colleges. The platform should track students, map each student to platform-specific handles, fetch public coding metrics through safe adapters, cache repeated requests with Redis, persist records in SQL, and generate explainable leaderboards and coding scores.

## Target Users

- Students who want to track their competitive programming profile across selected platforms.
- Placement cell teams that need coding readiness signals for batches or shortlists.
- Coding club admins who organize contests, practice groups, and peer leaderboards.
- Faculty coordinators who need a simple view of student progress by branch, year, or section.

## Current v1 Status

CP Hub v1 is already deployed as a working prototype:

- Frontend hosted on Vercel.
- Backend hosted on Render.
- Redis hosted on Upstash.
- Lightweight JSON file persistence under the backend data layer.
- Real Codeforces API integration using official Codeforces endpoints.
- Mock LeetCode and CodeChef adapters marked as `mock_data`.
- Redis caching with automatic in-memory fallback.
- Cache states visible to the frontend: `cache_hit`, `cache_miss`, `fresh_fetch`, and `stale_cache`.
- Rate limiting, stale cache fallback, metrics, leaderboard, and load testing documentation.

## Why v2 Is Needed

The v1 prototype is good for demonstrating backend concepts around caching, fallback behavior, and profile search. It is not enough for college-level analytics because it stores profiles by searched handle rather than by student record.

CP Hub v2 needs student-centered data. A student may use different handles on Codeforces, LeetCode, and CodeChef. Admins need import/export, platform-specific refresh controls, stable history, and leaderboards scoped to classes or platforms. JSON files were acceptable for the prototype, but v2 needs PostgreSQL as the source of truth so records can be queried, updated, filtered, and maintained safely.

## Core Features For v2

- Student records with name, roll number, branch, year, section, and optional email.
- Platform-specific handles, so each student can have different handles per platform.
- Selected-platform fetching, allowing refresh of one platform or all enabled platforms for a student.
- PostgreSQL persistence as the v2 source of truth.
- Redis cache layer for short-lived profile fetch results and repeated reads.
- Platform-wise leaderboards for Codeforces, LeetCode, CodeChef, and overall ranking.
- Overall coding score calculated with an explainable heuristic.
- Profile snapshots to preserve historical fetch results and last known platform state.
- Last synced time per profile snapshot or platform handle.
- Admin import/export for student batches and handle mappings.

## Non-Goals

- Authentication in the first migration phase.
- Real-time WebSockets.
- Paid platform APIs.
- Unstable scraping-heavy integrations.

## Platform Data Direction

Codeforces should remain the official real API integration. LeetCode and CodeChef should stay as adapters that can be upgraded safely later. CP Hub v2 should avoid unstable scraping-heavy APIs and should never present mock data as real platform data.

Upstash Redis remains a cache layer. It should improve speed and protect external APIs, but it should not become the source of truth. PostgreSQL becomes the durable source of truth for v2 student records, platform handles, snapshots, and scoring results.
