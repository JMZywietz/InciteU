import React, { useEffect, useRef } from 'react';
import { useAppNavigate } from '../lib/useAppNavigate.js';
import { synthesize, extractText } from '../lib/synthesize.js';
import SEO from '../components/SEO.jsx';
import LSA_SCRIPT from './LCA_runtime.js?raw';

// ============================================================================
// LEADERSHIP CAPACITIES ANALYSIS
// ============================================================================
// FAITHFUL 1:1 PORT of the standalone five-layers-assessment.html.
//
// Strategy: the original is a complete, self-contained HTML/CSS/JS experience
// with its own multi-page state machine, capacity detail modals, and the
// Theoretical Foundations page. Rather than rewriting it in idiomatic React
// (which is what introduced silent content losses on the previous attempt),
// this React component is a thin shell:
//   1. Embeds the original CSS as a scoped string (every selector scoped to
//      .lsa-root so styles cannot leak into the rest of the site)
//   2. Renders the original HTML body via dangerouslySetInnerHTML
//   3. Runs the original JS in a useEffect on mount, which wires up the
//      original onclick handlers (startAssessment, openArchModal, etc.)
//   4. Adds: a back link to the InciteU homepage, and an optional AI
//      synthesis button on the results page
//
// This guarantees content fidelity. Future updates to the assessment should
// be made by editing /mnt/user-data/uploads/five-layers-assessment__1_.html
// (the source of truth) and re-running the porter.
// ============================================================================

