"use client";

import clsx from "clsx";
import { useEffect, useState, useRef } from "react";
import type { FieldError } from "react-hook-form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { pressKitAssetsSchema } from "@/lib/validation";
import type { PressKitAssetsRecord } from "@/lib/press-kit";
import {
  DEFAULT_PRESS_KIT_LABELS,
  readPressKitLabels,
  writePressKitLabels,
  type PressKitLabelKey,
} from "@/lib/press-kit-labels";
import styles from "../admin-dashboard.module.scss";
import controls from "../form-controls.module.scss";

type PressKitFormValues = z.input<typeof pressKitAssetsSchema>;
type UrlFieldName = Extract<keyof PressKitFormValues, `${string}Url`>;

const ALL_URL_FIELDS: UrlFieldName[] = [
  "fullPressKitZipUrl",
  "onePagerPdfUrl",
  "pressPhotosFolderUrl",
  "logosFolderUrl",
  "artworkFolderUrl",
  "stagePlotPdfUrl",
  "inputListPdfUrl",
];

const MAX_VISIBLE_LINKS = 10;

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
    label: DEFAULT_PRESS_KIT_LABELS.fullPressKitZipUrl,
    helper: "Direct link to the zipped asset bundle.",
  },
  {
    urlName: "onePagerPdfUrl",
    label: DEFAULT_PRESS_KIT_LABELS.onePagerPdfUrl,
    helper: "Single-sheet bio or press overview.",
  },
  {
    urlName: "pressPhotosFolderUrl",
    label: DEFAULT_PRESS_KIT_LABELS.pressPhotosFolderUrl,
    helper: "Dropbox, Google Drive, or Cloudinary folder URL.",
  },
  {
    urlName: "logosFolderUrl",
    label: DEFAULT_PRESS_KIT_LABELS.logosFolderUrl,
    helper: "High-resolution logos organized by format.",
  },
  {
    urlName: "artworkFolderUrl",
    label: DEFAULT_PRESS_KIT_LABELS.artworkFolderUrl,
    helper: "Campaign, cover, and promo art.",
  },
  {
    urlName: "stagePlotPdfUrl",
    label: DEFAULT_PRESS_KIT_LABELS.stagePlotPdfUrl,
    helper: "Stage plot, tech diagram, and rigging notes.",
  },
  {
    urlName: "inputListPdfUrl",
    label: DEFAULT_PRESS_KIT_LABELS.inputListPdfUrl,
    helper: "Input list for FOH/monitor engineers.",
  },
];

