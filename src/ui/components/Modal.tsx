import { X } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect } from "react";
import { createPortal } from "react-dom";

import { classNames } from "../utils/classNames";

import { Button } from "./Button";
import styles from "./primitives.module.css";

export interface ModalProps {
  isOpen: boolean;
  title: string;
  children: ReactNode;
  onClose: () => void;
  footer?: ReactNode;
  width?: "sm" | "md" | "lg";
  className?: string;
}

const widthMap: Record<NonNullable<ModalProps["width"]>, string> = {
  sm: "420px",
  md: "560px",
  lg: "720px",
};

export function Modal({
  isOpen,
  title,
  children,
  onClose,
  footer,
  width = "md",
  className,
}: ModalProps) {
  useEffect(() => {
    if (!isOpen) return undefined;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div className={styles.modalBackdrop} role="presentation" onMouseDown={onClose}>
      <section
        className={classNames(styles.modalPanel, className)}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        style={{ width: `min(100%, ${widthMap[width]})` }}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>{title}</h2>
          <button className={styles.closeButton} type="button" aria-label="关闭" onClick={onClose}>
            <X size={18} aria-hidden="true" />
          </button>
        </header>
        <div className={styles.modalBody}>{children}</div>
        {footer && <footer className={styles.modalFooter}>{footer}</footer>}
      </section>
    </div>,
    document.body
  );
}

export function ModalActions({ children }: { children: ReactNode }) {
  return <div className={styles.settingsFooter}>{children}</div>;
}

export function ConfirmActions({ onCancel, onConfirm }: { onCancel: () => void; onConfirm: () => void }) {
  return (
    <>
      <Button variant="secondary" onClick={onCancel}>
        取消
      </Button>
      <Button variant="primary" onClick={onConfirm}>
        确认
      </Button>
    </>
  );
}
