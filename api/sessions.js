// ============================================================================
// /api/sessions — Vercel serverless function
// ============================================================================
// Session storage for the Readiness tool's group mode. Backed by Vercel KV
// (Upstash Redis REST API). No new npm dependency — calls the REST endpoints
// directly with fetch.
//
// SETUP (in Vercel dashboard, before this endpoint will work):
//   Project Settings → Storage → Connect Database → KV (Marketplace)
//   Vercel will auto-inject KV_REST_API_URL and KV_REST_API_TOKEN into env vars.
//
// Until KV is provisioned, this endpoint returns 503 and the group features in
// the Readiness tool gracefully tell the user the backend is not configured.
// Solo mode does not call this endpoint and works without KV.
//
// Designed to be reusable for other tools later (Vision group mode, Stakeholder
// Shoes Walk, etc.) — the session shape is generic enough.
// ============================================================================

const KV_URL = process.env.KV_REST_API_URL;
const KV_TOKEN = process.env.KV_REST_API_TOKEN;
const TTL_SECONDS = 60 * 60 * 24 * 90; // 90 days, refreshed on every read/write

const CODE_WORDS = [
  'forge', 'pivot', 'lattice', 'compass', 'anchor', 'ember', 'horizon',
  'thresh', 'orbit', 'spiral', 'beacon', 'kindle', 'gather', 'venture',
  'ripple', 'mirror', 'kite', 'fern', 'cairn', 'meadow', 'thicket',
  'harbor', 'lantern', 'tide', 'willow', 'sage', 'pebble', 'cinder',
  'tundra', 'summit', 'marrow', 'delta', 'verge', 'kestrel',
];

function genSessionCode() {
  const w = CODE_WORDS[Math.floor(Math.random() * CODE_WORDS.length)];
  const d = String(Math.floor(1000 + Math.random() * 9000));
  return `${w}-${d}`;
}

function kvKey(sessionCode) {
  return `readiness:${sessionCode}`;
}

async function kvGet(key) {
  const res = await fetch(`${KV_URL}/get/${encodeURIComponent(key)}`, {
    headers: { Authorization: `Bearer ${KV_TOKEN}` },
  });
  if (!res.ok) throw new Error(`KV get failed: ${res.status}`);
  const data = await res.json();
  return data.result; // null if not found, string if present
}

async function kvSet(key, value) {
  const v = typeof value === 'string' ? value : JSON.stringify(value);
  const res = await fetch(`${KV_URL}/set/${encodeURIComponent(key)}?EX=${TTL_SECONDS}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${KV_TOKEN}` },
    body: v,
  });
  if (!res.ok) throw new Error(`KV set failed: ${res.status}`);
  return true;
}

async function kvDel(key) {
  const res = await fetch(`${KV_URL}/del/${encodeURIComponent(key)}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${KV_TOKEN}` },
  });
  return res.ok;
}

export default async function handler(req, res) {
  if (!KV_URL || !KV_TOKEN) {
    return res.status(503).json({
      error: 'Sessions backend not configured. Provision Vercel KV in the project dashboard and KV_REST_API_URL / KV_REST_API_TOKEN will be auto-injected.',
    });
  }

  try {
    // ─── GET /api/sessions?code=X — fetch a session, refresh TTL ───
    if (req.method === 'GET') {
      const code = req.query?.code;
      if (!code) return res.status(400).json({ error: 'Missing code' });
      const raw = await kvGet(kvKey(code));
      if (!raw) return res.status(404).json({ error: 'Session not found' });
      const session = typeof raw === 'string' ? JSON.parse(raw) : raw;
      // Opening = activity → refresh TTL clock
      session.updatedAt = Date.now();
      await kvSet(kvKey(code), session);
      return res.status(200).json(session);
    }

    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const body = req.body || {};
    const action = body.action;

    // ─── action: create — facilitator creates a new session ───
    if (action === 'create') {
      const { frame, aiOn } = body;
      if (!frame || !frame.name) {
        return res.status(400).json({ error: 'frame.name required' });
      }
      let code = genSessionCode();
      for (let i = 0; i < 10; i++) {
        const existing = await kvGet(kvKey(code));
        if (!existing) break;
        code = genSessionCode();
      }
      const session = {
        sessionCode: code,
        frame,
        aiOn: !!aiOn,
        contributions: [],
        synthesis: null,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      await kvSet(kvKey(code), session);
      return res.status(200).json(session);
    }

    // ─── action: contribute — participant submits answers ───
    if (action === 'contribute') {
      const { sessionCode, name, scores } = body;
      if (!sessionCode || !name || !scores) {
        return res.status(400).json({ error: 'sessionCode, name, and scores required' });
      }
      const raw = await kvGet(kvKey(sessionCode));
      if (!raw) return res.status(404).json({ error: 'Session not found' });
      const session = typeof raw === 'string' ? JSON.parse(raw) : raw;
      session.contributions = (session.contributions || []).filter((c) => c.name !== name);
      session.contributions.push({ name, scores, submittedAt: Date.now() });
      session.updatedAt = Date.now();
      await kvSet(kvKey(sessionCode), session);
      return res.status(200).json({ ok: true, n_contributions: session.contributions.length });
    }

    // ─── action: synthesis — facilitator saves the synthesis ───
    if (action === 'synthesis') {
      const { sessionCode, synthesis } = body;
      if (!sessionCode || !synthesis) {
        return res.status(400).json({ error: 'sessionCode and synthesis required' });
      }
      const raw = await kvGet(kvKey(sessionCode));
      if (!raw) return res.status(404).json({ error: 'Session not found' });
      const session = typeof raw === 'string' ? JSON.parse(raw) : raw;
      session.synthesis = synthesis;
      session.updatedAt = Date.now();
      await kvSet(kvKey(sessionCode), session);
      return res.status(200).json({ ok: true });
    }

    // ─── action: delete — facilitator deletes a session ───
    if (action === 'delete') {
      const { sessionCode } = body;
      if (!sessionCode) return res.status(400).json({ error: 'sessionCode required' });
      await kvDel(kvKey(sessionCode));
      return res.status(200).json({ ok: true });
    }

    return res.status(400).json({ error: 'Unknown action. Expected: create, contribute, synthesis, delete.' });
  } catch (err) {
    console.error('[sessions] error:', err);
    return res.status(500).json({
      error: 'Sessions backend error',
      detail: String(err?.message || err),
    });
  }
}
