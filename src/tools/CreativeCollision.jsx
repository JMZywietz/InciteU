import React, { useState, useEffect, useRef } from 'react';
import { C as baseC, F } from '../theme.js';
import { useAppNavigate } from '../lib/useAppNavigate.js';
import { synthesize, extractText } from '../lib/synthesize.js';
import * as ccStorage from '../lib/ccStorage.js';

// =============================================================================
// CREATIVE COLLISION — InciteU team tool
// Ported from the standalone Claude artifact. Multiplayer via Upstash Redis
// behind /api/cc-storage. Synthesis via /api/synthesize. Style discipline:
// extends the website's `C` palette with a local dark-mahogany override so CC
// has its own room-tone — same pattern Cynefin and Challenge Mapper use.
// =============================================================================

// ----- Palette + fonts (CC sits in dark mahogany/cinnamon — distinct from the website's dark teal-green) -----
// Website's tools live on a dark teal-green base. Creative Collision deliberately
// claims its own room-tone: deep mahogany backdrop, cinnamon cards, autumn-warm.
// Solo cards use a warm muted brown (calm, internal); team cards use a deep oxblood
// red-brown (collaborative, grounded) — clearly distinct hue regions, both rich
// rather than muddy. The "sage" key is preserved for code-stability but now
// holds an amber-gold value, in-palette with the warm room.
const C = {
  ...baseC,
  bgDeep: '#2E1A10',           // deep mahogany — the room
  bgCard: '#3D2618',           // cinnamon — default card lift
  bgCardHover: '#4D3220',      // hover

  // Per-mode card backgrounds — distinct hue regions, both intentional
  bgCardSelf: '#3D2820',       // solo — warm muted brown; "internal" feeling
  bgCardSelfHover: '#4D382E',
  bgCardTeam: '#4A1F18',       // team — deep oxblood / red-brown; rich, not muddy
  bgCardTeamHover: '#5A2A22',

  cream: '#F0EBDB',
  creamMuted: '#C9C2AE',

  // Primary accent — amber-gold (replaces the original sage green; lives in-palette
  // with the warm room). Variable name kept as "sage" for code-stability across the file.
  sage: '#E8C97B',
  sageMuted: '#B89D5A',
  sageDim: '#8B7642',

  // Translucent rule colours
  line: 'rgba(240, 235, 219, 0.12)',
  lineStrong: 'rgba(240, 235, 219, 0.25)',

  // Semantic accents — all warm-compatible
  warning: '#E2A57E',
  good: '#9FBE7F',             // green stays as the "tested / positive" semantic marker
  okay: '#D4B96E',
  needsWork: '#D88A7A',

  // Team accent (warm clay) — harmonizes within the orange family
  collab: '#D8B07C',
  collabMuted: '#A8845A',
  collabDim: '#7E6342',
};

// Mode-aware accent: solo uses the brand sage; team modes (contribute/facilitate)
// use the warm-clay collab tone to visually signal "this is a group experience."
const accentFor = (mode) => (mode === 'contribute' || mode === 'facilitate') ? C.collab : C.sage;
const accentMutedFor = (mode) => (mode === 'contribute' || mode === 'facilitate') ? C.collabMuted : C.sageMuted;
const accentDimFor = (mode) => (mode === 'contribute' || mode === 'facilitate') ? C.collabDim : C.sageDim;

// de Bono Six Thinking Hats — warm-palette-compatible color mapping for missing-mode chips
const HAT_COLORS = {
  white: '#E8E2D4', yellow: '#E8C97B', black: '#6B5E4F',
  red: '#D88A7A', green: '#9FBE7F', blue: '#7AA5A0',
};
const hatColorFor = (hat) => HAT_COLORS[(hat || '').toLowerCase()] || C.creamMuted;


// ----- Style helpers (mirrors src/styles.js exactly) -----
const btn = (variant = 'primary', disabled = false) => ({
  display: 'inline-block',
  background: 'transparent',
  color: disabled ? C.creamMuted : (variant === 'secondary' ? C.creamMuted : C.sage),
  textDecoration: 'none',
  fontFamily: F.sans,
  fontSize: 13,
  fontWeight: 400,
  letterSpacing: '0.2em',
  textTransform: 'uppercase',
  padding: '14px 32px',
  border: `1px solid ${disabled ? C.line : (variant === 'secondary' ? C.line : C.sageMuted)}`,
  borderRadius: 2,
  cursor: disabled ? 'not-allowed' : 'pointer',
  transition: 'all 0.3s ease',
  opacity: disabled ? 0.4 : 1,
});

const btnHoverIn = (e) => {
  if (e.currentTarget.dataset.disabled === 'true') return;
  e.currentTarget.style.background = C.sage;
  e.currentTarget.style.color = C.bgDeep;
  e.currentTarget.style.borderColor = C.sage;
};
const btnHoverOut = (e) => {
  if (e.currentTarget.dataset.disabled === 'true') return;
  e.currentTarget.style.background = 'transparent';
  e.currentTarget.style.color = C.sage;
  e.currentTarget.style.borderColor = C.sageMuted;
};
const btnSecondaryHoverIn = (e) => {
  e.currentTarget.style.color = C.cream;
  e.currentTarget.style.borderColor = C.creamMuted;
};
const btnSecondaryHoverOut = (e) => {
  e.currentTarget.style.color = C.creamMuted;
  e.currentTarget.style.borderColor = C.line;
};

const heading = (size = 56) => ({
  fontFamily: F.serif,
  fontWeight: 400,
  fontSize: size,
  color: C.cream,
  lineHeight: 1.1,
  letterSpacing: '-0.01em',
  margin: 0,
});

const eyebrow = {
  fontFamily: F.sans,
  fontSize: 11,
  letterSpacing: '0.3em',
  textTransform: 'uppercase',
  color: C.sage,
};

const fieldLabel = {
  display: 'block',
  fontFamily: F.sans,
  fontSize: 13,
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  color: C.sage,
  marginBottom: 12,
};

const fieldInput = {
  width: '100%',
  background: C.bgCard,
  border: `1px solid ${C.line}`,
  color: C.cream,
  padding: '16px 18px',
  fontFamily: F.sans,
  fontSize: 16,
  lineHeight: 1.6,
  borderRadius: 4,
  transition: 'border-color 0.3s',
  resize: 'vertical',
};

const cardStyle = {
  background: C.bgCard,
  border: `1px solid ${C.line}`,
  borderRadius: 6,
  padding: 24,
};

// =============================================================================
// HELPERS
// =============================================================================

const SESSION_WORDS = [
  'forge', 'spark', 'lean', 'draft', 'thread', 'pivot', 'frame', 'tend',
  'crest', 'tilt', 'rise', 'level', 'bridge', 'mend', 'hold', 'shape',
  'gather', 'sketch', 'weave', 'kindle', 'name', 'cross', 'gauge', 'trace',
];

function generateSessionCode() {
  const word = SESSION_WORDS[Math.floor(Math.random() * SESSION_WORDS.length)];
  const num = String(Math.floor(1000 + Math.random() * 9000));
  return `${word}-${num}`;
}

