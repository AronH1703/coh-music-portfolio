"use client";

import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import styles from "../admin-dashboard.module.scss";
import controls from "../form-controls.module.scss";
import { TextField, TextareaField } from "../form-controls";
import { aboutSchema } from "@/lib/validation";
import { uploadAsset } from "@/lib/admin/uploads";

type AboutFormValues = z.input<typeof aboutSchema>;

type MessageState =
  | { type: "success"; text: string }
  | { type: "error"; text: string }
  | null;

export function AboutSection() {
  const [message, setMessage] = useState<MessageState>(null);
  const [isPhotoUploading, setIsPhotoUploading] = useState(false);
  const [photoUploadError, setPhotoUploadError] = useState<string | null>(null);
  const photoInputRef = useRef<HTMLInputElement | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<AboutFormValues>({
    resolver: zodResolver(aboutSchema),
    defaultValues: {
      aboutText: "",
      artistPhotoUrl: "",
      artistPhotoAlt: "",
      artistPhotoCloudinaryPublicId: "",
    },
  });

  useEffect(() => {
    let mounted = true;
    async function loadAbout() {
      const response = await fetch("/api/about", { cache: "no-store" });
      if (!response.ok) return;
      const { data } = await response.json();
      if (mounted && data) {
        reset({
          aboutText: data.aboutText ?? "",
          artistPhotoUrl: data.artistPhotoUrl ?? "",
          artistPhotoAlt: data.artistPhotoAlt ?? "",
          artistPhotoCloudinaryPublicId: data.artistPhotoCloudinaryPublicId ?? "",
        });
      }
    }

    void loadAbout();
    return () => {
      mounted = false;
    };
  }, [reset]);

  const handlePhotoUpload = async (file: File) => {
    setPhotoUploadError(null);
    setIsPhotoUploading(true);
    try {
      const result = await uploadAsset(file, {
        folder: "coh-music/about",
        resourceType: "image",
      });
      setValue("artistPhotoUrl", result.secureUrl, { shouldDirty: true });
      setValue("artistPhotoCloudinaryPublicId", result.publicId, {
        shouldDirty: true,
      });
    } catch (error) {
      setPhotoUploadError((error as Error).message);
    } finally {
      setIsPhotoUploading(false);
    }
  };

  const clearPhotoUpload = () => {
    setValue("artistPhotoCloudinaryPublicId", "", { shouldDirty: true });
  };

  const submit = handleSubmit(async (values) => {
    setMessage(null);
    const response = await fetch("/api/about", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      setMessage({
        type: "error",
        text: payload?.error ?? "Failed to save about content.",
      });
      return;
    }

    setMessage({ type: "success", text: "About section updated." });
  });

  return (
    <section className={styles.card}>
      <form onSubmit={submit} className={styles.fieldset}>
        <TextareaField
          label="About text"
          placeholder="Long-form biography for the public site."
          rows={6}
          {...register("aboutText")}
          error={errors.aboutText}
        />

        <div className={styles.fieldGroup}>
          <TextField
            label="Artist photo URL"
            placeholder="https://res.cloudinary.com/..."
            {...register("artistPhotoUrl")}
            error={errors.artistPhotoUrl}
          />
          <TextField
            label="Artist photo alt text"
            placeholder="Portrait in the studio."
            {...register("artistPhotoAlt")}
            error={errors.artistPhotoAlt}
          />
          <TextField
            label="Artist photo public ID"
            placeholder="coh-music/about/..."
            helperText="Auto-filled when uploading."
            {...register("artistPhotoCloudinaryPublicId")}
            error={errors.artistPhotoCloudinaryPublicId}
          />
        </div>

        <input
          ref={photoInputRef}
          type="file"
          accept="image/*"
          style={{ display: "none" }}
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) {
              void handlePhotoUpload(file);
              event.target.value = "";
            }
          }}
        />
        <div className={styles.fieldGroup}>
          <button
            type="button"
            className={styles.secondaryButton}
            onClick={() => photoInputRef.current?.click()}
            disabled={isPhotoUploading}
          >
            {isPhotoUploading ? "Uploading…" : "Upload artist photo"}
          </button>
          <button
            type="button"
            className={styles.secondaryButton}
            onClick={clearPhotoUpload}
            disabled={isPhotoUploading}
          >
            Clear upload
          </button>
          {photoUploadError ? (
            <span className={controls.error}>{photoUploadError}</span>
          ) : (
            <span className={controls.helper}>
              Use high-resolution images for the bio section. Uploading stores the Cloudinary reference automatically.
            </span>
          )}
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
            disabled={isSubmitting || !isDirty}
          >
            {isSubmitting ? "Saving…" : "Save about section"}
          </button>
          <button
            type="button"
            className={styles.secondaryButton}
            onClick={() => reset()}
          >
            Reset changes
          </button>
        </div>
      </form>
    </section>
  );
}
