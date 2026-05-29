/**
 * /api/sessions/mm/[code]/[action] — router for all per-session sub-actions.
 *
 * Consolidates six former endpoints into ONE Vercel Serverless Function, to stay
 * under the Hobby plan's 12-function-per-deployment limit. URLs are unchanged, so
 * the frontend (ManyMirrors.jsx) needs no edits. Methods, auth, status codes, and
 * response bodies are identical to the original per-file endpoints.
 *
 *   action          methods           auth
 *   ------          -------           ----
 *   evaluators      GET/POST/PATCH    subject Bearer token
 *   responses       POST              evaluator invite token (in body)
 *   self            POST              subject Bearer token
 *   synthesize      POST              subject Bearer token
 *   report          GET/POST          GET: subject token OR ?t=resultsToken; POST: subject token
 *   delete          POST              subject Bearer token
 */
import {
  redis, TTL, loadEvals, saveEvals, isSubject,
  randomToken, sha256, refreshTTL, findEvaluatorByToken, sendInviteEmail, loadConfig,
} from '../_lib.js';
import { synthesizeReport } from '../_synth.js';

export default async function handler(req, res) {
  const { code, action } = req.query;
  if (!code) return res.status(400).json({ error: 'code is required' });

  try {
    const uc = code.toUpperCase();
    const config = await loadConfig(uc);
    if (!config) return res.status(404).json({ error: 'Session not found or expired' });

    switch (action) {
      case 'evaluators': return await handleEvaluators(req, res, uc, config);
      case 'responses':  return await handleResponses(req, res, uc, config);
      case 'self':       return await handleSelf(req, res, uc, config);
      case 'synthesize': return await handleSynthesize(req, res, uc, config);
      case 'report':     return await handleReport(req, res, uc, config);
      case 'delete':     return await handleDelete(req, res, uc, config);
      default:           return res.status(404).json({ error: 'Unknown action' });
    }
  } catch (err) {
    console.error(`mm ${req.query.action} error:`, err);
    return res.status(500).json({ error: 'Internal error', detail: String(err?.message || err) });
  }
}

// --- evaluators (was [code]/evaluators.js) — subject-authenticated ---
async function handleEvaluators(req, res, uc, config) {
  if (!isSubject(req, config)) return res.status(401).json({ error: 'Subject token required' });

  const origin = (req.headers.origin || req.headers.host || 'https://inciteu.com').replace(/\/$/, '');
  const basePath = `${origin}/tools/self/many-mirrors`;

  if (req.method === 'GET') {
    const evals = await loadEvals(uc);
    const selfRaw = await redis.get(`mm:${uc}:self`);
    const reportRaw = await redis.get(`mm:${uc}:report`);
    await refreshTTL(uc);
    return res.status(200).json({
      evaluators: evals.map(e => ({ id: e.id, name: e.name, relationship: e.relationship, status: e.status, addedAt: e.addedAt, completedAt: e.completedAt || null, inviteToken: e.inviteToken })),
      selfSubmitted: !!selfRaw,
      reportExists: !!reportRaw,
    });
  }

  if (req.method === 'POST') {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const { name, relationship = 'Peer', email = '' } = body;
    if (!name || !name.trim()) return res.status(400).json({ error: 'name is required' });

    const evals = await loadEvals(uc);
    const id = `ev_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const inviteToken = randomToken();
    const inviteURL = `${basePath}?code=${uc}&v=e&t=${inviteToken}`;
    evals.push({ id, name: name.trim(), relationship, status: 'pending', addedAt: new Date().toISOString(), completedAt: null, inviteToken, inviteURL });
    await saveEvals(uc, evals);
    await refreshTTL(uc);
    if (email.trim()) {
      try { await sendInviteEmail({ toEmail: email.trim(), toName: name.trim(), subjectName: config.subjectName, inviteURL }); }
      catch (e) { console.error('Add evaluator email error:', e); }
    }
    return res.status(200).json({ ok: true, id, inviteToken });
  }

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
    try { await sendInviteEmail({ toEmail: email.trim(), toName: ev.name, subjectName: config.subjectName, inviteURL }); }
    catch (e) { console.error('Remind email error:', e); }
    await refreshTTL(uc);
    return res.status(200).json({ ok: true });
  }

  res.setHeader('Allow', 'GET, POST, PATCH');
  return res.status(405).json({ error: 'Method not allowed' });
}

// --- responses (was [code]/responses.js) — evaluator invite token, no subject token ---
async function handleResponses(req, res, uc, config) {
  if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return res.status(405).json({ error: 'Method not allowed' }); }

  const evals = await loadEvals(uc);
  const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
  const { evaluatorInviteToken, answers = {}, nameOverride, relationshipOverride } = body;

  let ev;
  if (evaluatorInviteToken && evaluatorInviteToken.trim()) {
    // Invited (token-verified) evaluator
    ev = findEvaluatorByToken(evals, evaluatorInviteToken.trim());
    if (!ev) return res.status(401).json({ error: 'Invalid or expired invite token' });
    if (ev.status === 'completed') return res.status(409).json({ error: 'Responses already submitted for this invite' });
    if (nameOverride && typeof nameOverride === 'string' && nameOverride.trim()) ev.name = nameOverride.trim();
    if (relationshipOverride && typeof relationshipOverride === 'string' && relationshipOverride.trim()) ev.relationship = relationshipOverride.trim();
  } else {
    // Open share-link submission: no token, so create a new evaluator from the
    // self-entered identity. Names here are self-reported, not verified (by design).
    const name = (nameOverride && typeof nameOverride === 'string') ? nameOverride.trim() : '';
    if (!name) return res.status(400).json({ error: 'name is required' });
    const relationship = (relationshipOverride && typeof relationshipOverride === 'string' && relationshipOverride.trim()) ? relationshipOverride.trim() : 'Peer';
    ev = {
      id: `ev_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      name,
      relationship,
      status: 'pending',
      addedAt: new Date().toISOString(),
      completedAt: null,
      inviteToken: randomToken(),
    };
    evals.push(ev);
  }

  ev.status = 'completed';
  ev.completedAt = new Date().toISOString();

  const response = { evaluatorId: ev.id, answers, submittedAt: new Date().toISOString() };
  await redis.set(`mm:${uc}:response:${ev.id}`, JSON.stringify(response), { ex: TTL });
  await saveEvals(uc, evals);
  await refreshTTL(uc);

  return res.status(200).json({ ok: true });
}

