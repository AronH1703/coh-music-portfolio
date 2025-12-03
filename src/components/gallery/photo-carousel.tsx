"use client";

import {
  type ComponentPropsWithoutRef,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Image from "next/image";
import clsx from "clsx";
import useEmblaCarousel from "embla-carousel-react";
import type { EmblaCarouselType, EmblaOptionsType } from "embla-carousel";
import frameStyles from "../carousel/carousel-frame.module.css";
import s from "./photo-carousel.module.css";

export type GalleryPhoto = {
  id: string;
  src: string;
  alt: string;
  width?: number | null;
  height?: number | null;
  title?: string | null;
  location?: string | null;
  caption?: string | null;
};

type PhotoCarouselProps = {
  photos: GalleryPhoto[];
};

const CAROUSEL_OPTIONS: EmblaOptionsType = { align: "center", loop: true };
const LIGHTBOX_OPTIONS: EmblaOptionsType = { align: "center", loop: true };

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

type UseDotButtonResult = {
  selectedIndex: number;
  scrollSnaps: number[];
  onDotButtonClick: (index: number) => void;
};

function useDotButton(
  emblaApi: EmblaCarouselType | undefined,
  onButtonClick?: (api: EmblaCarouselType) => void,
): UseDotButtonResult {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [scrollSnaps, setScrollSnaps] = useState<number[]>([]);

  const onDotButtonClick = useCallback(
    (index: number) => {
      if (!emblaApi) return;
      emblaApi.scrollTo(index);
      onButtonClick?.(emblaApi);
    },
    [emblaApi, onButtonClick],
  );

  const onInit = useCallback((api: EmblaCarouselType) => {
    setScrollSnaps(api.scrollSnapList());
  }, []);

  const onSelect = useCallback((api: EmblaCarouselType) => {
    setSelectedIndex(api.selectedScrollSnap());
  }, []);

  useEffect(() => {
    if (!emblaApi) return;
    const raf = requestAnimationFrame(() => {
      onInit(emblaApi);
      onSelect(emblaApi);
    });
    emblaApi.on("reInit", onInit).on("reInit", onSelect).on("select", onSelect);
    return () => {
      cancelAnimationFrame(raf);
      emblaApi.off("reInit", onInit);
      emblaApi.off("reInit", onSelect);
      emblaApi.off("select", onSelect);
    };
  }, [emblaApi, onInit, onSelect]);

  return { selectedIndex, scrollSnaps, onDotButtonClick };
}

type ButtonProps = ComponentPropsWithoutRef<"button">;

function PrevButton(props: ButtonProps) {
  const { children, className, ...rest } = props;
  return (
    <button type="button" className={clsx(frameStyles.btn, className)} {...rest}>
      <svg className={frameStyles.btnSvg} viewBox="0 0 532 532" aria-hidden="true">
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
    <button type="button" className={clsx(frameStyles.btn, className)} {...rest}>
      <svg className={frameStyles.btnSvg} viewBox="0 0 532 532" aria-hidden="true">
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
    <button type="button" className={clsx(frameStyles.dot, className)} {...rest}>
      {children}
    </button>
  );
}

export default function PhotoCarousel({ photos }: PhotoCarouselProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel(CAROUSEL_OPTIONS);
  const [lightboxRef, lightboxEmbla] = useEmblaCarousel(LIGHTBOX_OPTIONS);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const lightboxActiveRef = useRef(false);

  const slides = useMemo(() => photos.filter((photo) => photo.src), [photos]);

  const { prevBtnDisabled, nextBtnDisabled, onPrevButtonClick, onNextButtonClick } =
    usePrevNextButtons(emblaApi);
  const { selectedIndex, scrollSnaps, onDotButtonClick } = useDotButton(emblaApi);

  const {
    prevBtnDisabled: lightboxPrevDisabled,
    nextBtnDisabled: lightboxNextDisabled,
    onPrevButtonClick: onLightboxPrev,
    onNextButtonClick: onLightboxNext,
  } = usePrevNextButtons(lightboxEmbla);

  const {
    selectedIndex: lightboxSelectedIndex,
    scrollSnaps: lightboxScrollSnaps,
    onDotButtonClick: onLightboxDot,
  } = useDotButton(lightboxEmbla);

  const openLightbox = useCallback(
    (index: number) => {
      if (!slides[index]) return;
      const clickAllowed = (emblaApi as any)?.clickAllowed?.() ?? true;
      if (!clickAllowed) return;
      lightboxActiveRef.current = true;
      setLightboxIndex(index);
    },
    [emblaApi, slides],
  );

  const closeLightbox = useCallback(() => {
    lightboxActiveRef.current = false;
    setLightboxIndex(null);
  }, []);

  useEffect(() => {
    if (!emblaApi) return;
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
  }, [emblaApi]);

  useEffect(() => {
    lightboxActiveRef.current = lightboxIndex !== null;
  }, [lightboxIndex]);

  useEffect(() => {
    if (lightboxIndex === null) return;
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeLightbox();
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        setLightboxIndex((prev) =>
          prev === null ? null : (prev + 1) % slides.length,
        );
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        setLightboxIndex((prev) =>
          prev === null ? null : (prev - 1 + slides.length) % slides.length,
        );
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [closeLightbox, lightboxIndex, slides.length]);

  useEffect(() => {
    if (lightboxIndex === null || !lightboxEmbla) return;
    const raf = requestAnimationFrame(() => {
      lightboxEmbla.reInit();
      lightboxEmbla.scrollTo(lightboxIndex, true);
    });
    const handleSelect = () => {
      if (lightboxActiveRef.current) {
        setLightboxIndex(lightboxEmbla.selectedScrollSnap());
      }
    };
    lightboxEmbla.on("select", handleSelect).on("reInit", handleSelect);
    return () => {
      cancelAnimationFrame(raf);
      lightboxEmbla.off("select", handleSelect);
      lightboxEmbla.off("reInit", handleSelect);
    };
  }, [lightboxEmbla, lightboxIndex]);

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
        Gallery items will appear here once uploaded via the admin.
      </div>
    );
  }

  return (
    <div className={frameStyles.root}>
      <div className={frameStyles.embla}>
        <div className={frameStyles.viewport} ref={emblaRef}>
          <div className={clsx(frameStyles.container, s.container)}>
            {slides.map((photo, index) => {
              const titleText = photo.title?.trim() || undefined;
              const captionText = photo.caption?.trim() || undefined;
              const locationText = photo.location?.trim() || undefined;
              const labelText = titleText ?? captionText ?? `photo ${index + 1}`;

              return (
                <div className={s.slide} key={photo.id ?? `${photo.src}-${index}`}>
                  <article className={s.card}>
                    <button
                      type="button"
                      className={s.previewButton}
                      onClick={() => openLightbox(index)}
                      aria-label={`View ${labelText}`}
                    >
                      <div className={s.cover}>
                        <Image
                          src={photo.src}
                          alt={photo.alt}
                          fill
                          sizes="(max-width: 768px) 90vw, 640px"
                          className={s.image}
                          priority={index === 0}
                        />
                      </div>
                    </button>
                    {(titleText || captionText || locationText) && (
                      <div className={clsx(frameStyles.info, s.info)}>
                        {titleText && (
                          <h3 className={frameStyles.title}>{titleText}</h3>
                        )}
                        {(captionText || locationText) && (
                          <div className={s.details}>
                            {captionText && (
                              <p className={s.caption}>{captionText}</p>
                            )}
                            {locationText && (
                              <span className={frameStyles.meta}>{locationText}</span>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </article>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className={frameStyles.controls}>
        <div className={frameStyles.buttons}>
          <PrevButton
            onClick={onPrevButtonClick}
            disabled={prevBtnDisabled}
            aria-label="Previous slide"
          />
          <NextButton
            onClick={onNextButtonClick}
            disabled={nextBtnDisabled}
            aria-label="Next slide"
          />
        </div>
        <div className={frameStyles.dots}>
          {scrollSnaps.map((_, dotIndex) => (
            <DotButton
              key={`dot-${dotIndex}`}
              onClick={() => onDotButtonClick(dotIndex)}
              className={
                dotIndex === selectedIndex ? frameStyles.dotSelected : undefined
              }
              aria-label={`Go to slide ${dotIndex + 1}`}
            />
          ))}
        </div>
      </div>

      <div
        className={clsx(s.lightbox, lightboxIndex !== null && s.lightboxOpen)}
        role="dialog"
        aria-modal="true"
        aria-label="Full-size image viewer"
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
              aria-label="Close image viewer"
            >
              ×
            </button>
            <div className={s.lightboxEmbla}>
              <div className={s.lightboxViewport} ref={lightboxRef}>
                <div className={s.lightboxContainer}>
                  {slides.map((photo, index) => (
                    <div className={s.lightboxSlide} key={`lightbox-${photo.id ?? index}`}>
                      <div
                        className={s.lightboxImageWrap}
                        style={{
                          aspectRatio:
                            photo.width && photo.height
                              ? `${photo.width} / ${photo.height}`
                              : undefined,
                        }}
                      >
                        <Image
                          src={photo.src}
                          alt={photo.alt}
                          fill
                          sizes="100vw"
                          className={s.lightboxImg}
                          priority={index === lightboxIndex}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            {(() => {
              const activePhoto = slides[lightboxIndex];
              const titleText = activePhoto.title?.trim() || undefined;
              const captionText = activePhoto.caption?.trim() || undefined;
              const locationText = activePhoto.location?.trim() || undefined;

              if (!titleText && !captionText && !locationText) return null;

              return (
                <div className={s.lightboxCaption}>
                  {titleText && <strong>{titleText}</strong>}
                  {captionText && <p>{captionText}</p>}
                  {locationText && <span>{locationText}</span>}
                </div>
              );
            })()}
            <div className={s.lightboxControls}>
              <div className={frameStyles.buttons}>
                <PrevButton
                  onClick={onLightboxPrev}
                  disabled={lightboxPrevDisabled}
                  aria-label="Previous image"
                  className={s.lightboxBtn}
                />
                <NextButton
                  onClick={onLightboxNext}
                  disabled={lightboxNextDisabled}
                  aria-label="Next image"
                  className={s.lightboxBtn}
                />
              </div>
              <div className={frameStyles.dots}>
                {lightboxScrollSnaps.map((_, dotIndex) => (
                  <DotButton
                    key={`lightbox-dot-${dotIndex}`}
                    onClick={() => onLightboxDot(dotIndex)}
                    className={
                      dotIndex === lightboxSelectedIndex
                        ? frameStyles.dotSelected
                        : undefined
                    }
                    aria-label={`Show image ${dotIndex + 1}`}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
