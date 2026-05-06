import React, { useState } from 'react';
import { C, F } from '../theme.js';
import { btn, btnHoverIn, btnHoverOut, eyebrow, heading } from '../styles.js';
import { useAppNavigate } from '../lib/useAppNavigate.js';
import { downloadHTML } from '../lib/utils.js';

// ============================================================================
// DATA
// ============================================================================
const READINESS_DIMS = [
  { id: 'pre', label: 'Preconditions', desc: 'Psychological safety, accountability, leadership readiness', questions: [
    'People in our organisation can openly disagree with leadership without fear of repercussions.',
    'When someone violates our stated values, there are real and consistent consequences — regardless of seniority.',
    'Our senior leaders have demonstrated genuine willingness to change their own behaviour, not just ask others to change.',
  ]},
  { id: 'why', label: 'The Why', desc: 'Burning platform, compelling vision, urgency', questions: [
    "We can clearly articulate why culture change is necessary right now — in specific, concrete terms that go beyond 'we need to improve'.",
    "Most people in the organisation would agree on what's at stake if we don't change.",
    "We have a compelling picture of what the future looks like — specific enough that people can see themselves in it.",
  ]},
  { id: 'who', label: 'The Who', desc: 'Leadership shadow, coalition, role modelling', questions: [
    'Our leadership team is genuinely aligned on the need for change — not just publicly supportive while privately sceptical.',
    'We have identified and engaged the informal influencers across the organisation, not just the formal hierarchy.',
    'Leaders are willing to go first in changing their own behaviour — even when it feels uncomfortable or risky.',
  ]},
  { id: 'what', label: 'The What', desc: 'North Star clarity, values, behavioural specificity', questions: [
    'We have a clear North Star that describes the culture we want — in specific, observable behavioural terms, not just aspirational slogans.',
    'We have mapped the gap between our current culture and our desired culture honestly — including the parts that are hard to hear.',
    'Our values are genuinely understood and used to guide decisions, not just printed on walls and forgotten.',
  ]},
  { id: 'engineer', label: 'How · Engineer track', desc: 'Structured process, systems alignment, measurement', questions: [
    'We have a structured plan for culture change with clear phases, milestones, and accountability — not just good intentions.',
    'We have reviewed our systems (incentives, promotions, performance reviews, hiring) for alignment with the culture we say we want.',
    'We are measuring culture change using real indicators — not just annual engagement surveys.',
  ]},
  { id: 'ecologist', label: 'How · Ecologist track', desc: 'Emergence, experiments, adaptive practice', questions: [
    'We are running small, safe-to-fail experiments to learn what works rather than betting everything on one big rollout.',
    'When experiments fail, we treat them as learning rather than blame — and we actually change course based on what we learn.',
    'We are comfortable holding direction and guardrails while allowing people at the edges to adapt and innovate.',
  ]},
];

const SCALE_LABELS = ['Strongly disagree', 'Somewhat disagree', 'Somewhat agree', 'Strongly agree'];

function bandFor(score, max) {
  const pct = score / max;
  if (pct >= 0.75) return { label: 'Working well', color: C.good, bg: 'rgba(159, 190, 127, 0.12)' };
  if (pct >= 0.45) return { label: 'Foundations emerging', color: C.okay, bg: 'rgba(212, 185, 110, 0.12)' };
  return { label: 'Needs significant time and attention', color: C.needsWork, bg: 'rgba(216, 138, 122, 0.12)' };
}

