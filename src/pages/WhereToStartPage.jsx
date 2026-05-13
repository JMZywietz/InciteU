import React, { useState } from 'react';
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
      { num:  1, name: 'Three Moments',                                to: 'three-moments',           live: true,  description: 'What made us who we are today' },
      { num:  2, name: 'Identity Box',                                 to: 'identity-box',            live: true,  description: 'How we see ourselves, and what could be possible if we used that effort for something else' },
      { num:  3, name: 'Purpose',                                      to: 'purpose-small-moves',     live: true,  description: 'Who we want to be next, and how to get there' },
      { num:  4, name: 'Emotions as Information',                      to: 'emotions-as-information', live: true,  description: "Understanding what we feel - and don't feel - can rapidly unlock new possibilities" },
    ],
  },
  {
    label: 'Outward',
    name: 'Face What Is',
    accent: '#E8C87A',
    tools: [
      { num:  5, name: 'Using the LCP Self-Assessment',                to: 'lcp',                     live: true,  description: 'An objective look at your strengths and reactive patterns' },
      { num:  6, name: 'Decision Making (Cynefin) & Challenge Mapper', to: 'challenge-mapper',        live: true,  description: 'Understand what type of challenge you are facing and the best way to move forward' },
      { num:  7, name: 'Creative Collision',                           to: 'creative-collision',      live: true,  description: 'Get opposing perspectives to make your idea better' },
      { num:  8, name: 'Open Facilitation',                            to: 'facilitate-your-way',     live: true,  description: 'Gather input from a group on any questions that you have' },
    ],
  },
  {
    label: 'Forward',
    name: 'Lead Well',
    accent: '#8CBAC6',
    tools: [
      { num:  9, name: 'Culture Change Vision',                        to: 'vision',                  live: true,  description: 'get clear on how to communicate the change you want (for teams / orgs)' },
      { num: 10, name: 'Culture Readiness Assessment',                 to: 'readiness',               live: true,  description: 'take stock of what your team needs to successfully change its culture (for teams / orgs)' },
      { num: 11, name: 'Pre-Mortem',                                   to: 'pre-mortem',              live: true,  description: 'Imagine failure before it happens, then prevent the worst of it' },
      { num: 12, name: 'The Squeeze',                                  to: null,                      live: false, description: 'Move forward quickly and easily by designing small experiments and rapidly harvesting them for insights' },
    ],
  },
];

export default function WhereToStartPage() {
  const navigate = useAppNavigate();
  const [hoveredKey, setHoveredKey] = useState(null);

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
            Inward first. Who we are - our identity and our purpose - is the foundation of everything we do. Then outward, to see what is in front of you. Then forward to move into what's next.
          </p>

          <div style={{ marginBottom: 32 }}>
            {SEQUENCE.map((bucket, bi) => (
              <div key={bi} style={{ marginBottom: bi === SEQUENCE.length - 1 ? 0 : 22 }}>
                <div style={{ fontFamily: F.sans, fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase', color: bucket.accent, marginBottom: 10 }}>
                  {bucket.label} &middot; {bucket.name}
                </div>
                <ol style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                  {bucket.tools.map((t, ti) => {
                    const key = `${bi}-${ti}`;
                    const isComing = t.live === false;
                    const isLink = !isComing && !!t.to;
                    const isHovered = hoveredKey === key;
                    const isLast = ti === bucket.tools.length - 1;

                    const nameColor = isComing
                      ? 'rgba(240, 235, 219, 0.38)'
                      : (isHovered ? bucket.accent : C.cream);
                    const descColor = isComing
                      ? 'rgba(240, 235, 219, 0.3)'
                      : 'rgba(240, 235, 219, 0.62)';
                    const numColor = isComing
                      ? 'rgba(240, 235, 219, 0.38)'
                      : bucket.accent;

                    const itemContent = (
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 15, color: nameColor, fontWeight: 400, lineHeight: 1.35, marginBottom: t.description ? 4 : 0, transition: 'color 0.3s' }}>
                          {t.name}
                        </div>
                        {t.description && (
                          <div style={{ fontFamily: F.serif, fontStyle: 'italic', fontSize: 13, color: descColor, fontWeight: 400, lineHeight: 1.4, transition: 'color 0.3s' }}>
                            {t.description}
                          </div>
                        )}
                      </div>
                    );

                    return (
                      <li key={key}
                          onMouseEnter={() => { if (isLink) setHoveredKey(key); }}
                          onMouseLeave={() => setHoveredKey(null)}
                          style={{
                            padding: '12px 0',
                            display: 'flex',
                            alignItems: 'baseline',
                            gap: 12,
                            borderBottom: isLast ? 'none' : `1px solid ${C.line}`,
                            cursor: isLink ? 'pointer' : 'default',
                          }}>
                        <span style={{ color: numColor, fontFamily: F.serif, fontStyle: 'italic', fontSize: 14, minWidth: 22, flexShrink: 0, transition: 'color 0.3s' }}>
                          {t.num}.
                        </span>
                        {isLink ? (
                          <a onClick={(e) => { e.preventDefault(); navigate(t.to); }} href="#"
                             style={{ textDecoration: 'none', cursor: 'pointer', flex: 1, color: 'inherit' }}>
                            {itemContent}
                          </a>
                        ) : (
                          itemContent
                        )}
                      </li>
                    );
                  })}
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
