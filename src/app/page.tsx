"use client";

import { type ReactNode } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import PhotoCarousel from "../components/gallery/photo-carousel";
import VideoCarousel from "../components/videos/video-carousel";
import MusicCarousel from "../components/music/music-carousel";

type SectionConfig = {
  id: string;
  title: string;
  description: string;
  placeholder?: string;
  content?: ReactNode;
};

export const CONTENT_SECTIONS: SectionConfig[] = [
  {
    id: "music",
    title: "Music",
    description:
      "Browse released singles and works-in-progress. Each card opens a shareable release page with credits, artwork, and streaming links.",
    content: <MusicCarousel />,
  },
  {
    id: "gallery",
    title: "Gallery",
    description:
      "Capture behind-the-scenes shots, cover artwork, and stage moments. Add an image grid or carousel once assets are available.",
    content: <PhotoCarousel />,
  },
  {
    id: "videos",
    title: "Videos",
    description:
      "Highlight music videos, mini-documentaries, and live performances with a focused carousel of featured clips.",
    content: <VideoCarousel />,
  },
  {
    id: "about",
    title: "About",
    description:
      "Share your story, influences, and creative milestones. This section can expand into a rich biography with press quotes.",
    placeholder: "About content placeholder",
  },
  {
    id: "contact",
    title: "Contact",
    description:
      "Offer booking, management, and collaboration details. Later, replace the placeholder with a form or contact cards.",
    placeholder: "Contact form placeholder",
  },
];

export default function Home() {
  return (
    <main>
      <Hero />
      {CONTENT_SECTIONS.map((section) => (
        <ContentSection key={section.id} {...section} />
      ))}
    </main>
  );
}

function Hero() {
  return (
    <section id="hero">
      {/* solid background only; removed gradient and glow blobs */}
      <div className="section-inner" style={{ textAlign: "left", marginTop: "2rem"}}>
        <motion.span
          className="eyebrow"
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          Composer • Producer • Multi-Instrumentalist
        </motion.span>

        <div style={{ display: "grid", gap: "1.5rem" }}>
          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeOut", delay: 0.1 }}
          >
            Soundscapes crafted for the moments that matter.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeOut", delay: 0.2 }}
          >
            Lean into immersive textures and evolving rhythms tailored for film,
            stage, and the listening room. This space will soon house releases,
            visuals, and stories from the studio floor.
          </motion.p>
        </div>

        <motion.div
          className="actions"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut", delay: 0.3 }}
        >
          <Link href="#music" className="btn btn-primary">
            Explore the work
          </Link>
          <Link href="#contact" className="btn btn-ghost">
            Booking & inquiries
          </Link>
        </motion.div>
      </div>
    </section>
  );
}

type SectionProps = {
  id: string;
  title: string;
  description: string;
  placeholder?: string;
  content?: ReactNode;
};

function ContentSection({
  id,
  title,
  description,
  placeholder,
  content,
}: SectionProps) {
  return (
    <section id={id}>
      <div className="section-inner">
        <div className="space-y-4">
          <span className="eyebrow">{title}</span>
          <h2>{content ? title : `${title} coming soon`}</h2>
          <p>{description}</p>
        </div>

        <div className={`card ${content ? "card-feature" : ""}`}>
          {content ?? <div>{placeholder}</div>}
        </div>
      </div>
    </section>
  );
}
