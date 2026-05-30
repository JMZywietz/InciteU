import React, { useState, useEffect, useRef } from 'react';
import { C, F } from '../theme.js';
import { btn, btnHoverIn, btnHoverOut, eyebrow, heading, fieldLabel, fieldInput } from '../styles.js';
import { useAppNavigate } from '../lib/useAppNavigate.js';
import { escapeHTML } from '../lib/utils.js';
import SEO from '../components/SEO.jsx';

// ============================================================================
// MANY MIRRORS — a free 360 for yourself
// ----------------------------------------------------------------------------
// Subject invites a small group of people who know them in different contexts,
// each answers six short questions, and once at least three have responded the
// subject can generate a synthesized report with unattributed quotes.
//
// Architecture mirrors FacilitateYourWay.jsx (multi-mode, URL-driven routing,
// localStorage subject token, parallel mm: Redis namespace). Subject-side flow
// is wizard-like (welcome → choose-q → eval → created → dashboard → ...);
// evaluator-side is a separate landing → per-question → review → done flow.
//
// Anonymity is enforced in code: the subject UI NEVER reads raw responses.
// It only reads /evaluators (status only) and /report (synthesis only).
//
// Backend endpoints live at /api/sessions/mm/* — see MANY-MIRRORS-SPEC.md §12.
// ============================================================================

const MM_STYLE_ID = 'mm-styles';

// Many Mirrors uses its own jewel-tone palette overlaid on the site theme.
// Defined as a tool-local override so theme.js is not modified and no other
// tool is affected. The body background is set on mount via useEffect and
// restored on unmount, so navigating away returns to the site default.
const palette = {
  bg: '#142B5C',           // deeper, richer sapphire (was #1E3970)
  bgCard: '#1D3870',       // subtle card lift on the new bg
  bgCardHover: '#244A8E',  // hover state
  accent: '#E8D9A8',       // pale warm champagne — softer, doesn't clash with cream (was #D4B868 gold)
  accentMuted: '#B5A878',  // dustier champagne
  accentDim: '#7A6E45',    // muted gold-bronze
};
const MM_PAGE_BG = palette.bg;

function injectStyles() {
  if (typeof document === 'undefined' || document.getElementById(MM_STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = MM_STYLE_ID;
  style.textContent = `
    @keyframes mmFade { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
    .mm-input::placeholder, .mm-textarea::placeholder {
      color: rgba(240, 235, 219, 0.28);
      font-style: italic;
      font-weight: 300;
    }
    .mm-input:focus, .mm-textarea:focus {
      border-color: rgba(201,194,174,0.5) !important;
    }
    .mm-wrap { animation: mmFade 0.4s ease; }
    .mm-rec-pulse { animation: mmPulse 1.4s ease infinite; }
    @keyframes mmPulse { 0%,100% { opacity: 1; } 50% { opacity: 0.45; } }
  `;
  document.head.appendChild(style);
}

// ── Rater categories (fixed, in this order — see spec §7) ─────────────────
const RATER_CATEGORIES = ['Boss', 'Peer', 'Direct report', 'Client', 'Family', 'Friend', 'Other'];

// ── Recommended questions (stored canonical Q1..Q6; presented Q1,Q4,Q3,Q2,Q5,Q6) ──
const RECOMMENDED_QUESTIONS = [
  { id: 'q1', text: "When this person is at their best, what are they doing? If possible, use specific examples — a real win, a helpful habit or way of interacting, or something you've watched them do." },
  { id: 'q2', text: 'If this person could change one thing, what one thing would make the biggest difference? What impact would that change have?' },
  { id: 'q3', text: "What's the impact you've seen this person have — on you, on the work, on the people around them?" },
  { id: 'q4', text: 'How does this person tend to show up under pressure or in conflict — at their best, and at their worst?' },
  { id: 'q5', text: 'If you could tell them one thing — something they may not see about themselves, or something they may not know how to receive — what would it be?' },
  { id: 'q6', text: "What's the word, phrase, analogy or 'meme' that comes to mind when you think of this person?" },
];

// Second-person phrasing for the self-survey (subject answering about themselves).
// q5 is intentionally omitted — you can't meaningfully report your own blind spot.
const RECOMMENDED_QUESTIONS_SELF = {
  q1: "When you are at your best, what are you doing? If possible, use specific examples — a real win, a helpful habit or way of interacting, or something you've caught yourself doing well.",
  q2: 'If you could change one thing, what one thing would make the biggest difference? What impact would that change have?',
  q3: "What's the impact you have — on the work, and on the people around you?",
  q4: 'How do you tend to show up under pressure or in conflict — at your best, and at your worst?',
  q6: "What's the word, phrase, analogy or 'meme' that comes to mind when you think of yourself?",
};

const RECOMMENDED_ORDER = ['q1', 'q4', 'q3', 'q2', 'q5', 'q6'];

const MIN_RESPONSES_FOR_REPORT = 3;
const TTL_DAYS = 180;

// ── URL & localStorage helpers ─────────────────────────────────────────────
function readUrlParams() {
  if (typeof window === 'undefined') return { code: null, view: null, inviteToken: null, resultsToken: null };
  const p = new URL(window.location.href).searchParams;
  const code = p.get('code');
  return {
    code: code ? code.trim().toUpperCase() : null,
    view: p.get('v'),                   // 's' (subject force), 'e' (evaluator), 'results'
    inviteToken: p.get('t'),            // evaluator invite token OR results-link token
    resultsToken: p.get('t'),
  };
}
function writeCodeToUrl(code, extra = {}) {
  if (typeof window === 'undefined') return;
  const u = new URL(window.location.href);
  u.searchParams.set('code', code);
  Object.entries(extra).forEach(([k, v]) => {
    if (v === null || v === undefined) u.searchParams.delete(k);
    else u.searchParams.set(k, v);
  });
  window.history.replaceState({}, '', u.toString());
}
function loadSubjectToken(code) {
  try { return localStorage.getItem(`mm:${code}:token`) || null; } catch { return null; }
}
function saveSubjectToken(code, token) {
  try { localStorage.setItem(`mm:${code}:token`, token); } catch { /* noop */ }
}
function clearSubjectToken(code) {
  try { localStorage.removeItem(`mm:${code}:token`); } catch { /* noop */ }
}
function firstName(full) {
  return (full || '').trim().split(/\s+/)[0] || '';
}
function daysRemaining(createdAtIso) {
  if (!createdAtIso) return null;
  const created = new Date(createdAtIso).getTime();
  if (Number.isNaN(created)) return null;
  const end = created + TTL_DAYS * 24 * 60 * 60 * 1000;
  return Math.max(0, Math.ceil((end - Date.now()) / (24 * 60 * 60 * 1000)));
}

// ── Many Mirrors artwork: a figure with faint reflections in surrounding mirrors ──
function MirrorsArtwork({ width = 320 }) {
  return (
    <svg viewBox="0 0 380 420" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" style={{ width: '100%', maxWidth: width, height: 'auto', display: 'block' }}>
      <defs>
        <linearGradient id="mmMirrorGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0C1B45" stopOpacity="0.95" />
          <stop offset="100%" stopColor="#050D2A" stopOpacity="0.96" />
        </linearGradient>
      </defs>

      {/* Faint rays from figure to each mirror */}
      <g stroke="rgba(240,235,219,0.10)" strokeWidth="1" fill="none">
        <line x1="170" y1="180" x2="80" y2="85" />
        <line x1="170" y1="180" x2="300" y2="110" />
        <line x1="170" y1="180" x2="325" y2="245" />
        <line x1="170" y1="180" x2="290" y2="355" />
        <line x1="170" y1="180" x2="55" y2="335" />
      </g>

      {/* Mirror 1: top-left — head tilted slightly up (looking ahead) */}
      <g transform="translate(40 30) rotate(-6)">
        <rect width="80" height="110" rx="3" fill="url(#mmMirrorGrad)" stroke="rgba(240,235,219,0.22)" strokeWidth="1" />
        <g transform="translate(40 55) rotate(-12)">
          <circle cx="0" cy="-18" r="13" fill="none" stroke="rgba(240,235,219,0.5)" strokeWidth="1.3" />
          <path d="M-22 35 Q0 12 22 35" stroke="rgba(240,235,219,0.5)" strokeWidth="1.3" fill="none" />
        </g>
      </g>
      {/* Mirror 2: top-right (slightly larger) — confident, broader full-body silhouette */}
      <g transform="translate(255 50) rotate(7)">
        <rect width="90" height="120" rx="3" fill="url(#mmMirrorGrad)" stroke="rgba(240,235,219,0.22)" strokeWidth="1" />
        <circle cx="45" cy="48" r="16" fill="rgba(240,235,219,0.16)" stroke="rgba(201,194,174,0.6)" strokeWidth="1.3" />
        <path d="M5 110 Q45 68 85 110 L85 120 L5 120 Z" fill="rgba(240,235,219,0.10)" stroke="rgba(201,194,174,0.6)" strokeWidth="1.3" />
      </g>
      {/* Mirror 3: middle-right — solid filled silhouette (strong presence) */}
      <g transform="translate(295 200) rotate(-4)">
        <rect width="70" height="95" rx="3" fill="url(#mmMirrorGrad)" stroke="rgba(240,235,219,0.22)" strokeWidth="1" />
        <circle cx="35" cy="30" r="11" fill="rgba(240,235,219,0.36)" />
        <path d="M10 78 Q35 48 60 78 L60 95 L10 95 Z" fill="rgba(240,235,219,0.36)" />
      </g>
      {/* Mirror 4: bottom-right — arms hinted outward (gestural / open) */}
      <g transform="translate(245 315) rotate(8)">
        <rect width="80" height="100" rx="3" fill="url(#mmMirrorGrad)" stroke="rgba(240,235,219,0.22)" strokeWidth="1" />
        <circle cx="40" cy="32" r="11" fill="none" stroke="rgba(240,235,219,0.6)" strokeWidth="1.3" />
        <path d="M14 80 Q40 50 66 80" stroke="rgba(240,235,219,0.6)" strokeWidth="1.3" fill="none" />
        <line x1="16" y1="70" x2="4" y2="55" stroke="rgba(240,235,219,0.5)" strokeWidth="1.2" />
        <line x1="64" y1="70" x2="76" y2="55" stroke="rgba(240,235,219,0.5)" strokeWidth="1.2" />
      </g>
      {/* Mirror 5: bottom-left — confident silhouette (matches mirror 2's posture, scaled) */}
      <g transform="translate(15 290) rotate(-9)">
        <rect width="75" height="105" rx="3" fill="url(#mmMirrorGrad)" stroke="rgba(240,235,219,0.22)" strokeWidth="1" />
        <circle cx="37" cy="42" r="13" fill="rgba(240,235,219,0.16)" stroke="rgba(201,194,174,0.65)" strokeWidth="1.3" />
        <path d="M4 95 Q37 58 70 95 L70 105 L4 105 Z" fill="rgba(240,235,219,0.10)" stroke="rgba(201,194,174,0.65)" strokeWidth="1.3" />
      </g>

      {/* Central figure: warm grey silhouette (head + shoulders) — the neutral "you" */}
      <g transform="translate(170 165)">
        <circle cx="0" cy="0" r="32" fill="#9E9C97" />
        <path d="M-52 64 Q0 16 52 64 L52 130 L-52 130 Z" fill="#9E9C97" />
      </g>
    </svg>
  );
}

// ── Modal overlay (used for skip-self, generate, delete, share-results) ──
function ModalOverlay({ children, onClose }) {
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(15, 28, 27, 0.78)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 50, padding: 20, animation: 'fadeIn 0.2s ease',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: palette.bgCard, border: `1px solid ${C.line}`, borderRadius: 6,
          padding: '32px 36px', maxWidth: 520, width: '100%',
          boxShadow: '0 18px 60px rgba(0,0,0,0.45)',
        }}
      >
        {children}
      </div>
    </div>
  );
}

