const { prisma } = require("./dbClient");
const profileSnapshotService = require("./profileSnapshotService");

const SUPPORTED_PLATFORMS = new Set(["overall", "codeforces", "leetcode", "codechef"]);

async function calculateStudentScore(studentId) {
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    select: { id: true },
  });

  if (!student) {
    throwNotFound("Student not found", "STUDENT_NOT_FOUND");
  }

  const snapshots = await profileSnapshotService.getLatestSnapshotsForStudent(studentId);
  if (!snapshots.length) {
    throwNotFound("No profile snapshots found. Refresh a platform before calculating score.", "SNAPSHOTS_NOT_FOUND");
  }

  const breakdown = buildScoreBreakdown(snapshots);

  return prisma.codingScore.upsert({
    where: { studentId },
    update: breakdown,
    create: {
      studentId,
      ...breakdown,
    },
  });
}

async function getStudentScore(studentId) {
  const score = await prisma.codingScore.findUnique({
    where: { studentId },
    include: {
      student: true,
    },
  });

  if (!score) {
    throwNotFound("Score not found. Recalculate score first.", "SCORE_NOT_FOUND");
  }

  return score;
}

async function calculateAllStudentScores() {
  const students = await prisma.student.findMany({
    select: { id: true, name: true },
    orderBy: { createdAt: "desc" },
  });

  const results = [];

  for (const student of students) {
    try {
      const score = await calculateStudentScore(student.id);
      results.push({
        studentId: student.id,
        name: student.name,
        status: "calculated",
        score,
      });
    } catch (error) {
      results.push({
        studentId: student.id,
        name: student.name,
        status: "skipped",
        reason: error.message,
      });
    }
  }

  return {
    count: results.filter((result) => result.status === "calculated").length,
    results,
  };
}

async function buildV2Leaderboard(options = {}) {
  const platform = normalizeLeaderboardPlatform(options.platform || "overall");
  const limit = normalizeLimit(options.limit);

  if (platform === "overall") {
    return buildOverallLeaderboard(limit);
  }

  return buildPlatformLeaderboard(platform, limit);
}

async function buildOverallLeaderboard(limit) {
  const scores = await prisma.codingScore.findMany({
    include: {
      student: {
        include: {
          snapshots: {
            orderBy: { fetchedAt: "desc" },
          },
        },
      },
    },
    orderBy: [
      { overallScore: "desc" },
      { calculatedAt: "desc" },
    ],
    take: limit,
  });

  return {
    platform: "overall",
    message: scores.length ? undefined : "No scores available yet. Recalculate scores first.",
    rows: scores.map((score, index) => ({
      rank: index + 1,
      studentId: score.studentId,
      name: score.student.name,
      rollNumber: score.student.rollNumber,
      branch: score.student.branch,
      year: score.student.year,
      overallScore: score.overallScore,
      ratingScore: score.ratingScore,
      solvedScore: score.solvedScore,
      activityScore: score.activityScore,
      consistencyScore: score.consistencyScore,
      review: score.review,
      calculatedAt: score.calculatedAt,
      snapshots: summarizeLatestSnapshots(score.student.snapshots),
    })),
  };
}

async function buildPlatformLeaderboard(platform, limit) {
  const snapshots = await profileSnapshotService.listLatestSnapshotsByPlatform(platform);

  if (!snapshots.length) {
    return {
      platform,
      message: "No snapshots available for this platform yet.",
      rows: [],
    };
  }

  const rows = snapshots
    .sort(compareSnapshots)
    .slice(0, limit)
    .map((snapshot, index) => ({
      rank: index + 1,
      studentId: snapshot.studentId,
      name: snapshot.student?.name,
      rollNumber: snapshot.student?.rollNumber,
      branch: snapshot.student?.branch,
      year: snapshot.student?.year,
      platform: snapshot.platform,
      handle: snapshot.handle,
      rating: snapshot.rating || 0,
      maxRating: snapshot.maxRating || 0,
      solvedCount: snapshot.solvedCount || 0,
      source: snapshot.source,
      fetchedAt: snapshot.fetchedAt,
    }));

  return {
    platform,
    rows,
  };
}

