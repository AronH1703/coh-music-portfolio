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
      setMessage({ type: "success", text: "Netföng afskriftaafhenda afrituð." });
    } catch (error) {
      console.error(error);
      setMessage({
        type: "error",
        text: "Tókst ekki að afrita í klippiborð. Reyndu aftur.",
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
        text: payload?.error ?? "Tókst ekki að útbúa CSV-skrá.",
      });
      setIsDownloading(false);
      return;
    }

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "póstlisti-áskrifendur.csv";
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);

    setMessage({ type: "success", text: "CSV-skrá niðurhalað." });
    setIsDownloading(false);
  };

  const removeSubscriber = async (id: string) => {
    if (!window.confirm("Fjarlægja þennan áskrifanda?")) return;
    const response = await fetch(`/api/newsletter?id=${id}`, {
      method: "DELETE",
    });
    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      setMessage({
        type: "error",
        text: payload?.error ?? "Tókst ekki að fjarlægja áskrifanda.",
      });
      return;
    }
    setSubscribers((previous) => previous.filter((item) => item.id !== id));
    setMessage({ type: "success", text: "Áskrifandi fjarlægður." });
  };

  return (
    <section className={`${styles.card} ${styles.newsletterCard}`}>
      <div className={styles.actions}>
        <button
          type="button"
          className={styles.primaryButton}
          onClick={copyAll}
          disabled={subscribers.length === 0 || isCopying}
        >
          {isCopying ? "Afrita…" : "Afrita öll netföng"}
        </button>
        <button
          type="button"
          className={styles.secondaryButton}
          onClick={downloadCsv}
          disabled={subscribers.length === 0 || isDownloading}
        >
          {isDownloading ? "Undirbý…" : "Sækja CSV-skrá"}
        </button>
        <button
          type="button"
          className={styles.secondaryButton}
          onClick={() => loadSubscribers()}
        >
          Endurhlaða lista
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
        <div className={styles.emptyState}>Hleð áskrifendum…</div>
      ) : subscribers.length === 0 ? (
        <div className={styles.emptyState}>
          Engar skráningar á póstlista ennþá. Lifandi form á síðunni munu fylla þennan lista.
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
                <div className={styles.newsletterSource}>
                  Uppruni: {subscriber.source}
                </div>
              )}
              <div className={styles.actions}>
                <button
                  type="button"
                  className={styles.dangerButton}
                  onClick={() => removeSubscriber(subscriber.id)}
                >
                  Eyða
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