// ============================================================================
// Main component
// ============================================================================
export default function ManyMirrorsPage() {
  const navigate = useAppNavigate();

  // ── Top-level routing state ──────────────────────────────────────────────
  const [step, setStep] = useState('boot');
  const [bootError, setBootError] = useState('');
  const [loading, setLoading] = useState(false);

  // ── Session identity ─────────────────────────────────────────────────────
  const [code, setCode] = useState('');
  const [subjectToken, setSubjectToken] = useState('');
  const [config, setConfig] = useState(null);     // public config { code, subjectName, subjectFirstName, questions, questionOrder, createdAt, weeklyUpdatesOptIn }

  // ── Subject SETUP form (used only during the create flow) ────────────────
  const [subjectName, setSubjectName] = useState('');
  const [useRecommended, setUseRecommended] = useState(true);
  const [customQuestions, setCustomQuestions] = useState(['', '', '', '', '', '']);
  const [evaluatorsDraft, setEvaluatorsDraft] = useState([
    { tmpId: 't1', name: '', relationship: 'Peer', email: '' },
  ]);
  const [weeklyOptIn, setWeeklyOptIn] = useState(false);
  const [subjectEmail, setSubjectEmail] = useState('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  // ── Post-creation / dashboard state ──────────────────────────────────────
  const [shareURL, setShareURL] = useState('');
  const [evaluators, setEvaluators] = useState([]);   // [{id,name,relationship,status,addedAt,completedAt}]
  const [selfSubmitted, setSelfSubmitted] = useState(false);
  const [report, setReport] = useState(null);         // { generatedAt, overview, perQuestion, selfReflection }
  const [resultsTokenLocal, setResultsTokenLocal] = useState(''); // local stash if user creates a share-results link
  const [refreshing, setRefreshing] = useState(false);
  const [dashError, setDashError] = useState('');
  const [reminderLoading, setReminderLoading] = useState({}); // { [evaluatorId]: bool }
  const [remindingEvalId, setRemindingEvalId] = useState(null);     // which row is expanded
  const [reminderEmail, setReminderEmail] = useState({});           // { [evaluatorId]: 'email' }
  const [reminderError, setReminderError] = useState({});           // { [evaluatorId]: 'message' }
  const [reminderCopiedId, setReminderCopiedId] = useState(null);   // brief "Copied" indicator

  // Add-evaluator inline form (on dashboard, before report is generated)
  const [showAddEvaluatorForm, setShowAddEvaluatorForm] = useState(false);
  const [newEval, setNewEval] = useState({ name: '', relationship: 'Peer', email: '' });
  const [addEvalLoading, setAddEvalLoading] = useState(false);
  const [addEvalError, setAddEvalError] = useState('');

  // ── Survey-taking shared state (used by both self-survey and evaluator) ──
  const [answers, setAnswers] = useState({});       // { q1: 'text', q2: '', ... }
  const [qIndex, setQIndex] = useState(0);          // index into config.questionOrder
  const [inputMode, setInputMode] = useState('type');     // 'type' | 'speak'
  const [speechSupported, setSpeechSupported] = useState(false);
  const [recognizing, setRecognizing] = useState(false);
  const [interimText, setInterimText] = useState('');
  const recognitionRef = useRef(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  // ── Evaluator identity (loaded from invite token) ────────────────────────
  const [inviteToken, setInviteToken] = useState('');
  const [evaluatorInfo, setEvaluatorInfo] = useState({ id: '', name: '', relationship: '' });
  const [editingEvalInfo, setEditingEvalInfo] = useState(false);
  const [evalInfoDraft, setEvalInfoDraft] = useState({ name: '', relationship: 'Peer' });

  // ── Generate-report & delete & share-results modals ──────────────────────
  const [showSkipSelfModal, setShowSkipSelfModal] = useState(false);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showShareResultsModal, setShowShareResultsModal] = useState(false);
  const [creatingResultsLink, setCreatingResultsLink] = useState(false);
  const [reportError, setReportError] = useState('');
  const [overviewExpanded, setOverviewExpanded] = useState(false);
  const [selectedQid, setSelectedQid] = useState(null); // null = show all questions

  // Welcome / choose-questions / add-evaluators UI toggles
  const [showReadMore, setShowReadMore] = useState(false);
  const [showRecommendedQs, setShowRecommendedQs] = useState(false);
  const [showCustomInfo, setShowCustomInfo] = useState(false);
  const [showEmailPreview, setShowEmailPreview] = useState(false);

  // ── Results-link (read-only) view state ──────────────────────────────────
  const [resultsTokenParam, setResultsTokenParam] = useState('');

  // ── Mount: inject styles + feature-detect Web Speech API ─────────────────
  useEffect(() => {
    injectStyles();
    const SR = typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition);
    setSpeechSupported(!!SR);
    window.scrollTo({ top: 0 });
  }, []);

  // Apply page-scoped lighter teal background while this tool is mounted.
  // Restored on unmount so navigating away returns to the site default.
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const prev = document.body.style.backgroundColor;
    document.body.style.backgroundColor = MM_PAGE_BG;
    return () => { document.body.style.backgroundColor = prev; };
  }, []);

  // Reset interim text + stop recognition when question changes
  useEffect(() => {
    setInterimText('');
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch { /* noop */ }
    }
    setRecognizing(false);
  }, [qIndex]);

  // ── Boot: read URL, route to the correct screen ──────────────────────────
  useEffect(() => {
    const params = readUrlParams();
    // No code in URL → welcome (start a new session)
    if (!params.code) { setStep('welcome'); return; }

    // Have a code in URL → branch on view mode
    (async () => {
      setLoading(true);
      try {
        // ?v=results&t=TOKEN → public read-only report view
        if (params.view === 'results' && params.resultsToken) {
          setCode(params.code);
          setResultsTokenParam(params.resultsToken);
          const r = await fetch(`/api/sessions/mm/${encodeURIComponent(params.code)}/report?t=${encodeURIComponent(params.resultsToken)}`);
          if (!r.ok) { setBootError('Could not load report — the link may have expired.'); setStep('welcome'); return; }
          const data = await r.json();
          setReport(data.report);
          setStep('report');
          return;
        }

        // ?v=e&t=TOKEN → evaluator flow
        if (params.view === 'e' || params.inviteToken) {
          setCode(params.code);
          setInviteToken(params.inviteToken || '');
          // Fetch public config (questions + subject names + evaluator self-info if token valid)
          const r = await fetch(`/api/sessions/mm/${encodeURIComponent(params.code)}${params.inviteToken ? `?t=${encodeURIComponent(params.inviteToken)}` : ''}`);
          if (!r.ok) { setBootError(`Session ${params.code} not found or expired.`); setStep('welcome'); return; }
          const cfg = await r.json();
          setConfig(cfg);
          setAnswers(Object.fromEntries((cfg.questionOrder || []).map(qid => [qid, ''])));
          try {
            const savedDraft = localStorage.getItem(`mm_draft_${params.code}_eval_${params.inviteToken || 'shared'}`);
            if (savedDraft) setAnswers(prev => ({ ...prev, ...JSON.parse(savedDraft) }));
          } catch (_) {}
          if (cfg.evaluator) {
            setEvaluatorInfo({ id: cfg.evaluator.id, name: cfg.evaluator.name, relationship: cfg.evaluator.relationship });
            setEvalInfoDraft({ name: cfg.evaluator.name, relationship: cfg.evaluator.relationship });
            // If already submitted, send them to a friendly "already done" message
            if (cfg.evaluator.status === 'completed') {
              setStep('eval-already-done');
              return;
            }
          }
          setStep('eval-landing');
          return;
        }

        // Otherwise: subject return — need a stored token
        const storedToken = loadSubjectToken(params.code);
        if (!storedToken) {
          setBootError("This session belongs to someone else, or your browser data has been cleared.");
          setStep('welcome');
          return;
        }
        setCode(params.code);
        setSubjectToken(storedToken);

        // Fetch public config + evaluators (which is gated by subject token)
        const cfgR = await fetch(`/api/sessions/mm/${encodeURIComponent(params.code)}`);
        if (!cfgR.ok) {
          if (cfgR.status === 404) clearSubjectToken(params.code);
          setBootError(`Session ${params.code} not found or expired.`);
          setStep('welcome');
          return;
        }
        const cfg = await cfgR.json();
        setConfig(cfg);

        // Pre-build share URL
        const su = `${window.location.origin}${window.location.pathname}?code=${encodeURIComponent(params.code)}&v=e`;
        setShareURL(su);

        // Fetch evaluators + check for an existing report
        await loadDashboardData(params.code, storedToken);
        setStep('dashboard');
      } catch (e) {
        setBootError('Could not load session.');
        setStep('welcome');
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Refresh dashboard data when the tab regains focus (cheap polling alt)
  useEffect(() => {
    if (step !== 'dashboard' || !code || !subjectToken) return;
    const onFocus = () => { loadDashboardData(code, subjectToken).catch(() => {}); };
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [step, code, subjectToken]);

  // ── Autosave survey answers to the browser (survives refresh / dropped tab) ─
  useEffect(() => {
    if (!code) return;
    const role = step.startsWith('self') ? 'self' : (step.startsWith('eval') ? 'eval' : null);
    if (!role) return;
    const key = role === 'self' ? `mm_draft_${code}_self` : `mm_draft_${code}_eval_${inviteToken || 'shared'}`;
    try {
      if (answers && Object.values(answers).some(v => (v || '').trim())) {
        localStorage.setItem(key, JSON.stringify(answers));
      }
    } catch (_) {}
  }, [answers, step, code, inviteToken]);

  // ── API: load evaluators + self-submitted flag + report (if any) ─────────
  async function loadDashboardData(sessionCode, token) {
    const headers = { Authorization: `Bearer ${token}` };
    const evalsR = await fetch(`/api/sessions/mm/${encodeURIComponent(sessionCode)}/evaluators`, { headers });
    if (!evalsR.ok) throw new Error(`Failed to load evaluators (${evalsR.status})`);
    const evalsData = await evalsR.json();
    setEvaluators(evalsData.evaluators || []);
    setSelfSubmitted(!!evalsData.selfSubmitted);
    // If a report already exists, load it (TTL is refreshed by the GET)
    if (evalsData.reportExists) {
      try {
        const repR = await fetch(`/api/sessions/mm/${encodeURIComponent(sessionCode)}/report`, { headers });
        if (repR.ok) {
          const repData = await repR.json();
          setReport(repData.report);
        }
      } catch { /* dashboard still works without report */ }
    }
  }

  // ── API: create session ──────────────────────────────────────────────────
  async function createSession() {
    setCreateError('');
    if (!subjectName.trim()) { setCreateError("Please add your name first — evaluators will see it on the invitation."); return; }

    // Build questions payload
    let questions, questionOrder;
    if (useRecommended) {
      questions = RECOMMENDED_QUESTIONS;
      questionOrder = RECOMMENDED_ORDER;
    } else {
      const filled = customQuestions.map((t, i) => ({ id: `q${i + 1}`, text: t.trim() })).filter(q => q.text);
      if (filled.length < 1) { setCreateError('Please write at least one question.'); return; }
      questions = filled;
      questionOrder = filled.map(q => q.id); // custom questions display in author-order
    }

    // Build evaluators payload (strip empty rows; keep rows with at least a name)
    const cleanEvaluators = evaluatorsDraft
      .map(e => ({ name: e.name.trim(), relationship: e.relationship, email: e.email.trim() }))
      .filter(e => e.name);
    if (cleanEvaluators.length < 1) {
      setCreateError('Please add at least one evaluator. You can always add more from the dashboard later.');
      return;
    }

    if (weeklyOptIn && !subjectEmail.trim()) {
      setCreateError('Please add your email if you want weekly updates, or uncheck the box.');
      return;
    }

    setCreating(true);
    try {
      const r = await fetch('/api/sessions/mm/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subjectName: subjectName.trim(),
          questions,
          questionOrder,
          useDefaultQuestions: useRecommended,
          evaluators: cleanEvaluators,
          weeklyUpdatesOptIn: weeklyOptIn,
          subjectEmail: weeklyOptIn ? subjectEmail.trim() : '',
        }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || `Failed (${r.status})`);

      // /create returns { code, subjectToken, shareURL } only — rebuild config locally
      const localConfig = {
        code: data.code,
        subjectName: subjectName.trim(),
        subjectFirstName: firstName(subjectName),
        questions,
        questionOrder,
        weeklyUpdatesOptIn: weeklyOptIn,
        createdAt: new Date().toISOString(),
      };
      saveSubjectToken(data.code, data.subjectToken);
      setCode(data.code);
      setSubjectToken(data.subjectToken);
      setConfig(localConfig);
      setShareURL(data.shareURL || `${window.location.origin}${window.location.pathname}?code=${encodeURIComponent(data.code)}&v=e`);
      writeCodeToUrl(data.code);
      // Synthesize the initial evaluators list locally from what we sent (statuses default to 'pending')
      setEvaluators(cleanEvaluators.map((e, i) => ({
        id: `local-${i}`, name: e.name, relationship: e.relationship, status: 'pending', addedAt: new Date().toISOString(),
      })));
      setSelfSubmitted(false);
      setStep('created');
      window.scrollTo({ top: 0 });
    } catch (e) {
      setCreateError(e.message || 'Could not create session.');
    } finally {
      setCreating(false);
    }
  }

  // ── API: add another evaluator from dashboard ────────────────────────────
  async function submitAddEvaluator() {
    setAddEvalError('');
    if (!newEval.name.trim()) { setAddEvalError('Name is required.'); return; }
    setAddEvalLoading(true);
    try {
      const r = await fetch(`/api/sessions/mm/${encodeURIComponent(code)}/evaluators`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${subjectToken}` },
        body: JSON.stringify({ name: newEval.name.trim(), relationship: newEval.relationship, email: newEval.email.trim() }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || `Failed (${r.status})`);
      // Refresh full list so the new row has its server-issued id
      await loadDashboardData(code, subjectToken);
      setNewEval({ name: '', relationship: 'Peer', email: '' });
      setShowAddEvaluatorForm(false);
    } catch (e) {
      setAddEvalError(e.message || 'Could not add evaluator.');
    } finally {
      setAddEvalLoading(false);
    }
  }

  // ── API: send a reminder for one evaluator ───────────────────────────────
  // Spec §10: evaluator email addresses are discarded after the initial send to
  // preserve privacy. To reach a non-responding evaluator, the subject either
  // re-enters their email (we send a fresh invite + then discard again) or
  // copies the personalized URL and shares it themselves.
  async function sendReminder(evalId, email) {
    setReminderLoading(p => ({ ...p, [evalId]: true }));
    setReminderError(p => ({ ...p, [evalId]: '' }));
    try {
      const r = await fetch(`/api/sessions/mm/${encodeURIComponent(code)}/evaluators`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${subjectToken}` },
        body: JSON.stringify({ evaluatorId: evalId, action: 'remind', email: (email || '').trim() }),
      });
      if (!r.ok) {
        const data = await r.json().catch(() => ({}));
        throw new Error(data.error || `Failed (${r.status})`);
      }
      setDashError('');
      setRemindingEvalId(null);
      setReminderEmail(p => ({ ...p, [evalId]: '' }));
    } catch (e) {
      setReminderError(p => ({ ...p, [evalId]: e.message || 'Could not send reminder.' }));
    } finally {
      setReminderLoading(p => ({ ...p, [evalId]: false }));
    }
  }

  // ── API: refresh dashboard manually ──────────────────────────────────────
  async function manualRefresh() {
    setRefreshing(true); setDashError('');
    try { await loadDashboardData(code, subjectToken); }
    catch (e) { setDashError(e.message || 'Refresh failed.'); }
    finally { setRefreshing(false); }
  }

  // ── API: submit self-survey ──────────────────────────────────────────────
  async function submitSelfSurvey() {
    setSubmitError(''); setSubmitting(true);
    try {
      // Filter to only filled answers (skips allowed)
      const payload = Object.fromEntries(
        Object.entries(answers).filter(([, v]) => (v || '').trim())
      );
      const r = await fetch(`/api/sessions/mm/${encodeURIComponent(code)}/self`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${subjectToken}` },
        body: JSON.stringify({ answers: payload }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || `Failed (${r.status})`);
      setSelfSubmitted(true);
      try { localStorage.removeItem(`mm_draft_${code}_self`); } catch (_) {}
      setStep('self-done');
      window.scrollTo({ top: 0 });
    } catch (e) {
      setSubmitError(e.message || 'Could not submit self-survey.');
    } finally {
      setSubmitting(false);
    }
  }

  // ── API: submit evaluator response ───────────────────────────────────────
  async function submitEvaluatorResponse() {
    setSubmitError('');
    // Open share-link submissions have no token, so a name is required to attribute the response.
    const identityName = (editingEvalInfo ? evalInfoDraft.name : evaluatorInfo.name) || '';
    if (!inviteToken && !identityName.trim()) {
      setSubmitError('Please add your name before submitting.');
      return;
    }
    setSubmitting(true);
    try {
      const payload = Object.fromEntries(
        Object.entries(answers).filter(([, v]) => (v || '').trim())
      );
      const r = await fetch(`/api/sessions/mm/${encodeURIComponent(code)}/responses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          evaluatorInviteToken: inviteToken,
          // Always send the current identity. For invited evaluators this matches (or
          // updates) their record; for open share-link submits (no token) the backend
          // creates a new evaluator from this self-entered name.
          nameOverride: (editingEvalInfo ? evalInfoDraft.name : evaluatorInfo.name) || undefined,
          relationshipOverride: (editingEvalInfo ? evalInfoDraft.relationship : evaluatorInfo.relationship) || undefined,
          answers: payload,
        }),
      });
      const data = await r.json();
      if (!r.ok) {
        if (r.status === 409) throw new Error('Looks like you already submitted earlier. Responses can only be submitted once.');
        throw new Error(data.error || `Failed (${r.status})`);
      }
      try { localStorage.removeItem(`mm_draft_${code}_eval_${inviteToken || 'shared'}`); } catch (_) {}
      setStep('eval-done');
      window.scrollTo({ top: 0 });
    } catch (e) {
      setSubmitError(e.message || 'Could not submit your responses.');
    } finally {
      setSubmitting(false);
    }
  }

  // ── API: generate the report ─────────────────────────────────────────────
  async function generateReport() {
    setGenerateError(''); setGenerating(true);
    try {
      const r = await fetch(`/api/sessions/mm/${encodeURIComponent(code)}/synthesize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${subjectToken}` },
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || `Failed (${r.status})`);
      setReport(data.report);
      setShowGenerateModal(false);
      setStep('report');
      window.scrollTo({ top: 0 });
    } catch (e) {
      setGenerateError(e.message || 'Synthesis failed. Try again in a moment.');
    } finally {
      setGenerating(false);
    }
  }

  // ── API: delete the session ──────────────────────────────────────────────
  async function deleteSession() {
    setDeleting(true);
    try {
      const r = await fetch(`/api/sessions/mm/${encodeURIComponent(code)}/delete`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${subjectToken}` },
      });
      if (!r.ok) {
        const data = await r.json().catch(() => ({}));
        throw new Error(data.error || `Failed (${r.status})`);
      }
      clearSubjectToken(code);
      // Reset and go back to welcome
      window.history.replaceState({}, '', window.location.pathname);
      setCode(''); setSubjectToken(''); setConfig(null);
      setEvaluators([]); setSelfSubmitted(false); setReport(null);
      setShowDeleteModal(false);
      setStep('welcome');
    } catch (e) {
      setDashError(e.message || 'Could not delete the session.');
      setShowDeleteModal(false);
    } finally {
      setDeleting(false);
    }
  }

  // ── API: create shareable read-only results link ─────────────────────────
  async function createResultsLink() {
    setCreatingResultsLink(true);
    try {
      const r = await fetch(`/api/sessions/mm/${encodeURIComponent(code)}/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${subjectToken}` },
        body: JSON.stringify({ action: 'create-results-link' }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || `Failed (${r.status})`);
      const link = `${window.location.origin}${window.location.pathname}?code=${encodeURIComponent(code)}&v=results&t=${encodeURIComponent(data.resultsToken)}`;
      setResultsTokenLocal(data.resultsToken);
      navigator.clipboard.writeText(link).catch(() => {});
      setShowShareResultsModal(false);
      alert('Read-only link copied to clipboard:\n\n' + link);
    } catch (e) {
      setReportError(e.message || 'Could not create the share link.');
      setShowShareResultsModal(false);
    } finally {
      setCreatingResultsLink(false);
    }
  }

  // ── Speech recognition controls ──────────────────────────────────────────
  function startRecognition(currentQid) {
    if (!speechSupported) return;
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    const r = new SR();
    r.continuous = true;
    r.interimResults = true;
    r.lang = 'en-US';
    let appended = '';
    r.onresult = (evt) => {
      let final = '';
      let interim = '';
      for (let i = evt.resultIndex; i < evt.results.length; i++) {
        const t = evt.results[i][0].transcript;
        if (evt.results[i].isFinal) final += t;
        else interim += t;
      }
      if (final) {
        appended += (appended && !appended.endsWith(' ') ? ' ' : '') + final;
        setAnswers(a => {
          const existing = a[currentQid] || '';
          const sep = existing && !existing.endsWith(' ') && !existing.endsWith('\n') ? ' ' : '';
          return { ...a, [currentQid]: existing + sep + final };
        });
      }
      setInterimText(interim);
    };
    r.onerror = () => { setRecognizing(false); };
    r.onend = () => { setRecognizing(false); setInterimText(''); };
    try {
      r.start();
      recognitionRef.current = r;
      setRecognizing(true);
    } catch {
      setRecognizing(false);
    }
  }
  function stopRecognition() {
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch { /* noop */ }
      recognitionRef.current = null;
    }
    setRecognizing(false);
    setInterimText('');
  }

  // ── Look up question text by id (works for recommended OR custom) ────────
  function questionTextById(qid) {
    if (!config) return '';
    const found = (config.questions || []).find(q => q.id === qid);
    return found ? found.text : '';
  }

  // ── Display order resolver ───────────────────────────────────────────────
  function currentOrderedIds() {
    if (!config) return [];
    return Array.isArray(config.questionOrder) && config.questionOrder.length
      ? config.questionOrder
      : (config.questions || []).map(q => q.id);
  }

  // ── Self-survey helpers: second-person text + drop q5 (recommended set only) ─
  function isRecommendedQuestionSet() {
    if (!config || !Array.isArray(config.questions) || config.questions.length !== RECOMMENDED_QUESTIONS.length) return false;
    return RECOMMENDED_QUESTIONS.every(rq => {
      const f = config.questions.find(q => q.id === rq.id);
      return f && f.text === rq.text;
    });
  }
  function selfOrderedIds() {
    const ids = currentOrderedIds();
    return isRecommendedQuestionSet() ? ids.filter(id => id !== 'q5') : ids;
  }
  function selfQuestionTextById(qid) {
    if (isRecommendedQuestionSet() && RECOMMENDED_QUESTIONS_SELF[qid]) return RECOMMENDED_QUESTIONS_SELF[qid];
    return questionTextById(qid);
  }

  // ── Shared question screen render (used by self-survey AND evaluator) ────
  function renderQuestionScreen({ totalQuestions, currentQid, onSkip, onPrev, onNext, isLast, contextLabel, isSelf }) {
    const qText = isSelf ? selfQuestionTextById(currentQid) : questionTextById(currentQid);
    const value = answers[currentQid] || '';
    const updateAnswer = (v) => setAnswers(a => ({ ...a, [currentQid]: v }));
    const canSpeak = speechSupported && inputMode === 'speak';

    return (
      <div className="mm-wrap">
        <SEO
          title="Many Mirrors: A 360 for Yourself | InciteU"
          description="Six short questions for honest, anonymous feedback. Free, self-directed, takes 10–15 minutes."
          path="/tools/self/many-mirrors"
        />
        <a onClick={(e) => { e.preventDefault(); navigate('home'); }} href="#"
           style={{ display: 'inline-block', color: C.creamMuted, textDecoration: 'none', fontSize: 12, letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 32, cursor: 'pointer' }}>
          ← Back to tools
        </a>

        {/* Progress bar */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 32, alignItems: 'center' }}>
          {Array.from({ length: totalQuestions }, (_, n) => (
            <div key={n} style={{
              height: 4, flex: 1,
              background: n < qIndex ? palette.accentMuted : n === qIndex ? palette.accent : C.line,
              borderRadius: 2, transition: 'background 0.4s'
            }} />
          ))}
        </div>

        <div style={{ ...eyebrow, marginBottom: 12 }}>{contextLabel}</div>
        <div style={{ fontFamily: F.sans, fontSize: 13, color: C.creamMuted, letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 14 }}>
          Question {qIndex + 1} of {totalQuestions}
        </div>
        <h2 style={{ ...heading(30), fontSize: 'clamp(22px, 3.4vw, 30px)', marginBottom: 28, maxWidth: 700, lineHeight: 1.35 }}>
          {qText}
        </h2>

        {/* Type / Speak toggle */}
        <div style={{ display: 'inline-flex', gap: 0, marginBottom: 18, border: `1px solid ${C.line}`, borderRadius: 3, overflow: 'hidden' }}>
          <button
            onClick={() => { stopRecognition(); setInputMode('type'); }}
            style={{
              background: inputMode === 'type' ? 'rgba(240,235,219,0.12)' : 'transparent',
              border: 'none', padding: '8px 18px', cursor: 'pointer',
              color: inputMode === 'type' ? palette.accent : C.creamMuted,
              fontFamily: F.sans, fontSize: 12, letterSpacing: '0.16em', textTransform: 'uppercase',
            }}
          >Type</button>
          <button
            onClick={() => { if (speechSupported) setInputMode('speak'); }}
            disabled={!speechSupported}
            title={!speechSupported ? 'Voice input not supported in this browser — please type your answer.' : ''}
            style={{
              background: inputMode === 'speak' ? 'rgba(240,235,219,0.12)' : 'transparent',
              border: 'none', borderLeft: `1px solid ${C.line}`, padding: '8px 18px',
              cursor: speechSupported ? 'pointer' : 'not-allowed',
              color: inputMode === 'speak' ? palette.accent : (speechSupported ? C.creamMuted : 'rgba(240,235,219,0.25)'),
              fontFamily: F.sans, fontSize: 12, letterSpacing: '0.16em', textTransform: 'uppercase',
              opacity: speechSupported ? 1 : 0.55,
            }}
          >Speak</button>
        </div>
        {!speechSupported && (
          <div style={{ fontFamily: F.sans, fontSize: 12, color: C.creamMuted, marginBottom: 12, fontStyle: 'italic' }}>
            Voice input isn't supported in this browser — type your answer below.
          </div>
        )}

        {canSpeak && (
          <div style={{ marginBottom: 14 }}>
            <p style={{ fontFamily: F.sans, fontSize: 13, color: C.creamMuted, lineHeight: 1.6, marginBottom: 12, maxWidth: 560 }}>
              Talk freely — you'll see the transcript appear, and you can edit it before moving on.
            </p>
            <button
              onClick={() => recognizing ? stopRecognition() : startRecognition(currentQid)}
              style={{
                ...btn(recognizing ? 'secondary' : 'primary'),
                padding: '10px 22px', fontSize: 12,
              }}
              onMouseEnter={btnHoverIn} onMouseLeave={btnHoverOut}
            >
              {recognizing
                ? <span><span className="mm-rec-pulse" style={{ display: 'inline-block', width: 8, height: 8, background: '#D88A7A', borderRadius: '50%', marginRight: 10, verticalAlign: 'middle' }} />Stop recording</span>
                : 'Start recording'}
            </button>
            {interimText && (
              <div style={{ marginTop: 12, fontFamily: F.serif, fontStyle: 'italic', color: C.creamMuted, fontSize: 15, maxWidth: 700 }}>
                {interimText}…
              </div>
            )}
          </div>
        )}

        <textarea
          className="mm-textarea"
          value={value}
          onChange={(e) => updateAnswer(e.target.value)}
          placeholder="Your response…"
          style={{
            ...fieldInput,
            background: 'rgba(240,235,219,0.035)',
            minHeight: 180, resize: 'vertical', lineHeight: 1.6,
          }}
        />

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', marginTop: 24, gap: 16 }}>
          <a onClick={(e) => { e.preventDefault(); onSkip(); }} href="#"
             style={{ color: C.creamMuted, fontSize: 13, fontFamily: F.sans, textDecoration: 'underline' }}>
            Skip this question
          </a>
          <div style={{ display: 'flex', gap: 12 }}>
            {qIndex > 0 && (
              <button onClick={() => { stopRecognition(); onPrev(); }} style={btn('secondary')} onMouseEnter={btnHoverIn} onMouseLeave={btnHoverOut}>
                Previous
              </button>
            )}
            <button onClick={() => { stopRecognition(); onNext(); }} style={btn('primary')} onMouseEnter={btnHoverIn} onMouseLeave={btnHoverOut}>
              {isLast ? 'Review →' : 'Next →'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Common page wrapper ──────────────────────────────────────────────────
  const pageWrap = { animation: 'fadeIn 0.4s ease', minHeight: '80vh', padding: '60px 6vw 80px', maxWidth: 820, margin: '0 auto' };

  // ── Boot / loading ───────────────────────────────────────────────────────
  if (step === 'boot' || loading) {
    return (
      <main style={pageWrap}>
        <SEO
          title="Many Mirrors: A 360 for Yourself | InciteU"
          description="Six short questions for honest, anonymous feedback. Free, self-directed, takes 10–15 minutes."
          path="/tools/self/many-mirrors"
        />
        <p style={{ color: C.creamMuted, fontFamily: F.sans, fontSize: 14 }}>Loading…</p>
      </main>
    );
  }

  // ========================================================================
  // STEP: welcome — first visit, no code in URL
  // ========================================================================
  if (step === 'welcome') {
    return (
      <main style={pageWrap}>
        <SEO
          title="Many Mirrors: A 360 for Yourself | InciteU"
          description="A free 360-style feedback tool. Invite a small group who know you in different contexts, gather six honest reflections each, and get a synthesized anonymous report."
          path="/tools/self/many-mirrors"
        />
        <a onClick={(e) => { e.preventDefault(); navigate('home'); }} href="#"
           style={{ display: 'inline-block', color: C.creamMuted, textDecoration: 'none', fontSize: 12, letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 40, cursor: 'pointer' }}>
          ← Back to tools
        </a>

        <div className="mm-wrap" style={{ display: 'flex', gap: 48, flexWrap: 'wrap', alignItems: 'flex-start' }}>
          <div style={{ flex: '1 1 420px', minWidth: 0 }}>
            <div style={{ ...eyebrow, marginBottom: 18 }}>A Self tool · Face What Is</div>
            <h1 style={{ ...heading(60), marginBottom: 18 }}>
              Many <em style={{ color: palette.accent, fontStyle: 'italic' }}>Mirrors</em>.
            </h1>
            <p style={{ fontFamily: F.serif, fontSize: 26, fontStyle: 'italic', color: palette.accent, marginBottom: 10, lineHeight: 1.4, maxWidth: 600 }}>
              A 360 for yourself.
            </p>
            <p style={{ fontFamily: F.serif, fontSize: 19, fontStyle: 'italic', color: C.creamMuted, marginBottom: 24, lineHeight: 1.55, maxWidth: 600 }}>
              Free. Confidential. No HR involved. Grow because you want to.
            </p>

            <button
              onClick={() => setShowReadMore(v => !v)}
              aria-expanded={showReadMore}
              style={{
                background: 'transparent', border: 'none', color: palette.accent, cursor: 'pointer',
                padding: 0, marginBottom: 22,
                fontFamily: F.sans, fontSize: 12, letterSpacing: '0.18em', textTransform: 'uppercase',
                display: 'inline-flex', alignItems: 'center', gap: 8,
              }}
            >
              Read more
              <span style={{
                display: 'inline-block', fontSize: 10,
                transform: showReadMore ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.25s',
              }}>▼</span>
            </button>

            {bootError && (
              <p style={{ color: '#D88A7A', fontFamily: F.sans, fontSize: 14, marginBottom: 16, maxWidth: 600 }}>{bootError}</p>
            )}

            <div style={{ marginBottom: showReadMore ? 28 : 48 }}>
              <button onClick={() => setStep('choose-questions')} style={btn('primary')} onMouseEnter={btnHoverIn} onMouseLeave={btnHoverOut}>
                Begin →
              </button>
            </div>

            {showReadMore && (
              <p style={{ fontSize: 16, lineHeight: 1.75, color: C.creamMuted, maxWidth: 600, marginBottom: 32, animation: 'fadeIn 0.3s ease' }}>
                We all have blindspots. One of the best ways to see what we can't see — but might need to — is to ask others.
                This tool helps you do that. You'll select a group of people you want input from, we'll ask them their thoughts,
                and you'll get an anonymous, direct read of how others see you.
              </p>
            )}

            <p style={{ fontFamily: F.sans, fontSize: 12, color: C.creamMuted, marginTop: 0, maxWidth: 560, lineHeight: 1.6, fontStyle: 'italic' }}>
              Your data and your evaluators' responses are kept for {TTL_DAYS} days, then permanently deleted.
              You can delete everything at any time.
            </p>
          </div>

          <div style={{ flex: '0 1 320px', maxWidth: 360, alignSelf: 'center' }}>
            <MirrorsArtwork width={340} />
          </div>
        </div>
      </main>
    );
  }

  // ========================================================================
  // STEP: choose questions
  // ========================================================================
  if (step === 'choose-questions') {
    return (
      <main style={pageWrap}>
        <SEO
          title="Many Mirrors: A 360 for Yourself | InciteU"
          description="Six short questions for honest, anonymous feedback. Free, self-directed, takes 10–15 minutes."
          path="/tools/self/many-mirrors"
        />
        <div className="mm-wrap">
          <div style={{ ...eyebrow, marginBottom: 12 }}>Step 1 of 3</div>
          <h2 style={{ ...heading(40), marginBottom: 16 }}>Choose your questions</h2>
          <p style={{ fontSize: 15, lineHeight: 1.7, color: C.creamMuted, maxWidth: 600, marginBottom: 28 }}>
            Use the six questions we recommend — refined over many cycles with senior leaders — or write your own (up to six). If you're not sure, use ours.
          </p>

          {/* Two equally-sized option boxes — chevron expands to detail */}
          {[
            {
              id: 'recommended',
              title: 'Use the recommended questions',
              subtitle: 'The six questions, in the order they\'ll be asked.',
              selected: useRecommended,
              onSelect: () => setUseRecommended(true),
              expanded: showRecommendedQs,
              onToggle: () => setShowRecommendedQs(v => !v),
            },
            {
              id: 'custom',
              title: 'Write my own questions',
              subtitle: 'Substitute up to six of your own.',
              selected: !useRecommended,
              onSelect: () => setUseRecommended(false),
              expanded: showCustomInfo,
              onToggle: () => setShowCustomInfo(v => !v),
            },
          ].map((opt) => (
            <div
              key={opt.id}
              style={{
                marginBottom: 16,
                background: palette.bgCard,
                border: `1px solid ${opt.selected ? palette.accentMuted : C.line}`,
                borderRadius: 4,
                transition: 'border-color 0.2s',
                overflow: 'hidden',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', padding: '20px 22px', gap: 14 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer', flex: 1, minWidth: 0 }}>
                  <input
                    type="radio"
                    name="qmode"
                    checked={opt.selected}
                    onChange={opt.onSelect}
                    style={{ width: 18, height: 18, accentColor: palette.accent, cursor: 'pointer', flexShrink: 0 }}
                  />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ color: C.cream, fontSize: 16, marginBottom: 4, fontWeight: 500 }}>{opt.title}</div>
                    <div style={{ color: C.creamMuted, fontSize: 13, lineHeight: 1.55 }}>{opt.subtitle}</div>
                  </div>
                </label>
                <button
                  onClick={(e) => { e.stopPropagation(); opt.onToggle(); }}
                  aria-expanded={opt.expanded}
                  aria-label={opt.expanded ? 'Collapse details' : 'Expand details'}
                  style={{
                    background: 'transparent', border: `1px solid ${C.line}`, color: palette.accent,
                    cursor: 'pointer', padding: '6px 10px', borderRadius: 2,
                    display: 'inline-flex', alignItems: 'center', flexShrink: 0,
                  }}
                >
                  <span style={{
                    display: 'inline-block', fontSize: 11, lineHeight: 1,
                    transform: opt.expanded ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.25s',
                  }}>▼</span>
                </button>
              </div>

              {opt.expanded && opt.id === 'recommended' && (
                <div style={{ padding: '4px 22px 22px', borderTop: `1px solid ${C.line}`, animation: 'fadeIn 0.25s ease' }}>
                  {RECOMMENDED_ORDER.map((qid, i) => {
                    const q = RECOMMENDED_QUESTIONS.find(rq => rq.id === qid);
                    return (
                      <div key={qid} style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginTop: 18 }}>
                        <div style={{
                          flexShrink: 0, width: 30, height: 30, borderRadius: '50%',
                          background: 'rgba(240,235,219,0.12)',
                          border: `1px solid ${palette.accentMuted}`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: palette.accent, fontFamily: F.sans, fontSize: 13, fontWeight: 500,
                          marginTop: 2,
                        }}>{i + 1}</div>
                        <p style={{ fontFamily: F.serif, fontSize: 17, fontStyle: 'italic', color: C.cream, lineHeight: 1.55, margin: 0 }}>
                          {q.text}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
              {opt.expanded && opt.id === 'custom' && (
                <div style={{ padding: '4px 22px 22px', borderTop: `1px solid ${C.line}`, animation: 'fadeIn 0.25s ease' }}>
                  <p style={{ fontFamily: F.sans, fontSize: 14, color: C.creamMuted, lineHeight: 1.7, marginTop: 14, marginBottom: 0 }}>
                    You'll be able to write up to six questions on the next screen. Aim for open-ended prompts that invite specific reflections — not yes/no questions.
                  </p>
                </div>
              )}
            </div>
          ))}

          <div style={{ marginBottom: 24 }} />

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <button onClick={() => setStep('welcome')} style={btn('secondary')} onMouseEnter={btnHoverIn} onMouseLeave={btnHoverOut}>
              Back
            </button>
            <button
              onClick={() => setStep(useRecommended ? 'add-evaluators' : 'custom-questions')}
              style={btn('primary')}
              onMouseEnter={btnHoverIn} onMouseLeave={btnHoverOut}
            >
              Continue →
            </button>
          </div>
        </div>
      </main>
    );
  }

  // ========================================================================
  // STEP: custom questions (only when "Write my own" selected)
  // ========================================================================
  if (step === 'custom-questions') {
    const filledCount = customQuestions.filter(q => q.trim()).length;
    return (
      <main style={pageWrap}>
        <SEO
          title="Many Mirrors: A 360 for Yourself | InciteU"
          description="Six short questions for honest, anonymous feedback. Free, self-directed, takes 10–15 minutes."
          path="/tools/self/many-mirrors"
        />
        <div className="mm-wrap">
          <div style={{ ...eyebrow, marginBottom: 12 }}>Step 1 of 3</div>
          <h2 style={{ ...heading(40), marginBottom: 14 }}>Write your six questions</h2>
          <p style={{ fontSize: 15, lineHeight: 1.7, color: C.creamMuted, maxWidth: 600, marginBottom: 28 }}>
            Aim for open-ended questions that invite specific reflections, not yes/no questions. You can add up to six questions; fewer is fine.
          </p>

          {customQuestions.map((qText, i) => (
            <div key={i} style={{ marginBottom: 20 }}>
              <label style={fieldLabel}>Question {i + 1}</label>
              <textarea
                className="mm-textarea"
                value={qText}
                onChange={(e) => setCustomQuestions(arr => arr.map((v, idx) => idx === i ? e.target.value : v))}
                style={{ ...fieldInput, background: 'rgba(240,235,219,0.035)', minHeight: 80, resize: 'vertical', lineHeight: 1.6 }}
                placeholder={i === 0 ? 'e.g. When am I at my best?' : ''}
              />
            </div>
          ))}

          <a onClick={(e) => { e.preventDefault(); setUseRecommended(true); setStep('choose-questions'); }} href="#"
             style={{ display: 'inline-block', color: C.creamMuted, textDecoration: 'underline', fontSize: 13, marginTop: 4, marginBottom: 24, fontFamily: F.sans }}>
            Use the recommended questions instead
          </a>

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 8 }}>
            <button onClick={() => setStep('choose-questions')} style={btn('secondary')} onMouseEnter={btnHoverIn} onMouseLeave={btnHoverOut}>
              Back
            </button>
            <button
              onClick={() => setStep('add-evaluators')}
              disabled={filledCount < 1}
              style={btn('primary', filledCount < 1)}
              onMouseEnter={filledCount >= 1 ? btnHoverIn : undefined}
              onMouseLeave={filledCount >= 1 ? btnHoverOut : undefined}
            >
              Continue →
            </button>
          </div>
        </div>
      </main>
    );
  }

  // ========================================================================
  // STEP: add evaluators
  // ========================================================================
  if (step === 'add-evaluators') {
    const updateEvaluator = (i, field, v) =>
      setEvaluatorsDraft(arr => arr.map((e, idx) => idx === i ? { ...e, [field]: v } : e));
    const removeEvaluator = (i) =>
      setEvaluatorsDraft(arr => arr.filter((_, idx) => idx !== i));
    const addRow = () =>
      setEvaluatorsDraft(arr => [...arr, { tmpId: `t${Date.now()}`, name: '', relationship: 'Peer', email: '' }]);

    const filledCount = evaluatorsDraft.filter(e => e.name.trim()).length;

    return (
      <main style={pageWrap}>
        <SEO
          title="Many Mirrors: A 360 for Yourself | InciteU"
          description="Six short questions for honest, anonymous feedback. Free, self-directed, takes 10–15 minutes."
          path="/tools/self/many-mirrors"
        />
        <div className="mm-wrap">
          <div style={{ ...eyebrow, marginBottom: 12 }}>Step 2 of 3</div>
          <h2 style={{ ...heading(40), marginBottom: 14 }}>Choose who to invite</h2>
          <p style={{ fontFamily: F.serif, fontSize: 17, fontStyle: 'italic', color: palette.accent, lineHeight: 1.6, maxWidth: 640, marginBottom: 16 }}>
            We suggest you invite ~15 people, so you get at least ~10 respondents. Report will only generate after 3 completed responses.
          </p>
          <p style={{ fontSize: 15, lineHeight: 1.7, color: C.creamMuted, maxWidth: 620, marginBottom: 28 }}>
            Aim for breadth, not just praise. Invite people who see you in different parts of your life — a boss or two,
            peers, direct reports, a client, family, a long-time friend. The richest reports come from selecting a mix of
            people who see you in different circumstances, and who may feel very differently about you.
          </p>

          {/* Subject's own name */}
          <div style={{ marginBottom: 28 }}>
            <label style={fieldLabel}>Your name</label>
            <input
              type="text"
              className="mm-input"
              value={subjectName}
              onChange={(e) => setSubjectName(e.target.value)}
              style={{ ...fieldInput, background: 'rgba(240,235,219,0.035)' }}
              placeholder="The name your evaluators will see"
              maxLength={120}
            />
          </div>

          {/* Evaluator rows */}
          <div style={{ ...eyebrow, marginBottom: 14, fontSize: 11 }}>Evaluators</div>
          {evaluatorsDraft.map((e, i) => (
            <div key={e.tmpId} style={{ background: palette.bgCard, border: `1px solid ${C.line}`, borderRadius: 4, padding: '20px 22px', marginBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <div style={{ ...eyebrow, fontSize: 11, marginBottom: 0 }}>Evaluator {i + 1}</div>
                {evaluatorsDraft.length > 1 && (
                  <button
                    onClick={() => removeEvaluator(i)}
                    style={{ background: 'none', border: 'none', color: C.creamMuted, cursor: 'pointer', fontSize: 18, lineHeight: 1, padding: 4 }}
                    title="Remove this row"
                  >×</button>
                )}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
                <div>
                  <label style={{ ...fieldLabel, fontSize: 10, marginBottom: 6 }}>Name</label>
                  <input
                    type="text" className="mm-input"
                    value={e.name}
                    onChange={(ev) => updateEvaluator(i, 'name', ev.target.value)}
                    style={{ ...fieldInput, background: 'rgba(240,235,219,0.035)' }}
                    placeholder="Name"
                  />
                </div>
                <div>
                  <label style={{ ...fieldLabel, fontSize: 10, marginBottom: 6 }}>Relationship</label>
                  <select
                    value={e.relationship}
                    onChange={(ev) => updateEvaluator(i, 'relationship', ev.target.value)}
                    style={{ ...fieldInput, background: 'rgba(240,235,219,0.035)', appearance: 'none', cursor: 'pointer' }}
                  >
                    {RATER_CATEGORIES.map(cat => <option key={cat} value={cat} style={{ background: palette.bgCard, color: C.cream }}>{cat}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ ...fieldLabel, fontSize: 10, marginBottom: 6 }}>Email (optional)</label>
                  <input
                    type="email" className="mm-input"
                    value={e.email}
                    onChange={(ev) => updateEvaluator(i, 'email', ev.target.value)}
                    style={{ ...fieldInput, background: 'rgba(240,235,219,0.035)' }}
                    placeholder="If left blank, share the URL manually"
                  />
                </div>
              </div>
            </div>
          ))}

          <button onClick={addRow} style={{ ...btn('secondary'), marginBottom: 28 }} onMouseEnter={btnHoverIn} onMouseLeave={btnHoverOut}>
            + Add another
          </button>

          {/* Privacy + share-link encouragement */}
          <div style={{ background: 'rgba(240,235,219,0.06)', border: `1px solid ${C.line}`, borderRadius: 4, padding: '18px 22px', marginBottom: 24, maxWidth: 680 }}>
            <p style={{ fontFamily: F.sans, fontSize: 14, color: C.creamMuted, lineHeight: 1.7, marginTop: 0, marginBottom: 12 }}>
              We send the invitation email once, then discard all evaluator email addresses.
              Names and responses are kept for {TTL_DAYS} days, then deleted. Or you can delete your data at any time.
            </p>
            <p style={{ fontFamily: F.sans, fontSize: 14, color: C.creamMuted, lineHeight: 1.7, margin: 0, marginBottom: 14 }}>
              If you prefer, you can send the URL below directly to your evaluators. In fact, we encourage this —
              completion is higher when contact comes directly from you.
            </p>
            <button
              onClick={() => setShowEmailPreview(v => !v)}
              aria-expanded={showEmailPreview}
              style={{
                background: 'transparent', border: 'none', color: palette.accent, cursor: 'pointer',
                padding: 0, fontFamily: F.sans, fontSize: 12, letterSpacing: '0.16em', textTransform: 'uppercase',
                display: 'inline-flex', alignItems: 'center', gap: 8,
              }}
            >
              See the email evaluators will receive
              <span style={{
                display: 'inline-block', fontSize: 10,
                transform: showEmailPreview ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.25s',
              }}>▼</span>
            </button>
            {showEmailPreview && (
              <div style={{
                marginTop: 14, padding: '18px 20px',
                background: 'rgba(31,57,55,0.55)',
                border: `1px solid ${C.line}`, borderRadius: 4,
                animation: 'fadeIn 0.25s ease',
              }}>
                <div style={{ fontFamily: F.sans, fontSize: 12, color: C.creamMuted, letterSpacing: '0.04em', marginBottom: 14, paddingBottom: 10, borderBottom: `1px solid ${C.line}` }}>
                  <span style={{ color: palette.accent, marginRight: 8 }}>Subject:</span>
                  {(subjectName.trim() || '[Your name]')} is asking for your honest feedback
                </div>
                <div style={{ fontFamily: F.sans, fontSize: 13, color: C.cream, lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
                  {`Hi [Evaluator name],

${(subjectName.trim() || '[Your name]')} is doing a Many Mirrors session — a free 360-style tool — and they've asked you to be one of the people who reflects back what you see.

You'll answer six short questions. It takes about 10–15 minutes. You can type or speak each answer.

Your responses are anonymous to ${firstName(subjectName) || '[your name]'}. They'll see a synthesis and a few selected quotes, lightly scrubbed of identifying detail. No individual response is shown, and no quote is attributed.

Begin → [unique link per evaluator]

This is a one-time email. We don't store your email address after sending.

— Many Mirrors, a free tool from InciteU
inciteu.com`}
                </div>
              </div>
            )}
          </div>

          {/* Weekly opt-in */}
          <label style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 12, cursor: 'pointer', maxWidth: 680 }}>
            <input
              type="checkbox"
              checked={weeklyOptIn}
              onChange={(e) => setWeeklyOptIn(e.target.checked)}
              style={{ width: 18, height: 18, marginTop: 3, accentColor: palette.accent, cursor: 'pointer' }}
            />
            <span style={{ fontSize: 14, color: C.cream, fontFamily: F.sans, lineHeight: 1.55 }}>
              Email me a weekly summary while I'm waiting (just respondent counts, no content).
            </span>
          </label>
          {weeklyOptIn && (
            <div style={{ marginLeft: 30, marginBottom: 24, maxWidth: 360 }}>
              <input
                type="email"
                className="mm-input"
                value={subjectEmail}
                onChange={(e) => setSubjectEmail(e.target.value)}
                style={{ ...fieldInput, background: 'rgba(240,235,219,0.035)' }}
                placeholder="your@email"
              />
            </div>
          )}

          {createError && (
            <p style={{ color: '#D88A7A', fontFamily: F.sans, fontSize: 14, marginBottom: 16, maxWidth: 600 }}>{createError}</p>
          )}

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 16 }}>
            <button onClick={() => setStep(useRecommended ? 'choose-questions' : 'custom-questions')} style={btn('secondary')} onMouseEnter={btnHoverIn} onMouseLeave={btnHoverOut}>
              Back
            </button>
            <button
              onClick={createSession}
              disabled={creating || filledCount < 1 || !subjectName.trim()}
              style={btn('primary', creating || filledCount < 1 || !subjectName.trim())}
              onMouseEnter={(creating || filledCount < 1 || !subjectName.trim()) ? undefined : btnHoverIn}
              onMouseLeave={(creating || filledCount < 1 || !subjectName.trim()) ? undefined : btnHoverOut}
            >
              {creating ? 'Creating…' : 'Create session →'}
            </button>
          </div>
        </div>
      </main>
    );
  }

  // ========================================================================
  // STEP: created — confirmation
  // ========================================================================
  if (step === 'created' && code && config) {
    const emailsCount = evaluatorsDraft.filter(e => e.email && e.email.trim()).length;
    return (
      <main style={pageWrap}>
        <SEO
          title="Many Mirrors: A 360 for Yourself | InciteU"
          description="Six short questions for honest, anonymous feedback. Free, self-directed, takes 10–15 minutes."
          path="/tools/self/many-mirrors"
        />
        <div className="mm-wrap">
          <div style={{ ...eyebrow, marginBottom: 12 }}>Step 3 of 3</div>
          <h2 style={{ ...heading(40), marginBottom: 18 }}>Your session is live</h2>
          <p style={{ fontSize: 16, lineHeight: 1.7, color: C.creamMuted, maxWidth: 600, marginBottom: 24 }}>
            Return to this dashboard to check progress and generate your report.
          </p>

          <div style={{ background: palette.bgCard, border: `1px solid ${C.line}`, borderRadius: 4, padding: '22px 24px', marginBottom: 24, maxWidth: 720 }}>
            <div style={{ ...fieldLabel, marginBottom: 10 }}>Your share link</div>
            <p style={{ fontFamily: F.sans, fontSize: 13, color: C.creamMuted, marginTop: 0, marginBottom: 12 }}>
              Send this to anyone you'd like to invite directly:
            </p>
            <input
              type="text" className="mm-input" readOnly value={shareURL}
              onFocus={(e) => e.target.select()}
              style={{ ...fieldInput, background: 'rgba(240,235,219,0.035)', fontSize: 13 }}
            />
            <button
              onClick={() => { navigator.clipboard.writeText(shareURL).catch(() => {}); }}
              style={{ ...btn('secondary'), marginTop: 12, padding: '10px 22px', fontSize: 12 }}
              onMouseEnter={btnHoverIn} onMouseLeave={btnHoverOut}
            >
              Copy link
            </button>
          </div>

          {emailsCount > 0 && (
            <p style={{ fontFamily: F.sans, fontSize: 14, color: C.creamMuted, marginBottom: 24, maxWidth: 600, lineHeight: 1.65 }}>
              We've also sent invitations to the {emailsCount} address{emailsCount === 1 ? '' : 'es'} you provided.
            </p>
          )}

          <p style={{ fontFamily: F.sans, fontSize: 13, color: C.creamMuted, marginBottom: 32, maxWidth: 600, fontStyle: 'italic' }}>
            Bookmark this page — it's how you'll come back. We don't require an account.
          </p>

          <button onClick={() => setStep('dashboard')} style={btn('primary')} onMouseEnter={btnHoverIn} onMouseLeave={btnHoverOut}>
            Go to dashboard →
          </button>
        </div>
      </main>
    );
  }

  // ========================================================================
  // STEP: dashboard — subject's running state
  // ========================================================================
  if (step === 'dashboard' && code && config) {
    const respondedCount = evaluators.filter(e => e.status === 'completed').length;
    const totalEvals = evaluators.length;
    const days = daysRemaining(config.createdAt);
    const canGenerate = respondedCount >= MIN_RESPONSES_FOR_REPORT;
    const hasReport = !!report;

    return (
      <main style={pageWrap}>
        <SEO
          title="Many Mirrors: A 360 for Yourself | InciteU"
          description="Six short questions for honest, anonymous feedback. Free, self-directed, takes 10–15 minutes."
          path="/tools/self/many-mirrors"
        />
        <a onClick={(e) => { e.preventDefault(); navigate('home'); }} href="#"
           style={{ display: 'inline-block', color: C.creamMuted, textDecoration: 'none', fontSize: 12, letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 32, cursor: 'pointer' }}>
          ← Back to tools
        </a>

        <div className="mm-wrap">
          <div style={{ ...eyebrow, marginBottom: 10 }}>Many Mirrors</div>
          <h1 style={{ ...heading(44), marginBottom: 24 }}>
            <em style={{ color: palette.accent, fontStyle: 'italic' }}>Your 360</em>
          </h1>

          {/* Status header */}
          <div style={{ marginBottom: 28 }}>
            <p style={{ fontFamily: F.serif, fontSize: 22, color: C.cream, margin: 0, lineHeight: 1.4 }}>
              <strong style={{ fontWeight: 600 }}>{respondedCount} of {totalEvals}</strong>{' '}
              evaluator{totalEvals === 1 ? '' : 's'} {respondedCount === 1 ? 'has' : 'have'} responded.
            </p>
            {days !== null && (
              <p style={{ fontFamily: F.sans, fontSize: 13, color: C.creamMuted, marginTop: 6, fontStyle: 'italic' }}>
                {days} day{days === 1 ? '' : 's'} until this session expires.
              </p>
            )}
          </div>

          {/* Share link card */}
          <div style={{ background: palette.bgCard, border: `1px solid ${C.line}`, borderRadius: 4, padding: '20px 22px', marginBottom: 24 }}>
            <div style={{ ...fieldLabel, marginBottom: 10 }}>Your share link</div>
            <input
              type="text" className="mm-input" readOnly value={shareURL}
              onFocus={(e) => e.target.select()}
              style={{ ...fieldInput, background: 'rgba(240,235,219,0.035)', fontSize: 13 }}
            />
            <button
              onClick={() => { navigator.clipboard.writeText(shareURL).catch(() => {}); }}
              style={{ ...btn('secondary'), marginTop: 12, padding: '10px 22px', fontSize: 12 }}
              onMouseEnter={btnHoverIn} onMouseLeave={btnHoverOut}
            >
              Copy link
            </button>
          </div>

          {/* Self-survey card (only if not yet submitted AND report not generated) */}
          {!selfSubmitted && !hasReport && (
            <div style={{ background: palette.bgCard, border: `1px solid ${C.line}`, borderRadius: 4, padding: '22px 24px', marginBottom: 18 }}>
              <h3 style={{ fontFamily: F.serif, fontSize: 22, color: C.cream, margin: '0 0 12px 0', fontWeight: 400 }}>
                Take the self-survey
              </h3>
              <p style={{ fontFamily: F.sans, fontSize: 14, color: C.creamMuted, lineHeight: 1.7, margin: '0 0 18px 0' }}>
                Reflect on yourself. Answer the same six questions we've sent to the others. This allows us to see how you see yourself,
                and how that aligns or differs from others. This is often one of the most useful parts of the process. Don't skip it,
                if you don't have to.
              </p>
              <button
                onClick={() => {
                  setAnswers(Object.fromEntries(selfOrderedIds().map(qid => [qid, ''])));
                  try {
                    const saved = localStorage.getItem(`mm_draft_${code}_self`);
                    if (saved) setAnswers(prev => ({ ...prev, ...JSON.parse(saved) }));
                  } catch (_) {}
                  setQIndex(0);
                  setStep('self-survey-intro');
                }}
                style={btn('primary')} onMouseEnter={btnHoverIn} onMouseLeave={btnHoverOut}
              >
                Take self-survey →
              </button>
            </div>
          )}
          {selfSubmitted && !hasReport && (
            <div style={{ fontFamily: F.sans, fontSize: 13, color: palette.accent, marginBottom: 18, fontStyle: 'italic' }}>
              ✓ Self-survey complete.
            </div>
          )}

          {/* Generate report card */}
          {!hasReport && (
            <div style={{ background: palette.bgCard, border: `1px solid ${canGenerate ? palette.accentMuted : C.line}`, borderRadius: 4, padding: '22px 24px', marginBottom: 24 }}>
              <h3 style={{ fontFamily: F.serif, fontSize: 22, color: C.cream, margin: '0 0 10px 0', fontWeight: 400 }}>
                Generate report
              </h3>
              <p style={{ fontFamily: F.sans, fontSize: 14, color: C.creamMuted, lineHeight: 1.7, margin: '0 0 18px 0' }}>
                {canGenerate
                  ? `Three or more evaluators have responded. You can generate now, or wait for more.`
                  : `Available when at least three evaluators have responded (${respondedCount} of ${MIN_RESPONSES_FOR_REPORT} so far).`
                }
              </p>
              <button
                onClick={() => {
                  // Gate: if self-survey not done, confirm skip first
                  if (!selfSubmitted) { setShowSkipSelfModal(true); }
                  else { setShowGenerateModal(true); }
                }}
                disabled={!canGenerate}
                style={btn('primary', !canGenerate)}
                onMouseEnter={canGenerate ? btnHoverIn : undefined}
                onMouseLeave={canGenerate ? btnHoverOut : undefined}
              >
                Generate report
              </button>
            </div>
          )}
          {hasReport && (
            <div style={{ background: 'rgba(240,235,219,0.08)', border: `1px solid ${palette.accentMuted}`, borderRadius: 4, padding: '20px 22px', marginBottom: 24 }}>
              <p style={{ fontFamily: F.sans, fontSize: 14, color: C.cream, margin: '0 0 14px 0' }}>
                Your report has been generated.
              </p>
              <button onClick={() => setStep('report')} style={btn('primary')} onMouseEnter={btnHoverIn} onMouseLeave={btnHoverOut}>
                View report →
              </button>
            </div>
          )}

          {/* Refresh */}
          <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
            <button onClick={manualRefresh} disabled={refreshing} style={btn('secondary', refreshing)} onMouseEnter={btnHoverIn} onMouseLeave={btnHoverOut}>
              {refreshing ? 'Refreshing…' : 'Refresh status'}
            </button>
          </div>
          {dashError && (
            <p style={{ color: '#D88A7A', fontFamily: F.sans, fontSize: 14, marginBottom: 16 }}>{dashError}</p>
          )}

          {/* Evaluator list */}
          <div style={{ ...eyebrow, marginBottom: 14 }}>Your evaluators</div>
          {evaluators.length === 0 ? (
            <p style={{ fontFamily: F.sans, fontSize: 14, color: C.creamMuted, fontStyle: 'italic', marginBottom: 24 }}>
              No evaluators yet.
            </p>
          ) : (
            <div style={{ marginBottom: 18 }}>
              {evaluators.map((e) => {
                const isExpanded = remindingEvalId === e.id;
                const evalUrl = e.inviteUrl
                  || (e.inviteToken ? `${window.location.origin}${window.location.pathname}?code=${encodeURIComponent(code)}&v=e&t=${encodeURIComponent(e.inviteToken)}` : shareURL);
                return (
                  <div key={e.id} style={{ borderBottom: `1px solid ${C.line}` }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 0', flexWrap: 'wrap', gap: 12 }}>
                      <div>
                        <span style={{ fontFamily: F.sans, fontSize: 15, color: C.cream }}>{e.name}</span>
                        <span style={{ fontFamily: F.sans, fontSize: 13, color: C.creamMuted, marginLeft: 10 }}>· {e.relationship.toLowerCase()}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                        {e.status === 'completed' ? (
                          <span style={{ fontFamily: F.sans, fontSize: 13, color: palette.accent, fontStyle: 'italic' }}>Completed</span>
                        ) : (
                          <>
                            <span style={{ fontFamily: F.sans, fontSize: 13, color: C.creamMuted, fontStyle: 'italic' }}>Not yet</span>
                            {!hasReport && (
                              <button
                                onClick={() => setRemindingEvalId(isExpanded ? null : e.id)}
                                aria-expanded={isExpanded}
                                style={{ background: 'none', border: `1px solid ${isExpanded ? palette.accentMuted : C.line}`, borderRadius: 2, padding: '5px 12px', color: isExpanded ? palette.accent : C.creamMuted, cursor: 'pointer', fontFamily: F.sans, fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase' }}
                              >
                                {isExpanded ? 'Close' : 'Remind'}
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </div>

                    {isExpanded && !hasReport && e.status !== 'completed' && (
                      <div style={{
                        padding: '4px 0 22px',
                        animation: 'fadeIn 0.25s ease',
                      }}>
                        <p style={{ fontFamily: F.serif, fontSize: 15, fontStyle: 'italic', color: C.cream, lineHeight: 1.6, marginTop: 0, marginBottom: 16, maxWidth: 620 }}>
                          Want to remind {firstName(e.name) || e.name} to give input? Add their email address again, or send them this URL directly.
                        </p>

                        {/* Option 1: re-enter email */}
                        <div style={{ marginBottom: 18 }}>
                          <label style={{ ...fieldLabel, fontSize: 10, marginBottom: 6 }}>Email</label>
                          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                            <input
                              type="email"
                              className="mm-input"
                              value={reminderEmail[e.id] || ''}
                              onChange={(ev) => setReminderEmail(p => ({ ...p, [e.id]: ev.target.value }))}
                              placeholder="their@email"
                              style={{ ...fieldInput, background: 'rgba(240,235,219,0.035)', maxWidth: 320, flex: '1 1 220px' }}
                            />
                            <button
                              onClick={() => sendReminder(e.id, reminderEmail[e.id])}
                              disabled={reminderLoading[e.id] || !(reminderEmail[e.id] || '').trim()}
                              style={{ ...btn('primary', reminderLoading[e.id] || !(reminderEmail[e.id] || '').trim()), padding: '10px 22px', fontSize: 11 }}
                              onMouseEnter={(reminderLoading[e.id] || !(reminderEmail[e.id] || '').trim()) ? undefined : btnHoverIn}
                              onMouseLeave={(reminderLoading[e.id] || !(reminderEmail[e.id] || '').trim()) ? undefined : btnHoverOut}
                            >
                              {reminderLoading[e.id] ? 'Sending…' : 'Send reminder email'}
                            </button>
                          </div>
                          {reminderError[e.id] && (
                            <p style={{ color: '#D88A7A', fontFamily: F.sans, fontSize: 13, marginTop: 8, marginBottom: 0 }}>{reminderError[e.id]}</p>
                          )}
                        </div>

                        {/* Divider */}
                        <div style={{ fontFamily: F.sans, fontSize: 11, color: C.creamMuted, letterSpacing: '0.2em', textTransform: 'uppercase', textAlign: 'center', margin: '14px 0', maxWidth: 540 }}>
                          — or —
                        </div>

                        {/* Option 2: copy URL */}
                        <div>
                          <label style={{ ...fieldLabel, fontSize: 10, marginBottom: 6 }}>Personal URL for {firstName(e.name) || e.name}</label>
                          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                            <input
                              type="text"
                              className="mm-input"
                              readOnly value={evalUrl}
                              onFocus={(ev) => ev.target.select()}
                              style={{ ...fieldInput, background: 'rgba(240,235,219,0.035)', fontSize: 12, maxWidth: 540, flex: '1 1 280px' }}
                            />
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(evalUrl).catch(() => {});
                                setReminderCopiedId(e.id);
                                setTimeout(() => { setReminderCopiedId(curr => curr === e.id ? null : curr); }, 1800);
                              }}
                              style={{ ...btn('secondary'), padding: '10px 22px', fontSize: 11 }}
                              onMouseEnter={btnHoverIn} onMouseLeave={btnHoverOut}
                            >
                              {reminderCopiedId === e.id ? 'Copied ✓' : 'Copy URL'}
                            </button>
                          </div>
                          <p style={{ fontFamily: F.sans, fontSize: 12, color: C.creamMuted, fontStyle: 'italic', lineHeight: 1.6, marginTop: 8, marginBottom: 0, maxWidth: 540 }}>
                            Paste into a text, Slack, or your own email — completion is higher when contact comes directly from you.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Add evaluator (only before report) */}
          {!hasReport && (
            <div style={{ marginBottom: 48 }}>
              {!showAddEvaluatorForm ? (
                <button
                  onClick={() => { setShowAddEvaluatorForm(true); setAddEvalError(''); }}
                  style={{ background: 'none', border: 'none', color: palette.accent, fontFamily: F.sans, fontSize: 13, cursor: 'pointer', padding: 0, textDecoration: 'underline' }}
                >
                  + Add another evaluator
                </button>
              ) : (
                <div style={{ background: palette.bgCard, border: `1px solid ${C.line}`, borderRadius: 4, padding: '18px 22px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 12 }}>
                    <input className="mm-input" placeholder="Name" value={newEval.name} onChange={(e) => setNewEval(v => ({ ...v, name: e.target.value }))} style={{ ...fieldInput, background: 'rgba(240,235,219,0.035)' }} />
                    <select value={newEval.relationship} onChange={(e) => setNewEval(v => ({ ...v, relationship: e.target.value }))} style={{ ...fieldInput, background: 'rgba(240,235,219,0.035)', appearance: 'none', cursor: 'pointer' }}>
                      {RATER_CATEGORIES.map(cat => <option key={cat} value={cat} style={{ background: palette.bgCard, color: C.cream }}>{cat}</option>)}
                    </select>
                    <input className="mm-input" type="email" placeholder="Email (optional)" value={newEval.email} onChange={(e) => setNewEval(v => ({ ...v, email: e.target.value }))} style={{ ...fieldInput, background: 'rgba(240,235,219,0.035)' }} />
                  </div>
                  {addEvalError && <p style={{ color: '#D88A7A', fontFamily: F.sans, fontSize: 13, margin: '4px 0 12px 0' }}>{addEvalError}</p>}
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button onClick={submitAddEvaluator} disabled={addEvalLoading} style={{ ...btn('primary', addEvalLoading), padding: '10px 22px', fontSize: 12 }} onMouseEnter={btnHoverIn} onMouseLeave={btnHoverOut}>
                      {addEvalLoading ? 'Adding…' : 'Add'}
                    </button>
                    <button onClick={() => { setShowAddEvaluatorForm(false); setNewEval({ name: '', relationship: 'Peer', email: '' }); }} style={{ ...btn('secondary'), padding: '10px 22px', fontSize: 12 }} onMouseEnter={btnHoverIn} onMouseLeave={btnHoverOut}>
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Footer: delete link */}
          <a onClick={(e) => { e.preventDefault(); setShowDeleteModal(true); }} href="#"
             style={{ display: 'inline-block', color: C.creamMuted, fontSize: 12, fontFamily: F.sans, textDecoration: 'underline', marginTop: 36 }}>
            Delete this session and everything in it
          </a>
        </div>

        {/* Skip self-survey modal */}
        {showSkipSelfModal && (
          <ModalOverlay onClose={() => setShowSkipSelfModal(false)}>
            <h3 style={{ ...heading(28), marginBottom: 14 }}>Skip the self-survey?</h3>
            <p style={{ fontFamily: F.sans, fontSize: 14, color: C.creamMuted, lineHeight: 1.65, marginBottom: 24 }}>
              You can still generate your report without it, but you'll miss the self-vs-other comparison — often the most actionable section.
              The self-survey can't be added after the report is generated.
            </p>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <button onClick={() => setShowSkipSelfModal(false)} style={btn('secondary')} onMouseEnter={btnHoverIn} onMouseLeave={btnHoverOut}>Cancel</button>
              <button onClick={() => { setShowSkipSelfModal(false); setShowGenerateModal(true); }} style={btn('primary')} onMouseEnter={btnHoverIn} onMouseLeave={btnHoverOut}>
                Skip and continue
              </button>
            </div>
          </ModalOverlay>
        )}

        {/* Generate-report modal */}
        {showGenerateModal && (
          <ModalOverlay onClose={() => { if (!generating) setShowGenerateModal(false); }}>
            <h3 style={{ ...heading(28), marginBottom: 14 }}>Generate your report?</h3>
            <p style={{ fontFamily: F.sans, fontSize: 14, color: C.creamMuted, lineHeight: 1.65, marginBottom: 24 }}>
              This takes about 30 seconds. Once generated, your report is what you see — individual responses are hidden behind the synthesis to protect your evaluators.
            </p>
            {generateError && <p style={{ color: '#D88A7A', fontFamily: F.sans, fontSize: 13, marginBottom: 14 }}>{generateError}</p>}
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <button onClick={() => setShowGenerateModal(false)} disabled={generating} style={btn('secondary', generating)} onMouseEnter={btnHoverIn} onMouseLeave={btnHoverOut}>
                Cancel
              </button>
              <button onClick={generateReport} disabled={generating} style={btn('primary', generating)} onMouseEnter={btnHoverIn} onMouseLeave={btnHoverOut}>
                {generating ? 'Generating…' : 'Generate report'}
              </button>
            </div>
          </ModalOverlay>
        )}

        {/* Delete modal */}
        {showDeleteModal && (
          <ModalOverlay onClose={() => { if (!deleting) setShowDeleteModal(false); }}>
            <h3 style={{ ...heading(28), marginBottom: 14 }}>Delete this session?</h3>
            <p style={{ fontFamily: F.sans, fontSize: 14, color: C.creamMuted, lineHeight: 1.65, marginBottom: 24 }}>
              This permanently deletes the session, all evaluator responses, your self-survey, and your report. It cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <button onClick={() => setShowDeleteModal(false)} disabled={deleting} style={btn('secondary', deleting)} onMouseEnter={btnHoverIn} onMouseLeave={btnHoverOut}>
                Cancel
              </button>
              <button onClick={deleteSession} disabled={deleting} style={btn('primary', deleting)} onMouseEnter={btnHoverIn} onMouseLeave={btnHoverOut}>
                {deleting ? 'Deleting…' : 'Yes, delete everything'}
              </button>
            </div>
          </ModalOverlay>
        )}
      </main>
    );
  }

  // ========================================================================
  // STEP: self-survey-intro
  // ========================================================================
  if (step === 'self-survey-intro' && config) {
    return (
      <main style={pageWrap}>
        <SEO
          title="Many Mirrors: A 360 for Yourself | InciteU"
          description="Six short questions for honest, anonymous feedback. Free, self-directed, takes 10–15 minutes."
          path="/tools/self/many-mirrors"
        />
        <div className="mm-wrap">
          <div style={{ ...eyebrow, marginBottom: 12 }}>Self-survey</div>
          <h2 style={{ ...heading(40), marginBottom: 18 }}>Your six answers</h2>
          <p style={{ fontSize: 16, lineHeight: 1.75, color: C.creamMuted, maxWidth: 620, marginBottom: 36 }}>
            Take your time. Honest answers here make the final report sharper — what you say about yourself becomes the anchor for the self-vs-other comparison at the end.
          </p>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <button onClick={() => setStep('dashboard')} style={btn('secondary')} onMouseEnter={btnHoverIn} onMouseLeave={btnHoverOut}>
              Back to dashboard
            </button>
            <button
              onClick={() => { setQIndex(0); setStep('self-question'); }}
              style={btn('primary')} onMouseEnter={btnHoverIn} onMouseLeave={btnHoverOut}
            >
              Begin →
            </button>
          </div>
        </div>
      </main>
    );
  }

  // ========================================================================
  // STEP: self-question (per question)
  // ========================================================================
  if (step === 'self-question' && config) {
    const orderedIds = selfOrderedIds();
    const currentQid = orderedIds[qIndex];
    const total = orderedIds.length;
    return (
      <main style={pageWrap}>
        {renderQuestionScreen({
          totalQuestions: total,
          currentQid,
          contextLabel: 'Your self-survey',
          isSelf: true,
          isLast: qIndex === total - 1,
          onSkip: () => {
            setAnswers(a => ({ ...a, [currentQid]: '' }));
            if (qIndex === total - 1) setStep('self-review');
            else setQIndex(qIndex + 1);
          },
          onPrev: () => setQIndex(Math.max(0, qIndex - 1)),
          onNext: () => {
            if (qIndex === total - 1) setStep('self-review');
            else setQIndex(qIndex + 1);
          },
        })}
      </main>
    );
  }

  // ========================================================================
  // STEP: self-review
  // ========================================================================
  if (step === 'self-review' && config) {
    const orderedIds = selfOrderedIds();
    return (
      <main style={pageWrap}>
        <SEO
          title="Many Mirrors: A 360 for Yourself | InciteU"
          description="Six short questions for honest, anonymous feedback. Free, self-directed, takes 10–15 minutes."
          path="/tools/self/many-mirrors"
        />
        <div className="mm-wrap">
          <div style={{ ...eyebrow, marginBottom: 12 }}>Self-survey · Review</div>
          <h2 style={{ ...heading(36), marginBottom: 14 }}>Review your answers</h2>
          <p style={{ fontSize: 15, lineHeight: 1.7, color: C.creamMuted, maxWidth: 620, marginBottom: 28 }}>
            Ready to submit? You won't be able to edit your self-survey after this.
          </p>

          {orderedIds.map((qid, displayIdx) => {
            const qText = selfQuestionTextById(qid);
            const ans = (answers[qid] || '').trim();
            return (
              <div key={qid} style={{ background: palette.bgCard, border: `1px solid ${C.line}`, borderRadius: 4, padding: '18px 22px', marginBottom: 14 }}>
                <div style={{ ...eyebrow, fontSize: 13, marginBottom: 8 }}>Question {displayIdx + 1} of {orderedIds.length}</div>
                <p style={{ fontFamily: F.serif, fontSize: 17, color: C.cream, lineHeight: 1.5, marginTop: 0, marginBottom: 12 }}>{qText}</p>
                {ans ? (
                  <p style={{ fontFamily: F.sans, fontSize: 14, color: C.cream, lineHeight: 1.7, marginTop: 0, marginBottom: 12, whiteSpace: 'pre-wrap' }}>{ans}</p>
                ) : (
                  <p style={{ fontFamily: F.sans, fontSize: 13, color: C.creamMuted, fontStyle: 'italic', marginTop: 0, marginBottom: 12 }}>(skipped)</p>
                )}
                <a onClick={(e) => { e.preventDefault(); setQIndex(displayIdx); setStep('self-question'); }} href="#"
                   style={{ color: palette.accent, fontSize: 12, fontFamily: F.sans, textDecoration: 'underline' }}>
                  Edit
                </a>
              </div>
            );
          })}

          {submitError && <p style={{ color: '#D88A7A', fontFamily: F.sans, fontSize: 14, marginTop: 12, marginBottom: 12 }}>{submitError}</p>}

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 16 }}>
            <button onClick={() => setStep('self-question')} style={btn('secondary')} onMouseEnter={btnHoverIn} onMouseLeave={btnHoverOut}>
              Back
            </button>
            <button onClick={submitSelfSurvey} disabled={submitting} style={btn('primary', submitting)} onMouseEnter={btnHoverIn} onMouseLeave={btnHoverOut}>
              {submitting ? 'Submitting…' : 'Submit self-survey'}
            </button>
          </div>
        </div>
      </main>
    );
  }

  // ========================================================================
  // STEP: self-done
  // ========================================================================
  if (step === 'self-done') {
    return (
      <main style={pageWrap}>
        <SEO
          title="Many Mirrors: A 360 for Yourself | InciteU"
          description="Six short questions for honest, anonymous feedback. Free, self-directed, takes 10–15 minutes."
          path="/tools/self/many-mirrors"
        />
        <div className="mm-wrap">
          <div style={{ ...eyebrow, marginBottom: 12 }}>Self-survey complete</div>
          <h2 style={{ ...heading(40), marginBottom: 18 }}>Thank you.</h2>
          <p style={{ fontSize: 16, lineHeight: 1.75, color: C.creamMuted, maxWidth: 620, marginBottom: 32 }}>
            Your self-answers are saved. When at least three evaluators have responded, you'll be able to generate your report.
          </p>
          <button onClick={() => setStep('dashboard')} style={btn('primary')} onMouseEnter={btnHoverIn} onMouseLeave={btnHoverOut}>
            Back to dashboard →
          </button>
        </div>
      </main>
    );
  }

  // ========================================================================
  // STEP: report — view the generated report
  // ========================================================================
  if (step === 'report' && report) {
    const orderedIds = currentOrderedIds();
    const isPublicView = !!resultsTokenParam;
    const dateStr = report.generatedAt
      ? new Date(report.generatedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
      : '';
    const categoryList = Array.from(new Set(
      evaluators.filter(e => e.status === 'completed').map(e => e.relationship.toLowerCase())
    )).join(', ');
    const completedCount = evaluators.filter(e => e.status === 'completed').length;

    const downloadReportAsWord = () => {
      const h = s => escapeHTML(s || '');
      const subName = config?.subjectName || '';
      const dateStr = report.generatedAt
        ? new Date(report.generatedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
        : '';
      const lines = [
        `<html xmlns:o="urn:schemas-microsoft-com:office:office"><head><meta charset="utf-8">`,
        `<style>body{font-family:Georgia,serif;color:#1a1a1a;max-width:700px;margin:40px auto;line-height:1.65;}h1{font-size:26px;font-weight:400;}h2{font-size:18px;margin-top:36px;border-bottom:1px solid #ddd;padding-bottom:4px;}p{font-size:14px;margin:8px 0;}.label{font-weight:bold;font-size:11px;text-transform:uppercase;letter-spacing:0.1em;color:#666;margin-top:18px;margin-bottom:2px;}.quote{font-style:italic;padding:8px 14px;border-left:3px solid #bbb;margin:6px 0;}</style></head><body>`,
        `<p style="font-size:10px;text-transform:uppercase;letter-spacing:0.2em;color:#999;">Many Mirrors · InciteU</p>`,
        `<h1>Many Mirrors Report: ${h(subName)}</h1>`,
        dateStr ? `<p style="color:#666;font-size:12px;">Generated ${h(dateStr)} · ${completedCount} evaluator${completedCount === 1 ? '' : 's'}</p>` : '',
      ];
      if (report.overview?.themes?.length) {
        lines.push('<h2>Overview</h2>');
        lines.push('<p style="font-style:italic;color:#555;">The headlines, if you read nothing else.</p>');
        report.overview.themes.forEach(t => lines.push(`<p>${h(t)}</p>`));
      }
      if (Array.isArray(report.perQuestion)) {
        orderedIds.forEach((qid, i) => {
          const synth = report.perQuestion.find(p => p.questionId === qid);
          if (!synth) return;
          lines.push(`<h2>Q${i + 1}: ${h(questionTextById(qid))}</h2>`);
          if (synth.quotes?.length) { lines.push('<p class="label">Selected Quotes</p>'); synth.quotes.forEach(q => lines.push(`<p class="quote">&ldquo;${h(q)}&rdquo;</p>`)); }
          if (synth.patterns?.length) { lines.push('<p class="label">Patterns</p>'); synth.patterns.forEach(p => lines.push(`<p>${h(p)}</p>`)); }
          if (synth.outliers?.length) { lines.push('<p class="label">Outliers</p>'); synth.outliers.forEach(p => lines.push(`<p>${h(p)}</p>`)); }
          if (synth.absences?.length) { lines.push('<p class="label">Notably Absent</p>'); synth.absences.forEach(p => lines.push(`<p>${h(p)}</p>`)); }
          if (synth.categoryNote) lines.push(`<p style="font-style:italic;color:#666;">${h(synth.categoryNote)}</p>`);
        });
      }
      if (report.selfReflection) {
        lines.push('<h2>Self-survey vs Others</h2>');
        if (report.selfReflection.alignments?.length) { lines.push('<p class="label">Where you aligned</p>'); report.selfReflection.alignments.forEach(a => lines.push(`<p>${h(a)}</p>`)); }
        if (report.selfReflection.gaps?.length) { lines.push('<p class="label">Where you differed</p>'); report.selfReflection.gaps.forEach(g => lines.push(`<p>${h(g)}</p>`)); }
      }
      lines.push('</body></html>');
      const blob = new Blob([lines.join('')], { type: 'application/msword' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url;
      a.download = `many-mirrors-report-${code || 'report'}.doc`;
      document.body.appendChild(a); a.click();
      setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 100);
    };

    return (
      <main style={pageWrap}>
        <SEO
          title="Many Mirrors: A 360 for Yourself | InciteU"
          description="Six short questions for honest, anonymous feedback. Free, self-directed, takes 10–15 minutes."
          path="/tools/self/many-mirrors"
        />
        {!isPublicView && (
          <a onClick={(e) => { e.preventDefault(); setStep('dashboard'); }} href="#"
             style={{ display: 'inline-block', color: C.creamMuted, textDecoration: 'none', fontSize: 12, letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 32, cursor: 'pointer' }}>
            ← Back to dashboard
          </a>
        )}

        <div className="mm-wrap">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 24, flexWrap: 'wrap' }}>
            <div style={{ flex: '1 1 300px' }}>
              <div style={{ ...eyebrow, marginBottom: 12 }}>Many Mirrors</div>
              <h1 style={{ ...heading(48), marginBottom: 14 }}>Your Many Mirrors report</h1>
            </div>
            <div style={{ flexShrink: 0, opacity: 0.75, marginTop: 8 }}><MirrorsArtwork width={200} /></div>
          </div>
          {(dateStr || completedCount) && (
            <p style={{ fontFamily: F.sans, fontSize: 15, color: C.creamMuted, marginBottom: 40, fontStyle: 'italic' }}>
              {dateStr ? `Generated ${dateStr}` : ''}
              {completedCount > 0 ? ` · ${completedCount} evaluator${completedCount === 1 ? '' : 's'}` : ''}
              {categoryList ? ` across ${categoryList}` : ''}
            </p>
          )}

          {/* Overview — distinct box, collapsible when long */}
          {report.overview && Array.isArray(report.overview.themes) && report.overview.themes.length > 0 && (
            <section style={{ background: 'rgba(232,217,168,0.09)', border: '1px solid rgba(232,217,168,0.22)', borderRadius: 8, padding: '24px 28px', marginBottom: 48 }}>
              <h2 style={{ ...heading(26), marginBottom: 6, marginTop: 0 }}>Overview</h2>
              <p style={{ fontFamily: F.serif, fontSize: 15, color: C.creamMuted, fontStyle: 'italic', marginTop: 0, marginBottom: 18 }}>
                The headlines, if you read nothing else.
              </p>
              <div style={{ overflow: 'hidden', maxHeight: overviewExpanded ? 'none' : '8.5rem', position: 'relative' }}>
                {report.overview.themes.map((t, i) => (
                  <p key={i} style={{ fontFamily: F.sans, fontSize: 15, color: C.cream, lineHeight: 1.75, marginBottom: 18, maxWidth: 680 }}>
                    {t}
                  </p>
                ))}
                {!overviewExpanded && report.overview.themes.length > 2 && (
                  <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '3rem', background: 'linear-gradient(transparent, rgba(20,43,92,0.95))', pointerEvents: 'none' }} />
                )}
              </div>
              {report.overview.themes.length > 2 && (
                <button
                  onClick={() => setOverviewExpanded(e => !e)}
                  style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: palette.accent, fontFamily: F.sans, fontSize: 13, letterSpacing: '0.12em', textTransform: 'uppercase', marginTop: 14 }}
                >
                  {overviewExpanded ? 'Show less ↑' : 'Read more ↓'}
                </button>
              )}
            </section>
          )}

          {/* Per-question synthesis — chips to pop out individual questions */}
          {Array.isArray(report.perQuestion) && report.perQuestion.length > 0 && (
            <section style={{ marginBottom: 48 }}>
              <h2 style={{ ...heading(28), marginBottom: 16 }}>By question</h2>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 32 }}>
                {orderedIds.map((qid, i) => (
                  <button
                    key={qid}
                    onClick={() => setSelectedQid(selectedQid === qid ? null : qid)}
                    style={{ padding: '6px 14px', borderRadius: 20, border: `1px solid ${selectedQid === qid ? palette.accent : 'rgba(240,235,219,0.25)'}`, background: selectedQid === qid ? 'rgba(232,217,168,0.15)' : 'transparent', color: selectedQid === qid ? palette.accent : C.creamMuted, fontFamily: F.sans, fontSize: 13, letterSpacing: '0.1em', cursor: 'pointer', textTransform: 'uppercase' }}
                  >
                    Q{i + 1}
                  </button>
                ))}
                <button
                  onClick={() => setSelectedQid(null)}
                  style={{ padding: '6px 14px', borderRadius: 20, border: `1px solid ${selectedQid === null ? palette.accent : 'rgba(240,235,219,0.25)'}`, background: selectedQid === null ? 'rgba(232,217,168,0.15)' : 'transparent', color: selectedQid === null ? palette.accent : C.creamMuted, fontFamily: F.sans, fontSize: 13, letterSpacing: '0.1em', cursor: 'pointer', textTransform: 'uppercase' }}
                >
                  Show all
                </button>
              </div>
              {orderedIds.map((qid, displayIdx) => {
                if (selectedQid !== null && qid !== selectedQid) return null;
                const synth = report.perQuestion.find(p => p.questionId === qid);
                if (!synth) return null;
                const qText = questionTextById(qid);
                return (
                  <div key={qid} style={{ marginBottom: 40 }}>
                    <div style={{ ...eyebrow, fontSize: 13, marginBottom: 8 }}>Question {displayIdx + 1} of {orderedIds.length}</div>
                    <p style={{ fontFamily: F.serif, fontSize: 19, color: C.cream, lineHeight: 1.5, marginTop: 0, marginBottom: 20, fontStyle: 'italic' }}>{qText}</p>

                    {Array.isArray(synth.quotes) && synth.quotes.length > 0 && (
                      <div style={{ background: 'rgba(240,235,219,0.05)', border: `1px solid ${C.line}`, borderRadius: 4, padding: '18px 22px', marginBottom: 22 }}>
                        <div style={{ ...fieldLabel, marginBottom: 12 }}>Selected quotes</div>
                        {synth.quotes.map((q, i) => (
                          <p key={i} style={{ fontFamily: F.serif, fontSize: 15, fontStyle: 'italic', color: C.cream, lineHeight: 1.7, marginBottom: 12 }}>&ldquo;{q}&rdquo;</p>
                        ))}
                      </div>
                    )}
                    <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 22 }}>
                      {Array.isArray(synth.patterns) && synth.patterns.length > 0 && (
                        <div style={{ flex: '1 1 180px', background: 'rgba(240,235,219,0.04)', border: `1px solid ${C.line}`, borderRadius: 6, padding: '14px 18px' }}>
                          <div style={{ ...fieldLabel, marginBottom: 10 }}>Patterns</div>
                          {synth.patterns.map((p, i) => (
                            <p key={i} style={{ fontFamily: F.sans, fontSize: 14, color: C.cream, lineHeight: 1.7, marginBottom: 10, marginTop: 0 }}>{p}</p>
                          ))}
                        </div>
                      )}
                      {Array.isArray(synth.outliers) && synth.outliers.length > 0 && (
                        <div style={{ flex: '1 1 180px', background: 'rgba(240,235,219,0.04)', border: `1px solid ${C.line}`, borderRadius: 6, padding: '14px 18px' }}>
                          <div style={{ ...fieldLabel, marginBottom: 10 }}>Outliers</div>
                          {synth.outliers.map((p, i) => (
                            <p key={i} style={{ fontFamily: F.sans, fontSize: 14, color: C.cream, lineHeight: 1.7, marginBottom: 10, marginTop: 0 }}>{p}</p>
                          ))}
                        </div>
                      )}
                      {Array.isArray(synth.absences) && synth.absences.length > 0 && (
                        <div style={{ flex: '1 1 180px', background: 'rgba(240,235,219,0.04)', border: `1px solid ${C.line}`, borderRadius: 6, padding: '14px 18px' }}>
                          <div style={{ ...fieldLabel, marginBottom: 10 }}>Notably absent</div>
                          {synth.absences.map((p, i) => (
                            <p key={i} style={{ fontFamily: F.sans, fontSize: 14, color: C.cream, lineHeight: 1.7, marginBottom: 10, marginTop: 0 }}>{p}</p>
                          ))}
                        </div>
                      )}
                    </div>
                    {synth.categoryNote && (
                      <p style={{ fontFamily: F.sans, fontSize: 14, color: C.creamMuted, fontStyle: 'italic', lineHeight: 1.7, marginBottom: 18, paddingLeft: 14, borderLeft: `2px solid ${palette.accentMuted}` }}>
                        {synth.categoryNote}
                      </p>
                    )}
                  </div>
                );
              })}
            </section>
          )}

          {/* Self-reflection (only if self-survey was completed) */}
          {report.selfReflection && (Array.isArray(report.selfReflection.alignments) || Array.isArray(report.selfReflection.gaps)) && (
            <section style={{ marginBottom: 48 }}>
              <h2 style={{ ...heading(28), marginBottom: 8 }}>Your self-survey, alongside what others said</h2>
              <p style={{ fontFamily: F.serif, fontSize: 15, color: C.creamMuted, fontStyle: 'italic', marginTop: 0, marginBottom: 24 }}>
                Where your view of yourself matches what evaluators saw — and where it doesn't.
              </p>
              {Array.isArray(report.selfReflection.alignments) && report.selfReflection.alignments.length > 0 && (
                <div style={{ marginBottom: 28 }}>
                  <div style={{ ...fieldLabel, marginBottom: 12 }}>Alignments</div>
                  {report.selfReflection.alignments.map((a, i) => (
                    <p key={i} style={{ fontFamily: F.sans, fontSize: 15, color: C.cream, lineHeight: 1.75, marginBottom: 14 }}>{a}</p>
                  ))}
                </div>
              )}
              {Array.isArray(report.selfReflection.gaps) && report.selfReflection.gaps.length > 0 && (
                <div style={{ marginBottom: 12 }}>
                  <div style={{ ...fieldLabel, marginBottom: 12 }}>Gaps</div>
                  {report.selfReflection.gaps.map((g, i) => (
                    <p key={i} style={{ fontFamily: F.sans, fontSize: 15, color: C.cream, lineHeight: 1.75, marginBottom: 14 }}>{g}</p>
                  ))}
                </div>
              )}
            </section>
          )}

          {/* Footer actions (subject only) */}
          {!isPublicView && (
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 48, paddingTop: 28, borderTop: `1px solid ${C.line}` }}>
              <button onClick={downloadReportAsWord} style={btn('secondary')} onMouseEnter={btnHoverIn} onMouseLeave={btnHoverOut}>
                Download as Word doc
              </button>
              <button onClick={() => setShowShareResultsModal(true)} style={btn('secondary')} onMouseEnter={btnHoverIn} onMouseLeave={btnHoverOut}>
                Get a shareable read-only link
              </button>
            </div>
          )}
          {reportError && <p style={{ color: '#D88A7A', fontFamily: F.sans, fontSize: 14, marginTop: 18 }}>{reportError}</p>}
        </div>

        {/* Share-results modal */}
        {showShareResultsModal && (
          <ModalOverlay onClose={() => { if (!creatingResultsLink) setShowShareResultsModal(false); }}>
            <h3 style={{ ...heading(28), marginBottom: 14 }}>Create a shareable link?</h3>
            <p style={{ fontFamily: F.sans, fontSize: 14, color: C.creamMuted, lineHeight: 1.65, marginBottom: 24 }}>
              This creates a public link anyone with it can view. Only share with people you'd want to see your report.
            </p>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <button onClick={() => setShowShareResultsModal(false)} disabled={creatingResultsLink} style={btn('secondary', creatingResultsLink)} onMouseEnter={btnHoverIn} onMouseLeave={btnHoverOut}>
                Cancel
              </button>
              <button onClick={createResultsLink} disabled={creatingResultsLink} style={btn('primary', creatingResultsLink)} onMouseEnter={btnHoverIn} onMouseLeave={btnHoverOut}>
                {creatingResultsLink ? 'Creating…' : 'Create link'}
              </button>
            </div>
          </ModalOverlay>
        )}
      </main>
    );
  }

  // ========================================================================
  // STEP: eval-landing (evaluator entry)
  // ========================================================================
  if (step === 'eval-landing' && config) {
    const subjFirst = config.subjectFirstName || firstName(config.subjectName || '');
    const subjFull = config.subjectName || subjFirst;

    const continueToQuestions = () => {
      setQIndex(0);
      setStep('eval-question');
      window.scrollTo({ top: 0 });
    };

    return (
      <main style={pageWrap}>
        <SEO
          title={`Honest feedback for ${subjFirst} | Many Mirrors`}
          description={`${subjFirst} is asking a small group of people for honest reflections. You'll answer six short questions; it takes 10–15 minutes; your responses are anonymous.`}
          path="/tools/self/many-mirrors"
        />
        <div className="mm-wrap">
          <div style={{ ...eyebrow, marginBottom: 14 }}>Many Mirrors</div>
          <h1 style={{ ...heading(44), marginBottom: 22 }}>
            <em style={{ color: palette.accent, fontStyle: 'italic' }}>{subjFirst}</em> would like your honest feedback
          </h1>

          <p style={{ fontFamily: F.sans, fontSize: 16, color: C.cream, lineHeight: 1.75, maxWidth: 660, marginBottom: 18 }}>
            {subjFull} is asking a small group of people for honest reflections about how they show up. You're one of them.
          </p>
          <p style={{ fontFamily: F.sans, fontSize: 16, color: C.cream, lineHeight: 1.75, maxWidth: 660, marginBottom: 18 }}>
            You'll answer six short questions. It should take 10–15 minutes. You can type or speak each answer.
          </p>
          <p style={{ fontFamily: F.sans, fontSize: 16, color: C.cream, lineHeight: 1.75, maxWidth: 660, marginBottom: 32 }}>
            <strong>Your responses will be anonymous to {subjFirst}.</strong> They'll see a synthesis and a few selected quotes,
            lightly scrubbed of identifying detail. No individual response is shown, and no quote is attributed.
          </p>

          {/* Evaluator info card */}
          <div style={{ background: palette.bgCard, border: `1px solid ${C.line}`, borderRadius: 4, padding: '20px 22px', marginBottom: 28, maxWidth: 540 }}>
            {!editingEvalInfo ? (
              <>
                <p style={{ fontFamily: F.sans, fontSize: 14, color: C.creamMuted, marginTop: 0, marginBottom: 8 }}>You're answering as</p>
                <p style={{ fontFamily: F.serif, fontSize: 22, color: C.cream, margin: 0, lineHeight: 1.3 }}>
                  <strong style={{ fontWeight: 500 }}>{evaluatorInfo.name || '—'}</strong>
                  {evaluatorInfo.relationship && (
                    <span style={{ fontSize: 16, color: C.creamMuted }}> · {evaluatorInfo.relationship.toLowerCase()}</span>
                  )}
                </p>
                <a onClick={(e) => { e.preventDefault(); setEditingEvalInfo(true); }} href="#"
                   style={{ display: 'inline-block', marginTop: 14, color: palette.accent, fontSize: 12, fontFamily: F.sans, textDecoration: 'underline', letterSpacing: '0.1em' }}>
                  Not you, or wrong category? Update
                </a>
              </>
            ) : (
              <>
                <label style={{ ...fieldLabel, marginBottom: 6, fontSize: 10 }}>Your name</label>
                <input className="mm-input" value={evalInfoDraft.name} onChange={(e) => setEvalInfoDraft(v => ({ ...v, name: e.target.value }))} style={{ ...fieldInput, background: 'rgba(240,235,219,0.035)', marginBottom: 14 }} />
                <label style={{ ...fieldLabel, marginBottom: 6, fontSize: 10 }}>Relationship to {subjFirst}</label>
                <select value={evalInfoDraft.relationship} onChange={(e) => setEvalInfoDraft(v => ({ ...v, relationship: e.target.value }))} style={{ ...fieldInput, background: 'rgba(240,235,219,0.035)', appearance: 'none', cursor: 'pointer' }}>
                  {RATER_CATEGORIES.map(cat => <option key={cat} value={cat} style={{ background: palette.bgCard, color: C.cream }}>{cat}</option>)}
                </select>
                <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
                  <button onClick={() => { setEvaluatorInfo(prev => ({ ...prev, name: evalInfoDraft.name, relationship: evalInfoDraft.relationship })); setEditingEvalInfo(false); }} style={{ ...btn('primary'), padding: '10px 22px', fontSize: 12 }} onMouseEnter={btnHoverIn} onMouseLeave={btnHoverOut}>
                    Save
                  </button>
                  <button onClick={() => { setEvalInfoDraft({ name: evaluatorInfo.name, relationship: evaluatorInfo.relationship }); setEditingEvalInfo(false); }} style={{ ...btn('secondary'), padding: '10px 22px', fontSize: 12 }} onMouseEnter={btnHoverIn} onMouseLeave={btnHoverOut}>
                    Cancel
                  </button>
                </div>
              </>
            )}
          </div>

          <button onClick={continueToQuestions} style={btn('primary')} onMouseEnter={btnHoverIn} onMouseLeave={btnHoverOut}>
            Begin →
          </button>
        </div>
      </main>
    );
  }

  // ========================================================================
  // STEP: eval-question (per question)
  // ========================================================================
  if (step === 'eval-question' && config) {
    const orderedIds = currentOrderedIds();
    const currentQid = orderedIds[qIndex];
    const total = orderedIds.length;
    return (
      <main style={pageWrap}>
        {renderQuestionScreen({
          totalQuestions: total,
          currentQid,
          contextLabel: `Feedback for ${config.subjectFirstName || firstName(config.subjectName || '')}`,
          isLast: qIndex === total - 1,
          onSkip: () => {
            setAnswers(a => ({ ...a, [currentQid]: '' }));
            if (qIndex === total - 1) setStep('eval-review');
            else setQIndex(qIndex + 1);
          },
          onPrev: () => setQIndex(Math.max(0, qIndex - 1)),
          onNext: () => {
            if (qIndex === total - 1) setStep('eval-review');
            else setQIndex(qIndex + 1);
          },
        })}
      </main>
    );
  }

  // ========================================================================
  // STEP: eval-review
  // ========================================================================
  if (step === 'eval-review' && config) {
    const orderedIds = currentOrderedIds();
    const subjFirst = config.subjectFirstName || firstName(config.subjectName || '');
    return (
      <main style={pageWrap}>
        <SEO
          title={`Honest feedback for ${subjFirst} | Many Mirrors`}
          description={`${subjFirst} is asking a small group of people for honest reflections. You'll answer six short questions; it takes 10–15 minutes; your responses are anonymous.`}
          path="/tools/self/many-mirrors"
        />
        <div className="mm-wrap">
          <div style={{ ...eyebrow, marginBottom: 12 }}>Review your answers</div>
          <h2 style={{ ...heading(36), marginBottom: 14 }}>Review your answers</h2>
          <p style={{ fontSize: 15, lineHeight: 1.7, color: C.creamMuted, maxWidth: 620, marginBottom: 28 }}>
            Take a moment to review or edit before submitting. After submission, your answers are final.
          </p>

          {orderedIds.map((qid, displayIdx) => {
            const qText = questionTextById(qid);
            const ans = (answers[qid] || '').trim();
            return (
              <div key={qid} style={{ background: palette.bgCard, border: `1px solid ${C.line}`, borderRadius: 4, padding: '18px 22px', marginBottom: 14 }}>
                <div style={{ ...eyebrow, fontSize: 13, marginBottom: 8 }}>Question {displayIdx + 1} of {orderedIds.length}</div>
                <p style={{ fontFamily: F.serif, fontSize: 17, color: C.cream, lineHeight: 1.5, marginTop: 0, marginBottom: 12 }}>{qText}</p>
                {ans ? (
                  <p style={{ fontFamily: F.sans, fontSize: 14, color: C.cream, lineHeight: 1.7, marginTop: 0, marginBottom: 12, whiteSpace: 'pre-wrap' }}>{ans}</p>
                ) : (
                  <p style={{ fontFamily: F.sans, fontSize: 13, color: C.creamMuted, fontStyle: 'italic', marginTop: 0, marginBottom: 12 }}>(skipped)</p>
                )}
                <a onClick={(e) => { e.preventDefault(); setQIndex(displayIdx); setStep('eval-question'); }} href="#"
                   style={{ color: palette.accent, fontSize: 12, fontFamily: F.sans, textDecoration: 'underline' }}>
                  Edit
                </a>
              </div>
            );
          })}

          {submitError && <p style={{ color: '#D88A7A', fontFamily: F.sans, fontSize: 14, marginTop: 12, marginBottom: 12 }}>{submitError}</p>}

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 16 }}>
            <button onClick={() => { setQIndex(orderedIds.length - 1); setStep('eval-question'); }} style={btn('secondary')} onMouseEnter={btnHoverIn} onMouseLeave={btnHoverOut}>
              Back
            </button>
            <button onClick={submitEvaluatorResponse} disabled={submitting} style={btn('primary', submitting)} onMouseEnter={btnHoverIn} onMouseLeave={btnHoverOut}>
              {submitting ? 'Submitting…' : 'Submit my responses →'}
            </button>
          </div>
        </div>
      </main>
    );
  }

  // ========================================================================
  // STEP: eval-done
  // ========================================================================
  if (step === 'eval-done' && config) {
    const subjFirst = config.subjectFirstName || firstName(config.subjectName || '');
    return (
      <main style={pageWrap}>
        <SEO
          title="Thank you | Many Mirrors"
          description="Your responses have been submitted."
          path="/tools/self/many-mirrors"
        />
        <div className="mm-wrap">
          <div style={{ ...eyebrow, marginBottom: 12 }}>Done</div>
          <h2 style={{ ...heading(40), marginBottom: 22 }}>Thank you.</h2>
          <p style={{ fontFamily: F.sans, fontSize: 16, color: C.cream, lineHeight: 1.75, maxWidth: 620, marginBottom: 18 }}>
            Your responses have been submitted to {subjFirst}'s Many Mirrors session.
          </p>
          <p style={{ fontFamily: F.sans, fontSize: 16, color: C.cream, lineHeight: 1.75, maxWidth: 620, marginBottom: 18 }}>
            When at least three evaluators have responded, {subjFirst} can generate their report.
            Your name won't appear next to anything in it.
          </p>
          <p style={{ fontFamily: F.sans, fontSize: 14, color: C.creamMuted, lineHeight: 1.7, maxWidth: 620, marginBottom: 32, fontStyle: 'italic' }}>
            <strong>What we keep, and for how long:</strong> Your responses will be stored for {TTL_DAYS} days and then permanently deleted.
            {' '}{subjFirst} can also delete everything before that.
          </p>
        </div>
      </main>
    );
  }

  // ========================================================================
  // STEP: eval-already-done (evaluator returned via their link after submitting)
  // ========================================================================
  if (step === 'eval-already-done' && config) {
    const subjFirst = config.subjectFirstName || firstName(config.subjectName || '');
    return (
      <main style={pageWrap}>
        <SEO
          title="Thank you | Many Mirrors"
          description="Your responses have been submitted."
          path="/tools/self/many-mirrors"
        />
        <div className="mm-wrap">
          <div style={{ ...eyebrow, marginBottom: 12 }}>Already submitted</div>
          <h2 style={{ ...heading(40), marginBottom: 22 }}>You've already shared your feedback.</h2>
          <p style={{ fontFamily: F.sans, fontSize: 16, color: C.cream, lineHeight: 1.75, maxWidth: 620, marginBottom: 18 }}>
            Thank you again for taking part in {subjFirst}'s Many Mirrors session. Responses can only be submitted once,
            so this link won't ask you to fill it in again.
          </p>
        </div>
      </main>
    );
  }

  // ========================================================================
  // Fallback (should be unreachable)
  // ========================================================================
  return (
    <main style={pageWrap}>
      <SEO
        title="Many Mirrors: A 360 for Yourself | InciteU"
        description="Six short questions for honest, anonymous feedback. Free, self-directed, takes 10–15 minutes."
        path="/tools/self/many-mirrors"
      />
      <p style={{ color: C.creamMuted, fontFamily: F.sans, fontSize: 14 }}>
        Something went wrong loading this view. <a onClick={(e) => { e.preventDefault(); navigate('home'); }} href="#" style={{ color: palette.accent, textDecoration: 'underline' }}>Back to home</a>.
      </p>
    </main>
  );
}
