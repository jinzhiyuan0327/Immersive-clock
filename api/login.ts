import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createHmac } from 'node:crypto';

/**
 * GET  /api/login  -> { ok, required }
 *   查询后台是否需要密码（即服务端是否设置了 ADMIN_SECRET）。
 *
 * POST /api/login  body:{ password } -> { ok, token, expiresAt } 或 401
 *   密码校验完全在服务端完成，ADMIN_SECRET 永远不会出现在前端代码里。
 *   登录成功后签发一个有时效的签名 token，前端存 localStorage，
 *   之后写入请求带这个 token，而不是明文密码。
 */

function setCors(res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Cache-Control', 'no-store');
}

function base64urlEncode(input: string): string {
  return Buffer.from(input, 'utf8')
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

function createToken(
  secret: string,
  ttlMs = 7 * 24 * 3600 * 1000
): { token: string; expiresAt: number } {
  const expiresAt = Date.now() + ttlMs;
  const payload = base64urlEncode(JSON.stringify({ exp: expiresAt }));
  const sig = createHmac('sha256', secret).update(payload).digest('hex');
  return { token: `${payload}.${sig}`, expiresAt };
}

const TOKEN_TTL_MS = 7 * 24 * 3600 * 1000; // 7 天

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCors(res);

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  const secret = process.env.ADMIN_SECRET || '';

  if (req.method === 'GET') {
    res.status(200).json({ ok: true, required: !!secret });
    return;
  }

  if (req.method === 'POST') {
    if (!secret) {
      // 服务端未设置密码：无需验证，直接放行
      res.status(200).json({ ok: true, required: false, token: '', expiresAt: 0 });
      return;
    }

    const body =
      typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body ?? {});
    const password = typeof body.password === 'string' ? body.password : '';

    if (password !== secret) {
      res.status(401).json({ ok: false, error: '\u5bc6\u7801\u9519\u8bef' });
      return;
    }

    const { token, expiresAt } = createToken(secret, TOKEN_TTL_MS);
    res.status(200).json({ ok: true, required: true, token, expiresAt });
    return;
  }

  res.status(405).json({ ok: false, error: 'Method Not Allowed' });
}
