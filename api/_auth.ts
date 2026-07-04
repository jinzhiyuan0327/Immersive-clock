import { createHmac, timingSafeEqual } from 'node:crypto';

/**
 * 无状态签名 token 工具：payload.signature
 * - payload = base64url(JSON.stringify({ exp }))
 * - signature = HMAC-SHA256(payload, secret) 的 hex 编码
 *
 * 这里避免使用 `import crypto from 'crypto'` 和 Buffer 的 `base64url`
 * 运行时别名，改成更稳妥的 node:crypto + 手动 base64url 转换，
 * 以兼容 Vercel 不同 Node 运行时下的模块解析差异。
 */

function base64urlEncode(input: string): string {
  return Buffer.from(input, 'utf8')
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

function base64urlDecode(input: string): string {
  const normalized = input.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized + '='.repeat((4 - (normalized.length % 4 || 4)) % 4);
  return Buffer.from(padded, 'base64').toString('utf8');
}

export function createToken(
  secret: string,
  ttlMs = 7 * 24 * 3600 * 1000
): { token: string; expiresAt: number } {
  const expiresAt = Date.now() + ttlMs;
  const payload = base64urlEncode(JSON.stringify({ exp: expiresAt }));
  const sig = createHmac('sha256', secret).update(payload).digest('hex');
  return { token: `${payload}.${sig}`, expiresAt };
}

export function verifyToken(token: string | undefined | null, secret: string): boolean {
  if (!token || !secret) return false;

  const parts = token.split('.');
  if (parts.length !== 2) return false;

  const [payload, sig] = parts;
  if (!payload || !sig || !/^[0-9a-f]+$/i.test(sig)) return false;

  const expected = createHmac('sha256', secret).update(payload).digest('hex');
  const a = Buffer.from(sig, 'hex');
  const b = Buffer.from(expected, 'hex');

  if (a.length !== b.length) return false;
  if (!timingSafeEqual(a, b)) return false;

  try {
    const parsed = JSON.parse(base64urlDecode(payload)) as { exp?: unknown };
    return typeof parsed.exp === 'number' && Date.now() < parsed.exp;
  } catch {
    return false;
  }
}
