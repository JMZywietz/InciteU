// =============================================================================
// CC Storage — Upstash Redis proxy
// Routes get/set/list/delete operations from the client through a serverless
// function so credentials stay server-side. Mirrors the simple key-value
// semantics the standalone artifact used via window.storage.
// =============================================================================

import { Redis } from '@upstash/redis';

// Vercel's "Upstash for Redis" Marketplace integration provisions credentials
// under the legacy KV_REST_API_* names (kept for backward compatibility with
// the original Vercel KV SDK). Construct the client explicitly rather than
// using Redis.fromEnv(), which looks for UPSTASH_REDIS_REST_* names.
const redis = new Redis({
  url: process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN,
});

export default async function handler(req, res) {
  // CORS / preflight (same-origin in production, but harmless)
  res.setHeader('Cache-Control', 'no-store');

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'method not allowed' });
  }

  const { op, key, value, prefix } = req.body || {};

  // Basic guards. Keys must be strings and prefixed with "cc:" so this endpoint
  // can never be used to read or write keys from other tools that share the
  // same Redis instance.
  const isCCKey = (k) => typeof k === 'string' && k.startsWith('cc:') && k.length < 256;
  const isCCPrefix = (p) => typeof p === 'string' && p.startsWith('cc:') && p.length < 256;

  try {
    if (op === 'get') {
      if (!isCCKey(key)) return res.status(400).json({ error: 'invalid key' });
      const v = await redis.get(key);
      return res.status(200).json({ value: v ?? null });
    }

    if (op === 'set') {
      if (!isCCKey(key)) return res.status(400).json({ error: 'invalid key' });
      // Soft size guard — JSON-serialized value capped at ~64KB
      const serialized = JSON.stringify(value);
      if (serialized.length > 65536) return res.status(413).json({ error: 'value too large' });
      // Upstash auto-serializes objects, so pass the raw value
      await redis.set(key, value);
      return res.status(200).json({ ok: true });
    }

    if (op === 'list') {
      if (!isCCPrefix(prefix)) return res.status(400).json({ error: 'invalid prefix' });
      const keys = [];
      let cursor = 0;
      let safety = 0;
      do {
        const [next, batch] = await redis.scan(cursor, { match: `${prefix}*`, count: 100 });
        keys.push(...batch);
        cursor = Number(next);
        safety += 1;
      } while (cursor !== 0 && safety < 50);
      return res.status(200).json({ keys });
    }

    if (op === 'delete') {
      if (!isCCKey(key)) return res.status(400).json({ error: 'invalid key' });
      await redis.del(key);
      return res.status(200).json({ ok: true });
    }

    return res.status(400).json({ error: 'unknown op' });
  } catch (e) {
    console.error('cc-storage error', op, e);
    return res.status(500).json({ error: String(e?.message || e).slice(0, 300) });
  }
}
