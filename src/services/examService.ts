import type { ExamItem } from '../types';

// 从环境变量读取管理员密码，与 api/exams.ts 中的 ADMIN_SECRET 对应
// 在 .env.local 中配置 VITE_ADMIN_SECRET=你的密码
const ADMIN_SECRET = import.meta.env.VITE_ADMIN_SECRET ?? '';

/**
 * 将考试数据保存到服务端（Neon PostgreSQL）。
 * @returns 成功返回 true，失败返回 false（不抛出异常）
 */
export async function saveExamsToServer(items: ExamItem[]): Promise<boolean> {
  try {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (ADMIN_SECRET) headers['Authorization'] = `Bearer ${ADMIN_SECRET}`;

    const res = await fetch('/api/exams', {
      method: 'POST',
      headers,
      body: JSON.stringify({ items }),
    });
    const data = await res.json() as { ok: boolean };
    return data.ok === true;
  } catch {
    return false;
  }
}

/**
 * 从服务端拉取考试数据（单次，不轮询）。
 */
export async function fetchExamsFromServer(): Promise<ExamItem[] | null> {
  try {
    const res = await fetch('/api/exams', { cache: 'no-store' });
    if (!res.ok) return null;
    const data = await res.json() as { ok: boolean; items: ExamItem[] };
    return data.ok ? data.items : null;
  } catch {
    return null;
  }
}