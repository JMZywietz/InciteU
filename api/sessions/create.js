import { Redis } from '@upstash/redis';
import crypto from 'crypto';

const redis = Redis.fromEnv();
const TTL_SECONDS = 60 * 60 * 24 * 30; // 30 days

function generateCode() {
  // 6-character uppercase alphanumeric, avoiding ambiguous chars (0, O, 1, I, L)
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

function sha256(input) {
  return crypto.createHash('sha256').update(input).digest('hex');
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const { title, contextBlurb, questions, facilitatorName } = body;

    if (!title || typeof title !== 'string' || !title.trim()) {
      return res.status(400).json({ error: 'title is required' });
    }
    if (!Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({ error: 'questions must be a non-empty array' });
    }
    for (const q of questions) {
      if (!q || typeof q.id !== 'string' || typeof q.text !== 'string' || !q.text.trim()) {
        return res.status(400).json({ error: 'each question needs { id, text }' });
      }
    }
    if (!facilitatorName || typeof facilitatorName !== 'string' || !facilitatorName.trim()) {
      return res.status(400).json({ error: 'facilitatorName is required' });
    }

    // Generate a unique session code (retry up to 5 times on collision)
    let code = null;
    for (let attempt = 0; attempt < 5; attempt++) {
      const candidate = generateCode();
      const exists = await redis.exists(`fyw:${candidate}:config`);
      if (!exists) {
        code = candidate;
        break;
      }
    }
    if (!code) {
      return res.status(500).json({ error: 'Could not generate a unique session code; try again' });
    }

    // Generate facilitator token (returned once; only hash is stored)
    const facilitatorToken = crypto.randomBytes(24).toString('hex');
    const tokenHash = sha256(facilitatorToken);

    const config = {
      code,
      title: title.trim(),
      contextBlurb: (contextBlurb || '').trim(),
      questions: questions.map(q => ({ id: q.id, text: q.text.trim() })),
      facilitatorName: facilitatorName.trim(),
      tokenHash,
      createdAt: new Date().toISOString(),
    };

    await redis.set(`fyw:${code}:config`, JSON.stringify(config), { ex: TTL_SECONDS });

    return res.status(200).json({ code, facilitatorToken });
  } catch (err) {
    console.error('create session error:', err);
    return res.status(500).json({ error: 'Internal error', detail: String(err && err.message || err) });
  }
}
