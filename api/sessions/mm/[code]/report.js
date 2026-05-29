/**
 * GET  /api/sessions/mm/[code]/report
 *   Auth: Bearer subject token  OR  ?t=resultsToken (read-only share link)
 *   Returns: { report }
 *
 * POST /api/sessions/mm/[code]/report  { action: 'create-results-link' }
 *   Auth: Bearer subject token only
 *   Returns: { resultsToken }
 *   Stores: mm:{code}:rtok:{sha256(resultsToken)} = "1"
 */
import { redis, TTL, sha256, randomToken, loadConfig, isSubject, refreshTTL } from '../_lib.js';

export default async function handler(req, res) {
  const { code, t: queryToken } = req.query;
  if (!code) return res.status(400).json({ error: 'code is required' });

  try {
    const uc = code.toUpperCase();
    const config = await loadConfig(uc);
    if (!config) return res.status(404).json({ error: 'Session not found or expired' });

    // ── GET ──────────────────────────────────────────────────────────────────
    if (req.method === 'GET') {
      // Auth: subject token OR valid results token
      let authorized = isSubject(req, config);
      if (!authorized && queryToken) {
        const tokenHash = sha256(queryToken.trim());
        const valid = await redis.get(`mm:${uc}:rtok:${tokenHash}`);
        authorized = !!valid;
      }
      if (!authorized) return res.status(401).json({ error: 'Authorization required' });

      const reportRaw = await redis.get(`mm:${uc}:report`);
      if (!reportRaw) return res.status(404).json({ error: 'No report yet — run /synthesize first' });

      const report = typeof reportRaw === 'string' ? JSON.parse(reportRaw) : reportRaw;
      await refreshTTL(uc);
      return res.status(200).json({ report });
    }

    // ── POST ─────────────────────────────────────────────────────────────────
    if (req.method === 'POST') {
      if (!isSubject(req, config)) return res.status(401).json({ error: 'Subject token required' });

      const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
      if (body.action !== 'create-results-link') {
        return res.status(400).json({ error: 'Only action: "create-results-link" is supported' });
      }

      const resultsToken = randomToken();
      const tokenHash = sha256(resultsToken);
      await redis.set(`mm:${uc}:rtok:${tokenHash}`, '1', { ex: TTL });
      await refreshTTL(uc);

      return res.status(200).json({ resultsToken });
    }

    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('mm report error:', err);
    return res.status(500).json({ error: 'Internal error', detail: String(err?.message || err) });
  }
}
