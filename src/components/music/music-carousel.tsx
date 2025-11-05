"use client";

import {
  type ComponentPropsWithoutRef,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import Image from "next/image";
import Link from "next/link";
import clsx from "clsx";
import useEmblaCarousel from "embla-carousel-react";
import type { EmblaCarouselType, EmblaOptionsType } from "embla-carousel";
import frameStyles from "../carousel/carousel-frame.module.css";
import s from "./music-carousel.module.css";

const dateFormatter = new Intl.DateTimeFormat("en", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

const CAROUSEL_OPTIONS: EmblaOptionsType = {
  align: "center",
  loop: true,
};

export type MusicCarouselRelease = {
  id: string;
  slug: string;
  title: string;
  coverImageUrl?: string | null;
  coverImageAlt?: string | null;
  releaseDate?: string | null;
  comingSoon: boolean;
};

type MusicCarouselProps = {
  releases: MusicCarouselRelease[];
};

export default function MusicCarousel({ releases }: MusicCarouselProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel(CAROUSEL_OPTIONS);
  const {
    prevBtnDisabled,
    nextBtnDisabled,
    onPrevButtonClick,
    onNextButtonClick,
  } = usePrevNextButtons(emblaApi);
  const { selectedIndex, scrollSnaps, onDotButtonClick } =
    useDotButton(emblaApi);

  const items = useMemo(() => releases.filter((release) => release.slug), [releases]);

  if (!items.length) {
    return (
      <div className={clsx(frameStyles.root, "p-8 text-center text-sm text-neutral-400")}
           role="status">
        Music releases will appear here once published via the admin.
      </div>
    );
  }

  return (
    <div className={frameStyles.root}>
      <div className={frameStyles.embla}>
        <div className={frameStyles.viewport} ref={emblaRef}>
          <div className={clsx(frameStyles.container, s.container)}>
            {items.map((release, index) => {
              const { slug, title, coverImageUrl, coverImageAlt, comingSoon, releaseDate } = release;
              const formattedDate = releaseDate
                ? dateFormatter.format(new Date(releaseDate))
                : "Date TBA";

              return (
                <div className={s.slide} key={slug}>
                  <Link href={`/music/${slug}`} className={s.cardLink}>
                    <article
                      className={clsx(s.card, comingSoon && s.cardComingSoon)}
                    >
                      <div className={s.cover}>
                        {coverImageUrl ? (
                          <Image
                            src={coverImageUrl}
                            alt={coverImageAlt || `${title} cover art`}
                            fill
                            sizes="(min-width: 1280px) 240px, (min-width: 768px) 30vw, 85vw"
                            className={s.image}
                            priority={index === 0}
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-neutral-900 text-xs uppercase tracking-wide text-neutral-200"
                               aria-hidden>
                            No artwork yet
                          </div>
                        )}
                        {comingSoon && (
                          <div className={s.overlay}>
                            <span className={s.overlayText}>Coming soon</span>
                          </div>
                        )}
                      </div>
                      <div className={clsx(frameStyles.info, s.info)}>
                        <h3 className={frameStyles.title}>{title}</h3>
                        <span
                          className={clsx(frameStyles.meta, comingSoon && s.metaMuted)}
                        >
                          {comingSoon ? "In production" : formattedDate}
                        </span>
                      </div>
                    </article>
                  </Link>
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
            aria-label="Show previous release"
          />
          <NextButton
            onClick={onNextButtonClick}
            disabled={nextBtnDisabled}
            aria-label="Show next release"
          />
        </div>

        {scrollSnaps.length > 1 && (
          <div
            className={frameStyles.dots}
            role="tablist"
            aria-label="Select release slide"
          >
            {scrollSnaps.map((_, index) => (
              <DotButton
                key={index}
                className={
                  index === selectedIndex ? frameStyles.dotSelected : undefined
                }
                onClick={() => onDotButtonClick(index)}
                aria-label={`Go to release ${index + 1}`}
                aria-pressed={index === selectedIndex}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
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

  return {
    prevBtnDisabled,
    nextBtnDisabled,
    onPrevButtonClick,
    onNextButtonClick,
  };
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
