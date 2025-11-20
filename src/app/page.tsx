import Image from "next/image";
import { type ReactNode } from "react";
import PhotoCarousel, { type GalleryPhoto } from "@/components/gallery/photo-carousel";
import VideoCarousel, { type VideoCarouselItem } from "@/components/videos/video-carousel";
import MusicCarousel, { type MusicCarouselRelease } from "@/components/music/music-carousel";
import { HeroSection } from "@/components/landing/hero";
import {
  getAboutContent,
  getContactContent,
  getGalleryItems,
  getHeroContent,
  getMusicReleases,
  getPressKitAssets,
  getSiteLabels,
  getVideos,
  type AboutContentEntry,
  type ContactContentEntry,
  type PressKitAssetUrlKey,
} from "@/lib/content";
import { SubscribeForm } from "@/components/newsletter/subscribe-form";
import pressKitStyles from "@/components/press-kit/press-kit-section.module.css";

type SectionConfig = {
  id: string;
  eyebrow: string;
  heading?: string;
  description?: string; // made optional
  placeholder?: string;
  content?: ReactNode;
};

type PressKitButtonConfig = {
  urlKey: PressKitAssetUrlKey;
  title: string;
  helper: string;
  buttonLabel: string;
};

type PressKitItem = PressKitButtonConfig & {
  link: string;
};

const PRESS_KIT_BUTTONS: PressKitButtonConfig[] = [
  {
    urlKey: "fullPressKitZipUrl",
    title: "Full Press Kit (ZIP)",
    helper: "Everything bundled for press and partner sharing.",
    buttonLabel: "Download Full Press Kit (ZIP)",
  },
  {
    urlKey: "onePagerPdfUrl",
    title: "One-Pager (PDF)",
    helper: "Concise single-sheet overview for quick sharing.",
    buttonLabel: "Download One-Pager (PDF)",
  },
  {
    urlKey: "pressPhotosFolderUrl",
    title: "Press Photos Folder",
    helper: "High-resolution imagery and performance stills.",
    buttonLabel: "Download Press Photos",
  },
  {
    urlKey: "logosFolderUrl",
    title: "Logos Folder",
    helper: "Updated brand marks, icons, and wordmarks.",
    buttonLabel: "Download Logos",
  },
  {
    urlKey: "artworkFolderUrl",
    title: "Artwork Folder",
    helper: "Campaign artwork, singles, and album visuals.",
    buttonLabel: "Download Artwork",
  },
  {
    urlKey: "stagePlotPdfUrl",
    title: "Stage Plot (PDF)",
    helper: "Stage layout, risers, and technical diagram.",
    buttonLabel: "Download Stage Plot (PDF)",
  },
  {
    urlKey: "inputListPdfUrl",
    title: "Input List (PDF)",
    helper: "FOH + monitor-friendly channel list.",
    buttonLabel: "Download Input List (PDF)",
  },
];

