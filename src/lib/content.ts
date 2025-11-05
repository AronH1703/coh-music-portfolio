import { prisma } from "@/lib/prisma";

export type HeroContent = {
  title: string;
  subtitle: string;
  backgroundColor?: string | null;
  titleColor?: string | null;
  subtitleColor?: string | null;
  eyebrowColor?: string | null;
  titleFont?: string | null;
  subtitleFont?: string | null;
  primaryCtaLabel?: string | null;
  primaryCtaHref?: string | null;
  secondaryCtaLabel?: string | null;
  secondaryCtaHref?: string | null;
  metaTitle?: string | null;
  metaDescription?: string | null;
};

export async function getHeroContent(): Promise<HeroContent | null> {
  const hero = await prisma.hero.findFirst({
    orderBy: { updatedAt: "desc" },
  });

  if (!hero) return null;

  return {
    title: hero.title,
    subtitle: hero.subtitle,
    backgroundColor: hero.backgroundColor,
    titleColor: hero.titleColor,
    subtitleColor: hero.subtitleColor,
    eyebrowColor: hero.eyebrowColor,
    titleFont: hero.titleFont,
    subtitleFont: hero.subtitleFont,
    primaryCtaLabel: hero.primaryCtaLabel,
    primaryCtaHref: hero.primaryCtaHref,
    secondaryCtaLabel: hero.secondaryCtaLabel,
    secondaryCtaHref: hero.secondaryCtaHref,
    metaTitle: hero.metaTitle,
    metaDescription: hero.metaDescription,
  };
}

export type SiteLabels = {
  heroLabel?: string | null;
  musicLabel?: string | null;
  galleryLabel?: string | null;
  videosLabel?: string | null;
  aboutLabel?: string | null;
  contactLabel?: string | null;
};

export async function getSiteLabels(): Promise<SiteLabels> {
  const clientAny = prisma as unknown as { siteLabels?: { findFirst: Function } };
  const hasModel = typeof clientAny.siteLabels?.findFirst === "function";

  let labels: any = null;
  if (hasModel) {
    labels = await (clientAny.siteLabels as any).findFirst({ orderBy: { updatedAt: "desc" } });
  }

  return {
    heroLabel: labels?.heroLabel ?? 'Composer • Producer • Multi-Instrumentalist',
    musicLabel: labels?.musicLabel ?? "Music",
    galleryLabel: labels?.galleryLabel ?? "Gallery",
    videosLabel: labels?.videosLabel ?? "Videos",
    aboutLabel: labels?.aboutLabel ?? "About",
    contactLabel: labels?.contactLabel ?? "Contact",
  };
}

export type GalleryItemContent = {
  id: string;
  title: string;
  caption?: string | null;
  imageUrl: string;
  altText?: string | null;
  category?: string | null;
  tags: string[];
  width?: number | null;
  height?: number | null;
};

export async function getGalleryItems(): Promise<GalleryItemContent[]> {
  const items = await prisma.galleryItem.findMany({
    orderBy: [{ sortOrder: "asc" }, { uploadedAt: "desc" }],
  });

  return items.map((item) => {
    const rawTags = item.tags as unknown;
    let tags: string[] = [];
    if (Array.isArray(rawTags)) {
      tags = rawTags.filter((tag): tag is string => typeof tag === "string");
    } else if (rawTags && typeof rawTags === "object" && Array.isArray((rawTags as any).set)) {
      tags = ((rawTags as any).set as unknown[]).filter((tag): tag is string => typeof tag === "string");
    }

    return {
      id: item.id,
      title: item.title,
      caption: item.caption,
      imageUrl: item.imageUrl,
      altText: item.altText,
      category: item.category,
      tags,
      width: item.width,
      height: item.height,
    };
  });
}

export type MusicReleaseContent = {
  id: string;
  title: string;
  slug: string;
  coverImageUrl?: string | null;
  coverImageAlt?: string | null;
  releaseDate?: string | null;
  comingSoon: boolean;
};

export async function getMusicReleases(): Promise<MusicReleaseContent[]> {
  const releases = await prisma.musicRelease.findMany({
    orderBy: [{ sortOrder: "asc" }, { releaseAt: "desc" }, { createdAt: "desc" }],
  });

  return releases.map((release) => ({
    id: release.id,
    title: release.title,
    slug: release.slug,
    coverImageUrl: release.coverImageUrl,
    coverImageAlt: release.coverImageAlt,
    releaseDate: release.releaseDate ? release.releaseDate.toISOString() : null,
    comingSoon: release.comingSoon,
  }));
}

export type MusicReleaseDetail = {
  id: string;
  title: string;
  slug: string;
  description?: string | null;
  streamingLinks: Array<{ id: string; label: string; url: string }>;
  coverImageUrl?: string | null;
  coverImageAlt?: string | null;
  coverCloudinaryPublicId?: string | null;
  audioUrl?: string | null;
  audioCloudinaryPublicId?: string | null;
  releaseDate?: string | null;
  releaseTime?: string | null;
  timeZone?: string | null;
  comingSoon: boolean;
  genre?: string | null;
  duration?: string | null;
  credits?: string | null;
  metaTitle?: string | null;
  metaDescription?: string | null;
};

