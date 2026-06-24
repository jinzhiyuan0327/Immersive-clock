import type { InputHTMLAttributes } from "react";

import styles from "./primitives.module.css";

export interface SliderProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "value" | "onChange"> {
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
  label?: string;
  formatValue?: (value: number) => string;
  rangeLabels?: [string, string];
}

export function Slider({
  value,
  min,
  max,
  step = 1,
  onChange,
  label,
  formatValue,
  rangeLabels,
  ...props
}: SliderProps) {
  const displayValue = formatValue ? formatValue(value) : String(value);

  return (
    <div className={styles.sliderRoot}>
      {label && (
        <div className={styles.sliderHeader}>
          <span className={styles.label}>{label}</span>
          <span className={styles.sliderValue}>{displayValue}</span>
        </div>
      )}
      <input
        className={styles.slider}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        {...props}
      />
      {rangeLabels && (
        <div className={styles.sliderTicks} aria-hidden="true">
          <span>{rangeLabels[0]}</span>
          <span>{rangeLabels[1]}</span>
        </div>
      )}
    </div>
  );
}
