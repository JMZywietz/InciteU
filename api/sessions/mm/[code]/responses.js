/**
 * POST /api/sessions/mm/[code]/responses
 *
 * Body: { evaluatorInviteToken, answers:{qid:'...'}, nameOverride?, relationshipOverride? }
 * Returns: { ok: true }
 * Errors: 409 if already submitted
 *
 * Auth: invite token validates the evaluator. No subject token needed.
 * Anonymity: raw responses stored keyed by evaluatorId.
 *   Subject-facing endpoints (/evaluators GET, /report GET) never return raw responses.
 */
import {
  redis, TTL, loadConfig, loadEvals, saveEvals,
  findEvaluatorByToken, refreshTTL,
} from '../_lib.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { code } = req.query;
  if (!code) return res.status(400).json({ error: 'code is required' });

  try {
    const uc = code.toUpperCase();
    const [config, evals] = await Promise.all([loadConfig(uc), loadEvals(uc)]);
    if (!config) return res.status(404).json({ error: 'Session not found or expired' });

    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const { evaluatorInviteToken, answers = {}, nameOverride, relationshipOverride } = body;

    if (!evaluatorInviteToken) return res.status(400).json({ error: 'evaluatorInviteToken is required' });

    const ev = findEvaluatorByToken(evals, evaluatorInviteToken.trim());
    if (!ev) return res.status(401).json({ error: 'Invalid or expired invite token' });
    if (ev.status === 'completed') return res.status(409).json({ error: 'Responses already submitted for this invite' });

    if (nameOverride && typeof nameOverride === 'string' && nameOverride.trim()) ev.name = nameOverride.trim();
    if (relationshipOverride && typeof relationshipOverride === 'string' && relationshipOverride.trim()) ev.relationship = relationshipOverride.trim();
    ev.status = 'completed';
    ev.completedAt = new Date().toISOString();

    const response = { evaluatorId: ev.id, answers, submittedAt: new Date().toISOString() };
    await redis.set(`mm:${uc}:response:${ev.id}`, JSON.stringify(response), { ex: TTL });
    await saveEvals(uc, evals);
    await refreshTTL(uc);

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('mm responses error:', err);
    return res.status(500).json({ error: 'Internal error', detail: String(err?.message || err) });
  }
}
