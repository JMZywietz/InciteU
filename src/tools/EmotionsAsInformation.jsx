import React from 'react';
import { C, F } from '../theme.js';
import { btn, btnHoverIn, btnHoverOut, eyebrow, heading } from '../styles.js';
import { useAppNavigate } from '../lib/useAppNavigate.js';
import SEO from '../components/SEO.jsx';

// ============================================================================
// Landing page for the paired Emotions practice:
//   Step 1 — Five Layers Deep (think piece: emotions as information)
//   Step 2 — Leadership Capacities Analysis (tool: apply it to your patterns)
// ============================================================================

export default function EmotionsAsInformationPage() {
  const navigate = useAppNavigate();

  return (
    <main style={{ animation: 'fadeIn 0.4s ease', minHeight: '80vh', padding: '60px 6vw 80px', maxWidth: 820, margin: '0 auto' }}>
      <SEO
        title="Emotions as Information: A Paired Practice for Leaders | InciteU"
        description="A think piece and a tool. Five Layers Deep shows what emotions carry; the Leadership Capacities Analysis helps you apply it to your own patterns."
        path="/tools/self/emotions-as-information"
      />
      <a onClick={(e) => { e.preventDefault(); navigate('home'); }} href="#"
         style={{ display: 'inline-block', color: C.creamMuted, textDecoration: 'none', fontSize: 12, letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 40, cursor: 'pointer' }}>
        ← Back to tools
      </a>

      <div style={{ ...eyebrow, marginBottom: 12 }}>A think piece, then a tool</div>
      <h1 style={{ ...heading(56), marginBottom: 24 }}>Emotions as <em style={{ color: C.sage, fontStyle: 'italic' }}>information</em>.</h1>
      <p style={{ fontFamily: F.serif, fontSize: 22, lineHeight: 1.55, color: C.cream, marginBottom: 20, maxWidth: 680 }}>
        Emotions are the brain's fastest way of thinking. They're loud and uncomfortable, so we tend to suppress them or spew them. There's a third option: mine them for what they're telling you.
      </p>
      <p style={{ fontSize: 16, lineHeight: 1.75, color: C.creamMuted, marginBottom: 48, maxWidth: 680 }}>
        Read this short think piece first &mdash; it lays out what emotions actually carry beneath the surface. Then use the Leadership Capacities Analysis to look at how your particular patterns show up at work.
      </p>

      {/* Step 1 */}
      <div style={{ background: C.bgCard, borderLeft: `3px solid ${C.sage}`, borderRadius: 4, padding: 36, marginBottom: 24 }}>
        <div style={{ ...eyebrow, marginBottom: 12 }}>Step 1 &middot; Read first &middot; About 10 minutes</div>
        <h2 style={{ ...heading(32), marginBottom: 14 }}>Five Layers Deep</h2>
        <p style={{ fontFamily: F.serif, fontStyle: 'italic', fontSize: 18, lineHeight: 1.55, color: C.cream, marginBottom: 24, maxWidth: 600 }}>
          A short think piece on how emotions carry information &mdash; and what's hiding under the loudest layer. The framework you'll use in the next step.
        </p>
        <button onClick={() => navigate('five-layers-deep')} style={btn('primary')} onMouseEnter={btnHoverIn} onMouseLeave={btnHoverOut}>
          Read Five Layers Deep
        </button>
      </div>

      {/* Step 2 */}
      <div style={{ background: 'rgba(42, 71, 68, 0.5)', border: `1px solid ${C.line}`, borderLeft: `3px solid ${C.sageMuted}`, borderRadius: 4, padding: 36, marginBottom: 24 }}>
        <div style={{ ...eyebrow, color: C.creamMuted, marginBottom: 12 }}>Step 2 &middot; About 20 minutes</div>
        <h2 style={{ ...heading(32), marginBottom: 14 }}>Leadership Capacities Analysis</h2>
        <p style={{ fontFamily: F.serif, fontStyle: 'italic', fontSize: 18, lineHeight: 1.55, color: C.cream, marginBottom: 24, maxWidth: 600 }}>
          Apply the Five Layers framework to your own patterns. What's the emotion saying? What's underneath? What capacity is the situation asking you to grow?
        </p>
        <button onClick={() => navigate('leadership-capacities')} style={btn('secondary')}>
          Open Leadership Capacities Analysis
        </button>
      </div>

      <p style={{ fontSize: 14, color: C.creamMuted, lineHeight: 1.7, marginTop: 32, fontStyle: 'italic', maxWidth: 600 }}>
        The think piece is short but worth reading slowly. The tool makes much more sense once the framework is in your head.
      </p>
    </main>
  );
}
