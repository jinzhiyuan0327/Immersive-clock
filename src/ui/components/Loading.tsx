import type { HTMLAttributes } from "react";

import { classNames } from "../utils/classNames";

import styles from "./primitives.module.css";

export type LoadingSize = "sm" | "md" | "lg";

export interface LoadingProps extends HTMLAttributes<HTMLDivElement> {
  label?: string;
  size?: LoadingSize;
}

const sizeClassMap: Record<LoadingSize, string> = {
  sm: styles.loadingSm,
  md: styles.loadingMd,
  lg: styles.loadingLg,
};

export function Loading({ label = "正在加载", size = "md", className, ...props }: LoadingProps) {
  return (
    <div className={classNames(styles.loading, className)} role="status" {...props}>
      <span className={classNames(styles.loadingSpinner, sizeClassMap[size])} aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}
