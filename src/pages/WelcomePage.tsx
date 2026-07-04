import React, { useEffect, useRef, useState } from 'react';
import type { AppMode, ExamItem } from '../types';
import { getAppSettings, updateAppSettings, updateExamSettings } from '../utils/appSettings';
import { buildPresetExams } from '../data/presetExams';
import {
  nowMs,
  parseZonedTime,
  formatDateTimeInZone,
  isNetworkTimeEnabled,
  isTimeSyncReady,
} from '../utils/timeSource';
import { useExamSync } from '../hooks/useExamSync';
import { startTimeSyncManager } from '../utils/timeSync';

const AUTO_ENTER_SEC = 25;

type ModeCard = {
  mode: AppMode;
  label: string;
  desc: string;
  icon: string;
  featured?: boolean;
};

const syncBannerStyle: React.CSSProperties = {
  border: '1px solid rgba(255,255,255,0.14)',
  background: 'rgba(17, 24, 39, 0.88)',
  boxShadow: '0 12px 30px rgba(0, 0, 0, 0.22)',
};

const syncTextStyle: React.CSSProperties = {
  color: 'rgba(255,255,255,0.78)',
};

const syncTimeStyle: React.CSSProperties = {
  alignItems: 'flex-end',
};

const syncErrorStyle: React.CSSProperties = {
  color: '#ffb3b3',
};

const syncOkStyle: React.CSSProperties = {
  color: '#9fe6b8',
};

const countdownRingStyle: React.CSSProperties = {
  transform: 'rotate(-90deg)',
  transformOrigin: '50% 50%',
  transition: 'stroke-dasharray 0.3s ease',
};

function requestTimeSyncNow() {
  window.dispatchEvent(new CustomEvent('timeSync:syncNow'));
}

function getUpcomingExam(items: ExamItem[]): ExamItem | null {
  const now = nowMs();
  const enabled = items.filter((e) => e.enabled);

  const ongoing = enabled.find(
    (e) => now >= parseZonedTime(e.startTime) && now <= parseZonedTime(e.endTime)
  );

  if (ongoing) return ongoing;

  return (
    enabled
      .filter((e) => parseZonedTime(e.startTime) > now)
      .sort((a, b) => parseZonedTime(a.startTime) - parseZonedTime(b.startTime))[0] ?? null
  );
}

function formatExamTime(isoStr: string): string {
  return formatDateTimeInZone(parseZonedTime(isoStr));
}

function getExamPhaseLabel(exam: ExamItem): { label: string; color: string } {
  const now = nowMs();
  const startMs = parseZonedTime(exam.startTime);
  const endMs = parseZonedTime(exam.endTime);
  const diffMin = Math.round((startMs - now) / 60000);

  if (now >= startMs && now <= endMs) {
    return { label: '正在进行中', color: '#27ae60' };
  }

  if (diffMin <= 15) {
    return { label: `${diffMin} 分钟后开考`, color: '#e74c3c' };
  }

  if (diffMin <= 60) {
    return { label: `${diffMin} 分钟后开考`, color: '#f39c12' };
  }

  const diffH = Math.round(diffMin / 60);

  if (diffH < 24) {
    return { label: `${diffH} 小时后开考`, color: '#3498db' };
  }

  return { label: `${Math.round(diffH / 24)} 天后开考`, color: '#9b59b6' };
}

function getExamBannerStyle(color: string): React.CSSProperties {
  return {
    border: `1px solid ${color}55`,
    boxShadow: `0 10px 30px ${color}22`,
  };
}

function getPhaseTextStyle(color: string): React.CSSProperties {
  return {
    color,
  };
}

function getBadgeStyle(color: string): React.CSSProperties {
  return {
    background: `${color}22`,
    color,
    border: `1px solid ${color}55`,
  };
}

interface WelcomePageProps {
  onSelectMode: (mode: AppMode) => void;
}

