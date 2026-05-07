import React, { useState, useEffect, useRef } from 'react';
import { C as baseC, F } from '../theme.js';
import { useAppNavigate } from '../lib/useAppNavigate.js';

const C = { ...baseC, creamMuted: 'rgba(240,235,219,0.55)', sageMuted: 'rgba(197,212,155,0.35)', warmAccent: '#E8C87A', alert: '#D4785C' };
const DOMAIN_COLORS = { clear: C.cream, complicated: C.warmAccent, complex: C.sage, chaotic: C.alert };

/* ── Intersection hook ── */
function useInView(opts = {}) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setVisible(true); obs.unobserve(el); }
    }, { threshold: opts.threshold || 0.15 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return [ref, visible];
}

function Reveal({ children, delay = 0, direction = 'up', style = {} }) {
  const [ref, vis] = useInView();
  const t = { up: 'translateY(48px)', left: 'translateX(-80px)', right: 'translateX(80px)', none: 'none' };
  return (
    <div ref={ref} style={{
      opacity: vis ? 1 : 0, transform: vis ? 'translate(0,0)' : (t[direction] || t.up),
      transition: `opacity 0.9s cubic-bezier(.22,1,.36,1) ${delay}ms, transform 0.9s cubic-bezier(.22,1,.36,1) ${delay}ms`,
      ...style,
    }}>{children}</div>
  );
}

function Divider() { return <div style={{ width: 60, height: 1, background: C.sageMuted, margin: '100px auto' }} />; }

/* ══════════════════════════════════════════
   CYNEFIN DIAGRAM — all content visible at once
   ══════════════════════════════════════════ */
function CynefinDiagram({ domains, showApproach = false }) {
  const order = [
    { key: 'complex', color: C.sage, approach: 'probe → sense → respond' },
    { key: 'complicated', color: C.warmAccent, approach: 'sense → analyze → respond' },
    { key: 'chaotic', color: C.alert, approach: 'act → sense → respond' },
    { key: 'clear', color: C.cream, approach: 'sense → categorize → respond' },
  ];

  return (
    <div style={{ position: 'relative', maxWidth: 720, margin: '0 auto' }}>
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: 'auto auto',
        border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, overflow: 'hidden',
        background: 'rgba(255,255,255,0.01)',
      }}>
        {order.map(d => {
          const content = domains ? domains[d.key] : null;
          return (
            <div key={d.key} style={{
              padding: 'clamp(24px, 3.5vw, 40px)',
              background: content ? `${d.color}09` : 'transparent',
              borderBottom: (d.key === 'complex' || d.key === 'complicated') ? '1px solid rgba(255,255,255,0.04)' : 'none',
              borderRight: (d.key === 'complex' || d.key === 'chaotic') ? '1px solid rgba(255,255,255,0.04)' : 'none',
            }}>
              <div style={{
                fontFamily: F.serif, fontSize: 'clamp(20px, 2.8vw, 28px)', fontWeight: 600,
                color: d.color, marginBottom: content ? 10 : (showApproach ? 6 : 0),
              }}>
                {d.key.charAt(0).toUpperCase() + d.key.slice(1)}
              </div>
              {showApproach && !content && (
                <div style={{
                  fontFamily: F.sans, fontSize: 'clamp(10px, 1.1vw, 12px)',
                  color: C.cream, opacity: 0.4,
                }}>{d.approach}</div>
              )}
              {content && (
                <>
                  <p style={{
                    fontFamily: F.serif, fontSize: 'clamp(15px, 1.8vw, 20px)', color: C.cream,
                    lineHeight: 1.35, marginBottom: 6, fontWeight: 500,
                  }}>{content.headline}</p>
                  <p style={{
                    fontFamily: F.sans, fontSize: 'clamp(11px, 1.3vw, 13px)', color: C.creamMuted,
                    lineHeight: 1.7, margin: 0,
                  }}>{content.body}</p>
                </>
              )}
            </div>
          );
        })}
      </div>
      <div style={{
        position: 'absolute', left: -6, top: '50%', transform: 'translateY(-50%) rotate(-90deg)',
        fontFamily: F.sans, fontSize: 9, letterSpacing: '0.22em', color: C.creamMuted, opacity: 0.4,
        whiteSpace: 'nowrap',
      }}>UNPREDICTABLE</div>
      <div style={{
        position: 'absolute', right: -6, top: '50%', transform: 'translateY(-50%) rotate(90deg)',
        fontFamily: F.sans, fontSize: 9, letterSpacing: '0.22em', color: C.creamMuted, opacity: 0.4,
        whiteSpace: 'nowrap',
      }}>PREDICTABLE</div>
    </div>
  );
}

