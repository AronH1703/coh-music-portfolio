"use client";

import { useCallback, useEffect, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import styles from "../admin-dashboard.module.scss";
import controls from "../form-controls.module.scss";
import { TextField } from "../form-controls";
import { contactSchema } from "@/lib/validation";

type ContactFormValues = z.input<typeof contactSchema>;

type MessageState =
  | { type: "success"; text: string }
  | { type: "error"; text: string }
  | null;

export function ContactSection() {
  const [message, setMessage] = useState<MessageState>(null);
  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isDirty, isSubmitting },
  } = useForm<ContactFormValues>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      emailContact: "",
      bookingEmail: "",
      socialLinks: [],
      managementContact: "",
      pressContact: "",
    },
  });

  useEffect(() => {
    let mounted = true;
    async function loadContact() {
      const response = await fetch("/api/contact", { cache: "no-store" });
      if (!response.ok) return;
      const { data } = await response.json();
      if (mounted && data) {
        reset({
          emailContact: data.emailContact ?? "",
          bookingEmail: data.bookingEmail ?? "",
          socialLinks: Array.isArray(data.socialLinks)
            ? (data.socialLinks as unknown[]).map((link) => {
                if (!link || typeof link !== "object") {
                  return { label: "", url: "" };
                }
                const { label, url } = link as {
                  label?: unknown;
                  url?: unknown;
                };
                return {
                  label: typeof label === "string" ? label : "",
                  url: typeof url === "string" ? url : "",
                };
              })
            : [],
          managementContact: data.managementContact ?? "",
          pressContact: data.pressContact ?? "",
        });
      }
    }

    void loadContact();
    return () => {
      mounted = false;
    };
  }, [reset]);

  const {
    fields: socialFields,
    append: appendSocialLink,
    remove: removeSocialLink,
  } = useFieldArray({
    control,
    name: "socialLinks",
  });

  const addSocialLink = useCallback(() => {
    appendSocialLink({ label: "", url: "" });
  }, [appendSocialLink]);

  const submit = handleSubmit(async (values) => {
    setMessage(null);
    const response = await fetch("/api/contact", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      setMessage({
        type: "error",
        text: payload?.error ?? "Failed to save contact details.",
      });
      return;
    }

    setMessage({ type: "success", text: "Contact & social links updated." });
  });

  return (
    <section className={styles.card}>
      <form onSubmit={submit} className={styles.fieldset}>
        <div className={styles.fieldGroup}>
          <TextField
            label="Primary contact email"
            placeholder="hello@cohmusic.com"
            {...register("emailContact")}
            error={errors.emailContact}
          />
          <TextField
            label="Booking email"
            placeholder="booking@agency.com"
            {...register("bookingEmail")}
            error={errors.bookingEmail}
          />
        </div>

        <div className={styles.fieldGroupStacked}>
          <div
            className={styles.fieldGroup}
            style={{ justifyContent: "space-between", alignItems: "center" }}
          >
            <span className={controls.label}>Social links</span>
            <button
              type="button"
              className={styles.secondaryButton}
              onClick={addSocialLink}
            >
              Add link
            </button>
          </div>
          {socialFields.length === 0 && (
            <p className={controls.helper}>
              Add Instagram, YouTube, or any custom links your audience expects.
            </p>
          )}
          {socialFields.map((field, index) => (
            <div key={field.id} className={styles.fieldGroup}>
              <TextField
                label="Label"
                placeholder="Instagram"
                {...register(`socialLinks.${index}.label` as const)}
                error={errors.socialLinks?.[index]?.label}
              />
              <TextField
                label="URL"
                placeholder="https://instagram.com/coh.music"
                {...register(`socialLinks.${index}.url` as const)}
                error={errors.socialLinks?.[index]?.url}
              />
              <button
                type="button"
                className={styles.secondaryButton}
                onClick={() => removeSocialLink(index)}
              >
                Remove
              </button>
            </div>
          ))}
        </div>

        <div className={styles.fieldGroup}>
          <TextField
            label="Management contact"
            placeholder="Name – management@agency.com"
            {...register("managementContact")}
            error={errors.managementContact}
          />
          <TextField
            label="Press contact"
            placeholder="Press contact details"
            {...register("pressContact")}
            error={errors.pressContact}
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
            {isSubmitting ? "Saving…" : "Save contact info"}
          </button>
          <button
            type="button"
            className={styles.secondaryButton}
            onClick={() => reset()}
          >
            Reset changes
          </button>
        </div>
      </form>
    </section>
  );
}
