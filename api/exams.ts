import type { VercelRequest, VercelResponse } from '@vercel/node';
import { neon } from '@neondatabase/serverless';
import { createHmac, timingSafeEqual } from 'node:crypto';

/**
 * GET  /api/exams  -> { ok, items, title, updatedAt }
 * POST /api/exams  body: { items, title }  -> { ok, updatedAt }
 *
 * 数据存储在 Neon PostgreSQL 的单行表 exam_settings(id=1)。
 * 通过 updated_at（毫秒时间戳）实现多设备“最新覆盖”同步。
 */

const sql = neon(process.env.DATABASE_URL || '');

function base64urlDecode(input: string): string {
  const normalized = input.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized + '='.repeat((4 - (normalized.length % 4 || 4)) % 4);
  return Buffer.from(padded, 'base64').toString('utf8');
}

function verifyToken(token: string | undefined | null, secret: string): boolean {
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

let tableReady = false;
async function ensureTable() {
  if (tableReady) return;
  await sql`
    CREATE TABLE IF NOT EXISTS exam_settings (
      id INTEGER PRIMARY KEY,
      items JSONB NOT NULL DEFAULT '[]'::jsonb,
      title TEXT NOT NULL DEFAULT '',
      updated_at BIGINT NOT NULL DEFAULT 0
    )
  `;
  // 兼容旧表：如果早期没有 title 列则补上
  await sql`ALTER TABLE exam_settings ADD COLUMN IF NOT EXISTS title TEXT NOT NULL DEFAULT ''`;
  await sql`
    INSERT INTO exam_settings (id, items, title, updated_at)
    VALUES (1, '[]'::jsonb, '', 0)
    ON CONFLICT (id) DO NOTHING
  `;
  tableReady = true;
}

function setCors(res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Cache-Control', 'no-store');
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCors(res);

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  if (!process.env.DATABASE_URL) {
    res.status(500).json({ ok: false, error: 'DATABASE_URL \u672a\u914d\u7f6e' });
    return;
  }

  try {
    await ensureTable();

    if (req.method === 'GET') {
      const rows = await sql`SELECT items, title, updated_at FROM exam_settings WHERE id = 1`;
      const row = rows[0] ?? { items: [], title: '', updated_at: 0 };
      res.status(200).json({
        ok: true,
        items: row.items ?? [],
        title: row.title ?? '',
        updatedAt: Number(row.updated_at ?? 0),
      });
      return;
    }

    if (req.method === 'POST') {
      // 可选写入鉴权：设置 ADMIN_SECRET 后，POST 需带 Authorization: Bearer <登录时签发的 token>
      // 注意：这里校验的是签名 token，不是明文密码——明文密码只在 /api/login 里比对一次，
      // 不会通过这个接口往返，避免密码被前端代码或网络中间人获取。
      const secret = process.env.ADMIN_SECRET;
      if (secret) {
        const auth = String(req.headers['authorization'] || '');
        const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
        if (!verifyToken(token, secret)) {
          res.status(401).json({ ok: false, error: '\u767b\u5f55\u5df2\u8fc7\u671f\u6216\u65e0\u6548\uff0c\u8bf7\u91cd\u65b0\u767b\u5f55' });
          return;
        }
      }

      const body =
        typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body ?? {});
      const items = Array.isArray(body.items) ? body.items : [];
      const title = typeof body.title === 'string' ? body.title : '';
      const updatedAt = Date.now();

      await sql`
        UPDATE exam_settings
        SET items = ${JSON.stringify(items)}::jsonb,
            title = ${title},
            updated_at = ${updatedAt}
        WHERE id = 1
      `;

      res.status(200).json({ ok: true, updatedAt });
      return;
    }

    res.status(405).json({ ok: false, error: 'Method Not Allowed' });
  } catch (e) {
    res.status(500).json({ ok: false, error: String(e) });
  }
}
