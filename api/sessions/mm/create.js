/**
 * POST /api/sessions/mm/create
 *
 * Body: { subjectName, questions:[{id,text}], questionOrder:[ids],
 *         evaluators:[{name,relationship,email?}], weeklyUpdatesOptIn, subjectEmail? }
 * Returns: { code, subjectToken, shareURL }
 */
import {
  redis, TTL, sha256, randomToken, generateCode,
  saveEvals, sendInviteEmail, sendDashboardLinkEmail,
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

    // Unique code with collision check
    let code = null;
    for (let attempt = 0; attempt < 5; attempt++) {
      const candidate = generateCode();
      const exists = await redis.exists(`mm:${candidate}:config`);
      if (!exists) { code = candidate; break; }
    }
    if (!code) return res.status(500).json({ error: 'Could not generate a unique session code; try again' });

    // Subject token — returned once, only hash stored
    const subjectToken = randomToken();
    const subjectTokenHash = sha256(subjectToken);

    const name = subjectName.trim();
    const firstName = name.split(/\s+/)[0];

    const config = {
      code,
      subjectName: name,
      subjectFirstName: firstName,
      questions: questions.map(q => ({ id: q.id, text: (q.text || '').trim() })),
      questionOrder,
      subjectTokenHash,
      createdAt: new Date().toISOString(),
      weeklyUpdatesOptIn: !!weeklyUpdatesOptIn,
      subjectEmail: weeklyUpdatesOptIn ? (subjectEmail || '').trim() : '',
    };

    await redis.set(`mm:${code}:config`, JSON.stringify(config), { ex: TTL });

    // Build evaluator records with invite tokens; send emails where provided
    const origin = (req.headers.origin || req.headers.host || 'https://inciteu.com').replace(/\/$/, '');
    const basePath = `${origin}/tools/self/many-mirrors`;

    const evalRecords = [];
    const emailJobs = [];

    for (const raw of rawEvaluators) {
      if (!raw.name || !raw.name.trim()) continue;
      const id = `ev_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      const inviteToken = randomToken();
      const inviteURL = `${basePath}?code=${code}&v=e&t=${inviteToken}`;
      evalRecords.push({
        id,
        name: raw.name.trim(),
        relationship: raw.relationship || 'Peer',
        status: 'pending',
        addedAt: new Date().toISOString(),
        completedAt: null,
        inviteToken,
        inviteURL,  // convenience; also reconstructable from token + code
      });
      if (raw.email && raw.email.trim()) {
        emailJobs.push(sendInviteEmail({
          toEmail: raw.email.trim(),
          toName: raw.name.trim(),
          subjectName: name,
          inviteURL,
        }));
      }
    }

    await saveEvals(code, evalRecords);

    // Send emails in parallel; AWAIT so they complete before the function is
    // frozen (Vercel tears down the instance once we return). A failed email
    // must not fail the request — the evaluator is already saved.
    if (emailJobs.length > 0) {
      const results = await Promise.allSettled(emailJobs);
      const failed = results.filter(r => r.status === 'rejected');
      if (failed.length) console.error(`mm create: ${failed.length}/${emailJobs.length} invite emails failed`, failed.map(f => String(f.reason?.message || f.reason)));
    }

    const shareURL = `${basePath}?code=${code}&v=e`;

    // Send the subject a dashboard link email so they can always find their session
    if (subjectEmail) {
      try {
        await sendDashboardLinkEmail({
          toEmail: subjectEmail,
          subjectName: config.subjectFirstName || config.subjectName,
          dashboardURL: `${basePath}?code=${code}`,
        });
      } catch (e) { console.error('Dashboard link email error:', e); }
    }

    return res.status(200).json({ code, subjectToken, shareURL });
  } catch (err) {
    console.error('mm create error:', err);
    return res.status(500).json({ error: 'Internal error', detail: String(err?.message || err) });
  }
}
