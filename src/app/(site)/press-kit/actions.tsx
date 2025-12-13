import type { PressKitAssetsRecord } from "@/lib/content";
import styles from "@/components/press-kit/press-kit-section.module.css";

type Props = {
  assets: PressKitAssetsRecord;
};

type LinkMode = "download" | "open";

export function PressKitActions({ assets }: Props) {
  const links = Array.isArray(assets.links)
    ? assets.links
        .map((link) => ({
          id: link.id ?? link.url,
          label: link.label?.trim() || "Untitled link",
          helper: link.helper?.trim() ?? "",
          url: typeof link.url === "string" ? link.url.trim() : "",
          mode: (link.mode === "open" || link.mode === "download" ? link.mode : "download") as LinkMode,
        }))
        .filter((link) => Boolean(link.url))
    : [];

  if (!links.length) {
    return (
      <div className={styles.actions}>
        <article className={styles.actionCard}>
          <div>
            <p className={styles.actionTitle}>Press kit links coming soon</p>
            <p className={styles.actionHelper}>
              Add URLs through the admin Press Kit section to surface downloads on the homepage.
            </p>
          </div>
          <span className={styles.actionDisabled}>Coming soon</span>
        </article>
      </div>
    );
  }

  return (
    <div className={styles.actions}>
      {links.map((link) => {
        const actionLabel = link.label.trim();
        const buttonLabel = `${link.mode === "download" ? "Download" : "Open"} ${actionLabel}`;
        const actionUrl = resolveActionUrl(link);

        return (
          <article key={link.id} className={styles.actionCard}>
            <div>
              <p className={styles.actionTitle}>{actionLabel}</p>
              {link.helper ? (
                <p className={styles.actionHelper}>{link.helper}</p>
              ) : (
                <p className={styles.actionHelper}>Link managed via the admin panel.</p>
              )}
            </div>
            <a
              className={styles.actionButton}
              href={actionUrl}
              target="_blank"
              rel="noopener noreferrer"
              download={link.mode === "download" ? "" : undefined}
            >
              {buttonLabel}
            </a>
          </article>
        );
      })}
    </div>
  );
}

function resolveActionUrl(link: { url: string; mode: LinkMode }): string {
  if (link.mode !== "download") {
    return link.url;
  }

  try {
    const parsed = new URL(link.url);
    const host = parsed.hostname.toLowerCase();
    if (host.includes("dropbox.com")) {
      parsed.searchParams.set("dl", "1");
      return parsed.toString();
    }
  } catch {
    return link.url;
  }

  return link.url;
}
