import type { HTMLAttributes, ReactNode } from "react";
import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";

import { classNames } from "../utils/classNames";

import styles from "./primitives.module.css";

export interface PortalProps {
  children: ReactNode;
  container?: Element | DocumentFragment;
}

export function Portal({ children, container }: PortalProps) {
  if (typeof document === "undefined") return null;

  return createPortal(children, container ?? document.body);
}

export interface FocusTrapProps extends HTMLAttributes<HTMLDivElement> {
  active?: boolean;
  children: ReactNode;
}

const focusableSelector = [
  "a[href]",
  "button:not([disabled])",
  "textarea:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

export function FocusTrap({ active = true, children, className, ...props }: FocusTrapProps) {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!active) return undefined;

    const root = rootRef.current;
    if (!root) return undefined;

    const previousActiveElement = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const focusable = Array.from(root.querySelectorAll<HTMLElement>(focusableSelector));
    focusable[0]?.focus({ preventScroll: true });

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Tab") return;

      const nodes = Array.from(root.querySelectorAll<HTMLElement>(focusableSelector)).filter(
        (node) => node.offsetParent !== null,
      );

      if (nodes.length === 0) {
        event.preventDefault();
        return;
      }

      const first = nodes[0];
      const last = nodes[nodes.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      previousActiveElement?.focus({ preventScroll: true });
    };
  }, [active]);

  return (
    <div ref={rootRef} className={classNames(styles.focusTrap, className)} {...props}>
      {children}
    </div>
  );
}

export type VisuallyHiddenProps = HTMLAttributes<HTMLSpanElement>;

export function VisuallyHidden({ className, ...props }: VisuallyHiddenProps) {
  return <span className={classNames(styles.visuallyHidden, className)} {...props} />;
}

export interface KeyboardShortcutProps extends HTMLAttributes<HTMLSpanElement> {
  keys: string[];
  label?: string;
}

export function KeyboardShortcut({ keys, label, className, ...props }: KeyboardShortcutProps) {
  return (
    <span
      className={classNames(styles.keyboardShortcut, className)}
      aria-label={label ?? keys.join(" ")}
      {...props}
    >
      {keys.map((key) => (
        <kbd key={key}>{key}</kbd>
      ))}
    </span>
  );
}
