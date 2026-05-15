import React, { useState, useEffect, useRef } from 'react';
import { synthesize, extractText } from '../lib/synthesize.js';
import { useAppNavigate } from '../lib/useAppNavigate.js';
import SEO from '../components/SEO.jsx';

// ============================================================
// Smallest Viable Experiment — turns longing into reversible action
// Oxblood + copper palette (intentional, slightly fiery)
// ============================================================

const F = {
  serif: '"Cormorant Garamond", Georgia, serif',
  sans: '"Inter", -apple-system, BlinkMacSystemFont, sans-serif',
};

const C = {
  bgDeep: '#2E1818',
  bgCard: '#3B2222',
  cream: '#F0EBDB',
  creamMuted: 'rgba(240, 235, 219, 0.62)',
  creamFaint: 'rgba(240, 235, 219, 0.38)',
  accent: '#C97A4A',
  accentMuted: 'rgba(201, 122, 74, 0.78)',
  border: 'rgba(240, 235, 219, 0.14)',
};

const SCALE_THEME = {
  small: {
    label: 'Invisible · low stakes',
    cardBg: 'rgba(240, 235, 219, 0.05)',
    cardBgActive: 'rgba(240, 235, 219, 0.10)',
    border: 'rgba(201, 122, 74, 0.3)',
    borderActive: 'rgba(201, 122, 74, 0.85)',
    panelBg: 'rgba(240, 235, 219, 0.07)',
    panelBorder: 'rgba(201, 122, 74, 0.55)',
    accentBar: 2,
  },
  medium: {
    label: 'Visible · real arrangement',
    cardBg: 'rgba(212, 165, 116, 0.07)',
    cardBgActive: 'rgba(212, 165, 116, 0.13)',
    border: 'rgba(201, 122, 74, 0.4)',
    borderActive: 'rgba(201, 122, 74, 0.95)',
    panelBg: 'rgba(212, 165, 116, 0.10)',
    panelBorder: 'rgba(201, 122, 74, 0.7)',
    accentBar: 3,
  },
  ambitious: {
    label: 'Confronts the fear',
    cardBg: 'rgba(201, 122, 74, 0.10)',
    cardBgActive: 'rgba(201, 122, 74, 0.18)',
    border: 'rgba(201, 122, 74, 0.5)',
    borderActive: 'rgba(201, 122, 74, 1.0)',
    panelBg: 'rgba(201, 122, 74, 0.14)',
    panelBorder: 'rgba(201, 122, 74, 0.85)',
    accentBar: 4,
  },
};

const SVE_STYLES_ID = 'sve-styles';

function injectSVEStyles() {
  if (typeof document === 'undefined' || document.getElementById(SVE_STYLES_ID)) return;
  const style = document.createElement('style');
  style.id = SVE_STYLES_ID;
  style.textContent = `
    @keyframes sveFadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes svePanelIn { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes sveNoteIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes sveShimmer { 0%, 100% { opacity: 0.55; } 50% { opacity: 1; } }
    @keyframes sveDotPulse {
      0%, 60%, 100% { opacity: 0.25; transform: translateY(0); }
      30% { opacity: 1; transform: translateY(-4px); }
    }
    .sve-input::placeholder, .sve-textarea::placeholder {
      color: rgba(240, 235, 219, 0.28);
      font-style: italic;
      font-weight: 300;
    }
    .sve-input:focus, .sve-textarea:focus {
      background: rgba(240, 235, 219, 0.06) !important;
      border-color: rgba(201, 122, 74, 0.55) !important;
    }
    .sve-btn-primary { transition: all 0.25s ease; }
    .sve-btn-primary:hover {
      background: ${C.accent} !important;
      border-color: ${C.accent} !important;
      transform: translateY(-1px);
    }
    .sve-btn-secondary { transition: all 0.25s ease; }
    .sve-btn-secondary:hover {
      border-color: ${C.cream} !important;
      color: ${C.cream} !important;
    }
    .sve-btn-upload { transition: all 0.25s ease; }
    .sve-btn-upload:hover {
      background: rgba(201, 122, 74, 0.1) !important;
      border-color: ${C.accent} !important;
    }
    .sve-link-clear { background: transparent; border: none; cursor: pointer; transition: color 0.2s ease; }
    .sve-link-clear:hover { color: ${C.cream} !important; }
    .sve-inline-link {
      color: ${C.accent};
      text-decoration: underline;
      text-decoration-color: rgba(201, 122, 74, 0.5);
      text-underline-offset: 3px;
      cursor: pointer;
      transition: color 0.2s ease;
    }
    .sve-inline-link:hover { color: ${C.cream}; }
    .sve-duration-pill { transition: all 0.2s ease; }
    .sve-duration-pill:hover:not(.selected) {
      border-color: rgba(201, 122, 74, 0.55) !important;
      color: ${C.cream} !important;
    }
    .sve-option-card {
      transition: all 0.25s ease;
      cursor: pointer;
      will-change: transform, border-color, background;
    }
    .sve-option-card:hover:not(.active) {
      transform: translateY(-2px);
      border-color: rgba(201, 122, 74, 0.7) !important;
    }
    .sve-detail-close { background: transparent; border: none; cursor: pointer; transition: color 0.2s ease; }
    .sve-detail-close:hover { color: ${C.cream} !important; }
    .sve-thing-card { transition: all 0.25s ease; }
    .sve-thing-card:hover {
      border-color: rgba(201, 122, 74, 0.5) !important;
      transform: translateY(-2px);
    }
    @media (max-width: 760px) {
      .sve-card-row { flex-direction: column !important; }
      .sve-card-row > * { width: 100% !important; }
      .sve-three-things { flex-direction: column !important; }
      .sve-principle-row { flex-direction: column !important; }
      .sve-principle-icon { margin: 0 auto 0 0 !important; padding-top: 0 !important; }
      .sve-getback-row { flex-direction: column !important; align-items: flex-start !important; }
    }
    @media (max-width: 640px) {
      .sve-title { font-size: 42px !important; }
      .sve-subtitle { font-size: 21px !important; }
      .sve-h-lg { font-size: 26px !important; }
      .sve-page { padding: 40px 5vw 80px !important; }
      .sve-detail-panel { padding: 28px 24px !important; }
      .sve-loaded-card { padding: 24px 20px !important; }
      .sve-feature-line { font-size: 22px !important; }
      .sve-intro-card { padding: 24px 22px !important; }
    }
  `;
  document.head.appendChild(style);
}

