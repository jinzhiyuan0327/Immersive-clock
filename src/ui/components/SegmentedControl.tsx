import type { ReactNode } from "react";

import { classNames } from "../utils/classNames";

import styles from "./primitives.module.css";

export interface SegmentedOption<TValue extends string = string> {
  value: TValue;
  label: string;
  disabled?: boolean;
  icon?: ReactNode;
}

export interface SegmentedControlProps<TValue extends string = string> {
  value: TValue;
  options: Array<SegmentedOption<TValue>>;
  onChange: (value: TValue) => void;
  label: string;
  className?: string;
}

export function SegmentedControl<TValue extends string = string>({
  value,
  options,
  onChange,
  label,
  className,
}: SegmentedControlProps<TValue>) {
  return (
    <div className={classNames(styles.segmentedRoot, className)} role="radiogroup" aria-label={label}>
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            className={classNames(styles.segmentedItem, active && styles.segmentedItemActive)}
            type="button"
            role="radio"
            aria-checked={active}
            disabled={option.disabled}
            onClick={() => onChange(option.value)}
          >
            {option.icon}
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
