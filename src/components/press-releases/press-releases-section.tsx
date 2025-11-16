"use client";

import clsx from "clsx";
import { useEffect, useMemo, useState } from "react";
import type { PressReleaseEntry } from "@/lib/content";
import styles from "./press-releases-section.module.css";

const BUILT_IN_CATEGORIES = ["Single", "EP/Album", "Announcement"];
const PAGE_SIZE_OPTIONS = [5, 10, 15];

type PressReleasesSectionProps = {
  releases: PressReleaseEntry[];
};

export function PressReleasesSection({ releases }: PressReleasesSectionProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [yearFilter, setYearFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE_OPTIONS[0]);
  const [activeRelease, setActiveRelease] = useState<PressReleaseEntry | null>(null);

  const normalizedSearch = searchTerm.trim().toLowerCase();

  const categories = useMemo(() => {
    const seen = new Set<string>();
    BUILT_IN_CATEGORIES.forEach((entry) => seen.add(entry));
    releases.forEach((release) => {
      const label = release.category?.trim();
      if (label) {
        seen.add(label);
      }
    });

    return Array.from(seen);
  }, [releases]);

  const years = useMemo(() => {
    const seen = new Set<string>();
    releases.forEach((release) => {
      const parsed = new Date(release.date);
      if (Number.isFinite(parsed.getTime())) {
        seen.add(parsed.getFullYear().toString());
      }
    });
    return Array.from(seen).sort((a, b) => Number(b) - Number(a));
  }, [releases]);

  const filteredReleases = useMemo(() => {
    return releases.filter((release) => {
      const releaseYear = new Date(release.date).getFullYear().toString();

      const matchesSearch = normalizedSearch
        ? `${release.title} ${release.category ?? ""} ${releaseYear}`.toLowerCase().includes(normalizedSearch)
        : true;

      const matchesCategory =
        categoryFilter === "all" || release.category === categoryFilter;

      const matchesYear = yearFilter === "all" || releaseYear === yearFilter;

      return matchesSearch && matchesCategory && matchesYear;
    });
  }, [categoryFilter, normalizedSearch, releases, yearFilter]);

  const sortedReleases = useMemo(() => {
    return [...filteredReleases].sort((a, b) => {
      if (a.featured !== b.featured) {
        return a.featured ? -1 : 1;
      }
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });
  }, [filteredReleases]);

  const totalEntries = sortedReleases.length;
  const totalPages = Math.max(1, Math.ceil(totalEntries / pageSize));
  const safeCurrentPage = Math.min(Math.max(currentPage, 1), totalPages);

  const pageStart = totalEntries === 0 ? 0 : (safeCurrentPage - 1) * pageSize + 1;
  const pageEnd = Math.min(totalEntries, safeCurrentPage * pageSize);

  const visibleReleases = sortedReleases.slice(
    (safeCurrentPage - 1) * pageSize,
    safeCurrentPage * pageSize,
  );

  const noMatches = totalEntries === 0;

  return (
    <div className={styles.root}>
      <div className={styles.filterBar}>
        <div>
          <label className={styles.visuallyHidden} htmlFor="press-search">
            Search press releases
          </label>
          <input
            id="press-search"
            className={styles.searchInput}
            type="search"
            placeholder="Search by title, category, or year"
            value={searchTerm}
            onChange={(event) => {
              setSearchTerm(event.target.value);
              setCurrentPage(1);
            }}
          />
        </div>

        <div className={styles.controlGroup}>
  <label className={styles.visuallyHidden} htmlFor="press-category">
    Filter by category
  </label>
  <div className={styles.selectWrapper}>
    <select
      id="press-category"
      className={styles.select}
      value={categoryFilter}
      onChange={(event) => {
        setCategoryFilter(event.target.value);
        setCurrentPage(1);
      }}
    >
      <option value="all">All categories</option>
      {categories.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
  </div>

  <label className={styles.visuallyHidden} htmlFor="press-year">
    Filter by year
  </label>
  <div className={styles.selectWrapper}>
    <select
      id="press-year"
      className={styles.select}
      value={yearFilter}
      onChange={(event) => {
        setYearFilter(event.target.value);
        setCurrentPage(1);
      }}
    >
      <option value="all">Any year</option>
      {years.map((year) => (
        <option key={year} value={year}>
          {year}
        </option>
      ))}
    </select>
  </div>

  <label className={styles.visuallyHidden} htmlFor="press-page-size">
    Releases per page
  </label>
  <div className={styles.selectWrapper}>
    <select
      id="press-page-size"
      className={styles.select}
      value={pageSize}
      onChange={(event) => {
        setPageSize(Number(event.target.value));
        setCurrentPage(1);
      }}
    >
      {PAGE_SIZE_OPTIONS.map((size) => (
        <option key={size} value={size}>
          {size} per page
        </option>
      ))}
    </select>
  </div>
        </div>
      </div>


      <div className={styles.grid}>
        {visibleReleases.map((release) => (
          <article
            key={release.id}
            className={clsx(styles.card, release.featured && styles.featured)}
          >
            <div className={styles.cardHeader}>
              <div className={styles.category}>{release.category}</div>
              {release.featured && <span className={styles.featuredBadge}>Featured</span>}
            </div>

            <div className={styles.coverWrapper}>
              {release.coverImageUrl ? (
                <div
                  className={styles.cover}
                  style={{ backgroundImage: `url(${release.coverImageUrl})` }}
                />
              ) : (
                <div className={styles.coverPlaceholder}>
                  <span>No artwork</span>
                </div>
              )}
            </div>

            <div className={styles.cardBody}>
              <h3 className={styles.title}>{release.title}</h3>
              <p className={styles.date}>{formatReleaseDate(release.date)}</p>
              <p className={styles.summary}>{release.summary}</p>
              <button
                type="button"
                className={clsx(styles.cta, !release.directDownloadUrl && !release.fullContent && styles.disabled)}
                onClick={() => {
                  if (release.directDownloadUrl) {
                    window.open(release.directDownloadUrl, "_blank", "noopener,noreferrer");
                  } else if (release.fullContent) {
                    setActiveRelease(release);
                  }
                }}
                disabled={!release.directDownloadUrl && !release.fullContent}
              >
                Read Full Press Release
              </button>
            </div>
          </article>
        ))}

        {noMatches && (
          <div className={styles.emptyState}>
            {releases.length
              ? "No press releases match those filters. Try a different keyword or category."
              : "No press releases yet. Add one from the admin panel to populate this section."}
          </div>
        )}
      </div>

      {!noMatches && (
        <div className={styles.pagination}>
          <div className={styles.paginationInfo}>
            Showing {pageStart}–{pageEnd} of {totalEntries} release
            {totalEntries === 1 ? "" : "s"}
          </div>
          <div className={styles.paginationActions}>
            <button
              type="button"
              className={styles.pageButton}
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={safeCurrentPage === 1}
            >
              Previous
            </button>
            <button
              type="button"
              className={styles.pageButton}
              onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={safeCurrentPage === totalPages}
            >
              Next
            </button>
          </div>
        </div>
      )}

      {activeRelease && (
        <PressReleaseModal release={activeRelease} onClose={() => setActiveRelease(null)} />
      )}
    </div>
  );
}

type PressReleaseModalProps = {
  release: PressReleaseEntry;
  onClose: () => void;
};

function PressReleaseModal({ release, onClose }: PressReleaseModalProps) {
  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKey);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKey);
    };
  }, [onClose]);

  return (
    <div className={styles.modalOverlay} role="dialog" aria-modal="true" onClick={onClose}>
      <div className={styles.modalContent} onClick={(event) => event.stopPropagation()}>
        <header className={styles.modalHeader}>
          <div>
            <h3 className={styles.modalTitle}>{release.title}</h3>
            <p className={styles.modalMeta}>
              {release.category} • {formatReleaseDate(release.date)}
            </p>
          </div>
          <button type="button" className={styles.modalClose} onClick={onClose}>
            Close
          </button>
        </header>
        <div className={styles.modalBody}>
          <div
            className={styles.modalBodyContent}
            dangerouslySetInnerHTML={{
              __html: release.fullContent ?? "<p>No full content yet.</p>",
            }}
          />
        </div>
      </div>
    </div>
  );
}

function formatReleaseDate(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "TBD";
  }
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(parsed);
}
