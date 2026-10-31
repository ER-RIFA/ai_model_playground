ALTER TABLE "UsageLog"
  ADD COLUMN "ownerId" TEXT NOT NULL DEFAULT 'legacy',
  ADD COLUMN "executionMode" TEXT NOT NULL DEFAULT 'unknown',
  ADD COLUMN "tokenSource" TEXT NOT NULL DEFAULT 'estimated';

CREATE INDEX "UsageLog_ownerId_createdAt_idx" ON "UsageLog"("ownerId", "createdAt");
CREATE INDEX "UsageLog_executionMode_idx" ON "UsageLog"("executionMode");
