import React, { useState, useEffect } from 'react';
import { C, F } from '../theme.js';
import { btn, btnHoverIn, btnHoverOut, eyebrow, heading } from '../styles.js';
import { useAppNavigate } from '../lib/useAppNavigate.js';
import { synthesize, extractText } from '../lib/synthesize.js';
import SEO from '../components/SEO.jsx';
import ToolFeedback from '../components/ToolFeedback.jsx';

// ============================================================================
// DATA
// ============================================================================
// Order matters — this is left-to-right on the top half of the circle.
const LCP_CREATIVE = [
  { id: 'relating', label: 'Relating', desc: 'Building genuine connection, listening deeply, putting people first.' },
  { id: 'self-awareness', label: 'Self-Awareness', desc: 'Knowing your own patterns, motivations, and impact on others.' },
  { id: 'authenticity', label: 'Authenticity', desc: 'Acting from what is true for you. Courage to bring your full self.' },
  { id: 'systems-awareness', label: 'Systems Awareness', desc: 'Seeing the bigger picture. Reading dynamics across the whole.' },
  { id: 'achieving', label: 'Achieving', desc: 'Driving results, decisive action, purposeful pursuit of outcomes.' },
];

const LCP_REACTIVE = [
  { id: 'controlling', label: 'Controlling', desc: 'Managing through dominance, perfectionism, or driving harder when stressed.' },
  { id: 'complying', label: 'Complying', desc: 'Going along to get along. Pleasing, conforming, deferring to keep peace.' },
  { id: 'protecting', label: 'Protecting', desc: 'Distancing through criticism, intellectualism, or keeping people at arm\'s length.' },
];

// Diagonal tensions (Jen's teaching from the video — controllers struggle with relating;
// compliers struggle with achieving). Protecting pairs with authenticity:
// the armor is what blocks bringing your full self.
const LCP_DIAGONAL = {
  controlling: 'relating',
  complying: 'achieving',
  protecting: 'authenticity',
};

const LCP_TENSION_NOTES = {
  'controlling+authenticity': "Your pull toward control likely costs you authenticity. The drive to make things go a certain way can quietly override what's true for you. Your team feels managed; what they want is to know you.",
  'controlling+relating': "Your pull toward control likely costs you connection. When stress rises, you tighten — and people feel it. The team often experiences competence without warmth.",
  'controlling+achieving': "An interesting pairing. Your control may be propelling your achievement — but watch for the cost in burnout, in others' agency, and in your own ability to delegate fully.",
  'controlling+self-awareness': "Control often arrives faster than self-awareness can catch it. The work is in slowing down enough to notice what just happened.",
  'controlling+systems-awareness': "Control narrows the view. Systems awareness asks you to widen it — to see the whole, not just the part you're trying to make behave.",

  'complying+achieving': "The classic tension Jen names in her teaching: when you default to going along, it can come at the cost of driving the results you actually care about. The voice that wants harmony quiets the voice that wants to push.",
  'complying+authenticity': "Complying makes authenticity hard. The instinct to keep peace can mute what's actually true for you — and people sense the gap, even when they can't name it.",
  'complying+relating': "An interesting one — complying can look like relating, but they're not the same. Real connection requires bringing yourself, not just smoothing yourself.",
  'complying+self-awareness': "Compliance often runs in the background, unexamined. The work is in noticing the moments you've smoothed yourself — and asking what you'd have said if you hadn't.",
  'complying+systems-awareness': "When you go along, you stop asking what the system actually needs. Systems awareness asks for the harder question others may not be willing to raise.",

  'protecting+relating': "Protecting holds people at arm's length — through criticism, distance, intellectual sharpness. The cost is what relating offers: real connection, real influence, real trust.",
  'protecting+authenticity': "Protective armor often gets mistaken for self. The work is asking: when I drop the defense, what's actually here?",
  'protecting+achieving': "Protecting can look like high standards, but it can quietly limit your reach — when you keep people at distance, you also keep yourself from the help and feedback that would sharpen what you do.",
  'protecting+self-awareness': "Protection is often invisible from the inside. From the outside, it reads as cold or critical. Self-awareness here means asking: how am I landing — even when I don't think I'm doing anything?",
  'protecting+systems-awareness': "Protective patterns narrow the field of who you trust. Systems awareness widens it. The question: who are you not letting in?",
};

