"use client";

import { useState } from "react";

type Message =
  | { type: "success"; text: string }
  | { type: "error"; text: string }
  | null;

export function SubscribeForm({ placeholder }: { placeholder?: string }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Message>(null);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          source: "site:contact",
        }),
      });

      if (res.status === 201) {
        setStatus({ type: "success", text: "Thanks—check your inbox for updates soon." });
        setEmail("");
      } else {
        const payload = await res.json().catch(() => null);
        setStatus({
          type: "error",
          text: payload?.error ?? "Subscription failed. Please try again.",
        });
      }
    } catch {
      setStatus({ type: "error", text: "Network error. Please try again." });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="contact-form" onSubmit={onSubmit}>
      <label htmlFor="newsletter-email">Join the release log</label>
      <div className="contact-form-field">
        <input
          id="newsletter-email"
          name="email"
          type="email"
          placeholder={placeholder || "name@example.com"}
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={submitting}
        />
        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? "Submitting…" : "Notify me"}
        </button>
      </div>
      <span className="contact-form-helper">
        No spam—just key updates, and you can unsubscribe anytime.
      </span>
      {status && (
        <div className={status.type === "success" ? "about-highlight" : ""} role="status" aria-live="polite">
          {status.text}
        </div>
      )}
    </form>
  );
}
