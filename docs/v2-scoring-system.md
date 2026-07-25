# CP Hub v2 Scoring System

## Goal

CP Hub v2 should calculate an explainable coding score for each student. The score should help colleges, coding clubs, and placement teams understand progress, but it should not be treated as a final hiring decision.

The scoring system should not be AI-based. It should be a transparent heuristic that students and admins can inspect, discuss, and improve.

## Why The Score Should Be Explainable

Students should know how to improve their score. Admins should be able to explain why one profile ranks above another. Faculty coordinators should be able to use the score as a guidance signal without pretending it captures every part of programming ability.

An explainable formula also keeps the project interview-friendly. It shows practical system design without adding a black-box model.

## Suggested Formula

Final score out of 100:

```txt
Overall Score =
  35% rating strength
  25% solved count
  20% recent activity
  10% contest participation
  10% platform consistency
```

## Components

### Rating Strength - 35%

Measures the strongest available rating signal from supported platforms. Codeforces can be the first real rating source because v1 already uses the official API. Mock platform ratings must stay clearly marked as `mock_data` until upgraded.

### Solved Count - 25%

Measures problem-solving volume. For Codeforces, solved count should continue to mean unique accepted problems. Other platforms can use adapter-normalized solved counts when stable integrations exist.

### Recent Activity - 20%

Measures whether the student has practiced or submitted recently. This should use available timestamp data from profile snapshots or adapter payloads. If a platform cannot safely provide recent activity, the score should not pretend it can.

### Contest Participation - 10%

Measures contest involvement where available. Contest activity is useful because it reflects time-bound problem solving, but it should not dominate the score.

### Platform Consistency - 10%

Rewards students who maintain enabled handles across selected platforms. This should be based on configured platform handles and available snapshots, not on scraping-heavy assumptions.

## Sample Score Output

```json
{
  "studentId": "stu_001",
  "overallScore": 78,
  "ratingScore": 31,
  "solvedScore": 19,
  "activityScore": 14,
  "contestScore": 6,
  "consistencyScore": 8,
  "review": "Interview Ready",
  "calculatedAt": "2026-07-25T10:00:00.000Z"
}
```

## Sample Review Messages

- `Interview Ready`: Strong overall signal across rating, solving volume, and recent activity.
- `Needs More Contest Activity`: Good solving profile, but low contest participation.
- `Strong Solving Volume`: High solved count, even if rating or recent activity can improve.
- `Low Recent Activity`: Historical profile is decent, but recent practice appears weak.

## Warnings

- The score is a heuristic.
- The score is not a final hiring decision.
- The score should be used as guidance only.
- Platform data quality varies, especially while LeetCode and CodeChef remain mock or future adapters.
- Unstable scraping-heavy APIs should be avoided, even if they appear to provide more scoring data.
