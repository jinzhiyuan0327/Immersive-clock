import { Minus, Plus, Search, SwatchBook } from "lucide-react";
import type { ChangeEvent, InputHTMLAttributes } from "react";
import { useId } from "react";

import { classNames } from "../utils/classNames";

import { IconButton } from "./IconButton";
import styles from "./primitives.module.css";

export interface SearchInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: string;
  hint?: string;
  onClear?: () => void;
}

export function SearchInput({ label, hint, onClear, className, id, value, ...props }: SearchInputProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;

  return (
    <div className={styles.field}>
      {(label || hint) && (
        <div className={styles.fieldLabelRow}>
          {label && (
            <label className={styles.label} htmlFor={inputId}>
              {label}
            </label>
          )}
          {hint && <span className={styles.hint}>{hint}</span>}
        </div>
      )}
      <div className={classNames(styles.searchInput, className)}>
        <Search size={16} aria-hidden="true" />
        <input id={inputId} type="search" value={value} {...props} />
        {onClear && value ? (
          <button type="button" onClick={onClear}>
            清除
          </button>
        ) : null}
      </div>
    </div>
  );
}

export interface NumberInputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "value" | "onChange"> {
  label?: string;
  hint?: string;
  value: number;
  min?: number;
  max?: number;
  step?: number;
  suffix?: string;
  onChange: (value: number) => void;
}

export function NumberInput({
  label,
  hint,
  value,
  min,
  max,
  step = 1,
  suffix,
  onChange,
  className,
  id,
  ...props
}: NumberInputProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;

  const commitValue = (nextValue: number) => {
    const minChecked = typeof min === "number" ? Math.max(min, nextValue) : nextValue;
    const maxChecked = typeof max === "number" ? Math.min(max, minChecked) : minChecked;
    onChange(maxChecked);
  };

  return (
    <div className={styles.field}>
      {(label || hint) && (
        <div className={styles.fieldLabelRow}>
          {label && (
            <label className={styles.label} htmlFor={inputId}>
              {label}
            </label>
          )}
          {hint && <span className={styles.hint}>{hint}</span>}
        </div>
      )}
      <div className={classNames(styles.numberInput, className)}>
        <IconButton
          aria-label="减少"
          icon={<Minus size={14} />}
          disabled={typeof min === "number" && value <= min}
          onClick={() => commitValue(value - step)}
        />
        <input
          id={inputId}
          type="number"
          value={value}
          min={min}
          max={max}
          step={step}
          onChange={(event) => commitValue(Number(event.target.value))}
          {...props}
        />
        {suffix && <span className={styles.numberSuffix}>{suffix}</span>}
        <IconButton
          aria-label="增加"
          icon={<Plus size={14} />}
          disabled={typeof max === "number" && value >= max}
          onClick={() => commitValue(value + step)}
        />
      </div>
    </div>
  );
}

export interface ColorPickerProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: string;
  hint?: string;
  presets?: string[];
}

export function ColorPicker({
  label,
  hint,
  presets = ["#2FECC6", "#63C4E8", "#D7A541", "#EF6B73", "#EAECF0"],
  className,
  id,
  value,
  onChange,
  ...props
}: ColorPickerProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;

  return (
    <div className={styles.field}>
      {(label || hint) && (
        <div className={styles.fieldLabelRow}>
          {label && (
            <label className={styles.label} htmlFor={inputId}>
              {label}
            </label>
          )}
          {hint && <span className={styles.hint}>{hint}</span>}
        </div>
      )}
      <div className={classNames(styles.colorPicker, className)}>
        <label className={styles.colorPickerInput} htmlFor={inputId}>
          <SwatchBook size={15} aria-hidden="true" />
          <span style={{ background: String(value ?? "#2FECC6") }} />
          <input id={inputId} type="color" value={value} onChange={onChange} {...props} />
        </label>
        <div className={styles.colorPresets} aria-label="预设颜色">
          {presets.map((preset) => (
            <button
              key={preset}
              type="button"
              aria-label={`选择颜色 ${preset}`}
              style={{ background: preset }}
              onClick={() => {
                const event = {
                  target: { value: preset },
                  currentTarget: { value: preset },
                } as unknown as ChangeEvent<HTMLInputElement>;
                onChange?.(event);
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