export async function getMusicReleaseBySlug(slug: string): Promise<MusicReleaseDetail | null> {
  const release = await prisma.musicRelease.findUnique({ where: { slug } });

  if (!release) return null;

  const streamingLinksRaw = (release.streamingLinks ?? []) as unknown;
  const streamingLinks = Array.isArray(streamingLinksRaw)
    ? streamingLinksRaw
        .map((entry) => {
          if (!entry || typeof entry !== "object") return null;
          const { id, label, url } = entry as {
            id?: unknown;
            label?: unknown;
            url?: unknown;
          };
          if (typeof label !== "string" || typeof url !== "string") return null;
          return {
            id: typeof id === "string" ? id : `${slug}-${label}-${url}`,
            label,
            url,
          };
        })
        .filter((link): link is { id: string; label: string; url: string } => Boolean(link))
    : [];

  return {
    id: release.id,
    title: release.title,
    slug: release.slug,
    description: release.description,
    streamingLinks,
    coverImageUrl: release.coverImageUrl,
    coverImageAlt: release.coverImageAlt,
    coverCloudinaryPublicId: release.coverCloudinaryPublicId,
    audioUrl: release.audioUrl,
    audioCloudinaryPublicId: release.audioCloudinaryPublicId,
    releaseDate: release.releaseDate ? release.releaseDate.toISOString() : null,
    releaseTime: release.releaseTime,
    timeZone: release.timeZone,
    comingSoon: release.comingSoon,
    genre: release.genre,
    duration: release.duration,
    credits: release.credits,
    metaTitle: release.metaTitle,
    metaDescription: release.metaDescription,
  };
}

export type VideoContent = {
  id: string;
  title: string;
  description?: string | null;
  videoUrl: string;
  externalId: string;
  thumbnailUrl?: string | null;
  videoCloudinaryPublicId?: string | null;
  thumbnailCloudinaryPublicId?: string | null;
};

export async function getVideos(): Promise<VideoContent[]> {
  const videos = await prisma.video.findMany({
    orderBy: [{ createdAt: "desc" }],
  });

  return videos.map((video) => ({
    id: video.id,
    title: video.title,
    description: video.description,
    videoUrl: video.videoUrl,
    externalId: video.externalId,
    thumbnailUrl: video.thumbnailUrl,
    videoCloudinaryPublicId: video.videoCloudinaryPublicId,
    thumbnailCloudinaryPublicId: video.thumbnailCloudinaryPublicId,
  }));
}

export type AboutContentEntry = {
  aboutText: string;
  markdown?: string | null;
  missionStatement?: string | null;
  featuredQuote?: string | null;
  quoteAttribution?: string | null;
  artistPhotoUrl?: string | null;
  artistPhotoAlt?: string | null;
  artistPhotoCloudinaryPublicId?: string | null;
};

export async function getAboutContent(): Promise<AboutContentEntry | null> {
  const about = await prisma.aboutContent.findFirst({
    orderBy: { updatedAt: "desc" },
  });

  if (!about) return null;

  return {
    aboutText: about.aboutText,
    markdown: about.markdown,
    missionStatement: about.missionStatement,
    featuredQuote: about.featuredQuote,
    quoteAttribution: about.quoteAttribution,
    artistPhotoUrl: about.artistPhotoUrl,
    artistPhotoAlt: about.artistPhotoAlt,
    artistPhotoCloudinaryPublicId: about.artistPhotoCloudinaryPublicId,
  };
}

export type ContactContentEntry = {
  emailContact: string;
  bookingEmail?: string | null;
  socialLinks: Array<{ id: string; label: string; url: string }>;
  managementContact?: string | null;
  pressContact?: string | null;
};

export async function getContactContent(): Promise<ContactContentEntry | null> {
  const contact = await prisma.contactProfile.findFirst({
    orderBy: { updatedAt: "desc" },
  });

  if (!contact) return null;

  const rawLinks = (contact.socialLinks ?? []) as unknown;
  const socialLinks = Array.isArray(rawLinks)
    ? rawLinks
        .map((entry, index) => {
          if (!entry || typeof entry !== "object") return null;
          const { id, label, url } = entry as {
            id?: unknown;
            label?: unknown;
            url?: unknown;
          };
          if (typeof label !== "string" || typeof url !== "string") return null;
          return {
            id: typeof id === "string" ? id : `${contact.id}-link-${index}`,
            label,
            url,
          };
        })
        .filter((entry): entry is { id: string; label: string; url: string } => Boolean(entry))
    : [];

  return {
    emailContact: contact.emailContact,
    bookingEmail: contact.bookingEmail,
    socialLinks,
    managementContact: contact.managementContact,
    pressContact: contact.pressContact,
  };
}
