// ============================================================================
// AI SYNTHESIS WRAPPER
// ============================================================================
// All tools (Three Moments, Vision, LCP, Pre-Mortem) call this instead of
// hitting api.anthropic.com directly. On Vercel, /api/synthesize is a
// serverless function that holds the API key and proxies the request.
//
// Tools must catch errors from this and degrade gracefully — none of them
// should hard-fail if synthesis is unavailable.
// ============================================================================

const ENDPOINT = '/api/synthesize';

/**
 * Send a messages-style request to the synthesis backend.
 * @param {object} payload - { model, max_tokens, messages, system? }
 * @returns {Promise<object>} - The Anthropic API response shape.
 */
export async function synthesize(payload) {
  const response = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(`Synthesis failed: ${response.status} ${text}`);
  }
  return response.json();
}

/**
 * Convenience: extract the first text block from a synthesis response.
 */
export function extractText(response) {
  if (!response || !Array.isArray(response.content)) return '';
  const textBlock = response.content.find((b) => b.type === 'text');
  return textBlock ? textBlock.text : '';
}
