import React, { useState } from 'react';
import { C, F } from '../theme.js';
import { eyebrow, heading } from '../styles.js';
import { useAppNavigate } from '../lib/useAppNavigate.js';
import SEO from '../components/SEO.jsx';

// Per-category card background + hover, pulled from the theme (mirrors CategoryCard).
const VARIANT_BG = {
  self: { base: C.bgCardSelf, hover: C.bgCardSelfHover },
  team: { base: C.bgCardTeam, hover: C.bgCardTeamHover },
  org:  { base: C.bgCardOrg,  hover: C.bgCardOrgHover },
};

// Tools-page voice: each card says what the tool DOES (the home page says what
// problem it solves). Eyebrow = the action; display names may differ from a
// tool's own page title by design (e.g. "Many Lives" -> purpose-small-moves).
const CATS = [
  {
    variant: 'self', label: 'Inward', name: 'Live Well',
    tools: [
      { eyebrow: 'Look Back', name: 'Three Moments', live: true, to: 'three-moments',
        description: 'This exercise brings to mind the pivotal, shaping moments in our life, and gives you a solid understanding of who you are and how much you have grown' },
      { eyebrow: 'Drop the Mask', name: 'Identity Box', live: true, to: 'identity-box',
        description: 'We all spend energy to make sure others view us in a good light. This exercise shows you how you do this, and the hidden costs it might have' },
      { eyebrow: 'Explore The Future', name: 'Many Lives', live: true, to: 'purpose-small-moves',
        description: 'Picture multiple lives, find the breadcrumbs leading to who you want to be next, and take a small step to get there' },
      { eyebrow: 'Use Your Emotions', name: 'Emotions as Information', live: true, to: 'emotions-as-information',
        description: "Learn how our ability to feel and think evolved, and discover your 'default' settings of engaging with the world... and a few other options that could come in handy." },
      { eyebrow: '', name: 'State Check', live: false, description: '' },
    ],
  },
  {
    variant: 'team', label: 'Outward', name: 'Face What Is',
    tools: [
      { eyebrow: 'Gather Perspectives', name: 'Many Mirrors', live: true, to: 'many-mirrors',
        description: 'Ask the people who know you how you are showing up and where you could improve' },
      { eyebrow: 'Assess Yourself', name: 'Understanding your Leadership Circle Profile', live: true, to: 'lcp',
        description: 'Make sense of your LCP results' },
      { eyebrow: 'Improve Ideas', name: 'Creative Collision', live: true, to: 'creative-collision',
        description: 'Gather opposing perspectives to make your idea even better' },
      { eyebrow: 'Poll the Group', name: 'Open Facilitation', live: true, to: 'facilitate-your-way',
        description: 'Quickly poll your group - using any questions you choose - and use AI to see where you are aligned and diverge' },
      { eyebrow: 'Map the Challenge', name: 'Challenge Mapper', live: true, to: 'challenge-mapper',
        description: 'Get a better grip on one of your bigger challenges, and figure out new ways to tackle it' },
    ],
  },
  {
    variant: 'org', label: 'Onward', name: 'Lead Well',
    tools: [
      { eyebrow: 'Circumvent Failure', name: 'Pre-Mortem', live: true, to: 'pre-mortem',
        description: 'Imagine failure before it happens, so you can prevent it' },
      { eyebrow: 'Set a Direction', name: 'Culture Change Vision', live: true, to: 'vision',
        description: 'Refine or build a compelling case for change' },
      { eyebrow: 'Take Stock', name: 'Culture Readiness Assessment', live: true, to: 'readiness',
        description: 'Take stock of what your team needs to successfully change its culture' },
      { eyebrow: '', name: 'The Squeeze', live: false, description: '' },
      { eyebrow: '', name: 'Post-Mortem', live: false, description: '' },
    ],
  },
];

const ROWS = Math.max(...CATS.map((c) => c.tools.length));
const BOX_H = 244;

const LOCAL_CSS = `
  .tk-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
  @media (max-width: 760px) { .tk-grid { grid-template-columns: 1fr; } }
  .tk-clamp { display: -webkit-box; -webkit-line-clamp: 5; -webkit-box-orient: vertical; overflow: hidden; }
`;

function ToolBox({ tool, bg, navigate }) {
  const [hover, setHover] = useState(false);
  const clickable = tool.live;
  return (
    <div
      onClick={() => { if (clickable) navigate(tool.to); }}
      onMouseEnter={() => clickable && setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        height: BOX_H,
        background: hover ? bg.hover : bg.base,
        border: `1px solid ${hover ? C.lineStrong : C.line}`,
        borderRadius: 4,
        padding: '20px 22px',
        display: 'flex',
        flexDirection: 'column',
        cursor: clickable ? 'pointer' : 'default',
        opacity: clickable ? 1 : 0.5,
        transition: 'all 0.3s ease',
      }}
    >
      {/* eyebrow slot reserved even when empty so names align across a row */}
      <div style={{ ...eyebrow, fontSize: 10, letterSpacing: '0.22em', fontWeight: 500, height: 15, marginBottom: 8 }}>
        {tool.eyebrow || '\u00A0'}
      </div>
      <h3 style={{ ...heading(20), fontWeight: 500, marginBottom: 9, color: C.cream }}>{tool.name}</h3>
      <p className="tk-clamp" style={{ fontFamily: F.sans, fontWeight: 300, fontSize: 13.5, lineHeight: 1.5, color: C.creamMuted, margin: 0, flexGrow: 1 }}>
        {tool.description}
      </p>
      <div style={{ marginTop: 10, fontFamily: F.sans, fontSize: 10.5, letterSpacing: '0.18em', textTransform: 'uppercase', color: tool.live ? C.sage : C.creamMuted }}>
        {tool.live ? 'Open tool →' : 'Coming soon'}
      </div>
    </div>
  );
}

export default function ToolkitPage() {
  const navigate = useAppNavigate();

  const cells = [];
  CATS.forEach((c, i) => cells.push(
    <div key={`h${i}`} style={{ paddingBottom: 16, borderBottom: `1px solid ${C.line}`, marginBottom: 4 }}>
      <div style={{ ...eyebrow, marginBottom: 8 }}>{c.label}</div>
      <h2 style={{ ...heading(30), margin: 0 }}>{c.name}</h2>
    </div>
  ));
  for (let r = 0; r < ROWS; r++) {
    CATS.forEach((c, i) => {
      const t = c.tools[r];
      const bg = VARIANT_BG[c.variant];
      cells.push(t
        ? <ToolBox key={`${i}-${r}`} tool={t} bg={bg} navigate={navigate} />
        : <div key={`${i}-${r}`} style={{ height: BOX_H }} />);
    });
  }

  return (
    <main style={{ animation: 'fadeIn 0.4s ease', minHeight: '80vh', padding: '60px 6vw 90px', maxWidth: 1400, margin: '0 auto' }}>
      <SEO
        title="The Toolkit | InciteU"
        description="Every InciteU tool in one place — tools for living well and leading well, organized inward, outward, and onward."
        path="/tools"
      />
      <style>{LOCAL_CSS}</style>

      <div style={{ textAlign: 'center', marginBottom: 52 }}>
        <div style={{ ...eyebrow, marginBottom: 14 }}>The Toolkit</div>
        <h1 style={{ ...heading(60), margin: 0 }}>Every tool, in one place</h1>
      </div>

      <div className="tk-grid">{cells}</div>
    </main>
  );
}
