"use client";

import { useCallback, useEffect, useState } from "react";
import styles from "../admin-dashboard.module.scss";

type Subscriber = {
  id: string;
  email: string;
  source: string | null;
  createdAt: string;
};

type MessageState =
  | { type: "success"; text: string }
  | { type: "error"; text: string }
  | null;

export function NewsletterSection() {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [message, setMessage] = useState<MessageState>(null);
  const [loading, setLoading] = useState(true);
  const [isCopying, setIsCopying] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const loadSubscribers = useCallback(async () => {
    setLoading(true);
    const response = await fetch("/api/newsletter", { cache: "no-store" });
    if (response.ok) {
      const { data } = await response.json();
      setSubscribers(data as Subscriber[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void loadSubscribers();
  }, [loadSubscribers]);

  const copyAll = async () => {
    setMessage(null);
    setIsCopying(true);
    const emails = subscribers.map((subscriber) => subscriber.email).join(", ");
    try {
      await navigator.clipboard.writeText(emails);
      setMessage({ type: "success", text: "Subscriber emails copied." });
    } catch (error) {
      console.error(error);
      setMessage({
        type: "error",
        text: "Clipboard copy failed. Please try again.",
      });
    } finally {
      setIsCopying(false);
    }
  };

  const downloadCsv = async () => {
    setMessage(null);
    setIsDownloading(true);
    const response = await fetch("/api/newsletter/csv");
    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      setMessage({
        type: "error",
        text: payload?.error ?? "Failed to generate CSV export.",
      });
      setIsDownloading(false);
      return;
    }

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "newsletter-subscribers.csv";
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);

    setMessage({ type: "success", text: "CSV downloaded." });
    setIsDownloading(false);
  };

  const removeSubscriber = async (id: string) => {
    if (!window.confirm("Remove this subscriber?")) return;
    const response = await fetch(`/api/newsletter?id=${id}`, {
      method: "DELETE",
    });
    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      setMessage({
        type: "error",
        text: payload?.error ?? "Failed to remove subscriber.",
      });
      return;
    }
    setSubscribers((previous) => previous.filter((item) => item.id !== id));
    setMessage({ type: "success", text: "Subscriber removed." });
  };

  return (
    <section className={styles.card}>
      <div className={styles.actions}>
        <button
          type="button"
          className={styles.primaryButton}
          onClick={copyAll}
          disabled={subscribers.length === 0 || isCopying}
        >
          {isCopying ? "Copying…" : "Copy all emails"}
        </button>
        <button
          type="button"
          className={styles.secondaryButton}
          onClick={downloadCsv}
          disabled={subscribers.length === 0 || isDownloading}
        >
          {isDownloading ? "Preparing…" : "Download CSV"}
        </button>
        <button
          type="button"
          className={styles.secondaryButton}
          onClick={() => loadSubscribers()}
        >
          Refresh list
        </button>
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

      {loading ? (
        <div className={styles.emptyState}>Loading subscribers…</div>
      ) : subscribers.length === 0 ? (
        <div className={styles.emptyState}>
          No newsletter sign-ups yet. Live forms will populate this list.
        </div>
      ) : (
        <div className={styles.list}>
          {subscribers.map((subscriber) => (
            <article key={subscriber.id} className={styles.listItem}>
              <header className={styles.listItemHeader}>
                <div className={styles.listItemTitle}>{subscriber.email}</div>
                <div className={styles.timestamp}>
                  {new Date(subscriber.createdAt).toLocaleString()}
                </div>
              </header>
              {subscriber.source && (
                <div className={styles.sectionDescription}>
                  Source: {subscriber.source}
                </div>
              )}
              <div className={styles.actions}>
                <button
                  type="button"
                  className={styles.dangerButton}
                  onClick={() => removeSubscriber(subscriber.id)}
                >
                  Delete
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
