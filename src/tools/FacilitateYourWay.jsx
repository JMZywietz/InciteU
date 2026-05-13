import React, { useEffect, useMemo, useRef, useState } from 'react';
import { C, F } from '../theme.js';
import { btn, btnHoverIn, btnHoverOut, eyebrow, heading, fieldLabel, fieldInput } from '../styles.js';
import { useAppNavigate } from '../lib/useAppNavigate.js';
import { escapeHTML, downloadHTML } from '../lib/utils.js';

// =====================================================================
// LOCAL HELPERS
// =====================================================================
function makeQid() {
  // Short stable id; doesn't need to be globally unique, just unique within a session.
  return 'q_' + Math.random().toString(36).slice(2, 9);
}

function readCodeFromUrl() {
  if (typeof window === 'undefined') return null;
  const u = new URL(window.location.href);
  const c = u.searchParams.get('code');
  return c ? c.trim().toUpperCase() : null;
}

function writeCodeToUrl(code) {
  if (typeof window === 'undefined') return;
  const u = new URL(window.location.href);
  u.searchParams.set('code', code);
  window.history.replaceState({}, '', u.toString());
}

function tokenKey(code) { return `fyw:${code}:token`; }

function loadToken(code) {
  try { return localStorage.getItem(tokenKey(code)) || null; } catch { return null; }
}
function saveToken(code, token) {
  try { localStorage.setItem(tokenKey(code), token); } catch { /* no-op */ }
}

// =====================================================================
// LOCAL STYLES
// =====================================================================
const card = {
  background: C.bgCard,
  borderRadius: 6,
  padding: '28px 32px',
  marginBottom: 24,
};

const cardLined = {
  ...card,
  borderLeft: `3px solid ${C.sage}`,
};

const labelBlock = { ...fieldLabel, marginBottom: 8, display: 'block' };
const textArea = {
  ...fieldInput,
  minHeight: 100,
  resize: 'vertical',
  fontFamily: F.sans,
  lineHeight: 1.6,
};

