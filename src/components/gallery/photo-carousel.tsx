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
import type {
  EmblaCarouselType,
  EmblaEventType,
  EmblaOptionsType,
} from "embla-carousel";
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
const TWEEN_FACTOR_BASE = 0.2;
const PARALLAX_LAYER_SELECTOR = "[data-embla-parallax-layer]";

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
  const { children, ...rest } = props;
  return (
    <button type="button" className={s.btn} {...rest}>
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
  const { children, ...rest } = props;
  return (
    <button type="button" className={s.btn} {...rest}>
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

export default function PhotoCarousel() {
  const [emblaRef, emblaApi] = useEmblaCarousel(CAROUSEL_OPTIONS);
  const tweenFactor = useRef(0);
  const tweenNodes = useRef<Array<HTMLElement | null>>([]);

  const { prevBtnDisabled, nextBtnDisabled, onPrevButtonClick, onNextButtonClick } =
    usePrevNextButtons(emblaApi);
  const { selectedIndex, scrollSnaps, onDotButtonClick } = useDotButton(emblaApi);

  const setTweenNodes = useCallback((api: EmblaCarouselType) => {
    tweenNodes.current = api
      .slideNodes()
      .map((slideNode) => slideNode.querySelector(PARALLAX_LAYER_SELECTOR) as HTMLElement | null);
  }, []);

  const setTweenFactor = useCallback((api: EmblaCarouselType) => {
    tweenFactor.current = TWEEN_FACTOR_BASE * api.scrollSnapList().length;
  }, []);

  const tweenParallax = useCallback((api: EmblaCarouselType, eventName?: EmblaEventType) => {
    const engine = api.internalEngine();
    const scrollProgress = api.scrollProgress();
    const slidesInView = api.slidesInView();
    const isScrollEvent = eventName === "scroll";

    api.scrollSnapList().forEach((scrollSnap, snapIndex) => {
      let diffToTarget = scrollSnap - scrollProgress;
      const slidesInSnap = engine.slideRegistry[snapIndex] ?? [];

      slidesInSnap.forEach((slideIndex) => {
        if (isScrollEvent && !slidesInView.includes(slideIndex)) return;

        if (engine.options.loop) {
          engine.slideLooper.loopPoints.forEach((loopItem) => {
            const target = loopItem.target();

            if (slideIndex === loopItem.index && target !== 0) {
              const sign = Math.sign(target);

              if (sign === -1) {
                diffToTarget = scrollSnap - (1 + scrollProgress);
              }
              if (sign === 1) {
                diffToTarget = scrollSnap + (1 - scrollProgress);
              }
            }
          });
        }

        const translate = diffToTarget * (-1 * tweenFactor.current) * 100;
        const layer = tweenNodes.current[slideIndex];
        if (layer) {
          layer.style.transform = `translateX(${translate}%)`;
        }
      });
    });
  }, []);

  useEffect(() => {
    if (!emblaApi) return;

    setTweenNodes(emblaApi);
    setTweenFactor(emblaApi);
    tweenParallax(emblaApi);

    emblaApi.on("reInit", setTweenNodes);
    emblaApi.on("reInit", setTweenFactor);
    emblaApi.on("reInit", tweenParallax);
    emblaApi.on("scroll", tweenParallax);
    emblaApi.on("slideFocus", tweenParallax);

    return () => {
      emblaApi.off("reInit", setTweenNodes);
      emblaApi.off("reInit", setTweenFactor);
      emblaApi.off("reInit", tweenParallax);
      emblaApi.off("scroll", tweenParallax);
      emblaApi.off("slideFocus", tweenParallax);
    };
  }, [emblaApi, setTweenFactor, setTweenNodes, tweenParallax]);

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

  return (
    <div className={s.root}>
      <div className={s.embla}>
        <div className={s.viewport} ref={emblaRef}>
          <div className={s.container}>
            {photos.map((photo, index) => (
              <div className={s.slide} key={photo.src}>
                <div className={s.parallax}>
                  <div className={s.layer} data-embla-parallax-layer>
                    <div
                      className={s.imageWrap}
                      style={{ aspectRatio: `${photo.width} / ${photo.height}` }}
                    >
                      <Image
                        src={photo.src}
                        alt={photo.alt}
                        fill
                        sizes="(max-width: 768px) 90vw, 640px"
                        className={s.img}
                        priority={index === 0}
                      />
                    </div>
                  </div>
                  {(photo.title || photo.location) && (
                    <div className={s.meta}>
                      {photo.location && <span>{photo.location}</span>}
                      {photo.title && <strong>{photo.title}</strong>}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className={s.controls}>
        <div className={s.buttons}>
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
        <div className={s.dots}>
          {scrollSnaps.map((_, dotIndex) => (
            <DotButton
              key={dotIndex}
              onClick={() => onDotButtonClick(dotIndex)}
              className={clsx(s.dot, dotIndex === selectedIndex && s.dotSelected)}
              aria-label={`Go to slide ${dotIndex + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
