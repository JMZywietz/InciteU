import { Redis } from '@upstash/redis';

const redis = Redis.fromEnv();
const LOOKUP_TOKEN = 'fec5089e26279c57';

export default async function handler(req, res) {
  const provided = req.query.t || req.headers['x-lookup-token'];
  if (provided !== LOOKUP_TOKEN) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  try {
    let cursor = 0;
    const keys = [];
    do {
      const [next, batch] = await redis.scan(cursor, { match: 'fyw:*:config', count: 100 });
      cursor = Number(next);
      if (Array.isArray(batch)) keys.push(...batch);
    } while (cursor !== 0);

    if (keys.length === 0) return res.status(200).json({ sessions: [] });

    const values = await redis.mget(...keys);
    let sessions = values
      .map(v => {
        if (!v) return null;
        const cfg = typeof v === 'string' ? JSON.parse(v) : v;
        return {
          code: cfg.code,
          title: cfg.title,
          facilitatorName: cfg.facilitatorName,
          questionCount: cfg.questions ? cfg.questions.length : 0,
          firstQuestion: cfg.questions && cfg.questions[0] ? cfg.questions[0].text.slice(0, 80) : '',
          createdAt: cfg.createdAt,
          resultsUrl: `https://inciteu.vercel.app/openfacilitation?code=${cfg.code}&v=results`,
        };
      })
      .filter(Boolean)
      .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));

    // Optional date filter: ?date=2026-05-13
    if (req.query.date) {
      const d = req.query.date;
      sessions = sessions.filter(s => (s.createdAt || '').startsWith(d));
    }
    // Optional title filter
    const q = (req.query.q || '').toLowerCase();
    if (q) sessions = sessions.filter(s => (s.title || '').toLowerCase().includes(q));

    return res.status(200).json({ sessions, count: sessions.length });
  } catch (err) {
    console.error('admin lookup error:', err);
    return res.status(500).json({ error: 'Internal error', detail: String(err && err.message || err) });
  }
}
