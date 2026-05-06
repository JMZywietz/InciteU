import React from 'react';
import { C } from '../theme.js';

export function SelfIcon() {
  return (
    <svg viewBox="0 0 200 200" style={{ width: '100%', height: '100%' }}>
      <circle cx="100" cy="100" r="80" fill="none" stroke={C.sage} strokeWidth="1.5" opacity="0.6" />
      <circle cx="100" cy="100" r="55" fill="none" stroke={C.sage} strokeWidth="1.5" opacity="0.7" />
      <circle cx="100" cy="100" r="30" fill="none" stroke={C.sage} strokeWidth="1.5" opacity="0.85" />
      <circle cx="100" cy="100" r="10" fill={C.sage} />
    </svg>
  );
}

export function TeamIcon() {
  return (
    <svg viewBox="0 0 200 200" style={{ width: '100%', height: '100%' }}>
      <line x1="100" y1="40" x2="50" y2="140" stroke={C.sage} strokeWidth="1.5" opacity="0.7" />
      <line x1="100" y1="40" x2="150" y2="140" stroke={C.sage} strokeWidth="1.5" opacity="0.7" />
      <line x1="50" y1="140" x2="150" y2="140" stroke={C.sage} strokeWidth="1.5" opacity="0.7" />
      <circle cx="100" cy="40" r="16" fill={C.sage} />
      <circle cx="50" cy="140" r="16" fill={C.sage} />
      <circle cx="150" cy="140" r="16" fill={C.sage} />
    </svg>
  );
}

export function OrgIcon() {
  const nodes = [[40,50],[100,40],[160,60],[60,115],[100,100],[140,115],[50,165],[100,165],[150,165]];
  const lines = [[0,1],[1,2],[0,3],[1,4],[2,5],[3,4],[4,5],[3,6],[4,7],[5,8]];
  return (
    <svg viewBox="0 0 200 200" style={{ width: '100%', height: '100%' }}>
      {lines.map(([a,b], i) => (
        <line key={i} x1={nodes[a][0]} y1={nodes[a][1]} x2={nodes[b][0]} y2={nodes[b][1]} stroke={C.sage} strokeWidth="1.2" opacity="0.6" />
      ))}
      {nodes.map(([x,y], i) => (
        <circle key={i} cx={x} cy={y} r="9" fill={C.sage} />
      ))}
    </svg>
  );
}
