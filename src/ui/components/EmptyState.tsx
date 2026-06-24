import type { HTMLAttributes, ReactNode } from "react";

import { classNames } from "../utils/classNames";

import styles from "./primitives.module.css";

export interface EmptyStateProps extends HTMLAttributes<HTMLDivElement> {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
  ...props
}: EmptyStateProps) {
  return (
    <div className={classNames(styles.emptyState, className)} {...props}>
      {icon && <span className={styles.emptyStateIcon}>{icon}</span>}
      <div className={styles.emptyStateContent}>
        <strong>{title}</strong>
        {description && <span>{description}</span>}
      </div>
      {action && <div className={styles.emptyStateAction}>{action}</div>}
    </div>
  );
}
