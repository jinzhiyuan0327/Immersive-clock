import React, { useEffect, useRef, useState } from 'react';
import type { AppMode, ExamItem } from '../types';
import { getAppSettings, updateAppSettings, updateExamSettings } from '../utils/appSettings';
import { buildPresetExams } from '../data/presetExams';
import { nowMs, parseZonedTime, formatDateTimeInZone } from '../utils/timeSource';

const AUTO_ENTER_SEC = 15;
const DEFAULT_MODE: AppMode = 'study';

function getUpcomingExam(items: ExamItem[]): ExamItem | null {
  const now = nowMs();
  const enabled = items.filter(e => e.enabled);
  const ongoing = enabled.find(e =>
    now >= parseZonedTime(e.startTime) && now <= parseZonedTime(e.endTime)
  );
  if (ongoing) return ongoing;
  return enabled
    .filter(e => parseZonedTime(e.startTime) > now)
    .sort((a, b) => parseZonedTime(a.startTime) - parseZonedTime(b.startTime))[0] ?? null;
}

function formatExamTime(isoStr: string): string {
  return formatDateTimeInZone(parseZonedTime(isoStr));
}

function getExamPhaseLabel(exam: ExamItem): { label: string; color: string } {
  const now = nowMs();
  const startMs = parseZonedTime(exam.startTime);
  const endMs = parseZonedTime(exam.endTime);
  const diffMin = Math.round((startMs - now) / 60000);
  if (now >= startMs && now <= endMs) return { label: '正在进行中', color: '#27ae60' };
  if (diffMin <= 15)  return { label: `${diffMin} 分钟后开考`, color: '#e74c3c' };
  if (diffMin <= 60)  return { label: `${diffMin} 分钟后开考`, color: '#f39c12' };
  const diffH = Math.round(diffMin / 60);
  if (diffH < 24)    return { label: `${diffH} 小时后开考`, color: '#3498db' };
  return { label: `${Math.round(diffH / 24)} 天后开考`, color: '#9b59b6' };
}

interface WelcomePageProps { onSelectMode: (mode: AppMode) => void; }

export default function WelcomePage({ onSelectMode }: WelcomePageProps) {
  const [countdown, setCountdown] = useState(AUTO_ENTER_SEC);
  const [upcomingExam, setUpcomingExam] = useState<ExamItem | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const settings = getAppSettings();
    let items = settings.exam?.items ?? [];
    if (items.length === 0) { items = buildPresetExams(); updateExamSettings({ items }); }
    setUpcomingExam(getUpcomingExam(items));
  }, []);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) { handleSelect(DEFAULT_MODE); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  function handleSelect(mode: AppMode) {
    if (intervalRef.current) clearInterval(intervalRef.current);
    updateAppSettings(() => ({ hasVisited: true }));
    onSelectMode(mode);
  }

  const hasExam = !!upcomingExam;
  const modes: Array<{ mode: AppMode; label: string; desc: string; icon: string; featured?: boolean }> = [
    { mode: 'exam',      label: '考试模式', icon: '📝',
      desc: upcomingExam ? `${upcomingExam.name} · ${getExamPhaseLabel(upcomingExam).label}` : '查看考试进度与提醒',
      featured: hasExam },
    { mode: 'study',     label: '自习模式',   desc: '专注自习，日期倒计时', icon: '📚' },
    { mode: 'clock',     label: '时钟模式',   desc: '简洁全屏时钟显示',     icon: '🕐' },
    { mode: 'countdown', label: '倒计时',     desc: '自定义倒计时',         icon: '⏱️' },
    { mode: 'stopwatch', label: '秒表',       desc: '精确计时',             icon: '⏲️' },
  ];
  const sortedModes = hasExam ? modes : [...modes.slice(1), modes[0]];

  return (
    <div className="welcome-page">
      <div className="welcome-header">
        <h1 className="welcome-title">沉浸时钟</h1>
        <p className="welcome-subtitle">选择你需要的模式</p>
      </div>

      {upcomingExam && (() => {
        const phase = getExamPhaseLabel(upcomingExam);
        return (
          <div className="welcome-exam-banner" style={{ borderColor: phase.color }}>
            <span className="welcome-exam-banner__icon">📋</span>
            <div className="welcome-exam-banner__info">
              <strong>{upcomingExam.name}</strong>
              <span style={{ color: phase.color }}>{phase.label}</span>
            </div>
            <div className="welcome-exam-banner__time">
              <span>{formatExamTime(upcomingExam.startTime)}</span>
              <span>→</span>
              <span>{formatExamTime(upcomingExam.endTime)}</span>
            </div>
          </div>
        );
      })()}

      <div className={`welcome-grid${hasExam ? ' welcome-grid--has-exam' : ''}`}>
        {sortedModes.map(({ mode, label, desc, icon, featured }) => (
          <button key={mode} className={`welcome-card${featured ? ' welcome-card--featured' : ''}`} onClick={() => handleSelect(mode)}>
            <span className="welcome-card__icon">{icon}</span>
            <span className="welcome-card__label">{label}</span>
            <span className="welcome-card__desc">{desc}</span>
            {featured && upcomingExam && (
              <span className="welcome-card__badge" style={{ background: getExamPhaseLabel(upcomingExam).color }}>
                {getExamPhaseLabel(upcomingExam).label}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="welcome-footer">
        <div className="welcome-countdown">
          <svg viewBox="0 0 36 36" className="welcome-countdown__ring">
            <circle cx="18" cy="18" r="16" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="2" />
            <circle cx="18" cy="18" r="16" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="2"
              strokeDasharray={`${(countdown / AUTO_ENTER_SEC) * 100.53} 100.53`}
              strokeLinecap="round"
              style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%', transition: 'stroke-dasharray 1s linear' }}
            />
            <text x="18" y="22" textAnchor="middle" fontSize="10" fill="rgba(255,255,255,0.8)">{countdown}</text>
          </svg>
          <span>{countdown} 秒后自动进入自习模式</span>
        </div>
      </div>
    </div>
  );
}