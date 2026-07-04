import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { ExamItem } from '../types';
import { getAppSettings } from '../utils/appSettings';
import {
  nowMs,
  formatClockInZone,
  parseZonedTime,
  isNetworkTimeEnabled,
  isTimeSyncReady,
} from '../utils/timeSource';
import { useExamNotify } from '../hooks/useExamNotify';
import { useExamSync } from '../hooks/useExamSync';
import { startTimeSyncManager } from '../utils/timeSync';

const waitingHintStyle: React.CSSProperties = {
  color: 'rgba(255,255,255,0.76)',
  fontSize: '14px',
  textAlign: 'center',
  maxWidth: '540px',
  lineHeight: 1.7,
};

const syncErrorStyle: React.CSSProperties = {
  color: '#ffb3b3',
  fontSize: '13px',
  textAlign: 'center',
  maxWidth: '560px',
};

const emptyActionsStyle: React.CSSProperties = {
  display: 'flex',
  gap: '12px',
  flexWrap: 'wrap',
  justifyContent: 'center',
};

const notifyDialogBackdropStyle: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  zIndex: 9999,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'rgba(0, 0, 0, 0.55)',
  backdropFilter: 'blur(4px)',
  animation: 'exam-notify-backdrop-in 0.2s ease-out both',
};

const notifyIconStyle: React.CSSProperties = {
  fontSize: '56px',
  lineHeight: 1,
  marginBottom: '16px',
};

const notifyTitleStyle: React.CSSProperties = {
  fontSize: '32px',
  fontWeight: 800,
  letterSpacing: '1px',
};

const notifyMessageStyle: React.CSSProperties = {
  marginTop: '14px',
  fontSize: '20px',
  lineHeight: 1.7,
  color: 'rgba(255,255,255,0.96)',
};

const notifyButtonStyle: React.CSSProperties = {
  marginTop: '24px',
  padding: '12px 24px',
  borderRadius: '999px',
  border: '1px solid rgba(255,255,255,0.32)',
  background: 'rgba(255,255,255,0.16)',
  color: '#fff',
  fontSize: '16px',
  fontWeight: 700,
  cursor: 'pointer',
};

const waitingDetailStyle: React.CSSProperties = {
  color: 'rgba(255,255,255,0.78)',
};

function requestTimeSyncNow() {
  window.dispatchEvent(new CustomEvent('timeSync:syncNow'));
}

function pad(n: number) {
  return String(Math.floor(n)).padStart(2, '0');
}

function formatHMS(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;

  return h > 0
    ? `${pad(h)}:${pad(m)}:${pad(sec)}`
    : `${pad(m)}:${pad(sec)}`;
}

function pickActiveExam(items: ExamItem[]): ExamItem | null {
  const now = nowMs();
  const enabled = items.filter((e) => e.enabled);

  const ongoing = enabled.find(
    (e) => now >= parseZonedTime(e.startTime) && now <= parseZonedTime(e.endTime)
  );

  if (ongoing) return ongoing;

  const upcoming = enabled
    .filter(
      (e) =>
        parseZonedTime(e.startTime) > now &&
        parseZonedTime(e.startTime) - now <= 24 * 3600 * 1000
    )
    .sort((a, b) => parseZonedTime(a.startTime) - parseZonedTime(b.startTime));

  if (upcoming.length) return upcoming[0];

  return enabled.sort((a, b) => a.order - b.order)[0] ?? null;
}

function getOverlayGradient(level: 'info' | 'warning' | 'critical' | 'success') {
  switch (level) {
    case 'critical':
      return 'linear-gradient(135deg, #b71c1c, #f4511e)';
    case 'warning':
      return 'linear-gradient(135deg, #ef6c00, #ffb300)';
    case 'success':
      return 'linear-gradient(135deg, #1b5e20, #43a047)';
    default:
      return 'linear-gradient(135deg, #1565c0, #42a5f5)';
  }
}

function getNotifyBannerStyle(color: string): React.CSSProperties {
  return {
    background: `${color}22`,
    border: `1px solid ${color}66`,
    boxShadow: `0 10px 24px ${color}22`,
  };
}

