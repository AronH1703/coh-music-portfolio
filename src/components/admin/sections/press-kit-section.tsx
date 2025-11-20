"use client";

import clsx from "clsx";
import { useEffect, useState } from "react";
import type { FieldError } from "react-hook-form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { TextField } from "../form-controls";
import { pressKitAssetsSchema } from "@/lib/validation";
import type { PressKitAssetsRecord } from "@/lib/press-kit";
import styles from "../admin-dashboard.module.scss";
import controls from "../form-controls.module.scss";

type PressKitFormValues = z.input<typeof pressKitAssetsSchema>;
type UrlFieldName = Extract<keyof PressKitFormValues, `${string}Url`>;

type MessageState =
  | { type: "success"; text: string }
  | { type: "error"; text: string }
  | null;

const FIELD_CONFIGS: Array<{
  urlName: UrlFieldName;
  label: string;
  helper?: string;
}> = [
  {
    urlName: "fullPressKitZipUrl",
    label: "Full Press Kit (ZIP)",
    helper: "Direct link to the zipped asset bundle.",
  },
  {
    urlName: "onePagerPdfUrl",
    label: "One-Pager (PDF)",
    helper: "Single-sheet bio or press overview.",
  },
  {
    urlName: "pressPhotosFolderUrl",
    label: "Press Photos Folder",
    helper: "Dropbox, Google Drive, or Cloudinary folder URL.",
  },
  {
    urlName: "logosFolderUrl",
    label: "Logos Folder",
    helper: "High-resolution logos organized by format.",
  },
  {
    urlName: "artworkFolderUrl",
    label: "Artwork Folder",
    helper: "Campaign, cover, and promo art.",
  },
  {
    urlName: "stagePlotPdfUrl",
    label: "Stage Plot (PDF)",
    helper: "Stage plot, tech diagram, and rigging notes.",
  },
  {
    urlName: "inputListPdfUrl",
    label: "Input List (PDF)",
    helper: "Input list for FOH/monitor engineers.",
  },
];

const DEFAULT_FORM_VALUES: PressKitFormValues = {
  fullPressKitZipUrl: "",
  fullPressKitZipType: "file",
  onePagerPdfUrl: "",
  onePagerPdfType: "file",
  pressPhotosFolderUrl: "",
  pressPhotosFolderType: "folder",
  logosFolderUrl: "",
  logosFolderType: "folder",
  artworkFolderUrl: "",
  artworkFolderType: "folder",
  stagePlotPdfUrl: "",
  stagePlotPdfType: "file",
  inputListPdfUrl: "",
  inputListPdfType: "file",
};

function mapRecordToFormValues(record: PressKitAssetsRecord): PressKitFormValues {
  return {
    fullPressKitZipUrl: record.fullPressKitZipUrl ?? "",
    fullPressKitZipType: record.fullPressKitZipType ?? "file",
    onePagerPdfUrl: record.onePagerPdfUrl ?? "",
    onePagerPdfType: record.onePagerPdfType ?? "file",
    pressPhotosFolderUrl: record.pressPhotosFolderUrl ?? "",
    pressPhotosFolderType: record.pressPhotosFolderType ?? "folder",
    logosFolderUrl: record.logosFolderUrl ?? "",
    logosFolderType: record.logosFolderType ?? "folder",
    artworkFolderUrl: record.artworkFolderUrl ?? "",
    artworkFolderType: record.artworkFolderType ?? "folder",
    stagePlotPdfUrl: record.stagePlotPdfUrl ?? "",
    stagePlotPdfType: record.stagePlotPdfType ?? "file",
    inputListPdfUrl: record.inputListPdfUrl ?? "",
    inputListPdfType: record.inputListPdfType ?? "file",
  };
}

export function PressKitSection() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<MessageState>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PressKitFormValues>({
    resolver: zodResolver(pressKitAssetsSchema),
    defaultValues: DEFAULT_FORM_VALUES,
  });

  useEffect(() => {
    let isActive = true;
    (async () => {
      setIsLoading(true);
      const response = await fetch("/api/press-kit", { cache: "no-store" });
      if (!isActive) return;
      if (response.ok) {
        const payload = await response.json().catch(() => null);
        const record = payload?.data as PressKitAssetsRecord | undefined;
        if (record) {
          reset(mapRecordToFormValues(record));
        }
      }
      setIsLoading(false);
    })();

    return () => {
      isActive = false;
    };
  }, [reset]);

  const onSubmit = async (formValues: PressKitFormValues) => {
    setIsSaving(true);
    setMessage(null);

    const normalizedValues = sanitizeFormValues(formValues);

    const response = await fetch("/api/press-kit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(normalizedValues),
    });

    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      setMessage({
        type: "error",
        text: payload?.error ?? "Could not save press kit links.",
      });
      setIsSaving(false);
      return;
    }

    const updated = payload?.data as PressKitAssetsRecord | undefined;
    if (updated) {
      reset(mapRecordToFormValues(updated));
    }

    setMessage({ type: "success", text: "Press kit links saved." });
    setIsSaving(false);
  };

  return (
    <div className={styles.card}>
      <form onSubmit={handleSubmit(onSubmit)} className={styles.fieldset}>
        <div>
          <p className={controls.helper}>
            URLs must be externally accessible and can include Dropbox or Cloudinary direct download links.
          </p>
        </div>

        {isLoading && (
          <div className={styles.emptyState}>Loading stored press kit links…</div>
        )}

        {FIELD_CONFIGS.map(({ urlName, label, helper }) => {
          const urlError = errors[urlName] as FieldError | undefined;
          return (
            <div key={urlName} className={styles.fieldRow}>
              <TextField
                label={label}
                name={urlName}
                placeholder="https://"
                helperText={helper}
                {...register(urlName)}
                error={urlError}
              />
            </div>
          );
        })}

        {message && (
          <div
            className={clsx(styles.messageBar, {
              [styles.messageSuccess]: message.type === "success",
              [styles.messageError]: message.type === "error",
            })}
          >
            {message.text}
          </div>
        )}

        <div className={styles.actions}>
          <button
            type="submit"
            className={styles.primaryButton}
            disabled={isSaving || isSubmitting || isLoading}
          >
            {isSaving || isSubmitting ? "Saving…" : "Save press kit links"}
          </button>
        </div>
      </form>
    </div>
  );
}

function sanitizeFormValues(values: PressKitFormValues): PressKitFormValues {
  const next: PressKitFormValues = { ...values };
  for (const field of FIELD_CONFIGS) {
    const raw = values[field.urlName];
    if (typeof raw !== "string") {
      continue;
    }

    const trimmed = raw.trim();
    if (!trimmed) {
      next[field.urlName] = "";
      continue;
    }

    next[field.urlName] = trimmed;
  }
  return next;
}
