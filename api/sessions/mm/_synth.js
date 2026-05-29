/**
 * Synthesis pipeline for Many Mirrors, extracted from the former
 * /api/sessions/mm/[code]/synthesize.js so the router stays thin.
 *
 * NOTE: filename is underscore-prefixed on purpose — Vercel treats `_`-prefixed
 * files as libraries, NOT as Serverless Functions, so this does not count toward
 * the deployment function limit.
 *
 * Behavior is identical to the original synthesize endpoint. `synthesizeReport`
 * is auth-agnostic: callers must verify the subject token before invoking it.
 * Returns { status, body } so the router can relay the exact same responses
 * (400 for too few evaluators, 200 { report }, 500 'Synthesis failed').
 */
import { redis, TTL, loadEvals, refreshTTL } from './_lib.js';

const MIN_RESPONSES = 3;
const MODEL = 'claude-sonnet-4-5';

async function callClaude(prompt, maxTokens = 2000) {
  const apiKey = process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY;
  if (!apiKey) throw new Error('Server is missing ANTHROPIC_API_KEY');
  const r = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({ model: MODEL, max_tokens: maxTokens, messages: [{ role: 'user', content: prompt }] }),
  });
  if (!r.ok) { const text = await r.text(); throw new Error(`Anthropic API ${r.status}: ${text.slice(0,400)}`); }
  const data = await r.json();
  const text = (data.content || []).map(b => b?.type === 'text' ? b.text : '').join('').trim();
  const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim();
  try { return JSON.parse(cleaned); } catch { throw new Error(`Claude did not return valid JSON: ${text.slice(0,300)}`); }
}

function perQuestionPrompt(questionText, evalAnswers, selfAnswer) {
  const numbered = evalAnswers.map((a, i) => `[${i + 1}] ${a}`).join('\n\n');
  const selfBlock = selfAnswer ? `\nThe subject's own answer: "${selfAnswer}"\n(Include if directly relevant. Do NOT let it skew pattern analysis.)\n` : '';
  return `You are analyzing ${evalAnswers.length} evaluator responses to a 360-feedback question.\n\nQuestion: ${questionText}\n\nEvaluator responses:\n\n${numbered}\n${selfBlock}\nReturn strict JSON:\n{\n  "patterns": ["1-3 sentence observations about themes across multiple responses"],\n  "outliers": ["1-2 sentences on views held by one or few that diverge meaningfully"],\n  "absences": ["1-2 sentences on what a thoughtful observer would expect but did not appear"],\n  "quotes": ["3 to 5 verbatim or near-verbatim quotes - shuffle order, no attribution, light de-identification only"],\n  "categoryNote": "Optional 1-sentence note if different relationship types diverged notably. Empty string if nothing notable."\n}\n\nRules:\n- 2-4 patterns, 0-2 outliers, 0-2 absences, 3-5 quotes.\n- Do NOT attribute quotes by name, category, or response number.\n- Write patterns/outliers/absences as full, standalone sentences.\n- Output ONLY the JSON. No preamble, no markdown fences.`;
}

function overviewPrompt(subjectName, perQuestionResults) {
  const summary = perQuestionResults.map((r, i) => {
    const patterns = (r.patterns || []).slice(0,2).join(' ');
    const outliers = (r.outliers || []).slice(0,1).join(' ');
    return `Q${i + 1}: ${patterns}${outliers ? ' Outlier: ' + outliers : ''}`;
  }).join('\n\n');
  return `You are writing the headline "key takeaways" section for a 360-feedback report for ${subjectName}.\n\nBelow are cross-question synthesis summaries. Do NOT simply summarize - distill the 3-5 most important, cross-cutting things ${subjectName} needs to understand.\n\n${summary}\n\nReturn strict JSON:\n{\n  "themes": ["theme 1 - 2-3 sentences, direct, specific, humane", "theme 2", "theme 3"]\n}\n\nRules:\n- 3-5 themes.\n- Write as if speaking directly to ${subjectName}.\n- Every theme should be specific to what the evaluators said.\n- Output ONLY the JSON.`;
}

