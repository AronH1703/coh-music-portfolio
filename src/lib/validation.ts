import { z } from "zod";

const urlSchema = z.string().url();
const optionalUrl = urlSchema
  .nullish()
  .or(z.literal(""))
  .transform((val) => (val ? val : undefined));

const labeledLinkSchema = z.object({
  id: z.string().trim().min(1).max(64).optional(),
  label: z.string().trim().min(2).max(60),
  url: urlSchema,
});

export const heroSchema = z
  .object({
    title: z.string().trim().min(10).max(140),
    subtitle: z.string().trim().min(20).max(280),
    backgroundColor: z.string().trim().max(40).optional(),
    titleColor: z.string().trim().max(40).optional(),
    subtitleColor: z.string().trim().max(40).optional(),
    eyebrowColor: z.string().trim().max(40).optional(),
    titleFont: z.string().trim().max(120).optional(),
    subtitleFont: z.string().trim().max(120).optional(),
    primaryCtaLabel: z.string().trim().max(80).optional(),
    primaryCtaHref: optionalUrl,
    secondaryCtaLabel: z.string().trim().max(80).optional(),
    secondaryCtaHref: optionalUrl,
    metaTitle: z.string().trim().max(70).optional(),
    metaDescription: z.string().trim().max(300).optional(),
  });

export const galleryItemSchema = z.object({
  title: z.string().trim().min(2).max(120),
  caption: z.string().trim().max(400).optional(),
  altText: z.string().trim().max(160).optional(),
  category: z.string().trim().max(80).optional(),
  tags: z.array(z.string().trim().min(1).max(40)).optional(),
  sortOrder: z.number().int().min(0).optional(),
});

export const musicReleaseSchema = z
  .object({
    title: z.string().trim().min(2).max(160),
    slug: z
      .string()
      .trim()
      .min(2)
      .max(120)
      .regex(/^[a-z0-9-]+$/, "Slug can only contain lowercase letters, numbers, and hyphens."),
    description: z.string().trim().max(1000).optional(),
    streamingLinks: z.array(labeledLinkSchema).max(12).optional(),
    coverImageUrl: optionalUrl,
    coverImageAlt: z.string().trim().max(160).optional(),
    coverCloudinaryPublicId: z.string().trim().max(200).optional(),
    audioUrl: optionalUrl,
    audioCloudinaryPublicId: z.string().trim().max(200).optional(),
    releaseDate: z.string().trim().optional(),
    releaseTime: z.string().trim().optional(),
    timeZone: z.string().trim().optional(),
    comingSoon: z.boolean().optional(),
    genre: z.string().trim().max(80).optional(),
    duration: z.string().trim().max(40).optional(),
    credits: z.string().trim().max(1200).optional(),
    featured: z.boolean().optional(),
    metaTitle: z.string().trim().max(70).optional(),
    metaDescription: z.string().trim().max(300).optional(),
    sortOrder: z.number().int().min(0).optional(),
  })
  .refine(
    (data) => {
      if (!data.releaseDate && (data.releaseTime || data.timeZone)) {
        return false;
      }
      if (!data.comingSoon && !data.releaseDate) {
        return false;
      }
      return true;
    },
    {
      message:
        "Provide a release date when release time or timezone is set, or mark the release as coming soon.",
      path: ["releaseDate"],
    },
  );

export const videoSchema = z
  .object({
    title: z.string().trim().min(2).max(160),
    description: z.string().trim().max(500).optional(),
    videoUrl: urlSchema,
    videoCloudinaryPublicId: z.string().trim().max(200).optional(),
    thumbnailUrl: optionalUrl,
    thumbnailCloudinaryPublicId: z.string().trim().max(200).optional(),
    tags: z.array(z.string().trim().min(1).max(40)).optional(),
  });

export const aboutSchema = z.object({
  aboutText: z.string().trim().min(40),
  markdown: z.string().trim().optional(),
  missionStatement: z.string().trim().max(240).optional(),
  featuredQuote: z.string().trim().max(280).optional(),
  quoteAttribution: z.string().trim().max(120).optional(),
  artistPhotoUrl: optionalUrl,
  artistPhotoAlt: z.string().trim().max(160).optional(),
  artistPhotoCloudinaryPublicId: z.string().trim().max(200).optional(),
  seoTitle: z.string().trim().max(70).optional(),
  seoDescription: z.string().trim().max(300).optional(),
});

export const contactSchema = z.object({
  emailContact: z.string().email(),
  bookingEmail: z.string().email().optional(),
  socialLinks: z.array(labeledLinkSchema).max(20).optional(),
  managementContact: z.string().trim().max(200).optional(),
  pressContact: z.string().trim().max(200).optional(),
});

export const newsletterSubscriptionSchema = z.object({
  email: z.string().trim().email(),
  source: z.string().trim().max(120).optional(),
});

export const siteLabelsSchema = z.object({
  heroLabel: z.string().trim().max(120).optional(),
  musicLabel: z.string().trim().max(80).optional(),
  galleryLabel: z.string().trim().max(80).optional(),
  videosLabel: z.string().trim().max(80).optional(),
  aboutLabel: z.string().trim().max(80).optional(),
  contactLabel: z.string().trim().max(80).optional(),
});
