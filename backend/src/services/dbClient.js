const { PrismaClient } = require("@prisma/client");

const databaseConfigured = Boolean(process.env.DATABASE_URL);
let prisma = null;

if (!databaseConfigured) {
  console.log("Database URL not configured. SQL features disabled.");
} else {
  prisma = new PrismaClient();
  console.log("Prisma client initialized.");
}

function isDatabaseConfigured() {
  return databaseConfigured;
}

module.exports = {
  prisma,
  isDatabaseConfigured,
};
