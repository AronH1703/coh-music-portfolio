"use client";

import { useEffect, useState } from "react";
import clsx from "clsx";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import styles from "../admin-dashboard.module.scss";
import { heroSchema } from "@/lib/validation";
import { TextField, TextareaField } from "../form-controls";

type HeroFormValues = z.input<typeof heroSchema>;

type MessageState =
  | { type: "success"; text: string }
  | { type: "error"; text: string }
  | null;

export function HeroSection() {
  const [message, setMessage] = useState<MessageState>(null);
  const SHOW_STYLE_FIELDS = false; // temporarily hide color/font controls
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<HeroFormValues>({
    resolver: zodResolver(heroSchema),
    defaultValues: {
      title: "",
      subtitle: "",
      backgroundColor: "",
      titleColor: "",
      subtitleColor: "",
      eyebrowColor: "",
      titleFont: "",
      subtitleFont: "",
      primaryCtaLabel: "",
      primaryCtaHref: "",
      secondaryCtaLabel: "",
      secondaryCtaHref: "",
      metaTitle: "",
      metaDescription: "",
    },
  });

  useEffect(() => {
    let isMounted = true;

    async function loadHero() {
      const response = await fetch("/api/hero", { cache: "no-store" });
      if (!response.ok) {
        return;
      }
      const { data } = await response.json();
      if (isMounted && data) {
        reset({
          title: data.title ?? "",
          subtitle: data.subtitle ?? "",
          backgroundColor: data.backgroundColor ?? "",
          titleColor: data.titleColor ?? "",
          subtitleColor: data.subtitleColor ?? "",
          eyebrowColor: data.eyebrowColor ?? "",
          titleFont: data.titleFont ?? "",
          subtitleFont: data.subtitleFont ?? "",
          primaryCtaLabel: data.primaryCtaLabel ?? "",
          primaryCtaHref: data.primaryCtaHref ?? "",
          secondaryCtaLabel: data.secondaryCtaLabel ?? "",
          secondaryCtaHref: data.secondaryCtaHref ?? "",
          metaTitle: data.metaTitle ?? "",
          metaDescription: data.metaDescription ?? "",
        });
      }
    }

    void loadHero();

    return () => {
      isMounted = false;
    };
  }, [reset]);

  const onSubmit = handleSubmit(async (values) => {
    setMessage(null);

    const response = await fetch("/api/hero", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      setMessage({
        type: "error",
        text: payload?.error ?? "Failed to save hero content.",
      });
      return;
    }

    setMessage({ type: "success", text: "Hero content saved." });
  });

  return (
    <section className={clsx(styles.card, styles.heroCard)}>
      <form onSubmit={onSubmit} className={styles.fieldset}>
        <div className={styles.fieldGroup}>
          <TextField
            label="Aðalfyrirsögn (Hero title)"
            placeholder="Tónlist fyrir augnablikin sem skipta máli."
            {...register("title")}
            error={errors.title}
          />
          <TextareaField
            label="Undirfyrirsögn (Hero subtitle)"
            placeholder="Bættu við stuttum texta sem styður og útskýrir aðalfyrirsögnina."
            rows={4}
            {...register("subtitle")}
            error={errors.subtitle}
          />
        </div>

        {SHOW_STYLE_FIELDS && (
          <>
            <div className={styles.fieldGroup}>
              <TextField
                label="Background color"
                placeholder="#0f172a"
                helperText="Hex value or CSS variable (e.g. var(--hero-bg))."
                {...register("backgroundColor")}
                error={errors.backgroundColor}
              />
              <TextField
                label="Title color"
                placeholder="#ffffff"
                {...register("titleColor")}
                error={errors.titleColor}
              />
              <TextField
                label="Subtitle color"
                placeholder="#d1d5db"
                {...register("subtitleColor")}
                error={errors.subtitleColor}
              />
              <TextField
                label="Eyebrow color"
                placeholder="#facc15"
                {...register("eyebrowColor")}
                error={errors.eyebrowColor}
              />
            </div>

            <div className={styles.fieldGroup}>
              <TextField
                label="Title font"
                placeholder="var(--font-display)"
                helperText="Provide a CSS font-family or variable name."
                {...register("titleFont")}
                error={errors.titleFont}
              />
              <TextField
                label="Subtitle font"
                placeholder="var(--font-sans)"
                {...register("subtitleFont")}
                error={errors.subtitleFont}
              />
            </div>
          </>
        )}

        <div className={styles.fieldGroup}>
          <TextField
            label="Texti á aðalhnappi"
            placeholder="Explore the work"
            {...register("primaryCtaLabel")}
            error={errors.primaryCtaLabel}
          />
          <TextField
            label="Slóð fyrir aðalhnapp"
            placeholder="https://example.com/#music"
            {...register("primaryCtaHref")}
            error={errors.primaryCtaHref}
          />
        </div>

        <div className={styles.fieldGroup}>
          <TextField
            label="Texti á aukahnappi"
            placeholder="Bookings & inquiries"
            {...register("secondaryCtaLabel")}
            error={errors.secondaryCtaLabel}
          />
          <TextField
            label="Slóð fyrir aukahnapp"
            placeholder="https://example.com/#contact"
            {...register("secondaryCtaHref")}
            error={errors.secondaryCtaHref}
          />
        </div>

        <div className={styles.fieldGroup}>
          <TextField
            label="SEO-titill"
            placeholder="Tónlistarmaður & Framleiðandi | Coh Music"
            {...register("metaTitle")}
            error={errors.metaTitle}
          />
          <TextareaField
            label="SEO-lýsing"
            placeholder="Rík og hnitmiðuð lýsing sem birtist í leitarniðurstöðum og samfélagsmiðlaforskoðunum."
            rows={3}
            {...register("metaDescription")}
            error={errors.metaDescription}
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
            type="submit"
            className={styles.primaryButton}
            disabled={isSubmitting || !isDirty}
          >
            {isSubmitting ? "Saving…" : "Save hero"}
          </button>
        </div>
      </form>
    </section>
  );
}
