import React from 'react';
import { C, F } from '../theme.js';
import { btn, btnHoverIn, btnHoverOut, heading } from '../styles.js';

export default function BioPage() {
  const sectionStyle = { padding: '40px 6vw', maxWidth: 760, margin: '0 auto' };
  const dividerSvg = (
    <div style={{ width: '100%', overflow: 'hidden', lineHeight: 0, padding: '30px 0', maxWidth: 760, margin: '0 auto' }}>
      <svg viewBox="0 0 800 50" preserveAspectRatio="none" style={{ width: '100%', height: 50, display: 'block' }}>
        <path d="M 0,25 Q 200,5 400,25 T 800,25" fill="none" stroke={C.sage} strokeWidth="1" opacity="0.4" />
        <circle cx="400" cy="25" r="2.5" fill={C.sage} opacity="0.6" />
      </svg>
    </div>
  );
  const h3 = { fontFamily: F.serif, fontSize: 30, fontWeight: 400, color: C.cream, marginBottom: 24, marginTop: 0 };
  const p = { fontSize: 16, lineHeight: 1.75, color: C.cream, marginBottom: 18, fontWeight: 300, fontFamily: F.sans };

  return (
    <main style={{ animation: 'fadeIn 0.4s ease' }}>
      <section style={{ padding: '100px 6vw 60px', textAlign: 'center', maxWidth: 900, margin: '0 auto' }}>
        <div style={{ fontFamily: F.serif, fontStyle: 'italic', fontSize: 'clamp(22px, 2.5vw, 28px)', color: C.sage, marginBottom: 16 }}>Hello.</div>
        <h1 style={{ ...heading(88), fontSize: 'clamp(48px, 6.5vw, 88px)', marginBottom: 32 }}>I'm Jennifer.</h1>
        <p style={{ fontFamily: F.serif, fontSize: 'clamp(20px, 2.2vw, 26px)', lineHeight: 1.55, color: C.cream, fontWeight: 400, maxWidth: 640, margin: '0 auto' }}>
          I help senior leaders and teams find what's <em style={{ color: C.sage, fontStyle: 'italic' }}>true for them</em> — beneath what they've been told they should want.
        </p>
      </section>
      {dividerSvg}
      <section style={sectionStyle}>
        <h3 style={h3}>How I work</h3>
        <p style={p}>For the past decade and more, I've coached CEOs and senior teams at companies you'd recognize — Google, Gilead, Novartis, Chalhoub, Microsoft, the World Bank, the WHO, and others. Most of my work today comes through <span style={{ color: C.sage }}>Cultivating Leadership</span> and <span style={{ color: C.sage }}>Mobius</span>, where I'm a coach and facilitator.</p>
        <p style={p}>My work draws on:</p>
        <ul style={{ listStyle: 'none', margin: '16px 0 24px', padding: 0 }}>
          {['Internal Family Systems (parts work)','Vertical / developmental coaching, in the lineage of Kegan and Garvey Berger','Hypnotherapy and brain-state work','Leadership Circle Profile (individual and systems)','Positive psychology','Growth edge interviewing','Biofeedback and physiological data, when useful'].map((item, i, arr) => (
            <li key={i} style={{ padding: '8px 0', color: C.cream, fontSize: 15, borderBottom: i === arr.length - 1 ? 'none' : `1px solid ${C.line}`, lineHeight: 1.5 }}>{item}</li>
          ))}
        </ul>
        <p style={p}>I work right at the boundary of most things — clients tell me my work feels therapeutic, and also light, and also pragmatic. I try to make all three true at once.</p>
      </section>
      {dividerSvg}
      <section style={sectionStyle}>
        <h3 style={h3}>Before all this</h3>
        <p style={p}>I trained in psychology and neuroscience — undergrad at Kansas State, master's at the Vrije Universiteit in Amsterdam (magna cum laude), summer at Harvard's School of Public Health.</p>
        <p style={p}>Earlier in my career, I spent over a decade at <span style={{ color: C.sage }}>McKinsey & Company</span>, eventually leading global strategy and operations for the People Practice — a team of 100+ across 15+ countries. In 2015 I founded Incite Leadership in Dubai. The site you're on now is what came next.</p>
      </section>
      {dividerSvg}
      <section style={sectionStyle}>
        <h3 style={h3}>Outside of work</h3>
        <p style={p}>I grew up in rural Kansas, somehow made it to 71 countries, and called Amsterdam and Dubai home for a long stretch. I have two kids. I raise chickens and drink wine, usually not at the same time.</p>
      </section>
      <section style={{ padding: '120px 6vw 140px', textAlign: 'center', borderTop: `1px solid ${C.line}`, maxWidth: 1400, margin: '0 auto' }}>
        <p style={{ fontFamily: F.serif, fontSize: 28, fontWeight: 400, color: C.cream, lineHeight: 1.5, maxWidth: 600, margin: '0 auto 24px' }}>
          If you'd like to <em style={{ color: C.sage, fontStyle: 'italic' }}>think something through together</em>, I'd love to hear from you.
        </p>
        <a href="mailto:jen@inciteu.com" style={btn('primary')} onMouseEnter={btnHoverIn} onMouseLeave={btnHoverOut}>Get in touch</a>
      </section>
    </main>
  );
}
