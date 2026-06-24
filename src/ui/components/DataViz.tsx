import type { HTMLAttributes } from "react";

import { classNames } from "../utils/classNames";

import styles from "./primitives.module.css";

export interface SparklineProps extends HTMLAttributes<SVGSVGElement> {
  values: number[];
  label: string;
  min?: number;
  max?: number;
}

export interface BarMeterProps extends HTMLAttributes<HTMLDivElement> {
  values: number[];
  label: string;
  max?: number;
}

function normalizeValues(values: number[], min?: number, max?: number) {
  const low = min ?? Math.min(...values, 0);
  const high = max ?? Math.max(...values, 1);
  const range = Math.max(high - low, 1);

  return values.map((value) => Math.min(1, Math.max(0, (value - low) / range)));
}

export function Sparkline({ values, label, min, max, className, ...props }: SparklineProps) {
  const safeValues = values.length > 0 ? values : [0];
  const normalized = normalizeValues(safeValues, min, max);
  const points = normalized
    .map((value, index) => {
      const x = normalized.length === 1 ? 100 : (index / (normalized.length - 1)) * 100;
      const y = 100 - value * 84 - 8;
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(" ");

  return (
    <svg
      className={classNames(styles.sparklineRoot, className)}
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      role="img"
      aria-label={label}
      {...props}
    >
      <polyline className={styles.sparklineLine} points={points} />
    </svg>
  );
}

export function BarMeter({ values, label, max, className, ...props }: BarMeterProps) {
  const safeMax = Math.max(max ?? Math.max(...values, 1), 1);

  return (
    <div className={classNames(styles.barMeter, className)} role="img" aria-label={label} {...props}>
      {values.map((value, index) => (
        <span
          className={styles.barMeterBar}
          key={`${value}-${index}`}
          style={{ height: `${Math.max(12, Math.min(100, (value / safeMax) * 100))}%` }}
        />
      ))}
    </div>
  );
}
