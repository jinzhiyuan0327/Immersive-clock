import { Upload } from "lucide-react";
import type {
  ChangeEvent,
  HTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
  TextareaHTMLAttributes,
} from "react";
import { useId, useRef } from "react";

import { classNames } from "../utils/classNames";

import { Button } from "./Button";
import styles from "./primitives.module.css";

export interface FormSectionProps extends HTMLAttributes<HTMLElement> {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
}

export function FormSection({
  title,
  description,
  action,
  children,
  className,
  ...props
}: FormSectionProps) {
  return (
    <section className={classNames(styles.formSection, className)} {...props}>
      <header className={styles.formSectionHeader}>
        <div>
          <h3 className={styles.formSectionTitle}>{title}</h3>
          {description && <p className={styles.formSectionDescription}>{description}</p>}
        </div>
        {action && <div className={styles.formSectionAction}>{action}</div>}
      </header>
      <div className={styles.formSectionBody}>{children}</div>
    </section>
  );
}

export interface FormRowProps extends HTMLAttributes<HTMLDivElement> {
  columns?: 1 | 2 | 3;
  children: ReactNode;
}

export function FormRow({ columns = 2, children, className, ...props }: FormRowProps) {
  return (
    <div
      className={classNames(
        styles.formRow,
        columns === 1 && styles.formRowOne,
        columns === 3 && styles.formRowThree,
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export interface ButtonGroupProps extends HTMLAttributes<HTMLDivElement> {
  align?: "start" | "end" | "stretch";
  children: ReactNode;
}

export function ButtonGroup({ align = "end", children, className, ...props }: ButtonGroupProps) {
  return (
    <div
      className={classNames(
        styles.buttonGroup,
        align === "start" && styles.buttonGroupStart,
        align === "stretch" && styles.buttonGroupStretch,
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  hint?: string;
  error?: string;
}

export function Textarea({ label, hint, error, className, id, ...props }: TextareaProps) {
  const generatedId = useId();
  const textareaId = id ?? generatedId;
  const hintId = hint ? `${textareaId}-hint` : undefined;
  const errorId = error ? `${textareaId}-error` : undefined;

  return (
    <div className={styles.field}>
      {(label || hint) && (
        <div className={styles.fieldLabelRow}>
          {label && (
            <label className={styles.label} htmlFor={textareaId}>
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
      <textarea
        className={classNames(styles.textarea, error && styles.inputError, className)}
        id={textareaId}
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

export interface FilePickerProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "value" | "onChange"> {
  label?: string;
  hint?: string;
  error?: string;
  buttonLabel?: string;
  placeholder?: string;
  fileName?: string;
  onFileChange?: (file: File | undefined) => void;
}

export function FilePicker({
  label,
  hint,
  error,
  buttonLabel = "选择文件",
  placeholder = "未选择文件",
  fileName,
  className,
  id,
  disabled,
  onFileChange,
  ...props
}: FilePickerProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const hintId = hint ? `${inputId}-hint` : undefined;
  const errorId = error ? `${inputId}-error` : undefined;
  const inputRef = useRef<HTMLInputElement>(null);

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    onFileChange?.(event.target.files?.[0]);
  };

  return (
    <div className={classNames(styles.field, className)}>
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
      <div className={classNames(styles.filePicker, error && styles.inputError)}>
        <span className={classNames(styles.filePickerName, !fileName && styles.filePickerEmpty)}>
          {fileName || placeholder}
        </span>
        <Button
          disabled={disabled}
          icon={<Upload size={14} />}
          onClick={() => inputRef.current?.click()}
          size="sm"
          variant="secondary"
        >
          {buttonLabel}
        </Button>
        <input
          ref={inputRef}
          className={styles.fileInput}
          disabled={disabled}
          id={inputId}
          onChange={handleChange}
          type="file"
          aria-describedby={classNames(hintId, errorId) || undefined}
          {...props}
        />
      </div>
      {error && (
        <span className={styles.errorText} id={errorId}>
          {error}
        </span>
      )}
    </div>
  );
}
