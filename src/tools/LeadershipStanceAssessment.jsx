import React, { useEffect, useRef } from 'react';
import { useAppNavigate } from '../lib/useAppNavigate.js';
import { synthesize, extractText } from '../lib/synthesize.js';

// ============================================================================
// LEADERSHIP STANCE ASSESSMENT
// ============================================================================
// FAITHFUL 1:1 PORT of the standalone five-layers-assessment.html.
//
// Strategy: the original is a complete, self-contained HTML/CSS/JS experience
// with its own multi-page state machine, archetype detail modals, and the
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

/* ── INTRO ARCHETYPE BOXES ── */
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

/* ── ARCHETYPE MODAL (home page click-to-expand + results page reuse) ── */
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

/* ── ARCHETYPE DEEP-DIVE GRID (results page) ── */
.lsa-root .arch-deep-grid {display:grid;grid-template-columns:repeat(auto-fit, minmax(180px, 1fr));gap:10px;margin-top:8px}
.lsa-root .arch-deep-btn {background:var(--surface);border:1.5px solid;border-radius:10px;padding:18px 16px;font-family:var(--fb);cursor:pointer;display:flex;align-items:center;gap:10px;text-align:left;transition:transform .18s ease, box-shadow .18s ease, border-color .18s ease}
.lsa-root .arch-deep-btn:hover {transform:translateY(-2px);box-shadow:0 6px 18px rgba(42,37,32,0.07)}
.lsa-root .arch-deep-icon {font-size:18px;flex:0 0 auto}
.lsa-root .arch-deep-name {font-family:var(--fd);font-size:14.5px;font-weight:700;flex:1;line-height:1.2}
.lsa-root .arch-deep-arrow {font-family:var(--fm);font-size:14px;color:var(--text3);flex:0 0 auto;transition:transform .18s ease}
.lsa-root .arch-deep-btn:hover .arch-deep-arrow {transform:translateX(3px)}

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

/* Sticky archetype jump nav */
.lsa-root .tia-nav {position:sticky;top:0;z-index:50;background:var(--bg);display:flex;flex-wrap:wrap;gap:8px;padding:14px 0;margin-bottom:16px;border-bottom:1px solid var(--border);justify-content:center}
.lsa-root .tia-pill {display:inline-flex;align-items:center;gap:8px;padding:9px 16px 9px 11px;background:var(--surface);border:1px solid var(--border);border-radius:24px;text-decoration:none;font-family:var(--fm);font-size:12px;font-weight:600;letter-spacing:.05em;color:var(--text2);transition:transform .18s ease, box-shadow .18s ease, border-color .18s ease;cursor:pointer}
.lsa-root .tia-pill:hover {transform:translateY(-1px);box-shadow:0 4px 12px rgba(42,37,32,0.06);border-color:var(--pill-color)}
.lsa-root .tia-pill:hover .tia-pill-label {color:var(--pill-color)}
.lsa-root .tia-pill.active {border-color:var(--pill-color);background:var(--surface);box-shadow:0 0 0 1px var(--pill-color) inset}
.lsa-root .tia-pill.active .tia-pill-label {color:var(--pill-color)}
.lsa-root .tia-pill-icon {display:inline-flex;width:24px;height:24px;flex:0 0 auto}
.lsa-root .tia-pill-icon svg {width:100%;height:100%}
.lsa-root .tia-pill-label {transition:color .18s ease}

/* Archetype CARD — single bordered container per archetype */
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
`;

const LSA_BODY_HTML = `

<!-- ═══════════════════════════════════ INTRO ═══════════════════════════════════ -->
<div id="pg-intro" class="pg on">
  <div class="inner-w">
    <div class="intro-text-narrow">
      <div class="intro-eyebrow">Incite Leadership · Five Layers Deep</div>
      <h1 class="intro-title">Archetypes <span style="color:var(--text3);font-weight:400;font-style:italic;font-size:.7em;vertical-align:middle"> / </span><br>Leadership stances</h1>
      <p class="intro-sub">Which of the five evolutionary archetypes do you lead with at baseline — and which one takes over when you're under pressure?</p>

      <p class="intro-body">This assessment maps three things: which archetypes you draw on in everyday conditions, which you default to when stakes are high, and which you may underuse overall. The most diagnostic finding is the <em>gap</em> — the capacity that goes offline when you're stressed.</p>
    </div>

    <!-- ─── DRIVES ─── -->
    <div class="intro-section">
      <div class="intro-section-label">— Drives —</div>
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

    <!-- ─── CAPACITIES ─── -->
    <div class="intro-section">
      <div class="intro-section-label">— Capacities —</div>
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
      <p class="r-sub">The theory, the deeper dive into each archetype, and how this assessment was built</p>

      <nav class="found-jump-nav" aria-label="Jump to section">
        <button class="found-jump-btn" onclick="foundJump(event,'found-grounding')">Scientific grounding</button>
        <button class="found-jump-btn" onclick="foundJump(event,'found-tia')">Theory in action</button>
        <button class="found-jump-btn" onclick="foundJump(event,'found-method')">Assessment methodology</button>
      </nav>
    </div>

    <!-- ═══ SECTION 1: SCIENTIFIC GROUNDING ═══ -->
    <section class="found-section" id="found-grounding">
      <h2 class="found-section-title">Scientific grounding</h2>

    <div class="found-intro">
      <p>This assessment maps each archetype to a specific body of research and the validated psychometric instruments that informed item design. The format is a Situational Judgment Test (SJT) — a well-established psychometric format that avoids the social desirability bias of traditional Likert-scale self-report.</p>
      <p>Items haven't been through factor analysis or formal validation. Each archetype is grounded in published research and reference instruments listed below — but until validated, treat results as <em>reflective</em>, not <em>diagnostic</em>.</p>
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

      <div class="fcard-note">The least scientifically settled archetype. Strongest theoretical backing comes from Levy et al. (2024) on abstraction capacity and the cultural evolution literature (Boyd &amp; Richerson) on meaning-making and cooperation at scale.</div>
    </div>

    </section>
    <!-- end SECTION 1 -->

    <!-- ═══ SECTION 2: THEORY IN ACTION ═══ -->
    <section class="found-section" id="found-tia">
      <h2 class="found-section-title">Theory in action <span class="found-section-title-sub">— a deeper dive into the archetypes</span></h2>

    <!-- THEORY IN ACTION -->
    <div class="tia-section">
      <p>Each archetype is a constellation of distinct capacities. Two people can score the same on an archetype overall while having radically different inner machinery. The subscales are where the texture of who you actually are lives.</p>

      <nav class="tia-nav" aria-label="Jump to archetype">
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
            <p class="tia-framing">The Visionary is the part of you that asks what your life is for. It's the meaning-making capacity — and it has more distinct components than any other archetype.</p>

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
      <p>Each archetype's items map to specific subscales of the validated reference instruments listed above. This matrix shows item counts per subscale, broken down by section, and whether differential analysis (baseline vs. pressure) is meaningfully possible.</p>

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
        <div class="found-isnot-body">A well-grounded, theoretically informed tool for self-reflection and coaching conversations. Each archetype maps to established psychological constructs with validated instruments as reference points.</div>
      </div>
      <div class="found-isnot-cell isnot">
        <div class="found-isnot-lbl">What this is not (yet)</div>
        <div class="found-isnot-body">A psychometrically validated instrument. Validation would require administering these items plus the reference instruments to 200–300 participants, then confirming through factor analysis that five factors emerge corresponding to the five archetypes, and that scores show convergent and discriminant validity against established measures.</div>
      </div>
    </div>

    </section>
    <!-- end SECTION 3 -->

    <button class="btn btn-ghost btn-sm" onclick="closeFoundations()" style="margin-top:32px">← Back</button>
    <div class="footer" style="text-align:left;padding:32px 0 0">© Jennifer May / Incite Leadership</div>
  </div>
</div>

<div class="toast" id="toast"></div>

<!-- Archetype detail modal — opened from home page boxes and results page deep-dive links -->
<div class="arch-modal-backdrop" id="arch-modal-backdrop" onclick="if(event.target === this) closeArchModal()">
  <div class="arch-modal" role="dialog" aria-modal="true" aria-labelledby="arch-modal-title">
    <button class="arch-modal-close" onclick="closeArchModal()" aria-label="Close">×</button>
    <div id="arch-modal-content"></div>
  </div>
</div>


`;

const LSA_SCRIPT = `
// ══════════════════════════════════════════════════════════════════
// DATA
// ══════════════════════════════════════════════════════════════════

const ARCHS = ['hedonist','warrior','lover','strategist','visionary'];

