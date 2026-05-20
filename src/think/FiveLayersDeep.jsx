import React, { useEffect, useRef } from 'react';
import { useAppNavigate } from '../lib/useAppNavigate.js';
import SEO from '../components/SEO.jsx';

// ============================================================================
// FIVE LAYERS DEEP — light/cream long-read essay
// ============================================================================
// This page is intentionally themed independently of the rest of the site
// (which uses the dark sage palette). It mirrors the standalone HTML version
// so that long-form essays read like a piece of writing rather than another
// product page. The dark global Header and Footer wrap this section as a
// frame; the article itself is a cream "card" sitting inside that frame.
//
// All styling is local to this file (scoped via .fld-* class names) so it
// won't bleed into the rest of the site. Colors and fonts intentionally
// don't import from theme.js because the design language is different here.
// ============================================================================

const FLD_CSS = `
  .fld-root {
    --fld-bg: #FAF8F5;
    --fld-text: #1a1a1a;
    --fld-text2: #4a4a4a;
    --fld-text3: #888;
    --fld-border: #e8e3db;
    --fld-seek: #D4A854;
    --fld-seek-bg: rgba(212,168,84,0.06);
    --fld-protect: #A85454;
    --fld-protect-bg: rgba(168,84,84,0.06);
    --fld-pain: #8B5E5E;
    --fld-pain-bg: rgba(139,94,94,0.05);
    --fld-present: #8B7355;
    --fld-past: #5B7B6F;
    --fld-others: #8B5E5E;
    --fld-future: #5B6B8B;
    --fld-enduring: #6B5B8B;
    --fld-fdisplay: 'Playfair Display', Georgia, serif;
    --fld-fbody: 'Source Serif 4', 'Source Serif Pro', Georgia, serif;
    --fld-fmono: 'IBM Plex Mono', monospace;
    background: var(--fld-bg);
    color: var(--fld-text);
    font-family: var(--fld-fbody);
    line-height: 1.7;
    overflow-x: hidden;
  }
  .fld-root *, .fld-root *::before, .fld-root *::after { box-sizing: border-box; }

  .fld-reveal { opacity: 0; transform: translateY(28px); transition: opacity 0.7s ease, transform 0.7s ease; }
  .fld-reveal.fld-visible { opacity: 1; transform: translateY(0); }
  .fld-d1 { transition-delay: 0.15s; }
  .fld-d2 { transition-delay: 0.30s; }
  .fld-d3 { transition-delay: 0.45s; }
  .fld-d4 { transition-delay: 0.60s; }

  .fld-section { min-height: 75vh; display: flex; align-items: center; justify-content: center; padding: 80px 24px; }
  .fld-inner { max-width: 680px; width: 100%; }
  .fld-wide { max-width: 820px; width: 100%; }
  .fld-hero { min-height: 100vh; text-align: center; }
  .fld-hero h1 { font-family: var(--fld-fdisplay); font-size: clamp(36px, 7vw, 64px); font-weight: 800; letter-spacing: -0.03em; line-height: 1.05; margin: 0 0 12px; }
  .fld-hero-sub { font-size: clamp(17px, 2.8vw, 22px); color: var(--fld-text2); font-style: italic; margin: 0 0 32px; }
  .fld-hero-body { font-size: clamp(14px, 2vw, 16px); color: var(--fld-text2); max-width: 560px; margin: 0 auto 12px; text-align: left; line-height: 1.75; }
  .fld-scroll-hint { font-family: var(--fld-fmono); font-size: 11px; letter-spacing: 0.08em; text-transform: uppercase; color: #bbb; animation: fld-pulse 2s ease-in-out infinite; margin-top: 36px; }
  @keyframes fld-pulse { 0%,100% { opacity:.4; transform:translateY(0); } 50% { opacity:1; transform:translateY(5px); } }

  .fld-creature-intro { text-align: center; margin-bottom: 32px; }
  .fld-creature-emoji { font-size: 56px; line-height: 1; margin-bottom: 10px; display: block; }
  .fld-creature-label { font-family: var(--fld-fmono); font-size: 11px; font-weight: 600; letter-spacing: 0.06em; text-transform: uppercase; color: var(--fld-text3); }
  .fld-layer-header { margin-bottom: 20px; }
  .fld-layer-name { font-family: var(--fld-fdisplay); font-size: clamp(22px, 4vw, 32px); font-weight: 700; line-height: 1.15; }
  .fld-layer-sub { font-style: italic; color: var(--fld-text3); font-size: 16px; }
  .fld-text { font-size: clamp(14px, 2vw, 16px); color: var(--fld-text2); line-height: 1.75; margin: 0 0 16px; }
  .fld-text strong { color: var(--fld-text); }

  .fld-info-box { padding: 14px 18px; background: #f0ede8; border-radius: 6px; margin-bottom: 20px; }
  .fld-info-label { font-family: var(--fld-fmono); font-size: 10px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; color: var(--fld-text3); margin-bottom: 4px; }
  .fld-info-value { font-size: 14px; color: var(--fld-text); line-height: 1.5; }

  .fld-drive-cards { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-top: 8px; }
  .fld-drive-card { padding: 20px; border-radius: 8px; border-left: 3px solid; }
  .fld-drive-card.fld-seek { background: var(--fld-seek-bg); border-color: var(--fld-seek); }
  .fld-drive-card.fld-protect { background: var(--fld-protect-bg); border-color: var(--fld-protect); }
  .fld-drive-label { font-family: var(--fld-fmono); font-size: 10px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; margin-bottom: 6px; }
  .fld-drive-card.fld-seek .fld-drive-label { color: var(--fld-seek); }
  .fld-drive-card.fld-protect .fld-drive-label { color: var(--fld-protect); }
  .fld-drive-value { font-family: var(--fld-fdisplay); font-size: 18px; font-weight: 700; line-height: 1.25; margin-bottom: 4px; }
  .fld-drive-desc { font-size: 13px; color: var(--fld-text3); line-height: 1.45; }

  .fld-pain-callout { margin-top: 16px; padding: 14px 18px; border-left: 3px solid var(--fld-pain); background: var(--fld-pain-bg); border-radius: 4px; }
  .fld-pain-label { font-family: var(--fld-fmono); font-size: 10px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; color: var(--fld-pain); margin-bottom: 4px; }
  .fld-pain-value { font-family: var(--fld-fdisplay); font-size: 15px; font-weight: 600; }
  .fld-pain-note { font-size: 13px; color: var(--fld-text3); font-style: italic; }

  .fld-arch-badge { display: inline-flex; align-items: center; gap: 6px; padding: 6px 14px; border-radius: 20px; font-family: var(--fld-fmono); font-size: 11px; font-weight: 700; letter-spacing: 0.05em; text-transform: uppercase; margin-bottom: 12px; }
  .fld-divider { height: 1px; max-width: 120px; margin: 0 auto; background: var(--fld-border); }

  .fld-arch-cards { display: flex; gap: 12px; flex-wrap: wrap; justify-content: center; margin: 28px 0; }
  .fld-arch-card { flex: 1 1 140px; max-width: 170px; padding: 16px 14px; border-radius: 12px; text-align: center; border: 1.5px solid; }
  .fld-ac-icon { font-size: 22px; line-height: 1; margin-bottom: 6px; display: block; }
  .fld-ac-name { font-family: var(--fld-fmono); font-size: 10px; font-weight: 700; letter-spacing: 0.05em; text-transform: uppercase; margin-bottom: 6px; }
  .fld-ac-what { font-size: 12px; color: var(--fld-text2); line-height: 1.45; margin-bottom: 6px; }
  .fld-ac-feels { font-size: 11px; color: var(--fld-text3); line-height: 1.4; font-style: italic; }

  .fld-pressure-stack { display: flex; flex-direction: column; gap: 4px; margin-top: 20px; }
  .fld-pressure-row { display: flex; align-items: center; gap: 12px; padding: 12px 18px; border-radius: 6px; border-left: 3px solid; }
  .fld-pressure-row.fld-offline { opacity: 0.25; filter: grayscale(0.5); border-color: #ccc; }
  .fld-pressure-row.fld-online { font-weight: 700; }
  .fld-pr-name { font-family: var(--fld-fdisplay); font-size: 15px; font-weight: inherit; flex: 1; }
  .fld-pr-icon { font-size: 14px; }
  .fld-pr-status { font-family: var(--fld-fmono); font-size: 8px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: var(--fld-protect); }
  .fld-pr-online-note { font-family: var(--fld-fmono); font-size: 9px; font-weight: 600; letter-spacing: 0.04em; color: var(--fld-text3); }

  .fld-back-link { display: inline-block; color: var(--fld-text3); text-decoration: none; font-family: var(--fld-fmono); font-size: 11px; letter-spacing: 0.18em; text-transform: uppercase; margin-bottom: 32px; cursor: pointer; }
  .fld-back-link:hover { color: var(--fld-text); }

  .fld-cta-card { background: linear-gradient(135deg, #FAF8F5 0%, #F0EBDB 100%); border: 1.5px solid var(--fld-border); border-radius: 12px; padding: 48px 32px; text-align: center; max-width: 620px; margin: 0 auto; box-shadow: 0 4px 24px rgba(31,57,55,0.06); }
  .fld-cta-eyebrow { font-family: var(--fld-fmono); font-size: 11px; font-weight: 700; letter-spacing: 0.18em; text-transform: uppercase; color: var(--fld-pain); margin-bottom: 16px; }
  .fld-cta-title { font-family: var(--fld-fdisplay); font-size: clamp(22px, 3.6vw, 30px); font-weight: 700; line-height: 1.2; margin: 0 0 14px; color: var(--fld-text); }
  .fld-cta-body { font-size: 15px; color: var(--fld-text2); line-height: 1.7; max-width: 480px; margin: 0 auto 28px; }
  .fld-cta-btn { display: inline-block; background: #1F3937; color: #F0EBDB; text-decoration: none; font-family: var(--fld-fmono); font-size: 12px; font-weight: 600; letter-spacing: 0.18em; text-transform: uppercase; padding: 16px 36px; border-radius: 4px; border: none; cursor: pointer; transition: background 0.25s ease, transform 0.15s ease; }
  .fld-cta-btn:hover { background: #2A4744; transform: translateY(-1px); }
  .fld-cta-meta { font-size: 12px; color: var(--fld-text3); margin-top: 18px; font-style: italic; }

  .fld-summary-table { width: 100%; border-collapse: collapse; margin-top: 20px; min-width: 820px; }
  .fld-summary-table th { font-family: var(--fld-fmono); font-size: 10px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; padding: 10px 14px 8px 14px; text-align: left; vertical-align: bottom; }
  .fld-summary-table td { padding: 16px 14px; vertical-align: top; border-bottom: 1px solid var(--fld-border); font-size: 13px; }
  .fld-summary-table .fld-layer-td { border-left: 3px solid; }
  .fld-summary-table .fld-lt-top { display: flex; align-items: center; gap: 8px; margin-bottom: 3px; }
  .fld-summary-table .fld-lt-name { font-family: var(--fld-fdisplay); font-weight: 700; font-size: 14px; }
  .fld-summary-table .fld-lt-sub { font-size: 11px; color: var(--fld-text3); font-style: italic; }
  .fld-summary-table .fld-lt-info { font-size: 12px; color: var(--fld-text2); margin-top: 2px; }
  .fld-summary-table .fld-seek-td { background: var(--fld-seek-bg); font-family: var(--fld-fdisplay); font-weight: 600; font-size: 14px; }
  .fld-summary-table .fld-protect-td { background: var(--fld-protect-bg); font-family: var(--fld-fdisplay); font-weight: 600; font-size: 14px; }
  .fld-summary-table .fld-pain-td { background: var(--fld-pain-bg); font-family: var(--fld-fdisplay); font-weight: 600; font-size: 14px; }
  .fld-summary-table .fld-pn { font-size: 12px; color: var(--fld-text3); font-style: italic; font-family: var(--fld-fbody); font-weight: 400; }

  .fld-table-wrap { overflow-x: auto; -webkit-overflow-scrolling: touch; }
  .fld-h2 { font-family: var(--fld-fdisplay); font-size: clamp(20px, 3.5vw, 28px); font-weight: 700; margin: 0 0 6px; color: var(--fld-text); }
  .fld-h3 { font-family: var(--fld-fdisplay); font-size: 20px; font-weight: 700; margin: 36px 0 16px; color: var(--fld-text); }

  .fld-closing { min-height: 50vh; text-align: center; }
  .fld-closing-text { font-family: var(--fld-fdisplay); font-size: clamp(18px, 3vw, 24px); font-weight: 600; color: var(--fld-text2); max-width: 480px; margin: 0 auto; line-height: 1.6; }

  .fld-footer { text-align: center; padding: 60px 24px 40px; font-size: 12px; color: #bbb; font-style: italic; }

  /* Fonts */
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;0,800;1,400&family=Source+Serif+4:ital,wght@0,300;0,400;0,600;0,700;1,300;1,400&family=IBM+Plex+Mono:wght@400;500;600;700&display=swap');

  @media (max-width: 600px) {
    .fld-drive-cards { grid-template-columns: 1fr; }
    .fld-section { padding: 60px 18px; }
    .fld-arch-cards { flex-direction: column; align-items: center; }
    .fld-arch-card { max-width: 280px; }
  }
`;

