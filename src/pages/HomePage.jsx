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
          <div style={{ fontFamily: F.sans, fontSize: 11, letterSpacing: '0.3em', textTransform: 'uppercase', color: C.creamMuted, marginBottom: 0 }}>
            — Richard Rohr
          </div>
        </div>
      </section>

      <OrganicDivider />

      <section style={{ padding: '8px 6vw 24px', textAlign: 'center', maxWidth: 760, margin: '0 auto' }}>
        <p style={{ fontFamily: F.sans, fontSize: 19, color: C.creamMuted, fontWeight: 300, lineHeight: 1.7, margin: 0 }}>
          This webpage is for <span style={{ color: C.sage }}>anyone who wants to transform themselves or others</span>.<br />
          It hosts a suite of transformational tools that are free to use.<br />
          If these tools help you, please share them with others who will use them for good.
        </p>
      </section>

      <section style={{ padding: '40px 6vw 0', textAlign: 'center', maxWidth: 760, margin: '0 auto' }}>
        <button onClick={() => navigate('where-to-start')}
                style={{ display: 'inline-block', background: C.sage, color: C.bgDeep, textDecoration: 'none', fontFamily: F.sans, fontSize: 15, fontWeight: 500, letterSpacing: '0.2em', textTransform: 'uppercase', padding: '22px 48px', border: `1px solid ${C.sage}`, borderRadius: 2, cursor: 'pointer', transition: 'all 0.3s ease', boxShadow: '0 0 0 1px rgba(197, 212, 155, 0), 0 0 40px rgba(197, 212, 155, 0)' }}
                onMouseEnter={(e) => {
                  e.target.style.background = 'transparent';
                  e.target.style.color = C.sage;
                  e.target.style.boxShadow = '0 0 0 1px rgba(197, 212, 155, 0.3), 0 0 60px rgba(197, 212, 155, 0.2)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = C.sage;
                  e.target.style.color = C.bgDeep;
                  e.target.style.boxShadow = '0 0 0 1px rgba(197, 212, 155, 0), 0 0 40px rgba(197, 212, 155, 0)';
                }}>
          Curious where to start? →
        </button>
      </section>

      <section id="tools-anchor" style={{ padding: '40px 6vw 120px', maxWidth: 1400, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 32, alignItems: 'start' }}>
          <CategoryCard variant="self" label="Inward" name="Live Well" tagline="Do the inner work needed to become the best version of yourself possible" Icon={SelfIcon} iconStyle={{ top: -30, right: -30, width: 220, height: 220 }} navigate={navigate}
            toolGroups={[
              { question: 'Who am I, really?', tools: [
                { name: 'Three Moments', description: 'Reflect on what made you who you are today', live: true, to: 'three-moments' },
                { name: 'Identity Box', description: 'Reveal what you work to project vs. what you protect', live: true, to: 'identity-box' },
              ]},
              { question: "What's calling me next?", tools: [
                { name: 'Purpose and Small Moves', description: 'Picture multiple lives, find the breadcrumbs leading to who you want to be next, and take a small step to get there', live: true, to: 'purpose-small-moves' },
                { name: 'Emotions as Information', description: 'Learn how your emotions developed, and how understanding them can create new possibilities', live: true, to: 'emotions-as-information' },
              ]},
              { question: 'How do I keep going?', tools: [
                { name: 'State Check', live: false },
              ]},
            ]} />
          <CategoryCard variant="team" label="Outward" name="Face What Is" tagline="Recognize what's actually in front of you, not what you wish was" Icon={TeamIcon} iconStyle={{ top: -55, right: -55, width: 240, height: 240 }} navigate={navigate}
            toolGroups={[
              { question: 'How do I actually show up?', tools: [
                { name: 'Using the Leadership Circle Profile Self Assessment', description: 'Make sense of your LCP results and what they mean', live: true, to: 'lcp' },
              ]},
              { question: 'What perspectives am I missing?', tools: [
                { name: 'Creative Collision', description: 'Gather opposing perspectives to make your idea even better', live: true, to: 'creative-collision' },
                { name: 'Open Facilitation', description: 'Gather group input and use AI to sensemake', live: true, to: 'facilitate-your-way' },
              ]},
              { question: 'What am I actually dealing with?', tools: [
                { name: 'Decision Making (Cynefin) & Challenge Mapper', description: 'Understand the challenge you face and match your next steps to what works', live: true, to: 'challenge-mapper' },
              ]},
            ]} />
          <CategoryCard variant="org" label="Forward" name="Lead Well" tagline="Set a direction, inspire others to join you, and keep experimenting and learning" Icon={OrgIcon} iconStyle={{ top: -50, right: -50, width: 230, height: 230 }} navigate={navigate}
            toolGroups={[
              { question: 'Where are we headed?', tools: [
                { name: 'Culture Change Vision', description: 'Refine or build a compelling chase for change', live: true, to: 'vision' },
                { name: 'Pre-Mortem', description: 'Imagine failure before it happens, then prevent it', live: true, to: 'pre-mortem' },
              ]},
              { question: 'Are we ready to move?', tools: [
                { name: 'Culture Readiness Assessment', description: 'Take stock of what your team needs to successfully change its culture', live: true, to: 'readiness' },
                { name: 'The Squeeze', live: false },
              ]},
              { question: 'What did we learn?', tools: [
                { name: 'Post-Mortem', live: false },
              ]},
            ]} />
        </div>
      </section>

      <section style={{ padding: '120px 6vw 140px', borderTop: `1px solid ${C.line}`, maxWidth: 1400, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 48, flexWrap: 'wrap' }}>
          <p style={{ fontFamily: F.serif, fontSize: 28, fontWeight: 400, color: C.cream, lineHeight: 1.5, margin: 0, flex: '1 1 600px', maxWidth: 900 }}>
            If, after exploring here, you'd like a human to <em style={{ color: C.sage, fontStyle: 'italic' }}>think alongside you</em>, please get in touch.
          </p>
          <a href="mailto:jen@inciteu.com" style={{ ...btn('primary'), flexShrink: 0 }} onMouseEnter={btnHoverIn} onMouseLeave={btnHoverOut}>Get in touch</a>
        </div>
      </section>
    </main>
  );
}
