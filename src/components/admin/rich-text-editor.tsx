"use client";

import { useCallback, useEffect, useRef } from "react";
import type { FieldError } from "react-hook-form";
import controls from "./form-controls.module.scss";

type RichTextEditorProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  helperText?: string;
  error?: FieldError;
  placeholder?: string;
};

const TOOLBAR_ACTIONS: Array<{ label: string; command: string }> = [
  { label: "Bold", command: "bold" },
  { label: "Italic", command: "italic" },
  { label: "Underline", command: "underline" },
  { label: "Bullet list", command: "insertUnorderedList" },
];

export function RichTextEditor({
  label,
  value,
  onChange,
  helperText,
  error,
  placeholder,
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!editorRef.current) return;
    if (editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value;
    }
  }, [value]);

  const applyFormat = useCallback(
    (command: string) => {
      document.execCommand(command, false);
      onChange(editorRef.current?.innerHTML ?? "");
    },
    [onChange],
  );

  const handleInput = () => {
    onChange(editorRef.current?.innerHTML ?? "");
  };

  return (
    <div className={controls.formField}>
      <label className={controls.label}>{label}</label>
      <div className={controls.richTextToolbar}>
        {TOOLBAR_ACTIONS.map((action) => (
          <button
            key={action.command}
            type="button"
            aria-label={action.label}
            className={controls.richTextButton}
            onClick={() => applyFormat(action.command)}
          >
            {action.label}
          </button>
        ))}
      </div>
      <div
        ref={editorRef}
        className={controls.richTextEditor}
        contentEditable
        suppressContentEditableWarning
        data-placeholder={placeholder}
        onInput={handleInput}
        onBlur={handleInput}
      />
      {helperText && !error && <span className={controls.helper}>{helperText}</span>}
      {error && <span className={controls.error}>{error.message}</span>}
    </div>
  );
}