// ============================================================================
// COMPONENT
// ============================================================================
export default function ReadinessPage() {
  const navigate = useAppNavigate();
  const [scores, setScores] = useState({});
  const [showResults, setShowResults] = useState(false);

  function totalFor(dim) {
    return dim.questions.reduce((s, _, i) => s + (scores[dim.id + '_' + i] || 0), 0);
  }
  const allAnswered = READINESS_DIMS.every((d) => d.questions.every((_, i) => scores[d.id + '_' + i]));
  const overallScore = READINESS_DIMS.reduce((s, d) => s + totalFor(d), 0);
  const overallMax = READINESS_DIMS.length * 12;

  function setScore(dimId, qi, val) { setScores((s) => ({ ...s, [dimId + '_' + qi]: val })); }

  function downloadResults() {
    const overall = bandFor(overallScore, overallMax);
    const dimRows = READINESS_DIMS.map((d) => {
      const score = totalFor(d);
      const band = bandFor(score, 12);
      const pct = Math.round((score / 12) * 100);
      return `<div class="dim-row">
        <div class="dim-header">
          <div><div class="dim-title">${d.label}</div><div class="dim-desc">${d.desc}</div></div>
          <div class="dim-meta"><span style="color:${band.color};font-family:monospace">${score}/12</span>
          <span style="color:${band.color};background:${band.bg};border:1px solid ${band.color}44;padding:2px 10px;border-radius:3px;font-size:11px;letter-spacing:0.06em;text-transform:uppercase">${band.label}</span></div>
        </div>
        <div class="bar-track"><div class="bar-fill" style="width:${pct}%;background:${band.color}"></div></div>
      </div>`;
    }).join('');
    const summary = overall.label === 'Working well' ? 'You have strong conditions across most dimensions. The work ahead is about sustaining this foundation and moving deliberately into execution.' : overall.label === 'Foundations emerging' ? 'You have real foundations to build on — and some important gaps to address first. Naming those gaps now is itself a form of readiness.' : 'Significant conditions are absent across multiple dimensions. This is important information — not a reason to stop, but a reason to be very deliberate about what you build first.';
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Readiness Results</title>
<style>
  body { font-family: Georgia, serif; max-width: 800px; margin: 40px auto; padding: 0 24px; color: #2A2A2A; line-height: 1.65; background: #fff; }
  h1 { font-size: 32px; font-weight: 400; color: #1F3937; margin-bottom: 8px; }
  .eyebrow { font-size: 11px; letter-spacing: 0.22em; text-transform: uppercase; color: #6B8159; font-family: monospace; margin-bottom: 16px; }
  .overall { padding: 24px; border-radius: 6px; margin: 24px 0 40px; background: ${overall.bg}; border: 1px solid ${overall.color}44; }
  .score { font-family: Georgia, serif; font-size: 36px; font-weight: 400; color: ${overall.color}; margin-right: 12px; }
  .band-label { font-size: 14px; letter-spacing: 0.08em; text-transform: uppercase; font-family: monospace; color: ${overall.color}; }
  .summary { font-size: 14px; color: #4A5C50; line-height: 1.7; margin-top: 12px; }
  .dim-row { padding: 20px; background: #f9f9fb; border: 1px solid #e5e7eb; border-radius: 6px; margin-bottom: 12px; }
  .dim-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; flex-wrap: wrap; gap: 12px; }
  .dim-title { font-family: Georgia, serif; font-size: 17px; font-weight: 400; color: #1F3937; }
  .dim-desc { font-size: 11px; color: #6A7A6E; margin-top: 2px; }
  .dim-meta { display: flex; align-items: center; gap: 10px; }
  .bar-track { height: 4px; background: #e5e7eb; border-radius: 2px; }
  .bar-fill { height: 100%; border-radius: 2px; }
  .footer { margin-top: 48px; padding-top: 20px; border-top: 1px solid #E0DFD2; font-size: 11px; color: #999; text-align: center; font-family: monospace; letter-spacing: 0.1em; text-transform: uppercase; }
</style></head><body>
<div class="eyebrow">InciteU · Self-assessment</div>
<h1>Culture Change Readiness</h1>
<p style="font-size:14px;color:#6A7A6E;margin:12px 0 0;font-style:italic">A mirror, not a verdict.</p>
<div class="overall">
  <div style="font-size:11px;letter-spacing:0.22em;text-transform:uppercase;color:${overall.color};font-family:monospace;margin-bottom:8px">Overall readiness</div>
  <div style="display:flex;align-items:baseline;flex-wrap:wrap"><span class="score">${overallScore} / ${overallMax}</span><span class="band-label">${overall.label}</span></div>
  <p class="summary">${summary}</p>
</div>
<div style="font-size:11px;letter-spacing:0.22em;text-transform:uppercase;color:#6A7A6E;margin-bottom:20px;font-family:monospace">By dimension</div>
${dimRows}
<div class="footer">From InciteU · ${new Date().toLocaleDateString()}</div>
</body></html>`;
    downloadHTML(html, `readiness-results-${new Date().toISOString().slice(0,10)}.html`);
  }

  if (showResults) {
    const overall = bandFor(overallScore, overallMax);
    return (
      <main style={{ animation: 'fadeIn 0.4s ease', minHeight: '80vh', padding: '60px 6vw 80px', maxWidth: 820, margin: '0 auto' }}>
        <a onClick={(e) => { e.preventDefault(); setShowResults(false); }} href="#"
           style={{ display: 'inline-block', color: C.creamMuted, textDecoration: 'none', fontSize: 12, letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 40, cursor: 'pointer' }}>
          ← Edit answers
        </a>
        <div style={{ ...eyebrow, marginBottom: 12 }}>Your results</div>
        <h1 style={{ ...heading(48), marginBottom: 32 }}>Culture change <em style={{ color: C.sage, fontStyle: 'italic' }}>readiness</em>.</h1>

        <div style={{ background: overall.bg, border: `1px solid ${overall.color}44`, borderRadius: 4, padding: 28, marginBottom: 40 }}>
          <div style={{ fontSize: 11, letterSpacing: '0.22em', textTransform: 'uppercase', color: overall.color, marginBottom: 8, fontFamily: F.sans }}>Overall readiness</div>
          <div style={{ display: 'flex', alignItems: 'baseline', flexWrap: 'wrap', gap: 12 }}>
            <span style={{ fontFamily: F.serif, fontSize: 36, color: overall.color }}>{overallScore} / {overallMax}</span>
            <span style={{ fontSize: 14, letterSpacing: '0.08em', textTransform: 'uppercase', color: overall.color, fontFamily: F.sans }}>{overall.label}</span>
          </div>
          <p style={{ fontSize: 15, color: C.cream, lineHeight: 1.7, marginTop: 14 }}>
            {overall.label === 'Working well' ? 'You have strong conditions across most dimensions. The work ahead is about sustaining this foundation and moving deliberately into execution.' : overall.label === 'Foundations emerging' ? 'You have real foundations to build on — and some important gaps to address first. Naming those gaps now is itself a form of readiness.' : 'Significant conditions are absent across multiple dimensions. This is important information — not a reason to stop, but a reason to be very deliberate about what you build first.'}
          </p>
        </div>

        <div style={{ ...eyebrow, color: C.creamMuted, marginBottom: 20 }}>By dimension</div>
        {READINESS_DIMS.map((d) => {
          const score = totalFor(d);
          const band = bandFor(score, 12);
          const pct = Math.round((score / 12) * 100);
          return (
            <div key={d.id} style={{ background: C.bgCard, borderRadius: 4, padding: 22, marginBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 12 }}>
                <div>
                  <div style={{ fontFamily: F.serif, fontSize: 18, color: C.cream, fontWeight: 400 }}>{d.label}</div>
                  <div style={{ fontSize: 12, color: C.creamMuted, marginTop: 2, fontStyle: 'italic' }}>{d.desc}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontFamily: F.sans, fontSize: 13, color: band.color }}>{score}/12</span>
                  <span style={{ fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: band.color, background: band.bg, border: `1px solid ${band.color}44`, padding: '3px 10px', borderRadius: 3 }}>{band.label}</span>
                </div>
              </div>
              <div style={{ height: 4, background: C.line, borderRadius: 2 }}>
                <div style={{ height: '100%', width: `${pct}%`, background: band.color, borderRadius: 2, transition: 'width 0.5s ease' }} />
              </div>
            </div>
          );
        })}

        <div style={{ display: 'flex', gap: 16, marginTop: 32, flexWrap: 'wrap' }}>
          <button onClick={downloadResults} style={btn('primary')} onMouseEnter={btnHoverIn} onMouseLeave={btnHoverOut}>Download results</button>
          <button onClick={() => navigate('home')} style={btn('secondary')}>Back to tools</button>
        </div>
      </main>
    );
  }

  return (
    <main style={{ animation: 'fadeIn 0.4s ease', minHeight: '80vh', padding: '60px 6vw 80px', maxWidth: 820, margin: '0 auto' }}>
      <a onClick={(e) => { e.preventDefault(); navigate('home'); }} href="#"
         style={{ display: 'inline-block', color: C.creamMuted, textDecoration: 'none', fontSize: 12, letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 40, cursor: 'pointer' }}>
        ← Back to tools
      </a>
      <div style={{ ...eyebrow, marginBottom: 12 }}>Self-assessment · 18 statements</div>
      <h1 style={{ ...heading(56), marginBottom: 20 }}>How <em style={{ color: C.sage, fontStyle: 'italic' }}>ready</em> are we, really?</h1>
      <p style={{ fontFamily: F.serif, fontSize: 22, lineHeight: 1.55, color: C.cream, marginBottom: 16, maxWidth: 600 }}>
        Rate each statement honestly — not how you wish things were, but how they actually are.
      </p>
      <p style={{ fontSize: 14, color: C.creamMuted, marginBottom: 48, lineHeight: 1.6, fontStyle: 'italic' }}>
        There are no wrong answers. This is a mirror, not a test. Takes about 5–7 minutes.
      </p>

      {READINESS_DIMS.map((d) => (
        <div key={d.id} style={{ marginBottom: 48 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, marginBottom: 24, paddingBottom: 14, borderBottom: `1px solid ${C.line}` }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: C.sage, flexShrink: 0, marginBottom: 2 }} />
            <div>
              <div style={{ fontFamily: F.serif, fontSize: 22, color: C.cream, lineHeight: 1.2 }}>{d.label}</div>
              <div style={{ fontSize: 13, color: C.creamMuted, fontStyle: 'italic', marginTop: 2 }}>{d.desc}</div>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {d.questions.map((q, qi) => {
              const key = d.id + '_' + qi;
              const val = scores[key] || 0;
              return (
                <div key={qi}>
                  <p style={{ fontSize: 15, color: C.cream, lineHeight: 1.7, marginBottom: 12 }}>{q}</p>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {SCALE_LABELS.map((lbl, li) => {
                      const v = li + 1;
                      const isActive = val === v;
                      return (
                        <button key={li} onClick={() => setScore(d.id, qi, v)}
                                style={{ flex: '1 1 130px', padding: '10px 8px', border: `1px solid ${isActive ? C.sage : C.line}`, borderRadius: 4, cursor: 'pointer', background: isActive ? 'rgba(197, 212, 155, 0.15)' : 'transparent', color: isActive ? C.sage : C.creamMuted, fontSize: 12, lineHeight: 1.3, letterSpacing: '0.04em', transition: 'all 0.2s', textAlign: 'center', fontFamily: F.sans }}>
                          {lbl}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      <div style={{ display: 'flex', gap: 16, marginTop: 32, flexWrap: 'wrap', justifyContent: 'space-between' }}>
        <button onClick={() => navigate('home')} style={btn('secondary')}>Back to tools</button>
        <button onClick={() => setShowResults(true)} disabled={!allAnswered} style={btn('primary', !allAnswered)} onMouseEnter={(e) => { if (allAnswered) btnHoverIn(e); }} onMouseLeave={(e) => { if (allAnswered) btnHoverOut(e); }}>
          See my results →
        </button>
      </div>
    </main>
  );
}
