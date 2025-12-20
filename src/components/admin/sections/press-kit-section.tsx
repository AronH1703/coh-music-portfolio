"use client";

import clsx from "clsx";
import { useCallback, useEffect, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { pressKitAssetsSchema } from "@/lib/validation";
import type { PressKitAssetsRecord } from "@/lib/press-kit";
import styles from "../admin-dashboard.module.scss";
import controls from "../form-controls.module.scss";
import { TextField, TextareaField, SelectField } from "../form-controls";

type PressKitFormValues = z.input<typeof pressKitAssetsSchema>;

type MessageState =
  | { type: "success"; text: string }
  | { type: "error"; text: string }
  | null;

const DEFAULT_FORM_VALUES: PressKitFormValues = {
  links: [],
};

function mapRecordToFormValues(record: PressKitAssetsRecord): PressKitFormValues {
  const links = Array.isArray(record.links)
    ? record.links.map((link) => ({
        id: link.id,
        label: link.label ?? "",
        helper: link.helper ?? "",
        url: link.url ?? "",
        mode: link.mode ?? "download",
      }))
    : [];

  return { links };
}

export function PressKitSection() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<MessageState>(null);
  const [initialValues, setInitialValues] = useState<PressKitFormValues>(DEFAULT_FORM_VALUES);

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PressKitFormValues>({
    resolver: zodResolver(pressKitAssetsSchema),
    defaultValues: DEFAULT_FORM_VALUES,
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "links",
  });

  useEffect(() => {
    let active = true;
    (async () => {
      setIsLoading(true);
      const response = await fetch("/api/press-kit", { cache: "no-store" });
      if (!active) return;
      if (response.ok) {
        const payload = await response.json().catch(() => null);
        const record = payload?.data as PressKitAssetsRecord | undefined;
        if (record) {
          const mapped = mapRecordToFormValues(record);
          setInitialValues(mapped);
          reset(mapped);
        } else {
          setInitialValues(DEFAULT_FORM_VALUES);
          reset(DEFAULT_FORM_VALUES);
        }
      }
      setIsLoading(false);
    })();

    return () => {
      active = false;
    };
  }, [reset]);

  const addLink = useCallback(() => {
    append({ label: "", helper: "", url: "", mode: "download" });
  }, [append]);

  const onSubmit = handleSubmit(async (formValues) => {
    setIsSaving(true);
    setMessage(null);

    const normalizedValues = sanitizeFormValues(formValues);

    const response = await fetch("/api/press-kit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(normalizedValues),
    });

    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      setMessage({
        type: "error",
        text: payload?.error ?? "Tókst ekki að vista pressukit-hlekki.",
      });
      setIsSaving(false);
      return;
    }

    const updated = payload?.data as PressKitAssetsRecord | undefined;
    if (updated) {
      const mapped = mapRecordToFormValues(updated);
      setInitialValues(mapped);
      reset(mapped);
    } else {
      setInitialValues(normalizedValues);
      reset(normalizedValues);
    }

    setMessage({ type: "success", text: "Pressukit-hlekkir vistaðir." });
    setIsSaving(false);
  });

  return (
    <div className={styles.card}>
      <form onSubmit={onSubmit} className={styles.fieldset}>
        <div className={styles.fieldGroupStacked}>
          <p className={controls.helper}>
            Búðu til sérsniðna Dropbox niðurhals- eða möppuhlekkja með þínum eigin heitum og stuttum
            lýsingum. Notaðu þennan lista fyrir möppur, PDF, ZIP-skrár eða annað efni sem
            bransalið gæti þurft.
          </p>
          <div className={styles.actions}>
            <button type="button" className={styles.secondaryButton} onClick={addLink}>
              Bæta við hlekk
            </button>
          </div>
        </div>

        {isLoading && (
          <div className={styles.emptyState}>Hleð vistaðum pressukit-hlekkjum…</div>
        )}

        {!isLoading && fields.length === 0 && (
          <p className={controls.helper}>
            Bættu við einum eða fleiri hlekkjum til að birta þá á opinberu Pressukit-síðunni.
          </p>
        )}

        {fields.map((field, index) => (
          <div key={field.id} className={styles.fieldGroupStacked}>
            <div className={styles.fieldGroup} style={{ alignItems: "flex-start" }}>
              <TextField
                label="Titill"
                placeholder="Full Press Kit (ZIP)"
                {...register(`links.${index}.label` as const)}
                error={errors.links?.[index]?.label}
              />
              <SelectField
                label="Tegund hnapps"
                {...register(`links.${index}.mode` as const)}
                error={errors.links?.[index]?.mode}
              >
                <option value="download">Download</option>
                <option value="open">Open</option>
              </SelectField>
              <button
                type="button"
                className={styles.secondaryButton}
                onClick={() => remove(index)}
              >
                Fjarlægja
              </button>
            </div>
            <TextareaField
              label="Lýsing"
              placeholder="Stutt lýsing sem birtist undir heitinu."
              rows={2}
              {...register(`links.${index}.helper` as const)}
              error={errors.links?.[index]?.helper}
            />
            <TextField
              label="Slóð (URL)"
              placeholder="https://www.dropbox.com/..."
              {...register(`links.${index}.url` as const)}
              error={errors.links?.[index]?.url}
            />
          </div>
        ))}

        {message && (
          <div
            className={clsx(styles.messageBar, {
              [styles.messageSuccess]: message.type === "success",
              [styles.messageError]: message.type === "error",
            })}
          >
            {message.text}
          </div>
        )}

        <div className={styles.actions}>
          <button
            type="submit"
            className={styles.primaryButton}
            disabled={isSaving || isSubmitting}
          >
            {isSaving || isSubmitting ? "Vista…" : "Vista pressukit-hlekki"}
          </button>
          <button
            type="button"
            className={styles.secondaryButton}
            onClick={() => reset(initialValues)}
            disabled={isSubmitting || isSaving || isLoading}
          >
            Hætta við breytingar
          </button>
        </div>
      </form>
    </div>
  );
}

function sanitizeFormValues(values: PressKitFormValues): PressKitFormValues {
  const sanitizedLinks = (values.links ?? [])
    .map((link) => {
      const label = typeof link.label === "string" ? link.label.trim() : "";
      const helper = typeof link.helper === "string" ? link.helper.trim() : "";
      const url = typeof link.url === "string" ? link.url.trim() : "";
      const id = typeof link.id === "string" && link.id.trim().length > 0 ? link.id : undefined;
      const mode = link.mode === "open" || link.mode === "download" ? link.mode : "download";

      if (!label && !url) {
        return null;
      }

      const entry: { id?: string; label: string; helper?: string; url: string; mode: "download" | "open" } = {
        id,
        label,
        url,
        mode,
      };

      if (helper) {
        entry.helper = helper;
      }

      return entry;
    })
    .filter((link): link is NonNullable<typeof link> => Boolean(link));

  return { links: sanitizedLinks };
}
