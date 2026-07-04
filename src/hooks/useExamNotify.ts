import { useEffect, useRef, useState } from 'react';
import type { ExamItem } from '../types';
import { nowMs, parseZonedTime } from '../utils/timeSource';

export type NotifyPhase = 'before15' | 'before5' | 'started' | 'ending15' | 'ended';
export type NotifyLevel = 'info' | 'warning' | 'critical' | 'success';

export interface ExamNotification {
  phase: NotifyPhase;
  level: NotifyLevel;
  title: string;
  message: string;
  color: string;
  icon: string;
  durationMs: number;
  exam: ExamItem;
  id: string;
}

const NOTIFY_CONFIG: Record<
  NotifyPhase,
  {
    title: string;
    level: NotifyLevel;
    message: (name: string) => string;
    color: string;
    icon: string;
    durationMs: number;
  }
> = {
  before15: {
    title: '开考提醒',
    level: 'warning',
    message: (name) => `距「${name}」开考还有 15 分钟，请提前进入状态并准备好考试用品`,
    color: '#ff9800',
    icon: '📣',
    durationMs: 15_000,
  },
  before5: {
    title: '即将开考',
    level: 'critical',
    message: (name) => `距「${name}」开考还有 5 分钟，请立即就座并完成最后检查`,
    color: '#ff5722',
    icon: '⏰',
    durationMs: 20_000,
  },
  started: {
    title: '考试开始',
    level: 'critical',
    message: (name) => `「${name}」现在开始，请立即开始作答`,
    color: '#e53935',
    icon: '🚨',
    durationMs: 25_000,
  },
  ending15: {
    title: '结束提醒',
    level: 'critical',
    message: (name) => `「${name}」距离结束还有 15 分钟，请尽快检查答卷`,
    color: '#d32f2f',
    icon: '⚠️',
    durationMs: 25_000,
  },
  ended: {
    title: '考试结束',
    level: 'success',
    message: (name) => `「${name}」考试已结束，请立即停笔`,
    color: '#2e7d32',
    icon: '✅',
    durationMs: 25_000,
  },
};

function getCheckpoints(exam: ExamItem): Array<{ phase: NotifyPhase; triggerAt: number }> {
  const startMs = parseZonedTime(exam.startTime);
  const endMs = parseZonedTime(exam.endTime);

  return [
    { phase: 'before15', triggerAt: startMs - 15 * 60 * 1000 },
    { phase: 'before5', triggerAt: startMs - 5 * 60 * 1000 },
    { phase: 'started', triggerAt: startMs },
    { phase: 'ending15', triggerAt: endMs - 15 * 60 * 1000 },
    { phase: 'ended', triggerAt: endMs },
  ];
}

export function useExamNotify(exam: ExamItem | null): {
  notification: ExamNotification | null;
  dismiss: () => void;
} {
  const [notification, setNotification] = useState<ExamNotification | null>(null);
  const firedRef = useRef<Set<string>>(new Set());
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!exam) {
      setNotification(null);
      return;
    }

    function check() {
      if (!exam) return;

      const now = nowMs();

      for (const { phase, triggerAt } of getCheckpoints(exam)) {
        const key = `${exam.id}_${phase}`;

        if (firedRef.current.has(key)) continue;
        if (now < triggerAt) continue;

        if (now - triggerAt > 60_000) {
          firedRef.current.add(key);
          continue;
        }

        firedRef.current.add(key);
        const config = NOTIFY_CONFIG[phase];

        setNotification({
          phase,
          level: config.level,
          title: config.title,
          message: config.message(exam.name),
          color: config.color,
          icon: config.icon,
          durationMs: config.durationMs,
          exam,
          id: key,
        });

        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => setNotification(null), config.durationMs);
        break;
      }
    }

    check();
    const id = setInterval(check, 1_000);

    return () => {
      clearInterval(id);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [exam?.id]);

  function dismiss() {
    setNotification(null);
    if (timerRef.current) clearTimeout(timerRef.current);
  }

  return { notification, dismiss };
}
