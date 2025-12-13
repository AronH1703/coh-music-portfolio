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
        if (active) setVideos((data as VideoRecord[]).map(normalizeVideoRecord));
      }
      if (active) setLoading(false);
    })();

    return () => {
      active = false;
    };
  }, []);

  const submitVideo = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaving(true);
    setMessage(null);

    const title = formData.title.trim();
    const videoUrl = formData.videoUrl.trim();
    const description =
      formData.description && formData.description.trim().length > 0
        ? formData.description.trim()
        : undefined;

    const tags = formData.tags
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);

    const parsed = videoSchema.safeParse({
      title,
      description,
      videoUrl,
      videoCloudinaryPublicId: formData.videoCloudinaryPublicId || undefined,
      thumbnailUrl: formData.thumbnailUrl || undefined,
      thumbnailCloudinaryPublicId: formData.thumbnailCloudinaryPublicId || undefined,
      tags,
    });

    if (!parsed.success) {
      const flat = parsed.error.flatten();
      const firstKey = Object.keys(flat.fieldErrors)[0] as
        | keyof typeof flat.fieldErrors
        | undefined;
      const firstMessage =
        (firstKey && flat.fieldErrors[firstKey]?.[0]) ||
        "Staðfesting mistókst. Athugaðu skylda reiti.";
      setMessage({
        type: "error",
        text: firstMessage,
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
        text: payload?.error ?? "Tókst ekki að bæta við myndbandi.",
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
    setMessage({ type: "success", text: "Myndband bætt við." });
    setIsSaving(false);
  };

  const handleUpdate = useCallback(
    async (id: string, payload: VideoUpdatePayload) => {
      const parsed = videoSchema.safeParse({
        title: payload.title,
        description: payload.description ?? undefined,
        videoUrl: payload.videoUrl,
        videoCloudinaryPublicId: payload.videoCloudinaryPublicId ?? undefined,
        thumbnailUrl: payload.thumbnailUrl ?? undefined,
        thumbnailCloudinaryPublicId: payload.thumbnailCloudinaryPublicId ?? undefined,
        tags: payload.tags ?? undefined,
      });

      if (!parsed.success) {
        return { ok: false, message: "Staðfesting mistókst." };
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
          message: payloadError?.error ?? "Tókst ekki að uppfæra myndband.",
        };
      }

      const { data } = await response.json();
      const updatedRecord = normalizeVideoRecord(data as VideoRecord);
      setVideos((previous) =>
        previous.map((item) => (item.id === id ? updatedRecord : item)),
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
        message: payload?.error ?? "Tókst ekki að eyða myndbandi.",
      };
    }
    setVideos((previous) => previous.filter((item) => item.id !== id));
    return { ok: true };
  }, []);

  return (
    <div className={styles.card}>
      <form onSubmit={submitVideo} className={styles.fieldset}>
        <h2 className={styles.sectionTitle}>Bæta við myndbandi</h2>

        <TextField
          label="Titill"
          name="title"
          placeholder="Stuð í Kópavogi.."
          value={formData.title}
          onChange={(event) =>
            setFormData((prev) => ({ ...prev, title: event.target.value }))
          }
        />

        <TextareaField
          label="Lýsing"
          name="description"
          placeholder="Stutt samhengislýsing um flutninginn."
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
          label="Myndbandsslóð (URL)"
          name="videoUrl"
          placeholder="https://www.youtube.com/watch?v=..."
          value={formData.videoUrl}
          onChange={(event) =>
            setFormData((prev) => ({ ...prev, videoUrl: event.target.value }))
          }
        />

        {/* Cloudinary video upload (optional; re-enable if needed)
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
          <span className={controls.label}>Hlaða upp myndbandskafli</span>
          <div className={styles.fieldGroup}>
            <button
              type="button"
              className={styles.secondaryButton}
              onClick={() => videoInputRef.current?.click()}
              disabled={isVideoUploading}
            >
              {isVideoUploading ? "Hleð upp…" : "Hlaða upp úr tölvu"}
            </button>
            <button
              type="button"
              className={styles.secondaryButton}
              onClick={clearVideoUpload}
              disabled={isVideoUploading}
            >
              Hreinsa upphleðslu
            </button>
          </div>
          {videoUploadError ? (
            <span className={controls.error}>{videoUploadError}</span>
          ) : (
            <span className={controls.helper}>
              MP4, MOV eða hljóðskrár. Uploaderinn setur sjálfkrafa örugga Cloudinary-slóð.
            </span>
          )}
        </div>
        */}

        {/* Cloudinary video ID (optional; re-enable if needed)
        <TextField
          label="Myndbands public ID"
          name="videoCloudinaryPublicId"
          placeholder="coh-music/videos/..."
          helperText="Valfrjálst override fyrir Cloudinary-hýst myndband."
          value={formData.videoCloudinaryPublicId}
          onChange={(event) =>
            setFormData((prev) => ({
              ...prev,
              videoCloudinaryPublicId: event.target.value,
            }))
          }
        /> */}

        <div className={styles.fieldGroup}>
          {/* Cloudinary thumbnail fields (optional; re-enable if needed)
          <TextField
            label="Smámynd (URL)"
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
            label="Smámyndar public ID"
            name="thumbnailCloudinaryPublicId"
            placeholder="coh-music/videos/thumbnails/..."
            helperText="Stillist sjálfkrafa við upphleðslu."
            value={formData.thumbnailCloudinaryPublicId}
            onChange={(event) =>
              setFormData((prev) => ({
                ...prev,
                thumbnailCloudinaryPublicId: event.target.value,
              }))
            }
          /> */}
          <TextField
            label="Merki (tags)"
            name="tags"
            placeholder="live, documentary"
            helperText="Merki aðskilin með kommum."
            value={formData.tags}
            onChange={(event) =>
              setFormData((prev) => ({ ...prev, tags: event.target.value }))
            }
          />
        </div>

        {/* Cloudinary thumbnail upload (optional; re-enable if needed)
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
          <span className={controls.label}>Hlaða upp smámynd</span>
          <div className={styles.fieldGroup}>
            <button
              type="button"
              className={styles.secondaryButton}
              onClick={() => thumbnailInputRef.current?.click()}
              disabled={isThumbnailUploading}
            >
              {isThumbnailUploading ? "Hleð upp…" : "Hlaða upp úr tölvu"}
            </button>
            <button
              type="button"
              className={styles.secondaryButton}
              onClick={clearThumbnailUpload}
              disabled={isThumbnailUploading}
            >
              Hreinsa upphleðslu
            </button>
          </div>
          {thumbnailUploadError ? (
            <span className={controls.error}>{thumbnailUploadError}</span>
          ) : (
            <span className={controls.helper}>
              Notaðu JPG eða PNG allt að 5 MB til að stilla sérsniðna forsíðumynd.
            </span>
          )}
        </div>
        */}

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
            {isSaving ? "Vista…" : "Bæta við myndbandi"}
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
            Endurstilla
          </button>
        </div>
      </form>

      <div className={styles.divider} />

      <h3 className={styles.sectionTitle}>Myndbönd í safni</h3>

      {loading ? (
        <div className={styles.emptyState}>Hleð myndböndum…</div>
      ) : videos.length === 0 ? (
        <div className={styles.emptyState}>
          Engin myndbönd ennþá. Bættu við fyrsta embed-inu til að fylla opinbera rennibrautina.
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
        text: result.message ?? "Tókst ekki að uppfæra myndband.",
      });
    } else {
      setMessage({ type: "success", text: "Myndband uppfært." });
    }
    setIsSaving(false);
  };

  const deleteVideo = async () => {
    if (!window.confirm("Fjarlægja þetta myndband?")) return;
    setIsDeleting(true);
    const result = await onDelete(record.id);
    if (!result.ok) {
      setMessage({
        type: "error",
        text: result.message ?? "Tókst ekki að eyða myndbandi.",
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
            Bætt við {new Date(record.createdAt).toLocaleString()}
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
          placeholder="Titill"
        />
        <input
          className={controls.input}
          value={state.videoUrl}
          onChange={(event) =>
            setState((prev) => ({ ...prev, videoUrl: event.target.value }))
          }
          placeholder="Myndbandsslóð (URL)"
        />
        {/* Cloudinary video ID (optional; re-enable if needed)
        <input
          className={controls.input}
          value={state.videoCloudinaryPublicId}
          onChange={(event) =>
            setState((prev) => ({
              ...prev,
              videoCloudinaryPublicId: event.target.value,
            }))
          }
          placeholder="Myndbands public ID"
        /> */}
      </div>

      {/* Cloudinary video upload (optional; re-enable if needed)
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
          {isVideoUploading ? "Hleð upp…" : "Hlaða upp myndbandi"}
        </button>
        <button
          type="button"
          className={styles.secondaryButton}
          onClick={clearVideoUpload}
          disabled={isVideoUploading}
        >
          Hreinsa upphleðslu
        </button>
        {videoUploadError ? (
          <span className={controls.error}>{videoUploadError}</span>
        ) : (
          <span className={controls.helper}>
            Skipta út eða bæta við staðbundnu myndbandi í gegnum Cloudinary.
          </span>
        )}
      </div>
      */}

      <textarea
        className={controls.textarea}
        value={state.description}
        onChange={(event) =>
          setState((prev) => ({ ...prev, description: event.target.value }))
        }
        rows={3}
        placeholder="Lýsing"
      />

      <div className={styles.fieldGroup}>
        {/* Cloudinary thumbnail fields (optional; re-enable if needed)
        <input
          className={controls.input}
          value={state.thumbnailUrl}
          onChange={(event) =>
            setState((prev) => ({ ...prev, thumbnailUrl: event.target.value }))
          }
          placeholder="Smámynd (URL)"
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
          placeholder="Smámyndar public ID"
        />
        */}
        <input
          className={controls.input}
          value={state.tags}
          onChange={(event) =>
            setState((prev) => ({ ...prev, tags: event.target.value }))
          }
          placeholder="Merki (aðskilin með kommum)"
        />
      </div>

      {/* Cloudinary thumbnail upload (optional; re-enable if needed)
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
          {isThumbnailUploading ? "Hleð upp…" : "Hlaða upp smámynd"}
        </button>
        <button
          type="button"
          className={styles.secondaryButton}
          onClick={clearThumbnailUpload}
          disabled={isThumbnailUploading}
        >
          Hreinsa upphleðslu
        </button>
        {thumbnailUploadError ? (
          <span className={controls.error}>{thumbnailUploadError}</span>
        ) : (
          <span className={controls.helper}>
            Hlaðið upp sérsniðinni mynd til að skiptast á sjálfgefnu þumli.
          </span>
        )}
      </div>
      */}

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
          {isSaving ? "Vista…" : "Vista breytingar"}
        </button>
        <button
          type="button"
          className={styles.dangerButton}
          onClick={deleteVideo}
          disabled={isDeleting}
        >
          {isDeleting ? "Eyði…" : "Eyða"}
        </button>
      </div>
    </article>
  );
}
