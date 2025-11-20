import type { PressKitAssetsRecord } from "@/lib/press-kit";

export type PressKitDownloadItem = {
  key: UrlKey;
  label: string;
  description: string;
  url: string;
};

type UrlKey = Extract<keyof PressKitAssetsRecord, `${string}Url`>;

type PressKitButtonConfig = {
  urlKey: UrlKey;
  label: string;
  description: string;
};

const PRESS_KIT_BUTTONS: PressKitButtonConfig[] = [
  {
    urlKey: "fullPressKitZipUrl",
    label: "Download Full Press Kit (ZIP)",
    description: "A complete bundle for media, booking partners, and press kits.",
  },
  {
    urlKey: "onePagerPdfUrl",
    label: "Download One-Pager (PDF)",
    description: "Concise single-sheet overview for quick sharing.",
  },
  {
    urlKey: "pressPhotosFolderUrl",
    label: "Press Photos Folder",
    description: "High-resolution imagery and performance stills.",
  },
  {
    urlKey: "logosFolderUrl",
    label: "Logos Folder",
    description: "Updated brand marks, icons, and wordmarks.",
  },
  {
    urlKey: "artworkFolderUrl",
    label: "Artwork Folder",
    description: "Campaign artwork, singles, and album visuals.",
  },
  {
    urlKey: "stagePlotPdfUrl",
    label: "Download Stage Plot (PDF)",
    description: "Stage plot with routing, risers, and technical notes.",
  },
  {
    urlKey: "inputListPdfUrl",
    label: "Download Input List (PDF)",
    description: "FOH + monitor-friendly signal path guide.",
  },
];

export function buildPressKitItems(assets: PressKitAssetsRecord): PressKitDownloadItem[] {
  return PRESS_KIT_BUTTONS.flatMap((button) => {
    const rawUrl = assets[button.urlKey] ?? "";
    const url = typeof rawUrl === "string" ? rawUrl.trim() : "";
    if (!url) return [];

    return [
      {
        key: button.urlKey,
        label: button.label,
        description: button.description,
        url,
      },
    ];
  });
}
