export type StreamingLink = {
  platform: string;
  url: string;
  label?: string;
};

export type MusicReleaseStatus = "released" | "coming-soon";

export type MusicRelease = {
  slug: string;
  title: string;
  status: MusicReleaseStatus;
  coverImage: {
    src: string;
    alt: string;
    width: number;
    height: number;
  };
  blurb: string;
  releaseDate?: string;
  description: string;
  streamingLinks: StreamingLink[];
  credits?: string[];
  comingSoonNote?: string;
};

export const musicReleases: MusicRelease[] = [
  {
    slug: "running",
    title: "Running",
    status: "released",
    coverImage: {
      src: "/RUNNING (BOLD_YELLOW).png",
      alt: "Running single artwork with bold yellow typography",
      width: 3000,
      height: 3000,
    },
    blurb: "Kinetic drums, pulsing synth bass, and a breathless hook built for motion.",
    releaseDate: "2023-09-15",
    description:
      "An adrenaline surge written for late night drives and choreography reels alike. \
Glitch percussion, brass stabs, and whispered vocals keep the tension tight before the drop opens into soaring pads.",
    streamingLinks: [
      {
        platform: "Spotify",
        url: "https://open.spotify.com/track/3UgbmpLVmi1n6oUbbhTi8a?si=545c5eec221b446f",
      },
      {
        platform: "Apple Music",
        url: "https://music.apple.com/is/album/f%C3%B6nix-single/1806564639",
      },
    ],
    credits: ["Written, produced & mixed by Creature of Habit", "Mastered by North Shore Audio Lab"],
  },
  {
    slug: "ep-three",
    title: "EP III",
    status: "released",
    coverImage: {
      src: "/EP 3 CLEAN COVER.png",
      alt: "Minimalist EP cover artwork with abstract lines",
      width: 3000,
      height: 3000,
    },
    blurb: "A cinematic three-part suite balancing string motifs with analog grit.",
    releaseDate: "2022-04-01",
    description:
      "This extended play explores memory through layered strings, downtempo breaks, \
and analog synth drones. Each movement flows into the next, inviting full-playthrough listening.",
    streamingLinks: [
      {
        platform: "Spotify",
        url: "https://open.spotify.com/track/4krgdvPJd5VaCqeVQ7pux3",
      },
      {
        platform: "Apple Music",
        url: "https://music.apple.com/us/album/child/1702521356?i=1702521361",
      },
      {
        platform: "Deezer",
        url: "https://www.deezer.com/track/476188905",
      },
      {
        platform: "TIDAL",
        url: "https://tidal.com/browse/track/310739997",
      },
      {
        platform: "Amazon Music",
        url: "https://music.amazon.com/albums/B0CFM5H6QG",
      },
      {
        platform: "YouTube Music",
        url: "https://music.youtube.com/watch?v=j5y1_QjBugA",
      },
      {
        platform: "SoundCloud",
        url: "https://soundcloud.com/aronhannes/child",
      },
    ],
    credits: [
      "Composed by Creature of Habit",
      "Cello by Ari F.",
      "Saxophone by Malik C.",
      "Mixed at The Habit Studio",
    ],
  },
  {
    slug: "late-bloom",
    title: "Late Bloom",
    status: "coming-soon",
    coverImage: {
      src: "/CoH_letter_texture.png",
      alt: "Red letter texture with Creature of Habit typography",
      width: 878,
      height: 237,
    },
    blurb: "Pastel synths and hushed vocals bloom into a widescreen finale.",
    releaseDate: undefined,
    description:
      "A slow-building anthem that leans into restraint before breaking open with lush pads and percussion. \
Expect a late summer release with guest vocal features.",
    streamingLinks: [
      {
        platform: "Spotify",
        url: "https://open.spotify.com/track/3UgbmpLVmi1n6oUbbhTi8a?si=545c5eec221b446f",
      },
      {
        platform: "Apple Music",
        url: "https://music.apple.com/is/album/f%C3%B6nix-single/1806564639",
      },
    ],
    comingSoonNote: "Mastering in progress — presave links arrive shortly.",
  },
  {
    slug: "floodgate",
    title: "Floodgate",
    status: "released",
    coverImage: {
      src: "/Screamarinn-min.png",
      alt: "Floodgate single artwork with vivid stage lighting",
      width: 1720,
      height: 1336,
    },
    blurb: "Percussive swells explode into a brass-heavy drop built for sync placements.",
    releaseDate: "2021-11-12",
    description:
      "An audio rush anchored by hybrid drums and chopped choir textures. Floodgate pairs cinematic horns with \
sub-bass growls, giving choreographers a flexible arc from tension to release.",
    streamingLinks: [
      {
        platform: "Spotify",
        url: "https://open.spotify.com/track/3UgbmpLVmi1n6oUbbhTi8a?si=545c5eec221b446f",
      },
      {
        platform: "Apple Music",
        url: "https://music.apple.com/is/album/f%C3%B6nix-single/1806564639",
      },
    ],
    credits: ["Produced by Creature of Habit", "Trumpet by Zoe L.", "Mixed by Neighborhood Audio"],
  },
  {
    slug: "neon-ember",
    title: "Neon Ember",
    status: "released",
    coverImage: {
      src: "/ryanAir.png",
      alt: "Neon Ember cover art collage with abstract flight imagery",
      width: 3600,
      height: 3600,
    },
    blurb: "Shimmering arpeggios drift over halftime drums in a nocturnal anthem.",
    releaseDate: "2020-05-22",
    description:
      "Neon Ember leans into ambient pads, processed guitar phrases, and a halftime groove that stays \
smoldering start to finish. Ideal for late-night promo reels and reflective montage scenes.",
    streamingLinks: [
      {
        platform: "Spotify",
        url: "https://open.spotify.com/track/3UgbmpLVmi1n6oUbbhTi8a?si=545c5eec221b446f",
      },
      {
        platform: "Apple Music",
        url: "https://music.apple.com/is/album/f%C3%B6nix-single/1806564639",
      },
    ],
    credits: ["Written & produced by Creature of Habit", "Guitars by Mads R."],
  },
  {
    slug: "paper-lanterns",
    title: "Paper Lanterns",
    status: "coming-soon",
    coverImage: {
      src: "/ryanAir_.png",
      alt: "Paper Lanterns cover art with layered red collage textures",
      width: 3600,
      height: 3600,
    },
    blurb: "Muted piano pulses bloom into an orchestral-electronic crescendo.",
    description:
      "A meditative opener that evolves into widescreen strings and fractured percussion. \
Paper Lanterns experiments with granular vocals and bowed metals to create a glowing finale.",
    streamingLinks: [
      {
        platform: "Spotify",
        url: "https://open.spotify.com/track/3UgbmpLVmi1n6oUbbhTi8a?si=545c5eec221b446f",
      },
      {
        platform: "Apple Music",
        url: "https://music.apple.com/is/album/f%C3%B6nix-single/1806564639",
      },
    ],
    comingSoonNote: "Final string recordings scheduled — pre-save link publishes with rollout.",
  },
  {
    slug: "crimson-haze-live",
    title: "Crimson Haze (Live)",
    status: "released",
    coverImage: {
      src: "/att.EFV6UYXnnVtjSnJq37oGVWM-lHOTO-e4aamj9Vdn9kk.JPG",
      alt: "Crimson Haze live session cover with artist framed by flowers",
      width: 2048,
      height: 1536,
    },
    blurb: "An intimate live recording with bowed vibraphone and atmospheric vocals.",
    releaseDate: "2019-08-09",
    description:
      "Captured in a single take, Crimson Haze (Live) layers looped vibraphone, analog tape delays, and \
breathy harmonies. The performance leans into space, letting each swell feel close and immediate.",
    streamingLinks: [
      {
        platform: "Spotify",
        url: "https://open.spotify.com/track/3UgbmpLVmi1n6oUbbhTi8a?si=545c5eec221b446f",
      },
      {
        platform: "Apple Music",
        url: "https://music.apple.com/is/album/f%C3%B6nix-single/1806564639",
      },
    ],
    credits: ["Performed by Creature of Habit", "Live mix by Amina K."],
  },
];
