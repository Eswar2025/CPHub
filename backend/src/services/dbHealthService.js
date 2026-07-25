const { prisma, isDatabaseConfigured } = require("./dbClient");

async function getDatabaseHealth() {
  if (!isDatabaseConfigured()) {
    return {
      configured: false,
      status: "disabled",
      message: "DATABASE_URL is not configured",
    };
  }

  try {
    await prisma.$queryRaw`SELECT 1`;

    return {
      configured: true,
      status: "connected",
    };
  } catch (error) {
    return {
      configured: true,
      status: "error",
      message: error.message,
    };
  }
}

module.exports = {
  getDatabaseHealth,
};
