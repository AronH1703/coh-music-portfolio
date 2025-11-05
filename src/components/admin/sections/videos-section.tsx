"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import styles from "../admin-dashboard.module.scss";
import controls from "../form-controls.module.scss";
import { TextField, TextareaField } from "../form-controls";
import { videoSchema } from "@/lib/validation";
import { uploadAsset } from "@/lib/admin/uploads";

type VideoRecord = {
  id: string;
  title: string;
  description: string | null;
  videoUrl: string;
  provider: string;
  externalId: string;
  thumbnailUrl: string | null;
  videoCloudinaryPublicId: string | null;
  thumbnailCloudinaryPublicId: string | null;
  tags: string[] | null;
  createdAt: string;
  updatedAt: string;
};

type VideoUpdatePayload = {
  title: string;
  description: string | null;
  videoUrl: string;
  thumbnailUrl: string | null;
  videoCloudinaryPublicId: string | null;
  thumbnailCloudinaryPublicId: string | null;
  tags: string[] | null;
};

type MessageState =
  | { type: "success"; text: string }
  | { type: "error"; text: string }
  | null;

function normalizeVideoRecord(record: VideoRecord): VideoRecord {
  return {
    ...record,
    videoCloudinaryPublicId: record.videoCloudinaryPublicId ?? null,
    thumbnailCloudinaryPublicId: record.thumbnailCloudinaryPublicId ?? null,
  };
}

export function VideosSection() {
  const [videos, setVideos] = useState<VideoRecord[]>([]);
  const [message, setMessage] = useState<MessageState>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    videoUrl: "",
    thumbnailUrl: "",
    videoCloudinaryPublicId: "",
    thumbnailCloudinaryPublicId: "",
    tags: "",
  });
  const [isSaving, setIsSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isVideoUploading, setIsVideoUploading] = useState(false);
const [videoUploadError, setVideoUploadError] = useState<string | null>(null);
const [isThumbnailUploading, setIsThumbnailUploading] = useState(false);
const [thumbnailUploadError, setThumbnailUploadError] = useState<string | null>(null);

const videoInputRef = useRef<HTMLInputElement | null>(null);
const thumbnailInputRef = useRef<HTMLInputElement | null>(null);

const handleVideoUpload = async (file: File) => {
  setVideoUploadError(null);
  setIsVideoUploading(true);
  try {
    const result = await uploadAsset(file, {
      folder: "coh-music/videos",
      resourceType: "video",
    });
    setFormData((prev) => ({
      ...prev,
      videoUrl: result.secureUrl,
      videoCloudinaryPublicId: result.publicId,
    }));
  } catch (error) {
    setVideoUploadError((error as Error).message);
  } finally {
    setIsVideoUploading(false);
  }
};

const clearVideoUpload = () => {
  setFormData((prev) => ({
    ...prev,
    videoCloudinaryPublicId: "",
  }));
};

const handleThumbnailUpload = async (file: File) => {
  setThumbnailUploadError(null);
  setIsThumbnailUploading(true);
  try {
    const result = await uploadAsset(file, {
      folder: "coh-music/videos/thumbnails",
      resourceType: "image",
    });
    setFormData((prev) => ({
      ...prev,
      thumbnailUrl: result.secureUrl,
      thumbnailCloudinaryPublicId: result.publicId,
    }));
  } catch (error) {
    setThumbnailUploadError((error as Error).message);
  } finally {
    setIsThumbnailUploading(false);
  }
};

const clearThumbnailUpload = () => {
  setFormData((prev) => ({
    ...prev,
    thumbnailCloudinaryPublicId: "",
  }));
};

