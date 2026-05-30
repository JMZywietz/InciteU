import React, { useState, useEffect } from 'react';
import { C, F } from '../theme.js';
import { btn, btnHoverIn, btnHoverOut, eyebrow, heading, fieldLabel, fieldInput } from '../styles.js';
import { useAppNavigate } from '../lib/useAppNavigate.js';
import { escapeHTML } from '../lib/utils.js';
import { synthesize, extractText } from '../lib/synthesize.js';
import SEO from '../components/SEO.jsx';
import ToolFeedback from '../components/ToolFeedback.jsx';

export default function ThreeMomentsPage() {
  const navigate = useAppNavigate();
  const [step, setStep] = useState(1);
  const [aiEnabled, setAiEnabled] = useState(false);
  const [moments, setMoments] = useState([
    { what: '', age: '', change: '', impact: '' },
    { what: '', age: '', change: '', impact: '' },
    { what: '', age: '', change: '', impact: '' },
  ]);
  const [reflection, setReflection] = useState({ changed: '', different: '', same: '' });
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

  function updateMoment(i, field, value) {
    setMoments((arr) => arr.map((m, idx) => idx === i ? { ...m, [field]: value } : m));
  }

  async function generateSynthesis() {
    setSynthLoading(true);
    setSynthesis('');
    const prompt = `You are a thoughtful, warm coach helping someone reflect on their personal transformation. Below are three pivotal moments from someone's life and their broader reflections.

MOMENT 1
- What happened: ${moments[0].what}
- Age: ${moments[0].age}
- How it changed them: ${moments[0].change}
- How it shapes them today: ${moments[0].impact}

MOMENT 2
- What happened: ${moments[1].what}
- Age: ${moments[1].age}
- How it changed them: ${moments[1].change}
- How it shapes them today: ${moments[1].impact}

MOMENT 3
- What happened: ${moments[2].what}
- Age: ${moments[2].age}
- How it changed them: ${moments[2].change}
- How it shapes them today: ${moments[2].impact}

THEIR BROADER REFLECTION
- How much they've changed since they were a kid: ${reflection.changed}
- How they're different: ${reflection.different}
- How they've stayed the same: ${reflection.same}

Write a warm, specific 3-paragraph synthesis that:
1) Notices any patterns or threads across their three moments. Be specific to what they actually shared.
2) Reflects back what you see about their growth, and honors what has stayed constant in them.
3) Offers a gentle invitation to consider where their next transformation might come from.

Write in a warm, conversational, second-person voice ("you"). No platitudes or generic coaching speak. Don't preach. Be specific. Around 250-350 words total.`;

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

  function buildHTMLDoc() {
    const ord = ['First', 'Second', 'Third'];
    const date = new Date().toLocaleDateString();
    const momentSections = moments.map((m, i) => `
      <h2>${ord[i]} moment ${m.age ? `<span class="age">— age ${escapeHTML(m.age)}</span>` : ''}</h2>
      <p><em>${escapeHTML(m.what) || '—'}</em></p>
      <h3>How it changed me</h3><p>${escapeHTML(m.change) || '—'}</p>
      <h3>How it still shapes me</h3><p>${escapeHTML(m.impact) || '—'}</p>
    `).join('');
    return `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Three Transformational Moments</title>
<style>
  body { font-family: Georgia, serif; max-width: 720px; margin: 40px auto; padding: 0 24px; color: #2A2A2A; line-height: 1.65; }
  h1 { font-size: 32px; font-weight: 400; color: #1F3937; margin-bottom: 8px; }
  .sub { color: #6A7A6E; font-size: 14px; margin-bottom: 40px; font-style: italic; }
  h2 { font-size: 22px; color: #1F3937; margin-top: 36px; margin-bottom: 16px; font-weight: 400; border-bottom: 1px solid #E0DFD2; padding-bottom: 8px; }
  h3 { font-size: 18px; color: #6A7A6E; margin-top: 20px; margin-bottom: 6px; font-weight: 400; font-style: italic; }
  p { margin-bottom: 14px; }
  .age { color: #6A7A6E; font-size: 13px; }
  .reflection { background: #F5F2E8; padding: 24px; border-left: 3px solid #8FA876; margin-top: 20px; }
  .ai { background: #F0F4E5; padding: 24px; border-left: 3px solid #8FA876; margin-top: 30px; }
  .closing { text-align: center; margin: 40px 0; color: #4A5C50; font-style: italic; font-size: 18px; }
  .footer { margin-top: 50px; padding-top: 20px; border-top: 1px solid #E0DFD2; font-size: 12px; color: #999; text-align: center; }
</style></head><body>
<h1>Three Transformational Moments</h1>
<div class="sub">Your reflections, ${date}</div>
${momentSections}
<div class="reflection">
  <h2 style="margin-top:0;border:none;padding:0;">Stepping back</h2>
  <h3>How much I've changed</h3><p>${escapeHTML(reflection.changed) || '—'}</p>
  <h3>How I'm different</h3><p>${escapeHTML(reflection.different) || '—'}</p>
  <h3>How I've stayed the same</h3><p>${escapeHTML(reflection.same) || '—'}</p>
</div>
${synthesis ? `<div class="ai"><h2 style="margin-top:0;border:none;padding:0;">A reflection on your story</h2><p>${escapeHTML(synthesis).replace(/\n/g,'<br><br>')}</p></div>` : ''}
<div class="closing">You've already changed enormously. You will keep changing.<br>The future-you is as different from now-you as now-you is from past-you.</div>
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
      margin: [12,12,12,12],
      filename: `three-moments-${new Date().toISOString().slice(0,10)}.pdf`,
      image: { type: 'jpeg', quality: 0.95 },
      html2canvas: { scale: 2, useCORS: true, backgroundColor: '#ffffff' },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      pagebreak: { mode: ['avoid-all','css','legacy'] },
    }).from(container).save().then(() => {
      document.body.removeChild(container);
    }).catch(() => {
      document.body.removeChild(container);
      alert('PDF generation failed. Try the email option instead.');
    });
  }

  function emailMyself() {
    const ord = ['First', 'Second', 'Third'];
    let body = `My Three Transformational Moments — ${new Date().toLocaleDateString()}\n\n`;
    moments.forEach((m, i) => {
      body += `${ord[i].toUpperCase()} MOMENT${m.age ? ' (age ' + m.age + ')' : ''}\n`;
      body += `What happened: ${m.what || '—'}\n`;
      body += `How it changed me: ${m.change || '—'}\n`;
      body += `How it still shapes me: ${m.impact || '—'}\n\n`;
    });
    body += `STEPPING BACK\n`;
    body += `How much I've changed: ${reflection.changed || '—'}\n`;
    body += `How I'm different: ${reflection.different || '—'}\n`;
    body += `How I've stayed the same: ${reflection.same || '—'}\n\n`;
    if (synthesis) body += `A REFLECTION ON YOUR STORY\n${synthesis}\n\n`;
    body += `—\nFrom InciteU · Tools for the work of becoming`;
    const subject = encodeURIComponent('My Three Transformational Moments');
    window.location.href = `mailto:?subject=${subject}&body=${encodeURIComponent(body)}`;
  }

  const ordinals = ['First', 'Second', 'Third'];

  return (
    <main style={{ animation: 'fadeIn 0.4s ease', minHeight: '80vh', padding: '60px 6vw 80px', maxWidth: 820, margin: '0 auto' }}>
      <SEO
        title="Three Moments: A Personal Transformation Reflection Exercise | InciteU"
        description="A 10–15 minute reflection on the three moments that shaped who you are. Free, browser-based, with optional AI synthesis."
        path="/tools/self/three-moments"
      />
      <a onClick={(e) => { e.preventDefault(); navigate('home'); }} href="#"
         style={{ display: 'inline-block', color: C.creamMuted, textDecoration: 'none', fontSize: 12, letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 40, cursor: 'pointer' }}>
        ← Back to tools
      </a>
      <div style={{ display: 'flex', gap: 8, marginBottom: 40, alignItems: 'center' }}>
        {[1,2,3,4,5,6].map((n) => (
          <div key={n} style={{ height: 4, flex: 1, background: n < step ? C.sageMuted : n === step ? C.sage : C.line, borderRadius: 2, transition: 'background 0.4s' }} />
        ))}
      </div>

      {step === 1 && (
        <div style={{ animation: 'fadeIn 0.4s ease' }}>
          <h1 style={{ ...heading(60), marginBottom: 20 }}>Three transformational <em style={{ color: C.sage, fontStyle: 'italic' }}>moments</em>.</h1>
          <p style={{ fontFamily: F.serif, fontSize: 22, lineHeight: 1.55, color: C.cream, marginTop: 16, marginBottom: 32, maxWidth: 640 }}>A light, reflective exercise on how you've grown and changed across your life.</p>
          <p style={{ fontSize: 15, lineHeight: 1.7, color: C.creamMuted, maxWidth: 600, marginBottom: 36 }}>
            You'll think about three moments that shaped who you are. For each, you'll explore what happened, how it changed you, and how it shapes you today. Then you'll step back and look at the bigger picture — what's stayed constant, what's evolved.
            <br /><br />
            It takes around <em style={{ color: C.sage, fontStyle: 'italic', fontFamily: F.serif, fontSize: 17 }}>10 to 15 minutes</em>. Nothing is saved on this site — your reflections are yours to download or email to yourself when you're done.
          </p>
          <label style={{ display: 'flex', alignItems: 'flex-start', gap: 14, background: C.bgCard, padding: '22px 24px', borderRadius: 4, marginBottom: 32, cursor: 'pointer', border: `1px solid ${C.line}` }}>
            <input type="checkbox" checked={aiEnabled} onChange={(e) => { const v = e.target.checked; setAiEnabled(v); if (!v) setSynthesis(''); }} style={{ width: 22, height: 22, marginTop: 2, accentColor: C.sage, cursor: 'pointer' }} />
            <div>
              <span style={{ display: 'block', color: C.cream, fontSize: 15, marginBottom: 4 }}>Add an AI synthesis at the end</span>
              <span style={{ color: C.creamMuted, fontSize: 13, lineHeight: 1.5 }}>A coach-style reflection on patterns and themes across your three moments. Optional. Will be included in your download if you turn it on.</span>
            </div>
          </label>
          <button onClick={() => setStep(2)} style={btn('primary')} onMouseEnter={btnHoverIn} onMouseLeave={btnHoverOut}>I'm ready</button>
        </div>
      )}

      {[2,3,4].includes(step) && (() => {
        const mIdx = step - 2;
        const m = moments[mIdx];
        const headers = [
          { label: 'First.', sub: 'A moment that changed you.', helper: "Take your time. There's no right answer." },
          { label: 'Second.', sub: 'Another moment.', helper: 'It can be from any chapter of your life.' },
          { label: 'Third.', sub: 'One more.', helper: "The one that came to mind first, or the one you almost didn't include." },
        ];
        return (
          <div style={{ animation: 'fadeIn 0.4s ease' }}>
            <h2 style={{ ...heading(40), fontSize: 'clamp(28px, 4vw, 42px)', marginBottom: 28 }}>
              <span style={{ color: C.sage, fontStyle: 'italic', marginRight: 12 }}>{headers[mIdx].label}</span>{headers[mIdx].sub}
            </h2>
            <p style={{ fontSize: 15, lineHeight: 1.7, color: C.creamMuted, marginBottom: 36 }}>{headers[mIdx].helper}</p>
            <div style={{ marginBottom: 28 }}>
              <label style={fieldLabel}>What happened?</label>
              <textarea value={m.what} onChange={(e) => updateMoment(mIdx, 'what', e.target.value)} rows={4} style={{ ...fieldInput, minHeight: 100 }} placeholder={mIdx === 0 ? "Tell the story in your own words…" : ''} />
            </div>
            <div style={{ marginBottom: 28 }}>
              <label style={fieldLabel}>How old were you?</label>
              <input type="text" value={m.age} onChange={(e) => updateMoment(mIdx, 'age', e.target.value)} style={{ ...fieldInput, maxWidth: 140 }} placeholder={mIdx === 0 ? 'e.g., 17' : ''} />
            </div>
            <div style={{ marginBottom: 28 }}>
              <label style={fieldLabel}>How did this experience change you?</label>
              <textarea value={m.change} onChange={(e) => updateMoment(mIdx, 'change', e.target.value)} rows={4} style={{ ...fieldInput, minHeight: 100 }} placeholder={mIdx === 0 ? 'What shifted in you? What did you let go of, take on, or come to know?' : ''} />
            </div>
            <div style={{ marginBottom: 28 }}>
              <label style={fieldLabel}>How does this still shape you today?</label>
              <textarea value={m.impact} onChange={(e) => updateMoment(mIdx, 'impact', e.target.value)} rows={4} style={{ ...fieldInput, minHeight: 100 }} placeholder={mIdx === 0 ? 'In how you live, decide, or show up…' : ''} />
            </div>
            <div style={{ display: 'flex', gap: 16, marginTop: 40, flexWrap: 'wrap' }}>
              <button onClick={() => setStep(step - 1)} style={btn('secondary')}>Back</button>
              <button onClick={() => setStep(step + 1)} style={btn('primary')} onMouseEnter={btnHoverIn} onMouseLeave={btnHoverOut}>{step === 4 ? 'Step back' : 'Next moment'}</button>
            </div>
          </div>
        );
      })()}

      {step === 5 && (
        <div style={{ animation: 'fadeIn 0.4s ease' }}>
          <h2 style={{ ...heading(40), fontSize: 'clamp(28px, 4vw, 42px)', marginBottom: 28 }}>Now <em style={{ color: C.sage, fontStyle: 'italic' }}>step back</em>.</h2>
          <p style={{ fontSize: 15, lineHeight: 1.7, color: C.creamMuted, marginBottom: 36 }}>Look at the three moments together, and at your life as a whole.</p>
          <div style={{ marginBottom: 28 }}>
            <label style={fieldLabel}>How much have you changed since you were a kid?</label>
            <textarea value={reflection.changed} onChange={(e) => setReflection({ ...reflection, changed: e.target.value })} rows={4} style={{ ...fieldInput, minHeight: 100 }} />
          </div>
          <div style={{ marginBottom: 28 }}>
            <label style={fieldLabel}>How are you different?</label>
            <textarea value={reflection.different} onChange={(e) => setReflection({ ...reflection, different: e.target.value })} rows={4} style={{ ...fieldInput, minHeight: 100 }} />
          </div>
          <div style={{ marginBottom: 28 }}>
            <label style={fieldLabel}>How have you stayed the same?</label>
            <textarea value={reflection.same} onChange={(e) => setReflection({ ...reflection, same: e.target.value })} rows={4} style={{ ...fieldInput, minHeight: 100 }} />
          </div>
          <div style={{ display: 'flex', gap: 16, marginTop: 40, flexWrap: 'wrap' }}>
            <button onClick={() => setStep(4)} style={btn('secondary')}>Back</button>
            <button onClick={() => { setStep(6); if (aiEnabled) generateSynthesis(); }} style={btn('primary')} onMouseEnter={btnHoverIn} onMouseLeave={btnHoverOut}>See your story</button>
          </div>
        </div>
      )}

      {step === 6 && (
        <div style={{ animation: 'fadeIn 0.4s ease' }}>
          <h2 style={{ ...heading(40), fontSize: 'clamp(28px, 4vw, 42px)', marginBottom: 28 }}>Your <em style={{ color: C.sage, fontStyle: 'italic' }}>three moments</em>.</h2>
          <p style={{ fontSize: 15, lineHeight: 1.7, color: C.creamMuted, marginBottom: 36 }}>Here's what you've shared. Read it slowly.</p>
          {moments.map((m, i) => (
            <div key={i} style={{ background: C.bgCard, borderRadius: 4, padding: '32px 32px 28px', marginBottom: 24, borderLeft: `3px solid ${C.sage}` }}>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 18, gap: 16, flexWrap: 'wrap' }}>
                <div style={{ fontFamily: F.serif, fontStyle: 'italic', fontSize: 28, color: C.sage }}>{ordinals[i]} moment</div>
                {m.age && <div style={{ fontSize: 12, letterSpacing: '0.15em', textTransform: 'uppercase', color: C.creamMuted }}>Age {m.age}</div>}
              </div>
              <div style={{ fontFamily: F.serif, fontSize: 22, lineHeight: 1.4, color: C.cream, marginBottom: 20, fontWeight: 400 }}>{m.what || '—'}</div>
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase', color: C.sage, marginBottom: 6 }}>How it changed me</div>
                <div style={{ fontSize: 15, lineHeight: 1.65, color: C.cream }}>{m.change || '—'}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase', color: C.sage, marginBottom: 6 }}>How it still shapes me</div>
                <div style={{ fontSize: 15, lineHeight: 1.65, color: C.cream }}>{m.impact || '—'}</div>
              </div>
            </div>
          ))}
          <div style={{ background: C.bgCard, borderRadius: 4, padding: '36px 36px', marginTop: 24, marginBottom: 36 }}>
            <h3 style={{ fontFamily: F.serif, fontStyle: 'italic', fontWeight: 400, fontSize: 24, color: C.sage, marginBottom: 24 }}>Stepping back</h3>
            {[["How much you've changed", reflection.changed], ["How you're different", reflection.different], ["How you've stayed the same", reflection.same]].map(([label, text], i) => (
              <div key={i} style={{ marginBottom: 18 }}>
                <div style={{ fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase', color: C.sage, marginBottom: 6 }}>{label}</div>
                <div style={{ fontSize: 15, lineHeight: 1.65, color: C.cream }}>{text || '—'}</div>
              </div>
            ))}
          </div>
          {aiEnabled && (
            <div style={{ background: 'linear-gradient(135deg, rgba(197, 212, 155, 0.06), rgba(197, 212, 155, 0.02))', border: '1px solid rgba(197, 212, 155, 0.25)', borderRadius: 4, padding: 36, marginBottom: 36 }}>
              <div style={{ ...eyebrow, marginBottom: 20 }}>AI synthesis</div>
              <div style={{ fontFamily: F.serif, fontSize: 19, lineHeight: 1.65, color: C.cream, whiteSpace: 'pre-wrap' }}>
                {synthLoading ? <span style={{ color: C.creamMuted, fontStyle: 'italic' }}>Reading what you've shared…</span> : synthesis}
              </div>
            </div>
          )}
          <div style={{ textAlign: 'center', padding: '50px 24px 30px', marginBottom: 40, borderTop: `1px solid ${C.line}`, borderBottom: `1px solid ${C.line}` }}>
            <p style={{ fontFamily: F.serif, fontSize: 'clamp(22px, 3vw, 30px)', lineHeight: 1.5, color: C.cream, maxWidth: 640, margin: '0 auto', fontWeight: 400 }}>
              You've already changed enormously. <em style={{ color: C.sage, fontStyle: 'italic' }}>You will keep changing.</em><br />
              The future-you is as different from now-you as now-you is from past-you.<br />Science says so. So does your own evidence.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            <button onClick={() => setStep(5)} style={btn('secondary')}>Back to edit</button>
            <button onClick={() => setStep(7)} style={btn('primary')} onMouseEnter={btnHoverIn} onMouseLeave={btnHoverOut}>A note on doing this with someone</button>
          </div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 32, paddingTop: 32, borderTop: `1px solid ${C.line}` }}>
            <button onClick={downloadPDF} style={btn('primary')} onMouseEnter={btnHoverIn} onMouseLeave={btnHoverOut}>Download as PDF</button>
            <button onClick={emailMyself} style={btn('secondary')}>Email to myself</button>
          </div>
          <ToolFeedback
            formspreeId="mzdwwygz"
            toolName="Three Moments"
            role="subject"
            initialQuestion="Did this tool help?"
            positivePrompt="What made it useful?"
            negativePrompt="What could have made it more useful?"
          />
        </div>
      )}

      {step === 7 && (
        <div style={{ animation: 'fadeIn 0.4s ease' }}>
          <h2 style={{ ...heading(40), fontSize: 'clamp(28px, 4vw, 42px)', marginBottom: 28 }}>If you'd like to <em style={{ color: C.sage, fontStyle: 'italic' }}>go deeper</em>.</h2>
          <p style={{ fontSize: 15, lineHeight: 1.7, color: C.creamMuted, marginBottom: 36, maxWidth: 600 }}>This exercise is even richer when shared. If you have a friend or partner you trust, do this together — each of you reflecting on your own three moments first, then exchanging.</p>
          <div style={{ background: C.bgCard, borderRadius: 4, padding: '40px 36px', marginTop: 60 }}>
            <h3 style={{ fontFamily: F.serif, fontSize: 28, color: C.cream, marginBottom: 14, fontWeight: 400 }}>Questions to ask each other</h3>
            <p style={{ color: C.creamMuted, marginBottom: 24, fontSize: 15, lineHeight: 1.7 }}>Take turns. Listen more than you speak. Resist the urge to advise.</p>
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {['What surprised you about your own three moments?','What patterns or threads do you see across them?','What did you almost not include — and why?','Where do you think your next transformation might come from?',"If past-you could see present-you, what do you think they'd notice first?","What does the other person's story make you see in your own?"].map((q, i, arr) => (
                <li key={i} style={{ fontFamily: F.serif, fontStyle: 'italic', color: C.cream, fontSize: 19, lineHeight: 1.5, padding: '14px 0 14px 24px', borderBottom: i === arr.length - 1 ? 'none' : `1px solid ${C.line}`, position: 'relative' }}>
                  <span style={{ position: 'absolute', left: 0, top: 18, color: C.sage, fontWeight: 700, fontSize: 22, lineHeight: 1, fontStyle: 'normal' }}>·</span>
                  {q}
                </li>
              ))}
            </ul>
          </div>
          <div style={{ display: 'flex', gap: 16, marginTop: 40, flexWrap: 'wrap' }}>
            <button onClick={() => setStep(6)} style={btn('secondary')}>Back to my reflections</button>
            <button onClick={() => navigate('home')} style={btn('primary')} onMouseEnter={btnHoverIn} onMouseLeave={btnHoverOut}>Back to all tools</button>
          </div>
        </div>
      )}
    </main>
  );
}
