import React, { useState, useEffect } from 'react';
import { C, F } from '../theme.js';
import { btn, btnHoverIn, btnHoverOut, eyebrow, heading } from '../styles.js';
import { useAppNavigate } from '../lib/useAppNavigate.js';

// Q1 — Layer
const Q1 = {
  title: <>First &mdash; <em>what's drawing you here?</em></>,
  helper: 'Pick the one that fits best. There are no wrong answers.',
  options: [
    { value: 'inward',   text: 'I want to know myself better.' },
    { value: 'outward',  text: "I'm trying to see a situation clearly." },
    { value: 'forward',  text: "I'm leading something hard." },
    { value: 'exploring',text: 'Just exploring. Show me something gentle.' },
  ],
};

// Q2 — branches by layer
const Q2_BY_LAYER = {
  inward: {
    title: <>And <em>what part of that?</em></>,
    helper: 'These map to different inward practices.',
    options: [
      { value: 'history',  text: 'What helped make me who I am today?' },
      { value: 'identity', text: 'What am I working to project — and what am I working to protect?' },
      { value: 'calling',  text: "Who do I want to be when I grow up? / What's calling me next?" },
      { value: 'emotions', text: 'What are my emotions actually good for?' },
    ],
  },
  outward: {
    title: <>And <em>where do you need clarity?</em></>,
    helper: 'Different ways of reading what is in front of you.',
    options: [
      { value: 'self',      text: 'On myself — my leadership patterns.' },
      { value: 'challenge', text: 'On the situation — what kind of challenge am I actually facing?' },
      { value: 'collision', text: 'On my idea — I want to stress-test it with opposing perspectives.' },
      { value: 'group',     text: 'On a group — I want to gather many voices and make sense of them together.' },
    ],
  },
  forward: {
    title: <>And <em>what part of leading?</em></>,
    helper: 'Different parts of moving forward need different tools.',
    options: [
      { value: 'direction', text: 'Articulating direction for the organization.' },
      { value: 'project',   text: 'Pressure-testing a project before I commit.' },
      { value: 'readiness', text: "Assessing whether we're ready for big change." },
    ],
  },
};

// Route: (layer, intent) -> outcome key
const ROUTE_MAP = {
  'inward.history':    'three-moments',
  'inward.identity':   'identity-box',
  'inward.calling':    'purpose-small-moves',
  'inward.emotions':   'emotions-as-information',
  'outward.self':      'lcp',
  'outward.challenge': 'challenge-mapper',
  'outward.collision': 'creative-collision',
  'outward.group':     'facilitate-your-way',
  'forward.direction': 'vision',
  'forward.project':   'pre-mortem',
  'forward.readiness': 'readiness',
  'exploring':         'five-layers-deep',
};