useEffect(() => {
    let active = true;

    (async () => {
      setLoading(true);
      const response = await fetch("/api/videos", { cache: "no-store" });
      if (response.ok) {
        const { data } = await response.json();
        if (active)
          setVideos((data as VideoRecord[]).map(normalizeVideoRecord));
      }
      if (active) setLoading(false);
    })();

    return () => {
      active = false;
    };
  }, []);

  // removed duplicate useCallback upload handlers

  const submitVideo = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaving(true);
    setMessage(null);

    const tags = formData.tags
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);

    const parsed = videoSchema.safeParse({
      title: formData.title,
      description: formData.description || undefined,
      videoUrl: formData.videoUrl,
      videoCloudinaryPublicId:
        formData.videoCloudinaryPublicId || undefined,
      thumbnailUrl: formData.thumbnailUrl || undefined,
      thumbnailCloudinaryPublicId:
        formData.thumbnailCloudinaryPublicId || undefined,
      tags,
    });

    if (!parsed.success) {
      setMessage({
        type: "error",
        text: "Validation failed. Double-check required fields.",
      });
      setIsSaving(false);
      return;
    }

    const response = await fetch("/api/videos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(parsed.data),
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      setMessage({
        type: "error",
        text: payload?.error ?? "Failed to add video.",
      });
      setIsSaving(false);
      return;
    }

    const { data } = await response.json();
    const record = normalizeVideoRecord(data as VideoRecord);
    setVideos((previous) => [record, ...previous]);
    setFormData({
      title: "",
      description: "",
      videoUrl: "",
      thumbnailUrl: "",
      videoCloudinaryPublicId: "",
      thumbnailCloudinaryPublicId: "",
      tags: "",
    });
    setMessage({ type: "success", text: "Video added." });
    setIsSaving(false);
  };

  const handleUpdate = useCallback(
    async (id: string, payload: VideoUpdatePayload) => {
      const parsed = videoSchema.safeParse({
        title: payload.title,
        description: payload.description ?? undefined,
        videoUrl: payload.videoUrl,
        videoCloudinaryPublicId:
          payload.videoCloudinaryPublicId ?? undefined,
        thumbnailUrl: payload.thumbnailUrl ?? undefined,
        thumbnailCloudinaryPublicId:
          payload.thumbnailCloudinaryPublicId ?? undefined,
        tags: payload.tags ?? undefined,
      });

      if (!parsed.success) {
        return { ok: false, message: "Validation failed." };
      }

      const response = await fetch("/api/videos", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...parsed.data }),
      });

      if (!response.ok) {
        const payloadError = await response.json().catch(() => null);
        return {
          ok: false,
          message: payloadError?.error ?? "Failed to update video.",
        };
      }

      const { data } = await response.json();
      const updatedRecord = normalizeVideoRecord(data as VideoRecord);
      setVideos((previous) =>
        previous.map((item) =>
          item.id === id ? updatedRecord : item,
        ),
      );
      return { ok: true };
    },
    [],
  );

  const handleDelete = useCallback(async (id: string) => {
    const response = await fetch(`/api/videos?id=${id}`, { method: "DELETE" });
    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      return {
        ok: false,
        message: payload?.error ?? "Failed to delete video.",
      };
    }
    setVideos((previous) => previous.filter((item) => item.id !== id));
    return { ok: true };
  }, []);

  return (
    <div className={styles.card}>
      <form onSubmit={submitVideo} className={styles.fieldset}>
        <h2 className={styles.sectionTitle}>Add video embed</h2>

        <TextField
          label="Title"
          name="title"
          placeholder="Live at Gothenburg Hall"
          value={formData.title}
          onChange={(event) =>
            setFormData((prev) => ({ ...prev, title: event.target.value }))
          }
        />

        <TextareaField
          label="Description"
          name="description"
          placeholder="Short context about the performance."
          rows={3}
          value={formData.description}
          onChange={(event) =>
            setFormData((prev) => ({
              ...prev,
              description: event.target.value,
            }))
          }
        />

        <TextField
          label="Video URL"
          name="videoUrl"
          placeholder="https://www.youtube.com/watch?v=..."
          value={formData.videoUrl}
          onChange={(event) =>
            setFormData((prev) => ({ ...prev, videoUrl: event.target.value }))
          }
        />

        <input
          ref={videoInputRef}
          type="file"
          accept="video/*,audio/*"
          style={{ display: "none" }}
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) {
              void handleVideoUpload(file);
              event.target.value = "";
            }
          }}
        />

        <div className={controls.formField}>
          <span className={controls.label}>Upload video file</span>
          <div className={styles.fieldGroup}>
            <button
              type="button"
              className={styles.secondaryButton}
              onClick={() => videoInputRef.current?.click()}
              disabled={isVideoUploading}
            >
              {isVideoUploading ? "Uploading…" : "Upload from computer"}
            </button>
            <button
              type="button"
              className={styles.secondaryButton}
              onClick={clearVideoUpload}
              disabled={isVideoUploading}
            >
              Clear upload
            </button>
          </div>
          {videoUploadError ? (
            <span className={controls.error}>{videoUploadError}</span>
          ) : (
            <span className={controls.helper}>
              MP4, MOV, or audio files. Uploading stores the secure Cloudinary URL automatically.
            </span>
          )}
        </div>

        <TextField
          label="Video public ID"
          name="videoCloudinaryPublicId"
          placeholder="coh-music/videos/..."
          helperText="Optional override for Cloudinary-hosted videos."
          value={formData.videoCloudinaryPublicId}
          onChange={(event) =>
            setFormData((prev) => ({
              ...prev,
              videoCloudinaryPublicId: event.target.value,
            }))
          }
        />

        <div className={styles.fieldGroup}>
          <TextField
            label="Thumbnail URL"
            name="thumbnailUrl"
            placeholder="https://res.cloudinary.com/..."
            value={formData.thumbnailUrl}
            onChange={(event) =>
              setFormData((prev) => ({
                ...prev,
                thumbnailUrl: event.target.value,
              }))
            }
          />
          <TextField
            label="Thumbnail public ID"
            name="thumbnailCloudinaryPublicId"
            placeholder="coh-music/videos/thumbnails/..."
            helperText="Auto-set when uploading."
            value={formData.thumbnailCloudinaryPublicId}
            onChange={(event) =>
              setFormData((prev) => ({
                ...prev,
                thumbnailCloudinaryPublicId: event.target.value,
              }))
            }
          />
          <TextField
            label="Tags"
            name="tags"
            placeholder="live, documentary"
            helperText="Comma-separated tags."
            value={formData.tags}
            onChange={(event) =>
              setFormData((prev) => ({ ...prev, tags: event.target.value }))
            }
          />
        </div>

        <input
          ref={thumbnailInputRef}
          type="file"
          accept="image/*"
          style={{ display: "none" }}
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) {
              void handleThumbnailUpload(file);
              event.target.value = "";
            }
          }}
        />
        <div className={controls.formField}>
          <span className={controls.label}>Upload thumbnail</span>
          <div className={styles.fieldGroup}>
            <button
              type="button"
              className={styles.secondaryButton}
              onClick={() => thumbnailInputRef.current?.click()}
              disabled={isThumbnailUploading}
            >
              {isThumbnailUploading ? "Uploading…" : "Upload from computer"}
            </button>
            <button
              type="button"
              className={styles.secondaryButton}
              onClick={clearThumbnailUpload}
              disabled={isThumbnailUploading}
            >
              Clear upload
            </button>
          </div>
          {thumbnailUploadError ? (
            <span className={controls.error}>{thumbnailUploadError}</span>
          ) : (
            <span className={controls.helper}>
              Use JPG or PNG up to 5 MB to set a custom cover frame.
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
            disabled={isSaving}
          >
            {isSaving ? "Saving…" : "Add video"}
          </button>
          <button
            type="button"
            className={styles.secondaryButton}
            onClick={() => {
              setFormData({
                title: "",
                description: "",
                videoUrl: "",
                thumbnailUrl: "",
                videoCloudinaryPublicId: "",
                thumbnailCloudinaryPublicId: "",
                tags: "",
              });
              setMessage(null);
            }}
          >
            Reset
          </button>
        </div>
      </form>

      <div className={styles.divider} />

      <h3 className={styles.sectionTitle}>Existing videos</h3>

      {loading ? (
        <div className={styles.emptyState}>Loading videos…</div>
      ) : videos.length === 0 ? (
        <div className={styles.emptyState}>
          No videos yet. Add your first embed to populate the public carousel.
        </div>
      ) : (
        <div className={styles.list}>
          {videos.map((video) => (
            <VideoListItem
              key={video.id}
              record={video}
              onUpdate={handleUpdate}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}

type VideoListItemProps = {
  record: VideoRecord;
  onUpdate: (
    id: string,
    payload: VideoUpdatePayload,
  ) => Promise<{ ok: boolean; message?: string }>;
  onDelete: (id: string) => Promise<{ ok: boolean; message?: string }>;
};

function VideoListItem({ record, onUpdate, onDelete }: VideoListItemProps) {
  const [state, setState] = useState({
    title: record.title ?? "",
    description: record.description ?? "",
    videoUrl: record.videoUrl,
    thumbnailUrl: record.thumbnailUrl ?? "",
    videoCloudinaryPublicId: record.videoCloudinaryPublicId ?? "",
    thumbnailCloudinaryPublicId: record.thumbnailCloudinaryPublicId ?? "",
    tags: Array.isArray(record.tags) ? record.tags.join(", ") : "",
  });
  const [message, setMessage] = useState<MessageState>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isVideoUploading, setIsVideoUploading] = useState(false);
  const [videoUploadError, setVideoUploadError] = useState<string | null>(null);
  const [isThumbnailUploading, setIsThumbnailUploading] = useState(false);
  const [thumbnailUploadError, setThumbnailUploadError] = useState<string | null>(null);

  const videoInputRef = useRef<HTMLInputElement | null>(null);
  const thumbnailInputRef = useRef<HTMLInputElement | null>(null);

  const saveChanges = async () => {
    setIsSaving(true);
    setMessage(null);

    const tags = state.tags
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);

    const result = await onUpdate(record.id, {
      title: state.title,
      description: state.description || null,
      videoUrl: state.videoUrl,
      videoCloudinaryPublicId: state.videoCloudinaryPublicId || null,
      thumbnailUrl: state.thumbnailUrl || null,
      thumbnailCloudinaryPublicId: state.thumbnailCloudinaryPublicId || null,
      tags,
    });

    if (!result.ok) {
      setMessage({
        type: "error",
        text: result.message ?? "Failed to update video.",
      });
    } else {
      setMessage({ type: "success", text: "Video updated." });
    }
    setIsSaving(false);
  };

  const deleteVideo = async () => {
    if (!window.confirm("Remove this video?")) return;
    setIsDeleting(true);
    const result = await onDelete(record.id);
    if (!result.ok) {
      setMessage({
        type: "error",
        text: result.message ?? "Failed to delete video.",
      });
    }
    setIsDeleting(false);
  };

  const handleVideoUpload = async (file: File) => {
    setVideoUploadError(null);
    setIsVideoUploading(true);
    try {
      const result = await uploadAsset(file, {
        folder: "coh-music/videos",
        resourceType: "video",
      });
      setState((prev) => ({
        ...prev,
        videoUrl: result.secureUrl,
        videoCloudinaryPublicId: result.publicId,
      }));
    } catch (error) {
      setVideoUploadError((error as Error).message);
    } finally {
      setIsVideoUploading(false);
    }
  };

  const clearVideoUpload = () => {
    setState((prev) => ({
      ...prev,
      videoCloudinaryPublicId: "",
    }));
  };

  const handleThumbnailUpload = async (file: File) => {
    setThumbnailUploadError(null);
    setIsThumbnailUploading(true);
    try {
      const result = await uploadAsset(file, {
        folder: "coh-music/videos/thumbnails",
        resourceType: "image",
      });
      setState((prev) => ({
        ...prev,
        thumbnailUrl: result.secureUrl,
        thumbnailCloudinaryPublicId: result.publicId,
      }));
    } catch (error) {
      setThumbnailUploadError((error as Error).message);
    } finally {
      setIsThumbnailUploading(false);
    }
  };

  const clearThumbnailUpload = () => {
    setState((prev) => ({
      ...prev,
      thumbnailCloudinaryPublicId: "",
    }));
  };

  return (
    <article className={styles.listItem}>
      <header className={styles.listItemHeader}>
        <div>
          <div className={styles.listItemTitle}>{state.title || record.title}</div>
          <div className={styles.timestamp}>
            Added {new Date(record.createdAt).toLocaleString()}
          </div>
        </div>
        <span className={styles.status}>{record.provider}</span>
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
          value={state.videoUrl}
          onChange={(event) =>
            setState((prev) => ({ ...prev, videoUrl: event.target.value }))
          }
          placeholder="Video URL"
        />
        <input
          className={controls.input}
          value={state.videoCloudinaryPublicId}
          onChange={(event) =>
            setState((prev) => ({
              ...prev,
              videoCloudinaryPublicId: event.target.value,
            }))
          }
          placeholder="Video public ID"
        />
      </div>

      <input
        ref={videoInputRef}
        type="file"
        accept="video/*,audio/*"
        style={{ display: "none" }}
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) {
            void handleVideoUpload(file);
            event.target.value = "";
          }
        }}
      />

      <div className={styles.fieldGroup}>
        <button
          type="button"
          className={styles.secondaryButton}
          onClick={() => videoInputRef.current?.click()}
          disabled={isVideoUploading}
        >
          {isVideoUploading ? "Uploading…" : "Upload video"}
        </button>
        <button
          type="button"
          className={styles.secondaryButton}
          onClick={clearVideoUpload}
          disabled={isVideoUploading}
        >
          Clear upload
        </button>
        {videoUploadError ? (
          <span className={controls.error}>{videoUploadError}</span>
        ) : (
          <span className={controls.helper}>
            Replace or attach a locally hosted video using Cloudinary.
          </span>
        )}
      </div>

      <textarea
        className={controls.textarea}
        value={state.description}
        onChange={(event) =>
          setState((prev) => ({ ...prev, description: event.target.value }))
        }
        rows={3}
        placeholder="Description"
      />

      <div className={styles.fieldGroup}>
        <input
          className={controls.input}
          value={state.thumbnailUrl}
          onChange={(event) =>
            setState((prev) => ({ ...prev, thumbnailUrl: event.target.value }))
          }
          placeholder="Thumbnail URL"
        />
        <input
          className={controls.input}
          value={state.thumbnailCloudinaryPublicId}
          onChange={(event) =>
            setState((prev) => ({
              ...prev,
              thumbnailCloudinaryPublicId: event.target.value,
            }))
          }
          placeholder="Thumbnail public ID"
        />
        <input
          className={controls.input}
          value={state.tags}
          onChange={(event) =>
            setState((prev) => ({ ...prev, tags: event.target.value }))
          }
          placeholder="Tags (comma separated)"
        />
      </div>

      <input
        ref={thumbnailInputRef}
        type="file"
        accept="image/*"
        style={{ display: "none" }}
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) {
            void handleThumbnailUpload(file);
            event.target.value = "";
          }
        }}
      />

      <div className={styles.fieldGroup}>
        <button
          type="button"
          className={styles.secondaryButton}
          onClick={() => thumbnailInputRef.current?.click()}
          disabled={isThumbnailUploading}
        >
          {isThumbnailUploading ? "Uploading…" : "Upload thumbnail"}
        </button>
        <button
          type="button"
          className={styles.secondaryButton}
          onClick={clearThumbnailUpload}
          disabled={isThumbnailUploading}
        >
          Clear upload
        </button>
        {thumbnailUploadError ? (
          <span className={controls.error}>{thumbnailUploadError}</span>
        ) : (
          <span className={controls.helper}>
            Upload a custom image to override the default thumbnail.
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
          onClick={deleteVideo}
          disabled={isDeleting}
        >
          {isDeleting ? "Deleting…" : "Delete"}
        </button>
      </div>
    </article>
  );
}
