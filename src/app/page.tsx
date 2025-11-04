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

const ABOUT_HIGHLIGHTS = [
  {
    title: "Current focus",
    detail:
      "Writing an EP that blends modular synth improvisations with chamber strings and found-sound percussion.",
  },
  {
    title: "Recent collaborators",
    detail:
      "Sessions with the Skövde Symphony, choreographer Lova Holm, and the multidisciplinary RAUM Collective.",
  },
  {
    title: "Availability",
    detail:
      "Open for remote production, mix consulting, and bespoke scoring for film, theatre, and experiential media.",
  },
];

const SOCIAL_LINKS = [
  {
    label: "Email",
    handle: "hello@cohmusic.com",
    href: "mailto:hello@cohmusic.com",
  },
  {
    label: "Instagram",
    handle: "@coh.music",
    href: "https://instagram.com/coh.music",
  },
  {
    label: "YouTube",
    handle: "Studio Sessions",
    href: "https://youtube.com/@cohmusic",
  },
  {
    label: "Spotify",
    handle: "Follow on Spotify",
    href: "https://open.spotify.com/artist/6sIq0HbQz6OLOG0nKAnPrA",
  },
];

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
    content: <AboutContent />,
  },
  {
    id: "contact",
    title: "Contact",
    description:
      "Offer booking, management, and collaboration details. Later, replace the placeholder with a form or contact cards.",
    content: <ContactContent />,
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

function AboutContent() {
  return (
    <div className="about-content">
      <div className="about-copy">
        <p>
          Aron Emilsson crafts cinematic pop and electronic scores that lean
          into tactile textures, layered harmonies, and patient storytelling.
          Each production is built around live instrumentation, modular rigs,
          and field recordings captured on the road.
        </p>
        <p>
          From intimate singer-songwriter releases to immersive theatre and
          installation work, the studio approach centers collaboration, letting
          every project find its own palette and dynamic arc.
        </p>
      </div>
      <dl className="about-highlights">
        {ABOUT_HIGHLIGHTS.map((item) => (
          <div className="about-highlight" key={item.title}>
            <dt>{item.title}</dt>
            <dd>{item.detail}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function ContactContent() {
  return (
    <div className="contact-content">
      <div className="contact-info">
        <p>
          Booking, commissions, and collaboration inquiries land directly with
          the studio team. Add your email to receive release notes, session
          invites, and behind-the-scenes dispatches.
        </p>
        <ul className="contact-socials">
          {SOCIAL_LINKS.map((link) => (
            <li key={link.label}>
              <a href={link.href} target="_blank" rel="noreferrer">
                <span className="contact-social-label">{link.label}</span>
                <span className="contact-social-handle">{link.handle}</span>
              </a>
            </li>
          ))}
        </ul>
      </div>
      <form
        className="contact-form"
        onSubmit={(event) => {
          event.preventDefault();
        }}
      >
        <label htmlFor="email">Join the release log</label>
        <div className="contact-form-field">
          <input
            id="email"
            name="email"
            type="email"
            placeholder="name@example.com"
            required
            autoComplete="email"
          />
          <button type="submit" className="btn btn-primary">
            Notify me
          </button>
        </div>
        <span className="contact-form-helper">
          No spam—just key updates, and you can unsubscribe anytime.
        </span>
      </form>
    </div>
  );
}
