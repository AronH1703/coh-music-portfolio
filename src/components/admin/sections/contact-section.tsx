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
      emailContacts: [],
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
        const emailContacts = Array.isArray(data.emailContacts)
          ? (data.emailContacts as unknown[]).map((entry) => {
              if (!entry || typeof entry !== "object") {
                return { label: "", email: "" };
              }
              const { label, email } = entry as {
                label?: unknown;
                email?: unknown;
              };
              return {
                label: typeof label === "string" ? label : "",
                email: typeof email === "string" ? email : "",
              };
            })
          : [];

        reset({
          emailContacts,
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
    fields: emailFields,
    append: appendEmailContact,
    remove: removeEmailContact,
  } = useFieldArray({
    control,
    name: "emailContacts",
  });

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

  const addEmailContact = useCallback(() => {
    appendEmailContact({ label: "", email: "" });
  }, [appendEmailContact]);

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
        text: payload?.error ?? "Tókst ekki að vista tengiupplýsingar.",
      });
      return;
    }

    setMessage({ type: "success", text: "Tengiliðir og samfélagshlekkir uppfærðir." });
  });

  return (
    <section className={styles.card}>
      <form onSubmit={submit} className={styles.fieldset}>
        <div className={styles.fieldGroupStacked}>
          <div
            className={styles.fieldGroup}
            style={{ justifyContent: "space-between", alignItems: "center" }}
          >
            <span className={controls.label}>Netfangstengiliðir</span>
            <button
              type="button"
              className={styles.secondaryButton}
              onClick={addEmailContact}
            >
              Bæta við netfangi
            </button>
          </div>
          {emailFields.length === 0 && (
            <p className={controls.helper}>
              Bættu við einu eða fleiri merktum netföngum (t.d. Almenn fyrirspurn, Bókanir eða
              Umsjón).
            </p>
          )}
          {emailFields.map((field, index) => (
            <div key={field.id} className={styles.fieldGroup}>
              <TextField
                label="Heiti"
                placeholder="Almenn fyrirspurn"
                {...register(`emailContacts.${index}.label` as const)}
                error={errors.emailContacts?.[index]?.label}
              />
              <TextField
                label="Netfang"
                placeholder="hello@cohmusic.com"
                {...register(`emailContacts.${index}.email` as const)}
                error={errors.emailContacts?.[index]?.email}
              />
              <button
                type="button"
                className={styles.secondaryButton}
                onClick={() => removeEmailContact(index)}
              >
                Fjarlægja
              </button>
            </div>
          ))}
        </div>

        <div className={styles.fieldGroupStacked}>
          <div
            className={styles.fieldGroup}
            style={{ justifyContent: "space-between", alignItems: "center" }}
          >
            <span className={controls.label}>Samfélagsmiðlahlekkir</span>
            <button
              type="button"
              className={styles.secondaryButton}
              onClick={addSocialLink}
            >
              Bæta við hlekk
            </button>
          </div>
          {socialFields.length === 0 && (
            <p className={controls.helper}>
              Bættu við Instagram, YouTube eða öðrum hlekkjum.
            </p>
          )}
          {socialFields.map((field, index) => (
            <div key={field.id} className={styles.fieldGroup}>
              <TextField
                label="Heiti"
                placeholder="Instagram"
                {...register(`socialLinks.${index}.label` as const)}
                error={errors.socialLinks?.[index]?.label}
              />
              <TextField
                label="Slóð (URL)"
                placeholder="https://instagram.com/coh.music"
                {...register(`socialLinks.${index}.url` as const)}
                error={errors.socialLinks?.[index]?.url}
              />
              <button
                type="button"
                className={styles.secondaryButton}
                onClick={() => removeSocialLink(index)}
              >
                Fjarlægja
              </button>
            </div>
          ))}
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
            {isSubmitting ? "Vista…" : "Vista tengiupplýsingar"}
          </button>
          <button
            type="button"
            className={styles.secondaryButton}
            onClick={() => reset()}
          >
            Hætta við breytingar
          </button>
        </div>
      </form>
    </section>
  );
}
