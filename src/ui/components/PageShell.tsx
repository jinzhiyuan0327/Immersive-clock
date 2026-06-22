import type { HTMLAttributes, ReactNode } from "react";

import { classNames } from "../utils/classNames";

import styles from "./primitives.module.css";

export interface PageShellProps extends HTMLAttributes<HTMLDivElement> {
  sidebar?: ReactNode;
  topbar?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
}

export function PageShell({
  sidebar,
  topbar,
  footer,
  children,
  className,
  ...props
}: PageShellProps) {
  return (
    <div
      className={classNames(styles.pageShell, sidebar && styles.pageShellWithSidebar, className)}
      {...props}
    >
      {sidebar && <aside className={styles.pageShellSidebar}>{sidebar}</aside>}
      <div className={styles.pageShellMain}>
        {topbar && <header className={styles.pageShellTopbar}>{topbar}</header>}
        <div className={styles.pageShellBody}>{children}</div>
        {footer && <footer className={styles.pageShellFooter}>{footer}</footer>}
      </div>
    </div>
  );
}
