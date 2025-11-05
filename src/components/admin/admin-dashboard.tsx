"use client";

import { useState, type ReactNode } from "react";
import { signOut } from "next-auth/react";
import clsx from "clsx";
import styles from "./admin-dashboard.module.scss";
import { HeroSection } from "./sections/hero-section";
import { GallerySection } from "./sections/gallery-section";
import { MusicSection } from "./sections/music-section";
import { VideosSection } from "./sections/videos-section";
import { AboutSection } from "./sections/about-section";
import { ContactSection } from "./sections/contact-section";
import { NewsletterSection } from "./sections/newsletter-section";

type SectionId =
  | "hero"
  | "gallery"
  | "music"
  | "videos"
  | "about"
  | "contact"
  | "newsletter";

const SECTIONS: Array<{
  id: SectionId;
  label: string;
  description: string;
  render: () => ReactNode;
}> = [
  {
    id: "hero",
    label: "Hero",
    description:
      "Control the headline, supporting copy, and background assets that appear on the landing hero.",
    render: () => <HeroSection />,
  },
  {
    id: "gallery",
    label: "Gallery",
    description:
      "Upload imagery to Cloudinary, manage captions, alt text, tags, and sort order for the visuals carousel.",
    render: () => <GallerySection />,
  },
  {
    id: "music",
    label: "Music",
    description:
      "Add releases, set streaming links, configure scheduling, and toggle coming soon overlays.",
    render: () => <MusicSection />,
  },
  {
    id: "videos",
    label: "Videos",
    description:
      "Embed YouTube clips with descriptions and optional thumbnails (YouTube preferred).",
    render: () => <VideosSection />,
  },
  {
    id: "about",
    label: "About",
    description:
      "Craft the project bio, mission statement, featured quote, and supporting imagery.",
    render: () => <AboutSection />,
  },
  {
    id: "contact",
    label: "Contact & Socials",
    description:
      "Keep booking details, social profiles, and streaming links up-to-date.",
    render: () => <ContactSection />,
  },
  {
    id: "newsletter",
    label: "Newsletter",
    description:
      "Review sign-ups, export subscriber lists, or copy addresses for campaigns.",
    render: () => <NewsletterSection />,
  },
];

export function AdminDashboard() {
  const [activeSection, setActiveSection] = useState<SectionId>("hero");

  const sectionConfig = SECTIONS.find((section) => section.id === activeSection)!;

  return (
    <div className={styles.root}>
      <aside className={styles.sidebar}>
        <div className={styles.brand}>Admin Control</div>
        <nav className={styles.navSection}>
          {SECTIONS.map((section) => (
            <button
              key={section.id}
              type="button"
              className={clsx(styles.navButton, {
                [styles.navButtonActive]: section.id === activeSection,
              })}
              onClick={() => setActiveSection(section.id)}
            >
              {section.label}
            </button>
          ))}
        </nav>

        <button
          type="button"
          className={clsx(styles.navButton, styles.logoutButton)}
          onClick={() => signOut({ callbackUrl: "/login" })}
        >
          Sign out
        </button>
      </aside>

      <main className={styles.content}>
        <header className={styles.sectionHeader}>
          <div>
            <h1 className={styles.sectionTitle}>{sectionConfig.label}</h1>
            <p className={styles.sectionDescription}>
              {sectionConfig.description}
            </p>
          </div>
        </header>

        {sectionConfig.render()}
      </main>
    </div>
  );
}
