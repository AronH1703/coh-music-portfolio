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

      return {
        id: link.id ?? url,
        label,
        description: link.helper?.trim() || undefined,
        url,
        mode: link.mode === "open" || link.mode === "download" ? link.mode : "download",
      };
    })
    .filter((entry): entry is PressKitDownloadItem => Boolean(entry));
}
