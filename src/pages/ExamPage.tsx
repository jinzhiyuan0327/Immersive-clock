import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { ExamItem } from '../types';
import { getAppSettings } from '../utils/appSettings';
import { nowMs, formatClockInZone, parseZonedTime } from '../utils/timeSource';
import { useExamNotify } from '../hooks/useExamNotify';
import { useExamSync } from '../hooks/useExamSync';

function pad(n: number) { return String(Math.floor(n)).padStart(2, '0'); }
function formatHMS(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
  return h > 0 ? `${pad(h)}:${pad(m)}:${pad(sec)}` : `${pad(m)}:${pad(sec)}`;
}
// 时钟显示改用固定时区格式化（formatClockInZone），不再依赖浏览器本地时区

function pickActiveExam(items: ExamItem[]): ExamItem | null {
  const now = nowMs();
  const enabled = items.filter(e => e.enabled);
  const ongoing = enabled.find(e => now >= parseZonedTime(e.startTime) && now <= parseZonedTime(e.endTime));
  if (ongoing) return ongoing;
  const upcoming = enabled
    .filter(e => parseZonedTime(e.startTime) > now && parseZonedTime(e.startTime) - now <= 24 * 3600 * 1000)
    .sort((a, b) => parseZonedTime(a.startTime) - parseZonedTime(b.startTime));
  if (upcoming.length) return upcoming[0];
  return enabled.sort((a, b) => a.order - b.order)[0] ?? null;
}

export default function ExamPage() {
  const navigate = useNavigate();
  const [tick, setTick] = useState(0);
  const [exam, setExam] = useState<ExamItem | null>(null);
  const { notification, dismiss } = useExamNotify(exam);

  // 多设备同步：每 30s 拉取服务端，有更新则刷新当前考试
  useExamSync({
    onUpdate: () => setExam(pickActiveExam(getAppSettings().exam?.items ?? [])),
    intervalMs: 30_000,
  });

  useEffect(() => { const id = setInterval(() => setTick(t => t + 1), 1000); return () => clearInterval(id); }, []);
  useEffect(() => { setExam(pickActiveExam(getAppSettings().exam?.items ?? [])); }, [tick]);

  const clockStr = formatClockInZone(nowMs());
  const examTitle = getAppSettings().exam?.title ?? '';

  let phase: 'waiting' | 'ongoing' | 'ended' = 'waiting';
  let progress = 0, remainingMs = 0, elapsedMs = 0, totalMs = 0;

  if (exam) {
    const startMs = parseZonedTime(exam.startTime);
    const endMs = parseZonedTime(exam.endTime);
    const t = nowMs();
    totalMs = endMs - startMs;
    if (t < startMs) { phase = 'waiting'; remainingMs = startMs - t; }
    else if (t <= endMs) { phase = 'ongoing'; elapsedMs = t - startMs; remainingMs = endMs - t; progress = Math.min(1, elapsedMs / totalMs); }
    else { phase = 'ended'; progress = 1; }
  }

  const pct = Math.round(progress * 100);
  const barColor = phase === 'ended' ? '#6c757d' : pct >= 90 ? '#e74c3c' : pct >= 75 ? '#f39c12' : '#2ecc71';

  return (
    <div className="exam-page">
      {notification && (
        <div className="exam-notify-banner" role="alert">
          <span className="exam-notify-banner__icon">{notification.icon}</span>
          <span className="exam-notify-banner__msg">{notification.message}</span>
          <button className="exam-notify-banner__close" onClick={dismiss}>×</button>
        </div>
      )}

      {/* 顶部操作栏：返回主界面 / 考试管理 */}
      <div className="exam-topbar">
        <button className="exam-topbar__btn" onClick={() => navigate('/')}>← 返回主界面</button>
        <button className="exam-topbar__btn" onClick={() => navigate('/admin')}>⚙ 考试管理</button>
      </div>

      <div className="exam-center">
        <div className="exam-clock" aria-label="当前时间">{clockStr}</div>
        {exam ? (
          <>
            {examTitle && <div className="exam-master-title">{examTitle}</div>}
            <div className="exam-name">{exam.name}</div>
            <div className={`exam-status exam-status--${phase}`}>
              {phase === 'waiting' && `距开始 ${formatHMS(remainingMs)}`}
              {phase === 'ongoing' && `剩余时间 ${formatHMS(remainingMs)}`}
              {phase === 'ended' && '考试已结束'}
            </div>
            {phase !== 'waiting' && (
              <div className="exam-progress-wrap" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
                <div className="exam-progress-bar" style={{ width: `${pct}%`, background: barColor }} />
                <span className="exam-progress-label">{pct}%</span>
              </div>
            )}
            {phase === 'ongoing' && (
              <div className="exam-time-detail">已用 {formatHMS(elapsedMs)} &nbsp;/&nbsp; 共 {formatHMS(totalMs)}</div>
            )}
          </>
        ) : (
          <div className="exam-empty">
            <div className="exam-empty__icon">📋</div>
            <p className="exam-empty__text">暂无考试安排</p>
            <button className="exam-empty__btn" onClick={() => navigate('/admin')}>前往考试管理添加</button>
          </div>
        )}
      </div>
    </div>
  );
}