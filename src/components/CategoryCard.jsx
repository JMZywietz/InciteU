import React, { useState } from 'react';
import { C, F } from '../theme.js';
import { eyebrow, heading } from '../styles.js';

// Map variant string to per-category background + hover from the theme.
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

function pluralize(n, single) { return n === 1 ? single : single + 's'; }

function countString(total, coming) {
  if (coming === 0) return `${total} ${pluralize(total, 'tool')}`;
  if (coming === total) return total === 1 ? '1 tool · coming soon' : `${total} ${pluralize(total, 'tool')} · coming soon`;
  return `${total} ${pluralize(total, 'tool')} · ${coming} coming soon`;
}

export default function CategoryCard({ label, name, tagline, Icon, iconStyle, tools, toolGroups, navigate, guideTo, variant }) {
  const [hovered, setHovered] = useState(false);
  const [hoveredTool, setHoveredTool] = useState(null);
  const [expanded, setExpanded] = useState(false);
  const [expandedSubs, setExpandedSubs] = useState({});
  const bgPair = VARIANT_BG[variant] || { base: C.bgCard, hover: C.bgCardHover };
  const accent = VARIANT_ACCENT[variant] || C.sage;

  // Total tool count + coming-soon count for the card summary.
  let totalTools = 0;
  let comingTools = 0;
  if (toolGroups) {
    toolGroups.forEach((g) => g.tools.forEach((t) => { totalTools++; if (!t.live) comingTools++; }));
  } else if (tools) {
    tools.forEach((t) => { totalTools++; if (!t.live) comingTools++; });
  }
  const cardCount = countString(totalTools, comingTools);

  const toggleSub = (idx) => {
    setExpandedSubs((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  // Render a single tool list item with name + description, no Available/Coming-soon badge.
  // Coming-soon tools are dimmed and show "Coming soon" as their description.
  const renderToolItem = (t, i, _allItems, isLast, keyPrefix = '') => {
    const isLink = !!(t.to || t.external) && t.live !== false;
    const onClick = isLink && t.to
      ? (e) => { e.stopPropagation(); navigate(t.to); }
      : isLink && t.external
        ? (e) => { e.stopPropagation(); window.open(t.external, '_blank', 'noopener'); }
        : null;
    const key = `${keyPrefix}${i}`;
    const isHovered = hoveredTool === key;
    const isComing = !t.live;
    const description = isComing ? (t.description || 'Coming soon') : (t.description || '');

    const nameColor = isComing
      ? 'rgba(240, 235, 219, 0.38)'
      : (isHovered ? accent : C.cream);
    const descColor = isComing
      ? 'rgba(240, 235, 219, 0.3)'
      : 'rgba(240, 235, 219, 0.62)';

    return (
      <li key={key}
          onClick={onClick}
          onMouseEnter={() => { if (isLink) setHoveredTool(key); }}
          onMouseLeave={() => setHoveredTool(null)}
          style={{
            padding: '12px 0 12px 18px',
            borderBottom: isLast ? 'none' : `1px solid ${C.line}`,
            cursor: isLink ? 'pointer' : 'default',
            transition: 'color 0.3s',
          }}>
        <div style={{ fontSize: 15, color: nameColor, fontWeight: 400, lineHeight: 1.35, marginBottom: description ? 4 : 0, transition: 'color 0.3s' }}>
          {t.name}{t.external && t.live !== false ? ' ↗' : ''}
        </div>
        {description && (
          <div style={{ fontFamily: F.serif, fontStyle: 'italic', fontSize: 13, color: descColor, fontWeight: 400, lineHeight: 1.4, transition: 'color 0.3s' }}>
            {description}
          </div>
        )}
      </li>
    );
  };

  return (
    <div onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
         style={{ background: hovered ? bgPair.hover : bgPair.base, borderRadius: 4, padding: '40px 32px', transition: 'background 0.4s, transform 0.4s', cursor: 'default', position: 'relative', overflow: 'hidden', transform: hovered ? 'translateY(-4px)' : 'none' }}>
      <div style={{ position: 'absolute', ...iconStyle, opacity: 0.65, pointerEvents: 'none', transition: 'transform 0.4s', transform: hovered ? 'rotate(-6deg) scale(1.05)' : 'none' }}>
        <Icon />
      </div>

      {/* Card header — display only (no click target; chevron lives at the bottom now) */}
      <div style={{ position: 'relative', zIndex: 1, marginTop: 80 }}>
        <div style={{ ...eyebrow, marginBottom: 12 }}>{label}</div>
        <h2 style={{ ...heading(48), marginBottom: 16 }}>{name}</h2>
        <p style={{ fontFamily: F.serif, fontStyle: 'italic', fontSize: 18, color: accent, marginBottom: 0, lineHeight: 1.4 }}>{tagline}</p>
        <div style={{ fontFamily: F.sans, fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase', color: C.creamMuted, marginTop: 18 }}>{cardCount}</div>
      </div>

      {/* Card body — visible only when expanded */}
      <div style={{ position: 'relative', zIndex: 1, maxHeight: expanded ? 3000 : 0, overflow: 'hidden', transition: 'max-height 0.45s ease' }}>
        <div style={{ marginTop: 28, paddingTop: 24, borderTop: `1px solid ${C.line}` }}>
          {guideTo && (
            <a onClick={(e) => { e.preventDefault(); e.stopPropagation(); navigate(guideTo); }} href="#"
               style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: accent, textDecoration: 'none', fontFamily: F.serif, fontStyle: 'italic', fontSize: 16, cursor: 'pointer', borderBottom: `1px solid ${C.line}`, width: '100%', padding: '0 0 20px', marginBottom: 16, transition: 'gap 0.3s' }}
               onMouseEnter={(e) => { e.target.style.gap = '14px'; }}
               onMouseLeave={(e) => { e.target.style.gap = '8px'; }}>
              Not sure where to begin? <span style={{ fontStyle: 'normal' }}>→</span>
            </a>
          )}

          {/* Grouped rendering: each sub-bucket has its own clickable header.
              The sub-bucket header is a short, powerful question in italic serif (the section's accent color),
              with a count + "click to see more / less" CTA line beneath it. */}
          {toolGroups && toolGroups.map((group, gi) => {
            const subExpanded = !!expandedSubs[gi];
            const groupTotal = group.tools.length;
            const groupComing = group.tools.filter((t) => !t.live).length;
            const groupCount = countString(groupTotal, groupComing);
            const seeMoreText = subExpanded ? 'click to see less' : 'click to see more';

            return (
              <div key={gi} style={{ marginBottom: 4 }}>
                <div onClick={(e) => { e.stopPropagation(); toggleSub(gi); }}
                     style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, padding: '14px 4px', cursor: 'pointer', borderRadius: 2, transition: 'background 0.2s ease' }}
                     onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(240, 235, 219, 0.04)'; }}
                     onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: F.serif, fontStyle: 'italic', fontSize: 22, fontWeight: 400, color: accent, lineHeight: 1.3, marginBottom: 8 }}>{group.question}</div>
                    <div style={{ fontFamily: F.sans, fontSize: 12, color: C.creamMuted, fontWeight: 300, margin: 0 }}>
                      {groupCount} · <span style={{ fontStyle: 'italic' }}>{seeMoreText}</span>
                    </div>
                  </div>
                  <div style={{ fontSize: 14, color: C.creamMuted, transition: 'transform 0.25s ease', transform: subExpanded ? 'rotate(90deg)' : 'rotate(0deg)', flexShrink: 0, marginTop: 8, userSelect: 'none', fontFamily: F.sans }}>▸</div>
                </div>
                <div style={{ maxHeight: subExpanded ? 800 : 0, overflow: 'hidden', transition: 'max-height 0.35s ease' }}>
                  <ul style={{ listStyle: 'none', padding: '8px 4px 12px 4px', margin: 0 }}>
                    {group.tools.map((t, i) => {
                      const isLast = i === group.tools.length - 1;
                      return renderToolItem(t, i, group.tools, isLast, `g${gi}-`);
                    })}
                  </ul>
                </div>
              </div>
            );
          })}

          {/* Flat rendering (backward compatible) */}
          {!toolGroups && tools && (
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {tools.map((t, i) => renderToolItem(t, i, tools, i === tools.length - 1))}
            </ul>
          )}
        </div>
      </div>

      {/* Card-level expand/collapse trigger at the bottom — moved here from the top so it doesn't get lost in the corner icon decoration */}
      <div onClick={() => setExpanded((e) => !e)}
           style={{
             position: 'relative',
             zIndex: 1,
             marginTop: 24,
             paddingTop: 20,
             paddingBottom: 4,
             borderTop: `1px solid ${C.line}`,
             cursor: 'pointer',
             display: 'flex',
             alignItems: 'center',
             justifyContent: 'center',
             gap: 12,
             color: accent,
             fontFamily: F.sans,
             fontSize: 12,
             letterSpacing: '0.18em',
             textTransform: 'uppercase',
             fontWeight: 400,
             transition: 'gap 0.3s ease',
           }}
           onMouseEnter={(e) => { e.currentTarget.style.gap = '18px'; }}
           onMouseLeave={(e) => { e.currentTarget.style.gap = '12px'; }}>
        <span>{expanded ? 'click to see less detail' : 'click to see more detail'}</span>
        <span style={{ fontSize: 16, transition: 'transform 0.3s ease', transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)', userSelect: 'none', display: 'inline-block' }}>▸</span>
      </div>
    </div>
  );
}
