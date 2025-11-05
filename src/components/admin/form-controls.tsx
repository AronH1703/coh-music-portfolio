"use client";

import { forwardRef } from "react";
import type { FieldError } from "react-hook-form";
import clsx from "clsx";
import styles from "./form-controls.module.scss";

type BaseFieldProps = {
  label: string;
  name: string;
  error?: FieldError;
  helperText?: string;
};

type TextFieldProps = BaseFieldProps &
  React.InputHTMLAttributes<HTMLInputElement>;

export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(
  ({ label, name, error, helperText, className, ...props }, ref) => {
    return (
      <div className={styles.formField}>
        <label className={styles.label} htmlFor={name}>
          {label}
        </label>
        <input
          id={name}
          name={name}
          ref={ref}
          className={clsx(styles.input, className)}
          {...props}
        />
        {helperText && !error && (
          <span className={styles.helper}>{helperText}</span>
        )}
        {error && <span className={styles.error}>{error.message}</span>}
      </div>
    );
  },
);

TextField.displayName = "TextField";

type TextareaFieldProps = BaseFieldProps &
  React.TextareaHTMLAttributes<HTMLTextAreaElement>;

export const TextareaField = forwardRef<
  HTMLTextAreaElement,
  TextareaFieldProps
>(({ label, name, error, helperText, className, rows = 4, ...props }, ref) => {
  return (
    <div className={styles.formField}>
      <label className={styles.label} htmlFor={name}>
        {label}
      </label>
      <textarea
        id={name}
        name={name}
        ref={ref}
        className={clsx(styles.textarea, className)}
        rows={rows}
        {...props}
      />
      {helperText && !error && (
        <span className={styles.helper}>{helperText}</span>
      )}
      {error && <span className={styles.error}>{error.message}</span>}
    </div>
  );
});

TextareaField.displayName = "TextareaField";

type ToggleFieldProps = {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
  helperText?: string;
};

export function ToggleField({
  label,
  checked,
  onChange,
  helperText,
}: ToggleFieldProps) {
  return (
    <div className={styles.toggle}>
      <div>
        <div className={styles.label}>{label}</div>
        {helperText && <div className={styles.helper}>{helperText}</div>}
      </div>
      <label className={styles.toggleSwitch}>
        <input
          type="checkbox"
          className={styles.toggleInput}
          checked={checked}
          onChange={(event) => onChange(event.target.checked)}
        />
        <span className={styles.toggleKnob} aria-hidden />
      </label>
    </div>
  );
}

type SelectFieldProps = BaseFieldProps &
  React.SelectHTMLAttributes<HTMLSelectElement>;

export const SelectField = forwardRef<HTMLSelectElement, SelectFieldProps>(
  ({ label, name, error, helperText, className, children, ...props }, ref) => {
    return (
      <div className={styles.formField}>
        <label className={styles.label} htmlFor={name}>
          {label}
        </label>
        <select
          id={name}
          name={name}
          ref={ref}
          className={clsx(styles.select, className)}
          {...props}
        >
          {children}
        </select>
        {helperText && !error && (
          <span className={styles.helper}>{helperText}</span>
        )}
        {error && <span className={styles.error}>{error.message}</span>}
      </div>
    );
  },
);

SelectField.displayName = "SelectField";
