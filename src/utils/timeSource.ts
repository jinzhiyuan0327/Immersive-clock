import { getAppSettings } from './appSettings';

/**
 * 全局固定显示时区。
 * 不依赖浏览器本地时区，避免部分 Linux 浏览器 TZ 配置为 UTC 时
 * 出现「显示时间需 +8 才正确」的偏差。
 */
export const DISPLAY_TIME_ZONE = 'Asia/Shanghai';

/** 是否启用了网络校时 */
export function isNetworkTimeEnabled(): boolean {
  try {
    return !!getAppSettings().general?.timeSync?.enabled;
  } catch {
    return false;
  }
}

/** 当前是否已经拿到可用的网络校时结果 */
export function isTimeSyncReady(): boolean {
  try {
    const timeSync = getAppSettings().general?.timeSync;

    if (!timeSync?.enabled) return true;

    return timeSync.lastSyncAt > 0 && Number.isFinite(timeSync.offsetMs);
  } catch {
    return false;
  }
}

/** 返回经校时后的当前 UTC 毫秒时间戳（与时区无关） */
export function nowMs(): number {
  const base =
    typeof performance !== 'undefined' && typeof performance.now === 'function'
      ? performance.timeOrigin + performance.now()
      : Date.now();

  try {
    const timeSync = getAppSettings().general?.timeSync;

    if (timeSync?.enabled) {
      const networkOffset = Number.isFinite(timeSync.offsetMs) ? timeSync.offsetMs : 0;
      const manualOffset = Number.isFinite(timeSync.manualOffsetMs) ? timeSync.manualOffsetMs : 0;

      return base + networkOffset + manualOffset;
    }
  } catch {
    // ignore
  }

  return base;
}

export interface ZonedParts {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
  weekday: number;
}

const WEEKDAY_MAP: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

/**
 * 用「显式时区」把 UTC 毫秒拆解为墙上时钟各字段。
 * 结果与浏览器本地时区无关。
 */
export function getZonedParts(
  ms: number,
  timeZone: string = DISPLAY_TIME_ZONE
): ZonedParts {
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    weekday: 'short',
  });

  const parts = fmt.formatToParts(new Date(ms));
  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? '';

  let hour = parseInt(get('hour'), 10);
  if (hour === 24) hour = 0;

  return {
    year: parseInt(get('year'), 10),
    month: parseInt(get('month'), 10),
    day: parseInt(get('day'), 10),
    hour,
    minute: parseInt(get('minute'), 10),
    second: parseInt(get('second'), 10),
    weekday: WEEKDAY_MAP[get('weekday')] ?? 0,
  };
}

const pad2 = (n: number) => String(n).padStart(2, '0');

/** 固定时区格式化为 HH:MM:SS */
export function formatClockInZone(
  ms: number,
  timeZone: string = DISPLAY_TIME_ZONE
): string {
  const p = getZonedParts(ms, timeZone);
  return `${pad2(p.hour)}:${pad2(p.minute)}:${pad2(p.second)}`;
}

/** 固定时区格式化为 YYYY/MM/DD HH:MM */
export function formatDateTimeInZone(
  ms: number,
  timeZone: string = DISPLAY_TIME_ZONE
): string {
  if (!Number.isFinite(ms)) return '—';

  const p = getZonedParts(ms, timeZone);
  return `${p.year}/${pad2(p.month)}/${pad2(p.day)} ${pad2(p.hour)}:${pad2(p.minute)}`;
}

/**
 * 把「无时区」的墙上时钟字符串（如 "2026-06-07T09:00:00"）
 * 按固定时区解析为 UTC 毫秒。
 */
export function parseZonedTime(
  isoLocal: string,
  timeZone: string = DISPLAY_TIME_ZONE
): number {
  if (!isoLocal) return NaN;

  const utcGuess = new Date(`${isoLocal}Z`).getTime();
  if (Number.isNaN(utcGuess)) return NaN;

  const p = getZonedParts(utcGuess, timeZone);
  const asUtcFromParts = Date.UTC(
    p.year,
    p.month - 1,
    p.day,
    p.hour,
    p.minute,
    p.second
  );
  const offset = asUtcFromParts - utcGuess;

  return utcGuess - offset;
}
