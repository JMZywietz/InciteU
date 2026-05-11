import React, { useState, useEffect } from 'react';
import { C, F } from '../theme.js';
import { btn, btnHoverIn, btnHoverOut, eyebrow, heading } from '../styles.js';
import { useAppNavigate } from '../lib/useAppNavigate.js';

// =================================================================
// DATA
// =================================================================
const LAYER_OPTIONS = [
  { value: 'self', text: "Something I'm working on in myself." },
  { value: 'team', text: "A team I'm leading or a decision I need to make." },
  { value: 'org',  text: "An organization or vision I'm shaping." },
  { value: 'exploring', text: "I'm just exploring. Show me something gentle." },
];

const INTENT_OPTIONS = {
  self: [
    { value: 'history', text: "I want to understand how I became who I am." },
    { value: 'patterns', text: "I want to understand my patterns and capacities as a leader." },
    { value: 'purpose', text: "I want to think about my purpose or direction." },
    { value: 'action', text: "I want to design something I can try this week." },
  ],
  team: [
    { value: 'frame', text: "I want to frame a decision I'm sitting with." },
    { value: 'stress-test', text: "I'm about to make a big call \u2014 I want to stress-test it first." },
  ],
  org: [
    { value: 'culture', text: "I want to understand my organization's culture." },
    { value: 'readiness', text: "I want to assess our readiness for change." },
    { value: 'vision', text: "I want to draft a vision worth following." },
  ],
};

const TIME_OPTIONS = [
  { value: 'short', text: '10\u201315 minutes.' },
  { value: 'medium', text: '30 minutes or so.' },
  { value: 'long', text: 'An hour or more.' },
];

const WTS_TOOLS = {
  'three-moments': {
    title: 'Three Moments', available: true, page: 'three-moments',
    time: '10\u201315 min', mode: 'Solo or with a partner',
    why: {
      history: "You'll surface three moments that shaped you, then look at how much you've already changed. It makes growth feel real.",
      exploring: "It's the gentlest entry point \u2014 reflective, low-stakes, and surprisingly revealing. Most people leave it lighter.",
      purpose: "Before drafting future paths, it helps to see how the past has already shaped you.",
      action: "Sometimes the smallest experiment is to revisit a moment and see what it's still telling you.",
    },
  },
  'lcp': {
    title: 'Working with your circle', available: true, page: 'lcp',
    time: '30\u201345 min including the assessment', mode: 'Solo',
    why: {
      patterns: "The Leadership Circle Profile is the assessment I use most with senior leaders. The free self-assessment maps your creative strengths and reactive patterns onto one image \u2014 this tool helps you make sense of what you find.",
    },
  },
  'leadership-capacities': {
    title: 'Leadership Capacities Analysis', available: true, page: 'leadership-capacities',
    time: '45\u201360 min', mode: 'Solo',
    why: {
      patterns: "A deeper diagnostic when you have time to sit with it. Maps the capacities you've built and the ones still to grow.",
    },
  },
  'five-lives': {
    title: 'Purpose (Five Lives)', available: true, page: 'five-lives',
    time: '30\u201345 min', mode: 'Solo or with a partner',
    why: {
      purpose: "Imagine five different lives you might lead. Find what threads connect them \u2014 that's your purpose, often hiding in plain sight.",
      history: "If your story has felt scattered, five lives is a way to find the through-line.",
    },
  },
  'smallest-viable-experiment': {
    title: 'Smallest Viable Experiment', available: true, page: 'smallest-viable-experiment',
    time: '15\u201320 min', mode: 'Solo',
    why: {
      action: "Design the smallest move you can take this week \u2014 the one that's small enough to commit to and meaningful enough to learn from.",
    },
  },
  'challenge-mapper': {
    title: 'Decision Making', available: true, page: 'challenge-mapper',
    time: '20\u201330 min', mode: 'Solo or with a partner',
    why: {
      frame: "Maps the decision you're sitting with \u2014 the stakes, the people, the tensions \u2014 so you can see what you've been missing.",
    },
  },
  'pre-mortem': {
    title: 'Pre-Mortem', available: true, page: 'pre-mortem',
    time: '20\u201330 min', mode: 'Solo or with a team',
    why: {
      'stress-test': "Imagines the decision a year from now, having gone badly, and works backwards to find the failure modes you can still steer around.",
      frame: "If the decision is high-stakes, you'll want to stress-test it before you make the call.",
    },
  },
  'culture-model': {
    title: 'Culture model', available: true, page: null, external: 'https://qq5l85.csb.app/',
    time: '15\u201320 min', mode: 'Solo',
    why: {
      culture: "An interactive model of how small things people do add up to a culture. See your organization's pattern in motion.",
    },
  },
  'readiness': {
    title: 'Readiness assessment', available: true, page: 'readiness',
    time: '15 min solo \u00b7 30\u201360 min in a small group', mode: 'Solo or with a small group',
    why: {
      readiness: "Gives you an honest read on what your organization is ready for \u2014 not where you wish it were, but where it actually is.",
      vision: "Before drafting a vision worth following, it helps to know what your organization can actually carry.",
    },
  },
  'vision': {
    title: 'Vision builder', available: true, page: 'vision',
    time: '25\u201345 min', mode: 'Solo',
    why: {
      vision: "Drafts a vision that doesn't read like every other vision. Worth doing slowly.",
      readiness: "After diagnosing readiness, vision is what comes next \u2014 the destination that matches what the org can carry.",
    },
  },
};

