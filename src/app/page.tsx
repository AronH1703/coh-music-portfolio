"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Menu, X, Sun, Moon } from "lucide-react";
import PhotoCarousel from "../components/gallery/photo-carousel";
import VideoCarousel from "../components/videos/video-carousel";

type SectionConfig = {
  id: string;
  title: string;
  description: string;
  placeholder?: string;
  content?: ReactNode;
};

const CONTENT_SECTIONS: SectionConfig[] = [
  {
    id: "music",
    title: "Music",
    description:
      "Albums, singles, and live sessions will live here. Build out playlists or embed streaming players when the catalogue is ready.",
    placeholder: "Music gallery placeholder",
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

const NAV_ITEMS = [
  { id: "hero", label: "Home" },
  ...CONTENT_SECTIONS.map(({ id, title }) => ({ id, label: title })),
];

const applyTheme = (theme: "light" | "dark") => {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  if (theme === "dark") root.classList.add("dark");
  else root.classList.remove("dark");
};

function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("dark");

  // Mount: determine real theme, apply it, and show the control
  useEffect(() => {
    // Defer state updates to avoid cascading render warning
    setTimeout(() => {
      setMounted(true);
      // Sync with the class set by the pre-hydration script
      const initial = document.documentElement.classList.contains("dark")
        ? "dark"
        : "light";
      setTheme(initial);
      applyTheme(initial);
    }, 0);
  }, []);

  // Persist on changes after mount
  useEffect(() => {
    if (!mounted) return;
    applyTheme(theme);
    try {
      window.localStorage.setItem("theme", theme);
    } catch {
      // ignore storage errors
    }
  }, [mounted, theme]);

  if (!mounted) {
    // Stable placeholder to avoid SSR/CSR mismatch
    return (
      <button
        className="toggle-btn"
        type="button"
        aria-hidden="true"
        tabIndex={-1}
      />
    );
  }

  const next = theme === "dark" ? "light" : "dark";
  return (
    <button
      className="toggle-btn"
      type="button"
      aria-label={`Switch to ${next} mode`}
      onClick={() => setTheme(next)}
      title={`Switch to ${next} mode`}
    >
      {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
}

export default function Home() {
  return (
    <div>
      <Navbar />
      <main>
        <Hero />
        {CONTENT_SECTIONS.map((section) => (
          <ContentSection key={section.id} {...section} />
        ))}
      </main>
    </div>
  );
}

function Navbar() {
  const [open, setOpen] = useState(false);

  const handleNavigate = () => {
    setOpen(false);
  };

  return (
    <header className="navbar">
      <nav className="navbar-inner">
        <Link href="#hero" className="brand" onClick={handleNavigate}>
          Creature of Habit
        </Link>

        {/* Links in the middle (hidden on mobile) */}
        <ul className="nav-links">
          {NAV_ITEMS.map(({ id, label }) => (
            <li key={id}>
              <Link href={`#${id}`} className="nav-link">
                {label}
              </Link>
            </li>
          ))}
        </ul>

        {/* Controls on the far right */}
        <div className="nav-controls">
          <ThemeToggle />
          <button
            type="button"
            className="menu-btn"
            aria-label={open ? "Close navigation menu" : "Open navigation menu"}
            onClick={() => setOpen((prev) => !prev)}
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </nav>
      <div className={`mobile-nav ${open ? "open" : ""}`}>
        <ul className="mobile-list">
          {NAV_ITEMS.map(({ id, label }) => (
            <li key={id}>
              <Link
                href={`#${id}`}
                className="mobile-link"
                onClick={handleNavigate}
              >
                {label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </header>
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
