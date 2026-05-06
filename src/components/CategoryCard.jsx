import React, { useState } from 'react';
import { C, F } from '../theme.js';
import { eyebrow, heading } from '../styles.js';

export default function CategoryCard({ label, name, tagline, Icon, iconStyle, tools, navigate, guideTo }) {
  const [hovered, setHovered] = useState(false);

  return (
    <div onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
         style={{ background: hovered ? C.bgCardHover : C.bgCard, borderRadius: 4, padding: '48px 36px', transition: 'background 0.4s, transform 0.4s', cursor: 'default', position: 'relative', overflow: 'hidden', minHeight: 460, transform: hovered ? 'translateY(-4px)' : 'none' }}>
      <div style={{ position: 'absolute', ...iconStyle, opacity: 0.55, pointerEvents: 'none', transition: 'transform 0.4s', transform: hovered ? 'rotate(-6deg) scale(1.05)' : 'none' }}>
        <Icon />
      </div>
      <div style={{ position: 'relative', zIndex: 1, marginTop: 110 }}>
        <div style={{ ...eyebrow, marginBottom: 16 }}>{label}</div>
        <h2 style={{ ...heading(56), marginBottom: 20 }}>{name}</h2>
        <p style={{ fontFamily: F.serif, fontStyle: 'italic', fontSize: 19, color: C.sage, marginBottom: 32, lineHeight: 1.4 }}>{tagline}</p>
        {guideTo && (
          <a onClick={(e) => { e.preventDefault(); navigate(guideTo); }} href="#"
             style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: C.sage, textDecoration: 'none', fontFamily: F.serif, fontStyle: 'italic', fontSize: 17, cursor: 'pointer', borderTop: `1px solid ${C.line}`, width: '100%', padding: '22px 0 24px', transition: 'gap 0.3s' }}
             onMouseEnter={(e) => { e.target.style.gap = '14px'; }}
             onMouseLeave={(e) => { e.target.style.gap = '8px'; }}>
            Not sure where to begin? <span style={{ fontStyle: 'normal' }}>→</span>
          </a>
        )}
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, borderTop: `1px solid ${C.line}`, paddingTop: 24 }}>
          {tools.map((t, i) => {
            const isLink = !!(t.to || t.external);
            const onClick = t.to ? () => navigate(t.to) : t.external ? () => window.open(t.external, '_blank', 'noopener') : null;
            return (
              <li key={i} onClick={onClick}
                  style={{ padding: '14px 0', borderBottom: i === tools.length - 1 ? 'none' : `1px solid ${C.line}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 15, color: C.cream, cursor: isLink ? 'pointer' : 'default', transition: 'color 0.3s' }}
                  onMouseEnter={(e) => { if (isLink) e.currentTarget.style.color = C.sage; }}
                  onMouseLeave={(e) => { if (isLink) e.currentTarget.style.color = C.cream; }}>
                <span>{t.name}</span>
                <span style={{ fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: t.live ? C.sage : C.creamMuted }}>
                  {t.live ? `Available${t.external ? ' ↗' : ''}` : 'Coming soon'}
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