function getNotifyCardStyle(level: 'info' | 'warning' | 'critical' | 'success'): React.CSSProperties {
  return {
    width: 'min(720px, 88vw)',
    borderRadius: '24px',
    padding: '32px 28px',
    textAlign: 'center',
    color: '#fff',
    background: getOverlayGradient(level),
    boxShadow: '0 24px 80px rgba(0,0,0,0.38)',
    border: '1px solid rgba(255,255,255,0.22)',
    animation:
      'exam-notify-pop 0.32s cubic-bezier(0.34, 1.56, 0.64, 1) both, exam-notify-pulse 1.8s ease-in-out 0.4s infinite alternate',
  };
}

function getProgressBarStyle(pct: number, barColor: string): React.CSSProperties {
  return {
    width: `${pct}%`,
    background: barColor,
    boxShadow: `0 0 24px ${barColor}55`,
  };
}

export default function ExamPage() {
  const navigate = useNavigate();

  const [tick, setTick] = useState(0);
  const [exam, setExam] = useState<ExamItem | null>(null);
  const [timeReady, setTimeReady] = useState(
    () => !isNetworkTimeEnabled() || isTimeSyncReady()
  );
  const [lastSyncError, setLastSyncError] = useState('');

  const { notification, dismiss } = useExamNotify(exam);

  const refreshExamState = () => {
    const settings = getAppSettings();
    const ready = !settings.general.timeSync.enabled || isTimeSyncReady();

    setTimeReady(ready);
    setLastSyncError(settings.general.timeSync.lastError ?? '');

    if (!ready) {
      setExam(null);
      return;
    }

    setExam(pickActiveExam(settings.exam?.items ?? []));
  };

  useEffect(() => {
    refreshExamState();

    const stop = startTimeSyncManager();
    const onTimeSyncUpdated = () => refreshExamState();

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
    onUpdate: () => refreshExamState(),
    intervalMs: 30_000,
  });

  useEffect(() => {
    if (!timeReady) return;

    const id = setInterval(() => setTick((t) => t + 1), 1000);

    return () => clearInterval(id);
  }, [timeReady]);

  useEffect(() => {
    if (!timeReady) return;

    setExam(pickActiveExam(getAppSettings().exam?.items ?? []));
  }, [tick, timeReady]);

  const examTitle = getAppSettings().exam?.title ?? '';

  const phaseData = useMemo(() => {
    if (!timeReady || !exam) {
      return {
        phase: 'waiting' as 'waiting' | 'ongoing' | 'ended',
        progress: 0,
        remainingMs: 0,
        elapsedMs: 0,
        totalMs: 0,
        clockStr: '',
      };
    }

    const startMs = parseZonedTime(exam.startTime);
    const endMs = parseZonedTime(exam.endTime);
    const t = nowMs();
    const totalMs = Math.max(0, endMs - startMs);
    const clockStr = formatClockInZone(t);

    if (t < startMs) {
      return {
        phase: 'waiting' as const,
        progress: 0,
        remainingMs: startMs - t,
        elapsedMs: 0,
        totalMs,
        clockStr,
      };
    }

    if (t <= endMs) {
      const elapsedMs = t - startMs;
      const remainingMs = endMs - t;

      return {
        phase: 'ongoing' as const,
        progress: totalMs > 0 ? Math.min(1, elapsedMs / totalMs) : 1,
        remainingMs,
        elapsedMs,
        totalMs,
        clockStr,
      };
    }

    return {
      phase: 'ended' as const,
      progress: 1,
      remainingMs: 0,
      elapsedMs: totalMs,
      totalMs,
      clockStr,
    };
  }, [exam, tick, timeReady]);

  const pct = Math.round(phaseData.progress * 100);

  const barColor =
    phaseData.phase === 'ended'
      ? '#6c757d'
      : pct >= 90
        ? '#e74c3c'
        : pct >= 75
          ? '#f39c12'
          : '#2ecc71';

  if (!timeReady) {
    return (
      <div className="exam-page">
        <div className="exam-topbar">
          <button className="exam-topbar__btn" onClick={() => navigate('/')}>
            ← 返回主界面
          </button>

          <button className="exam-topbar__btn" onClick={() => navigate('/admin')}>
            ⚙ 考试管理
          </button>
        </div>

        <div className="exam-center">
          <div className="exam-empty">
            <div className="exam-empty__icon">🛰️</div>

            <p className="exam-empty__text">正在同步中国标准时间…</p>

            <p style={waitingHintStyle}>
              当前已禁用本地时间，考试页面会在校时成功后再开始显示倒计时与提醒。
            </p>

            {lastSyncError ? (
              <p style={syncErrorStyle}>最近一次同步失败：{lastSyncError}</p>
            ) : null}

            <div style={emptyActionsStyle}>
              <button className="exam-empty__btn" onClick={() => requestTimeSyncNow()}>
                立即重试同步
              </button>

              <button className="exam-empty__btn" onClick={() => navigate('/admin')}>
                前往考试管理
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="exam-page">
      {notification && (
        <>
          <style>{`
            @keyframes exam-notify-pop {
              0% { opacity: 0; transform: scale(0.82) translateY(12px); }
              100% { opacity: 1; transform: scale(1) translateY(0); }
            }
            @keyframes exam-notify-pulse {
              from { box-shadow: 0 24px 80px rgba(0,0,0,0.38); }
              to { box-shadow: 0 24px 96px rgba(0,0,0,0.5); }
            }
            @keyframes exam-notify-backdrop-in {
              from { opacity: 0; }
              to { opacity: 1; }
            }
            @keyframes exam-notify-banner-in {
              from { opacity: 0; transform: translateY(-100%); }
              to { opacity: 1; transform: translateY(0); }
            }
          `}</style>

          <div
            className="exam-notify-banner"
            role="alert"
            style={getNotifyBannerStyle(notification.color)}
          >
            <span className="exam-notify-banner__icon">{notification.icon}</span>
            <span className="exam-notify-banner__msg">{notification.message}</span>

            <button className="exam-notify-banner__close" onClick={dismiss}>
              ×
            </button>
          </div>

          <div
            role="alertdialog"
            aria-live="assertive"
            aria-modal="false"
            onClick={dismiss}
            style={notifyDialogBackdropStyle}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={getNotifyCardStyle(notification.level)}
            >
              <div style={notifyIconStyle}>{notification.icon}</div>

              <div style={notifyTitleStyle}>{notification.title}</div>

              <div style={notifyMessageStyle}>{notification.message}</div>

              <button onClick={dismiss} style={notifyButtonStyle}>
                知道了
              </button>
            </div>
          </div>
        </>
      )}

      <div className="exam-topbar">
        <button className="exam-topbar__btn" onClick={() => navigate('/')}>
          ← 返回主界面
        </button>

        <button className="exam-topbar__btn" onClick={() => navigate('/admin')}>
          ⚙ 考试管理
        </button>
      </div>

      <div className="exam-center">
        <div className="exam-clock" aria-label="当前时间">
          {phaseData.clockStr}
        </div>

        {exam ? (
          <>
            {examTitle && <div className="exam-master-title">{examTitle}</div>}

            <div className="exam-name">{exam.name}</div>

            <div className={`exam-status exam-status--${phaseData.phase}`}>
              {phaseData.phase === 'waiting' &&
                `距开始 ${formatHMS(phaseData.remainingMs)}`}

              {phaseData.phase === 'ongoing' &&
                `剩余时间 ${formatHMS(phaseData.remainingMs)}`}

              {phaseData.phase === 'ended' && '考试已结束'}
            </div>

            {phaseData.phase !== 'waiting' && (
              <div
                className="exam-progress-wrap"
                role="progressbar"
                aria-valuenow={pct}
                aria-valuemin={0}
                aria-valuemax={100}
              >
                <div
                  className="exam-progress-bar"
                  style={getProgressBarStyle(pct, barColor)}
                />

                <span className="exam-progress-label">{pct}%</span>
              </div>
            )}

            {phaseData.phase === 'ongoing' && (
              <div className="exam-time-detail">
                已用 {formatHMS(phaseData.elapsedMs)} &nbsp;/&nbsp; 共{' '}
                {formatHMS(phaseData.totalMs)}
              </div>
            )}

            {phaseData.phase === 'waiting' && (
              <div className="exam-time-detail" style={waitingDetailStyle}>
                开考前将触发 15 分钟提醒、开考提醒、结束前 15 分钟提醒与结束提醒
              </div>
            )}
          </>
        ) : (
          <div className="exam-empty">
            <div className="exam-empty__icon">📋</div>

            <p className="exam-empty__text">暂无考试安排</p>

            <button className="exam-empty__btn" onClick={() => navigate('/admin')}>
              前往考试管理添加
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
