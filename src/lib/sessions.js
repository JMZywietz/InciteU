// ============================================================================
// /src/lib/sessions.js — Frontend adapter for /api/sessions
// ============================================================================
// Thin fetch wrapper for the readiness session backend. Parallel pattern to
// synthesize.js: no state, each function returns parsed JSON or throws an
// Error with a useful .message.
//
// All paths route through /api/sessions (Vercel serverless). The backend uses
// Vercel KV for storage. If KV is not yet provisioned in the Vercel project,
// every call here will reject with "Sessions backend not configured" — the
// Readiness tool handles that gracefully and tells the user to set up KV.
// ============================================================================

const ENDPOINT = '/api/sessions';

async function callJSON(opts) {
  const { method = 'POST', body, query } = opts;
  const url = query
    ? `${ENDPOINT}?${new URLSearchParams(query).toString()}`
    : ENDPOINT;
  const res = await fetch(url, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : {},
    body: body ? JSON.stringify(body) : undefined,
  });
  let data = {};
  try {
    data = await res.json();
  } catch (e) {
    // Empty or non-JSON response — keep data = {}
  }
  if (!res.ok) {
    const msg = data?.error || `Request failed (${res.status})`;
    const err = new Error(msg);
    err.status = res.status;
    err.detail = data?.detail;
    throw err;
  }
  return data;
}

// Facilitator creates a new session.
// Returns: { sessionCode, frame, aiOn, contributions:[], synthesis:null, createdAt, updatedAt }
export async function createSession(frame, aiOn) {
  return callJSON({ body: { action: 'create', frame, aiOn } });
}

// Anyone reads a session by code. Refreshes the 90-day TTL clock as a side effect.
// Returns full session object or throws (404 if not found).
export async function getSession(sessionCode) {
  return callJSON({ method: 'GET', query: { code: sessionCode } });
}

// Participant submits their answers. Upserts by name — re-submitting with the
// same name overwrites the prior contribution.
// Returns: { ok: true, n_contributions }
export async function contributeToSession(sessionCode, name, scores) {
  return callJSON({ body: { action: 'contribute', sessionCode, name, scores } });
}

// Facilitator saves the synthesis (after running it client-side / via synthesize()).
// Returns: { ok: true }
export async function saveSynthesis(sessionCode, synthesis) {
  return callJSON({ body: { action: 'synthesis', sessionCode, synthesis } });
}

// Facilitator permanently deletes a session.
// Returns: { ok: true }
export async function deleteSession(sessionCode) {
  return callJSON({ body: { action: 'delete', sessionCode } });
}
