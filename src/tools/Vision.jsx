import React, { useState, useEffect } from 'react';
import { C, F } from '../theme.js';
import { btn, btnHoverIn, btnHoverOut, eyebrow, heading, fieldInput } from '../styles.js';
import { useAppNavigate } from '../lib/useAppNavigate.js';
import { escapeHTML, downloadHTML } from '../lib/utils.js';
import { synthesize, extractText } from '../lib/synthesize.js';

// ============================================================================
// DATA
// ============================================================================
const VISION_STEPS = [
  { id: 'platform', label: 'The Burning Platform', subtitle: 'Why this moment is decisive',
    question: "If a sceptical board member asked you 'why now and not in two years?' — what would you say? Be specific about what you're risking by waiting. If your answer is vague, that's important information.",
    prompt: 'Write the headline of an article about your organisation in 3 years if nothing changes.',
    placeholder: 'We have been growing steadily, but our competitors are moving faster and our best people are asking harder questions about where we are going…',
    hint: 'Be honest about the discomfort. The clearest visions come from the clearest burning platforms.' },
  { id: 'vision', label: 'Vision & Purpose', subtitle: 'Your North Star',
    question: "Describe a Tuesday morning in the organisation you're trying to build. What are people talking about? What are they not worrying about anymore? What's different about how decisions get made?",
    prompt: 'If someone shadowed your CEO for a day in this future organisation, what would surprise them most?',
    placeholder: 'We will be a place where people feel genuinely empowered to make decisions close to the customer…',
    hint: "If your description could apply to any company, it's not vivid enough yet." },
  { id: 'values', label: 'Values', subtitle: 'What we stand for — always',
    question: 'What would you refuse to compromise even if it cost you commercially? Name 3–5 things. For each one: describe a moment where someone would see this value in action — and a moment where they\'d see it being violated.',
    prompt: 'Think of a recent decision that was hard because the right thing and the easy thing were different. What value was at stake?',
    placeholder: "Integrity — we tell the truth even when it's uncomfortable. This means we admit mistakes publicly…",
    hint: "If a value doesn't constrain any decisions, it's wallpaper. The test: can you name something it prevents you from doing?" },
  { id: 'strategy', label: 'Strategic Priorities', subtitle: 'The big choices for the next 1–3 years',
    question: 'What are you saying NO to? Good strategy is as much about that. Name 2–4 strategic priorities — and for each, name one thing you\'re deliberately not doing to make room for it.',
    prompt: 'If you could only achieve two things in the next two years, which two would change everything?',
    placeholder: 'Priority 1: Rebuild our digital capability from the ground up. This means we are NOT investing in expanding our physical footprint…',
    hint: "If everything is a priority, nothing is. The struggle to choose is where the real strategy lives." },
  { id: 'leadership', label: 'Leadership Priorities', subtitle: 'What leaders must focus on',
    question: 'A new senior leader joins tomorrow. What three things do they need to understand about how to succeed here — that aren\'t in the job description?',
    prompt: "What's the gap between the leader you need and the leader you currently reward?",
    placeholder: 'Leaders here need to be comfortable with ambiguity — we are moving faster than our processes…',
    hint: 'The answer to this question often reveals more about the real culture than any values poster.' },
  { id: 'behaviours', label: 'Target Behaviours', subtitle: 'What people actually do differently',
    question: "Describe someone on their best day here. What are they actually doing — specifically enough that you'd recognise it if you saw it? Now describe someone on their worst day. What's the gap?",
    prompt: 'If you followed your best team for a week with a camera, what observable behaviours would you see that you want everywhere?',
    placeholder: 'On their best day, a team lead here checks in with their team before making a call that affects them…',
    hint: "Observable and specific. 'Be more collaborative' is not a behaviour — 'invite dissenting views before closing a decision' is." },
];

