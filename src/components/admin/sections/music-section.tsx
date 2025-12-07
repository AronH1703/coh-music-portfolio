"use client";

import {
  ReactNode,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import {
  DndContext,
  DragEndEvent,
  MouseSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import { CSS } from "@dnd-kit/utilities";
import styles from "../admin-dashboard.module.scss";
import controls from "../form-controls.module.scss";
import { TextField, TextareaField, ToggleField } from "../form-controls";
import { musicReleaseSchema } from "@/lib/validation";
import { uploadAsset } from "@/lib/admin/uploads";

type MusicReleaseFormValues = z.input<typeof musicReleaseSchema>;

type StreamingLink = {
  id: string;
  label: string;
  url: string;
};

type MusicListState = Omit<MusicReleaseFormValues, "streamingLinks" | "sortOrder"> & {
  streamingLinks: StreamingLink[];
  sortOrder: number;
};

type MusicReleaseRecord = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  streamingLinks: StreamingLink[];
  coverImageUrl: string | null;
  coverImageAlt: string | null;
  coverCloudinaryPublicId: string | null;
  audioUrl: string | null;
  audioCloudinaryPublicId: string | null;
  releaseDate: string | null;
  releaseTime: string | null;
  timeZone: string | null;
  releaseAt: string | null;
  comingSoon: boolean;
  genre: string | null;
  duration: string | null;
  credits: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

type MessageState =
  | { type: "success"; text: string }
  | { type: "error"; text: string }
  | null;

const DEFAULT_VALUES: MusicReleaseFormValues = {
  title: "",
  slug: "",
  description: "",
  streamingLinks: [],
  coverImageUrl: "",
  coverImageAlt: "",
  coverCloudinaryPublicId: "",
  audioUrl: "",
  audioCloudinaryPublicId: "",
  releaseDate: "",
  releaseTime: "",
  timeZone: "",
  comingSoon: false,
  genre: "",
  duration: "",
  credits: "",
  metaTitle: "",
  metaDescription: "",
  sortOrder: 0,
};

const LINK_SUGGESTIONS = [
  "Spotify",
  "Apple Music",
  "YouTube",
  "SoundCloud",
  "Bandcamp",
  "Tidal",
  "Deezer",
];

const SECTION_COPY = {
  basics: {
    title: "Grunnupplýsingar útgáfu",
    description: "Titill, slug og sagan á bakvið útgáfuna.",
  },
  streaming: {
    title: "Streymistenglar",
    description: "Birtu Spotify, Apple Music, YouTube og aðrar streymisveitur.",
  },
  artwork: {
    title: "Myndefni og upphleðsla",
    description: "Umslagsmyndir (URL) og valkvæð upphleðsla frá tækinu þínu.",
  },
  release: {
    title: "Útgáfutímasetning",
    description: "Tímasetning, tímabelti og „coming soon“ stillingar.",
  },
  metadata: {
    title: "Credits, Metadata & SEO",
    description: "Tónlistarstefna, Credits, Meta tags og handvirk röðun.",
  },
} as const;

type SectionId = keyof typeof SECTION_COPY;

const SECTION_IDS = Object.keys(SECTION_COPY) as SectionId[];

function getAccordionDefaults(initiallyOpen: SectionId[] = []) {
  return SECTION_IDS.reduce(
    (acc, id) => {
      acc[id] = initiallyOpen.includes(id);
      return acc;
    },
    {} as Record<SectionId, boolean>,
  );
}

type AccordionSectionProps = {
  id: SectionId;
  title: string;
  description?: string;
  isOpen: boolean;
  onToggle: (sectionId: SectionId) => void;
  children: ReactNode;
};

function AccordionSection({
  id,
  title,
  description,
  isOpen,
  onToggle,
  children,
}: AccordionSectionProps) {
  return (
    <section className={styles.accordionSection}>
      <button
        type="button"
        className={styles.accordionHeader}
        aria-expanded={isOpen}
        onClick={() => onToggle(id)}
      >
        <div>
          <p className={styles.accordionTitle}>{title}</p>
          {description ? (
            <p className={styles.accordionDescription}>{description}</p>
          ) : null}
        </div>
        <span
          className={`${styles.accordionCaret} ${isOpen ? styles.accordionCaretOpen : ""}`}
          aria-hidden="true"
        />
      </button>
      <div
        className={`${styles.accordionContent} ${isOpen ? "" : styles.accordionContentCollapsed}`}
      >
        {children}
      </div>
    </section>
  );
}

type InlineFieldProps = {
  label: string;
  children: ReactNode;
};

function InlineField({ label, children }: InlineFieldProps) {
  return (
    <div className={controls.formField}>
      <span className={controls.label}>{label}</span>
      {children}
    </div>
  );
}

function toInputDate(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().split("T")[0];
}

function normalizeStreamingLinks(raw: StreamingLink[] | null | undefined): StreamingLink[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((entry) => {
      if (!entry || typeof entry !== "object") return null;
      const label = typeof entry.label === "string" ? entry.label : "";
      const url = typeof entry.url === "string" ? entry.url : "";
      if (!label && !url) return null;
      return {
        id: entry.id ?? crypto.randomUUID(),
        label,
        url,
      } satisfies StreamingLink;
    })
    .filter((entry): entry is StreamingLink => Boolean(entry));
}

function sortReleases(items: MusicReleaseRecord[]) {
  return [...items].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
}

export function MusicSection() {
  const [releases, setReleases] = useState<MusicReleaseRecord[]>([]);
  const [message, setMessage] = useState<MessageState>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCoverUploading, setIsCoverUploading] = useState(false);
  const [coverUploadError, setCoverUploadError] = useState<string | null>(null);
  const [coverUploadSuccess, setCoverUploadSuccess] = useState<string | null>(null);
  const [isAudioUploading, setIsAudioUploading] = useState(false);
  const [audioUploadError, setAudioUploadError] = useState<string | null>(null);
  const [formSections, setFormSections] = useState<Record<SectionId, boolean>>(() =>
    getAccordionDefaults(),
  );
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } }),
  );
  const toggleFormSection = useCallback((sectionId: SectionId) => {
    setFormSections((previous) => ({
      ...previous,
      [sectionId]: !previous[sectionId],
    }));
  }, []);
  const previewCoverImage = useCallback((url?: string | null) => {
    if (!url) return;
    if (typeof window === "undefined") return;
    window.open(url, "_blank", "noopener,noreferrer");
  }, []);

  const persistOrder = useCallback(
    async (ordered: MusicReleaseRecord[]) => {
      try {
        const response = await fetch("/api/music/order", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ids: ordered.map((release) => release.id) }),
        });
        if (!response.ok) {
          const payload = await response.json().catch(() => null);
          setMessage({
            type: "error",
            text: payload?.error ?? "Tókst ekki að vista röð útgáfa.",
          });
          return false;
        }
        setMessage({ type: "success", text: "Röð útgáfa vistuð." });
        return true;
      } catch (error) {
        setMessage({ type: "error", text: "Tókst ekki að vista röð útgáfa." });
        return false;
      }
    },
    [setMessage],
  );

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      const previousReleases = releases;
      const oldIndex = previousReleases.findIndex((release) => release.id === active.id);
      const newIndex = previousReleases.findIndex((release) => release.id === over.id);
      if (oldIndex === -1 || newIndex === -1) return;

      const nextReleases = arrayMove(previousReleases, oldIndex, newIndex).map((release, index) => ({
        ...release,
        sortOrder: index,
      }));
      setReleases(nextReleases);

      const saved = await persistOrder(nextReleases);
      if (!saved) {
        setReleases(previousReleases);
      }
    },
    [persistOrder, releases],
  );

  const coverInputRef = useRef<HTMLInputElement | null>(null);
  const audioInputRef = useRef<HTMLInputElement | null>(null);

  const {
    control,
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isDirty, isSubmitting },
  } = useForm<MusicReleaseFormValues>({
    resolver: zodResolver(musicReleaseSchema),
    defaultValues: DEFAULT_VALUES,
  });

  const {
    fields: streamingFields,
    append: appendStreamingLink,
    remove: removeStreamingLink,
  } = useFieldArray({
    control,
    name: "streamingLinks",
  });

  const streamingLinks = watch("streamingLinks") ?? [];

  const coverImageUrlValue = watch("coverImageUrl");

  const addStreamingLink = () => {
    const taken = new Set(
      streamingLinks
        .map((entry) => (entry?.label ? entry.label.toLowerCase() : ""))
        .filter(Boolean),
    );
    const suggested = LINK_SUGGESTIONS.find(
      (label) => !taken.has(label.toLowerCase()),
    );
    appendStreamingLink({
      id: crypto.randomUUID(),
      label: suggested ?? "Platform",
      url: "",
    });
  };

  const handleCoverUpload = useCallback(
    async (file: File) => {
      setCoverUploadError(null);
      setCoverUploadSuccess(null);
      setIsCoverUploading(true);
      try {
        const result = await uploadAsset(file, {
          folder: "coh-music/music/covers",
          resourceType: "image",
        });
        setValue("coverImageUrl", result.secureUrl, { shouldDirty: true });
        setValue("coverCloudinaryPublicId", result.publicId, { shouldDirty: true });
        setCoverUploadSuccess("Umslagsmynd hlaðin upp.");
      } catch (error) {
        setCoverUploadError((error as Error).message);
        setCoverUploadSuccess(null);
      } finally {
        setIsCoverUploading(false);
      }
    },
    [setValue],
  );

  const handleAudioUpload = useCallback(
    async (file: File) => {
      setAudioUploadError(null);
      setIsAudioUploading(true);
      try {
        const result = await uploadAsset(file, {
          folder: "coh-music/music/audio",
          resourceType: "video",
        });
        setValue("audioUrl", result.secureUrl, { shouldDirty: true });
        setValue("audioCloudinaryPublicId", result.publicId, { shouldDirty: true });
      } catch (error) {
        setAudioUploadError((error as Error).message);
      } finally {
        setIsAudioUploading(false);
      }
    },
    [setValue],
  );

  const clearCoverUpload = useCallback(() => {
    setValue("coverImageUrl", "", { shouldDirty: true });
    setValue("coverCloudinaryPublicId", "", { shouldDirty: true });
    setCoverUploadError(null);
    setCoverUploadSuccess(null);
  }, [setValue]);

  const clearAudioUpload = useCallback(() => {
    setValue("audioUrl", "", { shouldDirty: true });
    setValue("audioCloudinaryPublicId", "", { shouldDirty: true });
  }, [setValue]);

  useEffect(() => {
    let mounted = true;
    async function loadReleases() {
      setIsLoading(true);
      const response = await fetch("/api/music", { cache: "no-store" });
      if (response.ok) {
        const { data } = await response.json();
        if (mounted) {
          const normalised = (data as MusicReleaseRecord[]).map((item) => ({
            ...item,
            streamingLinks: normalizeStreamingLinks(item.streamingLinks),
          }));
          setReleases(sortReleases(normalised));
        }
      }
      if (mounted) setIsLoading(false);
    }

    void loadReleases();
    return () => {
      mounted = false;
    };
  }, []);

  const submitRelease = handleSubmit(async (values) => {
    setMessage(null);
    const response = await fetch("/api/music", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      setMessage({
        type: "error",
        text: payload?.error ?? "Tókst ekki að búa til útgáfu.",
      });
      return;
    }

    const { data } = await response.json();
    const record = data as MusicReleaseRecord;
    setReleases((previous) =>
      sortReleases([
        {
          ...record,
          streamingLinks: normalizeStreamingLinks(record.streamingLinks),
        },
        ...previous,
      ]),
    );
    reset(DEFAULT_VALUES);
    setCoverUploadError(null);
    setCoverUploadSuccess(null);
    setAudioUploadError(null);
    setMessage({ type: "success", text: "Útgáfa búin til." });
  });

  const handleUpdate = useCallback(
    async (id: string, payload: MusicReleaseFormValues) => {
      const parsed = musicReleaseSchema.safeParse(payload);
      if (!parsed.success) {
        return { ok: false, message: "Staðfesting mistókst. Athugaðu nauðsynlega reiti." };
      }

      const response = await fetch("/api/music", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...parsed.data }),
      });

      if (!response.ok) {
        const payloadError = await response.json().catch(() => null);
        return {
          ok: false,
          message: payloadError?.error ?? "Tókst ekki að uppfæra útgáfu.",
        };
      }

      const { data } = await response.json();
      const normalized = {
        ...(data as MusicReleaseRecord),
        streamingLinks: normalizeStreamingLinks(
          (data as MusicReleaseRecord).streamingLinks,
        ),
      };
      setReleases((previous) =>
        sortReleases(previous.map((item) => (item.id === id ? normalized : item))),
      );
      return { ok: true };
    },
    [],
  );

  const handleDelete = useCallback(async (id: string) => {
    const response = await fetch(`/api/music?id=${id}`, { method: "DELETE" });
    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      return { ok: false, message: payload?.error ?? "Tókst ekki að eyða útgáfu." };
    }
    setReleases((previous) => previous.filter((item) => item.id !== id));
    return { ok: true };
  }, []);

  const comingSoon = watch("comingSoon");
  const orderedReleases = sortReleases(releases);

  return (
    <div className={styles.card}>
      <form onSubmit={submitRelease} className={styles.fieldset}>
        <h2 className={styles.sectionTitle}>Bæta við nýrri útgáfu</h2>

        <AccordionSection
          id="basics"
          title={SECTION_COPY.basics.title}
          description={SECTION_COPY.basics.description}
          isOpen={formSections.basics}
          onToggle={toggleFormSection}
        >
          <div className={styles.fieldGroup}>
            <TextField
              label="Titill"
              placeholder="RUNNING (BOLD YELLOW)"
              {...register("title")}
              error={errors.title}
            />
            <TextField
              label="Slug"
              placeholder="running-bold-yellow"
              helperText="Lágstafir, tölustafir og bandstrik."
              {...register("slug")}
              error={errors.slug}
            />
          </div>

          <TextareaField
            label="Lýsing"
            placeholder="Samstarfsaðilar, stemming og sagan á bakvið útgáfuna."
            rows={4}
            {...register("description")}
            error={errors.description}
          />
        </AccordionSection>

        <AccordionSection
          id="streaming"
          title={SECTION_COPY.streaming.title}
          description={SECTION_COPY.streaming.description}
          isOpen={formSections.streaming}
          onToggle={toggleFormSection}
        >
          <div className={styles.fieldGroupStacked}>
            <div
              className={styles.fieldGroup}
              style={{ justifyContent: "space-between", alignItems: "center" }}
            >
              <span className={controls.label}>Streymistenglar</span>
              <button
                type="button"
                className={styles.secondaryButton}
                onClick={addStreamingLink}
              >
                Bæta við tengli
              </button>
            </div>
            {streamingFields.length === 0 && (
              <p className={controls.helper}>
                Bættu við streymisveitum til að birta Spotify, Apple Music, YouTube og fleira.
              </p>
            )}
            {streamingFields.map((field, index) => (
              <div key={field.id} className={styles.fieldGroup}>
                <TextField
                  label="Vettvangur"
                  placeholder="Spotify"
                  {...register(`streamingLinks.${index}.label` as const)}
                  error={errors.streamingLinks?.[index]?.label}
                />
                <TextField
                  label="Vettvangs-URL"
                  placeholder="https://open.spotify.com/..."
                  {...register(`streamingLinks.${index}.url` as const)}
                  error={errors.streamingLinks?.[index]?.url}
                />
                <button
                  type="button"
                  className={styles.secondaryButton}
                  onClick={() => removeStreamingLink(index)}
                >
                  Fjarlægja
                </button>
              </div>
            ))}
          </div>
        </AccordionSection>

        <AccordionSection
          id="artwork"
          title={SECTION_COPY.artwork.title}
          description={SECTION_COPY.artwork.description}
          isOpen={formSections.artwork}
          onToggle={toggleFormSection}
        >
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
              label="Umslagsmynd (URL)"
              placeholder="https://res.cloudinary.com/..."
              helperText="Hlaðið upp umslagsmynd eða límdu inn hýsta slóð."
              {...register("coverImageUrl")}
              error={errors.coverImageUrl}
            />
            <TextField
              label="Alt texti fyrir umslagsmynd"
              placeholder="Sterk gul umslagsmynd."
              {...register("coverImageAlt")}
              error={errors.coverImageAlt}
            />
            {/* HIDE: Cover public ID */}
            {/*
            <TextField
              label="Cover public ID"
              placeholder="coh-music/music/covers/..."
              helperText="Saved automatically when uploading."
              {...register("coverCloudinaryPublicId")}
              error={errors.coverCloudinaryPublicId}
            />
            */}
          </div>

        <div className={styles.fieldGroup}>
          <div className={controls.formField}>
            <span className={controls.label}>Hlaða upp umslagsmynd</span>
            <div className={styles.fieldGroup}>
              <button
                type="button"
                className={styles.secondaryButton}
                onClick={() => coverInputRef.current?.click()}
                disabled={isCoverUploading}
              >
                {isCoverUploading ? "Hleð upp…" : "Hlaða upp frá tölvu"}
              </button>
              <button
                type="button"
                className={styles.secondaryButton}
                onClick={clearCoverUpload}
                disabled={isCoverUploading}
              >
                Hreinsa umslag
              </button>
              <button
                type="button"
                className={styles.secondaryButton}
                onClick={() => previewCoverImage(coverImageUrlValue)}
                disabled={!coverImageUrlValue}
              >
                Forskoða
              </button>
            </div>
            {coverUploadError ? (
              <span className={controls.error}>{coverUploadError}</span>
            ) : coverUploadSuccess ? (
              <span className={controls.helper}>{coverUploadSuccess}</span>
            ) : (
              <span className={controls.helper}>
                JPG, PNG, WEBP allt að 5 MB. Við upphleðslu er public ID vistað sjálfkrafa.
              </span>
            )}
          </div>
        </div>

          {/* keep the hidden file input so uploads still work */}
          <input
            ref={audioInputRef}
            type="file"
            accept="audio/*"
            style={{ display: "none" }}
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) {
                void handleAudioUpload(file);
                event.target.value = "";
              }
            }}
          />

          <div className={styles.fieldGroup}>
            {/* HIDE: Audio file URL */}
            {/*
            <TextField
              label="Audio file URL"
              placeholder="https://res.cloudinary.com/.../track.mp3"
              helperText="Optional direct audio upload for previews."
              {...register("audioUrl")}
              error={errors.audioUrl}
            />
            */}
            {/* HIDE: Audio public ID */}
            {/*
            <TextField
              label="Audio public ID"
              placeholder="coh-music/music/audio/..."
              helperText="Saved automatically when uploading from your computer."
              {...register("audioCloudinaryPublicId")}
              error={errors.audioCloudinaryPublicId}
            />
            */}
            {/* HIDE: Upload audio controls + helper */}
            {/*
            <div className={controls.formField}>
              <span className={controls.label}>Upload audio</span>
              <div className={styles.fieldGroup}>
                <button
                  type="button"
                  className={styles.secondaryButton}
                  onClick={() => audioInputRef.current?.click()}
                  disabled={isAudioUploading}
                >
                  {isAudioUploading ? "Uploading…" : "Upload from computer"}
                </button>
                <button
                  type="button"
                  className={styles.secondaryButton}
                  onClick={clearAudioUpload}
                  disabled={isAudioUploading}
                >
                  Clear audio
                </button>
              </div>
              {audioUploadError && <span className={controls.error}>{audioUploadError}</span>}
              {!audioUploadError && (
                <span className={controls.helper}>
                  MP3, WAV, AAC supported. Stored on Cloudinary as video assets.
                </span>
              )}
            </div>
            */}
          </div>
        </AccordionSection>

        <AccordionSection
          id="release"
          title={SECTION_COPY.release.title}
          description={SECTION_COPY.release.description}
          isOpen={formSections.release}
          onToggle={toggleFormSection}
        >
          <div className={styles.fieldGroup}>
            <TextField
              label="Útgáfudagsetning"
              type="date"
              {...register("releaseDate")}
              error={errors.releaseDate}
            />
            <TextField
              label="Útgáfutími"
              type="time"
              {...register("releaseTime")}
              error={errors.releaseTime}
            />
            <TextField
              label="Tímabelti"
              placeholder="Europe/Stockholm"
              helperText="Notaðu gilt IANA tímabelti til að teljarar séu réttir."
              {...register("timeZone")}
              error={errors.timeZone}
            />
          </div>

          <ToggleField
            label="Coming soon"
            helperText="Slekkur sjálfkrafa þegar útgáfutími er liðinn."
            checked={!!comingSoon}
            onChange={(value) => setValue("comingSoon", value, { shouldDirty: true })}
          />
        </AccordionSection>

        <AccordionSection
          id="metadata"
          title={SECTION_COPY.metadata.title}
          description={SECTION_COPY.metadata.description}
          isOpen={formSections.metadata}
          onToggle={toggleFormSection}
        >
          <div className={styles.fieldGroup}>
            <TextField
              label="Tónlistarstefna"
              placeholder="Alternative electronic"
              {...register("genre")}
              error={errors.genre}
            />
            <TextField
              label="Lengd"
              placeholder="03:42"
              {...register("duration")}
              error={errors.duration}
            />
            {/* HIDE: Sort order field in create form */}
            {/*
            <TextField
              label="Sort order"
              type="number"
              min={0}
              {...register("sortOrder", { valueAsNumber: true })}
              error={errors.sortOrder}
            />
            */}
          </div>

          <TextareaField
            label="Credits"
            placeholder="Framleiðandi, mix, gestir…"
            rows={3}
            {...register("credits")}
            error={errors.credits}
          />

          <div className={styles.fieldGroup}>
            <TextField
              label="Meta title"
              placeholder="Exclusive premiere: RUNNING (BOLD YELLOW)"
              {...register("metaTitle")}
              error={errors.metaTitle}
            />
            <TextareaField
              label="Meta description"
              placeholder="SEO lýsing fyrir samfélagsmiðla og leit."
              rows={3}
              {...register("metaDescription")}
              error={errors.metaDescription}
            />
          </div>
        </AccordionSection>

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
            {isSubmitting ? "Vista…" : "Búa til útgáfu"}
          </button>
          <button
            type="button"
            className={styles.secondaryButton}
            onClick={() => reset(DEFAULT_VALUES)}
          >
            Hreinsa form
          </button>
        </div>
      </form>

      <div className={styles.divider} />

      <h3 className={styles.sectionTitle}>Fyrri útgáfur</h3>

      {isLoading ? (
        <div className={styles.emptyState}>Sæki útgáfur…</div>
      ) : orderedReleases.length === 0 ? (
        <div className={styles.emptyState}>
          Bættu við fyrstu útgáfunni til að fylla tónlistar-róluna.
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          modifiers={[restrictToVerticalAxis]}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={orderedReleases.map((release) => release.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className={styles.list}>
              {orderedReleases.map((release) => (
                <MusicListItem
                  key={release.id}
                  record={release}
                  onUpdate={handleUpdate}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
}

type MusicListItemProps = {
  record: MusicReleaseRecord;
  onUpdate: (id: string, payload: MusicReleaseFormValues) => Promise<{ ok: boolean; message?: string }>;
  onDelete: (id: string) => Promise<{ ok: boolean; message?: string }>;
};

function MusicListItem({ record, onUpdate, onDelete }: MusicListItemProps) {
  const [state, setState] = useState<MusicListState>({
    title: record.title ?? "",
    slug: record.slug ?? "",
    description: record.description ?? "",
    streamingLinks: normalizeStreamingLinks(record.streamingLinks),
    coverImageUrl: record.coverImageUrl ?? "",
    coverImageAlt: record.coverImageAlt ?? "",
    coverCloudinaryPublicId: record.coverCloudinaryPublicId ?? "",
    audioUrl: record.audioUrl ?? "",
    audioCloudinaryPublicId: record.audioCloudinaryPublicId ?? "",
    releaseDate: toInputDate(record.releaseDate),
    releaseTime: record.releaseTime ?? "",
    timeZone: record.timeZone ?? "",
    comingSoon: !!record.comingSoon,
    genre: record.genre ?? "",
    duration: record.duration ?? "",
    credits: record.credits ?? "",
    metaTitle: record.metaTitle ?? "",
    metaDescription: record.metaDescription ?? "",
    sortOrder: record.sortOrder ?? 0,
  });
  const [status, setStatus] = useState<MessageState>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isCoverUploading, setIsCoverUploading] = useState(false);
  const [coverUploadError, setCoverUploadError] = useState<string | null>(null);
  const [coverUploadSuccess, setCoverUploadSuccess] = useState<string | null>(null);
  const [isAudioUploading, setIsAudioUploading] = useState(false);
  const [audioUploadError, setAudioUploadError] = useState<string | null>(null);
  const [sectionVisibility, setSectionVisibility] = useState<Record<SectionId, boolean>>(() =>
    getAccordionDefaults(),
  );
  const [isCollapsed, setIsCollapsed] = useState(true);

  const coverInputRef = useRef<HTMLInputElement | null>(null);
  const audioInputRef = useRef<HTMLInputElement | null>(null);
  const headerRef = useRef<HTMLElement | null>(null);

  useLayoutEffect(() => {
    if (!isCollapsed && headerRef.current) {
      headerRef.current.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  }, [isCollapsed]);

  const statusLabel = state.comingSoon
    ? "Coming soon"
    : record.releaseAt
      ? `Útgefið ${new Date(record.releaseAt).toLocaleDateString()}`
      : "Útgáfudagsetning TBA";

  const addStreamingLink = useCallback(() => {
    const existing = new Set(state.streamingLinks.map((link) => link.label.toLowerCase()));
    const suggested = LINK_SUGGESTIONS.find((label) => !existing.has(label.toLowerCase()));
    setState((prev) => ({
      ...prev,
      streamingLinks: [
        ...prev.streamingLinks,
        { id: crypto.randomUUID(), label: suggested ?? "Platform", url: "" },
      ],
    }));
  }, [state.streamingLinks]);

  const updateStreamingLink = (index: number, field: "label" | "url", value: string) => {
    setState((prev) => {
      const next = [...prev.streamingLinks];
      next[index] = { ...next[index], [field]: value };
      return { ...prev, streamingLinks: next };
    });
  };

  const removeStreamingLink = (index: number) => {
    setState((prev) => ({
      ...prev,
      streamingLinks: prev.streamingLinks.filter((_, i) => i !== index),
    }));
  };

  const handleCoverUpload = async (file: File) => {
    setCoverUploadError(null);
    setCoverUploadSuccess(null);
    setIsCoverUploading(true);
    try {
      const result = await uploadAsset(file, {
        folder: "coh-music/music/covers",
        resourceType: "image",
      });
      setState((prev) => ({
        ...prev,
        coverImageUrl: result.secureUrl,
        coverCloudinaryPublicId: result.publicId,
      }));
      setCoverUploadSuccess("Umslagsmynd hlaðin upp.");
    } catch (error) {
      setCoverUploadError((error as Error).message);
      setCoverUploadSuccess(null);
    } finally {
      setIsCoverUploading(false);
    }
  };

  const handleAudioUpload = async (file: File) => {
    setAudioUploadError(null);
    setIsAudioUploading(true);
    try {
      const result = await uploadAsset(file, {
        folder: "coh-music/music/audio",
        resourceType: "video",
      });
      setState((prev) => ({
        ...prev,
        audioUrl: result.secureUrl,
        audioCloudinaryPublicId: result.publicId,
      }));
    } catch (error) {
      setAudioUploadError((error as Error).message);
    } finally {
      setIsAudioUploading(false);
    }
  };

  const clearCover = () => {
    setState((prev) => ({
      ...prev,
      coverImageUrl: "",
      coverCloudinaryPublicId: "",
    }));
    setCoverUploadError(null);
    setCoverUploadSuccess(null);
  };

  const clearAudio = () => {
    setState((prev) => ({
      ...prev,
      audioUrl: "",
      audioCloudinaryPublicId: "",
    }));
  };

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: record.id });

  const dragStyle = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 2 : undefined,
  };

  const toggleSection = useCallback((sectionId: SectionId) => {
    setSectionVisibility((previous) => ({
      ...previous,
      [sectionId]: !previous[sectionId],
    }));
  }, []);
  const previewCoverImage = useCallback((url?: string | null) => {
    if (!url) return;
    if (typeof window === "undefined") return;
    window.open(url, "_blank", "noopener,noreferrer");
  }, []);

  const save = async () => {
    setIsSaving(true);
    setStatus(null);

    const result = await onUpdate(record.id, {
      ...state,
      sortOrder: Number(state.sortOrder) ?? 0,
    });

    if (!result.ok) {
      setStatus({
        type: "error",
        text: result.message ?? "Tókst ekki að uppfæra útgáfu.",
      });
    } else {
      setStatus({ type: "success", text: "Útgáfa uppfærð." });
    }

    setIsSaving(false);
  };

  const remove = async () => {
    if (!window.confirm("Eyða þessari útgáfu alveg og endanlega?")) return;
    setIsDeleting(true);
    const result = await onDelete(record.id);
    if (!result.ok) {
      setStatus({
        type: "error",
        text: result.message ?? "Tókst ekki að eyða útgáfu.",
      });
    }
    setIsDeleting(false);
  };

  return (
    <article
      ref={setNodeRef}
      className={`${styles.listItem} ${isDragging ? styles.listItemDragging : ""}`}
      style={dragStyle}
    >
      <header ref={headerRef} className={styles.listItemHeader}>
        <div className={styles.listItemHeaderMain}>
          <button
            type="button"
            className={styles.dragHandle}
            {...attributes}
            {...listeners}
            aria-label="Dragðu útgáfu til að breyta röðun"
          >
            <span className={styles.dragGrip} />
          </button>
          <div>
            <div className={styles.listItemTitle}>{state.title || record.title}</div>
            <div className={styles.timestamp}>{statusLabel}</div>
          </div>
        </div>
        <div
          className={`${styles.status} ${
            state.comingSoon ? styles.comingSoon : ""
          }`}
        >
          {state.comingSoon ? "Coming soon" : "Virk"}
        </div>
        <button
          type="button"
          className={styles.secondaryButton}
          onClick={() => setIsCollapsed((previous) => !previous)}
        >
          {isCollapsed ? "Opna" : "Loka"}
        </button>
      </header>

      {!isCollapsed && (
        <>
      <AccordionSection
        id="basics"
        title={SECTION_COPY.basics.title}
        description={SECTION_COPY.basics.description}
        isOpen={sectionVisibility.basics}
        onToggle={toggleSection}
      >
        <div className={styles.fieldGroup}>
          <div className={controls.formField}>
            <span className={controls.label}>Titill</span>
            <input
              className={controls.input}
              value={state.title}
              onChange={(event) =>
                setState((prev) => ({ ...prev, title: event.target.value }))
              }
              placeholder="Titill"
            />
          </div>
          <div className={controls.formField}>
            <span className={controls.label}>Slug</span>
            <input
              className={controls.input}
              value={state.slug}
              onChange={(event) =>
                setState((prev) => ({ ...prev, slug: event.target.value }))
              }
              placeholder="Slug"
            />
          </div>
        </div>

        <div className={controls.formField}>
          <span className={controls.label}>Lýsing</span>
          <textarea
            className={controls.textarea}
            value={state.description ?? ""}
            onChange={(event) =>
              setState((prev) => ({ ...prev, description: event.target.value }))
            }
            rows={3}
            placeholder="Lýsing"
          />
        </div>
      </AccordionSection>

      <AccordionSection
        id="streaming"
        title={SECTION_COPY.streaming.title}
        description={SECTION_COPY.streaming.description}
        isOpen={sectionVisibility.streaming}
        onToggle={toggleSection}
      >
        <div className={styles.fieldGroupStacked}>
          <div
            className={styles.fieldGroup}
            style={{ justifyContent: "space-between", alignItems: "center" }}
          >
            <span className={controls.label}>Streymistenglar</span>
            <button
              type="button"
              className={styles.secondaryButton}
              onClick={addStreamingLink}
            >
              Bæta við tengli
            </button>
          </div>
          {state.streamingLinks.length === 0 && (
            <p className={controls.helper}>Engir streymistenglar ennþá.</p>
          )}
          {state.streamingLinks.map((link, index) => (
            <div key={link.id} className={styles.fieldGroup}>
              <InlineField label="Vettvangur">
                <input
                  className={controls.input}
                  value={link.label}
                  onChange={(event) =>
                    updateStreamingLink(index, "label", event.target.value)
                  }
                  placeholder="Vettvangur"
                />
              </InlineField>
              <InlineField label="Vettvangs-URL">
                <input
                  className={controls.input}
                  value={link.url}
                  onChange={(event) =>
                    updateStreamingLink(index, "url", event.target.value)
                  }
                  placeholder="https://open.spotify.com/..."
                />
              </InlineField>
              <button
                type="button"
                className={styles.secondaryButton}
                onClick={() => removeStreamingLink(index)}
              >
                Fjarlægja
              </button>
            </div>
          ))}
        </div>
      </AccordionSection>

      <AccordionSection
        id="artwork"
        title={SECTION_COPY.artwork.title}
        description={SECTION_COPY.artwork.description}
        isOpen={sectionVisibility.artwork}
        onToggle={toggleSection}
      >
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
          <InlineField label="Umslagsmynd (URL)">
            <input
              className={controls.input}
              value={state.coverImageUrl}
              onChange={(event) =>
                setState((prev) => ({ ...prev, coverImageUrl: event.target.value }))
              }
              placeholder="https://res.cloudinary.com/..."
            />
          </InlineField>
          <InlineField label="Alt texti fyrir umslagsmynd">
            <input
              className={controls.input}
              value={state.coverImageAlt}
              onChange={(event) =>
                setState((prev) => ({ ...prev, coverImageAlt: event.target.value }))
              }
              placeholder="Lýsing á umslagsmynd"
            />
          </InlineField>
          {/* HIDE: Cover public ID */}
          {/*
          <input
            className={controls.input}
            value={state.coverCloudinaryPublicId ?? ""}
            onChange={(event) =>
              setState((prev) => ({
                ...prev,
                coverCloudinaryPublicId: event.target.value,
              }))
            }
            placeholder="Cover public ID"
          />
          */}
        </div>

      <div className={styles.fieldGroup}>
        <button
          type="button"
          className={styles.secondaryButton}
          onClick={() => coverInputRef.current?.click()}
          disabled={isCoverUploading}
        >
          {isCoverUploading ? "Hleð upp…" : "Hlaða upp umslagi"}
        </button>
        <button
          type="button"
          className={styles.secondaryButton}
          onClick={clearCover}
          disabled={isCoverUploading}
        >
          Hreinsa umslag
        </button>
        <button
          type="button"
          className={styles.secondaryButton}
          onClick={() => previewCoverImage(state.coverImageUrl)}
          disabled={!state.coverImageUrl}
        >
          Forskoða
        </button>
        {coverUploadError ? (
          <span className={controls.error}>{coverUploadError}</span>
        ) : coverUploadSuccess ? (
          <span className={controls.helper}>{coverUploadSuccess}</span>
        ) : (
          <span className={controls.helper}>Límdu inn slóð eða hlaððu upp umslagsmynd.</span>
        )}
      </div>

        {/* keep hidden audio input for logic, but hide the fields/buttons */}
        <input
          ref={audioInputRef}
          type="file"
          accept="audio/*"
          style={{ display: "none" }}
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) {
              void handleAudioUpload(file);
              event.target.value = "";
            }
          }}
        />

        <div className={styles.fieldGroup}>
          {/* HIDE: Audio URL */}
          {/*
          <input
            className={controls.input}
            value={state.audioUrl ?? ""}
            onChange={(event) =>
              setState((prev) => ({ ...prev, audioUrl: event.target.value }))
            }
            placeholder="Audio URL"
          />
          */}
          {/* HIDE: Audio public ID */}
          {/*
          <input
            className={controls.input}
            value={state.audioCloudinaryPublicId ?? ""}
            onChange={(event) =>
              setState((prev) => ({
                ...prev,
                audioCloudinaryPublicId: event.target.value,
              }))
            }
            placeholder="Audio public ID"
          />
          */}
          {/* HIDE: Upload audio buttons */}
          {/*
          <div className={styles.fieldGroup}>
            <button
              type="button"
              className={styles.secondaryButton}
              onClick={() => audioInputRef.current?.click()}
              disabled={isAudioUploading}
            >
              {isAudioUploading ? "Uploading…" : "Upload audio"}
            </button>
            <button
              type="button"
              className={styles.secondaryButton}
              onClick={clearAudio}
              disabled={isAudioUploading}
            >
              Clear audio
            </button>
          </div>
          */}
        </div>
        {audioUploadError ? (
          <span className={controls.error}>{audioUploadError}</span>
        ) : null}
      </AccordionSection>

      <AccordionSection
        id="release"
        title={SECTION_COPY.release.title}
        description={SECTION_COPY.release.description}
        isOpen={sectionVisibility.release}
        onToggle={toggleSection}
      >
        <div className={styles.fieldGroup}>
          <InlineField label="Útgáfudagsetning">
            <input
              className={controls.input}
              type="date"
              value={state.releaseDate ?? ""}
              onChange={(event) =>
                setState((prev) => ({ ...prev, releaseDate: event.target.value }))
              }
            />
          </InlineField>
          <InlineField label="Útgáfutími">
            <input
              className={controls.input}
              type="time"
              value={state.releaseTime ?? ""}
              onChange={(event) =>
                setState((prev) => ({ ...prev, releaseTime: event.target.value }))
              }
            />
          </InlineField>
          <InlineField label="Tímabelti">
            <input
              className={controls.input}
              value={state.timeZone ?? ""}
              onChange={(event) =>
                setState((prev) => ({ ...prev, timeZone: event.target.value }))
              }
              placeholder="Europe/Stockholm"
            />
          </InlineField>
        </div>
        <ToggleField
          label="Coming soon"
          checked={!!state.comingSoon}
          onChange={(value) =>
            setState((prev) => ({ ...prev, comingSoon: value }))
          }
        />
      </AccordionSection>

      <AccordionSection
        id="metadata"
        title={SECTION_COPY.metadata.title}
        description={SECTION_COPY.metadata.description}
        isOpen={sectionVisibility.metadata}
        onToggle={toggleSection}
      >
        <div className={styles.fieldGroup}>
          <InlineField label="Tónlistarstefna">
            <input
              className={controls.input}
              value={state.genre ?? ""}
              onChange={(event) =>
                setState((prev) => ({ ...prev, genre: event.target.value }))
              }
              placeholder="Tónlistarstefna"
            />
          </InlineField>
          <InlineField label="Lengd">
            <input
              className={controls.input}
              value={state.duration ?? ""}
              onChange={(event) =>
                setState((prev) => ({ ...prev, duration: event.target.value }))
              }
              placeholder="Lengd"
            />
          </InlineField>
        </div>

        <InlineField label="Credits">
          <textarea
            className={controls.textarea}
            value={state.credits ?? ""}
            onChange={(event) =>
              setState((prev) => ({ ...prev, credits: event.target.value }))
            }
            rows={3}
            placeholder="Credits"
          />
        </InlineField>

        <div className={styles.fieldGroup}>
          <InlineField label="Meta title">
            <input
              className={controls.input}
              value={state.metaTitle ?? ""}
              onChange={(event) =>
                setState((prev) => ({ ...prev, metaTitle: event.target.value }))
              }
              placeholder="Meta title"
            />
          </InlineField>
          <InlineField label="Meta description">
            <textarea
              className={controls.textarea}
              value={state.metaDescription ?? ""}
              onChange={(event) =>
                setState((prev) => ({ ...prev, metaDescription: event.target.value }))
              }
              rows={2}
              placeholder="Meta description"
            />
          </InlineField>

          {/* HIDE: Sort order field in existing releases */}
          {/*
          <InlineField label="Sort order">
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
          </InlineField>
          */}
        </div>
      </AccordionSection>

      {status && (
        <div
          className={
            status.type === "success"
              ? styles.successMessage
              : styles.errorMessage
          }
        >
          {status.text}
        </div>
      )}

      <div className={styles.actions}>
        <button
          type="button"
          className={styles.primaryButton}
          onClick={save}
          disabled={isSaving}
        >
          {isSaving ? "Vista…" : "Vista breytingar"}
        </button>
        <button
          type="button"
          className={styles.dangerButton}
          onClick={remove}
          disabled={isDeleting}
        >
          {isDeleting ? "Eyði…" : "Eyða"}
        </button>
      </div>
        </>
      )}
    </article>
  );
}
