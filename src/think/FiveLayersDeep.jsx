import React from 'react';
import { C, F } from '../theme.js';
import { btn, btnHoverIn, btnHoverOut } from '../styles.js';
import { useAppNavigate } from '../lib/useAppNavigate.js';

// ============================================================================
// DATA
// ============================================================================
const FLD_LAYERS = [
  { id: 'present', name: 'The Present', subtitle: "what's here now", color: C.sage, era: '3.5 billion years ago',
    creature: 'Amoeba', emoji: '🦠',
    body1: 'The first living things were single-celled organisms, like amoebas. They had only three core abilities: to <strong>sense</strong>, to <strong>seek</strong>, and to <strong>avoid</strong>. These three abilities evolved as organisms evolved.',
    body2: "An amoeba senses only basic chemicals — nutrients and toxins. It can move toward nutrients and away from toxins. That's it. No memory, no planning, no awareness of others. Just raw sensation and two drives that will persist through every layer of evolution, all the way up to us.",
    body3: 'Slightly more complex organisms — like worms — take these raw sensations and process them as a fundamental feeling: <strong>pain</strong>.',
    senses: 'Raw sensation: chemical gradients, temperature, pressure',
    seek: { label: 'Pleasure', desc: 'Move toward nutrient, warmth' },
    protect: { label: 'Withdraw / escape', desc: 'Move away from damage' },
    pain: 'Physical pain', painNote: '' },
  { id: 'past', name: 'The Past', subtitle: 'what happened before', color: '#A8C5BA', era: '500 million years ago — memory arrives',
    creature: 'Fish', emoji: '🐟',
    body1: "When fish evolved, something new happened: a hippocampus. With it came <strong>memory</strong>. Now, the organism doesn't just react to what is here in the present — it remembers what happened in the past. It remembers when a predator struck, where the best food was. And with this memory comes a new form of pain: <strong>fear</strong>.",
    senses: 'Patterns, recognition, memory — "this happened before"',
    seek: { label: 'Anticipation', desc: 'Pursue known rewards, return to safe places' },
    protect: { label: 'Fight / flight / freeze', desc: 'React to remembered threats' },
    pain: 'Fear', painNote: 'pain remembered and anticipated' },
  { id: 'others', name: 'Others', subtitle: 'what others feel, think, do', color: '#D4A584', era: '200 million years ago — empathy arrives',
    creature: 'Mammals', emoji: '🐭',
    body1: "The mammalian revolution. Oxytocin. Mirror neurons. Ventral vagal circuits. For the first time, an organism's nervous system is coupled to other nervous systems. A rat will work to free a trapped companion even when food is available nearby. That's not redirected seeking — that's a genuinely new capacity. And with it comes a new pain: <strong>fear for others</strong>. You can now suffer for someone else's suffering.",
    senses: 'Emotional states of others, social signals, trust, group dynamics',
    seek: { label: 'Love', desc: 'Bond, nurture, cooperate, attune' },
    protect: { label: 'Defend group over self', desc: 'Protect offspring, pack, tribe' },
    pain: 'Fear for others', painNote: "empathic pain — feeling another's suffering" },
  { id: 'future', name: 'The Future', subtitle: 'what could be for me', color: '#9FB8D4', era: '25 million years ago — imagination arrives',
    creature: 'Primates', emoji: '🦍',
    body1: "The prefrontal cortex expands. Now the organism can simulate futures that don't exist yet. Causal chains. If-then reasoning. Planning. The world is no longer just what is, what was, and what others feel — it's also what <strong>could be</strong>. And with imagination comes a new pain: <strong>anxiety</strong> — suffering for things that haven't happened and may never happen.",
    senses: 'Hypothetical futures, causal chains — "if X then Y"',
    seek: { label: 'Hope', desc: 'Plan, envision, create, build toward imagined futures' },
    protect: { label: 'Defend the future', desc: 'Anticipate threats, set boundaries, act preemptively' },
    pain: 'Anxiety', painNote: "pain about things that haven't happened yet" },
  { id: 'enduring', name: 'The Enduring', subtitle: 'what outlasts me', color: '#C2A8D4', era: '2 million years ago — meaning arrives',
    creature: 'Humans', emoji: '🧑',
    body1: "Something unprecedented. The capacity to conceive of things that transcend your own survival. Justice. Legacy. Beauty. Purpose. A human can endure physical pain, override learned fear, leave their group, and pursue a plan they know might fail — because they've decided something <strong>matters more than they do</strong>. And with meaning comes the deepest pain: <strong>existential suffering</strong> — the ache of falling short, of mortality, of meaninglessness.",
    senses: 'Meaning, values, identity, legacy',
    seek: { label: 'Devotion', desc: 'Commit, sacrifice, build what will outlast you' },
    protect: { label: 'Die for / save what I believe in', desc: 'Or psychological defense: denial, rationalization' },
    pain: 'Existential pain', painNote: 'falling short, mortality, meaninglessness' },
];

