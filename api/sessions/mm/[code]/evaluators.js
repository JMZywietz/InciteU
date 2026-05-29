/**
 * /api/sessions/mm/[code]/evaluators — subject-authenticated
 *
 * GET    → list evaluators + self-submitted flag + reportExists
 * POST   → add an evaluator (optionally send invite email)
 * PATCH  → { evaluatorId, action: 'remind', email? } — resend invite to re-supplied email
 *
 * Privacy: evaluator email addresses are NOT stored after the initial send (spec §10).
 * For reminders, the subject re-supplies the email; we send and discard again.
 */
import {
  redis, TTL, loadConfig, loadEvals, saveEvals, isSubject,
  randomToken, refreshTTL, sendInviteEmail,
} from '../_lib.js';

export default async function handler(req, res) {
  const { code } = req.query;
  if (!code) return res.status(400).json({ error: 'code is required' });

  try {
    const uc = code.toUpperCase();
    const config = await loadConfig(uc);
    if (!config) return res.status(404).json({ error: 'Session not found or expired' });
    if (!isSubject(req, config)) return res.status(401).json({ error: 'Subject token required' });

    const origin = (req.headers.origin || req.headers.host || 'https://inciteu.com').replace(/\/$/, '');
    const basePath = `${origin}/tools/self/many-mirrors`;

    // ── GET ──────────────────────────────────────────────────────────────────
    if (req.method === 'GET') {
      const evals = await loadEvals(uc);
      const selfRaw = await redis.get(`mm:${uc}:self`);
      const reportRaw = await redis.get(`mm:${uc}:report`);
      await refreshTTL(uc);
      return res.status(200).json({
        evaluators: evals.map(e => ({
          id: e.id,
          name: e.name,
          relationship: e.relationship,
          status: e.status,
          addedAt: e.addedAt,
          completedAt: e.completedAt || null,
          // Return the invite token so the subject can use the "Copy invite URL" feature
          inviteToken: e.inviteToken,
        })),
        selfSubmitted: !!selfRaw,
        reportExists: !!reportRaw,
      });
    }

    // ── POST: add evaluator ───────────────────────────────────────────────────
    if (req.method === 'POST') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
      const { name, relationship = 'Peer', email = '' } = body;
      if (!name || !name.trim()) return res.status(400).json({ error: 'name is required' });

      const evals = await loadEvals(uc);
      const id = `ev_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      const inviteToken = randomToken();
      const inviteURL = `${basePath}?code=${uc}&v=e&t=${inviteToken}`;

      evals.push({
        id,
        name: name.trim(),
        relationship,
        status: 'pending',
        addedAt: new Date().toISOString(),
        completedAt: null,
        inviteToken,
        inviteURL,
      });
      await saveEvals(uc, evals);
      await refreshTTL(uc);

      if (email.trim()) {
        sendInviteEmail({
          toEmail: email.trim(),
          toName: name.trim(),
          subjectName: config.subjectName,
          inviteURL,
        }).catch(e => console.error('Add evaluator email error:', e));
      }

      return res.status(200).json({ ok: true, id, inviteToken });
    }

    // ── PATCH: remind ─────────────────────────────────────────────────────────
    if (req.method === 'PATCH') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
      const { evaluatorId, action, email = '' } = body;
      if (action !== 'remind') return res.status(400).json({ error: 'Only action: "remind" is supported' });
      if (!evaluatorId) return res.status(400).json({ error: 'evaluatorId is required' });
      if (!email.trim()) return res.status(400).json({ error: 'email is required for reminder send' });

      const evals = await loadEvals(uc);
      const ev = evals.find(e => e.id === evaluatorId);
      if (!ev) return res.status(404).json({ error: 'Evaluator not found' });
      if (ev.status === 'completed') return res.status(409).json({ error: 'This evaluator has already submitted' });

      const inviteURL = `${basePath}?code=${uc}&v=e&t=${ev.inviteToken}`;
      // Send and discard — do NOT store the email
      sendInviteEmail({
        toEmail: email.trim(),
        toName: ev.name,
        subjectName: config.subjectName,
        inviteURL,
      }).catch(e => console.error('Remind email error:', e));

      await refreshTTL(uc);
      return res.status(200).json({ ok: true });
    }

    res.setHeader('Allow', 'GET, POST, PATCH');
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('mm evaluators error:', err);
    return res.status(500).json({ error: 'Internal error', detail: String(err?.message || err) });
  }
}
