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

router.get("/", async (req, res) => {
  try {
    const leaderboard = await scoringService.buildV2Leaderboard({
      platform: req.query.platform,
      limit: req.query.limit,
    });

    sendSuccess(res, leaderboard);
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
    error.code || "V2_LEADERBOARD_API_ERROR",
    error.message || "Leaderboard API request failed"
  );
}

module.exports = router;
