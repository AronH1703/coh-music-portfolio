-- AlterTable
ALTER TABLE "AboutContent" ADD COLUMN "artistPhotoCloudinaryPublicId" TEXT;

-- AlterTable
ALTER TABLE "Video" ADD COLUMN "thumbnailCloudinaryPublicId" TEXT;
ALTER TABLE "Video" ADD COLUMN "videoCloudinaryPublicId" TEXT;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ContactProfile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "emailContact" TEXT NOT NULL,
    "bookingEmail" TEXT,
    "socialLinks" JSONB,
    "managementContact" TEXT,
    "pressContact" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_ContactProfile" ("bookingEmail", "createdAt", "emailContact", "id", "managementContact", "pressContact", "socialLinks", "updatedAt")
SELECT
  cp."bookingEmail",
  cp."createdAt",
  cp."emailContact",
  cp."id",
  cp."managementContact",
  cp."pressContact",
  (
    SELECT CASE
      WHEN COUNT(entry) = 0 THEN NULL
      ELSE '[' || group_concat(entry, ',') || ']'
    END
    FROM (
      SELECT json_object('label', 'Instagram', 'url', cp."instagramUrl") AS entry
      WHERE cp."instagramUrl" IS NOT NULL AND trim(cp."instagramUrl") != ''
      UNION ALL
      SELECT json_object('label', 'TikTok', 'url', cp."tiktokUrl")
      WHERE cp."tiktokUrl" IS NOT NULL AND trim(cp."tiktokUrl") != ''
      UNION ALL
      SELECT json_object('label', 'YouTube', 'url', cp."youtubeChannelUrl")
      WHERE cp."youtubeChannelUrl" IS NOT NULL AND trim(cp."youtubeChannelUrl") != ''
      UNION ALL
      SELECT json_object('label', 'Spotify', 'url', cp."spotifyUrl")
      WHERE cp."spotifyUrl" IS NOT NULL AND trim(cp."spotifyUrl") != ''
      UNION ALL
      SELECT json_object('label', 'SoundCloud', 'url', cp."soundcloudUrl")
      WHERE cp."soundcloudUrl" IS NOT NULL AND trim(cp."soundcloudUrl") != ''
      UNION ALL
      SELECT json_object('label', 'Apple Music', 'url', cp."appleMusicUrl")
      WHERE cp."appleMusicUrl" IS NOT NULL AND trim(cp."appleMusicUrl") != ''
      UNION ALL
      SELECT json_object('label', 'Bandcamp', 'url', cp."bandcampUrl")
      WHERE cp."bandcampUrl" IS NOT NULL AND trim(cp."bandcampUrl") != ''
      UNION ALL
      SELECT json_object('label', 'Facebook', 'url', cp."facebookUrl")
      WHERE cp."facebookUrl" IS NOT NULL AND trim(cp."facebookUrl") != ''
    )
  ),
  cp."updatedAt"
FROM "ContactProfile" AS cp;
DROP TABLE "ContactProfile";
ALTER TABLE "new_ContactProfile" RENAME TO "ContactProfile";
CREATE TABLE "new_Hero" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "subtitle" TEXT NOT NULL,
    "backgroundColor" TEXT,
    "titleColor" TEXT,
    "subtitleColor" TEXT,
    "eyebrowColor" TEXT,
    "titleFont" TEXT,
    "subtitleFont" TEXT,
    "primaryCtaLabel" TEXT,
    "primaryCtaHref" TEXT,
    "secondaryCtaLabel" TEXT,
    "secondaryCtaHref" TEXT,
    "metaTitle" TEXT,
    "metaDescription" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Hero" ("createdAt", "id", "metaDescription", "metaTitle", "primaryCtaHref", "primaryCtaLabel", "secondaryCtaHref", "secondaryCtaLabel", "subtitle", "title", "updatedAt") SELECT "createdAt", "id", "metaDescription", "metaTitle", "primaryCtaHref", "primaryCtaLabel", "secondaryCtaHref", "secondaryCtaLabel", "subtitle", "title", "updatedAt" FROM "Hero";
DROP TABLE "Hero";
ALTER TABLE "new_Hero" RENAME TO "Hero";
CREATE TABLE "new_MusicRelease" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "streamingLinks" JSONB,
    "coverImageUrl" TEXT,
    "coverImageAlt" TEXT,
    "coverCloudinaryPublicId" TEXT,
    "audioUrl" TEXT,
    "audioCloudinaryPublicId" TEXT,
    "releaseDate" DATETIME,
    "releaseTime" TEXT,
    "timeZone" TEXT,
    "releaseAt" DATETIME,
    "comingSoon" BOOLEAN NOT NULL DEFAULT false,
    "genre" TEXT,
    "duration" TEXT,
    "credits" TEXT,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "metaTitle" TEXT,
    "metaDescription" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_MusicRelease" ("comingSoon", "coverCloudinaryPublicId", "coverImageAlt", "coverImageUrl", "createdAt", "credits", "description", "duration", "featured", "genre", "id", "metaDescription", "metaTitle", "releaseAt", "releaseDate", "releaseTime", "slug", "sortOrder", "streamingLinks", "timeZone", "title", "updatedAt")
SELECT
  mr."comingSoon",
  mr."cloudinaryPublicId",
  mr."coverImageAlt",
  mr."coverImageUrl",
  mr."createdAt",
  mr."credits",
  mr."description",
  mr."duration",
  mr."featured",
  mr."genre",
  mr."id",
  mr."metaDescription",
  mr."metaTitle",
  mr."releaseAt",
  mr."releaseDate",
  mr."releaseTime",
  mr."slug",
  mr."sortOrder",
  CASE
    WHEN mr."streamingLink" IS NULL OR trim(mr."streamingLink") = '' THEN NULL
    ELSE json_array(json_object('label', 'Listen', 'url', mr."streamingLink"))
  END,
  mr."timeZone",
  mr."title",
  mr."updatedAt"
FROM "MusicRelease" AS mr;
DROP TABLE "MusicRelease";
ALTER TABLE "new_MusicRelease" RENAME TO "MusicRelease";
CREATE UNIQUE INDEX "MusicRelease_slug_key" ON "MusicRelease"("slug");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
