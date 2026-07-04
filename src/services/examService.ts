import type { ExamItem } from '../types';

/**
 * 考试数据的服务端读写封装。
 * 所有请求失败都会安全降级（返回 null），不影响本地离线使用。
 */

export interface ExamPayload {
  items: ExamItem[];
  title: string;
  updatedAt: number;
}

const API_URL = '/api/exams';

/** 从服务端拉取考试数据；失败返回 null（自动降级本地） */
export async function fetchExamsFromServer(): Promise<ExamPayload | null> {
  try {
    const res = await fetch(API_URL, {
      method: 'GET',
      headers: { 'Cache-Control': 'no-store' },
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (!data?.ok) return null;
    return {
      items: Array.isArray(data.items) ? data.items : [],
      title: typeof data.title === 'string' ? data.title : '',
      updatedAt: Number(data.updatedAt ?? 0),
    };
  } catch {
    return null;
  }
}

/** 保存考试数据到服务端；返回服务端 updatedAt 时间戳，失败返回 null */
export async function saveExamsToServer(
  items: ExamItem[],
  title = ''
): Promise<number | null> {
  try {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    const secret = (import.meta as any).env?.VITE_ADMIN_SECRET;
    if (secret) headers['Authorization'] = `Bearer ${secret}`;

    const res = await fetch(API_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify({ items, title }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (!data?.ok) return null;
    return Number(data.updatedAt ?? Date.now());
  } catch {
    return null;
  }
}
