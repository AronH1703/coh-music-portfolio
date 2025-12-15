-- Create table for customizable section eyebrow labels
CREATE TABLE "SiteLabels" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "musicLabel" TEXT,
  "galleryLabel" TEXT,
  "videosLabel" TEXT,
  "aboutLabel" TEXT,
  "contactLabel" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL
);

