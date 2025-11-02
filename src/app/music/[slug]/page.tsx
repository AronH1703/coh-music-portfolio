import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { musicReleases } from "../../../data/music";
import s from "./page.module.css";

const dateFormatter = new Intl.DateTimeFormat("en", {
  month: "long",
  day: "numeric",
  year: "numeric",
});

type PageParams = {
  slug: string;
};

type PageProps = {
  params: Promise<PageParams>;
};

export function generateStaticParams() {
  return musicReleases.map(({ slug }) => ({ slug }));
}

export const revalidate = 0;
export const dynamicParams = true;

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug: rawSlug } = await params;
  const slug = decodeURIComponent(rawSlug);
  const release = musicReleases.find((item) => item.slug === slug);
  if (!release) {
    return {};
  }

  const { title, blurb, coverImage } = release;
  return {
    title: `${title} · Creature of Habit`,
    description: blurb,
    openGraph: {
      title: `${title} · Creature of Habit`,
      description: blurb,
      images: [
        {
          url: coverImage.src,
          width: coverImage.width,
          height: coverImage.height,
          alt: coverImage.alt,
        },
      ],
    },
  };
}

export default async function MusicReleasePage({ params }: PageProps) {
  const { slug: rawSlug } = await params;
  const slug = decodeURIComponent(rawSlug);
  const release =
    musicReleases.find((item) => item.slug === slug) ?? notFound();

  const isComingSoon = release.status === "coming-soon";
  const formattedDate = release.releaseDate
    ? dateFormatter.format(new Date(release.releaseDate))
    : undefined;

  return (
    <main className={s.page}>
      <div className={s.backRow}>
        <Link href="/" className={s.backLink}>
          {"<"} Back to main site
        </Link>
        {isComingSoon && (
          <span className={s.badge} aria-label="Coming soon">
            Coming soon
          </span>
        )}
      </div>
      <section className={s.hero}>
        <div className={s.cover}>
          <Image
            src={release.coverImage.src}
            alt={release.coverImage.alt}
            width={release.coverImage.width}
            height={release.coverImage.height}
            className={s.coverImage}
            priority
          />
        </div>
        <div className={s.summary}>
          <span className={s.eyebrow}>Music release</span>
          <h1 className={s.title}>{release.title}</h1>
          <p className={s.blurb}>{release.blurb}</p>
          <div className={s.meta}>
            <span className={s.metaItem}>
              {formattedDate ? `Released ${formattedDate}` : "Release date TBA"}
            </span>
            {release.comingSoonNote && (
              <span className={s.metaItem}>{release.comingSoonNote}</span>
            )}
          </div>
          <p className={s.description}>{release.description}</p>
          {release.streamingLinks.length > 0 ? (
            <div className={s.linkGrid}>
              {release.streamingLinks.map((link) => (
                <a
                  key={link.platform}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={s.linkButton}
                >
                  <span>{link.label ?? link.platform}</span>
                </a>
              ))}
            </div>
          ) : (
            <div className={s.placeholder}>
              <p>Streaming links will appear here soon.</p>
            </div>
          )}
        </div>
      </section>
      {release.credits && release.credits.length > 0 && (
        <section className={s.creditsSection}>
          <h2 className={s.creditsHeading}>Credits</h2>
          <ul className={s.creditList}>
            {release.credits.map((credit) => (
              <li key={credit} className={s.creditItem}>
                {credit}
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