const s = {
  eyebrow: { fontFamily: F.sans, fontSize: 11, letterSpacing: '0.26em', textTransform: 'uppercase', color: C.accentMuted, fontWeight: 500, marginBottom: 28 },
  heading: (size, italic) => ({ fontFamily: F.serif, fontSize: size, lineHeight: 1.15, color: C.cream, fontWeight: 500, fontStyle: italic ? 'italic' : 'normal', letterSpacing: '-0.005em', margin: 0 }),
  para: { fontFamily: F.sans, fontSize: 16, lineHeight: 1.78, color: C.cream, fontWeight: 300, margin: '0 0 20px 0' },
  fieldLabel: { fontFamily: F.sans, fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase', color: C.creamMuted, fontWeight: 500, marginBottom: 10, display: 'block' },
  fieldTextarea: { width: '100%', background: 'rgba(240, 235, 219, 0.035)', border: `1px solid ${C.border}`, borderRadius: 3, padding: '14px 18px', fontFamily: F.sans, fontSize: 16, color: C.cream, fontWeight: 300, outline: 'none', boxSizing: 'border-box', minHeight: 110, resize: 'vertical', lineHeight: 1.6, transition: 'border-color 0.2s ease, background 0.2s ease' },
  btnPrimary: { fontFamily: F.sans, fontSize: 12, letterSpacing: '0.24em', textTransform: 'uppercase', fontWeight: 500, padding: '15px 36px', borderRadius: 2, cursor: 'pointer', border: `1px solid ${C.cream}`, background: C.cream, color: C.bgDeep },
  btnSecondary: { fontFamily: F.sans, fontSize: 12, letterSpacing: '0.24em', textTransform: 'uppercase', fontWeight: 500, padding: '15px 28px', borderRadius: 2, cursor: 'pointer', border: `1px solid ${C.border}`, background: 'transparent', color: C.creamMuted },
  btnUpload: { fontFamily: F.sans, fontSize: 11, letterSpacing: '0.22em', textTransform: 'uppercase', fontWeight: 500, padding: '13px 24px', borderRadius: 2, cursor: 'pointer', border: `1px solid ${C.accent}`, background: 'transparent', color: C.accent },
  inlineNote: { fontFamily: F.serif, fontStyle: 'italic', fontSize: 14, color: C.accentMuted, marginTop: 16, animation: 'sveNoteIn 0.4s ease' },
  pageWrap: { minHeight: '100vh', background: C.bgDeep, padding: '64px 6vw 100px' },
  contentWrap: { maxWidth: 760, margin: '0 auto', animation: 'sveFadeIn 0.5s ease' },
  contentWrapWide: { maxWidth: 960, margin: '0 auto', animation: 'sveFadeIn 0.5s ease' },
  introCard: { background: 'rgba(240, 235, 219, 0.04)', border: `1px solid ${C.border}`, borderRadius: 4, padding: '32px 36px', margin: '0 0 28px 0' },
  introCardAccent: { background: 'rgba(240, 235, 219, 0.04)', border: `1px solid ${C.border}`, borderLeft: `2px solid ${C.accent}`, borderRadius: 4, padding: '32px 36px', margin: '0 0 28px 0' },
};

// ============ Icons ============

const IconHorizon = ({ size = 56 }) => (
  <svg width={size} height={size * 0.55} viewBox="0 0 60 33" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
    <path d="M 2 24 Q 30 19, 58 24" />
    <circle cx="44" cy="9" r="1.8" fill="currentColor" stroke="none" />
    <line x1="44" y1="11" x2="44" y2="22" strokeDasharray="1.5,2" strokeOpacity="0.4" />
  </svg>
);
const IconCircleArrow = ({ size = 56 }) => (
  <svg width={size} height={size} viewBox="0 0 56 56" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M 42 18 A 18 18 0 1 0 14 38" />
    <path d="M 14 38 L 8 32" />
    <path d="M 14 38 L 18 32" />
  </svg>
);
const IconSeed = ({ size = 44 }) => (
  <svg width={size * 0.7} height={size} viewBox="0 0 28 40" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <ellipse cx="14" cy="26" rx="6" ry="9" />
    <line x1="14" y1="17" x2="14" y2="6" />
    <path d="M 14 9 Q 9 5, 6 4" />
    <path d="M 14 9 Q 19 5, 22 4" />
  </svg>
);
const IconConstellation = ({ size = 44 }) => (
  <svg width={size} height={size * 0.65} viewBox="0 0 50 32" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
    <line x1="9" y1="20" x2="22" y2="9" strokeOpacity="0.35" />
    <line x1="23" y1="9" x2="36" y2="22" strokeOpacity="0.35" />
    <circle cx="8" cy="21" r="2" fill="currentColor" stroke="none" />
    <circle cx="22" cy="8" r="2" fill="currentColor" stroke="none" />
    <circle cx="36" cy="22" r="2" fill="currentColor" stroke="none" />
  </svg>
);
const IconFrame = ({ size = 44 }) => (
  <svg width={size} height={size} viewBox="0 0 44 44" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="6" y="6" width="32" height="32" rx="1" />
    <line x1="6" y1="14" x2="38" y2="14" />
    <line x1="14" y1="14" x2="14" y2="38" strokeOpacity="0.3" />
  </svg>
);
const IconDoor = ({ size = 44 }) => (
  <svg width={size * 0.7} height={size} viewBox="0 0 31 44" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="5" y="4" width="22" height="36" />
    <circle cx="22" cy="24" r="0.9" fill="currentColor" stroke="none" />
    <line x1="5" y1="40" x2="27" y2="40" />
  </svg>
);
const IconScales = ({ size = 64 }) => (
  <svg width={size} height={size * 0.4} viewBox="0 0 72 28" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
    <circle cx="10" cy="18" r="3.5" />
    <circle cx="34" cy="14" r="6" />
    <circle cx="60" cy="10" r="9" />
  </svg>
);

// ============ HTML parser for Five Lives results ============

function parseFiveLivesHTML(htmlText) {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlText, 'text/html');
    const letterBody = doc.querySelector('.letter-card .letter-body');
    let letter = '';
    if (letterBody) {
      const paragraphs = letterBody.querySelectorAll('p');
      letter = Array.from(paragraphs).map(p => p.textContent.trim()).filter(Boolean).join('\n\n');
    }
    return { letter };
  } catch (err) {
    console.error('parseFiveLivesHTML error:', err);
    return { letter: '' };
  }
}

