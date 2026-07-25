-- CreateTable
CREATE TABLE "Student" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "rollNumber" TEXT,
    "email" TEXT,
    "branch" TEXT,
    "year" INTEGER,
    "section" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Student_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlatformHandle" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "handle" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlatformHandle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProfileSnapshot" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "handle" TEXT NOT NULL,
    "rating" INTEGER,
    "maxRating" INTEGER,
    "rank" TEXT,
    "solvedCount" INTEGER,
    "contests" INTEGER,
    "rawData" JSONB,
    "source" TEXT NOT NULL,
    "fetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProfileSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CodingScore" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "overallScore" INTEGER NOT NULL,
    "ratingScore" INTEGER NOT NULL,
    "solvedScore" INTEGER NOT NULL,
    "activityScore" INTEGER NOT NULL,
    "consistencyScore" INTEGER NOT NULL,
    "review" TEXT,
    "calculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CodingScore_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SystemMetric" (
    "id" TEXT NOT NULL,
    "totalRequests" INTEGER NOT NULL DEFAULT 0,
    "cacheHits" INTEGER NOT NULL DEFAULT 0,
    "cacheMisses" INTEGER NOT NULL DEFAULT 0,
    "freshFetches" INTEGER NOT NULL DEFAULT 0,
    "staleCacheUses" INTEGER NOT NULL DEFAULT 0,
    "externalApiFailures" INTEGER NOT NULL DEFAULT 0,
    "rateLimitedRequests" INTEGER NOT NULL DEFAULT 0,
    "totalResponseTimeMs" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SystemMetric_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Student_rollNumber_key" ON "Student"("rollNumber");

-- CreateIndex
CREATE INDEX "PlatformHandle_platform_handle_idx" ON "PlatformHandle"("platform", "handle");

-- CreateIndex
CREATE UNIQUE INDEX "PlatformHandle_studentId_platform_key" ON "PlatformHandle"("studentId", "platform");

-- CreateIndex
CREATE INDEX "ProfileSnapshot_studentId_idx" ON "ProfileSnapshot"("studentId");

-- CreateIndex
CREATE INDEX "ProfileSnapshot_platform_idx" ON "ProfileSnapshot"("platform");

-- CreateIndex
CREATE INDEX "ProfileSnapshot_fetchedAt_idx" ON "ProfileSnapshot"("fetchedAt");

-- CreateIndex
CREATE UNIQUE INDEX "CodingScore_studentId_key" ON "CodingScore"("studentId");

-- AddForeignKey
ALTER TABLE "PlatformHandle" ADD CONSTRAINT "PlatformHandle_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfileSnapshot" ADD CONSTRAINT "ProfileSnapshot_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CodingScore" ADD CONSTRAINT "CodingScore_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;
