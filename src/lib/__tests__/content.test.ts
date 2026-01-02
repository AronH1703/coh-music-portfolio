import { describe, it, expect, beforeEach, vi } from "vitest";

type PrismaMock = {
  siteLabels: { findFirst: ReturnType<typeof vi.fn> };
  galleryItem: { findMany: ReturnType<typeof vi.fn> };
  musicRelease: { findMany: ReturnType<typeof vi.fn>; findUnique: ReturnType<typeof vi.fn> };
  contactProfile: { findFirst: ReturnType<typeof vi.fn> };
};

const mockPrisma: PrismaMock = {
  siteLabels: { findFirst: vi.fn() },
  galleryItem: { findMany: vi.fn() },
  musicRelease: { findMany: vi.fn(), findUnique: vi.fn() },
  contactProfile: { findFirst: vi.fn() },
};

vi.mock("@/lib/prisma", () => ({ prisma: mockPrisma }));

const importContent = () => import("../content");

const resetPrismaMocks = () => {
  mockPrisma.siteLabels.findFirst.mockReset();
  mockPrisma.galleryItem.findMany.mockReset();
  mockPrisma.musicRelease.findMany.mockReset();
  mockPrisma.musicRelease.findUnique.mockReset();
  mockPrisma.contactProfile.findFirst.mockReset();

  mockPrisma.siteLabels.findFirst.mockResolvedValue(null);
  mockPrisma.galleryItem.findMany.mockResolvedValue([]);
  mockPrisma.musicRelease.findMany.mockResolvedValue([]);
  mockPrisma.musicRelease.findUnique.mockResolvedValue(null);
  mockPrisma.contactProfile.findFirst.mockResolvedValue(null);
};

beforeEach(() => {
  resetPrismaMocks();
});

describe("getSiteLabels", () => {
  it("returns safe defaults when data is missing", async () => {
    mockPrisma.siteLabels.findFirst.mockResolvedValueOnce(null);
    const { getSiteLabels } = await importContent();

    const result = await getSiteLabels();

    expect(result).toEqual({
      heroLabel: "Composer • Producer • Multi-Instrumentalist",
      musicLabel: "Music",
      musicHeading: "Music",
      galleryLabel: "Gallery",
      galleryHeading: "Gallery",
      videosLabel: "Videos",
      videosHeading: "Videos",
      aboutLabel: "About",
      aboutHeading: "About",
      contactLabel: "Contact",
      contactHeading: "Contact",
    });
  });

  it("prefers explicit headings and labels when provided", async () => {
    mockPrisma.siteLabels.findFirst.mockResolvedValueOnce({
      heroLabel: "Composer in Residence",
      musicLabel: "Sound Library",
      musicHeading: "Featured Works",
      galleryLabel: "Visuals",
      contactLabel: "Reach out",
    });

    const { getSiteLabels } = await importContent();
    const result = await getSiteLabels();

    expect(result.heroLabel).toBe("Composer in Residence");
    expect(result.musicLabel).toBe("Sound Library");
    expect(result.musicHeading).toBe("Featured Works");
    expect(result.galleryLabel).toBe("Visuals");
    expect(result.galleryHeading).toBe("Visuals");
    expect(result.contactLabel).toBe("Reach out");
    expect(result.contactHeading).toBe("Reach out");
  });

  it("handles undefined optional fields without throwing", async () => {
    mockPrisma.siteLabels.findFirst.mockResolvedValueOnce({
      heroLabel: undefined,
      musicLabel: undefined,
      musicHeading: undefined,
    });

    const { getSiteLabels } = await importContent();
    const result = await getSiteLabels();

    expect(result.heroLabel).toBe("Composer • Producer • Multi-Instrumentalist");
    expect(result.musicLabel).toBe("Music");
    expect(result.musicHeading).toBe("Music");
  });
});

