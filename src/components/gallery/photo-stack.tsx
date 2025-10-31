"use client";

import { useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";

type Photo = {
  src: string;
  alt: string;
  title: string;
  location: string;
};

const photos: Photo[] = [
  {
    src: "/JPEG image-4C32-B0F3-E5-0.jpeg",
    alt: "Letter texture artwork spelling Creature of Habit",
    title: "Letter Texture",
    location: "Merch concepts",
  },
  {
    src: "/EP 3 CLEAN COVER.png",
    alt: "Ryan Air collage style illustration",
    title: "Ryan Air Artwork",
    location: "Tour visuals",
  },
  {
    src: "/att.EFV6UYXnnVtjSnJq37oGVWM-lHOTO-e4aamj9Vdn9kk.JPG",
    alt: "Alternate Ryan Air collage artwork",
    title: "Alternate Cut",
    location: "Tour visuals",
  },
  {
    src: "/RUNNING (BOLD_YELLOW).png",
    alt: "Running bold yellow poster design",
    title: "Running Poster",
    location: "Promo series",
  },
];

const baseRotations = [-6, -2, 3, 8];

export function PhotoStack() {
  const [hovered, setHovered] = useState<number | null>(null);

  return (
    <div className="photo-stack">
      {photos.map((photo, index) => {
        const rotation = baseRotations[index % baseRotations.length];
        const isHovered = hovered === index;
        const zIndex = isHovered ? photos.length + 1 : photos.length - index;

        return (
          <motion.article
            key={photo.src}
            className="photo-card"
            style={{ zIndex }}
            initial={{
              y: index * -14,
              rotate: rotation,
              scale: 1,
            }}
            animate={{
              y: isHovered ? -40 : index * -14,
              rotate: isHovered ? 0 : rotation,
              scale: isHovered ? 1.04 : 1,
            }}
            transition={{
              type: "spring",
              stiffness: 260,
              damping: 24,
              mass: 0.9,
            }}
            onMouseEnter={() => setHovered(index)}
            onMouseLeave={() => setHovered(null)}
            whileTap={{ scale: 0.97 }}
          >
            <div className="photo-media">
              <Image
                src={photo.src}
                alt={photo.alt}
                fill
                sizes="(max-width: 768px) 80vw, 420px"
                priority={index === 0}
              />
            </div>
            <div className="photo-overlay" aria-hidden="true" />
            <div className="photo-meta">
              <span>{photo.location}</span>
              <strong>{photo.title}</strong>
            </div>
          </motion.article>
        );
      })}
    </div>
  );
}

export default PhotoStack;
