"use client";

import { useState, type ReactNode } from "react";
import { signOut } from "next-auth/react";
import { Menu, X } from "lucide-react";
import clsx from "clsx";
import styles from "./admin-dashboard.module.scss";
import { HeroSection } from "./sections/hero-section";
import { GallerySection } from "./sections/gallery-section";
import { MusicSection } from "./sections/music-section";
import { VideosSection } from "./sections/videos-section";
import { AboutSection } from "./sections/about-section";
import { ContactSection } from "./sections/contact-section";
import { NewsletterSection } from "./sections/newsletter-section";
import { PressKitSection } from "./sections/press-kit-section";
import { SiteLabelsSection } from "./sections/site-labels-section";

type SectionId =
  | "hero"
  | "gallery"
  | "music"
  | "pressKit"
  | "videos"
  | "about"
  | "contact"
  | "newsletter"
  | "labels";

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
      "Stjórnaðu fyrirsögn, texta o.s.frv. sem birtist í aðalhluta forsíðunnar.",
    render: () => <HeroSection />,
  },
  {
    id: "gallery",
    label: "Gallery",
    description:
      "Settu inn myndir (Cloudinary) og stjórnaðu myndasafni á vefsíðunni.",
    render: () => <GallerySection />,
  },
  {
    id: "music",
    label: "Music",
    description:
      "Bættu við útgáfum, skráðu streymistengla, stilltu tímasetningar og virkjaðu eða aftengdu coming soon yfirlag.",
    render: () => <MusicSection />,
  },
  {
    id: "pressKit",
    label: "Press Kit",
    description:
      "Provide curated download links for press and production assets via the new URL-based kit.",
    render: () => <PressKitSection />,
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
  {
    id: "labels",
    label: "Site Labels",
    description: "Customize the eyebrow text shown above each home section.",
    render: () => <SiteLabelsSection />,
  },
];

export function AdminDashboard() {
  const [activeSection, setActiveSection] = useState<SectionId>("hero");
  const [navOpen, setNavOpen] = useState(false);

  const sectionConfig = SECTIONS.find((section) => section.id === activeSection)!;

  const handleSelectSection = (id: SectionId) => {
    setActiveSection(id);
    setNavOpen(false);
  };

  return (
    <div className={styles.root}>
      <aside className={styles.sidebar}>
        <div className={styles.brand}>Admin Control</div>

        <button
          type="button"
          className={styles.navToggleButton}
          aria-label={navOpen ? "Close admin navigation" : "Open admin navigation"}
          onClick={() => setNavOpen((prev) => !prev)}
        >
          <span className={styles.navToggleIcon}>
            {navOpen ? <X size={18} /> : <Menu size={18} />}
          </span>
        </button>

        <nav
          className={clsx(styles.navSection, {
            [styles.navSectionCollapsed]: !navOpen,
          })}
        >
          {SECTIONS.map((section) => (
            <button
              key={section.id}
              type="button"
              className={clsx(styles.navButton, {
                [styles.navButtonActive]: section.id === activeSection,
              })}
              onClick={() => handleSelectSection(section.id)}
            >
              {section.label}
            </button>
          ))}

          <button
            type="button"
            className={clsx(
              styles.navButton,
              styles.logoutButton,
              styles.logoutMobile,
            )}
            onClick={() => {
              setNavOpen(false);
              signOut({ callbackUrl: "/login" });
            }}
          >
            Sign out
          </button>
        </nav>

        <button
          type="button"
          className={clsx(
            styles.navButton,
            styles.logoutButton,
            styles.logoutDesktop,
          )}
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
