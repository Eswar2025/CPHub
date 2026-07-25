const { prisma } = require("./dbClient");

async function createProfileSnapshot(studentId, platform, handle, normalizedProfile) {
  return prisma.profileSnapshot.create({
    data: {
      studentId,
      platform,
      handle,
      rating: normalizeOptionalInt(normalizedProfile.rating),
      maxRating: normalizeOptionalInt(normalizedProfile.maxRating),
      rank: normalizedProfile.rank || null,
      solvedCount: normalizeOptionalInt(normalizedProfile.solvedCount),
      contests: normalizeOptionalInt(normalizedProfile.contests),
      rawData: normalizedProfile,
      source: normalizedProfile.source || "unknown",
      fetchedAt: new Date(),
    },
  });
}

async function getLatestSnapshotsForStudent(studentId) {
  const snapshots = await prisma.profileSnapshot.findMany({
    where: { studentId },
    orderBy: { fetchedAt: "desc" },
  });

  return getLatestByPlatform(snapshots);
}

async function getLatestSnapshotForStudentPlatform(studentId, platform) {
  return prisma.profileSnapshot.findFirst({
    where: {
      studentId,
      platform,
    },
    orderBy: { fetchedAt: "desc" },
  });
}

async function listLatestSnapshotsByPlatform(platform) {
  const snapshots = await prisma.profileSnapshot.findMany({
    where: { platform },
    include: {
      student: true,
    },
    orderBy: { fetchedAt: "desc" },
  });

  return getLatestByStudent(snapshots);
}

function getLatestByPlatform(snapshots) {
  const seen = new Set();
  const latest = [];

  snapshots.forEach((snapshot) => {
    if (seen.has(snapshot.platform)) {
      return;
    }

    seen.add(snapshot.platform);
    latest.push(snapshot);
  });

  return latest;
}

function getLatestByStudent(snapshots) {
  const seen = new Set();
  const latest = [];

  snapshots.forEach((snapshot) => {
    if (seen.has(snapshot.studentId)) {
      return;
    }

    seen.add(snapshot.studentId);
    latest.push(snapshot);
  });

  return latest;
}

function normalizeOptionalInt(value) {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.trunc(parsed) : null;
}

module.exports = {
  createProfileSnapshot,
  getLatestSnapshotsForStudent,
  getLatestSnapshotForStudentPlatform,
  listLatestSnapshotsByPlatform,
  getLatestByPlatform,
};