const FLD_ARCHETYPES = [
  { id: 'hedonist', symbol: '☀', name: 'Hedonist', color: C.sage,
    what: 'The seeking drive. Pursues what sustains — from nutrients to meaning.',
    feels: 'Pleasure, anticipation, hope, devotion · Frustration, rage, outrage when blocked' },
  { id: 'warrior', symbol: '⚔', name: 'Warrior', color: '#D88A7A',
    what: 'The protective drive. Defends against threats — from toxins to existential danger.',
    feels: 'Vigilance, courage, sacrifice · Fear, trauma, despair when protection fails' },
  { id: 'lover', symbol: '♡', name: 'Lover', color: '#D4A584',
    what: 'The empathy capacity. Feels what others feel and lets it shape action.',
    feels: 'Love, belonging, joy, attunement · Betrayal, grief when connection breaks' },
  { id: 'strategist', symbol: '◈', name: 'Strategist', color: '#9FB8D4',
    what: 'The imagination capacity. Models futures and acts on what could be.',
    feels: 'Hope, fulfillment, achievement · Anxiety, outrage, despair when futures collapse' },
  { id: 'visionary', symbol: '✧', name: 'Visionary', color: '#C2A8D4',
    what: 'The meaning capacity. Serves something larger than the self.',
    feels: 'Devotion, awe, purpose · Moral fury, existential crisis when meaning collapses' },
];