const OUTCOMES = {
  'three-moments': {
    title: 'Three Moments',
    page: 'three-moments',
    context: 'Inward — looking back to look forward.',
    description: "You'll surface three moments that shaped you, then look at how much you have already changed. It makes growth feel real.",
    time: '10–15 min',
    mode: 'Solo or with a partner',
  },
  'identity-box': {
    title: 'Identity Box',
    page: 'identity-box',
    context: 'Inward — naming what you project, and what you protect.',
    description: 'An exercise that surfaces how you see yourself, the effort you put into maintaining this image, and what might be possible if you used that effort for something else.',
    time: '15–25 min',
    mode: 'Solo',
    secondary: 'purpose-small-moves',
    secondaryNote: 'Once you can see how you want to be seen, this paired practice helps you ask who you want to be next.',
  },
  'purpose-small-moves': {
    title: 'Purpose (and the Small Moves to Live It)',
    page: 'purpose-small-moves',
    context: "Inward — surfacing what's calling next.",
    description: 'A two-part practice. Five Lives surfaces what you actually want more of; Smallest Viable Experiment turns that signal into one tiny move you can make this week.',
    time: '~30 min for the full pair',
    mode: 'Solo',
  },
  'emotions-as-information': {
    title: 'Emotions as Information',
    page: 'emotions-as-information',
    context: 'Inward — learning to read your own signals.',
    description: 'A think piece, then a tool. Five Layers Deep shows what emotions actually carry; the Leadership Capacities Analysis helps you apply it to your own patterns.',
    time: '~30 min for the full pair',
    mode: 'Solo',
  },
  'lcp': {
    title: 'Using the Leadership Circle Profile Self-Assessment',
    page: 'lcp',
    context: 'Outward — a clear-eyed look at your own leadership.',
    description: 'The Leadership Circle Profile maps your creative strengths and reactive patterns onto one image. This tool helps you make sense of what you find.',
    time: '30–45 min including the assessment',
    mode: 'Solo',
    secondary: 'emotions-as-information',
    secondaryNote: 'Once you can see the patterns on the Circle, this paired practice helps you read what they are telling you about what you need to grow.',
  },
  'challenge-mapper': {
    title: 'Decision Making (Cynefin) & Challenge Mapper',
    page: 'challenge-mapper',
    context: "Outward — getting clear on what kind of thing you're actually facing.",
    description: 'Different kinds of problems need different kinds of moves. This walks you through what kind of challenge you have and how to approach it.',
    time: '15–25 min',
    mode: 'Solo or with a team',
  },
  'creative-collision': {
    title: 'Creative Collision',
    page: 'creative-collision',
    context: 'Outward — stress-testing your idea by colliding it with opposing perspectives.',
    description: 'Take an idea you are close to and run it through deliberate opposing perspectives — solo with AI, or with a team using the de Bono Six Thinking Hats. What survives the collision is sturdier than what went in.',
    time: '20–40 min',
    mode: 'Solo or with a team',
  },
  'facilitate-your-way': {
    title: 'Open Facilitation',
    page: 'facilitate-your-way',
    context: 'Outward — gathering many voices and sensemaking together.',
    description: 'Pose 1–5 questions to a group, collect their responses asynchronously, and use AI to surface patterns, outliers, and absences across what they said. A facilitation tool you can run without being in the room.',
    time: '~15 min to set up; group time varies',
    mode: 'With a group',
  },
  'vision': {
    title: 'Vision',
    page: 'vision',
    context: "Forward — articulating what you're trying to build.",
    description: 'Six questions that build a complete culture-change story: burning platform, north star, values, strategy, leadership, behaviours.',
    time: '20–30 min',
    mode: 'Solo or with a leadership team',
    secondary: 'readiness',
    secondaryNote: 'Once you can name the vision, this honest assessment tells you whether the organization is set up to go after it.',
  },
  'pre-mortem': {
    title: 'Pre-Mortem',
    page: 'pre-mortem',
    context: 'Forward — surfacing what could go wrong before it does.',
    description: 'Imagine the project failed. Why? Working backwards from imagined failure surfaces the risks you can still do something about.',
    time: '30–45 min',
    mode: 'Solo or with a team',
  },
  'readiness': {
    title: 'Readiness',
    page: 'readiness',
    context: 'Forward — honest about where you actually stand.',
    description: 'An 18-statement self-assessment of culture-change readiness. A mirror, not a verdict.',
    time: '5–7 min',
    mode: 'Solo or with a leadership team',
    secondary: 'vision',
    secondaryNote: 'If your readiness assessment surfaces a missing vision, this is where you would build it out.',
  },
  'five-layers-deep': {
    title: 'Five Layers Deep',
    page: 'five-layers-deep',
    context: 'A gentle place to begin.',
    description: 'A short think piece on how emotions carry information beneath the surface — and what is hiding under the loudest layer. Most people leave it thinking differently about something they came in convinced about.',
    time: '~10 min read',
    mode: 'Solo',
  },
};

// Main component

