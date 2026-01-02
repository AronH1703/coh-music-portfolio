import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, within, waitFor } from "@testing-library/react";
import PhotoCarousel, { type GalleryPhoto } from "../photo-carousel";

type NextImageMockProps = {
  alt?: string;
  src: string;
  fill?: boolean;
  priority?: boolean;
  quality?: number;
  placeholder?: string;
  blurDataURL?: string;
  loader?: unknown;
  unoptimized?: boolean;
  onLoadingComplete?: unknown;
  [key: string]: unknown;
};

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

const createEmblaMock = () => ({
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
  scrollSnapList: vi.fn(() => [0, 1]),
  selectedScrollSnap: vi.fn(() => 0),
  scrollTo: vi.fn(),
  reInit: vi.fn(),
});

const emblaMainMock = createEmblaMock();
const emblaLightboxMock = createEmblaMock();
let emblaCallIndex = 0;

vi.mock("embla-carousel-react", () => ({
  default: () => {
    const api = emblaCallIndex % 2 === 0 ? emblaMainMock : emblaLightboxMock;
    emblaCallIndex += 1;
    return [vi.fn(), api] as const;
  },
}));

beforeEach(() => {
  vi.clearAllMocks();
  emblaCallIndex = 0;
  vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => {
    cb(0);
    return 0;
  });
  vi.stubGlobal("cancelAnimationFrame", () => {});
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("PhotoCarousel (component integration)", () => {
  it("renders an empty state when no photos are provided", () => {
    render(<PhotoCarousel photos={[]} />);

    expect(screen.getByRole("status")).toHaveTextContent(
      /gallery items will appear here once uploaded via the admin/i,
    );
  });

  it("filters out photos without a src", () => {
    const photos: GalleryPhoto[] = [
      { id: "p1", src: "/one.jpg", alt: "One", title: null, caption: null, location: null },
      { id: "p2", src: "", alt: "Two", title: "Missing", caption: null, location: null },
    ];

    render(<PhotoCarousel photos={photos} />);

    expect(screen.getByRole("button", { name: /view photo 1/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /view missing/i })).toBeNull();
  });

  it("opens the lightbox and shows caption data, then closes", () => {
    const photos: GalleryPhoto[] = [
      {
        id: "p1",
        src: "/one.jpg",
        alt: "One",
        title: "Live Set",
        caption: "Studio session",
        location: "Stockholm",
      },
    ];

    render(<PhotoCarousel photos={photos} />);

    expect(screen.queryByRole("button", { name: /close image viewer/i })).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: /view live set/i }));

    expect(screen.getByRole("button", { name: /close image viewer/i })).toBeInTheDocument();
    const dialog = screen.getByRole("dialog", { name: /full-size image viewer/i });
    const lightbox = within(dialog);
    expect(lightbox.getByText("Live Set")).toBeInTheDocument();
    expect(lightbox.getByText("Studio session")).toBeInTheDocument();
    expect(lightbox.getByText("Stockholm")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /close image viewer/i }));
    expect(screen.queryByRole("button", { name: /close image viewer/i })).toBeNull();
  });

  it("wires carousel navigation to the embla APIs", async () => {
    const photos: GalleryPhoto[] = [
      { id: "p1", src: "/one.jpg", alt: "One", title: "First", caption: null, location: null },
      { id: "p2", src: "/two.jpg", alt: "Two", title: "Second", caption: null, location: null },
    ];

    render(<PhotoCarousel photos={photos} />);

    const nextSlide = screen.getByRole("button", { name: /next slide/i });
    const prevSlide = screen.getByRole("button", { name: /previous slide/i });

    await waitFor(() => expect(nextSlide).toBeEnabled());
    await waitFor(() => expect(prevSlide).toBeEnabled());

    fireEvent.click(nextSlide);
    fireEvent.click(prevSlide);

    expect(emblaMainMock.scrollNext).toHaveBeenCalled();
    expect(emblaMainMock.scrollPrev).toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: /view first/i }));

    const dialog = screen.getByRole("dialog", { name: /full-size image viewer/i });
    const lightbox = within(dialog);
    const nextImage = lightbox.getByRole("button", { name: /next image/i });
    const prevImage = lightbox.getByRole("button", { name: /previous image/i });

    await waitFor(() => expect(nextImage).toBeEnabled());
    await waitFor(() => expect(prevImage).toBeEnabled());

    fireEvent.click(nextImage);
    fireEvent.click(prevImage);

    expect(emblaLightboxMock.scrollNext).toHaveBeenCalled();
    expect(emblaLightboxMock.scrollPrev).toHaveBeenCalled();
  });
});
