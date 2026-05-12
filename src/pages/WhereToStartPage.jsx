import React from 'react';
import { C, F } from '../theme.js';
import { btn, btnHoverIn, btnHoverOut, eyebrow, heading } from '../styles.js';
import { useAppNavigate } from '../lib/useAppNavigate.js';

// The sequence through the tools, organized by IA bucket.
// Identity is the foundation for purpose: inward first, then outward, then forward.
const SEQUENCE = [
  {
    label: 'Inward',
    name: 'Live Well',
    accent: '#C5D49B',
    tools: [
      { num: 1, name: 'Three Moments',                                 to: 'three-moments' },
      { num: 2, name: 'Purpose (and the Small Moves to Live It)',      to: 'purpose-small-moves' },
      { num: 3, name: 'Emotions as Information',                       to: 'emotions-as-information' },
    ],
  },
  {
    label: 'Outward',
    name: 'Face What Is',
    accent: '#E8C87A',
    tools: [
      { num: 4, name: 'Using the LCP Self-Assessment',                 to: 'lcp' },
      { num: 5, name: 'Decision Making (Cynefin) & Challenge Mapper',  to: 'challenge-mapper' },
    ],
  },
  {
    label: 'Forward',
    name: 'Lead Well',
    accent: '#8CBAC6',
    tools: [
      { num: 6, name: 'Vision',     to: 'vision' },
      { num: 7, name: 'Readiness',  to: 'readiness' },
      { num: 8, name: 'Pre-Mortem', to: 'pre-mortem' },
    ],
  },
];

export default function WhereToStartPage() {
  const navigate = useAppNavigate();

  return (
    <main style={{ animation: 'fadeIn 0.4s ease', minHeight: '80vh', padding: '60px 6vw 80px', maxWidth: 1100, margin: '0 auto' }}>
      <a onClick={(e) => { e.preventDefault(); navigate('home'); }} href="#"
         style={{ display: 'inline-block', color: C.creamMuted, textDecoration: 'none', fontSize: 12, letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 40, cursor: 'pointer' }}>
        ← Back to tools
      </a>

      <div style={{ textAlign: 'center', maxWidth: 720, margin: '0 auto 56px' }}>
        <div style={{ ...eyebrow, marginBottom: 16 }}>Where to begin</div>
        <h1 style={heading(56)}>Two <em style={{ color: C.sage, fontStyle: 'italic' }}>paths</em>.</h1>
        <p style={{ fontFamily: F.serif, fontSize: 22, lineHeight: 1.55, color: C.cream, marginTop: 24 }}>
          Take the practice in order, or answer two quick questions and I'll point you somewhere worth beginning.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 32, marginBottom: 56 }}>

        {/* SEQUENCE CARD */}
        <div style={{ background: C.bgCard, borderLeft: `3px solid ${C.sage}`, borderRadius: 4, padding: 36 }}>
          <div style={{ ...eyebrow, marginBottom: 12 }}>For people who want a guided arc</div>
          <h2 style={{ ...heading(36), marginBottom: 16 }}>The sequence</h2>
          <p style={{ fontFamily: F.serif, fontStyle: 'italic', fontSize: 17, color: C.cream, lineHeight: 1.6, marginBottom: 28 }}>
            Inward first &mdash; identity is the foundation for purpose. Then outward to see what is in front of you. Then forward to move it.
          </p>

          <div style={{ marginBottom: 32 }}>
            {SEQUENCE.map((bucket, bi) => (
              <div key={bi} style={{ marginBottom: bi === SEQUENCE.length - 1 ? 0 : 22 }}>
                <div style={{ fontFamily: F.sans, fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase', color: bucket.accent, marginBottom: 10 }}>
                  {bucket.label} &middot; {bucket.name}
                </div>
                <ol style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                  {bucket.tools.map((t) => (
                    <li key={t.num} style={{ padding: '6px 0', display: 'flex', alignItems: 'baseline', gap: 12, fontSize: 15, lineHeight: 1.45 }}>
                      <span style={{ color: bucket.accent, fontFamily: F.serif, fontStyle: 'italic', fontSize: 14, minWidth: 18 }}>{t.num}.</span>
                      <a onClick={(e) => { e.preventDefault(); navigate(t.to); }} href="#"
                         style={{ color: C.cream, textDecoration: 'none', transition: 'color 0.3s', cursor: 'pointer' }}
                         onMouseEnter={(e) => { e.currentTarget.style.color = bucket.accent; }}
                         onMouseLeave={(e) => { e.currentTarget.style.color = C.cream; }}>
                        {t.name}
                      </a>
                    </li>
                  ))}
                </ol>
              </div>
            ))}
          </div>

          <button onClick={() => navigate('three-moments')} style={btn('primary')} onMouseEnter={btnHoverIn} onMouseLeave={btnHoverOut}>
            Begin with Three Moments →
          </button>
        </div>

        {/* QUIZ CARD */}
        <div style={{ background: 'rgba(42, 71, 68, 0.5)', border: `1px solid ${C.line}`, borderLeft: `3px solid ${C.sageMuted}`, borderRadius: 4, padding: 36 }}>
          <div style={{ ...eyebrow, color: C.creamMuted, marginBottom: 12 }}>For people who'd rather be pointed</div>
          <h2 style={{ ...heading(36), marginBottom: 16 }}>The quiz</h2>
          <p style={{ fontFamily: F.serif, fontStyle: 'italic', fontSize: 17, color: C.cream, lineHeight: 1.6, marginBottom: 24 }}>
            About thirty seconds. Tell me where the pull is &mdash; toward yourself, toward a situation, or toward leading something &mdash; and I'll suggest somewhere to begin.
          </p>
          <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 36px 0' }}>
            <li style={{ padding: '10px 0', fontSize: 14, color: C.cream, borderBottom: `1px solid ${C.line}`, fontStyle: 'italic', fontFamily: F.serif }}>
              What's drawing you here?
            </li>
            <li style={{ padding: '10px 0', fontSize: 14, color: C.cream, fontStyle: 'italic', fontFamily: F.serif }}>
              And what part of that?
            </li>
          </ul>
          <button onClick={() => navigate('quiz')} style={btn('primary')} onMouseEnter={btnHoverIn} onMouseLeave={btnHoverOut}>
            Take the quiz →
          </button>
        </div>

      </div>

      <div style={{ textAlign: 'center', borderTop: `1px solid ${C.line}`, paddingTop: 32 }}>
        <a onClick={(e) => { e.preventDefault(); navigate('home'); }} href="#"
           style={{ color: C.creamMuted, textDecoration: 'none', fontSize: 14, letterSpacing: '0.04em', cursor: 'pointer', fontStyle: 'italic', fontFamily: F.serif, transition: 'color 0.3s' }}
           onMouseEnter={(e) => { e.currentTarget.style.color = C.sage; }}
           onMouseLeave={(e) => { e.currentTarget.style.color = C.creamMuted; }}>
          Or just browse the tools by category →
        </a>
      </div>
    </main>
  );
}
