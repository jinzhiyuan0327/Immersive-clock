import type { HTMLAttributes } from "react";

import { classNames } from "../utils/classNames";

import styles from "./primitives.module.css";

export interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  lines?: number;
}

export function Skeleton({ lines = 1, className, ...props }: SkeletonProps) {
  return (
    <div className={classNames(styles.skeletonStack, className)} aria-hidden="true" {...props}>
      {Array.from({ length: lines }).map((_, index) => (
        <span
          className={styles.skeleton}
          key={index}
          style={{ width: index === lines - 1 && lines > 1 ? "68%" : undefined }}
        />
      ))}
    </div>
  );
}