function DecisionCard({ color, title, approach, detail }) {
  const [h, setH] = useState(false);
  return (
    <div onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)} style={{
      background: h ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.018)',
      border: `1px solid ${h ? color + '66' : 'rgba(255,255,255,0.07)'}`,
      borderRadius: 12, padding: '28px 24px', transition: 'all 0.35s ease',
      height: '100%',
    }}>
      <h3 style={{ fontFamily: F.serif, fontSize: 24, color, margin: '0 0 14px', fontWeight: 600 }}>{title}</h3>
      <p style={{ fontFamily: F.serif, fontSize: 17, color: C.cream, margin: '0 0 8px', fontWeight: 500 }}>{approach}</p>
      <p style={{ fontFamily: F.sans, fontSize: 13, color: C.creamMuted, lineHeight: 1.65, margin: 0 }}>{detail}</p>
    </div>
  );
}

export default function CynefinScrollytelling() {
  const navigate = useAppNavigate();

  const holidayDomains = {
    clear: { headline: 'The grocery list.', body: "You know what you need. Go to the store, buy the items, check them off. This is a solved problem." },
    complicated: { headline: 'Six dishes. One oven. Different temps.', body: "Everything hot on the table at the same time. Hard — but solvable with expertise, timing, and a plan." },
    complex: { headline: 'The seating arrangements.', body: "Avoid politics and religion but have everyone enjoy themselves. No formula. Uncle Bob is going to be Uncle Bob." },
    chaotic: { headline: 'The fire alarm goes off.', body: "Someone argues whether it's real. Your kid bolts outside — no shoes, no coat. No time to analyze. You act." },
  };

  const businessDomains = {
    clear: { headline: 'Payroll.', body: "Same process, every cycle. Steps are documented, software does the math. Follow the checklist." },
    complicated: { headline: 'The thing you call Legal for.', body: "Tax implications. Contract restructuring. Expertise-dependent, analyzable — you need the right specialists." },
    complex: { headline: 'Culture change. Reorgs. Launches.', body: "Anything that depends on how people actually behave. You can't predict it. You can't control it." },
    chaotic: { headline: 'COVID. Day one of a crisis.', body: "No playbook. Supply chain collapsed, team scattered, customers panicking. Put out the fire first." },
  };

  return (
    <div style={{ minHeight: '80vh', overflowX: 'hidden' }}>
      <style>{`
        @keyframes pulseDown { 0%,100% { opacity:0.3; transform:translateY(0); } 50% { opacity:1; transform:translateY(6px); } }
        @media (max-width: 640px) { .split-row { flex-direction: column !important; } .decision-grid { grid-template-columns: 1fr 1fr !important; } }
      `}</style>

      <a onClick={(e) => { e.preventDefault(); navigate('home'); }} href="#"
         style={{ display: 'inline-block', color: C.creamMuted, textDecoration: 'none', fontSize: 12, letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 20, cursor: 'pointer', padding: '20px 6vw 0' }}>
        \u2190 Back to tools
      </a>

      {/* HERO */}
      <div style={{ minHeight: '80vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '0 8vw', textAlign: 'center' }}>
        <Reveal>
          <div style={{ fontFamily: F.sans, fontSize: 11, letterSpacing: '0.25em', textTransform: 'uppercase', color: C.sage, marginBottom: 32 }}>The Cynefin Framework</div>
          <h1 style={{ fontFamily: F.serif, fontSize: 'clamp(38px, 6.5vw, 68px)', fontWeight: 500, lineHeight: 1.1, maxWidth: 720, margin: '0 auto 28px' }}>
            Not All Problems<br />Are Created Equal
          </h1>
          <p style={{ fontFamily: F.sans, fontSize: 'clamp(15px, 2vw, 18px)', color: C.creamMuted, maxWidth: 540, lineHeight: 1.7, margin: '0 auto' }}>
            Knowing what kind of challenge you\u2019re facing makes tackling it a lot easier.
          </p>
        </Reveal>
        <div style={{ marginTop: 64, animation: 'pulseDown 2.5s ease infinite' }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={C.creamMuted} strokeWidth="1.5"><path d="M12 5v14M5 12l7 7 7-7" /></svg>
        </div>
      </div>

      {/* THE SPLIT */}
      <div style={{ padding: '0 6vw', maxWidth: 1100, margin: '0 auto' }}>
        <Reveal style={{ textAlign: 'center', marginBottom: 64 }}>
          <h2 style={{ fontFamily: F.serif, fontSize: 'clamp(28px, 4.5vw, 46px)', fontWeight: 500, lineHeight: 1.2 }}>
            The world divides into two kinds of territory.
          </h2>
        </Reveal>
        <div className="split-row" style={{ display: 'flex', gap: 32, alignItems: 'stretch', justifyContent: 'center' }}>
          <Reveal direction="left" style={{ flex: '1 1 0', minWidth: 0, maxWidth: 500 }}>
            <div style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: '48px 36px', height: '100%', display: 'flex', flexDirection: 'column' }}>
              <div style={{ fontFamily: F.sans, fontSize: 11, letterSpacing: '0.22em', textTransform: 'uppercase', color: C.warmAccent, marginBottom: 24 }}>Predictable</div>
              <p style={{ fontFamily: F.serif, fontSize: 28, color: C.cream, lineHeight: 1.3, marginBottom: 20, fontWeight: 500 }}>You\u2019ve been here before.</p>
              <p style={{ fontFamily: F.sans, fontSize: 15, color: C.creamMuted, lineHeight: 1.8, marginBottom: 28, flex: 1 }}>
                The path is visible. Do the right thing, get the right result. Cause and effect are clear \u2014 or at least discoverable if you bring in the right expertise.
              </p>
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 20 }}>
                <p style={{ fontFamily: F.sans, fontSize: 13, color: C.creamMuted, lineHeight: 2 }}>
                  <span style={{ color: C.cream }}>Following a recipe</span> you\u2019ve made a dozen times.<br />
                  <span style={{ color: C.cream }}>Your morning commute</span> \u2014 same route, same timing.<br />
                  <span style={{ color: C.cream }}>Assembling furniture</span> with the instructions in front of you.
                </p>
              </div>
            </div>
          </Reveal>
          <Reveal direction="right" delay={200} style={{ flex: '1 1 0', minWidth: 0, maxWidth: 500 }}>
            <div style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: '48px 36px', height: '100%', display: 'flex', flexDirection: 'column' }}>
              <div style={{ fontFamily: F.sans, fontSize: 11, letterSpacing: '0.22em', textTransform: 'uppercase', color: C.sage, marginBottom: 24 }}>Unpredictable</div>
              <p style={{ fontFamily: F.serif, fontSize: 28, color: C.cream, lineHeight: 1.3, marginBottom: 20, fontWeight: 500 }}>The ground shifts under your feet.</p>
              <p style={{ fontFamily: F.sans, fontSize: 15, color: C.creamMuted, lineHeight: 1.8, marginBottom: 28, flex: 1 }}>
                What worked last time might backfire now. You\u2019re navigating fog, and the map keeps changing. Cause and effect? You\u2019ll only see them in hindsight \u2014 if at all.
              </p>
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 20 }}>
                <p style={{ fontFamily: F.sans, fontSize: 13, color: C.creamMuted, lineHeight: 2 }}>
                  <span style={{ color: C.cream }}>Your teenager\u2019s mood</span> on any given Tuesday.<br />
                  <span style={{ color: C.cream }}>Whether a joke lands</span> at a dinner party.<br />
                  <span style={{ color: C.cream }}>Your first month</span> at a company where nobody\u2019s told you the unwritten rules.
                </p>
              </div>
            </div>
          </Reveal>
        </div>
      </div>

      <Divider />

      {/* INTRODUCING CYNEFIN */}
      <div style={{ padding: '0 8vw', maxWidth: 800, margin: '0 auto', textAlign: 'center' }}>
        <Reveal>
          <p style={{ fontFamily: F.sans, fontSize: 16, color: C.creamMuted, lineHeight: 1.75, marginBottom: 28 }}>
            In 1999, Dave Snowden gave these territories a sharper structure. Predictable splits into two domains. Unpredictable splits into two more. Each has its own rules for how decisions should be made.
          </p>
          <h2 style={{ fontFamily: F.serif, fontSize: 'clamp(34px, 5.5vw, 56px)', fontWeight: 500, lineHeight: 1.1, marginBottom: 10 }}>
            The Cynefin Framework
          </h2>
          <p style={{ fontFamily: F.sans, fontSize: 14, color: C.creamMuted, fontStyle: 'italic', marginBottom: 56 }}>
            (kuh-NEV-in \u2014 Welsh for \u201Chabitat\u201D or \u201Cplace of belonging\u201D)
          </p>
        </Reveal>
        <Reveal delay={200}><CynefinDiagram domains={null} showApproach={true} /></Reveal>
        <Reveal delay={400} style={{ marginTop: 48 }}>
          <p style={{ fontFamily: F.sans, fontSize: 15, color: C.creamMuted, lineHeight: 1.75, maxWidth: 560, margin: '0 auto' }}>
            <strong style={{ color: C.sage }}>Complex</strong> and <strong style={{ color: C.alert }}>Chaotic</strong> live on the unpredictable side.{' '}
            <strong style={{ color: C.warmAccent }}>Complicated</strong> and <strong style={{ color: C.cream }}>Clear</strong> live on the predictable side. Each domain calls for a fundamentally different approach.
          </p>
        </Reveal>
      </div>

      <Divider />

      {/* HOLIDAY DINNER */}
      <div style={{ padding: '0 6vw', maxWidth: 820, margin: '0 auto' }}>
        <Reveal style={{ textAlign: 'center', marginBottom: 48 }}>
          <p style={{ fontFamily: F.sans, fontSize: 11, letterSpacing: '0.22em', textTransform: 'uppercase', color: C.sage, marginBottom: 16 }}>Let\u2019s make this real</p>
          <h2 style={{ fontFamily: F.serif, fontSize: 'clamp(28px, 4.5vw, 42px)', fontWeight: 500, lineHeight: 1.2 }}>You\u2019re hosting a holiday dinner.</h2>
        </Reveal>
        <Reveal delay={150}><CynefinDiagram domains={holidayDomains} /></Reveal>
      </div>

      <Divider />

      {/* BUSINESS */}
      <div style={{ padding: '0 6vw', maxWidth: 820, margin: '0 auto' }}>
        <Reveal style={{ textAlign: 'center', marginBottom: 48 }}>
          <p style={{ fontFamily: F.sans, fontSize: 11, letterSpacing: '0.22em', textTransform: 'uppercase', color: C.sage, marginBottom: 16 }}>Same lens, bigger stakes</p>
          <h2 style={{ fontFamily: F.serif, fontSize: 'clamp(28px, 4.5vw, 42px)', fontWeight: 500, lineHeight: 1.2 }}>Now look at your organization.</h2>
        </Reveal>
        <Reveal delay={150}><CynefinDiagram domains={businessDomains} /></Reveal>
      </div>

      <Divider />

      {/* HOW TO DECIDE */}
      <div style={{ padding: '0 6vw', maxWidth: 1100, margin: '0 auto' }}>
        <Reveal style={{ textAlign: 'center', marginBottom: 56 }}>
          <p style={{ fontFamily: F.sans, fontSize: 11, letterSpacing: '0.22em', textTransform: 'uppercase', color: C.sage, marginBottom: 16 }}>So What Do You Do?</p>
          <h2 style={{ fontFamily: F.serif, fontSize: 'clamp(28px, 4.5vw, 42px)', fontWeight: 500, lineHeight: 1.2, maxWidth: 600, margin: '0 auto' }}>Different territory demands different moves.</h2>
        </Reveal>
        <div className="decision-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20 }}>
          <Reveal delay={0} style={{ height: '100%' }}><DecisionCard color={C.cream} title="Clear" approach="Sense \u2192 Categorize \u2192 Respond" detail="See the situation. Match it to the known category. Apply best practice. Don\u2019t overthink it \u2014 that\u2019s its own kind of failure here." /></Reveal>
          <Reveal delay={120} style={{ height: '100%' }}><DecisionCard color={C.warmAccent} title="Complicated" approach="Sense \u2192 Analyze \u2192 Respond" detail="Gather data. Bring in expertise. Weigh the options. There is a right answer \u2014 you just have to find it." /></Reveal>
          <Reveal delay={240} style={{ height: '100%' }}><DecisionCard color={C.sage} title="Complex" approach="Probe \u2192 Sense \u2192 Respond" detail="Run small, safe-to-fail experiments. Watch what happens. Learn. Adjust. You can\u2019t analyze your way through \u2014 you have to feel your way." /></Reveal>
          <Reveal delay={360} style={{ height: '100%' }}><DecisionCard color={C.alert} title="Chaotic" approach="Act \u2192 Sense \u2192 Respond" detail="Move first. Create stability. Then \u2014 and only then \u2014 step back and figure out where you are." /></Reveal>
        </div>
      </div>

      <Divider />

      {/* THE REAL INSIGHT */}
      <div style={{ padding: '0 8vw', maxWidth: 760, margin: '0 auto' }}>
        <Reveal style={{ textAlign: 'center', marginBottom: 40 }}>
          <h2 style={{ fontFamily: F.serif, fontSize: 'clamp(28px, 4.5vw, 46px)', fontWeight: 500, lineHeight: 1.2, marginBottom: 28 }}>Here\u2019s what most people get wrong.</h2>
          <p style={{ fontFamily: F.sans, fontSize: 16, color: C.creamMuted, lineHeight: 1.75 }}>
            They try to drop their entire challenge into one domain. \u201CThis is a complex problem,\u201D they say \u2014 and then apply the same approach to every piece of it.
          </p>
        </Reveal>
        <Reveal style={{ textAlign: 'center', marginBottom: 44 }}>
          <p style={{ fontFamily: F.serif, fontSize: 'clamp(22px, 3.5vw, 34px)', color: C.sage, lineHeight: 1.4, fontWeight: 500, fontStyle: 'italic' }}>
            Real challenges \u2014 the ones that keep you up at night \u2014 have pieces in every domain.
          </p>
        </Reveal>
        <Reveal style={{ textAlign: 'center' }}>
          <p style={{ fontFamily: F.sans, fontSize: 16, color: C.creamMuted, lineHeight: 1.75, maxWidth: 600, margin: '0 auto' }}>
            The skill isn\u2019t picking the right box. It\u2019s <strong style={{ color: C.cream }}>decomposing your challenge</strong> \u2014 understanding which parts need which approach. That\u2019s where better decisions start.
          </p>
        </Reveal>
      </div>

      <Divider />

      {/* CTA */}
      <div style={{ padding: '0 8vw 140px', maxWidth: 700, margin: '0 auto', textAlign: 'center' }}>
        <Reveal>
          <p style={{ fontFamily: F.sans, fontSize: 11, letterSpacing: '0.22em', textTransform: 'uppercase', color: C.sage, marginBottom: 20 }}>Ready?</p>
          <h2 style={{ fontFamily: F.serif, fontSize: 'clamp(30px, 5vw, 44px)', fontWeight: 500, lineHeight: 1.2, marginBottom: 16 }}>Map your challenge.</h2>
          <p style={{ fontFamily: F.sans, fontSize: 15, color: C.creamMuted, lineHeight: 1.75, maxWidth: 500, margin: '0 auto 40px' }}>
            Take what you just learned and apply it. Break your real-world challenge into its component domains \u2014 and discover which tools each part needs.
          </p>
          <button
            style={{ fontFamily: F.sans, fontSize: 14, fontWeight: 500, letterSpacing: '0.08em', padding: '16px 44px', background: C.sage, color: C.bgDeep, border: 'none', borderRadius: 8, cursor: 'pointer', transition: 'all 0.3s ease' }}
            onMouseEnter={e => { e.target.style.background = C.cream; e.target.style.transform = 'translateY(-2px)'; e.target.style.boxShadow = '0 8px 32px rgba(197,212,155,0.2)'; }}
            onMouseLeave={e => { e.target.style.background = C.sage; e.target.style.transform = 'translateY(0)'; e.target.style.boxShadow = 'none'; }}
          >Coming soon: Challenge Mapper \u2192</button>
        </Reveal>
      </div>
    </div>
  );
}
