import React from 'react';
import { C, F, HERO_PHOTO } from '../theme.js';
import { btn, btnHoverIn, btnHoverOut } from '../styles.js';
import { useAppNavigate } from '../lib/useAppNavigate.js';
import HeroFlourish from '../components/HeroFlourish.jsx';
import OrganicDivider from '../components/OrganicDivider.jsx';
import CategoryCard from '../components/CategoryCard.jsx';
import { SelfIcon, TeamIcon, OrgIcon } from '../components/icons.jsx';

export default function HomePage() {
  const navigate = useAppNavigate();

  return (
    <main style={{ animation: 'fadeIn 0.4s ease' }}>
      <section style={{ position: 'relative', minHeight: '56vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '100px 6vw 40px', overflow: 'hidden' }}>
        <img src={HERO_PHOTO} alt="" aria-hidden="true"
             style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0, opacity: 0.7 }} />
        <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(180deg, rgba(31, 57, 55, 0.35) 0%, rgba(31, 57, 55, 0.55) 50%, ${C.bgDeep} 100%)`, zIndex: 1 }} />
        <HeroFlourish />
        <div style={{ position: 'relative', zIndex: 3, maxWidth: 1000, textAlign: 'center' }}>
          <h1 style={{ fontFamily: F.serif, fontWeight: 400, fontSize: 'clamp(48px, 7vw, 96px)', lineHeight: 1.1, letterSpacing: '-0.01em', marginBottom: 24, color: C.cream }}>
            Transformed people<br />
            <span style={{ fontStyle: 'italic', color: C.sage }}>transform</span> people.
          </h1>
          <div style={{ fontFamily: F.sans, fontSize: 11, letterSpacing: '0.3em', textTransform: 'uppercase', color: C.creamMuted, marginBottom: 56 }}>
            — Richard Rohr
          </div>
          <p style={{ fontFamily: F.sans, fontSize: 19, color: C.creamMuted, maxWidth: 700, margin: '0 auto', fontWeight: 300, lineHeight: 1.7 }}>
            For anyone wanting to transform &mdash; <span style={{ color: C.sage }}>themselves or others</span>. The tools are free. <span style={{ color: C.sage }}>Repay by using them to do some good.</span>
          </p>
        </div>
      </section>

      <OrganicDivider />

      <section id="tools-anchor" style={{ padding: '30px 6vw 120px', maxWidth: 1400, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 32 }}>
          <CategoryCard variant="self" label="Inward" name="Live Well" tagline="The inner work of becoming who you are next." Icon={SelfIcon} iconStyle={{ top: -30, right: -30, width: 220, height: 220 }} navigate={navigate}
            toolGroups={[
              { label: 'Who You Are', tools: [
                { name: 'Identity Box', live: true, to: 'identity-box' },
                { name: 'Three Moments', live: true, to: 'three-moments' },
              ]},
              { label: 'What Drives You', tools: [
                { name: 'Purpose (and the Small Moves to Live It)', live: true, to: 'purpose-small-moves' },
                { name: 'Emotions as Information', live: true, to: 'emotions-as-information' },
              ]},
              { label: 'What Sustains You', tools: [
                { name: 'State Check', live: false },
              ]},
            ]} />
          <CategoryCard variant="team" label="Outward" name="Face What Is" tagline="Seeing what's actually here, not what you wish were." Icon={TeamIcon} iconStyle={{ top: -55, right: -55, width: 240, height: 240 }} navigate={navigate}
            toolGroups={[
              { label: 'Understand Yourself', tools: [
                { name: 'Using the Leadership Circle Profile Self Assessment', live: true, to: 'lcp' },
              ]},
              { label: 'Understand Others', tools: [
                { name: 'Surfacing Perspectives', live: false },
              ]},
              { label: 'Understand Reality', tools: [
                { name: 'Decision Making (Cynefin) & Challenge Mapper', live: true, to: 'challenge-mapper' },
              ]},
            ]} />
          <CategoryCard variant="org" label="Forward" name="Lead Well" tagline="Setting direction, making moves, learning from them." Icon={OrgIcon} iconStyle={{ top: -50, right: -50, width: 230, height: 230 }} navigate={navigate}
            toolGroups={[
              { label: 'Set Direction', tools: [
                { name: 'Vision', live: true, to: 'vision' },
                { name: 'Pre-Mortem', live: true, to: 'pre-mortem' },
              ]},
              { label: 'Make It Happen', tools: [
                { name: 'The Squeeze', live: false },
                { name: 'Readiness', live: true, to: 'readiness' },
              ]},
              { label: 'Sustain & Renew', tools: [
                { name: 'Post-Mortem', live: false },
              ]},
            ]} />
        </div>
      </section>

      <section style={{ padding: '120px 6vw 140px', textAlign: 'center', borderTop: `1px solid ${C.line}`, maxWidth: 1400, margin: '0 auto' }}>
        <p style={{ fontFamily: F.serif, fontSize: 28, fontWeight: 400, color: C.cream, lineHeight: 1.5, maxWidth: 700, margin: '0 auto 24px' }}>
          If, after exploring here, you'd like a human to <em style={{ color: C.sage, fontStyle: 'italic' }}>think alongside you</em>, please get in touch.
        </p>
        <a href="mailto:jen@inciteu.com" style={btn('primary')} onMouseEnter={btnHoverIn} onMouseLeave={btnHoverOut}>Get in touch</a>
      </section>
    </main>
  );
}
