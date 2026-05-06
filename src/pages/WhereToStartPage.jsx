import React, { useState, useEffect } from 'react';
import { C, F } from '../theme.js';
import { btn, btnHoverIn, btnHoverOut, eyebrow, heading } from '../styles.js';
import { useAppNavigate } from '../lib/useAppNavigate.js';

// ============================================================================
// DATA
// ============================================================================
const WTS_QUESTIONS = [
  { id: 'why', title: <>First &mdash; <em>what's drawing you here?</em></>, helper: 'Pick the one that fits best. There are no wrong answers.',
    options: [
      { value: 'history', text: 'I want to understand how I became who I am.' },
      { value: 'strengths', text: 'I want to understand my strengths and reactive patterns.' },
      { value: 'voices', text: "I'm wrestling with a decision — there are competing voices in my head." },
      { value: 'exploring', text: "I'm just exploring. Show me something gentle." },
    ] },
  { id: 'time', title: <>Second &mdash; <em>how much time do you have?</em></>, helper: 'Just for now. You can always come back.',
    options: [
      { value: 'short', text: '10–15 minutes.' },
      { value: 'medium', text: '30 minutes or so.' },
      { value: 'long', text: 'An hour or more.' },
    ] },
  { id: 'who', title: <>Third &mdash; <em>solo, or with someone?</em></>, helper: 'Some exercises are deeper when shared.',
    options: [
      { value: 'solo', text: 'Just me.' },
      { value: 'partner', text: 'With a friend or partner I trust.' },
      { value: 'coaching', text: 'In a coaching or professional setting.' },
    ] },
];

const WTS_TOOLS = {
  'three-moments': { title: 'Three Moments', available: true, page: 'three-moments', time: '10–15 min', mode: 'Solo or with a partner',
    why: { history: "You'll surface three moments that shaped you, then look at how much you've already changed. It makes growth feel real.", exploring: "It's the gentlest entry point — reflective, low-stakes, and surprisingly revealing. Most people leave it lighter.", voices: 'While the Inner Parts tool is being built, this exercise is a meaningful starting point — the patterns you find here often surface the same voices.', strengths: "While we build out richer strength tools, this exercise reveals your strengths through what you've already lived through." } },
  'lcp': { title: 'Working with your circle', available: true, page: 'lcp', time: '30–45 min including the assessment', mode: 'Solo',
    why: { strengths: "The Leadership Circle Profile is the assessment I use most with senior leaders. The free self-assessment maps your creative strengths and reactive patterns onto one image — and this tool helps you make sense of what you find.", voices: "The Leadership Circle maps the deeper patterns underneath the voices — controlling, complying, protecting. Once you can see them, you can choose differently." } },
  'inner-parts': { title: 'Inner Parts', available: false, page: null, time: '20–30 min', mode: 'Solo',
    why: { voices: "You'll meet the voices in your head, give each a name, and listen for what each one is trying to protect. The decision usually clarifies on its own." } },
};

