import { Redis } from '@upstash/redis';

const redis = Redis.fromEnv();
const LOOKUP_TOKEN = 'f54ca9e14b01127b';

export default async function handler(req, res) {
  // Simple shared-secret auth
  const provided = req.query.t || req.headers['x-lookup-token'];
  if (provided !== LOOKUP_TOKEN) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  try {
    // Scan all fyw:*:config keys
    let cursor = 0;
    const keys = [];
    do {
      const [next, batch] = await redis.scan(cursor, { match: 'fyw:*:config', count: 100 });
      cursor = Number(next);
      if (Array.isArray(batch)) keys.push(...batch);
    } while (cursor !== 0);

    if (keys.length === 0) {
      return res.status(200).json({ sessions: [] });
    }

    const values = await redis.mget(...keys);
    const sessions = values
      .map(v => {
        if (!v) return null;
        const cfg = typeof v === 'string' ? JSON.parse(v) : v;
        return {
          code: cfg.code,
          title: cfg.title,
          facilitatorName: cfg.facilitatorName,
          questionCount: cfg.questions ? cfg.questions.length : 0,
          createdAt: cfg.createdAt,
        };
      })
      .filter(Boolean)
      .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));

    // Optional title filter
    const q = (req.query.q || '').toLowerCase();
    const filtered = q
      ? sessions.filter(s => (s.title || '').toLowerCase().includes(q))
      : sessions;

    return res.status(200).json({ sessions: filtered, total: sessions.length });
  } catch (err) {
    console.error('admin lookup error:', err);
    return res.status(500).json({ error: 'Internal error', detail: String(err && err.message || err) });
  }
}
