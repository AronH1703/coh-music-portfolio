-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Video" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "videoUrl" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "thumbnailUrl" TEXT,
    "videoCloudinaryPublicId" TEXT,
    "thumbnailCloudinaryPublicId" TEXT,
    "tags" JSONB,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Video" ("createdAt", "description", "externalId", "id", "provider", "tags", "thumbnailCloudinaryPublicId", "thumbnailUrl", "title", "updatedAt", "videoCloudinaryPublicId", "videoUrl") SELECT "createdAt", "description", "externalId", "id", "provider", "tags", "thumbnailCloudinaryPublicId", "thumbnailUrl", "title", "updatedAt", "videoCloudinaryPublicId", "videoUrl" FROM "Video";
DROP TABLE "Video";
ALTER TABLE "new_Video" RENAME TO "Video";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