describe("getGalleryItems", () => {
  it("filters out records missing required identifiers or image data", async () => {
    mockPrisma.galleryItem.findMany.mockResolvedValueOnce([
      {
        id: "gallery-1",
        title: "Studio session",
        caption: "Live take",
        imageUrl: "https://example.com/image.jpg",
        altText: "Studio shot",
        category: "studio",
        tags: ["studio", 42, null],
        width: 1600,
        height: 900,
      },
      {
        id: "gallery-2",
        title: "Missing image",
        imageUrl: "",
        tags: ["bad"],
      },
      {
        id: null,
        title: "No id",
        imageUrl: "https://example.com/another.jpg",
      },
    ]);

    const { getGalleryItems } = await importContent();
    const items = await getGalleryItems();

    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({
      id: "gallery-1",
      imageUrl: "https://example.com/image.jpg",
      tags: ["studio"],
    });
  });

  it("requests gallery items with the expected ordering", async () => {
    mockPrisma.galleryItem.findMany.mockResolvedValueOnce([]);

    const { getGalleryItems } = await importContent();
    await getGalleryItems();

    expect(mockPrisma.galleryItem.findMany).toHaveBeenCalledWith({
      orderBy: [{ sortOrder: "asc" }, { uploadedAt: "desc" }],
    });
  });

  it("returns an empty array gracefully when nothing is stored", async () => {
    mockPrisma.galleryItem.findMany.mockResolvedValueOnce([]);

    const { getGalleryItems } = await importContent();
    const items = await getGalleryItems();

    expect(items).toEqual([]);
  });

  it("tolerates missing optional fields and still returns sanitized tags", async () => {
    mockPrisma.galleryItem.findMany.mockResolvedValueOnce([
      {
        id: "gallery-3",
        title: null,
        caption: null,
        imageUrl: "https://example.com/ok.jpg",
        altText: undefined,
        category: undefined,
        tags: { set: ["portrait", 99, null] },
        width: null,
        height: null,
      },
    ]);

    const { getGalleryItems } = await importContent();
    const [item] = await getGalleryItems();

    expect(item.tags).toEqual(["portrait"]);
  });
});

describe("getMusicReleaseBySlug streaming link parsing", () => {
  it("returns only well-formed streaming link entries", async () => {
    mockPrisma.musicRelease.findUnique.mockResolvedValueOnce({
      id: "rel-1",
      title: "Debut",
      slug: "debut",
      streamingLinks: [
        { label: "Spotify", url: " https://open.spotify.com/album/123 " },
        { label: "Apple Music", url: "" },
        { label: "", url: "https://bandcamp.com" },
        null,
        { label: 42, url: "https://example.com" },
      ],
      tracklist: [],
      credits: null,
      releaseDate: null,
      releaseAt: null,
      comingSoon: false,
      summary: null,
      description: null,
      coverImageUrl: null,
      coverImageAlt: null,
    });

    const { getMusicReleaseBySlug } = await importContent();
    const result = await getMusicReleaseBySlug("debut");

    expect(mockPrisma.musicRelease.findUnique).toHaveBeenCalled();
    expect(result?.streamingLinks).toHaveLength(1);
    expect(result?.streamingLinks[0]).toMatchObject({
      label: "Spotify",
      url: "https://open.spotify.com/album/123",
    });
    expect(typeof result?.streamingLinks[0].label).toBe("string");
    expect(typeof result?.streamingLinks[0].url).toBe("string");
  });

  it("returns an empty list when streaming data is missing or malformed", async () => {
    mockPrisma.musicRelease.findUnique.mockResolvedValueOnce({
      id: "rel-2",
      title: "No Streams",
      slug: "no-streams",
      streamingLinks: undefined,
      tracklist: [],
      credits: null,
      releaseDate: null,
      releaseAt: null,
      comingSoon: false,
      summary: null,
      description: null,
      coverImageUrl: null,
      coverImageAlt: null,
    });

    const { getMusicReleaseBySlug } = await importContent();
    const result = await getMusicReleaseBySlug("no-streams");

    expect(result?.streamingLinks).toEqual([]);
  });
});

describe("getContactContent", () => {
  it("returns null when no profile exists", async () => {
    mockPrisma.contactProfile.findFirst.mockResolvedValueOnce(null);

    const { getContactContent } = await importContent();
    const result = await getContactContent();

    expect(result).toBeNull();
  });

  it("hydrates only valid contact entries and applies fallback ids", async () => {
    mockPrisma.contactProfile.findFirst.mockResolvedValueOnce({
      id: "contact-1",
      emailContacts: [
        { id: "email-1", label: "Bookings", email: "book@example.com" },
        { label: "No email", email: "" },
        { label: "", email: "bad@example.com" },
      ],
      socialLinks: [
        { label: "Instagram", url: "https://instagram.com/example" },
        { id: "link-2", label: "Site", url: "" },
        { label: "", url: "https://invalid" },
      ],
    });

    const { getContactContent } = await importContent();
    const result = await getContactContent();

    expect(result?.emailContacts).toEqual([
      {
        id: "email-1",
        label: "Bookings",
        email: "book@example.com",
      },
    ]);
    expect(result?.socialLinks).toEqual([
      {
        id: "contact-1-link-0",
        label: "Instagram",
        url: "https://instagram.com/example",
      },
    ]);
  });

  it("never throws when nested fields are missing", async () => {
    mockPrisma.contactProfile.findFirst.mockResolvedValueOnce({
      id: "contact-2",
      emailContacts: null,
      socialLinks: [{ foo: "bar" }],
    });

    const { getContactContent } = await importContent();
    const result = await getContactContent();

    expect(result).toEqual({
      emailContacts: [],
      socialLinks: [],
    });
  });
});
