"use client";

import type { ComponentPropsWithoutRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import clsx from "clsx";
import useEmblaCarousel from "embla-carousel-react";
import type { EmblaCarouselType } from "embla-carousel";
import { musicReleases } from "../../data/music";
import s from "./music-carousel.module.css";

const dateFormatter = new Intl.DateTimeFormat("en", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

export default function MusicCarousel() {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: "start",
    loop: false,
    dragFree: false,
    containScroll: "trimSnaps",
  });
  const [prevDisabled, setPrevDisabled] = useState(true);
  const [nextDisabled, setNextDisabled] = useState(true);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [scrollSnaps, setScrollSnaps] = useState<number[]>([]);

  const onSelect = useCallback((api: EmblaCarouselType) => {
    setSelectedIndex(api.selectedScrollSnap());
    setPrevDisabled(!api.canScrollPrev());
    setNextDisabled(!api.canScrollNext());
  }, []);

  const onInit = useCallback((api: EmblaCarouselType) => {
    setScrollSnaps(api.scrollSnapList());
    onSelect(api);
  }, [onSelect]);

  useEffect(() => {
    if (!emblaApi) return;
    const raf = requestAnimationFrame(() => onInit(emblaApi));
    emblaApi.on("reInit", onInit).on("select", onSelect);
    return () => {
      cancelAnimationFrame(raf);
      emblaApi.off("reInit", onInit);
      emblaApi.off("select", onSelect);
    };
  }, [emblaApi, onInit, onSelect]);

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  const scrollTo = useCallback(
    (index: number) => emblaApi?.scrollTo(index),
    [emblaApi],
  );

  return (
    <div className={s.root}>
      <div className={s.embla}>
        <div className={s.viewport} ref={emblaRef}>
          <div className={s.container}>
            {musicReleases.map((release, index) => {
              const { slug, title, coverImage, status, releaseDate } = release;
              const isComingSoon = status === "coming-soon";
              const formattedDate = releaseDate
                ? dateFormatter.format(new Date(releaseDate))
                : "Date TBA";

              return (
                <div className={s.slide} key={slug}>
                  <Link href={`/music/${slug}`} className={s.cardLink}>
                    <article
                      className={clsx(s.card, isComingSoon && s.cardComingSoon)}
                    >
                      <div className={s.cover}>
                        <Image
                          src={coverImage.src}
                          alt={coverImage.alt}
                          fill
                          sizes="(min-width: 1280px) 240px, (min-width: 768px) 30vw, 85vw"
                          className={s.image}
                          priority={index === 0}
                        />
                        {isComingSoon && (
                          <div className={s.overlay}>
                            <span className={s.overlayText}>Coming soon</span>
                          </div>
                        )}
                      </div>
                      <div className={s.info}>
                        <h3 className={s.title}>{title}</h3>
                        <span
                          className={clsx(s.meta, isComingSoon && s.metaMuted)}
                        >
                          {isComingSoon ? "In production" : formattedDate}
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

      <div className={s.controls}>
        <div className={s.buttons}>
          <PrevButton
            onClick={scrollPrev}
            disabled={prevDisabled}
            aria-label="Show previous release"
          />
          <NextButton
            onClick={scrollNext}
            disabled={nextDisabled}
            aria-label="Show next release"
          />
        </div>

        {scrollSnaps.length > 1 && (
          <div
            className={s.dots}
            role="tablist"
            aria-label="Select release slide"
          >
            {scrollSnaps.map((_, index) => (
              <DotButton
                key={index}
                className={clsx(s.dot, index === selectedIndex && s.dotSelected)}
                onClick={() => scrollTo(index)}
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
    <button type="button" className={clsx(s.btn, className)} {...rest}>
      <svg className={s.btnSvg} viewBox="0 0 532 532" aria-hidden="true">
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
    <button type="button" className={clsx(s.btn, className)} {...rest}>
      <svg className={s.btnSvg} viewBox="0 0 532 532" aria-hidden="true">
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
    <button type="button" className={className} {...rest}>
      {children}
    </button>
  );
}
