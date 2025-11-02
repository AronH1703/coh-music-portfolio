"use client";

import {
  type ComponentPropsWithoutRef,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import Image from "next/image";
import clsx from "clsx";
import useEmblaCarousel from "embla-carousel-react";
import type { EmblaCarouselType, EmblaOptionsType } from "embla-carousel";
import frameStyles from "../carousel/carousel-frame.module.css";
import s from "./photo-carousel.module.css";

type Photo = {
  src: string;
  alt: string;
  width: number;
  height: number;
  title?: string;
  location?: string;
};

const photos: Photo[] = [
  {
    src: "/Screamarinn-min.png",
    alt: "Live performance shot mid movement",
    width: 1720,
    height: 1336,
    title: "Screamarinn",
    location: "Live session",
  },
  {
    src: "/att.EFV6UYXnnVtjSnJq37oGVWM-lHOTO-e4aamj9Vdn9kk.JPG",
    alt: "Artist posing with flowers",
    width: 2048,
    height: 1536,
    title: "Florist Pose",
    location: "Studio series",
  },
  {
    src: "/JPEG image-4C32-B0F3-E5-0.jpeg",
    alt: "Bold portrait on red backdrop",
    width: 1024,
    height: 1024,
    title: "Bold Portrait",
    location: "Press kit",
  },
  {
    src: "/EP 3 CLEAN COVER.png",
    alt: "EP 3 clean album cover art",
    width: 3000,
    height: 3000,
    title: "EP III",
    location: "Album covers",
  },
  {
    src: "/CoH_letter_texture.png",
    alt: "Creature of Habit letter texture artwork",
    width: 878,
    height: 237,
    title: "Letter Texture",
    location: "Merch concepts",
  },
  {
    src: "/ryanAir.png",
    alt: "Ryan Air collage style illustration",
    width: 3600,
    height: 3600,
    title: "Ryan Air",
    location: "Tour visuals",
  },
  {
    src: "/ryanAir_.png",
    alt: "Ryan Air alternate collage",
    width: 3600,
    height: 3600,
    title: "Ryan Air (Alt)",
    location: "Tour visuals",
  },
  {
    src: "/RUNNING (BOLD_YELLOW).png",
    alt: "Running poster bold yellow",
    width: 3000,
    height: 3000,
    title: "Running Poster",
    location: "Promo series",
  },
];

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

export default function PhotoCarousel() {
  const [emblaRef, emblaApi] = useEmblaCarousel(CAROUSEL_OPTIONS);
  const [lightboxRef, lightboxEmbla] = useEmblaCarousel(LIGHTBOX_OPTIONS);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const lightboxActiveRef = useRef(false);

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

  const openLightbox = useCallback(
    (index: number) => {
      const clickAllowed =
        typeof emblaApi?.clickAllowed === "function"
          ? emblaApi.clickAllowed()
          : true;
      if (!clickAllowed) return;
      lightboxActiveRef.current = true;
      setLightboxIndex(index);
    },
    [emblaApi],
  );

  const closeLightbox = useCallback(() => {
    lightboxActiveRef.current = false;
    setLightboxIndex(null);
  }, []);

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
          prev === null ? null : (prev + 1) % photos.length,
        );
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        setLightboxIndex((prev) =>
          prev === null ? null : (prev - 1 + photos.length) % photos.length,
        );
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [closeLightbox, lightboxIndex]);

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

  return (
    <div className={frameStyles.root}>
      <div className={frameStyles.embla}>
        <div className={frameStyles.viewport} ref={emblaRef}>
          <div className={clsx(frameStyles.container, s.container)}>
            {photos.map((photo, index) => (
              <div className={s.slide} key={photo.src}>
                <article className={s.card}>
                  <button
                    type="button"
                    className={s.previewButton}
                    onClick={() => openLightbox(index)}
                    aria-label={`View ${photo.title ?? `photo ${index + 1}`}`}
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
                  {(photo.title || photo.location) && (
                    <div className={clsx(frameStyles.info, s.info)}>
                      {photo.title && (
                        <h3 className={frameStyles.title}>{photo.title}</h3>
                      )}
                      {photo.location && (
                        <span className={frameStyles.meta}>{photo.location}</span>
                      )}
                    </div>
                  )}
                </article>
              </div>
            ))}
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
        {lightboxIndex !== null && (
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
                  {photos.map((photo) => (
                    <div className={s.lightboxSlide} key={`lightbox-${photo.src}`}>
                      <div
                        className={s.lightboxImageWrap}
                        style={{ aspectRatio: `${photo.width} / ${photo.height}` }}
                      >
                        <Image
                          src={photo.src}
                          alt={photo.alt}
                          fill
                          sizes="100vw"
                          className={s.lightboxImg}
                          priority
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            {(photos[lightboxIndex].title || photos[lightboxIndex].location) && (
              <div className={s.lightboxCaption}>
                {photos[lightboxIndex].location && (
                  <span>{photos[lightboxIndex].location}</span>
                )}
                {photos[lightboxIndex].title && (
                  <strong>{photos[lightboxIndex].title}</strong>
                )}
              </div>
            )}
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
