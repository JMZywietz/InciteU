import React, { useState, useEffect } from 'react';
import { C, F } from '../theme.js';
import { btn, btnHoverIn, btnHoverOut } from '../styles.js';
import { useAppNavigate } from '../lib/useAppNavigate.js';

// ============================================================
// Facilitate Your Way — multi-contributor session tool
// Uses FiveLives style pattern for inputs (tested, 1Password-safe)
// ============================================================

const FYW_STYLE_ID = 'fyw-styles';

function injectStyles() {
  if (typeof document === 'undefined' || document.getElementById(FYW_STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = FYW_STYLE_ID;
  style.textContent = `
    @keyframes fywFade { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
    .fyw-input::placeholder, .fyw-textarea::placeholder {
      color: rgba(240, 235, 219, 0.28);
      font-style: italic;
      font-weight: 300;
    }
    .fyw-input:focus, .fyw-textarea:focus {
      border-color: rgba(115, 163, 150, 0.5) !important;
      background: rgba(240, 235, 219, 0.06) !important;
    }
    .fyw-wrap { animation: fywFade 0.4s ease; }
  `;
  document.head.appendChild(style);
}

const s = {
  fieldInput:   { width: '100%', background: 'rgba(240,235,219,0.035)', border: '1px solid rgba(240,235,219,0.14)', borderRadius: 3, padding: '14px 18px', fontFamily: F.sans, fontSize: 16, color: C.cream, fontWeight: 300, outline: 'none', transition: 'border-color 0.2s, background 0.2s', boxSizing: 'border-box' },
  fieldTextarea:{ width: '100%', background: 'rgba(240,235,219,0.035)', border: '1px solid rgba(240,235,219,0.14)', borderRadius: 3, padding: '14px 18px', fontFamily: F.sans, fontSize: 16, color: C.cream, fontWeight: 300, outline: 'none', boxSizing: 'border-box', minHeight: 120, resize: 'vertical', lineHeight: 1.6, transition: 'border-color 0.2s, background 0.2s' },
  fieldLabel:   { fontFamily: F.sans, fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(240,235,219,0.62)', fontWeight: 500, marginBottom: 10, display: 'block' },
  card:         { background: C.bgCard, border: '1px solid rgba(240,235,219,0.1)', borderRadius: 6, padding: '28px 32px', marginBottom: 16 },
  eyebrow:      { fontFamily: F.sans, fontSize: 11, letterSpacing: '0.26em', textTransform: 'uppercase', color: C.sage, fontWeight: 500, marginBottom: 8 },
  heading:      (size) => ({ fontFamily: F.serif, fontSize: size, color: C.cream, fontWeight: 400, margin: '0 0 16px 0', lineHeight: 1.15 }),
  page:         { padding: '60px 6vw 80px', maxWidth: 820, margin: '0 auto' },
  error:        { fontFamily: F.sans, fontSize: 14, color: '#e07070', margin: '12px 0' },
};

// ── Helpers ──────────────────────────────────────────────────
function readCodeFromUrl() {
  if (typeof window === 'undefined') return null;
  const c = new URL(window.location.href).searchParams.get('code');
  return c ? c.trim().toUpperCase() : null;
}
function writeCodeToUrl(code) {
  if (typeof window === 'undefined') return;
  const u = new URL(window.location.href);
  u.searchParams.set('code', code);
  window.history.replaceState({}, '', u.toString());
}
function loadToken(code) {
  try { return localStorage.getItem(`fyw:${code}:token`) || null; } catch { return null; }
}
function saveToken(code, token) {
  try { localStorage.setItem(`fyw:${code}:token`, token); } catch {}
}

// ── Main component ────────────────────────────────────────────
export default function FacilitateYourWay() {
  const navigate = useAppNavigate();
  useEffect(() => { injectStyles(); window.scrollTo({ top: 0 }); }, []);

  // ── State ──
  const [step, setStep]               = useState('boot');
  const [bootError, setBootError]     = useState('');
  const [code, setCode]               = useState('');
  const [config, setConfig]           = useState(null);
  const [facilitatorToken, setFacilitatorToken] = useState('');
  const [contributorName, setContributorName]   = useState('');
  const [answers, setAnswers]         = useState({});
  const [submitting, setSubmitting]   = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [responses, setResponses]     = useState([]);
  const [syntheses, setSyntheses]     = useState({});
  const [synthLoading, setSynthLoading] = useState({});
  const [dashError, setDashError]     = useState('');
  const [refreshing, setRefreshing]   = useState(false);
  const [title, setTitle]             = useState('');
  const [contextBlurb, setContextBlurb] = useState('');
  const [facilitatorName, setFacilitatorName] = useState('');
  const [questions, setQuestions]     = useState([{ id: 'q1', text: '' }, { id: 'q2', text: '' }, { id: 'q3', text: '' }]);
  const [creating, setCreating]       = useState(false);
  const [createError, setCreateError] = useState('');
  const [codeInput, setCodeInput]     = useState('');
  const [loading, setLoading]         = useState(false);
  const [joinError, setJoinError]     = useState('');

  // ── Boot: check URL for code ──
  useEffect(() => {
    const urlCode = readCodeFromUrl();
    if (!urlCode) { setStep('mode'); return; }

    (async () => {
      try {
        setLoading(true);
        const r = await fetch(`/api/sessions/${encodeURIComponent(urlCode)}`);
        if (r.status === 404) { setBootError(`Session ${urlCode} not found or expired.`); setStep('mode'); return; }
        if (!r.ok) throw new Error(`Failed (${r.status})`);
        const cfg = await r.json();
        setCode(urlCode);
        setConfig(cfg);
        setAnswers(Object.fromEntries(cfg.questions.map(q => [q.id, ''])));
        // Check if user has a facilitator token stored - if so, return them to dashboard
        const storedToken = loadToken(urlCode);
        if (storedToken) {
          setFacilitatorToken(storedToken);
          setStep('facilitate-dashboard');
          try {
            const respR = await fetch(`/api/sessions/${encodeURIComponent(urlCode)}/responses`, { headers: { Authorization: `Bearer ${storedToken}` } });
            if (respR.ok) {
              const respData = await respR.json();
              setResponses(respData.responses || []);
              const synthMap = {};
              if (respData.syntheses) respData.syntheses.forEach(syn => { synthMap[syn.questionId] = syn; });
              setSyntheses(synthMap);
            }
          } catch (e) { /* dashboard will load on Refresh click */ }
        } else {
          setStep('contribute-form');
        }
      } catch (e) {
        setBootError('Could not load session. Please enter the code manually.');
        setStep('mode');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // ── Helpers ──
  const authHeaders = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${facilitatorToken}` };

  const loadDashboard = async (sessionCode, token) => {
    const r = await fetch(`/api/sessions/${encodeURIComponent(sessionCode)}/responses`, { headers: { Authorization: `Bearer ${token}` } });
    if (!r.ok) throw new Error(`Failed to load responses (${r.status})`);
    const data = await r.json();
    setResponses(data.responses || []);
    const synthMap = {};
    if (data.syntheses) data.syntheses.forEach(s => { synthMap[s.questionId] = s; });
    setSyntheses(synthMap);
  };

  const onSynthesize = async (qid) => {
    setSynthLoading(prev => ({ ...prev, [qid]: true }));
    setDashError('');
    try {
      const r = await fetch(`/api/sessions/${encodeURIComponent(code)}/synthesize`, {
        method: 'POST', headers: authHeaders, body: JSON.stringify({ questionId: qid }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.detail ? `${data.error}: ${data.detail}` : (data.error || `Failed (${r.status})`));
      setSyntheses(prev => ({ ...prev, [qid]: data }));
    } catch (e) {
      setDashError(e.message);
    } finally {
      setSynthLoading(prev => ({ ...prev, [qid]: false }));
    }
  };

  // ── STEP: boot loading ──
  if (step === 'boot' || loading) {
    return (
      <div style={s.page} className="fyw-wrap">
        <p style={{ color: 'rgba(240,235,219,0.5)', fontFamily: F.sans, fontSize: 14 }}>Loading…</p>
      </div>
    );
  }

  // ── STEP: mode chooser ──
  if (step === 'mode') {
    return (
      <div style={s.page} className="fyw-wrap">
        <div style={s.eyebrow}>Facilitate Your Way</div>
        <h1 style={s.heading(48)}>Gather what your group thinks.</h1>
        {bootError && <p style={s.error}>{bootError}</p>}
        <p style={{ fontFamily: F.sans, fontSize: 16, color: 'rgba(240,235,219,0.7)', lineHeight: 1.75, marginBottom: 48, maxWidth: 600 }}>
          Pose up to three questions to a group, collect their responses, and use AI to synthesise the patterns.
        </p>

        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 48 }}>
          <button onClick={() => setStep('facilitate-setup')} style={btn('primary')} onMouseEnter={btnHoverIn} onMouseLeave={btnHoverOut}>
            Facilitate a session
          </button>
          <button onClick={() => setStep('contribute-join')} style={btn('secondary')} onMouseEnter={btnHoverIn} onMouseLeave={btnHoverOut}>
            Join with a code
          </button>
        </div>
      </div>
    );
  }

  // ── STEP: contribute-join ──
  if (step === 'contribute-join') {
    const join = async () => {
      const c = codeInput.trim().toUpperCase();
      if (!c) return;
      setLoading(true); setJoinError('');
      try {
        const r = await fetch(`/api/sessions/${encodeURIComponent(c)}`);
        if (r.status === 404) { setJoinError(`Session ${c} not found.`); return; }
        if (!r.ok) throw new Error(`Failed (${r.status})`);
        const cfg = await r.json();
        setCode(c); setConfig(cfg);
        setAnswers(Object.fromEntries(cfg.questions.map(q => [q.id, ''])));
        writeCodeToUrl(c);
        setStep('contribute-form');
      } catch (e) {
        setJoinError(e.message || 'Could not join session.');
      } finally {
        setLoading(false);
      }
    };
    return (
      <div style={s.page} className="fyw-wrap">
        <div style={s.eyebrow}>Join a session</div>
        <h1 style={s.heading(36)}>Enter your session code.</h1>
        <div style={{ ...s.card, maxWidth: 440 }}>
          <label style={s.fieldLabel}>Session code</label>
          <input className="fyw-input" style={s.fieldInput} value={codeInput} onChange={e => setCodeInput(e.target.value.toUpperCase())} placeholder="e.g. ABC123" />
          {joinError && <p style={s.error}>{joinError}</p>}
          <div style={{ marginTop: 24, display: 'flex', gap: 12 }}>
            <button onClick={join} disabled={loading} style={btn('primary', loading)} onMouseEnter={btnHoverIn} onMouseLeave={btnHoverOut}>
              {loading ? 'Joining…' : 'Join →'}
            </button>
            <button onClick={() => setStep('mode')} style={btn('secondary')} onMouseEnter={btnHoverIn} onMouseLeave={btnHoverOut}>
              Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── STEP: facilitate-setup ──
  if (step === 'facilitate-setup') {
    const updateQ = (i, val) => setQuestions(prev => prev.map((q, idx) => idx === i ? { ...q, text: val } : q));
    const create = async () => {
      if (!title.trim()) { setCreateError('Session title is required.'); return; }
      const activeQs = questions.filter(q => q.text.trim());
      if (!activeQs.length) { setCreateError('Add at least one question.'); return; }
      setCreating(true); setCreateError('');
      try {
        const r = await fetch('/api/sessions/create', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: title.trim(), facilitatorName: facilitatorName.trim() || 'Facilitator', contextBlurb: contextBlurb.trim(), questions: activeQs }),
        });
        const data = await r.json();
        if (!r.ok) throw new Error(data.error || `Failed (${r.status})`);
        // Build the full config from what we sent - API only returns {code, facilitatorToken}
        const fullConfig = {
          code: data.code,
          title: title.trim(),
          contextBlurb: contextBlurb.trim(),
          questions: activeQs,
          facilitatorName: facilitatorName.trim() || 'Facilitator',
          createdAt: new Date().toISOString(),
        };
        saveToken(data.code, data.facilitatorToken);
        setCode(data.code);
        setConfig(fullConfig);
        setFacilitatorToken(data.facilitatorToken);
        writeCodeToUrl(data.code);
        setStep('facilitate-dashboard');
        window.scrollTo({ top: 0 });
      } catch (e) {
        setCreateError(e.message);
      } finally {
        setCreating(false);
      }
    };
    return (
      <div style={s.page} className="fyw-wrap">
        <div style={s.eyebrow}>New session</div>
        <h1 style={s.heading(40)}>Set up your session.</h1>

        <div style={s.card}>
          <label style={s.fieldLabel}>Session title</label>
          <input className="fyw-input" style={s.fieldInput} value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Mid-quarter team check-in" />
        </div>

        <div style={s.card}>
          <label style={s.fieldLabel}>Your name (facilitator)</label>
          <input className="fyw-input" style={s.fieldInput} value={facilitatorName} onChange={e => setFacilitatorName(e.target.value)} placeholder="e.g. Jen" />
        </div>

        <div style={s.card}>
          <label style={s.fieldLabel}>Context for contributors (optional)</label>
          <textarea className="fyw-textarea" style={s.fieldTextarea} value={contextBlurb} onChange={e => setContextBlurb(e.target.value)} placeholder="Anything contributors should know before answering. The AI will also use this when synthesising." />
        </div>

        {questions.map((q, i) => (
          <div key={q.id} style={s.card}>
            <label style={s.fieldLabel}>Question {i + 1}</label>
            <textarea className="fyw-textarea" style={s.fieldTextarea} value={q.text} onChange={e => updateQ(i, e.target.value)} placeholder={`What do you want input on?`} />
          </div>
        ))}

        {createError && <p style={s.error}>{createError}</p>}
        <div style={{ display: 'flex', gap: 12, marginTop: 8, flexWrap: 'wrap' }}>
          <button onClick={create} disabled={creating} style={btn('primary', creating)} onMouseEnter={btnHoverIn} onMouseLeave={btnHoverOut}>
            {creating ? 'Creating…' : 'Create session →'}
          </button>
          <button onClick={() => setStep('mode')} style={btn('secondary')} onMouseEnter={btnHoverIn} onMouseLeave={btnHoverOut}>
            Back
          </button>
        </div>
      </div>
    );
  }

  // ── STEP: contribute-form ──
  if (step === 'contribute-form' && config && code) {
    const submit = async () => {
      const filledQs = config.questions.filter(q => (answers[q.id] || '').trim());
      if (!filledQs.length) { setSubmitError('Please answer at least one question.'); return; }
      setSubmitting(true); setSubmitError('');
      try {
        const r = await fetch(`/api/sessions/${encodeURIComponent(code)}/responses`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: contributorName.trim() || 'Anonymous', answers: Object.fromEntries(filledQs.map(q => [q.id, answers[q.id]])) }),
        });
        const data = await r.json();
        if (!r.ok) throw new Error(data.error || `Failed (${r.status})`);
        setStep('contribute-done');
        window.scrollTo({ top: 0 });
      } catch (e) {
        setSubmitError(e.message);
      } finally {
        setSubmitting(false);
      }
    };
    return (
      <div style={s.page} className="fyw-wrap">
        <div style={s.eyebrow}>Session {code}</div>
        <h1 style={s.heading(40)}>{config.title}</h1>
        {config.contextBlurb && <p style={{ fontFamily: F.sans, fontSize: 15, color: 'rgba(240,235,219,0.7)', lineHeight: 1.75, marginBottom: 28 }}>{config.contextBlurb}</p>}
        <p style={{ fontFamily: F.sans, fontSize: 13, color: 'rgba(240,235,219,0.5)', marginBottom: 32 }}>Hosted by {config.facilitatorName}. Your responses are private to the facilitator.</p>
        {bootError && <p style={s.error}>{bootError}</p>}
        {submitError && <p style={s.error}>{submitError}</p>}

        <div style={s.card}>
          <label style={s.fieldLabel}>How would you like to appear?</label>
          <input className="fyw-input" style={s.fieldInput} value={contributorName} onChange={e => setContributorName(e.target.value)} placeholder="Leave empty to stay anonymous" />
        </div>

        {config.questions.map((q, i) => (
          <div key={q.id} style={s.card}>
            <div style={s.eyebrow}>Question {i + 1}</div>
            <p style={{ fontFamily: F.serif, fontSize: 20, color: C.cream, marginBottom: 20, lineHeight: 1.5 }}>{q.text}</p>
            <textarea className="fyw-textarea" style={s.fieldTextarea} value={answers[q.id] || ''} onChange={e => setAnswers(a => ({ ...a, [q.id]: e.target.value }))} placeholder="Your response…" />
          </div>
        ))}

        <button onClick={submit} disabled={submitting} style={{ ...btn('primary', submitting), marginTop: 8 }} onMouseEnter={btnHoverIn} onMouseLeave={btnHoverOut}>
          {submitting ? 'Submitting…' : 'Submit responses →'}
        </button>
      </div>
    );
  }

  // ── STEP: contribute-done ──
  if (step === 'contribute-done') {
    return (
      <div style={s.page} className="fyw-wrap">
        <div style={s.eyebrow}>Done</div>
        <h1 style={s.heading(40)}>Your responses are in.</h1>
        <p style={{ fontFamily: F.sans, fontSize: 16, color: 'rgba(240,235,219,0.7)', lineHeight: 1.75, maxWidth: 520 }}>
          Thank you. The facilitator will review responses and share insights with the group.
        </p>
      </div>
    );
  }

  // ── STEP: facilitate-dashboard ──
  if (step === 'facilitate-dashboard' && config && code) {
    const joinUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}${typeof window !== 'undefined' ? window.location.pathname : ''}?code=${encodeURIComponent(code)}`;
    const anySynthLoading = Object.values(synthLoading).some(v => v);
    const byQ = {};
    responses.forEach(r => { r.answers && Object.entries(r.answers).forEach(([qid, text]) => { if (!byQ[qid]) byQ[qid] = []; if (text) byQ[qid].push({ name: r.name, text }); }); });

    const refresh = async () => {
      setRefreshing(true); setDashError('');
      try { await loadDashboard(code, facilitatorToken); }
      catch (e) { setDashError(e.message); }
      finally { setRefreshing(false); }
    };

    return (
      <div style={s.page} className="fyw-wrap">
        <div style={s.eyebrow}>Facilitator dashboard</div>
        <h1 style={s.heading(40)}>{config.title}</h1>

        <div style={s.card}>
          <div style={s.fieldLabel}>Session code</div>
          <div style={{ fontFamily: F.sans, fontSize: 32, fontWeight: 700, color: C.cream, letterSpacing: '0.12em', marginBottom: 16 }}>{code}</div>
          <div style={s.fieldLabel}>Share link</div>
          <input className="fyw-input" style={{ ...s.fieldInput, fontSize: 13 }} value={joinUrl} readOnly onFocus={e => e.target.select()} />
        </div>

        <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
          <button onClick={refresh} disabled={refreshing} style={btn('secondary', refreshing)} onMouseEnter={btnHoverIn} onMouseLeave={btnHoverOut}>
            {refreshing ? 'Refreshing…' : 'Refresh responses'}
          </button>
          {responses.length > 0 && (
            <button
              onClick={async () => { for (const q of config.questions) { await onSynthesize(q.id); } }}
              disabled={anySynthLoading}
              style={btn('primary', anySynthLoading)}
              onMouseEnter={btnHoverIn} onMouseLeave={btnHoverOut}
            >
              {anySynthLoading ? 'Synthesizing…' : 'Synthesize All Questions with AI'}
            </button>
          )}
        </div>

        {dashError && <p style={s.error}>{dashError}</p>}
        {responses.length === 0 && (
          <p style={{ fontFamily: F.sans, fontSize: 14, color: 'rgba(240,235,219,0.5)', fontStyle: 'italic' }}>
            No responses yet. Share the code <strong style={{ color: C.cream }}>{code}</strong> and click Refresh when contributors have submitted.
          </p>
        )}

        <p style={{ fontFamily: F.sans, fontSize: 14, color: 'rgba(240,235,219,0.5)', marginBottom: 24 }}>
          {responses.length} response{responses.length === 1 ? '' : 's'}
        </p>

        {config.questions.map((q, i) => {
          const items = byQ[q.id] || [];
          const synth = syntheses[q.id];
          const isLoading = !!synthLoading[q.id];
          return (
            <div key={q.id} style={{ ...s.card, marginBottom: 24 }}>
              <div style={s.eyebrow}>Question {i + 1}</div>
              <p style={{ fontFamily: F.serif, fontSize: 20, color: C.cream, marginBottom: 20, lineHeight: 1.5 }}>{q.text}</p>

              {synth && (
                <div style={{ background: 'rgba(115,163,150,0.08)', border: '1px solid rgba(115,163,150,0.2)', borderRadius: 4, padding: '20px 24px', marginBottom: 20 }}>
                  <div style={{ ...s.fieldLabel, color: C.sage, marginBottom: 12 }}>AI Synthesis</div>
                  {synth.patterns?.length > 0 && (
                    <div style={{ marginBottom: 14 }}>
                      <div style={{ ...s.fieldLabel, marginBottom: 8 }}>Patterns</div>
                      {synth.patterns.map((p, j) => <p key={j} style={{ fontFamily: F.sans, fontSize: 14, color: C.cream, lineHeight: 1.6, margin: '0 0 8px' }}>{p}</p>)}
                    </div>
                  )}
                  {synth.outliers?.length > 0 && (
                    <div style={{ marginBottom: 14 }}>
                      <div style={{ ...s.fieldLabel, marginBottom: 8 }}>Outliers</div>
                      {synth.outliers.map((p, j) => <p key={j} style={{ fontFamily: F.sans, fontSize: 14, color: C.cream, lineHeight: 1.6, margin: '0 0 8px' }}>{p}</p>)}
                    </div>
                  )}
                  {synth.absent?.length > 0 && (
                    <div>
                      <div style={{ ...s.fieldLabel, marginBottom: 8 }}>Notably absent</div>
                      {synth.absent.map((p, j) => <p key={j} style={{ fontFamily: F.sans, fontSize: 14, color: C.cream, lineHeight: 1.6, margin: '0 0 8px' }}>{p}</p>)}
                    </div>
                  )}
                  {synth.synthesizedAt && <p style={{ fontFamily: F.sans, fontSize: 11, color: 'rgba(240,235,219,0.4)', marginTop: 12, marginBottom: 0 }}>Last synthesized {new Date(synth.synthesizedAt).toLocaleString()} · {synth.responseCount} response{synth.responseCount === 1 ? '' : 's'}</p>}
                </div>
              )}

              {items.length > 0 && (
                <div>
                  <div style={{ ...s.fieldLabel, marginBottom: 12 }}>Responses ({items.length})</div>
                  {items.map((item, j) => (
                    <div key={j} style={{ borderTop: '1px solid rgba(240,235,219,0.08)', paddingTop: 14, marginTop: 14 }}>
                      <div style={{ fontFamily: F.sans, fontSize: 11, color: 'rgba(240,235,219,0.45)', marginBottom: 6 }}>{item.name || 'Anonymous'}</div>
                      <p style={{ fontFamily: F.sans, fontSize: 14, color: C.cream, lineHeight: 1.65, margin: 0 }}>{item.text}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  return null;
}
