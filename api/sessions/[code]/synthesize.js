import { Redis } from '@upstash/redis';
import crypto from 'crypto';

const redis = Redis.fromEnv();
const TTL_SECONDS = 60 * 60 * 24 * 30; // 30 days

function sha256(input) {
  return crypto.createHash('sha256').update(input).digest('hex');
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
    try {
      out[q.id] = typeof v === 'string' ? JSON.parse(v) : v;
    } catch {
      // skip
    }
  });
  return out;
}

function buildPrompt(question, contextBlurb, answers) {
  const blurb = contextBlurb && contextBlurb.trim()
    ? `\n\nFacilitator context (use this to gauge what might be notably absent):\n${contextBlurb.trim()}`
    : '';
  const numbered = answers.map((a, i) => `[${i + 1}] ${a}`).join('\n\n');
  return `You are helping a facilitator make sense of team input to a single open-ended question.${blurb}

Question: ${question}

Team responses (${answers.length} total):

${numbered}

Analyze the responses and return strict JSON with three fields:

{
  "patterns": [ { "title": "short label", "detail": "1-3 sentence description with examples or response numbers in brackets" } ],
  "outliers": [ { "title": "short label", "detail": "1-2 sentence description" } ],
  "absences": [ { "title": "short label", "detail": "1-2 sentence description of what is notably missing given the question and context" } ]
}

Rules:
- 2-5 items per category. If a category is genuinely empty, return [].
- Quote sparingly. Reference response numbers in brackets like [3] when useful.
- Patterns = themes shared by multiple responses.
- Outliers = views held by one or few that diverge meaningfully.
- Absences = perspectives, considerations, or angles a thoughtful observer would expect to see but that the responses do not contain.
- Output ONLY the JSON object. No preamble, no markdown fences.`;
}

async function callAnthropic(prompt) {
  const apiKey = process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY;
  if (!apiKey) throw new Error('Server is missing ANTHROPIC_API_KEY');

  const r = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-5',
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!r.ok) {
    const text = await r.text();
    throw new Error(`Anthropic API ${r.status}: ${text.slice(0, 400)}`);
  }

  const data = await r.json();
  const text = (data.content || []).map(b => b && b.type === 'text' ? b.text : '').join('').trim();
  // Strip ```json fences if any
  const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim();
  let parsed;
  try {
    parsed = JSON.parse(cleaned);
  } catch (e) {
    throw new Error(`AI did not return valid JSON: ${text.slice(0, 300)}`);
  }
  return parsed;
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

    if (!checkFacilitatorToken(req, config)) {
      return res.status(403).json({ error: 'Facilitator token required' });
    }

    if (req.method === 'GET') {
      const syntheses = await loadAllSyntheses(code, config.questions);
      return res.status(200).json({ syntheses });
    }

    if (req.method === 'POST') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
      const { questionId } = body;
      if (!questionId || typeof questionId !== 'string') {
        return res.status(400).json({ error: 'questionId is required' });
      }

      const question = config.questions.find(q => q.id === questionId);
      if (!question) {
        return res.status(400).json({ error: `Unknown questionId: ${questionId}` });
      }

      const allResponses = await loadAllResponses(code);
      const answers = allResponses
        .map(r => r.answers && r.answers[questionId])
        .filter(t => typeof t === 'string' && t.trim().length > 0);

      if (answers.length === 0) {
        return res.status(400).json({ error: 'No responses to this question yet' });
      }

      const prompt = buildPrompt(question.text, config.contextBlurb || '', answers);
      const result = await callAnthropic(prompt);

      const synthesis = {
        questionId,
        questionText: question.text,
        responseCount: answers.length,
        patterns: Array.isArray(result.patterns) ? result.patterns : [],
        outliers: Array.isArray(result.outliers) ? result.outliers : [],
        absences: Array.isArray(result.absences) ? result.absences : [],
        synthesizedAt: new Date().toISOString(),
      };

      await redis.set(`fyw:${code}:synthesis:${questionId}`, JSON.stringify(synthesis), { ex: TTL_SECONDS });
      return res.status(200).json({ synthesis });
    }

    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('synthesize error:', err);
    return res.status(500).json({ error: 'Internal error', detail: String(err && err.message || err) });
  }
}
