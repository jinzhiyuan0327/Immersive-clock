import { useEffect, useRef, useState } from 'react';
import type { ExamItem } from '../types';
import { nowMs, parseZonedTime } from '../utils/timeSource';

export type NotifyPhase = 'before15' | 'before5' | 'started' | 'ending15' | 'ended';

export interface ExamNotification {
  phase: NotifyPhase; message: string; color: string; icon: string;
  exam: ExamItem; id: string;
}

const NOTIFY_CONFIG: Record<NotifyPhase, { message: (name: string) => string; color: string; icon: string }> = {
  before15: { message: n => `📋 距「${n}」开考还有 15 分钟，请做好准备`, color: '#3498db', icon: '📋' },
  before5:  { message: n => `⏰ 距「${n}」开考还有 5 分钟，请立即就座`,  color: '#f39c12', icon: '⏰' },
  started:  { message: n => `🚀 「${n}」现在开始，祝考试顺利！`,         color: '#27ae60', icon: '🚀' },
  ending15: { message: n => `⚠️ 「${n}」还剩 15 分钟，请注意检查答卷`,  color: '#e74c3c', icon: '⚠️' },
  ended:    { message: n => `✅ 「${n}」考试已结束，辛苦了！`,           color: '#6c757d', icon: '✅' },
};

function getCheckpoints(exam: ExamItem) {
  const s = parseZonedTime(exam.startTime);
  const e = parseZonedTime(exam.endTime);
  return [
    { phase: 'before15' as NotifyPhase, triggerAt: s - 15 * 60 * 1000 },
    { phase: 'before5'  as NotifyPhase, triggerAt: s -  5 * 60 * 1000 },
    { phase: 'started'  as NotifyPhase, triggerAt: s },
    { phase: 'ending15' as NotifyPhase, triggerAt: e - 15 * 60 * 1000 },
    { phase: 'ended'    as NotifyPhase, triggerAt: e },
  ];
}

export function useExamNotify(exam: ExamItem | null) {
  const [notification, setNotification] = useState<ExamNotification | null>(null);
  const firedRef = useRef<Set<string>>(new Set());
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!exam) return;
    function check() {
      if (!exam) return;
      const now = nowMs();
      for (const { phase, triggerAt } of getCheckpoints(exam)) {
        const key = `${exam.id}_${phase}`;
        if (firedRef.current.has(key)) continue;
        if (now < triggerAt) continue;
        if (now - triggerAt > 60_000) { firedRef.current.add(key); continue; }
        firedRef.current.add(key);
        const config = NOTIFY_CONFIG[phase];
        setNotification({ phase, message: config.message(exam.name), color: config.color, icon: config.icon, exam, id: key });
        const ms = (phase === 'ended' || phase === 'started') ? 20_000 : 10_000;
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => setNotification(null), ms);
        break;
      }
    }
    check();
    const id = setInterval(check, 5_000);
    return () => { clearInterval(id); if (timerRef.current) clearTimeout(timerRef.current); };
  }, [exam?.id]);

  return { notification, dismiss: () => { setNotification(null); if (timerRef.current) clearTimeout(timerRef.current); } };
}