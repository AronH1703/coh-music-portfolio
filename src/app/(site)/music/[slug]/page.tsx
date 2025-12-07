import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getMusicReleaseBySlug,
  getMusicReleases,
  type MusicReleaseDetail,
} from "@/lib/content";
import s from "./page.module.css";

const dateFormatter = new Intl.DateTimeFormat("en", {
  month: "long",
  day: "numeric",
  year: "numeric",
});

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  const releases = await getMusicReleases();
  return releases.map(({ slug }) => ({ slug }));
}

export const revalidate = 0;
export const dynamicParams = true;

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const decodedSlug = decodeURIComponent(slug);
  const release = await getMusicReleaseBySlug(decodedSlug);
  if (!release) return {};

  const title = release.metaTitle ?? `${release.title} · Creature of Habit`;
  const description =
    release.metaDescription ??
    release.description ??
    "New release from Creature of Habit.";

  const images = release.coverImageUrl
    ? [
        {
          url: release.coverImageUrl,
          width: 1200,
          height: 1200,
          alt: release.coverImageAlt ?? release.title,
        },
      ]
    : undefined;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images,
    },
  };
}

export default async function MusicReleasePage({ params }: PageProps) {
  const { slug } = await params;
  const decodedSlug = decodeURIComponent(slug);
  const release = await getMusicReleaseBySlug(decodedSlug);

  if (!release) {
    notFound();
  }

  return <ReleaseContent release={release} />;
}

function ReleaseContent({ release }: { release: MusicReleaseDetail }) {
  const {
    title,
    description,
    streamingLinks,
    coverImageUrl,
    coverImageAlt,
    audioUrl,
    releaseDate,
    releaseAt,
    comingSoon,
    genre,
    duration,
    credits,
  } = release;

  const formattedDate = releaseDate ? dateFormatter.format(new Date(releaseDate)) : null;
  const creditLines = credits
    ? credits
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean)
    : [];
  const parsedReleaseDate = releaseDate ? Date.parse(releaseDate) : Number.NaN;
  const releaseDateIsValid = !Number.isNaN(parsedReleaseDate);
  const parsedReleaseAt = releaseAt ? Date.parse(releaseAt) : Number.NaN;
  const releaseAtIsValid = !Number.isNaN(parsedReleaseAt);
  const releaseMoment = releaseAtIsValid
    ? parsedReleaseAt
    : releaseDateIsValid
      ? parsedReleaseDate
      : Number.NaN;
  const releaseMomentIsValid = !Number.isNaN(releaseMoment);
  const showComingSoon =
    comingSoon && (!releaseMomentIsValid || releaseMoment > Date.now());

  return (
    <main className={`section ${s.page}`}>
      <div className={s.backRow}>
        <Link href="/" className={s.backLink}>
          {"<"} Back to main site
        </Link>
        {showComingSoon && (
          <span className={s.badge} aria-label="Coming soon">
            Coming soon
          </span>
        )}
      </div>

      <section className={`section ${s.hero} ${s.releaseHero}`}>
        <div className={s.cover}>
          {coverImageUrl ? (
            <Image
              src={coverImageUrl}
              alt={coverImageAlt ?? `${title} cover art`}
              width={1200}
              height={1200}
              className={s.coverImage}
              priority
            />
          ) : (
            <div className={s.coverPlaceholder}>Artwork coming soon</div>
          )}
        </div>
        <div className={s.summary}>
          <span className={s.eyebrow}>Music release</span>
          <h1 className={s.title}>{title}</h1>
          <div className={s.meta}>
            <span className={s.metaItem}>
              {formattedDate ? `Released ${formattedDate}` : "Release date TBA"}
            </span>
            {genre && <span className={s.metaItem}>{genre}</span>}
            {duration && <span className={s.metaItem}>{duration}</span>}
          </div>
          {description && <p className={s.description}>{description}</p>}

          {streamingLinks.length ? (
            <div className={s.linkGrid}>
              {streamingLinks.map((link) => (
                <a
                  key={link.id}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={s.linkButton}
                >
                  <span>{link.label}</span>
                </a>
              ))}
            </div>
          ) : (
            <div className={s.placeholder}>
              <p>Streaming link will appear here once published.</p>
            </div>
          )}

          {audioUrl && (
            <div className={s.audioPreview}>
              <audio controls preload="none" src={audioUrl}>
                Your browser does not support the audio element.
              </audio>
            </div>
          )}
        </div>
      </section>

      {creditLines.length > 0 && (
        <section className={`section ${s.creditsSection}`}>
          <div className={s.creditsCard}>
            <h2 className={s.creditsHeading}>Credits</h2>
            <ul className={s.creditList}>
              {creditLines.map((credit) => (
                <li key={credit} className={s.creditItem}>
                  {credit}
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}
    </main>
  );
}