const LSA_CSS = `
.lsa-root *, .lsa-root *::before, .lsa-root *::after {margin:0;padding:0;box-sizing:border-box}
.lsa-root {
  --bg:#FAF8F5;--surface:#FFFFFF;--surface2:#F5F2EE;
  --text:#1a1a1a;--text2:#4a4a4a;--text3:#888;--text4:#bbb;
  --border:#e8e3db;--border2:#d4cec6;
  --H:#D4A854;--H-bg:rgba(212,168,84,.08);--H-b:rgba(212,168,84,.32);
  --W:#A85454;--W-bg:rgba(168,84,84,.08);--W-b:rgba(168,84,84,.32);
  --L:#8B5E5E;--L-bg:rgba(139,94,94,.08);--L-b:rgba(139,94,94,.32);
  --S:#5B6B8B;--S-bg:rgba(91,107,139,.08);--S-b:rgba(91,107,139,.32);
  --V:#6B5B8B;--V-bg:rgba(107,91,139,.08);--V-b:rgba(107,91,139,.32);
  --fd:'Playfair Display',Georgia,serif;
  --fb:'Source Serif 4','Source Serif Pro',Georgia,serif;
  --fm:'IBM Plex Mono',monospace;
}
.lsa-root {scroll-behavior:smooth}
.lsa-root {font-family:var(--fb);background:var(--bg);color:var(--text);line-height:1.7;min-height:100vh;overflow-x:hidden}

/* ── PAGES ── */
.lsa-root .pg {display:none}
.lsa-root .pg.on {display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;padding:48px 20px}
.lsa-root #pg-results, .lsa-root #pg-foundations {justify-content:flex-start;padding:60px 20px 80px}

.lsa-root .inner {max-width:620px;width:100%}
.lsa-root .inner-w {max-width:780px;width:100%}

/* ── INTRO ── */
.lsa-root .intro-eyebrow {font-family:var(--fm);font-size:10px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--text3);margin-bottom:18px}
.lsa-root .intro-title {font-family:var(--fd);font-size:clamp(36px,7vw,62px);font-weight:800;letter-spacing:-.03em;line-height:1.04;margin-bottom:14px}
.lsa-root .intro-sub {font-size:clamp(16px,2.5vw,20px);color:var(--text2);font-style:italic;margin-bottom:32px;font-family:var(--fb)}
.lsa-root .intro-body {font-size:15px;color:var(--text2);line-height:1.78;margin-bottom:14px}
.lsa-root .intro-note {font-size:13px;color:var(--text3);line-height:1.6;font-style:italic;margin-bottom:30px}
.lsa-root .arch-pills {display:flex;gap:8px;flex-wrap:wrap;margin:20px 0 28px}
.lsa-root .apill {display:inline-flex;align-items:center;gap:5px;padding:5px 13px;border-radius:16px;border:1.5px solid;font-family:var(--fm);font-size:9px;font-weight:700;letter-spacing:.05em;text-transform:uppercase}

/* ── INTRO CAPACITY BOXES ── */
.lsa-root .intro-text-narrow {max-width:600px;margin-left:auto;margin-right:auto}
.lsa-root .intro-section {margin:34px 0 24px}
.lsa-root .intro-section-label {font-family:var(--fm);font-size:9px;font-weight:700;letter-spacing:.24em;text-transform:uppercase;color:var(--text3);text-align:center;margin-bottom:8px}
.lsa-root .intro-section-tagline {font-size:13px;color:var(--text3);font-style:italic;text-align:center;margin-bottom:20px;font-family:var(--fb);line-height:1.55;max-width:540px;margin-left:auto;margin-right:auto}
.lsa-root .arch-grid {display:flex;flex-wrap:wrap;justify-content:center;gap:14px}
.lsa-root .archbox {background:var(--surface);border:1px solid;border-radius:12px;padding:26px 18px 22px;text-align:center;width:220px;box-sizing:border-box;transition:transform .2s ease, box-shadow .2s ease;cursor:pointer;position:relative}
.lsa-root .archbox:hover {transform:translateY(-3px);box-shadow:0 8px 24px rgba(42,37,32,0.08)}
.lsa-root .archbox-hint {position:absolute;bottom:8px;left:0;right:0;font-family:var(--fm);font-size:8.5px;font-weight:600;letter-spacing:.14em;color:var(--text3);text-transform:uppercase;opacity:0;transition:opacity .2s ease}
.lsa-root .archbox:hover .archbox-hint {opacity:0.7}
.lsa-root .archbox-icon {display:block;margin:0 auto 14px;width:100px;height:100px}
.lsa-root .archbox-eyebrow {font-family:var(--fm);font-size:10px;font-weight:600;letter-spacing:.16em;text-transform:uppercase;margin-bottom:6px}
.lsa-root .archbox-name {font-family:var(--fd);font-size:18px;font-weight:700;color:var(--text);margin-bottom:10px;line-height:1.2}
.lsa-root .archbox-desc {font-size:13px;color:var(--text2);line-height:1.6}

@media (max-width: 540px){
  .lsa-root .archbox {width:100%;max-width:320px}
  .lsa-root .arch-grid {gap:12px}
  .lsa-root .intro-section {margin:28px 0 18px}
}

/* ── CAPACITY MODAL (home page click-to-expand + results page reuse) ── */
.lsa-root .arch-modal-backdrop {position:fixed;inset:0;background:rgba(42,37,32,0.55);backdrop-filter:blur(4px);-webkit-backdrop-filter:blur(4px);z-index:9000;display:none;align-items:flex-start;justify-content:center;padding:40px 20px;overflow-y:auto}
.lsa-root .arch-modal-backdrop.on {display:flex;animation:fade-in .22s ease}
@keyframes fade-in{from{opacity:0}to{opacity:1}}
.lsa-root .arch-modal {background:var(--surface);border-radius:14px;max-width:680px;width:100%;padding:0;position:relative;box-shadow:0 20px 60px rgba(42,37,32,0.25);animation:modal-rise .28s ease;margin:auto 0}
@keyframes modal-rise{from{transform:translateY(16px);opacity:0}to{transform:translateY(0);opacity:1}}
.lsa-root .arch-modal-close {position:absolute;top:14px;right:16px;background:transparent;border:none;font-size:26px;line-height:1;color:var(--text3);cursor:pointer;width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;transition:background .15s ease, color .15s ease;font-family:Georgia,serif;z-index:1}
.lsa-root .arch-modal-close:hover {background:rgba(0,0,0,0.05);color:var(--text)}
.lsa-root .arch-modal-hdr {padding:32px 36px 22px;border-bottom:1px solid var(--border);text-align:center}
.lsa-root .arch-modal-icon {width:84px;height:84px;display:block;margin:0 auto 14px}
.lsa-root .arch-modal-eyebrow {font-family:var(--fm);font-size:10px;font-weight:600;letter-spacing:.16em;text-transform:uppercase;margin-bottom:6px}
.lsa-root .arch-modal-title {font-family:var(--fd);font-size:24px;font-weight:700;color:var(--text);line-height:1.2;margin-bottom:6px}
.lsa-root .arch-modal-body {padding:24px 36px 36px}
.lsa-root .arch-modal-framing {font-size:14.5px;color:var(--text2);line-height:1.7;margin-bottom:24px;font-family:var(--fb)}
.lsa-root .arch-modal-framing em {font-style:italic;color:var(--text)}
.lsa-root .arch-sub-list {display:flex;flex-direction:column;gap:14px;margin-bottom:8px}
.lsa-root .arch-sub-item {padding-left:14px;border-left:3px solid;border-radius:1px}
.lsa-root .arch-sub-item-name {font-family:var(--fd);font-size:15px;font-weight:700;color:var(--text);margin-bottom:4px;line-height:1.3}
.lsa-root .arch-sub-item-desc {font-size:13.5px;color:var(--text2);line-height:1.6}
.lsa-root .arch-sub-item-desc strong {color:var(--text);font-weight:700}
.lsa-root .arch-sub-item-desc em {font-style:italic;color:var(--text)}
.lsa-root .arch-uncovered {margin-top:24px;padding:16px 18px;background:var(--surface2);border-radius:8px;border-left:3px solid var(--text3)}
.lsa-root .arch-uncovered-hdr {font-family:var(--fm);font-size:9px;font-weight:700;letter-spacing:.16em;text-transform:uppercase;color:var(--text3);margin-bottom:8px}
.lsa-root .arch-uncovered-name {font-family:var(--fd);font-size:14px;font-weight:700;color:var(--text2);margin-bottom:6px}
.lsa-root .arch-uncovered-note {font-size:12.5px;color:var(--text2);line-height:1.6}
.lsa-root .arch-uncovered-note strong {color:var(--text)}
.lsa-root .arch-uncovered-cta {font-size:12px;color:var(--text3);margin-top:10px;font-style:italic;line-height:1.55}

@media (max-width: 540px){
  .lsa-root .arch-modal {margin:0;border-radius:10px}
  .lsa-root .arch-modal-hdr {padding:26px 22px 18px}
  .lsa-root .arch-modal-body {padding:20px 22px 28px}
  .lsa-root .arch-modal-title {font-size:21px}
  .lsa-root .arch-modal-framing {font-size:13.5px}
  .lsa-root .arch-modal-icon {width:72px;height:72px}
  .lsa-root .arch-modal-backdrop {padding:0}
}

/* ── BUTTONS ── */
.lsa-root .btn {display:inline-flex;align-items:center;gap:8px;padding:13px 28px;border:none;border-radius:4px;font-family:var(--fm);font-size:11px;font-weight:700;letter-spacing:.07em;text-transform:uppercase;cursor:pointer;transition:opacity .2s,border-color .2s,color .2s;text-decoration:none}
.lsa-root .btn-dark {background:var(--text);color:var(--bg)}
.lsa-root .btn-dark:hover {opacity:.82}
.lsa-root .btn-ghost {background:transparent;color:var(--text3);border:1.5px solid var(--border2)}
.lsa-root .btn-ghost:hover {border-color:var(--text2);color:var(--text)}
.lsa-root .btn-sm {padding:10px 20px;font-size:10px}
.lsa-root .btn:disabled {opacity:.35;cursor:not-allowed}
.lsa-root .found-link {display:inline-block;font-family:var(--fm);font-size:10px;letter-spacing:.05em;color:var(--text3);text-decoration:none;border-bottom:1px solid var(--border2);padding-bottom:2px;transition:color .2s,border-color .2s}
.lsa-root .found-link:hover {color:var(--text);border-color:var(--text)}

/* ── PROGRESS ── */
.lsa-root .prog-wrap {width:100%;max-width:620px;margin-bottom:24px}
.lsa-root .prog-track {height:2px;background:var(--border);border-radius:2px;overflow:hidden}
.lsa-root .prog-fill {height:100%;background:var(--text);border-radius:2px;transition:width .55s ease}
.lsa-root .prog-meta {display:flex;justify-content:space-between;margin-top:7px}
.lsa-root .prog-lbl {font-family:var(--fm);font-size:9px;letter-spacing:.07em;text-transform:uppercase;color:var(--text3)}

/* ── QUESTION CARD ── */
.lsa-root .qcard {background:var(--surface);border-radius:12px;padding:30px 26px;border:1px solid var(--border);box-shadow:0 2px 28px rgba(0,0,0,.045);width:100%;max-width:620px}
.lsa-root .qtext {font-family:var(--fd);font-size:clamp(17px,2.8vw,21px);font-weight:600;line-height:1.42;margin-bottom:8px;color:var(--text)}
.lsa-root .qhint {font-family:var(--fm);font-size:10px;letter-spacing:.04em;color:var(--text3);margin-bottom:22px;font-style:italic}
.lsa-root .qhint span {font-style:normal;font-weight:600;color:var(--text2)}
.lsa-root .qphase {font-family:var(--fm);font-size:10px;font-weight:700;letter-spacing:.18em;text-transform:uppercase;color:var(--text3);margin-bottom:14px;opacity:0.85;display:flex;align-items:center;gap:10px}
.lsa-root .qphase-bar {display:inline-block;width:22px;height:1.5px;background:currentColor;opacity:0.5}
.lsa-root .qphase-num {opacity:0.6;font-weight:500}
.lsa-root .qopts {display:flex;flex-direction:column;gap:9px}
.lsa-root .qopt {display:flex;align-items:flex-start;gap:13px;padding:14px 16px;border:1.5px solid var(--border);border-radius:8px;cursor:pointer;transition:border-color .16s,background .16s;background:transparent;text-align:left;width:100%;font-family:var(--fb);font-size:14.5px;color:var(--text2);line-height:1.5}
.lsa-root .qopt:hover {border-color:var(--border2);background:rgba(0,0,0,.01)}
.lsa-root .qopt.sel {border-color:var(--text);background:rgba(0,0,0,.018);color:var(--text)}
.lsa-root .qopt.sel-1 {border-color:var(--H);background:var(--H-bg)}
.lsa-root .qopt.locked {cursor:not-allowed}
.lsa-root .qopt.locked:not(.sel) {opacity:.42}
.lsa-root .qopt-circle {width:24px;height:24px;border-radius:50%;border:2px solid var(--border2);display:flex;align-items:center;justify-content:center;font-family:var(--fm);font-size:11px;font-weight:700;color:transparent;background:transparent;flex-shrink:0;transition:all .15s;margin-top:1px}
.lsa-root .qopt.sel .qopt-circle {border-color:var(--text);background:var(--text);color:var(--bg)}

/* ── NAV ── */
.lsa-root .qnav {display:flex;justify-content:space-between;align-items:center;margin-top:18px;width:100%;max-width:620px}

/* ── PROCESSING ── */
.lsa-root .proc-wrap {text-align:center}
.lsa-root .proc-title {font-family:var(--fd);font-size:clamp(22px,4vw,30px);font-weight:700;margin-bottom:14px;color:var(--text)}
.lsa-root .proc-sub {font-family:var(--fm);font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:var(--text3);margin-bottom:28px}
.lsa-root .proc-dots {display:inline-flex;gap:8px}
.lsa-root .proc-dot {width:7px;height:7px;border-radius:50%;background:var(--text);opacity:.18;animation:dotPulse 1.4s infinite ease-in-out}
.lsa-root .proc-dot:nth-child(2) {animation-delay:.18s}
.lsa-root .proc-dot:nth-child(3) {animation-delay:.36s}
.lsa-root .proc-dot:nth-child(4) {animation-delay:.54s}
.lsa-root .proc-dot:nth-child(5) {animation-delay:.72s}
@keyframes dotPulse{0%,100%{opacity:.18;transform:scale(1)}30%{opacity:1;transform:scale(1.4)}}

/* ── RESULTS ── */
.lsa-root .r-header {text-align:center;margin-bottom:36px}
.lsa-root .r-eyebrow {font-family:var(--fm);font-size:10px;font-weight:700;letter-spacing:.09em;text-transform:uppercase;color:var(--text3);margin-bottom:10px}
.lsa-root .r-title {font-family:var(--fd);font-size:clamp(28px,5vw,46px);font-weight:800;letter-spacing:-.025em;line-height:1.08;margin-bottom:10px}
.lsa-root .r-sub {font-size:14px;color:var(--text3);font-style:italic}

/* Radar chart */
.lsa-root .radar-wrap {display:flex;flex-direction:column;align-items:center;margin-bottom:24px;padding:32px 0}
.lsa-root .radar-svg {max-width:580px;width:100%;height:auto}
.lsa-root .radar-axis {stroke:#d4cec6;stroke-width:1}
.lsa-root .radar-grid {fill:none;stroke:#e8e3db;stroke-width:1}
.lsa-root .radar-label {font-family:var(--fm);font-size:11px;font-weight:700;letter-spacing:.04em;text-transform:uppercase}
.lsa-root .radar-label-icon {font-size:14px}
.lsa-root .radar-poly-base {fill:rgba(212,168,84,.22);stroke:#D4A854;stroke-width:2;stroke-linejoin:round}
.lsa-root .radar-poly-press {fill:rgba(168,84,84,.18);stroke:#A85454;stroke-width:2;stroke-linejoin:round;stroke-dasharray:4,3}
.lsa-root .radar-pt {fill:#fff;stroke-width:2}
.lsa-root .radar-legend {display:flex;gap:18px;margin-top:14px;flex-wrap:wrap;justify-content:center}
.lsa-root .rleg {display:flex;align-items:center;gap:7px;font-family:var(--fm);font-size:10px;color:var(--text3);letter-spacing:.04em}
.lsa-root .rleg-swatch {width:16px;height:8px;border-radius:2px}

/* Section divider */
.lsa-root .sec-divider {font-family:var(--fm);font-size:9px;font-weight:700;letter-spacing:.09em;text-transform:uppercase;color:var(--text3);margin:32px 0 16px;padding-bottom:8px;border-bottom:1px solid var(--border)}

/* Result blocks */
.lsa-root .rblock {padding:20px 22px;border-radius:10px;border:1px solid var(--border);margin-bottom:14px;background:var(--surface)}
.lsa-root .rblock-lbl {font-family:var(--fm);font-size:9px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--text3);margin-bottom:9px}
.lsa-root .rblock-archs {display:flex;gap:10px;flex-wrap:wrap;margin-bottom:12px}
.lsa-root .r-archpill {display:inline-flex;align-items:center;gap:6px;padding:6px 13px;border-radius:18px;border:1.5px solid;font-family:var(--fd);font-size:14px;font-weight:700}
.lsa-root .r-archpill .ic {font-size:14px}
.lsa-root .rblock-body {font-size:13.5px;color:var(--text2);line-height:1.65}
.lsa-root .rblock-body+.rblock-body {margin-top:10px}
.lsa-root .rblock-body strong {color:var(--text)}

/* Gap callout */
.lsa-root .gapbox {background:var(--surface2);border:1px solid var(--border2);border-radius:10px;padding:22px;margin-bottom:14px}
.lsa-root .gapbox-lbl {font-family:var(--fm);font-size:9px;font-weight:700;letter-spacing:.09em;text-transform:uppercase;color:var(--text3);margin-bottom:9px}
.lsa-root .gapbox-headline {font-family:var(--fd);font-size:18px;font-weight:700;margin-bottom:10px;line-height:1.3}
.lsa-root .gapbox-body {font-size:13.5px;color:var(--text2);line-height:1.65}

/* Actions */
.lsa-root .r-actions {display:flex;gap:12px;justify-content:center;flex-wrap:wrap;margin-top:36px;padding-top:28px;border-top:1px solid var(--border)}

/* ── SUBSCALE BREAKDOWN (results page) ── */
.lsa-root .sub-section {margin-top:36px;padding-top:32px;border-top:1px solid var(--border)}
.lsa-root .sub-section-hdr {font-family:var(--fm);font-size:10px;font-weight:700;letter-spacing:.13em;text-transform:uppercase;color:var(--text3);text-align:center;margin-bottom:16px}
.lsa-root .sub-prompt {font-size:13.5px;color:var(--text2);line-height:1.7;text-align:center;max-width:540px;margin:0 auto 18px}
.lsa-root .sub-toggle-wrap {display:flex;justify-content:center;margin-bottom:20px}
.lsa-root .btn-sub-toggle {background:transparent;border:1px solid var(--border2);color:var(--text2);font-family:var(--fm);font-size:11px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;padding:11px 22px;border-radius:24px;cursor:pointer;transition:all .2s ease}
.lsa-root .btn-sub-toggle:hover {background:var(--surface2);border-color:var(--text3);color:var(--text)}
.lsa-root .sub-content {margin-top:8px}
.lsa-root .sub-content-intro {font-size:13px;color:var(--text2);line-height:1.7;background:var(--surface2);padding:16px 18px;border-radius:8px;margin-bottom:22px}
.lsa-root .sub-card {background:var(--surface);border:1px solid var(--border);border-left:4px solid;border-radius:10px;padding:22px;margin-bottom:14px}
.lsa-root .sub-card-hdr {display:flex;align-items:baseline;gap:12px;margin-bottom:18px;flex-wrap:wrap}
.lsa-root .sub-card-icon {font-size:20px;line-height:1}
.lsa-root .sub-card-name {font-family:var(--fd);font-size:19px;font-weight:700;flex:0 0 auto}
.lsa-root .sub-card-pct {font-family:var(--fm);font-size:10px;font-weight:600;letter-spacing:.05em;color:var(--text3);margin-left:auto;text-transform:uppercase}
.lsa-root .sub-rows {display:flex;flex-direction:column;gap:13px}
.lsa-root .sub-row {display:flex;flex-direction:column;gap:5px}
.lsa-root .sub-row-label {display:flex;justify-content:space-between;align-items:baseline;gap:8px}
.lsa-root .sub-row-name {font-family:var(--fb);font-size:13px;color:var(--text);font-weight:600}
.lsa-root .sub-row-meta {font-family:var(--fm);font-size:9px;color:var(--text3);letter-spacing:.04em;flex:0 0 auto}
.lsa-root .sub-row-bar {display:flex;align-items:center;gap:10px}
.lsa-root .sub-bar-track {flex:1;height:8px;background:var(--border);border-radius:4px;overflow:hidden}
.lsa-root .sub-bar-fill {height:100%;border-radius:4px}
.lsa-root .sub-row-pct {font-family:var(--fm);font-size:10px;font-weight:600;color:var(--text2);min-width:36px;text-align:right}
.lsa-root .sub-interp {font-size:13.5px;color:var(--text2);line-height:1.65;margin-top:18px;padding-top:14px;border-top:1px dashed var(--border)}
.lsa-root .sub-interp strong {color:var(--text);font-weight:700}
.lsa-root .sub-note {font-size:11.5px;color:var(--text3);font-style:italic;line-height:1.6;margin-top:10px}

/* ── CAPACITY DEEP-DIVE GRID (results page) ── */
.lsa-root .arch-deep-grid {display:grid;grid-template-columns:repeat(auto-fit, minmax(180px, 1fr));gap:10px;margin-top:8px}
.lsa-root .arch-deep-btn {background:var(--surface);border:1.5px solid;border-radius:10px;padding:18px 16px;font-family:var(--fb);cursor:pointer;display:flex;align-items:center;gap:10px;text-align:left;transition:transform .18s ease, box-shadow .18s ease, border-color .18s ease}
.lsa-root .arch-deep-btn:hover {transform:translateY(-2px);box-shadow:0 6px 18px rgba(42,37,32,0.07)}
.lsa-root .arch-deep-icon {font-size:18px;flex:0 0 auto}
.lsa-root .arch-deep-name {font-family:var(--fd);font-size:14.5px;font-weight:700;flex:1;line-height:1.2}
.lsa-root .arch-deep-arrow {font-family:var(--fm);font-size:14px;color:var(--text3);flex:0 0 auto;transition:transform .18s ease}
.lsa-root .arch-deep-btn:hover .arch-deep-arrow {transform:translateX(3px)}
.lsa-root .arch-deep-btn.active {transform:translateY(-1px);box-shadow:0 4px 14px rgba(42,37,32,0.09)}
.lsa-root .arch-deep-btn.active .arch-deep-arrow {transform:rotate(90deg)}
.lsa-root .arch-deep-panel {margin-top:18px;overflow:hidden;transition:max-height .35s ease, opacity .25s ease;max-height:0;opacity:0}
.lsa-root .arch-deep-panel.open {max-height:none;opacity:1;animation:archDeepFade .35s ease}
@keyframes archDeepFade {from{opacity:0;transform:translateY(-4px)} to{opacity:1;transform:translateY(0)}}
.lsa-root .arch-deep-panel .tia-arch {margin-bottom:0}

@media (max-width: 540px){
  .lsa-root .arch-deep-grid {grid-template-columns:1fr}
}

/* ── FOUNDATIONS PAGE ── */
.lsa-root .found-back {margin-bottom:22px}
.lsa-root .found-hdr {margin-bottom:24px}
.lsa-root .found-intro {margin-bottom:32px;padding-bottom:28px;border-bottom:1px solid var(--border)}
.lsa-root .found-intro p {font-size:14px;color:var(--text2);line-height:1.72;margin-bottom:14px}
.lsa-root .found-intro p:last-child {margin-bottom:0}

/* Jump-to-section nav */
.lsa-root .found-jump-nav {display:flex;flex-wrap:wrap;gap:10px;margin-top:22px}
.lsa-root .found-jump-btn {font-family:var(--fm);font-size:11px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--text2);background:var(--surface);border:1px solid var(--border2);border-radius:24px;padding:10px 18px;cursor:pointer;transition:all .18s ease;white-space:nowrap}
.lsa-root .found-jump-btn:hover {background:var(--text);color:var(--bg);border-color:var(--text);transform:translateY(-1px);box-shadow:0 4px 12px rgba(42,37,32,0.12)}
.lsa-root .found-jump-btn.active {background:var(--text);color:var(--bg);border-color:var(--text)}

/* Section wrappers and consistent section titles */
.lsa-root .found-section {margin-bottom:48px;scroll-margin-top:24px}
.lsa-root .found-section:last-of-type {margin-bottom:24px}
.lsa-root .found-section-title {font-family:var(--fd);font-size:clamp(22px,3.6vw,28px);font-weight:700;line-height:1.25;margin:0 0 22px;padding-bottom:14px;border-bottom:2px solid var(--text);color:var(--text)}
.lsa-root .found-section-title-sub {font-weight:400;font-style:italic;color:var(--text3);font-size:0.7em;letter-spacing:0;display:inline}

@media (max-width: 540px){
  .lsa-root .found-jump-nav {gap:8px}
  .lsa-root .found-jump-btn {padding:9px 14px;font-size:10px;flex:1 1 auto;text-align:center}
  .lsa-root .found-section-title {margin-bottom:18px;padding-bottom:11px}
  .lsa-root .found-section-title-sub {display:block;font-size:0.65em;margin-top:4px}
}

.lsa-root .fcard {margin-bottom:28px;padding:24px;border:1px solid var(--border);border-radius:10px;background:var(--surface);border-left:4px solid}
.lsa-root .fcard-hdr {display:flex;align-items:baseline;gap:10px;margin-bottom:6px;flex-wrap:wrap}
.lsa-root .fcard-icon {font-size:18px}
.lsa-root .fcard-name {font-family:var(--fd);font-size:18px;font-weight:700;line-height:1.2}
.lsa-root .fcard-theory {font-family:var(--fm);font-size:10px;font-weight:600;letter-spacing:.04em;text-transform:uppercase;color:var(--text3);margin-bottom:14px}
.lsa-root .fcard-row {margin-bottom:12px}
.lsa-root .fcard-row:last-child {margin-bottom:0}
.lsa-root .fcard-rlbl {font-family:var(--fm);font-size:9px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--text3);margin-bottom:5px}
.lsa-root .fcard-rbody {font-size:13px;color:var(--text2);line-height:1.6}
.lsa-root .fcard-rbody ul {list-style:none;padding:0;margin:0}
.lsa-root .fcard-rbody li {padding-left:14px;position:relative;margin-bottom:5px}
.lsa-root .fcard-rbody li::before {content:'·';position:absolute;left:4px;color:var(--text3);font-weight:700}
.lsa-root .fcard-rbody em {color:var(--text);font-style:normal;font-weight:600}
.lsa-root .fcard-rbody.gaps li::before {content:'⚠';font-size:9px;color:var(--W);left:0;top:2px}
.lsa-root .fcard-rbody.gaps li {padding-left:16px}
.lsa-root .fcard-note {font-size:12px;color:var(--text3);font-style:italic;line-height:1.6;margin-top:10px;padding-top:10px;border-top:1px dashed var(--border)}

.lsa-root .found-meth {margin-top:32px;padding:24px;background:var(--surface2);border-radius:10px;border:1px solid var(--border)}
.lsa-root .found-meth h3 {font-family:var(--fd);font-size:17px;font-weight:700;margin-bottom:12px}
.lsa-root .found-meth p {font-size:13px;color:var(--text2);line-height:1.65;margin-bottom:10px}
.lsa-root .found-meth p:last-child {margin-bottom:0}
.lsa-root .found-meth strong {color:var(--text);font-weight:600}
.lsa-root .found-meth-cite {font-family:var(--fm);font-size:11px;color:var(--text3);background:var(--bg);padding:10px 14px;border-radius:6px;margin:10px 0;line-height:1.55}

.lsa-root .found-isnot {display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-top:18px}
.lsa-root .found-isnot-cell {padding:18px;border-radius:8px;border:1px solid var(--border)}
.lsa-root .found-isnot-cell.is {background:rgba(123,139,68,.05);border-color:rgba(123,139,68,.3)}
.lsa-root .found-isnot-cell.isnot {background:rgba(168,84,84,.05);border-color:rgba(168,84,84,.3)}
.lsa-root .found-isnot-lbl {font-family:var(--fm);font-size:9px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;margin-bottom:8px}
.lsa-root .found-isnot-cell.is .found-isnot-lbl {color:#5B6B44}
.lsa-root .found-isnot-cell.isnot .found-isnot-lbl {color:var(--W)}
.lsa-root .found-isnot-body {font-size:12.5px;color:var(--text2);line-height:1.6}

/* ── COVERAGE MATRIX ── */
.lsa-root .cov-section {margin-top:36px;padding-top:32px;border-top:1px solid var(--border)}
.lsa-root .cov-section h3 {font-family:var(--fd);font-size:19px;font-weight:700;margin-bottom:11px;line-height:1.3}
.lsa-root .cov-section p {font-size:13.5px;color:var(--text2);line-height:1.7;margin-bottom:16px}
.lsa-root .cov-wrap {overflow-x:auto;margin:18px 0;border:1px solid var(--border);border-radius:8px;background:var(--surface);-webkit-overflow-scrolling:touch}
.lsa-root .cov-table {width:100%;border-collapse:collapse;font-family:var(--fb);min-width:560px}
.lsa-root .cov-table th {font-family:var(--fm);font-size:9px;font-weight:700;letter-spacing:.07em;text-transform:uppercase;color:var(--text3);padding:11px 12px;text-align:left;border-bottom:1px solid var(--border2);background:var(--surface2)}
.lsa-root .cov-table th.ctr {text-align:center;width:46px}
.lsa-root .cov-table td {font-size:12.5px;color:var(--text2);padding:10px 12px;border-bottom:1px solid var(--border);vertical-align:middle}
.lsa-root .cov-table td.ctr {text-align:center;font-family:var(--fm);font-weight:600;color:var(--text2)}
.lsa-root .cov-table td.ctr.tot {color:var(--text);font-weight:700}
.lsa-root .cov-table tbody tr:last-child td {border-bottom:0}
.lsa-root .cov-arch-row {background:var(--surface2)}
.lsa-root .cov-arch-row td {font-family:var(--fm);font-size:10px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;padding:10px 12px;border-top:1px solid var(--border2)}
.lsa-root .cov-note {font-size:12px;color:var(--text3);font-style:italic;margin-top:14px;line-height:1.65}

/* ── THEORY IN ACTION (Foundations page deep section) ── */
.lsa-root .tia-section {margin-top:36px;padding-top:32px;border-top:1px solid var(--border)}
.lsa-root .tia-section h3 {font-family:var(--fd);font-size:24px;font-weight:700;margin-bottom:14px;line-height:1.3}
.lsa-root .tia-section > p {font-size:15px;color:var(--text2);line-height:1.7;margin-bottom:24px;font-style:italic}

/* Sticky capacity jump nav */
.lsa-root .tia-nav {position:sticky;top:0;z-index:50;background:var(--bg);display:flex;flex-wrap:wrap;gap:8px;padding:14px 0;margin-bottom:16px;border-bottom:1px solid var(--border);justify-content:center}
.lsa-root .tia-pill {display:inline-flex;align-items:center;gap:8px;padding:9px 16px 9px 11px;background:var(--surface);border:1px solid var(--border);border-radius:24px;text-decoration:none;font-family:var(--fm);font-size:12px;font-weight:600;letter-spacing:.05em;color:var(--text2);transition:transform .18s ease, box-shadow .18s ease, border-color .18s ease;cursor:pointer}
.lsa-root .tia-pill:hover {transform:translateY(-1px);box-shadow:0 4px 12px rgba(42,37,32,0.06);border-color:var(--pill-color)}
.lsa-root .tia-pill:hover .tia-pill-label {color:var(--pill-color)}
.lsa-root .tia-pill.active {border-color:var(--pill-color);background:var(--surface);box-shadow:0 0 0 1px var(--pill-color) inset}
.lsa-root .tia-pill.active .tia-pill-label {color:var(--pill-color)}
.lsa-root .tia-pill-icon {display:inline-flex;width:24px;height:24px;flex:0 0 auto}
.lsa-root .tia-pill-icon svg {width:100%;height:100%}
.lsa-root .tia-pill-label {transition:color .18s ease}

/* Capacity CARD — single bordered container per capacity */
.lsa-root .tia-arch {background:var(--surface);border:1px solid var(--border);border-left:4px solid var(--arch-color);border-radius:12px;padding:0;margin-bottom:28px;scroll-margin-top:90px;overflow:hidden}
.lsa-root .tia-arch:last-child {margin-bottom:0}

/* Top section of the card: icon-box (left) + headline + subscales (right) */
.lsa-root .tia-arch-top {display:grid;grid-template-columns:200px 1fr;gap:0;border-bottom:1px solid var(--border)}

.lsa-root .tia-arch-iconbox {background:var(--surface2);padding:32px 20px;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;border-right:1px solid var(--border)}
.lsa-root .tia-arch-iconbox-svg {width:96px;height:96px;margin-bottom:14px}
.lsa-root .tia-arch-iconbox-svg svg {width:100%;height:100%;display:block}
.lsa-root .tia-arch-iconbox-label {font-family:var(--fd);font-size:21px;font-weight:700;line-height:1.2;color:var(--arch-color)}

.lsa-root .tia-arch-content {padding:32px 32px 28px;font-size:15.5px;color:var(--text2);line-height:1.75}
.lsa-root .tia-arch-content p {margin-bottom:14px}
.lsa-root .tia-arch-content p:last-child {margin-bottom:0}
.lsa-root .tia-arch-content strong {color:var(--text);font-weight:700}
.lsa-root .tia-arch-content em {font-style:italic}

/* The framing paragraph — opens the right column */
.lsa-root .tia-framing {font-size:15px;color:var(--text);font-style:italic;padding:0;margin:0 0 22px;line-height:1.7}

/* Subscale definition list */
.lsa-root .tia-subscales {display:flex;flex-direction:column;gap:16px;margin:0;padding:0}
.lsa-root .tia-subscales dt {font-family:var(--fd);font-size:17px;font-weight:700;color:var(--text);margin-bottom:5px;border-left:3px solid var(--arch-color);padding-left:14px;line-height:1.3}
.lsa-root .tia-subscales dd {margin:0 0 0 17px;font-size:14.5px;color:var(--text2);line-height:1.65;padding-left:0}
.lsa-root .tia-subscales dd em {font-style:italic;color:var(--text)}

.lsa-root .tia-sublist {margin:10px 0 0;padding-left:22px;list-style:disc}
.lsa-root .tia-sublist li {margin-bottom:7px;font-size:14.5px;color:var(--text2);line-height:1.6}
.lsa-root .tia-sublist li em {font-style:italic;color:var(--text);font-weight:600}

/* Bottom section of the card: combinations + "also worth knowing", spans full width */
.lsa-root .tia-arch-bottom {padding:28px 32px 32px}
.lsa-root .tia-h4 {font-family:var(--fd);font-size:17px;font-weight:700;color:var(--arch-color);margin:0 0 12px;letter-spacing:0;line-height:1.35}
.lsa-root .tia-arch-bottom > .tia-h4:first-child {margin-top:0}
.lsa-root .tia-arch-bottom .tia-h4 {margin-top:26px}
.lsa-root .tia-arch-bottom p {font-size:15px;color:var(--text2);line-height:1.75;margin-bottom:14px}
.lsa-root .tia-arch-bottom p:last-child {margin-bottom:0}
.lsa-root .tia-arch-bottom strong {color:var(--text);font-weight:700}
.lsa-root .tia-arch-bottom em {font-style:italic}

@media (max-width: 720px){
  .lsa-root .tia-arch-top {grid-template-columns:1fr}
  .lsa-root .tia-arch-iconbox {border-right:0;border-bottom:1px solid var(--border);padding:24px 20px}
  .lsa-root .tia-arch-iconbox-svg {width:80px;height:80px;margin-bottom:10px}
  .lsa-root .tia-arch-iconbox-label {font-size:19px}
  .lsa-root .tia-arch-content {padding:24px 22px 22px}
  .lsa-root .tia-arch-bottom {padding:22px 22px 26px}
}

@media (max-width: 540px){
  .lsa-root .tia-nav {padding:10px 0;gap:6px}
  .lsa-root .tia-pill {padding:6px 12px 6px 9px;font-size:11px}
  .lsa-root .tia-pill-icon {width:20px;height:20px}
  .lsa-root .tia-pill-label {display:none}
  .lsa-root .tia-section h3 {font-size:21px}
  .lsa-root .tia-section > p {font-size:14px}
  .lsa-root .tia-arch {scroll-margin-top:78px;margin-bottom:22px}
  .lsa-root .tia-arch-iconbox-svg {width:70px;height:70px}
  .lsa-root .tia-arch-iconbox-label {font-size:18px}
  .lsa-root .tia-arch-content {font-size:14.5px;padding:20px 18px}
  .lsa-root .tia-framing {font-size:14px}
  .lsa-root .tia-subscales dt {font-size:15.5px}
  .lsa-root .tia-subscales dd {font-size:13.5px}
  .lsa-root .tia-arch-bottom {padding:18px 18px 22px}
  .lsa-root .tia-arch-bottom p {font-size:14px}
  .lsa-root .tia-h4 {font-size:15.5px}
}

/* ── CHAIN: emotion as diagnostic (cross-cutting view) ── */
.lsa-root .chain-block {margin-top:48px;padding-top:36px;border-top:1px solid var(--border)}
.lsa-root .chain-title {font-family:var(--fd);font-size:clamp(20px,3vw,26px);font-weight:700;line-height:1.25;margin:0 0 14px;color:var(--text)}
.lsa-root .chain-title-sub {font-weight:400;font-style:italic;color:var(--text3);font-size:0.7em;letter-spacing:0}
.lsa-root .chain-intro {font-size:15px;color:var(--text2);line-height:1.7;margin:0 0 26px}
.lsa-root .chain-intro strong {color:var(--text);font-weight:600}
.lsa-root .chain-grid {display:flex;flex-direction:column;gap:6px;background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:14px;overflow-x:auto}
.lsa-root .chain-grid-header {display:grid;grid-template-columns:180px repeat(5,1fr);gap:6px;padding:0 0 14px;border-bottom:1px solid var(--border);margin-bottom:8px;min-width:680px}
.lsa-root .chain-substrate {font-family:var(--fm);font-size:10px;font-weight:700;letter-spacing:.09em;text-transform:uppercase;color:var(--sub-color);text-align:center;padding:6px 4px;border-bottom:2px solid var(--sub-color)}
.lsa-root .chain-row {display:grid;grid-template-columns:180px repeat(5,1fr);gap:6px;align-items:stretch;min-width:680px}
.lsa-root .chain-row-label {padding:11px 13px;border-left:3px solid var(--row-color);background:var(--surface2);border-radius:6px;display:flex;flex-direction:column;justify-content:center}
.lsa-root .chain-row-name {font-family:var(--fd);font-size:14px;font-weight:700;color:var(--text);line-height:1.3;margin-bottom:3px}
.lsa-root .chain-row-desc {font-family:var(--fm);font-size:9.5px;font-weight:600;letter-spacing:.04em;text-transform:uppercase;color:var(--text3)}
.lsa-root .chain-cell {padding:11px 10px;font-size:13px;color:var(--text2);text-align:center;background:var(--surface);border-radius:6px;border:1px solid var(--border);line-height:1.35;display:flex;align-items:center;justify-content:center}
.lsa-root .chain-foot {font-size:13.5px;color:var(--text2);line-height:1.7;margin:24px 0 0;padding:18px 22px;background:var(--surface2);border-radius:8px;border-left:3px solid var(--text4)}
.lsa-root .chain-foot em {font-style:italic;color:var(--text);font-weight:600}

@media (max-width:760px) {
  .lsa-root .chain-block {margin-top:36px;padding-top:28px}
  .lsa-root .chain-grid {padding:10px}
  .lsa-root .chain-grid-header,
  .lsa-root .chain-row {grid-template-columns:130px repeat(5,minmax(78px,1fr));gap:5px;min-width:590px}
  .lsa-root .chain-row-label {padding:8px 10px}
  .lsa-root .chain-row-name {font-size:12px}
  .lsa-root .chain-row-desc {font-size:8.5px}
  .lsa-root .chain-cell {padding:9px 6px;font-size:11.5px}
  .lsa-root .chain-substrate {font-size:9px;letter-spacing:.06em}
}

/* ── FOOTER ── */
.lsa-root .footer {text-align:center;padding:32px 20px 20px;font-size:11px;color:var(--text4);font-style:italic}

/* ── TOAST ── */
.lsa-root .toast {position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:var(--text);color:var(--bg);padding:9px 20px;border-radius:16px;font-family:var(--fm);font-size:10px;letter-spacing:.04em;opacity:0;transition:opacity .28s;pointer-events:none;z-index:200;white-space:nowrap}
.lsa-root .toast.on {opacity:1}

.lsa-root .fade-up {animation:fuAnim .38s ease forwards}
@keyframes fuAnim{from{opacity:0;transform:translateY(13px)}to{opacity:1;transform:translateY(0)}}

@media(max-width:580px){
  .lsa-root .qcard {padding:24px 18px}
  .lsa-root .found-isnot {grid-template-columns:1fr}
  .lsa-root .fcard {padding:20px 18px}
  .lsa-root .radar-svg {max-width:460px}
}

/* ── HEADLINE TAKEAWAY (results page) ── */
.lsa-root .r-headline-block {margin-bottom:36px;text-align:center;padding:0 8px}
.lsa-root .r-headline {font-family:var(--fd);font-size:clamp(18px,3.4vw,26px);font-weight:600;line-height:1.45;color:var(--text);margin:8px 0 0;letter-spacing:-0.005em}
.lsa-root .r-headline strong {font-weight:700}

/* ── RESULTS GRAPH (bar default + radar toggle) ── */
.lsa-root .r-graph {margin-bottom:34px;padding:24px 0}
.lsa-root .graph-toggle {display:flex;justify-content:center;gap:6px;margin-bottom:18px;padding:4px;background:rgba(0,0,0,.025);border-radius:8px;width:fit-content;margin-left:auto;margin-right:auto}
.lsa-root .graph-toggle-btn {font-family:var(--fm);font-size:11px;font-weight:600;letter-spacing:.06em;padding:8px 16px;border:none;background:transparent;color:var(--text3);cursor:pointer;border-radius:5px;transition:all .14s}
.lsa-root .graph-toggle-btn:hover {color:var(--text2)}
.lsa-root .graph-toggle-btn.active {background:var(--surface);color:var(--text);box-shadow:0 1px 4px rgba(0,0,0,.06)}
.lsa-root .graph-container {position:relative;min-height:240px;display:flex;justify-content:center}
.lsa-root .graph-mode-bar, .lsa-root .graph-mode-radar {width:100%;max-width:520px}
.lsa-root .bar-svg {width:100%;height:auto;display:block}
.lsa-root .bar-label {font-family:var(--fb);font-size:13px}
.lsa-root .bar-label-icon {font-size:14px}
.lsa-root .bar-pct {font-family:var(--fm);font-size:10px;font-weight:600}
.lsa-root .bar-gap {font-family:var(--fm);font-size:10px;font-weight:500;letter-spacing:.04em}
.lsa-root .graph-legend {display:flex;justify-content:center;gap:22px;margin-top:14px;flex-wrap:wrap}

/* ── SO WHAT block (results page) ── */
.lsa-root .sowhat-watchfor, .lsa-root .sowhat-reflect {margin-bottom:30px}
.lsa-root .sowhat-hdr {font-family:var(--fm);font-size:11px;font-weight:700;letter-spacing:.18em;text-transform:uppercase;color:var(--text3);margin-bottom:14px;padding-bottom:8px;border-bottom:1px solid var(--border)}

/* ── WATCH-FOR cards ── */
.lsa-root .watchfor-grid {display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:14px}
.lsa-root .watchfor-card {padding:18px 20px;background:var(--wf-bg);border:1px solid var(--wf-border);border-left:3px solid var(--wf-color);border-radius:8px;display:flex;flex-direction:column}
.lsa-root .watchfor-arch {font-family:var(--fb);font-size:14px;font-weight:700;color:var(--wf-color);margin-bottom:8px}
.lsa-root .watchfor-body {font-family:var(--fb);font-size:14px;line-height:1.55;color:var(--text2);margin-bottom:12px;flex-grow:1}
.lsa-root .watchfor-link {font-family:var(--fm);font-size:11px;font-weight:600;letter-spacing:.06em;color:var(--wf-color);text-decoration:none;align-self:flex-start;border-bottom:1px solid transparent;transition:border-color .14s}
.lsa-root .watchfor-link:hover {border-bottom-color:currentColor}

/* ── REFLECTION PROMPTS ── */
.lsa-root .reflect-list {list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:14px}
.lsa-root .reflect-list li {padding:14px 18px;background:rgba(0,0,0,.02);border-left:2px solid var(--border2);border-radius:0 6px 6px 0;font-family:var(--fb);font-size:14.5px;line-height:1.55;color:var(--text2)}
.lsa-root .reflect-list li strong {font-family:var(--fm);font-size:11px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;display:block;margin-bottom:5px}

/* ── GOING DEEPER (expandable per-capacity component scores) ── */
.lsa-root .going-deeper-section {margin-bottom:36px}
.lsa-root .going-deeper-content {display:flex;flex-direction:column;gap:18px;margin-top:18px}
.lsa-root .gd-card {padding:18px 20px;background:var(--surface);border:1px solid var(--border);border-left:3px solid var(--gd-color);border-radius:8px}
.lsa-root .gd-arch-hdr {font-family:var(--fb);font-size:15px;font-weight:700;color:var(--text);margin-bottom:6px;display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.lsa-root .gd-icon {font-size:16px}
.lsa-root .gd-tagline {font-family:var(--fb);font-size:12px;font-weight:400;font-style:italic;color:var(--text3);margin-left:4px}
.lsa-root .gd-body {font-family:var(--fb);font-size:13.5px;line-height:1.55;color:var(--text2);margin:8px 0 14px}
.lsa-root .gd-subscales {display:flex;flex-direction:column;gap:8px;padding-top:10px;border-top:1px dashed var(--border)}
.lsa-root .gd-subscale {display:grid;grid-template-columns:1fr 100px 56px;gap:10px;align-items:center;font-family:var(--fb);font-size:12px}
.lsa-root .gd-subscale-label {color:var(--text2);font-weight:500}
.lsa-root .gd-subscale-bar {height:6px;background:rgba(0,0,0,.05);border-radius:3px;overflow:hidden}
.lsa-root .gd-subscale-fill {height:100%;border-radius:3px;transition:width .3s ease}
.lsa-root .gd-subscale-score {font-family:var(--fm);font-size:10px;font-weight:600;color:var(--text3);text-align:right}

/* ── SHOW ALL CAPACITIES button ── */
.lsa-root .show-all-wrap {text-align:center;margin-top:14px}
.lsa-root .btn-show-all {font-family:var(--fm);font-size:11px;font-weight:600;letter-spacing:.12em;text-transform:uppercase;padding:10px 22px;background:transparent;color:var(--text3);border:1px dashed var(--border2);border-radius:6px;cursor:pointer;transition:all .14s}
.lsa-root .btn-show-all:hover {color:var(--text);border-color:var(--text2)}
.lsa-root .arch-deep-grid-others {margin-top:14px}

/* ── MOBILE adjustments ── */
@media (max-width:520px){
  .lsa-root .gd-subscale {grid-template-columns:1fr 70px 50px;gap:8px}
  .lsa-root .watchfor-grid {grid-template-columns:1fr}
  .lsa-root .r-headline {font-size:18px}
}


/* ── NEW RESULTS UI — slider, sub-archetype panels, capacity bars ── */
.lsa-root .r-headline { font-size: 18px; line-height: 1.55; margin-bottom: 28px; padding: 20px 24px; background: var(--surface2); border-left: 3px solid var(--H); border-radius: 0 4px 4px 0; }
.lsa-root .r-headline-line { margin: 8px 0; }
.lsa-root .r-sec-title { font-family: var(--fd); font-size: 24px; font-weight: 700; margin: 40px 0 8px; }
.lsa-root .r-sec-sub { font-size: 14px; color: var(--text3); margin-bottom: 18px; }

.lsa-root .drive-slider { margin: 16px 0 8px; }
.lsa-root .drive-slider-bar { position: relative; height: 32px; border-radius: 16px; overflow: hidden; display: flex; background: var(--surface2); border: 1px solid var(--border); }
.lsa-root .drive-slider-thr, .lsa-root .drive-slider-prt { height: 100%; transition: width 0.4s ease; }
.lsa-root .drive-slider-marker { position: absolute; top: -4px; bottom: -4px; width: 3px; background: var(--text); transform: translateX(-1.5px); }
.lsa-root .drive-slider-labels { display: flex; justify-content: space-between; margin-top: 8px; font-family: var(--fm); font-size: 11px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; }

.lsa-root .subarch-panel { margin: 14px 0; border-radius: 4px; border-left: 3px solid; padding: 12px 16px; }
.lsa-root .subarch-summary { cursor: pointer; font-family: var(--fm); font-size: 12px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; padding: 4px 0; }
.lsa-root .subarch-body { padding-top: 12px; }
.lsa-root .subarch-item { padding: 10px 0; border-bottom: 1px solid var(--border); }
.lsa-root .subarch-item:last-child { border-bottom: none; }
.lsa-root .subarch-top { background: var(--surface2); padding: 12px; border-radius: 4px; margin-bottom: 8px; }
.lsa-root .subarch-head { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 4px; }
.lsa-root .subarch-name { font-size: 16px; font-weight: 700; }
.lsa-root .subarch-pct { font-family: var(--fm); font-size: 11px; color: var(--text3); }
.lsa-root .subarch-tagline { font-style: italic; color: var(--text3); font-size: 12px; margin-bottom: 8px; }
.lsa-root .subarch-access, .lsa-root .subarch-limit { font-size: 14px; margin: 6px 0; line-height: 1.55; }
.lsa-root .subarch-prompt { font-size: 14px; margin: 8px 0; color: var(--text2); padding-left: 14px; border-left: 2px solid var(--border2); }

.lsa-root .cap-bars-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin: 16px 0; }
@media (max-width: 700px) { .lsa-root .cap-bars-grid { grid-template-columns: 1fr; } }
.lsa-root .cap-col { padding: 16px; background: var(--surface2); border-radius: 4px; }
.lsa-root .cap-col-title { font-size: 16px; font-weight: 700; margin-bottom: 4px; }
.lsa-root .cap-col-sub { font-size: 12px; color: var(--text3); margin-bottom: 14px; }
.lsa-root .cap-bar-row { display: grid; grid-template-columns: 110px 1fr 38px; align-items: center; gap: 8px; margin: 6px 0; padding: 4px 0; }
.lsa-root .cap-bar-label { font-size: 13px; font-weight: 600; }
.lsa-root .cap-bar-track { background: var(--surface); height: 14px; border-radius: 7px; overflow: hidden; }
.lsa-root .cap-bar-fill { height: 100%; transition: width 0.4s ease; }
.lsa-root .cap-bar-pct { font-family: var(--fm); font-size: 12px; color: var(--text3); text-align: right; }
.lsa-root .cap-bar-top { background: rgba(212,168,84,.06); border-left: 2px solid var(--H); padding-left: 6px; }
.lsa-root .cap-bar-bot { opacity: 0.55; }
.lsa-root .cap-legend { display: flex; gap: 18px; font-size: 12px; color: var(--text3); margin-top: 12px; padding-left: 16px; }
.lsa-root .cap-legend-dot { display: inline-block; width: 10px; height: 10px; border-radius: 2px; margin-right: 6px; vertical-align: middle; }
.lsa-root .cap-legend .cap-bar-top { background: var(--H); border: none; padding: 0; width: 10px; height: 10px; }
.lsa-root .cap-legend .cap-bar-bot { background: var(--text4); border: none; padding: 0; width: 10px; height: 10px; opacity: 1; }

.lsa-root .r-prompts { list-style: none; padding: 0; margin: 14px 0; }
.lsa-root .r-prompts li { padding: 10px 14px; margin: 8px 0; background: var(--surface2); border-radius: 4px; font-size: 14px; line-height: 1.55; border-left: 2px solid var(--border2); }


/* ── Likert items (drive intensity check) ── */
.lsa-root .likert-scale-legend { display: flex; justify-content: space-between; font-size: 12px; color: var(--text4); margin: 10px 0 14px; padding: 0 4px; }
.lsa-root .likert-items { display: flex; flex-direction: column; gap: 14px; margin: 8px 0 4px; }
.lsa-root .likert-item { padding: 14px 16px; background: var(--surface2); border-radius: 6px; border: 1px solid var(--border1); }
.lsa-root .likert-text { font-size: 15px; line-height: 1.45; margin-bottom: 12px; color: var(--text1); }
.lsa-root .likert-scale { display: flex; gap: 8px; justify-content: space-between; }
.lsa-root .likert-btn { flex: 1 1 0; min-width: 40px; padding: 10px 6px; background: var(--surface1); border: 1.5px solid var(--border2); color: var(--text2); border-radius: 4px; font-size: 15px; font-weight: 500; cursor: pointer; transition: all 0.15s ease; }
.lsa-root .likert-btn:hover { background: var(--surface3); border-color: var(--text4); }
.lsa-root .likert-btn.sel { background: var(--H); border-color: var(--H); color: var(--bg); font-weight: 700; }
@media (max-width: 480px) {
  .lsa-root .likert-btn { padding: 12px 4px; font-size: 16px; min-width: 0; }
  .lsa-root .likert-scale { gap: 4px; }
}

/* ── 2x2 Drive Grid ── */
.lsa-root .grid-2x2-wrap { display: flex; flex-direction: column; align-items: center; gap: 18px; margin: 18px 0 28px; padding: 14px; background: var(--surface2); border-radius: 8px; border: 1px solid var(--border1); }
.lsa-root .grid-2x2 { width: 100%; max-width: 360px; height: auto; display: block; }
.lsa-root .grid-2x2-quadrant { width: 100%; max-width: 460px; text-align: center; padding: 4px 12px 0; }
.lsa-root .grid-2x2-label { font-size: 18px; font-weight: 700; color: var(--text1); margin-bottom: 8px; }
.lsa-root .grid-2x2-desc { font-size: 14px; line-height: 1.5; color: var(--text3); margin-bottom: 12px; }
.lsa-root .grid-2x2-scores { display: flex; justify-content: center; gap: 22px; font-size: 14px; font-weight: 600; flex-wrap: wrap; }

`;