const DURATIONS = [30, 60, 90];
const SCALE_ORDER = ['small', 'medium', 'ambitious'];
const PORT_KEY = 'inciteu-fivelives-port';
const PORT_TTL_MS = 60 * 60 * 1000; // 1 hour

export default function SmallestViableExperimentPage() {
  const navigate = useAppNavigate();

  useEffect(() => { injectSVEStyles(); }, []);

  const [screen, setScreen] = useState('intro');
  const [pattern, setPattern] = useState('');
  const [constraint, setConstraint] = useState('');
  const [fear, setFear] = useState('');
  const [duration, setDuration] = useState(30);
  const [ported, setPorted] = useState(null);
  const [scales, setScales] = useState(null);
  const [activeOption, setActiveOption] = useState({ small: null, medium: null, ambitious: null });
  const [rawResponse, setRawResponse] = useState('');
  const [error, setError] = useState('');
  const [incompleteNote, setIncompleteNote] = useState('');
  const [uploadError, setUploadError] = useState('');
  const fileInputRef = useRef(null);

  // On mount: check sessionStorage for a port from Five Lives
  useEffect(() => {
    try {
      const portStr = sessionStorage.getItem(PORT_KEY);
      if (portStr) {
        const port = JSON.parse(portStr);
        if (port && port.letter && Date.now() - (port.ts || 0) < PORT_TTL_MS) {
          setPorted({ letter: port.letter });
          setPattern(port.letter);
        }
        sessionStorage.removeItem(PORT_KEY);
      }
    } catch (e) {
      console.error('port read failed', e);
    }
  }, []);

  const inputsComplete =
    pattern.trim().length >= 20 &&
    constraint.trim().length >= 8 &&
    fear.trim().length >= 8;

  const handleFileChange = async (e) => {
    setUploadError('');
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = parseFiveLivesHTML(text);
      if (!parsed.letter || parsed.letter.length < 50) {
        setUploadError("Couldn't find a letter in that file. Make sure it's the Five Lives results download.");
        e.target.value = '';
        return;
      }
      setPorted({ letter: parsed.letter });
      setPattern(parsed.letter);
      e.target.value = '';
    } catch (err) {
      console.error(err);
      setUploadError("Couldn't read that file. Try again or use a different file.");
      e.target.value = '';
    }
  };

  const clearPorted = () => { setPorted(null); setPattern(''); setUploadError(''); };

  const goToInputs = () => { setScreen('inputs'); window.scrollTo({ top: 0 }); };

  const goSynthesize = () => {
    if (!inputsComplete) {
      setIncompleteNote(ported ? 'Fill both fields to continue.' : 'Fill all three fields to continue.');
      return;
    }
    setIncompleteNote('');
    runSynthesis();
  };

  const runSynthesis = async () => {
    setScreen('synthesizing');
    setError('');
    setActiveOption({ small: null, medium: null, ambitious: null });
    window.scrollTo({ top: 0 });

    const prompt = `You are a thoughtful coach helping a person design real-world experiments to explore what they want from their life. They already know something is missing — they aren't asking what; they're asking what to do about it.

THE PATTERN:
${pattern}

THEIR CONSTRAINT:
${constraint}

THE FEAR:
${fear}

EXPERIMENT DURATION: ${duration} days

DEEP ANALYSIS — do this silently before designing experiments. Do not include this analysis in your output.

1. Identify the 3 deepest distinct hungers in the pattern. Look past the surface (e.g. "wants to be a sailor") to the underlying need (e.g. "wants long stretches of unstructured time outdoors with physical work and chosen solitude"). Most stated lives are metaphors for what people actually crave. Name each hunger in concrete, sensory terms.

2. Identify the metaphor mistake. Which surface element is the person likely fixated on that ISN'T the real need? "I want to write a novel" might really mean "I want to make something that's mine and finishes." "I want to live in the country" might really mean "I want my body to be tired in a useful way at the end of the day."

3. Distinguish structural fear (a real-world consequence the person genuinely cannot afford) from psychological fear (a story they tell themselves about what would happen, that wouldn't actually happen). Brilliant experiments engage the psychological fear directly without inviting the structural one.

NOW DESIGN NINE EXPERIMENTS — three options at each of three scales. All run for ${duration} days.

CRITICAL: Within each scale, the THREE OPTIONS must test THREE DIFFERENT hypotheses. Not minor variations of one idea. Genuinely different angles on the pattern, attacking different deepest hungers or different facets of the metaphor mistake.

- SMALL (3 options): startable this week. Mostly invisible to others. Each tests a different deepest hunger in its rawest possible form. May have nothing to do with the surface description of what they said they wanted.
- MEDIUM (3 options): startable this month. Visible to people close to them. Each tests a different angle of the metaphor mistake — designed to reveal whether the surface description is the real need or a stand-in.
- AMBITIOUS (3 options): startable in the next 30 days. Substantial commitment of time, energy, or money. Each engages the psychological fear directly from a different angle. All reversible.

EVERY OPTION MUST HAVE:
- TITLE: short, evocative phrase (3-7 words). Names the experiment memorably.
- TEASER: ONE specific sentence with concrete verb + place + frequency. Hints at the hypothesis without explaining it. Makes the reader want to know more. Should stand alone as a one-line description.
- WHAT_YOU_DO: 3-5 sentences with concrete actions, places, frequencies, durations. Specific to the verb-noun level.
- WHY_IT_TESTS: 1-2 sentences. State the hypothesis explicitly in this form: "This tests whether you actually need ___" or "This tests whether the real hunger is ___." End with what evidence at the end of ${duration} days will tell you whether it holds.

ALL EXPERIMENTS MUST BE REVERSIBLE BY DESIGN — no irreversible commitments to people, money, or status. ALL MUST RESPECT THE STATED CONSTRAINT.

AVOID THE OBVIOUS. If your first instinct for any small experiment is "start a journal," "take a class," "join a group," "talk to a coach," "book a retreat," or "find a mentor" — dig harder. Find an angle the reader hasn't already considered.

BRILLIANT EXPERIMENTS ARE SURPRISING. They find a non-obvious angle. They test something the person hasn't explicitly named. At least 3 of the 9 should make the reader say "oh — I hadn't thought of that."

TONE: calm, perceptive, practical. No motivational language, no "manifesting" or "best self" energy.

OUTPUT — return JSON with this exact shape and nothing else. No markdown fences, no preamble, no commentary.

{
  "scales": [
    {
      "scale": "small",
      "options": [
        { "title": "...", "teaser": "...", "what_you_do": "...", "why_it_tests": "..." },
        { "title": "...", "teaser": "...", "what_you_do": "...", "why_it_tests": "..." },
        { "title": "...", "teaser": "...", "what_you_do": "...", "why_it_tests": "..." }
      ]
    },
    { "scale": "medium", "options": [ ...3 options ] },
    { "scale": "ambitious", "options": [ ...3 options ] }
  ]
}

Begin the JSON immediately.`;

    try {
      const data = await synthesize({
        model: 'claude-sonnet-4-5',
        max_tokens: 4000,
        messages: [{ role: 'user', content: prompt }],
      });
      const text = extractText(data).trim();
      setRawResponse(text);

      let parsed = null;
      try {
        const cleaned = text.replace(/^```json\s*/i, '').replace(/^```\s*/, '').replace(/\s*```$/, '').trim();
        parsed = JSON.parse(cleaned);
      } catch (parseErr) {
        const match = text.match(/\{[\s\S]*\}/);
        if (match) {
          try { parsed = JSON.parse(match[0]); } catch (_) {}
        }
      }

      if (parsed && parsed.scales && Array.isArray(parsed.scales)) {
        setScales(parsed.scales);
      } else {
        setScales(null);
      }
      setScreen('results');
    } catch (e) {
      console.error(e);
      setError('Synthesis is unavailable right now. Try again in a moment.');
      setScreen('results');
    }
  };

  const restart = () => {
    setPattern(ported?.letter || '');
    setConstraint('');
    setFear('');
    setScales(null);
    setActiveOption({ small: null, medium: null, ambitious: null });
    setRawResponse('');
    setError('');
    setIncompleteNote('');
    setScreen('intro');
    window.scrollTo({ top: 0 });
  };

  const setActive = (scale, idx) => {
    setActiveOption(prev => ({
      ...prev,
      [scale]: prev[scale] === idx ? null : idx,
    }));
  };

  const downloadHTML = () => {
    if (!scales) return;
    const escape = s => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    const scaleSections = scales.map(sc => `
<div class="scale-section">
  <h2 class="scale-header">${escape(sc.scale).toUpperCase()}</h2>
  ${sc.options.map((opt, idx) => `
    <div class="experiment scale-${escape(sc.scale)}">
      <div class="scale-num">${escape(sc.scale).toUpperCase()} · OPTION 0${idx + 1}</div>
      <h3>${escape(opt.title)}</h3>
      <p class="teaser"><em>${escape(opt.teaser)}</em></p>
      <div class="label">What you do</div>
      <p>${escape(opt.what_you_do)}</p>
      <div class="label">Why this tests your pattern</div>
      <p>${escape(opt.why_it_tests)}</p>
    </div>
  `).join('')}
</div>`).join('');

    const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Smallest Viable Experiment — ${date}</title>
<style>
  body { font-family: 'Cormorant Garamond', Georgia, serif; max-width: 720px; margin: 60px auto; padding: 0 24px; color: #2a2a2a; line-height: 1.7; }
  h1 { font-size: 36px; font-weight: 500; margin-bottom: 4px; }
  .date { font-family: -apple-system, sans-serif; color: #888; font-size: 12px; letter-spacing: 0.18em; text-transform: uppercase; margin-bottom: 56px; }
  .pattern-card { background: #faf6ee; padding: 28px 32px; border-radius: 4px; margin-bottom: 56px; border-left: 3px solid #b86d3f; font-size: 16px; }
  .pattern-card h2 { font-size: 16px; letter-spacing: 0.18em; text-transform: uppercase; color: #888; font-family: -apple-system, sans-serif; font-weight: 500; margin: 0 0 14px 0; }
  .pattern-card p { font-size: 17px; margin: 0 0 12px 0; }
  .scale-section { margin-top: 64px; }
  .scale-header { font-family: -apple-system, sans-serif; font-size: 13px; letter-spacing: 0.24em; color: #b86d3f; font-weight: 500; margin: 0 0 24px 0; padding-bottom: 12px; border-bottom: 1px solid #e0d8c8; }
  .experiment { margin: 32px 0; padding: 28px 32px; border-radius: 4px; }
  .experiment.scale-small { background: #faf8f1; border-left: 2px solid rgba(184, 109, 63, 0.5); }
  .experiment.scale-medium { background: #f8f1e3; border-left: 3px solid rgba(184, 109, 63, 0.7); }
  .experiment.scale-ambitious { background: #f5e9d6; border-left: 4px solid #b86d3f; }
  .scale-num { font-family: -apple-system, sans-serif; font-size: 11px; letter-spacing: 0.22em; color: #888; font-weight: 500; margin-bottom: 12px; }
  .experiment h3 { font-size: 22px; font-style: italic; font-weight: 500; margin: 0 0 12px 0; color: #1a1a1a; }
  .teaser { font-size: 17px; color: #4a4a4a; margin: 0 0 22px 0; }
  .label { font-family: -apple-system, sans-serif; font-size: 11px; letter-spacing: 0.18em; text-transform: uppercase; color: #888; margin: 18px 0 4px; font-weight: 500; }
  .experiment p:not(.teaser) { font-size: 15px; margin: 0 0 8px; }
</style></head><body>
<h1>Smallest Viable Experiment</h1>
<div class="date">${date} · ${duration}-day experiments</div>
${pattern ? `<div class="pattern-card"><h2>The pattern you're testing</h2>${pattern.split(/\n\n+/).map(p => `<p>${escape(p)}</p>`).join('')}</div>` : ''}
${scaleSections}
</body></html>`;

    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `smallest-viable-experiment-${new Date().toISOString().slice(0,10)}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // ============ INTRO ============
  if (screen === 'intro') {
    return (
      <div className="sve-page" style={s.pageWrap}>
        <SEO
          title="Smallest Viable Experiment: Turn Longing Into Reversible Action | InciteU"
          description="Design small, reversible experiments to explore what's missing in your life — without triggering your own defenses. AI-designed, three scales, three options each."
          path="/tools/self/smallest-viable-experiment"
        />
        <div style={s.contentWrap}>
          <h1 className="sve-title" style={{ fontFamily: F.serif, fontSize: 60, fontWeight: 500, color: C.cream, letterSpacing: '-0.015em', lineHeight: 1.0, margin: 0 }}>Smallest Viable<br/>Experiment</h1>
          <div style={{ width: 48, height: 1, background: C.accent, margin: '24px 0 22px' }} />
          <p className="sve-subtitle" style={{ fontFamily: F.serif, fontSize: 24, fontStyle: 'italic', color: C.creamMuted, fontWeight: 400, lineHeight: 1.35, margin: '0 0 48px 0' }}>What's the smallest reversible thing you could try, that would give you a taste of what's missing?</p>

          {ported && (
            <div className="sve-loaded-card" style={{ background: 'rgba(240, 235, 219, 0.035)', border: `1px solid ${C.border}`, borderLeft: `2px solid ${C.accent}`, borderRadius: 4, padding: '32px 36px', margin: '0 0 40px 0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18, gap: 16 }}>
                <div style={{...s.fieldLabel, color: C.accentMuted, marginBottom: 0 }}>The pattern you're testing — loaded from Five Lives</div>
                <button className="sve-link-clear" onClick={clearPorted} style={{ color: C.creamFaint, fontSize: 10, fontFamily: F.sans, textTransform: 'uppercase', letterSpacing: '0.18em', fontWeight: 500, padding: 0, flexShrink: 0 }}>× Clear</button>
              </div>
              {ported.letter.split(/\n\n+/).map((p, i) => (
                <p key={i} style={{ fontFamily: F.serif, fontSize: 17, lineHeight: 1.7, color: C.cream, margin: '0 0 14px 0', fontWeight: 400, fontStyle: 'italic' }}>{p}</p>
              ))}
            </div>
          )}

          <div className="sve-intro-card" style={{...s.introCard, position: 'relative', overflow: 'hidden'}}>
            <div style={{ position: 'absolute', top: 18, right: 22, color: C.accentMuted, opacity: 0.7 }}>
              <IconHorizon size={48} />
            </div>
            {!ported ? (
              <p style={{...s.para, marginBottom: 0, paddingRight: 64 }}>
                You can name what your life is missing — or you have a sense of it, either from yourself or from the Five Lives exercise (
                <span className="sve-inline-link" onClick={() => navigate('five-lives')}>click here to try if you haven't</span>
                ). But you struggle moving forward, for good reasons. <span style={{ fontFamily: F.serif, fontStyle: 'italic', fontSize: 18, color: C.cream }}>This tool helps you find ways to dabble with something new, without triggering your own defenses.</span>
              </p>
            ) : (
              <p style={{...s.para, marginBottom: 0, paddingRight: 64 }}>
                You've named what you're hungry for. But you struggle moving forward, for good reasons. <span style={{ fontFamily: F.serif, fontStyle: 'italic', fontSize: 18, color: C.cream }}>This tool helps you find ways to dabble with something new, without triggering your own defenses.</span>
              </p>
            )}
          </div>

          <div className="sve-principle-row" style={{ display: 'flex', gap: 24, alignItems: 'stretch', marginBottom: 28 }}>
            <div style={{...s.introCardAccent, flex: 1, marginBottom: 0 }}>
              <div style={{...s.fieldLabel, color: C.accentMuted, marginBottom: 14}}>The principle</div>
              <p style={{...s.para, marginBottom: 0}}>
                <span style={{ fontFamily: F.serif, fontStyle: 'italic', fontSize: 18, color: C.cream }}>Reversibility.</span> No quitting your job, leaving your relationship, moving across the country — those moves invite resistance from the parts of you that have a stake in the current arrangement, and those parts are good at killing experiments before they start.
              </p>
            </div>
            <div className="sve-principle-icon" style={{ width: 88, paddingTop: 32, color: C.accent, flexShrink: 0, display: 'flex', justifyContent: 'center', alignItems: 'flex-start' }}>
              <IconCircleArrow size={64} />
            </div>
          </div>

          <div style={{ textAlign: 'center', margin: '56px 0 48px', padding: '0 20px' }}>
            <div style={{ color: C.accent, marginBottom: 20, display: 'inline-flex' }}>
              <IconSeed size={42} />
            </div>
            <div className="sve-feature-line" style={{ fontFamily: F.serif, fontSize: 26, fontStyle: 'italic', color: C.accent, lineHeight: 1.3 }}>
              A small reversible experiment is different.
            </div>
            <div style={{ fontFamily: F.sans, fontSize: 15, fontWeight: 300, color: C.creamMuted, lineHeight: 1.7, marginTop: 18, maxWidth: 540, margin: '18px auto 0' }}>
              Something you can run for a month or two, learn from, and walk away from if it isn't right. The point isn't the experiment itself — it's what you learn from running it.
            </div>
          </div>

          <div style={{ marginTop: 56, marginBottom: 36 }}>
            <div style={{...s.fieldLabel, color: C.accent, fontSize: 12, letterSpacing: '0.26em', marginBottom: 18, textAlign: 'center' }}>Three things we will ask you to reflect on</div>
            <div className="sve-three-things" style={{ display: 'flex', gap: 14 }}>
              <div className="sve-thing-card" style={{ flex: 1, background: 'rgba(240, 235, 219, 0.05)', border: `1px solid ${C.border}`, borderRadius: 4, padding: '24px 20px', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ color: C.accent, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <IconConstellation size={44} />
                </div>
                <div style={{ fontFamily: F.sans, fontSize: 11, letterSpacing: '0.22em', textTransform: 'uppercase', color: C.accent, fontWeight: 500 }}>Your pattern</div>
                <div style={{ fontFamily: F.serif, fontStyle: 'italic', fontSize: 15, color: C.creamMuted, lineHeight: 1.5 }}>What your imagination keeps pointing at</div>
                <div style={{ fontFamily: F.sans, fontSize: 11, color: C.creamFaint, marginTop: 'auto', paddingTop: 6, fontWeight: 300 }}>auto-filled if you do Five Lives</div>
              </div>
              <div className="sve-thing-card" style={{ flex: 1, background: 'rgba(212, 165, 116, 0.06)', border: `1px solid ${C.border}`, borderRadius: 4, padding: '24px 20px', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ color: C.accent, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <IconFrame size={36} />
                </div>
                <div style={{ fontFamily: F.sans, fontSize: 11, letterSpacing: '0.22em', textTransform: 'uppercase', color: C.accent, fontWeight: 500 }}>A constraint</div>
                <div style={{ fontFamily: F.serif, fontStyle: 'italic', fontSize: 15, color: C.creamMuted, lineHeight: 1.5 }}>What you actually have to work with</div>
              </div>
              <div className="sve-thing-card" style={{ flex: 1, background: 'rgba(201, 122, 74, 0.08)', border: `1px solid ${C.border}`, borderRadius: 4, padding: '24px 20px', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ color: C.accent, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <IconDoor size={38} />
                </div>
                <div style={{ fontFamily: F.sans, fontSize: 11, letterSpacing: '0.22em', textTransform: 'uppercase', color: C.accent, fontWeight: 500 }}>The fear</div>
                <div style={{ fontFamily: F.serif, fontStyle: 'italic', fontSize: 15, color: C.creamMuted, lineHeight: 1.5 }}>What you're afraid would happen if you tried</div>
              </div>
            </div>
          </div>

          <div className="sve-getback-row" style={{...s.introCardAccent, display: 'flex', gap: 24, alignItems: 'center'}}>
            <div style={{ color: C.accent, flexShrink: 0 }}>
              <IconScales size={72} />
            </div>
            <div>
              <div style={{...s.fieldLabel, color: C.accentMuted, marginBottom: 8}}>What you'll get back</div>
              <p style={{...s.para, margin: 0}}>
                Nine experiments — three options at each of three scales. Click any that catch your eye to see the full design. Pick the one that fits, or use them as inspiration to find one you like better.
              </p>
            </div>
          </div>

          <div style={{ marginTop: 48 }}>
            <button className="sve-btn-primary" style={s.btnPrimary} onClick={goToInputs}>Begin →</button>
          </div>

          {!ported && (
            <div style={{ marginTop: 28, paddingTop: 28, borderTop: `1px solid ${C.border}` }}>
              <div style={{ fontFamily: F.serif, fontStyle: 'italic', fontSize: 16, color: C.creamMuted, marginBottom: 14 }}>
                Already done Five Lives? Skip the pattern question by uploading your results.
              </div>
              <input ref={fileInputRef} type="file" accept=".html,text/html" style={{ display: 'none' }} onChange={handleFileChange} />
              <button className="sve-btn-upload" style={s.btnUpload} onClick={() => fileInputRef.current && fileInputRef.current.click()}>↑ Upload Five Lives results (.html)</button>
              {uploadError && <div style={{...s.inlineNote, textAlign: 'left'}}>{uploadError}</div>}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ============ INPUTS ============
  if (screen === 'inputs') {
    return (
      <div className="sve-page" style={s.pageWrap}>
        <SEO
          title="Smallest Viable Experiment: Turn Longing Into Reversible Action | InciteU"
          description="Design small, reversible experiments to explore what's missing in your life — without triggering your own defenses. AI-designed, three scales, three options each."
          path="/tools/self/smallest-viable-experiment"
        />
        <div style={s.contentWrap}>
          <div style={s.eyebrow}>{ported ? 'Two things from you · plus duration' : 'Three things from you · plus duration'}</div>
          <h1 className="sve-h-lg" style={s.heading(36)}>Tell me what we're working with.</h1>
          <div style={{ height: 36 }} />

          <div style={{ marginBottom: 36 }}>
            <label style={s.fieldLabel}>How long should each experiment run?</label>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {DURATIONS.map(d => {
                const selected = duration === d;
                return (
                  <button
                    key={d}
                    className={`sve-duration-pill ${selected ? 'selected' : ''}`}
                    onClick={() => setDuration(d)}
                    style={{
                      fontFamily: F.sans, fontSize: 13, letterSpacing: '0.16em',
                      textTransform: 'uppercase', fontWeight: 500,
                      padding: '12px 22px', borderRadius: 2, cursor: 'pointer',
                      border: `1px solid ${selected ? C.accent : C.border}`,
                      background: selected ? 'rgba(201, 122, 74, 0.18)' : 'transparent',
                      color: selected ? C.cream : C.creamMuted,
                    }}
                  >{d} days</button>
                );
              })}
            </div>
          </div>

          {!ported && (
            <div style={{ marginBottom: 32 }}>
              <label style={s.fieldLabel}>The pattern</label>
              <textarea
                className="sve-textarea"
                style={{...s.fieldTextarea, minHeight: 140}}
                value={pattern}
                onChange={e => { setPattern(e.target.value); if (incompleteNote) setIncompleteNote(''); }}
                placeholder="What does your imagination keep pointing toward? What kind of life, what kind of texture? Describe the thing you're hungry for."
              />
            </div>
          )}

          {ported && (
            <div className="sve-loaded-card" style={{ background: 'rgba(240, 235, 219, 0.025)', border: `1px solid ${C.border}`, borderLeft: `2px solid ${C.accent}`, borderRadius: 4, padding: '20px 24px', marginBottom: 32 }}>
              <div style={{...s.fieldLabel, color: C.accentMuted, marginBottom: 8 }}>Your pattern (loaded)</div>
              <div style={{ fontFamily: F.serif, fontStyle: 'italic', fontSize: 15, color: C.creamMuted, lineHeight: 1.6 }}>
                {ported.letter.length > 220 ? ported.letter.slice(0, 220).trim() + '…' : ported.letter}
              </div>
            </div>
          )}

          <div style={{ marginBottom: 32 }}>
            <label style={s.fieldLabel}>Your constraint</label>
            <textarea
              className="sve-textarea"
              style={s.fieldTextarea}
              value={constraint}
              onChange={e => { setConstraint(e.target.value); if (incompleteNote) setIncompleteNote(''); }}
              placeholder="What you actually have to work with — time, money, family bandwidth, season, anything else. Be honest about the shape of your life right now."
            />
          </div>

          <div style={{ marginBottom: 32 }}>
            <label style={s.fieldLabel}>The fear</label>
            <textarea
              className="sve-textarea"
              style={s.fieldTextarea}
              value={fear}
              onChange={e => { setFear(e.target.value); if (incompleteNote) setIncompleteNote(''); }}
              placeholder="What are you afraid would happen if you tried? Name the thing that's been keeping you from acting on this so far."
            />
          </div>

          <div style={{ marginTop: 48, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <button className="sve-btn-secondary" style={s.btnSecondary} onClick={() => { setIncompleteNote(''); setScreen('intro'); window.scrollTo({ top: 0 }); }}>← Back</button>
            <button className="sve-btn-primary" style={s.btnPrimary} onClick={goSynthesize}>Design my experiments →</button>
          </div>
          {incompleteNote && <div style={{...s.inlineNote, textAlign: 'right'}} key={incompleteNote}>{incompleteNote}</div>}
        </div>
      </div>
    );
  }

  // ============ SYNTHESIZING ============
  if (screen === 'synthesizing') {
    return (
      <div className="sve-page" style={s.pageWrap}>
        <SEO
          title="Smallest Viable Experiment: Turn Longing Into Reversible Action | InciteU"
          description="Design small, reversible experiments to explore what's missing in your life — without triggering your own defenses. AI-designed, three scales, three options each."
          path="/tools/self/smallest-viable-experiment"
        />
        <div style={{...s.contentWrap, textAlign: 'center', paddingTop: '14vh'}}>
          <div style={{...s.eyebrow, color: C.accent}}>Designing your experiments</div>
          <h1 className="sve-h-lg" style={{...s.heading(34, true), animation: 'sveShimmer 2.4s ease-in-out infinite'}}>nine angles, all reversible</h1>
          <div style={{ marginTop: 24, fontFamily: F.serif, fontStyle: 'italic', fontSize: 15, color: C.creamMuted }}>
            Designing 9 experiments takes a moment — usually 1 to 2 minutes.
          </div>
          <div style={{ marginTop: 40, display: 'flex', justifyContent: 'center', gap: 10 }}>
            {[0,1,2].map(i => (
              <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: C.accent, animation: 'sveDotPulse 1.4s ease-in-out infinite', animationDelay: `${i * 0.2}s` }} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ============ RESULTS ============
  if (screen === 'results') {
    return (
      <div className="sve-page" style={s.pageWrap}>
        <SEO
          title="Smallest Viable Experiment: Turn Longing Into Reversible Action | InciteU"
          description="Design small, reversible experiments to explore what's missing in your life — without triggering your own defenses. AI-designed, three scales, three options each."
          path="/tools/self/smallest-viable-experiment"
        />
        <div style={s.contentWrapWide}>
          <div style={s.eyebrow}>Three sets of three · {duration} days each</div>
          <h1 className="sve-h-lg" style={s.heading(38)}>Pick the one that fits.</h1>
          <p style={{...s.para, marginTop: 16, color: C.creamMuted, fontFamily: F.serif, fontSize: 19, fontStyle: 'italic' }}>
            Or use them as inspiration to find one you like better. Click any card to see the full design.
          </p>
          <div style={{ height: 48 }} />

          {error && (
            <p style={{...s.para, color: C.accentMuted, fontStyle: 'italic', fontFamily: F.serif, fontSize: 18}}>{error}</p>
          )}

          {!error && scales && SCALE_ORDER.map(scaleName => {
            const sc = scales.find(x => x.scale === scaleName);
            if (!sc || !sc.options) return null;
            const theme = SCALE_THEME[scaleName];
            const activeIdx = activeOption[scaleName];
            const activeOpt = activeIdx !== null ? sc.options[activeIdx] : null;

            return (
              <section key={scaleName} style={{ marginBottom: 56 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 18, paddingBottom: 16, marginBottom: 24, borderBottom: `1px solid ${C.border}` }}>
                  <div style={{ fontFamily: F.sans, fontSize: 14, letterSpacing: '0.28em', textTransform: 'uppercase', color: C.accent, fontWeight: 500 }}>{scaleName}</div>
                  <div style={{ fontFamily: F.serif, fontStyle: 'italic', fontSize: 16, color: C.creamMuted }}>{theme.label}</div>
                </div>

                <div className="sve-card-row" style={{ display: 'flex', gap: 16 }}>
                  {sc.options.map((opt, idx) => {
                    const isActive = activeIdx === idx;
                    return (
                      <div
                        key={idx}
                        className={`sve-option-card ${isActive ? 'active' : ''}`}
                        onClick={() => setActive(scaleName, idx)}
                        style={{
                          flex: 1, minWidth: 0,
                          background: isActive ? theme.cardBgActive : theme.cardBg,
                          border: `1px solid ${isActive ? theme.borderActive : theme.border}`,
                          borderLeft: `${theme.accentBar}px solid ${isActive ? theme.borderActive : theme.border}`,
                          borderRadius: 4, padding: '24px 22px', minHeight: 180,
                          display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                        }}
                      >
                        <div>
                          <div style={{ fontFamily: F.serif, fontSize: 26, fontWeight: 500, color: C.accent, lineHeight: 1, marginBottom: 16 }}>0{idx + 1}</div>
                          <p style={{ fontFamily: F.serif, fontStyle: 'italic', fontSize: 16, lineHeight: 1.55, color: C.cream, margin: 0, fontWeight: 400 }}>{opt.teaser}</p>
                        </div>
                        <div style={{ marginTop: 18, fontFamily: F.sans, fontSize: 10, letterSpacing: '0.22em', textTransform: 'uppercase', color: isActive ? C.accent : C.creamFaint, fontWeight: 500 }}>
                          {isActive ? 'showing details below ↓' : 'click to read more →'}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {activeOpt && (
                  <div className="sve-detail-panel" style={{ marginTop: 16, background: theme.panelBg, border: `1px solid ${theme.panelBorder}`, borderLeft: `${theme.accentBar + 1}px solid ${theme.panelBorder}`, borderRadius: 4, padding: '36px 40px', animation: 'svePanelIn 0.3s ease' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, marginBottom: 14 }}>
                      <div style={{ fontFamily: F.sans, fontSize: 11, letterSpacing: '0.24em', textTransform: 'uppercase', color: C.accent, fontWeight: 500 }}>{scaleName} · option 0{activeIdx + 1}</div>
                      <button className="sve-detail-close" onClick={() => setActive(scaleName, activeIdx)} style={{ color: C.creamMuted, fontSize: 18, fontFamily: F.sans, padding: 0, lineHeight: 1, fontWeight: 400 }}>×</button>
                    </div>
                    <h2 style={{...s.heading(28, true), marginBottom: 24}}>{activeOpt.title}</h2>
                    <div style={{...s.fieldLabel, marginTop: 0}}>What you do</div>
                    <p style={{...s.para, fontFamily: F.serif, fontSize: 17, lineHeight: 1.7}}>{activeOpt.what_you_do}</p>
                    <div style={{...s.fieldLabel, marginTop: 24}}>Why this tests your pattern</div>
                    <p style={{...s.para, fontFamily: F.serif, fontSize: 17, lineHeight: 1.7, margin: 0}}>{activeOpt.why_it_tests}</p>
                  </div>
                )}
              </section>
            );
          })}

          {!error && !scales && rawResponse && (
            <div style={{ background: 'rgba(240, 235, 219, 0.035)', border: `1px solid ${C.border}`, borderRadius: 4, padding: '32px 36px', marginBottom: 32 }}>
              <p style={{...s.para, color: C.accentMuted, fontStyle: 'italic', marginBottom: 16}}>The synthesis came back, but in a format I couldn't structure. Here's the raw response:</p>
              <pre style={{ fontFamily: F.sans, fontSize: 14, color: C.cream, whiteSpace: 'pre-wrap', margin: 0 }}>{rawResponse}</pre>
            </div>
          )}

          <div style={{ marginTop: 56, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
            <button className="sve-btn-secondary" style={s.btnSecondary} onClick={restart}>← Start over</button>
            <button className="sve-btn-primary" style={s.btnPrimary} onClick={downloadHTML}>Download ↓</button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
