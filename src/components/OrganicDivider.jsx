import React from 'react';
import { C } from '../theme.js';

export default function OrganicDivider() {
  return (
    <div style={{ width: '100%', overflow: 'hidden', lineHeight: 0, padding: '20px 0 30px' }}>
      <svg viewBox="0 0 1200 80" preserveAspectRatio="none" style={{ width: '100%', height: 80, display: 'block' }}>
        <path d="M 0,40 Q 150,10 300,40 T 600,40 T 900,40 T 1200,40" fill="none" stroke={C.sage} strokeWidth="1" opacity="0.4" />
        <circle cx="600" cy="40" r="2.5" fill={C.sage} opacity="0.6" />
      </svg>
    </div>
  );
}
