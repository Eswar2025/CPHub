const { prisma, isDatabaseConfigured } = require("./dbClient");

const SUPPORTED_PLATFORMS = new Set(["codeforces", "leetcode", "codechef"]);
const STUDENT_FIELDS = ["name", "rollNumber", "email", "branch", "year", "section"];

function ensureDatabaseEnabled() {
  if (!isDatabaseConfigured() || !prisma) {
    const error = new Error("DATABASE_URL is not configured. SQL features are disabled.");
    error.code = "DATABASE_DISABLED";
    error.statusCode = 503;
    throw error;
  }
}

async function listStudents() {
  ensureDatabaseEnabled();

  return prisma.student.findMany({
    include: {
      handles: {
        orderBy: { platform: "asc" },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

async function createStudent(input) {
  ensureDatabaseEnabled();

  const data = normalizeStudentInput(input, { requireName: true });

  return prisma.student.create({
    data,
    include: {
      handles: true,
    },
  });
}

async function getStudentById(id) {
  ensureDatabaseEnabled();

  return prisma.student.findUnique({
    where: { id },
    include: {
      handles: {
        orderBy: { platform: "asc" },
      },
      snapshots: {
        orderBy: { fetchedAt: "desc" },
        take: 5,
      },
      score: true,
    },
  });
}

async function updateStudent(id, input) {
  ensureDatabaseEnabled();

  const data = normalizeStudentInput(input, { requireName: false });

  return prisma.student.update({
    where: { id },
    data,
    include: {
      handles: {
        orderBy: { platform: "asc" },
      },
    },
  });
}

async function deleteStudent(id) {
  ensureDatabaseEnabled();

  return prisma.student.delete({
    where: { id },
  });
}

async function upsertPlatformHandle(studentId, platform, input) {
  ensureDatabaseEnabled();
  await assertStudentExists(studentId);

  const data = normalizePlatformHandleInput({ ...input, platform });

  return prisma.platformHandle.upsert({
    where: {
      studentId_platform: {
        studentId,
        platform: data.platform,
      },
    },
    update: {
      handle: data.handle,
      enabled: data.enabled,
    },
    create: {
      studentId,
      platform: data.platform,
      handle: data.handle,
      enabled: data.enabled,
    },
  });
}

async function updatePlatformHandle(studentId, platform, input) {
  ensureDatabaseEnabled();
  await assertStudentExists(studentId);

  const data = normalizePlatformHandleInput({ ...input, platform });

  return prisma.platformHandle.update({
    where: {
      studentId_platform: {
        studentId,
        platform: data.platform,
      },
    },
    data: {
      handle: data.handle,
      enabled: data.enabled,
    },
  });
}

async function assertStudentExists(id) {
  const student = await prisma.student.findUnique({
    where: { id },
    select: { id: true },
  });

  if (!student) {
    const error = new Error("Student not found");
    error.code = "STUDENT_NOT_FOUND";
    error.statusCode = 404;
    throw error;
  }
}

function normalizeStudentInput(input = {}, options = {}) {
  const data = {};

  STUDENT_FIELDS.forEach((field) => {
    if (Object.prototype.hasOwnProperty.call(input, field)) {
      data[field] = normalizeStudentField(field, input[field]);
    }
  });

  if (options.requireName && !data.name) {
    throwValidationError("name is required");
  }

  if (!options.requireName && Object.prototype.hasOwnProperty.call(data, "name") && !data.name) {
    throwValidationError("name cannot be empty");
  }

  return data;
}

function normalizeStudentField(field, value) {
  if (field === "year") {
    return normalizeYear(value);
  }

  if (value === undefined || value === null) {
    return null;
  }

  const cleaned = String(value).trim();
  return cleaned || null;
}

function normalizeYear(value) {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  const parsed = Number(value);
  if (!Number.isInteger(parsed)) {
    throwValidationError("year should be a number if provided");
  }

  return parsed;
}

function normalizePlatformHandleInput(input = {}) {
  const platform = normalizePlatform(input.platform);
  const handle = normalizeRequiredString(input.handle, "handle");
  const enabled = normalizeEnabled(input.enabled);

  return {
    platform,
    handle,
    enabled,
  };
}

function normalizePlatform(platform) {
  const cleaned = String(platform || "").trim().toLowerCase();

  if (!SUPPORTED_PLATFORMS.has(cleaned)) {
    throwValidationError("platform must be one of codeforces, leetcode, codechef");
  }

  return cleaned;
}

function normalizeRequiredString(value, field) {
  const cleaned = String(value || "").trim();

  if (!cleaned) {
    throwValidationError(`${field} is required`);
  }

  return cleaned;
}

function normalizeEnabled(value) {
  if (value === undefined) {
    return true;
  }

  if (typeof value !== "boolean") {
    throwValidationError("enabled should be a boolean if provided");
  }

  return value;
}

function throwValidationError(message) {
  const error = new Error(message);
  error.code = "VALIDATION_ERROR";
  error.statusCode = 400;
  throw error;
}

module.exports = {
  listStudents,
  createStudent,
  getStudentById,
  updateStudent,
  deleteStudent,
  upsertPlatformHandle,
  updatePlatformHandle,
};
