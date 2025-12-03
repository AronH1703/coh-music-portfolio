/*
  Warnings:

  - You are about to drop the column `featuredQuote` on the `AboutContent` table. All the data in the column will be lost.
  - You are about to drop the column `markdown` on the `AboutContent` table. All the data in the column will be lost.
  - You are about to drop the column `missionStatement` on the `AboutContent` table. All the data in the column will be lost.
  - You are about to drop the column `quoteAttribution` on the `AboutContent` table. All the data in the column will be lost.
  - You are about to drop the column `seoDescription` on the `AboutContent` table. All the data in the column will be lost.
  - You are about to drop the column `seoTitle` on the `AboutContent` table. All the data in the column will be lost.
  - You are about to drop the column `bookingEmail` on the `ContactProfile` table. All the data in the column will be lost.
  - You are about to drop the column `emailContact` on the `ContactProfile` table. All the data in the column will be lost.
  - You are about to drop the column `managementContact` on the `ContactProfile` table. All the data in the column will be lost.
  - You are about to drop the column `pressContact` on the `ContactProfile` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_AboutContent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "aboutText" TEXT NOT NULL,
    "artistPhotoUrl" TEXT,
    "artistPhotoAlt" TEXT,
    "artistPhotoCloudinaryPublicId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_AboutContent" ("aboutText", "artistPhotoAlt", "artistPhotoCloudinaryPublicId", "artistPhotoUrl", "createdAt", "id", "updatedAt") SELECT "aboutText", "artistPhotoAlt", "artistPhotoCloudinaryPublicId", "artistPhotoUrl", "createdAt", "id", "updatedAt" FROM "AboutContent";
DROP TABLE "AboutContent";
ALTER TABLE "new_AboutContent" RENAME TO "AboutContent";
CREATE TABLE "new_ContactProfile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "emailContacts" JSONB,
    "socialLinks" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_ContactProfile" ("createdAt", "id", "socialLinks", "updatedAt") SELECT "createdAt", "id", "socialLinks", "updatedAt" FROM "ContactProfile";
DROP TABLE "ContactProfile";
ALTER TABLE "new_ContactProfile" RENAME TO "ContactProfile";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
