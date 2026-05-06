import { C, F } from './theme.js';

// ============================================================================
// STYLE HELPERS
// ============================================================================
export const btn = (variant = 'primary', disabled = false) => ({
  display: 'inline-block',
  background: 'transparent',
  color: disabled ? C.creamMuted : (variant === 'secondary' ? C.creamMuted : C.sage),
  textDecoration: 'none',
  fontFamily: F.sans,
  fontSize: 13,
  fontWeight: 400,
  letterSpacing: '0.2em',
  textTransform: 'uppercase',
  padding: '14px 32px',
  border: `1px solid ${disabled ? C.line : (variant === 'secondary' ? C.line : C.sageMuted)}`,
  borderRadius: 2,
  cursor: disabled ? 'not-allowed' : 'pointer',
  transition: 'all 0.3s ease',
  opacity: disabled ? 0.4 : 1,
});

export const heading = (size = 56) => ({
  fontFamily: F.serif,
  fontWeight: 400,
  fontSize: size,
  color: C.cream,
  lineHeight: 1.1,
  letterSpacing: '-0.01em',
  margin: 0,
});

export const eyebrow = {
  fontFamily: F.sans,
  fontSize: 11,
  letterSpacing: '0.3em',
  textTransform: 'uppercase',
  color: C.sage,
};

export const fieldLabel = {
  display: 'block',
  fontFamily: F.sans,
  fontSize: 13,
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  color: C.sage,
  marginBottom: 12,
};

export const fieldInput = {
  width: '100%',
  background: C.bgCard,
  border: `1px solid ${C.line}`,
  color: C.cream,
  padding: '16px 18px',
  fontFamily: F.sans,
  fontSize: 16,
  lineHeight: 1.6,
  borderRadius: 4,
  transition: 'border-color 0.3s',
  resize: 'vertical',
};

// Hover handlers for primary button
export const btnHoverIn = (e) => {
  e.target.style.background = C.sage;
  e.target.style.color = C.bgDeep;
  e.target.style.borderColor = C.sage;
};

export const btnHoverOut = (e) => {
  e.target.style.background = 'transparent';
  e.target.style.color = C.sage;
  e.target.style.borderColor = C.sageMuted;
};
