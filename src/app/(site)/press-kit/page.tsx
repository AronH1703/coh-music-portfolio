export const runtime = "nodejs";
import { getPressKitAssets } from "@/lib/content";
import { PressKitActions } from "./actions";
import styles from "@/components/press-kit/press-kit-section.module.css";

export default async function PressKitPage() {
  const assets = await getPressKitAssets();

  return (
    <main>
      <section id="press-kit">
        <div className="section-inner" style={{ marginTop: "2rem" }}>
          <div className={styles.header}>
            <span className="eyebrow">Press</span>
            <h1>Press Kit</h1>
            <p className="section-subtitle">
              Curated download links for recording, tour, and production partners plus press outlets. All URLs are managed from the admin panel.
            </p>
          </div>
          <PressKitActions assets={assets} />
        </div>
      </section>
    </main>
  );
}
