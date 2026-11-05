-- CreateTable
CREATE TABLE "CronRun" (
    "key" TEXT NOT NULL,
    "claimedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CronRun_pkey" PRIMARY KEY ("key")
);

-- CreateIndex
CREATE INDEX "CronRun_claimedAt_idx" ON "CronRun"("claimedAt");