export default function WelcomePage({ onSelectMode }: WelcomePageProps) {
  const [countdown, setCountdown] = useState(AUTO_ENTER_SEC);
  const [upcomingExam, setUpcomingExam] = useState<ExamItem | null>(null);
  const [timeReady, setTimeReady] = useState(() => !isNetworkTimeEnabled() || isTimeSyncReady());
  const [lastSyncError, setLastSyncError] = useState('');
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const refreshUpcomingExam = () => {
    const settings = getAppSettings();
    const networkTimeEnabled = !!settings.general?.timeSync?.enabled;
    const ready = !networkTimeEnabled || isTimeSyncReady();

    setTimeReady(ready);
    setLastSyncError(settings.general.timeSync.lastError ?? '');

    let items = settings.exam?.items ?? [];

    if (items.length === 0) {
      items = buildPresetExams();
      updateExamSettings({ items });
    }

    if (!ready) {
      setUpcomingExam(null);
      return;
    }

    setUpcomingExam(getUpcomingExam(items));
  };

  useEffect(() => {
    refreshUpcomingExam();

    const stop = startTimeSyncManager();
    const onTimeSyncUpdated = () => refreshUpcomingExam();

    window.addEventListener('timeSync:updated', onTimeSyncUpdated);

    if (isNetworkTimeEnabled()) {
      requestTimeSyncNow();
    }

    return () => {
      window.removeEventListener('timeSync:updated', onTimeSyncUpdated);
      stop();
    };
  }, []);

  useExamSync({
    onUpdate: () => refreshUpcomingExam(),
    intervalMs: 30_000,
  });

  useEffect(() => {
    if (!timeReady) return;

    setCountdown(AUTO_ENTER_SEC);

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    intervalRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          handleSelect(upcomingExam ? 'exam' : 'study');
          return 0;
        }

        return prev - 1;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [timeReady, upcomingExam?.id]);

  function handleSelect(mode: AppMode) {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    updateAppSettings(() => ({ hasVisited: true }));
    onSelectMode(mode);
  }

  const hasExam = !!upcomingExam;

  const modes: ModeCard[] = [
    {
      mode: 'exam',
      label: '考试模式',
      icon: '📝',
      desc: upcomingExam
        ? `${upcomingExam.name} · ${getExamPhaseLabel(upcomingExam).label}`
        : '查看考试进度与提醒',
      featured: hasExam,
    },
    { mode: 'study', label: '自习模式', desc: '专注自习，日期倒计时', icon: '📚' },
    { mode: 'clock', label: '时钟模式', desc: '简洁全屏时钟显示', icon: '🕐' },
    { mode: 'countdown', label: '倒计时', desc: '自定义倒计时', icon: '⏱️' },
    { mode: 'stopwatch', label: '秒表', desc: '精确计时', icon: '⏲️' },
  ];

  const sortedModes = hasExam ? modes : [...modes.slice(1), modes[0]];
  const countdownValue = timeReady ? countdown : AUTO_ENTER_SEC;

  return (
    <div className="welcome-page">
      <div className="welcome-header">
        <h1 className="welcome-title">沉浸时钟</h1>
        <p className="welcome-subtitle">选择你需要的模式</p>
      </div>

      {!timeReady && (
        <div className="welcome-exam-banner" style={syncBannerStyle}>
          <span className="welcome-exam-banner__icon">🛰️</span>

          <div className="welcome-exam-banner__info">
            <strong>正在同步中国标准时间</strong>
            <span style={syncTextStyle}>已切换为网络校时，倒计时将在同步完成后开始</span>
          </div>

          <div className="welcome-exam-banner__time" style={syncTimeStyle}>
            <span>网页端：/api/time ｜ 桌面端：国内 NTP</span>
            {lastSyncError ? (
              <span style={syncErrorStyle}>{lastSyncError}</span>
            ) : (
              <span style={syncOkStyle}>同步中…</span>
            )}
          </div>
        </div>
      )}

      {upcomingExam && timeReady && (() => {
        const phase = getExamPhaseLabel(upcomingExam);

        return (
          <div className="welcome-exam-banner" style={getExamBannerStyle(phase.color)}>
            <span className="welcome-exam-banner__icon">📋</span>

            <div className="welcome-exam-banner__info">
              <strong>{upcomingExam.name}</strong>
              <span style={getPhaseTextStyle(phase.color)}>{phase.label}</span>
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
          <button
            key={mode}
            className={`welcome-card${featured ? ' welcome-card--featured' : ''}`}
            onClick={() => handleSelect(mode)}
          >
            <span className="welcome-card__icon">{icon}</span>
            <span className="welcome-card__label">{label}</span>
            <span className="welcome-card__desc">{desc}</span>

            {featured && upcomingExam && timeReady && (
              <span
                className="welcome-card__badge"
                style={getBadgeStyle(getExamPhaseLabel(upcomingExam).color)}
              >
                {getExamPhaseLabel(upcomingExam).label}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="welcome-footer">
        <div className="welcome-countdown">
          <svg viewBox="0 0 36 36" className="welcome-countdown__ring">
            <circle
              cx="18"
              cy="18"
              r="16"
              fill="none"
              stroke="rgba(255,255,255,0.1)"
              strokeWidth="2"
            />
            <circle
              cx="18"
              cy="18"
              r="16"
              fill="none"
              stroke="rgba(255,255,255,0.6)"
              strokeWidth="2"
              strokeDasharray={`${(countdownValue / AUTO_ENTER_SEC) * 100.53} 100.53`}
              strokeLinecap="round"
              style={countdownRingStyle}
            />
            <text
              x="18"
              y="22"
              textAnchor="middle"
              fontSize="10"
              fill="rgba(255,255,255,0.8)"
            >
              {timeReady ? countdown : '…'}
            </text>
          </svg>

          <span>
            {timeReady
              ? `${countdown} 秒后自动进入${hasExam ? '考试模式' : '自习模式'}`
              : '正在等待中国标准时间同步完成…'}
          </span>
        </div>
      </div>
    </div>
  );
}
