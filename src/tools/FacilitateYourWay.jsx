import React from 'react';
import { C, F } from '../theme.js';
import { btn, btnHoverIn, btnHoverOut, eyebrow, heading } from '../styles.js';
import { useAppNavigate } from '../lib/useAppNavigate.js';

// Paste the published Claude artifact URL here after publishing FacilitateYourWay.
// Until then, the button below opens this same page (no-op fallback).
const FACILITATE_YOUR_WAY_URL = 'PASTE_PUBLISHED_ARTIFACT_URL_HERE';

export default function FacilitateYourWayPage() {
  const navigate = useAppNavigate();
  const urlReady = FACILITATE_YOUR_WAY_URL && FACILITATE_YOUR_WAY_URL !== 'PASTE_PUBLISHED_ARTIFACT_URL_HERE';

  return (
    <main style={{ animation: 'fadeIn 0.4s ease', minHeight: '80vh', padding: '60px 6vw 80px', maxWidth: 760, margin: '0 auto' }}>
      <a onClick={(e) => { e.preventDefault(); navigate('home'); }} href="#"
         style={{ display: 'inline-block', color: C.creamMuted, textDecoration: 'none', fontSize: 12, letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 40, cursor: 'pointer' }}>
        ← Back to InciteU
      </a>

      <div style={{ ...eyebrow, marginBottom: 12 }}>A Team tool</div>
      <h1 style={{ ...heading(60), marginBottom: 28 }}>
        Facilitate Your <em style={{ color: C.sage, fontStyle: 'italic' }}>Way</em>.
      </h1>

      <p style={{ fontFamily: F.serif, fontSize: 22, lineHeight: 1.55, color: C.cream, marginBottom: 24, maxWidth: 640 }}>
        Sometimes teams need to check in on the fly. This tool lets you add your own questions and get input from the whole team. You can consolidate the output or ask AI to synthesize it for you (or both).
      </p>

      <p style={{ fontSize: 15, lineHeight: 1.7, color: C.creamMuted, maxWidth: 600, marginBottom: 36 }}>
        One round of input. One synthesis per question — patterns, outliers, and absences. No accounts, no setup beyond a session code your team can share.
      </p>

      <div style={{ background: C.bgCard, borderLeft: `3px solid ${C.sage}`, borderRadius: 4, padding: '24px 28px', marginBottom: 40 }}>
        <p style={{ fontFamily: F.serif, fontStyle: 'italic', fontSize: 18, color: C.cream, lineHeight: 1.6 }}>
          Use this when you have <em style={{ color: C.sage }}>your own questions</em> and want input from a group fast — without setting up a survey or scheduling another meeting.
        </p>
      </div>

      <h3 style={{ fontFamily: F.serif, fontSize: 28, color: C.cream, marginBottom: 20, marginTop: 56, fontWeight: 400 }}>
        How this tool works
      </h3>
      <ol style={{ paddingLeft: 0, listStyle: 'none', margin: '0 0 40px' }}>
        {[
          { step: '01', text: 'As the facilitator, write three questions (or more). Add optional context to frame what you\'re looking for.' },
          { step: '02', text: 'Share the session code aloud or send the join link. Your team enters and answers — privately, without seeing each other\'s responses first.' },
          { step: '03', text: 'When you\'re ready, view all responses together. Ask the AI to surface patterns, outliers, and what\'s notably absent. Download the result.' },
        ].map((row, i, arr) => (
          <li key={i} style={{ display: 'flex', gap: 20, padding: '18px 0', borderBottom: i < arr.length - 1 ? `1px solid ${C.line}` : 'none' }}>
            <div style={{ fontFamily: F.sans, fontSize: 13, color: C.sage, letterSpacing: '0.18em', flexShrink: 0, paddingTop: 2 }}>{row.step}</div>
            <div style={{ fontSize: 15, color: C.cream, lineHeight: 1.7 }}>{row.text}</div>
          </li>
        ))}
      </ol>

      <div style={{ display: 'flex', gap: 16, marginTop: 40, flexWrap: 'wrap' }}>
        {urlReady ? (
          <a href={FACILITATE_YOUR_WAY_URL} target="_blank" rel="noopener noreferrer"
             style={{ ...btn('primary'), textDecoration: 'none' }}
             onMouseEnter={btnHoverIn} onMouseLeave={btnHoverOut}>
            Open the tool ↗
          </a>
        ) : (
          <button style={btn('primary', true)} disabled>
            Tool URL not yet configured
          </button>
        )}
        <button onClick={() => navigate('home')} style={btn('secondary')}>Back to InciteU</button>
      </div>

      {urlReady ? (
        <p style={{ fontSize: 12, color: C.creamMuted, marginTop: 28, fontStyle: 'italic', maxWidth: 540 }}>
          Opens in a new tab. The tool itself runs as a published Claude artifact.
        </p>
      ) : (
        <p style={{ fontSize: 12, color: C.warning, marginTop: 28, fontStyle: 'italic', maxWidth: 540 }}>
          Heads up to the developer: replace <code style={{ background: C.bgCard, padding: '2px 6px', borderRadius: 3 }}>FACILITATE_YOUR_WAY_URL</code> at the top of this file with the published artifact URL.
        </p>
      )}
    </main>
  );
}
