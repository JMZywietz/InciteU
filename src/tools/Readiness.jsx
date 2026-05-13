import React from 'react';
import { C, F } from '../theme.js';
import { eyebrow, heading } from '../styles.js';
import { PATHS } from '../lib/routes.js';

// ============================================================================
// READINESS — splash redirect
// ============================================================================
// The real Readiness tool now lives inside the Culture Change Model sub-app
// (src/apps/CultureChangeModel.jsx). This standalone page exists only as a
// landing on the canonical /tools/org/readiness URL — anyone arriving here
// from older links, search results, or shares gets routed into the in-context
// version where the surrounding frame, case studies, and partner tools live.
//
// Internal link uses an absolute path with query string because the live tool
// is mounted at a different React Router route — useAppNavigate would also
// work, but a plain anchor keeps this file simple and lets the browser do its
// normal thing.
// ============================================================================

export default function ReadinessPage() {
  const targetPath = `${PATHS.cultureChangeModel}?section=tools&tool=readiness`;
  return (
    <main style={{ animation: 'fadeIn 0.4s ease', minHeight: '70vh', padding: '120px 6vw 80px', maxWidth: 720, margin: '0 auto' }}>
      <div style={{ ...eyebrow, marginBottom: 16 }}>Readiness self-assessment</div>
      <h1 style={{ ...heading(56), fontSize: 'clamp(34px, 5vw, 56px)', marginBottom: 24 }}>
        How ready are we, <em style={{ color: C.sage, fontStyle: 'italic' }}>really</em>?
      </h1>
      <p style={{ fontFamily: F.serif, fontSize: 20, lineHeight: 1.55, color: C.cream, marginBottom: 20, maxWidth: 580 }}>
        Eighteen statements across six dimensions. A mirror, not a test.
      </p>
      <p style={{ fontSize: 15, lineHeight: 1.7, color: C.creamMuted, maxWidth: 560, marginBottom: 48 }}>
        The Readiness self-assessment now lives inside the Culture Change Model — the surrounding frame, case studies, and partner tools give the results somewhere to land.
      </p>
      <a
        href={targetPath}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 10,
          background: C.sage,
          color: C.bgDeep,
          padding: '16px 32px',
          borderRadius: 4,
          textDecoration: 'none',
          fontFamily: F.sans,
          fontSize: 13,
          letterSpacing: '0.10em',
          textTransform: 'uppercase',
          fontWeight: 500,
          transition: 'transform 0.2s, box-shadow 0.2s',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}
      >
        Open the Readiness tool <span>→</span>
      </a>
      <p style={{ marginTop: 36, fontSize: 13, color: C.creamMuted, fontStyle: 'italic', lineHeight: 1.6, maxWidth: 520 }}>
        Solo, join a group, or run a group — same assessment, different things to do with the results.
      </p>
    </main>
  );
}
