const { prisma } = require("./dbClient");
const profileSnapshotService = require("./profileSnapshotService");
const codeforcesAdapter = require("../adapters/codeforces.adapter");

const SUPPORTED_PLATFORMS = new Set(["codeforces", "leetcode", "codechef"]);
const SKIPPED_ADAPTER_REASON = "Adapter not enabled yet";

async function refreshStudentPlatforms(studentId, options = {}) {
  const selectedPlatform = options.platform ? normalizePlatform(options.platform) : null;
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: {
      handles: {
        orderBy: { platform: "asc" },
      },
    },
  });

  if (!student) {
    const error = new Error("Student not found");
    error.code = "STUDENT_NOT_FOUND";
    error.statusCode = 404;
    throw error;
  }

  const handlesToRefresh = student.handles.filter((handle) => {
    if (!handle.enabled) {
      return false;
    }

    return selectedPlatform ? handle.platform === selectedPlatform : true;
  });

  const result = {
    studentId,
    refreshed: [],
    skipped: [],
    failed: [],
  };

  if (selectedPlatform && !handlesToRefresh.length) {
    result.skipped.push({
      platform: selectedPlatform,
      status: "skipped",
      reason: "No enabled handle found for this student",
    });
    return result;
  }

  for (const platformHandle of handlesToRefresh) {
    if (platformHandle.platform !== "codeforces") {
      result.skipped.push({
        platform: platformHandle.platform,
        status: "skipped",
        reason: SKIPPED_ADAPTER_REASON,
      });
      continue;
    }

    try {
      const normalizedProfile = await codeforcesAdapter.fetchProfile(platformHandle.handle);
      const snapshot = await profileSnapshotService.createProfileSnapshot(
        studentId,
        platformHandle.platform,
        normalizedProfile.handle || platformHandle.handle,
        normalizedProfile
      );

      result.refreshed.push({
        platform: platformHandle.platform,
        status: "refreshed",
        handle: snapshot.handle,
        snapshot,
      });
    } catch (error) {
      result.failed.push({
        platform: platformHandle.platform,
        status: "failed",
        handle: platformHandle.handle,
        reason: error.message || "Platform refresh failed",
      });
    }
  }

  return result;
}

function normalizePlatform(platform) {
  const cleaned = String(platform || "").trim().toLowerCase();

  if (!SUPPORTED_PLATFORMS.has(cleaned)) {
    const error = new Error("platform must be one of codeforces, leetcode, codechef");
    error.code = "INVALID_PLATFORM";
    error.statusCode = 400;
    throw error;
  }

  return cleaned;
}

module.exports = {
  refreshStudentPlatforms,
};
