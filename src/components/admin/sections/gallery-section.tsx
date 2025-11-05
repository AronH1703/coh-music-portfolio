"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import styles from "../admin-dashboard.module.scss";
import controls from "../form-controls.module.scss";
import { TextField, TextareaField } from "../form-controls";
import { galleryItemSchema } from "@/lib/validation";

const FIVE_MB = 5 * 1024 * 1024;

type GalleryItemRecord = {
  id: string;
  title: string;
  caption: string | null;
  imageUrl: string;
  altText: string | null;
  category: string | null;
  tags: string[] | null;
  sortOrder: number;
  uploadedAt: string;
  createdAt: string;
  updatedAt: string;
};

type UploadFormValues = {
  title: string;
  caption: string;
  altText: string;
  category: string;
  tags: string;
  sortOrder: number;
};

type MessageState =
  | { type: "success"; text: string }
  | { type: "error"; text: string }
  | null;

const uploadFormSchema = z.object({
  title: z.string().min(2),
  caption: z.string().optional(),
  altText: z.string().optional(),
  category: z.string().optional(),
  tags: z.string().optional(),
  sortOrder: z.number().int().nonnegative().optional(),
});

export function GallerySection() {
  const [items, setItems] = useState<GalleryItemRecord[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [message, setMessage] = useState<MessageState>(null);
  const [isLoading, setIsLoading] = useState(true);
  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting, errors },
  } = useForm<UploadFormValues>({
    defaultValues: {
      title: "",
      caption: "",
      altText: "",
      category: "",
      tags: "",
      sortOrder: 0,
    },
  });

  useEffect(() => {
    let active = true;

    (async () => {
      setIsLoading(true);
      const response = await fetch("/api/gallery", { cache: "no-store" });
      if (response.ok) {
        const { data } = await response.json();
        if (active) {
          setItems(
            (data as GalleryItemRecord[]).map((item) => {
              const rawTags = item.tags as unknown;
              let tags: string[] | null = null;
              if (Array.isArray(rawTags)) {
                tags = rawTags.filter((tag): tag is string => typeof tag === "string");
              } else if (rawTags && typeof rawTags === "object" && Array.isArray((rawTags as any).set)) {
                tags = ((rawTags as any).set as unknown[]).filter((tag): tag is string => typeof tag === "string");
              }

              return {
                ...item,
                tags: tags ?? [],
              };
            }),
          );
        }
      }
      if (active) setIsLoading(false);
    })();

    return () => {
      active = false;
    };
  }, []);

  const onSubmit = handleSubmit(async (values) => {
    setMessage(null);

    if (!file) {
      setMessage({ type: "error", text: "Please select an image before uploading." });
      return;
    }

    if (file.size > FIVE_MB) {
      setMessage({ type: "error", text: "Image must be 5 MB or smaller." });
      return;
    }

    const parsedBase = uploadFormSchema.safeParse({
      ...values,
      sortOrder: Number(values.sortOrder ?? 0),
    });

    if (!parsedBase.success) {
      setMessage({
        type: "error",
        text: "Validation failed. Check the form fields.",
      });
      return;
    }

    const tags = parsedBase.data.tags
      ? parsedBase.data.tags
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean)
      : undefined;

    const validated = galleryItemSchema.safeParse({
      title: parsedBase.data.title,
      caption: parsedBase.data.caption || undefined,
      altText: parsedBase.data.altText || undefined,
      category: parsedBase.data.category || undefined,
      tags,
      sortOrder: parsedBase.data.sortOrder,
    });

    if (!validated.success) {
      setMessage({
        type: "error",
        text: "Validation failed. Please review your inputs.",
      });
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("title", validated.data.title);
    if (validated.data.caption) formData.append("caption", validated.data.caption);
    if (validated.data.altText) formData.append("altText", validated.data.altText);
    if (validated.data.category) formData.append("category", validated.data.category);
    if (validated.data.tags) formData.append("tags", JSON.stringify(validated.data.tags));
    formData.append("sortOrder", String(validated.data.sortOrder ?? 0));

    const response = await fetch("/api/gallery", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      setMessage({
        type: "error",
        text: payload?.error ?? "Failed to upload image.",
      });
      return;
    }

    const { data } = await response.json();
    setItems((previous) => [data as GalleryItemRecord, ...previous]);
    reset();
    setFile(null);
    setMessage({ type: "success", text: "Image uploaded successfully." });
  });

  const handleUpdate = useCallback(
    async (id: string, updatedFields: Partial<GalleryItemRecord>) => {
      const parsed = galleryItemSchema.safeParse({
        title: updatedFields.title,
        caption: updatedFields.caption ?? undefined,
        altText: updatedFields.altText ?? undefined,
        category: updatedFields.category ?? undefined,
        tags: updatedFields.tags ?? undefined,
        sortOrder: updatedFields.sortOrder ?? 0,
      });

      if (!parsed.success) {
        return {
          ok: false,
          message: "Invalid data. Please review your inputs.",
        };
      }

      const response = await fetch("/api/gallery", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...parsed.data }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        return {
          ok: false,
          message: payload?.error ?? "Failed to update gallery item.",
        };
      }

      const { data } = await response.json();
      setItems((previous) =>
        previous.map((item) => (item.id === id ? (data as GalleryItemRecord) : item)),
      );

      return { ok: true };
    },
    [],
  );

  const handleDelete = useCallback(async (id: string) => {
    const response = await fetch(`/api/gallery?id=${id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      return {
        ok: false,
        message: payload?.error ?? "Failed to delete gallery item.",
      };
    }

    setItems((previous) => previous.filter((item) => item.id !== id));
    return { ok: true };
  }, []);

  const uploadDisabled = useMemo(
    () => isSubmitting || !file,
    [file, isSubmitting],
  );

  return (
    <div className={styles.card}>
      <h2 className={styles.sectionTitle}>Upload new imagery</h2>
      <form onSubmit={onSubmit} className={styles.fieldset}>
        <div className={styles.fieldGroup}>
          <div className={controls.formField}>
            <label className={controls.label}>Select image</label>
            <div className={styles.actions}>
              <input
                type="file"
                accept="image/*"
                onChange={(event) => {
                  const selected = event.target.files?.[0];
                  if (!selected) {
                    setFile(null);
                    return;
                  }
                  if (selected.size > FIVE_MB) {
                    setMessage({
                      type: "error",
                      text: "Image must be 5 MB or smaller.",
                    });
                    event.target.value = "";
                    return;
                  }
                  setFile(selected);
                }}
              />
              {file && (
                <span className={controls.helper}>
                  {file.name} ({Math.round(file.size / 1024)} KB)
                </span>
              )}
            </div>
          </div>
        </div>

        <div className={styles.fieldGroup}>
          <TextField
            label="Title"
            placeholder="In-studio shot"
            {...register("title", { required: true })}
            error={errors.title}
          />
          <TextField
            label="Category"
            placeholder="Behind the scenes"
            {...register("category")}
          />
        </div>

        <div className={styles.fieldGroup}>
          <TextareaField
            label="Caption"
            placeholder="Describe the image context."
            rows={3}
            {...register("caption")}
          />
          <TextField
            label="Alt text"
            placeholder="Composer adjusting modular synth patch."
            {...register("altText")}
          />
        </div>

        <div className={styles.fieldGroup}>
          <TextField
            label="Tags"
            placeholder="studio, live, artwork"
            helperText="Comma-separated tags for filtering."
            {...register("tags")}
          />
          <TextField
            label="Sort order"
            type="number"
            min={0}
            {...register("sortOrder", { valueAsNumber: true })}
          />
        </div>

        {message && (
          <div
            className={
              message.type === "success"
                ? styles.successMessage
                : styles.errorMessage
            }
          >
            {message.text}
          </div>
        )}

        <div className={styles.actions}>
          <button
            type="submit"
            className={styles.primaryButton}
            disabled={uploadDisabled}
          >
            {isSubmitting ? "Uploading…" : "Upload image"}
          </button>
          <button
            type="button"
            className={styles.secondaryButton}
            onClick={() => {
              reset();
              setFile(null);
              setMessage(null);
            }}
          >
            Reset form
          </button>
        </div>
      </form>

      <div className={styles.divider} />

      <h3 className={styles.sectionTitle}>Existing gallery items</h3>

      {isLoading ? (
        <div className={styles.emptyState}>Loading gallery items…</div>
      ) : items.length === 0 ? (
        <div className={styles.emptyState}>
          No gallery images yet. Upload your first asset to populate the carousel.
        </div>
      ) : (
        <div className={styles.list}>
          {items.map((item) => (
            <GalleryListItem
              key={item.id}
              item={item}
              onUpdate={handleUpdate}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}

type GalleryListItemProps = {
  item: GalleryItemRecord;
  onUpdate: (
    id: string,
    fields: Partial<GalleryItemRecord>,
  ) => Promise<{ ok: boolean; message?: string }>;
  onDelete: (
    id: string,
  ) => Promise<{ ok: boolean; message?: string }>;
};

function GalleryListItem({ item, onUpdate, onDelete }: GalleryListItemProps) {
  const [state, setState] = useState({
    title: item.title ?? "",
    caption: item.caption ?? "",
    altText: item.altText ?? "",
    category: item.category ?? "",
    tags: Array.isArray(item.tags) ? item.tags.join(", ") : "",
    sortOrder: item.sortOrder ?? 0,
  });
  const [message, setMessage] = useState<MessageState>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const formattedDate = new Date(item.uploadedAt ?? item.createdAt).toLocaleString();

  const saveChanges = async () => {
    setIsSaving(true);
    setMessage(null);

    const tagsArray = state.tags
      ? state.tags.split(",").map((tag) => tag.trim()).filter(Boolean)
      : undefined;

    const result = await onUpdate(item.id, {
      title: state.title,
      caption: state.caption,
      altText: state.altText,
      category: state.category,
      tags: tagsArray ?? [],
      sortOrder: Number(state.sortOrder) || 0,
    });

    if (!result.ok) {
      setMessage({
        type: "error",
        text: result.message ?? "Failed to save changes.",
      });
    } else {
      setMessage({ type: "success", text: "Gallery item updated." });
    }

    setIsSaving(false);
  };

  const deleteItem = async () => {
    if (!window.confirm("Remove this image from the gallery?")) {
      return;
    }
    setIsDeleting(true);
    const result = await onDelete(item.id);
    if (!result.ok) {
      setMessage({
        type: "error",
        text: result.message ?? "Failed to delete image.",
      });
    }
    setIsDeleting(false);
  };

  return (
    <article className={styles.listItem}>
      <header className={styles.listItemHeader}>
        <div>
          <div className={styles.listItemTitle}>{item.title}</div>
          <div className={styles.timestamp}>Uploaded {formattedDate}</div>
        </div>
        <a href={item.imageUrl} target="_blank" rel="noopener noreferrer">
          Preview image
        </a>
      </header>

      <div className={styles.fieldGroup}>
        <input
          className={controls.input}
          value={state.title}
          onChange={(event) =>
            setState((prev) => ({ ...prev, title: event.target.value }))
          }
          placeholder="Title"
        />
        <input
          className={controls.input}
          value={state.category}
          onChange={(event) =>
            setState((prev) => ({ ...prev, category: event.target.value }))
          }
          placeholder="Category"
        />
      </div>

      <textarea
        className={controls.textarea}
        value={state.caption}
        onChange={(event) =>
          setState((prev) => ({ ...prev, caption: event.target.value }))
        }
        placeholder="Caption"
        rows={3}
      />

      <input
        className={controls.input}
        value={state.altText}
        onChange={(event) =>
          setState((prev) => ({ ...prev, altText: event.target.value }))
        }
        placeholder="Alt text"
      />

      <div className={styles.fieldGroup}>
        <input
          className={controls.input}
          value={state.tags}
          onChange={(event) =>
            setState((prev) => ({ ...prev, tags: event.target.value }))
          }
          placeholder="Tags (comma separated)"
        />
        <input
          className={controls.input}
          type="number"
          min={0}
          value={state.sortOrder}
          onChange={(event) =>
            setState((prev) => ({
              ...prev,
              sortOrder: Number(event.target.value),
            }))
          }
          placeholder="Sort order"
        />
      </div>

      {message && (
        <div
          className={
            message.type === "success"
              ? styles.successMessage
              : styles.errorMessage
          }
        >
          {message.text}
        </div>
      )}

      <div className={styles.actions}>
        <button
          type="button"
          className={styles.primaryButton}
          onClick={saveChanges}
          disabled={isSaving}
        >
          {isSaving ? "Saving…" : "Save changes"}
        </button>
        <button
          type="button"
          className={styles.dangerButton}
          onClick={deleteItem}
          disabled={isDeleting}
        >
          {isDeleting ? "Removing…" : "Delete"}
        </button>
      </div>
    </article>
  );
}
