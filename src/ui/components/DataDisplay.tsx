import { ArrowDownAZ, ArrowUpAZ, Filter, X } from "lucide-react";
import type { CSSProperties, ReactNode } from "react";

import { classNames } from "../utils/classNames";

import { SearchInput } from "./AdvancedInputs";
import { Badge } from "./Badge";
import styles from "./primitives.module.css";

export interface FilterChip {
  value: string;
  label: string;
  active?: boolean;
}

export interface FilterBarProps {
  searchValue: string;
  searchPlaceholder?: string;
  chips?: FilterChip[];
  onSearchChange: (value: string) => void;
  onChipToggle?: (value: string) => void;
  onClear?: () => void;
  actions?: ReactNode;
  className?: string;
}

export function FilterBar({
  searchValue,
  searchPlaceholder = "搜索",
  chips = [],
  onSearchChange,
  onChipToggle,
  onClear,
  actions,
  className,
}: FilterBarProps) {
  return (
    <div className={classNames(styles.filterBar, className)}>
      <SearchInput
        aria-label="搜索"
        value={searchValue}
        placeholder={searchPlaceholder}
        onChange={(event) => onSearchChange(event.target.value)}
        onClear={onClear}
      />
      {chips.length > 0 && (
        <div className={styles.filterChips} aria-label="过滤条件">
          {chips.map((chip) => (
            <button
              className={classNames(styles.filterChip, chip.active && styles.filterChipActive)}
              key={chip.value}
              type="button"
              aria-pressed={chip.active}
              onClick={() => onChipToggle?.(chip.value)}
            >
              <Filter size={13} aria-hidden="true" />
              {chip.label}
            </button>
          ))}
        </div>
      )}
      {actions && <div className={styles.filterActions}>{actions}</div>}
    </div>
  );
}

export type SortDirection = "asc" | "desc";

export interface SortButtonProps {
  label: string;
  direction: SortDirection;
  onChange: (direction: SortDirection) => void;
  className?: string;
}

export function SortButton({ label, direction, onChange, className }: SortButtonProps) {
  const nextDirection = direction === "asc" ? "desc" : "asc";
  const Icon = direction === "asc" ? ArrowUpAZ : ArrowDownAZ;

  return (
    <button
      className={classNames(styles.sortButton, className)}
      type="button"
      aria-label={`${label}，当前${direction === "asc" ? "升序" : "降序"}`}
      onClick={() => onChange(nextDirection)}
    >
      <Icon size={15} aria-hidden="true" />
      <span>{label}</span>
    </button>
  );
}

export interface KeyValueItem {
  key: string;
  label: string;
  value: ReactNode;
  meta?: ReactNode;
}

export interface KeyValueListProps {
  items: KeyValueItem[];
  className?: string;
}

export function KeyValueList({ items, className }: KeyValueListProps) {
  return (
    <dl className={classNames(styles.keyValueList, className)}>
      {items.map((item) => (
        <div className={styles.keyValueItem} key={item.key}>
          <dt>{item.label}</dt>
          <dd>
            <span>{item.value}</span>
            {item.meta && <small>{item.meta}</small>}
          </dd>
        </div>
      ))}
    </dl>
  );
}

export interface TimelineItem {
  id: string;
  title: string;
  time?: string;
  description?: string;
  status?: "default" | "success" | "warning" | "danger" | "accent";
}

export interface TimelineProps {
  items: TimelineItem[];
  className?: string;
}

export function Timeline({ items, className }: TimelineProps) {
  return (
    <ol className={classNames(styles.timeline, className)}>
      {items.map((item) => (
        <li className={styles.timelineItem} data-status={item.status ?? "default"} key={item.id}>
          <span className={styles.timelineDot} />
          <div className={styles.timelineContent}>
            <div className={styles.timelineHeader}>
              <strong>{item.title}</strong>
              {item.time && <time>{item.time}</time>}
            </div>
            {item.description && <p>{item.description}</p>}
          </div>
        </li>
      ))}
    </ol>
  );
}

export interface MeterProps {
  value: number;
  min?: number;
  max?: number;
  label: string;
  status?: "success" | "warning" | "danger" | "accent";
  className?: string;
}

export function Meter({ value, min = 0, max = 100, label, status = "accent", className }: MeterProps) {
  const range = max - min;
  const percent = range <= 0 ? 0 : Math.min(100, Math.max(0, ((value - min) / range) * 100));

  return (
    <div className={classNames(styles.meter, className)} data-status={status}>
      <div className={styles.meterHeader}>
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
      <div className={styles.meterTrack}>
        <span style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

export interface GaugeProps {
  value: number;
  min?: number;
  max?: number;
  label: string;
  unit?: string;
  status?: "success" | "warning" | "danger" | "accent";
  className?: string;
}

export function Gauge({ value, min = 0, max = 100, label, unit, status = "accent", className }: GaugeProps) {
  const range = max - min;
  const percent = range <= 0 ? 0 : Math.min(1, Math.max(0, (value - min) / range));
  const angle = -135 + percent * 270;

  return (
    <div className={classNames(styles.gauge, className)} data-status={status}>
      <div className={styles.gaugeDial} style={{ "--gauge-angle": `${angle}deg` } as CSSProperties}>
        <span className={styles.gaugeNeedle} />
      </div>
      <strong>
        {value}
        {unit && <span>{unit}</span>}
      </strong>
      <small>{label}</small>
    </div>
  );
}

export interface NotificationItem {
  id: string;
  title: string;
  description?: string;
  time?: string;
  unread?: boolean;
}

export interface NotificationCenterProps {
  title?: string;
  items: NotificationItem[];
  onDismiss?: (id: string) => void;
  className?: string;
}

export function NotificationCenter({
  title = "通知中心",
  items,
  onDismiss,
  className,
}: NotificationCenterProps) {
  return (
    <section className={classNames(styles.notificationCenter, className)} aria-label={title}>
      <header>
        <strong>{title}</strong>
        <Badge variant="accent">{items.filter((item) => item.unread).length}</Badge>
      </header>
      <div className={styles.notificationList}>
        {items.map((item) => (
          <article className={styles.notificationItem} data-unread={item.unread} key={item.id}>
            <div>
              <strong>{item.title}</strong>
              {item.description && <p>{item.description}</p>}
              {item.time && <time>{item.time}</time>}
            </div>
            {onDismiss && (
              <button type="button" aria-label={`关闭 ${item.title}`} onClick={() => onDismiss(item.id)}>
                <X size={14} aria-hidden="true" />
              </button>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}
