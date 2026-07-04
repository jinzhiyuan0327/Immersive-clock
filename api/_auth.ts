import crypto from 'crypto';

/**
 * 无状态签名 token 工具：payload.signature
 * - payload = base64url(JSON.stringify({ exp }))
 * - signature = HMAC-SHA256(payload, secret) 的 hex 编码
 *
 * 注意：签名用的 secret 就是服务端的 ADMIN_SECRET，它只在
 * Vercel 服务端函数中使用，不会被打包进前端代码。
 * 登录成功后前端只保存这个 token，从不接触真实密码。
 */

function base64url(input: string): string {
  return Buffer.from(input, 'utf8').toString('base64url');
}

function fromBase64url(input: string): string {
  return Buffer.from(input, 'base64url').toString('utf8');
}

export function createToken(
  secret: string,
  ttlMs = 7 * 24 * 3600 * 1000
): { token: string; expiresAt: number } {
  const expiresAt = Date.now() + ttlMs;
  const payload = base64url(JSON.stringify({ exp: expiresAt }));
  const sig = crypto.createHmac('sha256', secret).update(payload).digest('hex');
  return { token: `${payload}.${sig}`, expiresAt };
}

export function verifyToken(token: string | undefined | null, secret: string): boolean {
  if (!token || !secret) return false;
  const parts = token.split('.');
  if (parts.length !== 2) return false;
  const [payload, sig] = parts;
  const expected = crypto.createHmac('sha256', secret).update(payload).digest('hex');

  const a = Buffer.from(sig, 'hex');
  const b = Buffer.from(expected, 'hex');
  if (a.length !== b.length) return false;
  if (!crypto.timingSafeEqual(a, b)) return false;

  try {
    const { exp } = JSON.parse(fromBase64url(payload));
    return typeof exp === 'number' && Date.now() < exp;
  } catch {
    return false;
  }
}
