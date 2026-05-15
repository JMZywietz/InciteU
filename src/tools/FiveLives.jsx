import React, { useState, useEffect } from 'react';
import { synthesize, extractText } from '../lib/synthesize.js';
import { useAppNavigate } from '../lib/useAppNavigate.js';
import SEO from '../components/SEO.jsx';

// ============================================================
// Five Lives — purpose-finding tool
// Aubergine + amber palette (memory, dusk, warmth)
// ============================================================

const F = {
  serif: '"Cormorant Garamond", Georgia, serif',
  sans: '"Inter", -apple-system, BlinkMacSystemFont, sans-serif',
};

const C = {
  bgDeep: '#2D1F2D',
  bgCard: '#3A2C3A',
  cream: '#F0EBDB',
  creamMuted: 'rgba(240, 235, 219, 0.62)',
  creamFaint: 'rgba(240, 235, 219, 0.38)',
  accent: '#D4A574',
  accentMuted: 'rgba(212, 165, 116, 0.72)',
  border: 'rgba(240, 235, 219, 0.14)',
  borderActive: 'rgba(212, 165, 116, 0.5)',
};

const FL_STYLES_ID = 'fl-styles';

function injectFLStyles() {
  if (typeof document === 'undefined' || document.getElementById(FL_STYLES_ID)) return;
  const style = document.createElement('style');
  style.id = FL_STYLES_ID;
  style.textContent = `
    @keyframes flFadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes flNoteIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes flShimmer { 0%, 100% { opacity: 0.55; } 50% { opacity: 1; } }
    @keyframes flDotPulse {
      0%, 60%, 100% { opacity: 0.25; transform: translateY(0); }
      30% { opacity: 1; transform: translateY(-4px); }
    }
    .fl-input::placeholder, .fl-textarea::placeholder {
      color: rgba(240, 235, 219, 0.28);
      font-style: italic;
      font-weight: 300;
    }
    .fl-input:focus, .fl-textarea:focus {
      border-color: ${C.borderActive} !important;
      background: rgba(240, 235, 219, 0.06) !important;
    }
    .fl-btn-primary { transition: all 0.25s ease; }
    .fl-btn-primary:hover {
      background: ${C.accent} !important;
      border-color: ${C.accent} !important;
      transform: translateY(-1px);
    }
    .fl-btn-secondary { transition: all 0.25s ease; }
    .fl-btn-secondary:hover {
      border-color: ${C.cream} !important;
      color: ${C.cream} !important;
    }
    .fl-btn-port { transition: all 0.25s ease; }
    .fl-btn-port:hover {
      background: rgba(212, 165, 116, 0.1) !important;
      border-color: ${C.accent} !important;
    }
    @media (max-width: 640px) {
      .fl-title { font-size: 44px !important; }
      .fl-subtitle { font-size: 22px !important; }
      .fl-h-lg { font-size: 26px !important; }
      .fl-letter p { font-size: 17px !important; }
      .fl-page { padding: 40px 5vw 80px !important; }
      .fl-letter-card { padding: 28px 24px !important; }
      .fl-examples { padding: 16px 18px !important; }
    }
  `;
  document.head.appendChild(style);
}