type UrlLabelMap = Record<UrlFieldName, string>;

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
  const [labelsByField, setLabelsByField] = useState<UrlLabelMap>(() => {
    const base: UrlLabelMap = {} as UrlLabelMap;
    for (const field of FIELD_CONFIGS) {
      base[field.urlName] = field.label;
    }
    return base;
  });
  const [visibleFields, setVisibleFields] = useState<UrlFieldName[]>(() =>
    determineVisibleFields(DEFAULT_FORM_VALUES),
  );

  const {
    register,
    handleSubmit,
    reset,
    setValue,
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
          const values = mapRecordToFormValues(record);
          reset(values);
          setVisibleFields(determineVisibleFields(values));
        } else {
          setVisibleFields(determineVisibleFields(DEFAULT_FORM_VALUES));
        }
      }
      setIsLoading(false);
    })();

    return () => {
      isActive = false;
    };
  }, [reset]);

  useEffect(() => {
    hydratePressKitLabelsFromStorage(setLabelsByField);
  }, []);

  const handleLabelChange = (fieldName: UrlFieldName, nextLabel: string) => {
    const fallback =
      DEFAULT_PRESS_KIT_LABELS[fieldName as unknown as PressKitLabelKey];
    const trimmed = nextLabel.trim();
    setLabelsByField((current) => {
      const updated: UrlLabelMap = {
        ...current,
        [fieldName]: trimmed || fallback,
      };

      const payload: Record<PressKitLabelKey, string> = {
        ...DEFAULT_PRESS_KIT_LABELS,
      };

      (Object.keys(payload) as PressKitLabelKey[]).forEach((key) => {
        const keyAsField = key as unknown as UrlFieldName;
        const label = updated[keyAsField];
        if (typeof label === "string" && label.trim()) {
          payload[key] = label;
        }
      });

      writePressKitLabels(payload);

      return updated;
    });
  };

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
      const values = mapRecordToFormValues(updated);
      reset(values);
      setVisibleFields(determineVisibleFields(values));
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

        {FIELD_CONFIGS.filter(({ urlName }) =>
          visibleFields.includes(urlName),
        ).map(({ urlName, helper }) => {
          const urlError = errors[urlName] as FieldError | undefined;
          const label = labelsByField[urlName];
          return (
            <div key={urlName} className={styles.fieldRow}>
              <div className={controls.formField}>
                <label className={controls.label} htmlFor={urlName}>
                  <InlineEditableLabel
                    value={label}
                    onChange={(value) => handleLabelChange(urlName, value)}
                  />
                </label>
                <input
                  id={urlName}
                  placeholder="https://"
                  className={controls.input}
                  {...register(urlName)}
                />
                {helper && !urlError && (
                  <span className={controls.helper}>{helper}</span>
                )}
                {urlError && <span className={controls.error}>{urlError.message}</span>}
              </div>
              <button
                type="button"
                className={styles.dangerButton}
                onClick={() => {
                  setVisibleFields((current) =>
                    current.filter((field) => field !== urlName),
                  );
                  setValue(urlName, "");
                }}
              >
                Fjarlægja
              </button>
            </div>
          );
        })}

        {visibleFields.length <
          Math.min(MAX_VISIBLE_LINKS, ALL_URL_FIELDS.length) && (
          <div className={styles.actions}>
            <button
              type="button"
              className={styles.secondaryButton}
              onClick={() => {
                setVisibleFields((current) => {
                  const limit = Math.min(MAX_VISIBLE_LINKS, ALL_URL_FIELDS.length);
                  if (current.length >= limit) return current;
                  const nextField = ALL_URL_FIELDS.find(
                    (field) => !current.includes(field),
                  );
                  if (!nextField) return current;
                  return [...current, nextField];
                });
              }}
            >
              Add link
            </button>
          </div>
        )}

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

type InlineEditableLabelProps = {
  value: string;
  onChange: (value: string) => void;
};

function InlineEditableLabel({ value, onChange }: InlineEditableLabelProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const startEditing = (event?: React.MouseEvent | React.KeyboardEvent) => {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    setDraft(value);
    setIsEditing(true);
  };

  const commit = () => {
    const trimmed = draft.trim();
    onChange(trimmed || value);
    setIsEditing(false);
  };

  const cancel = () => {
    setDraft(value);
    setIsEditing(false);
  };

  if (!isEditing) {
    return (
      <span
        className={controls.editableLabel}
        role="button"
        tabIndex={0}
        onClick={(event) => startEditing(event)}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            startEditing(event);
          }
        }}
      >
        <span>{value}</span>
        <span className={controls.editableLabelHint}>Click to rename</span>
      </span>
    );
  }

  return (
    <input
      ref={inputRef}
      className={controls.editableLabelInput}
      value={draft}
      onChange={(event) => setDraft(event.target.value)}
      onBlur={commit}
      onKeyDown={(event) => {
        if (event.key === "Enter") {
          event.preventDefault();
          commit();
        }
        if (event.key === "Escape") {
          event.preventDefault();
          cancel();
        }
      }}
    />
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

function determineVisibleFields(values: PressKitFormValues): UrlFieldName[] {
  const withUrls: UrlFieldName[] = [];
  for (const field of ALL_URL_FIELDS) {
    const raw = values[field];
    if (typeof raw === "string" && raw.trim()) {
      withUrls.push(field);
    }
  }

  if (withUrls.length > 0) {
    return withUrls;
  }

  return ALL_URL_FIELDS.slice(0, 1);
}

function hydratePressKitLabelsFromStorage(
  update: React.Dispatch<React.SetStateAction<UrlLabelMap>>,
) {
  const stored = readPressKitLabels();

  update((current) => {
    const next = { ...current };

    (Object.keys(stored) as PressKitLabelKey[]).forEach((key) => {
      const label = stored[key];
      if (typeof label === "string" && label.trim()) {
        const fieldKey = key as unknown as UrlFieldName;
        next[fieldKey] = label;
      }
    });

    return next;
  });
}
