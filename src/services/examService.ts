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
const LOGIN_URL = '/api/login';
const TOKEN_KEY = 'admin_auth_token';
const TOKEN_EXPIRES_KEY = 'admin_auth_token_expires';

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
    const token = getStoredToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(API_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify({ items, title }),
    });
    if (res.status === 401) {
      // token 失效或未登录：清除本地登录态，调用方应引导用户重新登录
      logoutAdmin();
      return null;
    }
    if (!res.ok) return null;
    const data = await res.json();
    if (!data?.ok) return null;
    return Number(data.updatedAt ?? Date.now());
  } catch {
    return null;
  }
}

/** 查询后台是否需要登录密码（即服务端是否设置了 ADMIN_SECRET） */
export async function isLoginRequired(): Promise<boolean> {
  try {
    const res = await fetch(LOGIN_URL, { method: 'GET', headers: { 'Cache-Control': 'no-store' } });
    if (!res.ok) return false;
    const data = await res.json();
    return !!data?.required;
  } catch {
    // 查询失败时保守起见不强制要求登录，避免把用户完全锁在门外
    return false;
  }
}

/**
 * 用密码登录后台。密码只在这一次请求中发送给服务端做比对，
 * 成功后只在本地保存一个有时效的签名 token（不是明文密码）。
 */
export async function loginAdmin(password: string): Promise<boolean> {
  try {
    const res = await fetch(LOGIN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok || !data?.ok) return false;
    if (data.token) {
      localStorage.setItem(TOKEN_KEY, data.token);
      localStorage.setItem(TOKEN_EXPIRES_KEY, String(data.expiresAt ?? 0));
    }
    return true;
  } catch {
    return false;
  }
}

/** 本地登录态是否有效：token 存在且未过期。过期会自动清除。 */
export function hasValidLocalToken(): boolean {
  const token = localStorage.getItem(TOKEN_KEY);
  const expires = Number(localStorage.getItem(TOKEN_EXPIRES_KEY) ?? 0);
  if (!token) return false;
  if (expires && Date.now() > expires) {
    logoutAdmin();
    return false;
  }
  return true;
}

/** 退出登录，清除本地保存的 token */
export function logoutAdmin() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(TOKEN_EXPIRES_KEY);
}

function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}