export default function QuizPage() {
  const navigate = useAppNavigate();
  // step 1 = intro, 2 = Q1, 3 = Q2, 4 = result
  const [step, setStep] = useState(1);
  const [answers, setAnswers] = useState({ layer: null, intent: null });

  useEffect(() => { window.scrollTo({ top: 0, behavior: 'smooth' }); }, [step]);

  function selectOption(qId, value) { setAnswers((a) => ({ ...a, [qId]: value })); }

  function getOutcomeKey() {
    if (answers.layer === 'exploring') return ROUTE_MAP.exploring;
    return ROUTE_MAP[`${answers.layer}.${answers.intent}`];
  }

  function advanceFromQ1() {
    if (answers.layer === 'exploring') setStep(4); // skip Q2
    else setStep(3);
  }
  function backFromResult() {
    if (answers.layer === 'exploring') setStep(2);
    else setStep(3);
  }

  // Progress dots: Q1, Q2, Result
  let activeDot = 0;
  if (step === 2) activeDot = 1;
  else if (step === 3) activeDot = 2;
  else if (step === 4) activeDot = 3;

  return (
    <main style={{ animation: 'fadeIn 0.4s ease', minHeight: '80vh', padding: '60px 6vw 80px', maxWidth: 760, margin: '0 auto' }}>
      <a onClick={(e) => { e.preventDefault(); navigate('home'); }} href="#"
         style={{ display: 'inline-block', color: C.creamMuted, textDecoration: 'none', fontSize: 12, letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 40, cursor: 'pointer' }}>
        ← Back to tools
      </a>

      {step > 1 && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 32 }}>
          {[1,2,3].map((n) => (
            <div key={n} style={{ height: 3, flex: 1, maxWidth: 60,
              background: n < activeDot ? C.sageMuted : n === activeDot ? C.sage : C.line,
              borderRadius: 2, transition: 'background 0.3s' }} />
          ))}
        </div>
      )}

      {step === 1 && (
        <div style={{ animation: 'fadeIn 0.4s ease' }}>
          <h1 style={heading(60)}>Where to <em style={{ color: C.sage, fontStyle: 'italic' }}>start</em>.</h1>
          <p style={{ fontFamily: F.serif, fontSize: 22, lineHeight: 1.55, color: C.cream, marginTop: 24, marginBottom: 36, maxWidth: 600 }}>
            Two quick questions, and I'll point you somewhere worth beginning.
          </p>
          <p style={{ fontSize: 14, color: C.creamMuted, marginBottom: 32, letterSpacing: '0.04em' }}>Takes about 30 seconds.</p>
          <button onClick={() => setStep(2)} style={btn('primary')} onMouseEnter={btnHoverIn} onMouseLeave={btnHoverOut}>Begin</button>
        </div>
      )}

      {step === 2 && (
        <QuestionView
          question={Q1}
          value={answers.layer}
          onSelect={(v) => selectOption('layer', v)}
          onBack={() => setStep(1)}
          onNext={advanceFromQ1}
          backLabel="← Back to intro"
          nextLabel={answers.layer === 'exploring' ? 'See suggestion →' : 'Next →'}
        />
      )}

      {step === 3 && answers.layer && answers.layer !== 'exploring' && (
        <QuestionView
          question={Q2_BY_LAYER[answers.layer]}
          value={answers.intent}
          onSelect={(v) => selectOption('intent', v)}
          onBack={() => setStep(2)}
          onNext={() => setStep(4)}
          backLabel="← Previous"
          nextLabel="See suggestion →"
        />
      )}

      {step === 4 && (
        <ResultView
          outcomeKey={getOutcomeKey()}
          onStartOver={() => { setStep(1); setAnswers({ layer: null, intent: null }); }}
          onBack={backFromResult}
          navigate={navigate}
        />
      )}
    </main>
  );
}

// Question view

