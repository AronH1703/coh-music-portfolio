"use client";

import { useEffect, useState } from "react";
import styles from "../admin-dashboard.module.scss";
import { TextField } from "../form-controls";

type MessageState = { type: "success" | "error"; text: string } | null;

export function SiteLabelsSection() {
  const [message, setMessage] = useState<MessageState>(null);
  const [state, setState] = useState({
    heroLabel: "",
    musicLabel: "",
    galleryLabel: "",
    videosLabel: "",
    aboutLabel: "",
    contactLabel: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      const response = await fetch("/api/labels", { cache: "no-store" });
      if (!response.ok) return;
      const { data } = await response.json();
      if (active && data) {
        setState({
          heroLabel: data.heroLabel ?? "",
          musicLabel: data.musicLabel ?? "",
          galleryLabel: data.galleryLabel ?? "",
          videosLabel: data.videosLabel ?? "",
          aboutLabel: data.aboutLabel ?? "",
          contactLabel: data.contactLabel ?? "",
        });
      }
    })();
    return () => { active = false; };
  }, []);

  const save = async () => {
    setSaving(true);
    setMessage(null);
    const response = await fetch("/api/labels", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(state),
    });
    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      setMessage({ type: "error", text: payload?.error ?? "Failed to save labels." });
      setSaving(false);
      return;
    }
    setMessage({ type: "success", text: "Section labels updated." });
    setSaving(false);
  };

  return (
    <section className={styles.card}>
      <div className={styles.fieldset}>
        <div className={styles.fieldGroup}>
          <TextField label="Hero eyebrow" name="heroLabel" value={state.heroLabel} onChange={(e) => setState((p) => ({ ...p, heroLabel: e.target.value }))} />
        </div>

        <div className={styles.fieldGroup}>
          <TextField label="Music eyebrow" name="musicLabel" value={state.musicLabel} onChange={(e) => setState((p) => ({ ...p, musicLabel: e.target.value }))} />
          <TextField label="Gallery eyebrow" name="galleryLabel" value={state.galleryLabel} onChange={(e) => setState((p) => ({ ...p, galleryLabel: e.target.value }))} />
        </div>
        <div className={styles.fieldGroup}>
          <TextField label="Videos eyebrow" name="videosLabel" value={state.videosLabel} onChange={(e) => setState((p) => ({ ...p, videosLabel: e.target.value }))} />
          <TextField label="About eyebrow" name="aboutLabel" value={state.aboutLabel} onChange={(e) => setState((p) => ({ ...p, aboutLabel: e.target.value }))} />
        </div>
        <div className={styles.fieldGroup}>
          <TextField label="Contact eyebrow" name="contactLabel" value={state.contactLabel} onChange={(e) => setState((p) => ({ ...p, contactLabel: e.target.value }))} />
        </div>

        {message && (
          <div className={message.type === "success" ? styles.successMessage : styles.errorMessage}>{message.text}</div>
        )}

        <div className={styles.actions}>
          <button type="button" className={styles.primaryButton} onClick={save} disabled={saving}>
            {saving ? "Saving…" : "Save labels"}
          </button>
        </div>
      </div>
    </section>
  );
}
