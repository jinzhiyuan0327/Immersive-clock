import { useEffect, useRef } from 'react';
import type { ExamItem } from '../types';
import { getAppSettings, updateExamSettings } from '../utils/appSettings';
import { fetchExamsFromServer } from '../services/examService';

interface UseExamSyncOptions {
  /** 当服务端有更新并写入本地后回调，用于刷新页面状态 */
  onUpdate?: (data: { items: ExamItem[]; title: string }) => void;
  /** 轮询间隔（毫秒），默认 30s */
  intervalMs?: number;
}

/**
 * 轮询服务端考试数据，仅当服务端 updatedAt 比本地新时才应用，
 * 写入本地设置并回调 onUpdate。用于多设备实时同步（只读方向）。
 */
export function useExamSync({ onUpdate, intervalMs = 30_000 }: UseExamSyncOptions = {}) {
  const lastAppliedRef = useRef<number>(0);
  const onUpdateRef = useRef(onUpdate);
  onUpdateRef.current = onUpdate;

  useEffect(() => {
    let cancelled = false;

    async function pull() {
      const remote = await fetchExamsFromServer();
      if (cancelled || !remote) return;
      const localUpdatedAt = getAppSettings().exam?.updatedAt ?? 0;
      const baseline = Math.max(lastAppliedRef.current, localUpdatedAt);
      if (remote.updatedAt <= baseline) return;

      lastAppliedRef.current = remote.updatedAt;
      updateExamSettings({
        items: remote.items,
        title: remote.title,
        updatedAt: remote.updatedAt,
      });
      onUpdateRef.current?.({ items: remote.items, title: remote.title });
    }

    pull();
    const id = setInterval(pull, intervalMs);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [intervalMs]);
}
