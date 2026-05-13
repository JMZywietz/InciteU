import React, { useState } from 'react';
import { C, F } from '../theme.js';
import { btn, btnHoverIn, btnHoverOut, eyebrow, heading, fieldInput } from '../styles.js';
import { useAppNavigate } from '../lib/useAppNavigate.js';
import { escapeHTML, downloadHTML } from '../lib/utils.js';
import { synthesize, extractText } from '../lib/synthesize.js';
import {
  createSession,
  getSession,
  contributeToSession,
  saveSynthesis,
  deleteSession,
} from '../lib/sessions.js';

// ============================================================================
// DATA
// ============================================================================
const READINESS_DIMS = [
  { id: 'pre', label: 'Preconditions', desc: 'Psychological safety, accountability, leadership readiness', questions: [
    'People in our organisation can openly disagree with leadership without fear of repercussions.',
    'When someone violates our stated values, there are real and consistent consequences — regardless of seniority.',
    'Our senior leaders have demonstrated genuine willingness to change their own behaviour, not just ask others to change.',
  ]},
  { id: 'why', label: 'The Why', desc: 'Burning platform, compelling vision, urgency', questions: [
    "We can clearly articulate why culture change is necessary right now — in specific, concrete terms that go beyond 'we need to improve'.",
    "Most people in the organisation would agree on what's at stake if we don't change.",
    "We have a compelling picture of what the future looks like — specific enough that people can see themselves in it.",
  ]},
  { id: 'who', label: 'The Who', desc: 'Leadership shadow, coalition, role modelling', questions: [
    'Our leadership team is genuinely aligned on the need for change — not just publicly supportive while privately sceptical.',
    'We have identified and engaged the informal influencers across the organisation, not just the formal hierarchy.',
    'Leaders are willing to go first in changing their own behaviour — even when it feels uncomfortable or risky.',
  ]},
  { id: 'what', label: 'The What', desc: 'North Star clarity, values, behavioural specificity', questions: [
    'We have a clear North Star that describes the culture we want — in specific, observable behavioural terms, not just aspirational slogans.',
    'We have mapped the gap between our current culture and our desired culture honestly — including the parts that are hard to hear.',
    'Our values are genuinely understood and used to guide decisions, not just printed on walls and forgotten.',
  ]},
  { id: 'engineer', label: 'How · Engineer track', desc: 'Structured process, systems alignment, measurement', questions: [
    'We have a structured plan for culture change with clear phases, milestones, and accountability — not just good intentions.',
    'We have reviewed our systems (incentives, promotions, performance reviews, hiring) for alignment with the culture we say we want.',
    'We are measuring culture change using real indicators — not just annual engagement surveys.',
  ]},
  { id: 'ecologist', label: 'How · Ecologist track', desc: 'Emergence, experiments, adaptive practice', questions: [
    'We are running small, safe-to-fail experiments to learn what works rather than betting everything on one big rollout.',
    'When experiments fail, we treat them as learning rather than blame — and we actually change course based on what we learn.',
    'We are comfortable holding direction and guardrails while allowing people at the edges to adapt and innovate.',
  ]},
];

const SCALE_LABELS = ['Strongly disagree', 'Somewhat disagree', 'Somewhat agree', 'Strongly agree'];

function bandFor(score, max) {
  const pct = score / max;
  if (pct >= 0.75) return { label: 'Working well', color: C.good, bg: 'rgba(159, 190, 127, 0.12)' };
  if (pct >= 0.45) return { label: 'Foundations emerging', color: C.okay, bg: 'rgba(212, 185, 110, 0.12)' };
  return { label: 'Needs significant time and attention', color: C.needsWork, bg: 'rgba(216, 138, 122, 0.12)' };
}

// ============================================================================
// HELPERS — synthesis + AI prompts
// ============================================================================

function parseJSONLoose(text) {
  const stripped = text.replace(/```json|```/g, '').trim();
  const first = stripped.indexOf('{');
  const last = stripped.lastIndexOf('}');
  if (first < 0 || last <= first) throw new Error('No JSON object in AI response');
  return JSON.parse(stripped.slice(first, last + 1));
}

// Deterministic synthesis — always computed, no AI needed. Powers the data
// view that backs both the AI-on and AI-off facilitator screens.
function computeReadinessSynthesis(contributions, dims) {
  if (!contributions || contributions.length === 0) return null;
  function totalForPerson(scoreMap, dim) {
    return dim.questions.reduce((s, _, i) => s + (scoreMap[dim.id + '_' + i] || 0), 0);
  }
  const perPersonOverall = contributions.map((c) => ({
    name: c.name,
    overall: dims.reduce((s, d) => s + totalForPerson(c.scores, d), 0),
  }));
  const overallMax = dims.length * 12;
  const teamAvg = perPersonOverall.reduce((s, p) => s + p.overall, 0) / perPersonOverall.length;
  const teamBand = bandFor(teamAvg, overallMax).label;
  const minOverall = Math.min.apply(null, perPersonOverall.map((p) => p.overall));
  const maxOverall = Math.max.apply(null, perPersonOverall.map((p) => p.overall));
  const byDimension = dims.map((d) => {
    const personScores = contributions
      .map((c) => ({ name: c.name, score: totalForPerson(c.scores, d) }))
      .sort((a, b) => b.score - a.score);
    const max = personScores[0] ? personScores[0].score : 0;
    const min = personScores.length ? personScores[personScores.length - 1].score : 0;
    const avg = personScores.reduce((s, p) => s + p.score, 0) / personScores.length;
    const spread = max - min;
    const consensus = spread <= 2 ? 'high' : spread <= 5 ? 'moderate' : 'low';
    return {
      dim_id: d.id,
      label: d.label,
      desc: d.desc,
      team_avg: Math.round(avg * 10) / 10,
      spread,
      consensus_level: consensus,
      highest: personScores[0],
      lowest: personScores[personScores.length - 1],
      all_scores: personScores,
    };
  });
  return {
    overall: {
      n_participants: contributions.length,
      team_avg_score: Math.round(teamAvg * 10) / 10,
      team_avg_band: teamBand,
      score_range: { min: minOverall, max: maxOverall },
      overall_max: overallMax,
    },
    by_dimension: byDimension,
    per_person_overall: perPersonOverall,
  };
}

async function runAiSynthesis(session, dims) {
  const dimMeta = dims.map((d) => ({ id: d.id, label: d.label, desc: d.desc, statements: d.questions }));
  const contribData = session.contributions.map((c) => ({ name: c.name, scores: c.scores }));
  const prompt = "You are analyzing a team's culture-change readiness self-assessment. Each person answered the same 18 statements on a 4-point scale (1=Strongly disagree, 4=Strongly agree). Statements are grouped into 6 dimensions: Preconditions, The Why, The Who, The What, How (Engineer track), How (Ecologist track).\n\n"
    + "Your job: surface where this team agrees, where it disagrees, what the divergences likely mean, and what the team should discuss first.\n\n"
    + "Session name: " + (session.frame.name || "(unnamed)") + "\n"
    + "Optional team context from facilitator: " + (session.frame.context || "(none)") + "\n\n"
    + "Participants and their answers (scores keyed by dimension id + statement index):\n"
    + JSON.stringify(contribData, null, 2) + "\n\n"
    + "Statements and dimensions:\n"
    + JSON.stringify(dimMeta, null, 2) + "\n\n"
    + "Return ONLY valid JSON with this exact shape, no markdown fences, no preamble:\n"
    + "{\n"
    + "  \"biggest_divergences\": [\n"
    + "    {\n"
    + "      \"dim_label\": \"exact label from the dimensions list\",\n"
    + "      \"what_emerged\": \"1-2 sentences naming the high/low scores and the participants who hold them\",\n"
    + "      \"likely_reading\": \"1-2 sentences interpreting the pattern. If you cannot interpret without more context, say so honestly.\",\n"
    + "      \"conversation_prompt\": \"one concrete question the facilitator should put on the table\"\n"
    + "    }\n"
    + "  ],\n"
    + "  \"consensus_areas\": [\n"
    + "    {\n"
    + "      \"dim_label\": \"exact label from the dimensions list\",\n"
    + "      \"team_view\": \"1-2 sentences. Distinguish high-consensus (everyone scored 3-4) from low-consensus (everyone scored 1-2).\",\n"
    + "      \"implication\": \"what this means for action\"\n"
    + "    }\n"
    + "  ],\n"
    + "  \"the_real_question\": \"1-2 sentences. Look at the pattern across dimensions. What is this team actually wrestling with? Often the divergence itself is the answer, not the average scores.\",\n"
    + "  \"what_to_discuss_first\": [ \"2-3 concrete prompts. Each one references specific names and dimensions from the data.\" ]\n"
    + "}\n\n"
    + "Rules:\n"
    + "- biggest_divergences: pick the 2-3 dimensions with the largest spread. Name names.\n"
    + "- consensus_areas: pick 1-2 dimensions where the team agrees. High vs low consensus matters.\n"
    + "- Talk like a coach, not a textbook. Warm, direct, zero corporate jargon. Never say \"leverage\" or \"synergize\" or \"align\".\n"
    + "- Return ONLY the JSON.";
  const data = await synthesize({
    model: 'claude-sonnet-4-5',
    max_tokens: 2200,
    messages: [{ role: 'user', content: prompt }],
  });
  return parseJSONLoose(extractText(data));
}

