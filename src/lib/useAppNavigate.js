import { useNavigate as useRouterNavigate } from 'react-router-dom';
import { STATE_TO_PATH } from './routes.js';

// ============================================================================
// useAppNavigate — preserves v13's navigate(stateOrPath, anchor) signature
// ============================================================================
// Components in v13 call navigate('home'), navigate('lcp', 'tools-anchor'),
// navigate('home', 'tools-anchor'), etc. This shim maps those state IDs to
// real paths via STATE_TO_PATH and handles the anchor-after-paint scroll.
// Components don't need to change to use react-router — they just import
// this hook and call it the same way as before.
// ============================================================================

export function useAppNavigate() {
  const routerNavigate = useRouterNavigate();

  return function navigate(target, anchor) {
    const path = STATE_TO_PATH[target] || target; // accept raw paths too
    routerNavigate(path);

    // Wait for paint, then scroll. Mirrors v13's pattern exactly.
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (anchor) {
          const el = document.getElementById(anchor);
          if (el) { el.scrollIntoView({ behavior: 'smooth' }); return; }
        }
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    });
  };
}