function buildScoreBreakdown(snapshots) {
  const ratingScore = calculateRatingScore(snapshots);
  const solvedScore = calculateSolvedScore(snapshots);
  const activityScore = calculateActivityScore(snapshots);
  const contestScore = calculateContestScore(snapshots);
  const consistencyScore = calculateConsistencyScore(snapshots);
  const overallScore = clampScore(
    Math.round(
      ratingScore * 0.35 +
        solvedScore * 0.25 +
        activityScore * 0.2 +
        contestScore * 0.1 +
        consistencyScore * 0.1
    )
  );

  return {
    overallScore,
    ratingScore,
    solvedScore,
    activityScore,
    consistencyScore,
    review: getReview(overallScore),
    calculatedAt: new Date(),
  };
}

function calculateRatingScore(snapshots) {
  const bestRating = Math.max(
    ...snapshots.map((snapshot) => snapshot.maxRating || snapshot.rating || 0),
    0
  );

  return scoreFromCap(bestRating, 2200);
}

function calculateSolvedScore(snapshots) {
  const totalSolved = snapshots.reduce((total, snapshot) => total + (snapshot.solvedCount || 0), 0);
  return scoreFromCap(totalSolved, 800);
}

function calculateActivityScore(snapshots) {
  const latestFetchedAt = snapshots
    .map((snapshot) => new Date(snapshot.fetchedAt).getTime())
    .filter((time) => Number.isFinite(time))
    .sort((a, b) => b - a)[0];

  if (!latestFetchedAt) {
    return 0;
  }

  const ageDays = (Date.now() - latestFetchedAt) / (1000 * 60 * 60 * 24);

  if (ageDays <= 7) return 100;
  if (ageDays <= 30) return 80;
  if (ageDays <= 90) return 55;
  if (ageDays <= 180) return 30;
  return 10;
}

function calculateContestScore(snapshots) {
  const bestContestCount = Math.max(...snapshots.map((snapshot) => snapshot.contests || 0), 0);
  return scoreFromCap(bestContestCount, 20);
}

function calculateConsistencyScore(snapshots) {
  const platforms = new Set(snapshots.map((snapshot) => snapshot.platform));

  if (platforms.size >= 3) return 100;
  if (platforms.size === 2) return 85;
  if (platforms.size === 1) return 60;
  return 0;
}

function scoreFromCap(value, cap) {
  return clampScore(Math.round((Number(value || 0) / cap) * 100));
}

function clampScore(value) {
  return Math.max(0, Math.min(100, value));
}

function getReview(overallScore) {
  if (overallScore >= 85) return "Interview Ready";
  if (overallScore >= 70) return "Strong Profile";
  if (overallScore >= 50) return "Needs More Practice";
  return "Early Stage";
}

function summarizeLatestSnapshots(snapshots) {
  return profileSnapshotService
    .getLatestByPlatform(snapshots)
    .map((snapshot) => ({
      platform: snapshot.platform,
      handle: snapshot.handle,
      rating: snapshot.rating,
      maxRating: snapshot.maxRating,
      solvedCount: snapshot.solvedCount,
      source: snapshot.source,
      fetchedAt: snapshot.fetchedAt,
    }));
}

function compareSnapshots(a, b) {
  return (
    (b.maxRating || 0) - (a.maxRating || 0) ||
    (b.rating || 0) - (a.rating || 0) ||
    (b.solvedCount || 0) - (a.solvedCount || 0) ||
    new Date(b.fetchedAt).getTime() - new Date(a.fetchedAt).getTime()
  );
}

function normalizeLeaderboardPlatform(platform) {
  const cleaned = String(platform || "overall").trim().toLowerCase();

  if (!SUPPORTED_PLATFORMS.has(cleaned)) {
    const error = new Error("platform must be one of overall, codeforces, leetcode, codechef");
    error.code = "INVALID_PLATFORM";
    error.statusCode = 400;
    throw error;
  }

  return cleaned;
}

function normalizeLimit(limit) {
  const parsed = Number(limit || 50);

  if (!Number.isInteger(parsed) || parsed < 1) {
    return 50;
  }

  return Math.min(parsed, 100);
}

function throwNotFound(message, code) {
  const error = new Error(message);
  error.code = code;
  error.statusCode = 404;
  throw error;
}

module.exports = {
  calculateStudentScore,
  getStudentScore,
  calculateAllStudentScores,
  buildV2Leaderboard,
};
