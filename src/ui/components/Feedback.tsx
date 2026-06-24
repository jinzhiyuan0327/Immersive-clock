import { AlertTriangle, Bug, Trash2 } from "lucide-react";
import type { ReactNode } from "react";
import { createContext, useCallback, useContext, useMemo, useState } from "react";

import { Button } from "./Button";
import { Modal } from "./Modal";
import styles from "./primitives.module.css";
import { Toast, type ToastProps } from "./Toast";

export interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  description?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: "default" | "danger";
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  isOpen,
  title,
  description,
  confirmLabel = "确认",
  cancelLabel = "取消",
  tone = "default",
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <Modal
      isOpen={isOpen}
      title={title}
      width="sm"
      onClose={onCancel}
      footer={
        <>
          <Button variant="secondary" onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button variant={tone === "danger" ? "danger" : "primary"} onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div className={styles.confirmDialogBody} data-tone={tone}>
        <span className={styles.confirmDialogIcon}>
          {tone === "danger" ? <Trash2 size={18} aria-hidden="true" /> : <AlertTriangle size={18} aria-hidden="true" />}
        </span>
        {description && <p>{description}</p>}
      </div>
    </Modal>
  );
}

export interface ErrorBoundaryViewProps {
  title?: string;
  description?: string;
  action?: ReactNode;
}

export function ErrorBoundaryView({
  title = "页面出现异常",
  description = "请稍后重试，或回到上一层页面继续操作。",
  action,
}: ErrorBoundaryViewProps) {
  return (
    <section className={styles.errorBoundaryView} role="alert">
      <span>
        <Bug size={22} aria-hidden="true" />
      </span>
      <strong>{title}</strong>
      <p>{description}</p>
      {action && <div>{action}</div>}
    </section>
  );
}

export interface ToastRecord extends ToastProps {
  id: string;
}

export interface ToastContextValue {
  toasts: ToastRecord[];
  showToast: (toast: Omit<ToastRecord, "id"> & { id?: string }) => string;
  dismissToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export interface ToastProviderProps {
  children: ReactNode;
  initialToasts?: ToastRecord[];
}

export function ToastProvider({ children, initialToasts = [] }: ToastProviderProps) {
  const [toasts, setToasts] = useState<ToastRecord[]>(initialToasts);

  const dismissToast = useCallback((id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback((toast: Omit<ToastRecord, "id"> & { id?: string }) => {
    const id = toast.id ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    setToasts((current) => [...current, { ...toast, id }]);
    return id;
  }, []);

  const contextValue = useMemo(
    () => ({ toasts, showToast, dismissToast }),
    [dismissToast, showToast, toasts],
  );

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <ToastViewport toasts={toasts} onDismiss={dismissToast} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error("useToast must be used inside ToastProvider");
  }

  return context;
}

export interface ToastViewportProps {
  toasts: ToastRecord[];
  onDismiss: (id: string) => void;
}

export function ToastViewport({ toasts, onDismiss }: ToastViewportProps) {
  if (toasts.length === 0) return null;

  return (
    <div className={styles.toastViewport} role="region" aria-label="通知">
      {toasts.map((toast) => (
        <Toast key={toast.id} {...toast} onClose={() => onDismiss(toast.id)} />
      ))}
    </div>
  );
}
