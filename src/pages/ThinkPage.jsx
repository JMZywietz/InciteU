import React from 'react';
import { C, F } from '../theme.js';
import { eyebrow, heading } from '../styles.js';
import { useAppNavigate } from '../lib/useAppNavigate.js';

// ============================================================================
// DATA — index of think pieces; add new entries here as they're written
// ============================================================================
const THINK_PIECES = [
  {
    id: 'cynefin',
    title: 'The Cynefin Framework',
    subtitle: 'Not all problems are created equal',
    abstract: 'A visual walkthrough of the Cynefin framework \u2014 from predictable to unpredictable, from holiday dinners to organizational challenges. Learn to see which parts of your challenge need expertise, which need experimentation, and which just need you to act.',
    readTime: '6 min read',
    accent: '#C5D49B',
  },
  {
    id: 'five-layers-deep',
    title: 'Five Layers Deep',
    subtitle: 'The evolutionary roots of how you think, connect, and lead',
    abstract: 'A biological view of complexity. How humans evolved from single-celled organisms to creatures who can hold meaning, and how each layer of new capacity unlocked more advanced ways to connect, protect, and \u2014 when we are at our best \u2014 to serve a future bigger than ourselves.',
    readTime: '8 min read',
    accent: '#E8C87A',
  },
];

export default function ThinkPage() {
  const navigate = useAppNavigate();
  return (
    <main style={{ animation: 'fadeIn 0.4s ease', minHeight: '80vh', padding: '80px 6vw', maxWidth: 820, margin: '0 auto' }}>
      <div style={{ ...eyebrow, marginBottom: 16 }}>Think</div>
      <h1 style={{ ...heading(72), fontSize: 'clamp(40px, 6vw, 72px)', marginBottom: 32 }}>
        Frames I keep <em style={{ color: C.sage, fontStyle: 'italic' }}>coming back to</em>.
      </h1>
      <p style={{ fontFamily: F.serif, fontSize: 22, lineHeight: 1.55, color: C.cream, marginBottom: 24, maxWidth: 640 }}>
        The tools on this site are for working <em style={{ color: C.sage, fontStyle: 'italic' }}>on</em> something. The pieces here are for thinking <em style={{ color: C.sage, fontStyle: 'italic' }}>about</em> something.
      </p>
      <p style={{ fontSize: 15, lineHeight: 1.7, color: C.creamMuted, maxWidth: 600, marginBottom: 64 }}>
        Models, frames, and ways of seeing that I find myself returning to in my work with senior leaders. Some are mine. Some I've borrowed and reshaped. All are offered the same way the tools are: free, with the request that you put them to good use.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        {THINK_PIECES.map((piece) => (
          <a key={piece.id} onClick={(e) => { e.preventDefault(); navigate(piece.id); }} href="#"
             style={{ display: 'block', background: C.bgCard, borderRadius: 4, padding: '36px 36px', textDecoration: 'none', color: 'inherit', borderLeft: `3px solid ${piece.accent || C.sage}`, transition: 'background 0.3s, transform 0.3s', cursor: 'pointer' }}
             onMouseEnter={(e) => { e.currentTarget.style.background = C.bgCardHover; e.currentTarget.style.transform = 'translateX(4px)'; }}
             onMouseLeave={(e) => { e.currentTarget.style.background = C.bgCard; e.currentTarget.style.transform = 'translateX(0)'; }}>
            <div style={{ ...eyebrow, marginBottom: 10, fontSize: 10 }}>{piece.readTime}</div>
            <h2 style={{ fontFamily: F.serif, fontSize: 32, color: C.cream, marginBottom: 8, fontWeight: 400, lineHeight: 1.15 }}>{piece.title}</h2>
            <p style={{ fontFamily: F.serif, fontStyle: 'italic', fontSize: 18, color: piece.accent || C.sage, marginBottom: 16, lineHeight: 1.4 }}>{piece.subtitle}</p>
            <p style={{ fontSize: 15, color: C.creamMuted, lineHeight: 1.7, marginBottom: 16 }}>{piece.abstract}</p>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: piece.accent || C.sage, fontFamily: F.sans, fontSize: 12, letterSpacing: '0.18em', textTransform: 'uppercase' }}>
              Read <span>→</span>
            </span>
          </a>
        ))}
      </div>

      <div style={{ marginTop: 80, padding: '36px 0', borderTop: `1px solid ${C.line}`, textAlign: 'center' }}>
        <p style={{ fontFamily: F.serif, fontSize: 19, color: C.creamMuted, fontStyle: 'italic', lineHeight: 1.6, maxWidth: 540, margin: '0 auto' }}>
          More pieces will be added as they're written. There's no schedule. They arrive when they're ready.
        </p>
      </div>
    </main>
  );
}