// ============================================================================
// COMPONENT
// ============================================================================
export default function WhereToStartPage() {
  const navigate = useAppNavigate();
  const [step, setStep] = useState(1);
  const [answers, setAnswers] = useState({ why: null, time: null, who: null });

  useEffect(() => { window.scrollTo({ top: 0, behavior: 'smooth' }); }, [step]);

  function selectOption(qId, value) { setAnswers((a) => ({ ...a, [qId]: value })); }

  function recommend() {
    const { why, time } = answers;
    if (time === 'short' && why === 'strengths') return { primary: 'three-moments', secondary: 'lcp' };
    if (why === 'history' || why === 'exploring') return { primary: 'three-moments' };
    if (why === 'voices') return { primary: 'inner-parts', secondary: 'lcp' };
    if (why === 'strengths') return { primary: 'lcp' };
    return { primary: 'three-moments' };
  }

  const TIME_LABELS = { short: '10–15 minutes', medium: '30 minutes or so', long: 'an hour or more' };
  const WHO_LABELS = { solo: 'going solo', partner: 'with a trusted partner', coaching: 'in a coaching setting' };

  const currentQ = step >= 2 && step <= 4 ? WTS_QUESTIONS[step - 2] : null;
  const canAdvance = step === 1 || (currentQ && answers[currentQ.id]);

  return (
    <main style={{ animation: 'fadeIn 0.4s ease', minHeight: '80vh', padding: '60px 6vw 80px', maxWidth: 760, margin: '0 auto' }}>
      <a onClick={(e) => { e.preventDefault(); navigate('home'); }} href="#"
         style={{ display: 'inline-block', color: C.creamMuted, textDecoration: 'none', fontSize: 12, letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 40, cursor: 'pointer' }}>
        ← Back to tools
      </a>
      <div style={{ display: 'flex', gap: 6, marginBottom: 32 }}>
        {[1,2,3,4].map((n) => (
          <div key={n} style={{ height: 3, width: 24, background: n < step ? C.sageMuted : n === step ? C.sage : C.line, borderRadius: 2, transition: 'background 0.3s' }} />
        ))}
      </div>

      {step === 1 && (
        <div style={{ animation: 'fadeIn 0.4s ease' }}>
          <h1 style={heading(60)}>Where to <em style={{ color: C.sage, fontStyle: 'italic' }}>start</em>.</h1>
          <p style={{ fontFamily: F.serif, fontSize: 22, lineHeight: 1.55, color: C.cream, marginTop: 24, marginBottom: 36, maxWidth: 600 }}>
            Knowing yourself is the foundation for everything else. Three quick questions, and I'll suggest somewhere to begin.
          </p>
          <p style={{ fontSize: 14, color: C.creamMuted, marginBottom: 32, letterSpacing: '0.04em' }}>Takes about 30 seconds.</p>
          <button onClick={() => setStep(2)} style={btn('primary')} onMouseEnter={btnHoverIn} onMouseLeave={btnHoverOut}>Begin</button>
        </div>
      )}

      {currentQ && (
        <div style={{ animation: 'fadeIn 0.4s ease' }}>
          <h2 style={{ ...heading(40), fontSize: 'clamp(28px, 4vw, 40px)', marginBottom: 16 }}>{currentQ.title}</h2>
          <p style={{ fontSize: 14, color: C.creamMuted, marginBottom: 32, letterSpacing: '0.04em' }}>{currentQ.helper}</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, margin: '32px 0' }}>
            {currentQ.options.map((opt) => {
              const selected = answers[currentQ.id] === opt.value;
              return (
                <button key={opt.value} onClick={() => selectOption(currentQ.id, opt.value)}
                        style={{ background: selected ? C.bgCardHover : C.bgCard, border: `1px solid ${selected ? C.sage : C.line}`, borderRadius: 4, padding: '22px 26px', cursor: 'pointer', transition: 'all 0.3s', display: 'flex', alignItems: 'center', gap: 16, textAlign: 'left', fontFamily: 'inherit', color: C.cream, fontSize: 17, lineHeight: 1.5, width: '100%' }}>
                  <span style={{ width: 22, height: 22, border: `1px solid ${selected ? C.sage : C.sageMuted}`, borderRadius: '50%', flexShrink: 0, background: selected ? C.sage : 'transparent', position: 'relative' }}>
                    {selected && <span style={{ position: 'absolute', left: 6, top: 6, width: 8, height: 8, background: C.bgDeep, borderRadius: '50%' }} />}
                  </span>
                  <span>{opt.text}</span>
                </button>
              );
            })}
          </div>
          <div style={{ display: 'flex', gap: 16, marginTop: 40, flexWrap: 'wrap' }}>
            <button onClick={() => setStep(step - 1)} style={btn('secondary')}>Back</button>
            <button onClick={() => setStep(step + 1)} disabled={!canAdvance} style={btn('primary', !canAdvance)}>
              {step === 4 ? 'See suggestion' : 'Next'}
            </button>
          </div>
        </div>
      )}

      {step === 5 && (() => {
        const { primary, secondary } = recommend();
        const tool = WTS_TOOLS[primary];
        const whyText = tool.why[answers.why] || Object.values(tool.why)[0];
        const sec = secondary ? WTS_TOOLS[secondary] : null;
        const ctxLine = answers.time && answers.who
          ? `For ${TIME_LABELS[answers.time] || 'your window'}, ${WHO_LABELS[answers.who] || 'on your own'}.`
          : null;
        return (
          <div style={{ animation: 'fadeIn 0.4s ease' }}>
            <h2 style={{ ...heading(40), fontSize: 'clamp(28px, 4vw, 40px)', marginBottom: 16 }}>Here's where I'd start.</h2>
            {ctxLine && (
              <p style={{ fontFamily: F.serif, fontStyle: 'italic', fontSize: 17, color: C.sage, marginBottom: 24, marginTop: 0 }}>
                {ctxLine}
              </p>
            )}
            <div style={{ background: C.bgCard, borderLeft: `3px solid ${C.sage}`, borderRadius: 4, padding: 36, margin: '24px 0 36px' }}>
              <div style={{ ...eyebrow, marginBottom: 16 }}>
                {tool.available ? 'Recommended · Available now' : 'Recommended · Coming soon'}
              </div>
              <div style={{ ...heading(36), marginBottom: 18, fontSize: 36, lineHeight: 1.1 }}>{tool.title}</div>
              <div style={{ fontFamily: F.serif, fontStyle: 'italic', fontSize: 19, lineHeight: 1.55, color: C.cream, marginBottom: 24 }}>{whyText}</div>
              <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase', color: C.creamMuted, paddingTop: 16, borderTop: `1px solid ${C.line}` }}>
                <span>{tool.time}</span><span>{tool.mode}</span>
              </div>
            </div>
            {sec && !tool.available && (
              <div style={{ background: 'rgba(42, 71, 68, 0.4)', border: `1px dashed ${C.line}`, borderRadius: 4, padding: '22px 26px', margin: '16px 0 24px' }}>
                <div style={{ ...eyebrow, color: C.creamMuted, marginBottom: 8, fontSize: 11, letterSpacing: '0.25em' }}>In the meantime</div>
                <p style={{ fontSize: 15, color: C.cream, lineHeight: 1.6 }}>This tool is being built. While it's coming, try <em style={{ color: C.sage, fontStyle: 'italic' }}>{sec.title}</em> — it explores nearby territory in a different way.</p>
                <div style={{ marginTop: 18 }}>
                  <button onClick={() => navigate(sec.page)} style={btn('primary')} onMouseEnter={btnHoverIn} onMouseLeave={btnHoverOut}>Open {sec.title}</button>
                </div>
              </div>
            )}
            {sec && tool.available && sec.available && (
              <div style={{ background: 'rgba(42, 71, 68, 0.4)', border: `1px dashed ${C.line}`, borderRadius: 4, padding: '22px 26px', margin: '16px 0 24px' }}>
                <div style={{ ...eyebrow, color: C.creamMuted, marginBottom: 8, fontSize: 11, letterSpacing: '0.25em' }}>When you have more time</div>
                <p style={{ fontSize: 15, color: C.cream, lineHeight: 1.6 }}>Once you have a longer window, <em style={{ color: C.sage, fontStyle: 'italic' }}>{sec.title}</em> goes deeper into the same territory.</p>
                <div style={{ marginTop: 18 }}>
                  <button onClick={() => navigate(sec.page)} style={btn('secondary')}>Open {sec.title}</button>
                </div>
              </div>
            )}
            <div style={{ display: 'flex', gap: 16, marginTop: 40, flexWrap: 'wrap' }}>
              <button onClick={() => { setStep(1); setAnswers({ why: null, time: null, who: null }); }} style={btn('secondary')}>Start over</button>
              {tool.available && tool.page && (
                <button onClick={() => navigate(tool.page)} style={btn('primary')} onMouseEnter={btnHoverIn} onMouseLeave={btnHoverOut}>Open the tool</button>
              )}
            </div>
          </div>
        );
      })()}
    </main>
  );
}
