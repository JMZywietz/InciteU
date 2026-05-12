// =============================================================================
// ccStorage — client wrapper around /api/cc-storage
// Provides the same get/set/list/del surface the standalone artifact used
// via window.storage, so call sites don't have to change.
// All errors are caught and surfaced as null/false/[] rather than thrown —
// CC's UI handles "not yet there" as a normal state.
// =============================================================================

async function call(op, body) {
  const res = await fetch('/api/cc-storage', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ op, ...body }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`cc-storage ${res.status}: ${text.slice(0, 200)}`);
  }
  return res.json();
}

export async function get(key) {
  try {
    const r = await call('get', { key });
    return r?.value ?? null;
  } catch (e) {
    console.error('ccStorage.get failed', key, e);
    return null;
  }
}

export async function set(key, value) {
  try {
    const r = await call('set', { key, value });
    return r?.ok === true;
  } catch (e) {
    console.error('ccStorage.set failed', key, e);
    return false;
  }
}

export async function list(prefix) {
  try {
    const r = await call('list', { prefix });
    return Array.isArray(r?.keys) ? r.keys : [];
  } catch (e) {
    console.error('ccStorage.list failed', prefix, e);
    return [];
  }
}

export async function del(key) {
  try {
    const r = await call('delete', { key });
    return r?.ok === true;
  } catch (e) {
    console.error('ccStorage.del failed', key, e);
    return false;
  }
}
