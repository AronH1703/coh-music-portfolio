import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import VideoCarousel, { type VideoCarouselItem } from "../video-carousel";

// Minimal props shape we need for the next/image mock in these tests
type NextImageMockProps = {
  alt?: string;
  src: string;
  // next/image-only props (we ignore them)
  fill?: boolean;
  priority?: boolean;
  quality?: number;
  placeholder?: string;
  blurDataURL?: string;
  loader?: unknown;
  unoptimized?: boolean;
  onLoadingComplete?: unknown;
  // allow any other attributes like className, sizes, etc.
  [key: string]: unknown;
};

// Mock next/image to a plain img for tests
vi.mock("next/image", () => ({
  default: (props: NextImageMockProps) => {
    const {
      alt,
      src,
      fill,
      priority,
      quality,
      placeholder,
      blurDataURL,
      loader,
      unoptimized,
      onLoadingComplete,
      ...rest
    } = props;

    return <img alt={alt ?? ""} src={src} {...(rest as Record<string, unknown>)} />;
  },
}));

// Mock embla hook so the component can render without the real carousel
const emblaApiMock = {
  scrollPrev: vi.fn(),
  scrollNext: vi.fn(),
  canScrollPrev: vi.fn(() => true),
  canScrollNext: vi.fn(() => true),
  on: vi.fn(function (this: unknown) {
    return this;
  }),
  off: vi.fn(function (this: unknown) {
    return this;
  }),
};

vi.mock("embla-carousel-react", () => ({
  default: () => {
    // [viewportRef, emblaApi]
    return [vi.fn(), emblaApiMock] as const;
  },
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe("VideoCarousel (integration wiring)", () => {
  it("filters out videos missing externalId", () => {
    const videos: VideoCarouselItem[] = [
      {
        id: "v1",
        externalId: "abc",
        videoUrl: "https://youtube.com/watch?v=abc",
        title: "One",
        description: null,
        thumbnailUrl: null,
      },
      {
        id: "v2",
        externalId: "",
        videoUrl: "https://youtube.com/watch?v=def",
        title: "Should be filtered",
        description: null,
        thumbnailUrl: null,
      },
    ];

    render(<VideoCarousel videos={videos} />);

    expect(screen.getByRole("button", { name: /play video one/i })).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /play video should be filtered/i }),
    ).toBeNull();
  });

  it("uses fallback title and YouTube thumbnail when optional fields are missing", () => {
    const videos: VideoCarouselItem[] = [
      {
        id: "v1",
        externalId: "xyz",
        videoUrl: "https://youtube.com/watch?v=xyz",
        title: null,
        description: null,
        thumbnailUrl: null,
      },
    ];

    render(<VideoCarousel videos={videos} />);

    // Title fallback: "Video 1"
    expect(screen.getByText("Video 1")).toBeInTheDocument();

    // Thumbnail fallback: https://img.youtube.com/vi/{id}/hqdefault.jpg
    const img = screen.getByRole("img", { name: "Video 1" }) as HTMLImageElement;
    expect(img.src).toContain("https://img.youtube.com/vi/xyz/hqdefault.jpg");
  });

  it("opens lightbox on click and renders the iframe, then closes on overlay click", () => {
    const videos: VideoCarouselItem[] = [
      { id: "v1", externalId: "abc", videoUrl: "x", title: "A", description: null, thumbnailUrl: null },
    ];

    const { container } = render(<VideoCarousel videos={videos} />);

    fireEvent.click(screen.getByRole("button", { name: /play video a/i }));

    const iframe = container.querySelector("iframe") as HTMLIFrameElement | null;
    expect(iframe).not.toBeNull();
    expect(iframe?.src).toContain("https://www.youtube.com/embed/abc");

    // Click the overlay (dialog) to close
    fireEvent.click(screen.getByRole("dialog", { name: /video viewer/i }));
    expect(container.querySelector("iframe")).toBeNull();
  });

  it("advances videos in lightbox using next/prev buttons", () => {
    const videos: VideoCarouselItem[] = [
      { id: "v1", externalId: "a1", videoUrl: "x", title: "First", description: null, thumbnailUrl: null },
      { id: "v2", externalId: "b2", videoUrl: "x", title: "Second", description: null, thumbnailUrl: null },
    ];

    const { container } = render(<VideoCarousel videos={videos} />);

    fireEvent.click(screen.getByRole("button", { name: /play video first/i }));
    expect((container.querySelector("iframe") as HTMLIFrameElement).src).toContain("/a1");

    const dialog = screen.getByRole("dialog", { name: /video viewer/i });
    const lightbox = within(dialog);

    const nextButtons = lightbox.getAllByRole("button", { name: /next video/i });
    const prevButtons = lightbox.getAllByRole("button", { name: /previous video/i });

    // Click the first set (player nav). Either index is fine; just be consistent.
    fireEvent.click(nextButtons[0]);
    expect((container.querySelector("iframe") as HTMLIFrameElement).src).toContain("/b2");

    fireEvent.click(prevButtons[0]);
    expect((container.querySelector("iframe") as HTMLIFrameElement).src).toContain("/a1");
  });
});