function QuestionView({ question, value, onSelect, onBack, onNext, backLabel, nextLabel }) {
  const canAdvance = !!value;
  return (
    <div style={{ animation: 'fadeIn 0.4s ease' }}>
      <h2 style={{ ...heading(40), fontSize: 'clamp(28px, 4vw, 40px)', marginBottom: 16 }}>{question.title}</h2>
      <p style={{ fontSize: 14, color: C.creamMuted, marginBottom: 32, letterSpacing: '0.04em' }}>{question.helper}</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, margin: '32px 0' }}>
        {question.options.map((opt) => {
          const selected = value === opt.value;
          return (
            <button key={opt.value} onClick={() => onSelect(opt.value)}
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
        <button onClick={onBack} style={btn('secondary')}>{backLabel}</button>
        <button onClick={onNext} disabled={!canAdvance} style={btn('primary', !canAdvance)}
                onMouseEnter={(e) => { if (canAdvance) btnHoverIn(e); }}
                onMouseLeave={(e) => { if (canAdvance) btnHoverOut(e); }}>
          {nextLabel}
        </button>
      </div>
    </div>
  );
}

// Result view

function ResultView({ outcomeKey, onStartOver, onBack, navigate }) {
  const outcome = OUTCOMES[outcomeKey];
  if (!outcome) {
    return (
      <div style={{ animation: 'fadeIn 0.4s ease' }}>
        <p style={{ fontSize: 16, color: C.cream, marginBottom: 24 }}>Something went sideways — let's start over.</p>
        <button onClick={onStartOver} style={btn('primary')}>Start over</button>
      </div>
    );
  }
  const secondary = outcome.secondary ? OUTCOMES[outcome.secondary] : null;
  return (
    <div style={{ animation: 'fadeIn 0.4s ease' }}>
      <h2 style={{ ...heading(40), fontSize: 'clamp(28px, 4vw, 40px)', marginBottom: 16 }}>Here's where I'd <em style={{ color: C.sage, fontStyle: 'italic' }}>start</em>.</h2>
      <p style={{ fontFamily: F.serif, fontStyle: 'italic', fontSize: 17, color: C.sage, marginBottom: 32, marginTop: 0 }}>
        {outcome.context}
      </p>
      <div style={{ background: C.bgCard, borderLeft: `3px solid ${C.sage}`, borderRadius: 4, padding: 36, margin: '24px 0 24px' }}>
        <div style={{ ...eyebrow, marginBottom: 16 }}>Recommended · Available now</div>
        <div style={{ ...heading(36), marginBottom: 18, fontSize: 32, lineHeight: 1.15 }}>{outcome.title}</div>
        <div style={{ fontFamily: F.serif, fontStyle: 'italic', fontSize: 18, lineHeight: 1.55, color: C.cream, marginBottom: 24 }}>{outcome.description}</div>
        {outcome.note && (
          <div style={{ fontSize: 13, color: C.creamMuted, fontStyle: 'italic', marginBottom: 16, paddingTop: 14, borderTop: `1px solid ${C.line}` }}>
            {outcome.note}
          </div>
        )}
        <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase', color: C.creamMuted, paddingTop: 16, borderTop: outcome.note ? 'none' : `1px solid ${C.line}` }}>
          <span>{outcome.time}</span><span>{outcome.mode}</span>
        </div>
      </div>

      {secondary && (
        <div style={{ background: 'rgba(42, 71, 68, 0.4)', border: `1px dashed ${C.line}`, borderRadius: 4, padding: '22px 26px', margin: '16px 0 24px' }}>
          <div style={{ ...eyebrow, color: C.creamMuted, marginBottom: 10, fontSize: 11, letterSpacing: '0.25em' }}>Natural next</div>
          <p style={{ fontSize: 15, color: C.cream, lineHeight: 1.65, marginBottom: 16 }}>
            <em style={{ color: C.sage, fontStyle: 'italic' }}>{secondary.title}</em> &mdash; {outcome.secondaryNote}
          </p>
          <button onClick={() => navigate(secondary.page)} style={btn('secondary')}>Open {secondary.title}</button>
        </div>
      )}

      <div style={{ display: 'flex', gap: 16, marginTop: 40, flexWrap: 'wrap' }}>
        <button onClick={onBack} style={btn('secondary')}>← Back</button>
        <button onClick={onStartOver} style={btn('secondary')}>Start over</button>
        <button onClick={() => navigate(outcome.page)} style={btn('primary')} onMouseEnter={btnHoverIn} onMouseLeave={btnHoverOut}>
          Open {outcome.title}
        </button>
      </div>
    </div>
  );
}
