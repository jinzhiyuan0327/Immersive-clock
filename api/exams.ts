import type { VercelRequest, VercelResponse } from '@vercel/node';
import { neon } from '@neondatabase/serverless';

const ADMIN_SECRET = process.env.ADMIN_SECRET ?? '';

/** 获取数据库连接（每次请求创建，Neon Serverless 无需连接池） */
function getDb() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL environment variable is not set');
  return neon(url);
}

/** 确保表存在（首次请求时自动创建） */
async function ensureTable(sql: ReturnType<typeof getDb>) {
  await sql`
    CREATE TABLE IF NOT EXISTS exam_settings (
      id      INTEGER PRIMARY KEY DEFAULT 1,
      items   JSONB   NOT NULL DEFAULT '[]',
      updated_at BIGINT NOT NULL DEFAULT 0,
      CHECK (id = 1)  -- 只允许一行
    )
  `;
  // 确保存在那唯一一行
  await sql`
    INSERT INTO exam_settings (id, items, updated_at)
    VALUES (1, '[]', 0)
    ON CONFLICT (id) DO NOTHING
  `;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  let sql: ReturnType<typeof getDb>;
  try {
    sql = getDb();
    await ensureTable(sql);
  } catch (e) {
    return res.status(500).json({ ok: false, error: `DB init failed: ${String(e)}` });
  }

  // ── GET：读取考试列表 ────────────────────────────────────────────
  if (req.method === 'GET') {
    try {
      const rows = await sql`SELECT items, updated_at FROM exam_settings WHERE id = 1`;
      const row = rows[0] as { items: unknown[]; updated_at: number } | undefined;
      return res.status(200).json({
        ok: true,
        items: row?.items ?? [],
        updatedAt: row?.updated_at ?? 0,
      });
    } catch (e) {
      return res.status(500).json({ ok: false, error: String(e) });
    }
  }

  // ── POST：保存考试列表 ───────────────────────────────────────────
  if (req.method === 'POST') {
    // 密码校验（配置了 ADMIN_SECRET 才启用）
    if (ADMIN_SECRET) {
      const auth = (req.headers['authorization'] as string) ?? '';
      const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
      if (token !== ADMIN_SECRET) {
        return res.status(401).json({ ok: false, error: 'Unauthorized' });
      }
    }
    try {
      const { items } = req.body as { items: unknown[] };
      if (!Array.isArray(items)) {
        return res.status(400).json({ ok: false, error: 'items must be an array' });
      }
      const now = Date.now();
      await sql`
        UPDATE exam_settings
        SET items = ${JSON.stringify(items)}::jsonb, updated_at = ${now}
        WHERE id = 1
      `;
      return res.status(200).json({ ok: true, updatedAt: now });
    } catch (e) {
      return res.status(500).json({ ok: false, error: String(e) });
    }
  }

  return res.status(405).json({ ok: false, error: 'Method not allowed' });
}