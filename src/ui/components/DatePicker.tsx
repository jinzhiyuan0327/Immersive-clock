import { ChevronLeft, ChevronRight } from "lucide-react";
import { useMemo, useState } from "react";

import { IconButton } from "./IconButton";
import styles from "./primitives.module.css";

export interface DatePickerProps {
  value?: Date;
  onChange?: (value: Date) => void;
  label?: string;
}

const weekDays = ["一", "二", "三", "四", "五", "六", "日"];

function sameDay(first: Date, second: Date) {
  return (
    first.getFullYear() === second.getFullYear() &&
    first.getMonth() === second.getMonth() &&
    first.getDate() === second.getDate()
  );
}

function startOfMonthGrid(month: Date) {
  const firstDay = new Date(month.getFullYear(), month.getMonth(), 1);
  const mondayIndex = (firstDay.getDay() + 6) % 7;
  const start = new Date(firstDay);
  start.setDate(firstDay.getDate() - mondayIndex);
  return start;
}

export function DatePicker({ value, onChange, label = "选择日期" }: DatePickerProps) {
  const selectedDate = value ?? new Date();
  const [visibleMonth, setVisibleMonth] = useState(
    () => new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1),
  );

  const days = useMemo(() => {
    const start = startOfMonthGrid(visibleMonth);
    return Array.from({ length: 42 }).map((_, index) => {
      const date = new Date(start);
      date.setDate(start.getDate() + index);
      return date;
    });
  }, [visibleMonth]);

  const shiftMonth = (offset: number) => {
    setVisibleMonth((current) => new Date(current.getFullYear(), current.getMonth() + offset, 1));
  };

  return (
    <div className={styles.datePicker} aria-label={label}>
      <header className={styles.datePickerHeader}>
        <IconButton icon={<ChevronLeft size={16} />} aria-label="上个月" onClick={() => shiftMonth(-1)} />
        <strong>
          {visibleMonth.getFullYear()} 年 {visibleMonth.getMonth() + 1} 月
        </strong>
        <IconButton icon={<ChevronRight size={16} />} aria-label="下个月" onClick={() => shiftMonth(1)} />
      </header>
      <div className={styles.datePickerGrid}>
        {weekDays.map((day) => (
          <span className={styles.datePickerWeekday} key={day}>
            {day}
          </span>
        ))}
        {days.map((day) => {
          const active = sameDay(day, selectedDate);
          const muted = day.getMonth() !== visibleMonth.getMonth();
          return (
            <button
              className={styles.datePickerDay}
              data-active={active || undefined}
              data-muted={muted || undefined}
              key={day.toISOString()}
              type="button"
              onClick={() => onChange?.(day)}
            >
              {day.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}