const AD = {
  hedonist: {
    icon:'☀', name:'Hedonist', tagline:'The seeking drive',
    color:'#D4A854', bg:'rgba(212,168,84,.08)', border:'rgba(212,168,84,.35)',
    lead:"You navigate the world through pleasure, energy, and instinct. You're drawn to what feels alive and resist what feels deadening. Your gift is bringing vitality and appetite to everything you do. Watch for: avoiding discomfort that actually needs to be faced.",
    pressure:"You escape. You seek comfort, distraction, or pleasure to avoid pain. This can look like procrastination, avoidance, or \\"it'll be fine\\" optimism that isn't grounded.",
    underuse:"You may struggle with burnout, joylessness, or inability to rest. You've lost touch with what feels good and what gives you energy.",
  },
  warrior: {
    icon:'⚔', name:'Warrior', tagline:'The protective drive',
    color:'#A85454', bg:'rgba(168,84,84,.08)', border:'rgba(168,84,84,.35)',
    lead:"You navigate the world through vigilance and resilience. You see threats others miss and you don't back down. Your gift is protecting what matters when others freeze. Watch for: seeing threats everywhere, even where there's safety.",
    pressure:"You fight or fortify. You get reactive, defensive, or hyper-focused on threat. This can look like aggression, rigidity, or an inability to trust.",
    underuse:"You may have weak boundaries, difficulty saying no, or a pattern of being taken advantage of. You struggle to protect yourself or others.",
  },
  lover: {
    icon:'♡', name:'Lover', tagline:'The empathy capacity',
    color:'#8B5E5E', bg:'rgba(139,94,94,.08)', border:'rgba(139,94,94,.35)',
    lead:"You navigate the world through connection. You feel what others feel, often before they can name it. Your gift is building trust and making people feel seen. Watch for: losing yourself in others' needs, avoiding conflict to preserve harmony.",
    pressure:"You merge or people-please. You prioritize others' feelings over your own needs or the truth. This can look like boundary collapse or conflict avoidance.",
    underuse:"You may feel isolated, have difficulty with intimacy, or treat relationships instrumentally. Others may experience you as cold or detached.",
  },
  strategist: {
    icon:'◈', name:'Strategist', tagline:'The imagination capacity',
    color:'#5B6B8B', bg:'rgba(91,107,139,.08)', border:'rgba(91,107,139,.35)',
    lead:"You navigate the world through analysis and planning. You model futures, weigh options, and see patterns. Your gift is clarity in complexity. Watch for: analysis paralysis, disconnecting from emotion to stay in your head.",
    pressure:"You overthink. You retreat into analysis, planning, and control. This can look like paralysis, emotional detachment, or \\"solving\\" feelings instead of feeling them.",
    underuse:"You may feel overwhelmed by complexity, make reactive decisions, or struggle to plan ahead. You're often surprised by foreseeable problems.",
  },
  visionary: {
    icon:'✧', name:'Visionary', tagline:'The meaning capacity',
    color:'#6B5B8B', bg:'rgba(107,91,139,.08)', border:'rgba(107,91,139,.35)',
    lead:"You navigate the world through meaning. You ask \\"why\\" before \\"how\\" and hold the long view. Your gift is keeping purpose alive when others get lost in tactics. Watch for: disconnection from practical reality, moral rigidity.",
    pressure:"You moralize or dissociate. You retreat to abstract principles or existential questioning. This can look like self-righteousness, impracticality, or checking out from the messy reality.",
    underuse:"You may feel adrift, purposeless, or stuck in routine. You do things without knowing why, and major decisions feel arbitrary.",
  },
};

// Subscale catalog — drawn from validated reference instruments (BIS/BAS, FFFQ, IRI, CFC/NFC, MLQ/TCI). See Foundations.
const SUBSCALES = {
  hedonist:   { reward_responsiveness:'Reward Responsiveness', drive:'Drive', fun_seeking:'Fun Seeking' },
  warrior:    { threat_sensitivity:'Threat Sensitivity', fight:'Fight', flight:'Flight' },
  lover:      { empathic_concern:'Empathic Concern', perspective_taking:'Perspective Taking', personal_distress:'Personal Distress' },
  strategist: { analytical_thinking:'Analytical Thinking', cognitive_flexibility:'Cognitive Flexibility', future_consequences:'Future Consequences' },
  visionary:  { presence_of_meaning:'Presence of Meaning', search_for_meaning:'Search for Meaning', self_transcendence:'Self-Transcendence' },
};

// Item counts per subscale per section — used for normalization in subscale analysis
const SUBSCALE_COUNTS = {
  hedonist: {
    reward_responsiveness: { baseline:2, pressure:1, identity:1, total:4 },
    drive:                 { baseline:2, pressure:1, identity:1, total:4 },
    fun_seeking:           { baseline:2, pressure:1, identity:0, total:3 },
  },
  warrior: {
    threat_sensitivity: { baseline:5, pressure:2, identity:0, total:7 },
    fight:              { baseline:1, pressure:3, identity:2, total:6 },
    flight:             { baseline:0, pressure:2, identity:0, total:2 },
  },
  lover: {
    empathic_concern:   { baseline:4, pressure:3, identity:1, total:8 },
    perspective_taking: { baseline:2, pressure:2, identity:1, total:5 },
    personal_distress:  { baseline:0, pressure:2, identity:0, total:2 },
  },
  strategist: {
    analytical_thinking:   { baseline:5, pressure:5, identity:1, total:11 },
    cognitive_flexibility: { baseline:1, pressure:1, identity:0, total:2 },
    future_consequences:   { baseline:0, pressure:1, identity:1, total:2 },
  },
  visionary: {
    presence_of_meaning: { baseline:5, pressure:2, identity:1, total:8 },
    search_for_meaning:  { baseline:1, pressure:4, identity:0, total:5 },
    self_transcendence:  { baseline:0, pressure:1, identity:1, total:2 },
  },
};

// ══════════════════════════════════════════════════════════════════
// ARCHETYPE DETAILS — source content for home modal + results deep-dive
// ══════════════════════════════════════════════════════════════════

