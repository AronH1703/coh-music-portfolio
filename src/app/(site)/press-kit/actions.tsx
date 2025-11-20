"use client";

import { useEffect, useState } from "react";
import type { PressKitAssetsRecord } from "@/lib/content";
import {
  DEFAULT_PRESS_KIT_LABELS,
  readPressKitLabels,
  type PressKitLabelKey,
} from "@/lib/press-kit-labels";
import styles from "@/components/press-kit/press-kit-section.module.css";

type UrlKey = Extract<keyof PressKitAssetsRecord, `${string}Url`>;

type ActionConfig = {
  key: UrlKey;
  helper: string;
  mode: "download" | "open";
};

const ACTION_CONFIGS: ActionConfig[] = [
  {
    key: "fullPressKitZipUrl",
    helper: "Everything bundled for easy distribution to press and partners.",
    mode: "download",
  },
  {
    key: "onePagerPdfUrl",
    helper: "A concise single-sheet summary of Creature of Habit.",
    mode: "download",
  },
  {
    key: "pressPhotosFolderUrl",
    helper: "High-resolution stills and performance imagery.",
    mode: "open",
  },
  {
    key: "logosFolderUrl",
    helper: "Brand marks, lockups, and horizontal/vertical variants.",
    mode: "open",
  },
  {
    key: "artworkFolderUrl",
    helper: "Cover art, campaign visuals, and promotional treatments.",
    mode: "open",
  },
  {
    key: "stagePlotPdfUrl",
    helper: "Stage plot, riser layout, and technical overlay.",
    mode: "download",
  },
  {
    key: "inputListPdfUrl",
    helper: "FOH/monitor-friendly signal path and channel choices.",
    mode: "download",
  },
];

type Props = {
  assets: PressKitAssetsRecord;
};

export function PressKitActions({ assets }: Props) {
  const [labelsByField, setLabelsByField] = useState<Record<UrlKey, string>>(() => {
    const base: Record<UrlKey, string> = {} as Record<UrlKey, string>;
    (Object.keys(DEFAULT_PRESS_KIT_LABELS) as PressKitLabelKey[]).forEach((key) => {
      const fieldKey = key as unknown as UrlKey;
      base[fieldKey] = DEFAULT_PRESS_KIT_LABELS[key];
    });
    return base;
  });

  useEffect(() => {
    hydrateClientLabels(setLabelsByField);
  }, []);

  const configuredActions = ACTION_CONFIGS.map((config) => {
    const rawUrl = assets[config.key];
    const url = typeof rawUrl === "string" ? rawUrl.trim() : "";
    if (!url) {
      return null;
    }

    const title =
      labelsByField[config.key] ??
      DEFAULT_PRESS_KIT_LABELS[config.key as unknown as PressKitLabelKey];
    const prefix = config.mode === "download" ? "Download" : "Open";

    return {
      ...config,
      title,
      url,
      buttonLabel: `${prefix} ${title}`,
    };
  }).filter(Boolean) as Array<
    ActionConfig & { title: string; url: string; buttonLabel: string }
  >;

  if (!configuredActions.length) {
    return (
      <div className={styles.actions}>
        <article className={styles.actionCard}>
          <div>
            <p className={styles.actionTitle}>Press kit links coming soon</p>
            <p className={styles.actionHelper}>
              Add URLs through the admin Press Kit section to surface downloads on the homepage.
            </p>
          </div>
          <span className={styles.actionDisabled}>Coming soon</span>
        </article>
      </div>
    );
  }

  return (
    <div className={styles.actions}>
      {configuredActions.map((action) => (
        <article key={action.key} className={styles.actionCard}>
          <div>
            <p className={styles.actionTitle}>{action.title}</p>
            <p className={styles.actionHelper}>{action.helper}</p>
          </div>
          <a
            className={styles.actionButton}
            href={action.url}
            target="_blank"
            rel="noopener noreferrer"
          >
            {action.buttonLabel}
          </a>
        </article>
      ))}
    </div>
  );
}

function hydrateClientLabels(
  update: React.Dispatch<React.SetStateAction<Record<UrlKey, string>>>,
) {
  const stored = readPressKitLabels();

  update((current) => {
    const next = { ...current };

    (Object.keys(stored) as PressKitLabelKey[]).forEach((key) => {
      const label = stored[key];
      if (typeof label === "string" && label.trim()) {
        const fieldKey = key as unknown as UrlKey;
        next[fieldKey] = label;
      }
    });

    return next;
  });
}
