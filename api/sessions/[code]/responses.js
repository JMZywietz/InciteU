import { Redis } from '@upstash/redis';
import crypto from 'crypto';

const redis = Redis.fromEnv();
const TTL_SECONDS = 60 * 60 * 24 * 30; // 30 days

function sha256(input) {
  return crypto.createHash('sha256').update(input).digest('hex');
}

function normalizeName(name) {
  return String(name).trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60) || null;
}

async function loadConfig(code) {
  const raw = await redis.get(`fyw:${code}:config`);
  if (!raw) return null;
  return typeof raw === 'string' ? JSON.parse(raw) : raw;
}

function checkFacilitatorToken(req, config) {
  const auth = req.headers.authorization || '';
  if (!auth.startsWith('Bearer ')) return false;
  const token = auth.slice(7).trim();
  if (!token) return false;
  return sha256(token) === config.tokenHash;
}

export default async function handler(req, res) {
  const { code } = req.query;
  if (!code || typeof code !== 'string') {
    return res.status(400).json({ error: 'code is required' });
  }

  try {
    const config = await loadConfig(code);
    if (!config) {
      return res.status(404).json({ error: 'Session not found or expired' });
    }

    if (req.method === 'POST') {
      // Public: anyone with the code may submit a response.
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
      const { name, answers } = body;

      if (!answers || typeof answers !== 'object' || Array.isArray(answers)) {
        return res.status(400).json({ error: 'answers must be an object keyed by question id' });
      }

      // Validate every answered qid is one defined on this session
      const validIds = new Set(config.questions.map(q => q.id));
      for (const qid of Object.keys(answers)) {
        if (!validIds.has(qid)) {
          return res.status(400).json({ error: `Unknown question id: ${qid}` });
        }
      }

      const normalized = name ? normalizeName(name) : null;
      const key = normalized || `anon-${crypto.randomBytes(6).toString('hex')}`;

      const record = {
        name: (name && String(name).trim()) || null,
        key,
        anonymous: !normalized,
        answers,
        submittedAt: new Date().toISOString(),
      };

      await redis.set(`fyw:${code}:response:${key}`, JSON.stringify(record), { ex: TTL_SECONDS });
      return res.status(200).json({ ok: true, key });
    }

    if (req.method === 'GET') {
      // Facilitator-only: list all responses.
      if (!checkFacilitatorToken(req, config)) {
        return res.status(403).json({ error: 'Facilitator token required' });
      }

      // Find all response keys for this session, then mget.
      const pattern = `fyw:${code}:response:*`;
      let cursor = 0;
      const keys = [];
      do {
        const [next, batch] = await redis.scan(cursor, { match: pattern, count: 100 });
        cursor = Number(next);
        if (Array.isArray(batch)) keys.push(...batch);
      } while (cursor !== 0);

      if (keys.length === 0) {
        return res.status(200).json({ responses: [] });
      }

      const values = await redis.mget(...keys);
      const responses = values
        .map(v => {
          if (!v) return null;
          try { return typeof v === 'string' ? JSON.parse(v) : v; } catch { return null; }
        })
        .filter(Boolean)
        .sort((a, b) => String(a.submittedAt).localeCompare(String(b.submittedAt)));

      return res.status(200).json({ responses });
    }

    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('responses error:', err);
    return res.status(500).json({ error: 'Internal error', detail: String(err && err.message || err) });
  }
}