async function runAiSoloCommentary(scores, dims) {
  const summary = dims.map((d) => {
    let s = 0;
    for (let i = 0; i < d.questions.length; i++) s += scores[d.id + '_' + i] || 0;
    return { label: d.label, score: s, max: 12, band: bandFor(s, 12).label };
  });
  const prompt = "A leader has just completed a self-assessment of their organisation's readiness for culture change. They scored each of 6 dimensions out of 12.\n\n"
    + "Their results:\n" + JSON.stringify(summary, null, 2) + "\n\n"
    + "For each dimension, write a single short paragraph (2-3 sentences) directly to them — what their score on this dimension typically signals, and one specific question they should bring to a leadership conversation about it. Be warm, direct, zero corporate jargon. Never say \"leverage\" or \"synergize\" or \"align\". Use the second person (\"you\", \"your team\").\n\n"
    + "Return ONLY valid JSON with this shape, no markdown fences, no preamble:\n"
    + "{\n"
    + "  \"by_label\": {\n"
    + "    \"Preconditions\": \"your commentary\",\n"
    + "    \"The Why\": \"your commentary\",\n"
    + "    \"The Who\": \"your commentary\",\n"
    + "    \"The What\": \"your commentary\",\n"
    + "    \"How · Engineer track\": \"your commentary\",\n"
    + "    \"How · Ecologist track\": \"your commentary\"\n"
    + "  }\n"
    + "}";
  const data = await synthesize({
    model: 'claude-sonnet-4-5',
    max_tokens: 1500,
    messages: [{ role: 'user', content: prompt }],
  });
  return parseJSONLoose(extractText(data));
}

// ============================================================================
// DOWNLOAD HELPERS
// ============================================================================

