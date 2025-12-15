"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import styles from "./login-form.module.scss";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus(null);
    setLoading(true);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
      callbackUrl: "/admin",
    });

    if (result?.ok) {
      window.location.href = "/admin";
      return;
    }

    setStatus(result?.error ?? "Invalid credentials.");
    setLoading(false);
  };

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <h1 className={styles.title}>Admin access</h1>
        <p className={styles.description}>
          Enter the admin credentials to manage hero, media, and release
          content.
        </p>
      </div>

      <form className={styles.form} onSubmit={submit}>
        <input
          className={styles.input}
          type="email"
          name="email"
          placeholder="Email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
        <input
          className={styles.input}
          type="password"
          name="password"
          placeholder="Password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />
        {status && <div className={styles.status}>{status}</div>}
        <button type="submit" className={styles.button} disabled={loading}>
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </div>
  );
}