// ============================================================================
// COMPONENT
// ============================================================================
export default function VisionPage() {
  const navigate = useAppNavigate();
  const [step, setStep] = useState(0); // 0 = intro, 1-6 = steps, 7 = generate, 8 = done
  const [answers, setAnswers] = useState({});
  const [polishing, setPolishing] = useState(false);
  const [polishError, setPolishError] = useState(null);

  useEffect(() => { window.scrollTo({ top: 0, behavior: 'smooth' }); }, [step]);

  const totalSteps = VISION_STEPS.length;
  const allFilled = VISION_STEPS.every((s) => (answers[s.id] || '').trim().length > 5);

  function buildHTML(answersObj, polished) {
    const date = new Date().toLocaleDateString();
    const sections = VISION_STEPS.map((s) => {
      const val = escapeHTML(answersObj[s.id] || '').replace(/\n/g, '<br>');
      return `<div class="section"><div class="s-label">${escapeHTML(s.label)}</div><div class="s-sub">${escapeHTML(s.subtitle)}</div><div class="s-body">${val || '<em>Not completed</em>'}</div></div>`;
    }).join('');
    return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Culture Change Vision</title>
<style>
  body { font-family: Georgia, serif; max-width: 800px; margin: 40px auto; padding: 0 24px; color: #2A2A2A; line-height: 1.65; background: #fff; }
  .cover { text-align: center; margin-bottom: 48px; padding-bottom: 32px; border-bottom: 1px solid #E0DFD2; }
  .c-eyebrow { font-size: 11px; letter-spacing: 0.22em; text-transform: uppercase; color: #6B8159; font-family: monospace; margin-bottom: 24px; }
  .c-title { font-family: Georgia, serif; font-size: 36px; font-weight: 400; line-height: 1.1; color: #1F3937; margin-bottom: 12px; }
  .c-sub { font-size: 14px; color: #6A7A6E; margin-bottom: 8px; font-style: italic; }
  .c-date { font-size: 11px; color: #999; }
  .section { margin-bottom: 36px; padding: 24px; background: #f9f9fb; border: 1px solid #e5e7eb; border-radius: 6px; }
  .s-label { font-family: Georgia, serif; font-size: 22px; font-weight: 400; color: #1F3937; margin-bottom: 4px; }
  .s-sub { font-size: 11px; color: #6B8159; letter-spacing: 0.12em; text-transform: uppercase; font-family: monospace; margin-bottom: 16px; }
  .s-body { font-size: 14px; line-height: 1.8; color: #4A5C50; }
  .footer { margin-top: 40px; padding-top: 16px; border-top: 1px solid #E0DFD2; font-size: 11px; color: #999; display: flex; justify-content: space-between; font-family: monospace; letter-spacing: 0.1em; }
</style></head><body>
<div class="cover">
  <div class="c-eyebrow">InciteU${polished ? ' · AI-polished' : ''}</div>
  <div class="c-title">Our Culture<br>Change Vision</div>
  <div class="c-sub">A living document for alignment and aspiration</div>
  <div class="c-date">${date}</div>
</div>
<div class="content">${sections}</div>
<div class="footer"><span>inciteu.com</span><span>${new Date().getFullYear()}</span></div>
</body></html>`;
  }

  async function handlePolish() {
    setPolishing(true);
    setPolishError(null);
    try {
      const prompt = `You are helping a leader write a culture change vision document. Polish and clarify the following raw notes into compelling, purposeful language. Preserve their authentic voice — avoid generic corporate language. Return ONLY valid JSON with exactly these keys: platform, vision, values, strategy, leadership, behaviours. No markdown, no preamble.\n\nRaw input:\n${JSON.stringify(answers, null, 2)}`;
      const data = await synthesize({
        model: 'claude-sonnet-4-5',
        max_tokens: 1500,
        messages: [{ role: 'user', content: prompt }],
      });
      const text = extractText(data);
      // Forgiving JSON extraction: strip code fences, then take from first { to last }
      const stripped = text.replace(/```json|```/g, '').trim();
      const firstBrace = stripped.indexOf('{');
      const lastBrace = stripped.lastIndexOf('}');
      const clean = (firstBrace >= 0 && lastBrace > firstBrace)
        ? stripped.slice(firstBrace, lastBrace + 1)
        : stripped;
      const parsed = JSON.parse(clean);
      downloadHTML(buildHTML(parsed, true), `culture-vision-polished-${new Date().toISOString().slice(0,10)}.html`);
      setStep(8);
    } catch (e) {
      setPolishError('Something went wrong. Try the raw download instead.');
    }
    setPolishing(false);
  }

  if (step === 8) {
    return (
      <main style={{ animation: 'fadeIn 0.4s ease', minHeight: '80vh', padding: '120px 6vw', maxWidth: 600, margin: '0 auto', textAlign: 'center' }}>
        <div style={{ fontSize: 56, color: C.sage, marginBottom: 24 }}>✦</div>
        <h2 style={{ ...heading(36), marginBottom: 20 }}>Your vision document <em style={{ color: C.sage, fontStyle: 'italic' }}>has been downloaded</em>.</h2>
        <p style={{ fontSize: 16, color: C.creamMuted, lineHeight: 1.7, marginBottom: 32 }}>
          This is a living document. Come back and re-do the exercise as your thinking sharpens.
        </p>
        <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button onClick={() => { setStep(0); setAnswers({}); }} style={btn('secondary')}>Start again</button>
          <button onClick={() => navigate('home')} style={btn('primary')} onMouseEnter={btnHoverIn} onMouseLeave={btnHoverOut}>Back to tools</button>
        </div>
      </main>
    );
  }

  if (step === 7) {
    return (
      <main style={{ animation: 'fadeIn 0.4s ease', minHeight: '80vh', padding: '80px 6vw', maxWidth: 600, margin: '0 auto', textAlign: 'center' }}>
        <h2 style={{ ...heading(40), fontSize: 'clamp(28px, 4vw, 40px)', marginBottom: 20 }}>Your vision is <em style={{ color: C.sage, fontStyle: 'italic' }}>ready</em>.</h2>
        <p style={{ fontSize: 16, color: C.creamMuted, lineHeight: 1.7, marginBottom: 32, maxWidth: 480, margin: '0 auto 32px' }}>
          Download as-is in your own words, or let AI polish the language while preserving your voice.
        </p>
        {polishError && <p style={{ color: C.warning, fontSize: 14, marginBottom: 16 }}>{polishError}</p>}
        <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button onClick={() => { downloadHTML(buildHTML(answers, false), `culture-vision-${new Date().toISOString().slice(0,10)}.html`); setStep(8); }}
                  style={btn('primary')} onMouseEnter={btnHoverIn} onMouseLeave={btnHoverOut}>Download raw</button>
          <button onClick={handlePolish} disabled={polishing} style={btn('primary', polishing)}>
            {polishing ? 'Polishing…' : 'AI-polish & download'}
          </button>
        </div>
        <button onClick={() => setStep(VISION_STEPS.length)} style={{ background: 'transparent', border: 'none', color: C.creamMuted, cursor: 'pointer', marginTop: 32, fontSize: 12, letterSpacing: '0.18em', textTransform: 'uppercase', fontFamily: F.sans }}>
          ← Go back and edit
        </button>
      </main>
    );
  }

  if (step === 0) {
    return (
      <main style={{ animation: 'fadeIn 0.4s ease', minHeight: '80vh', padding: '60px 6vw 80px', maxWidth: 760, margin: '0 auto' }}>
        <a onClick={(e) => { e.preventDefault(); navigate('home'); }} href="#"
           style={{ display: 'inline-block', color: C.creamMuted, textDecoration: 'none', fontSize: 12, letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 40, cursor: 'pointer' }}>
          ← Back to tools
        </a>
        <div style={{ ...eyebrow, marginBottom: 12 }}>Vision Builder · 6 questions</div>
        <h1 style={{ ...heading(60), marginBottom: 24 }}>How clear is your <em style={{ color: C.sage, fontStyle: 'italic' }}>culture story?</em></h1>
        <p style={{ fontFamily: F.serif, fontSize: 22, lineHeight: 1.55, color: C.cream, marginBottom: 24, maxWidth: 640 }}>
          Six questions that build a complete culture change story — burning platform, north star, values, strategy, leadership, behaviours.
        </p>
        <p style={{ fontSize: 15, lineHeight: 1.7, color: C.creamMuted, maxWidth: 600, marginBottom: 32 }}>
          This isn't designed to "get it right." It's designed to show you which pieces are clear to you — and where the gaps are that need attention. Around <em style={{ color: C.sage, fontStyle: 'italic', fontFamily: F.serif, fontSize: 17 }}>20 to 30 minutes</em> if you go deep.
        </p>

        {/* Culture Model prep callout */}
        <div style={{ background: 'rgba(42, 71, 68, 0.5)', border: `1px solid ${C.line}`, borderLeft: `3px solid ${C.sage}`, borderRadius: 4, padding: '20px 24px', marginBottom: 40, maxWidth: 600 }}>
          <div style={{ ...eyebrow, color: C.sage, marginBottom: 10 }}>Prep · Read first</div>
          <p style={{ fontSize: 15, color: C.cream, lineHeight: 1.6, margin: '0 0 14px 0' }}>
            The Culture Model is essential context for this tool. If you haven't yet, open it in a tab and skim before you begin.
          </p>
          <a href="https://qq5l85.csb.app/" target="_blank" rel="noopener noreferrer"
             style={{ color: C.sage, fontSize: 12, letterSpacing: '0.18em', textTransform: 'uppercase', textDecoration: 'none', fontFamily: F.sans }}>
            Open the Culture Model ↗
          </a>
        </div>

        <button onClick={() => setStep(1)} style={btn('primary')} onMouseEnter={btnHoverIn} onMouseLeave={btnHoverOut}>Begin</button>
      </main>
    );
  }

  const cur = VISION_STEPS[step - 1];
  const curVal = answers[cur.id] || '';

  return (
    <main style={{ animation: 'fadeIn 0.4s ease', minHeight: '80vh', padding: '60px 6vw 80px', maxWidth: 760, margin: '0 auto' }}>
      <a onClick={(e) => { e.preventDefault(); navigate('home'); }} href="#"
         style={{ display: 'inline-block', color: C.creamMuted, textDecoration: 'none', fontSize: 12, letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 24, cursor: 'pointer' }}>
        ← Back to tools
      </a>
      <div style={{ display: 'flex', gap: 6, marginBottom: 32 }}>
        {VISION_STEPS.map((_, i) => (
          <div key={i} style={{ height: 3, flex: 1, background: i < step - 1 ? C.sageMuted : i === step - 1 ? C.sage : C.line, borderRadius: 2, transition: 'background 0.3s' }} />
        ))}
      </div>
      <div style={{ ...eyebrow, marginBottom: 8 }}>Step {step} of {totalSteps} · {cur.subtitle}</div>
      <h2 style={{ ...heading(40), fontSize: 'clamp(28px, 4vw, 42px)', marginBottom: 24 }}>{cur.label}</h2>
      <p style={{ fontSize: 16, color: C.cream, lineHeight: 1.75, marginBottom: 12 }}>{cur.question}</p>
      <p style={{ fontSize: 14, color: C.sageMuted, lineHeight: 1.6, marginBottom: 24, fontStyle: 'italic' }}>Try this: {cur.prompt}</p>
      <textarea value={curVal} onChange={(e) => setAnswers({ ...answers, [cur.id]: e.target.value })}
                rows={8} style={{ ...fieldInput, minHeight: 200 }} placeholder={cur.placeholder} />
      <p style={{ fontSize: 12, color: C.creamMuted, marginTop: 8, lineHeight: 1.5, fontStyle: 'italic' }}>{cur.hint}</p>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 32, gap: 16, flexWrap: 'wrap' }}>
        <button onClick={() => setStep(step - 1)} style={btn('secondary')}>{step === 1 ? '← Back to intro' : '← Previous'}</button>
        {step < totalSteps ? (
          <button onClick={() => setStep(step + 1)} disabled={curVal.trim().length < 5} style={btn('primary', curVal.trim().length < 5)} onMouseEnter={(e) => { if (curVal.trim().length >= 5) btnHoverIn(e); }} onMouseLeave={(e) => { if (curVal.trim().length >= 5) btnHoverOut(e); }}>Next →</button>
        ) : (
          <button onClick={() => setStep(7)} disabled={!allFilled} style={btn('primary', !allFilled)} onMouseEnter={(e) => { if (allFilled) btnHoverIn(e); }} onMouseLeave={(e) => { if (allFilled) btnHoverOut(e); }}>Generate my vision →</button>
        )}
      </div>
    </main>
  );
}
