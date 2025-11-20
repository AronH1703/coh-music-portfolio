"use client";

import type { PressKitAssetUrlKey } from "./press-kit";

export type PressKitLabelKey = PressKitAssetUrlKey;

export const PRESS_KIT_LABELS_STORAGE_KEY = "press-kit-labels";

export const DEFAULT_PRESS_KIT_LABELS: Record<PressKitLabelKey, string> = {
  fullPressKitZipUrl: "Full Press Kit (ZIP)",
  onePagerPdfUrl: "One-Pager (PDF)",
  pressPhotosFolderUrl: "Press Photos Folder",
  logosFolderUrl: "Logos Folder",
  artworkFolderUrl: "Artwork Folder",
  stagePlotPdfUrl: "Stage Plot (PDF)",
  inputListPdfUrl: "Input List (PDF)",
};

export function readPressKitLabels(): Record<PressKitLabelKey, string> {
  if (typeof window === "undefined") {
    return { ...DEFAULT_PRESS_KIT_LABELS };
  }

  try {
    const raw = window.localStorage.getItem(PRESS_KIT_LABELS_STORAGE_KEY);
    if (!raw) {
      return { ...DEFAULT_PRESS_KIT_LABELS };
    }

    const parsed = JSON.parse(raw) as Partial<Record<PressKitLabelKey, unknown>>;
    const next: Record<PressKitLabelKey, string> = { ...DEFAULT_PRESS_KIT_LABELS };

    (Object.keys(next) as PressKitLabelKey[]).forEach((key) => {
      const stored = parsed[key];
      if (typeof stored === "string" && stored.trim()) {
        next[key] = stored;
      }
    });

    return next;
  } catch {
    return { ...DEFAULT_PRESS_KIT_LABELS };
  }
}

export function writePressKitLabels(labels: Record<PressKitLabelKey, string>): void {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(PRESS_KIT_LABELS_STORAGE_KEY, JSON.stringify(labels));
  } catch {
    return;
  }
}

