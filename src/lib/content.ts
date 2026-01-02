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
  musicHeading?: string | null;
  galleryLabel?: string | null;
  galleryHeading?: string | null;
  videosLabel?: string | null;
  videosHeading?: string | null;
  aboutLabel?: string | null;
  aboutHeading?: string | null;
  contactLabel?: string | null;
  contactHeading?: string | null;
};

type SiteLabelsRecord = SiteLabels & { updatedAt?: Date | null };

type PrismaWithSiteLabels = typeof prisma & {
  siteLabels?: {
    findFirst: (args: { orderBy: { updatedAt: "desc" } }) => Promise<SiteLabelsRecord | null>;
  };
};

export async function getSiteLabels(): Promise<SiteLabels> {
  const prismaWithSiteLabels = prisma as PrismaWithSiteLabels;
  const model = prismaWithSiteLabels.siteLabels;
  const labels =
    model && typeof model.findFirst === "function"
      ? await model.findFirst({ orderBy: { updatedAt: "desc" } })
      : null;

  return {
    heroLabel: labels?.heroLabel ?? 'Composer • Producer • Multi-Instrumentalist',
    musicLabel: labels?.musicLabel ?? "Music",
    musicHeading: labels?.musicHeading ?? labels?.musicLabel ?? "Music",
    galleryLabel: labels?.galleryLabel ?? "Gallery",
    galleryHeading: labels?.galleryHeading ?? labels?.galleryLabel ?? "Gallery",
    videosLabel: labels?.videosLabel ?? "Videos",
    videosHeading: labels?.videosHeading ?? labels?.videosLabel ?? "Videos",
    aboutLabel: labels?.aboutLabel ?? "About",
    aboutHeading: labels?.aboutHeading ?? labels?.aboutLabel ?? "About",
    contactLabel: labels?.contactLabel ?? "Contact",
    contactHeading: labels?.contactHeading ?? labels?.contactLabel ?? "Contact",
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

const toNonEmptyString = (value: unknown): string | null => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
};

function extractGalleryTags(raw: unknown): string[] {
  const sanitize = (values: unknown[]) =>
    values
      .map(toNonEmptyString)
      .filter((tag): tag is string => Boolean(tag));

  if (Array.isArray(raw)) {
    return sanitize(raw);
  }
  if (raw && typeof raw === "object") {
    const possibleSet = (raw as { set?: unknown }).set;
    if (Array.isArray(possibleSet)) {
      return sanitize(possibleSet);
    }
  }
  return [];
}

export async function getGalleryItems(): Promise<GalleryItemContent[]> {
  const items = await prisma.galleryItem.findMany({
    orderBy: [{ sortOrder: "asc" }, { uploadedAt: "desc" }],
  });

  return items
    .filter((item) => {
      const id = toNonEmptyString((item as { id?: unknown }).id);
      const imageUrl = toNonEmptyString((item as { imageUrl?: unknown }).imageUrl);
      return Boolean(id && imageUrl);
    })
    .map((item) => {
      const id = toNonEmptyString(item.id) ?? "";
      const imageUrl = toNonEmptyString(item.imageUrl) ?? "";
      const title = toNonEmptyString(item.title) ?? "";
      const caption = toNonEmptyString(item.caption);
      const altText = toNonEmptyString(item.altText);
      const category = toNonEmptyString(item.category);
      const tags = extractGalleryTags(item.tags as unknown);
      const width = typeof item.width === "number" ? item.width : null;
      const height = typeof item.height === "number" ? item.height : null;

      return {
        id,
        title,
        caption: caption ?? null,
        imageUrl,
        altText: altText ?? null,
        category: category ?? null,
        tags,
        width,
        height,
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
  releaseAt?: string | null;
  comingSoon: boolean;
};

export async function getMusicReleases(): Promise<MusicReleaseContent[]> {
  const releases = await prisma.musicRelease.findMany({
    orderBy: [
      { sortOrder: "asc" },
      { releaseAt: "desc" },
      { createdAt: "desc" },
    ],
  });

  return releases.map((release) => ({
    id: release.id,
    title: release.title,
    slug: release.slug,
    coverImageUrl: release.coverImageUrl,
    coverImageAlt: release.coverImageAlt,
    releaseDate: release.releaseDate ? release.releaseDate.toISOString() : null,
    releaseAt: release.releaseAt ? release.releaseAt.toISOString() : null,
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
  releaseAt?: string | null;
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
  const fallbackIdBase = toNonEmptyString(release.id) ?? slug;
  const streamingLinks = Array.isArray(streamingLinksRaw)
    ? streamingLinksRaw
        .map((entry, index) => {
          if (!entry || typeof entry !== "object") return null;
          const { id, label, url } = entry as {
            id?: unknown;
            label?: unknown;
            url?: unknown;
          };
          const labelStr = toNonEmptyString(label);
          const urlStr = toNonEmptyString(url);
          if (!labelStr || !urlStr) return null;
          const idStr = toNonEmptyString(id) ?? `${fallbackIdBase}-stream-${index}`;
          return {
            id: idStr,
            label: labelStr,
            url: urlStr,
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
    releaseAt: release.releaseAt ? release.releaseAt.toISOString() : null,
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
    orderBy: { createdAt: "desc" },
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
    artistPhotoUrl: about.artistPhotoUrl,
    artistPhotoAlt: about.artistPhotoAlt,
    artistPhotoCloudinaryPublicId: about.artistPhotoCloudinaryPublicId,
  };
}

export type ContactEmailEntry = {
  id: string;
  label: string;
  email: string;
};

export type ContactSocialLinkEntry = {
  id: string;
  label: string;
  url: string;
};

export type ContactContentEntry = {
  emailContacts: ContactEmailEntry[];
  socialLinks: ContactSocialLinkEntry[];
};

export async function getContactContent(): Promise<ContactContentEntry | null> {
  const contact = await prisma.contactProfile.findFirst({
    orderBy: { updatedAt: "desc" },
  });

  if (!contact) return null;

  const contactId = toNonEmptyString(contact.id) ?? "contact";
  const rawEmails = (contact.emailContacts ?? []) as unknown;
  const emailContacts = Array.isArray(rawEmails)
    ? rawEmails
        .map((entry, index) => {
          if (!entry || typeof entry !== "object") return null;
          const { id, label, email } = entry as {
            id?: unknown;
            label?: unknown;
            email?: unknown;
          };
          const labelStr = toNonEmptyString(label);
          const emailStr = toNonEmptyString(email);
          if (!labelStr || !emailStr) return null;
          const idStr = toNonEmptyString(id) ?? `${contactId}-email-${index}`;
          return {
            id: idStr,
            label: labelStr,
            email: emailStr,
          };
        })
        .filter((entry): entry is ContactEmailEntry => Boolean(entry))
    : [];

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
          const labelStr = toNonEmptyString(label);
          const urlStr = toNonEmptyString(url);
          if (!labelStr || !urlStr) return null;
          const idStr = toNonEmptyString(id) ?? `${contactId}-link-${index}`;
          return {
            id: idStr,
            label: labelStr,
            url: urlStr,
          };
        })
        .filter((entry): entry is ContactSocialLinkEntry => Boolean(entry))
    : [];

  return {
    emailContacts,
    socialLinks,
  };
}

export {
  getPressKitAssets,
  type PressKitAssetsRecord,
  type PressKitLinkEntry,
  type PressKitLinkMode,
} from "./press-kit";