const LSA_BODY_HTML = `

<!-- ═══════════════════════════════════ INTRO ═══════════════════════════════════ -->
<div id="pg-intro" class="pg on">
  <div class="inner-w">
    <div class="intro-text-narrow">
      <div class="intro-eyebrow">Incite Leadership · Five Layers Deep</div>
      <h1 class="intro-title">Five Core Capacities</h1>
      <p class="intro-sub">Which of your Five Core Capacities do you lead with at baseline — and which one takes over when you're under pressure?</p>

      <p class="intro-body">This assessment maps three things: which capacities you draw on in everyday conditions, which you default to when stakes are high, and which you may underuse overall. The most diagnostic finding is the <em>gap</em> — the capacity that goes offline when you're stressed.</p>
    </div>

    <!-- ─── BASIC DRIVE CAPACITIES ─── -->
    <div class="intro-section">
      <div class="intro-section-label">— Basic drive capacities —</div>
      <div class="intro-section-tagline">Motivational systems that move you</div>
      <div class="arch-grid">

        <!-- HEDONIST -->
        <div class="archbox" style="border-color:var(--H-b)" onclick="openArchModal('hedonist')" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();openArchModal('hedonist')}" role="button" tabindex="0" aria-label="Learn more about The Hedonist">
          <svg class="archbox-icon" viewBox="0 0 120 120" role="img" aria-label="Hedonist sun">
            <title>Hedonist sun</title>
            <circle cx="60" cy="60" r="54" fill="rgba(212,168,84,0.06)"/>
            <g stroke="#D4A854" stroke-width="2" stroke-linecap="round">
              <line x1="60" y1="14" x2="60" y2="26"/>
              <line x1="60" y1="94" x2="60" y2="106"/>
              <line x1="14" y1="60" x2="26" y2="60"/>
              <line x1="94" y1="60" x2="106" y2="60"/>
              <line x1="27.5" y1="27.5" x2="36" y2="36"/>
              <line x1="84" y1="84" x2="92.5" y2="92.5"/>
              <line x1="92.5" y1="27.5" x2="84" y2="36"/>
              <line x1="36" y1="84" x2="27.5" y2="92.5"/>
            </g>
            <g stroke="#D4A854" stroke-width="1.3" stroke-linecap="round" stroke-opacity="0.6">
              <line x1="40" y1="18" x2="43.5" y2="27.5"/>
              <line x1="80" y1="18" x2="76.5" y2="27.5"/>
              <line x1="40" y1="102" x2="43.5" y2="92.5"/>
              <line x1="80" y1="102" x2="76.5" y2="92.5"/>
              <line x1="18" y1="40" x2="27.5" y2="43.5"/>
              <line x1="18" y1="80" x2="27.5" y2="76.5"/>
              <line x1="102" y1="40" x2="92.5" y2="43.5"/>
              <line x1="102" y1="80" x2="92.5" y2="76.5"/>
            </g>
            <circle cx="60" cy="60" r="20" fill="rgba(212,168,84,0.08)" stroke="#D4A854" stroke-width="1.8"/>
            <circle cx="60" cy="60" r="3" fill="#D4A854"/>
          </svg>
          <div class="archbox-eyebrow" style="color:var(--H)">The Hedonist</div>
          <div class="archbox-name">Vitality and appetite</div>
          <div class="archbox-desc">You move toward what feels alive. Pleasure, energy, instinct — the life force itself, expressed.</div>
          <div class="archbox-hint">Tap for more →</div>
        </div>

        <!-- WARRIOR -->
        <div class="archbox" style="border-color:var(--W-b)" onclick="openArchModal('warrior')" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();openArchModal('warrior')}" role="button" tabindex="0" aria-label="Learn more about The Warrior">
          <svg class="archbox-icon" viewBox="0 0 120 120" role="img" aria-label="Warrior shield">
            <title>Warrior shield</title>
            <circle cx="60" cy="60" r="54" fill="rgba(168,84,84,0.06)"/>
            <path d="M 60 24 L 92 32 L 92 60 Q 92 84 60 102 Q 28 84 28 60 L 28 32 Z" fill="rgba(168,84,84,0.08)" stroke="#A85454" stroke-width="1.8" stroke-linejoin="round"/>
            <path d="M 60 32 L 84 38 L 84 60 Q 84 78 60 92 Q 36 78 36 60 L 36 38 Z" fill="none" stroke="#A85454" stroke-width="0.8" stroke-opacity="0.5"/>
            <circle cx="60" cy="22" r="3.2" fill="none" stroke="#A85454" stroke-width="1.5"/>
            <line x1="60" y1="25" x2="60" y2="38" stroke="#A85454" stroke-width="2.2" stroke-linecap="round"/>
            <line x1="46" y1="40" x2="74" y2="40" stroke="#A85454" stroke-width="2.2" stroke-linecap="round"/>
            <line x1="60" y1="42" x2="60" y2="86" stroke="#A85454" stroke-width="2.6" stroke-linecap="round"/>
            <path d="M 56 82 L 60 90 L 64 82" fill="none" stroke="#A85454" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round"/>
            <circle cx="42" cy="40" r="1.5" fill="#A85454"/>
            <circle cx="78" cy="40" r="1.5" fill="#A85454"/>
          </svg>
          <div class="archbox-eyebrow" style="color:var(--W)">The Warrior</div>
          <div class="archbox-name">Vigilance and resolve</div>
          <div class="archbox-desc">You scan for threat, hold the line, and confront what others avoid. Boundaries, courage, protection.</div>
          <div class="archbox-hint">Tap for more →</div>
        </div>

      </div>
    </div>

    <!-- ─── ENHANCED COGNITIVE CAPACITIES ─── -->
    <div class="intro-section">
      <div class="intro-section-label">— Enhanced cognitive capacities —</div>
      <div class="intro-section-tagline">Resources you bring to bear when the world gets complex</div>
      <div class="arch-grid">

        <!-- LOVER -->
        <div class="archbox" style="border-color:var(--L-b)" onclick="openArchModal('lover')" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();openArchModal('lover')}" role="button" tabindex="0" aria-label="Learn more about The Lover">
          <svg class="archbox-icon" viewBox="0 0 120 120" role="img" aria-label="Lover — adult holding child">
            <title>Lover — adult holding child</title>
            <circle cx="60" cy="60" r="54" fill="rgba(139,94,94,0.06)"/>
            <circle cx="56" cy="32" r="10" fill="#8B5E5E" stroke="#8B5E5E" stroke-width="1.5"/>
            <path d="M 56 43 Q 42 46 40 64 Q 40 84 44 100 L 72 100 Q 72 84 72 64 Q 70 46 56 43 Z" fill="#8B5E5E" stroke="#8B5E5E" stroke-width="1.5" stroke-linejoin="round"/>
            <circle cx="62" cy="58" r="8" fill="#C49494" stroke="#8B5E5E" stroke-width="1.3"/>
            <path d="M 62 67 Q 52 70 50 84 Q 50 94 53 100 L 73 100 Q 76 94 76 84 Q 74 70 62 67 Z" fill="#C49494" stroke="#8B5E5E" stroke-width="1.3" stroke-linejoin="round"/>
            <line x1="22" y1="102" x2="96" y2="102" stroke="#8B5E5E" stroke-width="0.8" stroke-opacity="0.35" stroke-linecap="round"/>
          </svg>
          <div class="archbox-eyebrow" style="color:var(--L)">The Lover</div>
          <div class="archbox-name">Care and connection</div>
          <div class="archbox-desc">You feel with others, hold what is fragile, tend the bonds that matter.</div>
          <div class="archbox-hint">Tap for more →</div>
        </div>

        <!-- STRATEGIST -->
        <div class="archbox" style="border-color:var(--S-b)" onclick="openArchModal('strategist')" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();openArchModal('strategist')}" role="button" tabindex="0" aria-label="Learn more about The Strategist">
          <svg class="archbox-icon" viewBox="0 0 120 120" role="img" aria-label="Strategist — node map">
            <title>Strategist — node map</title>
            <circle cx="60" cy="60" r="54" fill="rgba(91,107,139,0.06)"/>
            <line x1="38" y1="32" x2="62" y2="48" stroke="#5B6B8B" stroke-width="2" stroke-linecap="round" stroke-opacity="0.85"/>
            <line x1="62" y1="48" x2="86" y2="58" stroke="#5B6B8B" stroke-width="2" stroke-linecap="round" stroke-opacity="0.85"/>
            <line x1="62" y1="48" x2="50" y2="80" stroke="#5B6B8B" stroke-width="1.8" stroke-linecap="round" stroke-opacity="0.75"/>
            <line x1="50" y1="80" x2="80" y2="88" stroke="#5B6B8B" stroke-width="1.3" stroke-linecap="round" stroke-opacity="0.55"/>
            <line x1="86" y1="58" x2="92" y2="86" stroke="#5B6B8B" stroke-width="1.3" stroke-linecap="round" stroke-opacity="0.55"/>
            <line x1="38" y1="32" x2="28" y2="58" stroke="#5B6B8B" stroke-width="1.3" stroke-linecap="round" stroke-opacity="0.55"/>
            <line x1="28" y1="58" x2="50" y2="80" stroke="#5B6B8B" stroke-width="0.8" stroke-linecap="round" stroke-opacity="0.4"/>
            <line x1="80" y1="88" x2="92" y2="86" stroke="#5B6B8B" stroke-width="0.8" stroke-linecap="round" stroke-opacity="0.4"/>
            <line x1="38" y1="32" x2="86" y2="58" stroke="#5B6B8B" stroke-width="0.7" stroke-linecap="round" stroke-opacity="0.3"/>
            <circle cx="62" cy="48" r="8" fill="rgba(91,107,139,0.22)" stroke="#5B6B8B" stroke-width="2"/>
            <circle cx="62" cy="48" r="2.5" fill="#5B6B8B"/>
            <circle cx="38" cy="32" r="6" fill="rgba(91,107,139,0.15)" stroke="#5B6B8B" stroke-width="1.6"/>
            <circle cx="86" cy="58" r="6" fill="rgba(91,107,139,0.15)" stroke="#5B6B8B" stroke-width="1.6"/>
            <circle cx="50" cy="80" r="5.5" fill="rgba(91,107,139,0.15)" stroke="#5B6B8B" stroke-width="1.5"/>
            <circle cx="28" cy="58" r="4" fill="rgba(91,107,139,0.1)" stroke="#5B6B8B" stroke-width="1.2"/>
            <circle cx="80" cy="88" r="3.5" fill="rgba(91,107,139,0.1)" stroke="#5B6B8B" stroke-width="1.2"/>
            <circle cx="92" cy="86" r="3" fill="rgba(91,107,139,0.1)" stroke="#5B6B8B" stroke-width="1"/>
          </svg>
          <div class="archbox-eyebrow" style="color:var(--S)">The Strategist</div>
          <div class="archbox-name">Pattern and plan</div>
          <div class="archbox-desc">You map the system, weigh the trade-offs, find the path through complexity.</div>
          <div class="archbox-hint">Tap for more →</div>
        </div>

        <!-- VISIONARY -->
        <div class="archbox" style="border-color:var(--V-b)" onclick="openArchModal('visionary')" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();openArchModal('visionary')}" role="button" tabindex="0" aria-label="Learn more about The Visionary">
          <svg class="archbox-icon" viewBox="0 0 120 120" role="img" aria-label="Visionary compass">
            <title>Visionary compass</title>
            <circle cx="60" cy="60" r="54" fill="rgba(107,91,139,0.06)"/>
            <circle cx="60" cy="60" r="38" fill="rgba(107,91,139,0.06)" stroke="#6B5B8B" stroke-width="1.8"/>
            <circle cx="60" cy="60" r="30" fill="none" stroke="#6B5B8B" stroke-width="0.8" stroke-opacity="0.5"/>
            <path d="M 60 28 L 64 60 L 60 64 L 56 60 Z" fill="#6B5B8B" stroke="#6B5B8B" stroke-width="1" stroke-linejoin="round"/>
            <path d="M 60 92 L 64 60 L 60 56 L 56 60 Z" fill="rgba(107,91,139,0.15)" stroke="#6B5B8B" stroke-width="1.2" stroke-linejoin="round"/>
            <path d="M 90 60 L 64 56 L 60 60 L 64 64 Z" fill="rgba(107,91,139,0.1)" stroke="#6B5B8B" stroke-width="1" stroke-linejoin="round"/>
            <path d="M 30 60 L 56 56 L 60 60 L 56 64 Z" fill="rgba(107,91,139,0.1)" stroke="#6B5B8B" stroke-width="1" stroke-linejoin="round"/>
            <circle cx="60" cy="60" r="3" fill="#6B5B8B"/>
            <line x1="60" y1="18" x2="60" y2="22" stroke="#6B5B8B" stroke-width="1.5" stroke-linecap="round"/>
            <line x1="60" y1="98" x2="60" y2="102" stroke="#6B5B8B" stroke-width="1" stroke-linecap="round" stroke-opacity="0.6"/>
            <line x1="18" y1="60" x2="22" y2="60" stroke="#6B5B8B" stroke-width="1" stroke-linecap="round" stroke-opacity="0.6"/>
            <line x1="98" y1="60" x2="102" y2="60" stroke="#6B5B8B" stroke-width="1" stroke-linecap="round" stroke-opacity="0.6"/>
          </svg>
          <div class="archbox-eyebrow" style="color:var(--V)">The Visionary</div>
          <div class="archbox-name">Meaning and direction</div>
          <div class="archbox-desc">You orient by what matters most, keep true north visible, see beyond the moment.</div>
          <div class="archbox-hint">Tap for more →</div>
        </div>

      </div>
    </div>

    <div class="intro-text-narrow" style="margin-top:36px;text-align:center">
      <p class="intro-body" style="text-align:left">For each scenario, you'll pick your top one to three responses — in order. Your first pick weighs most. There are no wrong answers.</p>

      <p class="intro-note">15 scenarios · about 5 minutes · choose what's truest, not what sounds best.</p>

      <button class="btn btn-dark" onclick="startAssessment()">Begin the assessment →</button>
      <div style="margin-top:22px">
        <a class="found-link" href="#foundations" onclick="openFoundations(event)">Theoretical foundations →</a>
      </div>
    </div>
  </div>
</div>

<!-- ═══════════════════════════════════ ASSESSMENT ═══════════════════════════════════ -->
<div id="pg-assess" class="pg">
  <div id="prog-wrap" class="prog-wrap">
    <div class="prog-track"><div id="prog-fill" class="prog-fill" style="width:0%"></div></div>
    <div class="prog-meta">
      <span id="prog-lbl-l" class="prog-lbl"></span>
      <span id="prog-lbl-r" class="prog-lbl"></span>
    </div>
  </div>
  <div id="slide-area"></div>
  <div class="qnav">
    <button id="btn-back" class="btn btn-ghost btn-sm" onclick="navBack()">← Back</button>
    <button id="btn-next" class="btn btn-dark btn-sm" onclick="navNext()" disabled>Continue →</button>
  </div>
</div>

<!-- ═══════════════════════════════════ PROCESSING ═══════════════════════════════════ -->
<div id="pg-processing" class="pg">
  <div class="proc-wrap">
    <h2 class="proc-title">Calculating your profile</h2>
    <p class="proc-sub">mapping baseline · pressure · gap</p>
    <div class="proc-dots">
      <div class="proc-dot"></div>
      <div class="proc-dot"></div>
      <div class="proc-dot"></div>
      <div class="proc-dot"></div>
      <div class="proc-dot"></div>
    </div>
  </div>
</div>

<!-- ═══════════════════════════════════ RESULTS ═══════════════════════════════════ -->
<div id="pg-results" class="pg">
  <div class="inner-w" id="results-content"></div>
</div>

<!-- ═══════════════════════════════════ FOUNDATIONS ═══════════════════════════════════ -->
<div id="pg-foundations" class="pg">
  <div class="inner-w">
    <button class="btn btn-ghost btn-sm found-back" onclick="closeFoundations()">← Back</button>

    <div class="found-hdr">
      <div class="r-eyebrow">About this assessment</div>
      <h1 class="r-title" style="font-size:clamp(26px,4.5vw,38px)">Theoretical foundations</h1>
      <p class="r-sub">The theory, the deeper dive into each capacity, and how this assessment was built</p>

      <nav class="found-jump-nav" aria-label="Jump to section">
        <button class="found-jump-btn" onclick="foundJump(event,'found-v3-model')">v3 model</button>
        <button class="found-jump-btn" onclick="foundJump(event,'found-grounding')">Scientific grounding</button>
        <button class="found-jump-btn" onclick="foundJump(event,'found-tia')">Theory in action</button>
        <button class="found-jump-btn" onclick="foundJump(event,'found-method')">Assessment methodology</button>
      </nav>
    </div>

    
    <!-- ═══ V3 MODEL UPDATE (Pursuing/Protecting × 5 Capacities) ═══ -->
    <section class="found-section" id="found-v3-model">
      <h2 class="found-section-title">The v3 model — two drives, five capacities</h2>

      <div class="found-intro">
        <p>This assessment now uses a two-tier model: <strong>drives</strong> (motivational orientation — what pulls you toward or away) and <strong>capacities</strong> (the evolved apparatus you use to engage). The drives organize Section 1; the capacities organize Sections 2 and 3.</p>
      </div>

      <div class="fcard" style="border-left-color:var(--H)">
        <div class="fcard-hdr">
          <span class="fcard-icon">☀</span>
          <span class="fcard-name" style="color:var(--H)">Pursuing — the approach drive</span>
        </div>
        <div class="fcard-theory">Behavioral Activation System · SEEKING (Panksepp)</div>
        <div class="fcard-row">
          <div class="fcard-rlbl">Theoretical anchors</div>
          <div class="fcard-rbody">Jaak Panksepp's <em>Affective Neuroscience</em> (1998, 2012) names <strong>SEEKING</strong> as the core mammalian appetitive system — the dopaminergic engine of approach. Carver &amp; White's BAS (1994) operationalizes this in humans as Drive, Reward Responsiveness, and Fun Seeking. The three Pursuing sub-archetypes — <strong>Achiever</strong> (BAS Drive), <strong>Hedonist</strong> (BAS Reward Responsiveness), <strong>Adventurer</strong> (BAS Fun Seeking) — map cleanly to these three validated subscales.</div>
        </div>
        <div class="fcard-row">
          <div class="fcard-rlbl">Sub-archetypes</div>
          <div class="fcard-rbody">
            <ul>
              <li><strong>Achiever</strong> — sustained pursuit; output as identity</li>
              <li><strong>Hedonist</strong> — present pleasure; savoring; vitality</li>
              <li><strong>Adventurer</strong> — novelty; exploration; openness to experience</li>
            </ul>
          </div>
        </div>
      </div>

      <div class="fcard" style="border-left-color:var(--W)">
        <div class="fcard-hdr">
          <span class="fcard-icon">⚔</span>
          <span class="fcard-name" style="color:var(--W)">Protecting — the avoid drive</span>
        </div>
        <div class="fcard-theory">Behavioral Inhibition System · FEAR + RAGE (Panksepp) · Fight–Flight–Freeze</div>
        <div class="fcard-row">
          <div class="fcard-rlbl">Theoretical anchors</div>
          <div class="fcard-rbody">Panksepp's <strong>FEAR</strong> system (anticipatory threat detection) and <strong>RAGE</strong> system (active defense) map to the avoid orientation. Gray's BIS (Behavioral Inhibition System) and the Fight-Flight-Freeze framework (Maack, Buchanan &amp; Young, 2015) operationalize defensive responses in three modes. The three Protecting sub-archetypes — <strong>Sentinel</strong> (BIS Threat Sensitivity), <strong>Warrior</strong> (Fight), <strong>Evader</strong> (Flight) — track these.</div>
        </div>
        <div class="fcard-row">
          <div class="fcard-rlbl">Sub-archetypes</div>
          <div class="fcard-rbody">
            <ul>
              <li><strong>Sentinel</strong> — vigilance; anticipation; preparation for risk</li>
              <li><strong>Warrior</strong> — active defense; confrontation; holding ground</li>
              <li><strong>Evader</strong> — withdrawal; disengagement; conserving energy</li>
            </ul>
          </div>
        </div>
      </div>

      <div class="found-intro" style="margin-top:32px">
        <h3 style="font-family:var(--fd);font-size:20px;font-weight:700;margin-bottom:12px">The five capacities</h3>
        <p>The capacities are the evolved <em>apparatus</em> through which both drives operate. Each capacity has a Pursuing-mode expression (approach) and a Protecting-mode expression (avoid). They run roughly in evolutionary order — body first, meaning last:</p>
        <ul>
          <li><strong>Egoist (body)</strong> — sensation, interoception, instinct. Where Damasio's <em>somatic markers</em> originate. Pre-conceptual knowing.</li>
          <li><strong>Veteran (memory)</strong> — pattern encoding, anticipation, recall. The bridge between body and concept.</li>
          <li><strong>Lover (empathy)</strong> — the shared social brain. Reading others, feeling-with, building connection.</li>
          <li><strong>Strategist (imagination)</strong> — private simulation, counterfactual reasoning, modeling futures.</li>
          <li><strong>Visionary (meaning)</strong> — values, purpose, the moral and existential frame. The newest layer.</li>
        </ul>
      </div>

      <div class="fcard" style="border-left-color:var(--text3);margin-top:24px">
        <div class="fcard-hdr">
          <span class="fcard-name" style="color:var(--text)">Additional theoretical anchors</span>
        </div>
        <div class="fcard-row">
          <div class="fcard-rlbl">Affect &amp; emotion</div>
          <div class="fcard-rbody"><strong>Lisa Feldman Barrett</strong>'s <em>How Emotions Are Made</em> (2017) and the theory of constructed emotion frame each capacity not as a discrete module but as a <em>predictive interface</em> — the brain constructing experience from interoception, prior memory, and conceptual frame. The capacity sequence (body → memory → empathy → imagination → meaning) maps to her account of how the affective body becomes the meaning-making mind.</div>
        </div>
        <div class="fcard-row">
          <div class="fcard-rlbl">Developmental scaffolding</div>
          <div class="fcard-rbody"><strong>Robert Kegan</strong>'s <em>In Over Our Heads</em> (1994) and the subject-object theory describe how capacities that begin as <em>subject</em> (we are them) become <em>object</em> (we have them) — the developmental work of becoming able to use a capacity rather than being driven by it. The Pursuing/Protecting framing of each capacity in this assessment is meant to surface exactly this: which capacities you can <em>wield</em> in each mode, and which still wield you.</div>
        </div>
        <div class="fcard-row">
          <div class="fcard-rlbl">Late-stage development</div>
          <div class="fcard-rbody"><strong>Susanne Cook-Greuter</strong>'s ego-development research (1999, 2010) extends Kegan's stages into the post-conventional range. Visionary at full strength corresponds to her <em>construct-aware</em> and <em>unitive</em> stages — the capacity to hold meaning <em>and</em> see meaning-making itself as a constructed move. This is what allows the Visionary in Protecting mode to refuse moral rigidity even while holding deep conviction.</div>
        </div>
      </div>
    </section>

<!-- ═══ SECTION 1: SCIENTIFIC GROUNDING ═══ -->
    <section class="found-section" id="found-grounding">
      <h2 class="found-section-title">Scientific grounding</h2>

    <div class="found-intro">
      <p>This assessment maps each capacity to a specific body of research and the validated psychometric instruments that informed item design. The format is a Situational Judgment Test (SJT) — a well-established psychometric format that avoids the social desirability bias of traditional Likert-scale self-report.</p>
      <p>Items haven't been through factor analysis or formal validation. Each capacity is grounded in published research and reference instruments listed below — but until validated, treat results as <em>reflective</em>, not <em>diagnostic</em>.</p>
    </div>

    <!-- HEDONIST -->
    <div class="fcard" style="border-left-color:var(--H)">
      <div class="fcard-hdr">
        <span class="fcard-icon">☀</span>
        <span class="fcard-name" style="color:var(--H)">Hedonist</span>
      </div>
      <div class="fcard-theory">Behavioral Activation System (BAS) · Reinforcement Sensitivity Theory</div>

      <div class="fcard-row">
        <div class="fcard-rlbl">Key research</div>
        <div class="fcard-rbody">Jeffrey Gray (1970), Carver &amp; White (1994). The seek/approach drive that runs from physical reward sensitivity through to meaning-pursuit. The deepest theoretical grounding in the model.</div>
      </div>

      <div class="fcard-row">
        <div class="fcard-rlbl">Validated instruments</div>
        <div class="fcard-rbody"><strong>BIS/BAS Scales</strong> (Carver &amp; White, 1994) — 24 items, ~15,000 citations. <a href="https://doi.org/10.1037/0022-3514.67.2.319" target="_blank" rel="noopener" style="color:var(--text);text-decoration:underline;text-decoration-color:var(--border2)">doi.org/10.1037/0022-3514.67.2.319</a></div>
      </div>

      <div class="fcard-row">
        <div class="fcard-rlbl">Subscales covered</div>
        <div class="fcard-rbody">
          <ul>
            <li><em>Reward Responsiveness</em> — items about savoring, soaking in praise, enjoyment</li>
            <li><em>Drive</em> — items about jumping in, going with gut, pursuing what feels alive</li>
            <li><em>Fun Seeking</em> — items about bold ideas, new experiences, curiosity rush</li>
          </ul>
        </div>
      </div>

      <div class="fcard-row">
        <div class="fcard-rlbl">Gaps</div>
        <div class="fcard-rbody gaps">
          <ul><li>None — all three BAS subscales represented.</li></ul>
        </div>
      </div>

      <div class="fcard-note">BAS maps cleanly to Hedonist. The seek/approach binary is the foundational structure of the entire model.</div>
    </div>

    <!-- WARRIOR -->
    <div class="fcard" style="border-left-color:var(--W)">
      <div class="fcard-hdr">
        <span class="fcard-icon">⚔</span>
        <span class="fcard-name" style="color:var(--W)">Warrior</span>
      </div>
      <div class="fcard-theory">Behavioral Inhibition System (BIS) + Fight–Flight–Freeze</div>

      <div class="fcard-row">
        <div class="fcard-rlbl">Key research</div>
        <div class="fcard-rbody">Jeffrey Gray (1970), Carver &amp; White (1994), Maack, Buchanan &amp; Young (2015). The protect/avoid drive — threat sensitivity and defensive response.</div>
      </div>

      <div class="fcard-row">
        <div class="fcard-rlbl">Validated instruments</div>
        <div class="fcard-rbody"><strong>BIS/BAS Scales</strong> (Carver &amp; White, 1994); <strong>Fight-Flight-Freeze Questionnaire (FFFQ)</strong> (Maack et al., 2015).</div>
      </div>

      <div class="fcard-row">
        <div class="fcard-rlbl">Subscales covered</div>
        <div class="fcard-rbody">
          <ul>
            <li><em>BIS / Threat Sensitivity</em> — items about scanning for risk, defensive vigilance, preparing for worst case</li>
            <li><em>Fight</em> — items about holding ground, refusing to compromise, direct confrontation</li>
            <li><em>Flight</em> — items about damage control, securing position, powering through</li>
            <li><em>Freeze</em> — partially covered (e.g. items about bracing yourself)</li>
          </ul>
        </div>
      </div>

      <div class="fcard-row">
        <div class="fcard-rlbl">Gaps</div>
        <div class="fcard-rbody gaps">
          <ul>
            <li><strong>Freeze underrepresented</strong> — items skew toward active defense (fight). Could add scenarios where the Warrior response is "go still and watch" rather than "push back."</li>
            <li><strong>Tonic immobility</strong> (complete shutdown under extreme threat) — the deepest Warrior failure mode, hard to assess via scenario.</li>
          </ul>
        </div>
      </div>

      <div class="fcard-note">Items lean toward the courageous/active end of the Warrior spectrum and may undercount people whose Warrior manifests as hypervigilant freezing.</div>
    </div>

    <!-- LOVER -->
    <div class="fcard" style="border-left-color:var(--L)">
      <div class="fcard-hdr">
        <span class="fcard-icon">♡</span>
        <span class="fcard-name" style="color:var(--L)">Lover</span>
      </div>
      <div class="fcard-theory">Parental Care Theory of Empathy · Social Brain Hypothesis</div>

      <div class="fcard-row">
        <div class="fcard-rlbl">Key research</div>
        <div class="fcard-rbody">Jean Decety (2011), Robin Dunbar (1992/2022), Mark Davis (1983). Empathy as an evolved capacity rooted in parental care, repurposed for broader social bonding.</div>
      </div>

      <div class="fcard-row">
        <div class="fcard-rlbl">Validated instruments</div>
        <div class="fcard-rbody"><strong>Interpersonal Reactivity Index (IRI)</strong> (Davis, 1983) — 28 items, ~10,000+ citations. Also: <strong>Toronto Empathy Questionnaire</strong> (Spreng et al., 2009); <strong>Experiences in Close Relationships</strong> scale (Brennan, Clark &amp; Shaver, 1998).</div>
      </div>

      <div class="fcard-row">
        <div class="fcard-rlbl">Subscales covered</div>
        <div class="fcard-rbody">
          <ul>
            <li><em>Empathic Concern</em> — items about feeling others' pain, heart going out, worrying about affected people</li>
            <li><em>Perspective Taking</em> — items about understanding triggers, listening first, naming emotions</li>
            <li><em>Fantasy</em> — partially covered (items about considering how decisions affect others)</li>
          </ul>
        </div>
      </div>

      <div class="fcard-row">
        <div class="fcard-rlbl">Gaps</div>
        <div class="fcard-rbody gaps">
          <ul>
            <li><strong>Personal Distress underrepresented</strong> — the shadow Lover (becoming overwhelmed by empathic pain rather than channeling it). Items mostly show Lover at its best.</li>
            <li><strong>Attachment style</strong> — secure / anxious / avoidant attachment fundamentally shapes how Lover operates under stress. Would require supplementary instrument (ECR).</li>
          </ul>
        </div>
      </div>

      <div class="fcard-note">The IRI's Personal Distress subscale is clinically important — it distinguishes healthy empathy from empathic overwhelm. Adding attachment theory (Bowlby, Ainsworth) would deepen this significantly.</div>
    </div>

    <!-- STRATEGIST -->
    <div class="fcard" style="border-left-color:var(--S)">
      <div class="fcard-hdr">
        <span class="fcard-icon">◈</span>
        <span class="fcard-name" style="color:var(--S)">Strategist</span>
      </div>
      <div class="fcard-theory">Mental Time Travel · Prospection · Prefrontal Cortex Evolution</div>

      <div class="fcard-row">
        <div class="fcard-rlbl">Key research</div>
        <div class="fcard-rbody">Suddendorf &amp; Corballis (2007), Schacter &amp; Addis (2007), Levy et al. (2024). The capacity to model futures, link distant data, and engage in abstraction — enabled by prefrontal expansion.</div>
      </div>

      <div class="fcard-row">
        <div class="fcard-rlbl">Validated instruments</div>
        <div class="fcard-rbody"><strong>Consideration of Future Consequences (CFC)</strong> (Strathman et al., 1994); <strong>Need for Cognition (NFC)</strong> (Cacioppo &amp; Petty, 1982); <strong>Cognitive Flexibility Scale</strong> (Martin &amp; Rubin, 1995). <a href="https://doi.org/10.1017/S0140525X07001975" target="_blank" rel="noopener" style="color:var(--text);text-decoration:underline;text-decoration-color:var(--border2)">Suddendorf &amp; Corballis 2007</a> · <a href="https://doi.org/10.1098/rstb.2007.2087" target="_blank" rel="noopener" style="color:var(--text);text-decoration:underline;text-decoration-color:var(--border2)">Schacter &amp; Addis 2007</a></div>
      </div>

      <div class="fcard-row">
        <div class="fcard-rlbl">Subscales covered</div>
        <div class="fcard-rbody">
          <ul>
            <li><em>Future orientation (CFC)</em> — items about mapping options, analyzing probabilities, planning with milestones</li>
            <li><em>Analytical thinking (NFC)</em> — items about diagnosing root causes, organizing ideas against criteria, extracting useful information</li>
            <li><em>Cognitive flexibility</em> — items about reframing problems, triaging under pressure</li>
          </ul>
        </div>
      </div>

      <div class="fcard-row">
        <div class="fcard-rlbl">Gaps</div>
        <div class="fcard-rbody gaps">
          <ul>
            <li><strong>Working memory capacity</strong> — fundamental to the Strategist (Levy et al., 2024) but not assessable via self-report.</li>
            <li><strong>Metacognition</strong> — partially covered, could be more explicit.</li>
            <li><strong>Analogical reasoning</strong> — Levy et al.'s key human cognitive innovation, not directly assessed.</li>
          </ul>
        </div>
      </div>

      <div class="fcard-note">The CFC is the cleanest single-instrument match. The Strategist as defined here is broader than any single validated measure — it spans future orientation, analytical preference, and cognitive flexibility.</div>
    </div>

    <!-- VISIONARY -->
    <div class="fcard" style="border-left-color:var(--V)">
      <div class="fcard-hdr">
        <span class="fcard-icon">✧</span>
        <span class="fcard-name" style="color:var(--V)">Visionary</span>
      </div>
      <div class="fcard-theory">Evolution of Meaning · Cultural Group Selection · Abstraction Capacity</div>

      <div class="fcard-row">
        <div class="fcard-rlbl">Key research</div>
        <div class="fcard-rbody">Frankl (1946), Steger (2006), Boyd &amp; Richerson (2005), Levy et al. (2024), Cloninger (1993). Meaning-making as an evolved capacity that enables coordination at scale far beyond Dunbar's ~150.</div>
      </div>

      <div class="fcard-row">
        <div class="fcard-rlbl">Validated instruments</div>
        <div class="fcard-rbody"><strong>Meaning in Life Questionnaire (MLQ)</strong> (Steger et al., 2006); <strong>Self-Transcendence subscale of TCI</strong> (Cloninger, 1993); selected subscales of <strong>Brief COPE</strong> (Carver, 1997).</div>
      </div>

      <div class="fcard-row">
        <div class="fcard-rlbl">Subscales covered</div>
        <div class="fcard-rbody">
          <ul>
            <li><em>Presence of Meaning (MLQ)</em> — items about purpose, values alignment, living for something larger</li>
            <li><em>Search for Meaning (MLQ)</em> — items about questioning whether choices align with deeper purpose</li>
            <li><em>Self-Transcendence (TCI)</em> — items about serving beyond self, end-of-life reflections</li>
            <li><em>Positive reframing under stress (Brief COPE)</em> — items about seeing difficulty as part of a larger story, gratitude for growth</li>
          </ul>
        </div>
      </div>

      <div class="fcard-row">
        <div class="fcard-rlbl">Gaps</div>
        <div class="fcard-rbody gaps">
          <ul>
            <li><strong>Spiritual transcendence</strong> — Cloninger's full Self-Transcendence scale includes mystical experience and spiritual identification, deliberately omitted (avoiding woo for analytical audiences).</li>
            <li><strong>Moral reasoning development (Kohlberg)</strong> — Visionary involves post-conventional moral reasoning, not assessed.</li>
            <li><strong>Generativity / narrative identity (McAdams)</strong> — partially covered, could be deeper.</li>
          </ul>
        </div>
      </div>

      <div class="fcard-note">The least scientifically settled capacity. Strongest theoretical backing comes from Levy et al. (2024) on abstraction capacity and the cultural evolution literature (Boyd &amp; Richerson) on meaning-making and cooperation at scale.</div>
    </div>

    </section>
    <!-- end SECTION 1 -->

    <!-- ═══ SECTION 2: THEORY IN ACTION ═══ -->
    <section class="found-section" id="found-tia">
      <h2 class="found-section-title">Theory in action <span class="found-section-title-sub">— a deeper dive into the capacities</span></h2>

    <!-- THEORY IN ACTION -->
    <div class="tia-section">
      <p>Each capacity is composed of distinct subscales. Two people can score the same on a capacity overall while having radically different inner machinery — the subscales are where the texture of who you actually are lives.</p>

      <nav class="tia-nav" aria-label="Jump to capacity">
    <a href="#tia-hedonist" class="tia-pill" onclick="tiaJump(event,'tia-hedonist')" style="--pill-color:#D4A854"><span class="tia-pill-icon" style="color:#D4A854"><svg viewBox="0 0 120 120" class="tia-pill-svg" role="img" aria-label="Hedonist sun">
    <title>Hedonist sun</title>
    <circle cx="60" cy="60" r="54" fill="rgba(212,168,84,0.06)"/>
    <g stroke="#D4A854" stroke-width="2" stroke-linecap="round">
      <line x1="60" y1="14" x2="60" y2="26"/>
      <line x1="60" y1="94" x2="60" y2="106"/>
      <line x1="14" y1="60" x2="26" y2="60"/>
      <line x1="94" y1="60" x2="106" y2="60"/>
      <line x1="27.5" y1="27.5" x2="36" y2="36"/>
      <line x1="84" y1="84" x2="92.5" y2="92.5"/>
      <line x1="92.5" y1="27.5" x2="84" y2="36"/>
      <line x1="36" y1="84" x2="27.5" y2="92.5"/>
    </g>
    <g stroke="#D4A854" stroke-width="1.3" stroke-linecap="round" stroke-opacity="0.6">
      <line x1="40" y1="18" x2="43.5" y2="27.5"/>
      <line x1="80" y1="18" x2="76.5" y2="27.5"/>
      <line x1="40" y1="102" x2="43.5" y2="92.5"/>
      <line x1="80" y1="102" x2="76.5" y2="92.5"/>
      <line x1="18" y1="40" x2="27.5" y2="43.5"/>
      <line x1="18" y1="80" x2="27.5" y2="76.5"/>
      <line x1="102" y1="40" x2="92.5" y2="43.5"/>
      <line x1="102" y1="80" x2="92.5" y2="76.5"/>
    </g>
    <circle cx="60" cy="60" r="20" fill="rgba(212,168,84,0.08)" stroke="#D4A854" stroke-width="1.8"/>
    <circle cx="60" cy="60" r="3" fill="#D4A854"/>
  </svg></span><span class="tia-pill-label">The Hedonist</span></a>
    <a href="#tia-warrior" class="tia-pill" onclick="tiaJump(event,'tia-warrior')" style="--pill-color:#A85454"><span class="tia-pill-icon" style="color:#A85454"><svg viewBox="0 0 120 120" class="tia-pill-svg" role="img" aria-label="Warrior shield">
    <title>Warrior shield</title>
    <circle cx="60" cy="60" r="54" fill="rgba(168,84,84,0.06)"/>
    <path d="M 60 24 L 92 32 L 92 60 Q 92 84 60 102 Q 28 84 28 60 L 28 32 Z" fill="rgba(168,84,84,0.08)" stroke="#A85454" stroke-width="1.8" stroke-linejoin="round"/>
    <path d="M 60 32 L 84 38 L 84 60 Q 84 78 60 92 Q 36 78 36 60 L 36 38 Z" fill="none" stroke="#A85454" stroke-width="0.8" stroke-opacity="0.5"/>
    <circle cx="60" cy="22" r="3.2" fill="none" stroke="#A85454" stroke-width="1.5"/>
    <line x1="60" y1="25" x2="60" y2="38" stroke="#A85454" stroke-width="2.2" stroke-linecap="round"/>
    <line x1="46" y1="40" x2="74" y2="40" stroke="#A85454" stroke-width="2.2" stroke-linecap="round"/>
    <line x1="60" y1="42" x2="60" y2="86" stroke="#A85454" stroke-width="2.6" stroke-linecap="round"/>
    <path d="M 56 82 L 60 90 L 64 82" fill="none" stroke="#A85454" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round"/>
    <circle cx="42" cy="40" r="1.5" fill="#A85454"/>
    <circle cx="78" cy="40" r="1.5" fill="#A85454"/>
  </svg></span><span class="tia-pill-label">The Warrior</span></a>
    <a href="#tia-lover" class="tia-pill" onclick="tiaJump(event,'tia-lover')" style="--pill-color:#8B5E5E"><span class="tia-pill-icon" style="color:#8B5E5E"><svg viewBox="0 0 120 120" class="tia-pill-svg" role="img" aria-label="Lover — adult holding child">
    <title>Lover — adult holding child</title>
    <circle cx="60" cy="60" r="54" fill="rgba(139,94,94,0.06)"/>
    <circle cx="56" cy="32" r="10" fill="#8B5E5E" stroke="#8B5E5E" stroke-width="1.5"/>
    <path d="M 56 43 Q 42 46 40 64 Q 40 84 44 100 L 72 100 Q 72 84 72 64 Q 70 46 56 43 Z" fill="#8B5E5E" stroke="#8B5E5E" stroke-width="1.5" stroke-linejoin="round"/>
    <circle cx="62" cy="58" r="8" fill="#C49494" stroke="#8B5E5E" stroke-width="1.3"/>
    <path d="M 62 67 Q 52 70 50 84 Q 50 94 53 100 L 73 100 Q 76 94 76 84 Q 74 70 62 67 Z" fill="#C49494" stroke="#8B5E5E" stroke-width="1.3" stroke-linejoin="round"/>
    <line x1="22" y1="102" x2="96" y2="102" stroke="#8B5E5E" stroke-width="0.8" stroke-opacity="0.35" stroke-linecap="round"/>
  </svg></span><span class="tia-pill-label">The Lover</span></a>
    <a href="#tia-strategist" class="tia-pill" onclick="tiaJump(event,'tia-strategist')" style="--pill-color:#5B6B8B"><span class="tia-pill-icon" style="color:#5B6B8B"><svg viewBox="0 0 120 120" class="tia-pill-svg" role="img" aria-label="Strategist — node map">
    <title>Strategist — node map</title>
    <circle cx="60" cy="60" r="54" fill="rgba(91,107,139,0.06)"/>
    <line x1="38" y1="32" x2="62" y2="48" stroke="#5B6B8B" stroke-width="2" stroke-linecap="round" stroke-opacity="0.85"/>
    <line x1="62" y1="48" x2="86" y2="58" stroke="#5B6B8B" stroke-width="2" stroke-linecap="round" stroke-opacity="0.85"/>
    <line x1="62" y1="48" x2="50" y2="80" stroke="#5B6B8B" stroke-width="1.8" stroke-linecap="round" stroke-opacity="0.75"/>
    <line x1="50" y1="80" x2="80" y2="88" stroke="#5B6B8B" stroke-width="1.3" stroke-linecap="round" stroke-opacity="0.55"/>
    <line x1="86" y1="58" x2="92" y2="86" stroke="#5B6B8B" stroke-width="1.3" stroke-linecap="round" stroke-opacity="0.55"/>
    <line x1="38" y1="32" x2="28" y2="58" stroke="#5B6B8B" stroke-width="1.3" stroke-linecap="round" stroke-opacity="0.55"/>
    <line x1="28" y1="58" x2="50" y2="80" stroke="#5B6B8B" stroke-width="0.8" stroke-linecap="round" stroke-opacity="0.4"/>
    <line x1="80" y1="88" x2="92" y2="86" stroke="#5B6B8B" stroke-width="0.8" stroke-linecap="round" stroke-opacity="0.4"/>
    <line x1="38" y1="32" x2="86" y2="58" stroke="#5B6B8B" stroke-width="0.7" stroke-linecap="round" stroke-opacity="0.3"/>
    <circle cx="62" cy="48" r="8" fill="rgba(91,107,139,0.22)" stroke="#5B6B8B" stroke-width="2"/>
    <circle cx="62" cy="48" r="2.5" fill="#5B6B8B"/>
    <circle cx="38" cy="32" r="6" fill="rgba(91,107,139,0.15)" stroke="#5B6B8B" stroke-width="1.6"/>
    <circle cx="86" cy="58" r="6" fill="rgba(91,107,139,0.15)" stroke="#5B6B8B" stroke-width="1.6"/>
    <circle cx="50" cy="80" r="5.5" fill="rgba(91,107,139,0.15)" stroke="#5B6B8B" stroke-width="1.5"/>
    <circle cx="28" cy="58" r="4" fill="rgba(91,107,139,0.1)" stroke="#5B6B8B" stroke-width="1.2"/>
    <circle cx="80" cy="88" r="3.5" fill="rgba(91,107,139,0.1)" stroke="#5B6B8B" stroke-width="1.2"/>
    <circle cx="92" cy="86" r="3" fill="rgba(91,107,139,0.1)" stroke="#5B6B8B" stroke-width="1"/>
  </svg></span><span class="tia-pill-label">The Strategist</span></a>
    <a href="#tia-visionary" class="tia-pill" onclick="tiaJump(event,'tia-visionary')" style="--pill-color:#6B5B8B"><span class="tia-pill-icon" style="color:#6B5B8B"><svg viewBox="0 0 120 120" class="tia-pill-svg" role="img" aria-label="Visionary compass">
    <title>Visionary compass</title>
    <circle cx="60" cy="60" r="54" fill="rgba(107,91,139,0.06)"/>
    <circle cx="60" cy="60" r="38" fill="rgba(107,91,139,0.06)" stroke="#6B5B8B" stroke-width="1.8"/>
    <circle cx="60" cy="60" r="30" fill="none" stroke="#6B5B8B" stroke-width="0.8" stroke-opacity="0.5"/>
    <path d="M 60 28 L 64 60 L 60 64 L 56 60 Z" fill="#6B5B8B" stroke="#6B5B8B" stroke-width="1" stroke-linejoin="round"/>
    <path d="M 60 92 L 64 60 L 60 56 L 56 60 Z" fill="rgba(107,91,139,0.15)" stroke="#6B5B8B" stroke-width="1.2" stroke-linejoin="round"/>
    <path d="M 90 60 L 64 56 L 60 60 L 64 64 Z" fill="rgba(107,91,139,0.1)" stroke="#6B5B8B" stroke-width="1" stroke-linejoin="round"/>
    <path d="M 30 60 L 56 56 L 60 60 L 56 64 Z" fill="rgba(107,91,139,0.1)" stroke="#6B5B8B" stroke-width="1" stroke-linejoin="round"/>
    <circle cx="60" cy="60" r="3" fill="#6B5B8B"/>
    <line x1="60" y1="18" x2="60" y2="22" stroke="#6B5B8B" stroke-width="1.5" stroke-linecap="round"/>
    <line x1="60" y1="98" x2="60" y2="102" stroke="#6B5B8B" stroke-width="1" stroke-linecap="round" stroke-opacity="0.6"/>
    <line x1="18" y1="60" x2="22" y2="60" stroke="#6B5B8B" stroke-width="1" stroke-linecap="round" stroke-opacity="0.6"/>
    <line x1="98" y1="60" x2="102" y2="60" stroke="#6B5B8B" stroke-width="1" stroke-linecap="round" stroke-opacity="0.6"/>
  </svg></span><span class="tia-pill-label">The Visionary</span></a>
      </nav>

      <article class="tia-arch" id="tia-hedonist" style="--arch-color:#D4A854">
        <div class="tia-arch-top">
          <div class="tia-arch-iconbox">
            <div class="tia-arch-iconbox-svg"><svg viewBox="0 0 120 120" role="img" aria-label="Hedonist sun">
    <title>Hedonist sun</title>
    <circle cx="60" cy="60" r="54" fill="rgba(212,168,84,0.06)"/>
    <g stroke="#D4A854" stroke-width="2" stroke-linecap="round">
      <line x1="60" y1="14" x2="60" y2="26"/>
      <line x1="60" y1="94" x2="60" y2="106"/>
      <line x1="14" y1="60" x2="26" y2="60"/>
      <line x1="94" y1="60" x2="106" y2="60"/>
      <line x1="27.5" y1="27.5" x2="36" y2="36"/>
      <line x1="84" y1="84" x2="92.5" y2="92.5"/>
      <line x1="92.5" y1="27.5" x2="84" y2="36"/>
      <line x1="36" y1="84" x2="27.5" y2="92.5"/>
    </g>
    <g stroke="#D4A854" stroke-width="1.3" stroke-linecap="round" stroke-opacity="0.6">
      <line x1="40" y1="18" x2="43.5" y2="27.5"/>
      <line x1="80" y1="18" x2="76.5" y2="27.5"/>
      <line x1="40" y1="102" x2="43.5" y2="92.5"/>
      <line x1="80" y1="102" x2="76.5" y2="92.5"/>
      <line x1="18" y1="40" x2="27.5" y2="43.5"/>
      <line x1="18" y1="80" x2="27.5" y2="76.5"/>
      <line x1="102" y1="40" x2="92.5" y2="43.5"/>
      <line x1="102" y1="80" x2="92.5" y2="76.5"/>
    </g>
    <circle cx="60" cy="60" r="20" fill="rgba(212,168,84,0.08)" stroke="#D4A854" stroke-width="1.8"/>
    <circle cx="60" cy="60" r="3" fill="#D4A854"/>
  </svg></div>
            <div class="tia-arch-iconbox-label">The Hedonist</div>
          </div>
          <div class="tia-arch-content">
            <p class="tia-framing">The Hedonist is the part of you that goes <em>toward</em> — toward pleasure, toward novelty, toward the thing that lights you up. But "going toward" decomposes into three different engines, and they don't always run together.</p>

            <dl class="tia-subscales">
              <dt>Reward Responsiveness</dt>
              <dd>The visceral, body-level response to good things happening. Savoring. The way some people light up when praised, taste their food, feel the moment land. This is your capacity to <em>receive</em> pleasure.</dd>

              <dt>Drive</dt>
              <dd>Sustained pursuit of what you want. Going after it. The persistent effort that closes the gap between desire and outcome. This is your capacity to <em>go after</em> pleasure.</dd>

              <dt>Fun Seeking</dt>
              <dd>Appetite for novelty and spontaneity. Willingness to act on impulse for new experience. Boredom intolerance, in the productive sense. This is your capacity to <em>seek</em> pleasure in unfamiliar territory.</dd>
            </dl>
          </div>
        </div>
        <div class="tia-arch-bottom">
          <h4 class="tia-h4">The most interesting combination: Drive without Reward Responsiveness</h4>
          <p>This is the achievement runner. Strong pursuit machinery, weak savoring machinery. They climb the ladder, hit the goal, get the promotion — and feel nothing. The dopamine of pursuit isn't matched by satisfaction at arrival, so they immediately set the next goal.</p>
          <p>It's one of the most common patterns in high-performers. From outside it looks like drive. From inside it can feel like an inability to land. The fix isn't more drive; it's relearning Reward Responsiveness — the capacity to actually feel what you've already won.</p>
          <p>The inverse — high Reward Responsiveness, low Drive — is the person who deeply enjoys life when good things arrive but doesn't chase them. Often peaceful, sometimes underemployed relative to capacity.</p>

          <h4 class="tia-h4">Also worth knowing</h4>
          <p>High Fun Seeking with low Drive produces the dabbler — many starts, few finishes. High Drive with low Fun Seeking produces the disciplined executor — gets things done but resists novelty, can become rigid in middle age.</p>
        </div>
      </article>

      <article class="tia-arch" id="tia-warrior" style="--arch-color:#A85454">
        <div class="tia-arch-top">
          <div class="tia-arch-iconbox">
            <div class="tia-arch-iconbox-svg"><svg viewBox="0 0 120 120" role="img" aria-label="Warrior shield">
    <title>Warrior shield</title>
    <circle cx="60" cy="60" r="54" fill="rgba(168,84,84,0.06)"/>
    <path d="M 60 24 L 92 32 L 92 60 Q 92 84 60 102 Q 28 84 28 60 L 28 32 Z" fill="rgba(168,84,84,0.08)" stroke="#A85454" stroke-width="1.8" stroke-linejoin="round"/>
    <path d="M 60 32 L 84 38 L 84 60 Q 84 78 60 92 Q 36 78 36 60 L 36 38 Z" fill="none" stroke="#A85454" stroke-width="0.8" stroke-opacity="0.5"/>
    <circle cx="60" cy="22" r="3.2" fill="none" stroke="#A85454" stroke-width="1.5"/>
    <line x1="60" y1="25" x2="60" y2="38" stroke="#A85454" stroke-width="2.2" stroke-linecap="round"/>
    <line x1="46" y1="40" x2="74" y2="40" stroke="#A85454" stroke-width="2.2" stroke-linecap="round"/>
    <line x1="60" y1="42" x2="60" y2="86" stroke="#A85454" stroke-width="2.6" stroke-linecap="round"/>
    <path d="M 56 82 L 60 90 L 64 82" fill="none" stroke="#A85454" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round"/>
    <circle cx="42" cy="40" r="1.5" fill="#A85454"/>
    <circle cx="78" cy="40" r="1.5" fill="#A85454"/>
  </svg></div>
            <div class="tia-arch-iconbox-label">The Warrior</div>
          </div>
          <div class="tia-arch-content">
            <p class="tia-framing">The Warrior is the part of you that handles threat. Whether the threat is physical, social, professional, or emotional, the Warrior is what comes online. But "handling threat" isn't one capacity — it's four, and which one runs the show shapes a great deal of how you move through the world.</p>

            <dl class="tia-subscales">
              <dt>Threat Sensitivity</dt>
              <dd>The anxious vigilance system. Scanning for risk, worrying about mistakes, anticipating what could go wrong. This is the <em>detection</em> layer. High Threat Sensitivity makes you see things others miss; it can also exhaust you.</dd>

              <dt>Fight</dt>
              <dd>Confrontational defense. Pushing back, holding ground, engaging the threat directly. The capacity to say no, to argue, to refuse to yield.</dd>

              <dt>Flight</dt>
              <dd>Escape and damage control. Securing position, getting out, minimizing exposure. Less glamorous than Fight but often the wiser choice. Good Flight is strategic withdrawal, not cowardice.</dd>

              <dt>Freeze</dt>
              <dd>Immobilization and observation. Going still, watching, not committing until more information arrives. The capacity to <em>not act</em> under pressure — which is harder than it sounds.</dd>
            </dl>
          </div>
        </div>
        <div class="tia-arch-bottom">
          <h4 class="tia-h4">The most interesting combination: Threat Sensitivity without an active defense response</h4>
          <p>This is anxious paralysis. The detection system is on, the action systems aren't. You see every risk, you can't pick a response, you ruminate. Common in people described as "anxious overthinkers." From the inside it feels like being trapped between possibilities.</p>
          <p>The inverse is also revealing: <strong>Fight without Threat Sensitivity</strong>. Combat-ready but not alarm-aware. Escalates conflicts that didn't need to escalate, picks battles for the wrong reasons, mistakes everything for an attack. Often described as "always angry" — but the underlying issue is calibration, not aggression.</p>

          <h4 class="tia-h4">Also worth knowing</h4>
          <p>Freeze gets a bad reputation but is often the most cognitively sophisticated mode — you're not paralyzed, you're gathering. Some of the best decision-makers under pressure freeze first, then act. The signature of an unhealthy Freeze is when it never resolves into action; the signature of a healthy one is that it does.</p>
          <p>The classical "fight or flight" framing is a simplification. Real-world threat response is fight <em>or</em> flight <em>or</em> freeze — and the fourth, less-discussed option, <em>tend and befriend</em> (turning toward others under stress), is what tips Warrior into Lover territory.</p>
        </div>
      </article>

      <article class="tia-arch" id="tia-lover" style="--arch-color:#8B5E5E">
        <div class="tia-arch-top">
          <div class="tia-arch-iconbox">
            <div class="tia-arch-iconbox-svg"><svg viewBox="0 0 120 120" role="img" aria-label="Lover — adult holding child">
    <title>Lover — adult holding child</title>
    <circle cx="60" cy="60" r="54" fill="rgba(139,94,94,0.06)"/>
    <circle cx="56" cy="32" r="10" fill="#8B5E5E" stroke="#8B5E5E" stroke-width="1.5"/>
    <path d="M 56 43 Q 42 46 40 64 Q 40 84 44 100 L 72 100 Q 72 84 72 64 Q 70 46 56 43 Z" fill="#8B5E5E" stroke="#8B5E5E" stroke-width="1.5" stroke-linejoin="round"/>
    <circle cx="62" cy="58" r="8" fill="#C49494" stroke="#8B5E5E" stroke-width="1.3"/>
    <path d="M 62 67 Q 52 70 50 84 Q 50 94 53 100 L 73 100 Q 76 94 76 84 Q 74 70 62 67 Z" fill="#C49494" stroke="#8B5E5E" stroke-width="1.3" stroke-linejoin="round"/>
    <line x1="22" y1="102" x2="96" y2="102" stroke="#8B5E5E" stroke-width="0.8" stroke-opacity="0.35" stroke-linecap="round"/>
  </svg></div>
            <div class="tia-arch-iconbox-label">The Lover</div>
          </div>
          <div class="tia-arch-content">
            <p class="tia-framing">The Lover is the part of you that turns toward other people — but "turning toward" has at least four distinct flavors, and the differences between them are some of the most consequential in adult life.</p>

            <dl class="tia-subscales">
              <dt>Empathic Concern</dt>
              <dd>Feeling <em>for</em> others. Warmth, tenderness, the heart-going-out response. Genuine care about another person's wellbeing.</dd>

              <dt>Perspective Taking</dt>
              <dd>Cognitive empathy. The capacity to see through someone else's eyes, model their mental state, understand why their position makes sense to them. This is empathy as a <em>thinking</em> operation.</dd>

              <dt>Fantasy</dt>
              <dd>Imaginative immersion in others' experiences, real or fictional. The capacity to inhabit a character, a friend, a stranger you read about. Often shows up in fiction-readers and creatives.</dd>

              <dt>Personal Distress</dt>
              <dd>Your own distress in response to others' distress. The "I can't bear to see them in pain" response. Looks like empathy but is technically about your nervous system, not theirs.</dd>
            </dl>
          </div>
        </div>
        <div class="tia-arch-bottom">
          <h4 class="tia-h4">The most interesting combination: Empathic Concern with vs. without Personal Distress</h4>
          <p>This is the difference between sustainable caring and burnout-prone caring, and it's one of the most clinically important distinctions in personality.</p>
          <p><strong>EC high, PD low</strong> is the healthy helper. They feel for you, they show up, they help — and they go home and sleep. Their nervous system stays regulated even when yours isn't. They can hear hard things without absorbing them.</p>
          <p><strong>EC high, PD high</strong> is the vulnerable empath. They feel for you <em>and</em> their own system floods with your distress. They're often extraordinarily attuned and effective in short bursts — and they collapse. The classic codependent caregiver. The therapist who burns out. The friend who vanishes after a hard conversation because they need a week to recover.</p>
          <p>The work isn't to care less. It's to build the regulatory capacity that lets EC operate without PD overwhelming it. This is what mature empathy actually is.</p>

          <h4 class="tia-h4">Also worth knowing</h4>
          <p><strong>Perspective Taking without Empathic Concern</strong> is cognitive empathy uncoupled from warmth — the capacity to read someone perfectly without caring about them. It's a useful skill in negotiation, sales, and psychotherapy when paired with values; it's the central feature of dark-triad personalities when not.</p>
          <p><strong>Empathic Concern without Perspective Taking</strong> is the warm projector — cares deeply but assumes everyone shares their feelings. Often inadvertently invasive: "I know just how you feel" when in fact they don't.</p>
        </div>
      </article>

      <article class="tia-arch" id="tia-strategist" style="--arch-color:#5B6B8B">
        <div class="tia-arch-top">
          <div class="tia-arch-iconbox">
            <div class="tia-arch-iconbox-svg"><svg viewBox="0 0 120 120" role="img" aria-label="Strategist — node map">
    <title>Strategist — node map</title>
    <circle cx="60" cy="60" r="54" fill="rgba(91,107,139,0.06)"/>
    <line x1="38" y1="32" x2="62" y2="48" stroke="#5B6B8B" stroke-width="2" stroke-linecap="round" stroke-opacity="0.85"/>
    <line x1="62" y1="48" x2="86" y2="58" stroke="#5B6B8B" stroke-width="2" stroke-linecap="round" stroke-opacity="0.85"/>
    <line x1="62" y1="48" x2="50" y2="80" stroke="#5B6B8B" stroke-width="1.8" stroke-linecap="round" stroke-opacity="0.75"/>
    <line x1="50" y1="80" x2="80" y2="88" stroke="#5B6B8B" stroke-width="1.3" stroke-linecap="round" stroke-opacity="0.55"/>
    <line x1="86" y1="58" x2="92" y2="86" stroke="#5B6B8B" stroke-width="1.3" stroke-linecap="round" stroke-opacity="0.55"/>
    <line x1="38" y1="32" x2="28" y2="58" stroke="#5B6B8B" stroke-width="1.3" stroke-linecap="round" stroke-opacity="0.55"/>
    <line x1="28" y1="58" x2="50" y2="80" stroke="#5B6B8B" stroke-width="0.8" stroke-linecap="round" stroke-opacity="0.4"/>
    <line x1="80" y1="88" x2="92" y2="86" stroke="#5B6B8B" stroke-width="0.8" stroke-linecap="round" stroke-opacity="0.4"/>
    <line x1="38" y1="32" x2="86" y2="58" stroke="#5B6B8B" stroke-width="0.7" stroke-linecap="round" stroke-opacity="0.3"/>
    <circle cx="62" cy="48" r="8" fill="rgba(91,107,139,0.22)" stroke="#5B6B8B" stroke-width="2"/>
    <circle cx="62" cy="48" r="2.5" fill="#5B6B8B"/>
    <circle cx="38" cy="32" r="6" fill="rgba(91,107,139,0.15)" stroke="#5B6B8B" stroke-width="1.6"/>
    <circle cx="86" cy="58" r="6" fill="rgba(91,107,139,0.15)" stroke="#5B6B8B" stroke-width="1.6"/>
    <circle cx="50" cy="80" r="5.5" fill="rgba(91,107,139,0.15)" stroke="#5B6B8B" stroke-width="1.5"/>
    <circle cx="28" cy="58" r="4" fill="rgba(91,107,139,0.1)" stroke="#5B6B8B" stroke-width="1.2"/>
    <circle cx="80" cy="88" r="3.5" fill="rgba(91,107,139,0.1)" stroke="#5B6B8B" stroke-width="1.2"/>
    <circle cx="92" cy="86" r="3" fill="rgba(91,107,139,0.1)" stroke="#5B6B8B" stroke-width="1"/>
  </svg></div>
            <div class="tia-arch-iconbox-label">The Strategist</div>
          </div>
          <div class="tia-arch-content">
            <p class="tia-framing">The Strategist is the part of you that thinks ahead, reads patterns, and tries to figure out what's actually going on. Three different cognitive capacities make up the Strategist, and the differences between them are easy to miss but hugely consequential.</p>

            <dl class="tia-subscales">
              <dt>Future Consequences</dt>
              <dd>Orientation toward long-term outcomes. The capacity to weigh what happens later against what's pleasant now. Some people feel the future as vividly as the present; others can barely make it real.</dd>

              <dt>Analytical Thinking</dt>
              <dd>Preference for systematic evaluation, pattern recognition, complex problems. The "thinks for fun" trait. Distinct from intelligence — some very smart people don't enjoy thinking, and some less brilliant people love it.</dd>

              <dt>Cognitive Flexibility</dt>
              <dd>Capacity to reframe, adapt plans, hold multiple representations of a situation simultaneously. The unstuck-ness factor. What lets you change your mind when the data changes.</dd>
            </dl>
          </div>
        </div>
        <div class="tia-arch-bottom">
          <h4 class="tia-h4">The most interesting combination: Future Consequences without Cognitive Flexibility</h4>
          <p>This is the brittle planner. Future-oriented, builds detailed plans, lives by the long arc — and gets shattered when reality diverges from the plan. "But the strategy said…" Common in people who succeeded early through planning and then hit a wall they can't model their way through.</p>
          <p>The compound trait — "plans well <em>and</em> adapts" — is rarer than either component. Most "strategic" people are strong on one and weak on the other.</p>
          <p>The inverse, <strong>Cognitive Flexibility without Future Consequences</strong>, is the situational surfer. Adapts beautifully to whatever's happening but never builds a long arc. Resilient in the short term, drifting in the long term.</p>

          <h4 class="tia-h4">Also worth knowing</h4>
          <p>Analytical Thinking is independent of intelligence in interesting ways. High-Analytical people enjoy thinking through problems even when they're not great at it; low-Analytical people may be brilliant but find sustained analysis exhausting. Coaching a low-Analytical, high-Future-Consequences person looks completely different from coaching a high-Analytical, low-Future-Consequences one — even though both might score "high Strategist."</p>
        </div>
      </article>

      <article class="tia-arch" id="tia-visionary" style="--arch-color:#6B5B8B">
        <div class="tia-arch-top">
          <div class="tia-arch-iconbox">
            <div class="tia-arch-iconbox-svg"><svg viewBox="0 0 120 120" role="img" aria-label="Visionary compass">
    <title>Visionary compass</title>
    <circle cx="60" cy="60" r="54" fill="rgba(107,91,139,0.06)"/>
    <circle cx="60" cy="60" r="38" fill="rgba(107,91,139,0.06)" stroke="#6B5B8B" stroke-width="1.8"/>
    <circle cx="60" cy="60" r="30" fill="none" stroke="#6B5B8B" stroke-width="0.8" stroke-opacity="0.5"/>
    <path d="M 60 28 L 64 60 L 60 64 L 56 60 Z" fill="#6B5B8B" stroke="#6B5B8B" stroke-width="1" stroke-linejoin="round"/>
    <path d="M 60 92 L 64 60 L 60 56 L 56 60 Z" fill="rgba(107,91,139,0.15)" stroke="#6B5B8B" stroke-width="1.2" stroke-linejoin="round"/>
    <path d="M 90 60 L 64 56 L 60 60 L 64 64 Z" fill="rgba(107,91,139,0.1)" stroke="#6B5B8B" stroke-width="1" stroke-linejoin="round"/>
    <path d="M 30 60 L 56 56 L 60 60 L 56 64 Z" fill="rgba(107,91,139,0.1)" stroke="#6B5B8B" stroke-width="1" stroke-linejoin="round"/>
    <circle cx="60" cy="60" r="3" fill="#6B5B8B"/>
    <line x1="60" y1="18" x2="60" y2="22" stroke="#6B5B8B" stroke-width="1.5" stroke-linecap="round"/>
    <line x1="60" y1="98" x2="60" y2="102" stroke="#6B5B8B" stroke-width="1" stroke-linecap="round" stroke-opacity="0.6"/>
    <line x1="18" y1="60" x2="22" y2="60" stroke="#6B5B8B" stroke-width="1" stroke-linecap="round" stroke-opacity="0.6"/>
    <line x1="98" y1="60" x2="102" y2="60" stroke="#6B5B8B" stroke-width="1" stroke-linecap="round" stroke-opacity="0.6"/>
  </svg></div>
            <div class="tia-arch-iconbox-label">The Visionary</div>
          </div>
          <div class="tia-arch-content">
            <p class="tia-framing">The Visionary is the part of you that asks what your life is for. It's the meaning-making capacity — and it has more distinct components than any other capacity.</p>

            <dl class="tia-subscales">
              <dt>Presence of Meaning</dt>
              <dd>The felt sense that your life has purpose. "I know why I'm here." A <em>current state</em> of meaningfulness.</dd>

              <dt>Search for Meaning</dt>
              <dd>Active questioning of purpose. "I'm working out why I'm here." A <em>process</em> of meaning-making. Importantly, not the inverse of Presence — they're partly orthogonal.</dd>

              <dt>Self-Transcendence</dt>
              <dd>Identification with something larger than yourself. This subscale has two flavors that the assessment treats separately:
                <ul class="tia-sublist">
                  <li><em>Secular Self-Transcendence</em> — legacy, contribution, future generations, the cause that outlasts you. The "I served something bigger than me" frame.</li>
                  <li><em>Spiritual Self-Transcendence</em> — identification with cosmos, openness to mystery, transpersonal experience, the felt sense of being part of a larger whole that may not be reducible to legacy or impact. Some people experience this through religion, some through nature, some through art, some through contemplative practice.</li>
                </ul>
              </dd>

              <dt>Positive Reframing</dt>
              <dd>The coping capacity that transforms difficulty into growth or meaning. The "this is part of a larger story" move you make under pressure.</dd>
            </dl>
          </div>
        </div>
        <div class="tia-arch-bottom">
          <h4 class="tia-h4">The most interesting combination: Presence × Search</h4>
          <p>These two are almost-orthogonal, which means there are four distinct positions and they feel completely different from the inside.</p>
          <p><strong>High Presence, low Search:</strong> Settled meaning. "I know my purpose and I'm not looking for more." Can be deep clarity. Can also be foreclosed — you stopped questioning at 25 and never reopened the question.</p>
          <p><strong>Low Presence, high Search:</strong> Active seeker. The meaning-quest is on. Often present in transitions, post-crisis recovery, mid-life pivots, spiritual openings. Uncomfortable but generative.</p>
          <p><strong>High Presence, high Search:</strong> The reflective-but-grounded type. Has meaning, keeps questioning whether it's the right meaning. Tends to deepen over time. Often the most resilient.</p>
          <p><strong>Low Presence, low Search:</strong> Drifting without distress. Can be peaceful (think Buddhist non-grasping) or numbed (think mild depression). The two look identical from outside and feel completely different inside.</p>

          <h4 class="tia-h4">The other interesting combination: Presence × Self-Transcendence</h4>
          <p>You can have meaning that's entirely about your own life — your craft, your family, your relationships, the texture of your days — and that's high Presence with low Self-Transcendence. Fulfilled, just personal.</p>
          <p>You can have a strong sense of serving something larger without knowing what to do with your specific life — that's high Self-Transcendence with low Presence. Often shows up in idealistic young people who haven't yet found the form their contribution should take.</p>
          <p>People in meaning crises often think the problem is Presence (no purpose) when it's actually Self-Transcendence (purpose exists but feels small). The interventions are different. Building meaning means finding what you care about. Expanding the frame means finding how what you care about connects to something larger than your own life.</p>

          <h4 class="tia-h4">Also worth knowing</h4>
          <p><strong>Positive Reframing without Presence</strong> is sophisticated coping that masks emptiness. The person who narrates every difficulty as "growth" without having a stable core meaning. The reframes are real, the coping is real — and there's nothing underneath. Worth knowing about because Positive Reframing can look like resilience right up until it stops working.</p>
          <p><strong>Spiritual Self-Transcendence</strong> is the most controversial subscale in academic psychology because it correlates with mystical experience and openness to non-rational knowing — which makes it suspicious to some researchers and central to others. It tends to correlate with creativity, openness to experience, and some forms of wisdom. It can also, untethered from grounding, drift into ungroundedness. Like every capacity, its value depends on what it's coupled with.</p>
        </div>
      </article>

      <!-- ═══════════════════════════════════════════════════════════════ -->
      <!-- CHAIN: emotion as diagnostic (cross-cutting view) -->
      <!-- ═══════════════════════════════════════════════════════════════ -->
      <div class="chain-block">
        <h3 class="chain-title">Emotion as diagnostic <span class="chain-title-sub">— the cross-cutting view</span></h3>
        <p class="chain-intro">The Five Core Capacities above are the entry point. Underneath them sits a deeper structure: <strong>five evolutionary substrates</strong> — Egoist, Veteran, Lover, Strategist, Visionary — and <strong>two drives</strong> that run through every substrate: Hedonist (seeking pleasure) and Warrior (avoiding pain). The same drive feels different at each layer of the system. The grid below maps that — seven emotion families across the five substrates. Every emotion you can name is also a diagnostic: it tells you which level of the system is active and which way the drive is pointing.</p>

        <div class="chain-grid">
          <div class="chain-grid-header">
            <div></div>
            <div class="chain-substrate" style="--sub-color:#B89169">Egoist</div>
            <div class="chain-substrate" style="--sub-color:#7B8189">Veteran</div>
            <div class="chain-substrate" style="--sub-color:var(--L)">Lover</div>
            <div class="chain-substrate" style="--sub-color:var(--S)">Strategist</div>
            <div class="chain-substrate" style="--sub-color:var(--V)">Visionary</div>
          </div>

          <div class="chain-row" style="--row-color:#D4A854">
            <div class="chain-row-label">
              <div class="chain-row-name">Hedonist achieved</div>
              <div class="chain-row-desc">Seeking pleasure works</div>
            </div>
            <div class="chain-cell">Pleasure</div>
            <div class="chain-cell">Anticipation</div>
            <div class="chain-cell">Love</div>
            <div class="chain-cell">Fulfillment</div>
            <div class="chain-cell">Purpose</div>
          </div>

          <div class="chain-row" style="--row-color:#B89169">
            <div class="chain-row-label">
              <div class="chain-row-name">Hedonist thwarted inward</div>
              <div class="chain-row-desc">The inadequacy turn</div>
            </div>
            <div class="chain-cell">Empty</div>
            <div class="chain-cell">Frustration</div>
            <div class="chain-cell">Lonely</div>
            <div class="chain-cell">Inferiority</div>
            <div class="chain-cell">Hopeless</div>
          </div>

          <div class="chain-row" style="--row-color:#C77C58">
            <div class="chain-row-label">
              <div class="chain-row-name">Hedonist thwarted outward</div>
              <div class="chain-row-desc">The anger turn</div>
            </div>
            <div class="chain-cell">Tantrum</div>
            <div class="chain-cell">Rage</div>
            <div class="chain-cell">Betrayal</div>
            <div class="chain-cell">Outrage</div>
            <div class="chain-cell">Moral fury</div>
          </div>

          <div class="chain-row" style="--row-color:#6F8B5E">
            <div class="chain-row-label">
              <div class="chain-row-name">Warrior succeeded</div>
              <div class="chain-row-desc">Avoiding pain works</div>
            </div>
            <div class="chain-cell">Relief</div>
            <div class="chain-cell">Vindication</div>
            <div class="chain-cell">Pride</div>
            <div class="chain-cell">Confidence</div>
            <div class="chain-cell">Honor</div>
          </div>

          <div class="chain-row" style="--row-color:#A85454">
            <div class="chain-row-label">
              <div class="chain-row-name">Warrior triggered</div>
              <div class="chain-row-desc">Pain registers</div>
            </div>
            <div class="chain-cell">Pain</div>
            <div class="chain-cell">Fear</div>
            <div class="chain-cell">Grief</div>
            <div class="chain-cell">Despair</div>
            <div class="chain-cell">Anhedonia</div>
          </div>

          <div class="chain-row" style="--row-color:#7B7C4E">
            <div class="chain-row-label">
              <div class="chain-row-name">Disgust</div>
              <div class="chain-row-desc">Contamination signal</div>
            </div>
            <div class="chain-cell">Visceral disgust</div>
            <div class="chain-cell">Aversion</div>
            <div class="chain-cell">Contempt</div>
            <div class="chain-cell">Repugnance</div>
            <div class="chain-cell">Moral disgust</div>
          </div>

          <div class="chain-row" style="--row-color:#6B5B8B">
            <div class="chain-row-label">
              <div class="chain-row-name">Surprise</div>
              <div class="chain-row-desc">Orientation, pre-valence</div>
            </div>
            <div class="chain-cell">Startle</div>
            <div class="chain-cell">Surprise</div>
            <div class="chain-cell">Astonishment</div>
            <div class="chain-cell">Bewilderment</div>
            <div class="chain-cell">Awe</div>
          </div>
        </div>

        <p class="chain-foot">Read horizontally: the same drive-state expressed at increasing levels of the evolved nervous system. Read vertically: the emotional repertoire of one substrate across its drive-states. <em>Anxiety</em> isn't generic — it's the Strategist substrate registering Warrior alarm. <em>Moral fury</em> is the Visionary substrate registering Hedonist thwarted outward. Every emotion you feel is information about which part of you is doing what.</p>
      </div>
    </div>

    </section>
    <!-- end SECTION 2 -->

    <!-- ═══ SECTION 3: ASSESSMENT METHODOLOGY ═══ -->
    <section class="found-section" id="found-method">
      <h2 class="found-section-title">Assessment methodology</h2>

    <!-- METHODOLOGY -->
    <div class="found-meth">
      <p><strong>Format:</strong> Situational Judgment Test (SJT) — a well-established psychometric format with strong literature supporting its validity for assessing behavioral preferences and decision-making patterns. SJTs avoid the social desirability bias of Likert-scale self-report.</p>
      <div class="found-meth-cite">McDaniel, M.A., Hartman, N.S., Whetzel, D.L., &amp; Grubb, W.L. (2007). Situational judgment tests, response instructions, and validity: A meta-analysis. <em>Personnel Psychology</em>, 60, 63–91.</div>
      <p><strong>Pressure embedding:</strong> Drawing on Carver's (1997) Brief COPE and the broader stress-coping literature, roughly half the scenarios involve threat / pressure contexts. This allows calculation of baseline vs. pressure profiles from a single administration, rather than requiring two separate instruments.</p>
    </div>

    <!-- COVERAGE MATRIX -->
    <div class="cov-section">
      <h3>Subscale coverage matrix</h3>
      <p>Each capacity's items map to specific subscales of the validated reference instruments listed above. This matrix shows item counts per subscale, broken down by section, and whether differential analysis (baseline vs. pressure) is meaningfully possible.</p>

      <div class="cov-wrap">
        <table class="cov-table">
          <thead>
            <tr>
              <th>Subscale</th>
              <th class="ctr">B</th>
              <th class="ctr">P</th>
              <th class="ctr">I</th>
              <th class="ctr">Total</th>
              
            </tr>
          </thead>
          <tbody>
            <!-- HEDONIST -->
            <tr class="cov-arch-row"><td colspan="5" style="color:var(--H)">☀ Hedonist</td></tr>
            <tr>
              <td>Reward Responsiveness</td>
              <td class="ctr">2</td><td class="ctr">1</td><td class="ctr">1</td>
              <td class="ctr tot">4</td>
            </tr>
            <tr>
              <td>Drive</td>
              <td class="ctr">2</td><td class="ctr">1</td><td class="ctr">1</td>
              <td class="ctr tot">4</td>
            </tr>
            <tr>
              <td>Fun Seeking</td>
              <td class="ctr">2</td><td class="ctr">1</td><td class="ctr">0</td>
              <td class="ctr tot">3</td>
            </tr>

            <!-- WARRIOR -->
            <tr class="cov-arch-row"><td colspan="5" style="color:var(--W)">⚔ Warrior</td></tr>
            <tr>
              <td>Threat Sensitivity</td>
              <td class="ctr">5</td><td class="ctr">2</td><td class="ctr">0</td>
              <td class="ctr tot">7</td>
            </tr>
            <tr>
              <td>Fight</td>
              <td class="ctr">1</td><td class="ctr">3</td><td class="ctr">2</td>
              <td class="ctr tot">6</td>
            </tr>
            <tr>
              <td>Flight</td>
              <td class="ctr">0</td><td class="ctr">2</td><td class="ctr">0</td>
              <td class="ctr tot">2</td>
            </tr>

            <!-- LOVER -->
            <tr class="cov-arch-row"><td colspan="5" style="color:var(--L)">♡ Lover</td></tr>
            <tr>
              <td>Empathic Concern</td>
              <td class="ctr">4</td><td class="ctr">3</td><td class="ctr">1</td>
              <td class="ctr tot">8</td>
            </tr>
            <tr>
              <td>Perspective Taking</td>
              <td class="ctr">2</td><td class="ctr">2</td><td class="ctr">1</td>
              <td class="ctr tot">5</td>
            </tr>
            <tr>
              <td>Personal Distress</td>
              <td class="ctr">0</td><td class="ctr">2</td><td class="ctr">0</td>
              <td class="ctr tot">2</td>
            </tr>

            <!-- STRATEGIST -->
            <tr class="cov-arch-row"><td colspan="5" style="color:var(--S)">◈ Strategist</td></tr>
            <tr>
              <td>Future Consequences</td>
              <td class="ctr">0</td><td class="ctr">1</td><td class="ctr">1</td>
              <td class="ctr tot">2</td>
            </tr>
            <tr>
              <td>Analytical Thinking</td>
              <td class="ctr">5</td><td class="ctr">5</td><td class="ctr">1</td>
              <td class="ctr tot">11</td>
            </tr>
            <tr>
              <td>Cognitive Flexibility</td>
              <td class="ctr">1</td><td class="ctr">1</td><td class="ctr">0</td>
              <td class="ctr tot">2</td>
            </tr>

            <!-- VISIONARY -->
            <tr class="cov-arch-row"><td colspan="5" style="color:var(--V)">✧ Visionary</td></tr>
            <tr>
              <td>Presence of Meaning</td>
              <td class="ctr">5</td><td class="ctr">2</td><td class="ctr">1</td>
              <td class="ctr tot">8</td>
            </tr>
            <tr>
              <td>Search for Meaning</td>
              <td class="ctr">1</td><td class="ctr">4</td><td class="ctr">0</td>
              <td class="ctr tot">5</td>
            </tr>
            <tr>
              <td>Self-Transcendence</td>
              <td class="ctr">0</td><td class="ctr">1</td><td class="ctr">1</td>
              <td class="ctr tot">2</td>
            </tr>
          </tbody>
        </table>
      </div>

      <p class="cov-note">B = Baseline · P = Pressure · I = Identity. Some subscales (Flight, Personal Distress) are pressure-only by construct nature — they don't manifest at baseline by design.</p>
    </div>

    <!-- IS / IS NOT -->
    <div class="found-isnot">
      <div class="found-isnot-cell is">
        <div class="found-isnot-lbl">What this is</div>
        <div class="found-isnot-body">A well-grounded, theoretically informed tool for self-reflection and coaching conversations. Each capacity maps to established psychological constructs with validated instruments as reference points.</div>
      </div>
      <div class="found-isnot-cell isnot">
        <div class="found-isnot-lbl">What this is not (yet)</div>
        <div class="found-isnot-body">A psychometrically validated instrument. Validation would require administering these items plus the reference instruments to 200–300 participants, then confirming through factor analysis that five factors emerge corresponding to the five capacities, and that scores show convergent and discriminant validity against established measures.</div>
      </div>
    </div>

    </section>
    <!-- end SECTION 3 -->

    <button class="btn btn-ghost btn-sm" onclick="closeFoundations()" style="margin-top:32px">← Back</button>
    <div class="footer" style="text-align:left;padding:32px 0 0">© Jennifer May / Incite Leadership</div>
  </div>
</div>

<div class="toast" id="toast"></div>

<!-- Capacity detail modal — opened from home page boxes and results page deep-dive links -->
<div class="arch-modal-backdrop" id="arch-modal-backdrop" onclick="if(event.target === this) closeArchModal()">
  <div class="arch-modal" role="dialog" aria-modal="true" aria-labelledby="arch-modal-title">
    <button class="arch-modal-close" onclick="closeArchModal()" aria-label="Close">×</button>
    <div id="arch-modal-content"></div>
  </div>
</div>


`;

