/**
 * POST /api/sessions/mm/create
 *
 * Body: { subjectName, questions:[{id,text}], questionOrder:[ids],
 *         evaluators:[{name,relationship,email?}], weeklyUpdatesOptIn, subjectEmail? }
 * Returns: { code, subjectToken, shareURL }
 */
import {
  redis, TTL, sha256, randomToken, generateCode,
  saveEvals, sendInviteEmail,
} from './_lib.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const {
      subjectName, questions, questionOrder,
      evaluators: rawEvaluators = [],
      weeklyUpdatesOptIn = false,
      subjectEmail = '',
    } = body;

    if (!subjectName || typeof subjectName !== 'string' || !subjectName.trim()) {
      return res.status(400).json({ error: 'subjectName is required' });
    }
    if (!Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({ error: 'questions must be a non-empty array' });
    }
    if (!Array.isArray(questionOrder) || questionOrder.length === 0) {
      return res.status(400).json({ error: 'questionOrder is required' });
    }

    let code = null;
    for (let attempt = 0; attempt < 5; attempt++) {
      const candidate = generateCode();
      const exists = await redis.exists(`mm:${candidate}:config`);
      if (!exists) { code = candidate; break; }
    }
    if (!code) return res.status(500).json({ error: 'Could not generate a unique session code; try again' });

    const subjectToken = randomToken();
    const subjectTokenHash = sha256(subjectToken);
    const name = subjectName.trim();
    const firstName = name.split(/\s+/)[0];

    const config = {
      code, subjectName: name, subjectFirstName: firstName,
      questions: questions.map(q => ({ id: q.id, text: (q.text || '').trim() })),
      questionOrder, subjectTokenHash,
      createdAt: new Date().toISOString(),
      weeklyUpdatesOptIn: !!weeklyUpdatesOptIn,
      subjectEmail: weeklyUpdatesOptIn ? (subjectEmail || '').trim() : '',
    };

    await redis.set(`mm:${code}:config`, JSON.stringify(config), { ex: TTL });

    const origin = (req.headers.origin || req.headers.host || 'https://inciteu.com').replace(/\/$/, '');
    const basePath = `${origin}/tools/self/many-mirrors`;

    const evalRecords = [];
    const emailJobs = [];
    for (const raw of rawEvaluators) {
      if (!raw.name || !raw.name.trim()) continue;
      const id = `ev_${Date.now()}_${Math.random().toString(36).slice(2,8)}`;
      const inviteToken = randomToken();
      const inviteURL = `${basePath}?code=${code}&v=e&t=${inviteToken}`;
      evalRecords.push({ id, name: raw.name.trim(), relationship: raw.relationship || 'Peer', status: 'pending', addedAt: new Date().toISOString(), completedAt: null, inviteToken, inviteURL  });
      if (raw.email && raw.email.trim()) emailJobs.push(sendInviteEmail({ toEmail: raw.email.trim(), toName: raw.name.trim(), subjectName: name, inviteURL }));
    }
    await saveEvals(code, evalRecords);
    if (emailJobs.length > 0) Promise.allSettled(emailJobs).catch(e => console.error('Email batch error:', e));

    const shareURL = `${basePath}?code=${code}&v=e`;
    return res.status(200).json({ code, subjectToken, shareURL });
  } catch (err) {
    console.error('mm create error:', err);
    return res.status(500).json({ error: 'Internal error', detail: String(err?.message || err) });
  }
}