function downloadSoloResults(scores, dims, commentary) {
  function totalFor(dim) {
    return dim.questions.reduce((s, _, i) => s + (scores[dim.id + '_' + i] || 0), 0);
  }
  const overallScore = dims.reduce((s, d) => s + totalFor(d), 0);
  const overallMax = dims.length * 12;
  const overall = bandFor(overallScore, overallMax);
  const dimRows = dims.map((d) => {
    const score = totalFor(d);
    const band = bandFor(score, 12);
    const pct = Math.round((score / 12) * 100);
    const cm = commentary && commentary.by_label && commentary.by_label[d.label];
    return `<div class="dim-row">
        <div class="dim-header">
          <div><div class="dim-title">${escapeHTML(d.label)}</div><div class="dim-desc">${escapeHTML(d.desc)}</div></div>
          <div class="dim-meta"><span style="color:${band.color};font-family:monospace">${score}/12</span>
          <span style="color:${band.color};background:${band.bg};border:1px solid ${band.color}44;padding:2px 10px;border-radius:3px;font-size:11px;letter-spacing:0.06em;text-transform:uppercase">${escapeHTML(band.label)}</span></div>
        </div>
        <div class="bar-track"><div class="bar-fill" style="width:${pct}%;background:${band.color}"></div></div>
        ${cm ? `<div class="dim-comment">${escapeHTML(cm)}</div>` : ''}
      </div>`;
  }).join('');
  const summary = overall.label === 'Working well' ? 'You have strong conditions across most dimensions. The work ahead is about sustaining this foundation and moving deliberately into execution.' : overall.label === 'Foundations emerging' ? 'You have real foundations to build on — and some important gaps to address first. Naming those gaps now is itself a form of readiness.' : 'Significant conditions are absent across multiple dimensions. This is important information — not a reason to stop, but a reason to be very deliberate about what you build first.';
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Readiness Results</title>
<style>
  body { font-family: Georgia, serif; max-width: 800px; margin: 40px auto; padding: 0 24px; color: #2A2A2A; line-height: 1.65; background: #fff; }
  h1 { font-size: 32px; font-weight: 400; color: #1F3937; margin-bottom: 8px; }
  .eyebrow { font-size: 11px; letter-spacing: 0.22em; text-transform: uppercase; color: #6B8159; font-family: monospace; margin-bottom: 16px; }
  .overall { padding: 24px; border-radius: 6px; margin: 24px 0 40px; background: ${overall.bg}; border: 1px solid ${overall.color}44; }
  .score { font-family: Georgia, serif; font-size: 36px; font-weight: 400; color: ${overall.color}; margin-right: 12px; }
  .band-label { font-size: 14px; letter-spacing: 0.08em; text-transform: uppercase; font-family: monospace; color: ${overall.color}; }
  .summary { font-size: 14px; color: #4A5C50; line-height: 1.7; margin-top: 12px; }
  .dim-row { padding: 20px; background: #f9f9fb; border: 1px solid #e5e7eb; border-radius: 6px; margin-bottom: 12px; }
  .dim-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; flex-wrap: wrap; gap: 12px; }
  .dim-title { font-family: Georgia, serif; font-size: 17px; font-weight: 400; color: #1F3937; }
  .dim-desc { font-size: 11px; color: #6A7A6E; margin-top: 2px; }
  .dim-meta { display: flex; align-items: center; gap: 10px; }
  .bar-track { height: 4px; background: #e5e7eb; border-radius: 2px; }
  .bar-fill { height: 100%; border-radius: 2px; }
  .dim-comment { margin-top: 16px; padding-top: 16px; border-top: 1px solid #e5e7eb; font-size: 13px; color: #4A5C50; line-height: 1.7; font-style: italic; }
  .footer { margin-top: 48px; padding-top: 20px; border-top: 1px solid #E0DFD2; font-size: 11px; color: #999; text-align: center; font-family: monospace; letter-spacing: 0.1em; text-transform: uppercase; }
</style></head><body>
<div class="eyebrow">InciteU · Self-assessment</div>
<h1>Culture Change Readiness</h1>
<p style="font-size:14px;color:#6A7A6E;margin:12px 0 0;font-style:italic">A mirror, not a verdict.</p>
<div class="overall">
  <div style="font-size:11px;letter-spacing:0.22em;text-transform:uppercase;color:${overall.color};font-family:monospace;margin-bottom:8px">Overall readiness</div>
  <div style="display:flex;align-items:baseline;flex-wrap:wrap"><span class="score">${overallScore} / ${overallMax}</span><span class="band-label">${escapeHTML(overall.label)}</span></div>
  <p class="summary">${summary}</p>
</div>
<div style="font-size:11px;letter-spacing:0.22em;text-transform:uppercase;color:#6A7A6E;margin-bottom:20px;font-family:monospace">By dimension</div>
${dimRows}
<div class="footer">From InciteU · ${new Date().toLocaleDateString()}</div>
</body></html>`;
  downloadHTML(html, `readiness-results-${new Date().toISOString().slice(0,10)}.html`);
}

function downloadGroupResults(session) {
  const syn = session.synthesis;
  if (!syn) return;
  const dimRows = syn.by_dimension.map((d) => {
    const consensusLabel = d.consensus_level === 'high' ? 'High consensus' : d.consensus_level === 'moderate' ? 'Moderate spread' : 'Low consensus';
    const scoreChips = d.all_scores.map((p) =>
      `<span style="display:inline-block;color:#6B8159;font-family:monospace;font-size:11px;border:1px solid #C5D49B33;padding:3px 10px;border-radius:3px;margin:2px 4px 2px 0">${escapeHTML(p.name)}: ${p.score}/12</span>`
    ).join('');
    return `<div class="dim-row">
      <div class="dim-header">
        <div><div class="dim-title">${escapeHTML(d.label)}</div><div class="dim-desc">${escapeHTML(d.desc)}</div></div>
        <div class="dim-meta"><span style="font-family:monospace;font-size:12px;color:#4A5C50">Avg ${d.team_avg}/12</span>
        <span style="font-family:monospace;font-size:11px;padding:2px 10px;border-radius:3px;border:1px solid #6B815944;color:#6B8159">${consensusLabel}</span></div>
      </div>
      <div style="margin-top:12px">${scoreChips}</div>
    </div>`;
  }).join('');
  const aiBlock = syn.ai ? `
    <div class="ai-section">
      <div class="eyebrow" style="color:#6B8159">AI synthesis</div>
      ${syn.ai.the_real_question ? `<h3>The real question</h3><p class="real-q">${escapeHTML(syn.ai.the_real_question)}</p>` : ''}
      ${(syn.ai.biggest_divergences || []).length ? `<h3>Biggest divergences</h3>${syn.ai.biggest_divergences.map((b) => `
        <div class="ai-card">
          <div class="ai-card-title">${escapeHTML(b.dim_label)}</div>
          <p>${escapeHTML(b.what_emerged)}</p>
          <p><em>${escapeHTML(b.likely_reading)}</em></p>
          <p class="prompt">→ ${escapeHTML(b.conversation_prompt)}</p>
        </div>`).join('')}` : ''}
      ${(syn.ai.consensus_areas || []).length ? `<h3>Consensus areas</h3>${syn.ai.consensus_areas.map((c) => `
        <div class="ai-card">
          <div class="ai-card-title">${escapeHTML(c.dim_label)}</div>
          <p>${escapeHTML(c.team_view)}</p>
          <p><em>${escapeHTML(c.implication)}</em></p>
        </div>`).join('')}` : ''}
      ${(syn.ai.what_to_discuss_first || []).length ? `<h3>What to discuss first</h3><ul>${syn.ai.what_to_discuss_first.map((w) => `<li>${escapeHTML(w)}</li>`).join('')}</ul>` : ''}
    </div>` : '';
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Team Readiness — ${escapeHTML(session.frame.name || session.sessionCode)}</title>
<style>
  body { font-family: Georgia, serif; max-width: 840px; margin: 40px auto; padding: 0 24px; color: #2A2A2A; line-height: 1.65; background: #fff; }
  h1 { font-size: 32px; font-weight: 400; color: #1F3937; margin-bottom: 8px; }
  h3 { font-family: Georgia, serif; font-size: 20px; font-weight: 400; color: #1F3937; margin: 24px 0 12px; }
  .eyebrow { font-size: 11px; letter-spacing: 0.22em; text-transform: uppercase; color: #6B8159; font-family: monospace; margin-bottom: 16px; }
  .meta { font-size: 13px; color: #6A7A6E; margin: 8px 0 32px; font-family: monospace; }
  .dim-row { padding: 18px; background: #f9f9fb; border: 1px solid #e5e7eb; border-radius: 6px; margin-bottom: 10px; }
  .dim-header { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; }
  .dim-title { font-family: Georgia, serif; font-size: 17px; font-weight: 400; color: #1F3937; }
  .dim-desc { font-size: 11px; color: #6A7A6E; margin-top: 2px; font-style: italic; }
  .dim-meta { display: flex; align-items: center; gap: 10px; }
  .ai-section { margin-top: 36px; padding: 24px; border: 1px solid #6B815944; border-radius: 6px; background: #6B81590a; }
  .real-q { font-style: italic; font-size: 17px; line-height: 1.6; color: #1F3937; margin-bottom: 12px; }
  .ai-card { margin-bottom: 14px; padding: 14px; background: #fff; border-radius: 4px; border-left: 3px solid #6B8159; }
  .ai-card-title { font-family: Georgia, serif; font-size: 15px; font-weight: 400; margin-bottom: 6px; color: #1F3937; }
  .ai-card p { font-size: 13px; line-height: 1.7; color: #4A5C50; margin-top: 4px; }
  .prompt { color: #6B8159; font-weight: 500; margin-top: 8px !important; }
  ul { padding-left: 20px; font-size: 13px; line-height: 1.7; color: #4A5C50; }
  li { margin-bottom: 6px; }
  .footer { margin-top: 48px; padding-top: 20px; border-top: 1px solid #E0DFD2; font-size: 11px; color: #999; text-align: center; font-family: monospace; letter-spacing: 0.1em; text-transform: uppercase; }
</style></head><body>
<div class="eyebrow">InciteU · Team readiness</div>
<h1>${escapeHTML(session.frame.name || 'Team readiness')}</h1>
<div class="meta">${syn.overall.n_participants} participants · Team avg ${syn.overall.team_avg_score}/${syn.overall.overall_max} (${escapeHTML(syn.overall.team_avg_band)}) · Range ${syn.overall.score_range.min}–${syn.overall.score_range.max}</div>
<div class="eyebrow">By dimension</div>
${dimRows}
${aiBlock}
<div class="footer">From InciteU · ${new Date().toLocaleDateString()}</div>
</body></html>`;
  downloadHTML(html, `team-readiness-${new Date().toISOString().slice(0,10)}.html`);
}

// ============================================================================
// COMPONENT
// ============================================================================
export default function ReadinessPage() {
  const navigate = useAppNavigate();

  // View state
  const [view, setView] = useState('mode-chooser');
  // Views:
  //   mode-chooser, solo-assess, solo-results,
  //   facil-setup, facil-share, facil-dashboard, facil-synthesis, facil-delete-confirm,
  //   part-join, part-assess, part-thanks

  // Shared assessment state
  const [scores, setScores] = useState({});

  // Solo state
  const [soloAiOn, setSoloAiOn] = useState(true);
  const [soloCommentary, setSoloCommentary] = useState(null);
  const [soloCommentaryLoading, setSoloCommentaryLoading] = useState(false);
  const [soloCommentaryError, setSoloCommentaryError] = useState(null);

  // Facilitator state
  const [frame, setFrame] = useState({ name: '', context: '', participants: '', deadline: '' });
  const [groupAiOn, setGroupAiOn] = useState(true);
  const [session, setSession] = useState(null);
  const [codeCopied, setCodeCopied] = useState(false);
  const [synthLoading, setSynthLoading] = useState(false);
  const [synthError, setSynthError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [setupError, setSetupError] = useState(null);

  // Participant state
  const [joinCode, setJoinCode] = useState('');
  const [partName, setPartName] = useState('');
  const [joinError, setJoinError] = useState(null);
  const [joinedSession, setJoinedSession] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Derived
  function totalFor(dim) {
    return dim.questions.reduce((s, _, i) => s + (scores[dim.id + '_' + i] || 0), 0);
  }
  const allAnswered = READINESS_DIMS.every((d) => d.questions.every((_, i) => scores[d.id + '_' + i]));
  function setScore(dimId, qi, val) { setScores((s) => ({ ...s, [dimId + '_' + qi]: val })); }

  // ─── Handlers ────────────────────────────────────────────────────────────

  async function handleCreateSession() {
    if (!frame.name.trim()) return;
    setSetupError(null);
    try {
      const newSession = await createSession(frame, groupAiOn);
      setSession(newSession);
      setView('facil-share');
    } catch (e) {
      setSetupError(e.message + ' (Provision Vercel KV in the project dashboard if you haven\u2019t yet.)');
    }
  }

  async function handleSoloSubmit() {
    setView('solo-results');
    if (!soloAiOn) return;
    setSoloCommentaryLoading(true);
    setSoloCommentaryError(null);
    try {
      const result = await runAiSoloCommentary(scores, READINESS_DIMS);
      setSoloCommentary(result);
    } catch (e) {
      setSoloCommentaryError('AI commentary unavailable. Your results above are complete on their own.');
    }
    setSoloCommentaryLoading(false);
  }

  async function handleJoinSession() {
    setJoinError(null);
    if (!joinCode.trim() || !partName.trim()) {
      setJoinError('Please enter both the session code and your name.');
      return;
    }
    try {
      const s = await getSession(joinCode.trim().toLowerCase());
      setJoinedSession(s);
      setScores({});
      setView('part-assess');
    } catch (e) {
      if (e.status === 404) {
        setJoinError('Session not found. Check the code with your facilitator.');
      } else {
        setJoinError(e.message);
      }
    }
  }

  async function handleParticipantSubmit() {
    if (!joinedSession) return;
    setSubmitting(true);
    try {
      await contributeToSession(joinedSession.sessionCode, partName.trim(), scores);
      setView('part-thanks');
    } catch (e) {
      setJoinError('Could not submit your answers: ' + e.message);
    }
    setSubmitting(false);
  }

  async function handleRefreshDashboard() {
    if (!session) return;
    setRefreshing(true);
    try {
      const fresh = await getSession(session.sessionCode);
      setSession(fresh);
    } catch (e) { /* ignore — keep last known */ }
    setRefreshing(false);
  }

  async function handleRunSynthesis() {
    if (!session || session.contributions.length < 2) return;
    setSynthLoading(true);
    setSynthError(null);
    const deterministic = computeReadinessSynthesis(session.contributions, READINESS_DIMS);
    let aiPart = null;
    if (session.aiOn) {
      try { aiPart = await runAiSynthesis(session, READINESS_DIMS); }
      catch (e) { setSynthError('AI synthesis unavailable. Showing data-only synthesis below — still useful.'); }
    }
    const full = { ...deterministic, ai: aiPart };
    try {
      await saveSynthesis(session.sessionCode, full);
      setSession((s) => ({ ...s, synthesis: full }));
      setView('facil-synthesis');
    } catch (e) {
      setSynthError('Could not save synthesis: ' + e.message);
    }
    setSynthLoading(false);
  }

  async function handleDeleteSession() {
    if (!session) return;
    try { await deleteSession(session.sessionCode); } catch (e) { /* ignore */ }
    setSession(null);
    setFrame({ name: '', context: '', participants: '', deadline: '' });
    setScores({});
    setView('mode-chooser');
  }

  function copyCode() {
    if (!session) return;
    try { navigator.clipboard.writeText(session.sessionCode); setCodeCopied(true); setTimeout(() => setCodeCopied(false), 2000); } catch (e) { /* noop */ }
  }

  // ─── Reusable UI bits ────────────────────────────────────────────────────
  const backLink = (label, fn) => (
    <a onClick={(e) => { e.preventDefault(); fn(); }} href="#"
       style={{ display: 'inline-block', color: C.creamMuted, textDecoration: 'none', fontSize: 12, letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 32, cursor: 'pointer', fontFamily: F.sans }}>
      ← {label}
    </a>
  );

  // ─── VIEW: mode-chooser ─────────────────────────────────────────────────
  if (view === 'mode-chooser') {
    const modes = [
      { id: 'solo',  title: 'Solo',          desc: 'Take the assessment alone. See where you sit across the six dimensions.', go: 'solo-assess' },
      { id: 'join',  title: 'Join a group',  desc: "Your team is running this together. Add your voice.", go: 'part-join' },
      { id: 'facil', title: 'Run a group',   desc: 'Set up a team session. Everyone takes the assessment independently; you see where the team agrees and disagrees.', go: 'facil-setup' },
    ];
    return (
      <main style={{ animation: 'fadeIn 0.4s ease', minHeight: '80vh', padding: '60px 6vw 80px', maxWidth: 760, margin: '0 auto' }}>
        {backLink('Back to tools', () => navigate('home'))}
        <div style={{ ...eyebrow, marginBottom: 12 }}>Readiness self-assessment · 18 statements</div>
        <h1 style={{ ...heading(56), marginBottom: 20 }}>How <em style={{ color: C.sage, fontStyle: 'italic' }}>ready</em> are we, really?</h1>
        <p style={{ fontFamily: F.serif, fontSize: 22, lineHeight: 1.55, color: C.cream, marginBottom: 16, maxWidth: 620 }}>
          The assessment is the same in every mode. What changes is what you do with the results.
        </p>
        <p style={{ fontSize: 14, color: C.creamMuted, marginBottom: 40, lineHeight: 1.6, fontStyle: 'italic' }}>
          Takes about 5–7 minutes solo. Group mode shows where the team agrees and where it doesn't.
        </p>

        <div style={{ display: 'grid', gap: 12 }}>
          {modes.map((m) => (
            <button key={m.id} onClick={() => setView(m.go)} style={{
              background: C.bgCard, border: `1px solid ${C.line}`, borderRadius: 4,
              padding: '22px 24px', cursor: 'pointer', textAlign: 'left', color: C.cream,
              fontFamily: F.sans, transition: 'border-color 0.2s, background 0.2s',
            }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = C.sage; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = C.line; }}>
              <div style={{ fontFamily: F.serif, fontSize: 20, color: C.cream, marginBottom: 6 }}>{m.title}</div>
              <div style={{ fontSize: 14, color: C.creamMuted, lineHeight: 1.7 }}>{m.desc}</div>
            </button>
          ))}
        </div>
      </main>
    );
  }

  // ─── VIEW: assessment (shared by solo-assess and part-assess) ───────────
  if (view === 'solo-assess' || view === 'part-assess') {
    const isPart = view === 'part-assess';
    const onBack = isPart ? () => { setView('part-join'); setScores({}); } : () => setView('mode-chooser');
    const onSubmit = isPart ? handleParticipantSubmit : handleSoloSubmit;
    const submitLabel = isPart ? (submitting ? 'Submitting…' : 'Submit my answers →') : 'See my results →';
    const submitDisabled = !allAnswered || (isPart && submitting);
    return (
      <main style={{ animation: 'fadeIn 0.4s ease', minHeight: '80vh', padding: '60px 6vw 80px', maxWidth: 820, margin: '0 auto' }}>
        {backLink('Back', onBack)}
        {isPart && joinedSession && (
          <div style={{ background: joinedSession.aiOn ? 'rgba(197, 212, 155, 0.10)' : C.bgCard, border: `1px solid ${joinedSession.aiOn ? C.sage : C.line}44`, borderRadius: 4, padding: '12px 16px', marginBottom: 24, fontSize: 12, color: joinedSession.aiOn ? C.sage : C.creamMuted, fontFamily: F.sans, letterSpacing: '0.04em' }}>
            AI synthesis is <strong>{joinedSession.aiOn ? 'ON' : 'OFF'}</strong> for this session. Your name will appear as <em>"{partName}"</em> in the facilitator's view.
          </div>
        )}
        <div style={{ ...eyebrow, marginBottom: 12 }}>{isPart ? `Joining: ${joinedSession?.frame?.name || joinedSession?.sessionCode}` : 'Self-assessment · 18 statements'}</div>
        <h1 style={{ ...heading(56), marginBottom: 20 }}>How <em style={{ color: C.sage, fontStyle: 'italic' }}>ready</em> are we, really?</h1>
        <p style={{ fontFamily: F.serif, fontSize: 22, lineHeight: 1.55, color: C.cream, marginBottom: 16, maxWidth: 600 }}>
          Rate each statement honestly — not how you wish things were, but how they actually are.
        </p>
        <p style={{ fontSize: 14, color: C.creamMuted, marginBottom: isPart ? 48 : 24, lineHeight: 1.6, fontStyle: 'italic' }}>
          There are no wrong answers. This is a mirror, not a test.
        </p>

        {!isPart && (
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: 10, cursor: 'pointer', marginBottom: 40, fontSize: 13, color: C.creamMuted, fontFamily: F.sans, letterSpacing: '0.04em' }}>
            <input type="checkbox" checked={soloAiOn} onChange={(e) => setSoloAiOn(e.target.checked)}
                   style={{ accentColor: C.sage, width: 16, height: 16, cursor: 'pointer' }} />
            Add AI commentary on my results
          </label>
        )}

        {READINESS_DIMS.map((d) => (
          <div key={d.id} style={{ marginBottom: 48 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, marginBottom: 24, paddingBottom: 14, borderBottom: `1px solid ${C.line}` }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: C.sage, flexShrink: 0, marginBottom: 2 }} />
              <div>
                <div style={{ fontFamily: F.serif, fontSize: 22, color: C.cream, lineHeight: 1.2 }}>{d.label}</div>
                <div style={{ fontSize: 13, color: C.creamMuted, fontStyle: 'italic', marginTop: 2 }}>{d.desc}</div>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              {d.questions.map((q, qi) => {
                const key = d.id + '_' + qi;
                const val = scores[key] || 0;
                return (
                  <div key={qi}>
                    <p style={{ fontSize: 15, color: C.cream, lineHeight: 1.7, marginBottom: 12 }}>{q}</p>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {SCALE_LABELS.map((lbl, li) => {
                        const v = li + 1;
                        const isActive = val === v;
                        return (
                          <button key={li} onClick={() => setScore(d.id, qi, v)}
                                  style={{ flex: '1 1 130px', padding: '10px 8px', border: `1px solid ${isActive ? C.sage : C.line}`, borderRadius: 4, cursor: 'pointer', background: isActive ? 'rgba(197, 212, 155, 0.15)' : 'transparent', color: isActive ? C.sage : C.creamMuted, fontSize: 12, lineHeight: 1.3, letterSpacing: '0.04em', transition: 'all 0.2s', textAlign: 'center', fontFamily: F.sans }}>
                            {lbl}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {joinError && isPart && (
          <p style={{ color: C.needsWork, fontSize: 13, marginBottom: 16 }}>{joinError}</p>
        )}

        <div style={{ display: 'flex', gap: 16, marginTop: 32, flexWrap: 'wrap', justifyContent: 'space-between' }}>
          <button onClick={onBack} style={btn('secondary')}>← Back</button>
          <button onClick={onSubmit} disabled={submitDisabled} style={btn('primary', submitDisabled)} onMouseEnter={(e) => { if (!submitDisabled) btnHoverIn(e); }} onMouseLeave={(e) => { if (!submitDisabled) btnHoverOut(e); }}>
            {submitLabel}
          </button>
        </div>
      </main>
    );
  }

  // ─── VIEW: solo-results ────────────────────────────────────────────────
  if (view === 'solo-results') {
    const overallScore = READINESS_DIMS.reduce((s, d) => s + totalFor(d), 0);
    const overallMax = READINESS_DIMS.length * 12;
    const overall = bandFor(overallScore, overallMax);
    return (
      <main style={{ animation: 'fadeIn 0.4s ease', minHeight: '80vh', padding: '60px 6vw 80px', maxWidth: 820, margin: '0 auto' }}>
        {backLink('Edit answers', () => setView('solo-assess'))}
        <div style={{ ...eyebrow, marginBottom: 12 }}>Your results</div>
        <h1 style={{ ...heading(48), marginBottom: 32 }}>Culture change <em style={{ color: C.sage, fontStyle: 'italic' }}>readiness</em>.</h1>

        <div style={{ background: overall.bg, border: `1px solid ${overall.color}44`, borderRadius: 4, padding: 28, marginBottom: 40 }}>
          <div style={{ fontSize: 11, letterSpacing: '0.22em', textTransform: 'uppercase', color: overall.color, marginBottom: 8, fontFamily: F.sans }}>Overall readiness</div>
          <div style={{ display: 'flex', alignItems: 'baseline', flexWrap: 'wrap', gap: 12 }}>
            <span style={{ fontFamily: F.serif, fontSize: 36, color: overall.color }}>{overallScore} / {overallMax}</span>
            <span style={{ fontSize: 14, letterSpacing: '0.08em', textTransform: 'uppercase', color: overall.color, fontFamily: F.sans }}>{overall.label}</span>
          </div>
          <p style={{ fontSize: 15, color: C.cream, lineHeight: 1.7, marginTop: 14 }}>
            {overall.label === 'Working well' ? 'You have strong conditions across most dimensions. The work ahead is about sustaining this foundation and moving deliberately into execution.' : overall.label === 'Foundations emerging' ? 'You have real foundations to build on — and some important gaps to address first. Naming those gaps now is itself a form of readiness.' : 'Significant conditions are absent across multiple dimensions. This is important information — not a reason to stop, but a reason to be very deliberate about what you build first.'}
          </p>
        </div>

        <div style={{ ...eyebrow, color: C.creamMuted, marginBottom: 20 }}>By dimension</div>
        {READINESS_DIMS.map((d) => {
          const score = totalFor(d);
          const band = bandFor(score, 12);
          const pct = Math.round((score / 12) * 100);
          const cm = soloCommentary && soloCommentary.by_label && soloCommentary.by_label[d.label];
          return (
            <div key={d.id} style={{ background: C.bgCard, borderRadius: 4, padding: 22, marginBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 12 }}>
                <div>
                  <div style={{ fontFamily: F.serif, fontSize: 18, color: C.cream, fontWeight: 400 }}>{d.label}</div>
                  <div style={{ fontSize: 12, color: C.creamMuted, marginTop: 2, fontStyle: 'italic' }}>{d.desc}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontFamily: F.sans, fontSize: 13, color: band.color }}>{score}/12</span>
                  <span style={{ fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: band.color, background: band.bg, border: `1px solid ${band.color}44`, padding: '3px 10px', borderRadius: 3 }}>{band.label}</span>
                </div>
              </div>
              <div style={{ height: 4, background: C.line, borderRadius: 2 }}>
                <div style={{ height: '100%', width: `${pct}%`, background: band.color, borderRadius: 2, transition: 'width 0.5s ease' }} />
              </div>
              {cm && (
                <div style={{ marginTop: 16, paddingTop: 16, borderTop: `1px solid ${C.line}`, fontSize: 14, color: C.creamMuted, lineHeight: 1.7, fontStyle: 'italic' }}>
                  {cm}
                </div>
              )}
            </div>
          );
        })}

        {soloCommentaryLoading && (
          <div style={{ marginTop: 20, padding: 14, background: C.bgCard, border: `1px solid ${C.line}`, borderRadius: 4, fontSize: 13, color: C.creamMuted, fontStyle: 'italic', textAlign: 'center' }}>
            AI is reading your results…
          </div>
        )}
        {soloCommentaryError && (
          <div style={{ marginTop: 20, padding: 14, background: 'rgba(212, 185, 110, 0.10)', border: `1px solid ${C.okay}44`, borderRadius: 4, fontSize: 13, color: C.okay }}>
            {soloCommentaryError}
          </div>
        )}

        <div style={{ display: 'flex', gap: 16, marginTop: 32, flexWrap: 'wrap' }}>
          <button onClick={() => downloadSoloResults(scores, READINESS_DIMS, soloCommentary)} style={btn('primary')} onMouseEnter={btnHoverIn} onMouseLeave={btnHoverOut}>Download results</button>
          <button onClick={() => { setScores({}); setSoloCommentary(null); setSoloCommentaryError(null); setView('mode-chooser'); }} style={btn('secondary')}>Start over</button>
          <button onClick={() => navigate('home')} style={btn('secondary')}>Back to tools</button>
        </div>
      </main>
    );
  }

  // ─── VIEW: facil-setup ─────────────────────────────────────────────────
  if (view === 'facil-setup') {
    const labelStyle = { display: 'block', fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase', color: C.sageMuted, fontFamily: F.sans, marginBottom: 8 };
    return (
      <main style={{ animation: 'fadeIn 0.4s ease', minHeight: '80vh', padding: '60px 6vw 80px', maxWidth: 680, margin: '0 auto' }}>
        {backLink('Back', () => setView('mode-chooser'))}
        <div style={{ ...eyebrow, marginBottom: 12 }}>Run a group · Setup</div>
        <h1 style={{ ...heading(48), marginBottom: 16 }}>Frame the <em style={{ color: C.sage, fontStyle: 'italic' }}>session</em>.</h1>
        <p style={{ fontFamily: F.serif, fontSize: 20, lineHeight: 1.55, color: C.cream, marginBottom: 32, maxWidth: 580 }}>
          You'll get a session code to share with the team. Everyone takes the assessment independently.
        </p>

        <label style={labelStyle}>Session name *</label>
        <input type="text" value={frame.name} onChange={(e) => setFrame((f) => ({ ...f, name: e.target.value }))}
               placeholder="Q2 leadership offsite" style={{ ...fieldInput, marginBottom: 24 }} />

        <label style={labelStyle}>Context for the team (optional)</label>
        <textarea value={frame.context} onChange={(e) => setFrame((f) => ({ ...f, context: e.target.value }))}
                  placeholder="1–2 sentences. Helps AI interpret the divergences." rows={3}
                  style={{ ...fieldInput, marginBottom: 24, resize: 'vertical' }} />

        <label style={labelStyle}>Who's participating (optional)</label>
        <textarea value={frame.participants} onChange={(e) => setFrame((f) => ({ ...f, participants: e.target.value }))}
                  placeholder="Just for your reference — names you're expecting." rows={2}
                  style={{ ...fieldInput, marginBottom: 24, resize: 'vertical' }} />

        <label style={labelStyle}>Decision deadline (optional)</label>
        <input type="text" value={frame.deadline} onChange={(e) => setFrame((f) => ({ ...f, deadline: e.target.value }))}
               placeholder="When does this conversation need to happen?" style={{ ...fieldInput, marginBottom: 32 }} />

        <label style={{ display: 'flex', alignItems: 'flex-start', gap: 12, cursor: 'pointer', marginBottom: 40, padding: 18, background: C.bgCard, border: `1px solid ${C.line}`, borderRadius: 4 }}>
          <input type="checkbox" checked={groupAiOn} onChange={(e) => setGroupAiOn(e.target.checked)}
                 style={{ accentColor: C.sage, width: 16, height: 16, cursor: 'pointer', marginTop: 3 }} />
          <div>
            <div style={{ fontSize: 14, color: C.cream, marginBottom: 4, fontFamily: F.sans }}>Add AI synthesis when I pull contributions</div>
            <div style={{ fontSize: 13, color: C.creamMuted, lineHeight: 1.6 }}>AI interprets divergences, names patterns, and suggests conversation prompts. Off = pure data view (scores, spread, names per dimension).</div>
          </div>
        </label>

        {setupError && (
          <div style={{ padding: '12px 14px', background: 'rgba(216, 138, 122, 0.10)', border: `1px solid ${C.needsWork}44`, borderRadius: 4, fontSize: 13, color: C.needsWork, marginBottom: 20 }}>{setupError}</div>
        )}

        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <button onClick={handleCreateSession} disabled={!frame.name.trim()} style={btn('primary', !frame.name.trim())} onMouseEnter={(e) => { if (frame.name.trim()) btnHoverIn(e); }} onMouseLeave={(e) => { if (frame.name.trim()) btnHoverOut(e); }}>
            Create session →
          </button>
          <button onClick={() => setView('mode-chooser')} style={btn('secondary')}>Cancel</button>
        </div>
      </main>
    );
  }

  // ─── VIEW: facil-share ─────────────────────────────────────────────────
  if (view === 'facil-share' && session) {
    return (
      <main style={{ animation: 'fadeIn 0.4s ease', minHeight: '80vh', padding: '80px 6vw', maxWidth: 600, margin: '0 auto', textAlign: 'center' }}>
        <div style={{ ...eyebrow, marginBottom: 16 }}>Share this code with your team</div>
        <div style={{ fontFamily: F.serif, fontSize: 64, color: C.sage, marginBottom: 12, letterSpacing: '0.02em' }}>{session.sessionCode}</div>
        <p style={{ fontSize: 14, color: C.creamMuted, marginBottom: 32, maxWidth: 460, margin: '0 auto 32px', lineHeight: 1.7 }}>
          Anyone with this code can submit their reading. AI synthesis is <strong style={{ color: session.aiOn ? C.sage : C.creamMuted }}>{session.aiOn ? 'ON' : 'OFF'}</strong> for this session.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 48 }}>
          <button onClick={copyCode} style={btn('primary')} onMouseEnter={btnHoverIn} onMouseLeave={btnHoverOut}>{codeCopied ? 'Copied ✓' : 'Copy code'}</button>
          <button onClick={() => setView('facil-dashboard')} style={btn('secondary')}>Go to dashboard →</button>
        </div>
        <div style={{ padding: '20px 22px', background: C.bgCard, border: `1px solid ${C.line}`, borderRadius: 4, textAlign: 'left' }}>
          <div style={{ fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase', color: C.sageMuted, fontFamily: F.sans, marginBottom: 10 }}>What participants will see</div>
          <p style={{ fontSize: 13, color: C.creamMuted, lineHeight: 1.7 }}>
            They'll choose "Join a group" from the Readiness tool, enter this code, type their name, and take the same 18-statement assessment. Their answers land on your dashboard.
          </p>
        </div>
      </main>
    );
  }

  // ─── VIEW: facil-dashboard ─────────────────────────────────────────────
  if (view === 'facil-dashboard' && session) {
    const n = session.contributions.length;
    const canSynth = n >= 2;
    return (
      <main style={{ animation: 'fadeIn 0.4s ease', minHeight: '80vh', padding: '60px 6vw 80px', maxWidth: 820, margin: '0 auto' }}>
        {backLink('Modes', () => setView('mode-chooser'))}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16, marginBottom: 32 }}>
          <div>
            <div style={{ ...eyebrow, marginBottom: 8 }}>Session</div>
            <h1 style={{ ...heading(40), marginBottom: 6 }}>{session.frame.name}</h1>
            <div style={{ fontSize: 13, color: C.creamMuted, fontFamily: F.sans, letterSpacing: '0.04em' }}>
              Code: <span style={{ color: C.sage }}>{session.sessionCode}</span> · AI: {session.aiOn ? 'ON' : 'OFF'}
            </div>
          </div>
          <button onClick={handleRefreshDashboard} style={{ ...btn('secondary'), padding: '8px 18px', fontSize: 11 }}>{refreshing ? '↻ refreshing…' : '↻ Refresh'}</button>
        </div>

        <div style={{ marginBottom: 32 }}>
          <div style={{ fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase', color: C.creamMuted, fontFamily: F.sans, marginBottom: 12 }}>Contributions ({n})</div>
          {n === 0 ? (
            <div style={{ padding: 24, background: C.bgCard, border: `1px dashed ${C.line}`, borderRadius: 4, textAlign: 'center', fontSize: 14, color: C.creamMuted, fontStyle: 'italic' }}>
              No one has submitted yet. Share the code <span style={{ color: C.sage, fontFamily: F.sans, fontStyle: 'normal' }}>{session.sessionCode}</span> with your team.
            </div>
          ) : (
            <div style={{ display: 'grid', gap: 8 }}>
              {session.contributions.map((c, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 18px', background: C.bgCard, border: `1px solid ${C.line}`, borderRadius: 4 }}>
                  <div style={{ fontSize: 15, color: C.cream, fontFamily: F.sans }}>{c.name}</div>
                  <div style={{ fontSize: 11, color: C.creamMuted, fontFamily: F.sans, letterSpacing: '0.04em' }}>
                    submitted {new Date(c.submittedAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {session.frame.participants && (
          <div style={{ marginBottom: 32, padding: 16, background: C.bgCard, border: `1px solid ${C.line}`, borderRadius: 4 }}>
            <div style={{ fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase', color: C.creamMuted, fontFamily: F.sans, marginBottom: 8 }}>Expected participants</div>
            <div style={{ fontSize: 13, color: C.cream, lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{session.frame.participants}</div>
          </div>
        )}

        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 16 }}>
          <button onClick={handleRunSynthesis} disabled={!canSynth || synthLoading} style={btn('primary', !canSynth || synthLoading)} onMouseEnter={(e) => { if (canSynth && !synthLoading) btnHoverIn(e); }} onMouseLeave={(e) => { if (canSynth && !synthLoading) btnHoverOut(e); }}>
            {synthLoading ? 'Synthesizing…' : session.synthesis ? 'Re-run synthesis' : `Synthesize (${n} ${n === 1 ? 'contribution' : 'contributions'})`}
          </button>
          {session.synthesis && (
            <button onClick={() => setView('facil-synthesis')} style={btn('secondary')}>View synthesis →</button>
          )}
          <button onClick={() => setView('facil-share')} style={btn('secondary')}>Share code</button>
        </div>

        {!canSynth && n > 0 && (
          <p style={{ fontSize: 12, color: C.creamMuted, fontStyle: 'italic', marginBottom: 16 }}>Need at least 2 contributions before synthesis is meaningful.</p>
        )}

        {synthError && (
          <div style={{ marginTop: 16, padding: 14, background: 'rgba(212, 185, 110, 0.10)', border: `1px solid ${C.okay}44`, borderRadius: 4, fontSize: 13, color: C.okay }}>{synthError}</div>
        )}

        <div style={{ marginTop: 48, paddingTop: 24, borderTop: `1px solid ${C.line}` }}>
          <button onClick={() => setView('facil-delete-confirm')} style={{ background: 'transparent', border: `1px solid ${C.line}`, color: C.creamMuted, padding: '8px 16px', borderRadius: 4, cursor: 'pointer', fontSize: 11, letterSpacing: '0.08em', fontFamily: F.sans }}>
            Delete this session
          </button>
        </div>
      </main>
    );
  }

  // ─── VIEW: facil-delete-confirm ────────────────────────────────────────
  if (view === 'facil-delete-confirm' && session) {
    return (
      <main style={{ animation: 'fadeIn 0.4s ease', minHeight: '80vh', padding: '80px 6vw', maxWidth: 560, margin: '0 auto', textAlign: 'center' }}>
        <div style={{ fontSize: 56, color: C.needsWork, marginBottom: 24 }}>!</div>
        <h2 style={{ ...heading(36), marginBottom: 16 }}>Delete this session?</h2>
        <p style={{ fontSize: 15, color: C.creamMuted, lineHeight: 1.7, marginBottom: 32 }}>
          This will permanently remove the session, all <strong style={{ color: C.cream }}>{session.contributions.length}</strong> contributions, and any synthesis. This cannot be undone.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button onClick={handleDeleteSession} style={{ background: C.needsWork, border: 'none', color: '#fff', padding: '12px 28px', borderRadius: 4, cursor: 'pointer', fontSize: 13, letterSpacing: '0.06em', fontFamily: F.sans, fontWeight: 500 }}>Yes, delete</button>
          <button onClick={() => setView('facil-dashboard')} style={btn('secondary')}>Cancel</button>
        </div>
      </main>
    );
  }

  // ─── VIEW: facil-synthesis ─────────────────────────────────────────────
  if (view === 'facil-synthesis' && session && session.synthesis) {
    const syn = session.synthesis;
    return (
      <main style={{ animation: 'fadeIn 0.4s ease', minHeight: '80vh', padding: '60px 6vw 80px', maxWidth: 880, margin: '0 auto' }}>
        {backLink('Dashboard', () => setView('facil-dashboard'))}
        <div style={{ ...eyebrow, marginBottom: 12 }}>Team readiness</div>
        <h1 style={{ ...heading(40), marginBottom: 10 }}>{session.frame.name}</h1>
        <div style={{ fontSize: 13, color: C.creamMuted, marginBottom: 36, fontFamily: F.sans, letterSpacing: '0.04em' }}>
          {syn.overall.n_participants} participants · Team avg {syn.overall.team_avg_score}/{syn.overall.overall_max} ({syn.overall.team_avg_band}) · Range {syn.overall.score_range.min}–{syn.overall.score_range.max}
        </div>

        <div style={{ ...eyebrow, color: C.creamMuted, marginBottom: 20 }}>By dimension</div>
        {syn.by_dimension.map((d) => {
          const consensusColor = d.consensus_level === 'high' ? C.good : d.consensus_level === 'moderate' ? C.okay : C.needsWork;
          const consensusLabel = d.consensus_level === 'high' ? 'High consensus' : d.consensus_level === 'moderate' ? 'Moderate spread' : 'Low consensus';
          return (
            <div key={d.dim_id} style={{ background: C.bgCard, border: `1px solid ${C.line}`, borderRadius: 4, padding: 22, marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: 12, marginBottom: 12 }}>
                <div>
                  <div style={{ fontFamily: F.serif, fontSize: 18, color: C.cream }}>{d.label}</div>
                  <div style={{ fontSize: 12, color: C.creamMuted, marginTop: 2, fontStyle: 'italic' }}>{d.desc}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 13, color: C.creamMuted, fontFamily: F.sans }}>Avg {d.team_avg}/12</span>
                  <span style={{ fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: consensusColor, padding: '3px 10px', border: `1px solid ${consensusColor}44`, borderRadius: 3, fontFamily: F.sans }}>{consensusLabel}</span>
                </div>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, paddingTop: 12, borderTop: `1px solid ${C.line}` }}>
                {d.all_scores.map((p, i) => (
                  <div key={i} style={{ fontSize: 12, padding: '4px 12px', background: 'transparent', border: `1px solid ${C.sage}33`, color: C.sage, borderRadius: 3, fontFamily: F.sans, letterSpacing: '0.04em' }}>
                    {p.name}: {p.score}/12
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        {syn.ai && (
          <div style={{ marginTop: 40, padding: 28, background: 'rgba(197, 212, 155, 0.06)', border: `1px solid ${C.sage}44`, borderRadius: 4 }}>
            <div style={{ ...eyebrow, color: C.sage, marginBottom: 16 }}>AI synthesis</div>

            {syn.ai.the_real_question && (
              <div style={{ marginBottom: 28 }}>
                <div style={{ fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase', color: C.creamMuted, fontFamily: F.sans, marginBottom: 8 }}>The real question</div>
                <p style={{ fontFamily: F.serif, fontSize: 22, fontStyle: 'italic', lineHeight: 1.5, color: C.cream }}>{syn.ai.the_real_question}</p>
              </div>
            )}

            {(syn.ai.biggest_divergences || []).length > 0 && (
              <div style={{ marginBottom: 28 }}>
                <h3 style={{ fontFamily: F.serif, fontSize: 22, color: C.cream, marginBottom: 14, fontWeight: 400 }}>Biggest divergences</h3>
                {syn.ai.biggest_divergences.map((b, i) => (
                  <div key={i} style={{ marginBottom: 12, padding: 18, background: C.bgCard, borderRadius: 4, borderLeft: `3px solid ${C.sage}` }}>
                    <div style={{ fontFamily: F.serif, fontSize: 16, color: C.cream, marginBottom: 6 }}>{b.dim_label}</div>
                    <p style={{ fontSize: 14, color: C.creamMuted, lineHeight: 1.7, marginBottom: 6 }}>{b.what_emerged}</p>
                    <p style={{ fontSize: 14, color: C.creamMuted, lineHeight: 1.7, fontStyle: 'italic', marginBottom: 10 }}>{b.likely_reading}</p>
                    <p style={{ fontSize: 14, color: C.sage, lineHeight: 1.7 }}>→ {b.conversation_prompt}</p>
                  </div>
                ))}
              </div>
            )}

            {(syn.ai.consensus_areas || []).length > 0 && (
              <div style={{ marginBottom: 28 }}>
                <h3 style={{ fontFamily: F.serif, fontSize: 22, color: C.cream, marginBottom: 14, fontWeight: 400 }}>Consensus areas</h3>
                {syn.ai.consensus_areas.map((c, i) => (
                  <div key={i} style={{ marginBottom: 12, padding: 18, background: C.bgCard, borderRadius: 4, borderLeft: `3px solid ${C.sage}` }}>
                    <div style={{ fontFamily: F.serif, fontSize: 16, color: C.cream, marginBottom: 6 }}>{c.dim_label}</div>
                    <p style={{ fontSize: 14, color: C.creamMuted, lineHeight: 1.7, marginBottom: 6 }}>{c.team_view}</p>
                    <p style={{ fontSize: 14, color: C.creamMuted, lineHeight: 1.7, fontStyle: 'italic' }}>{c.implication}</p>
                  </div>
                ))}
              </div>
            )}

            {(syn.ai.what_to_discuss_first || []).length > 0 && (
              <div>
                <h3 style={{ fontFamily: F.serif, fontSize: 22, color: C.cream, marginBottom: 14, fontWeight: 400 }}>What to discuss first</h3>
                <ul style={{ paddingLeft: 20, fontSize: 15, color: C.creamMuted, lineHeight: 1.8 }}>
                  {syn.ai.what_to_discuss_first.map((w, i) => <li key={i} style={{ marginBottom: 6 }}>{w}</li>)}
                </ul>
              </div>
            )}
          </div>
        )}

        {!syn.ai && session.aiOn && (
          <div style={{ marginTop: 24, padding: 16, background: 'rgba(212, 185, 110, 0.10)', border: `1px solid ${C.okay}44`, borderRadius: 4, fontSize: 13, color: C.okay }}>
            AI synthesis wasn't available this time. The data view above stands on its own.
          </div>
        )}

        {!session.aiOn && (
          <div style={{ marginTop: 24, padding: 16, background: C.bgCard, border: `1px solid ${C.line}`, borderRadius: 4, fontSize: 13, color: C.creamMuted, fontStyle: 'italic' }}>
            AI synthesis is off for this session. The data view above is the synthesis.
          </div>
        )}

        <div style={{ display: 'flex', gap: 16, marginTop: 40, flexWrap: 'wrap' }}>
          <button onClick={() => downloadGroupResults(session)} style={btn('primary')} onMouseEnter={btnHoverIn} onMouseLeave={btnHoverOut}>Download report</button>
          <button onClick={handleRunSynthesis} disabled={synthLoading} style={btn('secondary')}>{synthLoading ? 'Re-running…' : 'Re-run synthesis'}</button>
          <button onClick={() => setView('facil-dashboard')} style={btn('secondary')}>← Dashboard</button>
        </div>
      </main>
    );
  }

  // ─── VIEW: part-join ───────────────────────────────────────────────────
  if (view === 'part-join') {
    const labelStyle = { display: 'block', fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase', color: C.sageMuted, fontFamily: F.sans, marginBottom: 8 };
    return (
      <main style={{ animation: 'fadeIn 0.4s ease', minHeight: '80vh', padding: '60px 6vw 80px', maxWidth: 560, margin: '0 auto' }}>
        {backLink('Back', () => setView('mode-chooser'))}
        <div style={{ ...eyebrow, marginBottom: 12 }}>Join a group</div>
        <h1 style={{ ...heading(48), marginBottom: 16 }}>Add your <em style={{ color: C.sage, fontStyle: 'italic' }}>voice</em>.</h1>
        <p style={{ fontFamily: F.serif, fontSize: 20, lineHeight: 1.55, color: C.cream, marginBottom: 32, maxWidth: 480 }}>
          Your facilitator should have shared a session code. Enter it below along with your name.
        </p>

        <label style={labelStyle}>Session code</label>
        <input type="text" value={joinCode} onChange={(e) => setJoinCode(e.target.value)}
               placeholder="forge-4827" style={{ ...fieldInput, marginBottom: 24 }} />

        <label style={labelStyle}>Your name</label>
        <input type="text" value={partName} onChange={(e) => setPartName(e.target.value)}
               placeholder='Your first name, or type "anonymous"' style={{ ...fieldInput, marginBottom: 24 }} />

        {joinError && (
          <div style={{ padding: '12px 14px', background: 'rgba(216, 138, 122, 0.10)', border: `1px solid ${C.needsWork}44`, borderRadius: 4, fontSize: 13, color: C.needsWork, marginBottom: 20 }}>{joinError}</div>
        )}

        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <button onClick={handleJoinSession} style={btn('primary')} onMouseEnter={btnHoverIn} onMouseLeave={btnHoverOut}>Join →</button>
          <button onClick={() => setView('mode-chooser')} style={btn('secondary')}>Cancel</button>
        </div>
      </main>
    );
  }

  // ─── VIEW: part-thanks ─────────────────────────────────────────────────
  if (view === 'part-thanks' && joinedSession) {
    return (
      <main style={{ animation: 'fadeIn 0.4s ease', minHeight: '80vh', padding: '120px 6vw', maxWidth: 600, margin: '0 auto', textAlign: 'center' }}>
        <div style={{ fontSize: 56, color: C.sage, marginBottom: 24 }}>✦</div>
        <h2 style={{ ...heading(36), marginBottom: 16 }}>Thanks, <em style={{ color: C.sage, fontStyle: 'italic' }}>{partName}</em>.</h2>
        <p style={{ fontSize: 16, color: C.creamMuted, lineHeight: 1.7, marginBottom: 24 }}>
          Your answers have been recorded for <em>{joinedSession.frame.name}</em>. Your facilitator will pull everything together when the team has submitted.
        </p>
        <p style={{ fontSize: 13, color: C.creamMuted, lineHeight: 1.7, marginBottom: 32, fontStyle: 'italic' }}>
          If you need to change your answers, enter the same session code and name again.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button onClick={() => { setView('mode-chooser'); setJoinCode(''); setPartName(''); setJoinedSession(null); setScores({}); }} style={btn('secondary')}>Modes</button>
          <button onClick={() => navigate('home')} style={btn('primary')} onMouseEnter={btnHoverIn} onMouseLeave={btnHoverOut}>Back to tools</button>
        </div>
      </main>
    );
  }

  // Fallback — shouldn't be reachable if state is consistent
  return (
    <main style={{ minHeight: '80vh', padding: '80px 6vw', textAlign: 'center' }}>
      <button onClick={() => setView('mode-chooser')} style={btn('secondary')}>Return to modes</button>
    </main>
  );
}
