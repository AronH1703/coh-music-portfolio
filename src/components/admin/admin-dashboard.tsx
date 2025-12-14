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
      "Stjórnaðu fyrirsögn, texta og hönnun í aðalsvæði forsíðu.",
    render: () => <HeroSection />,
  },
  {
    id: "gallery",
    label: "Gallery",
    description:
      "Settu inn myndir úr Cloudinary og stjórnaðu myndasafni vefsins.",
    render: () => <GallerySection />,
  },
  {
    id: "music",
    label: "Music",
    description:
      "Bættu við útgáfum, streymisveitum, útgáfudaga og „coming soon“ overlay.",
    render: () => <MusicSection />,
  },
  {
    id: "pressKit",
    label: "Press Kit",
    description:
      "Búðu til sérsniðna hlekki fyrir Press-kit byggða á Dropbox URL-slóðum.",
    render: () => <PressKitSection />,
  },
  {
    id: "videos",
    label: "Videos",
    description:
      "Settu inn YouTube-myndbönd með lýsingum og valkvæðum smámyndum (YouTube).",
    render: () => <VideosSection />,
  },
  {
    id: "about",
    label: "About",
    description:
      "Eitthvað sniðugt um þig.",
    render: () => <AboutSection />,
  },
  {
    id: "contact",
    label: "Contact & Socials",
    description:
      "Haltu bókunarupplýsingum, samfélagsmiðlum og tenglum uppfærðum.",
    render: () => <ContactSection />,
  },
  {
    id: "newsletter",
    label: "Newsletter",
    description:
      "Skoðaðu skráningar, sæktu eða afrituðu póstlistann fyrir herferðir.",
    render: () => <NewsletterSection />,
  },
  {
    id: "labels",
    label: "Site Labels",
    description:
      "Yfirtextar og fyrirsagnir sem birtast yfir köflum síðunnar.",
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