// =================================================================
// COMPONENT
// =================================================================
export default function WhereToStartPage() {
  const navigate = useAppNavigate();
  const [step, setStep] = useState(1);
  const [answers, setAnswers] = useState({ layer: null, intent: null, time: null });

  useEffect(() => { window.scrollTo({ top: 0, behavior: 'smooth' }); }, [step]);

  function selectOption(field, value) {
    setAnswers((a) => {
      const next = { ...a, [field]: value };
      if (field === 'layer') next.intent = null; // reset intent when layer changes
      return next;
    });
  }

  function recommend() {
    const { layer, intent, time } = answers;
    if (layer === 'exploring') return { primary: 'three-moments' };
    if (layer === 'self') {
      if (intent === 'history') return { primary: 'three-moments', secondary: 'five-lives' };
      if (intent === 'patterns') {
        if (time === 'short') return { primary: 'lcp', secondary: 'leadership-capacities' };
        return { primary: 'leadership-capacities', secondary: 'lcp' };
      }
      if (intent === 'purpose') return { primary: 'five-lives', secondary: 'three-moments' };
      if (intent === 'action') return { primary: 'smallest-viable-experiment', secondary: 'three-moments' };
    }
    if (layer === 'team') {
      if (intent === 'frame') return { primary: 'challenge-mapper', secondary: 'pre-mortem' };
      if (intent === 'stress-test') return { primary: 'pre-mortem', secondary: 'challenge-mapper' };
    }
    if (layer === 'org') {
      if (intent === 'culture') return { primary: 'culture-model', secondary: 'readiness' };
      if (intent === 'readiness') return { primary: 'readiness', secondary: 'vision' };
      if (intent === 'vision') return { primary: 'vision', secondary: 'readiness' };
    }
    return { primary: 'three-moments' };
  }

  const TIME_LABELS = { short: '10\u201315 minutes', medium: '30 minutes or so', long: 'an hour or more' };

  // Map numeric step to logical screen, accounting for exploring path
  const isExploring = answers.layer === 'exploring';
  function whichScreen() {
    if (step === 1) return 'welcome';
    if (step === 2) return 'layer';
    if (step === 3) return isExploring ? 'time' : 'intent';
    if (step === 4) return isExploring ? 'result' : 'time';
    if (step === 5) return 'result';
    return 'welcome';
  }
  const screen = whichScreen();

  // Progress bar segments \u2014 one fewer when exploring path skips intent
  const totalSegments = isExploring ? 3 : 4;
  const segments = Array.from({ length: totalSegments }, (_, i) => i + 1);

  const canAdvance =
    screen === 'welcome' ? true :
    screen === 'layer' ? !!answers.layer :
    screen === 'intent' ? !!answers.intent :
    screen === 'time' ? !!answers.time :
    false;

  function renderOptions(field, options) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, margin: '32px 0' }}>
        {options.map((opt) => {
          const selected = answers[field] === opt.value;
          return (
            <button key={opt.value} onClick={() => selectOption(field, opt.value)}
                    style={{ background: selected ? C.bgCardHover : C.bgCard, border: `1px solid ${selected ? C.sage : C.line}`, borderRadius: 4, padding: '22px 26px', cursor: 'pointer', transition: 'all 0.3s', display: 'flex', alignItems: 'center', gap: 16, textAlign: 'left', fontFamily: 'inherit', color: C.cream, fontSize: 17, lineHeight: 1.5, width: '100%' }}>
              <span style={{ width: 22, height: 22, border: `1px solid ${selected ? C.sage : C.sageMuted}`, borderRadius: '50%', flexShrink: 0, background: selected ? C.sage : 'transparent', position: 'relative' }}>
                {selected && <span style={{ position: 'absolute', left: 6, top: 6, width: 8, height: 8, background: C.bgDeep, borderRadius: '50%' }} />}
              </span>
              <span>{opt.text}</span>
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <main style={{ animation: 'fadeIn 0.4s ease', minHeight: '80vh', padding: '60px 6vw 80px', maxWidth: 760, margin: '0 auto' }}>
      <a onClick={(e) => { e.preventDefault(); navigate('home'); }} href="#"
         style={{ display: 'inline-block', color: C.creamMuted, textDecoration: 'none', fontSize: 12, letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 40, cursor: 'pointer' }}>
        ← Back to tools
      </a>

      <div style={{ display: 'flex', gap: 6, marginBottom: 32 }}>
        {segments.map((n) => (
          <div key={n} style={{ height: 3, width: 24, background: n < step ? C.sageMuted : n === step ? C.sage : C.line, borderRadius: 2, transition: 'background 0.3s' }} />
        ))}
      </div>

      {screen === 'welcome' && (
        <div style={{ animation: 'fadeIn 0.4s ease' }}>
          <h1 style={heading(60)}>Where to <em style={{ color: C.sage, fontStyle: 'italic' }}>start</em>.</h1>
          <p style={{ fontFamily: F.serif, fontSize: 22, lineHeight: 1.55, color: C.cream, marginTop: 24, marginBottom: 36, maxWidth: 600 }}>
            Three quick questions, and I'll suggest somewhere to begin. Across self, team, and organisation tools.
          </p>
          <p style={{ fontSize: 14, color: C.creamMuted, marginBottom: 32, letterSpacing: '0.04em' }}>Takes about 30 seconds.</p>
          <button onClick={() => setStep(2)} style={btn('primary')} onMouseEnter={btnHoverIn} onMouseLeave={btnHoverOut}>Begin</button>
        </div>
      )}

      {(screen === 'layer' || screen === 'intent' || screen === 'time') && (
        <div style={{ animation: 'fadeIn 0.4s ease' }}>
          {screen === 'layer' && (
            <>
              <h2 style={{ ...heading(40), fontSize: 'clamp(28px, 4vw, 40px)', marginBottom: 16 }}>First &mdash; <em style={{ color: C.sage, fontStyle: 'italic' }}>what's challenging you most at the moment?</em></h2>
              <p style={{ fontSize: 14, color: C.creamMuted, marginBottom: 32, letterSpacing: '0.04em' }}>Pick the one that fits best. There are no wrong answers.</p>
              {renderOptions('layer', LAYER_OPTIONS)}
            </>
          )}
          {screen === 'intent' && (
            <>
              <h2 style={{ ...heading(40), fontSize: 'clamp(28px, 4vw, 40px)', marginBottom: 16 }}>Second &mdash; <em style={{ color: C.sage, fontStyle: 'italic' }}>what's drawing you here?</em></h2>
              <p style={{ fontSize: 14, color: C.creamMuted, marginBottom: 32, letterSpacing: '0.04em' }}>There's no wrong answer; pick what feels closest.</p>
              {renderOptions('intent', INTENT_OPTIONS[answers.layer] || [])}
            </>
          )}
          {screen === 'time' && (
            <>
              <h2 style={{ ...heading(40), fontSize: 'clamp(28px, 4vw, 40px)', marginBottom: 16 }}>{isExploring ? 'Second' : 'Third'} &mdash; <em style={{ color: C.sage, fontStyle: 'italic' }}>how much time do you have?</em></h2>
              <p style={{ fontSize: 14, color: C.creamMuted, marginBottom: 32, letterSpacing: '0.04em' }}>Just for now. You can always come back.</p>
              {renderOptions('time', TIME_OPTIONS)}
            </>
          )}
          <div style={{ display: 'flex', gap: 16, marginTop: 40, flexWrap: 'wrap' }}>
            <button onClick={() => setStep(step - 1)} style={btn('secondary')}>Back</button>
            <button onClick={() => setStep(step + 1)} disabled={!canAdvance} style={btn('primary', !canAdvance)} onMouseEnter={canAdvance ? btnHoverIn : undefined} onMouseLeave={canAdvance ? btnHoverOut : undefined}>
              {screen === 'time' ? 'See suggestion' : 'Next'}
            </button>
          </div>
        </div>
      )}

      {screen === 'result' && (() => {
        const { primary, secondary } = recommend();
        const tool = WTS_TOOLS[primary];
        const whyText = tool.why[answers.intent] || tool.why[answers.layer] || Object.values(tool.why)[0];
        const sec = secondary ? WTS_TOOLS[secondary] : null;
        const ctxLine = answers.time ? `For ${TIME_LABELS[answers.time]}.` : null;

        function openTool(t) {
          if (!t) return;
          if (t.external) window.open(t.external, '_blank', 'noopener,noreferrer');
          else if (t.page) navigate(t.page);
        }

        return (
          <div style={{ animation: 'fadeIn 0.4s ease' }}>
            <h2 style={{ ...heading(40), fontSize: 'clamp(28px, 4vw, 40px)', marginBottom: 16 }}>Here's where I'd <em style={{ color: C.sage, fontStyle: 'italic' }}>start</em>.</h2>
            {ctxLine && (
              <p style={{ fontFamily: F.serif, fontStyle: 'italic', fontSize: 17, color: C.sage, marginBottom: 24, marginTop: 0 }}>{ctxLine}</p>
            )}
            <div style={{ background: C.bgCard, borderLeft: `3px solid ${C.sage}`, borderRadius: 4, padding: 36, margin: '24px 0 36px' }}>
              <div style={{ ...eyebrow, marginBottom: 16 }}>
                {tool.available ? 'Recommended \u00b7 Available now' : 'Recommended \u00b7 Coming soon'}
              </div>
              <div style={{ ...heading(36), marginBottom: 18, fontSize: 36, lineHeight: 1.1 }}>{tool.title}</div>
              <div style={{ fontFamily: F.serif, fontStyle: 'italic', fontSize: 19, lineHeight: 1.55, color: C.cream, marginBottom: 24 }}>{whyText}</div>
              <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase', color: C.creamMuted, paddingTop: 16, borderTop: `1px solid ${C.line}` }}>
                <span>{tool.time}</span><span>{tool.mode}</span>
                {tool.external && <span>External ↗</span>}
              </div>
            </div>
            {sec && (
              <div style={{ background: 'rgba(42, 71, 68, 0.4)', border: `1px dashed ${C.line}`, borderRadius: 4, padding: '22px 26px', margin: '16px 0 24px' }}>
                <div style={{ ...eyebrow, color: C.creamMuted, marginBottom: 8, fontSize: 11, letterSpacing: '0.25em' }}>When you have more time</div>
                <p style={{ fontSize: 15, color: C.cream, lineHeight: 1.6, margin: 0 }}>
                  For a longer second pass, <em style={{ color: C.sage, fontStyle: 'italic' }}>{sec.title}</em> goes deeper or covers nearby territory.
                </p>
                <div style={{ marginTop: 14 }}>
                  <button onClick={() => openTool(sec)} style={btn('secondary')}>Open {sec.title}</button>
                </div>
              </div>
            )}
            <div style={{ display: 'flex', gap: 16, marginTop: 40, flexWrap: 'wrap' }}>
              <button onClick={() => { setStep(1); setAnswers({ layer: null, intent: null, time: null }); }} style={btn('secondary')}>Start over</button>
              {tool.available && (
                <button onClick={() => openTool(tool)} style={btn('primary')} onMouseEnter={btnHoverIn} onMouseLeave={btnHoverOut}>Open {tool.title}</button>
              )}
            </div>
          </div>
        );
      })()}
    </main>
  );
}
