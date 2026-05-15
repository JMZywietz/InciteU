import React, { useState } from 'react';
import { C, F } from '../theme.js';
import { btn, btnHoverIn, btnHoverOut, heading } from '../styles.js';
import SEO from '../components/SEO.jsx';

// Belief card with hover lift
function BeliefCard({ num, children }) {
  const [hover, setHover] = useState(false);
  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        background: C.bgCard,
        border: `1px solid ${hover ? C.sageMuted : C.line}`,
        borderRadius: 4,
        padding: '24px 26px',
        display: 'flex',
        gap: 18,
        alignItems: 'flex-start',
        transform: hover ? 'translateY(-2px)' : 'translateY(0)',
        transition: 'border-color 0.3s, transform 0.3s',
      }}>
      <span style={{ fontFamily: F.sans, fontSize: 11, fontWeight: 600, letterSpacing: '0.2em', color: C.sage, flexShrink: 0, paddingTop: 4, minWidth: 24 }}>{num}</span>
      <p style={{ fontFamily: F.sans, fontSize: 15, lineHeight: 1.6, color: C.cream, margin: 0, fontWeight: 300 }}>{children}</p>
    </div>
  );
}

export default function BioPage() {
  const sectionStyle = { padding: '40px 6vw', maxWidth: 760, margin: '0 auto' };

  const dividerSvg = (
    <div style={{ width: '100%', overflow: 'hidden', lineHeight: 0, padding: '30px 0', maxWidth: 800, margin: '0 auto' }}>
      <svg viewBox="0 0 800 50" preserveAspectRatio="none" style={{ width: '100%', height: 50, display: 'block' }}>
        <path d="M 0,25 Q 200,5 400,25 T 800,25" fill="none" stroke={C.sage} strokeWidth="1" opacity="0.4" />
        <circle cx="400" cy="25" r="2.5" fill={C.sage} opacity="0.6" />
      </svg>
    </div>
  );

  const h2 = { fontFamily: F.serif, fontWeight: 400, fontSize: 'clamp(30px, 3.4vw, 40px)', lineHeight: 1.15, letterSpacing: '-0.01em', color: C.cream, margin: '0 0 28px' };
  const h3 = { fontFamily: F.serif, fontSize: 30, fontWeight: 400, color: C.cream, marginBottom: 24, marginTop: 0 };
  const subh = { fontFamily: F.sans, fontSize: 11, fontWeight: 500, letterSpacing: '0.22em', textTransform: 'uppercase', color: C.sage, margin: '40px 0 16px', paddingTop: 28, borderTop: `1px solid ${C.line}` };
  const p = { fontSize: 16, lineHeight: 1.75, color: C.cream, marginBottom: 18, fontWeight: 300, fontFamily: F.sans };
  const inlineU = { color: C.sage, fontStyle: 'italic', fontWeight: 400 };
  const emSage = { color: C.sage, fontStyle: 'italic' };
  const sageText = { color: C.sage };

  const chipStyle = { display: 'inline-block', padding: '6px 14px', border: `1px solid ${C.line}`, borderRadius: 100, fontFamily: F.sans, fontSize: 12, letterSpacing: '0.04em', color: C.cream, fontWeight: 400 };
  const chipMuted = { ...chipStyle, color: C.creamMuted, borderStyle: 'dashed' };

  const certStyle = { display: 'inline-flex', alignItems: 'center', padding: '7px 14px 7px 8px', border: `1px solid ${C.line}`, borderRadius: 4, fontFamily: F.sans, fontSize: 12, lineHeight: 1.3, color: C.cream, fontWeight: 300, gap: 8 };
  const yearStyle = { color: C.sage, fontWeight: 600, fontSize: 11, letterSpacing: '0.05em', background: 'rgba(197,212,155,0.10)', padding: '3px 7px', borderRadius: 3 };

  const clients = ['Google', 'PayPal', 'Careem · Uber', 'PepsiCo', 'Novartis', 'Honeywell', 'World Bank', 'Kuwait Finance House', 'McKinsey', 'PWC', 'Achmea', 'Diageo', 'Cleveland Clinic Abu Dhabi'];

  const certs = [
    ['2024', 'Trauma Informed Coaching'],
    ['2023', 'Fundamentals of Energetic Mastery'],
    ['2022', 'Heal Collective Trauma & Embody Anti-Racism'],
    ['2019', 'EKAA Hypnotherapy L1 & L2'],
    ['2019', 'Growth Edge Coaching certification'],
    ['2018', 'Internal Family Systems Coach Training'],
    ['2018', 'Leadership Circle Profile certification'],
    ['2009', 'Brain Based Coaching'],
  ];

  // Logo wall data — placeholder representative logos
  const logos = [
    { name: 'Google', svg: <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133c-1.147 1.147-2.933 2.4-6.053 2.4c-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0C5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36c2.16-2.16 2.84-5.213 2.84-7.667c0-.76-.053-1.467-.173-2.053z"/> },
    { name: 'Microsoft', svg: <path d="M0 0v11.408h11.408V0zm12.594 0v11.408H24V0zM0 12.594V24h11.408V12.594zm12.594 0V24H24V12.594z"/> },
    { name: 'PepsiCo', svg: <path d="M18.43 3.277A10.839 10.839 0 0 0 2.718 17.594c7.455-2.033 13.503-7 15.712-14.317M12 22.84a10.839 10.839 0 0 0 9.21-16.574a7.607 7.607 0 0 1-2.873 8.195c-3.285 2.416-8.06 2.432-14.649 4.494A10.817 10.817 0 0 0 12 22.84M24 12A12 12 0 1 1 12 0a12 12 0 0 1 12 12"/> },
    { name: 'WHO', svg: <path d="M12.021 1.412c-1.064 0-.611 1.579-.527 2.093c0 .025.086 3.57.102 4.379q.245-.065.477-.12l.321-.08c.015-.782.094-4.166.096-4.184c.07-.551.628-2.088-.469-2.088m-.311 12.04c.119-.04.238-.075.345-.11l.23-.071c0-.228.068-3.372.08-3.944a7 7 0 0 0-.732.211zm.392 1.193c-.04.015-.144.059-.21.081c-.065.023-.156.06-.156.085c0 .024.066 3.62.066 3.699c0 .744.379.749.379 0c0-.053.076-3.916.076-3.916zM11.247 4.5a5.5 5.5 0 0 0-.834.339c-.297.098-.714.119-1.15.588a6 6 0 0 0-.397.51c-.13.187-.137.49-.238.653c-.138.238-.105.37-.105.37v.007a.63.63 0 0 1-.16.295a.6.6 0 0 1-.554.221c.198.1.476-.039.476-.039a4 4 0 0 0-.105.393c.222-.501.426-.684.489-.736c.095.022.292.013.659-.197c.414-.238 1.037-.625 1.213-.87a1.6 1.6 0 0 1 .733-.554q-.018-.565-.027-.98M9.499 6.063l-.215.046l.257-.413l.3.01zm1.28 8.64c0 .466.345.714.689.913c0-.079-.014-.801-.014-.813c.007-.144.146-.231.26-.285a6 6 0 0 1 .545-.208c.103-.036.19-.07.287-.099c.69-.208 1.49-.476 1.49-1.31c0-.832-.685-1.19-1.429-1.443c0 .268-.013.66-.019.93c.317.119.526.275.526.514c0 .3-.321.476-.549.562a6 6 0 0 1-.28.097a9 9 0 0 0-.565.19a3 3 0 0 0-.28.12c-.328.164-.662.406-.661.832m4.575-8.15c0-.853-.619-1.8-2.136-2.135a4 4 0 0 0-.463-.054c0 .129-.01.424-.01.424c0 .093-.01.434-.012.508a2 2 0 0 1 .292.04c.882.211 1.197.715 1.197 1.217c0 .81-.692 1.117-1.547 1.347l-.282.074c-.258.065-.524.126-.787.197l-.28.08c-.943.287-1.755.742-1.755 1.904s.926 1.588 1.83 1.866l-.02-1.002c-.399-.187-.68-.433-.68-.848c0-.414.256-.65.648-.833a3 3 0 0 1 .279-.108a9 9 0 0 1 .743-.206l.282-.068c1.273-.297 2.701-.696 2.701-2.403m-2.848 9.536c.428.217.824.517.989 1.085c.073-.94-.455-1.348-.977-1.623zm7.014-10.8c.46.547 1.263.87 1.733 1.419c-.337-1.623-1.59-2.947-3.07-3.264c.723.544.879 1.3 1.337 1.845M1.724 9.402c1.02-2.22 2.542-1.75 3.186-3.864c-.357.648-2.024.922-2.798 2.585c.394-.988.196-2.5.863-3.315C.982 6.278 1.83 8.656 1.724 9.402m1.847 5.324c.183.864-.357 2.112.5 3.304c-.886-.992-2.762-1.245-3.526-2.754c.952 3.69 3.452 2.928 4.57 3.73c-.924-1.328-.168-2.21-1.544-4.28m-.287 2.315c-.546-2.06.427-2.774-.317-4.75c-.077 1.114-.82 1.657-.319 3.69C1.764 14.26.396 13.617 0 12.434c.027 3.235 2.627 3.715 3.284 4.607m3.992 3.452c-.765-1.06-.238-1.658-2.392-3.581c.454.702-.015 1.585 1.435 2.958c-1.419-.833-3.375-.476-4.32-1.596c1.622 3.103 4.47 1.837 5.277 2.222zm10.405-.622c1.45-1.374.98-2.262 1.435-2.96c-2.15 1.924-1.627 2.523-2.392 3.582c.807-.386 3.655.88 5.275-2.219c-.942 1.122-2.9.763-4.318 1.6zm2.248-1.844c.854-1.19.317-2.44.5-3.304c-1.376 2.07-.62 2.952-1.547 4.285c1.124-.801 3.614-.042 4.57-3.73c-.764 1.507-2.637 1.76-3.523 2.752zM12 23a11 11 0 1 1 11-11a11.012 11.012 0 0 1-11 11M12 0a12 12 0 1 0 12 12A12.014 12.014 0 0 0 12 0"/> },
  ];

  return (
    <main style={{ animation: 'fadeIn 0.4s ease' }}>
      <SEO
        title="About Jennifer May | Executive Coach &amp; Team Facilitator | InciteU"
        description="Executive coach and top-team facilitator with 20 years' experience. Former McKinsey global director, neuroscientist, and certified Leadership Circle Profile practitioner."
        path="/bio"
      />
      {/* Hero — with subtle abstract flourish behind */}
      <section style={{ padding: '100px 6vw 60px', textAlign: 'center', maxWidth: 900, margin: '0 auto', position: 'relative', overflow: 'hidden' }}>
        <svg viewBox="0 0 800 400" preserveAspectRatio="xMidYMid meet" aria-hidden="true"
             style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '90%', maxWidth: 900, opacity: 0.10, zIndex: 0, pointerEvents: 'none' }}>
          <path d="M 50,200 Q 150,80 280,180 T 500,160 Q 620,140 720,240 Q 680,300 560,290 Q 420,280 320,300 Q 180,320 80,280 Q 30,240 50,200 Z" fill="none" stroke={C.sage} strokeWidth="1.5" opacity="0.7" />
          <path d="M 100,220 Q 200,140 320,200 T 540,200 Q 640,200 700,260" fill="none" stroke={C.sage} strokeWidth="1" opacity="0.5" />
          <circle cx="400" cy="200" r="3" fill={C.sage} opacity="0.7" />
        </svg>
        <div style={{ position: 'relative', zIndex: 1 }}>
          <img
            src="/jen-may.jpg"
            alt="Jennifer May"
            style={{
              display: 'block',
              width: 260,
              height: 260,
              borderRadius: '50%',
              objectFit: 'cover',
              objectPosition: 'center 30%',
              margin: '0 auto 28px',
              boxShadow: `0 0 0 1px ${C.line}, 0 12px 40px rgba(0,0,0,0.35)`,
              position: 'relative',
              zIndex: 2,
            }}
          />
          <div style={{ fontFamily: F.serif, fontStyle: 'italic', fontSize: 'clamp(22px, 2.5vw, 28px)', color: C.sage, marginBottom: 16 }}>Hello.</div>
          <h1 style={{ ...heading(88), fontSize: 'clamp(48px, 6.5vw, 88px)', marginBottom: 32 }}>I'm Jennifer.</h1>
          <p style={{ fontFamily: F.serif, fontSize: 'clamp(20px, 2.2vw, 26px)', lineHeight: 1.55, color: C.cream, fontWeight: 400, maxWidth: 640, margin: '0 auto' }}>
            I coach senior leaders and teams. The invitation, every time, is the same: take an honest look at where you are, decide <em style={emSage}>who you want to become next</em>, and do the joyful, often unglamorous work of getting there.
          </p>
        </div>
      </section>

      {dividerSvg}

      {/* Why I created InciteU — two column with enso */}
      <section style={{ padding: '60px 6vw 40px', maxWidth: 1080, margin: '0 auto' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 60, alignItems: 'center' }}>
          <div style={{ flex: '2 1 360px' }}>
            <h2 style={h2}>Why I created Incite<span style={inlineU}>U</span></h2>
            <p style={p}>Incite<span style={inlineU}>U</span> is a suite of tools and ideas that I use everyday in my work with execs. These tools shouldn't be stuck behind boardroom walls and executive budgets.</p>
            <div style={{ background: 'linear-gradient(135deg, rgba(197,212,155,0.10) 0%, rgba(197,212,155,0.04) 100%)', borderLeft: `2px solid ${C.sage}`, borderRadius: '0 4px 4px 0', padding: '22px 26px', margin: '28px 0' }}>
              <p style={{ fontFamily: F.serif, fontStyle: 'italic', fontSize: 20, lineHeight: 1.55, color: C.cream, margin: 0 }}>This website is here so that anyone who wants to transform themselves &mdash; or others &mdash; can build the mental, emotional, and physical resilience to do so.</p>
            </div>
            <p style={p}>If enough of us do the hard work, we might just bring a bit more wisdom and wellbeing into the world &mdash; or at least the world around us.</p>
          </div>
          <div style={{ flex: '1 1 280px', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: 10 }}>
            <img src="/about-enso.jpg" alt="" aria-hidden="true"
                 style={{ width: '100%', maxWidth: 360, height: 'auto', mixBlendMode: 'screen', opacity: 0.88 }} />
          </div>
        </div>
      </section>

      {/* Why the Name InciteU — 3 belief cards */}
      <section style={{ padding: '40px 6vw 60px', maxWidth: 1080, margin: '0 auto' }}>
        <h2 style={{ ...h2, marginBottom: 40 }}>Why the Name Incite<span style={inlineU}>U</span></h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20 }}>
          <BeliefCard num="01"><em style={emSage}>Insight</em> into yourself &mdash; and others &mdash; is the foundation for positive change.</BeliefCard>
          <BeliefCard num="02">The ability to <em style={emSage}>incite</em> action is what transforms others and drives results.</BeliefCard>
          <BeliefCard num="03">This balance of <em style={emSage}>insight</em> and <em style={emSage}>incite</em> is critical for anyone who wants to change themselves or the world around them.</BeliefCard>
        </div>
      </section>

      {dividerSvg}

      {/* Logo wall — representative client logos */}
      <section style={{ padding: '50px 6vw 50px', maxWidth: 1080, margin: '0 auto', textAlign: 'center' }}>
        <p style={{ fontFamily: F.sans, fontSize: 11, fontWeight: 500, letterSpacing: '0.22em', textTransform: 'uppercase', color: C.sage, marginBottom: 36 }}>Trusted by leaders at</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '36px 24px', maxWidth: 720, margin: '0 auto' }}>
          {logos.map((logo) => (
            <div key={logo.name} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
              <svg viewBox="0 0 24 24" fill="currentColor" style={{ color: C.creamMuted, width: 36, height: 36, opacity: 0.85 }} aria-label={logo.name}>
                {logo.svg}
              </svg>
              <span style={{ fontFamily: F.sans, fontSize: 10, fontWeight: 500, letterSpacing: '0.22em', textTransform: 'uppercase', color: C.creamMuted }}>{logo.name}</span>
            </div>
          ))}
        </div>
      </section>

      {dividerSvg}

      {/* Merged: How I work (comprehensive bio in first person) */}
      <section style={sectionStyle}>
        <h3 style={h3}>How I work</h3>
        <p style={p}>I'm an executive coach and top-team facilitator with nearly 20 years of experience. As a former neuroscientist, management consultant and experimental psychologist, I bring insights to my clients that are both transformational and pragmatic &mdash; helping them identify and shift deeply entrenched personal and organizational behaviors that are limiting progress.</p>
        <p style={p}>I have a proven track record of working successfully with a diverse set of senior leaders and high-potential talent, with a focus on gifted and twice-exceptional adults. Nothing delights me more than helping a leader unlock the next level of potential in themselves and their teams.</p>

        <h4 style={subh}>Clients</h4>
        <p style={p}>I've worked extensively with Fortune 500 companies, other multinational organizations, and individual clients. Examples include:</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, margin: '14px 0 8px' }}>
          {clients.map((name) => (<span key={name} style={chipStyle}>{name}</span>))}
          <span style={chipMuted}>&hellip;and many more</span>
        </div>

        <h4 style={subh}>Before this</h4>
        <p style={p}>Prior to becoming a coach, I worked at <span style={sageText}>McKinsey &amp; Company</span> as a management consultant focusing on strategy and organization. I was based out of both the Dubai and Amsterdam offices, and my client work spanned the globe &mdash; including significant work in South Africa, India, Japan, and most of Europe.</p>
        <p style={p}>Later, as McKinsey's Global Director of Strategy &amp; Operations for the Organization Practice, I developed deep line-management experience, overseeing a team of 100+ across 15+ countries.</p>

        <h4 style={subh}>Education &amp; training</h4>
        <p style={p}>I studied health systems at <span style={sageText}>Harvard T.H. Chan School of Public Health</span> (executive program), and hold a Master's of Neuroscience (Magna cum Laude) from <span style={sageText}>Vrije Universiteit van Amsterdam</span>, a Bachelor of Science in Business (Summa cum Laude), and a Bachelor of Science in Psychology (Summa cum Laude) &mdash; both from <span style={sageText}>Kansas State University</span>.</p>
        <p style={p}>In addition to formal education, I've completed several coaching and facilitation training programs:</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, margin: '14px 0 8px' }}>
          {certs.map(([year, name], i) => (
            <span key={i} style={certStyle}>
              <span style={yearStyle}>{year}</span>
              {name}
            </span>
          ))}
        </div>
      </section>

      {dividerSvg}

      {/* Outside of work — preserved verbatim */}
      <section style={sectionStyle}>
        <h3 style={h3}>Outside of work</h3>
        <p style={p}>I grew up in rural Kansas, somehow made it to 71 countries, and called Amsterdam and Dubai home for a long stretch. I have two kids. I raise chickens and drink wine, usually not at the same time.</p>
      </section>

      {/* CTA */}
      <section style={{ padding: '120px 6vw 140px', textAlign: 'center', borderTop: `1px solid ${C.line}`, maxWidth: 1400, margin: '0 auto' }}>
        <p style={{ fontFamily: F.serif, fontSize: 28, fontWeight: 400, color: C.cream, lineHeight: 1.5, maxWidth: 600, margin: '0 auto 24px' }}>
          If you'd like to <em style={emSage}>think something through together</em>, I'd love to hear from you.
        </p>
        <a href="mailto:jen@inciteu.com" style={btn('primary')} onMouseEnter={btnHoverIn} onMouseLeave={btnHoverOut}>Get in touch</a>
      </section>
    </main>
  );
}
