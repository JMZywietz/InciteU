/**
 * POST /api/sessions/mm/[code]/self
 *
 * Body: { answers: { qid: '...', ... } }
 * Auth: Bearer subject token
 * Returns: { ok: true }
 *
 * Self-survey can only be submitted once (before report generation).
 */
import { loadConfig, loadEvals, isSubject, redis, TTL, refreshTTL } from '../_lib.js';

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

    const reportExists = await redis.exists(`mm:${uc}:report`);
    if (reportExists) return res.status(409).json({ error: 'Cannot submit self-survey after report has been generated' });

    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const { answers } = body;
    if (!answers || typeof answers !== 'object') {
      return res.status(400).json({ error: 'answers object is required' });
    }

    const record = { answers, submittedAt: new Date().toISOString() };
    await redis.set(`mm:${uc}:self`, JSON.stringify(record), { ex: TTL });
    await refreshTTL(uc);

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('mm self error:', err);
    return res.status(500).json({ error: 'Internal error', detail: String(err?.message || err) });
  }
}