const ARCHETYPE_DETAILS = {
  hedonist: {
    framing: "The Hedonist is the part of you that goes <em>toward</em> — toward pleasure, toward novelty, toward the thing that lights you up. But \\"going toward\\" decomposes into three different engines, and they don't always run together.",
    subscales: [
      { key:'reward_responsiveness', name:'Reward Responsiveness', desc:"The visceral, body-level response to good things happening. Savoring. The way some people light up when praised, taste their food, feel the moment land. This is your capacity to <strong>receive</strong> pleasure." },
      { key:'drive', name:'Drive', desc:"Sustained pursuit of what you want. Going after it. The persistent effort that closes the gap between desire and outcome. This is your capacity to <strong>go after</strong> pleasure." },
      { key:'fun_seeking', name:'Fun Seeking', desc:"Appetite for novelty and spontaneity. Willingness to act on impulse for new experience. Boredom intolerance, in the productive sense. This is your capacity to <strong>seek</strong> pleasure in unfamiliar territory." },
    ],
    combinations: [
      {
        id:'achievement_runner',
        label:'Drive without Reward Responsiveness — the achievement runner',
        // Drive ≥ 60% within archetype AND Reward Responsiveness ≤ 35% within archetype
        detect: (subPct) => subPct.drive >= 60 && subPct.reward_responsiveness <= 35,
        content: "Strong pursuit machinery, weak savoring machinery. You climb the ladder, hit the goal, get the promotion — and feel surprisingly little. The dopamine of pursuit isn't matched by satisfaction at arrival, so you immediately set the next goal. From outside it looks like drive. From inside it can feel like an inability to land. The fix isn't more drive; it's relearning Reward Responsiveness — the capacity to actually feel what you've already won."
      },
      {
        id:'peaceful_underemployed',
        label:'Reward Responsiveness without Drive',
        detect: (subPct) => subPct.reward_responsiveness >= 60 && subPct.drive <= 35,
        content: "You deeply enjoy life when good things arrive but don't chase them. Often peaceful, sometimes underemployed relative to your capacity. The pleasure machinery works beautifully on what's already in front of you; the pursuit machinery is comparatively quiet."
      },
      {
        id:'dabbler',
        label:'Fun Seeking without Drive — the dabbler',
        detect: (subPct) => subPct.fun_seeking >= 60 && subPct.drive <= 35,
        content: "Many starts, few finishes. Strong appetite for the new, weak machinery for the long pursuit. Novelty is its own reward, and seeing things through can feel like a chore. Often creative, often scattered."
      },
      {
        id:'disciplined_executor',
        label:'Drive without Fun Seeking — the disciplined executor',
        detect: (subPct) => subPct.drive >= 60 && subPct.fun_seeking <= 35,
        content: "You get things done but resist novelty. Effective in stable conditions; can become rigid in middle age as the world changes faster than your established patterns. The strength is reliability; the cost is adaptability."
      }
    ],
    also: "Hedonist subscales here are measured with 3–4 items each, so read your scores directionally rather than precisely."
  },

  warrior: {
    framing: "The Warrior is the part of you that handles threat. Whether the threat is physical, social, professional, or emotional, the Warrior is what comes online. But \\"handling threat\\" isn't one capacity — it's how you detect threat, and how you respond to it.",
    subscales: [
      { key:'threat_sensitivity', name:'Threat Sensitivity', desc:"The anxious vigilance system. Scanning for risk, worrying about mistakes, anticipating what could go wrong. This is the <strong>detection</strong> layer. High Threat Sensitivity makes you see things others miss; it can also exhaust you." },
      { key:'fight', name:'Fight', desc:"Confrontational defense. Pushing back, holding ground, engaging the threat directly. The capacity to say no, to argue, to refuse to yield." },
      { key:'flight', name:'Flight', desc:"Escape and damage control. Securing position, getting out, minimizing exposure. Less glamorous than Fight but often the wiser choice. Good Flight is strategic withdrawal, not cowardice." },
    ],
    combinations: [
      {
        id:'anxious_paralysis',
        label:'Threat Sensitivity without an active defense response — anxious paralysis',
        // Threat Sensitivity ≥ 55% AND both Fight and Flight ≤ 30%
        detect: (subPct) => subPct.threat_sensitivity >= 55 && subPct.fight <= 30 && subPct.flight <= 30,
        content: "The detection system is on, the action systems aren't. You see every risk, you can't pick a response, you ruminate. From the inside it feels like being trapped between possibilities. Common in people described as \\"anxious overthinkers\\" — but the underlying issue isn't the anxiety itself; it's the gap between detection and action."
      },
      {
        id:'fight_uncalibrated',
        label:'Fight without Threat Sensitivity — combat-ready but not alarm-aware',
        detect: (subPct) => subPct.fight >= 55 && subPct.threat_sensitivity <= 30,
        content: "You escalate conflicts that didn't need to escalate. Mistake everything for an attack. Pick battles for the wrong reasons. Often described as \\"always angry\\" — but the underlying issue is calibration, not aggression. The fix isn't to fight less; it's to detect more accurately first."
      }
    ],
    also: "The classical \\"fight or flight\\" framing is a simplification. Real-world threat response also includes <strong>Freeze</strong> (immobilization-as-information-gathering) and <strong>Tend-and-Befriend</strong> (turning toward others under stress, which tips Warrior into Lover territory). See the note below on uncovered subscales.",
    uncovered: {
      name: 'Freeze',
      note: "Freeze gets a bad reputation but is often the most cognitively sophisticated mode under pressure — you're not paralyzed, you're gathering. Some of the best decision-makers freeze first, then act. The signature of an unhealthy Freeze is when it never resolves into action."
    }
  },

  lover: {
    framing: "The Lover is the part of you that turns toward other people — but \\"turning toward\\" has at least four distinct flavors, and the differences between them are some of the most consequential in adult life.",
    subscales: [
      { key:'empathic_concern', name:'Empathic Concern', desc:"Feeling <em>for</em> others. Warmth, tenderness, the heart-going-out response. Genuine care about another person's wellbeing." },
      { key:'perspective_taking', name:'Perspective Taking', desc:"Cognitive empathy. The capacity to see through someone else's eyes, model their mental state, understand why their position makes sense to them. This is empathy as a <strong>thinking</strong> operation." },
      { key:'personal_distress', name:'Personal Distress', desc:"Your own distress in response to others' distress. The \\"I can't bear to see them in pain\\" response. Looks like empathy but is technically about your nervous system, not theirs." },
    ],
    combinations: [
      {
        id:'sustainable_helper',
        label:'Empathic Concern without Personal Distress — the sustainable helper',
        // EC ≥ 50% AND PD ≤ 30%
        detect: (subPct) => subPct.empathic_concern >= 50 && subPct.personal_distress <= 30,
        content: "You feel for people, you show up, you help — and you go home and sleep. Your nervous system stays regulated even when theirs isn't. You can hear hard things without absorbing them. This is what mature empathy actually is, and it's rarer than the cultural conversation about empathy suggests."
      },
      {
        id:'vulnerable_empath',
        label:'Empathic Concern with Personal Distress — the vulnerable empath',
        detect: (subPct) => subPct.empathic_concern >= 50 && subPct.personal_distress >= 50,
        content: "You feel for others <em>and</em> your own system floods with their distress. You're often extraordinarily attuned and effective in short bursts — and then you collapse. The classic codependent caregiver. The therapist who burns out. The friend who vanishes after a hard conversation because they need a week to recover. The work isn't to care less. It's to build the regulatory capacity that lets Empathic Concern operate without Personal Distress overwhelming it."
      },
      {
        id:'cognitive_empathy_uncoupled',
        label:'Perspective Taking without Empathic Concern',
        detect: (subPct) => subPct.perspective_taking >= 55 && subPct.empathic_concern <= 30,
        content: "Cognitive empathy uncoupled from warmth — the capacity to read someone perfectly without caring about them. It's a useful skill in negotiation, sales, and psychotherapy when paired with strong values; it's the central feature of dark-triad personalities when not."
      },
      {
        id:'warm_projector',
        label:'Empathic Concern without Perspective Taking — the warm projector',
        detect: (subPct) => subPct.empathic_concern >= 55 && subPct.perspective_taking <= 30,
        content: "You care deeply but assume everyone shares your feelings. Often inadvertently invasive: \\"I know just how you feel\\" — when in fact you don't. The warmth is real; the model of the other person's actual experience is missing."
      }
    ],
    also: "The Empathic Concern × Personal Distress distinction is one of the most clinically important in personality psychology. It's the difference between sustainable caring and burnout-prone caring.",
    uncovered: {
      name: 'Fantasy / imaginative empathy',
      note: "A fourth Lover subscale — imaginative immersion in others' experiences, real or fictional — is described in the research but not measured by this 15-scenario assessment. Often shows up in fiction-readers, creatives, and people who can deeply inhabit a character or stranger from a distance."
    }
  },

  strategist: {
    framing: "The Strategist is the part of you that thinks ahead, reads patterns, and tries to figure out what's actually going on. Three different cognitive capacities make up the Strategist, and the differences between them are easy to miss but hugely consequential.",
    subscales: [
      { key:'analytical_thinking', name:'Analytical Thinking', desc:"Preference for systematic evaluation, pattern recognition, complex problems. The \\"thinks for fun\\" trait. Distinct from intelligence — some very smart people don't enjoy thinking, and some less brilliant people love it." },
      { key:'cognitive_flexibility', name:'Cognitive Flexibility', desc:"Capacity to reframe, adapt plans, hold multiple representations of a situation simultaneously. The unstuck-ness factor. What lets you change your mind when the data changes." },
      { key:'future_consequences', name:'Future Consequences', desc:"Orientation toward long-term outcomes. The capacity to weigh what happens later against what's pleasant now. Some people feel the future as vividly as the present; others can barely make it real." },
    ],
    combinations: [
      {
        id:'brittle_planner',
        label:'Future Consequences without Cognitive Flexibility — the brittle planner',
        detect: (subPct) => subPct.future_consequences >= 55 && subPct.cognitive_flexibility <= 30,
        content: "Future-oriented, builds detailed plans, lives by the long arc — and gets shattered when reality diverges from the plan. \\"But the strategy said…\\" Common in people who succeeded early through planning and then hit a wall they can't model their way through. The compound trait — plans well <em>and</em> adapts — is rarer than either component alone."
      },
      {
        id:'situational_surfer',
        label:'Cognitive Flexibility without Future Consequences — the situational surfer',
        detect: (subPct) => subPct.cognitive_flexibility >= 55 && subPct.future_consequences <= 30,
        content: "Adapts beautifully to whatever's happening but never builds a long arc. Resilient in the short term, drifting in the long term. The unstuck-ness is real and useful; the missing piece is direction-setting."
      }
    ],
    also: "Analytical Thinking is independent of intelligence in interesting ways. High-Analytical people enjoy thinking through problems even when they're not great at it; low-Analytical people may be brilliant but find sustained analysis exhausting. Coaching a low-Analytical, high-Future-Consequences person looks completely different from coaching a high-Analytical, low-Future-Consequences one — even though both might score \\"high Strategist.\\""
  },

  visionary: {
    framing: "The Visionary is the part of you that asks what your life is for. It's the meaning-making capacity — and it has more distinct components than any other archetype.",
    subscales: [
      { key:'presence_of_meaning', name:'Presence of Meaning', desc:"The felt sense that your life has purpose. \\"I know why I'm here.\\" A <strong>current state</strong> of meaningfulness." },
      { key:'search_for_meaning', name:'Search for Meaning', desc:"Active questioning of purpose. \\"I'm working out why I'm here.\\" A <strong>process</strong> of meaning-making. Importantly, not the inverse of Presence — they're partly orthogonal." },
      { key:'self_transcendence', name:'Self-Transcendence', desc:"Identification with something larger than yourself — legacy, contribution, future generations, the cause that outlasts you. The \\"I served something bigger than me\\" frame." },
    ],
    combinations: [
      {
        id:'settled_meaning',
        label:'High Presence, low Search — settled meaning',
        detect: (subPct) => subPct.presence_of_meaning >= 60 && subPct.search_for_meaning <= 30,
        content: "\\"I know my purpose and I'm not looking for more.\\" Can be deep clarity. Can also be foreclosed — you stopped questioning at 25 and never reopened the question. Worth checking which one you're in."
      },
      {
        id:'active_seeker',
        label:'Low Presence, high Search — active seeker',
        detect: (subPct) => subPct.presence_of_meaning <= 30 && subPct.search_for_meaning >= 60,
        content: "The meaning-quest is on. Often present in transitions, post-crisis recovery, mid-life pivots, spiritual openings. Uncomfortable but generative. The search itself is the work."
      },
      {
        id:'reflective_grounded',
        label:'High Presence, high Search — reflective and grounded',
        detect: (subPct) => subPct.presence_of_meaning >= 50 && subPct.search_for_meaning >= 50,
        content: "Has meaning, keeps questioning whether it's the right meaning. Tends to deepen over time. Often the most resilient pattern — the ground holds, and the inquiry continues."
      },
      {
        id:'drifting',
        label:'Low Presence, low Search — drifting',
        detect: (subPct) => subPct.presence_of_meaning <= 30 && subPct.search_for_meaning <= 30,
        content: "Drifting without distress. Can be peaceful (think Buddhist non-grasping) or numbed (think mild depression). The two look identical from outside and feel completely different from inside. Worth checking which one is yours."
      },
      {
        id:'small_meaning',
        label:'High Presence, low Self-Transcendence — fulfilled but personal',
        detect: (subPct) => subPct.presence_of_meaning >= 55 && subPct.self_transcendence <= 30,
        content: "You have meaning that's entirely about your own life — your craft, your family, your relationships, the texture of your days. Fulfilled, just personal. Nothing wrong with this. Some people in meaning crises think the problem is Presence (no purpose) when it's actually Self-Transcendence (purpose exists but feels small). The interventions are different — building meaning means finding what you care about; expanding the frame means finding how what you care about connects to something larger."
      }
    ],
    also: "<strong>Presence and Search are partly orthogonal</strong> — that's the key insight here. You can have a strong settled sense of meaning <em>and</em> be actively questioning it. The four positions on the Presence × Search grid feel completely different from the inside, even when overall Visionary scores look similar.",
    uncovered: {
      name: 'Spiritual Self-Transcendence and Positive Reframing',
      note: "Two further Visionary subscales — <strong>Spiritual Self-Transcendence</strong> (identification with cosmos, openness to mystery, transpersonal experience) and <strong>Positive Reframing</strong> (the coping capacity that transforms difficulty into growth or meaning) — are described in the research but not measured by this 15-scenario assessment. Spiritual Self-Transcendence in particular is often the most distinctive subscale within the Visionary archetype."
    }
  },
};


// ══════════════════════════════════════════════════════════════════
// SCENARIO POOL — 15 scenarios (6 baseline · 7 pressure · 2 identity)
// All 15 used in every session; option order is randomized per scenario.
// Each option carries a subscale tag (or null for low-engagement Hedonist responses).
// ══════════════════════════════════════════════════════════════════

const POOL = [
  // ───── BASELINE (6) ─────
  { id:'B1', section:'baseline', text:"You're starting a new project at work.", options:[
    {arch:'hedonist',  sub:'drive',                 text:"Jump into the parts that excite you most"},
    {arch:'warrior',   sub:'threat_sensitivity',    text:"Identify the biggest risks and figure out how to mitigate them early"},
    {arch:'lover',     sub:'empathic_concern',      text:"Make sure the right people are involved and everyone feels good about their role"},
    {arch:'strategist',sub:'analytical_thinking',   text:"Build a plan with milestones, dependencies, and contingencies"},
    {arch:'visionary', sub:'presence_of_meaning',   text:"Get clear on why this project matters before diving into how"},
  ]},
  { id:'B2', section:'baseline', text:"You receive unexpected praise from someone you respect.", options:[
    {arch:'hedonist',  sub:'reward_responsiveness', text:"Feel great — soak it in, enjoy the moment"},
    {arch:'warrior',   sub:'threat_sensitivity',    text:"Wonder what they might want, or whether you've missed something"},
    {arch:'lover',     sub:'empathic_concern',      text:"Feel closer to them — it strengthens the relationship"},
    {arch:'strategist',sub:'analytical_thinking',   text:"Think about what specifically you did well so you can replicate it"},
    {arch:'visionary', sub:'presence_of_meaning',   text:"Feel affirmed that you're on the right path"},
  ]},
  { id:'B3', section:'baseline', text:"You have to make a decision and there's no clear right answer.", options:[
    {arch:'hedonist',  sub:'drive',                 text:"Go with your gut — what feels right"},
    {arch:'warrior',   sub:'threat_sensitivity',    text:"Choose the option with the least downside"},
    {arch:'lover',     sub:'perspective_taking',    text:"Talk it through with people you trust"},
    {arch:'strategist',sub:'analytical_thinking',   text:"Analyze the options systematically — pros, cons, probabilities"},
    {arch:'visionary', sub:'presence_of_meaning',   text:"Ask which option best serves what you ultimately care about"},
  ]},
  { id:'B4', section:'baseline', text:"A team you're part of is brainstorming ideas.", options:[
    {arch:'hedonist',  sub:'fun_seeking',           text:"Throw out bold, interesting ideas without worrying if they're practical yet"},
    {arch:'warrior',   sub:'threat_sensitivity',    text:"Point out which ideas have fatal flaws before the group gets too attached"},
    {arch:'lover',     sub:'perspective_taking',    text:"Make sure quieter voices are heard and people feel safe contributing"},
    {arch:'strategist',sub:'analytical_thinking',   text:"Organize the ideas into categories and evaluate them against criteria"},
    {arch:'visionary', sub:'presence_of_meaning',   text:"Keep bringing the group back to the bigger picture — what are we actually trying to achieve?"},
  ]},
  { id:'B5', section:'baseline', text:"You learn something that changes your understanding of a topic you care about.", options:[
    {arch:'hedonist',  sub:'fun_seeking',           text:"Feel a rush of curiosity — want to explore more immediately"},
    {arch:'warrior',   sub:'threat_sensitivity',    text:"Reassess what you thought you knew — what else might be wrong?"},
    {arch:'lover',     sub:'empathic_concern',      text:"Want to share it with someone and discuss it together"},
    {arch:'strategist',sub:'cognitive_flexibility', text:"Start revising your mental model — how does this change your predictions?"},
    {arch:'visionary', sub:'search_for_meaning',    text:"Wonder what this means at a deeper level — how does this shift what matters?"},
  ]},
  { id:'B6', section:'baseline', text:"You disagree with a decision your organization is making.", options:[
    {arch:'hedonist',  sub:'reward_responsiveness', text:"Express your frustration — it just doesn't feel right"},
    {arch:'warrior',   sub:'fight',                 text:"Prepare your objections carefully and pick the right moment to push back"},
    {arch:'lover',     sub:'empathic_concern',      text:"Talk to others who might feel the same — see if there's shared concern"},
    {arch:'strategist',sub:'analytical_thinking',   text:"Build a clear case with evidence and alternative proposals"},
    {arch:'visionary', sub:'presence_of_meaning',   text:"Challenge whether the decision is consistent with the organization's stated values"},
  ]},

  // ───── PRESSURE (7) ─────
  { id:'P1', section:'pressure', text:"You're running late to something important.", options:[
    {arch:'hedonist',  sub:null,                    text:"Don't stress too much — it'll be fine, people will understand"},
    {arch:'warrior',   sub:'flight',                text:"Drive faster, find shortcuts, do whatever it takes to minimize the damage"},
    {arch:'lover',     sub:'empathic_concern',      text:"Text ahead to let people know — you don't want them to worry"},
    {arch:'strategist',sub:'cognitive_flexibility', text:"Quickly calculate the fastest route and adjust the plan"},
    {arch:'visionary', sub:'search_for_meaning',    text:"Ask yourself whether being late to this actually matters in the big picture"},
  ]},
  { id:'P2', section:'pressure', text:"Someone you care about is angry with you and you're not sure why.", options:[
    {arch:'hedonist',  sub:null,                    text:"Try to lighten the mood or wait for it to blow over"},
    {arch:'warrior',   sub:'fight',                 text:"Brace yourself — figure out what you did and prepare to defend or fix it"},
    {arch:'lover',     sub:'personal_distress',     text:"Feel their pain — it hurts that they're hurting, regardless of who's right"},
    {arch:'strategist',sub:'analytical_thinking',   text:"Try to understand the root cause — what specifically triggered this?"},
    {arch:'visionary', sub:'search_for_meaning',    text:"Reflect on whether this conflict points to a deeper misalignment in values"},
  ]},
  { id:'P3', section:'pressure', text:"You witness an injustice — someone being treated unfairly.", options:[
    {arch:'hedonist',  sub:'reward_responsiveness', text:"Feel outraged — your whole body reacts"},
    {arch:'warrior',   sub:'threat_sensitivity',    text:"Assess the situation — is it safe to intervene? What are the risks?"},
    {arch:'lover',     sub:'empathic_concern',      text:"Feel the other person's pain — your heart goes out to them"},
    {arch:'strategist',sub:'analytical_thinking',   text:"Think about the most effective way to address this — who has authority, what are the channels?"},
    {arch:'visionary', sub:'presence_of_meaning',   text:"See it as a moral imperative — this is wrong and it matters beyond this moment"},
  ]},
  { id:'P4', section:'pressure', text:"You receive critical feedback that stings.", options:[
    {arch:'hedonist',  sub:null,                    text:"Brush it off initially — you'll process it later when it doesn't sting so much"},
    {arch:'warrior',   sub:'fight',                 text:"Defend yourself — push back on the parts that are unfair"},
    {arch:'lover',     sub:'personal_distress',     text:"Wonder if the relationship is damaged — is the person upset with you?"},
    {arch:'strategist',sub:'analytical_thinking',   text:"Extract the useful information — what's accurate, what can you improve?"},
    {arch:'visionary', sub:'search_for_meaning',    text:"Ask whether this feedback points to a gap between who you are and who you want to be"},
  ]},
  { id:'P5', section:'pressure', text:"You're in a group where conflict is rising and people are getting emotional.", options:[
    {arch:'hedonist',  sub:'fun_seeking',           text:"Try to inject humor or lightness to break the tension"},
    {arch:'warrior',   sub:'fight',                 text:"Hold your ground — don't let the emotional chaos make you back down"},
    {arch:'lover',     sub:'perspective_taking',    text:"Acknowledge what people are feeling — name the emotions in the room"},
    {arch:'strategist',sub:'analytical_thinking',   text:"Try to separate the emotional reactions from the actual problem to be solved"},
    {arch:'visionary', sub:'presence_of_meaning',   text:"Remind the group what they're all here for — the shared purpose that transcends this disagreement"},
  ]},
  { id:'P6', section:'pressure', text:"You're facing a major life decision with significant consequences.", options:[
    {arch:'hedonist',  sub:'drive',                 text:"Trust your instincts — you usually know what feels right"},
    {arch:'warrior',   sub:'threat_sensitivity',    text:"Focus on protecting what you've built — minimize regret"},
    {arch:'lover',     sub:'perspective_taking',    text:"Consider how it affects the people closest to you"},
    {arch:'strategist',sub:'analytical_thinking',   text:"Build decision matrices, seek data, consult experts"},
    {arch:'visionary', sub:'self_transcendence',    text:"Ask what you'll wish you had chosen when you look back at the end of your life"},
  ]},
  { id:'P7', section:'pressure', text:"You hear rumors about layoffs at your organization.", options:[
    {arch:'hedonist',  sub:null,                    text:"Try not to think about it too much — worrying won't help"},
    {arch:'warrior',   sub:'flight',                text:"Update your resume, secure your position, prepare for the worst"},
    {arch:'lover',     sub:'empathic_concern',      text:"Check in with colleagues — how are people feeling? Who's vulnerable?"},
    {arch:'strategist',sub:'future_consequences',   text:"Assess the situation — read the financial signals, figure out which teams are at risk"},
    {arch:'visionary', sub:'search_for_meaning',    text:"Reflect on whether this organization still aligns with what you want your career to stand for"},
  ]},

  // ───── IDENTITY (2) ─────
  { id:'I1', section:'identity', text:"You're asked to compromise on something you believe in to keep the peace.", options:[
    {arch:'hedonist',  sub:null,                                  text:"It depends on how much it affects you personally — some battles aren't worth fighting"},
    {arch:'warrior',   sub:'fight',                               text:"Refuse — if you compromise on this, where does it end?"},
    {arch:'lover',     sub:'perspective_taking',                  text:"Weigh the relationship — is the connection more important than being right?"},
    {arch:'strategist',sub:'future_consequences',                 text:"Assess the strategic implications — what precedent does this set?"},
    {arch:'visionary', sub:'presence_of_meaning',                 text:"This is non-negotiable — some things matter more than peace"},
  ]},
  { id:'I2', section:'identity', text:"In the final hours of your life, what matters most to you?", options:[
    {arch:'hedonist',  sub:['reward_responsiveness','drive'],     text:"That you lived fully — tasted everything, held nothing back"},
    {arch:'warrior',   sub:'fight',                               text:"That you protected the people and things that mattered — you held the line"},
    {arch:'lover',     sub:'empathic_concern',                    text:"That you loved well and were loved — the relationships were real"},
    {arch:'strategist',sub:'analytical_thinking',                 text:"That you made smart choices — built something, left things better than you found them"},
    {arch:'visionary', sub:'self_transcendence',                  text:"That your life meant something — you served something larger than yourself"},
  ]},
];

// Section composition — uses all 15 scenarios; order is randomized per session
const SESSION_COMPOSITION = { baseline: 6, pressure: 7, identity: 2 };
const TOTAL_Q = 15;

// ══════════════════════════════════════════════════════════════════
// STATE
// ══════════════════════════════════════════════════════════════════

let state = {
  sessionScenarios: [],
  currentIdx: 0,
  answers: {},        // scenarioId -> ordered array of archetype keys (max 3)
  optionShuffles: {}, // scenarioId -> shuffled options array
};
let _prevPage = null;

// ── Helpers ──
function shuffle(arr){
  const a=[...arr];
  for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}
  return a;
}

function buildSession(){
  const byType = {
    baseline:  POOL.filter(s=>s.section==='baseline'),
    pressure:  POOL.filter(s=>s.section==='pressure'),
    identity:  POOL.filter(s=>s.section==='identity'),
  };
  const picked = [];
  for(const [section, n] of Object.entries(SESSION_COMPOSITION)){
    picked.push(...shuffle(byType[section]).slice(0, n));
  }
  state.sessionScenarios = shuffle(picked);
  state.currentIdx = 0;
  state.answers = {};
  state.optionShuffles = {};
}

function currentScenario(){return state.sessionScenarios[state.currentIdx]}
function isLast(){return state.currentIdx === state.sessionScenarios.length - 1}
function answeredCount(){return Object.keys(state.answers).filter(k => state.answers[k] && state.answers[k].length > 0).length}

function getShuffled(s){
  if(!state.optionShuffles[s.id]) state.optionShuffles[s.id] = shuffle(s.options);
  return state.optionShuffles[s.id];
}

// ══════════════════════════════════════════════════════════════════
// NAVIGATION
// ══════════════════════════════════════════════════════════════════

function startAssessment(){
  buildSession();
  showPage('pg-assess');
  renderScenario();
}

function navBack(){
  if(state.currentIdx === 0){showPage('pg-intro');return}
  state.currentIdx--;
  renderScenario();
}

function navNext(){
  const s = currentScenario();
  const ans = state.answers[s.id];
  if(!ans || ans.length === 0) return;
  if(isLast()){runProcessing();return}
  state.currentIdx++;
  renderScenario();
}

function showPage(id){
  document.querySelectorAll('.pg').forEach(p => p.classList.remove('on'));
  document.getElementById(id).classList.add('on');
}

function openFoundations(e){
  if(e) e.preventDefault();
  _prevPage = document.querySelector('.pg.on')?.id || 'pg-intro';
  showPage('pg-foundations');
  window.scrollTo({top:0,behavior:'smooth'});
}

function closeFoundations(){
  showPage(_prevPage || 'pg-intro');
  window.scrollTo({top:0,behavior:'smooth'});
}

// Theory in Action: jump to a specific archetype section with smooth scroll
// and active-pill highlighting. The sticky nav remains in place while the
// content scrolls beneath it.
function tiaJump(e, targetId){
  if(e) e.preventDefault();
  const target = document.getElementById(targetId);
  if(!target) return;

  // Compute scroll offset accounting for the sticky nav height
  const nav = document.querySelector('.tia-nav');
  const navHeight = nav ? nav.getBoundingClientRect().height : 0;
  const targetTop = target.getBoundingClientRect().top + window.pageYOffset - navHeight - 12;
  window.scrollTo({ top: targetTop, behavior: 'smooth' });

  // Highlight the corresponding pill
  document.querySelectorAll('.tia-pill').forEach(p => p.classList.remove('active'));
  const matchingPill = document.querySelector(\`.tia-pill[href="#\${targetId}"]\`);
  if(matchingPill) matchingPill.classList.add('active');
}

// Foundations page: jump to one of the three top-level sections
// (Scientific grounding / Theory in action / Assessment methodology)
function foundJump(e, targetId){
  if(e) e.preventDefault();
  const target = document.getElementById(targetId);
  if(!target) return;

  const targetTop = target.getBoundingClientRect().top + window.pageYOffset - 16;
  window.scrollTo({ top: targetTop, behavior: 'smooth' });

  // Highlight the active button
  document.querySelectorAll('.found-jump-btn').forEach(b => b.classList.remove('active'));
  if(e && e.target) e.target.classList.add('active');
}

// ══════════════════════════════════════════════════════════════════
// RENDER SCENARIO
// ══════════════════════════════════════════════════════════════════

function renderScenario(){
  const s = currentScenario();
  const idx = state.currentIdx;
  const total = state.sessionScenarios.length;

  // Progress
  const pct = Math.round(((idx) / total) * 100);
  document.getElementById('prog-fill').style.width = pct + '%';
  document.getElementById('prog-lbl-l').textContent = 'Scenario ' + (idx + 1) + ' of ' + total;
  document.getElementById('prog-lbl-r').textContent = answeredCount() + ' answered';

  // Back
  document.getElementById('btn-back').style.visibility = idx === 0 ? 'hidden' : 'visible';

  // Render
  const area = document.getElementById('slide-area');
  area.innerHTML = '';
  const wrap = document.createElement('div');
  wrap.className = 'fade-up';

  const selections = state.answers[s.id] || [];
  const opts = getShuffled(s).map(o => {
    const pos = selections.indexOf(o.arch);
    const isSel = pos >= 0;
    const orderNum = isSel ? (pos + 1) : '';
    return \`<button class="qopt\${isSel?' sel':''}" data-arch="\${o.arch}">
      <span class="qopt-circle">\${orderNum}</span>
      <span>\${o.text}</span>
    </button>\`;
  }).join('');

  wrap.innerHTML = \`<div class="qcard">
    <p class="qtext">\${s.text}</p>
    <p class="qhint">Tap your top <span>1–3 responses</span> in order. Tap again to deselect.</p>
    <div class="qopts">\${opts}</div>
  </div>\`;

  area.appendChild(wrap);

  // Next button state
  const next = document.getElementById('btn-next');
  next.disabled = !state.answers[s.id] || state.answers[s.id].length === 0;
  next.textContent = isLast() ? 'See your results →' : 'Continue →';

  // Click handlers — multi-select with order tracking
  wrap.querySelectorAll('.qopt').forEach(btn => {
    btn.addEventListener('click', () => {
      const arch = btn.dataset.arch;
      if(!Array.isArray(state.answers[s.id])) state.answers[s.id] = [];
      const sel = state.answers[s.id];
      const i = sel.indexOf(arch);
      if(i >= 0){
        sel.splice(i, 1); // deselect; others shift up
      } else if(sel.length < 3){
        sel.push(arch); // append at end
      } else {
        // At cap: brief flash to show the limit
        flashCapHint();
        return;
      }
      // Re-render circle numbers in place
      wrap.querySelectorAll('.qopt').forEach(b => {
        const a = b.dataset.arch;
        const p = sel.indexOf(a);
        b.classList.toggle('sel', p >= 0);
        b.querySelector('.qopt-circle').textContent = p >= 0 ? (p + 1) : '';
      });
      next.disabled = sel.length === 0;
    });
  });
}

let _capFlashTimer = null;
function flashCapHint(){
  showToast('Maximum 3 selections — tap a selected option to deselect first');
}

// ══════════════════════════════════════════════════════════════════
// PROCESSING
// ══════════════════════════════════════════════════════════════════

function runProcessing(){
  showPage('pg-processing');
  setTimeout(() => {
    showResults();
  }, 1800);
}

// ══════════════════════════════════════════════════════════════════
// SCORING
// ══════════════════════════════════════════════════════════════════

const POINTS = [3, 2, 1]; // 1st pick = 3, 2nd = 2, 3rd = 1

function calcScores(){
  const blank = () => ({hedonist:0,warrior:0,lover:0,strategist:0,visionary:0});
  const scores = { baseline: blank(), pressure: blank(), identity: blank() };
  const counts = { baseline: 0, pressure: 0, identity: 0 };

  // Subscale scores: subRaw[arch][subKey] = { baseline, pressure, identity }
  const subRaw = {};
  for(const arch of ARCHS){
    subRaw[arch] = {};
    for(const subKey of Object.keys(SUBSCALES[arch])){
      subRaw[arch][subKey] = { baseline:0, pressure:0, identity:0 };
    }
  }

  state.sessionScenarios.forEach(s => {
    counts[s.section]++;
    const ans = state.answers[s.id] || [];
    ans.forEach((arch, i) => {
      if(i < POINTS.length){
        scores[s.section][arch] += POINTS[i];
        // Subscale tracking — find the option to look up its subscale tag
        const opt = s.options.find(o => o.arch === arch);
        if(opt && opt.sub){
          const subKeys = Array.isArray(opt.sub) ? opt.sub : [opt.sub];
          subKeys.forEach(sk => {
            if(subRaw[arch][sk]) subRaw[arch][sk][s.section] += POINTS[i];
          });
        }
      }
    });
  });

  // Max possible per section per archetype: count * 3 (always 1st pick)
  const maxes = {
    baseline: counts.baseline * 3,
    pressure: counts.pressure * 3,
    identity: counts.identity * 3,
  };

  // Normalize to 0-100% per section
  const pct = {};
  for(const sec of ['baseline','pressure','identity']){
    pct[sec] = {};
    for(const a of ARCHS){
      pct[sec][a] = maxes[sec] > 0 ? Math.round((scores[sec][a] / maxes[sec]) * 100) : 0;
    }
  }

  return { raw: scores, max: maxes, pct, subRaw };
}

function topN(scoreObj, n=2){
  return [...ARCHS]
    .sort((a,b) => scoreObj[b] - scoreObj[a])
    .slice(0, n);
}

function bottomN(scoreObj, n=2){
  return [...ARCHS]
    .sort((a,b) => scoreObj[a] - scoreObj[b])
    .slice(0, n);
}

function calcOverall(pct){
  // Average across all three sections per archetype
  const out = {};
  for(const a of ARCHS){
    out[a] = (pct.baseline[a] + pct.pressure[a] + pct.identity[a]) / 3;
  }
  return out;
}

function calcGap(pct){
  // baseline minus pressure per archetype
  const gap = {};
  for(const a of ARCHS){
    gap[a] = pct.baseline[a] - pct.pressure[a];
  }
  return gap;
}

// ══════════════════════════════════════════════════════════════════
// RESULTS
// ══════════════════════════════════════════════════════════════════

function showResults(){
  const scored = calcScores();
  const overall = calcOverall(scored.pct);
  const gap = calcGap(scored.pct);

  const leadTop = topN(scored.pct.baseline, 2);
  const pressTop = topN(scored.pct.pressure, 2);
  const underTop = bottomN(overall, 2);

  // Biggest positive gap = capacity that drops most under pressure
  const gapEntries = Object.entries(gap).sort((a,b) => b[1] - a[1]);
  const biggestGapArch = gapEntries[0][0];
  const biggestGapVal = gapEntries[0][1];

  renderResults(scored, leadTop, pressTop, underTop, biggestGapArch, biggestGapVal, gap);
  showPage('pg-results');
  window.scrollTo({top:0,behavior:'smooth'});
}

function renderResults(scored, leadTop, pressTop, underTop, gapArch, gapVal, gap){
  const radar = buildRadarSVG(scored.pct.baseline, scored.pct.pressure);

  const archPill = (k) => {
    const a = AD[k];
    return \`<span class="r-archpill" style="color:\${a.color};border-color:\${a.border};background:\${a.bg}"><span class="ic">\${a.icon}</span>\${a.name}</span>\`;
  };

  const leadHTML = leadTop.map(k => \`<div class="rblock-body"><strong>\${AD[k].icon} \${AD[k].name}</strong> — \${AD[k].lead}</div>\`).join('');
  const pressHTML = pressTop.map(k => \`<div class="rblock-body"><strong>\${AD[k].icon} \${AD[k].name}</strong> — \${AD[k].pressure}</div>\`).join('');
  const underHTML = underTop.map(k => \`<div class="rblock-body"><strong>\${AD[k].icon} \${AD[k].name}</strong> — \${AD[k].underuse}</div>\`).join('');

  // Gap interpretation
  const gAD = AD[gapArch];
  let gapHeadline, gapBody;
  if(gapVal >= 30){
    gapHeadline = \`\${gAD.icon} \${gAD.name} drops sharply under pressure\`;
    gapBody = \`\${gAD.name} is one of your strengths at baseline — but loses \${gapVal} points (out of 100) when stakes are high. This is a significant gap. The work of leadership under pressure is noticing when \${gAD.name} goes offline, and reaching for it deliberately when stress is asking you to abandon it.\`;
  } else if(gapVal >= 15){
    gapHeadline = \`\${gAD.icon} \${gAD.name} weakens under pressure\`;
    gapBody = \`\${gAD.name} drops by \${gapVal} points when conditions get hard. A moderate gap — present but not collapse. Worth tracking in real time: when do you feel \${gAD.name} starting to recede, and what brings it back?\`;
  } else if(gapVal >= 0){
    gapHeadline = \`Stable across baseline and pressure\`;
    gapBody = \`Your largest baseline-to-pressure gap is only \${gapVal} points (\${gAD.name}). You hold most of your archetypes consistently across conditions, which is unusual. The question worth sitting with: are there capacities you might be less aware of because nothing dramatic shifts?\`;
  } else {
    // Negative gap = something rises under pressure
    const absGap = Math.abs(gapVal);
    gapHeadline = \`\${gAD.icon} \${gAD.name} actually rises under pressure\`;
    gapBody = \`Interestingly, \${gAD.name} is \${absGap} points stronger under pressure than at baseline. This suggests \${gAD.name} is a stress response — something you reach for when things get hard, not your default mode. Worth examining whether this is adaptive or compensatory.\`;
  }

  const html = \`
  <div class="r-header fade-up">
    <div class="r-eyebrow">Your Archetype Profile</div>
    <h1 class="r-title">Five Layers Deep</h1>
    <p class="r-sub">Baseline · Under pressure · Core identity</p>
  </div>

  <div class="radar-wrap fade-up">
    \${radar}
    <div class="radar-legend">
      <div class="rleg"><div class="rleg-swatch" style="background:#D4A854;opacity:.5"></div>Baseline</div>
      <div class="rleg"><div class="rleg-swatch" style="background:#A85454;opacity:.5"></div>Under pressure</div>
    </div>
  </div>

  <div class="sec-divider">Your lead archetypes</div>
  <div class="rblock fade-up">
    <div class="rblock-lbl">Top 2 at baseline</div>
    <div class="rblock-archs">\${leadTop.map(archPill).join('')}</div>
    \${leadHTML}
  </div>

  <div class="sec-divider">Under pressure, you shift to…</div>
  <div class="rblock fade-up">
    <div class="rblock-lbl">Top 2 under pressure</div>
    <div class="rblock-archs">\${pressTop.map(archPill).join('')}</div>
    \${pressHTML}
  </div>

  <div class="sec-divider">Your biggest gap</div>
  <div class="gapbox fade-up">
    <div class="gapbox-lbl">Largest baseline-to-pressure shift</div>
    <div class="gapbox-headline" style="color:\${gAD.color}">\${gapHeadline}</div>
    <div class="gapbox-body">\${gapBody}</div>
  </div>

  <div class="sec-divider">You may underuse…</div>
  <div class="rblock fade-up" style="border-style:dashed">
    <div class="rblock-lbl">Lowest 1–2 across all sections</div>
    <div class="rblock-archs">\${underTop.map(archPill).join('')}</div>
    \${underHTML}
  </div>

  \${scored.subRaw ? \`
  <div class="sub-section fade-up">
    <div class="sub-section-hdr">Going deeper</div>
    <p class="sub-prompt">Each archetype is composed of distinct subscales drawn from validated psychological instruments. The breakdown below shows which patterns within each archetype contributed most to your scores.</p>
    <div class="sub-toggle-wrap">
      <button class="btn-sub-toggle" onclick="toggleSubscales()" id="subscale-toggle">Show subscales ▼</button>
    </div>
    <div class="sub-content" id="subscale-content" style="display:none"></div>
  </div>

  <div class="sub-section fade-up">
    <div class="sub-section-hdr">About each archetype</div>
    <p class="sub-prompt">Detailed descriptions of all five archetypes — their subscales, the patterns that emerge from different combinations, and the texture of who you actually are.\${scored.subRaw ? ' Where your specific scores match a documented pattern, that pattern is highlighted in your view.' : ''}</p>
    <div class="arch-deep-grid">
      \${ARCHS.map(arch => {
        const ad = AD[arch];
        return \`<button class="arch-deep-btn" style="border-color:\${ad.color}40" onclick="openArchModalFromResults('\${arch}')">
          <span class="arch-deep-icon" style="color:\${ad.color}">\${ad.icon}</span>
          <span class="arch-deep-name" style="color:\${ad.color}">The \${ad.name}</span>
          <span class="arch-deep-arrow">→</span>
        </button>\`;
      }).join('')}
    </div>
  </div>\` : \`
  <div class="sub-section fade-up">
    <div class="sub-section-hdr">About each archetype</div>
    <p class="sub-prompt">Detailed descriptions of all five archetypes — their subscales and the patterns that emerge from different combinations.</p>
    <div class="arch-deep-grid">
      \${ARCHS.map(arch => {
        const ad = AD[arch];
        return \`<button class="arch-deep-btn" style="border-color:\${ad.color}40" onclick="openArchModal('\${arch}')">
          <span class="arch-deep-icon" style="color:\${ad.color}">\${ad.icon}</span>
          <span class="arch-deep-name" style="color:\${ad.color}">The \${ad.name}</span>
          <span class="arch-deep-arrow">→</span>
        </button>\`;
      }).join('')}
    </div>
  </div>\`}

  <div class="r-actions fade-up">
    <button class="btn btn-dark" onclick="copyShare()">Copy shareable link</button>
  </div>

  <div style="text-align:center;margin-top:22px">
    <a class="found-link" href="#foundations" onclick="openFoundations(event)">Theoretical foundations →</a>
  </div>

  <div class="footer">© Jennifer May / Incite Leadership</div>\`;

  document.getElementById('results-content').innerHTML = html;

  // Stash for deep-dive modal access
  _lastScored = scored;

  // Always compute and store the share hash — copyShare uses this regardless of replaceState
  try{
    _lastShareHash = encodeResults(scored.pct);
  } catch(e){ _lastShareHash = ''; }

  // Also try to set it in the URL bar (will fail in sandboxed iframes — that's fine)
  try{
    if(_lastShareHash) history.replaceState(null, '', '#r=' + _lastShareHash);
  } catch(e){ /* sandboxed iframe */ }
}

// ══════════════════════════════════════════════════════════════════
// ARCHETYPE DETAIL MODAL
// Opened from home page archboxes (no scores yet) and from results
// page deep-dive section (with scored data → conditional combos).
// ══════════════════════════════════════════════════════════════════

let _archModalOpen = false;
let _archModalReturnFocus = null;
let _lastScored = null;  // stashed so the results-page deep-dive buttons can access it

function openArchModal(arch, scored){
  // scored is optional — when present, we surface matching combinations
  const details = ARCHETYPE_DETAILS[arch];
  if(!details) return;
  const ad = AD[arch];
  const backdrop = document.getElementById('arch-modal-backdrop');
  const content = document.getElementById('arch-modal-content');
  if(!backdrop || !content) return;

  // Display titles match the home page archbox-name strings
  const ARCH_TITLES = {
    hedonist:   'Vitality and appetite',
    warrior:    'Vigilance and resolve',
    lover:      'Care and connection',
    strategist: 'Pattern and plan',
    visionary:  'Meaning and direction',
  };

  _archModalReturnFocus = document.activeElement;

  // Build the icon by reusing the home page SVG content (search the live DOM for the matching archbox)
  // Falls back to AD[arch].icon glyph if not found.
  let iconHTML = \`<div style="font-size:48px;color:\${ad.color};text-align:center;margin-bottom:14px">\${ad.icon}</div>\`;
  const sourceBox = document.querySelector(\`.archbox[onclick*="'\${arch}'"] svg\`);
  if(sourceBox){
    iconHTML = \`<div class="arch-modal-icon-wrap" style="display:flex;justify-content:center">\${sourceBox.outerHTML.replace('class="archbox-icon"', 'class="arch-modal-icon"')}</div>\`;
  }

  // Subscale list
  const subList = details.subscales.map(s => \`
    <div class="arch-sub-item" style="border-left-color:\${ad.color}">
      <div class="arch-sub-item-name">\${s.name}</div>
      <div class="arch-sub-item-desc">\${s.desc}</div>
    </div>\`).join('');

  // Combinations — only shown when scored data is provided AND a combination matches
  let combosHTML = '';
  if(scored && scored.subRaw){
    const subPct = computeSubPct(arch, scored.subRaw);
    const matched = details.combinations.filter(c => {
      try { return c.detect(subPct); } catch(e){ return false; }
    });
    if(matched.length > 0){
      combosHTML = \`
        <div style="margin-top:24px;padding-top:22px;border-top:1px solid var(--border)">
          <div style="font-family:var(--fm);font-size:9px;font-weight:700;letter-spacing:.16em;color:\${ad.color};text-transform:uppercase;margin-bottom:14px">Your pattern</div>
          \${matched.map(c => \`
            <div style="margin-bottom:18px;padding:14px 16px;background:var(--surface2);border-left:3px solid \${ad.color};border-radius:6px">
              <div style="font-family:var(--fd);font-size:14.5px;font-weight:700;color:var(--text);margin-bottom:8px;line-height:1.35">\${c.label}</div>
              <div style="font-size:13px;color:var(--text2);line-height:1.65">\${c.content}</div>
            </div>\`).join('')}
        </div>\`;
    }
  }

  // "Also worth knowing" — always shown
  let alsoHTML = '';
  if(details.also){
    alsoHTML = \`
      <div style="margin-top:22px;padding-top:18px;border-top:1px dashed var(--border)">
        <div style="font-family:var(--fm);font-size:9px;font-weight:700;letter-spacing:.16em;color:var(--text3);text-transform:uppercase;margin-bottom:10px">Also worth knowing</div>
        <div style="font-size:13px;color:var(--text2);line-height:1.7">\${details.also}</div>
      </div>\`;
  }

  // Uncovered subscales note
  let uncoveredHTML = '';
  if(details.uncovered){
    uncoveredHTML = \`
      <div class="arch-uncovered">
        <div class="arch-uncovered-hdr">Not measured by this assessment</div>
        <div class="arch-uncovered-name">\${details.uncovered.name}</div>
        <div class="arch-uncovered-note">\${details.uncovered.note}</div>
        <div class="arch-uncovered-cta">A more comprehensive assessment is in development. If you're interested in measuring these capacities, please <a href="mailto:hello@inciteleadership.com?subject=Five%20Layers%20Deep%20—%20comprehensive%20assessment" style="color:inherit;border-bottom:1px solid var(--text3)">get in touch</a>.</div>
      </div>\`;
  }

  content.innerHTML = \`
    <div class="arch-modal-hdr">
      \${iconHTML}
      <div class="arch-modal-eyebrow" style="color:\${ad.color}">The \${ad.name}</div>
      <div class="arch-modal-title" id="arch-modal-title">\${ARCH_TITLES[arch] || ad.name}</div>
    </div>
    <div class="arch-modal-body">
      <p class="arch-modal-framing">\${details.framing}</p>
      <div class="arch-sub-list">\${subList}</div>
      \${combosHTML}
      \${alsoHTML}
      \${uncoveredHTML}
    </div>\`;

  backdrop.classList.add('on');
  _archModalOpen = true;
  document.body.style.overflow = 'hidden';

  // Move focus to the close button for accessibility
  setTimeout(() => {
    const closeBtn = backdrop.querySelector('.arch-modal-close');
    if(closeBtn) closeBtn.focus();
  }, 100);
}

function closeArchModal(){
  const backdrop = document.getElementById('arch-modal-backdrop');
  if(!backdrop) return;
  backdrop.classList.remove('on');
  _archModalOpen = false;
  document.body.style.overflow = '';
  if(_archModalReturnFocus && _archModalReturnFocus.focus){
    _archModalReturnFocus.focus();
    _archModalReturnFocus = null;
  }
}

// Wrapper used by results-page deep-dive buttons — uses the stashed scored data
function openArchModalFromResults(arch){
  if(_lastScored && _lastScored.subRaw){
    openArchModal(arch, _lastScored);
  } else {
    openArchModal(arch);
  }
}

// Helper: compute within-archetype subscale percentages for combination detection
function computeSubPct(arch, subRaw){
  const out = {};
  for(const [subKey, _] of Object.entries(SUBSCALES[arch])){
    const counts = SUBSCALE_COUNTS[arch][subKey];
    const sec = subRaw[arch][subKey];
    const total = sec.baseline + sec.pressure + sec.identity;
    const max = counts.total * 3;
    out[subKey] = max > 0 ? Math.round((total / max) * 100) : 0;
  }
  return out;
}

// Esc key closes modal
document.addEventListener('keydown', (e) => {
  if(e.key === 'Escape' && _archModalOpen) closeArchModal();
});

// ══════════════════════════════════════════════════════════════════
// SUBSCALE ANALYSIS
// ══════════════════════════════════════════════════════════════════

function toggleSubscales(){
  const content = document.getElementById('subscale-content');
  const btn = document.getElementById('subscale-toggle');
  if(!content || !btn) return;

  if(content.style.display === 'none'){
    if(!content.dataset.rendered){
      const scored = calcScores();
      content.innerHTML = \`<div class="sub-content-intro">Subscales are drawn from validated reference instruments — see <a href="#foundations" onclick="openFoundations(event)" style="color:inherit;text-decoration:underline">Theoretical foundations</a> for full citations and the coverage matrix. Percentages are within-archetype: the proportion of available points you scored on that subscale.</div>\` + renderSubscaleAnalysis(scored.subRaw);
      content.dataset.rendered = '1';
    }
    content.style.display = 'block';
    btn.textContent = 'Hide subscales ▲';
  } else {
    content.style.display = 'none';
    btn.textContent = 'Show subscales ▼';
  }
}

function renderSubscaleAnalysis(subRaw){
  // Calculate per-subscale percentages and per-archetype totals
  const out = {};
  for(const arch of ARCHS){
    out[arch] = { subscales:{}, total:0, max:0, pct:0 };
    for(const [subKey, label] of Object.entries(SUBSCALES[arch])){
      const counts = SUBSCALE_COUNTS[arch][subKey];
      const sec = subRaw[arch][subKey];
      const total = sec.baseline + sec.pressure + sec.identity;
      const max = counts.total * 3;
      const pct = max > 0 ? Math.round((total / max) * 100) : 0;
      out[arch].subscales[subKey] = { label, total, max, pct, items:counts.total };
      out[arch].total += total;
      out[arch].max += max;
    }
    out[arch].pct = out[arch].max > 0 ? Math.round((out[arch].total / out[arch].max) * 100) : 0;
  }

  // Sort archetypes by their total subscale-coded score (descending)
  const sortedArchs = ARCHS.slice().sort((a,b) => out[b].total - out[a].total);

  return sortedArchs.map(arch => {
    const ad = AD[arch];
    const data = out[arch];

    // Sort subscales within archetype by percentage
    const sortedSubs = Object.entries(data.subscales)
      .map(([key, info]) => ({ key, ...info }))
      .sort((a,b) => b.pct - a.pct);

    const dominantSub = sortedSubs[0];
    const interp = subscaleInterpretation(arch, dominantSub, sortedSubs);
    const note = subscaleNote(arch);

    const bars = sortedSubs.map(s => \`
      <div class="sub-row">
        <div class="sub-row-label">
          <span class="sub-row-name">\${s.label}</span>
          <span class="sub-row-meta">\${s.items} item\${s.items !== 1 ? 's' : ''}</span>
        </div>
        <div class="sub-row-bar">
          <div class="sub-bar-track"><div class="sub-bar-fill" style="width:\${s.pct}%;background:\${ad.color}"></div></div>
          <span class="sub-row-pct">\${s.pct}%</span>
        </div>
      </div>
    \`).join('');

    return \`<div class="sub-card" style="border-left-color:\${ad.color}">
      <div class="sub-card-hdr">
        <span class="sub-card-icon">\${ad.icon}</span>
        <span class="sub-card-name" style="color:\${ad.color}">\${ad.name}</span>
        <span class="sub-card-pct">\${data.pct}% within archetype</span>
      </div>
      <div class="sub-rows">\${bars}</div>
      \${interp ? \`<p class="sub-interp">\${interp}</p>\` : ''}
      \${note ? \`<p class="sub-note">\${note}</p>\` : ''}
    </div>\`;
  }).join('');
}

function subscaleInterpretation(arch, dominant, sortedSubs){
  // Skip interpretation if dominant score is 0 (user didn't engage with this archetype)
  if(dominant.pct === 0) return \`You didn't engage with <strong>\${AD[arch].name}</strong> responses on this assessment, so subscale-level patterns can't be read.\`;

  const interps = {
    hedonist: {
      drive:                 "Your Hedonist runs primarily through <strong>Drive</strong> — you pursue what you want with persistence and intensity.",
      reward_responsiveness: "Your Hedonist runs primarily through <strong>Reward Responsiveness</strong> — pleasure in what's already in front of you, savoring rather than chasing.",
      fun_seeking:           "Your Hedonist runs primarily through <strong>Fun Seeking</strong> — pull toward novelty, stimulation, and play.",
    },
    warrior: {
      threat_sensitivity: "Your Warrior runs primarily through <strong>Threat Sensitivity</strong> — vigilance and anticipation rather than active confrontation.",
      fight:              "Your Warrior runs primarily through <strong>Fight</strong> — active confrontation when challenged or when something matters.",
      flight:             "Your Warrior runs primarily through <strong>Flight</strong> — protective withdrawal or strategic retreat under threat.",
    },
    lover: {
      empathic_concern:   "Your Lover runs primarily through <strong>Empathic Concern</strong> — feeling with and for others, warmth as the primary mode.",
      perspective_taking: "Your Lover runs primarily through <strong>Perspective Taking</strong> — understanding others without absorbing their state. Cognitive empathy.",
      personal_distress:  "Your Lover shows notable <strong>Personal Distress</strong> — others' pain crosses the boundary into your own state. This can drive caring action but also burnout.",
    },
    strategist: {
      analytical_thinking:   "Your Strategist runs primarily through <strong>Analytical Thinking</strong> — systematic decomposition, evidence-weighing, structured problem-solving.",
      cognitive_flexibility: "Your Strategist runs primarily through <strong>Cognitive Flexibility</strong> — reframing, adapting your model when reality shifts.",
      future_consequences:   "Your Strategist runs primarily through <strong>Future Consequences</strong> — downstream thinking, second- and third-order effects.",
    },
    visionary: {
      presence_of_meaning: "Your Visionary runs primarily through <strong>Presence of Meaning</strong> — a settled sense of what matters, brought to bear on situations.",
      search_for_meaning:  "Your Visionary runs primarily through <strong>Search for Meaning</strong> — active questioning of purpose, often triggered by friction or change.",
      self_transcendence:  "Your Visionary runs primarily through <strong>Self-Transcendence</strong> — orientation to what outlasts you, what's larger than the self.",
    },
  };

  let text = (interps[arch] && interps[arch][dominant.key]) || '';

  // Note if there's a notable gap between top and bottom subscale (only if we have meaningful data)
  if(sortedSubs.length > 1){
    const bottom = sortedSubs[sortedSubs.length - 1];
    const gap = dominant.pct - bottom.pct;
    if(gap >= 30 && bottom.pct < dominant.pct){
      text += \` <strong>\${bottom.label}</strong> (\${bottom.pct}%) is comparatively underused.\`;
    }
  }

  return text;
}

function subscaleNote(arch){
  const notes = {
    hedonist:   "Hedonist subscales each have only 3–4 items, and several Hedonist responses (low-engagement / let-it-pass) aren't subscale-coded. Read directionally rather than precisely.",
    warrior:    "Threat Sensitivity is baseline-heavy (chronic vigilance); Fight is pressure- and identity-heavy (emerges under load); Flight only appears in pressure scenarios by design. Subscale balance reflects construct nature, not assessment limits.",
    lover:      "Perspective Taking offers the cleanest baseline-vs-pressure differential. Personal Distress is pressure-only — high scores here suggest others' suffering tends to land on you, not just be witnessed.",
    strategist: "Analytical Thinking is the most heavily covered subscale (11 items) — high confidence here. Cognitive Flexibility and Future Consequences are thin (2 items each); read those as directional only.",
    visionary:  "Presence of Meaning is baseline-heavy (chronic orientation to what matters); Search for Meaning is pressure-heavy (active questioning emerges under load). Self-Transcendence is thin (2 items) — directional only.",
  };
  return notes[arch] || '';
}

// ══════════════════════════════════════════════════════════════════
// RADAR CHART
// ══════════════════════════════════════════════════════════════════

function buildRadarSVG(basePct, pressPct){
  // viewBox is 480 wide × 400 tall — extra horizontal room so Warrior/Visionary labels don't clip
  const cx = 240, cy = 200, maxR = 130;
  const labelR = maxR + 28;

  // Hedonist top, Warrior upper-right, Lover lower-right, Strategist lower-left, Visionary upper-left
  const angleFor = (i) => (-90 + i * 72) * Math.PI / 180;

  const pt = (i, frac) => {
    const a = angleFor(i);
    const r = maxR * frac;
    return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
  };

  // Grid pentagons at 25/50/75/100%
  const grid = [0.25, 0.5, 0.75, 1.0].map(level => {
    const pts = ARCHS.map((_, i) => pt(i, level).map(n => n.toFixed(1)).join(','));
    return \`<polygon class="radar-grid" points="\${pts.join(' ')}" />\`;
  }).join('');

  // Axes
  const axes = ARCHS.map((_, i) => {
    const [x, y] = pt(i, 1);
    return \`<line class="radar-axis" x1="\${cx}" y1="\${cy}" x2="\${x.toFixed(1)}" y2="\${y.toFixed(1)}" />\`;
  }).join('');

  // Polygons
  const baseFracs = ARCHS.map(a => Math.max(0.02, basePct[a] / 100));
  const pressFracs = ARCHS.map(a => Math.max(0.02, pressPct[a] / 100));

  const basePts = baseFracs.map((f, i) => pt(i, f).map(n => n.toFixed(1)).join(',')).join(' ');
  const pressPts = pressFracs.map((f, i) => pt(i, f).map(n => n.toFixed(1)).join(',')).join(' ');

  // Vertex dots
  const baseDots = baseFracs.map((f, i) => {
    const [x, y] = pt(i, f);
    return \`<circle class="radar-pt" cx="\${x.toFixed(1)}" cy="\${y.toFixed(1)}" r="3" stroke="#D4A854" />\`;
  }).join('');
  const pressDots = pressFracs.map((f, i) => {
    const [x, y] = pt(i, f);
    return \`<circle class="radar-pt" cx="\${x.toFixed(1)}" cy="\${y.toFixed(1)}" r="3" stroke="#A85454" />\`;
  }).join('');

  // Labels
  const labels = ARCHS.map((arch, i) => {
    const a = angleFor(i);
    const x = cx + labelR * Math.cos(a);
    const y = cy + labelR * Math.sin(a);
    let anchor = 'middle';
    if(Math.cos(a) > 0.25) anchor = 'start';
    else if(Math.cos(a) < -0.25) anchor = 'end';
    let dy = '0.35em';
    if(Math.sin(a) < -0.5) dy = '0';
    else if(Math.sin(a) > 0.5) dy = '0.7em';
    const ad = AD[arch];
    return \`<text class="radar-label" x="\${x.toFixed(1)}" y="\${y.toFixed(1)}" text-anchor="\${anchor}" dy="\${dy}" fill="\${ad.color}">
      <tspan class="radar-label-icon">\${ad.icon}</tspan> \${ad.name}
    </text>\`;
  }).join('');

  return \`<svg class="radar-svg" viewBox="0 0 480 400" xmlns="http://www.w3.org/2000/svg">
    \${grid}
    \${axes}
    <polygon class="radar-poly-base" points="\${basePts}" />
    <polygon class="radar-poly-press" points="\${pressPts}" />
    \${baseDots}
    \${pressDots}
    \${labels}
  </svg>\`;
}

// ══════════════════════════════════════════════════════════════════
// SHARING / RETAKE
// ══════════════════════════════════════════════════════════════════

let _lastShareHash = '';

function encodeResults(pct){
  const enc = ARCHS.map(a => pct.baseline[a]).join(',') +
    '|' + ARCHS.map(a => pct.pressure[a]).join(',') +
    '|' + ARCHS.map(a => pct.identity[a]).join(',');
  return btoa(enc);
}

function decodeResults(hash){
  try{
    const raw = atob(hash.replace(/^r=/, ''));
    const parts = raw.split('|');
    if(parts.length < 3) return null;
    const toObj = (arr) => Object.fromEntries(ARCHS.map((k, i) => [k, parseInt(arr[i]) || 0]));
    return {
      baseline: toObj(parts[0].split(',')),
      pressure: toObj(parts[1].split(',')),
      identity: toObj(parts[2].split(',')),
    };
  } catch(e){return null}
}

function copyShare(){
  if(!_lastShareHash){
    showToast('No results to share yet');
    return;
  }

  // Detect sandboxed preview (artifact iframe runs at about:srcdoc)
  const proto = window.location.protocol;
  if(proto !== 'http:' && proto !== 'https:'){
    showToast('Sharing works on the deployed site, not in this preview');
    return;
  }

  // Build the URL from the stored hash — works whether or not replaceState succeeded
  const url = window.location.origin + window.location.pathname + '#r=' + _lastShareHash;

  if(navigator.clipboard && navigator.clipboard.writeText){
    navigator.clipboard.writeText(url)
      .then(() => showToast('Link copied to clipboard'))
      .catch(() => fallbackCopy(url));
  } else {
    fallbackCopy(url);
  }
}

function fallbackCopy(text){
  try{
    const el = document.createElement('textarea');
    el.value = text;
    el.style.position = 'fixed';
    el.style.left = '-9999px';
    el.setAttribute('readonly', '');
    document.body.appendChild(el);
    el.select();
    el.setSelectionRange(0, text.length);
    const ok = document.execCommand('copy');
    document.body.removeChild(el);
    showToast(ok ? 'Link copied to clipboard' : 'Copy failed — please copy from address bar');
  } catch(e){
    showToast('Copy unavailable in this browser');
  }
}

function showToast(msg){
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('on');
  setTimeout(() => t.classList.remove('on'), 2600);
}

// ══════════════════════════════════════════════════════════════════
// INIT — handle shared results in URL hash
// ══════════════════════════════════════════════════════════════════

document.addEventListener('DOMContentLoaded', () => {
  const hash = window.location.hash.slice(1);
  if(hash && hash.startsWith('r=')){
    const decoded = decodeResults(hash);
    if(decoded){
      _lastShareHash = hash.replace(/^r=/, '');
      const pct = decoded;
      const overall = calcOverall(pct);
      const gap = calcGap(pct);
      const leadTop = topN(pct.baseline, 2);
      const pressTop = topN(pct.pressure, 2);
      const underTop = bottomN(overall, 2);
      const gapEntries = Object.entries(gap).sort((a,b) => b[1] - a[1]);
      renderResults({pct}, leadTop, pressTop, underTop, gapEntries[0][0], gapEntries[0][1], gap);
      showPage('pg-results');
    }
  }
});
`;

// Once we've initialized once, don't re-init on subsequent mounts of the same
// React instance — the original script attaches global functions and runs
// startup logic that should not be repeated.
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
        // Run in global scope so all the functions become window-scoped.
        // eslint-disable-next-line no-new-func
        (new Function(LSA_SCRIPT))();
        _lsaInitialized = true;
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('LSA script init error:', err);
      }
    } else {
      // On a re-mount of this component, the script is already on window.
      // We need to re-run any startup logic. The original script's startup
      // is mostly DOM event wiring (none) — startAssessment() is triggered
      // by user click. So nothing to re-run.
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
        '<p style="font-size:14px;color:var(--text2);margin-bottom:20px">Have Claude write a short personalized synthesis of your results — what your top archetypes, gap, and underused capacity say about your leadership pattern.</p>' +
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
              content: 'Below are the results of a leadership-stance self-assessment. Write a short, warm, plain-language synthesis (180-250 words) of what these results suggest about how the person leads — their strengths, their gap under pressure, and one practical place to focus. Do not list the numbers; speak to the pattern. Use second-person voice ("you").\n\n' + txt
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
      <style>{LSA_CSS}</style>
      <div ref={rootRef} className="lsa-root" />
    </>
  );
}
