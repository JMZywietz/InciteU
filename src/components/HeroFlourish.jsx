import React from 'react';
import { C } from '../theme.js';

export default function HeroFlourish() {
  return (
    <svg viewBox="0 0 800 400" preserveAspectRatio="xMidYMid meet"
         style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '90%', maxWidth: 900, opacity: 0.10, zIndex: 2, pointerEvents: 'none' }}>
      <path d="M 50,200 Q 150,80 280,180 T 500,160 Q 620,140 720,240 Q 680,300 560,290 Q 420,280 320,300 Q 180,320 80,280 Q 30,240 50,200 Z" fill="none" stroke={C.sage} strokeWidth="1.5" opacity="0.7" />
      <path d="M 100,220 Q 200,140 320,200 T 540,200 Q 640,200 700,260" fill="none" stroke={C.sage} strokeWidth="1" opacity="0.5" />
      <circle cx="400" cy="200" r="3" fill={C.sage} opacity="0.7" />
    </svg>
  );
}
