import React, { useState } from 'react';
import { C, F } from '../theme.js';
import { eyebrow, heading } from '../styles.js';

// Map variant string to per-category background + hover from the theme.
// Falls back to the original bgCard/bgCardHover if no variant is passed,
// so other tool pages that use this look unchanged.
const VARIANT_BG = {
  self: { base: C.bgCardSelf, hover: C.bgCardSelfHover },
  team: { base: C.bgCardTeam, hover: C.bgCardTeamHover },
  org:  { base: C.bgCardOrg,  hover: C.bgCardOrgHover },
};

const VARIANT_ACCENT = {
  self: '#C5D49B',
  team: '#E8C87A',
  org:  '#8CBAC6',
};

export default function CategoryCard({ label, name, tagline, Icon, iconStyle, tools, toolGroups, navigate, guideTo, variant }) {
  const [hovered, setHovered] = useState(false);
  const bgPair = VARIANT_BG[variant] || { base: C.bgCard, hover: C.bgCardHover };
  const accent = VARIANT_ACCENT[variant] || C.sage;

  // Render a single tool list item (used by both grouped and flat rendering).
  const renderToolItem = (t, i, allItems, isLast) => {
    const isLink = !!(t.to || t.external);
    const onClick = t.to ? () => navigate(t.to) : t.external ? () => window.open(t.external, '_blank', 'noopener') : null;
    return (
      <li key={i} onClick={onClick}
          style={{ padding: '10px 0 10px 18px', borderBottom: isLast ? 'none' : `1px solid ${C.line}`, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, fontSize: 15, color: C.cream, cursor: isLink ? 'pointer' : 'default', transition: 'color 0.3s', lineHeight: 1.4 }}
          onMouseEnter={(e) => { if (isLink) e.currentTarget.style.color = accent; }}
          onMouseLeave={(e) => { if (isLink) e.currentTarget.style.color = C.cream; }}>
        <span style={{ flex: '1 1 auto', minWidth: 0 }}>{t.name}</span>
        <span style={{ fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', whiteSpace: 'nowrap', flex: '0 0 auto', minWidth: 95, textAlign: 'right', paddingTop: 2, color: t.live ? accent : C.creamMuted }}>
          {t.live ? `Available${t.external ? ' ↗' : ''}` : 'Coming soon'}
        </span>
      </li>
    );
  };

  return (
    <div onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
         style={{ background: hovered ? bgPair.hover : bgPair.base, borderRadius: 4, padding: '40px 32px', transition: 'background 0.4s, transform 0.4s', cursor: 'default', position: 'relative', overflow: 'hidden', minHeight: 380, transform: hovered ? 'translateY(-4px)' : 'none' }}>
      <div style={{ position: 'absolute', ...iconStyle, opacity: 0.65, pointerEvents: 'none', transition: 'transform 0.4s', transform: hovered ? 'rotate(-6deg) scale(1.05)' : 'none' }}>
        <Icon />
      </div>
      <div style={{ position: 'relative', zIndex: 1, marginTop: 80 }}>
        <div style={{ ...eyebrow, marginBottom: 12 }}>{label}</div>
        <h2 style={{ ...heading(48), marginBottom: 16 }}>{name}</h2>
        <p style={{ fontFamily: F.serif, fontStyle: 'italic', fontSize: 18, color: accent, marginBottom: 24, lineHeight: 1.4 }}>{tagline}</p>
        {guideTo && (
          <a onClick={(e) => { e.preventDefault(); navigate(guideTo); }} href="#"
             style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: accent, textDecoration: 'none', fontFamily: F.serif, fontStyle: 'italic', fontSize: 16, cursor: 'pointer', borderTop: `1px solid ${C.line}`, width: '100%', padding: '18px 0 20px', transition: 'gap 0.3s' }}
             onMouseEnter={(e) => { e.target.style.gap = '14px'; }}
             onMouseLeave={(e) => { e.target.style.gap = '8px'; }}>
            Not sure where to begin? <span style={{ fontStyle: 'normal' }}>→</span>
          </a>
        )}

        {/* Grouped rendering: sub-bucket headings + tools in each group */}
        {toolGroups && (
          <div style={{ borderTop: `1px solid ${C.line}`, paddingTop: 12 }}>
            {toolGroups.map((group, gi) => (
              <div key={gi} style={{ marginTop: gi === 0 ? 6 : 18 }}>
                <h3 style={{ fontFamily: F.serif, fontStyle: 'italic', fontSize: 20, fontWeight: 500, lineHeight: 1.2, margin: '0 0 6px 0', color: accent }}>{group.label}</h3>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                  {group.tools.map((t, i) => {
                    const isLastInGroup = i === group.tools.length - 1;
                    const isLastGroup = gi === toolGroups.length - 1;
                    const isLast = isLastInGroup && isLastGroup;
                    return renderToolItem(t, i, group.tools, isLast);
                  })}
                </ul>
              </div>
            ))}
          </div>
        )}

        {/* Flat rendering (backward compatible): used when toolGroups not provided */}
        {!toolGroups && tools && (
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, borderTop: `1px solid ${C.line}`, paddingTop: 20 }}>
            {tools.map((t, i) => renderToolItem(t, i, tools, i === tools.length - 1))}
          </ul>
        )}
      </div>
    </div>
  );
}
