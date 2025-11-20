import { prisma } from "@/lib/prisma";

export const PRESS_KIT_ASSETS_ID = "press-kit-assets";

export type PressKitLinkType = "file" | "folder";

export type PressKitAssetUrlKey =
  | "fullPressKitZipUrl"
  | "onePagerPdfUrl"
  | "pressPhotosFolderUrl"
  | "logosFolderUrl"
  | "artworkFolderUrl"
  | "stagePlotPdfUrl"
  | "inputListPdfUrl";

export type PressKitAssetTypeKey =
  | "fullPressKitZipType"
  | "onePagerPdfType"
  | "pressPhotosFolderType"
  | "logosFolderType"
  | "artworkFolderType"
  | "stagePlotPdfType"
  | "inputListPdfType";

export type PressKitAssetsRecord = {
  fullPressKitZipUrl: string | null;
  fullPressKitZipType: PressKitLinkType;
  onePagerPdfUrl: string | null;
  onePagerPdfType: PressKitLinkType;
  pressPhotosFolderUrl: string | null;
  pressPhotosFolderType: PressKitLinkType;
  logosFolderUrl: string | null;
  logosFolderType: PressKitLinkType;
  artworkFolderUrl: string | null;
  artworkFolderType: PressKitLinkType;
  stagePlotPdfUrl: string | null;
  stagePlotPdfType: PressKitLinkType;
  inputListPdfUrl: string | null;
  inputListPdfType: PressKitLinkType;
};

export type PressKitAssetsPayload = Partial<PressKitAssetsRecord>;

export const DEFAULT_PRESS_KIT_ASSETS: PressKitAssetsRecord = {
  fullPressKitZipUrl: null,
  fullPressKitZipType: "file",
  onePagerPdfUrl: null,
  onePagerPdfType: "file",
  pressPhotosFolderUrl: null,
  pressPhotosFolderType: "folder",
  logosFolderUrl: null,
  logosFolderType: "folder",
  artworkFolderUrl: null,
  artworkFolderType: "folder",
  stagePlotPdfUrl: null,
  stagePlotPdfType: "file",
  inputListPdfUrl: null,
  inputListPdfType: "file",
};

const pressKitModel = (prisma as unknown as Record<string, typeof prisma>)?.pressKitAssets;

export async function getPressKitAssets(): Promise<PressKitAssetsRecord> {
  if (!pressKitModel) {
    return DEFAULT_PRESS_KIT_ASSETS;
  }

  const record = await pressKitModel.findUnique({ where: { id: PRESS_KIT_ASSETS_ID } });
  if (!record) {
    return DEFAULT_PRESS_KIT_ASSETS;
  }

  return {
    fullPressKitZipUrl: record.fullPressKitZipUrl,
    fullPressKitZipType: normalizeLinkType(record.fullPressKitZipType),
    onePagerPdfUrl: record.onePagerPdfUrl,
    onePagerPdfType: normalizeLinkType(record.onePagerPdfType),
    pressPhotosFolderUrl: record.pressPhotosFolderUrl,
    pressPhotosFolderType: normalizeLinkType(record.pressPhotosFolderType, "folder"),
    logosFolderUrl: record.logosFolderUrl,
    logosFolderType: normalizeLinkType(record.logosFolderType, "folder"),
    artworkFolderUrl: record.artworkFolderUrl,
    artworkFolderType: normalizeLinkType(record.artworkFolderType, "folder"),
    stagePlotPdfUrl: record.stagePlotPdfUrl,
    stagePlotPdfType: normalizeLinkType(record.stagePlotPdfType),
    inputListPdfUrl: record.inputListPdfUrl,
    inputListPdfType: normalizeLinkType(record.inputListPdfType),
  };
}

export async function upsertPressKitAssets(payload: PressKitAssetsPayload): Promise<PressKitAssetsRecord> {
  if (!pressKitModel) {
    return DEFAULT_PRESS_KIT_ASSETS;
  }

  await pressKitModel.upsert({
    where: { id: PRESS_KIT_ASSETS_ID },
    create: {
      id: PRESS_KIT_ASSETS_ID,
      fullPressKitZipUrl: payload.fullPressKitZipUrl ?? null,
      fullPressKitZipType: payload.fullPressKitZipType ?? "file",
      onePagerPdfUrl: payload.onePagerPdfUrl ?? null,
      onePagerPdfType: payload.onePagerPdfType ?? "file",
      pressPhotosFolderUrl: payload.pressPhotosFolderUrl ?? null,
      pressPhotosFolderType: payload.pressPhotosFolderType ?? "folder",
      logosFolderUrl: payload.logosFolderUrl ?? null,
      logosFolderType: payload.logosFolderType ?? "folder",
      artworkFolderUrl: payload.artworkFolderUrl ?? null,
      artworkFolderType: payload.artworkFolderType ?? "folder",
      stagePlotPdfUrl: payload.stagePlotPdfUrl ?? null,
      stagePlotPdfType: payload.stagePlotPdfType ?? "file",
      inputListPdfUrl: payload.inputListPdfUrl ?? null,
      inputListPdfType: payload.inputListPdfType ?? "file",
    },
    update: {
      fullPressKitZipUrl: payload.fullPressKitZipUrl ?? null,
      fullPressKitZipType: payload.fullPressKitZipType ?? "file",
      onePagerPdfUrl: payload.onePagerPdfUrl ?? null,
      onePagerPdfType: payload.onePagerPdfType ?? "file",
      pressPhotosFolderUrl: payload.pressPhotosFolderUrl ?? null,
      pressPhotosFolderType: payload.pressPhotosFolderType ?? "folder",
      logosFolderUrl: payload.logosFolderUrl ?? null,
      logosFolderType: payload.logosFolderType ?? "folder",
      artworkFolderUrl: payload.artworkFolderUrl ?? null,
      artworkFolderType: payload.artworkFolderType ?? "folder",
      stagePlotPdfUrl: payload.stagePlotPdfUrl ?? null,
      stagePlotPdfType: payload.stagePlotPdfType ?? "file",
      inputListPdfUrl: payload.inputListPdfUrl ?? null,
      inputListPdfType: payload.inputListPdfType ?? "file",
    },
  });

  return getPressKitAssets();
}

function normalizeLinkType(value: string | null | undefined, fallback: PressKitLinkType = "file"): PressKitLinkType {
  return value === "folder" || value === "file" ? value : fallback;
}