// =====================================================================
// MAIN COMPONENT
// =====================================================================
export default function FacilitateYourWay() {
  const navigate = useAppNavigate();

  // step: 'boot' | 'mode' | 'facilitate-setup' | 'facilitate-dashboard'
  //     | 'contribute-join' | 'contribute-form' | 'contribute-done'
  const [step, setStep] = useState('boot');
  const [bootError, setBootError] = useState('');

  // Session data, populated after create/join
  const [code, setCode] = useState(null);
  const [config, setConfig] = useState(null); // public config (no tokenHash)
  const [facilitatorToken, setFacilitatorToken] = useState(null);

  // Contributor-side state
  const [contributorName, setContributorName] = useState('');
  const [answers, setAnswers] = useState({}); // { qid: text }
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  // Facilitator dashboard state
  const [responses, setResponses] = useState([]);
  const [syntheses, setSyntheses] = useState({}); // { qid: synthesisObj }
  const [synthLoading, setSynthLoading] = useState({}); // { qid: bool }
  const [dashError, setDashError] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  // ===================================================================
  // BOOT — decide initial step from URL + localStorage
  // ===================================================================
  const bootRanRef = useRef(false);
  useEffect(() => {
    if (bootRanRef.current) return;
    bootRanRef.current = true;
    (async () => {
      const urlCode = readCodeFromUrl();
      if (!urlCode) {
        setStep('mode');
        return;
      }
      // We have a code in URL. ALWAYS go to contributor view (share links are for contributors).
      // Facilitators access dashboard by creating a session, not clicking share links.
      const storedToken = null; // Force contributor mode
      if (storedToken) {
        // Try to load dashboard — fetch config (public) + responses (gated)
        try {
          const cfgRes = await fetch(`/api/sessions/${encodeURIComponent(urlCode)}`);
          if (cfgRes.status === 404) {
            setBootError(`Session ${urlCode} not found or has expired.`);
            setStep('mode');
            return;
          }
          if (!cfgRes.ok) throw new Error(`Failed to load session (${cfgRes.status})`);
          const cfg = await cfgRes.json();

          const respRes = await fetch(`/api/sessions/${encodeURIComponent(urlCode)}/responses`, {
            headers: { Authorization: `Bearer ${storedToken}` },
          });
          if (respRes.status === 403) {
            // Token no longer valid for this code; drop into contribute mode and surface a hint.
            setBootError('Your facilitator access for this session was not recognized. You can still join as a contributor.');
            setCode(urlCode);
            setConfig(cfg);
            setAnswers(Object.fromEntries(cfg.questions.map(q => [q.id, ''])));
            setStep('contribute-form');
            return;
          }
          if (!respRes.ok) throw new Error(`Failed to load responses (${respRes.status})`);
          const respData = await respRes.json();

          const synRes = await fetch(`/api/sessions/${encodeURIComponent(urlCode)}/synthesize`, {
            headers: { Authorization: `Bearer ${storedToken}` },
          });
          const synData = synRes.ok ? await synRes.json() : { syntheses: {} };

          setCode(urlCode);
          setConfig(cfg);
          setFacilitatorToken(storedToken);
          setResponses(respData.responses || []);
          setSyntheses(synData.syntheses || {});
          setStep('facilitate-dashboard');
          setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 100);
        } catch (e) {
          setBootError(String(e.message || e));
          setStep('mode');
        }
        return;
      }
      // No stored token — contribute path. Fetch the public config.
      try {
        const cfgRes = await fetch(`/api/sessions/${encodeURIComponent(urlCode)}`);
        if (cfgRes.status === 404) {
          setBootError(`Session ${urlCode} not found or has expired.`);
          setStep('mode');
          return;
        }
        if (!cfgRes.ok) throw new Error(`Failed to load session (${cfgRes.status})`);
        const cfg = await cfgRes.json();
        setCode(urlCode);
        setConfig(cfg);
        setAnswers(Object.fromEntries(cfg.questions.map(q => [q.id, ''])));
        setStep('contribute-form');
      } catch (e) {
        setBootError(String(e.message || e));
        setStep('mode');
      }
    })();
  }, []);

  // ===================================================================
  // SHARED RENDER PARTS
  // ===================================================================
  function BackToInciteU({ topMargin = 0 }) {
    return (
      <a
        href="#"
        onClick={(e) => { e.preventDefault(); navigate('home'); }}
        style={{
          display: 'inline-block',
          color: C.creamMuted,
          textDecoration: 'none',
          fontSize: 12,
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          marginTop: topMargin,
          marginBottom: 40,
          cursor: 'pointer',
        }}
      >
        ← Back to InciteU
      </a>
    );
  }

  function HeaderBlock({ eyebrowText, title, subtitle }) {
    return (
      <>
        <div style={{ ...eyebrow, marginBottom: 12 }}>{eyebrowText}</div>
        <h1 style={{ ...heading(56), marginBottom: 18 }}>{title}</h1>
        {subtitle ? (
          <p style={{ fontFamily: F.serif, fontSize: 21, lineHeight: 1.5, color: C.cream, marginBottom: 36, maxWidth: 640 }}>
            {subtitle}
          </p>
        ) : null}
      </>
    );
  }

  function ErrorLine({ text }) {
    if (!text) return null;
    return (
      <div style={{
        background: 'rgba(220, 120, 100, 0.12)',
        border: `1px solid ${C.warning || '#D87864'}`,
        color: C.warning || '#D87864',
        padding: '12px 16px',
        borderRadius: 4,
        fontSize: 14,
        marginBottom: 20,
      }}>{text}</div>
    );
  }

  function Shell({ children }) {
    return (
      <main style={{
        animation: 'fadeIn 0.4s ease',
        minHeight: '80vh',
        padding: '60px 6vw 80px',
        maxWidth: 880,
        margin: '0 auto',
      }}>
        <BackToInciteU />
        {children}
      </main>
    );
  }

  // ===================================================================
  // STEP: boot (loader)
  // ===================================================================
  if (step === 'boot') {
    return (
      <Shell>
        <p style={{ color: C.creamMuted, fontSize: 14, fontStyle: 'italic' }}>Loading…</p>
      </Shell>
    );
  }

  // ===================================================================
  // STEP: mode chooser
  // ===================================================================
  if (step === 'mode') {
    return (
      <Shell>
        <HeaderBlock
          eyebrowText="A Team tool"
          title={<>Facilitate Your <em style={{ color: C.sage, fontStyle: 'italic' }}>Way</em>.</>}
          subtitle="Sometimes teams need to check in on the fly. Write your own questions, gather input from the group, and have AI surface patterns, outliers, and what's notably absent."
        />
        <ErrorLine text={bootError} />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 18, marginTop: 24 }}>
          <button
            onClick={() => setStep('facilitate-setup')}
            onMouseEnter={btnHoverIn}
            onMouseLeave={btnHoverOut}
            style={{
              ...cardLined,
              cursor: 'pointer',
              border: `1px solid ${C.line || 'rgba(255,255,255,0.08)'}`,
              borderLeft: `3px solid ${C.sage}`,
              textAlign: 'left',
              color: C.cream,
              fontFamily: F.sans,
              transition: 'background 0.18s ease',
            }}
          >
            <div style={{ ...eyebrow, marginBottom: 8, color: C.sage }}>I'm facilitating</div>
            <div style={{ fontFamily: F.serif, fontSize: 22, color: C.cream, marginBottom: 6 }}>
              Set up a new session
            </div>
            <div style={{ fontSize: 14, color: C.creamMuted, lineHeight: 1.6 }}>
              Write the questions, share a code with your team, view all responses and ask AI to synthesize.
            </div>
          </button>

          <button
            onClick={() => setStep('contribute-join')}
            onMouseEnter={btnHoverIn}
            onMouseLeave={btnHoverOut}
            style={{
              ...card,
              cursor: 'pointer',
              border: `1px solid ${C.line || 'rgba(255,255,255,0.08)'}`,
              textAlign: 'left',
              color: C.cream,
              fontFamily: F.sans,
              transition: 'background 0.18s ease',
            }}
          >
            <div style={{ ...eyebrow, marginBottom: 8 }}>I'm contributing</div>
            <div style={{ fontFamily: F.serif, fontSize: 22, color: C.cream, marginBottom: 6 }}>
              Join a session with a code
            </div>
            <div style={{ fontSize: 14, color: C.creamMuted, lineHeight: 1.6 }}>
              Enter the session code your facilitator shared, then answer their questions.
            </div>
          </button>
        </div>
      </Shell>
    );
  }

  // ===================================================================
  // STEP: facilitate-setup (create a new session)
  // ===================================================================
  if (step === 'facilitate-setup') {
    return <FacilitateSetup
      onCancel={() => setStep('mode')}
      onCreated={({ code, facilitatorToken, config }) => {
        setCode(code);
        setFacilitatorToken(facilitatorToken);
        setConfig(config);
        saveToken(code, facilitatorToken);
        writeCodeToUrl(code);
        setResponses([]);
        setSyntheses({});
        setStep('facilitate-dashboard');
          setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 100);
      }}
      Shell={Shell}
      HeaderBlock={HeaderBlock}
      ErrorLine={ErrorLine}
    />;
  }

  // ===================================================================
  // STEP: facilitate-dashboard
  // ===================================================================
  if (step === 'facilitate-dashboard' && config && code) {
    return (
      <FacilitatorDashboard
        code={code}
        config={config}
        responses={responses}
        syntheses={syntheses}
        synthLoading={synthLoading}
        dashError={dashError}
        refreshing={refreshing}
        onRefresh={async () => {
          setRefreshing(true);
          setDashError('');
          try {
            const respRes = await fetch(`/api/sessions/${encodeURIComponent(code)}/responses`, {
              headers: { Authorization: `Bearer ${facilitatorToken}` },
            });
            if (!respRes.ok) throw new Error(`Failed to load responses (${respRes.status})`);
            const data = await respRes.json();
            setResponses(data.responses || []);
          } catch (e) {
            setDashError(String(e.message || e));
          } finally {
            setRefreshing(false);
          }
        }}
        onSynthesize={async (qid) => {
          setSynthLoading(s => ({ ...s, [qid]: true }));
          setDashError('');
          try {
            const r = await fetch(`/api/sessions/${encodeURIComponent(code)}/synthesize`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${facilitatorToken}`,
              },
              body: JSON.stringify({ questionId: qid }),
            });
            if (!r.ok) {
              const errBody = await r.json().catch(() => ({}));
              const fullError = errBody.detail ? `${errBody.error}: ${errBody.detail}` : (errBody.error || `Synthesis failed (${r.status})`);
              throw new Error(fullError);
            }
            const data = await r.json();
            setSyntheses(s => ({ ...s, [qid]: data.synthesis }));
          } catch (e) {
            setDashError(String(e.message || e));
          } finally {
            setSynthLoading(s => ({ ...s, [qid]: false }));
          }
        }}
        Shell={Shell}
        ErrorLine={ErrorLine}
      />
    );
  }

  // ===================================================================
  // STEP: contribute-join (manual code entry when no ?code= in URL)
  // ===================================================================
  if (step === 'contribute-join') {
    return <ContributeJoin
      initialCode=""
      onCancel={() => setStep('mode')}
      onJoined={({ code, config }) => {
        setCode(code);
        setConfig(config);
        setAnswers(Object.fromEntries(config.questions.map(q => [q.id, ''])));
        writeCodeToUrl(code);
        setStep('contribute-form');
      }}
      Shell={Shell}
      HeaderBlock={HeaderBlock}
      ErrorLine={ErrorLine}
    />;
  }

  // ===================================================================
  // STEP: contribute-form (answer the questions)
  // ===================================================================
  if (step === 'contribute-form' && config && code) {
    return (
      <Shell>
        <HeaderBlock
          eyebrowText={`Session ${code}`}
          title={config.title}
          subtitle={config.contextBlurb || null}
        />
        <ErrorLine text={bootError} />
        <ErrorLine text={submitError} />

        <p style={{ fontSize: 14, color: C.creamMuted, marginBottom: 28 }}>
          Hosted by {config.facilitatorName}. Your responses are private to the facilitator.
        </p>

        <div style={card}>
          <label style={labelBlock}>Your name (optional)</label>
          <input
            type="text"
            value={contributorName}
            onChange={(e) => setContributorName(e.target.value)}
            placeholder="Leave blank to stay anonymous"
            style={fieldInput}
              autoComplete="off"
              data-1p-ignore="true"
              data-lpignore="true"
              data-bwignore="true"
              data-form-type="other"
            />
        </div>

        {config.questions.map((q, i) => (
          <div key={q.id} style={card}>
            <div style={{ ...eyebrow, marginBottom: 10 }}>Question {i + 1}</div>
            <div style={{ fontFamily: F.serif, fontSize: 20, color: C.cream, marginBottom: 14, lineHeight: 1.4 }}>
              {q.text}
            </div>
            <textarea
              value={answers[q.id] || ''}
              onChange={(e) => setAnswers(a => ({ ...a, [q.id]: e.target.value }))}
              placeholder="Your response…"
              style={textArea}
              autoComplete="off"
              data-1p-ignore="true"
              data-lpignore="true"
              data-bwignore="true"
              name={`answer-${q.id}`}
              id={`answer-${q.id}`}
            />
          </div>
        ))}

        <div style={{ display: 'flex', gap: 14, marginTop: 28, flexWrap: 'wrap' }}>
          <button
            disabled={submitting}
            onClick={async () => {
              setSubmitError('');
              const hasAny = Object.values(answers).some(v => v && v.trim().length > 0);
              if (!hasAny) {
                setSubmitError('Please answer at least one question before submitting.');
                return;
              }
              setSubmitting(true);
              try {
                const cleaned = {};
                for (const q of config.questions) {
                  const v = (answers[q.id] || '').trim();
                  if (v) cleaned[q.id] = v;
                }
                const r = await fetch(`/api/sessions/${encodeURIComponent(code)}/responses`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    name: contributorName.trim() || null,
                    answers: cleaned,
                  }),
                });
                if (!r.ok) {
                  const errBody = await r.json().catch(() => ({}));
                  throw new Error(errBody.error || `Submit failed (${r.status})`);
                }
                setStep('contribute-done');
              } catch (e) {
                setSubmitError(String(e.message || e));
              } finally {
                setSubmitting(false);
              }
            }}
            onMouseEnter={btnHoverIn}
            onMouseLeave={btnHoverOut}
            style={btn('primary', submitting)}
          >
            {submitting ? 'Submitting…' : 'Submit my responses'}
          </button>
        </div>
      </Shell>
    );
  }

  // ===================================================================
  // STEP: contribute-done
  // ===================================================================
  if (step === 'contribute-done' && config) {
    return (
      <Shell>
        <HeaderBlock
          eyebrowText="Thank you"
          title="Your responses are in."
          subtitle={`${config.facilitatorName} will see them on the dashboard when they're ready to review.`}
        />
        <p style={{ fontSize: 14, color: C.creamMuted, marginBottom: 28, maxWidth: 600 }}>
          You can close this tab. If you change your mind, submitting again with the same name will overwrite your previous response.
        </p>
        <button
          onClick={() => navigate('home')}
          onMouseEnter={btnHoverIn}
          onMouseLeave={btnHoverOut}
          style={btn('secondary')}
        >
          Back to InciteU
        </button>
      </Shell>
    );
  }

  // Fallback
  return (
    <Shell>
      <p style={{ color: C.creamMuted }}>Something went sideways. <a href="#" onClick={(e) => { e.preventDefault(); window.location.href = window.location.pathname; }} style={{ color: C.sage }}>Reset</a>.</p>
    </Shell>
  );
}

// =====================================================================
// FACILITATE SETUP — sub-component
// =====================================================================
function FacilitateSetup({ onCancel, onCreated, Shell, HeaderBlock, ErrorLine }) {
  const [title, setTitle] = useState('');
  const [contextBlurb, setContextBlurb] = useState('');
  const [facilitatorName, setFacilitatorName] = useState('');
  const [questions, setQuestions] = useState([
    { id: makeQid(), text: '' },
    { id: makeQid(), text: '' },
    { id: makeQid(), text: '' },
  ]);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  function updateQuestion(idx, text) {
    setQuestions(qs => qs.map((q, i) => (i === idx ? { ...q, text } : q)));
  }
  function addQuestion() {
    setQuestions(qs => [...qs, { id: makeQid(), text: '' }]);
  }
  function removeQuestion(idx) {
    setQuestions(qs => qs.length > 1 ? qs.filter((_, i) => i !== idx) : qs);
  }

  async function submit() {
    setError('');
    if (!title.trim()) { setError('Please give the session a title.'); return; }
    if (!facilitatorName.trim()) { setError('Please enter your name as the facilitator.'); return; }
    const filled = questions.map(q => ({ ...q, text: q.text.trim() })).filter(q => q.text.length > 0);
    if (filled.length === 0) { setError('Please write at least one question.'); return; }

    setCreating(true);
    try {
      const r = await fetch('/api/sessions/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          contextBlurb: contextBlurb.trim(),
          questions: filled,
          facilitatorName: facilitatorName.trim(),
        }),
      });
      if (!r.ok) {
        const errBody = await r.json().catch(() => ({}));
        throw new Error(errBody.error || `Create failed (${r.status})`);
      }
      const { code, facilitatorToken } = await r.json();
      onCreated({
        code,
        facilitatorToken,
        config: {
          code,
          title: title.trim(),
          contextBlurb: contextBlurb.trim(),
          questions: filled,
          facilitatorName: facilitatorName.trim(),
        },
      });
    } catch (e) {
      setError(String(e.message || e));
    } finally {
      setCreating(false);
    }
  }

  return (
    <Shell>
      <HeaderBlock
        eyebrowText="Facilitator setup"
        title="Set up your session"
        subtitle="Write the questions you want input on, add any context, and we'll generate a code your team can use to join."
      />
      <ErrorLine text={error} />

      <div style={card}>
        <label style={labelBlock}>Session title</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Mid-quarter check-in"
          style={fieldInput}
              autoComplete="off"
              data-1p-ignore="true"
              data-lpignore="true"
              data-bwignore="true"
              data-form-type="other"
            />
      </div>

      <div style={card}>
        <label style={labelBlock}>Your name <span style={{ color: C.creamMuted, fontWeight: 'normal', fontSize: 12 }}>(shown to contributors)</span></label>
        <input
          type="text"
          value={facilitatorName}
          onChange={(e) => setFacilitatorName(e.target.value)}
          placeholder="e.g. Jen"
          style={fieldInput}
              autoComplete="off"
              data-1p-ignore="true"
              data-lpignore="true"
              data-bwignore="true"
              data-form-type="other"
            />
      </div>

      <div style={card}>
        <label style={labelBlock}>Context for your team <span style={{ color: C.creamMuted, fontWeight: 'normal', fontSize: 12 }}>(optional)</span></label>
        <textarea
          value={contextBlurb}
          onChange={(e) => setContextBlurb(e.target.value)}
          placeholder="Anything you'd like contributors to know before answering. The AI will also use this to gauge what perspectives might be notably absent."
          style={textArea}
          autoComplete="off"
          data-1p-ignore="true"
          data-lpignore="true"
          data-bwignore="true"
          data-form-type="other"
        />
      </div>

      <h3 style={{ fontFamily: F.serif, fontSize: 24, color: C.cream, fontWeight: 400, margin: '40px 0 16px' }}>Questions</h3>

      {questions.map((q, i) => (
        <div key={q.id} style={card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
            <div style={{ ...eyebrow }}>Question {i + 1}</div>
            {questions.length > 1 ? (
              <button
                onClick={() => removeQuestion(i)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: C.creamMuted,
                  fontSize: 12,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                  padding: '4px 8px',
                }}
              >Remove</button>
            ) : null}
          </div>
          <textarea
            value={q.text}
            onChange={(e) => updateQuestion(i, e.target.value)}
            placeholder="What do you want input on?"
            style={textArea}
          autoComplete="off"
          data-1p-ignore="true"
          data-lpignore="true"
          data-bwignore="true"
          data-form-type="other"
        />
        </div>
      ))}

      <button
        onClick={addQuestion}
        onMouseEnter={btnHoverIn}
        onMouseLeave={btnHoverOut}
        style={{ ...btn('secondary'), marginBottom: 32 }}
      >
        + Add another question
      </button>

      <div style={{ display: 'flex', gap: 14, marginTop: 12, flexWrap: 'wrap' }}>
        <button
          onClick={submit}
          disabled={creating}
          onMouseEnter={btnHoverIn}
          onMouseLeave={btnHoverOut}
          style={btn('primary', creating)}
        >
          {creating ? 'Creating…' : 'Create session & get code'}
        </button>
        <button
          onClick={onCancel}
          onMouseEnter={btnHoverIn}
          onMouseLeave={btnHoverOut}
          style={btn('secondary')}
        >
          Cancel
        </button>
      </div>
    </Shell>
  );
}