// ============================================================================
// COMPONENT
// ============================================================================
export default function FiveLayersDeepPage() {
  const navigate = useAppNavigate();
  const rootRef = useRef(null);

  // Scroll-reveal: fade items in as they enter the viewport.
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const els = root.querySelectorAll('.fld-reveal');
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) e.target.classList.add('fld-visible'); });
    }, { threshold: 0.12, rootMargin: '0px 0px -30px 0px' });
    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={rootRef} className="fld-root">
      <SEO
        title="Five Layers Deep: The Evolutionary Roots of Leadership | InciteU"
        description="An essay on how humans evolved from single-celled organisms — and how each layer of complexity unlocked new ways to connect, protect, and lead. By Jennifer May."
        path="/think/five-layers-deep"
      />
      <style>{FLD_CSS}</style>

      {/* HERO */}
      <section className="fld-section fld-hero">
        <div className="fld-inner" style={{ textAlign: 'center' }}>
          <a className="fld-back-link fld-reveal" onClick={(e) => { e.preventDefault(); navigate('think'); }} href="#">
            ← All pieces
          </a>
          <h1 className="fld-reveal">Five Layers Deep</h1>
          <p className="fld-hero-sub fld-reveal fld-d1">The evolutionary roots of how you think, connect, and lead</p>
          <p className="fld-hero-body fld-reveal fld-d2">
            This model shows how humans evolved from single-celled organisms to the creatures we are today.
            It gives a biologically based view of how much complexity we can hold, and how as we developed,
            each level of new capacity unlocked more advanced abilities for us to connect and protect
            ourselves, our species, and — when we are at our best — our future.
          </p>
          <p className="fld-hero-body fld-reveal fld-d2">
            When we are at our best, we can access all of these levels, and the complexity they unlock.
            When under threat, we often lose our ability to hold all of this complexity, and suffer for it.
          </p>
          <div className="fld-scroll-hint fld-reveal fld-d3">↓ scroll to begin</div>
        </div>
      </section>

      {/* AMOEBA: THE PRESENT */}
      <section className="fld-section">
        <div className="fld-inner">
          <div className="fld-creature-intro fld-reveal">
            <span className="fld-creature-emoji">🦠</span>
            <span className="fld-creature-label">3.5 billion years ago</span>
          </div>
          <div className="fld-layer-header fld-reveal fld-d1">
            <span className="fld-arch-badge" style={{ background: 'rgba(139,115,85,0.1)', color: 'var(--fld-present)' }}>
              <span>⦿</span> Egoist
            </span>
            <div className="fld-layer-name" style={{ color: 'var(--fld-present)' }}>Amoeba: The Present</div>
            <div className="fld-layer-sub">what's here now</div>
          </div>
          <p className="fld-text fld-reveal fld-d2">
            It begins with <strong>sensation</strong>. The first living things were single-celled
            organisms — like amoebas — with just three core abilities: they could <strong>sense</strong>,
            <strong> seek</strong>, and <strong>avoid</strong>. These three abilities evolved as
            organisms evolved.
          </p>
          <p className="fld-text fld-reveal fld-d2">
            Let's start first with what an amoeba can sense. It senses only basic chemicals like
            nutrients and toxins. It can move towards nutrients and away from toxins. That's it.
            It has no memory, no planning, no awareness of others. Just raw sensation and two drives
            that will persist through every layer of evolution, all the way up to us.
          </p>
          <p className="fld-text fld-reveal fld-d2">
            Slightly more complex — but still very simple organisms — like worms, take these raw
            sensations and process them as a fundamental feeling: <strong>pain</strong>.
          </p>
          <div className="fld-info-box fld-reveal fld-d3">
            <div className="fld-info-label">Information organism can sense</div>
            <div className="fld-info-value">Raw sensation: chemical gradients, temperature, pressure</div>
          </div>
          <div className="fld-drive-cards">
            <div className="fld-drive-card fld-seek fld-reveal fld-d3">
              <div className="fld-drive-label">Pursues</div>
              <div className="fld-drive-value">Pleasure (food, light, warmth)</div>
              <div className="fld-drive-desc">Move toward nutrient, warmth</div>
            </div>
            <div className="fld-drive-card fld-protect fld-reveal fld-d3">
              <div className="fld-drive-label">Protects</div>
              <div className="fld-drive-value">Withdrawals / Escapes</div>
              <div className="fld-drive-desc">Move away from damage</div>
            </div>
          </div>
          <div className="fld-pain-callout fld-reveal fld-d4">
            <div className="fld-pain-label">Pain at this layer</div>
            <div className="fld-pain-value">Physical pain</div>
          </div>
        </div>
      </section>

      <div className="fld-divider"></div>

      {/* FISH: THE PAST */}
      <section className="fld-section">
        <div className="fld-inner">
          <div className="fld-creature-intro fld-reveal">
            <span className="fld-creature-emoji">🐟</span>
            <span className="fld-creature-label">500 million years ago — memory arrives</span>
          </div>
          <div className="fld-layer-header fld-reveal fld-d1">
            <span className="fld-arch-badge" style={{ background: 'rgba(91,123,111,0.1)', color: 'var(--fld-past)' }}>
              <span>⊠</span> Veteran
            </span>
            <div className="fld-layer-name" style={{ color: 'var(--fld-past)' }}>Fish: The Past</div>
            <div className="fld-layer-sub">what happened before</div>
          </div>
          <p className="fld-text fld-reveal fld-d2">
            The next major development was <strong>memory</strong>. We see this come online in fish,
            who — unlike worms — have developed a hippocampus. Now the organism doesn't just react to
            what is here in the present; it remembers what happened in the past. It remembers when a
            predator struck, where the best food was. And with memory comes a new form of pain:
            <strong>fear</strong> — pain remembered, pain anticipated.
          </p>
          <div className="fld-info-box fld-reveal fld-d2">
            <div className="fld-info-label">Information organism can sense</div>
            <div className="fld-info-value">Patterns, recognition, memory — "this happened before"</div>
          </div>
          <div className="fld-drive-cards">
            <div className="fld-drive-card fld-seek fld-reveal fld-d3">
              <div className="fld-drive-label">Pursues</div>
              <div className="fld-drive-value">Anticipation</div>
              <div className="fld-drive-desc">Pursue known rewards, return to safe places</div>
            </div>
            <div className="fld-drive-card fld-protect fld-reveal fld-d3">
              <div className="fld-drive-label">Protects</div>
              <div className="fld-drive-value">Fight / flight / freeze</div>
              <div className="fld-drive-desc">React to remembered threats</div>
            </div>
          </div>
          <div className="fld-pain-callout fld-reveal fld-d4">
            <div className="fld-pain-label">Pain at this layer</div>
            <div className="fld-pain-value">Fear</div>
            <div className="fld-pain-note">pain remembered and anticipated</div>
          </div>
        </div>
      </section>

      <div className="fld-divider"></div>

      {/* MAMMALS: OTHERS */}
      <section className="fld-section">
        <div className="fld-inner">
          <div className="fld-creature-intro fld-reveal">
            <span className="fld-creature-emoji">🐭</span>
            <span className="fld-creature-label">200 million years ago — empathy arrives</span>
          </div>
          <div className="fld-layer-header fld-reveal fld-d1">
            <span className="fld-arch-badge" style={{ background: 'rgba(139,94,94,0.1)', color: 'var(--fld-others)' }}>
              <span>♡</span> Lover
            </span>
            <div className="fld-layer-name" style={{ color: 'var(--fld-others)' }}>Mammals: Others</div>
            <div className="fld-layer-sub">what others feel, think, do</div>
          </div>
          <p className="fld-text fld-reveal fld-d2">
            The next revolution came in the form of <strong>empathy</strong>, and our ability to
            sense other's nervous systems. You begin to see this clearly in mammalian physiology:
            Oxytocin. Mirror neurons. Ventral vagal circuits. For the first time, an organism's
            nervous system is coupled to other nervous systems. A rat will work to free a trapped
            companion even when food is available nearby. That's not redirected seeking — that's
            a genuinely new capacity. And with it comes a new pain: <strong>fear for others</strong>.
            You can now suffer for someone else's suffering.
          </p>
          <div className="fld-info-box fld-reveal fld-d2">
            <div className="fld-info-label">Information organism can sense</div>
            <div className="fld-info-value">Emotional states of others, social signals, trust, group dynamics</div>
          </div>
          <div className="fld-drive-cards">
            <div className="fld-drive-card fld-seek fld-reveal fld-d3">
              <div className="fld-drive-label">Pursues</div>
              <div className="fld-drive-value">Love</div>
              <div className="fld-drive-desc">Bond, nurture, cooperate, attune</div>
            </div>
            <div className="fld-drive-card fld-protect fld-reveal fld-d3">
              <div className="fld-drive-label">Protects</div>
              <div className="fld-drive-value">Defend group over self</div>
              <div className="fld-drive-desc">Protect offspring, pack, tribe</div>
            </div>
          </div>
          <div className="fld-pain-callout fld-reveal fld-d4">
            <div className="fld-pain-label">Pain at this layer</div>
            <div className="fld-pain-value">Fear for others</div>
            <div className="fld-pain-note">empathic pain — feeling another's suffering</div>
          </div>
        </div>
      </section>

      <div className="fld-divider"></div>

      {/* PRIMATES: THE FUTURE */}
      <section className="fld-section">
        <div className="fld-inner">
          <div className="fld-creature-intro fld-reveal">
            <span className="fld-creature-emoji">🦍</span>
            <span className="fld-creature-label">25 million years ago — imagination arrives</span>
          </div>
          <div className="fld-layer-header fld-reveal fld-d1">
            <span className="fld-arch-badge" style={{ background: 'rgba(91,107,139,0.1)', color: 'var(--fld-future)' }}>
              <span>◈</span> Strategist
            </span>
            <div className="fld-layer-name" style={{ color: 'var(--fld-future)' }}>Primates: The Future</div>
            <div className="fld-layer-sub">what could be for me</div>
          </div>
          <p className="fld-text fld-reveal fld-d2">
            When <strong>imagination</strong> arrives, we see another major jump. Along with an
            expanded prefrontal cortex comes the ability to simulate a future that doesn't exist yet.
            Causal chains. If-then reasoning. Planning. The world is no longer just what is, what was,
            and what others feel — it's also what <strong>could be</strong>. And with imagination
            comes a new pain: <strong>anxiety</strong> — suffering for things that haven't happened
            and may never happen.
          </p>
          <div className="fld-info-box fld-reveal fld-d2">
            <div className="fld-info-label">Information organism can sense</div>
            <div className="fld-info-value">Hypothetical futures, causal chains — "if X then Y"</div>
          </div>
          <div className="fld-drive-cards">
            <div className="fld-drive-card fld-seek fld-reveal fld-d3">
              <div className="fld-drive-label">Pursues</div>
              <div className="fld-drive-value">Hope</div>
              <div className="fld-drive-desc">Plan, envision, create, build toward imagined futures</div>
            </div>
            <div className="fld-drive-card fld-protect fld-reveal fld-d3">
              <div className="fld-drive-label">Protects</div>
              <div className="fld-drive-value">Defend the future</div>
              <div className="fld-drive-desc">Anticipate threats, set boundaries, act preemptively</div>
            </div>
          </div>
          <div className="fld-pain-callout fld-reveal fld-d4">
            <div className="fld-pain-label">Pain at this layer</div>
            <div className="fld-pain-value">Anxiety</div>
            <div className="fld-pain-note">pain about things that haven't happened yet</div>
          </div>
        </div>
      </section>

      <div className="fld-divider"></div>

      {/* HUMANS: THE ENDURING */}
      <section className="fld-section">
        <div className="fld-inner">
          <div className="fld-creature-intro fld-reveal">
            <span className="fld-creature-emoji">🧑</span>
            <span className="fld-creature-label">2 million years ago — meaning arrives</span>
          </div>
          <div className="fld-layer-header fld-reveal fld-d1">
            <span className="fld-arch-badge" style={{ background: 'rgba(107,91,139,0.1)', color: 'var(--fld-enduring)' }}>
              <span>✧</span> Visionary
            </span>
            <div className="fld-layer-name" style={{ color: 'var(--fld-enduring)' }}>Humans: The Enduring</div>
            <div className="fld-layer-sub">what outlasts me</div>
          </div>
          <p className="fld-text fld-reveal fld-d2">
            When <strong>meaning</strong> arrives, we cross into something unprecedented — the capacity
            to conceive of things that transcend your own survival. Justice. Legacy. Beauty. Purpose. A
            human can endure physical pain, override learned fear, leave their group, and pursue a plan
            they know might fail — because they've decided something <strong>matters more than they do</strong>.
            And with meaning comes the deepest pain: <strong>existential suffering</strong> — the ache of
            falling short, of mortality, of meaninglessness.
          </p>
          <div className="fld-info-box fld-reveal fld-d2">
            <div className="fld-info-label">Information organism can sense</div>
            <div className="fld-info-value">Meaning, values, identity, legacy</div>
          </div>
          <div className="fld-drive-cards">
            <div className="fld-drive-card fld-seek fld-reveal fld-d3">
              <div className="fld-drive-label">Pursues</div>
              <div className="fld-drive-value">Devotion</div>
              <div className="fld-drive-desc">Commit, sacrifice, build what will outlast you</div>
            </div>
            <div className="fld-drive-card fld-protect fld-reveal fld-d3">
              <div className="fld-drive-label">Protects</div>
              <div className="fld-drive-value">Die for / save what I believe in</div>
              <div className="fld-drive-desc">Or psychological defense: denial, rationalization</div>
            </div>
          </div>
          <div className="fld-pain-callout fld-reveal fld-d4">
            <div className="fld-pain-label">Pain at this layer</div>
            <div className="fld-pain-value">Existential pain</div>
            <div className="fld-pain-note">falling short, mortality, meaninglessness</div>
          </div>
        </div>
      </section>

      <div className="fld-divider"></div>

      {/* COMPLETE MODEL TABLE */}
      <section className="fld-section">
        <div style={{ maxWidth: 960, width: '100%' }}>
          <h2 className="fld-h2 fld-reveal">The complete model</h2>
          <p className="fld-text fld-reveal fld-d1" style={{ color: 'var(--fld-text2)', fontSize: 15, marginBottom: 16 }}>
            Five substrates of complexity. Two drives running through them all. Pursuing (seek pleasure) and Protecting (avoid pain) each produce different emotional states at each substrate — when the
            drive works, when it doesn't. The hardest case is when seeking is thwarted: the same block produces
            either a turn <em>inward</em> (inadequacy) or a turn <em>outward</em> (anger), and which way it
            goes is one of the most diagnostic things about a person.
          </p>
          <div className="fld-table-wrap">
            <table className="fld-summary-table fld-reveal fld-d2" style={{ minWidth: 1080 }}>
              <thead>
                <tr>
                  <th style={{ borderBottom: '2px solid #a89d8f' }} rowSpan={2}>Substrate</th>
                  <th style={{ borderBottom: 'none', borderTop: '2px solid var(--fld-seek)', background: 'var(--fld-seek-bg)', color: 'var(--fld-seek)', textAlign: 'center' }} colSpan={4}>Pursuing · seek pleasure</th>
                  <th style={{ borderBottom: 'none', borderTop: '2px solid var(--fld-protect)', background: 'var(--fld-protect-bg)', color: 'var(--fld-protect)', textAlign: 'center' }} colSpan={3}>Protecting · avoid pain</th>
                  <th style={{ borderBottom: '2px solid var(--fld-pain)', color: 'var(--fld-pain)' }} rowSpan={2}>Background pain</th>
                </tr>
                <tr>
                  <th style={{ borderBottom: '2px solid var(--fld-seek)', color: 'var(--fld-seek)', background: 'var(--fld-seek-bg)', fontSize: 9 }}>Drive</th>
                  <th style={{ borderBottom: '2px solid #D4A854', color: '#9B7A3D', background: 'rgba(212,168,84,0.08)', fontSize: 9 }}>Achieved</th>
                  <th style={{ borderBottom: '2px solid #B89169', color: '#8B6F4D', background: 'rgba(184,145,105,0.08)', fontSize: 9 }}>Inward · sad</th>
                  <th style={{ borderBottom: '2px solid #C77C58', color: '#A05E3D', background: 'rgba(199,124,88,0.08)', fontSize: 9 }}>Outward · mad</th>
                  <th style={{ borderBottom: '2px solid var(--fld-protect)', color: 'var(--fld-protect)', background: 'var(--fld-protect-bg)', fontSize: 9 }}>Drive</th>
                  <th style={{ borderBottom: '2px solid #6F8B5E', color: '#516B41', background: 'rgba(111,139,94,0.08)', fontSize: 9 }}>Worked</th>
                  <th style={{ borderBottom: '2px solid #A85454', color: 'var(--fld-protect)', background: 'rgba(168,84,84,0.08)', fontSize: 9 }}>Triggered</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="fld-layer-td" style={{ borderColor: 'var(--fld-present)' }}>
                    <div className="fld-lt-top"><span style={{ fontSize: 17 }}>🦠</span> <span className="fld-lt-name">Egoist</span> <span className="fld-lt-sub">the present</span></div>
                    <div className="fld-lt-info">Raw sensation: gradients, temperature, pressure</div>
                  </td>
                  <td className="fld-seek-td">Pleasure (food)</td>
                  <td style={{ background: 'rgba(212,168,84,0.06)' }}>Satisfaction</td>
                  <td style={{ background: 'rgba(184,145,105,0.06)' }}>Empty</td>
                  <td style={{ background: 'rgba(199,124,88,0.06)' }}>Tantrum</td>
                  <td className="fld-protect-td">Withdraw / escape</td>
                  <td style={{ background: 'rgba(111,139,94,0.06)' }}>Relief</td>
                  <td style={{ background: 'rgba(168,84,84,0.06)' }}>Pain itself</td>
                  <td className="fld-pain-td">Physical pain</td>
                </tr>
                <tr>
                  <td className="fld-layer-td" style={{ borderColor: 'var(--fld-past)' }}>
                    <div className="fld-lt-top"><span style={{ fontSize: 17 }}>🐟</span> <span className="fld-lt-name">Veteran</span> <span className="fld-lt-sub">the past</span></div>
                    <div className="fld-lt-info">Patterns, recognition, memory</div>
                  </td>
                  <td className="fld-seek-td">Anticipation</td>
                  <td style={{ background: 'rgba(212,168,84,0.06)' }}>Pattern completed</td>
                  <td style={{ background: 'rgba(184,145,105,0.06)' }}>Frustration</td>
                  <td style={{ background: 'rgba(199,124,88,0.06)' }}>Rage</td>
                  <td className="fld-protect-td">Fight / flight / freeze</td>
                  <td style={{ background: 'rgba(111,139,94,0.06)' }}>Vindication</td>
                  <td style={{ background: 'rgba(168,84,84,0.06)' }}>Trauma</td>
                  <td className="fld-pain-td">Fear <div className="fld-pn">pain remembered &amp; anticipated</div></td>
                </tr>
                <tr>
                  <td className="fld-layer-td" style={{ borderColor: 'var(--fld-others)' }}>
                    <div className="fld-lt-top"><span style={{ fontSize: 17 }}>🐭</span> <span className="fld-lt-name">Lover</span> <span className="fld-lt-sub">others</span></div>
                    <div className="fld-lt-info">Emotional states of others, social signals, trust</div>
                  </td>
                  <td className="fld-seek-td">Love</td>
                  <td style={{ background: 'rgba(212,168,84,0.06)' }}>Belonging, joy</td>
                  <td style={{ background: 'rgba(184,145,105,0.06)' }}>Lonely</td>
                  <td style={{ background: 'rgba(199,124,88,0.06)' }}>Betrayal</td>
                  <td className="fld-protect-td">Defend group over self</td>
                  <td style={{ background: 'rgba(111,139,94,0.06)' }}>Pride</td>
                  <td style={{ background: 'rgba(168,84,84,0.06)' }}>Grief</td>
                  <td className="fld-pain-td">Fear for others <div className="fld-pn">empathic pain</div></td>
                </tr>
                <tr>
                  <td className="fld-layer-td" style={{ borderColor: 'var(--fld-future)' }}>
                    <div className="fld-lt-top"><span style={{ fontSize: 17 }}>🦍</span> <span className="fld-lt-name">Strategist</span> <span className="fld-lt-sub">the future</span></div>
                    <div className="fld-lt-info">Hypothetical futures, causal chains</div>
                  </td>
                  <td className="fld-seek-td">Hope</td>
                  <td style={{ background: 'rgba(212,168,84,0.06)' }}>Fulfillment, achievement</td>
                  <td style={{ background: 'rgba(184,145,105,0.06)' }}>Inferiority</td>
                  <td style={{ background: 'rgba(199,124,88,0.06)' }}>Outrage</td>
                  <td className="fld-protect-td">Defend the future</td>
                  <td style={{ background: 'rgba(111,139,94,0.06)' }}>Confidence</td>
                  <td style={{ background: 'rgba(168,84,84,0.06)' }}>Despair</td>
                  <td className="fld-pain-td">Anxiety <div className="fld-pn">pain about things that haven't happened</div></td>
                </tr>
                <tr>
                  <td className="fld-layer-td" style={{ borderColor: 'var(--fld-enduring)' }}>
                    <div className="fld-lt-top"><span style={{ fontSize: 17 }}>🧑</span> <span className="fld-lt-name">Visionary</span> <span className="fld-lt-sub">the enduring</span></div>
                    <div className="fld-lt-info">Meaning, values, identity, legacy</div>
                  </td>
                  <td className="fld-seek-td">Devotion</td>
                  <td style={{ background: 'rgba(212,168,84,0.06)' }}>Meaning, purpose</td>
                  <td style={{ background: 'rgba(184,145,105,0.06)' }}>Hopeless</td>
                  <td style={{ background: 'rgba(199,124,88,0.06)' }}>Moral fury</td>
                  <td className="fld-protect-td">Die for / save what I believe in</td>
                  <td style={{ background: 'rgba(111,139,94,0.06)' }}>Honor</td>
                  <td style={{ background: 'rgba(168,84,84,0.06)' }}>Existential crisis</td>
                  <td className="fld-pain-td">Existential pain <div className="fld-pn">falling short, mortality, meaninglessness</div></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <div className="fld-divider"></div>

      {/* SIMPLIFIED MODEL: FIVE ARCHETYPES */}
      <section className="fld-section">
        <div className="fld-wide">
          <h2 className="fld-h2 fld-reveal">Two drives. Five substrate-archetypes.</h2>
          <p className="fld-text fld-reveal fld-d1" style={{ color: 'var(--fld-text2)', fontSize: 15, marginBottom: 8 }}>
            The full model above shows the layers of complexity. The best leaders know that great
            things happen when we reach the <em>simplicity on the other side of complexity</em>.
          </p>
          <p className="fld-text fld-reveal fld-d1" style={{ color: 'var(--fld-text2)', fontSize: 15, marginBottom: 8 }}>
            The simpler pattern: <strong>two drives</strong> that thread through every layer, and
            <strong> five substrate-archetypes</strong> — one per layer — that name what kind of complexity
            is being held. Drives are always running. Substrate-archetypes come online or don't,
            depending on who you are and what's happening.
          </p>

          {/* Drives (cross-cutting): 2 cards in a row */}
          <div className="fld-reveal fld-d2" style={{ marginBottom: 6 }}>
            <div style={{ fontFamily: 'var(--fld-fmono)', fontSize: 10, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--fld-text3)', textAlign: 'center', marginBottom: 12 }}>The two drives — always running</div>
          </div>
          <div className="fld-arch-cards fld-reveal fld-d2">
            <div className="fld-arch-card" style={{ borderColor: 'rgba(212,168,84,0.35)', background: 'var(--fld-seek-bg)' }}>
              <span className="fld-ac-icon" style={{ color: 'var(--fld-seek)' }}><svg viewBox="0 0 120 120" width="32" height="32" style={{ display: 'inline-block', verticalAlign: 'middle' }} role="img" aria-label="Pursuing arrow"><title>Pursuing arrow</title><line x1="18" y1="48" x2="40" y2="48" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeOpacity="0.35"/><line x1="14" y1="60" x2="44" y2="60" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeOpacity="0.5"/><line x1="18" y1="72" x2="40" y2="72" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeOpacity="0.35"/><path d="M 48 32 L 100 60 L 48 88 L 62 60 Z" fill="currentColor" fillOpacity="0.2" stroke="currentColor" strokeWidth="2.4" strokeLinejoin="round"/></svg></span>
              <div className="fld-ac-name" style={{ color: 'var(--fld-seek)' }}>Pursuing</div>
              <div className="fld-ac-what">The seeking drive. Goes <em>toward</em> — at every substrate, from food to meaning.</div>
              <div className="fld-ac-feels">Achieved: pleasure, anticipation, love, fulfillment, purpose · Thwarted: empty/tantrum, frustration/rage, lonely/betrayal, inferiority/outrage, hopeless/moral fury</div>
            </div>
            <div className="fld-arch-card" style={{ borderColor: 'rgba(168,84,84,0.35)', background: 'var(--fld-protect-bg)' }}>
              <span className="fld-ac-icon" style={{ color: 'var(--fld-protect)' }}><svg viewBox="0 0 120 120" width="32" height="32" style={{ display: 'inline-block', verticalAlign: 'middle' }} role="img" aria-label="Protecting fortress"><title>Protecting fortress</title><path d="M 22 50 L 30 50 L 30 42 L 42 42 L 42 50 L 54 50 L 54 42 L 66 42 L 66 50 L 78 50 L 78 42 L 90 42 L 90 50 L 98 50 L 98 90 L 22 90 Z" fill="currentColor" fillOpacity="0.18" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round"/><line x1="22" y1="62" x2="98" y2="62" stroke="currentColor" strokeWidth="0.6" strokeOpacity="0.4"/><line x1="22" y1="76" x2="98" y2="76" stroke="currentColor" strokeWidth="0.6" strokeOpacity="0.4"/><path d="M 54 90 L 54 74 Q 54 68 60 68 Q 66 68 66 74 L 66 90 Z" fill="currentColor"/><line x1="14" y1="90" x2="106" y2="90" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/></svg></span>
              <div className="fld-ac-name" style={{ color: 'var(--fld-protect)' }}>Protecting</div>
              <div className="fld-ac-what">The protective drive. Avoids — at every substrate, from damage to meaninglessness.</div>
              <div className="fld-ac-feels">Worked: relief, vindication, pride, confidence, honor · Triggered: pain, fear/trauma, grief, despair, existential crisis</div>
            </div>
          </div>

          {/* Substrate-archetypes: 5 cards, one per layer */}
          <div className="fld-reveal fld-d2" style={{ marginTop: 28, marginBottom: 6 }}>
            <div style={{ fontFamily: 'var(--fld-fmono)', fontSize: 10, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--fld-text3)', textAlign: 'center', marginBottom: 12 }}>The five substrate-archetypes — levels of complexity</div>
          </div>
          <div className="fld-arch-cards fld-reveal fld-d2">
            <div className="fld-arch-card" style={{ borderColor: 'rgba(139,115,85,0.35)', background: 'rgba(139,115,85,0.05)' }}>
              <span className="fld-ac-icon">⦿</span>
              <div className="fld-ac-name" style={{ color: 'var(--fld-present)' }}>Egoist</div>
              <div className="fld-ac-what">The body in the here and now. Raw sensation, immediate stakes.</div>
              <div className="fld-ac-feels">Satisfaction, relief · Empty, tantrum, pain</div>
            </div>
            <div className="fld-arch-card" style={{ borderColor: 'rgba(91,123,111,0.35)', background: 'rgba(91,123,111,0.05)' }}>
              <span className="fld-ac-icon">⊠</span>
              <div className="fld-ac-name" style={{ color: 'var(--fld-past)' }}>Veteran</div>
              <div className="fld-ac-what">What memory makes possible. Recognizes patterns, returns to safety.</div>
              <div className="fld-ac-feels">Pattern completed, vindication · Frustration, rage, trauma</div>
            </div>
            <div className="fld-arch-card" style={{ borderColor: 'rgba(139,94,94,0.35)', background: 'rgba(139,94,94,0.05)' }}>
              <span className="fld-ac-icon">♡</span>
              <div className="fld-ac-name" style={{ color: 'var(--fld-others)' }}>Lover</div>
              <div className="fld-ac-what">What others bring. Empathy, bond, belonging.</div>
              <div className="fld-ac-feels">Belonging, joy, pride · Lonely, betrayal, grief</div>
            </div>
            <div className="fld-arch-card" style={{ borderColor: 'rgba(91,107,139,0.35)', background: 'rgba(91,107,139,0.05)' }}>
              <span className="fld-ac-icon">◈</span>
              <div className="fld-ac-name" style={{ color: 'var(--fld-future)' }}>Strategist</div>
              <div className="fld-ac-what">What imagination opens. Models futures and acts on what could be.</div>
              <div className="fld-ac-feels">Fulfillment, achievement, confidence · Inferiority, outrage, despair</div>
            </div>
            <div className="fld-arch-card" style={{ borderColor: 'rgba(107,91,139,0.35)', background: 'rgba(107,91,139,0.05)' }}>
              <span className="fld-ac-icon">✧</span>
              <div className="fld-ac-name" style={{ color: 'var(--fld-enduring)' }}>Visionary</div>
              <div className="fld-ac-what">What meaning unlocks. Serves something larger than the self.</div>
              <div className="fld-ac-feels">Meaning, purpose, honor · Hopeless, moral fury, existential crisis</div>
            </div>
          </div>

          <div className="fld-reveal fld-d2" style={{ background: '#f0ede8', borderLeft: '3px solid var(--fld-text3)', padding: '20px 24px', borderRadius: 4, marginTop: 28 }}>
            <p style={{ fontFamily: 'var(--fld-fdisplay)', fontSize: 16, color: 'var(--fld-text2)', lineHeight: 1.65, fontStyle: 'italic', margin: 0 }}>
              The two drives are ancient and always active — Pursuing seeks pleasure, Protecting avoids
              pain, and they run through every substrate from amoeba to human. The five substrate-archetypes
              are levels of complexity the nervous system can hold. When we struggle, we often find we're
              over-relying on one of these drives or archetypes. Thinking about what else we can access often
              gives us a greater range of possibility.
            </p>
          </div>
        </div>
      </section>

      <div className="fld-divider"></div>

      {/* UNDER PRESSURE */}
      <section className="fld-section">
        <div className="fld-inner" style={{ maxWidth: 540 }}>
          <h2 className="fld-h2 fld-reveal">Under pressure</h2>
          <p className="fld-text fld-reveal fld-d1" style={{ marginBottom: 24 }}>
            Under pressure, the most recently evolved capacities often go quiet first.
            Meaning fades. Then strategic thinking narrows. Then empathy contracts.
            What remains are the two ancient drives — <strong>Pursuing</strong> and <strong>Protecting</strong> — running without the <strong>Lover</strong>,
            <strong> Strategist</strong>, or <strong>Visionary</strong> to guide them.
            The work of leadership under pressure is noticing which archetypes have gone offline
            and bringing them back.
          </p>
          <div className="fld-pressure-stack">
            <div className="fld-pressure-row fld-offline fld-reveal fld-d1" style={{ background: 'rgba(107,91,139,0.03)' }}>
              <span className="fld-pr-icon">✧</span>
              <span className="fld-pr-name" style={{ color: '#999' }}>Visionary</span>
              <span className="fld-pr-status">◉ offline</span>
            </div>
            <div className="fld-pressure-row fld-offline fld-reveal fld-d2" style={{ background: 'rgba(91,107,139,0.03)' }}>
              <span className="fld-pr-icon">◈</span>
              <span className="fld-pr-name" style={{ color: '#999' }}>Strategist</span>
              <span className="fld-pr-status">◉ offline</span>
            </div>
            <div className="fld-pressure-row fld-offline fld-reveal fld-d3" style={{ background: 'rgba(139,94,94,0.03)' }}>
              <span className="fld-pr-icon">♡</span>
              <span className="fld-pr-name" style={{ color: '#999' }}>Lover</span>
              <span className="fld-pr-status">◉ offline</span>
            </div>
            <div className="fld-pressure-row fld-online fld-reveal fld-d3" style={{ borderColor: 'var(--fld-protect)', background: 'var(--fld-protect-bg)' }}>
              <span className="fld-pr-icon" style={{ color: 'var(--fld-protect)' }}><svg viewBox="0 0 120 120" width="18" height="18" style={{ display: 'inline-block', verticalAlign: 'middle' }} role="img" aria-label="Protecting fortress"><title>Protecting fortress</title><path d="M 22 50 L 30 50 L 30 42 L 42 42 L 42 50 L 54 50 L 54 42 L 66 42 L 66 50 L 78 50 L 78 42 L 90 42 L 90 50 L 98 50 L 98 90 L 22 90 Z" fill="currentColor" fillOpacity="0.25" stroke="currentColor" strokeWidth="3" strokeLinejoin="round"/><path d="M 54 90 L 54 76 Q 54 70 60 70 Q 66 70 66 76 L 66 90 Z" fill="currentColor"/></svg></span>
              <span className="fld-pr-name">Protecting</span>
              <span className="fld-pr-online-note">active — raw protect</span>
            </div>
            <div className="fld-pressure-row fld-online fld-reveal fld-d4" style={{ borderColor: 'var(--fld-seek)', background: 'var(--fld-seek-bg)' }}>
              <span className="fld-pr-icon" style={{ color: 'var(--fld-seek)' }}><svg viewBox="0 0 120 120" width="18" height="18" style={{ display: 'inline-block', verticalAlign: 'middle' }} role="img" aria-label="Pursuing arrow"><title>Pursuing arrow</title><line x1="14" y1="60" x2="44" y2="60" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeOpacity="0.6"/><path d="M 48 32 L 100 60 L 48 88 L 62 60 Z" fill="currentColor" fillOpacity="0.28" stroke="currentColor" strokeWidth="3" strokeLinejoin="round"/></svg></span>
              <span className="fld-pr-name">Pursuing</span>
              <span className="fld-pr-online-note">active — raw seek</span>
            </div>
          </div>
        </div>
      </section>

      <div className="fld-divider"></div>

      {/* CLOSING */}
      <section className="fld-section fld-closing">
        <div className="fld-inner" style={{ textAlign: 'center' }}>
          <p className="fld-closing-text fld-reveal">
            Two ancient drives.<br />
            Five substrates they run through.<br /><br />
            The work isn't to do all of these things at once. It's to know which patterns we tend to
            fall into and build our capacity to do something different, when that would help us.
          </p>
        </div>
      </section>

      {/* CTA: TAKE THE ASSESSMENT */}
      <section className="fld-section" style={{ minHeight: 'auto', padding: '40px 24px 80px' }}>
        <div className="fld-cta-card fld-reveal">
          <div className="fld-cta-eyebrow">Find your stance</div>
          <h2 className="fld-cta-title">Which of the five archetypes do you lead with?</h2>
          <p className="fld-cta-body">
            Most of us lean on two or three of the five — and lose access to the others under pressure.
            A short, scenario-based self-assessment maps where you start, where you go when stressed,
            and which capacities are quietest in you right now.
          </p>
          <button className="fld-cta-btn" onClick={() => navigate('leadership-stance')}>
            Take the Leadership Stance Assessment →
          </button>
          <div className="fld-cta-meta">15 scenarios · about 7 minutes · no signup</div>
        </div>
      </section>

      <div className="fld-footer">© Jennifer May / Incite Leadership</div>
    </div>
  );
}