const LCP_REFLECTION_QUESTIONS = {
  controlling: [
    "When did you first learn that controlling outcomes was how you stayed safe? What were you protecting yourself from?",
    "Where in your life are you tightening right now that the situation actually needs you to loosen?",
    "If you trusted that someone else could carry this — and that they might do it differently and well — what would you free up in yourself?",
  ],
  complying: [
    "When you smoothed something this week instead of saying what you actually thought, what was the fear underneath?",
    "What would you say if you genuinely believed it would be received?",
    "Where is going along costing you something you actually care about?",
  ],
  protecting: [
    "What are you protecting yourself from? What's the threat your patterns are trying to manage?",
    "Where would softening — letting someone closer, asking for help, dropping the critical edge — change what's possible?",
    "If you didn't have to hold this much together alone, how would you show up differently?",
  ],
};

// ============================================================================
// LCP CIRCLE — the visual showing creative on top, reactive on bottom
// ============================================================================
function LCPCircle({ topPick, bottomPick }) {
  const cx = 200, cy = 200, r = 130;
  const creativeCount = LCP_CREATIVE.length;
  const reactiveCount = LCP_REACTIVE.length;

  // Top half: spread creative across upper 180° (from 180° to 360°)
  // Array order maps left-to-right: relating, self-awareness, authenticity, systems-awareness, achieving
  const creativePositions = LCP_CREATIVE.map((d, i) => {
    const angle = Math.PI + (Math.PI * (i + 1)) / (creativeCount + 1);
    return { ...d, x: cx + Math.cos(angle) * r, y: cy + Math.sin(angle) * r, angle };
  });
  // Bottom half: spread reactive across lower 180° (from 0° to 180°)
  const reactivePositions = LCP_REACTIVE.map((d, i) => {
    const angle = (Math.PI * (i + 1)) / (reactiveCount + 1);
    return { ...d, x: cx + Math.cos(angle) * r, y: cy + Math.sin(angle) * r, angle };
  });

  // Helper: place a label radially outside the dot, with side-aware anchor
  const labelFor = (d, isPicked) => {
    const labelDist = isPicked ? 24 : 20;
    const lx = cx + Math.cos(d.angle) * (r + labelDist);
    const ly = cy + Math.sin(d.angle) * (r + labelDist);
    const cosA = Math.cos(d.angle);
    const anchor = cosA < -0.25 ? 'end' : cosA > 0.25 ? 'start' : 'middle';
    return { lx, ly, anchor };
  };

  return (
    <svg viewBox="-30 -10 460 420" style={{ width: '100%', maxWidth: 460, height: 'auto', display: 'block', margin: '0 auto' }}>
      {/* Top half background */}
      <path d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy} Z`} fill="rgba(197, 212, 155, 0.08)" />
      {/* Bottom half background */}
      <path d={`M ${cx + r} ${cy} A ${r} ${r} 0 0 1 ${cx - r} ${cy} Z`} fill="rgba(216, 138, 122, 0.08)" />
      {/* Center horizontal line */}
      <line x1={cx - r} y1={cy} x2={cx + r} y2={cy} stroke={C.line} strokeWidth="1" />
      {/* Outer circle */}
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={C.line} strokeWidth="1" />
      {/* Center labels */}
      <text x={cx} y={cy - 8} textAnchor="middle" fontFamily={F.sans} fontSize="10" letterSpacing="0.18em" fill={C.sage} opacity="0.7">CREATIVE</text>
      <text x={cx} y={cy + 18} textAnchor="middle" fontFamily={F.sans} fontSize="10" letterSpacing="0.18em" fill={C.needsWork} opacity="0.7">REACTIVE</text>

      {/* Creative dimension dots + labels */}
      {creativePositions.map((d) => {
        const isPicked = topPick === d.id;
        const { lx, ly, anchor } = labelFor(d, isPicked);
        return (
          <g key={d.id}>
            <circle cx={d.x} cy={d.y} r={isPicked ? 11 : 7} fill={C.sage} opacity={isPicked ? 1 : 0.5} />
            {isPicked && <circle cx={d.x} cy={d.y} r="18" fill="none" stroke={C.sage} strokeWidth="1.5" opacity="0.6" />}
            <text x={lx} y={ly} textAnchor={anchor} dominantBaseline="middle"
                  fontFamily={F.serif} fontSize={isPicked ? 14 : 12} fontWeight={isPicked ? 500 : 400}
                  fill={isPicked ? C.sage : C.cream} opacity={isPicked ? 1 : 0.75}>
              {d.label}
            </text>
          </g>
        );
      })}
      {/* Reactive dimension dots + labels */}
      {reactivePositions.map((d) => {
        const isPicked = bottomPick === d.id;
        const { lx, ly, anchor } = labelFor(d, isPicked);
        return (
          <g key={d.id}>
            <circle cx={d.x} cy={d.y} r={isPicked ? 11 : 7} fill={C.needsWork} opacity={isPicked ? 1 : 0.5} />
            {isPicked && <circle cx={d.x} cy={d.y} r="18" fill="none" stroke={C.needsWork} strokeWidth="1.5" opacity="0.6" />}
            <text x={lx} y={ly} textAnchor={anchor} dominantBaseline="middle"
                  fontFamily={F.serif} fontSize={isPicked ? 14 : 12} fontWeight={isPicked ? 500 : 400}
                  fill={isPicked ? C.needsWork : C.cream} opacity={isPicked ? 1 : 0.75}>
              {d.label}
            </text>
          </g>
        );
      })}
      {/* Diagonal line if both picked */}
      {topPick && bottomPick && (() => {
        const top = creativePositions.find((d) => d.id === topPick);
        const bot = reactivePositions.find((d) => d.id === bottomPick);
        if (!top || !bot) return null;
        return <line x1={top.x} y1={top.y} x2={bot.x} y2={bot.y} stroke={C.creamMuted} strokeWidth="1.5" strokeDasharray="4 4" opacity="0.55" />;
      })()}
    </svg>
  );
}

// ============================================================================
// COMPONENT
// ============================================================================
export default function LCPPage() {
  const navigate = useAppNavigate();
  // Phases: 'intro' | 'enter-scores' | 'results'
  const [phase, setPhase] = useState('intro');
  const [topPick, setTopPick] = useState(null);
  const [bottomPick, setBottomPick] = useState(null);
  const [synthesisText, setSynthesisText] = useState('');
  const [synthLoading, setSynthLoading] = useState(false);

  // Scroll to top whenever the phase changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [phase]);

  async function generateLCPSynthesis() {
    if (!topPick || !bottomPick) return;
    setSynthLoading(true);
    setSynthesisText('');
    const top = LCP_CREATIVE.find((d) => d.id === topPick);
    const bot = LCP_REACTIVE.find((d) => d.id === bottomPick);
    const tensionKey = `${bottomPick}+${topPick}`;
    const tensionNote = LCP_TENSION_NOTES[tensionKey] || '';

    const prompt = `You are a thoughtful, warm coach in the lineage of vertical/developmental work — Kegan, Garvey Berger. Someone has just taken the Leadership Circle Profile self-assessment and identified:

- Their dominant CREATIVE strength: ${top.label}. This is described as: ${top.desc}
- Their dominant REACTIVE pattern: ${bot.label}. This is described as: ${bot.desc}

Some context on the typical tension between these two: ${tensionNote}

Write a warm, specific 3-paragraph reflection that:
1) Names what their creative strength likely gives them — the gift it represents in their leadership and life.
2) Honors their reactive pattern as something that has protected them or served a purpose, while naming the cost it likely carries now. Be honest and tender at once.
3) Offers a gentle invitation — not a prescription — toward the next edge of their growth. Where their work might lie.

