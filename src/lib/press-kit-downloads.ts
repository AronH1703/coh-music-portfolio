import type { PressKitAssetsRecord } from "@/lib/press-kit";

export type PressKitDownloadItem = {
  id: string;
  label: string;
  description?: string;
  url: string;
  mode: "download" | "open";
};

export function buildPressKitItems(assets: PressKitAssetsRecord): PressKitDownloadItem[] {
  const links = Array.isArray(assets.links) ? assets.links : [];

  return links
    .map((link) => {
      const label = link.label?.trim() ?? "";
      const url = typeof link.url === "string" ? link.url.trim() : "";
      if (!label || !url) {
        return null;
      }

      const item: PressKitDownloadItem = {
        id: link.id ?? url,
        label,
        url,
        mode: link.mode === "open" || link.mode === "download" ? link.mode : "download",
      };

      const description = link.helper?.trim();
      if (description) {
        item.description = description;
      }

      return item;
    })
    .filter((entry): entry is PressKitDownloadItem => Boolean(entry));
}