const s = {
  eyebrow: { fontFamily: F.sans, fontSize: 11, letterSpacing: '0.26em', textTransform: 'uppercase', color: C.accentMuted, fontWeight: 500, marginBottom: 28 },
  heading: (size, italic) => ({ fontFamily: F.serif, fontSize: size, lineHeight: 1.15, color: C.cream, fontWeight: 500, fontStyle: italic ? 'italic' : 'normal', letterSpacing: '-0.005em', margin: 0 }),
  para: { fontFamily: F.sans, fontSize: 16, lineHeight: 1.78, color: C.cream, fontWeight: 300, margin: '0 0 20px 0' },
  fieldLabel: { fontFamily: F.sans, fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase', color: C.creamMuted, fontWeight: 500, marginBottom: 10, display: 'block' },
  fieldInput: { width: '100%', background: 'rgba(240, 235, 219, 0.035)', border: `1px solid ${C.border}`, borderRadius: 3, padding: '14px 18px', fontFamily: F.sans, fontSize: 16, color: C.cream, fontWeight: 300, outline: 'none', transition: 'border-color 0.2s ease, background 0.2s ease', boxSizing: 'border-box' },
  fieldTextarea: { width: '100%', background: 'rgba(240, 235, 219, 0.035)', border: `1px solid ${C.border}`, borderRadius: 3, padding: '14px 18px', fontFamily: F.sans, fontSize: 16, color: C.cream, fontWeight: 300, outline: 'none', boxSizing: 'border-box', minHeight: 110, resize: 'vertical', lineHeight: 1.6, transition: 'border-color 0.2s ease, background 0.2s ease' },
  btnPrimary: { fontFamily: F.sans, fontSize: 12, letterSpacing: '0.24em', textTransform: 'uppercase', fontWeight: 500, padding: '15px 36px', borderRadius: 2, cursor: 'pointer', border: `1px solid ${C.cream}`, background: C.cream, color: C.bgDeep },
  btnSecondary: { fontFamily: F.sans, fontSize: 12, letterSpacing: '0.24em', textTransform: 'uppercase', fontWeight: 500, padding: '15px 28px', borderRadius: 2, cursor: 'pointer', border: `1px solid ${C.border}`, background: 'transparent', color: C.creamMuted },
  inlineNote: { fontFamily: F.serif, fontStyle: 'italic', fontSize: 14, color: C.accentMuted, marginTop: 16, textAlign: 'right', animation: 'flNoteIn 0.4s ease' },
  pageWrap: { minHeight: '100vh', background: C.bgDeep, padding: '64px 6vw 100px' },
  contentWrap: { maxWidth: 720, margin: '0 auto', animation: 'flFadeIn 0.5s ease' },
};

export default function FiveLivesPage() {
  const navigate = useAppNavigate();

  useEffect(() => { injectFLStyles(); }, []);

  const [screen, setScreen] = useState('intro');
  const [lives, setLives] = useState([
    { title: '', days: '', gives: '' },
    { title: '', days: '', gives: '' },
    { title: '', days: '', gives: '' },
    { title: '', days: '', gives: '' },
    { title: '', days: '', gives: '' },
  ]);
  const [textureIndex, setTextureIndex] = useState(0);
  const [letter, setLetter] = useState('');
  const [error, setError] = useState('');
  const [incompleteNote, setIncompleteNote] = useState('');

  const updateTitle = (i, val) => {
    setLives(prev => prev.map((l, idx) => idx === i ? { ...l, title: val } : l));
  };
  const updateTexture = (i, field, val) => {
    setLives(prev => prev.map((l, idx) => idx === i ? { ...l, [field]: val } : l));
  };

  const titlesComplete = lives.every(l => l.title.trim().length >= 2);
  const cur = lives[textureIndex];
  const currentTextureComplete = cur && cur.days.trim().length >= 3 && cur.gives.trim().length >= 3;

  const goToTexture = () => {
    if (!titlesComplete) { setIncompleteNote('Name all five to continue.'); return; }
    setIncompleteNote('');
    setTextureIndex(0);
    setScreen('texture');
    window.scrollTo({ top: 0 });
  };
  const advanceTexture = () => {
    if (!currentTextureComplete) { setIncompleteNote('Fill both fields to continue.'); return; }
    setIncompleteNote('');
    if (textureIndex < 4) {
      setTextureIndex(textureIndex + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      runSynthesis();
    }
  };
  const goBackTexture = () => {
    setIncompleteNote('');
    if (textureIndex > 0) {
      setTextureIndex(textureIndex - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      setScreen('titles');
      window.scrollTo({ top: 0 });
    }
  };

  const runSynthesis = async () => {
    setScreen('synthesizing');
    setError('');
    window.scrollTo({ top: 0 });

    const livesText = lives.map((life, i) =>
      `LIFE ${i + 1}: ${life.title}\nWhat fills the days: ${life.days}\nWhat it gives that current life doesn't: ${life.gives}`
    ).join('\n\n---\n\n');

    const prompt = `Below are five lives a person imagined they could live, with details about what each looks like and what each would give them that their current life doesn't.

Read across all five and look for the pattern — what shows up repeatedly, what textures and emotional registers they're drawn toward, what's notably absent from their current life that several of these lives would restore.

Then write a short letter (250-400 words) back to the person. The letter should:
- Open by naming what struck you across the five
- Name 2-3 specific patterns — themes, textures, emotional registers — that recur
- Suggest what their current life may be missing, drawing only on what's evident in their answers
- Close with a single clear sentence about what the pattern is pointing toward

Tone: calm, perceptive, addressed directly to "you." No therapy-speak, no platitudes, no "manifesting" or "best self" language. No bullet points, no headers — continuous prose. Sound like a thoughtful friend who has read closely. Do not prescribe specific actions; reflect back what's already there.

Begin the letter directly with no preamble — just the letter itself.

THE FIVE LIVES:

${livesText}`;

    try {
      const data = await synthesize({
        model: 'claude-sonnet-4-5',
        max_tokens: 1200,
        messages: [{ role: 'user', content: prompt }],
      });
      const text = extractText(data).trim();
      setLetter(text);
      setScreen('letter');
    } catch (e) {
      console.error(e);
      setError('Synthesis is unavailable right now. Your five lives are below — the pattern is yours to find.');
      setScreen('letter');
    }
  };

  const restart = () => {
    setLives([
      { title: '', days: '', gives: '' }, { title: '', days: '', gives: '' },
      { title: '', days: '', gives: '' }, { title: '', days: '', gives: '' },
      { title: '', days: '', gives: '' },
    ]);
    setTextureIndex(0); setLetter(''); setError(''); setIncompleteNote('');
    setScreen('intro'); window.scrollTo({ top: 0 });
  };

  const portToSVE = () => {
    try {
      sessionStorage.setItem('inciteu-fivelives-port', JSON.stringify({
        letter,
        lives,
        ts: Date.now(),
      }));
    } catch (e) {
      console.error('sessionStorage failed', e);
    }
    navigate('smallest-viable-experiment');
  };

  const downloadHTML = () => {
    const escape = s => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Five Lives — ${date}</title>
<style>
  body { font-family: 'Cormorant Garamond', Georgia, serif; max-width: 640px; margin: 60px auto; padding: 0 24px; color: #2a2a2a; line-height: 1.7; }
  h1 { font-size: 36px; font-weight: 500; margin-bottom: 4px; }
  .date { font-family: -apple-system, sans-serif; color: #888; font-size: 12px; letter-spacing: 0.18em; text-transform: uppercase; margin-bottom: 56px; }
  h2 { font-size: 22px; font-weight: 500; margin: 40px 0 6px; }
  h3 { font-family: -apple-system, sans-serif; font-size: 11px; letter-spacing: 0.18em; text-transform: uppercase; color: #888; margin: 20px 0 6px; font-weight: 500; }
  .life-title { font-style: italic; color: #333; font-size: 19px; margin-bottom: 16px; }
  .letter-card { background: #f7f1e6; padding: 40px 44px; border-radius: 4px; margin-top: 64px; border-left: 3px solid #c99a5e; }
  .letter-card h2 { margin-top: 0; }
  .letter-body p { font-size: 18px; margin: 0 0 16px 0; }
  p { margin: 0 0 14px 0; font-size: 16px; }
</style></head><body>
<h1>Five Lives</h1>
<div class="date">${date}</div>
${lives.map((l, i) => `
<h2>Life ${i + 1}</h2>
<p class="life-title">${escape(l.title)}</p>
<h3>What fills the days</h3>
<p>${escape(l.days)}</p>
<h3>What it gives that the current life doesn't</h3>
<p>${escape(l.gives)}</p>
`).join('')}
${letter ? `<div class="letter-card"><h2>A letter back to you</h2><div class="letter-body">${letter.split(/\n\n+/).map(p => `<p>${escape(p)}</p>`).join('')}</div></div>` : ''}
</body></html>`;
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `five-lives-${new Date().toISOString().slice(0,10)}.html`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // ============ INTRO ============
  if (screen === 'intro') {
    return (
      <div className="fl-page" style={s.pageWrap}>
        <SEO
          title="Five Lives: A Purpose-Finding Exercise for Leaders | InciteU"
          description="What other five lives would you like to live, if you could? A purpose-finding exercise that surfaces what your current life may be missing."
          path="/tools/self/five-lives"
        />
        <div style={s.contentWrap}>
          <h1 className="fl-title" style={{ fontFamily: F.serif, fontSize: 64, fontWeight: 500, color: C.cream, letterSpacing: '-0.015em', lineHeight: 1.0, margin: 0 }}>Five Lives</h1>
          <div style={{ width: 48, height: 1, background: C.accent, margin: '24px 0 22px' }} />
          <p className="fl-subtitle" style={{ fontFamily: F.serif, fontSize: 26, fontStyle: 'italic', color: C.creamMuted, fontWeight: 400, lineHeight: 1.35, margin: '0 0 48px 0' }}>What other five lives would you like to live, if you could?</p>

          <p style={s.para}>What your life is for — what it's organized around — gives ordinary days weight, generates energy where there'd otherwise be depletion, and makes hard choices easier. Most people never sit down and name theirs.</p>
          <p style={s.para}>"Is this how I want to spend my one life?" is the question that starts the work. But it's hard to answer head-on. We rationalize what we've already chosen, or we reach for what our culture, our family, our friends, or our religion tells us to want.</p>
          <p style={{...s.para, fontFamily: F.serif, fontSize: 21, fontStyle: 'italic', color: C.accent, margin: '32px 0' }}>This exercise comes at it sideways.</p>
          <p style={s.para}>The part of you that knows what you actually want is usually drowned out by the part defending what you've already chosen. Five Lives gives the quieter voice a way to be heard.</p>
          <p style={s.para}>Imagine five lives you could live. Not career options. Not realistic plans. Five lives — parallel, fully formed, each as real as the one you're in now. Pick five you'd genuinely be drawn to, given a clean slate.</p>
          <div style={{ paddingLeft: 18, borderLeft: `1px solid ${C.borderActive}`, margin: '28px 0' }}>
            <p style={{...s.para, margin: '0 0 6px 0', color: C.creamMuted, fontFamily: F.serif, fontSize: 18, fontStyle: 'italic' }}>They don't have to be possible.</p>
            <p style={{...s.para, margin: '0 0 6px 0', color: C.creamMuted, fontFamily: F.serif, fontSize: 18, fontStyle: 'italic' }}>They don't have to make sense together.</p>
            <p style={{...s.para, margin: 0, color: C.creamMuted, fontFamily: F.serif, fontSize: 18, fontStyle: 'italic' }}>They don't have to be impressive.</p>
          </div>
          <p style={s.para}>When you've named all five, you'll get a short letter back to yourself, written from the pattern across them. The five aren't the answer. The pattern is.</p>
          <div style={{ marginTop: 56 }}>
            <button className="fl-btn-primary" style={s.btnPrimary} onClick={() => { setScreen('titles'); window.scrollTo({ top: 0 }); }}>Begin →</button>
          </div>
        </div>
      </div>
    );
  }

  // ============ TITLES ============
  if (screen === 'titles') {
    return (
      <div className="fl-page" style={s.pageWrap}>
        <SEO
          title="Five Lives: A Purpose-Finding Exercise for Leaders | InciteU"
          description="What other five lives would you like to live, if you could? A purpose-finding exercise that surfaces what your current life may be missing."
          path="/tools/self/five-lives"
        />
        <div style={s.contentWrap}>
          <div style={s.eyebrow}>Pass 1 of 2 · Name your five</div>
          <h1 className="fl-h-lg" style={s.heading(36)}>Name your five lives.</h1>
          <div style={{ height: 24 }} />
          <p style={s.para}>A title or one-line description for each. Texture comes next — for now, just name them.</p>
          <div className="fl-examples" style={{ background: 'rgba(212, 165, 116, 0.05)', border: `1px solid ${C.border}`, borderRadius: 3, padding: '22px 26px', margin: '36px 0 44px' }}>
            <div style={{...s.fieldLabel, color: C.accentMuted, marginBottom: 14}}>For instance —</div>
            <div style={{ fontFamily: F.serif, fontStyle: 'italic', fontSize: 17, color: C.creamMuted, lineHeight: 1.85 }}>
              <div>A sailor on a Pacific trading ship in the 1890s, gone for months at a time</div>
              <div>A small-town veterinarian in Vermont, the kind everyone calls in a snowstorm</div>
              <div>A jazz pianist who plays small clubs and never gets famous</div>
            </div>
          </div>
          {lives.map((life, i) => (
            <div key={i} style={{ marginBottom: 22 }}>
              <label style={s.fieldLabel}>Life {i + 1}</label>
              <input className="fl-input" style={s.fieldInput} value={life.title} onChange={e => { updateTitle(i, e.target.value); if (incompleteNote) setIncompleteNote(''); }} placeholder="..." />
            </div>
          ))}
          <div style={{ marginTop: 56, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <button className="fl-btn-secondary" style={s.btnSecondary} onClick={() => { setIncompleteNote(''); setScreen('intro'); window.scrollTo({ top: 0 }); }}>← Back</button>
            <button className="fl-btn-primary" style={s.btnPrimary} onClick={goToTexture}>Continue →</button>
          </div>
          {incompleteNote && <div style={s.inlineNote} key={incompleteNote}>{incompleteNote}</div>}
        </div>
      </div>
    );
  }

  // ============ TEXTURE ============
  if (screen === 'texture') {
    const life = lives[textureIndex];
    return (
      <div className="fl-page" style={s.pageWrap}>
        <SEO
          title="Five Lives: A Purpose-Finding Exercise for Leaders | InciteU"
          description="What other five lives would you like to live, if you could? A purpose-finding exercise that surfaces what your current life may be missing."
          path="/tools/self/five-lives"
        />
        <div style={s.contentWrap} key={textureIndex}>
          <div style={s.eyebrow}>Life {textureIndex + 1} of 5</div>
          <h1 className="fl-h-lg" style={s.heading(32, true)}>{life.title || `Life ${textureIndex + 1}`}</h1>
          <div style={{ marginTop: 52 }}>
            <label style={s.fieldLabel}>What fills your days?</label>
            <textarea className="fl-textarea" style={s.fieldTextarea} value={life.days} onChange={e => { updateTexture(textureIndex, 'days', e.target.value); if (incompleteNote) setIncompleteNote(''); }} placeholder="The texture of an ordinary day. What you're doing, who's around, the pace of things." />
          </div>
          <div style={{ marginTop: 32 }}>
            <label style={s.fieldLabel}>What does this life give you that your current one doesn't?</label>
            <textarea className="fl-textarea" style={s.fieldTextarea} value={life.gives} onChange={e => { updateTexture(textureIndex, 'gives', e.target.value); if (incompleteNote) setIncompleteNote(''); }} placeholder="What this life has that your real one is missing — or has less of than you'd like." />
          </div>
          <div style={{ marginTop: 56, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <button className="fl-btn-secondary" style={s.btnSecondary} onClick={goBackTexture}>← Back</button>
            <button className="fl-btn-primary" style={s.btnPrimary} onClick={advanceTexture}>{textureIndex === 4 ? 'Show me the pattern →' : 'Next life →'}</button>
          </div>
          {incompleteNote && <div style={s.inlineNote} key={incompleteNote}>{incompleteNote}</div>}
          <div style={{ marginTop: 48, display: 'flex', justifyContent: 'center', gap: 10 }}>
            {[0,1,2,3,4].map(i => (
              <div key={i} style={{ width: i === textureIndex ? 22 : 6, height: 2, background: i <= textureIndex ? C.accent : C.border, transition: 'all 0.4s ease' }} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ============ SYNTHESIZING ============
  if (screen === 'synthesizing') {
    return (
      <div className="fl-page" style={s.pageWrap}>
        <SEO
          title="Five Lives: A Purpose-Finding Exercise for Leaders | InciteU"
          description="What other five lives would you like to live, if you could? A purpose-finding exercise that surfaces what your current life may be missing."
          path="/tools/self/five-lives"
        />
        <div style={{...s.contentWrap, textAlign: 'center', paddingTop: '14vh'}}>
          <div style={{...s.eyebrow, color: C.accent}}>Reading the pattern</div>
          <h1 className="fl-h-lg" style={{...s.heading(34, true), animation: 'flShimmer 2.4s ease-in-out infinite'}}>across your five lives</h1>
          <div style={{ marginTop: 24, fontFamily: F.serif, fontStyle: 'italic', fontSize: 15, color: C.creamMuted }}>
            This usually takes 30–60 seconds.
          </div>
          <div style={{ marginTop: 40, display: 'flex', justifyContent: 'center', gap: 10 }}>
            {[0,1,2].map(i => (
              <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: C.accent, animation: 'flDotPulse 1.4s ease-in-out infinite', animationDelay: `${i * 0.2}s` }} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ============ LETTER ============
  if (screen === 'letter') {
    return (
      <div className="fl-page" style={s.pageWrap}>
        <SEO
          title="Five Lives: A Purpose-Finding Exercise for Leaders | InciteU"
          description="What other five lives would you like to live, if you could? A purpose-finding exercise that surfaces what your current life may be missing."
          path="/tools/self/five-lives"
        />
        <div style={s.contentWrap}>
          <div style={s.eyebrow}>A letter back to you</div>
          <div style={{ height: 12 }} />

          {error ? (
            <div>
              <p style={{...s.para, color: C.accentMuted, fontStyle: 'italic', fontFamily: F.serif, fontSize: 18}}>{error}</p>
              {lives.map((life, i) => (
                <div key={i} style={{ marginTop: 36, paddingTop: 28, borderTop: `1px solid ${C.border}` }}>
                  <div style={{...s.eyebrow, marginBottom: 12}}>Life {i + 1}</div>
                  <div style={{...s.heading(22, true), marginBottom: 22}}>{life.title}</div>
                  <div style={{...s.fieldLabel, marginTop: 16}}>What fills the days</div>
                  <p style={s.para}>{life.days}</p>
                  <div style={{...s.fieldLabel, marginTop: 16}}>What it gives that current life doesn't</div>
                  <p style={s.para}>{life.gives}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="fl-letter-card fl-letter" style={{ background: 'rgba(240, 235, 219, 0.035)', border: `1px solid ${C.border}`, borderLeft: `2px solid ${C.accent}`, borderRadius: 4, padding: '52px 56px', marginBottom: 32 }}>
              {letter.split(/\n\n+/).map((p, i) => (
                <p key={i} style={{ fontFamily: F.serif, fontSize: 19, lineHeight: 1.72, color: C.cream, margin: i === letter.split(/\n\n+/).length - 1 ? 0 : '0 0 20px 0', fontWeight: 400 }}>{p}</p>
              ))}
            </div>
          )}

          <div style={{ marginTop: 48, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
            <button className="fl-btn-secondary" style={s.btnSecondary} onClick={restart}>← Start over</button>
            <button className="fl-btn-primary" style={s.btnPrimary} onClick={downloadHTML}>Download ↓</button>
          </div>

          {letter && !error && (
            <div style={{ marginTop: 80, paddingTop: 56, borderTop: `1px solid ${C.border}`, textAlign: 'center' }}>
              <div style={{ fontFamily: F.serif, fontSize: 22, fontStyle: 'italic', color: C.cream, lineHeight: 1.5, marginBottom: 8 }}>
                Want to go farther? Curious how you could close the gap?
              </div>
              <div style={{ fontFamily: F.serif, fontSize: 18, fontStyle: 'italic', color: C.accentMuted, marginBottom: 32 }}>
                Try the next tool…
              </div>
              <button
                className="fl-btn-port"
                style={{
                  fontFamily: F.sans, fontSize: 12, letterSpacing: '0.22em',
                  textTransform: 'uppercase', fontWeight: 500,
                  padding: '16px 28px', borderRadius: 2, cursor: 'pointer',
                  border: `1px solid ${C.accent}`, background: 'transparent', color: C.accent,
                }}
                onClick={portToSVE}
              >
                Port my information to the next tool: Smallest Viable Experiment →
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return null;
}
