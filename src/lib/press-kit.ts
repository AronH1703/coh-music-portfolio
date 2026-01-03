import { prisma } from "@/lib/prisma";

export const PRESS_KIT_ASSETS_ID = "press-kit-assets";

export type PressKitLinkMode = "download" | "open";

export type PressKitLinkInput = {
  id?: string;
  label?: string;
  helper?: string;
  url?: string;
  mode?: PressKitLinkMode;
};

export type PressKitLinkEntry = {
  id: string;
  label: string;
  helper?: string;
  url: string;
  mode: PressKitLinkMode;
};

export type PressKitAssetsRecord = {
  links: PressKitLinkEntry[];
};

export type PressKitAssetsPayload = {
  links?: PressKitLinkInput[];
};

export const DEFAULT_PRESS_KIT_ASSETS: PressKitAssetsRecord = {
  links: [],
};

const pressKitModel = prisma.pressKitAssets;

const LEGACY_LINK_CONFIGS = [
  {
    urlKey: "fullPressKitZipUrl",
    label: "Full Press Kit (ZIP)",
    helper: "Everything bundled for easy distribution to press and partners.",
    mode: "download",
  },
  {
    urlKey: "onePagerPdfUrl",
    label: "One-Pager (PDF)",
    helper: "A concise single-sheet summary of Creature of Habit.",
    mode: "download",
  },
  {
    urlKey: "pressPhotosFolderUrl",
    label: "Press Photos Folder",
    helper: "High-resolution stills and performance imagery.",
    mode: "open",
  },
  {
    urlKey: "logosFolderUrl",
    label: "Logos Folder",
    helper: "Brand marks, lockups, and horizontal/vertical variants.",
    mode: "open",
  },
  {
    urlKey: "artworkFolderUrl",
    label: "Artwork Folder",
    helper: "Cover art, campaign visuals, and promotional treatments.",
    mode: "open",
  },
  {
    urlKey: "stagePlotPdfUrl",
    label: "Stage Plot (PDF)",
    helper: "Stage plot, riser layout, and technical overlay.",
    mode: "download",
  },
  {
    urlKey: "inputListPdfUrl",
    label: "Input List (PDF)",
    helper: "FOH/monitor-friendly signal path and channel choices.",
    mode: "download",
  },
] as const;

type LegacyLinkConfig = (typeof LEGACY_LINK_CONFIGS)[number];
type LegacyLinkKey = LegacyLinkConfig["urlKey"];
type LegacyPressKitRecord = Record<LegacyLinkKey, string | null> & { links: unknown };

export async function getPressKitAssets(): Promise<PressKitAssetsRecord> {
  const record = (await pressKitModel.findUnique({
    where: { id: PRESS_KIT_ASSETS_ID },
  })) as (LegacyPressKitRecord & { id: string }) | null;

  if (!record) {
    return DEFAULT_PRESS_KIT_ASSETS;
  }

  const normalized = normalizePressKitLinks(record.links);
  if (normalized.length) {
    return { links: normalized };
  }

  return { links: buildLegacyLinks(record) };
}

export async function upsertPressKitAssets(payload: PressKitAssetsPayload): Promise<PressKitAssetsRecord> {
  const normalizedLinks = sanitizePressKitLinks(payload.links ?? []);

  await pressKitModel.upsert({
    where: { id: PRESS_KIT_ASSETS_ID },
    create: {
      id: PRESS_KIT_ASSETS_ID,
      links: normalizedLinks,
    },
    update: {
      links: normalizedLinks,
    },
  });

  return { links: normalizedLinks };
}

function normalizePressKitLinks(raw: unknown): PressKitLinkEntry[] {
  if (!Array.isArray(raw)) {
    return [];
  }

  const candidates = raw
    .map((entry) => {
      if (!entry || typeof entry !== "object") {
        return null;
      }
      const { id, label, helper, url, mode } = entry as {
        id?: unknown;
        label?: unknown;
        helper?: unknown;
        url?: unknown;
        mode?: unknown;
      };

      const candidate: PressKitLinkInput = {};
      if (typeof id === "string") {
        candidate.id = id;
      }
      if (typeof label === "string") {
        candidate.label = label;
      }
      if (typeof helper === "string") {
        candidate.helper = helper;
      }
      if (typeof url === "string") {
        candidate.url = url;
      }
      if (mode === "download" || mode === "open") {
        candidate.mode = mode;
      }

      return candidate;
    })
    .filter((entry): entry is PressKitLinkInput => entry !== null);

  return sanitizePressKitLinks(candidates);
}

function sanitizePressKitLinks(rawLinks: PressKitLinkInput[]): PressKitLinkEntry[] {
  const fallbackId = () =>
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `presskit-link-${Math.random().toString(36).slice(2, 10)}`;

  return rawLinks
    .map((link) => {
      const label = typeof link.label === "string" ? link.label.trim() : "";
      const url = typeof link.url === "string" ? link.url.trim() : "";
      if (!label || !url) {
        return null;
      }

      const helper = typeof link.helper === "string" ? link.helper.trim() : undefined;
      const id =
        typeof link.id === "string" && link.id.trim().length > 0
          ? link.id.trim()
          : fallbackId();
      const mode: PressKitLinkMode = link.mode === "open" || link.mode === "download" ? link.mode : "download";

      const entry: PressKitLinkEntry = {
        id,
        label,
        url,
        mode,
      };

      if (helper && helper.length) {
        entry.helper = helper;
      }

      return entry;
    })
    .filter((entry): entry is PressKitLinkEntry => Boolean(entry));
}

function buildLegacyLinks(record: LegacyPressKitRecord): PressKitLinkEntry[] {
  return LEGACY_LINK_CONFIGS.flatMap((config) => {
    const rawUrl = record[config.urlKey];
    const url = typeof rawUrl === "string" ? rawUrl.trim() : "";
    if (!url) {
      return [];
    }

    return [
      {
        id: `legacy-${config.urlKey}`,
        label: config.label,
        helper: config.helper,
        url,
        mode: config.mode,
      },
    ];
  });
}