function selfReflectionPrompt(subjectName, overviewThemes, perQuestionResults, selfAnswers, questionOrder, questions) {
  const themeSummary = (overviewThemes || []).join('\n- ');
  const selfBlock = questionOrder.map(qid => {
    const q = questions.find(q => q.id === qid);
    const ans = selfAnswers[qid];
    if (!ans) return null;
    return `${q ? q.text : qid}: "${ans}"`;
  }).filter(Boolean).join('\n\n');
  return `You are writing the self-vs-others section of a 360-feedback report for ${subjectName}.\n\nWhat evaluators said (key themes):\n- ${themeSummary}\n\nWhat ${subjectName} said about themselves:\n${selfBlock}\n\nReturn strict JSON:\n{\n  "alignments": ["2-3 sentences each. Where did ${subjectName}'s self-view align with what evaluators saw?"],\n  "gaps": ["2-3 sentences each. Where did the self-view differ from evaluator perspectives - in either direction?"]\n}\n\nRules:\n- 1-3 alignments, 1-3 gaps.\n- Be specific.\n- Gaps can be positive or developmental.\n- Write directly to ${subjectName}.\n- Output ONLY the JSON.`;
}

/**
 * Runs the full synthesis pipeline. The subject token MUST already be verified
 * by the caller. Returns { status, body } mirroring the original endpoint.
 */
export async function synthesizeReport(uc, config) {
  try {
    const evals = await loadEvals(uc);
    const completedEvals = evals.filter(e => e.status === 'completed');
    if (completedEvals.length < MIN_RESPONSES) {
      return { status: 400, body: { error: `Need at least ${MIN_RESPONSES} evaluators (${completedEvals.length} so far)` } };
    }
    const responseKeys = completedEvals.map(e => `mm:${uc}:response:${e.id}`);
    const responseRaws = await redis.mget(...responseKeys);
    const responses = responseRaws.map(r => { if (!r) return null; try { return typeof r === 'string' ? JSON.parse(r) : r; } catch { return null; } }).filter(Boolean);
    const selfRaw = await redis.get(`mm:${uc}:self`);
    const selfRecord = selfRaw ? (typeof selfRaw === 'string' ? JSON.parse(selfRaw) : selfRaw) : null;
    const selfAnswers = selfRecord?.answers || {};
    const { questions, questionOrder } = config;
    const perQuestionResults = await Promise.all(questionOrder.map(async qid => {
      const q = questions.find(q => q.id === qid);
      if (!q) return null;
      const evalAnswers = responses.map(r => (r.answers?.[qid] || '').trim()).filter(Boolean);
      if (evalAnswers.length === 0) return { questionId: qid, patterns: [], outliers: [], absences: [], quotes: [], categoryNote: '' };
      const result = await callClaude(perQuestionPrompt(q.text, evalAnswers, selfAnswers[qid] || null), 2000);
      return { questionId: qid, patterns: result.patterns || [], outliers: result.outliers || [], absences: result.absences || [], quotes: result.quotes || [], categoryNote: result.categoryNote || '' };
    }));
    const overviewResult = await callClaude(overviewPrompt(config.subjectName, perQuestionResults.filter(Boolean)), 1500);
    const overview = { themes: overviewResult.themes || [] };
    let selfReflection = null;
    if (selfRecord && Object.values(selfAnswers).some(v => v?.trim())) {
      const srResult = await callClaude(selfReflectionPrompt(config.subjectName, overview.themes, perQuestionResults.filter(Boolean), selfAnswers, questionOrder, questions), 1500);
      selfReflection = { alignments: srResult.alignments || [], gaps: srResult.gaps || [] };
    }
    const report = { generatedAt: new Date().toISOString(), overview, perQuestion: perQuestionResults.filter(Boolean), selfReflection };
    await redis.set(`mm:${uc}:report`, JSON.stringify(report), { ex: TTL });
    await refreshTTL(uc);
    return { status: 200, body: { report } };
  } catch (err) {
    console.error('mm synthesize error:', err);
    return { status: 500, body: { error: 'Synthesis failed', detail: String(err?.message || err) } };
  }
}