// ============================================================================
// LAYER INTRO HELPER
// ============================================================================
function FldLayerIntro({ emoji, era }) {
  return (
    <div style={{ textAlign: 'center', marginBottom: 24 }}>
      <div style={{ fontSize: 56, lineHeight: 1, marginBottom: 10 }}>{emoji}</div>
      <div style={{ fontFamily: F.sans, fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase', color: C.creamMuted }}>
        {era}
      </div>
    </div>
  );
}

// ============================================================================
// COMPONENT
// ============================================================================
export default function FiveLayersDeepPage() {
  const navigate = useAppNavigate();
  const seekStyle = { background: 'rgba(197, 212, 155, 0.08)', borderLeft: `3px solid ${C.sage}` };
  const protectStyle = { background: 'rgba(216, 138, 122, 0.08)', borderLeft: `3px solid #D88A7A` };
  const painStyle = { background: 'rgba(216, 138, 122, 0.05)', borderLeft: `3px solid #B07060` };

  return (
    <main style={{ animation: 'fadeIn 0.4s ease' }}>
      {/* HERO */}
      <section style={{ minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px 6vw 60px', textAlign: 'center' }}>
        <div style={{ maxWidth: 720 }}>
          <a onClick={(e) => { e.preventDefault(); navigate('think'); }} href="#"
             style={{ display: 'inline-block', color: C.creamMuted, textDecoration: 'none', fontSize: 12, letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 32, cursor: 'pointer' }}>
            ← All pieces
          </a>
          <h1 style={{ fontFamily: F.serif, fontSize: 'clamp(48px, 7vw, 80px)', fontWeight: 400, letterSpacing: '-0.01em', lineHeight: 1.05, marginBottom: 20, color: C.cream }}>
            Five layers <em style={{ color: C.sage, fontStyle: 'italic' }}>deep</em>.
          </h1>
          <p style={{ fontFamily: F.serif, fontStyle: 'italic', fontSize: 'clamp(20px, 2.6vw, 26px)', color: C.creamMuted, marginBottom: 36 }}>
            The evolutionary roots of how you think, connect, and lead
          </p>
          <p style={{ fontSize: 16, lineHeight: 1.75, color: C.cream, textAlign: 'left', maxWidth: 580, margin: '0 auto 16px', fontFamily: F.sans, fontWeight: 300 }}>
            This model shows how humans evolved from single-celled organisms to the creatures we are today. It gives a biologically-based view of how much complexity we can hold, and how — as we developed — each level of new capacity unlocked more advanced abilities for us to connect and protect ourselves, our species, and, when we are at our best, our future.
          </p>
          <p style={{ fontSize: 16, lineHeight: 1.75, color: C.cream, textAlign: 'left', maxWidth: 580, margin: '0 auto', fontFamily: F.sans, fontWeight: 300 }}>
            When we are at our best, we can access all of these levels. When under threat, we often lose our ability to hold all of this complexity, and suffer for it.
          </p>
          <div style={{ fontFamily: F.sans, fontSize: 11, letterSpacing: '0.3em', textTransform: 'uppercase', color: C.creamMuted, marginTop: 56, opacity: 0.6 }}>
            ↓ scroll to begin
          </div>
        </div>
      </section>

      {/* FIVE LAYERS */}
      {FLD_LAYERS.map((layer) => (
        <section key={layer.id} style={{ padding: '80px 6vw', borderTop: `1px solid ${C.line}` }}>
          <div style={{ maxWidth: 680, margin: '0 auto' }}>
            <FldLayerIntro emoji={layer.emoji} era={layer.era} />
            <div style={{ textAlign: 'center', marginBottom: 32 }}>
              <h2 style={{ fontFamily: F.serif, fontSize: 'clamp(28px, 4.5vw, 40px)', fontWeight: 400, color: layer.color, lineHeight: 1.15, marginBottom: 8 }}>
                {layer.creature}: {layer.name}
              </h2>
              <p style={{ fontFamily: F.serif, fontStyle: 'italic', fontSize: 18, color: C.creamMuted }}>{layer.subtitle}</p>
            </div>
            <div style={{ fontSize: 16, lineHeight: 1.75, color: C.cream, marginBottom: 16, fontFamily: F.sans, fontWeight: 300 }} dangerouslySetInnerHTML={{ __html: layer.body1 }} />
            {layer.body2 && <div style={{ fontSize: 16, lineHeight: 1.75, color: C.cream, marginBottom: 16, fontFamily: F.sans, fontWeight: 300 }} dangerouslySetInnerHTML={{ __html: layer.body2 }} />}
            {layer.body3 && <div style={{ fontSize: 16, lineHeight: 1.75, color: C.cream, marginBottom: 24, fontFamily: F.sans, fontWeight: 300 }} dangerouslySetInnerHTML={{ __html: layer.body3 }} />}

            <div style={{ background: 'rgba(240, 235, 219, 0.04)', borderRadius: 4, padding: '14px 18px', marginBottom: 20, marginTop: 24 }}>
              <div style={{ fontFamily: F.sans, fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', color: C.creamMuted, marginBottom: 6 }}>Information organism can sense</div>
              <div style={{ fontSize: 14, color: C.cream, lineHeight: 1.6 }}>{layer.senses}</div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14, marginBottom: 16 }}>
              <div style={{ ...seekStyle, padding: '18px 22px', borderRadius: 4 }}>
                <div style={{ fontFamily: F.sans, fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', color: C.sage, marginBottom: 6 }}>Seek</div>
                <div style={{ fontFamily: F.serif, fontSize: 19, color: C.cream, marginBottom: 4 }}>{layer.seek.label}</div>
                <div style={{ fontSize: 13, color: C.creamMuted, lineHeight: 1.5 }}>{layer.seek.desc}</div>
              </div>
              <div style={{ ...protectStyle, padding: '18px 22px', borderRadius: 4 }}>
                <div style={{ fontFamily: F.sans, fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#D88A7A', marginBottom: 6 }}>Protect</div>
                <div style={{ fontFamily: F.serif, fontSize: 19, color: C.cream, marginBottom: 4 }}>{layer.protect.label}</div>
                <div style={{ fontSize: 13, color: C.creamMuted, lineHeight: 1.5 }}>{layer.protect.desc}</div>
              </div>
            </div>

            <div style={{ ...painStyle, padding: '14px 18px', borderRadius: 4 }}>
              <div style={{ fontFamily: F.sans, fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#B07060', marginBottom: 4 }}>Pain at this layer</div>
              <div style={{ fontFamily: F.serif, fontSize: 17, color: C.cream }}>{layer.pain}</div>
              {layer.painNote && <div style={{ fontSize: 13, color: C.creamMuted, fontStyle: 'italic', marginTop: 2 }}>{layer.painNote}</div>}
            </div>
          </div>
        </section>
      ))}

      {/* THE FIVE ARCHETYPES */}
      <section style={{ padding: '100px 6vw 80px', borderTop: `1px solid ${C.line}` }}>
        <div style={{ maxWidth: 820, margin: '0 auto' }}>
          <h2 style={{ fontFamily: F.serif, fontSize: 'clamp(28px, 4vw, 38px)', fontWeight: 400, color: C.cream, lineHeight: 1.15, marginBottom: 12 }}>
            The simplified model: <em style={{ color: C.sage, fontStyle: 'italic' }}>five archetypes</em> for leading in complexity
          </h2>
          <p style={{ fontSize: 16, lineHeight: 1.75, color: C.cream, marginBottom: 12, fontFamily: F.sans, fontWeight: 300 }}>
            The full model above shows our evolved capacity to hold complexity. But the best leaders know that great things happen when we reach the <em style={{ color: C.sage, fontStyle: 'italic' }}>simplicity on the other side of complexity</em>.
          </p>
          <p style={{ fontSize: 16, lineHeight: 1.75, color: C.cream, marginBottom: 48, fontFamily: F.sans, fontWeight: 300 }}>
            The Five Archetypes help us do this. Each represents a fundamental human capacity: either a core drive that's always active to help us survive, or a complexity-friendly capacity that helps us thrive.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 64 }}>
            {FLD_ARCHETYPES.map((arch) => (
              <div key={arch.id} style={{ background: C.bgCard, borderTop: `2px solid ${arch.color}`, borderRadius: 4, padding: '24px 20px', textAlign: 'center' }}>
                <div style={{ fontSize: 28, color: arch.color, marginBottom: 8, lineHeight: 1 }}>{arch.symbol}</div>
                <div style={{ fontFamily: F.sans, fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase', color: arch.color, marginBottom: 10, fontWeight: 500 }}>{arch.name}</div>
                <div style={{ fontSize: 13, color: C.cream, lineHeight: 1.55, marginBottom: 10 }}>{arch.what}</div>
                <div style={{ fontSize: 12, color: C.creamMuted, lineHeight: 1.5, fontStyle: 'italic' }}>{arch.feels}</div>
              </div>
            ))}
          </div>

          {/* Asymmetry note */}
          <div style={{ background: C.bgCard, borderLeft: `3px solid ${C.sage}`, padding: '24px 28px', borderRadius: 4, marginBottom: 64 }}>
            <p style={{ fontFamily: F.serif, fontSize: 18, color: C.cream, lineHeight: 1.65, fontStyle: 'italic' }}>
              Notice the asymmetry: the Hedonist and Warrior run through every layer — two ancient drives, always active. The Lover, Strategist, and Visionary each emerge at one specific layer of evolution. Two drives that have always been with us, three later capacities layered on top. The work of leadership is holding all five.
            </p>
          </div>
        </div>
      </section>

      {/* UNDER PRESSURE */}
      <section style={{ padding: '80px 6vw', borderTop: `1px solid ${C.line}` }}>
        <div style={{ maxWidth: 540, margin: '0 auto' }}>
          <h2 style={{ fontFamily: F.serif, fontSize: 'clamp(28px, 4vw, 38px)', fontWeight: 400, color: C.cream, lineHeight: 1.15, marginBottom: 20 }}>
            Under <em style={{ color: C.sage, fontStyle: 'italic' }}>pressure</em>
          </h2>
          <p style={{ fontSize: 16, lineHeight: 1.75, color: C.cream, marginBottom: 32, fontFamily: F.sans, fontWeight: 300 }}>
            Under pressure, the most recently evolved capacities often go quiet first. Meaning fades. Then strategic thinking narrows. Then empathy contracts. What remains are the two ancient drives — the <strong style={{ color: C.sage }}>Hedonist</strong> and the <strong style={{ color: '#D88A7A' }}>Warrior</strong> — running without the <strong>Lover</strong>, <strong>Strategist</strong>, or <strong>Visionary</strong> to guide them.
          </p>
          <p style={{ fontSize: 16, lineHeight: 1.75, color: C.cream, marginBottom: 32, fontFamily: F.sans, fontWeight: 300 }}>
            The work of leadership under pressure is noticing which archetypes have gone offline — and bringing them back.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 32 }}>
            {[
              { name: 'Visionary', symbol: '✧', online: false },
              { name: 'Strategist', symbol: '◈', online: false },
              { name: 'Lover', symbol: '♡', online: false },
              { name: 'Warrior', symbol: '⚔', online: true, color: '#D88A7A', note: 'active — raw protect' },
              { name: 'Hedonist', symbol: '☀', online: true, color: C.sage, note: 'active — raw seek' },
            ].map((row, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 20px', borderRadius: 4, background: row.online ? (row.color === C.sage ? 'rgba(197, 212, 155, 0.08)' : 'rgba(216, 138, 122, 0.08)') : 'rgba(240, 235, 219, 0.02)', borderLeft: `3px solid ${row.online ? row.color : C.line}`, opacity: row.online ? 1 : 0.4 }}>
                <span style={{ fontSize: 16, color: row.online ? row.color : C.creamMuted }}>{row.symbol}</span>
                <span style={{ fontFamily: F.serif, fontSize: 16, color: row.online ? C.cream : C.creamMuted, fontWeight: row.online ? 500 : 400, flex: 1 }}>{row.name}</span>
                <span style={{ fontFamily: F.sans, fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase', color: row.online ? row.color : C.creamMuted }}>
                  {row.online ? row.note : '◉ offline'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CLOSING */}
      <section style={{ padding: '120px 6vw', borderTop: `1px solid ${C.line}`, textAlign: 'center' }}>
        <p style={{ fontFamily: F.serif, fontSize: 'clamp(22px, 3vw, 28px)', fontWeight: 400, color: C.cream, lineHeight: 1.55, maxWidth: 540, margin: '0 auto' }}>
          Two ancient drives.<br />
          Three evolutionary innovations.<br />
          Five core capacities to lead in complexity.<br /><br />
          <em style={{ color: C.sage, fontStyle: 'italic' }}>The work is holding them all.</em>
        </p>
      </section>

      {/* Footer nav */}
      <section style={{ padding: '60px 6vw 80px', borderTop: `1px solid ${C.line}`, textAlign: 'center' }}>
        <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button onClick={() => navigate('think')} style={btn('secondary')}>← All pieces</button>
          <button onClick={() => navigate('lcp')} style={btn('primary')} onMouseEnter={btnHoverIn} onMouseLeave={btnHoverOut}>
            Try the LCP tool →
          </button>
        </div>
      </section>
    </main>
  );
}
