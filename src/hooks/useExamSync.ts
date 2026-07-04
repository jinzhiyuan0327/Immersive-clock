import { useEffect, useRef } from 'react';
import type { ExamItem } from '../types';
import { updateExamSettings } from '../utils/appSettings';

const POLL_INTERVAL_MS = 30_000; // 每 30 秒轮询一次，可按需调整

interface UseExamSyncOptions {
  /** 收到新数据时的回调，传入最新 items */
  onUpdate: (items: ExamItem[]) => void;
  /** 是否启用轮询，默认 true */
  enabled?: boolean;
  /** 轮询间隔（毫秒），默认 30000 */
  intervalMs?: number;
}

/**
 * 定时从服务端拉取最新考试数据。
 * - 首次挂载立即拉取一次
 * - 之后每隔 intervalMs 拉取一次
 * - 与上次数据相同时不触发 onUpdate（用 updatedAt 时间戳判断）
 */
export function useExamSync({
  onUpdate,
  enabled = true,
  intervalMs = POLL_INTERVAL_MS,
}: UseExamSyncOptions) {
  const lastUpdatedAtRef = useRef<number>(0);
  const onUpdateRef = useRef(onUpdate);
  onUpdateRef.current = onUpdate;

  useEffect(() => {
    if (!enabled) return;

    async function fetchExams() {
      try {
        const res = await fetch('/api/exams', { cache: 'no-store' });
        if (!res.ok) return;
        const data = (await res.json()) as {
          ok: boolean;
          items: ExamItem[];
          updatedAt: number;
        };
        if (!data.ok) return;

        // 仅当服务端数据比上次新时才更新
        if (data.updatedAt > lastUpdatedAtRef.current) {
          lastUpdatedAtRef.current = data.updatedAt;
          // 同步到 localStorage（供断网时回退）
          updateExamSettings({ items: data.items });
          onUpdateRef.current(data.items);
        }
      } catch {
        // 网络错误时静默失败，继续使用本地缓存
      }
    }

    // 立即执行一次
    fetchExams();
    // 之后定时执行
    const timer = setInterval(fetchExams, intervalMs);
    return () => clearInterval(timer);
  }, [enabled, intervalMs]);
}