function escapeHTML(s) {
  if (s == null) return '';
  return String(s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

// ----- Storage wrappers (delegate to ccStorage / Upstash Redis) -----
// The standalone artifact used window.storage; the InciteU port uses
// /api/cc-storage. Interface preserved so call sites need no changes.
async function storageGet(key) {
  return await ccStorage.get(key);
}
async function storageSet(key, value) {
  return await ccStorage.set(key, value);
}
async function storageList(prefix) {
  return await ccStorage.list(prefix);
}

// ----- API call (via InciteU /api/synthesize proxy) -----
async function callClaude(prompt, maxTokens = 2500) {
  const data = await synthesize({
    model: 'claude-sonnet-4-5',
    max_tokens: maxTokens,
    messages: [{ role: 'user', content: prompt }],
  });
  const text = extractText(data);
  return (text || '').trim();
}

function parseJSONLoose(raw) {
  if (!raw) return null;
  let s = raw.trim();
  // Strip markdown fences
  s = s.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim();
  // Trim to outermost { ... } if there's preamble
  const first = s.indexOf('{');
  const last = s.lastIndexOf('}');
  if (first > 0 && last > first) s = s.slice(first, last + 1);
  try {
    return JSON.parse(s);
  } catch (e) {
    return null;
  }
}

// ----- .doc download (same pattern as Pre-Mortem: HTML wrapped, saved as .doc Blob) -----
function downloadDoc(filenameBase, htmlBody) {
  const html = `<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
<head><meta charset="utf-8"><title>${escapeHTML(filenameBase)}</title>
<style>
  body { font-family: Georgia, 'Times New Roman', serif; color: #1F3937; line-height: 1.6; max-width: 720px; margin: 40px auto; padding: 0 24px; }
  h1 { font-size: 32px; font-weight: normal; color: #1F3937; margin: 0 0 8px; }
  h2 { font-size: 20px; font-weight: normal; color: #6B8159; margin: 32px 0 8px; border-bottom: 1px solid #C9C2AE; padding-bottom: 4px; }
  h3 { font-size: 16px; font-weight: 600; color: #2A4744; margin: 20px 0 6px; }
  .eyebrow { font-family: Arial, sans-serif; font-size: 11px; letter-spacing: 0.3em; text-transform: uppercase; color: #8FA876; margin: 0 0 12px; }
  .meta { color: #8a8a8a; font-size: 12px; margin-bottom: 24px; }
  .italic { font-style: italic; color: #6B8159; }
  .callout { border-left: 3px solid #8FA876; padding: 8px 14px; margin: 14px 0; background: #f6f3eb; }
  p { margin: 8px 0; }
  ul { margin: 8px 0; padding-left: 22px; }
  li { margin: 4px 0; }
  .divider { border-top: 1px solid #C9C2AE; margin: 24px 0; }
</style></head>
<body>
${htmlBody}
</body></html>`;
  const blob = new Blob([html], { type: 'application/msword' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filenameBase}.doc`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// =============================================================================
// SHARED UI BITS
// =============================================================================

function BackLink({ onClick, label = '← Back' }) {
  return (
    <a onClick={(e) => { e.preventDefault(); onClick(); }} href="#"
      style={{
        display: 'inline-block', color: C.creamMuted, textDecoration: 'none',
        fontSize: 12, letterSpacing: '0.18em', textTransform: 'uppercase',
        marginBottom: 36, cursor: 'pointer', fontFamily: F.sans,
      }}
      onMouseEnter={(e) => { e.currentTarget.style.color = C.cream; }}
      onMouseLeave={(e) => { e.currentTarget.style.color = C.creamMuted; }}
    >{label}</a>
  );
}

function FacilitatorBadge() {
  return (
    <span style={{
      display: 'inline-block', background: C.sage, color: C.bgDeep,
      fontFamily: F.sans, fontSize: 10, fontWeight: 500,
      letterSpacing: '0.22em', textTransform: 'uppercase',
      padding: '5px 12px', borderRadius: 999,
    }}>Facilitator</span>
  );
}

function SessionCodeChip({ code }) {
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'baseline', gap: 10,
      background: 'rgba(232, 201, 123, 0.08)', border: `1px solid ${C.sageDim}`,
      padding: '14px 22px', borderRadius: 4,
    }}>
      <span style={{ ...eyebrow, fontSize: 10 }}>Session</span>
      <span style={{ fontFamily: F.serif, fontSize: 26, color: C.cream, letterSpacing: '0.04em' }}>{code}</span>
    </div>
  );
}

function ProgressBar({ phase, mode }) {
  // Solo/Facilitator see all phases; Contributors don't see this
  if (mode === 'contribute') return null;
  const accent = accentFor(mode);
  const steps = [
    { id: 'frame', label: 'Frame' },
    { id: 'reads', label: 'Diverge' },
    { id: 'synthesis', label: 'Synthesize' },
    { id: 'collision', label: 'Collide' },
    { id: 'forge', label: 'Forge' },
    { id: 'decision', label: 'Decide' },
    { id: 'results', label: 'Move' },
  ];
  const idx = steps.findIndex((s) => s.id === phase);
  if (idx < 0) return null;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 48, flexWrap: 'wrap', rowGap: 12 }}>
      {steps.map((s, i) => {
        const done = i < idx;
        const active = i === idx;
        return (
          <React.Fragment key={s.id}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 22, height: 22, borderRadius: '50%',
                background: done ? accent : 'transparent',
                border: `1px solid ${done || active ? accent : C.line}`,
                color: done ? C.bgDeep : (active ? accent : C.creamMuted),
                fontSize: 11, fontFamily: F.sans, fontWeight: 500,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>{done ? '✓' : i + 1}</div>
              <span style={{
                fontFamily: F.sans, fontSize: 11, letterSpacing: '0.18em',
                textTransform: 'uppercase',
                color: active ? accent : (done ? C.creamMuted : C.creamMuted),
                opacity: done || active ? 1 : 0.5,
              }}>{s.label}</span>
            </div>
            {i < steps.length - 1 && (
              <div style={{
                flex: '0 0 28px', height: 1, background: done ? accent : C.line,
                margin: '0 12px', opacity: done ? 0.5 : 1,
              }} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

function LoadingState({ message = 'Working...' }) {
  return (
    <div style={{ textAlign: 'center', padding: '60px 0' }}>
      <p style={{ fontFamily: F.serif, fontStyle: 'italic', fontSize: 22, color: C.cream, marginBottom: 24 }}>
        {message}
      </p>
      <div style={{ position: 'relative', height: 1, background: C.line, maxWidth: 360, margin: '0 auto', overflow: 'hidden' }}>
        <div style={{
          position: 'absolute', top: 0, left: 0, height: 1, width: '30%',
          background: C.sage, animation: 'barSlide 1.6s ease-in-out infinite',
        }} />
      </div>
    </div>
  );
}

function ErrorBox({ message, onDismiss }) {
  if (!message) return null;
  return (
    <div style={{
      background: 'rgba(226, 165, 126, 0.08)',
      border: `1px solid ${C.warning}`, borderLeft: `3px solid ${C.warning}`,
      borderRadius: 4, padding: '16px 20px', marginBottom: 24,
      display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16,
    }}>
      <p style={{ margin: 0, color: C.cream, fontSize: 14, lineHeight: 1.6 }}>{message}</p>
      {onDismiss && (
        <button onClick={onDismiss} style={{
          background: 'transparent', border: 'none', color: C.creamMuted,
          cursor: 'pointer', fontSize: 18, padding: 0, lineHeight: 1,
        }}>×</button>
      )}
    </div>
  );
}

function PhaseShell({ children }) {
  return (
    <main style={{
      animation: 'fadeIn 0.5s ease', minHeight: '80vh',
      padding: '60px 24px 100px', maxWidth: 960, margin: '0 auto',
    }}>{children}</main>
  );
}

// =============================================================================
// LANDING + MODE CHOOSER
// =============================================================================

function Landing({ onChoose }) {
  const modes = [
    {
      id: 'solo',
      label: 'On my own',
      description: 'Think through a decision alone. The tool will play the roles of skeptic, implementer, frontline employee, and outside affected party — so you don\'t have to hold positions that aren\'t yours.',
      note: 'Fair note: research on dissent (Charlan Nemeth, Berkeley) shows authentic disagreement from real people shifts thinking more than role-played alternatives. Solo mode is the role-played version — useful for clarifying your own thinking. If you can run team mode, it\'ll be sharper.',
    },
    {
      id: 'contribute',
      label: 'Contributor (I have a session code)',
      description: 'A facilitator has shared a code with you. Submit your individual perspective on the decision — they\'ll pull everyone\'s perspectives together when the group is ready.',
    },
    {
      id: 'facilitate',
      label: 'Facilitator (I\'m running this for a team)',
      description: 'Set up a session, share the code, collect everyone\'s independent perspectives, then let the synthesis show you where the team actually disagrees before the conversation starts.',
    },
  ];
  return (
    <PhaseShell>
      <div style={{ ...eyebrow, marginBottom: 18 }}>A Team tool — by InciteU</div>
      <h1 style={{ ...heading(64), marginBottom: 24 }}>
        Creative <em style={{ color: C.sage, fontStyle: 'italic' }}>Collision</em>.
      </h1>
      <p style={{ fontFamily: F.serif, fontSize: 23, lineHeight: 1.5, color: C.cream, marginBottom: 22, maxWidth: 720, fontStyle: 'italic' }}>
        Before you decide — find out what the room actually thinks.
      </p>
      <p style={{ fontSize: 16, lineHeight: 1.7, color: C.creamMuted, maxWidth: 680, marginBottom: 14 }}>
        Creative Collision structures conversation so that disagreement leads to better, more creative, and more realistic decisions.
      </p>
      <p style={{ fontSize: 16, lineHeight: 1.7, color: C.creamMuted, maxWidth: 680, marginBottom: 14 }}>
        Most teams skip the part where they discover they disagree. They move from polite discussion to premature consensus, then wonder why execution falls apart.
      </p>
      <p style={{ fontSize: 16, lineHeight: 1.7, color: C.creamMuted, maxWidth: 680, marginBottom: 14 }}>
        Creative Collision structures the disagreement so the decision is real.
      </p>
      <p style={{ fontSize: 15, lineHeight: 1.7, color: C.cream, maxWidth: 680, marginBottom: 56, fontStyle: 'italic', borderLeft: `2px solid ${C.sageDim}`, paddingLeft: 16 }}>
        Fair warning: we know dissent produces better decisions, while consensus produces better feelings. Stick with us through the dissent so the consensus both feels good and <em style={{ fontStyle: 'italic', color: C.sage }}>is</em> good.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 720 }}>
        {modes.map((m) => {
          const isTeam = m.id === 'contribute' || m.id === 'facilitate';
          const cardAccent = isTeam ? C.collab : C.sage;
          const cardAccentMuted = isTeam ? C.collabMuted : C.sageMuted;
          const cardBg = isTeam ? C.bgCardTeam : C.bgCardSelf;
          const cardBgHover = isTeam ? C.bgCardTeamHover : C.bgCardSelfHover;
          return (
            <button
              key={m.id}
              onClick={() => onChoose(m.id)}
              style={{
                ...cardStyle,
                background: cardBg,
                textAlign: 'left',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                padding: '26px 28px',
                borderLeft: `3px solid ${cardAccent}`,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = cardBgHover;
                e.currentTarget.style.borderColor = cardAccentMuted;
                e.currentTarget.style.borderLeftColor = cardAccent;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = cardBg;
                e.currentTarget.style.borderColor = C.line;
                e.currentTarget.style.borderLeftColor = cardAccent;
              }}
            >
              <div style={{ ...eyebrow, fontSize: 10, marginBottom: 10, color: cardAccent }}>{isTeam ? 'Team mode' : 'Solo mode'}</div>
              <h3 style={{ fontFamily: F.serif, fontSize: 26, color: C.cream, margin: '0 0 10px', fontWeight: 400, letterSpacing: '-0.005em' }}>
                {m.label}
              </h3>
              <p style={{ fontSize: 14, lineHeight: 1.7, color: C.creamMuted, margin: m.note ? '0 0 12px' : 0 }}>{m.description}</p>
              {m.note && (
                <p style={{ fontSize: 12, lineHeight: 1.65, color: C.creamMuted, margin: 0, fontStyle: 'italic', paddingTop: 12, borderTop: `1px solid ${C.line}` }}>{m.note}</p>
              )}
            </button>
          );
        })}
      </div>

      <p style={{ fontSize: 12, color: C.creamMuted, fontStyle: 'italic', marginTop: 56, maxWidth: 600, lineHeight: 1.7 }}>
        Built on the work of Steven Johnson (<em style={{ fontStyle: 'italic' }}>Where Good Ideas Come From</em>, Riverhead, 2010) on creative collision as a generative force, and Charlan Nemeth (UC Berkeley, <em style={{ fontStyle: 'italic' }}>In Defense of Troublemakers</em>, Basic Books, 2018) on the value of authentic dissent in group cognition.
      </p>
      <p style={{ fontSize: 12, color: C.creamMuted, fontStyle: 'italic', marginTop: 12, maxWidth: 600, lineHeight: 1.7 }}>
        See also: <a href="https://www.mindsopen.co/our-thinking/high-performing-teams-the-dissent-advantage" target="_blank" rel="noopener noreferrer" style={{ color: C.sage, textDecoration: 'underline' }}>High Performing Teams: The Dissent Advantage</a> (MindsOpen) — a practitioner synthesis of dissent research applied to organizational teams.
      </p>
    </PhaseShell>
  );
}

// =============================================================================
// CONTRIBUTOR ENTRY (session code + name)
// =============================================================================

function ContributorEntry({ onContinue, onBack, prefilledCode }) {
  const [code, setCode] = useState(prefilledCode || '');
  const [name, setName] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setErr('');
    const c = code.trim().toLowerCase();
    const n = name.trim();
    if (!c) { setErr('Enter the session code your facilitator gave you.'); return; }
    if (!n) { setErr('Enter the name you\'d like to be identified by.'); return; }
    setBusy(true);
    const frame = await storageGet(`cc:${c}:frame`);
    setBusy(false);
    if (!frame) {
      setErr('I can\'t find a session with that code. Double-check it with your facilitator.');
      return;
    }
    onContinue({ code: c, name: n, frame });
  };

  return (
    <PhaseShell>
      <BackLink onClick={onBack} />
      <div style={{ ...eyebrow, marginBottom: 14 }}>Join a session</div>
      <h1 style={{ ...heading(42), marginBottom: 36 }}>
        {prefilledCode ? <>Joining <em style={{ color: C.sage, fontStyle: 'italic' }}>{prefilledCode}</em></> : 'Where are you joining?'}
      </h1>

      <ErrorBox message={err} onDismiss={() => setErr('')} />

      {!prefilledCode && (
        <div style={{ marginBottom: 26 }}>
          <label style={fieldLabel}>Session code</label>
          <input
            type="text" value={code} onChange={(e) => setCode(e.target.value)}
            placeholder="e.g. forge-4827"
            style={{ ...fieldInput, maxWidth: 360, fontSize: 18, letterSpacing: '0.04em' }}
            onFocus={(e) => { e.currentTarget.style.borderColor = C.sageMuted; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = C.line; }}
          />
        </div>
      )}
      <div style={{ marginBottom: 40 }}>
        <label style={fieldLabel}>Your name</label>
        <input
          type="text" value={name} onChange={(e) => setName(e.target.value)}
          placeholder="How should the facilitator see your perspective?"
          style={{ ...fieldInput, maxWidth: 480 }}
          onFocus={(e) => { e.currentTarget.style.borderColor = C.sageMuted; }}
          onBlur={(e) => { e.currentTarget.style.borderColor = C.line; }}
        />
        <p style={{ fontSize: 12, color: C.creamMuted, marginTop: 8, fontStyle: 'italic' }}>
          The facilitator and the synthesis will see your name beside your answers.
        </p>
      </div>

      <button
        onClick={submit} disabled={busy}
        style={btn('primary', busy)}
        data-disabled={busy ? 'true' : 'false'}
        onMouseEnter={btnHoverIn} onMouseLeave={btnHoverOut}
      >{busy ? 'Checking...' : 'Join session →'}</button>
    </PhaseShell>
  );
}

// =============================================================================
// PHASE 1: FRAME THE DECISION
// =============================================================================

const FRAME_FIELDS = [
  { id: 'decision', label: 'The decision or question', help: 'What are we actually deciding? One sentence is fine. Be specific.', rows: 3 },
  { id: 'locked', label: 'What\'s already been decided', help: 'What constraints are locked in? (Budget, timeline, who\'s involved, what\'s off the table.)', rows: 3 },
  { id: 'open', label: 'What\'s still open', help: 'What can we actually influence? This is where the real disagreement lives.', rows: 3 },
  { id: 'deciders', label: 'Who decides', help: 'Who has final authority on this? Name them.', rows: 2 },
  { id: 'affected', label: 'Who\'s affected', help: 'Who feels the consequences — especially those not in the room?', rows: 2 },
];

const TIME_OPTIONS = [
  { v: 'this-week', l: 'This week' },
  { v: 'this-month', l: 'This month' },
  { v: 'this-quarter', l: 'This quarter' },
  { v: 'no-deadline', l: 'No fixed deadline' },
];

function PhaseFrame({ mode, frame, setFrame, sessionCode, onContinue, onBack, readOnly }) {
  const [local, setLocal] = useState(frame || {
    decision: '', locked: '', open: '', deciders: '', affected: '', time: 'this-month',
  });
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const update = (k, v) => setLocal((p) => ({ ...p, [k]: v }));

  const proceed = async () => {
    if (!readOnly) {
      if (!local.decision.trim()) { setErr('The decision question is needed before we go further.'); return; }
      if (mode === 'facilitate' && sessionCode) {
        setBusy(true);
        const ok = await storageSet(`cc:${sessionCode}:frame`, local);
        setBusy(false);
        if (!ok) { setErr('I couldn\'t save the frame. Try again — if it keeps failing, refresh the page.'); return; }
      }
      setFrame(local);
    }
    onContinue();
  };

  return (
    <PhaseShell>
      <BackLink onClick={onBack} />
      <ProgressBar phase="frame" mode={mode} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 20, flexWrap: 'wrap', marginBottom: 12 }}>
        <div>
          <div style={{ ...eyebrow, marginBottom: 12 }}>Phase 1 — Frame</div>
          <h2 style={{ ...heading(40), marginBottom: 10 }}>
            {readOnly ? 'What\'s being decided' : <>Frame the <em style={{ color: C.sage, fontStyle: 'italic' }}>decision</em></>}
          </h2>
        </div>
        {mode === 'facilitate' && sessionCode && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end' }}>
            <FacilitatorBadge />
            <SessionCodeChip code={sessionCode} />
          </div>
        )}
      </div>

      <p style={{ fontFamily: F.serif, fontSize: 19, color: C.cream, lineHeight: 1.55, marginBottom: 40, maxWidth: 720, fontStyle: 'italic' }}>
        {readOnly
          ? 'Read this carefully before you write your own perspective. The clearer the frame, the sharper everyone\'s thinking.'
          : 'Get the question, the constraints, and the stakes on the table before anyone gives their opinion. Most disagreements are downstream of an unclear frame.'}
      </p>

      <ErrorBox message={err} onDismiss={() => setErr('')} />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 30, marginBottom: 40 }}>
        {FRAME_FIELDS.map((f) => (
          <div key={f.id}>
            <label style={fieldLabel}>{f.label}</label>
            {readOnly ? (
              <div style={{
                background: C.bgCard, border: `1px solid ${C.line}`, borderRadius: 4,
                padding: '16px 18px', fontSize: 16, lineHeight: 1.6, color: C.cream,
                whiteSpace: 'pre-wrap', minHeight: 40,
              }}>{local[f.id] || <span style={{ color: C.creamMuted, fontStyle: 'italic' }}>— not specified —</span>}</div>
            ) : (
              <>
                <textarea
                  value={local[f.id]} onChange={(e) => update(f.id, e.target.value)}
                  rows={f.rows} style={fieldInput}
                  onFocus={(e) => { e.currentTarget.style.borderColor = C.sageMuted; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = C.line; }}
                />
                <p style={{ fontSize: 12, color: C.creamMuted, marginTop: 6, fontStyle: 'italic' }}>{f.help}</p>
              </>
            )}
          </div>
        ))}
        <div>
          <label style={fieldLabel}>Time pressure</label>
          {readOnly ? (
            <div style={{
              background: C.bgCard, border: `1px solid ${C.line}`, borderRadius: 4,
              padding: '14px 18px', fontSize: 16, color: C.cream,
            }}>{TIME_OPTIONS.find((o) => o.v === local.time)?.l || '—'}</div>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
              {TIME_OPTIONS.map((o) => {
                const active = local.time === o.v;
                return (
                  <button
                    key={o.v} onClick={() => update('time', o.v)}
                    style={{
                      background: active ? C.sage : 'transparent',
                      color: active ? C.bgDeep : C.cream,
                      border: `1px solid ${active ? C.sage : C.line}`,
                      padding: '10px 18px', borderRadius: 2, cursor: 'pointer',
                      fontFamily: F.sans, fontSize: 13, letterSpacing: '0.12em',
                      textTransform: 'uppercase', transition: 'all 0.2s ease',
                    }}
                  >{o.l}</button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <button
        onClick={proceed} disabled={busy}
        style={btn('primary', busy)}
        data-disabled={busy ? 'true' : 'false'}
        onMouseEnter={btnHoverIn} onMouseLeave={btnHoverOut}
      >
        {busy ? 'Saving...' : readOnly ? 'Continue to my perspective →' : 'Continue →'}
      </button>
    </PhaseShell>
  );
}

// =============================================================================
// PHASE 2: INDIVIDUAL READS
// =============================================================================

const READ_QUESTIONS = [
  { id: 'recommendation', label: 'What should we do, and why?', help: 'Two to four sentences. Not hedged. Not diplomatic. What you actually think.', rows: 4 },
  { id: 'counter', label: 'What\'s the strongest argument against your recommendation?', help: 'Make the case as if you believed it. If you can\'t state it well, you don\'t understand it.', rows: 4 },
  { id: 'assumptions', label: 'What are you assuming that might not be true?', help: 'The hidden premises your recommendation rests on. Be specific — surface them so the group can test them.', rows: 4 },
  { id: 'crux', label: 'What would need to be true for you to change your mind about your recommendation?', help: 'This is the crux — the fact, evidence, or shift in values that would actually move you.', rows: 4 },
  { id: 'unsaid', label: 'What isn\'t being said?', help: 'The political, emotional, or uncomfortable truth the room is avoiding. Name it here, even if no one else will.', rows: 4 },
];

function PhaseReads({ mode, sessionCode, contributorName, frame, soloRead, setSoloRead, onSubmit, onBack }) {
  const isContributor = mode === 'contribute';
  const initial = isContributor
    ? { name: contributorName, recommendation: '', counter: '', assumptions: '', crux: '', unsaid: '' }
    : (soloRead || { name: 'You', recommendation: '', counter: '', assumptions: '', crux: '', unsaid: '' });
  const [local, setLocal] = useState(initial);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const update = (k, v) => setLocal((p) => ({ ...p, [k]: v }));

  const completionCount = READ_QUESTIONS.filter((q) => (local[q.id] || '').trim().length > 0).length;

  const submit = async () => {
    setErr('');
    if (!local.recommendation.trim()) { setErr('At minimum, your recommendation is needed. The other questions are strongly encouraged.'); return; }
    if (isContributor) {
      setBusy(true);
      const ok = await storageSet(`cc:${sessionCode}:read:${contributorName}`, local);
      setBusy(false);
      if (!ok) { setErr('I couldn\'t save your perspective. Try again — if it keeps failing, refresh the page.'); return; }
      onSubmit(local);
    } else {
      setSoloRead(local);
      onSubmit(local);
    }
  };

  return (
    <PhaseShell>
      <BackLink onClick={onBack} />
      <ProgressBar phase="reads" mode={mode} />

      <div style={{ ...eyebrow, marginBottom: 12 }}>Phase 2 — Diverge</div>
      <h2 style={{ ...heading(40), marginBottom: 16 }}>
        Your <em style={{ color: C.sage, fontStyle: 'italic' }}>perspective</em>.
      </h2>
      <p style={{ fontFamily: F.serif, fontSize: 19, color: C.cream, lineHeight: 1.55, marginBottom: 30, maxWidth: 720, fontStyle: 'italic' }}>
        {isContributor
          ? 'Answer these five questions before you talk to anyone else on the team. The point of this exercise is to capture what you actually think — not what you think the group wants to hear.'
          : mode === 'solo'
            ? 'Five questions. They\'re designed to surface different types of thinking — not just your opinion, but the assumptions and the crux underneath it.'
            : 'Take your own pass at the questions. The synthesis works better when the facilitator also contributes a perspective, but it\'s not required.'}
      </p>

      {frame?.decision && (
        <div style={{
          background: C.bgCard, borderLeft: `3px solid ${C.sage}`,
          borderRadius: 4, padding: '18px 22px', marginBottom: 36, maxWidth: 760,
        }}>
          <div style={{ ...eyebrow, fontSize: 10, marginBottom: 8 }}>Decision</div>
          <p style={{ fontFamily: F.serif, fontSize: 18, color: C.cream, margin: 0, lineHeight: 1.5 }}>{frame.decision}</p>
        </div>
      )}

      <ErrorBox message={err} onDismiss={() => setErr('')} />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 32, marginBottom: 40 }}>
        {READ_QUESTIONS.map((q, i) => (
          <div key={q.id}>
            <label style={fieldLabel}>
              <span style={{ color: C.sageDim, marginRight: 12 }}>{String(i + 1).padStart(2, '0')}</span>
              {q.label}
            </label>
            <textarea
              value={local[q.id]} onChange={(e) => update(q.id, e.target.value)}
              rows={q.rows} style={fieldInput}
              onFocus={(e) => { e.currentTarget.style.borderColor = C.sageMuted; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = C.line; }}
            />
            <p style={{ fontSize: 12, color: C.creamMuted, marginTop: 6, fontStyle: 'italic' }}>{q.help}</p>
          </div>
        ))}
      </div>

      <div style={{
        background: C.bgCard, border: `1px solid ${C.line}`, borderRadius: 4,
        padding: '14px 20px', marginBottom: 28, display: 'inline-block',
      }}>
        <span style={{ ...eyebrow, fontSize: 10, marginRight: 14 }}>Answered</span>
        <span style={{ fontFamily: F.serif, fontSize: 22, color: C.cream }}>{completionCount}</span>
        <span style={{ color: C.creamMuted, fontSize: 14, marginLeft: 6 }}>of 5</span>
      </div>

      <div>
        <button
          onClick={submit} disabled={busy}
          style={btn('primary', busy)}
          data-disabled={busy ? 'true' : 'false'}
          onMouseEnter={btnHoverIn} onMouseLeave={btnHoverOut}
        >
          {busy ? 'Submitting...' : isContributor ? 'Submit my perspective →' : 'Continue to synthesis →'}
        </button>
      </div>
    </PhaseShell>
  );
}

// =============================================================================
// CONTRIBUTOR WAITING SCREEN
// =============================================================================

function ContributorThankYou({ contributorName, frame, onDone }) {
  return (
    <PhaseShell>
      <div style={{ ...eyebrow, marginBottom: 14 }}>Your perspective is in</div>
      <h2 style={{ ...heading(40), marginBottom: 28 }}>
        Thanks, <em style={{ color: C.sage, fontStyle: 'italic' }}>{contributorName}</em>.
      </h2>

      <p style={{ fontFamily: F.serif, fontSize: 20, color: C.cream, lineHeight: 1.55, marginBottom: 22, maxWidth: 680, fontStyle: 'italic' }}>
        The facilitator will pull everyone's perspectives together and run the synthesis when the group is ready to meet.
      </p>
      <p style={{ fontSize: 15, color: C.creamMuted, lineHeight: 1.7, marginBottom: 48, maxWidth: 640 }}>
        Until then — try not to discuss the decision with others on the team. The synthesis is sharpest when each person's perspective is truly independent.
      </p>

      {frame?.decision && (
        <div style={{ ...cardStyle, marginBottom: 40, maxWidth: 720 }}>
          <div style={{ ...eyebrow, fontSize: 10, marginBottom: 10 }}>The decision being weighed</div>
          <p style={{ fontFamily: F.serif, fontSize: 19, color: C.cream, lineHeight: 1.5, margin: 0 }}>{frame.decision}</p>
        </div>
      )}

      <button onClick={onDone} style={btn('secondary')}
        onMouseEnter={btnSecondaryHoverIn} onMouseLeave={btnSecondaryHoverOut}>
        Close this session
      </button>
    </PhaseShell>
  );
}

// =============================================================================
// FACILITATOR WAITING / PULL CONTRIBUTIONS
// =============================================================================

function FacilitatorPullScreen({ sessionCode, frame, onContinue, onBack }) {
  const [reads, setReads] = useState([]);
  const [busy, setBusy] = useState(false);
  const [lastPull, setLastPull] = useState(null);
  const [err, setErr] = useState('');

  const pull = async () => {
    setErr('');
    setBusy(true);
    try {
      const keys = await storageList(`cc:${sessionCode}:read:`);
      const fetched = [];
      for (const k of keys) {
        const v = await storageGet(k);
        if (v) fetched.push(v);
      }
      setReads(fetched);
      setLastPull(new Date());
    } catch (e) {
      setErr('I couldn\'t pull contributions. Try again — if it keeps failing, refresh the page.');
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => { pull(); /* eslint-disable-next-line */ }, []);

  return (
    <PhaseShell>
      <BackLink onClick={onBack} />
      <ProgressBar phase="reads" mode="facilitate" />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 20, flexWrap: 'wrap', marginBottom: 14 }}>
        <div>
          <div style={{ ...eyebrow, marginBottom: 12 }}>Phase 2 — Diverge</div>
          <h2 style={{ ...heading(40), marginBottom: 12 }}>
            Pull <em style={{ color: C.sage, fontStyle: 'italic' }}>contributions</em>.
          </h2>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end' }}>
          <FacilitatorBadge />
          <SessionCodeChip code={sessionCode} />
        </div>
      </div>

      <p style={{ fontFamily: F.serif, fontSize: 19, color: C.cream, lineHeight: 1.55, marginBottom: 32, maxWidth: 720, fontStyle: 'italic' }}>
        Share the session code with your team. When everyone has submitted, pull contributions and run the synthesis.
      </p>

      <div style={{ ...cardStyle, marginBottom: 28, maxWidth: 720 }}>
        <div style={{ ...eyebrow, fontSize: 10, marginBottom: 10 }}>How to share</div>
        <p style={{ fontSize: 15, color: C.cream, lineHeight: 1.7, margin: 0 }}>
          Send each participant a link to this tool and the code <span style={{ fontFamily: F.serif, fontSize: 17, color: C.sage, fontStyle: 'italic' }}>{sessionCode}</span>. They pick <span style={{ color: C.sage }}>"I have a session code"</span>, enter their name, and submit their five-question perspective.
        </p>
      </div>

      <ErrorBox message={err} onDismiss={() => setErr('')} />

      <div style={{ ...cardStyle, marginBottom: 32, maxWidth: 720 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 18 }}>
          <div>
            <div style={{ ...eyebrow, fontSize: 10, marginBottom: 6 }}>Perspectives submitted</div>
            <span style={{ fontFamily: F.serif, fontSize: 44, color: C.cream, lineHeight: 1 }}>{reads.length}</span>
          </div>
          <button
            onClick={pull} disabled={busy}
            style={btn('secondary', busy)}
            onMouseEnter={btnSecondaryHoverIn} onMouseLeave={btnSecondaryHoverOut}
          >{busy ? 'Pulling...' : 'Refresh'}</button>
        </div>
        {reads.length > 0 ? (
          <div>
            <div style={{ height: 1, background: C.line, marginBottom: 16 }} />
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
              {reads.map((r, i) => (
                <span key={i} style={{
                  background: 'rgba(232, 201, 123, 0.10)',
                  border: `1px solid ${C.sageDim}`,
                  color: C.cream, padding: '6px 14px', borderRadius: 999,
                  fontFamily: F.sans, fontSize: 13,
                }}>{r.name || '—'}</span>
              ))}
            </div>
            {lastPull && (
              <p style={{ fontSize: 11, color: C.creamMuted, fontStyle: 'italic', marginTop: 16 }}>
                Last refreshed {lastPull.toLocaleTimeString()}.
              </p>
            )}
          </div>
        ) : (
          <p style={{ fontSize: 14, color: C.creamMuted, fontStyle: 'italic', margin: 0 }}>
            No perspectives yet. Hit refresh after participants start submitting.
          </p>
        )}
      </div>

      <button
        onClick={() => onContinue(reads)} disabled={reads.length === 0}
        style={btn('primary', reads.length === 0)}
        data-disabled={reads.length === 0 ? 'true' : 'false'}
        onMouseEnter={btnHoverIn} onMouseLeave={btnHoverOut}
      >Run synthesis →</button>
      {reads.length === 0 && (
        <p style={{ fontSize: 12, color: C.creamMuted, fontStyle: 'italic', marginTop: 12 }}>
          You need at least one perspective to run the synthesis.
        </p>
      )}
    </PhaseShell>
  );
}

// =============================================================================
// PHASE 3: SYNTHESIS
// =============================================================================

function buildSynthesisPrompt({ mode, frame, reads }) {
  const isSolo = mode === 'solo';
  const framePart = `## The decision
${frame.decision || '(not specified)'}

## What\'s already locked in
${frame.locked || '(not specified)'}

## What\'s still open
${frame.open || '(not specified)'}

## Who decides
${frame.deciders || '(not specified)'}

## Who\'s affected
${frame.affected || '(not specified)'}

## Time pressure
${TIME_OPTIONS.find((o) => o.v === frame.time)?.l || frame.time || '(not specified)'}
`;

  const readsPart = reads.map((r) => `### ${r.name}
- Recommendation: ${r.recommendation || '(blank)'}
- Strongest counter: ${r.counter || '(blank)'}
- Assumptions: ${r.assumptions || '(blank)'}
- What would change their mind: ${r.crux || '(blank)'}
- What isn\'t being said: ${r.unsaid || '(blank)'}
`).join('\n');

  const soloAddendum = isSolo ? `
This is a solo session — only one person has submitted a read. To make the synthesis useful, you must ALSO generate "missing voices" — write 2 or 3 short positions held by people who aren\'t in the room (e.g. a skeptic, a frontline employee, an affected outsider, an implementer who has to live with the consequences). Treat each missing voice as if it were a real participant. Include them in recommendation_clusters and divergence_map. Mark their names as italic, e.g. "*The skeptic*", "*A frontline view*", "*An outside affected party*".
` : '';

  return `You are an experienced decision-facilitator. Below is a decision being weighed and the independent "reads" of one or more participants. Produce a structured synthesis that helps a facilitator run a real conversation.

${framePart}

# The reads

${readsPart}
${soloAddendum}

# Your output

Respond with ONLY valid JSON, no preamble, no markdown fences. Use this exact schema:

{
  "recommendation_clusters": [
    {
      "label": "Short name for this position (3-6 words)",
      "summary": "One sentence capturing the essence",
      "supporters": ["names of people whose recommendations align here"],
      "strength": "What\'s strongest about this position",
      "vulnerability": "Where this position is most exposed"
    }
  ],
  "divergence_map": {
    "core_disagreement": "2-3 sentences on the FUNDAMENTAL tension — not surface-level differences, but the underlying values or assumptions driving different conclusions",
    "false_agreements": "Where people seem to agree but are actually talking about different things, or agreeing for different reasons",
    "spectrum": "If the positions form a spectrum rather than binary camps, describe it"
  },
  "silence_map": {
    "unmentioned_stakeholders": ["Stakeholders or perspectives nobody raised"],
    "avoided_topics": ["Topics that seem conspicuously absent given the decision"],
    "emotional_undercurrent": "What emotion seems to be present but unnamed — fear, grief, excitement, resentment, exhaustion?",
    "missing_thinking_modes": [
      {
        "hat": "Green | White | Black | Red | Yellow | Blue",
        "what_it_would_have_seen": "Specific description of what this lens would have noticed that the gathered perspectives didn’t capture."
      }
    ]
  },
  "assumption_map": [
    {
      "assumption": "An assumption multiple people are making",
      "holders": ["who holds it"],
      "challenge": "Why this assumption might not hold"
    }
  ],
  "crux_identification": {
    "factual_cruxes": ["Disagreements that could be resolved with data or evidence"],
    "value_cruxes": ["Disagreements rooted in different priorities or values — these can\'t be resolved with data, only acknowledged and navigated"],
    "the_real_question": "Reframe the original decision question based on what the individual reads actually reveal. Often the question the group thinks they\'re answering isn\'t the one they\'re actually wrestling with."
  },
  "bridging_insights": {
    "shared_ground": ["Things that majorities across all the divergent positions actually agree on — not surface platitudes, but real commitments that span the disagreement. These are the easy yeses the group can build from."],
    "unlikely_bedfellows": [
      {
        "agreement": "A specific point where people normally on opposite sides of this debate land on the same answer",
        "who": ["names of the unlikely allies"],
        "why_it_matters": "What this shared ground unlocks — what conversation becomes possible because of it"
      }
    ],
    "hidden_consensus": "If there\'s a position no one explicitly took but most reads imply, name it here. Otherwise leave as empty string."
  }
}

Quality bar:
- Be direct. No corporate jargon. No "leverage" or "align" or "synergize".
- Attribute positions to specific names (e.g. "Engineering sees X while Finance sees Y") — the names matter for the facilitator.
- The "real_question" should make a smart reader say "oh, THAT\'S what we\'re actually deciding."
- For "missing_thinking_modes": diagnostically check the gathered perspectives against Edward de Bono's Six Thinking Hats as a lens checklist.
  - WHITE — pure data, facts, what we know vs don't know
  - YELLOW — optimistic case, benefits, what's right about this
  - BLACK — caution, risks, what could go wrong
  - RED — emotional / intuitive read, gut feeling, what feels off or right
  - GREEN — generative creativity, alternative possibilities, options nobody named
  - BLUE — meta / process thinking, how we're framing the decision itself
  Only flag a hat as MISSING if its absence is a real diagnostic — the group genuinely didn't apply that lens and would benefit from doing so. If everyone naturally brought a Black-Hat read, the Black Hat is not missing. Don't pad. Empty array is fine if all six lenses are well-represented. Each entry: { "hat": "Green", "what_it_would_have_seen": "No one proposed alternatives outside the build-vs-buy frame; a generative read might have asked whether ownership could be staged or shared." }
- For "bridging_insights": be rigorous. Don\'t pad with generic platitudes like "everyone wants the company to succeed." Bridging insights are SPECIFIC commitments where unlikely allies converge — e.g. "Both the cost-cutters and the growth advocates agree we shouldn\'t launch in Europe this quarter, even though they got there by different routes." Surface what makes the disagreement smaller than it first looks.
- If a section is genuinely empty (e.g. no false_agreements because the disagreement is honest), use an empty string or empty array — don\'t pad.`;
}

function PhaseSynthesis({ mode, frame, reads, synthesis, setSynthesis, onContinue, onBack }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [rawFallback, setRawFallback] = useState('');
  const [testedAssumptions, setTestedAssumptions] = useState({});

  useEffect(() => {
    if (!synthesis && reads.length > 0) {
      run();
    }
    // eslint-disable-next-line
  }, []);

  const run = async () => {
    setErr(''); setBusy(true); setRawFallback('');
    try {
      const prompt = buildSynthesisPrompt({ mode, frame, reads });
      const text = await callClaude(prompt, 3500);
      const parsed = parseJSONLoose(text);
      if (parsed) {
        setSynthesis(parsed);
      } else {
        setRawFallback(text);
        setErr('The synthesis came back, but I couldn\'t parse the structure cleanly. The raw text is below — you can still use it to run the conversation.');
      }
    } catch (e) {
      setErr(`Synthesis call failed: ${e.message || 'unknown error'}. You can retry, or continue without it.`);
    } finally {
      setBusy(false);
    }
  };

  if (busy && !synthesis) {
    return (
      <PhaseShell>
        <BackLink onClick={onBack} />
        <ProgressBar phase="synthesis" mode={mode} />
        <div style={{ ...eyebrow, marginBottom: 12 }}>Phase 3 — Synthesize</div>
        <LoadingState message="Reading every contribution. Finding where you actually disagree..." />
        <p style={{ fontFamily: F.sans, fontSize: 12, color: C.creamMuted, textAlign: 'center', marginTop: 18, letterSpacing: '0.04em', fontStyle: 'italic' }}>
          Results take 90–120 seconds to generate.
        </p>
      </PhaseShell>
    );
  }

  return (
    <PhaseShell>
      <BackLink onClick={onBack} />
      <ProgressBar phase="synthesis" mode={mode} />

      <div style={{ ...eyebrow, marginBottom: 12 }}>Phase 3 — Synthesize</div>
      <h2 style={{ ...heading(40), marginBottom: 16 }}>
        Where you actually <em style={{ color: C.sage, fontStyle: 'italic' }}>disagree</em>.
      </h2>
      <p style={{ fontFamily: F.serif, fontSize: 19, color: C.cream, lineHeight: 1.55, marginBottom: mode === 'solo' ? 14 : 36, maxWidth: 720, fontStyle: 'italic' }}>
        Read this carefully before the meeting. It's your map for the conversation — not the script.
      </p>
      {mode === 'solo' && (
        <p style={{ fontFamily: F.sans, fontSize: 13, color: C.sage, lineHeight: 1.6, marginTop: 0, marginBottom: 36, maxWidth: 720, letterSpacing: '0.02em' }}>
          AI has generated alternative perspectives to help broaden and catalyze new thinking.
        </p>
      )}

      <ErrorBox message={err} onDismiss={() => setErr('')} />
      {rawFallback && (
        <div style={{ ...cardStyle, marginBottom: 28 }}>
          <div style={{ ...eyebrow, fontSize: 10, marginBottom: 10 }}>Raw response</div>
          <pre style={{ whiteSpace: 'pre-wrap', fontFamily: F.sans, fontSize: 13, color: C.cream, margin: 0, lineHeight: 1.6 }}>{rawFallback}</pre>
        </div>
      )}

      {synthesis && (
        <SynthesisDisplay
          synthesis={synthesis}
          testedAssumptions={testedAssumptions}
          setTestedAssumptions={setTestedAssumptions}
          mode={mode}
        />
      )}

      <div style={{ display: 'flex', gap: 16, marginTop: 40, flexWrap: 'wrap' }}>
        <button
          onClick={onContinue} disabled={!synthesis && !rawFallback}
          style={btn('primary', !synthesis && !rawFallback)}
          data-disabled={!synthesis && !rawFallback ? 'true' : 'false'}
          onMouseEnter={btnHoverIn} onMouseLeave={btnHoverOut}
        >Continue to collision →</button>
        <button onClick={run} disabled={busy} style={btn('secondary', busy)}
          onMouseEnter={btnSecondaryHoverIn} onMouseLeave={btnSecondaryHoverOut}>
          {busy ? 'Re-running...' : 'Re-run synthesis'}
        </button>
      </div>
    </PhaseShell>
  );
}

function SynthesisDisplay({ synthesis, testedAssumptions, setTestedAssumptions, mode }) {
  const clusters = synthesis.recommendation_clusters || [];
  const div = synthesis.divergence_map || {};
  const sil = synthesis.silence_map || {};
  const assumptions = synthesis.assumption_map || [];
  const crux = synthesis.crux_identification || {};
  const bridge = synthesis.bridging_insights || {};
  const accent = accentFor(mode);
  const accentMuted = accentMutedFor(mode);
  const accentDim = accentDimFor(mode);

  const [activeTab, setActiveTab] = useState('disagree');

  // Cluster sizing: based on supporter count
  const maxSup = Math.max(1, ...clusters.map((c) => (c.supporters || []).length));

  const tabs = [
    { id: 'disagree', label: 'Where we disagree', count: clusters.length },
    { id: 'agree', label: 'Where we agree', count: (bridge.shared_ground || []).length + (bridge.unlikely_bedfellows || []).length },
    { id: 'missing', label: "What's missing", count: (sil.unmentioned_stakeholders || []).length + (sil.avoided_topics || []).length + (sil.missing_thinking_modes || []).length },
    { id: 'assumptions', label: 'Assumptions worth testing', count: assumptions.length },
    { id: 'cruxes', label: 'AI insights', count: (crux.factual_cruxes || []).length + (crux.value_cruxes || []).length + (crux.the_real_question ? 1 : 0) },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>

      {/* TAB BAR */}
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', borderBottom: `1px solid ${C.line}`, marginBottom: 8 }}>
        {tabs.map((t) => {
          const active = t.id === activeTab;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              style={{
                background: 'transparent',
                color: active ? accent : C.creamMuted,
                border: 'none',
                borderBottom: active ? `2px solid ${accent}` : '2px solid transparent',
                padding: '12px 14px',
                marginBottom: -1,
                fontFamily: F.sans,
                fontSize: 11,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                fontWeight: active ? 500 : 400,
                opacity: active ? 1 : 0.75,
              }}
              onMouseEnter={(e) => { if (!active) e.currentTarget.style.opacity = '1'; }}
              onMouseLeave={(e) => { if (!active) e.currentTarget.style.opacity = '0.75'; }}
            >
              {t.label}{t.count ? ` (${t.count})` : ''}
            </button>
          );
        })}
      </div>

      {/* TAB: WHERE WE DISAGREE */}
      {activeTab === 'disagree' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
          <section>
            <h3 style={{ ...heading(28), marginBottom: 6 }}>
              Where positions <em style={{ color: accent, fontStyle: 'italic' }}>cluster</em>
            </h3>
            <p style={{ fontFamily: F.serif, fontStyle: 'italic', fontSize: 15, color: C.creamMuted, lineHeight: 1.6, margin: '0 0 20px', maxWidth: 680 }}>
              Each cluster groups perspectives that landed on similar recommendations. The thicker the left border, the more people held that position.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {clusters.map((c, i) => {
                const sup = c.supporters || [];
                const weight = sup.length / maxSup;
                return (
                  <div key={i} style={{
                    ...cardStyle,
                    borderLeft: `${Math.max(3, Math.round(weight * 8))}px solid ${accent}`,
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap', marginBottom: 12 }}>
                      <div style={{ flex: 1, minWidth: 220 }}>
                        <div style={{ ...eyebrow, fontSize: 10, marginBottom: 8 }}>Cluster {String(i + 1).padStart(2, '0')}</div>
                        <h4 style={{ fontFamily: F.serif, fontSize: 22, color: C.cream, margin: '0 0 8px', fontWeight: 400, letterSpacing: '-0.005em' }}>{c.label}</h4>
                        <p style={{ fontSize: 15, color: C.cream, lineHeight: 1.6, margin: 0 }}>{c.summary}</p>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                        <div style={{ ...eyebrow, fontSize: 10 }}>Held by</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'flex-end', maxWidth: 280 }}>
                          {sup.length === 0 ? (
                            <span style={{ fontSize: 13, color: C.creamMuted, fontStyle: 'italic' }}>—</span>
                          ) : sup.map((s, j) => (
                            <span key={j} style={{
                              background: 'rgba(232, 201, 123, 0.10)', color: C.cream,
                              border: `1px solid ${accentDim}`, padding: '4px 10px',
                              borderRadius: 999, fontSize: 12, fontFamily: F.sans,
                            }}>{s}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14, marginTop: 14, paddingTop: 14, borderTop: `1px solid ${C.line}` }}>
                      <div>
                        <div style={{ ...eyebrow, fontSize: 10, color: C.good, marginBottom: 6 }}>Strength</div>
                        <p style={{ fontSize: 14, color: C.cream, lineHeight: 1.6, margin: 0 }}>{c.strength}</p>
                      </div>
                      <div>
                        <div style={{ ...eyebrow, fontSize: 10, color: C.warning, marginBottom: 6 }}>Vulnerability</div>
                        <p style={{ fontSize: 14, color: C.cream, lineHeight: 1.6, margin: 0 }}>{c.vulnerability}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <section style={{
            background: 'rgba(232, 201, 123, 0.06)',
            border: `1px solid ${accentDim}`,
            borderRadius: 6, padding: '28px 30px',
          }}>
            <div style={{ ...eyebrow, marginBottom: 14 }}>The divergence map — most important data</div>
            <h3 style={{ ...heading(28), marginBottom: 22 }}>{"What's actually "}<em style={{ color: accent, fontStyle: 'italic' }}>splitting</em> you</h3>
            <div style={{ marginBottom: 24 }}>
              <div style={{ ...eyebrow, fontSize: 10, marginBottom: 8 }}>Core disagreement</div>
              <p style={{ fontFamily: F.serif, fontSize: 19, color: C.cream, lineHeight: 1.55, fontStyle: 'italic', margin: 0 }}>{div.core_disagreement}</p>
            </div>
            {div.false_agreements && (
              <div style={{ marginBottom: 22 }}>
                <div style={{ ...eyebrow, fontSize: 10, marginBottom: 8 }}>False agreements</div>
                <p style={{ fontSize: 15, color: C.cream, lineHeight: 1.7, margin: 0 }}>{div.false_agreements}</p>
              </div>
            )}
            {div.spectrum && (
              <div>
                <div style={{ ...eyebrow, fontSize: 10, marginBottom: 8 }}>The spectrum</div>
                <p style={{ fontSize: 15, color: C.cream, lineHeight: 1.7, margin: 0 }}>{div.spectrum}</p>
              </div>
            )}
          </section>
        </div>
      )}

      {/* TAB: WHERE WE AGREE — bridging insights */}
      {activeTab === 'agree' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
          <section>
            <h3 style={{ ...heading(28), marginBottom: 6 }}>
              Where unlikely allies <em style={{ color: accent, fontStyle: 'italic' }}>agree</em>
            </h3>
            <p style={{ fontFamily: F.serif, fontStyle: 'italic', fontSize: 15, color: C.creamMuted, lineHeight: 1.6, margin: '0 0 24px', maxWidth: 680 }}>
              The disagreement is real — but it's often smaller than it first looks. These are the points where people on opposite sides of the debate actually converge. Start here when you run the conversation: shared ground is what lets harder things become possible.
            </p>

            {(bridge.shared_ground || []).length > 0 && (
              <div style={{ marginBottom: 28 }}>
                <div style={{ ...eyebrow, fontSize: 10, marginBottom: 12, color: C.good }}>Shared ground across the divide</div>
                <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {(bridge.shared_ground || []).map((s, i) => (
                    <li key={i} style={{
                      background: 'rgba(159, 190, 127, 0.08)',
                      borderLeft: `3px solid ${C.good}`,
                      padding: '14px 18px',
                      borderRadius: 2,
                      fontSize: 15,
                      color: C.cream,
                      lineHeight: 1.65,
                      fontFamily: F.serif,
                      fontStyle: 'italic',
                    }}>{s}</li>
                  ))}
                </ul>
              </div>
            )}

            {(bridge.unlikely_bedfellows || []).length > 0 && (
              <div style={{ marginBottom: 28 }}>
                <div style={{ ...eyebrow, fontSize: 10, marginBottom: 12 }}>Unlikely bedfellows</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {(bridge.unlikely_bedfellows || []).map((u, i) => (
                    <div key={i} style={{
                      ...cardStyle,
                      borderLeft: `3px solid ${accent}`,
                    }}>
                      <p style={{ fontFamily: F.serif, fontSize: 18, color: C.cream, lineHeight: 1.55, margin: '0 0 12px', fontStyle: 'italic' }}>"{u.agreement}"</p>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
                        {(u.who || []).map((w, j) => (
                          <span key={j} style={{
                            background: 'rgba(232, 201, 123, 0.10)', color: C.cream,
                            border: `1px solid ${accentDim}`, padding: '3px 9px',
                            borderRadius: 999, fontSize: 11, fontFamily: F.sans,
                          }}>{w}</span>
                        ))}
                      </div>
                      {u.why_it_matters && (
                        <p style={{ fontSize: 14, color: C.creamMuted, lineHeight: 1.7, margin: 0 }}>
                          <span style={{ color: accent, fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase', marginRight: 8 }}>Why it matters</span>
                          {u.why_it_matters}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {bridge.hidden_consensus && bridge.hidden_consensus.trim() && (
              <div>
                <div style={{ ...eyebrow, fontSize: 10, marginBottom: 12, color: C.creamMuted }}>Hidden consensus — a position nobody named but most reads imply</div>
                <p style={{
                  fontFamily: F.serif, fontSize: 18, color: C.cream, lineHeight: 1.6,
                  fontStyle: 'italic', margin: 0,
                  background: 'rgba(240, 235, 219, 0.04)',
                  borderLeft: `2px dashed ${C.creamMuted}`,
                  padding: '14px 18px',
                  borderRadius: 2,
                }}>{bridge.hidden_consensus}</p>
              </div>
            )}

            {(bridge.shared_ground || []).length === 0 && (bridge.unlikely_bedfellows || []).length === 0 && !bridge.hidden_consensus && (
              <p style={{ fontSize: 14, color: C.creamMuted, fontStyle: 'italic', maxWidth: 600 }}>
                The synthesis didn't surface clear bridging points across this set of perspectives. That can mean the disagreement is genuinely deep — or that more perspectives in the room would help. Worth naming aloud when you run the conversation.
              </p>
            )}
          </section>
        </div>
      )}

      {/* TAB: WHAT'S MISSING */}
      {activeTab === 'missing' && (
        <section style={{
          background: 'transparent',
          border: `1px dashed ${C.lineStrong}`,
          borderRadius: 6, padding: '28px 30px',
        }}>
          <div style={{ ...eyebrow, marginBottom: 14, color: C.creamMuted }}>The silence map — what isn't here</div>
          <h3 style={{ ...heading(28), marginBottom: 22, color: C.creamMuted }}>
            {"What's "}<em style={{ fontStyle: 'italic', color: C.cream }}>missing</em>
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 22 }}>
            <div>
              <div style={{ ...eyebrow, fontSize: 10, marginBottom: 10, color: C.creamMuted }}>Unmentioned stakeholders</div>
              {(sil.unmentioned_stakeholders || []).length === 0 ? (
                <p style={{ fontSize: 13, color: C.creamMuted, fontStyle: 'italic', margin: 0 }}>— none surfaced —</p>
              ) : (
                <ul style={{ margin: 0, padding: '0 0 0 18px' }}>
                  {(sil.unmentioned_stakeholders || []).map((s, i) => (
                    <li key={i} style={{ fontSize: 14, color: C.cream, lineHeight: 1.7, marginBottom: 4 }}>{s}</li>
                  ))}
                </ul>
              )}
            </div>
            <div>
              <div style={{ ...eyebrow, fontSize: 10, marginBottom: 10, color: C.creamMuted }}>Avoided topics</div>
              {(sil.avoided_topics || []).length === 0 ? (
                <p style={{ fontSize: 13, color: C.creamMuted, fontStyle: 'italic', margin: 0 }}>— none surfaced —</p>
              ) : (
                <ul style={{ margin: 0, padding: '0 0 0 18px' }}>
                  {(sil.avoided_topics || []).map((s, i) => (
                    <li key={i} style={{ fontSize: 14, color: C.cream, lineHeight: 1.7, marginBottom: 4 }}>{s}</li>
                  ))}
                </ul>
              )}
            </div>
          </div>
          {sil.emotional_undercurrent && (
            <div style={{ marginTop: 22, paddingTop: 18, borderTop: `1px dashed ${C.line}` }}>
              <div style={{ ...eyebrow, fontSize: 10, marginBottom: 8, color: C.creamMuted }}>Emotional undercurrent</div>
              <p style={{ fontFamily: F.serif, fontStyle: 'italic', fontSize: 17, color: C.cream, lineHeight: 1.6, margin: 0 }}>{sil.emotional_undercurrent}</p>
            </div>
          )}
          {(sil.missing_thinking_modes || []).length > 0 && (
            <div style={{ marginTop: 22, paddingTop: 18, borderTop: `1px dashed ${C.line}` }}>
              <div style={{ ...eyebrow, fontSize: 10, marginBottom: 4, color: C.creamMuted }}>Missing thinking modes</div>
              <p style={{ fontSize: 12, color: C.creamMuted, fontStyle: 'italic', margin: '0 0 14px', maxWidth: 580 }}>
                Lenses (from de Bono's Six Thinking Hats) that didn't show up in the gathered perspectives. Worth bringing into the conversation.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {(sil.missing_thinking_modes || []).map((m, i) => {
                  const hatColor = hatColorFor(m.hat);
                  return (
                    <div key={i} style={{ borderLeft: `3px solid ${hatColor}`, padding: '10px 16px', background: 'rgba(0,0,0,0.10)', borderRadius: 2 }}>
                      <span style={{
                        display: 'inline-block', background: hatColor, color: C.bgDeep,
                        padding: '3px 10px', borderRadius: 2, fontSize: 10,
                        letterSpacing: '0.18em', textTransform: 'uppercase',
                        fontFamily: F.sans, fontWeight: 500, marginRight: 12, marginBottom: 8,
                      }}>{m.hat} Hat</span>
                      <p style={{ fontSize: 14, color: C.cream, lineHeight: 1.6, margin: 0 }}>
                        {m.what_it_would_have_seen}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </section>
      )}

      {/* TAB: ASSUMPTIONS WORTH TESTING */}
      {activeTab === 'assumptions' && (
        <section>
          <h3 style={{ ...heading(28), marginBottom: 10 }}>
            Assumptions worth <em style={{ color: accent, fontStyle: 'italic' }}>testing</em>
          </h3>
          <p style={{ fontFamily: F.serif, fontStyle: 'italic', fontSize: 15, color: C.creamMuted, lineHeight: 1.6, margin: '0 0 22px', maxWidth: 680 }}>
            Flag the assumptions you want the group to actively challenge in the conversation. Flagged ones will carry forward into the Collision rounds — and any you don't resolve will show up in your final results as open questions worth revisiting.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {assumptions.map((a, i) => {
              const flagged = !!testedAssumptions[i];
              return (
                <div key={i} style={{
                  ...cardStyle,
                  borderLeft: `3px solid ${flagged ? C.warning : C.line}`,
                  transition: 'border-color 0.2s ease',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: 220 }}>
                      <p style={{ fontFamily: F.serif, fontSize: 18, color: C.cream, lineHeight: 1.55, margin: '0 0 12px', fontStyle: 'italic' }}>"{a.assumption}"</p>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
                        {(a.holders || []).map((h, j) => (
                          <span key={j} style={{
                            background: 'rgba(232, 201, 123, 0.10)', color: C.cream,
                            border: `1px solid ${accentDim}`, padding: '3px 9px',
                            borderRadius: 999, fontSize: 11, fontFamily: F.sans,
                          }}>{h}</span>
                        ))}
                      </div>
                      <p style={{ fontSize: 14, color: C.creamMuted, lineHeight: 1.7, margin: 0 }}>
                        <span style={{ color: C.warning, fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase', marginRight: 8 }}>Challenge</span>
                        {a.challenge}
                      </p>
                    </div>
                    <button
                      onClick={() => setTestedAssumptions((p) => ({ ...p, [i]: !p[i] }))}
                      style={{
                        background: flagged ? C.warning : 'transparent',
                        color: flagged ? C.bgDeep : C.creamMuted,
                        border: `1px solid ${flagged ? C.warning : C.line}`,
                        padding: '8px 14px', borderRadius: 2, cursor: 'pointer',
                        fontFamily: F.sans, fontSize: 11, letterSpacing: '0.14em',
                        textTransform: 'uppercase', whiteSpace: 'nowrap', flexShrink: 0,
                        transition: 'all 0.2s ease',
                      }}
                    >{flagged ? '\u2713 Flagged to test' : 'Flag to test'}</button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* TAB: AI INSIGHTS (cruxes + reframed question) */}
      {activeTab === 'cruxes' && (
        <section>
          <h3 style={{ ...heading(28), marginBottom: 18 }}>
            The <em style={{ color: accent, fontStyle: 'italic' }}>cruxes</em>
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, marginBottom: 28 }}>
            <div style={{ ...cardStyle, borderLeft: `3px solid ${C.good}` }}>
              <div style={{ ...eyebrow, fontSize: 10, color: C.good, marginBottom: 12 }}>Factual cruxes</div>
              <p style={{ fontSize: 12, color: C.creamMuted, fontStyle: 'italic', margin: '0 0 14px' }}>Resolvable with data or evidence.</p>
              {(crux.factual_cruxes || []).length === 0 ? (
                <p style={{ fontSize: 13, color: C.creamMuted, fontStyle: 'italic', margin: 0 }}>{"\u2014 none surfaced \u2014"}</p>
              ) : (
                <ul style={{ margin: 0, padding: '0 0 0 18px' }}>
                  {(crux.factual_cruxes || []).map((s, i) => (
                    <li key={i} style={{ fontSize: 14, color: C.cream, lineHeight: 1.7, marginBottom: 6 }}>{s}</li>
                  ))}
                </ul>
              )}
            </div>
            <div style={{ ...cardStyle, borderLeft: `3px solid ${C.warning}` }}>
              <div style={{ ...eyebrow, fontSize: 10, color: C.warning, marginBottom: 12 }}>Value cruxes</div>
              <p style={{ fontSize: 12, color: C.creamMuted, fontStyle: 'italic', margin: '0 0 14px' }}>Rooted in different priorities. Can't be resolved with data \u2014 only acknowledged and navigated.</p>
              {(crux.value_cruxes || []).length === 0 ? (
                <p style={{ fontSize: 13, color: C.creamMuted, fontStyle: 'italic', margin: 0 }}>{"\u2014 none surfaced \u2014"}</p>
              ) : (
                <ul style={{ margin: 0, padding: '0 0 0 18px' }}>
                  {(crux.value_cruxes || []).map((s, i) => (
                    <li key={i} style={{ fontSize: 14, color: C.cream, lineHeight: 1.7, marginBottom: 6 }}>{s}</li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {crux.the_real_question && (
            <div style={{
              background: 'rgba(232, 201, 123, 0.08)',
              borderLeft: `4px solid ${accent}`,
              borderRadius: 4, padding: '32px 36px',
            }}>
              <div style={{ ...eyebrow, marginBottom: 16 }}>The real question</div>
              <p style={{
                fontFamily: F.serif, fontSize: 30, fontStyle: 'italic', color: C.cream,
                lineHeight: 1.35, margin: 0, letterSpacing: '-0.005em',
              }}>"{crux.the_real_question}"</p>
            </div>
          )}
        </section>
      )}
    </div>
  );
}

// =============================================================================
// PHASE 4: COLLISION (facilitator/solo only)
// =============================================================================

const ROUNDS = [
  {
    id: 'r1', number: 'Round 01', title: 'Present the divergence',
    shows: ['recommendation_clusters', 'divergence'],
    prompt: 'Share the recommendation clusters and the core disagreement with the group. Ask: "Does this capture where we actually are? What\'s missing?"',
    note: 'Watch for who nods and who goes quiet. The quiet ones often hold the most important dissent.',
  },
  {
    id: 'r2', number: 'Round 02', title: 'Test the assumptions',
    shows: ['assumptions'],
    prompt: 'Walk through each assumption. For each, the group answers: Is this true? How would we find out? What happens if it\'s wrong?',
    note: 'The assumptions people defend most vigorously are often the ones most worth questioning.',
  },
  {
    id: 'r3', number: 'Round 03', title: 'Name what\'s missing',
    shows: ['silence'],
    prompt: 'Share the silence map. Ask: "Who isn\'t in this room that should be? What aren\'t we saying?" This is the hardest round. Acknowledge that.',
    note: 'If no one speaks for 10 seconds, name it: "The silence here is telling me something."',
  },
  {
    id: 'r4', number: 'Round 04', title: 'The reframed question',
    shows: ['reframe'],
    prompt: 'Display the AI\'s reframed question. Ask: "Is THIS the question we should be answering? If so, has anything shifted in what you think we should do?"',
    note: 'If the reframed question lands, give the room 60 seconds of quiet before anyone speaks.',
  },
];

function PhaseCollision({ mode, synthesis, collisionState, setCollisionState, onContinue, onBack }) {
  const [openRound, setOpenRound] = useState('r1');
  const [newDivergence, setNewDivergence] = useState('');

  const div = synthesis?.divergence_map || {};
  const sil = synthesis?.silence_map || {};
  const assumptions = synthesis?.assumption_map || [];
  const clusters = synthesis?.recommendation_clusters || [];
  const reframe = synthesis?.crux_identification?.the_real_question || '';
  const struck = collisionState?.divergenceEdits?.struck || {};
  const added = collisionState?.divergenceEdits?.added || [];

  const setAssumptionStatus = (idx, status) => {
    setCollisionState((p) => ({
      ...p,
      assumptions: { ...(p.assumptions || {}), [idx]: status },
    }));
  };

  const toggleStruck = (idx) => {
    setCollisionState((p) => {
      const prev = p?.divergenceEdits?.struck || {};
      const next = { ...prev };
      if (next[idx]) delete next[idx]; else next[idx] = true;
      return { ...p, divergenceEdits: { ...(p?.divergenceEdits || {}), struck: next, added: p?.divergenceEdits?.added || [] } };
    });
  };

  const addDivergence = () => {
    const t = newDivergence.trim();
    if (!t) return;
    setCollisionState((p) => {
      const prev = p?.divergenceEdits?.added || [];
      return { ...p, divergenceEdits: { ...(p?.divergenceEdits || {}), struck: p?.divergenceEdits?.struck || {}, added: [...prev, { text: t, id: Date.now() + '-' + Math.random().toString(36).slice(2, 6) }] } };
    });
    setNewDivergence('');
  };

  const removeAdded = (id) => {
    setCollisionState((p) => {
      const prev = p?.divergenceEdits?.added || [];
      return { ...p, divergenceEdits: { ...(p?.divergenceEdits || {}), struck: p?.divergenceEdits?.struck || {}, added: prev.filter((a) => a.id !== id) } };
    });
  };

  return (
    <PhaseShell>
      <BackLink onClick={onBack} />
      <ProgressBar phase="collision" mode={mode} />

      <div style={{ ...eyebrow, marginBottom: 12 }}>Phase 4 — Collide</div>
      <h2 style={{ ...heading(40), marginBottom: 16 }}>
        Run the <em style={{ color: C.sage, fontStyle: 'italic' }}>conversation</em>.
      </h2>
      <p style={{ fontFamily: F.serif, fontSize: 19, color: C.cream, lineHeight: 1.55, marginBottom: 40, maxWidth: 720, fontStyle: 'italic' }}>
        This is a guide for the live discussion — not a form to fill in. Move through the four rounds at the pace the room needs.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {ROUNDS.map((r) => {
          const open = openRound === r.id;
          return (
            <div key={r.id} style={{
              ...cardStyle,
              padding: 0, overflow: 'hidden',
              borderColor: open ? C.sageDim : C.line,
              transition: 'border-color 0.3s ease',
            }}>
              <button
                onClick={() => setOpenRound(open ? null : r.id)}
                style={{
                  width: '100%', textAlign: 'left', background: 'transparent',
                  border: 'none', padding: '24px 28px', cursor: 'pointer',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  gap: 18,
                }}
              >
                <div>
                  <div style={{ ...eyebrow, fontSize: 10, marginBottom: 8 }}>{r.number}</div>
                  <h4 style={{ fontFamily: F.serif, fontSize: 26, color: C.cream, margin: 0, fontWeight: 400, letterSpacing: '-0.005em' }}>{r.title}</h4>
                </div>
                <span style={{ color: C.sage, fontSize: 22, transition: 'transform 0.3s', transform: open ? 'rotate(45deg)' : 'rotate(0)' }}>+</span>
              </button>
              {open && (
                <div style={{ padding: '0 28px 28px', borderTop: `1px solid ${C.line}` }}>
                  <p style={{ fontSize: 16, color: C.cream, lineHeight: 1.7, marginTop: 22, marginBottom: 18 }}>{r.prompt}</p>

                  {/* Round-specific content */}
                  {r.id === 'r1' && (
                    <div style={{ marginBottom: 22 }}>
                      <div style={{ ...eyebrow, fontSize: 10, marginBottom: 10, color: C.creamMuted }}>From the synthesis — strike any cluster the group says doesn't fit</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 18 }}>
                        {clusters.map((c, i) => {
                          const isStruck = !!struck[i];
                          return (
                            <div key={i} style={{
                              background: C.bgDeep,
                              borderLeft: `3px solid ${isStruck ? C.line : C.sage}`,
                              borderRadius: 2, padding: '14px 18px',
                              opacity: isStruck ? 0.5 : 1,
                              transition: 'opacity 0.2s ease, border-color 0.2s ease',
                            }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <p style={{ fontFamily: F.serif, fontSize: 17, color: C.cream, margin: '0 0 4px', fontStyle: 'italic', textDecoration: isStruck ? 'line-through' : 'none' }}>{c.label}</p>
                                  <p style={{ fontSize: 13, color: C.creamMuted, margin: 0, lineHeight: 1.6, textDecoration: isStruck ? 'line-through' : 'none' }}>
                                    <span style={{ color: C.sage, marginRight: 6 }}>{(c.supporters || []).join(', ') || '—'}:</span>
                                    {c.summary}
                                  </p>
                                </div>
                                <button onClick={() => toggleStruck(i)} style={{
                                  background: isStruck ? C.creamMuted : 'transparent',
                                  color: isStruck ? C.bgDeep : C.creamMuted,
                                  border: `1px solid ${C.line}`,
                                  padding: '5px 10px', borderRadius: 2, cursor: 'pointer',
                                  fontFamily: F.sans, fontSize: 10, letterSpacing: '0.14em',
                                  textTransform: 'uppercase', whiteSpace: 'nowrap', flexShrink: 0,
                                  transition: 'all 0.2s ease',
                                }}>{isStruck ? '↺ Restore' : '✕ Strike'}</button>
                              </div>
                            </div>
                          );
                        })}
                        {added.map((a) => (
                          <div key={a.id} style={{
                            background: 'rgba(232, 201, 123, 0.10)',
                            borderLeft: `3px solid ${C.sage}`,
                            borderRadius: 2, padding: '14px 18px',
                          }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ ...eyebrow, fontSize: 9, color: C.sage, marginBottom: 4 }}>Added in the room</div>
                                <p style={{ fontFamily: F.serif, fontSize: 17, color: C.cream, margin: 0, fontStyle: 'italic', lineHeight: 1.55 }}>{a.text}</p>
                              </div>
                              <button onClick={() => removeAdded(a.id)} style={{
                                background: 'transparent', color: C.creamMuted,
                                border: `1px solid ${C.line}`, padding: '5px 10px',
                                borderRadius: 2, cursor: 'pointer',
                                fontFamily: F.sans, fontSize: 10, letterSpacing: '0.14em',
                                textTransform: 'uppercase', whiteSpace: 'nowrap', flexShrink: 0,
                              }}>Remove</button>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Add a divergence the group surfaces */}
                      <div style={{ background: C.bgDeep, border: `1px dashed ${C.line}`, borderRadius: 2, padding: '14px 18px', marginBottom: 18 }}>
                        <div style={{ ...eyebrow, fontSize: 10, marginBottom: 10, color: C.creamMuted }}>Add a divergence the group surfaces</div>
                        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-start' }}>
                          <input
                            type="text" value={newDivergence}
                            onChange={(e) => setNewDivergence(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addDivergence(); } }}
                            placeholder="e.g. The risk-tolerance camp — Aaron, Beth — argues we're under-pricing the downside."
                            style={{
                              flex: 1, minWidth: 240, background: 'rgba(255,255,255,0.04)',
                              border: `1px solid ${C.line}`, color: C.cream,
                              padding: '10px 14px', borderRadius: 2,
                              fontFamily: F.sans, fontSize: 14, outline: 'none',
                            }}
                            onFocus={(e) => { e.currentTarget.style.borderColor = C.sageMuted; }}
                            onBlur={(e) => { e.currentTarget.style.borderColor = C.line; }}
                          />
                          <button onClick={addDivergence} disabled={!newDivergence.trim()} style={{
                            background: newDivergence.trim() ? C.sage : 'transparent',
                            color: newDivergence.trim() ? C.bgDeep : C.creamMuted,
                            border: `1px solid ${newDivergence.trim() ? C.sage : C.line}`,
                            padding: '10px 16px', borderRadius: 2,
                            cursor: newDivergence.trim() ? 'pointer' : 'not-allowed',
                            fontFamily: F.sans, fontSize: 11, letterSpacing: '0.14em',
                            textTransform: 'uppercase', whiteSpace: 'nowrap',
                            transition: 'all 0.2s ease',
                          }}>+ Add</button>
                        </div>
                        <p style={{ fontSize: 12, color: C.creamMuted, fontStyle: 'italic', margin: '10px 0 0' }}>
                          These additions will carry forward into your final results — so the record reflects what actually happened in the conversation, not just what the AI surfaced beforehand.
                        </p>
                      </div>

                      <div style={{ background: C.bgDeep, borderLeft: `3px solid ${C.sageMuted}`, padding: '14px 18px', borderRadius: 2 }}>
                        <div style={{ ...eyebrow, fontSize: 10, marginBottom: 6 }}>Core disagreement</div>
                        <p style={{ fontFamily: F.serif, fontSize: 17, color: C.cream, lineHeight: 1.55, margin: 0, fontStyle: 'italic' }}>{div.core_disagreement || '—'}</p>
                      </div>
                    </div>
                  )}

                  {r.id === 'r2' && (
                    <div style={{ marginBottom: 22 }}>
                      <div style={{ background: C.bgDeep, border: `1px solid ${C.line}`, borderRadius: 2, padding: '14px 18px', marginBottom: 16, maxWidth: 720 }}>
                        <div style={{ ...eyebrow, fontSize: 10, marginBottom: 10, color: C.creamMuted }}>What each button does</div>
                        <ul style={{ margin: 0, padding: '0 0 0 18px', color: C.cream, fontSize: 14, lineHeight: 1.75 }}>
                          <li><span style={{ color: C.good, fontWeight: 600 }}>Tested</span> — the group worked through it and confirmed it holds. No flag in the final results; the recommendation rests on this honestly.</li>
                          <li><span style={{ color: C.warning, fontWeight: 600 }}>Doesn't hold</span> — broke under scrutiny. This will surface prominently in your final results as a flag that <em>the recommendation may need to be reconsidered before the first move</em>.</li>
                          <li><span style={{ color: C.creamMuted, fontWeight: 600 }}>Untested</span> (the default if you don't mark it) — no one challenged it. This will surface in your final results as an open question worth revisiting later.</li>
                        </ul>
                      </div>
                      {assumptions.map((a, i) => {
                        const status = collisionState?.assumptions?.[i];
                        return (
                          <div key={i} style={{
                            background: C.bgDeep, border: `1px solid ${C.line}`,
                            borderRadius: 2, padding: '14px 18px', marginBottom: 10,
                          }}>
                            <p style={{ fontFamily: F.serif, fontSize: 16, color: C.cream, fontStyle: 'italic', lineHeight: 1.55, margin: '0 0 12px' }}>"{a.assumption}"</p>
                            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                              {['untested', 'tested', 'doesnt-hold'].map((s) => {
                                const labels = { untested: 'Untested', tested: 'Tested', 'doesnt-hold': "Doesn't hold" };
                                const colors = {
                                  untested: { bg: status === s ? C.creamMuted : 'transparent', col: status === s ? C.bgDeep : C.creamMuted, br: C.line },
                                  tested: { bg: status === s ? C.good : 'transparent', col: status === s ? C.bgDeep : C.good, br: C.good },
                                  'doesnt-hold': { bg: status === s ? C.warning : 'transparent', col: status === s ? C.bgDeep : C.warning, br: C.warning },
                                };
                                const cc = colors[s];
                                return (
                                  <button key={s} onClick={() => setAssumptionStatus(i, s)} style={{
                                    background: cc.bg, color: cc.col, border: `1px solid ${cc.br}`,
                                    padding: '6px 12px', borderRadius: 2, cursor: 'pointer',
                                    fontFamily: F.sans, fontSize: 11, letterSpacing: '0.14em',
                                    textTransform: 'uppercase', transition: 'all 0.2s ease',
                                  }}>{labels[s]}</button>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {r.id === 'r3' && (
                    <div style={{ background: C.bgDeep, border: `1px dashed ${C.lineStrong}`, borderRadius: 2, padding: '18px 22px', marginBottom: 22 }}>
                      <div style={{ ...eyebrow, fontSize: 10, marginBottom: 10, color: C.creamMuted }}>What's missing</div>
                      <ul style={{ margin: 0, padding: '0 0 0 18px' }}>
                        {(sil.unmentioned_stakeholders || []).map((s, i) => (
                          <li key={`u${i}`} style={{ fontSize: 14, color: C.cream, lineHeight: 1.7, marginBottom: 4 }}>{s}</li>
                        ))}
                        {(sil.avoided_topics || []).map((s, i) => (
                          <li key={`a${i}`} style={{ fontSize: 14, color: C.cream, lineHeight: 1.7, marginBottom: 4 }}>{s}</li>
                        ))}
                      </ul>
                      {sil.emotional_undercurrent && (
                        <p style={{ fontFamily: F.serif, fontStyle: 'italic', fontSize: 16, color: C.cream, lineHeight: 1.6, marginTop: 14, marginBottom: 0 }}>{sil.emotional_undercurrent}</p>
                      )}
                      {(sil.missing_thinking_modes || []).length > 0 && (
                        <div style={{ marginTop: 14, paddingTop: 12, borderTop: `1px dashed ${C.line}` }}>
                          <div style={{ ...eyebrow, fontSize: 10, marginBottom: 8, color: C.creamMuted }}>Lenses the room didn't bring</div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                            {(sil.missing_thinking_modes || []).map((m, i) => (
                              <span key={i} title={m.what_it_would_have_seen || ''} style={{
                                background: hatColorFor(m.hat), color: C.bgDeep,
                                padding: '3px 10px', borderRadius: 999, fontSize: 11,
                                fontFamily: F.sans, letterSpacing: '0.08em',
                                cursor: m.what_it_would_have_seen ? 'help' : 'default',
                              }}>{m.hat} Hat</span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {r.id === 'r4' && reframe && (
                    <div style={{ background: 'rgba(232, 201, 123, 0.08)', borderLeft: `4px solid ${C.sage}`, borderRadius: 2, padding: '22px 26px', marginBottom: 22 }}>
                      <p style={{ fontFamily: F.serif, fontSize: 24, fontStyle: 'italic', color: C.cream, lineHeight: 1.4, margin: 0 }}>"{reframe}"</p>
                    </div>
                  )}

                  <p style={{
                    fontFamily: F.serif, fontStyle: 'italic', fontSize: 15,
                    color: C.sage, lineHeight: 1.6, margin: 0,
                    paddingTop: 14, borderTop: `1px dashed ${C.line}`,
                  }}>
                    <span style={{ ...eyebrow, fontSize: 10, marginRight: 10, fontStyle: 'normal' }}>Facilitator note —</span>
                    {r.note}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div style={{ marginTop: 40 }}>
        <button onClick={onContinue} style={btn('primary')}
          onMouseEnter={btnHoverIn} onMouseLeave={btnHoverOut}>
          We've finished the rounds — continue to Forge →
        </button>
      </div>
    </PhaseShell>
  );
}

// =============================================================================
// PHASE 4.5: FORGE — build on what shifted (standalone phase between Collide and Decide)
// =============================================================================

function PhaseForge({ mode, synthesis, collisionState, setCollisionState, onContinue, onBack }) {
  const accent = accentFor(mode);
  const accentDim = accentDimFor(mode);
  const clusters = synthesis?.recommendation_clusters || [];
  const added = collisionState?.divergenceEdits?.added || [];
  const struckMap = collisionState?.divergenceEdits?.struck || {};
  const bridge = synthesis?.bridging_insights || {};
  const reframed = synthesis?.crux_identification?.the_real_question || '';

  const survivingClusters = clusters.filter((_, i) => !struckMap[i]);

  const shifted = collisionState?.shiftedNotes || '';
  const setShifted = (v) => setCollisionState((p) => ({ ...p, shiftedNotes: v }));

  return (
    <PhaseShell>
      <BackLink onClick={onBack} />
      <ProgressBar phase="forge" mode={mode} />

      <div style={{ ...eyebrow, marginBottom: 12 }}>Phase 5 — Forge</div>
      <h2 style={{ ...heading(46), marginBottom: 16 }}>
        Build on what <em style={{ color: accent, fontStyle: 'italic' }}>shifted</em>.
      </h2>
      <p style={{ fontFamily: F.serif, fontSize: 19, color: C.cream, lineHeight: 1.55, marginBottom: 16, maxWidth: 720, fontStyle: 'italic' }}>
        The conversation happened. Now: what's different than when you walked in? Not the recommendations — the thinking underneath them.
      </p>
      <p style={{ fontSize: 15, color: C.creamMuted, lineHeight: 1.7, maxWidth: 720, marginBottom: 36 }}>
        Go around the room. Each person names one specific thing they heard — from another perspective, or from the missing voices — that genuinely changed how they're thinking. Then: how does that change what we should do next?
      </p>

      {/* Perspectives in play — surviving clusters + any added in the room */}
      <div style={{ ...eyebrow, fontSize: 10, marginBottom: 12, color: C.creamMuted }}>The perspectives in play</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 30 }}>
        {survivingClusters.map((c, i) => (
          <div key={i} style={{
            background: C.bgDeep, borderLeft: `3px solid ${accent}`,
            borderRadius: 2, padding: '14px 18px',
          }}>
            <p style={{ fontFamily: F.serif, fontSize: 17, color: C.cream, margin: '0 0 4px', fontStyle: 'italic' }}>{c.label}</p>
            <p style={{ fontSize: 13, color: C.creamMuted, margin: 0, lineHeight: 1.6 }}>
              <span style={{ color: accent, marginRight: 6 }}>{(c.supporters || []).join(', ') || '—'}:</span>
              {c.summary}
            </p>
          </div>
        ))}
        {added.length > 0 && added.map((a) => (
          <div key={a.id} style={{
            background: 'rgba(232, 201, 123, 0.10)',
            borderLeft: `3px solid ${accent}`,
            borderRadius: 2, padding: '14px 18px',
          }}>
            <div style={{ ...eyebrow, fontSize: 9, color: accent, marginBottom: 4 }}>Added in the room</div>
            <p style={{ fontFamily: F.serif, fontSize: 17, color: C.cream, margin: 0, fontStyle: 'italic', lineHeight: 1.55 }}>{a.text}</p>
          </div>
        ))}
      </div>

      {/* Bridging recap — what unlikely allies actually agree on */}
      {((bridge.shared_ground || []).length > 0 || (bridge.unlikely_bedfellows || []).length > 0) && (
        <div style={{ marginBottom: 30 }}>
          <div style={{ ...eyebrow, fontSize: 10, marginBottom: 12, color: C.good }}>Shared ground worth building from</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {(bridge.shared_ground || []).map((s, i) => (
              <div key={`sg${i}`} style={{
                background: 'rgba(159, 190, 127, 0.08)',
                borderLeft: `3px solid ${C.good}`,
                padding: '12px 16px',
                borderRadius: 2,
              }}>
                <p style={{ fontFamily: F.serif, fontSize: 16, color: C.cream, margin: 0, fontStyle: 'italic', lineHeight: 1.55 }}>{s}</p>
              </div>
            ))}
            {(bridge.unlikely_bedfellows || []).map((u, i) => (
              <div key={`ub${i}`} style={{
                background: 'rgba(159, 190, 127, 0.05)',
                borderLeft: `3px solid ${C.good}`,
                padding: '12px 16px',
                borderRadius: 2,
              }}>
                <p style={{ fontFamily: F.serif, fontSize: 16, color: C.cream, margin: '0 0 4px', fontStyle: 'italic', lineHeight: 1.55 }}>"{u.agreement}"</p>
                {(u.who || []).length > 0 && (
                  <p style={{ fontSize: 12, color: C.creamMuted, margin: 0 }}>— {(u.who || []).join(', ')}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Capture out loud prompts */}
      <div style={{ background: 'rgba(232, 201, 123, 0.08)', border: `1px solid ${accentDim}`, borderLeft: `4px solid ${C.good}`, borderRadius: 2, padding: '22px 26px', marginBottom: 30 }}>
        <div style={{ ...eyebrow, fontSize: 10, marginBottom: 14, color: C.good }}>Capture out loud</div>
        <ul style={{ margin: 0, padding: '0 0 0 18px', color: C.cream, fontSize: 15, lineHeight: 1.85 }}>
          <li style={{ marginBottom: 6 }}><strong style={{ color: C.cream }}>One thing that shifted —</strong> <em style={{ color: C.creamMuted, fontStyle: 'italic' }}>"I heard X say Y, and it changed how I'm thinking about Z."</em></li>
          <li style={{ marginBottom: 6 }}><strong style={{ color: C.cream }}>What you'd add —</strong> a piece of the recommendation that wasn't there before this conversation.</li>
          <li><strong style={{ color: C.cream }}>Where the synthesis is now stronger —</strong> what combination of these perspectives gets you somewhere none of them got alone.</li>
        </ul>
      </div>

      {/* CAPTURE: what actually shifted (free text — carries into Results) */}
      <div style={{ marginBottom: 30 }}>
        <label style={fieldLabel}>What shifted — in your own words</label>
        <p style={{ fontSize: 12, color: C.creamMuted, fontStyle: 'italic', margin: '0 0 10px', maxWidth: 680 }}>
          Capture the substance, not the summary. What's actually different about how the group is now thinking? This will surface in your final results.
        </p>
        <textarea
          value={shifted} onChange={(e) => setShifted(e.target.value)}
          rows={6} style={{ ...fieldInput, borderLeft: `3px solid ${accent}` }}
          placeholder="e.g. We thought this was a build-vs-buy decision. After hearing the operations view, we realized it's actually about who owns the failure case for the next 18 months."
          onFocus={(e) => { e.currentTarget.style.borderColor = accentMutedFor(mode); e.currentTarget.style.borderLeftColor = accent; }}
          onBlur={(e) => { e.currentTarget.style.borderColor = C.line; e.currentTarget.style.borderLeftColor = accent; }}
        />
      </div>

      <p style={{
        fontFamily: F.serif, fontStyle: 'italic', fontSize: 15,
        color: accent, lineHeight: 1.6, margin: '0 0 30px',
        paddingTop: 16, borderTop: `1px dashed ${C.line}`,
      }}>
        <span style={{ ...eyebrow, fontSize: 10, marginRight: 10, fontStyle: 'normal' }}>Facilitator note —</span>
        This is where the value of the collision actually shows up. If nothing shifted for anyone, the conversation didn't happen yet — name that and try again.
      </p>

      <button onClick={onContinue} style={btn('primary')}
        onMouseEnter={btnHoverIn} onMouseLeave={btnHoverOut}>
        Continue to Decide →
      </button>
    </PhaseShell>
  );
}

// =============================================================================
// PHASE 5: DECISION FRAMING
// =============================================================================

function PhaseDecision({ mode, frame, synthesis, decision, setDecision, sessionCode, onContinue, onBack }) {
  const reframed = synthesis?.crux_identification?.the_real_question || '';
  const [local, setLocal] = useState(decision || {
    actual: reframed || frame?.decision || '',
    chose: '', against: '',
    revisit: '', stakeholders: '', firstMove: '',
    useMinSpecs: false,
  });
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const accent = accentFor(mode);

  const update = (k, v) => setLocal((p) => ({ ...p, [k]: v }));
  const toggleMinSpecs = () => setLocal((p) => ({ ...p, useMinSpecs: !p.useMinSpecs }));

  const proceed = async () => {
    if (!local.actual.trim()) { setErr('At minimum, say what was decided.'); return; }
    setDecision(local);
    if (mode === 'facilitate' && sessionCode) {
      setBusy(true);
      await storageSet(`cc:${sessionCode}:decision`, local);
      setBusy(false);
    }
    onContinue();
  };

  return (
    <PhaseShell>
      <BackLink onClick={onBack} />
      <ProgressBar phase="decision" mode={mode} />

      <div style={{ ...eyebrow, marginBottom: 12 }}>Phase 6 — Decide</div>
      <h2 style={{ ...heading(40), marginBottom: 16 }}>
        Make it <em style={{ color: C.sage, fontStyle: 'italic' }}>real</em>.
      </h2>
      <p style={{ fontFamily: F.serif, fontSize: 19, color: C.cream, lineHeight: 1.55, marginBottom: 36, maxWidth: 720, fontStyle: 'italic' }}>
        Capture what the group landed on, what was given up, and what would cause you to revisit. The first move is what makes the decision exist outside this room.
      </p>

      <ErrorBox message={err} onDismiss={() => setErr('')} />

      {/* Min Specs toggle — Liberating Structure #14 */}
      <div style={{
        background: C.bgCard, border: `1px solid ${C.line}`,
        borderRadius: 4, padding: '14px 18px', marginBottom: 28,
        display: 'flex', alignItems: 'flex-start', gap: 14, flexWrap: 'wrap',
      }}>
        <button onClick={toggleMinSpecs} style={{
          background: local.useMinSpecs ? accent : 'transparent',
          color: local.useMinSpecs ? C.bgDeep : C.creamMuted,
          border: `1px solid ${local.useMinSpecs ? accent : C.line}`,
          padding: '6px 12px', borderRadius: 2, cursor: 'pointer',
          fontFamily: F.sans, fontSize: 11, letterSpacing: '0.14em',
          textTransform: 'uppercase', whiteSpace: 'nowrap', flexShrink: 0,
          transition: 'all 0.2s ease',
        }}>{local.useMinSpecs ? '✓ Min Specs on' : 'Use Min Specs'}</button>
        <p style={{ fontSize: 13, color: C.creamMuted, lineHeight: 1.6, margin: 0, flex: 1, minWidth: 220 }}>
          <strong style={{ color: C.cream }}>Min Specs</strong> — when your group has too many ideas about what to do, force a different question: <em style={{ fontStyle: 'italic' }}>what's the minimum we must do (must-haves), and the minimum we must not do (must-not-haves)?</em> Tightens loose consensus into something the group can actually own. From Liberating Structures.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 30, marginBottom: 40 }}>
        <div>
          <label style={fieldLabel}>The decision we're making</label>
          <textarea
            value={local.actual} onChange={(e) => update('actual', e.target.value)}
            rows={3} style={fieldInput}
            onFocus={(e) => { e.currentTarget.style.borderColor = C.sageMuted; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = C.line; }}
          />
          <p style={{ fontSize: 12, color: C.creamMuted, marginTop: 6, fontStyle: 'italic' }}>
            This may have changed from the original frame. That's often the point.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 22 }}>
          <div>
            <label style={fieldLabel}>{local.useMinSpecs ? 'Must-haves (minimum to do)' : 'What we agree on'}</label>
            {local.useMinSpecs && (
              <p style={{ fontSize: 12, color: C.creamMuted, fontStyle: 'italic', margin: '0 0 8px' }}>
                The minimum set of things that MUST be true / done for this to work. Strip out everything that's nice-to-have.
              </p>
            )}
            <textarea
              value={local.chose} onChange={(e) => update('chose', e.target.value)}
              rows={5} style={{ ...fieldInput, borderLeft: `3px solid ${C.good}` }}
              onFocus={(e) => { e.currentTarget.style.borderColor = C.sageMuted; e.currentTarget.style.borderLeftColor = C.good; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = C.line; e.currentTarget.style.borderLeftColor = C.good; }}
            />
          </div>
          <div>
            <label style={fieldLabel}>{local.useMinSpecs ? 'Must-not-haves (minimum to avoid)' : 'What we are willing to sacrifice / give up'}</label>
            {local.useMinSpecs && (
              <p style={{ fontSize: 12, color: C.creamMuted, fontStyle: 'italic', margin: '0 0 8px' }}>
                The minimum set of things that MUST NOT happen. The boundaries that break the deal if crossed.
              </p>
            )}
            <textarea
              value={local.against} onChange={(e) => update('against', e.target.value)}
              rows={5} style={{ ...fieldInput, borderLeft: `3px solid ${C.warning}` }}
              onFocus={(e) => { e.currentTarget.style.borderColor = C.sageMuted; e.currentTarget.style.borderLeftColor = C.warning; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = C.line; e.currentTarget.style.borderLeftColor = C.warning; }}
            />
            {!local.useMinSpecs && (
              <p style={{ fontSize: 12, color: C.creamMuted, marginTop: 6, fontStyle: 'italic' }}>
                What's being given up matters as much as what's being chosen. Name it.
              </p>
            )}
          </div>
        </div>

        <div>
          <label style={fieldLabel}>Who needs to know</label>
          <textarea
            value={local.stakeholders} onChange={(e) => update('stakeholders', e.target.value)}
            rows={3} style={fieldInput}
            onFocus={(e) => { e.currentTarget.style.borderColor = C.sageMuted; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = C.line; }}
          />
        </div>

        <div>
          <label style={fieldLabel}>First move</label>
          <textarea
            value={local.firstMove} onChange={(e) => update('firstMove', e.target.value)}
            rows={3} style={{ ...fieldInput, borderLeft: `3px solid ${C.sage}` }}
            onFocus={(e) => { e.currentTarget.style.borderColor = C.sageMuted; e.currentTarget.style.borderLeftColor = C.sage; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = C.line; e.currentTarget.style.borderLeftColor = C.sage; }}
          />
          <p style={{ fontSize: 12, color: C.creamMuted, marginTop: 6, fontStyle: 'italic' }}>
            The single next action that makes this decision real. One thing. Someone owns it.
          </p>
        </div>

        <div>
          <label style={fieldLabel}>We will revisit this if / when...</label>
          <textarea
            value={local.revisit} onChange={(e) => update('revisit', e.target.value)}
            rows={3} style={fieldInput}
            onFocus={(e) => { e.currentTarget.style.borderColor = C.sageMuted; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = C.line; }}
          />
          <p style={{ fontSize: 12, color: C.creamMuted, marginTop: 6, fontStyle: 'italic' }}>
            What would make the group reopen this? Specific signals, not "if things change."
          </p>
        </div>
      </div>

      <button
        onClick={proceed} disabled={busy}
        style={btn('primary', busy)}
        data-disabled={busy ? 'true' : 'false'}
        onMouseEnter={btnHoverIn} onMouseLeave={btnHoverOut}
      >{busy ? 'Saving...' : 'See the wrap-up →'}</button>
    </PhaseShell>
  );
}

// =============================================================================
// PHASE 6: RESULTS
// =============================================================================

function PhaseResults({ mode, frame, synthesis, decision, collisionState, sessionCode, onRestart, onBack }) {
  const reframed = synthesis?.crux_identification?.the_real_question || '';
  const original = frame?.decision || '';
  const clusters = synthesis?.recommendation_clusters || [];

  const flaggedAssumptions = (synthesis?.assumption_map || []).filter(
    (_, i) => collisionState?.assumptions?.[i] === 'tested' || collisionState?.assumptions?.[i] === 'doesnt-hold'
  );
  const failedAssumptions = (synthesis?.assumption_map || []).filter(
    (_, i) => collisionState?.assumptions?.[i] === 'doesnt-hold'
  );
  const untestedFlagged = (synthesis?.assumption_map || []).filter(
    (_, i) => !collisionState?.assumptions?.[i] || collisionState?.assumptions?.[i] === 'untested'
  );
  const struckMap = collisionState?.divergenceEdits?.struck || {};
  const addedDivergences = collisionState?.divergenceEdits?.added || [];
  const struckClusters = clusters.filter((_, i) => struckMap[i]);
  const hasDivergenceShift = struckClusters.length > 0 || addedDivergences.length > 0;

  const shiftedNotes = collisionState?.shiftedNotes || '';
  const useMinSpecs = !!decision?.useMinSpecs;
  const bridge = synthesis?.bridging_insights || {};
  const hasBridges = (bridge.shared_ground || []).length > 0 || (bridge.unlikely_bedfellows || []).length > 0 || (bridge.hidden_consensus && bridge.hidden_consensus.trim());

  const docHTML = () => {
    const today = new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
    const agreeLabel = useMinSpecs ? 'Must-haves (minimum to do)' : 'What we agree on';
    const sacrificeLabel = useMinSpecs ? 'Must-not-haves (minimum to avoid)' : 'What we are willing to sacrifice / give up';
    let html = `<p class="eyebrow">Creative Collision · InciteU</p>
<h1>${escapeHTML(decision?.actual || '(unspecified decision)')}</h1>
<p class="meta">${escapeHTML(today)}${sessionCode ? ' · Session ' + escapeHTML(sessionCode) : ''}</p>

<h2>The question we set out to answer</h2>
<p>${escapeHTML(original || '—')}</p>
`;
    if (reframed && reframed.trim() !== original.trim()) {
      html += `<h2>The question we actually answered</h2>
<p class="italic">"${escapeHTML(reframed)}"</p>`;
    }
    html += `<h2>${escapeHTML(agreeLabel)}</h2>
<p>${escapeHTML(decision?.chose || '—').replace(/\n/g, '<br>')}</p>

<h2>${escapeHTML(sacrificeLabel)}</h2>
<p>${escapeHTML(decision?.against || '—').replace(/\n/g, '<br>')}</p>

<h2>Who needs to know</h2>
<p>${escapeHTML(decision?.stakeholders || '—').replace(/\n/g, '<br>')}</p>

<h2>First move</h2>
<div class="callout">${escapeHTML(decision?.firstMove || '—').replace(/\n/g, '<br>')}</div>

<h2>We will revisit this if / when...</h2>
<p>${escapeHTML(decision?.revisit || '—').replace(/\n/g, '<br>')}</p>
`;

    if (shiftedNotes.trim()) {
      html += `<h2>What shifted in the conversation</h2>
<p>${escapeHTML(shiftedNotes).replace(/\n/g, '<br>')}</p>`;
    }
    if (hasBridges) {
      html += `<h2>Where unlikely allies agreed</h2>`;
      if ((bridge.shared_ground || []).length > 0) {
        html += `<p><em>Shared ground across the divide:</em></p><ul>`;
        (bridge.shared_ground || []).forEach((s) => {
          html += `<li>${escapeHTML(s)}</li>`;
        });
        html += `</ul>`;
      }
      if ((bridge.unlikely_bedfellows || []).length > 0) {
        html += `<p><em>Unlikely bedfellows:</em></p><ul>`;
        (bridge.unlikely_bedfellows || []).forEach((u) => {
          html += `<li><strong>${escapeHTML(u.agreement)}</strong>${(u.who || []).length > 0 ? ' — ' + escapeHTML((u.who || []).join(', ')) : ''}${u.why_it_matters ? '<br><em>Why it matters: ' + escapeHTML(u.why_it_matters) + '</em>' : ''}</li>`;
        });
        html += `</ul>`;
      }
      if (bridge.hidden_consensus && bridge.hidden_consensus.trim()) {
        html += `<p><em>Hidden consensus — a position no one named but most reads implied:</em></p>
<p class="italic">"${escapeHTML(bridge.hidden_consensus)}"</p>`;
      }
    }
    if (failedAssumptions.length > 0) {
      html += `<h2>Assumptions that didn't survive — the recommendation may need to be reconsidered</h2><ul>`;
      failedAssumptions.forEach((a) => {
        html += `<li><strong>${escapeHTML(a.assumption)}</strong> — held by ${escapeHTML((a.holders || []).join(', '))}<br><em>Why it didn't hold: ${escapeHTML(a.challenge)}</em></li>`;
      });
      html += `</ul>`;
    }
    if (untestedFlagged.length > 0) {
      html += `<h2>Assumptions still untested — open questions worth revisiting</h2><ul>`;
      untestedFlagged.forEach((a) => {
        html += `<li><strong>${escapeHTML(a.assumption)}</strong> — held by ${escapeHTML((a.holders || []).join(', '))}<br><em>Challenge: ${escapeHTML(a.challenge)}</em></li>`;
      });
      html += `</ul>`;
    }
    if (synthesis?.divergence_map?.core_disagreement) {
      html += `<h2>The core disagreement we navigated</h2>
<p class="italic">${escapeHTML(synthesis.divergence_map.core_disagreement)}</p>`;
    }
    if (hasDivergenceShift) {
      html += `<h2>How the divergence picture changed in the room</h2>`;
      if (struckClusters.length > 0) {
        html += `<p><em>Clusters the group struck — these didn't capture where we actually were:</em></p><ul>`;
        struckClusters.forEach((c) => {
          html += `<li><strong>${escapeHTML(c.label)}</strong> — ${escapeHTML(c.summary || '')}</li>`;
        });
        html += `</ul>`;
      }
      if (addedDivergences.length > 0) {
        html += `<p><em>Divergences the group surfaced in the room:</em></p><ul>`;
        addedDivergences.forEach((a) => {
          html += `<li>${escapeHTML(a.text)}</li>`;
        });
        html += `</ul>`;
      }
    }
    html += `<div class="divider"></div><p class="meta">Generated by Creative Collision — a companion tool to the InciteU Pre-Mortem.</p>`;
    return html;
  };

  const plainText = () => {
    const today = new Date().toLocaleDateString();
    const agreeLabel = useMinSpecs ? 'MUST-HAVES (MINIMUM TO DO)' : 'WHAT WE AGREE ON';
    const sacrificeLabel = useMinSpecs ? 'MUST-NOT-HAVES (MINIMUM TO AVOID)' : 'WHAT WE ARE WILLING TO SACRIFICE / GIVE UP';
    let t = `CREATIVE COLLISION — ${today}${sessionCode ? ' — Session ' + sessionCode : ''}\n\n`;
    t += `DECISION:\n${decision?.actual || '—'}\n\n`;
    t += `ORIGINAL QUESTION:\n${original || '—'}\n\n`;
    if (reframed && reframed.trim() !== original.trim()) t += `REFRAMED QUESTION:\n"${reframed}"\n\n`;
    t += `${agreeLabel}:\n${decision?.chose || '—'}\n\n`;
    t += `${sacrificeLabel}:\n${decision?.against || '—'}\n\n`;
    t += `WHO NEEDS TO KNOW:\n${decision?.stakeholders || '—'}\n\n`;
    t += `FIRST MOVE:\n${decision?.firstMove || '—'}\n\n`;
    t += `WE WILL REVISIT THIS IF / WHEN:\n${decision?.revisit || '—'}\n\n`;
    if (shiftedNotes.trim()) {
      t += `WHAT SHIFTED IN THE CONVERSATION:\n${shiftedNotes}\n\n`;
    }
    if (hasBridges) {
      t += `WHERE UNLIKELY ALLIES AGREED:\n`;
      if ((bridge.shared_ground || []).length > 0) {
        t += `Shared ground:\n`;
        (bridge.shared_ground || []).forEach((s) => { t += `- ${s}\n`; });
      }
      if ((bridge.unlikely_bedfellows || []).length > 0) {
        t += `Unlikely bedfellows:\n`;
        (bridge.unlikely_bedfellows || []).forEach((u) => {
          t += `- "${u.agreement}"${(u.who || []).length > 0 ? ' — ' + (u.who || []).join(', ') : ''}${u.why_it_matters ? ' (Why: ' + u.why_it_matters + ')' : ''}\n`;
        });
      }
      if (bridge.hidden_consensus && bridge.hidden_consensus.trim()) {
        t += `Hidden consensus (a position no one named but most reads implied):\n"${bridge.hidden_consensus}"\n`;
      }
      t += `\n`;
    }
    if (failedAssumptions.length > 0) {
      t += `ASSUMPTIONS THAT DIDN'T SURVIVE — RECOMMENDATION MAY NEED RECONSIDERING:\n`;
      failedAssumptions.forEach((a) => {
        t += `- "${a.assumption}" (held by ${(a.holders || []).join(', ')}) — Why it didn't hold: ${a.challenge}\n`;
      });
      t += `\n`;
    }
    if (untestedFlagged.length > 0) {
      t += `ASSUMPTIONS STILL UNTESTED — OPEN QUESTIONS WORTH REVISITING:\n`;
      untestedFlagged.forEach((a) => {
        t += `- "${a.assumption}" (held by ${(a.holders || []).join(', ')}) — Challenge: ${a.challenge}\n`;
      });
      t += `\n`;
    }
    if (synthesis?.divergence_map?.core_disagreement) {
      t += `CORE DISAGREEMENT NAVIGATED:\n${synthesis.divergence_map.core_disagreement}\n\n`;
    }
    if (hasDivergenceShift) {
      t += `HOW THE DIVERGENCE PICTURE CHANGED IN THE ROOM:\n`;
      if (struckClusters.length > 0) {
        t += `Clusters the group struck (didn't capture where we actually were):\n`;
        struckClusters.forEach((c) => {
          t += `- ${c.label} — ${c.summary || ''}\n`;
        });
      }
      if (addedDivergences.length > 0) {
        t += `Divergences the group surfaced in the room:\n`;
        addedDivergences.forEach((a) => {
          t += `- ${a.text}\n`;
        });
      }
    }
    return t;
  };

  const [copied, setCopied] = useState(false);
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(plainText());
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch (e) {
      // ignore
    }
  };

  const download = () => {
    const stamp = new Date().toISOString().slice(0, 10);
    downloadDoc(`creative-collision-${stamp}`, docHTML());
  };

  return (
    <PhaseShell>
      <BackLink onClick={onBack} />
      <ProgressBar phase="results" mode={mode} />

      <div style={{ ...eyebrow, marginBottom: 12 }}>Phase 7 — Move</div>
      <h2 style={{ ...heading(46), marginBottom: 16 }}>
        The <em style={{ color: C.sage, fontStyle: 'italic' }}>collision</em>, mapped.
      </h2>
      <p style={{ fontFamily: F.serif, fontSize: 19, color: C.cream, lineHeight: 1.55, marginBottom: 36, maxWidth: 720, fontStyle: 'italic' }}>
        Send this to the stakeholders. Put the first move on someone's calendar today.
      </p>

      {reframed && reframed.trim() !== original.trim() && (
        <div style={{ ...cardStyle, marginBottom: 26, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 24 }}>
          <div>
            <div style={{ ...eyebrow, fontSize: 10, marginBottom: 8 }}>The question we set out to answer</div>
            <p style={{ fontSize: 15, color: C.creamMuted, lineHeight: 1.7, margin: 0 }}>{original}</p>
          </div>
          <div>
            <div style={{ ...eyebrow, fontSize: 10, marginBottom: 8 }}>The question we actually answered</div>
            <p style={{ fontFamily: F.serif, fontSize: 17, fontStyle: 'italic', color: C.cream, lineHeight: 1.55, margin: 0 }}>"{reframed}"</p>
          </div>
        </div>
      )}

      <div style={{ ...cardStyle, marginBottom: 26 }}>
        <div style={{ ...eyebrow, fontSize: 10, marginBottom: 10 }}>Decision</div>
        <p style={{ fontFamily: F.serif, fontSize: 22, color: C.cream, lineHeight: 1.5, margin: 0, fontStyle: 'italic' }}>{decision?.actual || '—'}</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16, marginBottom: 26 }}>
        <div style={{ ...cardStyle, borderLeft: `3px solid ${C.good}` }}>
          <div style={{ ...eyebrow, fontSize: 10, color: C.good, marginBottom: 10 }}>{useMinSpecs ? 'Must-haves (minimum to do)' : 'What we agree on'}</div>
          <p style={{ fontSize: 15, color: C.cream, lineHeight: 1.7, margin: 0, whiteSpace: 'pre-wrap' }}>{decision?.chose || '—'}</p>
        </div>
        <div style={{ ...cardStyle, borderLeft: `3px solid ${C.warning}` }}>
          <div style={{ ...eyebrow, fontSize: 10, color: C.warning, marginBottom: 10 }}>{useMinSpecs ? 'Must-not-haves (minimum to avoid)' : 'What we are willing to sacrifice / give up'}</div>
          <p style={{ fontSize: 15, color: C.cream, lineHeight: 1.7, margin: 0, whiteSpace: 'pre-wrap' }}>{decision?.against || '—'}</p>
        </div>
      </div>

      <div style={{ ...cardStyle, marginBottom: 26 }}>
        <div style={{ ...eyebrow, fontSize: 10, marginBottom: 10 }}>Who needs to know</div>
        <p style={{ fontSize: 15, color: C.cream, lineHeight: 1.7, margin: 0, whiteSpace: 'pre-wrap' }}>{decision?.stakeholders || '—'}</p>
      </div>

      <div style={{ ...cardStyle, marginBottom: 26, borderLeft: `3px solid ${accentFor(mode)}` }}>
        <div style={{ ...eyebrow, fontSize: 10, marginBottom: 10 }}>First move</div>
        <p style={{ fontFamily: F.serif, fontSize: 19, color: C.cream, lineHeight: 1.55, margin: 0, fontStyle: 'italic' }}>{decision?.firstMove || '—'}</p>
      </div>

      <div style={{ ...cardStyle, marginBottom: 26 }}>
        <div style={{ ...eyebrow, fontSize: 10, marginBottom: 10 }}>We will revisit this if / when...</div>
        <p style={{ fontSize: 15, color: C.cream, lineHeight: 1.7, margin: 0, whiteSpace: 'pre-wrap' }}>{decision?.revisit || '—'}</p>
      </div>

      {shiftedNotes.trim() && (
        <div style={{ ...cardStyle, marginBottom: 26, borderLeft: `3px solid ${accentFor(mode)}` }}>
          <div style={{ ...eyebrow, fontSize: 10, marginBottom: 10, color: accentFor(mode) }}>What shifted in the conversation</div>
          <p style={{ fontFamily: F.serif, fontSize: 17, color: C.cream, lineHeight: 1.6, margin: 0, fontStyle: 'italic', whiteSpace: 'pre-wrap' }}>{shiftedNotes}</p>
        </div>
      )}

      {hasBridges && (
        <div style={{ ...cardStyle, marginBottom: 26, borderLeft: `3px solid ${C.good}`, background: 'rgba(159, 190, 127, 0.05)' }}>
          <div style={{ ...eyebrow, fontSize: 10, color: C.good, marginBottom: 14 }}>Where unlikely allies agreed</div>
          {(bridge.shared_ground || []).length > 0 && (
            <div style={{ marginBottom: (bridge.unlikely_bedfellows || []).length > 0 || bridge.hidden_consensus ? 16 : 0 }}>
              <div style={{ fontSize: 12, color: C.creamMuted, fontStyle: 'italic', marginBottom: 8 }}>Shared ground:</div>
              <ul style={{ margin: 0, padding: '0 0 0 18px' }}>
                {(bridge.shared_ground || []).map((s, i) => (
                  <li key={i} style={{ fontFamily: F.serif, fontSize: 15, color: C.cream, lineHeight: 1.6, fontStyle: 'italic', marginBottom: 4 }}>{s}</li>
                ))}
              </ul>
            </div>
          )}
          {(bridge.unlikely_bedfellows || []).length > 0 && (
            <div style={{ marginBottom: bridge.hidden_consensus ? 16 : 0 }}>
              <div style={{ fontSize: 12, color: C.creamMuted, fontStyle: 'italic', marginBottom: 8 }}>Unlikely bedfellows:</div>
              {(bridge.unlikely_bedfellows || []).map((u, i) => (
                <div key={i} style={{ marginBottom: i < (bridge.unlikely_bedfellows || []).length - 1 ? 10 : 0 }}>
                  <p style={{ fontFamily: F.serif, fontSize: 15, color: C.cream, lineHeight: 1.55, margin: '0 0 4px', fontStyle: 'italic' }}>"{u.agreement}"</p>
                  {(u.who || []).length > 0 && (
                    <p style={{ fontSize: 12, color: C.creamMuted, margin: 0 }}>— {(u.who || []).join(', ')}{u.why_it_matters ? ' · ' + u.why_it_matters : ''}</p>
                  )}
                </div>
              ))}
            </div>
          )}
          {bridge.hidden_consensus && bridge.hidden_consensus.trim() && (
            <div>
              <div style={{ fontSize: 12, color: C.creamMuted, fontStyle: 'italic', marginBottom: 8 }}>Hidden consensus:</div>
              <p style={{ fontFamily: F.serif, fontSize: 15, color: C.cream, lineHeight: 1.6, margin: 0, fontStyle: 'italic' }}>"{bridge.hidden_consensus}"</p>
            </div>
          )}
        </div>
      )}

      {failedAssumptions.length > 0 && (
        <div style={{ ...cardStyle, marginBottom: 26, borderLeft: `4px solid ${C.warning}`, background: 'rgba(226, 165, 126, 0.08)' }}>
          <div style={{ ...eyebrow, fontSize: 10, color: C.warning, marginBottom: 6 }}>Assumptions that didn't survive</div>
          <p style={{ fontFamily: F.serif, fontStyle: 'italic', fontSize: 15, color: C.cream, lineHeight: 1.55, margin: '0 0 16px' }}>
            These broke under scrutiny. The recommendation may need to be reconsidered before the first move.
          </p>
          {failedAssumptions.map((a, i) => (
            <div key={i} style={{ marginBottom: i < failedAssumptions.length - 1 ? 16 : 0, paddingBottom: i < failedAssumptions.length - 1 ? 16 : 0, borderBottom: i < failedAssumptions.length - 1 ? `1px solid ${C.line}` : 'none' }}>
              <p style={{ fontFamily: F.serif, fontSize: 17, color: C.cream, lineHeight: 1.55, margin: '0 0 8px', fontStyle: 'italic' }}>"{a.assumption}"</p>
              <p style={{ fontSize: 13, color: C.creamMuted, lineHeight: 1.6, margin: 0 }}>{(a.holders || []).join(', ')} — Why it didn't hold: {a.challenge}</p>
            </div>
          ))}
        </div>
      )}

      {untestedFlagged.length > 0 && (
        <div style={{ ...cardStyle, marginBottom: 26, borderLeft: `3px solid ${C.warning}` }}>
          <div style={{ ...eyebrow, fontSize: 10, color: C.warning, marginBottom: 14 }}>Assumptions still untested — worth owning</div>
          {untestedFlagged.map((a, i) => (
            <div key={i} style={{ marginBottom: i < untestedFlagged.length - 1 ? 16 : 0, paddingBottom: i < untestedFlagged.length - 1 ? 16 : 0, borderBottom: i < untestedFlagged.length - 1 ? `1px solid ${C.line}` : 'none' }}>
              <p style={{ fontFamily: F.serif, fontSize: 17, color: C.cream, lineHeight: 1.55, margin: '0 0 8px', fontStyle: 'italic' }}>"{a.assumption}"</p>
              <p style={{ fontSize: 13, color: C.creamMuted, lineHeight: 1.6, margin: 0 }}>{(a.holders || []).join(', ')} — Challenge: {a.challenge}</p>
            </div>
          ))}
        </div>
      )}

      {hasDivergenceShift && (
        <div style={{ ...cardStyle, marginBottom: 26, borderLeft: `3px solid ${C.sage}`, background: 'rgba(232, 201, 123, 0.05)' }}>
          <div style={{ ...eyebrow, fontSize: 10, marginBottom: 14, color: C.sage }}>What shifted in the conversation</div>
          {struckClusters.length > 0 && (
            <div style={{ marginBottom: addedDivergences.length > 0 ? 18 : 0 }}>
              <div style={{ fontSize: 12, color: C.creamMuted, fontStyle: 'italic', marginBottom: 10 }}>Clusters the group struck — these didn't capture where we actually were:</div>
              {struckClusters.map((c, i) => (
                <div key={i} style={{ marginBottom: i < struckClusters.length - 1 ? 10 : 0, opacity: 0.65 }}>
                  <p style={{ fontFamily: F.serif, fontSize: 16, color: C.cream, margin: '0 0 4px', fontStyle: 'italic', textDecoration: 'line-through' }}>{c.label}</p>
                  <p style={{ fontSize: 13, color: C.creamMuted, margin: 0, lineHeight: 1.6, textDecoration: 'line-through' }}>{c.summary}</p>
                </div>
              ))}
            </div>
          )}
          {addedDivergences.length > 0 && (
            <div>
              <div style={{ fontSize: 12, color: C.creamMuted, fontStyle: 'italic', marginBottom: 10 }}>Divergences the group surfaced in the room:</div>
              {addedDivergences.map((a, i) => (
                <div key={a.id} style={{ marginBottom: i < addedDivergences.length - 1 ? 10 : 0, paddingLeft: 12, borderLeft: `2px solid ${C.sage}` }}>
                  <p style={{ fontFamily: F.serif, fontSize: 16, color: C.cream, margin: 0, fontStyle: 'italic', lineHeight: 1.55 }}>{a.text}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 40 }}>
        <button onClick={download} style={btn('primary')}
          onMouseEnter={btnHoverIn} onMouseLeave={btnHoverOut}>
          Download as .doc
        </button>
        <button onClick={copyToClipboard} style={btn('secondary')}
          onMouseEnter={btnSecondaryHoverIn} onMouseLeave={btnSecondaryHoverOut}>
          {copied ? '✓ Copied' : 'Copy as text'}
        </button>
        <button onClick={onRestart} style={btn('secondary')}
          onMouseEnter={btnSecondaryHoverIn} onMouseLeave={btnSecondaryHoverOut}>
          New collision
        </button>
      </div>
    </PhaseShell>
  );
}

// =============================================================================
// FACILITATOR — SESSION SETUP (generate or reuse code)
// =============================================================================

function FacilitatorSetup({ onContinue, onBack }) {
  const [code, setCode] = useState(() => generateSessionCode());
  const [customCode, setCustomCode] = useState('');
  const [useCustom, setUseCustom] = useState(false);
  const [copied, setCopied] = useState(false);

  // The code as it will land in the shareable URL — whichever input is active right now
  const currentCode = useCustom
    ? customCode.trim().toLowerCase().replace(/\s+/g, '-')
    : code;
  const shareableUrl = (typeof window !== 'undefined' && currentCode)
    ? `${window.location.origin}${window.location.pathname}?code=${encodeURIComponent(currentCode)}`
    : '';

  const proceed = () => {
    if (!currentCode) return;
    onContinue(currentCode);
  };

  const copyUrl = async () => {
    if (!shareableUrl) return;
    try {
      await navigator.clipboard.writeText(shareableUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error('clipboard write failed', e);
    }
  };

  return (
    <PhaseShell>
      <BackLink onClick={onBack} />
      <div style={{ ...eyebrow, marginBottom: 14 }}>Start a session</div>
      <h1 style={{ ...heading(42), marginBottom: 24 }}>
        Your <em style={{ color: C.sage, fontStyle: 'italic' }}>session code</em>.
      </h1>
      <p style={{ fontFamily: F.serif, fontSize: 19, color: C.cream, lineHeight: 1.55, marginBottom: 36, maxWidth: 680, fontStyle: 'italic' }}>
        This code is what participants enter to submit their read. Make a note of it — it's the only way the tool knows which session contributions belong to.
      </p>

      <div style={{
        background: 'rgba(232, 201, 123, 0.08)', border: `1px solid ${C.sageDim}`,
        borderRadius: 6, padding: '32px 36px', marginBottom: 28, maxWidth: 600,
      }}>
        <div style={{ ...eyebrow, marginBottom: 14 }}>Session</div>
        {useCustom ? (
          <input
            type="text" value={customCode} onChange={(e) => setCustomCode(e.target.value)}
            placeholder="e.g. q4-budget-call"
            style={{ ...fieldInput, fontFamily: F.serif, fontSize: 32, padding: '14px 16px', background: 'rgba(255,255,255,0.04)' }}
            onFocus={(e) => { e.currentTarget.style.borderColor = C.sageMuted; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = C.line; }}
          />
        ) : (
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 16, flexWrap: 'wrap' }}>
            <span style={{ fontFamily: F.serif, fontSize: 44, color: C.cream, letterSpacing: '0.02em', lineHeight: 1 }}>{code}</span>
            <button onClick={() => setCode(generateSessionCode())} style={{
              background: 'transparent', border: 'none', color: C.creamMuted,
              cursor: 'pointer', fontFamily: F.sans, fontSize: 12,
              letterSpacing: '0.18em', textTransform: 'uppercase', padding: 0,
            }}>Regenerate ↻</button>
          </div>
        )}
        <button onClick={() => setUseCustom((u) => !u)} style={{
          background: 'transparent', border: 'none', color: C.sage,
          cursor: 'pointer', fontFamily: F.sans, fontSize: 12,
          letterSpacing: '0.18em', textTransform: 'uppercase', padding: 0, marginTop: 18,
        }}>{useCustom ? '← Use generated code' : 'Use a custom code'}</button>
      </div>

      <div style={{
        background: 'rgba(216, 176, 124, 0.06)', border: `1px solid ${C.collabDim}`,
        borderRadius: 6, padding: '22px 26px', marginBottom: 28, maxWidth: 600,
      }}>
        <div style={{ ...eyebrow, marginBottom: 12, color: C.collab }}>Shareable link</div>
        <p style={{ fontSize: 13, color: C.creamMuted, lineHeight: 1.6, margin: '0 0 14px' }}>
          Send this to participants instead of (or alongside) the code. Opens straight to their perspective form &mdash; they just enter their name.
        </p>
        <div style={{
          background: 'rgba(0, 0, 0, 0.18)', border: `1px solid ${C.line}`,
          borderRadius: 4, padding: '12px 14px', marginBottom: 14,
          fontFamily: F.sans, fontSize: 13, color: C.cream,
          wordBreak: 'break-all', lineHeight: 1.5,
        }}>
          {shareableUrl || <span style={{ color: C.creamMuted, fontStyle: 'italic' }}>Enter a custom code to generate a link…</span>}
        </div>
        <button onClick={copyUrl} disabled={!shareableUrl} style={{
          background: copied ? C.good : 'transparent',
          color: copied ? C.bgDeep : C.collab,
          border: `1px solid ${copied ? C.good : C.collab}`,
          padding: '8px 14px', borderRadius: 2, cursor: shareableUrl ? 'pointer' : 'not-allowed',
          fontFamily: F.sans, fontSize: 11, letterSpacing: '0.18em',
          textTransform: 'uppercase', transition: 'all 0.2s ease',
          opacity: shareableUrl ? 1 : 0.5,
        }}>
          {copied ? '✓ Copied' : 'Copy link'}
        </button>
      </div>

      <p style={{ fontSize: 14, color: C.creamMuted, fontStyle: 'italic', maxWidth: 600, marginBottom: 36 }}>
        Codes don't expire and aren't password-protected — anyone with the code can submit a read. Pick something unique enough that strangers won't collide with you.
      </p>

      <button onClick={proceed}
        style={btn('primary')}
        onMouseEnter={btnHoverIn} onMouseLeave={btnHoverOut}>
        Continue to framing →
      </button>
    </PhaseShell>
  );
}

// =============================================================================
// MAIN APP
// =============================================================================

export default function CreativeCollisionPage() {
  const navigate = useAppNavigate();

  // mode: null (landing), 'solo' | 'contribute' | 'facilitate'
  const [mode, setMode] = useState(null);

  // facilitator/contributor identity
  const [sessionCode, setSessionCode] = useState('');
  const [contributorName, setContributorName] = useState('');

  // shared state
  const [frame, setFrame] = useState(null);
  const [reads, setReads] = useState([]);
  const [soloRead, setSoloRead] = useState(null);
  const [synthesis, setSynthesis] = useState(null);
  const [collisionState, setCollisionState] = useState({ assumptions: {} });
  const [decision, setDecision] = useState(null);

  // navigation
  // For solo/facilitate: phase = 'setup' | 'frame' | 'reads' | 'pull' | 'synthesis' | 'collision' | 'decision' | 'results'
  // For contribute: phase = 'entry' | 'frame' | 'reads' | 'done'
  const [phase, setPhase] = useState(null);

  // ---- URL-driven entry: if ?code=... is present, jump straight to contributor flow ----
  useEffect(() => {
    if (mode !== null) return;
    try {
      const params = new URLSearchParams(window.location.search);
      const urlCode = (params.get('code') || '').trim().toLowerCase();
      if (urlCode) {
        setSessionCode(urlCode);
        setMode('contribute');
        setPhase('entry');
      }
    } catch (e) {
      // ignore (SSR / older browser)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---- Mode dispatch ----
  const chooseMode = (m) => {
    setMode(m);
    if (m === 'solo') setPhase('frame');
    else if (m === 'contribute') setPhase('entry');
    else if (m === 'facilitate') setPhase('setup');
  };

  const restart = () => {
    setMode(null); setSessionCode(''); setContributorName('');
    setFrame(null); setReads([]); setSoloRead(null);
    setSynthesis(null); setCollisionState({ assumptions: {} }); setDecision(null);
    setPhase(null);
  };

  // ---- Shared frame wrap ----
  return (
    <>
      <div style={{
        background: C.bgDeep, color: C.cream, minHeight: '100vh',
        fontFamily: F.sans, fontWeight: 300, fontSize: 16, lineHeight: 1.6,
      }}>
        {/* Minimal header */}
        <header style={{
          padding: '24px 30px', borderBottom: `1px solid ${C.line}`,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          flexWrap: 'wrap', gap: 12,
        }}>
          <button onClick={restart} style={{
            background: 'transparent', border: 'none', cursor: 'pointer',
            padding: 0, textAlign: 'left',
          }}>
            <span style={{ fontFamily: F.serif, fontSize: 22, color: C.cream, fontStyle: 'italic' }}>
              Creative <span style={{ color: accentFor(mode) }}>Collision</span>
            </span>
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
            <a onClick={(e) => { e.preventDefault(); navigate('home'); }} href="#"
               style={{ color: C.creamMuted, textDecoration: 'none', fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase', cursor: 'pointer' }}>
              ← Back to tools
            </a>
            <span style={{ ...eyebrow, fontSize: 10, color: C.creamMuted }}>
              A tool by <span style={{ color: accentFor(mode) }}>InciteU</span>
            </span>
          </div>
        </header>

        {/* Landing */}
        {mode === null && <Landing onChoose={chooseMode} />}

        {/* CONTRIBUTE FLOW */}
        {mode === 'contribute' && phase === 'entry' && (
          <ContributorEntry
            onContinue={({ code, name, frame: f }) => {
              setSessionCode(code); setContributorName(name); setFrame(f);
              setPhase('frame');
            }}
            onBack={restart}
            prefilledCode={sessionCode}
          />
        )}
        {mode === 'contribute' && phase === 'frame' && (
          <PhaseFrame
            mode={mode} frame={frame} setFrame={setFrame}
            sessionCode={sessionCode} readOnly={true}
            onContinue={() => setPhase('reads')}
            onBack={() => setPhase('entry')}
          />
        )}
        {mode === 'contribute' && phase === 'reads' && (
          <PhaseReads
            mode={mode} sessionCode={sessionCode}
            contributorName={contributorName} frame={frame}
            soloRead={null} setSoloRead={() => {}}
            onSubmit={() => setPhase('done')}
            onBack={() => setPhase('frame')}
          />
        )}
        {mode === 'contribute' && phase === 'done' && (
          <ContributorThankYou
            contributorName={contributorName} frame={frame}
            onDone={restart}
          />
        )}

        {/* FACILITATE FLOW */}
        {mode === 'facilitate' && phase === 'setup' && (
          <FacilitatorSetup
            onContinue={(code) => { setSessionCode(code); setPhase('frame'); }}
            onBack={restart}
          />
        )}
        {mode === 'facilitate' && phase === 'frame' && (
          <PhaseFrame
            mode={mode} frame={frame} setFrame={setFrame}
            sessionCode={sessionCode} readOnly={false}
            onContinue={() => setPhase('pull')}
            onBack={() => setPhase('setup')}
          />
        )}
        {mode === 'facilitate' && phase === 'pull' && (
          <FacilitatorPullScreen
            sessionCode={sessionCode} frame={frame}
            onContinue={(fetched) => { setReads(fetched); setPhase('synthesis'); }}
            onBack={() => setPhase('frame')}
          />
        )}
        {mode === 'facilitate' && phase === 'synthesis' && (
          <PhaseSynthesis
            mode={mode} frame={frame} reads={reads}
            synthesis={synthesis} setSynthesis={setSynthesis}
            onContinue={() => setPhase('collision')}
            onBack={() => setPhase('pull')}
          />
        )}
        {mode === 'facilitate' && phase === 'collision' && (
          <PhaseCollision
            mode={mode} synthesis={synthesis}
            collisionState={collisionState} setCollisionState={setCollisionState}
            onContinue={() => setPhase('forge')}
            onBack={() => setPhase('synthesis')}
          />
        )}
        {mode === 'facilitate' && phase === 'forge' && (
          <PhaseForge
            mode={mode} synthesis={synthesis}
            collisionState={collisionState} setCollisionState={setCollisionState}
            onContinue={() => setPhase('decision')}
            onBack={() => setPhase('collision')}
          />
        )}
        {mode === 'facilitate' && phase === 'decision' && (
          <PhaseDecision
            mode={mode} frame={frame} synthesis={synthesis}
            decision={decision} setDecision={setDecision}
            sessionCode={sessionCode}
            onContinue={() => setPhase('results')}
            onBack={() => setPhase('forge')}
          />
        )}
        {mode === 'facilitate' && phase === 'results' && (
          <PhaseResults
            mode={mode} frame={frame} synthesis={synthesis}
            decision={decision} collisionState={collisionState}
            sessionCode={sessionCode}
            onRestart={restart}
            onBack={() => setPhase('decision')}
          />
        )}

        {/* SOLO FLOW */}
        {mode === 'solo' && phase === 'frame' && (
          <PhaseFrame
            mode={mode} frame={frame} setFrame={setFrame}
            sessionCode="" readOnly={false}
            onContinue={() => setPhase('reads')}
            onBack={restart}
          />
        )}
        {mode === 'solo' && phase === 'reads' && (
          <PhaseReads
            mode={mode} sessionCode=""
            contributorName="You" frame={frame}
            soloRead={soloRead} setSoloRead={setSoloRead}
            onSubmit={(r) => { setReads([r]); setPhase('synthesis'); }}
            onBack={() => setPhase('frame')}
          />
        )}
        {mode === 'solo' && phase === 'synthesis' && (
          <PhaseSynthesis
            mode={mode} frame={frame} reads={reads}
            synthesis={synthesis} setSynthesis={setSynthesis}
            onContinue={() => setPhase('collision')}
            onBack={() => setPhase('reads')}
          />
        )}
        {mode === 'solo' && phase === 'collision' && (
          <PhaseCollision
            mode={mode} synthesis={synthesis}
            collisionState={collisionState} setCollisionState={setCollisionState}
            onContinue={() => setPhase('forge')}
            onBack={() => setPhase('synthesis')}
          />
        )}
        {mode === 'solo' && phase === 'forge' && (
          <PhaseForge
            mode={mode} synthesis={synthesis}
            collisionState={collisionState} setCollisionState={setCollisionState}
            onContinue={() => setPhase('decision')}
            onBack={() => setPhase('collision')}
          />
        )}
        {mode === 'solo' && phase === 'decision' && (
          <PhaseDecision
            mode={mode} frame={frame} synthesis={synthesis}
            decision={decision} setDecision={setDecision}
            sessionCode=""
            onContinue={() => setPhase('results')}
            onBack={() => setPhase('forge')}
          />
        )}
        {mode === 'solo' && phase === 'results' && (
          <PhaseResults
            mode={mode} frame={frame} synthesis={synthesis}
            decision={decision} collisionState={collisionState}
            sessionCode=""
            onRestart={restart}
            onBack={() => setPhase('decision')}
          />
        )}

        {/* Minimal footer */}
        <footer style={{
          padding: '32px 30px', borderTop: `1px solid ${C.line}`,
          textAlign: 'center', marginTop: 60,
        }}>
          <p style={{ fontSize: 11, color: C.creamMuted, letterSpacing: '0.18em', textTransform: 'uppercase', margin: 0 }}>
            © InciteU · Jennifer May
          </p>
        </footer>
      </div>
    </>
  );
}
