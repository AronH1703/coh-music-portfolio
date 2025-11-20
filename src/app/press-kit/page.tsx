import { getPressKitAssets, type PressKitAssetsRecord } from "@/lib/content";
import styles from "./page.module.css";

type AssetAction = {
  key: keyof PressKitAssetsRecord;
  title: string;
  helper: string;
  buttonLabel: string;
};

const ASSET_ACTIONS: AssetAction[] = [
  {
    key: "fullPressKitZipUrl",
    title: "Full Press Kit",
    helper: "Everything bundled for easy distribution to press and partners.",
    buttonLabel: "Download Full Press Kit",
  },
  {
    key: "onePagerPdfUrl",
    title: "One-Pager (PDF)",
    helper: "A concise single-sheet summary of Creature of Habit.",
    buttonLabel: "Download One-Pager (PDF)",
  },
  {
    key: "pressPhotosFolderUrl",
    title: "Press Photos Folder",
    helper: "High-resolution stills and performance imagery.",
    buttonLabel: "Open Press Photos Folder",
  },
  {
    key: "logosFolderUrl",
    title: "Logos Folder",
    helper: "Brand marks, lockups, and horizontal/vertical variants.",
    buttonLabel: "Open Logos Folder",
  },
  {
    key: "artworkFolderUrl",
    title: "Artwork Folder",
    helper: "Cover art, campaign visuals, and promotional treatments.",
    buttonLabel: "Open Artwork Folder",
  },
  {
    key: "stagePlotPdfUrl",
    title: "Stage Plot (PDF)",
    helper: "Stage plot, riser layout, and technical overlay.",
    buttonLabel: "Download Stage Plot (PDF)",
  },
  {
    key: "inputListPdfUrl",
    title: "Input List (PDF)",
    helper: "FOH/monitor-friendly signal path and channel choices.",
    buttonLabel: "Download Input List (PDF)",
  },
];

export default async function PressKitPage() {
  const assets = await getPressKitAssets();
  const availableActions = ASSET_ACTIONS.map((action) => ({
    ...action,
    url: assets[action.key],
  }));

  return (
    <main>
      <section id="press-kit">
        <div className="section-inner">
          <div className={styles.header}>
            <span className="eyebrow">Press</span>
            <h1>Press Kit</h1>
            <p className="section-subtitle">
              Curated download links for recording, tour, and production partners plus press outlets. All URLs are managed from the admin panel.
            </p>
          </div>
          <div className={styles.actions}>
            {availableActions.map((action) => (
              <article key={action.key} className={styles.actionCard}>
                <div>
                  <p className={styles.actionTitle}>{action.title}</p>
                  <p className={styles.actionHelper}>{action.helper}</p>
                </div>
                {action.url ? (
                  <a
                    className={styles.actionButton}
                    href={action.url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {action.buttonLabel}
                  </a>
                ) : (
                  <span className={styles.actionDisabled}>URL not yet configured</span>
                )}
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
