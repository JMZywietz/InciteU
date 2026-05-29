/**
 * POST /api/sessions/mm/[code]/delete
 * Auth: Bearer subject token
 * Deletes: config, evals, all responses, self-survey, report, all results tokens
 */
import { redis, loadConfig, loadEvals, isSubject } from '../_lib.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { code } = req.query;
  if (!code) return res.status(400).json({ error: 'code is required' });

  try {
    const uc = code.toUpperCase();
    const config = await loadConfig(uc);
    if (!config) return res.status(404).json({ error: 'Session not found or expired' });
    if (!isSubject(req, config)) return res.status(401).json({ error: 'Subject token required' });

    const evals = await loadEvals(uc);

    const keys = [
      `mm:${uc}:config`,
      `mm:${uc}:evals`,
      `mm:${uc}:self`,
      `mm:${uc}:report`,
      ...evals.map(e => `mm:${uc}:response:${e.id}`),
    ];

    let cursor = 0;
    do {
      const [next, batch] = await redis.scan(cursor, { match: `mm:${uc}:rtok:*`, count: 50 });
      cursor = Number(next);
      if (Array.isArray(batch)) keys.push(...batch);
    } while (cursor !== 0);

    if (keys.length > 0) await redis.del(...keys);

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('mm delete error:', err);
    return res.status(500).json({ error: 'Internal error', detail: String(err?.message || err) });
  }
}
