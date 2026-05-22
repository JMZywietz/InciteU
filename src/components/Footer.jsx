import React from 'react';
import { C } from '../theme.js';
import { useAppNavigate } from '../lib/useAppNavigate.js';

export default function Footer() {
  const navigate = useAppNavigate();
  const linkStyle = { color: C.creamMuted, textDecoration: 'none', cursor: 'pointer', transition: 'color 0.3s' };
  const supportLinkStyle = { color: C.sage, textDecoration: 'none', cursor: 'pointer', transition: 'color 0.3s' };
  return (
    <footer style={{ padding: '24px 6vw', borderTop: `1px solid ${C.line}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
      <small style={{ fontSize: 11, letterSpacing: '0.18em', color: C.creamMuted, textTransform: 'uppercase' }}>
        © InciteU · Jennifer May
      </small>
      <div style={{ fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase' }}>
        <a onClick={(e) => { e.preventDefault(); navigate('contact'); }} href="#"
           style={linkStyle}
           onMouseEnter={(e) => { e.target.style.color = C.sage; }}
           onMouseLeave={(e) => { e.target.style.color = C.creamMuted; }}>
          Contact
        </a>
        <span style={{ color: C.creamMuted, margin: '0 12px' }}>·</span>
        <a href="https://ko-fi.com/inciteu" target="_blank" rel="noopener noreferrer"
           style={supportLinkStyle}
           onMouseEnter={(e) => { e.target.style.color = C.cream; }}
           onMouseLeave={(e) => { e.target.style.color = C.sage; }}>
          Support InciteU
        </a>
        <span style={{ color: C.creamMuted, margin: '0 12px' }}>·</span>
        <a href="https://www.linkedin.com/in/jenniferdianemay/" target="_blank" rel="noopener noreferrer"
           style={linkStyle}
           onMouseEnter={(e) => { e.target.style.color = C.sage; }}
           onMouseLeave={(e) => { e.target.style.color = C.creamMuted; }}>
          LinkedIn
        </a>
      </div>
    </footer>
  );
}
