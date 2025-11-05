import { type ReactNode } from "react";
import PhotoCarousel, { type GalleryPhoto } from "@/components/gallery/photo-carousel";
import VideoCarousel, { type VideoCarouselItem } from "@/components/videos/video-carousel";
import MusicCarousel, { type MusicCarouselRelease } from "@/components/music/music-carousel";
import { HeroSection } from "@/components/landing/hero";
import {
  getHeroContent,
  getGalleryItems,
  getMusicReleases,
  getVideos,
  getAboutContent,
  getContactContent,
  type AboutContentEntry,
  type ContactContentEntry,
} from "@/lib/content";

type SectionConfig = {
  id: string;
  title: string;
  description: string;
  placeholder?: string;
  content?: ReactNode;
};

export default async function Home() {
  const [hero, gallery, music, videos, about, contact] = await Promise.all([
    getHeroContent(),
    getGalleryItems(),
    getMusicReleases(),
    getVideos(),
    getAboutContent(),
    getContactContent(),
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
      title: "Music",
      description:
        "Browse released singles and works-in-progress. Each card opens a shareable release page with credits, artwork, and streaming links.",
      content: musicSlides.length ? (
        <MusicCarousel releases={musicSlides} />
      ) : undefined,
      placeholder: "Add releases via the admin panel to populate this carousel.",
    },
    {
      id: "gallery",
      title: "Gallery",
      description:
        "Capture behind-the-scenes shots, cover artwork, and stage moments. Upload imagery from the admin to curate the visual story.",
      content: gallerySlides.length ? (
        <PhotoCarousel photos={gallerySlides} />
      ) : undefined,
      placeholder: "Upload imagery through the admin Gallery section to showcase visuals here.",
    },
    {
      id: "videos",
      title: "Videos",
      description:
        "Highlight music videos, mini-documentaries, and live performances with a focused carousel of featured clips.",
      content: videoSlides.length ? <VideoCarousel videos={videoSlides} /> : undefined,
      placeholder: "Add YouTube links in the admin Videos section to feature them here.",
    },
    {
      id: "about",
      title: "About",
      description:
        "Share your story, influences, and creative milestones. This section pulls directly from the About editor in the admin dashboard.",
      content: <AboutContent data={about} />,
    },
    {
      id: "contact",
      title: "Contact",
      description:
        "Offer booking, management, and collaboration details. Add social and streaming links from the admin to keep everything current.",
      content: <ContactContent data={contact} />,
    },
  ];

  return (
    <main>
      <HeroSection data={hero} />
      {sections.map((section) => (
        <ContentSection key={section.id} {...section} />
      ))}
    </main>
  );
}

type ContentSectionProps = SectionConfig;

function ContentSection({ id, title, description, placeholder, content }: ContentSectionProps) {
  return (
    <section id={id}>
      <div className="section-inner">
        <div className="space-y-4">
          <span className="eyebrow">{title}</span>
          <h2>{content ? title : `${title} coming soon`}</h2>
          <p>{description}</p>
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
    "Aron Emilsson crafts cinematic pop and electronic scores that lean into tactile textures, layered harmonies, and patient storytelling.";
  const aboutText = data?.aboutText ?? fallbackText;
  const missionStatement = data?.missionStatement;
  const featuredQuote = data?.featuredQuote;
  const attribution = data?.quoteAttribution;

  const paragraphs = splitTextIntoParagraphs(aboutText);

  return (
    <div className="about-content">
      <div className="about-copy">
        {missionStatement && <p className="mission-statement">{missionStatement}</p>}
        {paragraphs.map((paragraph, index) => (
          <p key={`about-paragraph-${index}`}>{paragraph}</p>
        ))}
      </div>
      {(featuredQuote || attribution) && (
        <blockquote className="about-quote">
          {featuredQuote && <p>“{featuredQuote}”</p>}
          {attribution && <cite>— {attribution}</cite>}
        </blockquote>
      )}
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
  return (
    <form className="contact-form">
      <label htmlFor="newsletter-email">Join the release log</label>
      <div className="contact-form-field">
        <input
          id="newsletter-email"
          name="email"
          type="email"
          placeholder={email || "name@example.com"}
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
  );
}
