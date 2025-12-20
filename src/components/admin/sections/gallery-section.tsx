"use client";

import { useCallback, useEffect, useMemo, useState, type ChangeEvent } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import styles from "../admin-dashboard.module.scss";
import controls from "../form-controls.module.scss";
import { TextField } from "../form-controls";
import { galleryItemSchema } from "@/lib/validation";

const FIVE_MB = 5 * 1024 * 1024;

type GalleryItemRecord = {
  id: string;
  title: string;
  caption: string | null;
  imageUrl: string;
  cloudinaryPublicId: string | null;
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
  imageUrl: string;
  cloudinaryPublicId: string;
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
  const [manualImageUrl, setManualImageUrl] = useState("");
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
      imageUrl: "",
      cloudinaryPublicId: "",
    },
  });
  const imageUrlRegister = register("imageUrl", {
    onChange: (event: ChangeEvent<HTMLInputElement>) => {
      setManualImageUrl(event.target.value);
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
              } else if (
                rawTags &&
                typeof rawTags === "object" &&
                Array.isArray((rawTags as { set?: unknown[] }).set)
              ) {
                tags =
                  ((rawTags as { set?: unknown[] }).set ?? []).filter(
                    (tag): tag is string => typeof tag === "string",
                  );
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

    const trimmedImageUrl = values.imageUrl?.trim() ?? "";
    const trimmedCloudinaryPublicId = values.cloudinaryPublicId?.trim() ?? "";

    if (!file && !trimmedImageUrl) {
      setMessage({
        type: "error",
        text: "Upload an image or paste a Cloudinary image URL.",
      });
      return;
    }

    if (file && file.size > FIVE_MB) {
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
      imageUrl: trimmedImageUrl || undefined,
      cloudinaryPublicId: trimmedCloudinaryPublicId || undefined,
    });

    if (!validated.success) {
      setMessage({
        type: "error",
        text: "Validation failed. Please review your inputs.",
      });
      return;
    }

    const formData = new FormData();
    if (file) {
      formData.append("file", file);
    }
    formData.append("title", validated.data.title);
    if (validated.data.caption) formData.append("caption", validated.data.caption);
    if (validated.data.altText) formData.append("altText", validated.data.altText);
    if (validated.data.category) formData.append("category", validated.data.category);
    if (validated.data.tags) formData.append("tags", JSON.stringify(validated.data.tags));
    formData.append("sortOrder", String(validated.data.sortOrder ?? 0));
    if (trimmedImageUrl) formData.append("imageUrl", trimmedImageUrl);
    if (trimmedCloudinaryPublicId) {
      formData.append("cloudinaryPublicId", trimmedCloudinaryPublicId);
    }

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
    setManualImageUrl("");
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
        imageUrl: updatedFields.imageUrl ?? undefined,
        cloudinaryPublicId: updatedFields.cloudinaryPublicId ?? undefined,
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
    () => isSubmitting || (!file && !manualImageUrl.trim()),
    [file, isSubmitting, manualImageUrl],
  );

  return (
    <div className={styles.card}>
      <h2 className={styles.sectionTitle}>Hlaða upp nýjum myndum</h2>
      <form onSubmit={onSubmit} className={styles.fieldset}>
        <div className={styles.fieldGroup}>
          <div className={controls.formField}>
            <label className={controls.label}>Veldu mynd</label>
            <div className={controls.fileInput}>
              <label className={controls.fileField}>
                <span className={controls.fileFieldLabel}>
                  {file ? "Skipta um valda mynd" : "Smelltu til að velja mynd"}
                </span>
                <span className={controls.fileFieldHint}>
                  {file
                    ? `${file.name} (${Math.round(file.size / 1024)} KB)`
                    : "Hámark 5 MB • JPG, PNG eða WebP"}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  className={controls.fileNativeInput}
                  onChange={(event) => {
                    const selected = event.target.files?.[0];
                    if (!selected) {
                      setFile(null);
                      return;
                    }
                    if (selected.size > FIVE_MB) {
                      setMessage({
                        type: "error",
                        text: "Mynd verður að vera 5 MB eða minni.",
                      });
                      event.target.value = "";
                      return;
                    }
                    setFile(selected);
                  }}
                />
              </label>
            </div>
          </div>
        </div>

        <div className={styles.fieldGroup}>
          <TextField
            label="Slóð á mynd"
            placeholder="https://res.cloudinary.com/..."
            helperText="Límdu inn Cloudinary-slóð í stað þess að hlaða upp."
            {...imageUrlRegister}
            error={errors.imageUrl}
          />
          {/*
          <TextField
            label="Cloudinary public ID"
            placeholder="coh-music/gallery/..."
            helperText="Valfrjálst, notað til að eyða gögnum úr Cloudinary."
            {...register("cloudinaryPublicId")}
            error={errors.cloudinaryPublicId}
          />
          */}
        </div>

        <div className={styles.fieldGroup}>
          <TextField
            label="Titill"
            placeholder="Titll myndarinnar"
            {...register("title", { required: true })}
            error={errors.title}
          />
          <TextField
            label="Flokkur"
            placeholder="Bakvið tjöldin"
            {...register("category")}
          />
        </div>

        <div className={styles.fieldGroup}>
          {/*
          <TextareaField
            label="Texti/myndalýsing"
            placeholder="Lýstu samhengi myndarinnar."
            rows={3}
            {...register("caption")}
          />
          */}
          <TextField
            label="Myndatexti / lýsandi texti (alt)"
            placeholder="Photo: Eva Rut."
            {...register("altText")}
          />
        </div>

        <div className={styles.fieldGroup}>
          <TextField
            label="Merki"
            placeholder="stúdíó, live, umslag"
            helperText="Kommu-aðskilin merki til síunar."
            {...register("tags")}
          />
          <TextField
            label="Röðunarnúmer"
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
            {message.type === "success"
              ? message.text === "Image uploaded successfully."
                ? "Mynd hefur verið hlaðið upp."
                : message.text === "Validation failed. Check the form fields."
                ? "Staðfesting mistókst. Athugaðu reiti í eyðublaðinu."
                : message.text === "Validation failed. Please review your inputs."
                ? "Staðfesting mistókst. Farðu yfir innslegin gögn."
                : message.text
              : message.text === "Upload an image or paste a Cloudinary image URL."
              ? "Hladdu upp mynd eða límdu inn Cloudinary-myndaslóð."
              : message.text === "Image must be 5 MB or smaller."
              ? "Mynd verður að vera 5 MB eða minni."
              : message.text === "Failed to upload image."
              ? "Ekki tókst að hlaða upp mynd."
              : message.text}
          </div>
        )}

        <div className={styles.actions}>
          <button
            type="submit"
            className={styles.primaryButton}
            disabled={uploadDisabled}
          >
            {isSubmitting ? "Hleð upp…" : "Hlaða upp mynd"}
          </button>
          <button
            type="button"
            className={styles.secondaryButton}
            onClick={() => {
              reset();
              setFile(null);
              setMessage(null);
              setManualImageUrl("");
            }}
          >
            Hreinsa eyðublað
          </button>
        </div>
      </form>

      <div className={styles.divider} />

      <h3 className={styles.sectionTitle}>Myndir í safni</h3>

      {isLoading ? (
        <div className={styles.emptyState}>Sæki myndir í safn…</div>
      ) : items.length === 0 ? (
        <div className={styles.emptyState}>
          Engar myndir í safninu enn. Hladdu upp fyrstu myndinni til að fylla rennuna.
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
    imageUrl: item.imageUrl ?? "",
    cloudinaryPublicId: item.cloudinaryPublicId ?? "",
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
    const trimmedImageUrl = state.imageUrl.trim();
    const trimmedCloudinaryPublicId = state.cloudinaryPublicId.trim();

    const result = await onUpdate(item.id, {
      title: state.title,
      caption: state.caption,
      altText: state.altText,
      category: state.category,
      tags: tagsArray ?? [],
      sortOrder: Number(state.sortOrder) || 0,
      imageUrl: trimmedImageUrl,
      cloudinaryPublicId: trimmedCloudinaryPublicId,
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
          <div className={styles.timestamp}>Hlaðið upp {formattedDate}</div>
        </div>
        <a href={item.imageUrl} target="_blank" rel="noopener noreferrer">
          Skoða mynd
        </a>
      </header>

      <div className={styles.fieldGroup}>
        <input
          className={controls.input}
          value={state.title}
          onChange={(event) =>
            setState((prev) => ({ ...prev, title: event.target.value }))
          }
          placeholder="Titill"
        />
        <input
          className={controls.input}
          value={state.category}
          onChange={(event) =>
            setState((prev) => ({ ...prev, category: event.target.value }))
          }
          placeholder="Flokkur"
        />
      </div>

      {/*
      <textarea
        className={controls.textarea}
        value={state.caption}
        onChange={(event) =>
          setState((prev) => ({ ...prev, caption: event.target.value }))
        }
        placeholder="Myndatexti"
        rows={3}
      />
      */}

      <input
        className={controls.input}
        value={state.altText}
        onChange={(event) =>
          setState((prev) => ({ ...prev, altText: event.target.value }))
        }
        placeholder="Myndatexti / lýsandi texti (alt)"
      />

      <div className={styles.fieldGroup}>
        <input
          className={controls.input}
          type="url"
          value={state.imageUrl}
          onChange={(event) =>
            setState((prev) => ({ ...prev, imageUrl: event.target.value }))
          }
          placeholder="Slóð á mynd"
        />
        {/*
        <input
          className={controls.input}
          value={state.cloudinaryPublicId}
          onChange={(event) =>
            setState((prev) => ({ ...prev, cloudinaryPublicId: event.target.value }))
          }
          placeholder="Cloudinary public ID"
        />
        */}
      </div>

      <div className={styles.fieldGroup}>
        <input
          className={controls.input}
          value={state.tags}
          onChange={(event) =>
            setState((prev) => ({ ...prev, tags: event.target.value }))
          }
          placeholder="Merki (aðskilin með kommum)"
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
          placeholder="Röðunarnúmer"
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
          {message.type === "success"
            ? message.text === "Gallery item updated."
              ? "Mynd í safni uppfærð."
              : message.text
            : message.text === "Failed to save changes."
            ? "Ekki tókst að vista breytingar."
            : message.text === "Failed to delete image."
            ? "Ekki tókst að eyða mynd."
            : message.text === "Invalid data. Please review your inputs."
            ? "Ógild gögn. Farðu yfir innslegin gögn."
            : message.text === "Failed to update gallery item."
            ? "Ekki tókst að uppfæra mynd í safni."
            : message.text === "Failed to delete gallery item."
            ? "Ekki tókst að eyða mynd úr safni."
            : message.text}
        </div>
      )}

      <div className={styles.actions}>
        <button
          type="button"
          className={styles.primaryButton}
          onClick={saveChanges}
          disabled={isSaving}
        >
          {isSaving ? "Vista…" : "Vista breytingar"}
        </button>
        <button
          type="button"
          className={styles.dangerButton}
          onClick={deleteItem}
          disabled={isDeleting}
        >
          {isDeleting ? "Fjarlægi…" : "Eyða"}
        </button>
      </div>
    </article>
  );
}
