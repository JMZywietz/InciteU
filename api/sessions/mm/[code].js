/**
 * GET /api/sessions/mm/[code]
 *
 * Public session config. Strip subjectTokenHash before returning.
 * If ?t=inviteToken is present and valid, include the matching evaluator's
 * id/name/relationship/status so the evaluator landing can auto-fill their info.
 *
 * Returns: { code, subjectName, subjectFirstName, questions, questionOrder,
 *            createdAt, weeklyUpdatesOptIn, evaluator?: { id, name, relationship, status } }
 */
import { loadConfig, loadEvals, findEvaluatorByToken, refreshTTL } from './_lib.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { code, t: inviteToken } = req.query;
  if (!code || typeof code !== 'string') {
    return res.status(400).json({ error: 'code is required' });
  }

  try {
    const config = await loadConfig(code.toUpperCase());
    if (!config) return res.status(404).json({ error: 'Session not found or expired' });

    // Strip sensitive fields before returning
    const { subjectTokenHash, subjectEmail, ...publicConfig } = config;

    // If an invite token was supplied, look up the matching evaluator
    if (inviteToken && typeof inviteToken === 'string') {
      const evals = await loadEvals(code.toUpperCase());
      const ev = findEvaluatorByToken(evals, inviteToken.trim());
      if (ev) {
        publicConfig.evaluator = {
          id: ev.id,
          name: ev.name,
          relationship: ev.relationship,
          status: ev.status,
        };
      }
    }

    await refreshTTL(code.toUpperCase());
    return res.status(200).json(publicConfig);
  } catch (err) {
    console.error('mm [code] GET error:', err);
    return res.status(500).json({ error: 'Internal error', detail: String(err?.message || err) });
  }
}
