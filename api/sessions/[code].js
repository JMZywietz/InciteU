import { Redis } from '@upstash/redis';

const redis = Redis.fromEnv();

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { code } = req.query;
    if (!code || typeof code !== 'string') {
      return res.status(400).json({ error: 'code is required' });
    }

    const raw = await redis.get(`fyw:${code}:config`);
    if (!raw) {
      return res.status(404).json({ error: 'Session not found or expired' });
    }

    const config = typeof raw === 'string' ? JSON.parse(raw) : raw;

    // Strip facilitator-only fields before returning
    const { tokenHash, ...publicConfig } = config;
    return res.status(200).json(publicConfig);
  } catch (err) {
    console.error('get session error:', err);
    return res.status(500).json({ error: 'Internal error', detail: String(err && err.message || err) });
  }
}
