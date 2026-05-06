import React from 'react';
import { C } from '../theme.js';

export default function Footer() {
  return (
    <footer style={{ padding: '24px 6vw', borderTop: `1px solid ${C.line}`, textAlign: 'center' }}>
      <small style={{ fontSize: 11, letterSpacing: '0.18em', color: C.creamMuted, textTransform: 'uppercase' }}>
        © InciteU · Jennifer May
      </small>
    </footer>
  );
}
