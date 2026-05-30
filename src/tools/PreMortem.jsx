import React from 'react';
import { C, F } from '../theme.js';
import { btn, btnHoverIn, btnHoverOut, eyebrow, heading } from '../styles.js';
import { useAppNavigate } from '../lib/useAppNavigate.js';
import SEO from '../components/SEO.jsx';
import ToolFeedback from '../components/ToolFeedback.jsx';

const PREMORTEM_URL = 'https://claude.ai/public/artifacts/b6fdfb33-8a4a-4237-b58d-0f24d5cb814e';

export default function PreMortemPage() {
  const navigate = useAppNavigate();

  return (
    <main style={{ animation: 'fadeIn 0.4s ease', minHeight: '80vh', padding: '60px 6vw 80px', maxWidth: 760, margin: '0 auto' }}>
      <SEO
        title="Pre-Mortem Tool: Surface Project Risks Before They Happen | InciteU"
        description="A pre-mortem is a strategic exercise where a team imagines a project has failed, then works backward to determine why. Free interactive tool. Solo or with a team."
        path="/tools/team/pre-mortem"
      />
      <a onClick={(e) => { e.preventDefault(); navigate('home'); }} href="#"
         style={{ display: 'inline-block', color: C.creamMuted, textDecoration: 'none', fontSize: 12, letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 40, cursor: 'pointer' }}>
        ← Back to tools
      </a>

      <div style={{ ...eyebrow, marginBottom: 12 }}>A Team tool</div>
      <h1 style={{ ...heading(60), marginBottom: 28 }}>
        The <em style={{ color: C.sage, fontStyle: 'italic' }}>Premortem</em>.
      </h1>

      <p style={{ fontFamily: F.serif, fontSize: 22, lineHeight: 1.55, color: C.cream, marginBottom: 24, maxWidth: 640 }}>
        A premortem is a strategic exercise where a team imagines a future project has failed, then works backward to determine why — enabling them to identify risks and prevent failures before they occur.
      </p>

      <p style={{ fontSize: 15, lineHeight: 1.7, color: C.creamMuted, maxWidth: 600, marginBottom: 36 }}>
        This exercise breaks groupthink, reduces overconfidence, and surfaces hidden worries — all before the project launches, so there is time to adapt and avoid foreseeable pitfalls.
      </p>

      <div style={{ background: C.bgCard, borderLeft: `3px solid ${C.sage}`, borderRadius: 4, padding: '24px 28px', marginBottom: 40 }}>
        <p style={{ fontFamily: F.serif, fontStyle: 'italic', fontSize: 18, color: C.cream, lineHeight: 1.6 }}>
          This tool can be used <em style={{ color: C.sage }}>alone or with a team</em>.
        </p>
      </div>

      <h3 style={{ fontFamily: F.serif, fontSize: 28, color: C.cream, marginBottom: 20, marginTop: 56, fontWeight: 400 }}>
        How this tool works
      </h3>
      <ol style={{ paddingLeft: 0, listStyle: 'none', margin: '0 0 40px' }}>
        {[
          { step: '01', text: "Imagine the project has already failed. Not 'might fail' — has failed. Specific, vivid, real." },
          { step: '02', text: "Working backward from that failure, surface every reason it could have gone wrong. The premortem prompts you through the categories most teams miss." },
          { step: '03', text: "Get a structured set of risks, hidden worries, and the early signals to watch for — ready to bring back to your team or sit with on your own." },
        ].map((row, i, arr) => (
          <li key={i} style={{ display: 'flex', gap: 20, padding: '18px 0', borderBottom: i < arr.length - 1 ? `1px solid ${C.line}` : 'none' }}>
            <div style={{ fontFamily: F.sans, fontSize: 13, color: C.sage, letterSpacing: '0.18em', flexShrink: 0, paddingTop: 2 }}>{row.step}</div>
            <div style={{ fontSize: 15, color: C.cream, lineHeight: 1.7 }}>{row.text}</div>
          </li>
        ))}
      </ol>

      <div style={{ display: 'flex', gap: 16, marginTop: 40, flexWrap: 'wrap' }}>
        <a href={PREMORTEM_URL} target="_blank" rel="noopener noreferrer"
           style={{ ...btn('primary'), textDecoration: 'none' }}
           onMouseEnter={btnHoverIn} onMouseLeave={btnHoverOut}>
          Open the Premortem tool ↗
        </a>
        <button onClick={() => navigate('home')} style={btn('secondary')}>Back to all tools</button>
      </div>

      <p style={{ fontSize: 12, color: C.creamMuted, marginTop: 28, fontStyle: 'italic', maxWidth: 540 }}>
        Opens in a new tab. The tool itself runs as a published Claude artifact.
      </p>
      <ToolFeedback
        formspreeId="mzdwwygz"
        toolName="Pre-Mortem"
        role="subject"
        initialQuestion="Did this tool help?"
        positivePrompt="What made it useful?"
        negativePrompt="What could have made it more useful?"
      />
    </main>
  );
}
