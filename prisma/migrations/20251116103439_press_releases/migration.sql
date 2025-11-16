-- CreateTable
CREATE TABLE "PressRelease" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "summary" TEXT NOT NULL,
    "fullContent" TEXT,
    "category" TEXT NOT NULL,
    "coverImageUrl" TEXT,
    "coverCloudinaryPublicId" TEXT,
    "pdfUrl" TEXT,
    "pdfCloudinaryPublicId" TEXT,
    "dropboxUrl" TEXT,
    "directDownloadUrl" TEXT,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
