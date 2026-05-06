import React from 'react';
import { C, F } from '../theme.js';
import { useAppNavigate } from '../lib/useAppNavigate.js';

export default function Header() {
  const navigate = useAppNavigate();

  const navItems = [
    { id: 'home', label: 'Home' },
    { id: 'home-tools', label: 'Tools' },
    { id: 'think', label: 'Think' },
    { id: 'bio', label: 'Bio' },
    { id: 'contact', label: 'Contact' },
  ];

  return (
    <header style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '28px 6vw', borderBottom: `1px solid ${C.line}`,
      position: 'sticky', top: 0, zIndex: 10,
      background: 'rgba(31, 57, 55, 0.92)', backdropFilter: 'blur(10px)',
      flexWrap: 'wrap', gap: 16,
    }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 18, flexWrap: 'wrap' }}>
        <a onClick={(e) => { e.preventDefault(); navigate('home'); }} href="#"
           style={{ fontFamily: F.serif, fontSize: 26, letterSpacing: '0.15em', color: C.cream, textDecoration: 'none', fontWeight: 500, lineHeight: 1, cursor: 'pointer' }}>
          incite<span style={{ color: C.sage, fontStyle: 'italic' }}>u</span>
        </a>
        <span style={{ fontSize: 11, letterSpacing: '0.25em', textTransform: 'uppercase', color: C.creamMuted, borderLeft: `1px solid ${C.line}`, paddingLeft: 18 }}>
          Live well · Lead well
        </span>
      </div>
      <ul style={{ display: 'flex', gap: 36, listStyle: 'none', margin: 0, padding: 0 }}>
        {navItems.map((item) => (
          <li key={item.id}>
            <a onClick={(e) => {
                 e.preventDefault();
                 if (item.id === 'home-tools') {
                   navigate('home', 'tools-anchor');
                 } else {
                   navigate(item.id);
                 }
               }} href="#"
               style={{ color: C.creamMuted, textDecoration: 'none', fontFamily: F.sans, fontSize: 13, letterSpacing: '0.18em', textTransform: 'uppercase', cursor: 'pointer', transition: 'color 0.3s' }}
               onMouseEnter={(e) => { e.target.style.color = C.sage; }}
               onMouseLeave={(e) => { e.target.style.color = C.creamMuted; }}>
              {item.label}
            </a>
          </li>
        ))}
      </ul>
    </header>
  );
}
