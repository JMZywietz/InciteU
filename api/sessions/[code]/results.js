import { Redis } from '@upstash/redis';

const redis = Redis.fromEnv();

async function loadConfig(code) {
  const raw = await redis.get(`fyw:${code}:config`);
  if (!raw) return null;
  return typeof raw === 'string' ? JSON.parse(raw) : raw;
}

async function loadAllResponses(code) {
  const pattern = `fyw:${code}:response:*`;
  let cursor = 0;
  const keys = [];
  do {
    const [next, batch] = await redis.scan(cursor, { match: pattern, count: 100 });
    cursor = Number(next);
    if (Array.isArray(batch)) keys.push(...batch);
  } while (cursor !== 0);
  if (keys.length === 0) return [];
  const values = await redis.mget(...keys);
  return values
    .map(v => {
      if (!v) return null;
      try { return typeof v === 'string' ? JSON.parse(v) : v; } catch { return null; }
    })
    .filter(Boolean);
}

async function loadAllSyntheses(code, questions) {
  const keys = questions.map(q => `fyw:${code}:synthesis:${q.id}`);
  if (keys.length === 0) return {};
  const values = await redis.mget(...keys);
  const out = {};
  questions.forEach((q, i) => {
    const v = values[i];
    if (!v) return;
    try { out[q.id] = typeof v === 'string' ? JSON.parse(v) : v; } catch { /* skip */ }
  });
  return out;
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { code } = req.query;
  if (!code || typeof code !== 'string') {
    return res.status(400).json({ error: 'code is required' });
  }

  try {
    const config = await loadConfig(code);
    if (!config) {
      return res.status(404).json({ error: 'Session not found or expired' });
    }

    const responses = await loadAllResponses(code);
    const syntheses = await loadAllSyntheses(code, config.questions);

    return res.status(200).json({
      responses: responses.map(r => ({ name: r.name, answers: r.answers, submittedAt: r.submittedAt })),
      syntheses,
    });
  } catch (err) {
    console.error('results error:', err);
    return res.status(500).json({ error: 'Internal error', detail: String(err && err.message || err) });
  }
}
