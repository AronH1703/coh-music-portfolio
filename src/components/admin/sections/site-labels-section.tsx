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
    musicHeading: "",
    galleryLabel: "",
    galleryHeading: "",
    videosLabel: "",
    videosHeading: "",
    aboutLabel: "",
    aboutHeading: "",
    contactLabel: "",
    contactHeading: "",
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
          musicHeading: data.musicHeading ?? "",
          galleryLabel: data.galleryLabel ?? "",
          galleryHeading: data.galleryHeading ?? "",
          videosLabel: data.videosLabel ?? "",
          videosHeading: data.videosHeading ?? "",
          aboutLabel: data.aboutLabel ?? "",
          aboutHeading: data.aboutHeading ?? "",
          contactLabel: data.contactLabel ?? "",
          contactHeading: data.contactHeading ?? "",
        });
      }
    })();
    return () => {
      active = false;
    };
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
      setMessage({
        type: "error",
        text: payload?.error ?? "Tókst ekki að vista.",
      });
      setSaving(false);
      return;
    }
    setMessage({ type: "success", text: "Uppfært." });
    setSaving(false);
  };

  return (
    <section className={styles.card}>
      <div className={styles.fieldset}>
        <div className={styles.fieldGroup}>
          <TextField
            label="Forsíðu-yfirtexti (hero eyebrow)"
            name="heroLabel"
            value={state.heroLabel}
            onChange={(e) =>
              setState((p) => ({ ...p, heroLabel: e.target.value }))
            }
          />
        </div>

        <div className={styles.fieldGroup}>
          <TextField
            label="Tónlist – yfirtexti"
            name="musicLabel"
            value={state.musicLabel}
            onChange={(e) =>
              setState((p) => ({ ...p, musicLabel: e.target.value }))
            }
          />
          <TextField
            label="Tónlist – fyrirsögn"
            name="musicHeading"
            value={state.musicHeading}
            onChange={(e) =>
              setState((p) => ({ ...p, musicHeading: e.target.value }))
            }
          />
        </div>

        <div className={styles.fieldGroup}>
          <TextField
            label="Myndasafn – yfirtexti"
            name="galleryLabel"
            value={state.galleryLabel}
            onChange={(e) =>
              setState((p) => ({ ...p, galleryLabel: e.target.value }))
            }
          />
          <TextField
            label="Myndasafn – fyrirsögn"
            name="galleryHeading"
            value={state.galleryHeading}
            onChange={(e) =>
              setState((p) => ({ ...p, galleryHeading: e.target.value }))
            }
          />
        </div>

        <div className={styles.fieldGroup}>
          <TextField
            label="Myndbönd – yfirtexti"
            name="videosLabel"
            value={state.videosLabel}
            onChange={(e) =>
              setState((p) => ({ ...p, videosLabel: e.target.value }))
            }
          />
          <TextField
            label="Myndbönd – fyrirsögn"
            name="videosHeading"
            value={state.videosHeading}
            onChange={(e) =>
              setState((p) => ({ ...p, videosHeading: e.target.value }))
            }
          />
        </div>

        <div className={styles.fieldGroup}>
          <TextField
            label="Um – yfirtexti"
            name="aboutLabel"
            value={state.aboutLabel}
            onChange={(e) =>
              setState((p) => ({ ...p, aboutLabel: e.target.value }))
            }
          />
          <TextField
            label="Um – fyrirsögn"
            name="aboutHeading"
            value={state.aboutHeading}
            onChange={(e) =>
              setState((p) => ({ ...p, aboutHeading: e.target.value }))
            }
          />
        </div>

        <div className={styles.fieldGroup}>
          <TextField
            label="Hafa samband – yfirtexti"
            name="contactLabel"
            value={state.contactLabel}
            onChange={(e) =>
              setState((p) => ({ ...p, contactLabel: e.target.value }))
            }
          />
          <TextField
            label="Hafa samband – fyrirsögn"
            name="contactHeading"
            value={state.contactHeading}
            onChange={(e) =>
              setState((p) => ({ ...p, contactHeading: e.target.value }))
            }
          />
        </div>

        {message && (
          <div
            className={
              message.type === "success"
                ? styles.successMessage
                : styles.errorMessage
            }
          >
            {message.text}
          </div>
        )}

        <div className={styles.actions}>
          <button
            type="button"
            className={styles.primaryButton}
            onClick={save}
            disabled={saving}
          >
            {saving ? "Vista…" : "Vista"}
          </button>
        </div>
      </div>
    </section>
  );
}