export default async function Home() {
  const [
    hero,
    gallery,
    music,
    videos,
    about,
    contact,
    labels,
    pressKitAssets,
  ] = await Promise.all([
    getHeroContent(),
    getGalleryItems(),
    getMusicReleases(),
    getVideos(),
    getAboutContent(),
    getContactContent(),
    getSiteLabels(),
    getPressKitAssets(),
  ]);

  const gallerySlides: GalleryPhoto[] = gallery.map((item) => ({
    id: item.id,
    src: item.imageUrl,
    alt: item.altText ?? item.title ?? "Gallery image",
    width: item.width,
    height: item.height,
    title: item.title,
    location: item.category ?? undefined,
  }));

  const musicSlides: MusicCarouselRelease[] = music.map((release) => ({
    id: release.id,
    slug: release.slug,
    title: release.title,
    coverImageUrl: release.coverImageUrl,
    coverImageAlt: release.coverImageAlt,
    releaseDate: release.releaseDate,
    releaseAt: release.releaseAt,
    comingSoon: release.comingSoon,
  }));

  const videoSlides: VideoCarouselItem[] = videos.map((video) => ({
    id: video.id,
    externalId: video.externalId,
    videoUrl: video.videoUrl,
    title: video.title,
    description: video.description,
    thumbnailUrl: video.thumbnailUrl,
  }));

  const sections: SectionConfig[] = [
    {
      id: "music",
      eyebrow: labels.musicLabel ?? "Music",
      heading: labels.musicHeading ?? labels.musicLabel ?? "Music",
      // description:
      content: musicSlides.length ? (
        <MusicCarousel releases={musicSlides} />
      ) : undefined,
      placeholder: "Add releases via the admin panel to populate this carousel.",
    },
    {
      id: "gallery",
      eyebrow: labels.galleryLabel ?? "Gallery",
      heading: labels.galleryHeading ?? labels.galleryLabel ?? "Gallery",
      // description:
      content: gallerySlides.length ? (
        <PhotoCarousel photos={gallerySlides} />
      ) : undefined,
      placeholder: "Upload imagery through the admin Gallery section to showcase visuals here.",
    },
    {
      id: "videos",
      eyebrow: labels.videosLabel ?? "Videos",
      heading: labels.videosHeading ?? labels.videosLabel ?? "Videos",
      // description:
      content: videoSlides.length ? <VideoCarousel videos={videoSlides} /> : undefined,
      placeholder: "Add YouTube links in the admin Videos section to feature them here.",
    },
    {
      id: "about",
      eyebrow: labels.aboutLabel ?? "About",
      heading: labels.aboutHeading ?? labels.aboutLabel ?? "About",
      // description:
      content: <AboutContent data={about} />,
    },
    {
      id: "contact",
      eyebrow: labels.contactLabel ?? "Contact",
      heading: labels.contactHeading ?? labels.contactLabel ?? "Contact",
      // description:
      content: <ContactContent data={contact} />,
    },
  ];

  const pressKitItems: PressKitItem[] = PRESS_KIT_BUTTONS.flatMap((button) => {
    const rawUrl = pressKitAssets[button.urlKey];
    const url = typeof rawUrl === "string" ? rawUrl.trim() : "";
    if (!url) return [];

    return [
      {
        ...button,
        link: url,
      },
    ];
  });

  return (
    <main>
      <HeroSection data={hero} eyebrowLabel={labels.heroLabel ?? undefined} />
      {sections.map((section) => (
        <ContentSection key={section.id} {...section} />
      ))}
      <section id="press-kit">
        <div className="section-inner">
          <div className={pressKitStyles.header}>
            <span className="eyebrow">Press</span>
            <h2>Press Kit</h2>
            <p className="section-subtitle">
              Curated downloads for recording, touring, and production partners plus press outlets. All links are managed from the admin panel.
            </p>
          </div>
          <div className={pressKitStyles.actions}>
            {pressKitItems.length ? (
              pressKitItems.map((action) => (
                <article key={action.urlKey} className={pressKitStyles.actionCard}>
                  <div>
                    <p className={pressKitStyles.actionTitle}>{action.title}</p>
                    <p className={pressKitStyles.actionHelper}>{action.helper}</p>
                  </div>
                  {action.link ? (
                    <a
                      className={pressKitStyles.actionButton}
                      href={action.link}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {action.buttonLabel}
                    </a>
                  ) : (
                    <span className={pressKitStyles.actionDisabled}>Link coming soon</span>
                  )}
                </article>
              ))
            ) : (
              <article className={pressKitStyles.actionCard}>
                <div>
                  <p className={pressKitStyles.actionTitle}>Press kit links coming soon</p>
                  <p className={pressKitStyles.actionHelper}>
                    Add URLs through the admin Press Kit section to surface downloads on the homepage.
                  </p>
                </div>
                <span className={pressKitStyles.actionDisabled}>Not configured</span>
              </article>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}

type ContentSectionProps = SectionConfig;

function ContentSection({
  id,
  eyebrow,
  heading,
  description,
  placeholder,
  content,
}: ContentSectionProps) {
  const baseHeading = heading?.trim() || eyebrow?.trim() || "";
  const availableHeading = baseHeading || "Coming soon";
  const comingSoonHeading = baseHeading ? `${baseHeading} coming soon` : "Coming soon";

  return (
    <section id={id}>
      <div className="section-inner">
        <div className="space-y-4">
          <span className="eyebrow">{eyebrow}</span>
          <h2>{content ? availableHeading : comingSoonHeading}</h2>
          {description && <p className="section-subtitle">{description}</p>}
        </div>
        <div className={`card ${content ? "card-feature" : ""}`}>
          {content ?? <div>{placeholder ?? "Content managed from the admin dashboard will appear here."}</div>}
        </div>
      </div>
    </section>
  );
}

function splitTextIntoParagraphs(text: string) {
  return text
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
}

function AboutContent({ data }: { data: AboutContentEntry | null }) {
  const fallbackText =
    "Creature of Habit crafts cinematic pop and electronic scores that lean into tactile textures, layered harmonies, and patient storytelling.";
  const aboutText = data?.aboutText ?? fallbackText;
  const missionStatement = data?.missionStatement;
  const featuredQuote = data?.featuredQuote;
  const attribution = data?.quoteAttribution;
  const artistPhotoUrl = data?.artistPhotoUrl;
  const artistPhotoAlt = data?.artistPhotoAlt ?? "Portrait of Creature of Habit";

  const paragraphs = splitTextIntoParagraphs(aboutText);

  return (
    <div className="about-content">
      <div className="about-copy">
        {missionStatement && <p className="mission-statement">{missionStatement}</p>}
        {paragraphs.map((paragraph, index) => (
          <p key={`about-paragraph-${index}`}>{paragraph}</p>
        ))}
      </div>
      <div className="about-panel">
        {artistPhotoUrl && (
          <figure className="about-photo">
            <Image
              src={artistPhotoUrl}
              alt={artistPhotoAlt}
              fill
              sizes="(min-width: 768px) 340px, 100vw"
              className="about-photo-image"
            />
          </figure>
        )}
        {(featuredQuote || attribution) && (
          <blockquote className="about-quote">
            {featuredQuote && <p>“{featuredQuote}”</p>}
            {attribution && <cite>— {attribution}</cite>}
          </blockquote>
        )}
      </div>
    </div>
  );
}

type ContactLink = {
  label: string;
  handle: string;
  href: string;
};

function buildContactLinks(data: ContactContentEntry | null): ContactLink[] {
  if (!data) return [];

  const links: ContactLink[] = [];

  const emailHandle = data.emailContact?.trim();
  if (emailHandle) {
    links.push({
      label: "Email",
      handle: emailHandle,
      href: `mailto:${emailHandle}`,
    });
  }

  const bookingEmail = data.bookingEmail?.trim();
  if (bookingEmail) {
    links.push({
      label: "Booking",
      handle: bookingEmail,
      href: `mailto:${bookingEmail}`,
    });
  }

  if (Array.isArray(data.socialLinks)) {
    for (const link of data.socialLinks) {
      if (!link || typeof link !== 'object') continue;
      const { label, url } = link as { label?: string | null; url?: string | null };
      if (!label || !url) continue;
      const handle = formatHandle(url);
      links.push({ label, handle, href: url });
    }
  }

  return links;
}

function formatHandle(url: string) {
  try {
    const parsed = new URL(url);
    const handle = parsed.pathname.replace(/\/+/g, "/").replace(/^\//, "");
    return handle ? `${parsed.hostname}/${handle}` : parsed.hostname;
  } catch {
    return url;
  }
}

function ContactContent({ data }: { data: ContactContentEntry | null }) {
  const links = buildContactLinks(data);

  const management = data?.managementContact;
  const press = data?.pressContact;

  return (
    <div className="contact-content">
      <div className="contact-info">
        <p>
          Booking, commissions, and collaboration inquiries land directly with the studio team. Update these details in the admin to keep partners in the loop.
        </p>
        {links.length ? (
          <ul className="contact-socials">
            {links.map((link) => (
              <li key={`${link.label}-${link.handle}`}>
                <a href={link.href} target="_blank" rel="noreferrer">
                  <span className="contact-social-label">{link.label}</span>
                  <span className="contact-social-handle">{link.handle}</span>
                </a>
              </li>
            ))}
          </ul>
        ) : (
          <p className="contact-form-helper">
            Set contact emails and social links via the admin to display them here.
          </p>
        )}
        {management && (
          <p className="contact-form-helper">
            <span className="contact-social-label">Management</span>
            <span className="contact-social-handle">{management}</span>
          </p>
        )}
        {press && (
          <p className="contact-form-helper">
            <span className="contact-social-label">Press</span>
            <span className="contact-social-handle">{press}</span>
          </p>
        )}
      </div>
      <NewsletterCta email={data?.emailContact ?? ""} />
    </div>
  );
}

function NewsletterCta({ email }: { email: string }) {
  return <SubscribeForm placeholder={email} />;
}
