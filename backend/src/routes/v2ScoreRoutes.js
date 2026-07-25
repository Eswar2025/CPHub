const express = require("express");
const scoringService = require("../services/scoringService");
const { isDatabaseConfigured } = require("../services/dbClient");

const router = express.Router();

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

router.post("/recalculate-all", async (req, res) => {
  try {
    const result = await scoringService.calculateAllStudentScores();
    sendSuccess(res, result);
  } catch (error) {
    sendRouteError(res, error);
  }
});

router.get("/:studentId", async (req, res) => {
  try {
    const score = await scoringService.getStudentScore(req.params.studentId);
    sendSuccess(res, score);
  } catch (error) {
    sendRouteError(res, error);
  }
});

router.post("/:studentId/recalculate", async (req, res) => {
  try {
    const score = await scoringService.calculateStudentScore(req.params.studentId);
    sendSuccess(res, score);
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
  return sendError(
    res,
    error.statusCode || 500,
    error.code || "V2_SCORE_API_ERROR",
    error.message || "Score API request failed"
  );
}

module.exports = router;
