import React from 'react';
import { C, F } from '../theme.js';
import { btn, btnHoverIn, btnHoverOut, eyebrow, heading } from '../styles.js';
import { useAppNavigate } from '../lib/useAppNavigate.js';

// ============================================================================
// Landing page for the paired Purpose practice:
//   Step 1 — Five Lives (understand what you want more of, less of)
//   Step 2 — Smallest Viable Experiment (create one tiny move to test it)
// ============================================================================

export default function PurposeSmallMovesPage() {
  const navigate = useAppNavigate();

  return (
    <main style={{ animation: 'fadeIn 0.4s ease', minHeight: '80vh', padding: '60px 6vw 80px', maxWidth: 820, margin: '0 auto' }}>
      <a onClick={(e) => { e.preventDefault(); navigate('home'); }} href="#"
         style={{ display: 'inline-block', color: C.creamMuted, textDecoration: 'none', fontSize: 12, letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 40, cursor: 'pointer' }}>
        ← Back to tools
      </a>

      <div style={{ ...eyebrow, marginBottom: 12 }}>A two-part practice</div>
      <h1 style={{ ...heading(56), marginBottom: 24 }}>Purpose &mdash; <em style={{ color: C.sage, fontStyle: 'italic' }}>and the small moves to live it</em>.</h1>
      <p style={{ fontFamily: F.serif, fontSize: 22, lineHeight: 1.55, color: C.cream, marginBottom: 20, maxWidth: 680 }}>
        Purpose without practice is a poster. Practice without purpose is busywork.
      </p>
      <p style={{ fontSize: 16, lineHeight: 1.75, color: C.creamMuted, marginBottom: 48, maxWidth: 680 }}>
        This practice has two parts. First, you'll surface what you actually want more of in your life &mdash; and what you want less of. Then you'll design one small experiment to test moving in that direction this week.
      </p>

      {/* Step 1 */}
      <div style={{ background: C.bgCard, borderLeft: `3px solid ${C.sage}`, borderRadius: 4, padding: 36, marginBottom: 24 }}>
        <div style={{ ...eyebrow, marginBottom: 12 }}>Step 1 &middot; About 20 minutes</div>
        <h2 style={{ ...heading(32), marginBottom: 14 }}>Five Lives</h2>
        <p style={{ fontFamily: F.serif, fontStyle: 'italic', fontSize: 18, lineHeight: 1.55, color: C.cream, marginBottom: 24, maxWidth: 600 }}>
          Imagine five different lives you might have lived. What surfaces tells you what you want more of, and where the gap is between how you're living and what you long for.
        </p>
        <button onClick={() => navigate('five-lives')} style={btn('primary')} onMouseEnter={btnHoverIn} onMouseLeave={btnHoverOut}>
          Start with Five Lives
        </button>
      </div>

      {/* Step 2 */}
      <div style={{ background: 'rgba(42, 71, 68, 0.5)', border: `1px solid ${C.line}`, borderLeft: `3px solid ${C.sageMuted}`, borderRadius: 4, padding: 36, marginBottom: 24 }}>
        <div style={{ ...eyebrow, color: C.creamMuted, marginBottom: 12 }}>Step 2 &middot; About 10 minutes</div>
        <h2 style={{ ...heading(32), marginBottom: 14 }}>Smallest Viable Experiment</h2>
        <p style={{ fontFamily: F.serif, fontStyle: 'italic', fontSize: 18, lineHeight: 1.55, color: C.cream, marginBottom: 24, maxWidth: 600 }}>
          Take what surfaced in Five Lives and design one tiny move to test this week. Not a plan. Not a goal. The smallest thing that would give you real data about what you actually want.
        </p>
        <button onClick={() => navigate('smallest-viable-experiment')} style={btn('secondary')}>
          Open Smallest Viable Experiment
        </button>
      </div>

      <p style={{ fontSize: 14, color: C.creamMuted, lineHeight: 1.7, marginTop: 32, fontStyle: 'italic', maxWidth: 600 }}>
        The two parts work best done in order, with a day or two between them. Five Lives surfaces signal; Smallest Viable Experiment turns the signal into a move you can actually make.
      </p>
    </main>
  );
}
