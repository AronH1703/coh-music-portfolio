"use client";

import {
  type ComponentPropsWithoutRef,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import Image from "next/image";
import clsx from "clsx";
import useEmblaCarousel from "embla-carousel-react";
import type { EmblaCarouselType, EmblaOptionsType } from "embla-carousel";
import frameStyles from "../carousel/carousel-frame.module.css";
import s from "./video-carousel.module.css";

export type VideoCarouselItem = {
  id: string;
  externalId: string;
  videoUrl: string;
  title?: string | null;
  description?: string | null;
  thumbnailUrl?: string | null;
};

type VideoCarouselProps = {
  videos: VideoCarouselItem[];
};

const CAROUSEL_OPTIONS: EmblaOptionsType = { align: "center", loop: true };

type UsePrevNextButtonsResult = {
  prevBtnDisabled: boolean;
  nextBtnDisabled: boolean;
  onPrevButtonClick: () => void;
  onNextButtonClick: () => void;
};

function usePrevNextButtons(
  emblaApi: EmblaCarouselType | undefined,
  onButtonClick?: (api: EmblaCarouselType) => void,
): UsePrevNextButtonsResult {
  const [prevBtnDisabled, setPrevBtnDisabled] = useState(true);
  const [nextBtnDisabled, setNextBtnDisabled] = useState(true);

  const onPrevButtonClick = useCallback(() => {
    if (!emblaApi) return;
    emblaApi.scrollPrev();
    onButtonClick?.(emblaApi);
  }, [emblaApi, onButtonClick]);

  const onNextButtonClick = useCallback(() => {
    if (!emblaApi) return;
    emblaApi.scrollNext();
    onButtonClick?.(emblaApi);
  }, [emblaApi, onButtonClick]);

  const onSelect = useCallback((api: EmblaCarouselType) => {
    setPrevBtnDisabled(!api.canScrollPrev());
    setNextBtnDisabled(!api.canScrollNext());
  }, []);

  useEffect(() => {
    if (!emblaApi) return;
    const raf = requestAnimationFrame(() => onSelect(emblaApi));
    emblaApi.on("reInit", onSelect).on("select", onSelect);
    return () => {
      cancelAnimationFrame(raf);
      emblaApi.off("reInit", onSelect);
      emblaApi.off("select", onSelect);
    };
  }, [emblaApi, onSelect]);

  return { prevBtnDisabled, nextBtnDisabled, onPrevButtonClick, onNextButtonClick };
}

type EmblaWithClickAllowed = EmblaCarouselType & {
  clickAllowed?: () => boolean;
};

function canCarouselClick(emblaApi: EmblaCarouselType | undefined) {
  if (!emblaApi) return true;
  const candidate = emblaApi as EmblaWithClickAllowed;
  return typeof candidate.clickAllowed === "function" ? candidate.clickAllowed() : true;
}


type ButtonProps = ComponentPropsWithoutRef<"button">;

function PrevButton(props: ButtonProps) {
  const { children, className, ...rest } = props;
  return (
    <button
      type="button"
      className={clsx(frameStyles.btn, className)}
      {...rest}
    >
      <svg
        className={frameStyles.btnSvg}
        viewBox="0 0 532 532"
        aria-hidden="true"
      >
        <path
          fill="currentColor"
          d="M355.66 11.354c13.793-13.805 36.208-13.805 50.001 0 13.785 13.804 13.785 36.238 0 50.034L201.22 266l204.442 204.61c13.785 13.805 13.785 36.239 0 50.044-13.793 13.796-36.208 13.796-50.002 0a5994246.277 5994246.277 0 0 0-229.332-229.454 35.065 35.065 0 0 1-10.326-25.126c0-9.2 3.393-18.26 10.326-25.2C172.192 194.973 332.731 34.31 355.66 11.354Z"
        />
      </svg>
      {children}
    </button>
  );
}

function NextButton(props: ButtonProps) {
  const { children, className, ...rest } = props;
  return (
    <button
      type="button"
      className={clsx(frameStyles.btn, className)}
      {...rest}
    >
      <svg
        className={frameStyles.btnSvg}
        viewBox="0 0 532 532"
        aria-hidden="true"
      >
        <path
          fill="currentColor"
          d="M176.34 520.646c-13.793 13.805-36.208 13.805-50.001 0-13.785-13.804-13.785-36.238 0-50.034L330.78 266 126.34 61.391c-13.785-13.805-13.785-36.239 0-50.044 13.793-13.796 36.208-13.796 50.002 0 22.928 22.947 206.395 206.507 229.332 229.454a35.065 35.065 0 0 1 10.326 25.126c0 9.2-3.393 18.26-10.326 25.2-45.865 45.901-206.404 206.564-229.332 229.52Z"
        />
      </svg>
      {children}
    </button>
  );
}

function DotButton(props: ButtonProps) {
  const { children, className, ...rest } = props;
  return (
    <button
      type="button"
      className={clsx(frameStyles.dot, className)}
      {...rest}
    >
      {children}
    </button>
  );
}

export default function VideoCarousel({ videos }: VideoCarouselProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel(CAROUSEL_OPTIONS);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [openDescriptionIndex, setOpenDescriptionIndex] = useState<number | null>(null);
  const [lightboxDescriptionOpen, setLightboxDescriptionOpen] = useState(false);

  const { prevBtnDisabled, nextBtnDisabled, onPrevButtonClick, onNextButtonClick } =
    usePrevNextButtons(emblaApi);

  const slides = useMemo(
    () => videos.filter((video) => video.externalId),
    [videos],
  );

  const openLightbox = useCallback(
    (index: number) => {
      if (!slides[index]) return;
      if (!canCarouselClick(emblaApi)) return;
      setLightboxIndex(index);
      setLightboxDescriptionOpen(false);
    },
    [emblaApi, slides],
  );

  const closeLightbox = useCallback(() => {
    setLightboxIndex(null);
  }, []);

  const showPrevVideo = useCallback(() => {
    if (!slides.length) return;
    setLightboxIndex((prev) =>
      prev === null ? null : (prev - 1 + slides.length) % slides.length,
    );
  }, [slides.length]);

  const showNextVideo = useCallback(() => {
    if (!slides.length) return;
    setLightboxIndex((prev) =>
      prev === null ? null : (prev + 1) % slides.length,
    );
  }, [slides.length]);

  useEffect(() => {
    if (!emblaApi || lightboxIndex !== null) return;
    const handler = (event: KeyboardEvent) => {
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        emblaApi.scrollPrev();
      }
      if (event.key === "ArrowRight") {
        event.preventDefault();
        emblaApi.scrollNext();
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [emblaApi, lightboxIndex]);

  useEffect(() => {
    if (lightboxIndex === null) return;
    const handler = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeLightbox();
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        showPrevVideo();
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        showNextVideo();
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [closeLightbox, lightboxIndex, showNextVideo, showPrevVideo]);

  useEffect(() => {
    if (lightboxIndex === null) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, [lightboxIndex]);

  if (!slides.length) {
    return (
      <div
        className={clsx(frameStyles.root, "p-8 text-center text-sm text-neutral-400")}
        role="status"
      >
        Videos will appear here after adding YouTube links in the admin.
      </div>
    );
  }

  return (
    <div className={frameStyles.root}>
      <div className={frameStyles.embla}>
        <div className={frameStyles.viewport} ref={emblaRef}>
          <div className={clsx(frameStyles.container, s.container)}>
            {slides.map((video, index) => {
              const title = video.title ?? `Video ${index + 1}`;
              const description = video.description ?? null;
              const thumbnail =
                video.thumbnailUrl ?? `https://img.youtube.com/vi/${video.externalId}/hqdefault.jpg`;
              const isDescriptionOpen = openDescriptionIndex === index;
              return (
                <div className={s.slide} key={video.id}>
                  <article className={s.card}>
                    <button
                      type="button"
                      className={s.previewButton}
                      onClick={() => openLightbox(index)}
                      aria-label={`Play video ${title}`}
                    >
                      <div className={s.preview}>
                        <div className={s.thumbWrap}>
                          <Image
                            src={thumbnail}
                            alt={title}
                            fill
                            sizes="(max-width: 768px) 90vw, 640px"
                            className={s.thumb}
                            priority={index === 0}
                          />
                        </div>
                        <div className={s.overlay} aria-hidden="true">
                          <span className={s.playIcon}>
                            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                              <path d="M8 5v14l11-7z" fill="currentColor" />
                            </svg>
                          </span>
                        </div>
                      </div>
                    </button>
                    <div className={clsx(frameStyles.info, s.info)}>
                      <h3 className={clsx(frameStyles.title, s.title)}>{title}</h3>
                      {description ? (
                        <div className={s.descToggle}>
                          <button
                            type="button"
                            className={s.descButton}
                            onClick={() =>
                              setOpenDescriptionIndex(
                                isDescriptionOpen ? null : index,
                              )
                            }
                            aria-expanded={isDescriptionOpen}
                          >
                            {isDescriptionOpen ? "Hide description" : "View description"}
                          </button>
                          {isDescriptionOpen && (
                            <div className={s.descPopover}>
                              <p>{description}</p>
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className={clsx(frameStyles.meta, s.meta)}>
                          Watch on YouTube
                        </span>
                      )}
                    </div>
                  </article>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className={clsx(frameStyles.controls, s.controls)}>
        <div className={frameStyles.buttons}>
          <PrevButton
            onClick={onPrevButtonClick}
            disabled={prevBtnDisabled}
            aria-label="Previous video"
          />
          <NextButton
            onClick={onNextButtonClick}
            disabled={nextBtnDisabled}
            aria-label="Next video"
          />
        </div>
      </div>

      <div
        className={clsx(s.lightbox, lightboxIndex !== null && s.lightboxOpen)}
        role="dialog"
        aria-modal="true"
        aria-label="Video viewer"
        onClick={closeLightbox}
      >
        {lightboxIndex !== null && slides[lightboxIndex] && (
          <div
            className={s.lightboxInner}
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className={s.lightboxClose}
              onClick={(event) => {
                event.stopPropagation();
                closeLightbox();
              }}
              aria-label="Close video viewer"
            >
              ×
            </button>
            <div className={s.lightboxPlayerWrap}>
              <iframe
                key={slides[lightboxIndex].id}
                className={s.lightboxIframe}
                src={`https://www.youtube.com/embed/${slides[lightboxIndex].externalId}?autoplay=1&rel=0`}
                title={slides[lightboxIndex].title ?? `Video ${lightboxIndex + 1}`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
              {lightboxDescriptionOpen && slides[lightboxIndex].description && (
                <div className={s.lightboxDescriptionOverlay}>
                  <p>{slides[lightboxIndex].description}</p>
                </div>
              )}
              <div className={s.lightboxPlayerNav}>
                <PrevButton
                  onClick={(event) => {
                    event.stopPropagation();
                    showPrevVideo();
                  }}
                  disabled={slides.length <= 1}
                  aria-label="Previous video"
                  className={s.lightboxBtn}
                />
                <NextButton
                  onClick={(event) => {
                    event.stopPropagation();
                    showNextVideo();
                  }}
                  disabled={slides.length <= 1}
                  aria-label="Next video"
                  className={s.lightboxBtn}
                />
              </div>
            </div>
            <div className={s.lightboxCaption}>
              {slides[lightboxIndex].title && (
                <strong>{slides[lightboxIndex].title}</strong>
              )}
              {slides[lightboxIndex].description && (
                <div className={s.lightboxDescToggle}>
                  <button
                    type="button"
                    className={s.lightboxDescButton}
                    onClick={(event) => {
                      event.stopPropagation();
                      setLightboxDescriptionOpen((prev) => !prev);
                    }}
                    aria-expanded={lightboxDescriptionOpen}
                  >
                    {lightboxDescriptionOpen ? "Hide description" : "View description"}
                  </button>
                </div>
              )}
            </div>
            <div className={s.lightboxDots}>
              {slides.map((_, dotIndex) => (
                <DotButton
                  key={`lightbox-dot-${dotIndex}`}
                  onClick={(event) => {
                    event.stopPropagation();
                    setLightboxIndex(dotIndex);
                  }}
                  className={
                    dotIndex === lightboxIndex ? frameStyles.dotSelected : undefined
                  }
                  aria-label={`Show video ${dotIndex + 1}`}
                />
              ))}
            </div>
            <div className={s.lightboxControls}>
              <PrevButton
                onClick={(event) => {
                  event.stopPropagation();
                  showPrevVideo();
                }}
                disabled={slides.length <= 1}
                aria-label="Previous video"
                className={s.lightboxBtn}
              />
              <NextButton
                onClick={(event) => {
                  event.stopPropagation();
                  showNextVideo();
                }}
                disabled={slides.length <= 1}
                aria-label="Next video"
                className={s.lightboxBtn}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