// =====================================================================
// CONTRIBUTE JOIN — sub-component
// =====================================================================
function ContributeJoin({ initialCode, onCancel, onJoined, Shell, HeaderBlock, ErrorLine }) {
  const [codeInput, setCodeInput] = useState(initialCode || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function joinSession() {
    setError('');
    const c = codeInput.trim().toUpperCase();
    if (!c) { setError('Enter the session code your facilitator shared.'); return; }
    setLoading(true);
    try {
      const r = await fetch(`/api/sessions/${encodeURIComponent(c)}`);
      if (r.status === 404) {
        setError(`Session ${c} not found or has expired. Double-check the code with your facilitator.`);
        return;
      }
      if (!r.ok) throw new Error(`Failed to load session (${r.status})`);
      const cfg = await r.json();
      onJoined({ code: c, config: cfg, forceStep: "contribute" });
    } catch (e) {
      setError(String(e.message || e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Shell>
      <HeaderBlock
        eyebrowText="Contributor"
        title="Join a session"
        subtitle="Enter the session code your facilitator shared with you."
      />
      <ErrorLine text={error} />

      <div style={card}>
        <label style={labelBlock}>Session code</label>
        <input
          type="text"
          value={codeInput}
          onChange={(e) => setCodeInput(e.target.value.toUpperCase())}
          onKeyDown={(e) => { if (e.key === 'Enter') joinSession(); }}
          placeholder="e.g. KJ7P2X"
          style={{ ...fieldInput, letterSpacing: '0.2em', fontFamily: F.sans, textTransform: 'uppercase' }}
              autoComplete="off"
              data-1p-ignore="true"
              data-lpignore="true"
              data-bwignore="true"
              data-form-type="other"
            />
      </div>

      <div style={{ display: 'flex', gap: 14, marginTop: 12, flexWrap: 'wrap' }}>
        <button
          onClick={joinSession}
          disabled={loading}
          onMouseEnter={btnHoverIn}
          onMouseLeave={btnHoverOut}
          style={btn('primary', loading)}
        >
          {loading ? 'Loading…' : 'Join session'}
        </button>
        <button
          onClick={onCancel}
          onMouseEnter={btnHoverIn}
          onMouseLeave={btnHoverOut}
          style={btn('secondary')}
        >
          Cancel
        </button>
      </div>
    </Shell>
  );
}

// =====================================================================
// FACILITATOR DASHBOARD — sub-component
// =====================================================================
function FacilitatorDashboard({ code, config, responses, syntheses, synthLoading, dashError, refreshing, onRefresh, onSynthesize, Shell, ErrorLine }) {
  // Group responses by qid for inline viewing
  const byQ = useMemo(() => {
    const map = Object.fromEntries(config.questions.map(q => [q.id, []]));
    for (const r of responses) {
      for (const qid of Object.keys(r.answers || {})) {
        if (!map[qid]) continue;
        map[qid].push({
          name: r.name || 'Anonymous',
          anonymous: !!r.anonymous,
          text: r.answers[qid],
          submittedAt: r.submittedAt,
        });
      }
    }
    return map;
  }, [config.questions, responses]);

  function downloadResults() {
    const safeTitle = config.title || 'Facilitate Your Way';
    const sections = config.questions.map(q => {
      const items = byQ[q.id] || [];
      const synth = syntheses[q.id];
      const responsesHtml = items.length === 0
        ? `<p class="muted"><em>No responses yet.</em></p>`
        : `<ol>${items.map(r => `<li><strong>${escapeHTML(r.name)}:</strong> ${escapeHTML(r.text)}</li>`).join('')}</ol>`;
      const synthHtml = synth ? `
        <div class="synth">
          <h4>AI synthesis</h4>
          ${renderSynthSection('Patterns', synth.patterns)}
          ${renderSynthSection('Outliers', synth.outliers)}
          ${renderSynthSection('Absences', synth.absences)}
        </div>` : '';
      return `
        <section>
          <h3>${escapeHTML(q.text)}</h3>
          ${responsesHtml}
          ${synthHtml}
        </section>`;
    }).join('');

    const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><title>${escapeHTML(safeTitle)}</title>
<style>
  body { font-family: Georgia, 'Times New Roman', serif; max-width: 760px; margin: 40px auto; padding: 0 24px; color: #1c1c1c; line-height: 1.55; }
  h1 { font-size: 2em; margin-bottom: 0.2em; }
  h2 { font-size: 1.2em; color: #555; font-weight: normal; margin-top: 0; }
  h3 { font-size: 1.3em; margin-top: 2em; border-bottom: 1px solid #ddd; padding-bottom: 0.3em; }
  h4 { font-size: 1.05em; margin: 1.2em 0 0.4em; color: #444; }
  ol li { margin-bottom: 0.6em; }
  .synth { background: #f6f4ee; border-left: 3px solid #8a9c6e; padding: 16px 20px; margin-top: 1em; }
  .synth h5 { margin: 0.8em 0 0.3em; font-size: 0.95em; color: #5a6850; text-transform: uppercase; letter-spacing: 0.1em; }
  .synth ul { margin: 0; padding-left: 1.2em; }
  .synth li { margin-bottom: 0.5em; }
  .muted { color: #888; font-size: 0.95em; }
  .meta { font-size: 0.85em; color: #888; }
</style></head><body>
<h1>${escapeHTML(safeTitle)}</h1>
<h2>Facilitated by ${escapeHTML(config.facilitatorName)} · Session ${escapeHTML(code)}</h2>
${config.contextBlurb ? `<p><em>${escapeHTML(config.contextBlurb)}</em></p>` : ''}
<p class="meta">${responses.length} response${responses.length === 1 ? '' : 's'} · Exported ${new Date().toLocaleString()}</p>
${sections}
</body></html>`;

    const fname = (safeTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'facilitate-your-way') + '.html';
    downloadHTML(html, fname);
  }

  function renderSynthSection(label, items) {
    if (!Array.isArray(items) || items.length === 0) return `<h5>${label}</h5><p class="muted"><em>None.</em></p>`;
    const lis = items.map(it => `<li><strong>${escapeHTML(it.title || '')}.</strong> ${escapeHTML(it.detail || '')}</li>`).join('');
    return `<h5>${label}</h5><ul>${lis}</ul>`;
  }

  const joinUrl = typeof window !== 'undefined'
    ? `${window.location.origin}${window.location.pathname}?code=${encodeURIComponent(code)}`
    : '';

  return (
    <Shell>
      <div style={{ ...eyebrow, marginBottom: 12 }}>Facilitator dashboard</div>
      <h1 style={{ ...heading(48), marginBottom: 12 }}>{config.title}</h1>
      <p style={{ fontFamily: F.serif, fontSize: 18, color: C.creamMuted, marginBottom: 28 }}>
        Hosted by {config.facilitatorName}
      </p>

      <ErrorLine text={dashError} />

      <div style={{ ...cardLined, marginBottom: 28 }}>
        <div style={{ ...eyebrow, marginBottom: 8, color: C.sage }}>Share with your team</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: 11, color: C.creamMuted, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4 }}>Code</div>
            <div style={{ fontFamily: F.sans, fontSize: 32, letterSpacing: '0.15em', color: C.cream, fontWeight: 500 }}>{code}</div>
          </div>
          <div style={{ flex: 1, minWidth: 220 }}>
            <div style={{ fontSize: 11, color: C.creamMuted, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4 }}>Direct link</div>
            <input
              type="text"
              readOnly
              value={joinUrl}
              onFocus={(e) = autoComplete="off" data-1p-ignore="true" data-lpignore="true" data-bwignore="true" data-form-type="other"> e.target.select()}
              style={{ ...fieldInput, fontSize: 13 }}
            />
          </div>
        </div>
        <p style={{ fontSize: 12, color: C.creamMuted, marginTop: 14, lineHeight: 1.6 }}>
          Anyone with the code can submit a response. Only this browser, while it remembers your facilitator access, can view all responses and run AI synthesis. If you clear browser data, that access cannot be recovered.
        </p>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
        <h2 style={{ fontFamily: F.serif, fontSize: 28, color: C.cream, fontWeight: 400, margin: 0 }}>
          {responses.length} response{responses.length === 1 ? '' : 's'}
        </h2>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button
            onClick={onRefresh}
            disabled={refreshing}
            onMouseEnter={btnHoverIn}
            onMouseLeave={btnHoverOut}
            style={btn('secondary', refreshing)}
          >
            {refreshing ? 'Refreshing…' : 'Refresh responses'}
          </button>
          <button
            onClick={downloadResults}
            onMouseEnter={btnHoverIn}
            onMouseLeave={btnHoverOut}
            style={btn('secondary')}
          >
            Download HTML
          </button>
        </div>
      </div>

      {responses.length === 0 ? (
        <div style={{ ...card, color: C.creamMuted, fontStyle: 'italic', fontSize: 14 }}>
          No responses yet. Share the code <strong style={{ color: C.cream, fontStyle: 'normal' }}>{code}</strong> with your team and click <em>Refresh responses</em> when they've submitted.
        </div>
      ) : null}


      {responses.length > 0 && (() => {
        const anySynthLoading = Object.values(synthLoading || {}).some(v => v);
        return (
          <div style={{ marginBottom: 24 }}>
            <button
              onClick={async () => {
                for (const q of config.questions) {
                  await onSynthesize(q.id);
                }
              }}
              disabled={anySynthLoading}
              onMouseEnter={btnHoverIn}
              onMouseLeave={btnHoverOut}
              style={btn('primary', anySynthLoading)}
            >
              {anySynthLoading ? 'Synthesizing…' : 'Synthesize All Questions with AI'}
            </button>
          </div>
        );
      })()}

      {config.questions.map((q, i) => {
        const items = byQ[q.id] || [];
        const synth = syntheses[q.id];
        const loading = !!synthLoading[q.id];
        return (
          <div key={q.id} style={card}>
            <div style={{ ...eyebrow, marginBottom: 10 }}>Question {i + 1} · {items.length} response{items.length === 1 ? '' : 's'}</div>
            <div style={{ fontFamily: F.serif, fontSize: 22, color: C.cream, marginBottom: 18, lineHeight: 1.4 }}>{q.text}</div>

            {items.length === 0 ? (
              <p style={{ color: C.creamMuted, fontSize: 14, fontStyle: 'italic', marginBottom: 16 }}>No responses to this question yet.</p>
            ) : (
              <ol style={{ paddingLeft: 22, margin: '0 0 18px', color: C.cream, fontSize: 15, lineHeight: 1.7 }}>
                {items.map((r, idx) => (
                  <li key={idx} style={{ marginBottom: 10 }}>
                    <span style={{ color: C.sage, fontSize: 13, letterSpacing: '0.04em' }}>
                      {r.name}{r.anonymous ? ' (anon)' : ''}:
                    </span>{' '}
                    <span style={{ color: C.cream }}>{r.text}</span>
                  </li>
                ))}
              </ol>
            )}

            {synth ? (
              <div style={{ marginTop: 14 }}>
                <span style={{ fontSize: 12, color: C.creamMuted }}>
                  Last synthesized {new Date(synth.synthesizedAt).toLocaleString()} · {synth.responseCount} response{synth.responseCount === 1 ? '' : 's'}
                </span>
              </div>
            ) : null}

            {synth ? (
              <div style={{
                background: 'rgba(197, 212, 155, 0.06)',
                borderLeft: `3px solid ${C.sage}`,
                padding: '20px 24px',
                marginTop: 20,
                borderRadius: 4,
              }}>
                <SynthSection label="Patterns" items={synth.patterns} />
                <SynthSection label="Outliers" items={synth.outliers} />
                <SynthSection label="Absences" items={synth.absences} />
              </div>
            ) : null}
          </div>
        );
      })}
    </Shell>
  );
}

function SynthSection({ label, items }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ ...eyebrow, color: C.sage, marginBottom: 8 }}>{label}</div>
      {(!Array.isArray(items) || items.length === 0) ? (
        <p style={{ color: C.creamMuted, fontStyle: 'italic', fontSize: 14 }}>None surfaced.</p>
      ) : (
        <ul style={{ paddingLeft: 20, margin: 0, color: C.cream, fontSize: 15, lineHeight: 1.65 }}>
          {items.map((it, i) => (
            <li key={i} style={{ marginBottom: 8 }}>
              <strong style={{ color: C.cream }}>{it.title || ''}.</strong>{' '}
              <span style={{ color: C.cream }}>{it.detail || ''}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
