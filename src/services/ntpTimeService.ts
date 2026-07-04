import { getAppSettings, updateTimeSyncSettings } from '../utils/appSettings';

export interface NtpSyncResult {
  offsetMs: number; rttMs: number; provider: string;
  syncedAt: number; ok: boolean; error?: string;
}

export async function syncNtpTime(provider?: string): Promise<NtpSyncResult> {
  const T1 = Date.now();
  try {
    const url = provider ? `/api/ntp-time?provider=${encodeURIComponent(provider)}` : '/api/ntp-time';
    const res = await fetch(url, { cache: 'no-store', signal: AbortSignal.timeout(6000) });
    const T4 = Date.now();
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json() as {
      serverTime: number; serverReceiveTime: number; rtt: number;
      provider: string; ok: boolean; error?: string;
    };
    const offsetMs = Math.round(((data.serverReceiveTime - T1) + (data.serverTime - T4)) / 2);
    const rttMs = T4 - T1;
    const result: NtpSyncResult = { offsetMs, rttMs, provider: data.provider, syncedAt: Date.now(), ok: data.ok, error: data.error };
    updateTimeSyncSettings({ offsetMs, lastSyncAt: result.syncedAt, lastRttMs: rttMs, lastError: data.error });
    return result;
  } catch (err) {
    const error = String(err);
    updateTimeSyncSettings({ lastError: error });
    return { offsetMs: 0, rttMs: 0, provider: 'none', syncedAt: Date.now(), ok: false, error };
  }
}

export function startAutoNtpSync(): () => void {
  const settings = getAppSettings().general?.timeSync;
  if (!settings?.autoSyncEnabled) return () => {};
  const intervalMs = (settings.autoSyncIntervalSec || 3600) * 1000;
  syncNtpTime().catch(() => {});
  const timer = setInterval(() => syncNtpTime().catch(() => {}), intervalMs);
  return () => clearInterval(timer);
}

export function getAdjustedTime(): number {
  const base = typeof performance !== 'undefined'
    ? performance.timeOrigin + performance.now() : Date.now();
  try {
    const offset = getAppSettings().general?.timeSync?.offsetMs || 0;
    return base + offset;
  } catch { return base; }
}