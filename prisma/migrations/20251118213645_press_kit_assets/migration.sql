/*
  Warnings:

  - You are about to drop the `PressKitCopy` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `PressRelease` table. If the table is not empty, all the data it contains will be lost.

*/
PRAGMA foreign_keys=off;
DROP TABLE IF EXISTS "PressKitCopy";
PRAGMA foreign_keys=on;

PRAGMA foreign_keys=off;
DROP TABLE IF EXISTS "PressRelease";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "PressKitAssets" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "fullPressKitZipUrl" TEXT,
    "onePagerPdfUrl" TEXT,
    "pressPhotosFolderUrl" TEXT,
    "logosFolderUrl" TEXT,
    "artworkFolderUrl" TEXT,
    "stagePlotPdfUrl" TEXT,
    "inputListPdfUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
