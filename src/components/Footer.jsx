import React from 'react';
import { C } from '../theme.js';
import { useAppNavigate } from '../lib/useAppNavigate.js';

export default function Footer() {
  const navigate = useAppNavigate();
  const linkStyle = { color: C.creamMuted, textDecoration: 'none', cursor: 'pointer', transition: 'color 0.3s' };
  return (
    <footer style={{ padding: '24px 6vw', borderTop: `1px solid ${C.line}`, textAlign: 'center' }}>
      <small style={{ fontSize: 11, letterSpacing: '0.18em', color: C.creamMuted, textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>
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