Write in a warm, conversational, second-person voice ("you"). No coaching jargon. No platitudes. Be specific. Around 250-300 words total.`;

    try {
      const data = await synthesize({
        model: 'claude-sonnet-4-5',
        max_tokens: 800,
        messages: [{ role: 'user', content: prompt }],
      });
      setSynthesisText(extractText(data));
    } catch (e) {
      setSynthesisText("AI synthesis is unavailable right now. The reflection questions below stand on their own.");
    }
    setSynthLoading(false);
  }

  const backLink = (
    <a onClick={(e) => { e.preventDefault(); navigate('home'); }} href="#"
       style={{ display: 'inline-block', color: C.creamMuted, textDecoration: 'none', fontSize: 12, letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 40, cursor: 'pointer' }}>
      ← Back to tools
    </a>
  );

  if (phase === 'intro') {
    return (
      <main style={{ animation: 'fadeIn 0.4s ease', minHeight: '80vh', padding: '60px 6vw 80px', maxWidth: 820, margin: '0 auto' }}>
        <SEO
          title="Leadership Circle Profile Self-Assessment Debrief | InciteU"
          description="Make sense of your free LCP self-assessment results. A guided reflection on the diagonal tension between your creative strengths and reactive patterns."
          path="/tools/self/lcp"
        />
        {backLink}
        <div style={{ ...eyebrow, marginBottom: 12 }}>The Leadership Circle Profile · A Self tool</div>
        <h1 style={{ ...heading(60), marginBottom: 28 }}>
          Working with your <em style={{ color: C.sage, fontStyle: 'italic' }}>circle</em>.
        </h1>
        <p style={{ fontFamily: F.serif, fontSize: 22, lineHeight: 1.55, color: C.cream, marginBottom: 24, maxWidth: 640 }}>
          The Leadership Circle Profile is the assessment I use most with senior leaders. The full version is a 360 — feedback from your boss, peers, reports, even friends and family. But there's also a free self-assessment, and it's a real place to start.
        </p>
        <p style={{ fontSize: 15, lineHeight: 1.7, color: C.creamMuted, maxWidth: 600, marginBottom: 36 }}>
          The output is a circle. The top half is your <span style={{ color: C.sage }}>creative competencies</span> — strengths scientifically correlated with effective leadership. The bottom half is your <span style={{ color: C.needsWork }}>reactive patterns</span> — what you do under stress that may have once kept you safe but tends to get in your way now.
          <br /><br />
          The fascinating part is the diagonal. People who default to <em style={{ color: C.sage, fontStyle: 'italic', fontFamily: F.serif, fontSize: 17 }}>controlling</em> often struggle with <em style={{ color: C.sage, fontStyle: 'italic', fontFamily: F.serif, fontSize: 17 }}>relating</em>. People who default to <em style={{ color: C.sage, fontStyle: 'italic', fontFamily: F.serif, fontSize: 17 }}>complying</em> often struggle with <em style={{ color: C.sage, fontStyle: 'italic', fontFamily: F.serif, fontSize: 17 }}>achieving</em>. Once you can see your pattern, you can choose differently.
        </p>

        <div style={{ background: C.bgCard, borderRadius: 4, padding: '40px 36px', marginBottom: 36 }}>
          <LCPCircle topPick={null} bottomPick={null} />
        </div>

        <h3 style={{ fontFamily: F.serif, fontSize: 28, color: C.cream, marginBottom: 20, marginTop: 56, fontWeight: 400 }}>
          How this tool works
        </h3>
        <ol style={{ paddingLeft: 0, listStyle: 'none', margin: 0 }}>
          {[
            { step: '01', text: 'Take the free LCP self-assessment (about 124 questions, 20 minutes). Get your results emailed to you.' },
            { step: '02', text: "Come back here and tell me your dominant creative strength and dominant reactive pattern." },
            { step: '03', text: "I'll surface the tension you're likely living, and offer reflective questions for working with it. Optional AI synthesis if you'd like it." },
          ].map((row, i) => (
            <li key={i} style={{ display: 'flex', gap: 20, padding: '18px 0', borderBottom: i < 2 ? `1px solid ${C.line}` : 'none' }}>
              <div style={{ fontFamily: F.sans, fontSize: 13, color: C.sage, letterSpacing: '0.18em', flexShrink: 0, paddingTop: 2 }}>{row.step}</div>
              <div style={{ fontSize: 15, color: C.cream, lineHeight: 1.7 }}>{row.text}</div>
            </li>
          ))}
        </ol>

        <div style={{ display: 'flex', gap: 16, marginTop: 40, flexWrap: 'wrap' }}>
          <a href="https://self-assessment.theleadershipcircle.com/?_gl=1*csjdxm*_up*MQ..*_ga*MTE5NDQ4NzU4MC4xNzc4NTQyNDc5*_ga_7BE657G74J*czE3Nzg1NDI0NzkkbzEkZzEkdDE3Nzg1NDI0ODYkajUzJGwwJGgw" target="_blank" rel="noopener noreferrer"
             style={{ ...btn('primary'), textDecoration: 'none' }}
             onMouseEnter={btnHoverIn} onMouseLeave={btnHoverOut}>
            Take the free assessment ↗
          </a>
          <button onClick={() => setPhase('enter-scores')} style={btn('secondary')}>
            Already taken it? Continue →
          </button>
        </div>
      </main>
    );
  }

  if (phase === 'enter-scores') {
    const canProceed = topPick && bottomPick;
    return (
      <main style={{ animation: 'fadeIn 0.4s ease', minHeight: '80vh', padding: '60px 6vw 80px', maxWidth: 820, margin: '0 auto' }}>
        <SEO
          title="Leadership Circle Profile Self-Assessment Debrief | InciteU"
          description="Make sense of your free LCP self-assessment results. A guided reflection on the diagonal tension between your creative strengths and reactive patterns."
          path="/tools/self/lcp"
        />
        {backLink}
        <div style={{ ...eyebrow, marginBottom: 12 }}>Your results</div>
        <h2 style={{ ...heading(48), marginBottom: 24 }}>What did your <em style={{ color: C.sage, fontStyle: 'italic' }}>circle</em> show?</h2>
        <p style={{ fontSize: 16, lineHeight: 1.7, color: C.creamMuted, marginBottom: 40, maxWidth: 640 }}>
          Looking at your LCP results, pick the one creative competency that scored highest — and the one reactive pattern that showed up most strongly. (If you're between two, pick the one that resonates most with how you actually experience yourself.)
        </p>

        <div style={{ background: C.bgCard, borderRadius: 4, padding: '32px 28px', marginBottom: 28 }}>
          <LCPCircle topPick={topPick} bottomPick={bottomPick} />
        </div>

        <h3 style={{ ...eyebrow, marginBottom: 16, color: C.sage }}>Your dominant creative strength</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12, marginBottom: 36 }}>
          {LCP_CREATIVE.map((d) => {
            const isPicked = topPick === d.id;
            return (
              <button key={d.id} onClick={() => setTopPick(d.id)}
                      style={{ background: isPicked ? 'rgba(197, 212, 155, 0.15)' : C.bgCard, border: `1px solid ${isPicked ? C.sage : C.line}`, borderRadius: 4, padding: '18px 20px', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit', transition: 'all 0.2s' }}>
                <div style={{ fontFamily: F.serif, fontSize: 19, color: isPicked ? C.sage : C.cream, marginBottom: 6 }}>{d.label}</div>
                <div style={{ fontSize: 12, color: C.creamMuted, lineHeight: 1.5 }}>{d.desc}</div>
              </button>
            );
          })}
        </div>

        <h3 style={{ ...eyebrow, marginBottom: 16, color: C.needsWork }}>Your dominant reactive pattern</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12, marginBottom: 36 }}>
          {LCP_REACTIVE.map((d) => {
            const isPicked = bottomPick === d.id;
            return (
              <button key={d.id} onClick={() => setBottomPick(d.id)}
                      style={{ background: isPicked ? 'rgba(216, 138, 122, 0.15)' : C.bgCard, border: `1px solid ${isPicked ? C.needsWork : C.line}`, borderRadius: 4, padding: '18px 20px', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit', transition: 'all 0.2s' }}>
                <div style={{ fontFamily: F.serif, fontSize: 19, color: isPicked ? C.needsWork : C.cream, marginBottom: 6 }}>{d.label}</div>
                <div style={{ fontSize: 12, color: C.creamMuted, lineHeight: 1.5 }}>{d.desc}</div>
              </button>
            );
          })}
        </div>

        <div style={{ display: 'flex', gap: 16, marginTop: 32, flexWrap: 'wrap' }}>
          <button onClick={() => setPhase('intro')} style={btn('secondary')}>Back</button>
          <button onClick={() => { setPhase('results'); generateLCPSynthesis(); }} disabled={!canProceed}
                  style={btn('primary', !canProceed)} onMouseEnter={(e) => { if (canProceed) btnHoverIn(e); }} onMouseLeave={(e) => { if (canProceed) btnHoverOut(e); }}>
            See my reflection →
          </button>
        </div>
      </main>
    );
  }

  // RESULTS PHASE
  const top = LCP_CREATIVE.find((d) => d.id === topPick);
  const bot = LCP_REACTIVE.find((d) => d.id === bottomPick);
  const tensionKey = `${bottomPick}+${topPick}`;
  const tensionNote = LCP_TENSION_NOTES[tensionKey] || "These patterns will inform each other in their own way. Sit with them.";
  const reflectionQuestions = LCP_REFLECTION_QUESTIONS[bottomPick] || [];
  const isClassicDiagonal = LCP_DIAGONAL[bottomPick] === topPick;

  return (
    <main style={{ animation: 'fadeIn 0.4s ease', minHeight: '80vh', padding: '60px 6vw 80px', maxWidth: 820, margin: '0 auto' }}>
      <SEO
        title="Leadership Circle Profile Self-Assessment Debrief | InciteU"
        description="Make sense of your free LCP self-assessment results. A guided reflection on the diagonal tension between your creative strengths and reactive patterns."
        path="/tools/self/lcp"
      />
      {backLink}
      <div style={{ ...eyebrow, marginBottom: 12 }}>Your reflection</div>
      <h2 style={{ ...heading(48), marginBottom: 28 }}>
        Your <em style={{ color: C.sage, fontStyle: 'italic' }}>{top.label}</em> meets your <em style={{ color: C.needsWork, fontStyle: 'italic' }}>{bot.label}</em>.
      </h2>

      <div style={{ background: C.bgCard, borderRadius: 4, padding: '32px 28px', marginBottom: 36 }}>
        <LCPCircle topPick={topPick} bottomPick={bottomPick} />
      </div>

      {isClassicDiagonal && (
        <div style={{ background: 'rgba(197, 212, 155, 0.08)', border: `1px solid ${C.sageMuted}`, borderRadius: 4, padding: '20px 24px', marginBottom: 28 }}>
          <div style={{ ...eyebrow, color: C.sage, marginBottom: 8 }}>The diagonal pattern</div>
          <p style={{ fontSize: 15, color: C.cream, lineHeight: 1.65 }}>
            You've landed on a classic diagonal — one of the most common and meaningful tensions on the circle. This pairing has a lot to teach.
          </p>
        </div>
      )}

      <div style={{ background: C.bgCard, borderLeft: `3px solid ${C.sage}`, borderRadius: 4, padding: '32px 36px', marginBottom: 36 }}>
        <div style={{ ...eyebrow, marginBottom: 16 }}>What this tension tends to mean</div>
        <p style={{ fontFamily: F.serif, fontSize: 19, lineHeight: 1.65, color: C.cream }}>{tensionNote}</p>
      </div>

      <div style={{ background: 'linear-gradient(135deg, rgba(197, 212, 155, 0.06), rgba(197, 212, 155, 0.02))', border: '1px solid rgba(197, 212, 155, 0.25)', borderRadius: 4, padding: '36px 36px', marginBottom: 36 }}>
        <div style={{ ...eyebrow, marginBottom: 20 }}>A reflection on your circle</div>
        <div style={{ fontFamily: F.serif, fontSize: 18, lineHeight: 1.7, color: C.cream, whiteSpace: 'pre-wrap' }}>
          {synthLoading ? <span style={{ color: C.creamMuted, fontStyle: 'italic' }}>Reading what you've shared…</span> : synthesisText}
        </div>
      </div>

      <h3 style={{ fontFamily: F.serif, fontSize: 28, color: C.cream, marginBottom: 12, marginTop: 48, fontWeight: 400 }}>
        Questions to <em style={{ color: C.sage, fontStyle: 'italic' }}>sit with</em>
      </h3>
      <p style={{ fontSize: 14, color: C.creamMuted, marginBottom: 24, fontStyle: 'italic' }}>Read them slowly. There's no right answer. Notice which one snags.</p>
      <ul style={{ listStyle: 'none', padding: 0, marginBottom: 36 }}>
        {reflectionQuestions.map((q, i, arr) => (
          <li key={i} style={{ fontFamily: F.serif, fontStyle: 'italic', color: C.cream, fontSize: 19, lineHeight: 1.5, padding: '18px 0 18px 28px', borderBottom: i === arr.length - 1 ? 'none' : `1px solid ${C.line}`, position: 'relative' }}>
            <span style={{ position: 'absolute', left: 0, top: 22, color: C.sage, fontWeight: 700, fontSize: 22, lineHeight: 1, fontStyle: 'normal' }}>·</span>
            {q}
          </li>
        ))}
      </ul>

      <div style={{ display: 'flex', gap: 16, marginTop: 40, flexWrap: 'wrap' }}>
        <button onClick={() => setPhase('enter-scores')} style={btn('secondary')}>Pick differently</button>
        <button onClick={() => navigate('home')} style={btn('primary')} onMouseEnter={btnHoverIn} onMouseLeave={btnHoverOut}>Back to all tools</button>
      </div>
      <ToolFeedback
        formspreeId="mzdwwygz"
        toolName="LCP Debrief"
        role="subject"
        initialQuestion="Did this tool help?"
        positivePrompt="What made it useful?"
        negativePrompt="What could have made it more useful?"
      />
    </main>
  );
}