// LSA_SCRIPT now imported as raw string from ./LCA_runtime.js?raw (see top of file)
// Once we've initialized once, don't re-init on subsequent mounts of the same
// React instance — the original script attaches global functions and runs
// startup logic that should not be repeated.

const LSA_TIA_BLOCKS = {
  hedonist: "<article class=\"tia-arch\" id=\"tia-hedonist\" style=\"--arch-color:#D4A854\">\n        <div class=\"tia-arch-top\">\n          <div class=\"tia-arch-iconbox\">\n            <div class=\"tia-arch-iconbox-svg\"><svg viewBox=\"0 0 120 120\" role=\"img\" aria-label=\"Hedonist sun\">\n    <title>Hedonist sun</title>\n    <circle cx=\"60\" cy=\"60\" r=\"54\" fill=\"rgba(212,168,84,0.06)\"/>\n    <g stroke=\"#D4A854\" stroke-width=\"2\" stroke-linecap=\"round\">\n      <line x1=\"60\" y1=\"14\" x2=\"60\" y2=\"26\"/>\n      <line x1=\"60\" y1=\"94\" x2=\"60\" y2=\"106\"/>\n      <line x1=\"14\" y1=\"60\" x2=\"26\" y2=\"60\"/>\n      <line x1=\"94\" y1=\"60\" x2=\"106\" y2=\"60\"/>\n      <line x1=\"27.5\" y1=\"27.5\" x2=\"36\" y2=\"36\"/>\n      <line x1=\"84\" y1=\"84\" x2=\"92.5\" y2=\"92.5\"/>\n      <line x1=\"92.5\" y1=\"27.5\" x2=\"84\" y2=\"36\"/>\n      <line x1=\"36\" y1=\"84\" x2=\"27.5\" y2=\"92.5\"/>\n    </g>\n    <g stroke=\"#D4A854\" stroke-width=\"1.3\" stroke-linecap=\"round\" stroke-opacity=\"0.6\">\n      <line x1=\"40\" y1=\"18\" x2=\"43.5\" y2=\"27.5\"/>\n      <line x1=\"80\" y1=\"18\" x2=\"76.5\" y2=\"27.5\"/>\n      <line x1=\"40\" y1=\"102\" x2=\"43.5\" y2=\"92.5\"/>\n      <line x1=\"80\" y1=\"102\" x2=\"76.5\" y2=\"92.5\"/>\n      <line x1=\"18\" y1=\"40\" x2=\"27.5\" y2=\"43.5\"/>\n      <line x1=\"18\" y1=\"80\" x2=\"27.5\" y2=\"76.5\"/>\n      <line x1=\"102\" y1=\"40\" x2=\"92.5\" y2=\"43.5\"/>\n      <line x1=\"102\" y1=\"80\" x2=\"92.5\" y2=\"76.5\"/>\n    </g>\n    <circle cx=\"60\" cy=\"60\" r=\"20\" fill=\"rgba(212,168,84,0.08)\" stroke=\"#D4A854\" stroke-width=\"1.8\"/>\n    <circle cx=\"60\" cy=\"60\" r=\"3\" fill=\"#D4A854\"/>\n  </svg></div>\n            <div class=\"tia-arch-iconbox-label\">The Hedonist</div>\n          </div>\n          <div class=\"tia-arch-content\">\n            <p class=\"tia-framing\">The Hedonist is the part of you that goes <em>toward</em> \u2014 toward pleasure, toward novelty, toward the thing that lights you up. But \"going toward\" decomposes into three different engines, and they don't always run together.</p>\n\n            <dl class=\"tia-subscales\">\n              <dt>Reward Responsiveness</dt>\n              <dd>The visceral, body-level response to good things happening. Savoring. The way some people light up when praised, taste their food, feel the moment land. This is your capacity to <em>receive</em> pleasure.</dd>\n\n              <dt>Drive</dt>\n              <dd>Sustained pursuit of what you want. Going after it. The persistent effort that closes the gap between desire and outcome. This is your capacity to <em>go after</em> pleasure.</dd>\n\n              <dt>Fun Seeking</dt>\n              <dd>Appetite for novelty and spontaneity. Willingness to act on impulse for new experience. Boredom intolerance, in the productive sense. This is your capacity to <em>seek</em> pleasure in unfamiliar territory.</dd>\n            </dl>\n          </div>\n        </div>\n        <div class=\"tia-arch-bottom\">\n          <h4 class=\"tia-h4\">The most interesting combination: Drive without Reward Responsiveness</h4>\n          <p>This is the achievement runner. Strong pursuit machinery, weak savoring machinery. They climb the ladder, hit the goal, get the promotion \u2014 and feel nothing. The dopamine of pursuit isn't matched by satisfaction at arrival, so they immediately set the next goal.</p>\n          <p>It's one of the most common patterns in high-performers. From outside it looks like drive. From inside it can feel like an inability to land. The fix isn't more drive; it's relearning Reward Responsiveness \u2014 the capacity to actually feel what you've already won.</p>\n          <p>The inverse \u2014 high Reward Responsiveness, low Drive \u2014 is the person who deeply enjoys life when good things arrive but doesn't chase them. Often peaceful, sometimes underemployed relative to capacity.</p>\n\n          <h4 class=\"tia-h4\">Also worth knowing</h4>\n          <p>High Fun Seeking with low Drive produces the dabbler \u2014 many starts, few finishes. High Drive with low Fun Seeking produces the disciplined executor \u2014 gets things done but resists novelty, can become rigid in middle age.</p>\n        </div>\n      </article>",
  warrior: "<article class=\"tia-arch\" id=\"tia-warrior\" style=\"--arch-color:#A85454\">\n        <div class=\"tia-arch-top\">\n          <div class=\"tia-arch-iconbox\">\n            <div class=\"tia-arch-iconbox-svg\"><svg viewBox=\"0 0 120 120\" role=\"img\" aria-label=\"Warrior shield\">\n    <title>Warrior shield</title>\n    <circle cx=\"60\" cy=\"60\" r=\"54\" fill=\"rgba(168,84,84,0.06)\"/>\n    <path d=\"M 60 24 L 92 32 L 92 60 Q 92 84 60 102 Q 28 84 28 60 L 28 32 Z\" fill=\"rgba(168,84,84,0.08)\" stroke=\"#A85454\" stroke-width=\"1.8\" stroke-linejoin=\"round\"/>\n    <path d=\"M 60 32 L 84 38 L 84 60 Q 84 78 60 92 Q 36 78 36 60 L 36 38 Z\" fill=\"none\" stroke=\"#A85454\" stroke-width=\"0.8\" stroke-opacity=\"0.5\"/>\n    <circle cx=\"60\" cy=\"22\" r=\"3.2\" fill=\"none\" stroke=\"#A85454\" stroke-width=\"1.5\"/>\n    <line x1=\"60\" y1=\"25\" x2=\"60\" y2=\"38\" stroke=\"#A85454\" stroke-width=\"2.2\" stroke-linecap=\"round\"/>\n    <line x1=\"46\" y1=\"40\" x2=\"74\" y2=\"40\" stroke=\"#A85454\" stroke-width=\"2.2\" stroke-linecap=\"round\"/>\n    <line x1=\"60\" y1=\"42\" x2=\"60\" y2=\"86\" stroke=\"#A85454\" stroke-width=\"2.6\" stroke-linecap=\"round\"/>\n    <path d=\"M 56 82 L 60 90 L 64 82\" fill=\"none\" stroke=\"#A85454\" stroke-width=\"1.6\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/>\n    <circle cx=\"42\" cy=\"40\" r=\"1.5\" fill=\"#A85454\"/>\n    <circle cx=\"78\" cy=\"40\" r=\"1.5\" fill=\"#A85454\"/>\n  </svg></div>\n            <div class=\"tia-arch-iconbox-label\">The Warrior</div>\n          </div>\n          <div class=\"tia-arch-content\">\n            <p class=\"tia-framing\">The Warrior is the part of you that handles threat. Whether the threat is physical, social, professional, or emotional, the Warrior is what comes online. But \"handling threat\" isn't one capacity \u2014 it's four, and which one runs the show shapes a great deal of how you move through the world.</p>\n\n            <dl class=\"tia-subscales\">\n              <dt>Threat Sensitivity</dt>\n              <dd>The anxious vigilance system. Scanning for risk, worrying about mistakes, anticipating what could go wrong. This is the <em>detection</em> layer. High Threat Sensitivity makes you see things others miss; it can also exhaust you.</dd>\n\n              <dt>Fight</dt>\n              <dd>Confrontational defense. Pushing back, holding ground, engaging the threat directly. The capacity to say no, to argue, to refuse to yield.</dd>\n\n              <dt>Flight</dt>\n              <dd>Escape and damage control. Securing position, getting out, minimizing exposure. Less glamorous than Fight but often the wiser choice. Good Flight is strategic withdrawal, not cowardice.</dd>\n\n              <dt>Freeze</dt>\n              <dd>Immobilization and observation. Going still, watching, not committing until more information arrives. The capacity to <em>not act</em> under pressure \u2014 which is harder than it sounds.</dd>\n            </dl>\n          </div>\n        </div>\n        <div class=\"tia-arch-bottom\">\n          <h4 class=\"tia-h4\">The most interesting combination: Threat Sensitivity without an active defense response</h4>\n          <p>This is anxious paralysis. The detection system is on, the action systems aren't. You see every risk, you can't pick a response, you ruminate. Common in people described as \"anxious overthinkers.\" From the inside it feels like being trapped between possibilities.</p>\n          <p>The inverse is also revealing: <strong>Fight without Threat Sensitivity</strong>. Combat-ready but not alarm-aware. Escalates conflicts that didn't need to escalate, picks battles for the wrong reasons, mistakes everything for an attack. Often described as \"always angry\" \u2014 but the underlying issue is calibration, not aggression.</p>\n\n          <h4 class=\"tia-h4\">Also worth knowing</h4>\n          <p>Freeze gets a bad reputation but is often the most cognitively sophisticated mode \u2014 you're not paralyzed, you're gathering. Some of the best decision-makers under pressure freeze first, then act. The signature of an unhealthy Freeze is when it never resolves into action; the signature of a healthy one is that it does.</p>\n          <p>The classical \"fight or flight\" framing is a simplification. Real-world threat response is fight <em>or</em> flight <em>or</em> freeze \u2014 and the fourth, less-discussed option, <em>tend and befriend</em> (turning toward others under stress), is what tips Warrior into Lover territory.</p>\n        </div>\n      </article>",
  lover: "<article class=\"tia-arch\" id=\"tia-lover\" style=\"--arch-color:#8B5E5E\">\n        <div class=\"tia-arch-top\">\n          <div class=\"tia-arch-iconbox\">\n            <div class=\"tia-arch-iconbox-svg\"><svg viewBox=\"0 0 120 120\" role=\"img\" aria-label=\"Lover \u2014 adult holding child\">\n    <title>Lover \u2014 adult holding child</title>\n    <circle cx=\"60\" cy=\"60\" r=\"54\" fill=\"rgba(139,94,94,0.06)\"/>\n    <circle cx=\"56\" cy=\"32\" r=\"10\" fill=\"#8B5E5E\" stroke=\"#8B5E5E\" stroke-width=\"1.5\"/>\n    <path d=\"M 56 43 Q 42 46 40 64 Q 40 84 44 100 L 72 100 Q 72 84 72 64 Q 70 46 56 43 Z\" fill=\"#8B5E5E\" stroke=\"#8B5E5E\" stroke-width=\"1.5\" stroke-linejoin=\"round\"/>\n    <circle cx=\"62\" cy=\"58\" r=\"8\" fill=\"#C49494\" stroke=\"#8B5E5E\" stroke-width=\"1.3\"/>\n    <path d=\"M 62 67 Q 52 70 50 84 Q 50 94 53 100 L 73 100 Q 76 94 76 84 Q 74 70 62 67 Z\" fill=\"#C49494\" stroke=\"#8B5E5E\" stroke-width=\"1.3\" stroke-linejoin=\"round\"/>\n    <line x1=\"22\" y1=\"102\" x2=\"96\" y2=\"102\" stroke=\"#8B5E5E\" stroke-width=\"0.8\" stroke-opacity=\"0.35\" stroke-linecap=\"round\"/>\n  </svg></div>\n            <div class=\"tia-arch-iconbox-label\">The Lover</div>\n          </div>\n          <div class=\"tia-arch-content\">\n            <p class=\"tia-framing\">The Lover is the part of you that turns toward other people \u2014 but \"turning toward\" has at least four distinct flavors, and the differences between them are some of the most consequential in adult life.</p>\n\n            <dl class=\"tia-subscales\">\n              <dt>Empathic Concern</dt>\n              <dd>Feeling <em>for</em> others. Warmth, tenderness, the heart-going-out response. Genuine care about another person's wellbeing.</dd>\n\n              <dt>Perspective Taking</dt>\n              <dd>Cognitive empathy. The capacity to see through someone else's eyes, model their mental state, understand why their position makes sense to them. This is empathy as a <em>thinking</em> operation.</dd>\n\n              <dt>Fantasy</dt>\n              <dd>Imaginative immersion in others' experiences, real or fictional. The capacity to inhabit a character, a friend, a stranger you read about. Often shows up in fiction-readers and creatives.</dd>\n\n              <dt>Personal Distress</dt>\n              <dd>Your own distress in response to others' distress. The \"I can't bear to see them in pain\" response. Looks like empathy but is technically about your nervous system, not theirs.</dd>\n            </dl>\n          </div>\n        </div>\n        <div class=\"tia-arch-bottom\">\n          <h4 class=\"tia-h4\">The most interesting combination: Empathic Concern with vs. without Personal Distress</h4>\n          <p>This is the difference between sustainable caring and burnout-prone caring, and it's one of the most clinically important distinctions in personality.</p>\n          <p><strong>EC high, PD low</strong> is the healthy helper. They feel for you, they show up, they help \u2014 and they go home and sleep. Their nervous system stays regulated even when yours isn't. They can hear hard things without absorbing them.</p>\n          <p><strong>EC high, PD high</strong> is the vulnerable empath. They feel for you <em>and</em> their own system floods with your distress. They're often extraordinarily attuned and effective in short bursts \u2014 and they collapse. The classic codependent caregiver. The therapist who burns out. The friend who vanishes after a hard conversation because they need a week to recover.</p>\n          <p>The work isn't to care less. It's to build the regulatory capacity that lets EC operate without PD overwhelming it. This is what mature empathy actually is.</p>\n\n          <h4 class=\"tia-h4\">Also worth knowing</h4>\n          <p><strong>Perspective Taking without Empathic Concern</strong> is cognitive empathy uncoupled from warmth \u2014 the capacity to read someone perfectly without caring about them. It's a useful skill in negotiation, sales, and psychotherapy when paired with values; it's the central feature of dark-triad personalities when not.</p>\n          <p><strong>Empathic Concern without Perspective Taking</strong> is the warm projector \u2014 cares deeply but assumes everyone shares their feelings. Often inadvertently invasive: \"I know just how you feel\" when in fact they don't.</p>\n        </div>\n      </article>",
  strategist: "<article class=\"tia-arch\" id=\"tia-strategist\" style=\"--arch-color:#5B6B8B\">\n        <div class=\"tia-arch-top\">\n          <div class=\"tia-arch-iconbox\">\n            <div class=\"tia-arch-iconbox-svg\"><svg viewBox=\"0 0 120 120\" role=\"img\" aria-label=\"Strategist \u2014 node map\">\n    <title>Strategist \u2014 node map</title>\n    <circle cx=\"60\" cy=\"60\" r=\"54\" fill=\"rgba(91,107,139,0.06)\"/>\n    <line x1=\"38\" y1=\"32\" x2=\"62\" y2=\"48\" stroke=\"#5B6B8B\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-opacity=\"0.85\"/>\n    <line x1=\"62\" y1=\"48\" x2=\"86\" y2=\"58\" stroke=\"#5B6B8B\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-opacity=\"0.85\"/>\n    <line x1=\"62\" y1=\"48\" x2=\"50\" y2=\"80\" stroke=\"#5B6B8B\" stroke-width=\"1.8\" stroke-linecap=\"round\" stroke-opacity=\"0.75\"/>\n    <line x1=\"50\" y1=\"80\" x2=\"80\" y2=\"88\" stroke=\"#5B6B8B\" stroke-width=\"1.3\" stroke-linecap=\"round\" stroke-opacity=\"0.55\"/>\n    <line x1=\"86\" y1=\"58\" x2=\"92\" y2=\"86\" stroke=\"#5B6B8B\" stroke-width=\"1.3\" stroke-linecap=\"round\" stroke-opacity=\"0.55\"/>\n    <line x1=\"38\" y1=\"32\" x2=\"28\" y2=\"58\" stroke=\"#5B6B8B\" stroke-width=\"1.3\" stroke-linecap=\"round\" stroke-opacity=\"0.55\"/>\n    <line x1=\"28\" y1=\"58\" x2=\"50\" y2=\"80\" stroke=\"#5B6B8B\" stroke-width=\"0.8\" stroke-linecap=\"round\" stroke-opacity=\"0.4\"/>\n    <line x1=\"80\" y1=\"88\" x2=\"92\" y2=\"86\" stroke=\"#5B6B8B\" stroke-width=\"0.8\" stroke-linecap=\"round\" stroke-opacity=\"0.4\"/>\n    <line x1=\"38\" y1=\"32\" x2=\"86\" y2=\"58\" stroke=\"#5B6B8B\" stroke-width=\"0.7\" stroke-linecap=\"round\" stroke-opacity=\"0.3\"/>\n    <circle cx=\"62\" cy=\"48\" r=\"8\" fill=\"rgba(91,107,139,0.22)\" stroke=\"#5B6B8B\" stroke-width=\"2\"/>\n    <circle cx=\"62\" cy=\"48\" r=\"2.5\" fill=\"#5B6B8B\"/>\n    <circle cx=\"38\" cy=\"32\" r=\"6\" fill=\"rgba(91,107,139,0.15)\" stroke=\"#5B6B8B\" stroke-width=\"1.6\"/>\n    <circle cx=\"86\" cy=\"58\" r=\"6\" fill=\"rgba(91,107,139,0.15)\" stroke=\"#5B6B8B\" stroke-width=\"1.6\"/>\n    <circle cx=\"50\" cy=\"80\" r=\"5.5\" fill=\"rgba(91,107,139,0.15)\" stroke=\"#5B6B8B\" stroke-width=\"1.5\"/>\n    <circle cx=\"28\" cy=\"58\" r=\"4\" fill=\"rgba(91,107,139,0.1)\" stroke=\"#5B6B8B\" stroke-width=\"1.2\"/>\n    <circle cx=\"80\" cy=\"88\" r=\"3.5\" fill=\"rgba(91,107,139,0.1)\" stroke=\"#5B6B8B\" stroke-width=\"1.2\"/>\n    <circle cx=\"92\" cy=\"86\" r=\"3\" fill=\"rgba(91,107,139,0.1)\" stroke=\"#5B6B8B\" stroke-width=\"1\"/>\n  </svg></div>\n            <div class=\"tia-arch-iconbox-label\">The Strategist</div>\n          </div>\n          <div class=\"tia-arch-content\">\n            <p class=\"tia-framing\">The Strategist is the part of you that thinks ahead, reads patterns, and tries to figure out what's actually going on. Three different cognitive capacities make up the Strategist, and the differences between them are easy to miss but hugely consequential.</p>\n\n            <dl class=\"tia-subscales\">\n              <dt>Future Consequences</dt>\n              <dd>Orientation toward long-term outcomes. The capacity to weigh what happens later against what's pleasant now. Some people feel the future as vividly as the present; others can barely make it real.</dd>\n\n              <dt>Analytical Thinking</dt>\n              <dd>Preference for systematic evaluation, pattern recognition, complex problems. The \"thinks for fun\" trait. Distinct from intelligence \u2014 some very smart people don't enjoy thinking, and some less brilliant people love it.</dd>\n\n              <dt>Cognitive Flexibility</dt>\n              <dd>Capacity to reframe, adapt plans, hold multiple representations of a situation simultaneously. The unstuck-ness factor. What lets you change your mind when the data changes.</dd>\n            </dl>\n          </div>\n        </div>\n        <div class=\"tia-arch-bottom\">\n          <h4 class=\"tia-h4\">The most interesting combination: Future Consequences without Cognitive Flexibility</h4>\n          <p>This is the brittle planner. Future-oriented, builds detailed plans, lives by the long arc \u2014 and gets shattered when reality diverges from the plan. \"But the strategy said\u2026\" Common in people who succeeded early through planning and then hit a wall they can't model their way through.</p>\n          <p>The compound trait \u2014 \"plans well <em>and</em> adapts\" \u2014 is rarer than either component. Most \"strategic\" people are strong on one and weak on the other.</p>\n          <p>The inverse, <strong>Cognitive Flexibility without Future Consequences</strong>, is the situational surfer. Adapts beautifully to whatever's happening but never builds a long arc. Resilient in the short term, drifting in the long term.</p>\n\n          <h4 class=\"tia-h4\">Also worth knowing</h4>\n          <p>Analytical Thinking is independent of intelligence in interesting ways. High-Analytical people enjoy thinking through problems even when they're not great at it; low-Analytical people may be brilliant but find sustained analysis exhausting. Coaching a low-Analytical, high-Future-Consequences person looks completely different from coaching a high-Analytical, low-Future-Consequences one \u2014 even though both might score \"high Strategist.\"</p>\n        </div>\n      </article>",
  visionary: "<article class=\"tia-arch\" id=\"tia-visionary\" style=\"--arch-color:#6B5B8B\">\n        <div class=\"tia-arch-top\">\n          <div class=\"tia-arch-iconbox\">\n            <div class=\"tia-arch-iconbox-svg\"><svg viewBox=\"0 0 120 120\" role=\"img\" aria-label=\"Visionary compass\">\n    <title>Visionary compass</title>\n    <circle cx=\"60\" cy=\"60\" r=\"54\" fill=\"rgba(107,91,139,0.06)\"/>\n    <circle cx=\"60\" cy=\"60\" r=\"38\" fill=\"rgba(107,91,139,0.06)\" stroke=\"#6B5B8B\" stroke-width=\"1.8\"/>\n    <circle cx=\"60\" cy=\"60\" r=\"30\" fill=\"none\" stroke=\"#6B5B8B\" stroke-width=\"0.8\" stroke-opacity=\"0.5\"/>\n    <path d=\"M 60 28 L 64 60 L 60 64 L 56 60 Z\" fill=\"#6B5B8B\" stroke=\"#6B5B8B\" stroke-width=\"1\" stroke-linejoin=\"round\"/>\n    <path d=\"M 60 92 L 64 60 L 60 56 L 56 60 Z\" fill=\"rgba(107,91,139,0.15)\" stroke=\"#6B5B8B\" stroke-width=\"1.2\" stroke-linejoin=\"round\"/>\n    <path d=\"M 90 60 L 64 56 L 60 60 L 64 64 Z\" fill=\"rgba(107,91,139,0.1)\" stroke=\"#6B5B8B\" stroke-width=\"1\" stroke-linejoin=\"round\"/>\n    <path d=\"M 30 60 L 56 56 L 60 60 L 56 64 Z\" fill=\"rgba(107,91,139,0.1)\" stroke=\"#6B5B8B\" stroke-width=\"1\" stroke-linejoin=\"round\"/>\n    <circle cx=\"60\" cy=\"60\" r=\"3\" fill=\"#6B5B8B\"/>\n    <line x1=\"60\" y1=\"18\" x2=\"60\" y2=\"22\" stroke=\"#6B5B8B\" stroke-width=\"1.5\" stroke-linecap=\"round\"/>\n    <line x1=\"60\" y1=\"98\" x2=\"60\" y2=\"102\" stroke=\"#6B5B8B\" stroke-width=\"1\" stroke-linecap=\"round\" stroke-opacity=\"0.6\"/>\n    <line x1=\"18\" y1=\"60\" x2=\"22\" y2=\"60\" stroke=\"#6B5B8B\" stroke-width=\"1\" stroke-linecap=\"round\" stroke-opacity=\"0.6\"/>\n    <line x1=\"98\" y1=\"60\" x2=\"102\" y2=\"60\" stroke=\"#6B5B8B\" stroke-width=\"1\" stroke-linecap=\"round\" stroke-opacity=\"0.6\"/>\n  </svg></div>\n            <div class=\"tia-arch-iconbox-label\">The Visionary</div>\n          </div>\n          <div class=\"tia-arch-content\">\n            <p class=\"tia-framing\">The Visionary is the part of you that asks what your life is for. It's the meaning-making capacity \u2014 and it has more distinct components than any other capacity.</p>\n\n            <dl class=\"tia-subscales\">\n              <dt>Presence of Meaning</dt>\n              <dd>The felt sense that your life has purpose. \"I know why I'm here.\" A <em>current state</em> of meaningfulness.</dd>\n\n              <dt>Search for Meaning</dt>\n              <dd>Active questioning of purpose. \"I'm working out why I'm here.\" A <em>process</em> of meaning-making. Importantly, not the inverse of Presence \u2014 they're partly orthogonal.</dd>\n\n              <dt>Self-Transcendence</dt>\n              <dd>Identification with something larger than yourself. This subscale has two flavors that the assessment treats separately:\n                <ul class=\"tia-sublist\">\n                  <li><em>Secular Self-Transcendence</em> \u2014 legacy, contribution, future generations, the cause that outlasts you. The \"I served something bigger than me\" frame.</li>\n                  <li><em>Spiritual Self-Transcendence</em> \u2014 identification with cosmos, openness to mystery, transpersonal experience, the felt sense of being part of a larger whole that may not be reducible to legacy or impact. Some people experience this through religion, some through nature, some through art, some through contemplative practice.</li>\n                </ul>\n              </dd>\n\n              <dt>Positive Reframing</dt>\n              <dd>The coping capacity that transforms difficulty into growth or meaning. The \"this is part of a larger story\" move you make under pressure.</dd>\n            </dl>\n          </div>\n        </div>\n        <div class=\"tia-arch-bottom\">\n          <h4 class=\"tia-h4\">The most interesting combination: Presence \u00d7 Search</h4>\n          <p>These two are almost-orthogonal, which means there are four distinct positions and they feel completely different from the inside.</p>\n          <p><strong>High Presence, low Search:</strong> Settled meaning. \"I know my purpose and I'm not looking for more.\" Can be deep clarity. Can also be foreclosed \u2014 you stopped questioning at 25 and never reopened the question.</p>\n          <p><strong>Low Presence, high Search:</strong> Active seeker. The meaning-quest is on. Often present in transitions, post-crisis recovery, mid-life pivots, spiritual openings. Uncomfortable but generative.</p>\n          <p><strong>High Presence, high Search:</strong> The reflective-but-grounded type. Has meaning, keeps questioning whether it's the right meaning. Tends to deepen over time. Often the most resilient.</p>\n          <p><strong>Low Presence, low Search:</strong> Drifting without distress. Can be peaceful (think Buddhist non-grasping) or numbed (think mild depression). The two look identical from outside and feel completely different inside.</p>\n\n          <h4 class=\"tia-h4\">The other interesting combination: Presence \u00d7 Self-Transcendence</h4>\n          <p>You can have meaning that's entirely about your own life \u2014 your craft, your family, your relationships, the texture of your days \u2014 and that's high Presence with low Self-Transcendence. Fulfilled, just personal.</p>\n          <p>You can have a strong sense of serving something larger without knowing what to do with your specific life \u2014 that's high Self-Transcendence with low Presence. Often shows up in idealistic young people who haven't yet found the form their contribution should take.</p>\n          <p>People in meaning crises often think the problem is Presence (no purpose) when it's actually Self-Transcendence (purpose exists but feels small). The interventions are different. Building meaning means finding what you care about. Expanding the frame means finding how what you care about connects to something larger than your own life.</p>\n\n          <h4 class=\"tia-h4\">Also worth knowing</h4>\n          <p><strong>Positive Reframing without Presence</strong> is sophisticated coping that masks emptiness. The person who narrates every difficulty as \"growth\" without having a stable core meaning. The reframes are real, the coping is real \u2014 and there's nothing underneath. Worth knowing about because Positive Reframing can look like resilience right up until it stops working.</p>\n          <p><strong>Spiritual Self-Transcendence</strong> is the most controversial subscale in academic psychology because it correlates with mystical experience and openness to non-rational knowing \u2014 which makes it suspicious to some researchers and central to others. It tends to correlate with creativity, openness to experience, and some forms of wisdom. It can also, untethered from grounding, drift into ungroundedness. Like every capacity, its value depends on what it's coupled with.</p>\n        </div>\n      </article>",
};

