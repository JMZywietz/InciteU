import React, { useState, useEffect } from 'react';
import { C, F } from '../theme.js';
import { btn, btnHoverIn, btnHoverOut, eyebrow, heading, fieldLabel, fieldInput } from '../styles.js';
import { useAppNavigate } from '../lib/useAppNavigate.js';
import { escapeHTML } from '../lib/utils.js';
import { synthesize, extractText } from '../lib/synthesize.js';
import SEO from '../components/SEO.jsx';

// ============================================================================
// IDENTITY BOX
// ----------------------------------------------------------------------------
// A reflective exercise on what you work to project (outside the box) and
// what you work to protect (inside). User writes three labels for each side,
// sees them rendered on an actual box, can peel labels off to surface what
// might become possible without them, then writes deeper reflections, and
// (optionally) gets an AI synthesis.
// ============================================================================

const PROJECT_TILTS = ['-2deg', '0.5deg', '1.5deg'];
const PROTECT_TILTS = ['0.5deg', '-1.5deg', '1deg'];

export default function IdentityBoxPage() {
  const navigate = useAppNavigate();
  const [step, setStep] = useState(1);
  const [aiEnabled, setAiEnabled] = useState(false);
  const [projectLabels, setProjectLabels] = useState(['', '', '']);
  const [protectLabels, setProtectLabels] = useState(['', '', '']);
  const [peeled, setPeeled] = useState({});       // { 'project-0': true, 'protect-1': true, ... }
  const [whispers, setWhispers] = useState({});   // AI-generated insights per peeled label
  const [peelLoading, setPeelLoading] = useState({});
  const [reflections, setReflections] = useState({});  // { 'project-0': '...', 'protect-2': '...' }
  const [synthesis, setSynthesis] = useState('');
  const [synthLoading, setSynthLoading] = useState(false);

  useEffect(() => { window.scrollTo({ top: 0, behavior: 'smooth' }); }, [step]);

  // Load html2pdf for PDF download
  useEffect(() => {
    if (!window.html2pdf && !document.querySelector('script[src*="html2pdf"]')) {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  // --------------------------------------------------------------------------
  // State helpers
  // --------------------------------------------------------------------------
  function updateLabel(side, i, value) {
    if (side === 'project') {
      setProjectLabels((arr) => arr.map((v, idx) => idx === i ? value : v));
    } else {
      setProtectLabels((arr) => arr.map((v, idx) => idx === i ? value : v));
    }
  }

  function setReflection(key, value) {
    setReflections((r) => ({ ...r, [key]: value }));
  }

  // --------------------------------------------------------------------------
  // Peel a label off the box. First click peels (lifts + fades + fetches AI
  // whisper). Second click puts it back. Whispers are cached so a re-peel
  // doesn't re-fetch.
  // --------------------------------------------------------------------------
  async function peelLabel(side, i, label) {
    const key = `${side}-${i}`;
    if (peeled[key]) {
      // Put it back
      setPeeled((p) => { const n = { ...p }; delete n[key]; return n; });
      return;
    }
    setPeeled((p) => ({ ...p, [key]: true }));
    if (whispers[key]) return; // already cached

    setPeelLoading((p) => ({ ...p, [key]: true }));
    const prompt = side === 'project'
      ? `Someone is exploring their identity. They wrote "${label}" on the OUTSIDE of their identity box — a quality they work hard to project, that they want to be seen as. They've just peeled this label off, imagining for a moment they didn't need to be seen this way.

Write a single brief sentence (under 25 words) that gently names what might become possible. Begin with "Without needing to be seen as ${label}..." or similar. Be specific and warm. Don't preach or list. Just one quiet observation. No metaphors about clothing or containers — they've already done that work.`
      : `Someone is exploring their identity. They wrote "${label}" on the INSIDE of their identity box — a quality they fear being seen as, that they work hard to protect against. They've just peeled this label off, imagining for a moment they were less afraid of it being true.

Write a single brief sentence (under 25 words) that gently names what might become possible. Begin with "A version of you that's less afraid of being seen as ${label}..." or similar. Be specific and warm. Don't preach or list. Just one quiet observation. No metaphors about clothing or containers — they've already done that work.`;

    try {
      const data = await synthesize({
        model: 'claude-sonnet-4-5',
        max_tokens: 200,
        messages: [{ role: 'user', content: prompt }],
      });
      setWhispers((w) => ({ ...w, [key]: extractText(data).trim() }));
    } catch (e) {
      setWhispers((w) => ({ ...w, [key]: '' }));
    }
    setPeelLoading((p) => { const n = { ...p }; delete n[key]; return n; });
  }

  // --------------------------------------------------------------------------
  // Final synthesis: looks at full pattern between project/protect, the
  // reflections, and offers a 3-paragraph coach-style observation.
  // --------------------------------------------------------------------------
  async function generateSynthesis() {
    setSynthLoading(true);
    setSynthesis('');

    const reflLines = [];
    projectLabels.forEach((label, i) => {
      if (!label) return;
      const r = reflections[`project-${i}`];
      reflLines.push(`On a holiday from "${label}": ${r || '—'}`);
    });
    protectLabels.forEach((label, i) => {
      if (!label) return;
      const r = reflections[`protect-${i}`];
      reflLines.push(`On being 5% less afraid of "${label}": ${r || '—'}`);
    });

    const prompt = `You are a thoughtful, warm coach. Someone has just completed an Identity Box exercise. Here's what they shared:

OUTSIDE THE BOX (what they work to project):
${projectLabels.filter(Boolean).map((l) => `- ${l}`).join('\n')}

INSIDE THE BOX (what they work to protect against):
${protectLabels.filter(Boolean).map((l) => `- ${l}`).join('\n')}

THEIR REFLECTIONS:
${reflLines.join('\n')}

Write a warm, specific 3-paragraph reflection that:
1) Notices the pattern between what they project and what they protect. Is there a tension, a mirror, a hidden cost? Be concrete and use their actual words.
2) Names — without judgment — the energetic cost of holding this identity together. Where does the work of being one thing AND not being another quietly take effort?
3) Offers a specific, small invitation. Not "work on yourself." Pick one of their actual labels and suggest a concrete experiment in setting it down — even briefly.

Voice: warm, conversational, specific, second-person ("you"). No platitudes. No generic coaching speak. No clothing or container metaphors — they've already done that work. Around 220-300 words total.`;

    try {
      const data = await synthesize({
        model: 'claude-sonnet-4-5',
        max_tokens: 1000,
        messages: [{ role: 'user', content: prompt }],
      });
      setSynthesis(extractText(data));
    } catch (e) {
      setSynthesis('AI synthesis is unavailable right now. Your reflections above stand on their own.');
    }
    setSynthLoading(false);
  }

  // --------------------------------------------------------------------------
  // Static HTML doc for PDF/email
  // --------------------------------------------------------------------------
  function buildHTMLDoc() {
    const date = new Date().toLocaleDateString();
    const projectItems = projectLabels.filter(Boolean).map((l) => `<div class="outside-label">${escapeHTML(l)}</div>`).join('');
    const protectItems = protectLabels.filter(Boolean).map((l) => `<div class="inside-label">${escapeHTML(l)}</div>`).join('');

    const whisperItems = Object.keys(peeled).map((key) => {
      const [side, idx] = key.split('-');
      const label = side === 'project' ? projectLabels[idx] : protectLabels[idx];
      const w = whispers[key];
      if (!label || !w) return '';
      return `<div class="whisper"><div class="whisper-label">Without "${escapeHTML(label)}"</div><div class="whisper-text">${escapeHTML(w)}</div></div>`;
    }).filter(Boolean).join('');

    const reflectionItems = [];
    projectLabels.forEach((label, i) => {
      if (!label) return;
      const r = reflections[`project-${i}`];
      if (!r) return;
      reflectionItems.push(`<div class="refl"><div class="refl-q">A holiday from being <em>${escapeHTML(label)}</em> might make possible…</div><div class="refl-a">${escapeHTML(r)}</div></div>`);
    });
    protectLabels.forEach((label, i) => {
      if (!label) return;
      const r = reflections[`protect-${i}`];
      if (!r) return;
      reflectionItems.push(`<div class="refl"><div class="refl-q">If I were 5% less afraid of being seen as <em>${escapeHTML(label)}</em>, I might…</div><div class="refl-a">${escapeHTML(r)}</div></div>`);
    });

    return `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Identity Box</title>
<style>
  body { font-family: Georgia, serif; max-width: 720px; margin: 40px auto; padding: 0 24px; color: #2A2A2A; line-height: 1.65; }
  h1 { font-size: 32px; font-weight: 400; color: #1F3937; margin-bottom: 8px; }
  .sub { color: #6A7A6E; font-size: 14px; margin-bottom: 40px; font-style: italic; }
  h2 { font-size: 22px; color: #1F3937; margin-top: 40px; margin-bottom: 16px; font-weight: 400; border-bottom: 1px solid #E0DFD2; padding-bottom: 8px; }
  .box-wrap { margin: 30px 0 40px; padding: 0 20px; }
  .outside-stack { display: flex; flex-direction: column; align-items: center; gap: 10px; margin-bottom: 18px; }
  .outside-label { font-style: italic; font-size: 22px; color: #1F3937; }
  .box { border: 1.5px solid #8FA876; border-radius: 4px; padding: 36px 24px; background: #F5F2E8; min-height: 160px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 10px; }
  .inside-label { font-style: italic; font-size: 20px; color: #6A7A6E; }
  .whisper { background: #F0F4E5; padding: 16px 20px; border-left: 3px solid #8FA876; margin: 14px 0; }
  .whisper-label { font-size: 11px; letter-spacing: 0.15em; text-transform: uppercase; color: #6B8159; margin-bottom: 6px; }
  .whisper-text { font-style: italic; color: #1F3937; }
  .refl { margin-bottom: 22px; }
  .refl-q { font-size: 14px; color: #6A7A6E; margin-bottom: 6px; }
  .refl-a { font-size: 16px; color: #2A2A2A; padding-left: 16px; border-left: 2px solid #C5D49B; }
  .ai { background: #F0F4E5; padding: 24px; border-left: 3px solid #8FA876; margin-top: 30px; }
  .closing { text-align: center; margin: 50px 0 30px; color: #4A5C50; font-style: italic; font-size: 18px; line-height: 1.7; }
  .footer { margin-top: 50px; padding-top: 20px; border-top: 1px solid #E0DFD2; font-size: 12px; color: #999; text-align: center; }
</style></head><body>
<h1>Identity Box</h1>
<div class="sub">Your reflections, ${date}</div>

<h2>Your box</h2>
<div class="box-wrap">
  <div class="outside-stack">${projectItems || '<div class="outside-label">—</div>'}</div>
  <div class="box">${protectItems || '<div class="inside-label">—</div>'}</div>
</div>

${whisperItems ? `<h2>What you noticed</h2>${whisperItems}` : ''}

${reflectionItems.length ? `<h2>Six small invitations</h2>${reflectionItems.join('')}` : ''}

${synthesis ? `<div class="ai"><h2 style="margin-top:0;border:none;padding:0;">A reflection on what you've shared</h2><p>${escapeHTML(synthesis).replace(/\n/g, '<br><br>')}</p></div>` : ''}

<div class="closing">
  Your identity is a good thing. It got you here.<br>
  And it is an expensive thing — you spend a lot of subconscious effort managing it.<br>
  You can loosen these clothes. You can keep growing. You can shape who you become next.
</div>
<div class="footer">From InciteU · Tools for the work of becoming</div>
</body></html>`;
  }

  function downloadPDF() {
    if (!window.html2pdf) {
      alert('PDF library still loading. Try again in a moment, or use the email option.');
      return;
    }
    const html = buildHTMLDoc();
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const styleEl = doc.querySelector('style');
    const styleHTML = styleEl ? styleEl.outerHTML : '';
    const container = document.createElement('div');
    container.innerHTML = styleHTML + doc.body.innerHTML;
    container.style.cssText = 'position:fixed;left:-9999px;top:0;width:720px;background:#fff;';
    document.body.appendChild(container);
    window.html2pdf().set({
      margin: [12, 12, 12, 12],
      filename: `identity-box-${new Date().toISOString().slice(0, 10)}.pdf`,
      image: { type: 'jpeg', quality: 0.95 },
      html2canvas: { scale: 2, useCORS: true, backgroundColor: '#ffffff' },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      pagebreak: { mode: ['avoid-all', 'css', 'legacy'] },
    }).from(container).save().then(() => {
      document.body.removeChild(container);
    }).catch(() => {
      document.body.removeChild(container);
      alert('PDF generation failed. Try the email option instead.');
    });
  }

  function emailMyself() {
    let body = `My Identity Box — ${new Date().toLocaleDateString()}\n\n`;
    body += `WHAT I WORK TO PROJECT (outside the box)\n`;
    projectLabels.forEach((l, i) => { if (l) body += `${i + 1}. ${l}\n`; });
    body += `\nWHAT I WORK TO PROTECT (inside the box)\n`;
    protectLabels.forEach((l, i) => { if (l) body += `${i + 1}. ${l}\n`; });
    body += `\n`;

    const peelKeys = Object.keys(peeled).filter((k) => whispers[k]);
    if (peelKeys.length) {
      body += `WHAT I NOTICED WHEN I PEELED LABELS OFF\n`;
      peelKeys.forEach((k) => {
        const [side, idx] = k.split('-');
        const label = side === 'project' ? projectLabels[idx] : protectLabels[idx];
        body += `Without "${label}": ${whispers[k]}\n`;
      });
      body += `\n`;
    }

    body += `MY REFLECTIONS\n`;
    projectLabels.forEach((label, i) => {
      const r = reflections[`project-${i}`];
      if (!label || !r) return;
      body += `A holiday from being "${label}" might make possible: ${r}\n`;
    });
    protectLabels.forEach((label, i) => {
      const r = reflections[`protect-${i}`];
      if (!label || !r) return;
      body += `If I were 5% less afraid of being seen as "${label}", I might: ${r}\n`;
    });
    body += `\n`;

    if (synthesis) body += `A REFLECTION ON WHAT I SHARED\n${synthesis}\n\n`;
    body += `—\nFrom InciteU · Tools for the work of becoming`;

    const subject = encodeURIComponent('My Identity Box');
    window.location.href = `mailto:?subject=${subject}&body=${encodeURIComponent(body)}`;
  }

  // --------------------------------------------------------------------------
  // Render helpers for the visual box (used in step 4)
  // --------------------------------------------------------------------------
  function renderBox({ interactive }) {
    return (
      <div style={{ position: 'relative', maxWidth: 560, margin: '0 auto' }}>
        {/* Outside labels stacked above */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, marginBottom: 24, minHeight: 110 }}>
          {projectLabels.map((label, i) => {
            if (!label) return null;
            const key = `project-${i}`;
            const isPeeled = !!peeled[key];
            return (
              <button
                key={i}
                onClick={interactive ? () => peelLabel('project', i, label) : undefined}
                disabled={!interactive}
                style={{
                  background: 'transparent',
                  border: 'none',
                  fontFamily: F.serif,
                  fontStyle: 'italic',
                  fontWeight: 400,
                  fontSize: i === 0 ? 26 : 22,
                  color: isPeeled ? 'rgba(240, 235, 219, 0.22)' : C.cream,
                  cursor: interactive ? 'pointer' : 'default',
                  padding: '4px 14px',
                  transform: isPeeled
                    ? `rotate(${PROJECT_TILTS[i]}) translateY(-10px)`
                    : `rotate(${PROJECT_TILTS[i]})`,
                  transition: 'all 0.55s cubic-bezier(.2,.7,.3,1)',
                  letterSpacing: '0.005em',
                  textAlign: 'center',
                  lineHeight: 1.2,
                }}
              >
                {label}
              </button>
            );
          })}
        </div>

        {/* The box */}
        <div style={{
          border: `1.5px solid ${C.sage}`,
          borderRadius: 4,
          background: 'rgba(42, 71, 68, 0.55)',
          padding: '50px 30px',
          minHeight: 240,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 16,
          boxShadow: `inset 0 0 40px rgba(0,0,0,0.18)`,
        }}>
          {protectLabels.every((l) => !l) && (
            <div style={{ color: C.creamMuted, fontStyle: 'italic', fontFamily: F.serif }}>—</div>
          )}
          {protectLabels.map((label, i) => {
            if (!label) return null;
            const key = `protect-${i}`;
            const isPeeled = !!peeled[key];
            return (
              <button
                key={i}
                onClick={interactive ? () => peelLabel('protect', i, label) : undefined}
                disabled={!interactive}
                style={{
                  background: 'transparent',
                  border: 'none',
                  fontFamily: F.serif,
                  fontStyle: 'italic',
                  fontWeight: 400,
                  fontSize: 20,
                  color: isPeeled ? 'rgba(201, 194, 174, 0.22)' : C.creamMuted,
                  cursor: interactive ? 'pointer' : 'default',
                  padding: '2px 10px',
                  transform: isPeeled
                    ? `rotate(${PROTECT_TILTS[i]}) translateY(-8px)`
                    : `rotate(${PROTECT_TILTS[i]})`,
                  transition: 'all 0.55s cubic-bezier(.2,.7,.3,1)',
                  textAlign: 'center',
                  lineHeight: 1.2,
                }}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  function renderWhispers() {
    const peelKeys = Object.keys(peeled);
    if (peelKeys.length === 0) return null;
    return (
      <div style={{ marginTop: 48, paddingTop: 32, borderTop: `1px solid ${C.line}` }}>
        <div style={{ ...eyebrow, marginBottom: 22 }}>What you peeled away</div>
        {peelKeys.map((key) => {
          const [side, idxStr] = key.split('-');
          const idx = parseInt(idxStr, 10);
          const label = side === 'project' ? projectLabels[idx] : protectLabels[idx];
          if (!label) return null;
          const w = whispers[key];
          const loading = peelLoading[key];
          return (
            <div key={key} style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase', color: C.sage, marginBottom: 8 }}>
                Without &ldquo;{label}&rdquo;
              </div>
              <div style={{ fontFamily: F.serif, fontStyle: 'italic', fontSize: 19, lineHeight: 1.6, color: C.cream }}>
                {loading
                  ? <span style={{ color: C.creamMuted }}>Listening for what's underneath&hellip;</span>
                  : (w || <span style={{ color: C.creamMuted }}>(no whisper this time — that's okay)</span>)}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // --------------------------------------------------------------------------
  // Validation
  // --------------------------------------------------------------------------
  const projectFilled = projectLabels.filter((l) => l.trim()).length;
  const protectFilled = protectLabels.filter((l) => l.trim()).length;

  // ==========================================================================
  // RENDER
  // ==========================================================================
  return (
    <main style={{ animation: 'fadeIn 0.4s ease', minHeight: '80vh', padding: '60px 6vw 80px', maxWidth: 820, margin: '0 auto' }}>
      <SEO
        title="The Identity Box: What You Project vs. What You Protect | InciteU"
        description="A reflective leadership exercise on the labels you work to project — and the ones you work to protect against. Free, 15 minutes, with optional AI synthesis."
        path="/tools/self/identity-box"
      />
      <a onClick={(e) => { e.preventDefault(); navigate('home'); }} href="#"
         style={{ display: 'inline-block', color: C.creamMuted, textDecoration: 'none', fontSize: 12, letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 40, cursor: 'pointer' }}>
        ← Back to tools
      </a>

      <div style={{ display: 'flex', gap: 8, marginBottom: 40, alignItems: 'center' }}>
        {[1, 2, 3, 4, 5, 6].map((n) => (
          <div key={n} style={{ height: 4, flex: 1, background: n < step ? C.sageMuted : n === step ? C.sage : C.line, borderRadius: 2, transition: 'background 0.4s' }} />
        ))}
      </div>

      {/* ==================================================================== */}
      {/* STEP 1 — INTRO                                                       */}
      {/* ==================================================================== */}
      {step === 1 && (
        <div style={{ animation: 'fadeIn 0.4s ease' }}>
          <h1 style={{ ...heading(60), marginBottom: 20 }}>
            Identity <em style={{ color: C.sage, fontStyle: 'italic' }}>box</em>.
          </h1>
          <p style={{ fontFamily: F.serif, fontSize: 22, lineHeight: 1.55, color: C.cream, marginTop: 16, marginBottom: 32, maxWidth: 640 }}>
            A look at what you work to project &mdash; and what you work to protect.
          </p>
          <p style={{ fontSize: 15, lineHeight: 1.7, color: C.creamMuted, maxWidth: 600, marginBottom: 36 }}>
            You'll imagine a box that represents you. On the outside go the things you want people to see. On the inside, the things you don't.
            <br /><br />
            You'll write three labels for each side &mdash; then see them on an actual box. You'll be able to peel one off and notice what shifts. After that, a few small reflections.
            <br /><br />
            It takes around <em style={{ color: C.sage, fontStyle: 'italic', fontFamily: F.serif, fontSize: 17 }}>15 minutes</em>. Nothing is saved on this site &mdash; what you write is yours to download or email to yourself when you're done.
          </p>
          <label style={{ display: 'flex', alignItems: 'flex-start', gap: 14, background: C.bgCard, padding: '22px 24px', borderRadius: 4, marginBottom: 32, cursor: 'pointer', border: `1px solid ${C.line}` }}>
            <input type="checkbox" checked={aiEnabled} onChange={(e) => { const v = e.target.checked; setAiEnabled(v); if (!v) setSynthesis(''); }} style={{ width: 22, height: 22, marginTop: 2, accentColor: C.sage, cursor: 'pointer' }} />
            <div>
              <span style={{ display: 'block', color: C.cream, fontSize: 15, marginBottom: 4 }}>Add an AI synthesis at the end</span>
              <span style={{ color: C.creamMuted, fontSize: 13, lineHeight: 1.5 }}>A coach-style reflection on the pattern between what you project and what you protect. Optional. Included in your download if you turn it on.</span>
            </div>
          </label>
          <button onClick={() => setStep(2)} style={btn('primary')} onMouseEnter={btnHoverIn} onMouseLeave={btnHoverOut}>I'm ready</button>
        </div>
      )}

      {/* ==================================================================== */}
      {/* STEP 2 — OUTSIDE (PROJECT)                                           */}
      {/* ==================================================================== */}
      {step === 2 && (
        <div style={{ animation: 'fadeIn 0.4s ease' }}>
          <h2 style={{ ...heading(40), fontSize: 'clamp(28px, 4vw, 42px)', marginBottom: 12 }}>
            <span style={{ color: C.sage, fontStyle: 'italic', marginRight: 12 }}>Outside.</span>What you work to project.
          </h2>
          <p style={{ fontFamily: F.serif, fontSize: 19, lineHeight: 1.55, color: C.cream, marginBottom: 14, maxWidth: 640, fontStyle: 'italic' }}>
            Imagine you're walking down a hallway at work. You pass a room. Inside are three or four people you like and respect, and for some reason they don't see you walk by.
          </p>
          <p style={{ fontFamily: F.serif, fontSize: 19, lineHeight: 1.55, color: C.cream, marginBottom: 14, maxWidth: 640, fontStyle: 'italic' }}>
            You stop. You can hear them. They're talking about you &mdash; and they're saying the most wonderful, resonant things.
          </p>
          <p style={{ fontFamily: F.serif, fontSize: 19, lineHeight: 1.55, color: C.cream, marginBottom: 36, maxWidth: 640, fontStyle: 'italic' }}>
            What are they saying? Keep listening. Write down three things that would fill you with delight to hear.
          </p>

          {[0, 1, 2].map((i) => (
            <div key={i} style={{ marginBottom: 20 }}>
              <label style={fieldLabel}>Outside label {i + 1}</label>
              <input
                type="text"
                value={projectLabels[i]}
                onChange={(e) => updateLabel('project', i, e.target.value)}
                style={{ ...fieldInput }}
                placeholder={i === 0 ? "A word or short phrase…" : ''}
                maxLength={60}
              />
            </div>
          ))}

          <div style={{ display: 'flex', gap: 16, marginTop: 40, flexWrap: 'wrap' }}>
            <button onClick={() => setStep(1)} style={btn('secondary')}>Back</button>
            <button
              onClick={() => setStep(3)}
              disabled={projectFilled < 1}
              style={btn('primary', projectFilled < 1)}
              onMouseEnter={projectFilled >= 1 ? btnHoverIn : undefined}
              onMouseLeave={projectFilled >= 1 ? btnHoverOut : undefined}
            >
              Now the inside
            </button>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* STEP 3 — INSIDE (PROTECT)                                            */}
      {/* ==================================================================== */}
      {step === 3 && (
        <div style={{ animation: 'fadeIn 0.4s ease' }}>
          <h2 style={{ ...heading(40), fontSize: 'clamp(28px, 4vw, 42px)', marginBottom: 12 }}>
            <span style={{ color: C.sage, fontStyle: 'italic', marginRight: 12 }}>Inside.</span>What you work to protect.
          </h2>
          <p style={{ fontFamily: F.serif, fontSize: 19, lineHeight: 1.55, color: C.cream, marginBottom: 14, maxWidth: 640, fontStyle: 'italic' }}>
            Same hallway. Same people you respect. Again, they're talking about you &mdash; but this time, what they're saying makes you want the floor to open up and swallow you.
          </p>
          <p style={{ fontFamily: F.serif, fontSize: 19, lineHeight: 1.55, color: C.cream, marginBottom: 36, maxWidth: 640, fontStyle: 'italic' }}>
            It's probably unlikely anyone would actually describe you this way. But if your worst fears were spoken aloud, this is what they'd sound like. How are they describing you?
          </p>

          {[0, 1, 2].map((i) => (
            <div key={i} style={{ marginBottom: 20 }}>
              <label style={fieldLabel}>Inside label {i + 1}</label>
              <input
                type="text"
                value={protectLabels[i]}
                onChange={(e) => updateLabel('protect', i, e.target.value)}
                style={{ ...fieldInput }}
                placeholder={i === 0 ? "A word or short phrase…" : ''}
                maxLength={60}
              />
            </div>
          ))}

          <div style={{ display: 'flex', gap: 16, marginTop: 40, flexWrap: 'wrap' }}>
            <button onClick={() => setStep(2)} style={btn('secondary')}>Back</button>
            <button
              onClick={() => setStep(4)}
              disabled={protectFilled < 1}
              style={btn('primary', protectFilled < 1)}
              onMouseEnter={protectFilled >= 1 ? btnHoverIn : undefined}
              onMouseLeave={protectFilled >= 1 ? btnHoverOut : undefined}
            >
              See your box
            </button>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* STEP 4 — YOUR BOX (VISUAL + PEELING)                                 */}
      {/* ==================================================================== */}
      {step === 4 && (
        <div style={{ animation: 'fadeIn 0.4s ease' }}>
          <h2 style={{ ...heading(40), fontSize: 'clamp(28px, 4vw, 42px)', marginBottom: 16 }}>
            Your <em style={{ color: C.sage, fontStyle: 'italic' }}>box</em>.
          </h2>
          <p style={{ fontSize: 15, lineHeight: 1.7, color: C.creamMuted, marginBottom: 44, maxWidth: 600 }}>
            Sit with it for a moment. The outside is what you work to project. The inside is what you work to protect.
            <br /><br />
            Now &mdash; what if you were less attached to one of these labels? <span style={{ color: C.sage }}>Click any label to peel it off</span> and see what shifts. You can put it back if you want.
          </p>

          {renderBox({ interactive: true })}
          {renderWhispers()}

          <div style={{ display: 'flex', gap: 16, marginTop: 56, flexWrap: 'wrap' }}>
            <button onClick={() => setStep(3)} style={btn('secondary')}>Back</button>
            <button onClick={() => setStep(5)} style={btn('primary')} onMouseEnter={btnHoverIn} onMouseLeave={btnHoverOut}>Continue to reflect</button>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* STEP 5 — REFLECTIONS                                                 */}
      {/* ==================================================================== */}
      {step === 5 && (
        <div style={{ animation: 'fadeIn 0.4s ease' }}>
          <h2 style={{ ...heading(40), fontSize: 'clamp(28px, 4vw, 42px)', marginBottom: 16 }}>
            Six small <em style={{ color: C.sage, fontStyle: 'italic' }}>invitations</em>.
          </h2>
          <p style={{ fontSize: 15, lineHeight: 1.7, color: C.creamMuted, marginBottom: 36, maxWidth: 600 }}>
            One for each label. Answer as many as you want &mdash; skip any that don't have anything for you today.
          </p>

          {projectLabels.some(Boolean) && (
            <div style={{ marginBottom: 40 }}>
              <div style={{ ...eyebrow, marginBottom: 18 }}>The outside &mdash; what you project</div>
              {projectLabels.map((label, i) => {
                if (!label) return null;
                const key = `project-${i}`;
                return (
                  <div key={key} style={{ marginBottom: 28 }}>
                    <label style={{ ...fieldLabel, textTransform: 'none', letterSpacing: 0, fontSize: 16, color: C.cream, fontFamily: F.serif, fontStyle: 'italic', marginBottom: 10 }}>
                      What would taking a holiday from being <em style={{ color: C.sage }}>{label}</em> make possible?
                    </label>
                    <textarea
                      value={reflections[key] || ''}
                      onChange={(e) => setReflection(key, e.target.value)}
                      rows={3}
                      style={{ ...fieldInput, minHeight: 80 }}
                    />
                  </div>
                );
              })}
            </div>
          )}

          {protectLabels.some(Boolean) && (
            <div style={{ marginBottom: 40 }}>
              <div style={{ ...eyebrow, marginBottom: 18 }}>The inside &mdash; what you protect</div>
              {protectLabels.map((label, i) => {
                if (!label) return null;
                const key = `protect-${i}`;
                return (
                  <div key={key} style={{ marginBottom: 28 }}>
                    <label style={{ ...fieldLabel, textTransform: 'none', letterSpacing: 0, fontSize: 16, color: C.cream, fontFamily: F.serif, fontStyle: 'italic', marginBottom: 10 }}>
                      What might you do if you were 5% less afraid of being seen as <em style={{ color: C.sage }}>{label}</em>?
                    </label>
                    <textarea
                      value={reflections[key] || ''}
                      onChange={(e) => setReflection(key, e.target.value)}
                      rows={3}
                      style={{ ...fieldInput, minHeight: 80 }}
                    />
                  </div>
                );
              })}
            </div>
          )}

          <div style={{ display: 'flex', gap: 16, marginTop: 40, flexWrap: 'wrap' }}>
            <button onClick={() => setStep(4)} style={btn('secondary')}>Back</button>
            <button onClick={() => { setStep(6); if (aiEnabled) generateSynthesis(); }} style={btn('primary')} onMouseEnter={btnHoverIn} onMouseLeave={btnHoverOut}>See it all</button>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* STEP 6 — REVIEW + SYNTHESIS + DOWNLOAD                               */}
      {/* ==================================================================== */}
      {step === 6 && (
        <div style={{ animation: 'fadeIn 0.4s ease' }}>
          <h2 style={{ ...heading(40), fontSize: 'clamp(28px, 4vw, 42px)', marginBottom: 28 }}>
            Your <em style={{ color: C.sage, fontStyle: 'italic' }}>identity</em>, gently held.
          </h2>
          <p style={{ fontSize: 15, lineHeight: 1.7, color: C.creamMuted, marginBottom: 44, maxWidth: 600 }}>
            Here's what you've shared. Read it slowly.
          </p>

          <div style={{ marginBottom: 40 }}>
            {renderBox({ interactive: false })}
          </div>

          {Object.keys(peeled).length > 0 && (
            <div style={{ background: C.bgCard, borderRadius: 4, padding: '32px 32px', marginBottom: 32, borderLeft: `3px solid ${C.sage}` }}>
              <div style={{ ...eyebrow, marginBottom: 22 }}>What you peeled away</div>
              {Object.keys(peeled).map((key) => {
                const [side, idxStr] = key.split('-');
                const idx = parseInt(idxStr, 10);
                const label = side === 'project' ? projectLabels[idx] : protectLabels[idx];
                if (!label) return null;
                const w = whispers[key];
                if (!w) return null;
                return (
                  <div key={key} style={{ marginBottom: 18 }}>
                    <div style={{ fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase', color: C.sage, marginBottom: 6 }}>Without &ldquo;{label}&rdquo;</div>
                    <div style={{ fontFamily: F.serif, fontStyle: 'italic', fontSize: 17, lineHeight: 1.6, color: C.cream }}>{w}</div>
                  </div>
                );
              })}
            </div>
          )}

          {(projectLabels.some((l) => l && reflections[`project-${projectLabels.indexOf(l)}`])
            || protectLabels.some((l) => l && reflections[`protect-${protectLabels.indexOf(l)}`])) && (
            <div style={{ background: C.bgCard, borderRadius: 4, padding: '32px 32px', marginBottom: 36, borderLeft: `3px solid ${C.sage}` }}>
              <div style={{ ...eyebrow, marginBottom: 22 }}>What you reflected</div>
              {projectLabels.map((label, i) => {
                const r = reflections[`project-${i}`];
                if (!label || !r) return null;
                return (
                  <div key={`pr-${i}`} style={{ marginBottom: 20 }}>
                    <div style={{ fontFamily: F.serif, fontStyle: 'italic', fontSize: 15, color: C.creamMuted, marginBottom: 6 }}>
                      A holiday from being <em style={{ color: C.sage }}>{label}</em> might make possible&hellip;
                    </div>
                    <div style={{ fontSize: 15, lineHeight: 1.65, color: C.cream, paddingLeft: 14, borderLeft: `2px solid ${C.line}` }}>{r}</div>
                  </div>
                );
              })}
              {protectLabels.map((label, i) => {
                const r = reflections[`protect-${i}`];
                if (!label || !r) return null;
                return (
                  <div key={`pt-${i}`} style={{ marginBottom: 20 }}>
                    <div style={{ fontFamily: F.serif, fontStyle: 'italic', fontSize: 15, color: C.creamMuted, marginBottom: 6 }}>
                      5% less afraid of being seen as <em style={{ color: C.sage }}>{label}</em>, I might&hellip;
                    </div>
                    <div style={{ fontSize: 15, lineHeight: 1.65, color: C.cream, paddingLeft: 14, borderLeft: `2px solid ${C.line}` }}>{r}</div>
                  </div>
                );
              })}
            </div>
          )}

          {aiEnabled && (
            <div style={{ background: 'linear-gradient(135deg, rgba(197, 212, 155, 0.06), rgba(197, 212, 155, 0.02))', border: '1px solid rgba(197, 212, 155, 0.25)', borderRadius: 4, padding: 36, marginBottom: 36 }}>
              <div style={{ ...eyebrow, marginBottom: 20 }}>A reflection on what you've shared</div>
              <div style={{ fontFamily: F.serif, fontSize: 19, lineHeight: 1.65, color: C.cream, whiteSpace: 'pre-wrap' }}>
                {synthLoading
                  ? <span style={{ color: C.creamMuted, fontStyle: 'italic' }}>Reading what you've shared&hellip;</span>
                  : synthesis}
              </div>
            </div>
          )}

          <div style={{ textAlign: 'center', padding: '50px 24px 30px', marginBottom: 40, borderTop: `1px solid ${C.line}`, borderBottom: `1px solid ${C.line}` }}>
            <p style={{ fontFamily: F.serif, fontSize: 'clamp(20px, 2.6vw, 26px)', lineHeight: 1.55, color: C.cream, maxWidth: 640, margin: '0 auto', fontWeight: 400 }}>
              Your identity is a good thing. <em style={{ color: C.sage, fontStyle: 'italic' }}>It got you here.</em><br />
              And it is an expensive thing &mdash; you spend a lot of subconscious effort managing it.<br />
              You can loosen these clothes. You can keep growing. You can shape who you become next.
            </p>
          </div>

          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            <button onClick={() => setStep(5)} style={btn('secondary')}>Back to edit</button>
            <button onClick={() => navigate('home')} style={btn('primary')} onMouseEnter={btnHoverIn} onMouseLeave={btnHoverOut}>Back to all tools</button>
          </div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 32, paddingTop: 32, borderTop: `1px solid ${C.line}` }}>
            <button onClick={downloadPDF} style={btn('primary')} onMouseEnter={btnHoverIn} onMouseLeave={btnHoverOut}>Download as PDF</button>
            <button onClick={emailMyself} style={btn('secondary')}>Email to myself</button>
          </div>
        </div>
      )}
    </main>
  );
}
