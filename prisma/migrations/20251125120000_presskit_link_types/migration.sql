-- AlterTable
ALTER TABLE "PressKitAssets" ADD COLUMN "fullPressKitZipType" TEXT NOT NULL DEFAULT 'file';
ALTER TABLE "PressKitAssets" ADD COLUMN "onePagerPdfType" TEXT NOT NULL DEFAULT 'file';
ALTER TABLE "PressKitAssets" ADD COLUMN "pressPhotosFolderType" TEXT NOT NULL DEFAULT 'folder';
ALTER TABLE "PressKitAssets" ADD COLUMN "logosFolderType" TEXT NOT NULL DEFAULT 'folder';
ALTER TABLE "PressKitAssets" ADD COLUMN "artworkFolderType" TEXT NOT NULL DEFAULT 'folder';
ALTER TABLE "PressKitAssets" ADD COLUMN "stagePlotPdfType" TEXT NOT NULL DEFAULT 'file';
ALTER TABLE "PressKitAssets" ADD COLUMN "inputListPdfType" TEXT NOT NULL DEFAULT 'file';
