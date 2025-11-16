"use client";

import clsx from "clsx";
import { useCallback, useEffect, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { TextField, SelectField, ToggleField } from "../form-controls";
import { pressReleaseSchema } from "@/lib/validation";
import { uploadAsset } from "@/lib/admin/uploads";
import styles from "../admin-dashboard.module.scss";
import controls from "../form-controls.module.scss";
import { RichTextEditor } from "../rich-text-editor";

const CATEGORY_OPTIONS = ["Single", "EP/Album", "Announcement", "Update", "Other"];

type PressReleaseFormValues = z.input<typeof pressReleaseSchema>;

type PressReleaseRecord = {
  id: string;
  title: string;
  date: string;
  summary: string;
  fullContent: string | null;
  category: string;
  coverImageUrl: string | null;
  coverCloudinaryPublicId: string | null;
  pdfUrl: string | null;
  pdfCloudinaryPublicId: string | null;
  dropboxUrl: string | null;
  directDownloadUrl: string | null;
  featured: boolean;
  createdAt: string;
  updatedAt: string;
};

const DEFAULT_VALUES: PressReleaseFormValues = {
  title: "",
  date: "",
  summary: "",
  fullContent: "",
  category: "",
  coverImageUrl: "",
  coverCloudinaryPublicId: "",
  pdfUrl: "",
  pdfCloudinaryPublicId: "",
  dropboxUrl: "",
  featured: false,
};

type MessageState =
  | { type: "success"; text: string }
  | { type: "error"; text: string }
  | null;

export function PressReleasesSection() {
  const [releases, setReleases] = useState<PressReleaseRecord[]>([]);
  const [selectedRelease, setSelectedRelease] = useState<PressReleaseRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isCoverUploading, setIsCoverUploading] = useState(false);
  const [isPdfUploading, setIsPdfUploading] = useState(false);
  const [coverUploadError, setCoverUploadError] = useState<string | null>(null);
  const [pdfUploadError, setPdfUploadError] = useState<string | null>(null);
  const [message, setMessage] = useState<MessageState>(null);

  const coverInputRef = useRef<HTMLInputElement | null>(null);
  const pdfInputRef = useRef<HTMLInputElement | null>(null);

  const {
    control,
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<PressReleaseFormValues>({
    resolver: zodResolver(pressReleaseSchema),
    defaultValues: DEFAULT_VALUES,
  });

  useEffect(() => {
    let active = true;
    (async () => {
      setIsLoading(true);
      const response = await fetch("/api/press-releases", { cache: "no-store" });
      if (!active) return;
      if (response.ok) {
        const payload = await response.json().catch(() => null);
        if (payload?.data) {
          setReleases(sortReleases(payload.data as PressReleaseRecord[]));
        }
      }
      setIsLoading(false);
    })();

    return () => {
      active = false;
    };
  }, []);

  const handleCoverUpload = useCallback(
    async (file: File) => {
      setCoverUploadError(null);
      setIsCoverUploading(true);
      try {
        const result = await uploadAsset(file, {
          folder: "coh-music/press-releases/covers",
          resourceType: "image",
        });
        setValue("coverImageUrl", result.secureUrl, { shouldDirty: true });
        setValue("coverCloudinaryPublicId", result.publicId, { shouldDirty: true });
      } catch (error) {
        setCoverUploadError((error as Error).message);
      } finally {
        setIsCoverUploading(false);
      }
    },
    [setValue],
  );

  const handlePdfUpload = useCallback(
    async (file: File) => {
      setPdfUploadError(null);
      setIsPdfUploading(true);
      try {
        const result = await uploadAsset(file, {
          folder: "coh-music/press-releases/pdfs",
          resourceType: "raw",
        });
        setValue("pdfUrl", result.secureUrl, { shouldDirty: true });
        setValue("pdfCloudinaryPublicId", result.publicId, { shouldDirty: true });
      } catch (error) {
        setPdfUploadError((error as Error).message);
      } finally {
        setIsPdfUploading(false);
      }
    },
    [setValue],
  );

  const clearCover = () => {
    setValue("coverImageUrl", "", { shouldDirty: true });
    setValue("coverCloudinaryPublicId", "", { shouldDirty: true });
  };

  const clearPdf = () => {
    setValue("pdfUrl", "", { shouldDirty: true });
    setValue("pdfCloudinaryPublicId", "", { shouldDirty: true });
    setValue("dropboxUrl", "", { shouldDirty: true });
  };

  const onSubmit = async (formValues: PressReleaseFormValues) => {
    setIsSaving(true);
    setMessage(null);

    const payload = {
      ...formValues,
      dropboxUrl: formValues.dropboxUrl || undefined,
    };

    const method = selectedRelease ? "PUT" : "POST";
    const body = JSON.stringify({
      ...(selectedRelease ? { id: selectedRelease.id } : {}),
      ...payload,
    });

    const response = await fetch("/api/press-releases", {
      method,
      headers: { "Content-Type": "application/json" },
      body,
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      setMessage({
        type: "error",
        text: data?.error ?? "Could not save the press release.",
      });
      setIsSaving(false);
      return;
    }

    const normalized = normalizeRecord(data.data as PressReleaseRecord);
    setReleases((prev) => sortReleases([...prev.filter((item) => item.id !== normalized.id), normalized]));
    setMessage({
      type: "success",
      text: selectedRelease ? "Press release updated." : "Press release created.",
    });

    if (selectedRelease) {
      setSelectedRelease(normalized);
    } else {
      reset(DEFAULT_VALUES);
    }

    setIsSaving(false);
  };

  const beginEdit = (release: PressReleaseRecord) => {
    setSelectedRelease(release);
    reset({
      title: release.title,
      date: release.date.split("T")[0],
      summary: release.summary,
      fullContent: release.fullContent ?? "",
      category: release.category,
      coverImageUrl: release.coverImageUrl ?? "",
      coverCloudinaryPublicId: release.coverCloudinaryPublicId ?? "",
      pdfUrl: release.pdfUrl ?? "",
      pdfCloudinaryPublicId: release.pdfCloudinaryPublicId ?? "",
      dropboxUrl: release.dropboxUrl ?? "",
      featured: release.featured,
    });
    setMessage(null);
  };

  const cancelEdit = () => {
    setSelectedRelease(null);
    reset(DEFAULT_VALUES);
    setMessage(null);
  };

  const deleteRelease = async (release: PressReleaseRecord) => {
    if (!confirm(`Delete "${release.title}"? This cannot be undone.`)) {
      return;
    }
    const response = await fetch(`/api/press-releases?id=${release.id}`, { method: "DELETE" });
    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      setMessage({
        type: "error",
        text: payload?.error ?? "Unable to delete the press release.",
      });
      return;
    }

    setReleases((prev) => prev.filter((item) => item.id !== release.id));
    if (selectedRelease?.id === release.id) {
      cancelEdit();
    }
    setMessage({ type: "success", text: "Press release deleted." });
  };

  return (
    <div className={styles.card}>
      <form onSubmit={handleSubmit(onSubmit)} className={styles.fieldset}>
        <div className={styles.fieldGroup}>
          <TextField
            label="Title"
            placeholder="Official press release title"
            {...register("title")}
            error={errors.title}
          />
          <TextField
            label="Release date"
            type="date"
            {...register("date")}
            error={errors.date}
          />
          <SelectField
            label="Category"
            {...register("category")}
            error={errors.category}
          >
            <option value="">Select category</option>
            {CATEGORY_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </SelectField>
        </div>

        <div className={styles.fieldGroup}>
          <label className={controls.label} htmlFor="summary">
            Summary
          </label>
          <textarea
            id="summary"
            className={controls.textarea}
            placeholder="Write a concise 2-3 sentence summary."
            {...register("summary")}
          />
          {errors.summary ? (
            <span className={controls.error}>{errors.summary.message}</span>
          ) : (
            <span className={controls.helper}>Summaries help fans and press know what to expect.</span>
          )}
        </div>

        <Controller
          control={control}
          name="fullContent"
          render={({ field }) => (
            <RichTextEditor
              label="Full content"
              helperText="Use the toolbar to add formatting; paste HTML if needed."
              value={field.value ?? ""}
              onChange={field.onChange}
              error={errors.fullContent}
            />
          )}
        />

        <div className={styles.fieldGroup}>
          <TextField
            label="Cover image URL"
            placeholder="https://res.cloudinary.com/..."
            {...register("coverImageUrl")}
            error={errors.coverImageUrl}
          />
          <TextField
            label="Cover image ID"
            placeholder="coh-music/press-releases/covers/..."
            {...register("coverCloudinaryPublicId")}
            error={errors.coverCloudinaryPublicId}
            helperText="Set automatically when uploading."
          />
        </div>

        <div className={styles.fieldGroup}>
          <div className={controls.formField}>
            <span className={controls.label}>Upload cover image</span>
            <div className={styles.actions}>
              <button
                type="button"
                className={styles.secondaryButton}
                onClick={() => coverInputRef.current?.click()}
                disabled={isCoverUploading}
              >
                {isCoverUploading ? "Uploading…" : "Upload cover"}
              </button>
              <button
                type="button"
                className={styles.secondaryButton}
                onClick={clearCover}
                disabled={isCoverUploading}
              >
                Clear cover
              </button>
            </div>
            {coverUploadError && <span className={controls.error}>{coverUploadError}</span>}
            {!coverUploadError && (
              <span className={controls.helper}>
                JPG, PNG, WEBP up to 5 MB. Uploaded images store a Cloudinary public ID.
              </span>
            )}
          </div>
        </div>

        <input
          ref={coverInputRef}
          type="file"
          accept="image/*"
          style={{ display: "none" }}
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) {
              void handleCoverUpload(file);
              event.target.value = "";
            }
          }}
        />

        <div className={styles.fieldGroup}>
          <TextField
            label="PDF URL"
            placeholder="https://example.com/press-release.pdf"
            {...register("pdfUrl")}
            error={errors.pdfUrl}
          />
          <TextField
            label="PDF public ID"
            placeholder="coh-music/press-releases/pdfs/..."
            {...register("pdfCloudinaryPublicId")}
            error={errors.pdfCloudinaryPublicId}
            helperText="Generated when uploading a PDF."
          />
        </div>

        <div className={styles.fieldGroup}>
          <div className={controls.formField}>
            <span className={controls.label}>Upload PDF</span>
            <div className={styles.actions}>
              <button
                type="button"
                className={styles.secondaryButton}
                onClick={() => pdfInputRef.current?.click()}
                disabled={isPdfUploading}
              >
                {isPdfUploading ? "Uploading…" : "Upload PDF"}
              </button>
              <button
                type="button"
                className={styles.secondaryButton}
                onClick={clearPdf}
                disabled={isPdfUploading}
              >
                Clear PDF
              </button>
            </div>
            {pdfUploadError && <span className={controls.error}>{pdfUploadError}</span>}
            {!pdfUploadError && (
              <span className={controls.helper}>
                PDF uploads (raw) are stored on Cloudinary; dropbox links are converted automatically.
              </span>
            )}
          </div>
        </div>

        <input
          ref={pdfInputRef}
          type="file"
          accept=".pdf"
          style={{ display: "none" }}
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) {
              void handlePdfUpload(file);
              event.target.value = "";
            }
          }}
        />

        <div className={styles.fieldGroup}>
          <TextField
            label="Dropbox link (optional)"
            placeholder="https://www.dropbox.com/s/abc123/file.pdf?dl=0"
            {...register("dropboxUrl")}
            error={errors.dropboxUrl}
            helperText="Dropbox links are converted to direct downloads automatically."
          />
        </div>

        <div className={styles.fieldGroup}>
          <ToggleField
            label="Feature this release"
            checked={watch("featured")}
            onChange={(checked) => setValue("featured", checked, { shouldDirty: true })}
            helperText="Featured releases jump to the top of the public list."
          />
        </div>

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
          <button type="submit" className={styles.primaryButton} disabled={isSaving || isSubmitting}>
            {isSaving || isSubmitting
              ? "Saving…"
              : selectedRelease
                ? "Update press release"
                : "Create press release"}
          </button>
          {selectedRelease && (
            <button type="button" className={styles.secondaryButton} onClick={cancelEdit}>
              Cancel edit
            </button>
          )}
        </div>
      </form>

      <div>
        <header className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Existing press releases</h2>
        </header>
        {isLoading ? (
          <div className={styles.emptyState}>Loading press releases…</div>
        ) : (
          <div className={styles.list}>
            {releases.length === 0 && (
              <div className={styles.emptyState}>
                No press releases yet. Publish one using the form above.
              </div>
            )}
            {releases.map((release) => (
              <article key={release.id} className={styles.listItem}>
                <div className={styles.listItemHeader}>
                  <div>
                    <p className={styles.listItemTitle}>{release.title}</p>
                    <p className={controls.helper}>
                      {formatDate(release.date)} • {release.category}
                      {release.featured && " • Featured"}
                    </p>
                  </div>
                  <div className={styles.actions}>
                    <button
                      type="button"
                      className={styles.secondaryButton}
                      onClick={() => beginEdit(release)}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className={styles.dangerButton}
                      onClick={() => void deleteRelease(release)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
                <p>{release.summary}</p>
                {release.directDownloadUrl && (
                  <a
                    className="link"
                    href={release.directDownloadUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Download link
                  </a>
                )}
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function normalizeRecord(record: PressReleaseRecord): PressReleaseRecord {
  return {
    ...record,
    coverImageUrl: record.coverImageUrl ?? null,
    coverCloudinaryPublicId: record.coverCloudinaryPublicId ?? null,
    pdfUrl: record.pdfUrl ?? null,
    pdfCloudinaryPublicId: record.pdfCloudinaryPublicId ?? null,
    dropboxUrl: record.dropboxUrl ?? null,
    directDownloadUrl: record.directDownloadUrl ?? null,
    fullContent: record.fullContent ?? null,
  };
}

function sortReleases(items: PressReleaseRecord[]) {
  return [...items].sort((a, b) => {
    if (a.featured !== b.featured) {
      return a.featured ? -1 : 1;
    }
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });
}

function formatDate(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(parsed);
}
