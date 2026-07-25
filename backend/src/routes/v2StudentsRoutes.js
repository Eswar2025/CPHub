const express = require("express");
const studentService = require("../services/studentService");
const profileSnapshotService = require("../services/profileSnapshotService");
const v2RefreshService = require("../services/v2RefreshService");
const { isDatabaseConfigured } = require("../services/dbClient");

const router = express.Router();
const SUPPORTED_PLATFORMS = new Set(["codeforces", "leetcode", "codechef"]);

router.use((req, res, next) => {
  if (!isDatabaseConfigured()) {
    return sendError(
      res,
      503,
      "DATABASE_DISABLED",
      "DATABASE_URL is not configured. SQL features are disabled."
    );
  }

  next();
});

router.get("/", async (req, res) => {
  try {
    const students = await studentService.listStudents();
    sendSuccess(res, students);
  } catch (error) {
    sendRouteError(res, error);
  }
});

router.post("/", async (req, res) => {
  try {
    const student = await studentService.createStudent(req.body);
    sendSuccess(res, student, 201);
  } catch (error) {
    sendRouteError(res, error);
  }
});

router.get("/:id", async (req, res) => {
  try {
    const student = await studentService.getStudentById(req.params.id);

    if (!student) {
      return sendError(res, 404, "STUDENT_NOT_FOUND", "Student not found");
    }

    sendSuccess(res, student);
  } catch (error) {
    sendRouteError(res, error);
  }
});

router.get("/:id/snapshots", async (req, res) => {
  try {
    await studentService.assertStudentExists(req.params.id);

    const platform = req.query.platform ? normalizePlatform(req.query.platform) : null;
    const snapshots = platform
      ? await profileSnapshotService.getLatestSnapshotForStudentPlatform(req.params.id, platform)
      : await profileSnapshotService.getLatestSnapshotsForStudent(req.params.id);

    sendSuccess(res, platform ? (snapshots ? [snapshots] : []) : snapshots);
  } catch (error) {
    sendRouteError(res, error);
  }
});

router.put("/:id", async (req, res) => {
  try {
    const student = await studentService.updateStudent(req.params.id, req.body);
    sendSuccess(res, student);
  } catch (error) {
    sendRouteError(res, error);
  }
});

router.delete("/:id", async (req, res) => {
  try {
    await studentService.deleteStudent(req.params.id);
    sendSuccess(res, { message: "Student deleted" });
  } catch (error) {
    sendRouteError(res, error);
  }
});

router.post("/:id/refresh", async (req, res) => {
  try {
    const result = await v2RefreshService.refreshStudentPlatforms(req.params.id, {
      platform: req.body?.platform,
    });

    sendSuccess(res, result);
  } catch (error) {
    sendRouteError(res, error);
  }
});

router.post("/:id/handles", async (req, res) => {
  try {
    const platformHandle = await studentService.upsertPlatformHandle(
      req.params.id,
      req.body.platform,
      req.body
    );

    sendSuccess(res, platformHandle);
  } catch (error) {
    sendRouteError(res, error);
  }
});

router.put("/:id/handles/:platform", async (req, res) => {
  try {
    const platformHandle = await studentService.updatePlatformHandle(
      req.params.id,
      req.params.platform,
      req.body
    );

    sendSuccess(res, platformHandle);
  } catch (error) {
    sendRouteError(res, error);
  }
});

function sendSuccess(res, data, statusCode = 200) {
  return res.status(statusCode).json({
    success: true,
    data,
  });
}

function sendError(res, statusCode, code, message) {
  res.locals.errorCode = code;

  return res.status(statusCode).json({
    success: false,
    error: {
      code,
      message,
    },
  });
}

function sendRouteError(res, error) {
  if (error.code === "P2025") {
    return sendError(res, 404, "NOT_FOUND", "Requested record was not found");
  }

  if (error.code === "P2002") {
    return sendError(res, 409, "UNIQUE_CONSTRAINT_FAILED", "A record with these unique fields already exists");
  }

  return sendError(
    res,
    error.statusCode || 500,
    error.code || "V2_STUDENT_API_ERROR",
    error.message || "Student API request failed"
  );
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

module.exports = router;
