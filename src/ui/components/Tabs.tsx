import type { ReactNode } from "react";

import { classNames } from "../utils/classNames";

import styles from "./primitives.module.css";

export interface TabItem<TValue extends string = string> {
  value: TValue;
  label: string;
  icon?: ReactNode;
  disabled?: boolean;
}

export interface TabsProps<TValue extends string = string> {
  value: TValue;
  items: Array<TabItem<TValue>>;
  onChange: (value: TValue) => void;
  label: string;
  className?: string;
}

export function Tabs<TValue extends string = string>({
  value,
  items,
  onChange,
  label,
  className,
}: TabsProps<TValue>) {
  return (
    <div className={classNames(styles.tabs, className)} role="tablist" aria-label={label}>
      {items.map((item) => {
        const active = item.value === value;
        return (
          <button
            key={item.value}
            className={classNames(styles.tabButton, active && styles.tabButtonActive)}
            type="button"
            role="tab"
            aria-selected={active}
            disabled={item.disabled}
            onClick={() => onChange(item.value)}
          >
            {item.icon}
            <span>{item.label}</span>
          </button>
        );
      })}
    </div>
  );
}
