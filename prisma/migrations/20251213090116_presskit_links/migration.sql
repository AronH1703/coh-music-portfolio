/*
  Warnings:

  - You are about to alter the column `links` on the `PressKitAssets` table. The data in that column could be lost. The data in that column will be cast from `String` to `Json`.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_PressKitAssets" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "links" JSONB,
    "fullPressKitZipUrl" TEXT,
    "fullPressKitZipType" TEXT NOT NULL DEFAULT 'file',
    "onePagerPdfUrl" TEXT,
    "onePagerPdfType" TEXT NOT NULL DEFAULT 'file',
    "pressPhotosFolderUrl" TEXT,
    "pressPhotosFolderType" TEXT NOT NULL DEFAULT 'folder',
    "logosFolderUrl" TEXT,
    "logosFolderType" TEXT NOT NULL DEFAULT 'folder',
    "artworkFolderUrl" TEXT,
    "artworkFolderType" TEXT NOT NULL DEFAULT 'folder',
    "stagePlotPdfUrl" TEXT,
    "stagePlotPdfType" TEXT NOT NULL DEFAULT 'file',
    "inputListPdfUrl" TEXT,
    "inputListPdfType" TEXT NOT NULL DEFAULT 'file',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_PressKitAssets" ("artworkFolderType", "artworkFolderUrl", "createdAt", "fullPressKitZipType", "fullPressKitZipUrl", "id", "inputListPdfType", "inputListPdfUrl", "links", "logosFolderType", "logosFolderUrl", "onePagerPdfType", "onePagerPdfUrl", "pressPhotosFolderType", "pressPhotosFolderUrl", "stagePlotPdfType", "stagePlotPdfUrl", "updatedAt") SELECT "artworkFolderType", "artworkFolderUrl", "createdAt", "fullPressKitZipType", "fullPressKitZipUrl", "id", "inputListPdfType", "inputListPdfUrl", "links", "logosFolderType", "logosFolderUrl", "onePagerPdfType", "onePagerPdfUrl", "pressPhotosFolderType", "pressPhotosFolderUrl", "stagePlotPdfType", "stagePlotPdfUrl", "updatedAt" FROM "PressKitAssets";
DROP TABLE "PressKitAssets";
ALTER TABLE "new_PressKitAssets" RENAME TO "PressKitAssets";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
