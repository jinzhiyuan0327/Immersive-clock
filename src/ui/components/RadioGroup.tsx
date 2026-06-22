import type { ReactNode } from "react";
import { useId } from "react";

import styles from "./primitives.module.css";

export interface RadioOption<TValue extends string = string> {
  value: TValue;
  label: ReactNode;
  disabled?: boolean;
}

export interface RadioGroupProps<TValue extends string = string> {
  value: TValue;
  options: Array<RadioOption<TValue>>;
  onChange: (value: TValue) => void;
  label: string;
  name?: string;
}

export function RadioGroup<TValue extends string = string>({
  value,
  options,
  onChange,
  label,
  name,
}: RadioGroupProps<TValue>) {
  const generatedName = useId();
  const groupName = name ?? generatedName;

  return (
    <div className={styles.radioGroup} role="radiogroup" aria-label={label}>
      {options.map((option) => (
        <label key={option.value} className={styles.radioRow}>
          <input
            className={styles.radioInput}
            type="radio"
            name={groupName}
            value={option.value}
            checked={option.value === value}
            disabled={option.disabled}
            onChange={() => onChange(option.value)}
          />
          <span className={styles.radioDot} aria-hidden="true" />
          <span>{option.label}</span>
        </label>
      ))}
    </div>
  );
}
