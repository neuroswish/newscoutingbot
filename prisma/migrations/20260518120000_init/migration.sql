CREATE TABLE "ImportBatch" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "fileName" TEXT NOT NULL,
  "totalRows" INTEGER NOT NULL,
  "importedCount" INTEGER NOT NULL DEFAULT 0,
  "skippedCount" INTEGER NOT NULL DEFAULT 0,
  "status" TEXT NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "Contact" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "company" TEXT,
  "title" TEXT,
  "emailsJson" TEXT NOT NULL DEFAULT '[]',
  "phone" TEXT,
  "region" TEXT,
  "department" TEXT,
  "priority" TEXT,
  "status" TEXT,
  "source" TEXT,
  "sourceUrls" TEXT,
  "notes" TEXT,
  "confidence" TEXT,
  "rawJson" TEXT NOT NULL DEFAULT '{}',
  "importBatchId" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  CONSTRAINT "Contact_importBatchId_fkey" FOREIGN KEY ("importBatchId") REFERENCES "ImportBatch" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX "Contact_company_idx" ON "Contact"("company");
CREATE INDEX "Contact_name_idx" ON "Contact"("name");

CREATE TABLE "GmailConnection" (
  "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'local',
  "email" TEXT,
  "accessToken" TEXT NOT NULL,
  "refreshToken" TEXT,
  "expiryDate" DATETIME,
  "scope" TEXT,
  "tokenType" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL
);