let _lsaInitialized = false;

export default function LeadershipStanceAssessmentPage() {
  const navigate = useAppNavigate();
  const rootRef = useRef(null);
  const synthBtnRef = useRef(null);

  useEffect(() => {
    if (!rootRef.current) return;
    // Set the body HTML via the ref instead of dangerouslySetInnerHTML so we can
    // run script after — React's dSI doesn't execute inline scripts.
    rootRef.current.innerHTML = LSA_BODY_HTML;

    // Run the original script. It defines window-scoped functions that the
    // inline onclick handlers in the HTML will call.
    if (!_lsaInitialized) {
      try {
        // Make TIA blocks available to the runtime script via window.
        window.LSA_TIA_BLOCKS = LSA_TIA_BLOCKS;
        // Inject as a real <script> tag so function declarations become
        // window-scoped. (new Function() would scope them locally and the
        // inline onclick handlers in the HTML wouldn't find them.)
        const scriptEl = document.createElement('script');
        scriptEl.id = 'lsa-runtime-script';
        scriptEl.textContent = LSA_SCRIPT;
        document.head.appendChild(scriptEl);
        _lsaInitialized = true;
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('LSA script init error:', err);
      }
    }

    // Inject a back link at the top of pg-intro
    const introContainer = document.querySelector('#pg-intro .inner-w');
    if (introContainer && !introContainer.querySelector('.lsa-back-link')) {
      const back = document.createElement('a');
      back.className = 'lsa-back-link';
      back.href = '#';
      back.textContent = '← Back to tools';
      back.style.cssText = 'display:inline-block;color:var(--text3);text-decoration:none;font-family:var(--fm);font-size:11px;letter-spacing:0.18em;text-transform:uppercase;margin-bottom:24px;cursor:pointer';
      back.onclick = (e) => { e.preventDefault(); navigate('home'); };
      introContainer.insertBefore(back, introContainer.firstChild);
    }

    // Watch for the results page becoming active and inject AI synthesis button.
    let synthInjected = false;
    const injectSynthIfNeeded = () => {
      if (synthInjected) return;
      const resultsPg = document.getElementById('pg-results');
      if (!resultsPg || !resultsPg.classList.contains('on')) return;
      const resultsContent = document.getElementById('results-content');
      if (!resultsContent || !resultsContent.children.length) return;
      // Inject a simple synthesis card at the bottom
      const card = document.createElement('div');
      card.className = 'lsa-synth-card';
      card.style.cssText = 'margin:48px auto 0;max-width:680px;padding:32px;background:var(--surface);border:1px solid var(--border);border-radius:12px;text-align:center';
      card.innerHTML = '<div style="font-family:var(--fm);font-size:10px;font-weight:700;letter-spacing:.18em;text-transform:uppercase;color:var(--text3);margin-bottom:14px">Optional</div>' +
        '<h3 style="font-family:var(--fd);font-size:24px;font-weight:700;margin-bottom:10px">Synthesize my pattern</h3>' +
        '<p style="font-size:14px;color:var(--text2);margin-bottom:20px">Have Claude write a short personalized synthesis of your results — what your top capacities, gap, and underused capacity say about your leadership pattern.</p>' +
        '<button class="lsa-synth-btn" style="background:#1a1a1a;color:#fff;border:none;font-family:var(--fm);font-size:11px;font-weight:600;letter-spacing:.18em;text-transform:uppercase;padding:14px 32px;border-radius:4px;cursor:pointer">Synthesize my pattern</button>' +
        '<div class="lsa-synth-output" style="margin-top:24px;text-align:left;font-size:15px;line-height:1.78;color:var(--text2)"></div>';
      resultsContent.appendChild(card);
      const btn = card.querySelector('.lsa-synth-btn');
      const output = card.querySelector('.lsa-synth-output');
      btn.onclick = async () => {
        btn.disabled = true;
        btn.textContent = 'Synthesizing…';
        try {
          // Pull the rendered results text as the prompt
          const txt = resultsContent.innerText.slice(0, 4000);
          const data = await synthesize({
            model: 'claude-sonnet-4-5',
            max_tokens: 600,
            messages: [{
              role: 'user',
              content: 'Below are the results of a Leadership Capacities Analysis. Write a short, warm, plain-language synthesis (180-250 words) of what these results suggest about how the person leads — their strengths, their gap under pressure, and one practical place to focus. Do not list the numbers; speak to the pattern. Use second-person voice ("you").\n\n' + txt
            }],
          });
          const synthesis = extractText(data);
          output.innerHTML = '<p>' + synthesis.replace(/\n\n/g, '</p><p>').replace(/\n/g, '<br>') + '</p>';
          btn.style.display = 'none';
        } catch (err) {
          output.innerHTML = '<p style="color:var(--W)"><em>AI synthesis is unavailable right now. Your results above stand on their own.</em></p>';
          btn.disabled = false;
          btn.textContent = 'Synthesize my pattern';
        }
      };
      synthInjected = true;
    };

    // Watch for class changes on pages — when results becomes 'on', inject synth.
    const observer = new MutationObserver(() => injectSynthIfNeeded());
    document.querySelectorAll('.pg').forEach((pg) => {
      observer.observe(pg, { attributes: true, attributeFilter: ['class'] });
    });

    return () => {
      observer.disconnect();
    };
  }, [navigate]);

  return (
    <>
      <SEO
        title="Leadership Capacities Analysis: Five Core Capacities Assessment | InciteU"
        description="A scenario-based assessment of five leadership capacities — Hedonist, Warrior, Lover, Strategist, Visionary. Maps your baseline, your pressure response, and your gaps."
        path="/tools/self/leadership-capacities"
      />
      <style>{LSA_CSS}</style>
      <div ref={rootRef} className="lsa-root" />
    </>
  );
}
