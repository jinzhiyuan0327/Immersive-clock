import { AlertTriangle, CheckCircle2, Info, X, XCircle } from "lucide-react";
import type { ReactNode } from "react";

import { classNames } from "../utils/classNames";

import styles from "./primitives.module.css";

export type ToastVariant = "success" | "info" | "warning" | "danger";

export interface ToastProps {
  variant?: ToastVariant;
  title: string;
  description?: string;
  action?: ReactNode;
  onClose?: () => void;
  className?: string;
}

const variantClassMap: Record<ToastVariant, string> = {
  success: styles.toastSuccess,
  info: styles.toastInfo,
  warning: styles.toastWarning,
  danger: styles.toastDanger,
};

const iconMap: Record<ToastVariant, ReactNode> = {
  success: <CheckCircle2 size={17} aria-hidden="true" />,
  info: <Info size={17} aria-hidden="true" />,
  warning: <AlertTriangle size={17} aria-hidden="true" />,
  danger: <XCircle size={17} aria-hidden="true" />,
};

export function Toast({
  variant = "info",
  title,
  description,
  action,
  onClose,
  className,
}: ToastProps) {
  return (
    <section
      className={classNames(styles.toast, variantClassMap[variant], className)}
      role="status"
      aria-live="polite"
    >
      <span className={styles.toastIcon}>{iconMap[variant]}</span>
      <div className={styles.toastContent}>
        <strong>{title}</strong>
        {description && <span>{description}</span>}
      </div>
      {action && <div className={styles.toastAction}>{action}</div>}
      {onClose && (
        <button className={styles.toastClose} type="button" aria-label="关闭提示" onClick={onClose}>
          <X size={15} aria-hidden="true" />
        </button>
      )}
    </section>
  );
}
