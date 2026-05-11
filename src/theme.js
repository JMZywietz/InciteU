// ============================================================================
// PALETTE & FONTS
// ============================================================================
export const C = {
  bgDeep: '#1F3937',
  bgCard: '#2A4744',
  bgCardHover: '#335552',
  // Per-category card backgrounds (Path A: subtle tinting)
  bgCardSelf: '#2A4744',       // existing sage-teal
  bgCardSelfHover: '#335552',
  bgCardTeam: '#33403B',       // distinctly warmer, earthy brown-green
  bgCardTeamHover: '#3D4B44',
  bgCardOrg: '#28464A',        // cooler, slightly more blue-teal
  bgCardOrgHover: '#325258',
  cream: '#F0EBDB',
  creamMuted: '#C9C2AE',
  sage: '#C5D49B',
  sageMuted: '#8FA876',
  sageDim: '#6B8159',
  line: 'rgba(240, 235, 219, 0.12)',
  lineStrong: 'rgba(240, 235, 219, 0.25)',
  warning: '#E2A57E',
  good: '#9FBE7F',
  okay: '#D4B96E',
  needsWork: '#D88A7A',
};

export const F = {
  serif: "'Cormorant Garamond', Georgia, serif",
  sans: "'Inter', -apple-system, sans-serif",
};

// TODO: self-host this once we have a Vercel deployment (handover step 10)
export const HERO_PHOTO = 'https://static.wixstatic.com/media/nsplsh_31476b5f45325357624c59~mv2_d_4928_3264_s_4_2.jpg/v1/fill/w_1800,h_1100,al_c,q_85/nsplsh_31476b5f45325357624c59~mv2_d_4928_3264_s_4_2.jpg';

export const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,400;1,500&family=Inter:wght@300;400;500&display=swap');
  body { margin: 0; background: ${C.bgDeep}; }
  * { box-sizing: border-box; }
  html { scroll-behavior: smooth; }
  body { -webkit-font-smoothing: antialiased; }
  ::-webkit-scrollbar { width: 8px; }
  ::-webkit-scrollbar-track { background: ${C.bgDeep}; }
  ::-webkit-scrollbar-thumb { background: ${C.bgCard}; border-radius: 4px; }
  @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
  textarea, input { font-family: inherit; }
  textarea:focus, input:focus { outline: none; }
`;
