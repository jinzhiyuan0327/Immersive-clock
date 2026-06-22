import type { InputHTMLAttributes } from "react";
import { useId } from "react";

import { classNames } from "../utils/classNames";

import styles from "./primitives.module.css";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;
}

export function Input({ label, hint, error, className, id, ...props }: InputProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const hintId = hint ? `${inputId}-hint` : undefined;
  const errorId = error ? `${inputId}-error` : undefined;

  return (
    <div className={styles.field}>
      {(label || hint) && (
        <div className={styles.fieldLabelRow}>
          {label && (
            <label className={styles.label} htmlFor={inputId}>
              {label}
            </label>
          )}
          {hint && (
            <span className={styles.hint} id={hintId}>
              {hint}
            </span>
          )}
        </div>
      )}
      <input
        className={classNames(styles.input, error && styles.inputError, className)}
        id={inputId}
        aria-invalid={error ? true : undefined}
        aria-describedby={classNames(hintId, errorId) || undefined}
        {...props}
      />
      {error && (
        <span className={styles.errorText} id={errorId}>
          {error}
        </span>
      )}
    </div>
  );
}
