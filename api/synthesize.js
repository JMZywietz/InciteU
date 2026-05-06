// ============================================================================
// /api/synthesize — Vercel serverless function
// ============================================================================
// Proxies AI synthesis calls from the frontend to the Anthropic API,
// holding the API key server-side so it never reaches the browser.
//
// SETUP (in Vercel dashboard, after deployment):
//   Project Settings → Environment Variables → Add:
//     Name: ANTHROPIC_API_KEY
//     Value: <your key from console.anthropic.com>
//     Environments: Production, Preview, Development
//
// The frontend calls this via src/lib/synthesize.js — never directly.
// ============================================================================

export default async function handler(req, res) {
  // CORS / method guard
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({
      error: 'Server is missing ANTHROPIC_API_KEY. Set it in Vercel project settings.',
    });
  }

  try {
    const payload = req.body;

    // Minimal safety: enforce a reasonable max_tokens ceiling and require messages.
    if (!payload || !Array.isArray(payload.messages)) {
      return res.status(400).json({ error: 'Request must include a messages array.' });
    }
    const max_tokens = Math.min(payload.max_tokens || 1024, 4096);
    const model = payload.model || 'claude-sonnet-4-5';

    const upstream = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model,
        max_tokens,
        messages: payload.messages,
        ...(payload.system ? { system: payload.system } : {}),
      }),
    });

    const data = await upstream.json();
    return res.status(upstream.status).json(data);
  } catch (err) {
    console.error('[synthesize] error:', err);
    return res.status(500).json({ error: 'Synthesis proxy failed.', detail: String(err?.message || err) });
  }
}