// --- self (was [code]/self.js) — subject-authenticated ---
async function handleSelf(req, res, uc, config) {
  if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return res.status(405).json({ error: 'Method not allowed' }); }
  if (!isSubject(req, config)) return res.status(401).json({ error: 'Subject token required' });

  const reportExists = await redis.exists(`mm:${uc}:report`);
  if (reportExists) return res.status(409).json({ error: 'Cannot submit self-survey after report has been generated' });

  const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
  const { answers } = body;
  if (!answers || typeof answers !== 'object') return res.status(400).json({ error: 'answers object is required' });

  const record = { answers, submittedAt: new Date().toISOString() };
  await redis.set(`mm:${uc}:self`, JSON.stringify(record), { ex: TTL });
  await refreshTTL(uc);

  return res.status(200).json({ ok: true });
}

// --- synthesize (was [code]/synthesize.js) — subject-authenticated; pipeline in _synth.js ---
async function handleSynthesize(req, res, uc, config) {
  if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return res.status(405).json({ error: 'Method not allowed' }); }
  if (!isSubject(req, config)) return res.status(401).json({ error: 'Subject token required' });
  const out = await synthesizeReport(uc, config);
  return res.status(out.status).json(out.body);
}

// --- report (was [code]/report.js) — GET: subject OR results token; POST: subject ---
async function handleReport(req, res, uc, config) {
  const queryToken = req.query.t;

  if (req.method === 'GET') {
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

  if (req.method === 'POST') {
    if (!isSubject(req, config)) return res.status(401).json({ error: 'Subject token required' });
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    if (body.action !== 'create-results-link') return res.status(400).json({ error: 'Only action: "create-results-link" is supported' });

    const resultsToken = randomToken();
    const tokenHash = sha256(resultsToken);
    await redis.set(`mm:${uc}:rtok:${tokenHash}`, '1', { ex: TTL });
    await refreshTTL(uc);

    return res.status(200).json({ resultsToken });
  }

  res.setHeader('Allow', 'GET, POST');
  return res.status(405).json({ error: 'Method not allowed' });
}

// --- delete (was [code]/delete.js) — subject-authenticated ---
async function handleDelete(req, res, uc, config) {
  if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return res.status(405).json({ error: 'Method not allowed' }); }
  if (!isSubject(req, config)) return res.status(401).json({ error: 'Subject token required' });

  const evals = await loadEvals(uc);
  const keys = [
    `mm:${uc}:config`, `mm:${uc}:evals`, `mm:${uc}:self`, `mm:${uc}:report`,
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
}
