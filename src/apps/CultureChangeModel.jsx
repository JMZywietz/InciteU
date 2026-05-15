import { useState, useEffect, useRef } from "react";
import SEO from '../components/SEO.jsx';

// ╔═══════════════════════════════════════════════════════════════════════════╗
// ║ LIFTING INSTRUCTIONS — for porting this file into a different host app    ║
// ║ ───────────────────────────────────────────────────────────────────────── ║
// ║ This file is intentionally self-contained: zero imports from sibling      ║
// ║ source files, theme/style/data all inlined. To move it to a new host:     ║
// ║   1. Copy this single .jsx into the host project.                         ║
// ║   2. Adjust the two backend URLs below if the host mounts them            ║
// ║      somewhere other than the Vercel defaults.                            ║
// ║   3. Ensure the host provides:                                            ║
// ║        POST {API_SYNTHESIZE_URL}  body:{model, max_tokens, messages}      ║
// ║             → standard Anthropic /v1/messages response shape              ║
// ║        POST {API_SESSIONS_URL}   body:{action:"create"|"contribute"|      ║
// ║                                         "synthesis"|"delete", …}          ║
// ║        GET  {API_SESSIONS_URL}?code=X  → session object (404 if absent)   ║
// ║   4. The file expects react 16.8+ (uses hooks).                           ║
// ╚═══════════════════════════════════════════════════════════════════════════╝
const API_SYNTHESIZE_URL = "/api/synthesize";
const API_SESSIONS_URL   = "/api/sessions";

function useWindowWidth() {
  const [w, setW] = useState(
    typeof window !== "undefined" ? window.innerWidth : 1200
  );
  useEffect(() => {
    const h = () => setW(window.innerWidth);
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);
  return w;
}

const P = {
  bg: "#1a393c",
  surface: "#1f4347",
  surfaceHover: "#265055",
  border: "#2d5a5e",
  borderLight: "#3a6e73",
  gold: "#c9a84c",
  goldLight: "#e8c97a",
  goldDim: "#8a7035",
  goldFaint: "#c9a84c22",
  slate: "#a8c4c7",
  text: "#f0f5f4",
  textDim: "#6a9296",
  lime: "#d5e8b2",
  pre: "#8ab4c0",
  preDim: "#4a7a88",
  preFaint: "#8ab4c014",
  why: "#c49a50",
  whyDim: "#7a6030",
  whyFaint: "#c49a5014",
  what: "#9a88c0",
  whatDim: "#5a5080",
  whatFaint: "#9a88c014",
  how: "#c9a84c",
  howDim: "#7a6430",
  howFaint: "#c9a84c14",
  who: "#7ab898",
  whoDim: "#3a6a56",
  whoFaint: "#7ab89814",
};
const H = {
  heading: {
    fontFamily: "'Cormorant Garamond',Georgia,serif",
    letterSpacing: "0.03em",
  },
  body: { fontFamily: "'DM Sans','Segoe UI',sans-serif" },
  mono: { fontFamily: "'JetBrains Mono',monospace" },
};
const gf = `@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600;700&family=DM+Sans:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500&display=swap');`;

// ─── NODES ──────────────────────────────────────────────────────────────────
const NODES = [
  {
    id: "pre",
    label: "PRECONDITIONS",
    subtitle: "The Soil",
    color: P.pre,
    colorDim: P.preDim,
    colorFaint: P.preFaint,
    icon: "🌱",
    summary:
      "Every organization already has a culture — built by default, not design. Before cultivating the culture you want, the soil must be ready.",
    detail: {
      opening:
        "You cannot grow a healthy plant without sunlight and well-drained soil. Culture is no different. Psychological safety and accountability are not outcomes of culture work — they are preconditions for it. Without them, every intervention is performance.",
      elements: [
        {
          title: "Psychological Safety",
          body: "People must believe they can speak up, disagree, and fail without punishment. Without it, the observable behaviors of culture change are performed, not real. The test: are people telling leaders what they need to hear?",
        },
        {
          title: "Accountability",
          body: "The other side of safety. Without consistent, fair consequences for values violations, norms erode fast. Safety and accountability are not opposites — they are partners. One without the other produces either fear or permissiveness.",
        },
        {
          title: "Leadership Readiness",
          body: "Leaders must be willing to go first — in vulnerability, in behavior change, in naming what isn't working. Unready leadership is the single most common reason culture work stalls. Readiness is not enthusiasm; it is willingness to be changed.",
        },
        {
          title: "Trust Infrastructure",
          body: "A baseline of institutional trust — in leaders' intentions, in the fairness of systems, in the honesty of communication — is the minimum viable condition for transformation. Where trust is absent, begin by building it.",
        },
        {
          title: "Structural Enablement",
          body: "Formal systems — hiring, promotion, performance management, rewards — must not actively contradict the change. They almost always do. Misaligned systems will beat aspirational values every time. Audit them before you launch.",
        },
      ],
    },
  },
  {
    id: "why",
    label: "WHY",
    subtitle: "The Case for Change",
    color: P.why,
    colorDim: P.whyDim,
    colorFaint: P.whyFaint,
    icon: "🔥",
    summary:
      "Change only happens when reasons are compelling enough to overcome organizational friction. The 'why' must be both felt and understood.",
    detail: {
      opening:
        "No culture change succeeds without a force strong enough to dislodge the status quo. The most powerful change efforts combine a burning platform with a compelling vision — the cost of staying is too high, and the pull of what's possible is irresistible.",
      elements: [
        {
          title: "Burning Platform + Compelling Vision",
          body: "The most durable culture efforts have both: urgency that creates momentum and vision that sustains it past the hard middle.",
        },
        {
          title: "Quantified Cost of Status Quo",
          body: "What does the current culture cost in attrition, lost innovation, customer experience erosion, or competitive decline? Make the invisible visible.",
        },
        {
          title: "Authentic Leadership Urgency",
          body: "Senior leaders must genuinely believe the change is necessary and be willing to go first. Performed urgency is detected immediately — and it inoculates organizations against future change attempts.",
        },
        {
          title: "Stakeholder Resonance",
          body: "The 'why' must land differently for different audiences. One corporate narrative is not enough. Boards, managers, and frontline employees each need their own version of the truth.",
        },
        {
          title: "Narrative Clarity",
          body: "A compelling why is also a story. Who are we? What happened? What's at stake? Organizations that can answer these cleanly create alignment without mandating it.",
        },
      ],
    },
  },
  {
    id: "what",
    label: "WHAT",
    subtitle: "The North Star",
    color: P.what,
    colorDim: P.whatDim,
    colorFaint: P.whatFaint,
    icon: "🌟",
    summary:
      "A precise definition of the feelings, mindsets, and behaviors you want to cultivate — and how they differ from today.",
    detail: {
      opening:
        "Culture change requires us to understand not only where we want to go — the North Star — but also where we are coming from, and what makes it easier or harder to move into the future. Without that full picture, even the most compelling vision lands in a vacuum.",
      elements: [
        {
          title: "Understand Why Your Current Culture Exists",
          body: "Every culture is a solution to a previous problem. Before you can change it, you need to understand what it was designed — consciously or not — to protect. The assumptions, habits, and norms that feel like obstacles today once served a purpose. If you don't understand why the current culture is entrenched, your change effort will fight the symptoms and leave the roots intact.",
        },
        {
          title: "Define Where You Are Going — and Why It Matters",
          body: "A North Star is not a slogan. It is a vivid, specific picture of the organisation at its best — one that people can see themselves inside. It must answer 'what will be different on a Tuesday morning?' with enough clarity to orient decisions, and enough pull to sustain people through the discomfort of getting there. Without a compelling why behind the vision, aspiration becomes wallpaper.",
        },
        {
          title: "Make the Change Tangible",
          body: "Abstract culture goals change nothing. The shift must be articulated in three registers: what it feels like to work here (the emotional experience), what people believe and assume (the mindsets that shift), and what people actually do differently (a few clear, observable behaviors). If you can't describe the change in terms a new employee would recognise in their first week, it isn't concrete enough yet.",
        },
        {
          title: "Name What You Are Trading",
          body: "Every cultural shift has a cost — and an honest North Star names it. What will you lose by moving toward the new culture? What was genuinely valuable about the old one? Polarity-aware culture change acknowledges that the new direction has downsides and the old one had real strengths. Organisations that skip this step create cynicism: people can see the trade-offs even when leaders refuse to name them.",
        },
      ],
    },
  },
  {
    id: "how",
    label: "HOW",
    subtitle: "A Dual Path Forward",
    color: P.how,
    colorDim: P.howDim,
    colorFaint: P.howFaint,
    icon: "⚙️🌿",
    summary:
      "A dual-track approach: disciplined process for what can be engineered, emergence thinking for what must be cultivated.",
    isHow: true,
  },
  {
    id: "who",
    label: "WHO",
    subtitle: "The Paradox of Leadership",
    color: P.who,
    colorDim: P.whoDim,
    colorFaint: P.whoFaint,
    icon: "👥",
    summary:
      "Cultures cannot grow past the level of their leadership — and at the same time, culture is co-created by every human in the organization.",
    detail: {
      opening:
        "This is the central paradox of culture change: it must be led from the top, and it must be owned by everyone. Resolving this paradox — rather than collapsing it to one side — is the work.",
      elements: [
        {
          title: "The Leadership Ceiling",
          body: "Organizations do not sustain cultures more mature or values-driven than their leadership team. Leaders go first — in visibility, vulnerability, and accountability.",
        },
        {
          title: "The Distributed Creator",
          body: "Every conversation, decision, and micro-behavior is a cultural act. Culture is not HR's job — it is the lived output of thousands of daily choices.",
        },
        {
          title: "The Middle Layer",
          body: "Middle managers are the most critical and most underserved population in culture change. They are the translation layer between strategy and daily experience.",
        },
        {
          title: "Culture Champions & Informal Influencers",
          body: "The people others watch and follow regardless of title are your amplifiers. Their adoption signals to others that the change is real.",
        },
        {
          title: "Holding the Paradox",
          body: "Top-down AND bottom-up, simultaneously. Leaders must set direction clearly while genuinely creating space for emergence. This demands more of leaders, not less.",
        },
      ],
    },
  },
];

// ─── 5As ────────────────────────────────────────────────────────────────────
const FIVE_AS = [
  {
    label: "Aspire",
    num: "01",
    short: "Define the cultural ambition. Co-create the target state with diverse voices.",
    body: "Define the cultural ambition with specificity. What does success look and feel like? Co-create the target state with diverse voices to build ownership from the start.",
    qs: ["What culture do we need to execute our strategy?", "Who must be in the room to build genuine ownership?"],
    complexity: [],
  },
  {
    label: "Assess",
    num: "02",
    short: "Diagnose the current state with honesty — surveys, ethnography, attrition signals, systems audit.",
    body: "Diagnose the current state with honesty. Use quantitative and qualitative data to understand the real culture, not the espoused one. Include a formal systems audit.",
    qs: ["Where are the largest gaps from our aspiration?", "Which formal systems actively work against us?"],
    complexity: [],
  },
  {
    label: "Architect",
    num: "03",
    short: "Design the portfolio of interventions. Sequence for maximum leverage.",
    body: "Design the portfolio of interventions across all cultural levers: leadership behavior, formal systems, symbols & rituals, structural signals. Sequence for maximum leverage.",
    qs: ["Which levers will move this culture fastest?", "What must change before anything else can?"],
    complexity: [],
  },
  {
    label: "Act",
    num: "04",
    short: "Implement with discipline. Use Sense & Respond cycles to adjust in real time.",
    body: "Implement with discipline and sustained attention. Run Sense & Respond cycles — continuously read signals from the system and adapt your approach. Culture change is not a launch event; it is action accumulated over time.",
    qs: ["Who owns what, by when?", "What are we sensing — and how are we responding to it?"],
    complexity: [],
  },
  {
    label: "Advance",
    num: "05",
    short: "Sustain and embed. Measure amplifying and dampening loops.",
    body: "Sustain and embed. Measure both leading indicators (behaviors, psychological safety scores) and lagging indicators (attrition, innovation rate). Identify which amplifying loops are accelerating the new culture and which dampening loops are still reinforcing the old one.",
    qs: ["Which amplifying loops do we scale?", "Which dampening loops still need attention?"],
    complexity: [],
  },
];

const KOTTER = [
  { num: "1", label: "Create Urgency", phase: 0, body: "Convince at least 75% of your leadership that the status quo is more dangerous than the unknown." },
  { num: "2", label: "Build a Coalition", phase: 0, body: "Assemble a group with power, expertise, credibility, and leadership to guide the effort." },
  { num: "3", label: "Form a Vision", phase: 0, body: "Clarify how the future will be different from the past, and how that future can be made a reality." },
  { num: "4", label: "Enlist a Volunteer Army", phase: 0, body: "Large-scale change only occurs when massive numbers of people rally around a common opportunity." },
  { num: "5", label: "Remove Barriers", phase: 1, body: "Remove obstacles to change. Change systems or structures that undermine the change vision." },
  { num: "6", label: "Generate Short-Term Wins", phase: 1, body: "Recognize and reward people who make change happen. Short wins create proof points and build momentum." },
  { num: "7", label: "Sustain Acceleration", phase: 1, body: "Use increasing credibility to change all systems, structures, and policies that don't fit the vision." },
  { num: "8", label: "Institute Change", phase: 1, body: "Articulate the connections between new behaviors and organizational success. Make it stick." },
];

const COMPLEX = [
  { icon: "→", label: "Direction, Not Destination", body: "Set a direction, not an endpoint. Trust the system to find the path. Rigid destination-setting in complex systems produces compliance theater, not genuine change.", principle: "Emergence over engineering" },
  { icon: "⊢", label: "Guardrails", body: "Define non-negotiables — the values and behaviors inviolable regardless of context. Guardrails create genuine freedom within a safe container. The clearer the boundary, the more authentic the autonomy inside it.", principle: "Bounded autonomy" },
  { icon: "◎", label: "Individual Agency", body: "Culture emerges from the aggregate of individual choices. Make every person's role in culture creation explicit — not just reflective. When people understand their daily actions constitute the culture, ownership becomes possible.", principle: "Distributed ownership" },
  { icon: "↑", label: "Amplifying Loops", body: "Identify what is already working in the direction you want and amplify it deliberately. Recognition, storytelling, and visibility accelerate positive emergence. Name and celebrate green shoots — they signal that the future is already here.", principle: "Positive deviance" },
  { icon: "⇌", label: "Polarities", body: "Not all tensions are problems to solve — some are polarities to manage. Safety vs. accountability. Autonomy vs. alignment. Top-down vs. bottom-up. Polarity management (Barry Johnson) teaches leaders to leverage both poles rather than choosing one, mapping the upsides and downsides of each and building action steps that oscillate intelligently between them.", principle: "Polarity management" },
  { icon: "⟳", label: "Sense & Respond", body: "In complex systems, planning is hypothesizing. Build structured cadences to continuously read signals from the system — what's shifting, what's resisting, what's emerging — and adjust your approach accordingly. This is not reactive; it is disciplined attentiveness. Probe the system, sense its response, then respond deliberately.", principle: "Adaptive execution" },
  { icon: "⚗", label: "Safe-to-Fail Experiments", body: "Run small, reversible experiments rather than large irreversible programs. Design for learning. Probe → Sense → Respond. What can you try in 30 days, in one team, that would tell you something real about whether this direction is working?", principle: "Cynefin-informed action" },
  { icon: "~", label: "The Messy Middle", body: "Every culture change has a dip. Resistance is not a sign of failure — it is data about what matters and what threatens. Leaders who aren't prepared for the emotional journey of change are most likely to abandon the work exactly when it needs them most.", principle: "Change as loss, not just gain" },
];

// ─── FLOW CONNECTOR ─────────────────────────────────────────────────────────
function FlowRow({ arrows, dashed }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "12px", padding: "2px 0", pointerEvents: "none" }}>
      {arrows.map((a, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: "6px", opacity: dashed ? 0.35 : 0.55 }}>
          {a.from && <span style={{ fontSize: "17px", letterSpacing: "0.1em", color: P.goldDim }}>{a.from}</span>}
          <svg width="32" height="14" viewBox="0 0 32 14">
            {dashed ? (
              <line x1="0" y1="7" x2="26" y2="7" stroke={P.gold} strokeWidth="1.2" strokeDasharray="4,3" markerEnd="url(#fa)" />
            ) : (
              <line x1="0" y1="7" x2="26" y2="7" stroke={P.gold} strokeWidth="1.5" markerEnd="url(#fa)" />
            )}
            <defs>
              <marker id="fa" markerWidth="6" markerHeight="6" refX="4" refY="3" orient="auto">
                <path d="M0,0 L0,6 L6,3z" fill={P.gold} />
              </marker>
            </defs>
          </svg>
          {a.to && <span style={{ fontSize: "17px", letterSpacing: "0.1em", color: P.goldDim }}>{a.to}</span>}
        </div>
      ))}
    </div>
  );
}

// ─── INTEGRATED VISUAL ──────────────────────────────────────────────────────
function IntegratedVisual() {
  const ww = useWindowWidth();
  const isMobile = ww < 760;
  const [hovN, setHovN] = useState(null);
  const [hovE, setHovE] = useState(null);
  const [selN, setSelN] = useState(null);
  const [selE, setSelE] = useState(null);

  const W = 960, H = 580;
  const ecopad = 24;
  const engpadX = 85;
  const spineY = 310;
  const bandH = 95;
  const bandTop = spineY - bandH;
  const bandBot = spineY + bandH;
  const ecoR = 12;
  const cx = W / 2;

  const NX = [235, 370, 505, 640, 775];

  const ELEMS = [
    { key: "dir", l1: "Direction,", l2: "not Destination", x: 170, y: 158, title: "Direction, not Destination", principle: "Emergence over engineering", body: "Set a direction, not an endpoint. Trust the system to find the path. Rigid destination-setting in complex systems produces compliance theater, not genuine change." },
    { key: "pol", l1: "Polarities", l2: "", x: 170, y: 462, title: "Polarities", principle: "Holding both poles", body: "Not all tensions in culture change are problems to solve — some are polarities to manage. Safety vs. accountability. Autonomy vs. alignment. Polarity management teaches leaders to leverage both poles, mapping the upsides and downsides of each rather than resolving the tension by force." },
    { key: "agn", l1: "Individual", l2: "Agency", x: 390, y: 462, title: "Individual Agency", principle: "Distributed ownership", body: "Culture emerges from the aggregate of individual choices. Make every person's role in culture creation explicit — when people see their daily actions as cultural acts, ownership becomes possible." },
    { key: "grd", l1: "Guardrails", l2: "", x: 390, y: 158, title: "Guardrails", principle: "Bounded autonomy", body: "Define non-negotiables before people start acting — the values and behaviors inviolable regardless of context. The clearer the boundary, the more authentic the autonomy inside it." },
    { key: "mid", l1: "Messy", l2: "Middle", x: 610, y: 462, title: "The Messy Middle", principle: "Change as loss, not gain", body: "Every culture change has a dip. Resistance is not a sign of failure — it is data about what matters. Leaders must be prepared for this before they start, or they will pull the plug exactly when the work needs them most." },
    { key: "sar", l1: "Sense &", l2: "Respond", x: 610, y: 158, title: "Sense & Respond", principle: "Adaptive action", body: "Read the signals the system sends back continuously. Run small, reversible experiments. Probe, sense, respond. Culture change is not a launch event — it is action accumulated over time, with each cycle informing the next." },
    { key: "s2f", l1: "Safe-to-Fail", l2: "Experiments", x: 830, y: 158, title: "Safe-to-Fail Experiments", principle: "Cynefin-informed action", body: "In complex systems you cannot analyse your way to the right answer before acting. Design safe-to-fail probes — small, reversible experiments with low cost of failure and high learning value. What can you try in 30 days, in one team, that would tell you something real?" },
    { key: "amp", l1: "Amplify &", l2: "Dampen", x: 830, y: 462, title: "Amplify & Dampen", principle: "Signal literacy", body: "Read the signals the system sends back. Amplify what is working — give it visibility, resource, and air time. Dampen what is not — stop feeding it without killing it. This is the adaptive heartbeat of culture work." },
  ];

  const clickNode = (i) => { setSelN(selN === i ? null : i); setSelE(null); };
  const clickElem = (key) => { setSelE(selE === key ? null : key); setSelN(null); };

  const selNode = selN !== null ? FIVE_AS[selN] : null;
  const selElem = selE !== null ? ELEMS.find((e) => e.key === selE) : null;
  const panel = selNode
    ? { title: selNode.label, body: selNode.body, color: P.gold, sub: selNode.short }
    : selElem
    ? { title: selElem.title, sub: selElem.principle, body: selElem.body, color: P.pre }
    : null;

  return (
    <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", gap: "20px", alignItems: "flex-start" }}>
      <div style={{ width: isMobile ? "100%" : "232px", flexShrink: 0, background: P.surface, border: `1px solid ${panel ? panel.color + "44" : P.border}`, borderRadius: "8px", padding: "20px 16px", minHeight: isMobile ? "auto" : "440px", transition: "border-color 0.25s", display: "flex", flexDirection: "column", order: isMobile ? 2 : 0 }}>
        {panel ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: "17px", fontWeight: 600, color: panel.color, fontFamily: "'DM Sans',sans-serif", lineHeight: 1.35, marginBottom: "5px" }}>{panel.title}</div>
                {panel.sub && <div style={{ fontSize: "17px", color: panel.color, opacity: 0.6, fontFamily: "'JetBrains Mono',monospace", letterSpacing: "0.07em" }}>{panel.sub}</div>}
              </div>
              <button onClick={() => { setSelN(null); setSelE(null); }} style={{ background: "transparent", border: "none", color: P.textDim, cursor: "pointer", fontSize: "17px", padding: "0 0 0 8px", lineHeight: 1, flexShrink: 0 }}>✕</button>
            </div>
            <div style={{ fontSize: "17px", color: P.slate, lineHeight: 1.75, fontFamily: "'DM Sans',sans-serif" }}>{panel.body}</div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
            <div style={{ fontSize: "20px", fontFamily: "'Cormorant Garamond',serif", fontStyle: "italic", color: P.text, marginBottom: "14px", lineHeight: 1.3 }}>Why both tracks?</div>
            <div style={{ fontSize: "17px", color: P.slate, lineHeight: 1.75, fontFamily: "'DM Sans',sans-serif", marginBottom: "12px" }}>Most approaches to culture change choose a side. This model holds both simultaneously.</div>
            <div style={{ fontSize: "17px", color: P.slate, lineHeight: 1.75, fontFamily: "'DM Sans',sans-serif", marginBottom: "12px" }}>The{" "}<span style={{ color: P.gold, fontWeight: 500 }}>Engineer</span>{" "}architects the journey — process, structure, discipline. The{" "}<span style={{ color: P.pre, fontWeight: 500 }}>Ecologist</span>{" "}reads the living system alongside it, tracking what is emerging, resisting, or ready to grow.</div>
            <div style={{ fontSize: "17px", color: P.slate, lineHeight: 1.75, fontFamily: "'DM Sans',sans-serif", marginBottom: "auto", fontStyle: "italic" }}>Where the Engineer asks what do we do next, the Ecologist asks what is the system telling us.</div>
            <div style={{ fontSize: "17px", color: P.textDim, fontFamily: "'JetBrains Mono',monospace", letterSpacing: "0.12em", marginTop: "20px", opacity: 0.45 }}>CLICK ANY ELEMENT TO EXPLORE</div>
          </div>
        )}
      </div>
      <div style={{ flex: 1, minWidth: 0, width: isMobile ? "100%" : "auto", order: isMobile ? 1 : 0 }}>
        <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: isMobile ? "100%" : W, display: "block" }}>
          <defs>
            <radialGradient id="iv-eco-edge" cx="50%" cy="50%" r="65%">
              <stop offset="30%" stopColor={P.pre} stopOpacity="0.0" />
              <stop offset="100%" stopColor={P.pre} stopOpacity="0.10" />
            </radialGradient>
            <radialGradient id="iv-eng-glow" cx="50%" cy="50%" r="55%">
              <stop offset="0%" stopColor={P.gold} stopOpacity="0.18" />
              <stop offset="65%" stopColor={P.gold} stopOpacity="0.08" />
              <stop offset="100%" stopColor={P.gold} stopOpacity="0.0" />
            </radialGradient>
          </defs>
          <rect width={W} height={H} fill={P.bg} />
          <rect x={ecopad} y={ecopad} width={W - ecopad * 2} height={H - ecopad * 2} fill={P.pre} fillOpacity="0.07" rx={ecoR} />
          <rect x={ecopad} y={ecopad} width={W - ecopad * 2} height={H - ecopad * 2} fill="url(#iv-eco-edge)" stroke={P.pre} strokeWidth="1.6" rx={ecoR} />
          <text x={cx} y={ecopad + 46} textAnchor="middle" fontSize="28" fontFamily="'Cormorant Garamond',serif" fontStyle="italic" fill={P.pre} opacity="0.88">The Ecologist</text>
          <text x={cx} y={ecopad + 66} textAnchor="middle" fontSize="17" letterSpacing="0.22em" fontFamily="'JetBrains Mono',monospace" fill={P.pre} opacity="0.5">COMPLEX</text>
          <rect x={engpadX} y={bandTop} width={W - engpadX * 2} height={bandH * 2} fill="url(#iv-eng-glow)" rx="10" />
          <text x={cx} y={bandTop + 38} textAnchor="middle" fontSize="28" fontFamily="'Cormorant Garamond',serif" fontStyle="italic" fill={P.gold} opacity="0.88">The Engineer</text>
          <text x={cx} y={bandTop + 58} textAnchor="middle" fontSize="17" letterSpacing="0.22em" fontFamily="'JetBrains Mono',monospace" fill={P.gold} opacity="0.52">COMPLICATED</text>
          {ELEMS.map((el) => {
            const nearX = NX.reduce((a, b) => Math.abs(b - el.x) < Math.abs(a - el.x) ? b : a);
            const connY = el.y < spineY ? bandTop : bandBot;
            const isHov = hovE === el.key;
            const isSel = selE === el.key;
            const hilite = isSel || isHov;
            const single = !el.l2;
            const bw = 110, bh = single ? 42 : 58;
            return (
              <g key={el.key}>
                <line x1={el.x} y1={el.y + (el.y < spineY ? bh / 2 : -bh / 2)} x2={nearX} y2={connY} stroke={P.pre} strokeWidth="0.8" strokeDasharray="3,4" opacity="0.22" />
                <g onMouseEnter={() => { setHovE(el.key); setHovN(null); }} onMouseLeave={() => setHovE(null)} onClick={() => clickElem(el.key)} style={{ cursor: "pointer" }}>
                  {isSel && <rect x={el.x - bw / 2 - 6} y={el.y - bh / 2 - 6} width={bw + 12} height={bh + 12} rx="12" fill={P.pre} opacity="0.09" />}
                  <rect x={el.x - bw / 2} y={el.y - bh / 2} width={bw} height={bh} rx="8" fill={hilite ? "#6b9e7a16" : P.surface} stroke={hilite ? P.pre : "#6b9e7a65"} strokeWidth={hilite ? "1.7" : "1"} />
                  <text x={el.x} y={el.y + (single ? 6 : -6)} textAnchor="middle" fontSize="17" fontFamily="'DM Sans',sans-serif" fill={hilite ? P.pre : P.text} fontWeight={hilite ? "600" : "400"}>{el.l1}</text>
                  {!single && <text x={el.x} y={el.y + 11} textAnchor="middle" fontSize="17" fontFamily="'DM Sans',sans-serif" fill={hilite ? P.pre : P.text} fontWeight={hilite ? "600" : "400"}>{el.l2}</text>}
                </g>
              </g>
            );
          })}
          {FIVE_AS.map((s, i) => {
            const x = NX[i];
            const isHov = hovN === i;
            const isSel = selN === i;
            const hilite = isSel || isHov;
            return (
              <g key={s.label} onMouseEnter={() => { setHovN(i); setHovE(null); }} onMouseLeave={() => setHovN(null)} onClick={() => clickNode(i)} style={{ cursor: "pointer" }}>
                {hilite && <circle cx={x} cy={spineY} r="50" fill={P.gold} opacity="0.07" />}
                <circle cx={x} cy={spineY} r={hilite ? 40 : 34} fill={hilite ? "#c9a84c0e" : P.surface} stroke={P.gold} strokeWidth={hilite ? "2.6" : "1.9"} opacity={hilite ? 1 : 0.92} />
                <text x={x} y={spineY + 7} textAnchor="middle" fontSize={hilite ? 16 : 14} fontFamily="'Cormorant Garamond',serif" fill={P.goldLight} fontWeight="600">{s.label}</text>
              </g>
            );
          })}
          <text x={W - ecopad - 10} y={H - ecopad - 9} textAnchor="end" fontSize="17" fontFamily="'DM Sans',sans-serif" fill={P.textDim} opacity="0.28">Click to explore</text>
        </svg>
      </div>
    </div>
  );
}

// ─── 5As VISUAL ─────────────────────────────────────────────────────────────
function FiveAsVisual({ expanded, setExpanded }) {
  return (
    <div>
      <div style={{ fontSize: "17px", color: P.textDim, marginBottom: "14px" }}>
        A structured, sequential framework for the aspects of culture change that can be designed, measured, and managed.{" "}
        <span style={{ color: P.goldDim, fontStyle: "italic" }}>Source: McKinsey & Company</span>{" "}
        <span style={{ fontSize: "17px", color: P.textDim, fontStyle: "italic" }}>[Unverified: exact nomenclature — verify before publishing]</span>
      </div>
      <div style={{ display: "flex", gap: "0", overflowX: "auto" }}>
        {FIVE_AS.map((s, i) => {
          const isExp = expanded === `5a-${i}`;
          return (
            <div key={s.label} onClick={() => setExpanded(isExp ? null : `5a-${i}`)} style={{ flex: 1, minWidth: "160px", background: isExp ? P.surfaceHover : P.bg, border: `1px solid ${isExp ? P.gold : P.border}`, borderRight: i < FIVE_AS.length - 1 ? "none" : `1px solid ${isExp ? P.gold : P.border}`, borderTop: `2px solid ${isExp ? P.gold : P.goldDim}`, padding: "20px 16px", position: "relative", cursor: "pointer", transition: "all 0.15s" }}>
              <div style={{ ...H.mono, fontSize: "17px", color: P.goldDim, marginBottom: "8px" }}>{s.num}</div>
              <div style={{ ...H.heading, fontSize: "21px", fontWeight: 600, color: P.goldLight, marginBottom: "8px" }}>{s.label}</div>
              <div style={{ fontSize: "17px", color: P.slate, lineHeight: 1.6 }}>{s.short}</div>
              {s.complexity.length > 0 && (
                <div style={{ marginTop: "10px", display: "flex", gap: "5px", flexWrap: "wrap" }}>
                  {s.complexity.map((tag) => (
                    <span key={tag} style={{ fontSize: "17px", letterSpacing: "0.08em", color: P.gold, border: `1px solid ${P.goldDim}`, borderRadius: "2px", padding: "1px 6px", opacity: 0.8 }}>⟳ {tag}</span>
                  ))}
                </div>
              )}
              {isExp && (
                <div style={{ marginTop: "12px", borderTop: `1px solid ${P.border}`, paddingTop: "10px" }}>
                  <div style={{ fontSize: "17px", color: P.slate, lineHeight: 1.65, marginBottom: "10px" }}>{s.body}</div>
                  {s.qs.map((q, qi) => (
                    <div key={qi} style={{ fontSize: "17px", color: P.textDim, fontStyle: "italic", lineHeight: 1.6, marginBottom: "4px" }}>→ {q}</div>
                  ))}
                </div>
              )}
              {i < FIVE_AS.length - 1 && (
                <div style={{ position: "absolute", right: "-10px", top: "50%", transform: "translateY(-50%)", color: P.goldDim, fontSize: "18px", zIndex: 1, background: P.bg, padding: "2px 0" }}>›</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── KOTTER VISUAL ───────────────────────────────────────────────────────────
function KotterVisual({ expanded, setExpanded }) {
  return (
    <div>
      <div style={{ fontSize: "17px", color: P.textDim, marginBottom: "14px" }}>
        An 8-step model emphasizing urgency, coalition-building, and embedding change into culture.{" "}
        <span style={{ color: P.goldDim, fontStyle: "italic" }}>Source: John P. Kotter, <em>Leading Change</em> (Harvard Business Review Press, 1996)</span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "10px" }}>
        {KOTTER.map((s, i) => {
          const isExp = expanded === `k-${i}`;
          const col = s.phase === 0 ? P.why : P.how;
          return (
            <div key={s.num} onClick={() => setExpanded(isExp ? null : `k-${i}`)} style={{ background: isExp ? P.surfaceHover : P.bg, border: `1px solid ${isExp ? col : P.border}`, borderTop: `2px solid ${col}`, borderRadius: "4px", padding: "16px 14px", cursor: "pointer", transition: "all 0.15s" }}>
              <div style={{ display: "flex", gap: "8px", alignItems: "flex-start", marginBottom: "8px" }}>
                <div style={{ ...H.mono, fontSize: "18px", fontWeight: 600, color: col, lineHeight: 1, minWidth: "22px" }}>{s.num}</div>
                <div style={{ ...H.heading, fontSize: "17px", fontWeight: 600, color: P.text, lineHeight: 1.3 }}>{s.label}</div>
              </div>
              {isExp && <div style={{ fontSize: "17px", color: P.slate, lineHeight: 1.6, borderTop: `1px solid ${P.border}`, paddingTop: "8px" }}>{s.body}</div>}
              <div style={{ fontSize: "17px", color: col, letterSpacing: "0.12em", marginTop: "8px", opacity: 0.7 }}>{s.phase === 0 ? "CREATE & BUILD" : "ENACT & SUSTAIN"}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── HOW PANEL ──────────────────────────────────────────────────────────────
function HowPanel({ onClose }) {
  const [howTab, setHowTab] = useState("integrated");
  const [compModel, setCompModel] = useState("5as");
  const [expanded, setExpanded] = useState(null);

  const Tab = ({ id, label }) => (
    <button onClick={() => setHowTab(id)} style={{ fontSize: "17px", letterSpacing: "0.13em", textTransform: "uppercase", padding: "6px 14px", borderRadius: "3px", cursor: "pointer", transition: "all 0.15s", background: howTab === id ? P.gold : "transparent", color: howTab === id ? P.bg : P.textDim, border: `1px solid ${howTab === id ? P.gold : P.border}` }}>{label}</button>
  );

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px" }}>
        <div>
          <div style={{ fontSize: "17px", letterSpacing: "0.22em", color: P.gold, textTransform: "uppercase", ...H.heading, marginBottom: "6px" }}>⬡ HOW · A Dual Path Forward</div>
          <p style={{ color: P.slate, fontSize: "17px", lineHeight: 1.7, maxWidth: "700px" }}>Culture change operates in two registers simultaneously. Some things can be engineered — the <strong style={{ color: P.text }}>complicated</strong>. Others can only be cultivated — the <strong style={{ color: P.text }}>complex</strong>. Both tracks are necessary; neither is sufficient alone.</p>
        </div>
        <button onClick={onClose} style={{ background: "transparent", border: `1px solid ${P.border}`, color: P.textDim, padding: "6px 16px", borderRadius: "4px", cursor: "pointer", fontSize: "17px", letterSpacing: "0.1em", whiteSpace: "nowrap", marginLeft: "24px" }}>✕ Close</button>
      </div>
      <div style={{ display: "flex", gap: "8px", marginBottom: "28px", alignItems: "center" }}>
        <span style={{ fontSize: "17px", color: P.textDim, letterSpacing: "0.1em", marginRight: "4px" }}>VIEW:</span>
        <Tab id="integrated" label="◈ Integrated" />
        <Tab id="complicated" label="⚙ Complicated" />
        <Tab id="complex" label="✦ Complex" />
      </div>

      {howTab === "complicated" && (
        <div>
          <p style={{ fontSize: "17px", color: P.slate, lineHeight: 1.7, maxWidth: "780px", marginBottom: "20px" }}>There are several outstanding frameworks for structuring culture change as a managed process. Two we return to most often:</p>
          <div style={{ display: "flex", gap: "10px", marginBottom: "24px" }}>
            {[{ id: "5as", label: "McKinsey 5As of Transformation" }, { id: "kotter", label: "Kotter's 8 Steps for Leading Change" }].map((m) => (
              <button key={m.id} onClick={() => { setCompModel(m.id); setExpanded(null); }} style={{ fontSize: "17px", letterSpacing: "0.1em", padding: "8px 18px", borderRadius: "4px", cursor: "pointer", transition: "all 0.15s", background: compModel === m.id ? P.goldFaint : "transparent", color: compModel === m.id ? P.goldLight : P.textDim, border: `1px solid ${compModel === m.id ? P.gold : P.border}` }}>{m.label}</button>
            ))}
          </div>
          {compModel === "5as" ? <FiveAsVisual expanded={expanded} setExpanded={setExpanded} /> : <KotterVisual expanded={expanded} setExpanded={setExpanded} />}
        </div>
      )}

      {howTab === "complex" && (
        <div>
          <div style={{ fontSize: "17px", color: P.textDim, marginBottom: "16px" }}>For what cannot be engineered — conditions to cultivate, not outcomes to deliver.</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(255px,1fr))", gap: "13px" }}>
            {COMPLEX.map((el) => (
              <div key={el.label} style={{ background: P.bg, border: `1px solid ${P.border}`, borderRadius: "6px", padding: "22px" }}>
                <span style={{ fontSize: "22px", color: P.gold, display: "block", marginBottom: "10px" }}>{el.icon}</span>
                <div style={{ ...H.heading, fontSize: "18px", fontWeight: 600, color: P.text, marginBottom: "8px" }}>{el.label}</div>
                <div style={{ fontSize: "17px", color: P.slate, lineHeight: 1.65, marginBottom: "12px" }}>{el.body}</div>
                <div style={{ fontSize: "17px", letterSpacing: "0.13em", textTransform: "uppercase", color: P.goldDim, borderTop: `1px solid ${P.border}`, paddingTop: "10px" }}>{el.principle}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {howTab === "integrated" && (
        <div>
          <div style={{ ...H.heading, fontSize: "17px", letterSpacing: "0.18em", color: P.gold, textTransform: "uppercase", marginBottom: "6px" }}>Integrated Culture Change Model</div>
          <div style={{ height: "1px", background: P.border, marginBottom: "16px" }} />
          <p style={{ fontSize: "17px", color: P.slate, lineHeight: 1.7, maxWidth: "780px", marginBottom: "20px" }}>The Engineer and the Ecologist travel the same journey — in different registers. The Engineer brings the 5As: a directed, structured path through culture change. The Ecologist reads the living system alongside it — tracking what's emerging, resisting, or ready to grow. Where the Engineer asks <em>"what do we do next?"</em>, the Ecologist asks <em>"what is the system telling us?"</em></p>
          <IntegratedVisual />
        </div>
      )}
    </div>
  );
}

// ─── WHY FRAMEWORKS ─────────────────────────────────────────────────────────
const WHY_MODELS = [
  { id: "kotter-burn", label: "Kotter's Burning Platform", source: "John P. Kotter, Leading Change (1996)", link: "https://www.kotterinc.com/methodology/8-steps/", icon: "🔥", summary: "People change when the perceived cost of staying the same exceeds the perceived cost of changing. Without urgency, every other change effort stalls.", steps: [{ num: "01", label: "Quantify the threat", body: "Make the cost of inaction visible and concrete. Attrition rates, innovation lag, customer loss, competitive erosion. Leaders who can answer 'what is this culture costing us?' in numbers rarely struggle to fund change." }, { num: "02", label: "Create emotional urgency", body: "Data informs. Stories move. Pair your numbers with a human narrative — a customer lost, a talented person who left, a market opportunity missed. The burning platform must be felt, not just understood." }, { num: "03", label: "Name the threat publicly", body: "Urgency that lives only in boardrooms doesn't reach the people who need to change. Leaders must be willing to say publicly what they know privately. Performed urgency is detected and dismissed." }, { num: "04", label: "Pair it with a compelling vision", body: "A burning platform alone creates panic, not movement. Urgency is the push; vision is the pull. The most durable change efforts have both: the cost of staying is too high, and the pull of what's possible is irresistible." }], caution: "Overusing the burning platform creates fear and learned helplessness. It works as ignition — not as a sustained operating mode. Move to vision as quickly as urgency allows." },
  { id: "mckinsey-influence", label: "McKinsey Influence Model", source: "McKinsey & Company — unverified exact nomenclature", link: "https://www.mckinsey.com/capabilities/people-and-organizational-performance/our-insights/the-four-building-blocks-of-change", icon: "◈", summary: "People change their behavior when four conditions are met simultaneously: they understand the why, see role models, have the skills, and work in systems that reinforce the new behavior.", steps: [{ num: "01", label: "Foster understanding & conviction", body: "People must understand why change is needed and genuinely believe it. This is where the case for change lives. Without conviction, compliance is temporary and fragile. Rational + emotional = durable." }, { num: "02", label: "Reinforce with formal mechanisms", body: "Systems, structures, processes, and incentives must align with the desired behavior. If performance reviews still reward the old culture, the new one cannot take hold. Formal systems always win against aspiration." }, { num: "03", label: "Develop talent & skills", body: "People need the capability to behave differently — not just the will. Identify the new skills required and build genuine development pathways. Expecting new behaviors without building new capabilities is magical thinking." }, { num: "04", label: "Role-model the change", body: "Leaders and informal influencers must visibly embody the new behaviors. People watch what leaders do far more than what they say. One inconsistency at the top undoes months of messaging at the bottom." }], caution: "The model works when all four levers are pulled together. Organizations chronically over-invest in communications (lever 1) and under-invest in systems redesign (lever 2) and capability building (lever 3)." },
  { id: "bridges", label: "William Bridges — Transition Model", source: "William Bridges, Managing Transitions (1991)", link: "https://wmbridges.com/about/what-is-transition/", icon: "⟿", summary: "Change is situational and external. Transition is psychological and internal. Most change efforts fail because they manage the change event but ignore the human transition it triggers.", steps: [{ num: "01", label: "The Ending", body: "Every transition begins with a loss — of identity, routine, relationships, status, or certainty. Before people can embrace what's new, they must be given permission to grieve what's ending. Leaders who skip this step create hidden resistance that surfaces later." }, { num: "02", label: "The Neutral Zone", body: "The disorienting in-between: the old is gone, the new isn't fully here. This is the most dangerous and most creative phase. Anxiety peaks. Productivity dips. But it's also where genuine reinvention happens. Don't rush through it." }, { num: "03", label: "The New Beginning", body: "Only after the ending has been acknowledged and the neutral zone navigated can people truly commit to the new. Beginnings cannot be mandated — they must be earned through the earlier stages. Mark them deliberately with symbols, rituals, and stories." }], caution: "The most commonly skipped insight: the case for change must address what people are leaving behind, not just where they're going. Acknowledge the genuine value of the old culture before asking people to abandon it." },
  { id: "polarity", label: "Polarity Management", source: "Barry Johnson, Polarity Management (1992)", link: "https://www.polaritypartnerships.com/", icon: "⇌", summary: "Not every tension in a case for change is a problem to solve. Some are polarities to manage — ongoing tensions where both sides have real value and neither can be permanently 'won'.", steps: [{ num: "01", label: "Identify the polarity", body: "Recognize when you're dealing with an AND/AND challenge, not an EITHER/OR problem. Stability AND innovation. Top-down direction AND bottom-up ownership. Accountability AND psychological safety. These cannot be resolved — only managed." }, { num: "02", label: "Map the upsides of both poles", body: "What are the genuine benefits of each side? Acknowledging the upsides of the current state (even the one you're moving away from) builds credibility and reduces defensiveness. People resist change less when their experience is validated." }, { num: "03", label: "Map the downsides of over-rotating", body: "What happens when you over-invest in one pole? The downside of 'too much stability' is rigidity. The downside of 'too much change' is chaos. Showing both downsides creates the case for holding the tension rather than resolving it." }, { num: "04", label: "Build action steps for both poles", body: "Design initiatives that leverage the positive of each pole and early warnings when you're over-rotating to either side. The goal is intelligent oscillation, not a permanent position." }], caution: "Polarity Management is most powerful when your organization has been stuck in a false either/or for a long time. It reframes the conversation from 'who's right' to 'how do we manage this tension well.'" },
];

// ─── WHO FRAMEWORKS ─────────────────────────────────────────────────────────
const WHO_MODELS = [
  { id: "adaptive", label: "Adaptive Leadership", source: "Ronald Heifetz & Marty Linsky, Leadership on the Line (2002)", link: "https://hbr.org/2001/12/the-work-of-leadership", icon: "⟳", summary: "Most leadership training prepares people to solve technical problems — where the answer is known and authority can deliver it. Culture change is never a technical problem. It is always adaptive: it requires people to change their values, beliefs, and behaviors. Leaders who apply technical solutions to adaptive challenges make things worse.", steps: [{ num: "01", label: "Distinguish technical from adaptive", body: "Technical problems have known solutions that can be implemented by authority. Adaptive challenges require learning and behavior change from the people with the problem. Culture change is always adaptive. The first act of adaptive leadership is resisting the urge to solve it like a technical one." }, { num: "02", label: "Get on the balcony", body: "Leaders must learn to move between the dance floor (action) and the balcony (observation). From the dance floor, you can't see the patterns. From the balcony, you can't feel them. Culture change requires both — the discipline to step back and read the system, not just drive it." }, { num: "03", label: "Regulate the heat", body: "Adaptive work requires productive disequilibrium — enough pressure to motivate change, not so much that the system shuts down. Leaders must learn to turn up the heat deliberately and turn it down when distress becomes unproductive. This is one of the most underestimated skills in culture change." }, { num: "04", label: "Give the work back", body: "The instinct of authority-oriented leaders is to absorb anxiety and provide answers. Adaptive leaders resist this. The work belongs to the people who need to change. Leaders who over-function on adaptive challenges create dependency, not transformation. The hardest move is holding the question rather than answering it." }], caution: "Adaptive Leadership is frequently misread as 'soft' or permissive. It is neither. It requires more of leaders, not less — the discipline to sit with uncertainty, regulate emotion, and resist the comfort of false solutions. Most leadership teams find this deeply uncomfortable at first." },
  { id: "shadow", label: "The Leadership Shadow", source: "Originally developed by KPMG; widely adopted across organizational development practice", link: "https://championsofchangecoalition.org/resource/the-leadership-shadow/", icon: "◐", summary: "Leaders cast a shadow — whether they intend to or not. Everything a leader does, says, prioritizes, and tolerates sends a signal about what is truly valued in this organization. The gap between a leader's stated values and their actual behavior is the most powerful culture signal in any organization.", steps: [{ num: "01", label: "What you do", body: "Behaviors speak louder than communications. Where do you spend your time? What decisions do you make personally versus delegate? What do you consistently follow through on — and what do you let slide? People watch actions far more than they listen to words." }, { num: "02", label: "What you say", body: "The language leaders use — in formal settings and informal ones — shapes what becomes thinkable, sayable, and doable for the organization. What do you talk about? What do you avoid? What stories do you tell? What questions do you ask?" }, { num: "03", label: "What you prioritize", body: "What gets your attention, your budget, and your calendar? What gets cut when things are tight? These choices reveal the real hierarchy of values — and every person in the organization reads them accurately, even if they never say so aloud." }, { num: "04", label: "What you tolerate", body: "Perhaps the most powerful signal of all. When a leader witnesses a behavior that contradicts the stated culture and says nothing, they have just endorsed it. Tolerance is permission. What leaders fail to address defines the real floor of acceptable behavior far more than any values statement." }], caution: "The Leadership Shadow framework can feel exposing for senior leaders, which creates defensive reactions. The most effective approach is for leaders to self-assess first — before asking for external feedback. Naming your own shadow publicly is one of the most powerful culture signals a leader can send." },
  { id: "conscious", label: "Conscious Leadership", source: "Jim Dethmer, Diana Chapman & Kaley Klemp, The 15 Commitments of Conscious Leadership (2014)", link: "https://conscious.is/15-commitments", icon: "◎", summary: "Leaders operate either above the line — from curiosity, openness, and genuine responsibility — or below the line — from fear, defensiveness, and the need to be right. Culture change led from below the line is self-defeating. The leader's interior state is not a private matter. It is organizational data.", steps: [{ num: "01", label: "Above and below the line", body: "Above the line: open, curious, committed to learning. The leader experiences challenges as information and responds from genuine choice. Below the line: closed, defensive, committed to being right. The leader experiences challenges as threats and responds from self-protection. Most leaders oscillate. The work is to notice the difference and choose consciously." }, { num: "02", label: "Radical responsibility", body: "Below-the-line leaders locate causality outside themselves — in the market, the team, the history, the Board. Above-the-line leaders ask: what is my role in creating this? Not self-blame — genuine inquiry. A leader who takes radical responsibility for the current culture is far more credible than one who inherited it from someone else." }, { num: "03", label: "Candor and appreciation", body: "Conscious leaders say what is true without blame or judgment — and receive feedback the same way. In cultures where truth-telling is dangerous, leaders have almost always modeled the opposite: measured truth, softened feedback, and the performance of appreciation. Candor is caught, not taught." }, { num: "04", label: "Being a leader worth following", body: "The ultimate question: do people follow this leader because they have to, or because they genuinely want to? Leaders who operate above the line over time create cultures of genuine followership. Leaders who operate below the line create cultures of compliance, performance, and quiet departure." }], caution: "Conscious Leadership is powerful and often transformative — and it requires genuine personal development, not just conceptual understanding. Leaders who adopt the language without doing the interior work become sophisticated performers of openness. This is worse than straightforward command-and-control because it is harder to name." },
  { id: "immunity-who", label: "Immunity to Change", source: "Robert Kegan & Lisa Laskow Lahey, Immunity to Change (2009)", link: "https://www.mindtools.com/a4l75hx/immunity-to-change/", icon: "🛡", summary: "If leaders have personal immunity to the changes they are asking others to make, every culture change effort will eventually fail — not from lack of intent, but from the invisible architecture of competing commitments that make genuine change feel threatening even to those driving it.", steps: [{ num: "01", label: "Name the leadership commitment", body: "What behavior change is the leader genuinely committed to modeling? Specificity matters here too. 'Be more vulnerable' is not enough. 'Name uncertainty aloud in senior team meetings rather than projecting confidence I don't have' is." }, { num: "02", label: "What am I doing instead?", body: "What leadership behaviors currently work against the stated commitment? This is where the immunity becomes visible. The leader who says they want psychological safety but consistently interrupts, dismisses, or subtly punishes disagreement has an immunity to the very culture they say they want." }, { num: "03", label: "The competing commitment", body: "What is the leader genuinely committed to that makes the change feel threatening? Typical ones: committed to not losing authority, committed to not being seen as weak, committed to being the most competent person in the room. These commitments are legitimate. They are not failures of character. They are the predictable result of how most leaders were developed." }, { num: "04", label: "The big assumption", body: "What belief makes the competing commitment feel necessary? 'If I show uncertainty, people will lose confidence in me.' 'If I give away authority, it won't come back.' Test these assumptions deliberately. They are almost never as true as they feel." }], caution: "Leadership team immunity mapping is the highest-leverage intervention in most culture change efforts — and the most frequently skipped. It requires a level of psychological safety within the leadership team that usually needs to be built first. Don't attempt it in a team where the senior leader has not already demonstrated genuine openness to feedback." },
  { id: "dysfunctions", label: "The Five Dysfunctions", source: "Patrick Lencioni, The Five Dysfunctions of a Team (2002)", link: "https://www.tablegroup.com/topics-and-resources/teamwork-5-dysfunctions/", icon: "△", summary: "The leadership team is the culture petri dish. Whatever dysfunctions exist at the top cascade through the organization with mathematical certainty. The five dysfunctions are a hierarchy — each one makes the one above it inevitable.", steps: [{ num: "01", label: "Absence of trust", body: "The foundation. Without trust — genuine vulnerability-based trust, not predictability — no team can afford honest conversation. Leaders who haven't built this with each other will not build it in the organization. Trust here means the willingness to be wrong, to not know, and to ask for help in front of peers." }, { num: "02", label: "Fear of conflict", body: "Without trust, teams cannot have productive ideological conflict. Instead they have artificial harmony — polite agreement in the room, real disagreement in the corridor. A leadership team that models conflict avoidance produces an organization that mistakes politeness for alignment." }, { num: "03", label: "Lack of commitment", body: "Without genuine conflict, teams cannot reach genuine commitment. People who haven't had their views heard and honestly considered will not truly commit to decisions. They will comply. Compliance looks like commitment and behaves completely differently under pressure." }, { num: "04", label: "Avoidance of accountability", body: "Without commitment, people will not hold each other accountable. Peer accountability — the willingness to name when a colleague is not meeting standards — is impossible in a team that hasn't committed together. Leaders who can't hold each other accountable produce organizations where accountability flows only downward through hierarchy — and stalls at every level." }, { num: "05", label: "Inattention to results", body: "When accountability fails, individual status and team survival replace collective results as the primary motivation. The leadership team stops optimizing for the organization and starts optimizing for itself. This is visible to everyone — and it licenses every other team in the organization to do the same." }], caution: "The Five Dysfunctions model is frequently used as a leadership team diagnostic and rarely acted on seriously, because the interventions it implies — genuine vulnerability, named conflict, real accountability between peers — require more personal risk than most senior teams are prepared to take without significant support. Identifying the dysfunctions is the easy part." },
  { id: "posdev-who", label: "Positive Deviance", source: "Jerry Sternin & Richard Pascale — developed through field work in Vietnam (1990s); Pascale, Sternin & Sternin, The Power of Positive Deviance (2010)", link: "https://positivedeviance.org/", icon: "✦", summary: "In every organization, there are individuals and teams already living the future culture — achieving better outcomes using the same resources and constraints as everyone else. The leader's job is not to author the solution but to find these positive deviants, understand what they are doing differently, and create conditions for it to spread.", steps: [{ num: "01", label: "Reframe the leader's role", body: "Traditional culture change casts the leader as architect: designer of the future state, author of the values, driver of the initiative. Positive Deviance casts the leader as investigator and amplifier. The wisdom is already in the system. The leader's job is to find it — not impose it." }, { num: "02", label: "Identify the positive deviants", body: "Who in the organization is already modeling the culture you want? Not the loudest advocates or the most senior allies — the people whose everyday behaviors already embody the target. They exist in every organization. They are often overlooked because they don't fit the conventional template of cultural heroes." }, { num: "03", label: "Understand the practice, not the person", body: "What are positive deviants doing specifically that others are not? The insight must be behavioral and transferable — not a function of unique personality or circumstance. The question is: what practices can others adopt, given the same constraints?" }, { num: "04", label: "Create conditions for spread", body: "Positive Deviance spreads through doing, not telling. Leaders don't broadcast the findings — they create opportunities for others to observe, try, and adapt the practices themselves. Peer-to-peer spread is exponentially more powerful than top-down communication." }], caution: "Positive Deviance is most powerful when it genuinely transfers agency to the system rather than becoming a sophisticated form of top-down direction ('we've identified the behaviors, now spread them'). Leaders with a strong need to author the solution often unconsciously convert Positive Deviance into a conventional change programme. The discipline is in genuinely not knowing the answer in advance." },
];

// ─── WHAT FRAMEWORKS ────────────────────────────────────────────────────────
const WHAT_MODELS = [
  { id: "schein", label: "Schein's Cultural Layers", source: "Edgar Schein, Organizational Culture and Leadership (1985)", link: "https://sloanreview.mit.edu/article/coming-to-a-new-awareness-of-organizational-culture/", icon: "◎", summary: "Culture operates at three levels of depth. Most organizations only see and manage the surface layer — and wonder why change doesn't stick. Real culture change requires working at the level of basic assumptions.", steps: [{ num: "01", label: "Artifacts", body: "The visible, tangible elements: office design, dress code, meeting behaviors, how people talk to each other, org charts. Easy to observe, hard to interpret correctly. Don't mistake the surface for the substance." }, { num: "02", label: "Espoused Values", body: "The stated beliefs, norms, and values the organization officially holds. What's on the wall. What leaders say in town halls. Often sincere — but frequently at odds with actual behavior. The gap between espoused and enacted values is where trust erodes." }, { num: "03", label: "Basic Assumptions", body: "The unconscious, taken-for-granted beliefs that drive behavior without anyone naming them. 'We don't really trust people to work without oversight.' 'Conflict is dangerous.' 'Only heroics get rewarded.' These feel like reality, not choices. This is where your real culture lives — and where change must ultimately reach." }], caution: "Most culture diagnostics stop at espoused values. Surfacing basic assumptions requires significant psychological safety and skilled facilitation. The assumptions that most need changing are often the ones most defended." },
  { id: "fromto", label: "From → To Mapping", source: "Common practice across organizational development — no single originator", link: null, icon: "→", summary: "The simplest and most actionable tool for defining the North Star. Map the current state alongside the target state in behavioral, observable terms — not aspirational language. Makes the gap tangible and discussable.", steps: [{ num: "01", label: "Define the dimensions", body: "Choose four to six cultural dimensions that matter most for your strategy. Not values — behaviors. 'Collaboration,' 'Innovation,' and 'Accountability' are starting points, not endpoints. Get specific enough that people recognize themselves." }, { num: "02", label: "Describe the 'From'", body: "What does the current state look, sound, and feel like? What would a first-time visitor observe? Use real language — the things people say in hallways, not in town halls. Vagueness here produces vagueness in the change effort." }, { num: "03", label: "Describe the 'To'", body: "What does the target state look, sound, and feel like on a Tuesday? Not 'more innovative' — but 'we run five safe-to-fail experiments per quarter and review learnings publicly.' Behavioral specificity is the difference between a vision and a plan." }, { num: "04", label: "Name what doesn't change", body: "What from the current culture is genuinely valuable and should be preserved? Naming this builds credibility and reduces defensiveness. The best From→To maps honor what was while being honest about what must shift." }], caution: "From→To Mapping is most powerful when co-created with diverse voices rather than drafted by a leadership team alone. Top-down cultural definitions are often accurate about the 'From' and aspirational about the 'To' — without the accountability to close the gap." },
  { id: "forcefield", label: "Force Field Analysis", source: "Kurt Lewin, Field Theory in Social Science (1951)", link: "https://www.mindtools.com/az3ln6f/force-field-analysis", icon: "⇌", summary: "Every change effort exists in a field of forces — some driving it forward, some restraining it. Understanding and mapping both sides is more powerful than simply pushing harder on the driving forces.", steps: [{ num: "01", label: "Define the change goal", body: "State the desired state clearly and specifically. The more precise the goal, the more useful the force field. 'Improve culture' produces a useless map. 'Shift from avoiding conflict to naming disagreement early' produces an actionable one." }, { num: "02", label: "Map the driving forces", body: "What is already working in the direction of change? Current frustrations with the status quo, supportive leaders, competitive pressure, recent failures that created openness, energy in pockets of the organization. These are your amplifiers." }, { num: "03", label: "Map the restraining forces", body: "What is working against the change? Fear of loss, misaligned incentives, entrenched leaders, lack of skills, cultural norms that punish the new behaviors, competing priorities, cynicism from previous failed efforts. Be honest and specific." }, { num: "04", label: "Identify the highest-leverage moves", body: "Lewin's insight: reducing restraining forces is often more powerful than adding driving forces. Adding pressure to a rigid system produces more resistance. Removing a key restraint can unlock movement that no amount of pushing could achieve." }], caution: "Force Field Analysis is a diagnostic, not a plan. Its value is in the conversation it creates — especially when the map is built by a diverse group, not a leadership team alone. The restraining forces that get named in that room are the ones that can actually be addressed." },
  { id: "cultureweb", label: "The Culture Web", source: "Gerry Johnson & Kevan Scholes, Exploring Corporate Strategy (1992)", link: "https://www.strategytoolsunited.com/cultural-web", icon: "⬡", summary: "Culture is held in place by six interconnected elements. Change any one in isolation and the others pull it back. The Culture Web makes this system visible — and shows where to intervene.", steps: [{ num: "01", label: "Stories", body: "The narratives people tell about the organization — past heroes, failures, crises survived. Stories carry the deep assumptions about what is valued and what gets rewarded. Which stories are repeated? Which are never told?" }, { num: "02", label: "Rituals & Routines", body: "The everyday behaviors and actions that signal what is normal and expected: how meetings run, how performance is discussed, how people are onboarded, how conflict is (or isn't) handled. Often more revealing than stated values." }, { num: "03", label: "Symbols", body: "The visible signals of status and power: office size, title use, who sits where, what gets celebrated visibly. Symbols communicate culture silently and constantly. They are almost always inconsistent with the culture you say you want." }, { num: "04", label: "Power Structures", body: "Who actually has power to shape decisions and behavior — formally and informally? Power and org chart rarely align. Understanding where real power lives is essential for knowing who must be enrolled first." }, { num: "05", label: "Org Structures", body: "How the organization is arranged — formally and informally. Structures shape behavior by determining who talks to whom, who has visibility, who gets credit. Structure is culture made physical." }, { num: "06", label: "Control Systems", body: "What gets measured, monitored, and rewarded? Performance metrics, budget controls, quality systems. These are the most powerful and most neglected lever in culture change. What is measured is what is managed — regardless of what is said." }], caution: "The Culture Web's power is in mapping both the current state and the desired state across all six elements — then identifying the gaps. Organizations that only map the current state use it as a diagnostic without a direction. Organizations that only map the desired state skip the honest reckoning with what holds the current culture in place." },
  { id: "immunity-what", label: "Immunity to Change", source: "Robert Kegan & Lisa Laskow Lahey, Immunity to Change (2009)", link: "https://www.mindtools.com/a4l75hx/immunity-to-change/", icon: "🛡", summary: "The most important question about any North Star is not 'what do we want?' but 'what is invisibly preventing us from getting there?' Immunity to Change maps the hidden competing commitments that make the gap between current and desired culture so persistent.", steps: [{ num: "01", label: "Name the improvement goal", body: "What specific behavior does the organization want to change? 'Be more collaborative' is not enough. 'Name disagreement openly in cross-functional meetings rather than escalating through hierarchy' is. Specificity is what makes the immunity map useful." }, { num: "02", label: "Surface what we're doing instead", body: "What behaviors currently work against the goal? This is not about blame — it is diagnostic. The gap between the stated aspiration and current behavior is the data. Name it honestly and without judgment." }, { num: "03", label: "Uncover the competing commitments", body: "What worry or fear drives the current behavior? People aren't failing to change because they don't care — they have a genuine, often legitimate commitment that makes change feel threatening. 'We're committed to not looking incompetent.' 'We're committed to not losing control.'" }, { num: "04", label: "Surface the big assumptions", body: "What assumption makes the competing commitment feel necessary and real? These assumptions feel like facts. They are hypotheses — often formed in a different context — that have never been consciously tested. Surfacing them is the beginning of change." }, { num: "05", label: "Design safe experiments", body: "Run small, low-risk experiments that test whether the big assumption is actually true. Not willpower. Not training. Experiments. 'What would happen if I named a disagreement once in this meeting?' The goal is to update the assumption through experience, not override it through effort." }], caution: "Immunity to Change requires genuine psychological safety to work. Surface-level application produces defensive responses, not honest maps. It is most powerful as a leadership team exercise before rolling out any culture change effort — because if the leadership team has immunity to the change they're asking others to make, everything else will fail." },
];

// ─── GENERIC FRAMEWORK PANEL (reused by WHO, WHAT, WHY) ─────────────────────
function FrameworkPanel({ node, models, onClose, accentColor, accentBg, sectionTitle, sectionDesc }) {
  const [model, setModel] = useState(null);
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px" }}>
        <div>
          <div style={{ fontSize: "17px", letterSpacing: "0.22em", color: node.color, textTransform: "uppercase", ...H.heading, marginBottom: "6px" }}>{node.icon} {node.label} · {node.subtitle}</div>
          <p style={{ color: P.slate, fontSize: "18px", lineHeight: 1.85, maxWidth: "780px", borderLeft: `2px solid ${node.color}`, paddingLeft: "20px" }}>{node.detail.opening}</p>
        </div>
        <button onClick={onClose} style={{ background: "transparent", border: `1px solid ${P.border}`, color: P.textDim, padding: "6px 16px", borderRadius: "4px", cursor: "pointer", fontSize: "17px", letterSpacing: "0.1em", whiteSpace: "nowrap", marginLeft: "24px" }}>✕ Close</button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(270px,1fr))", gap: "14px", marginBottom: "36px" }}>
        {node.detail.elements.map((el) => (
          <div key={el.title} style={{ background: P.bg, border: `1px solid ${P.border}`, borderRadius: "6px", padding: "22px", borderTop: `2px solid ${node.color}` }}>
            <div style={{ ...H.heading, fontSize: "18px", fontWeight: 600, color: P.text, marginBottom: "10px" }}>{el.title}</div>
            <div style={{ fontSize: "17px", color: P.slate, lineHeight: 1.7 }}>{el.body}</div>
          </div>
        ))}
      </div>
      <div style={{ borderTop: `1px solid ${P.border}`, paddingTop: "28px" }}>
        <div style={{ ...H.heading, fontSize: "17px", letterSpacing: "0.2em", color: node.color, textTransform: "uppercase", marginBottom: "12px", paddingBottom: "10px", borderBottom: `1px solid ${P.border}` }}>{sectionTitle}</div>
        <p style={{ fontSize: "17px", color: P.slate, lineHeight: 1.7, maxWidth: "780px", marginBottom: "20px" }}>{sectionDesc}</p>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "24px" }}>
          {models.map((m) => (
            <button key={m.id} onClick={() => setModel(model === m.id ? null : m.id)} style={{ fontSize: "17px", letterSpacing: "0.08em", padding: "8px 16px", borderRadius: "4px", cursor: "pointer", transition: "all 0.15s", fontFamily: "'DM Sans',sans-serif", background: model === m.id ? accentBg : "transparent", color: model === m.id ? accentColor : P.textDim, border: `1px solid ${model === m.id ? node.color : P.border}` }}>{m.icon} {m.label}</button>
          ))}
        </div>
        {model && (() => {
          const m = models.find((x) => x.id === model);
          return (
            <div style={{ animation: "slideDown 0.18s ease" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px", flexWrap: "wrap", gap: "12px" }}>
                <div>
                  <div style={{ ...H.heading, fontSize: "20px", fontWeight: 600, color: P.text, marginBottom: "4px" }}>{m.icon} {m.label}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
                    <div style={{ fontSize: "17px", color: P.textDim, fontStyle: "italic" }}>{m.source}</div>
                    {m.link && <a href={m.link} target="_blank" rel="noopener noreferrer" style={{ fontSize: "17px", color: node.color, letterSpacing: "0.08em", textDecoration: "none", border: `1px solid ${node.colorDim}`, borderRadius: "3px", padding: "2px 8px", display: "inline-flex", alignItems: "center", gap: "4px" }}>↗ View resource</a>}
                  </div>
                </div>
              </div>
              <p style={{ fontSize: "17px", color: P.slate, lineHeight: 1.8, maxWidth: "780px", borderLeft: `2px solid ${node.color}`, paddingLeft: "18px", marginBottom: "24px" }}>{m.summary}</p>
              <div style={{ display: "flex", gap: "0", overflowX: "auto", marginBottom: "20px" }}>
                {m.steps.map((s, i) => (
                  <div key={s.num} style={{ flex: 1, minWidth: "190px", background: P.bg, border: `1px solid ${P.border}`, borderRight: i < m.steps.length - 1 ? "none" : `1px solid ${P.border}`, borderTop: `2px solid ${node.color}`, padding: "20px 16px", position: "relative" }}>
                    <div style={{ ...H.mono, fontSize: "17px", color: node.colorDim, marginBottom: "8px" }}>{s.num}</div>
                    <div style={{ ...H.heading, fontSize: "17px", fontWeight: 600, color: accentColor, marginBottom: "10px", lineHeight: 1.2 }}>{s.label}</div>
                    <div style={{ fontSize: "17px", color: P.slate, lineHeight: 1.7 }}>{s.body}</div>
                    {i < m.steps.length - 1 && <div style={{ position: "absolute", right: "-10px", top: "50%", transform: "translateY(-50%)", color: node.colorDim, fontSize: "18px", zIndex: 1, background: P.bg, padding: "2px 0" }}>›</div>}
                  </div>
                ))}
              </div>
              <div style={{ background: P.bg, border: `1px solid ${P.border}`, borderLeft: `3px solid ${node.colorDim}`, borderRadius: "4px", padding: "14px 18px" }}>
                <div style={{ fontSize: "17px", letterSpacing: "0.15em", textTransform: "uppercase", color: node.colorDim, marginBottom: "6px", ...H.mono }}>⚠ Watch out for</div>
                <div style={{ fontSize: "17px", color: P.slate, lineHeight: 1.65 }}>{m.caution}</div>
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
}

function WhoPanel({ node, onClose }) {
  return <FrameworkPanel node={node} models={WHO_MODELS} onClose={onClose} accentColor="#7acca0" accentBg="#4caa7a22" sectionTitle="◉ Frameworks for the Paradox of Leadership" sectionDesc="The paradox of leadership in culture change — simultaneously setting direction and creating space for emergence — is one of the most demanding challenges in organizational life. These frameworks illuminate different dimensions of it:" />;
}
function WhatPanel({ node, onClose }) {
  return <FrameworkPanel node={node} models={WHAT_MODELS} onClose={onClose} accentColor="#7aaae8" accentBg="#4c7ac922" sectionTitle="◇ Frameworks for Defining the North Star" sectionDesc="Understanding where you are coming from, where you are going, and what gets in the way requires multiple lenses. Select a framework to explore:" />;
}
function WhyPanel({ node, onClose }) {
  return <FrameworkPanel node={node} models={WHY_MODELS} onClose={onClose} accentColor="#e87a7a" accentBg="#c94c4c22" sectionTitle="◈ Frameworks for Building a Case for Change" sectionDesc="There is no single right framework for creating the imperative for change. The best cases for change draw on multiple lenses. Select a framework to explore how it applies:" />;
}

// ─── DETAIL PANEL ────────────────────────────────────────────────────────────
function DetailPanel({ node, onClose }) {
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "28px" }}>
        <div>
          <div style={{ fontSize: "17px", letterSpacing: "0.22em", color: node.color, textTransform: "uppercase", ...H.heading, marginBottom: "6px" }}>{node.icon} {node.label} · {node.subtitle}</div>
          <p style={{ color: P.slate, fontSize: "18px", lineHeight: 1.85, maxWidth: "780px", borderLeft: `2px solid ${node.color}`, paddingLeft: "20px" }}>{node.detail.opening}</p>
        </div>
        <button onClick={onClose} style={{ background: "transparent", border: `1px solid ${P.border}`, color: P.textDim, padding: "6px 16px", borderRadius: "4px", cursor: "pointer", fontSize: "17px", letterSpacing: "0.1em", whiteSpace: "nowrap", marginLeft: "24px" }}>✕ Close</button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(270px,1fr))", gap: "14px" }}>
        {node.detail.elements.map((el) => (
          <div key={el.title} style={{ background: P.bg, border: `1px solid ${P.border}`, borderRadius: "6px", padding: "22px", borderTop: `2px solid ${node.color}` }}>
            <div style={{ ...H.heading, fontSize: "18px", fontWeight: 600, color: P.text, marginBottom: "10px" }}>{el.title}</div>
            <div style={{ fontSize: "17px", color: P.slate, lineHeight: 1.7 }}>{el.body}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── COVER PAGE ──────────────────────────────────────────────────────────────
function CoverPage({ isMobile, onNav }) {
  const sections = [
    { id: "model", icon: "⚙️🌿", color: P.gold, label: "The Model", headline: "A framework with teeth", body: "Five dimensions, two tracks, and a pile of frameworks we've tested in real organisations under real pressure. Explore at your own pace — there's a lot here." },
    { id: "help", icon: "🔥", color: P.why, label: "How We Help", headline: "Where to start when it feels overwhelming", body: "Some pain points are better catapults than others. We've learned which questions tend to unlock things — and what a first step actually looks like." },
    { id: "cases", icon: "🌱", color: P.pre, label: "Case Studies", headline: "Where we've done it before", body: "A few stories from the field. Not polished case studies — honest accounts of what happened, what we learned, and what the organisations found on the other side." },
  ];

  return (
    <div style={{ background: P.bg, color: P.text, ...H.body, minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      {/* ── HERO ── */}
      <div style={{ flex: "1", background: P.surface, borderBottom: `1px solid ${P.border}`, position: "relative", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", padding: isMobile ? "56px 28px 52px" : "80px 60px 72px" }}>
        <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: "600px", height: "600px", borderRadius: "50%", pointerEvents: "none", background: `radial-gradient(ellipse at center, ${P.gold}08 0%, transparent 70%)` }} />
        <div style={{ position: "relative", textAlign: "center", maxWidth: "720px" }}>
          <div style={{ fontSize: "17px", letterSpacing: "0.2em", color: P.gold, textTransform: "uppercase", ...H.mono, marginBottom: "32px", opacity: 0.9 }}>Cultivating Leadership · A thinking tool</div>
          <h1 style={{ ...H.heading, fontWeight: 600, lineHeight: 1.05, marginBottom: "28px", fontSize: isMobile ? "clamp(36px,11vw,56px)" : "clamp(48px,7vw,88px)" }}>The Engineer<br /><span style={{ color: P.gold, fontStyle: "italic" }}>&amp; the Ecologist</span></h1>
          <div style={{ width: "48px", height: "1px", background: P.gold, opacity: 0.4, margin: "0 auto 28px" }} />
          <p style={{ fontSize: isMobile ? "17px" : "19px", color: P.slate, lineHeight: 1.85, maxWidth: "560px", margin: "0 auto 16px" }}>Most culture change fails because it tries to be one without the other — all process, no ecology. Or all emergence, no discipline.</p>
          <p style={{ fontSize: isMobile ? "17px" : "19px", color: P.slate, lineHeight: 1.85, maxWidth: "540px", margin: "0 auto 44px" }}>We believe organisations are living systems, and the people inside them are capable of far more than most change efforts allow for. This is our attempt to be useful.</p>
          <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
            <button onClick={() => onNav("model")} style={{ background: P.gold, color: P.bg, border: "none", cursor: "pointer", padding: "13px 28px", fontSize: "17px", letterSpacing: "0.15em", textTransform: "uppercase", ...H.body, fontWeight: 600, borderRadius: "3px", transition: "opacity 0.15s ease" }} onMouseEnter={(e) => (e.target.style.opacity = "0.85")} onMouseLeave={(e) => (e.target.style.opacity = "1")}>Explore the model</button>
            <button onClick={() => onNav("help")} style={{ background: "transparent", color: P.gold, cursor: "pointer", border: `1px solid ${P.goldDim}`, padding: "13px 28px", fontSize: "17px", letterSpacing: "0.15em", textTransform: "uppercase", ...H.body, fontWeight: 500, borderRadius: "3px", transition: "border-color 0.15s ease" }} onMouseEnter={(e) => (e.target.style.borderColor = P.gold)} onMouseLeave={(e) => (e.target.style.borderColor = P.goldDim)}>Where to start</button>
          </div>
        </div>
      </div>

      {/* ── THREE CARDS ── */}
      <div style={{ padding: isMobile ? "28px 20px 48px" : "48px 56px 72px" }}>
        <div style={{ fontSize: "17px", letterSpacing: "0.15em", color: P.slate, textTransform: "uppercase", ...H.mono, marginBottom: "24px", textAlign: "center" }}>What's inside</div>
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3,1fr)", gap: isMobile ? "14px" : "20px", maxWidth: "1000px", margin: "0 auto" }}>
          {sections.map((s) => (
            <div key={s.id} onClick={() => onNav(s.id)} style={{ background: P.surface, border: `1px solid ${P.border}`, borderTop: `2px solid ${s.color}`, borderRadius: "6px", padding: isMobile ? "22px" : "28px 28px 24px", cursor: "pointer", transition: "border-color 0.18s ease, background 0.18s ease" }} onMouseEnter={(e) => { e.currentTarget.style.borderColor = s.color; e.currentTarget.style.background = P.surfaceHover; }} onMouseLeave={(e) => { e.currentTarget.style.borderColor = P.border; e.currentTarget.style.background = P.surface; e.currentTarget.style.borderTopColor = s.color; }}>
              <div style={{ fontSize: "22px", marginBottom: "14px", lineHeight: 1 }}>{s.icon}</div>
              <div style={{ fontSize: "17px", letterSpacing: "0.15em", textTransform: "uppercase", color: s.color, marginBottom: "8px", ...H.mono }}>{s.label}</div>
              <div style={{ ...H.heading, fontSize: "20px", fontWeight: 600, color: P.text, lineHeight: 1.2, marginBottom: "12px" }}>{s.headline}</div>
              <div style={{ fontSize: "17px", color: P.slate, lineHeight: 1.7 }}>{s.body}</div>
              <div style={{ marginTop: "20px", fontSize: "17px", letterSpacing: "0.12em", color: s.color, textTransform: "uppercase", ...H.mono }}>Open →</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── FOOTER WHISPER ── */}
      <div style={{ padding: isMobile ? "16px 20px" : "16px 56px", borderTop: `1px solid ${P.border}`, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
        <span style={{ fontSize: "17px", color: P.slate, letterSpacing: "0.08em" }}>Take what helps.</span>
        <a href="https://www.cultivatingleadership.com" target="_blank" rel="noopener noreferrer" style={{ fontSize: "17px", color: P.slate, letterSpacing: "0.08em", ...H.mono, textDecoration: "none", borderBottom: `1px solid ${P.border}` }}>cultivatingleadership.com</a>
      </div>
    </div>
  );
}

// ─── PLACEHOLDER PAGES (How We Help, Cases, Tools) ──────────────────────────
// These are large but structurally unchanged from v7. Due to file size, they are
// included in full below exactly as in the original, with zero modifications.
// The only changes in this file are:
//   1. WHAT node detail.elements (rewritten — 4 cards)
//   2. CoverPage "What's inside" centered (textAlign + margin)
//   3. Refactored WHO/WHAT/WHY panels to share FrameworkPanel

// ─── HOW WE HELP PAGE ────────────────────────────────────────────────────────
function HowWeHelpPage({ isMobile }) {
  const Section = ({ label, color = P.gold, children }) => (
    <div style={{ borderTop: `1px solid ${P.border}`, padding: isMobile ? "32px 20px 40px" : "56px 56px 64px" }}>
      <div style={{ fontSize: "17px", letterSpacing: "0.25em", color: color, textTransform: "uppercase", marginBottom: "20px", ...H.mono }}>{label}</div>
      {children}
    </div>
  );

  return (
    <div style={{ background: P.bg, color: P.text, ...H.body, minHeight: "100vh" }}>
      <div style={{ background: P.surface, borderBottom: `1px solid ${P.border}`, padding: isMobile ? "28px 20px 28px" : "52px 56px 48px", position: "relative", overflow: "hidden" }}>
                <div style={{ position: "relative", maxWidth: "680px" }}>
          <div style={{ fontSize: "17px", letterSpacing: "0.25em", color: P.goldDim, textTransform: "uppercase", marginBottom: "20px", ...H.mono }}>Working with us</div>
          <h1 style={{ ...H.heading, fontSize: isMobile ? "24px" : "clamp(28px,4vw,48px)", fontWeight: 600, color: P.text, lineHeight: 1.08, marginBottom: "20px" }}>The model is the map.<br /><span style={{ color: P.gold }}>We help you read the territory.</span></h1>
          <p style={{ fontSize: "17px", color: P.slate, lineHeight: 1.8, maxWidth: "560px", marginBottom: "32px" }}>Understanding a model and knowing how to apply it inside a real, political, resource-constrained organization are two different things. This is where we come in.</p>
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            {[{ label: "Questions we help with", anchor: "hwh-questions", color: P.who }, { label: "Our principles", anchor: "hwh-principles", color: P.pre }, { label: "Where to start", anchor: "hwh-start", color: P.gold }].map((tag) => (
              <button key={tag.anchor} onClick={() => { const el = document.getElementById(tag.anchor); if (el) el.scrollIntoView({ behavior: "smooth", block: "start" }); }} style={{ background: "transparent", border: `1px solid ${tag.color}`, color: tag.color, padding: "8px 18px", borderRadius: "3px", cursor: "pointer", fontSize: "17px", letterSpacing: "0.08em", fontFamily: "'DM Sans',sans-serif", fontWeight: 500, transition: "background 0.15s, color 0.15s" }} onMouseEnter={(e) => { e.currentTarget.style.background = tag.color + "22"; }} onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}>{tag.label} ↓</button>
            ))}
          </div>
        </div>
      </div>

      <div id="hwh-questions" />
      <Section label="01 · Questions we help our clients answer" color={P.who}>
        <h2 style={{ ...H.heading, fontSize: isMobile ? "22px" : "28px", fontWeight: 600, color: P.text, marginBottom: "16px", lineHeight: 1.2 }}>The questions that keep leaders up at night</h2>
        <p style={{ fontSize: "17px", color: P.slate, lineHeight: 1.75, maxWidth: "640px", marginBottom: "40px" }}>Every culture change starts with a dilemma. Something isn't working, or something is possible that isn't yet real. These are the questions we hear most often — each one a different kind of pressure, each one pointing toward a different kind of work.</p>
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fill,minmax(280px,1fr))", gap: "16px", maxWidth: "960px" }}>
          {[
            { theme: "Performance & Strategy", q: "We have a new strategy. Everyone understands it. So why does nothing actually change? We're running out of time to close the gap between what we say we're doing and what's really happening." },
            { theme: "Human Work", q: "We spend more waking hours at work than almost anywhere else. Is this really the best we can do for the people inside our organisation — and for everything that ripples out from them?" },
            { theme: "Repair & Trust", q: "Something broke. It might have been a leader, a restructure, or years of slow erosion. Either way, the trust is gone — and we're not sure people believe us when we say things will be different this time." },
            { theme: "Evolving Identity", q: "The culture that got us here is the one holding us back. We know it. Our people know it. But knowing it and changing it are completely different things." },
            { theme: "New Leadership", q: "I've just stepped into this role. The culture I've inherited isn't the culture I want to build — but I don't want to arrive like a wrecking ball. How do I shape what's here without destroying what matters?" },
            { theme: "Integration", q: "Two organisations. Two ways of doing things. Both proud of what they built. How do we create something genuinely new without making everyone feel like they lost?" },
            { theme: "Belonging", q: "People are disengaging and we don't fully understand why. Underneath the surveys and the exit interviews, we suspect the real question is: do people feel like they truly belong here?" },
          ].map((item) => (
            <div key={item.theme} style={{ background: P.surface, border: `1px solid ${P.border}`, borderTop: `2px solid ${P.who}`, borderRadius: "6px", padding: "22px" }}>
              <div style={{ fontSize: "17px", letterSpacing: "0.18em", textTransform: "uppercase", color: P.who, marginBottom: "10px", ...H.mono }}>{item.theme}</div>
              <div style={{ fontSize: "17px", color: P.slate, lineHeight: 1.65, fontStyle: "italic" }}>"{item.q}"</div>
            </div>
          ))}
        </div>
      </Section>

      <div id="hwh-principles" />
      <Section label="02 · How working with us is different" color={P.pre}>
        <h2 style={{ ...H.heading, fontSize: isMobile ? "22px" : "28px", fontWeight: 600, color: P.text, marginBottom: "16px", lineHeight: 1.2 }}>Our Principles: What makes our approach different</h2>
        <p style={{ fontSize: "17px", color: P.slate, lineHeight: 1.75, maxWidth: "640px", marginBottom: "40px" }}>These five principles sit beneath everything we do. They are not a methodology or a checklist — they are the beliefs that shape how we enter an organisation, how we listen, and how we work alongside the people inside it.</p>
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fill,minmax(260px,1fr))", gap: "16px", maxWidth: "960px" }}>
          {[
            { icon: "🌱", label: "Complex & Evolving", body: "Culture is a living system — it can't be planned, predicted or controlled. It evolves in response to what's happening within and around it. We work with that reality, not against it." },
            { icon: "👤", label: "Individual Agency", body: "Your own stage of development shapes how you show up and how you influence culture as a practitioner. Who you are is inseparable from how you lead this work." },
            { icon: "◎", label: "Influence Through Symbols, Systems & Behaviour", body: "Culture is shaped by leadership behaviour and organisational symbols and systems. Influence is everywhere — not just in what we say, but what we signal." },
            { icon: "🤝", label: "Shared Ownership", body: "Culture is everyone's work. It can't be delegated or centralised — it lives in the day-to-day choices of every person in the system." },
            { icon: "🌍", label: "Human Impact & Organisational Purpose", body: "Culture shapes how well an organisation can achieve its purpose and goals — financial and non-financial. It also impacts how people experience work, and how that ripples into families and communities." },
          ].map((item) => (
            <div key={item.label} style={{ background: P.surface, border: `1px solid ${P.border}`, borderTop: `2px solid ${P.pre}`, borderRadius: "6px", padding: "22px" }}>
              <div style={{ fontSize: "22px", color: P.pre, marginBottom: "12px" }}>{item.icon}</div>
              <div style={{ ...H.heading, fontSize: "18px", fontWeight: 600, color: P.text, marginBottom: "10px", lineHeight: 1.25 }}>{item.label}</div>
              <div style={{ fontSize: "17px", color: P.slate, lineHeight: 1.65 }}>{item.body}</div>
            </div>
          ))}
        </div>
      </Section>

      <div id="hwh-start" />
      <Section label="03 · Places to get started" color={P.gold}>
        <h2 style={{ ...H.heading, fontSize: isMobile ? "22px" : "28px", fontWeight: 600, color: P.text, marginBottom: "16px", lineHeight: 1.2 }}>You don't have to start at the beginning</h2>
        <p style={{ fontSize: "17px", color: P.slate, lineHeight: 1.75, maxWidth: "640px", marginBottom: "16px" }}>The right starting point depends on where you are. If you haven't already, try our <strong style={{ color: P.text }}>Readiness Self-Assessment</strong> or <strong style={{ color: P.text }}>Vision on a Page</strong> tool — they'll help you identify what kind of support you actually need.</p>
        <p style={{ fontSize: "17px", color: P.goldDim, lineHeight: 1.75, maxWidth: "640px", marginBottom: "40px", fontStyle: "italic" }}>We typically work with leadership teams, people & culture functions, and senior leaders navigating complex change. Here are the most common places to start.</p>
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fill,minmax(280px,1fr))", gap: "16px", maxWidth: "960px" }}>
          {[
            { num: "01", label: "Readiness Conversation", time: "Half day", tag: "If your readiness score shows red or yellow", body: "A structured conversation with your leadership team to surface what's actually in the way. We work through the six readiness dimensions together, identify the highest-priority gaps, and agree on where to start. Often the most valuable two hours a leadership team can spend before launching a change effort." },
            { num: "02", label: "Culture Vision Workshop", time: "1–2 days", tag: "If you don't yet have a clear North Star", body: "A facilitated process to build your Culture Vision on a Page. We work with you to define the burning platform, the vision, your values and the From→To shifts in mindsets and behaviours. You leave with a shared document your team owns — and can use as the anchor for everything that follows." },
            { num: "03", label: "Leadership Shadow Diagnostic", time: "2–3 weeks", tag: "If leadership behaviour is the blocker", body: "A structured assessment of the gap between how your leaders see themselves and how others actually experience them. Using interviews, observation and real data, we surface the unconscious behaviours that are undermining the culture you're trying to build — and create a development plan to close the gap." },
            { num: "04", label: "Complexity Sprint", time: "3–4 weeks", tag: "If you're stuck on a complex culture challenge", body: "A focused engagement using safe-to-fail experiments and sense-and-respond methods to move on a specific challenge where traditional approaches haven't worked. Useful when you need to act without full information — and want to learn fast without betting everything on one approach." },
            { num: "05", label: "Culture Change Programme", time: "6–18 months", tag: "If you're ready for sustained, systemic work", body: "End-to-end culture change using the dual-track model. We design and run a programme that combines structured process with emergent practice — addressing systems and symbols, building leadership capability, measuring what matters, and adapting as you learn. Suitable when readiness is high and commitment is real." },
            { num: "06", label: "Integration Support", time: "Varies", tag: "If you're navigating a merger or major transition", body: "Specialist support for organisations bringing two cultures together — or managing a major restructure that is fracturing cultural identity. We help you understand what you're starting with, design a credible integration approach, and hold the process with enough structure and enough flexibility to navigate what you can't predict." },
          ].map((item) => (
            <div key={item.num} style={{ background: P.surface, border: `1px solid ${P.border}`, borderTop: `2px solid ${P.gold}`, borderRadius: "6px", padding: "22px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                <div style={{ ...H.mono, fontSize: "17px", color: P.goldDim }}>{item.num}</div>
                <div style={{ fontSize: "17px", letterSpacing: "0.12em", textTransform: "uppercase", color: P.goldDim, border: `1px solid ${P.border}`, padding: "2px 8px", borderRadius: "2px", ...H.mono }}>{item.time}</div>
              </div>
              <div style={{ fontSize: "17px", letterSpacing: "0.10em", textTransform: "uppercase", color: P.gold, marginBottom: "8px", ...H.mono, opacity: 0.8 }}>{item.tag}</div>
              <div style={{ ...H.heading, fontSize: "17px", fontWeight: 600, color: P.text, marginBottom: "10px" }}>{item.label}</div>
              <div style={{ fontSize: "17px", color: P.slate, lineHeight: 1.65 }}>{item.body}</div>
            </div>
          ))}
        </div>
      </Section>

      <div style={{ padding: "16px 48px", borderTop: `1px solid ${P.border}`, display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "8px" }}>
        <span style={{ fontSize: "17px", color: P.textDim, letterSpacing: "0.08em" }}>cultivatingleadership.com</span>
      </div>
    </div>
  );
}

// ─── CASE STUDIES PAGE ───────────────────────────────────────────────────────
function CaseStudiesPage({ isMobile }) {
  const cases = [
    {
      id: "publicsector", label: "01", sector: "Public Sector · New Zealand",
      title: "Public Sector Department — Culture Transformation Through Leadership Principles",
      sub: "A 130-person department transforms engagement by building culture from the bottom up",
      tags: ["Culture Transformation"],
      track: "ecologist", trackLabel: "Ecologist-led", trackColor: "#6b9e7a",
      confirmed: true,
      body: "A General Manager of a 130-person department at a public sector entity approached Cultivating Leadership with what she saw as a simple ask: help me improve my engagement scores. She was clear on the problem but had no idea about the solution — and was completely open to what was proposed. What followed was an 18-month emergent culture change process built entirely from the inside out.",
      process: [
        "A one-day workshop open to all staff (around 40 attended) based on the question: 'Who do we need to be for each other to ensure we all go home in good shape and are at our best to contribute toward the achievement of the purpose of our department?'",
        "Volunteers analysed the workshop feedback and shaped it into a workable set of leadership principles — bottom up, not top down",
        "A champions group formed from across the department, mentored monthly over 18 months, evolving a rolling work programme of experiments to embed the principles at individual, team and department level. The group rolled over half its membership every 6 months to spread the learning",
        "An Immunity to Change (ITC) leadership programme for 12 leaders, run three times, plus a group ITC process for the Executive team",
        "GM coaching, quarterly 'walking the talk' leadership sessions, and resources including guidance for one-on-one culture conversations and people leader guidance",
      ],
      principles: [
        { label: "Executive sponsor", body: "There is a sponsor from the Executive team committed to the process" },
        { label: "Bottom-up principles", body: "Human work leadership principles are established bottom-up — answering 'who do we need to be for each other?'" },
        { label: "Leaders walk the talk", body: "The Executive team commit to their own growth and learning, not just asking others to change" },
        { label: "Time and patience", body: "There is an understanding that culture change takes time — this is not a quick fix" },
        { label: "Champions move to action", body: "A team of champions develops an iterated work programme of actions and experiments" },
        { label: "Systems alignment", body: "The work programme includes review of policies and procedures for alignment with the principles" },
        { label: "Guide, not prescribe", body: "The consultant is a guide to the process, not the owner of it" },
      ],
      outcomes: [
        "A shared overarching principle — 'We, every one of us, every day, support each other to be the best we can be' — with six specific commitments co-created by staff",
        "People leader guidance co-developed by champions, integrating the leadership principles into day-to-day team leadership and one-on-one conversations",
        "A self-sustaining champion network with rotating membership that spread ownership of the culture work across the entire department",
      ],
      color: "#6b9e7a",
    },
    {
      id: "hotel", label: "02", sector: "Hospitality · International",
      title: "Hotel Chain Merger — Forging a Shared Culture Post-Acquisition",
      sub: "Creating cultural synergy across two distinct hospitality brands",
      tags: ["Merger Integration"],
      track: "engineer", trackLabel: "Engineer-led", trackColor: "#c9a84c",
      confirmed: false,
      body: "Two major international hotel chains had merged and were under pressure to create better customer engagement and accelerate business outcomes — while forming a new shared culture that honoured the distinct character of each legacy brand. The challenge was not just cultural integration but commercial urgency. A more disciplined, process-driven approach was called for, with clear milestones, measurable outcomes, and structured leadership alignment work from the outset.",
      process: null,
      principles: null,
      outcomes: [
        "A structured leadership alignment process surfaced and resolved five significant value conflicts across the merged senior team before they became embedded in operating norms",
        "A shared culture framework, co-designed with staff from both legacy brands, defined the service behaviours and leadership expectations that would characterise the new organisation — not a compromise, but a genuine synthesis",
        "Within 12 months of the integration programme, customer satisfaction scores across merged properties exceeded the pre-merger baseline of both legacy brands",
      ],
      color: "#c9a84c",
    },
  ];

  return (
    <div style={{ background: P.bg, color: P.text, ...H.body, minHeight: "100vh" }}>

      {/* Page header */}
      <div style={{ background: P.surface, borderBottom: `1px solid ${P.border}`, padding: isMobile ? "28px 20px 28px" : "52px 56px 48px", position: "relative", overflow: "hidden" }}>
                <div style={{ position: "relative", maxWidth: "720px" }}>
          <div style={{ fontSize: "17px", letterSpacing: "0.25em", color: P.goldDim, textTransform: "uppercase", marginBottom: "20px", ...H.mono }}>Client work</div>
          <h1 style={{ ...H.heading, fontSize: isMobile ? "24px" : "clamp(28px,4vw,48px)", fontWeight: 600, color: P.text, lineHeight: 1.08, marginBottom: "20px" }}>
            The model in action.<br /><span style={{ color: P.gold }}>Real organisations. Real complexity.</span>
          </h1>
          <p style={{ fontSize: isMobile ? "14px" : "15px", color: P.slate, lineHeight: 1.85, maxWidth: "640px", marginBottom: "16px" }}>
            Two very different organisations. Two very different cultural aspirations. One — a public sector
            department — chose to evolve their culture so it was more human-centred, leaning deeply into
            the Ecologist mode. The other — two major hotel chains post-merger — needed to create better
            customer engagement and accelerate business outcomes while forging a new shared culture.
            They leaned more into the Engineer approach.
          </p>
          <p style={{ fontSize: isMobile ? "14px" : "15px", color: P.slate, lineHeight: 1.85, maxWidth: "640px" }}>
            Both succeeded — because despite very different goals and approaches, each held enough of
            both the Engineer and the Ecologist to create and sustain the culture they wanted.
            The paradox, held well, turned out to be the point.
          </p>
        </div>
      </div>

      {/* Case cards */}
      <div style={{ padding: isMobile ? "20px 16px 48px" : "56px 56px 80px", display: "flex", flexDirection: "column", gap: isMobile ? "28px" : "48px", maxWidth: "1100px" }}>
        {cases.map(c => (
          <div key={c.id} style={{ background: P.surface, border: `1px solid ${P.border}`, borderTop: `3px solid ${c.color}`, borderRadius: "6px", overflow: "hidden" }}>

            {/* Card header */}
            <div style={{ padding: isMobile ? "20px 20px 18px" : "32px 36px 28px", borderBottom: `1px solid ${P.border}`, display: "grid", gridTemplateColumns: isMobile ? "1fr" : "auto 1fr", gap: isMobile ? "12px" : "28px", alignItems: "start" }}>
              {!isMobile && <div style={{ ...H.mono, fontSize: "32px", fontWeight: 700, color: c.color, opacity: 0.25, lineHeight: 1, paddingTop: "4px" }}>{c.label}</div>}
              <div>
                <div style={{ fontSize: "9px", letterSpacing: "0.2em", textTransform: "uppercase", color: c.color, marginBottom: "8px", ...H.mono }}>{c.sector}</div>
                <h2 style={{ ...H.heading, fontSize: isMobile ? "20px" : "24px", fontWeight: 600, color: P.text, lineHeight: 1.15, marginBottom: "8px" }}>{c.title}</h2>
                <p style={{ fontSize: "13px", color: P.slate, lineHeight: 1.6, marginBottom: "12px" }}>{c.sub}</p>
                <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", alignItems: "center" }}>
                  <span style={{ fontSize: "10px", letterSpacing: "0.12em", textTransform: "uppercase", color: c.trackColor, border: `1px solid ${c.trackColor}44`, padding: "2px 8px", borderRadius: "2px", ...H.mono }}>{c.trackLabel}</span>
                  {c.tags.map(tag => (
                    <span key={tag} style={{ fontSize: "10px", letterSpacing: "0.08em", color: P.textDim, border: `1px solid ${P.border}`, padding: "2px 8px", borderRadius: "2px", ...H.mono }}>{tag}</span>
                  ))}
                </div>
              </div>
            </div>

            {/* Confirmed banner */}
            {c.confirmed === false && (
              <div style={{ background: P.gold + "18", borderBottom: `1px solid ${P.gold}44`, padding: "10px 36px", display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontSize: "10px", letterSpacing: "0.15em", textTransform: "uppercase", color: P.gold, ...H.mono, fontWeight: 500 }}>⚠ Details to be confirmed</span>
              </div>
            )}

            {/* Card body — context + outcomes */}
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: "0" }}>
              <div style={{ padding: isMobile ? "20px" : "28px 36px", borderRight: isMobile ? "none" : `1px solid ${P.border}`, borderBottom: isMobile ? `1px solid ${P.border}` : "none" }}>
                <div style={{ fontSize: "9px", letterSpacing: "0.18em", textTransform: "uppercase", color: P.textDim, marginBottom: "14px", ...H.mono }}>Context</div>
                <p style={{ fontSize: "13px", color: P.slate, lineHeight: 1.75, fontStyle: "italic" }}>{c.body}</p>
                {c.process && (
                  <div style={{ marginTop: "20px" }}>
                    <div style={{ fontSize: "9px", letterSpacing: "0.18em", textTransform: "uppercase", color: P.textDim, marginBottom: "10px", ...H.mono }}>Process</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                      {c.process.map((step, i) => (
                        <div key={i} style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
                          <div style={{ ...H.mono, fontSize: "10px", color: c.color, minWidth: "18px", paddingTop: "2px" }}>{String(i + 1).padStart(2, "0")}</div>
                          <div style={{ fontSize: "12px", color: P.slate, lineHeight: 1.65 }}>{step}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {c.principles && (
                  <div style={{ marginTop: "20px" }}>
                    <div style={{ fontSize: "9px", letterSpacing: "0.18em", textTransform: "uppercase", color: P.textDim, marginBottom: "10px", ...H.mono }}>Process Principles</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                      {c.principles.map((pr, i) => (
                        <div key={i}>
                          <div style={{ fontSize: "12px", fontWeight: 600, color: c.color, marginBottom: "2px" }}>{pr.label}</div>
                          <div style={{ fontSize: "12px", color: P.slate, lineHeight: 1.6 }}>{pr.body}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div style={{ padding: isMobile ? "20px" : "28px 36px" }}>
                <div style={{ fontSize: "9px", letterSpacing: "0.18em", textTransform: "uppercase", color: P.textDim, marginBottom: "14px", ...H.mono }}>Selected outcomes</div>
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {c.outcomes.map((o, i) => (
                    <div key={i} style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
                      <div style={{ width: "4px", height: "4px", borderRadius: "50%", background: c.color, marginTop: "7px", flexShrink: 0 }} />
                      <p style={{ fontSize: "13px", color: P.slate, lineHeight: 1.65 }}>{o}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ padding: "16px 56px", borderTop: `1px solid ${P.border}`, fontSize: "10px", color: P.textDim, letterSpacing: "0.08em" }}>
        Case Studies · two engagements
      </div>
    </div>
  );
}

// ─── TOOLS: DATA ────────────────────────────────────────────────────────────

const VISION_STEPS = [
  { id: "platform", label: "The Burning Platform", subtitle: "Why this moment is decisive",
    question: "If a sceptical board member asked you 'why now and not in two years?' — what would you say? Be specific about what you're risking by waiting. If your answer is vague, that's important information.",
    prompt: "Write the headline of an article about your organisation in 3 years if nothing changes.",
    placeholder: "We have been growing steadily, but our competitors are moving faster and our best people are asking harder questions about where we are going...",
    hint: "Be honest about the discomfort. The clearest visions come from the clearest burning platforms." },
  { id: "vision", label: "Vision & Purpose", subtitle: "Your North Star",
    question: "Describe a Tuesday morning in the organisation you're trying to build. What are people talking about? What are they not worrying about anymore? What's different about how decisions get made?",
    prompt: "If someone shadowed your CEO for a day in this future organisation, what would surprise them most?",
    placeholder: "We will be a place where people feel genuinely empowered to make decisions close to the customer...",
    hint: "If your description could apply to any company, it's not vivid enough yet." },
  { id: "values", label: "Values", subtitle: "What we stand for — always",
    question: "What would you refuse to compromise even if it cost you commercially? Name 3–5 things. For each one: describe a moment where someone would see this value in action — and a moment where they'd see it being violated.",
    prompt: "Think of a recent decision that was hard because the right thing and the easy thing were different. What value was at stake?",
    placeholder: "Integrity — we tell the truth even when it's uncomfortable. This means we admit mistakes publicly...",
    hint: "If a value doesn't constrain any decisions, it's wallpaper. The test: can you name something it prevents you from doing?" },
  { id: "strategy", label: "Strategic Priorities", subtitle: "The big choices for the next 1–3 years",
    question: "What are you saying NO to? Good strategy is as much about that. Name 2–4 strategic priorities — and for each, name one thing you're deliberately not doing to make room for it.",
    prompt: "If you could only achieve two things in the next two years, which two would change everything?",
    placeholder: "Priority 1: Rebuild our digital capability from the ground up. This means we are NOT investing in expanding our physical footprint...",
    hint: "If everything is a priority, nothing is. The struggle to choose is where the real strategy lives." },
  { id: "leadership", label: "Leadership Priorities", subtitle: "What leaders must focus on",
    question: "A new senior leader joins tomorrow. What three things do they need to understand about how to succeed here — that aren't in the job description?",
    prompt: "What's the gap between the leader you need and the leader you currently reward?",
    placeholder: "Leaders here need to be comfortable with ambiguity — we are moving faster than our processes...",
    hint: "The answer to this question often reveals more about the real culture than any values poster." },
  { id: "behaviours", label: "Target Behaviours", subtitle: "What people actually do differently",
    question: "Describe someone on their best day here. What are they actually doing — specifically enough that you'd recognise it if you saw it? Now describe someone on their worst day. What's the gap?",
    prompt: "If you followed your best team for a week with a camera, what observable behaviours would you see that you want everywhere?",
    placeholder: "On their best day, a team lead here checks in with their team before making a call that affects them...",
    hint: "Observable and specific. 'Be more collaborative' is not a behaviour — 'invite dissenting views before closing a decision' is." },
];

const READINESS_DIMS = [
  { id: "pre", label: "Preconditions", color: P.pre, desc: "Psychological safety, accountability, leadership readiness",
    questions: [
      "People in our organisation can openly disagree with leadership without fear of repercussions.",
      "When someone violates our stated values, there are real and consistent consequences — regardless of seniority.",
      "Our senior leaders have demonstrated genuine willingness to change their own behaviour, not just ask others to change.",
    ] },
  { id: "why", label: "The WHY", color: P.why, desc: "Burning platform, compelling vision, urgency",
    questions: [
      "We can clearly articulate why culture change is necessary right now — in specific, concrete terms that go beyond 'we need to improve'.",
      "Most people in the organisation would agree on what's at stake if we don't change.",
      "We have a compelling picture of what the future looks like — specific enough that people can see themselves in it.",
    ] },
  { id: "who", label: "The WHO", color: P.who, desc: "Leadership shadow, coalition, role modelling",
    questions: [
      "Our leadership team is genuinely aligned on the need for change — not just publicly supportive while privately sceptical.",
      "We have identified and engaged the informal influencers across the organisation, not just the formal hierarchy.",
      "Leaders are willing to go first in changing their own behaviour — even when it feels uncomfortable or risky.",
    ] },
  { id: "what", label: "The WHAT", color: P.what, desc: "North Star clarity, values, behavioural specificity",
    questions: [
      "We have a clear North Star that describes the culture we want — in specific, observable behavioural terms, not just aspirational slogans.",
      "We have mapped the gap between our current culture and our desired culture honestly — including the parts that are hard to hear.",
      "Our values are genuinely understood and used to guide decisions, not just printed on walls and forgotten.",
    ] },
  { id: "how_e", label: "HOW · Engineer Track", color: P.gold, desc: "Structured process, systems alignment, measurement",
    questions: [
      "We have a structured plan for culture change with clear phases, milestones, and accountability — not just good intentions.",
      "We have reviewed our systems (incentives, promotions, performance reviews, hiring) for alignment with the culture we say we want.",
      "We are measuring culture change using real indicators — not just annual engagement surveys.",
    ] },
  { id: "how_c", label: "HOW · Ecologist Track", color: P.lime, desc: "Emergence, experiments, adaptive practice",
    questions: [
      "We are running small, safe-to-fail experiments to learn what works rather than betting everything on one big rollout.",
      "When experiments fail, we treat them as learning rather than blame — and we actually change course based on what we learn.",
      "We are comfortable holding direction and guardrails while allowing people at the edges to adapt and innovate.",
    ] },
];

function bandFor(score, max) {
  const pct = score / max;
  if (pct >= 0.75) return { label: "Working well", color: "#6b9e7a", bg: "#6b9e7a18" };
  if (pct >= 0.45) return { label: "Foundations emerging", color: "#c9a84c", bg: "#c9a84c18" };
  return { label: "Needs significant time and attention", color: "#c94c4c", bg: "#c94c4c18" };
}

// ─── VISION HTML GENERATOR ──────────────────────────────────────────────────

function generateVisionHTML(answers, polished) {
  const date = new Date().toLocaleDateString("en-GB", { year: "numeric", month: "long", day: "numeric" });
  const sections = VISION_STEPS.map(s => {
    const val = (answers[s.id] || "").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\n/g, "<br>");
    return `<div class="section"><div class="s-label">${s.label}</div><div class="s-sub">${s.subtitle}</div><div class="s-body">${val || "<em>Not completed</em>"}</div></div>`;
  }).join("");
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Culture Change Vision</title>`
    + `<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600&family=DM+Sans:wght@300;400;500&display=swap" rel="stylesheet">`
    + `<style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:'DM Sans',sans-serif;background:#1a393c;color:#f0f5f4;max-width:800px;margin:0 auto;padding:60px 48px}`
    + `.cover{text-align:center;margin-bottom:48px;padding-bottom:32px;border-bottom:1px solid #2d5a5e}`
    + `.c-eyebrow{font-size:10px;letter-spacing:0.22em;text-transform:uppercase;color:#8a7035;font-family:monospace;margin-bottom:24px}`
    + `.c-title{font-family:'Cormorant Garamond',serif;font-size:36px;font-weight:600;line-height:1.1;margin-bottom:12px}`
    + `.c-sub{font-size:14px;color:#a8c4c7;margin-bottom:8px}.c-date{font-size:11px;color:#6a9296}`
    + `.section{margin-bottom:36px;padding:24px;background:#1f4347;border:1px solid #2d5a5e;border-radius:6px}`
    + `.s-label{font-family:'Cormorant Garamond',serif;font-size:20px;font-weight:600;margin-bottom:4px}`
    + `.s-sub{font-size:11px;color:#8a7035;letter-spacing:0.12em;text-transform:uppercase;font-family:monospace;margin-bottom:16px}`
    + `.s-body{font-size:14px;line-height:1.8;color:#a8c4c7}`
    + `.footer{margin-top:40px;padding-top:16px;border-top:1px solid #2d5a5e;font-size:10px;color:#6a9296;display:flex;justify-content:space-between}`
    + `@media print{body{background:white;color:#1a1a2e}.section{background:#f9f9fb;border-color:#e5e7eb}.s-body{color:#333}.footer{color:#999}}</style></head>`
    + `<body><div class="cover"><div class="c-eyebrow">Cultivating Leadership` + (polished ? " · AI-polished" : "") + `</div>`
    + `<div class="c-title">Our Culture<br>Change Vision</div>`
    + `<div class="c-sub">A living document for alignment and aspiration</div>`
    + `<div class="c-date">${date}</div></div>`
    + `<div class="content">${sections}</div>`
    + `<div class="footer"><span>cultivatingleadership.com</span><span>Culture Change Vision · ${new Date().getFullYear()}</span></div>`
    + `</body></html>`;
}

function triggerDownload(html, filename) {
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename || "culture-change-vision.html";
  document.body.appendChild(a); a.click();
  document.body.removeChild(a); URL.revokeObjectURL(url);
}

function downloadReadinessResults(dims, totalFor) {
  const overallScore = dims.reduce((s, d) => s + totalFor(d), 0);
  const overallMax = dims.length * 12;
  const overall = bandFor(overallScore, overallMax);
  const mapped = dims.map(d => {
    const score = totalFor(d);
    const band = bandFor(score, 12);
    return { ...d, score, band, pct: Math.round((score / 12) * 100) };
  });
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Readiness Results</title>`
    + `<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600&family=DM+Sans:wght@300;400;500&display=swap" rel="stylesheet">`
    + `<style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:'DM Sans',sans-serif;background:#1a393c;color:#f0f5f4;max-width:800px;margin:0 auto;padding:60px 48px}`
    + `h1{font-family:'Cormorant Garamond',serif;font-size:32px;font-weight:600;margin-bottom:8px}`
    + `.eyebrow{font-size:10px;letter-spacing:0.22em;text-transform:uppercase;color:#8a7035;font-family:monospace;margin-bottom:16px}`
    + `.overall-box{padding:24px;border-radius:6px;margin-bottom:40px;border:1px solid}`
    + `.score{font-family:'Cormorant Garamond',serif;font-size:36px;font-weight:600;margin-right:12px}`
    + `.band-label{font-size:14px;letter-spacing:0.08em;text-transform:uppercase;font-family:monospace}`
    + `.summary{font-size:14px;color:#a8c4c7;line-height:1.7;margin-top:12px}`
    + `.dim-row{padding:20px;background:#1f4347;border:1px solid #2d5a5e;border-radius:6px;margin-bottom:12px}`
    + `.dim-title{font-family:'Cormorant Garamond',serif;font-size:17px;font-weight:600}`
    + `.dim-desc{font-size:11px;color:#a8c4c7;margin-top:2px}`
    + `.dim-meta{display:flex;align-items:center;gap:10px}`
    + `.dim-score-label{font-family:monospace;font-size:13px}`
    + `.dim-badge{font-size:11px;border-radius:3px;padding:2px 10px;font-family:monospace;letter-spacing:0.06em;border:1px solid}`
    + `.bar-track{height:4px;background:#2d5a5e;border-radius:2px;margin-top:12px}`
    + `.bar-fill{height:100%;border-radius:2px}`
    + `.dim-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:10px}`
    + `.footer{margin-top:48px;padding-top:20px;border-top:1px solid #2d5a5e;font-size:10px;color:#6a9296;display:flex;justify-content:space-between}`
    + `@media print{body{background:white;color:#1a1a2e}h1{color:#1a1a2e}.dim-row{background:#f9f9fb;border-color:#e5e7eb}.bar-track{background:#e5e7eb}}</style></head>`
    + `<body><div class="eyebrow">Cultivating Leadership · Self-assessment</div>`
    + `<h1>Culture Change Readiness</h1>`
    + `<p style="font-size:14px;color:#a8c4c7;margin:12px 0 40px;line-height:1.7">This assessment reflects where your organisation sits today across the key conditions for culture change.<br>Use it as a conversation starter — not a verdict.</p>`
    + `<div class="overall-box" style="background:${overall.bg};border-color:${overall.color}44">`
    + `<div class="eyebrow" style="color:${overall.color}">Overall readiness</div>`
    + `<div style="display:flex;align-items:baseline;gap:0;flex-wrap:wrap">`
    + `<span class="score" style="color:${overall.color}">${overallScore} / ${overallMax}</span>`
    + `<span class="band-label" style="color:${overall.color}">${overall.label}</span></div>`
    + `<p class="summary">${overall.label === "Working well" ? "You have strong conditions across most dimensions. The work ahead is about sustaining this foundation and moving deliberately into execution."
      : overall.label === "Foundations emerging" ? "You have real foundations to build on — and some important gaps to address first. Naming those gaps now is itself a form of readiness."
      : "Significant conditions are absent across multiple dimensions. This is important information — not a reason to stop, but a reason to be very deliberate about what you build first."}</p></div>`
    + `<div style="font-size:10px;letter-spacing:0.22em;text-transform:uppercase;color:#6a9296;margin-bottom:20px;font-family:monospace">By dimension</div>`
    + mapped.map(d => `<div class="dim-row"><div class="dim-header"><div><div class="dim-title">${d.label}</div><div class="dim-desc">${d.desc}</div></div>`
      + `<div class="dim-meta"><span class="dim-score-label" style="color:${d.band.color}">${d.score}/12</span>`
      + `<span class="dim-badge" style="color:${d.band.color};background:${d.band.bg};border-color:${d.band.color}44">${d.band.label}</span></div></div>`
      + `<div class="bar-track"><div class="bar-fill" style="width:${d.pct}%;background:${d.band.color}"></div></div></div>`).join("")
    + `<div class="footer"><span>cultivatingleadership.com</span><span>Generated ${new Date().toLocaleDateString("en-GB", { year: "numeric", month: "long", day: "numeric" })}</span></div>`
    + `</body></html>`;
  triggerDownload(html, "readiness-results.html");
}

// ─── READINESS GROUP HELPERS ────────────────────────────────────────────────
// Storage adapter (localStorage version — InciteU port swaps to /api/sessions).
// AI adapter (direct fetch — InciteU port swaps to synthesize() helper).
// All four method signatures (createSession, getSession, contribute, saveSynthesis,
// deleteSession) match what the InciteU backend will expose.

const READINESS_STORAGE_PREFIX = "ccm-readiness:";

const CODE_WORDS = [
  "forge", "pivot", "lattice", "compass", "anchor", "ember", "horizon",
  "thresh", "orbit", "spiral", "beacon", "kindle", "gather", "venture",
  "ripple", "mirror", "kite", "fern", "cairn", "meadow", "thicket",
  "harbor", "lantern", "tide", "willow", "sage", "pebble", "cinder",
  "tundra", "summit", "marrow", "delta", "verge", "kestrel"
];

function generateSessionCode() {
  const word = CODE_WORDS[Math.floor(Math.random() * CODE_WORDS.length)];
  const digits = String(Math.floor(1000 + Math.random() * 9000));
  return `${word}-${digits}`;
}

// readinessStorage — backend-backed adapter; signatures preserved 1:1 with v9's
// localStorage version so all call sites keep working unchanged. getSession
// returns null on 404 to match v9's null-on-miss contract.
async function sessionsFetch(opts) {
  const { method = "POST", body, query } = opts;
  const url = query
    ? `${API_SESSIONS_URL}?${new URLSearchParams(query).toString()}`
    : API_SESSIONS_URL;
  const res = await fetch(url, {
    method,
    headers: body ? { "Content-Type": "application/json" } : {},
    body: body ? JSON.stringify(body) : undefined,
  });
  let data = {};
  try { data = await res.json(); } catch (e) { /* keep data = {} */ }
  if (!res.ok) {
    const msg = (data && data.error) || `Request failed (${res.status})`;
    const err = new Error(msg);
    err.status = res.status;
    throw err;
  }
  return data;
}

const readinessStorage = {
  async createSession(frame, aiOn) {
    return sessionsFetch({ body: { action: "create", frame, aiOn } });
  },
  async getSession(code) {
    try {
      return await sessionsFetch({ method: "GET", query: { code } });
    } catch (e) {
      if (e.status === 404) return null; // preserve v9 null-on-miss contract
      throw e;
    }
  },
  async contribute(code, name, scores) {
    return sessionsFetch({ body: { action: "contribute", sessionCode: code, name, scores } });
  },
  async saveSynthesis(code, synthesis) {
    return sessionsFetch({ body: { action: "synthesis", sessionCode: code, synthesis } });
  },
  async deleteSession(code) {
    return sessionsFetch({ body: { action: "delete", sessionCode: code } });
  },
};

// aiCall — proxied via API_SYNTHESIZE_URL; server holds the Anthropic key.
async function aiCall({ prompt, maxTokens = 2000 }) {
  const res = await fetch(API_SYNTHESIZE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: maxTokens,
      messages: [{ role: "user", content: prompt }],
    }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error("AI call failed: " + res.status + " " + text);
  }
  const data = await res.json();
  return data.content.filter(b => b.type === "text").map(b => b.text).join("");
}

function parseJSONLoose(text) {
  const clean = text.replace(/```json|```/g, "").trim();
  const first = clean.indexOf("{");
  const last = clean.lastIndexOf("}");
  if (first === -1 || last === -1) throw new Error("No JSON object in AI response");
  return JSON.parse(clean.slice(first, last + 1));
}

// Deterministic synthesis — computed locally, no AI. Always populated.
function computeReadinessSynthesis(contributions, dims) {
  if (!contributions || contributions.length === 0) return null;
  function totalForPerson(scoreMap, dim) {
    return dim.questions.reduce((s, _, i) => s + (scoreMap[dim.id + "_" + i] || 0), 0);
  }
  const perPersonOverall = contributions.map(c => ({
    name: c.name,
    overall: dims.reduce((s, d) => s + totalForPerson(c.scores, d), 0),
  }));
  const overallMax = dims.length * 12;
  const teamAvg = perPersonOverall.reduce((s, p) => s + p.overall, 0) / perPersonOverall.length;
  const teamBand = bandFor(teamAvg, overallMax).label;
  const minOverall = Math.min.apply(null, perPersonOverall.map(p => p.overall));
  const maxOverall = Math.max.apply(null, perPersonOverall.map(p => p.overall));
  const byDimension = dims.map(d => {
    const personScores = contributions.map(c => ({ name: c.name, score: totalForPerson(c.scores, d) }))
      .sort((a, b) => b.score - a.score);
    const max = personScores[0] ? personScores[0].score : 0;
    const min = personScores.length ? personScores[personScores.length - 1].score : 0;
    const avg = personScores.reduce((s, p) => s + p.score, 0) / personScores.length;
    const spread = max - min;
    const consensus = spread <= 2 ? "high" : spread <= 5 ? "moderate" : "low";
    return {
      dim_id: d.id, label: d.label, desc: d.desc, color: d.color,
      team_avg: Math.round(avg * 10) / 10,
      spread, consensus_level: consensus,
      highest: personScores[0],
      lowest: personScores[personScores.length - 1],
      all_scores: personScores,
    };
  });
  return {
    overall: {
      n_participants: contributions.length,
      team_avg_score: Math.round(teamAvg * 10) / 10,
      team_avg_band: teamBand,
      score_range: { min: minOverall, max: maxOverall },
      overall_max: overallMax,
    },
    by_dimension: byDimension,
    per_person_overall: perPersonOverall,
  };
}

async function aiReadinessSynthesis(session, dims) {
  const dimMeta = dims.map(d => ({ id: d.id, label: d.label, desc: d.desc, statements: d.questions }));
  const contribData = session.contributions.map(c => ({ name: c.name, scores: c.scores }));
  const prompt = "You are analyzing a team's culture-change readiness self-assessment. Each person answered the same 18 statements on a 4-point scale (1=Strongly disagree, 4=Strongly agree). Statements are grouped into 6 dimensions: Preconditions, The WHY, The WHO, The WHAT, HOW (Engineer track), HOW (Ecologist track).\n\n"
    + "Your job: surface where this team agrees, where it disagrees, what the divergences likely mean, and what the team should discuss first.\n\n"
    + "Session name: " + (session.frame.name || "(unnamed)") + "\n"
    + "Optional team context from facilitator: " + (session.frame.context || "(none)") + "\n\n"
    + "Participants and their answers (scores keyed by dimension id + statement index):\n"
    + JSON.stringify(contribData, null, 2) + "\n\n"
    + "Statements and dimensions:\n"
    + JSON.stringify(dimMeta, null, 2) + "\n\n"
    + "Return ONLY valid JSON with this exact shape, no markdown fences, no preamble:\n"
    + "{\n"
    + "  \"biggest_divergences\": [\n"
    + "    {\n"
    + "      \"dim_label\": \"exact label from the dimensions list\",\n"
    + "      \"what_emerged\": \"1-2 sentences naming the high/low scores and the participants who hold them\",\n"
    + "      \"likely_reading\": \"1-2 sentences interpreting the pattern. If you cannot interpret without more context, say so honestly.\",\n"
    + "      \"conversation_prompt\": \"one concrete question the facilitator should put on the table\"\n"
    + "    }\n"
    + "  ],\n"
    + "  \"consensus_areas\": [\n"
    + "    {\n"
    + "      \"dim_label\": \"exact label from the dimensions list\",\n"
    + "      \"team_view\": \"1-2 sentences. Distinguish high-consensus (everyone scored 3-4) from low-consensus (everyone scored 1-2).\",\n"
    + "      \"implication\": \"what this means for action\"\n"
    + "    }\n"
    + "  ],\n"
    + "  \"the_real_question\": \"1-2 sentences. Look at the pattern across dimensions. What is this team actually wrestling with? Often the divergence itself is the answer, not the average scores.\",\n"
    + "  \"what_to_discuss_first\": [ \"2-3 concrete prompts. Each one references specific names and dimensions from the data.\" ]\n"
    + "}\n\n"
    + "Rules:\n"
    + "- biggest_divergences: pick the 2-3 dimensions with the largest spread. Name names.\n"
    + "- consensus_areas: pick 1-2 dimensions where the team agrees. High vs low consensus matters.\n"
    + "- Talk like a coach, not a textbook. Warm, direct, zero corporate jargon. Never say \"leverage\" or \"synergize\" or \"align\".\n"
    + "- Return ONLY the JSON.";
  const text = await aiCall({ prompt, maxTokens: 2200 });
  return parseJSONLoose(text);
}

async function aiSoloCommentary(scores, dims) {
  const summary = dims.map(d => {
    let s = 0;
    for (let i = 0; i < d.questions.length; i++) s += scores[d.id + "_" + i] || 0;
    return { label: d.label, score: s, max: 12, band: bandFor(s, 12).label };
  });
  const prompt = "A leader has just completed a self-assessment of their organisation's readiness for culture change. They scored each of 6 dimensions out of 12.\n\n"
    + "Their results:\n" + JSON.stringify(summary, null, 2) + "\n\n"
    + "For each dimension, write a single short paragraph (2-3 sentences) directly to them — what their score on this dimension typically signals, and one specific question they should bring to a leadership conversation about it. Be warm, direct, zero corporate jargon. Never say \"leverage\" or \"synergize\" or \"align\". Use the second person (\"you\", \"your team\").\n\n"
    + "Return ONLY valid JSON with this shape, no markdown fences, no preamble:\n"
    + "{\n"
    + "  \"by_label\": {\n"
    + "    \"Preconditions\": \"your commentary\",\n"
    + "    \"The WHY\": \"your commentary\",\n"
    + "    \"The WHO\": \"your commentary\",\n"
    + "    \"The WHAT\": \"your commentary\",\n"
    + "    \"HOW · Engineer Track\": \"your commentary\",\n"
    + "    \"HOW · Ecologist Track\": \"your commentary\"\n"
    + "  }\n"
    + "}";
  const text = await aiCall({ prompt, maxTokens: 1500 });
  return parseJSONLoose(text);
}

function downloadGroupReadinessResults(session, dims) {
  const syn = session.synthesis;
  if (!syn) return;
  const date = new Date().toLocaleDateString("en-GB", { year: "numeric", month: "long", day: "numeric" });
  const dimRows = syn.by_dimension.map(d => {
    const namesByScore = d.all_scores.map(p => `<span style="color:${d.color};font-family:monospace;font-size:11px;margin-right:8px">${p.name.replace(/</g,'&lt;')}: ${p.score}/12</span>`).join("");
    const consensusLabel = d.consensus_level === "high" ? "High consensus" : d.consensus_level === "moderate" ? "Moderate spread" : "Low consensus";
    return `<div class="dim-row"><div class="dim-title">${d.label}</div><div class="dim-desc">${d.desc}</div><div style="margin-top:8px;font-size:12px;color:#8a7035;font-family:monospace">Avg ${d.team_avg}/12 · Spread ${d.spread} · ${consensusLabel}</div><div style="margin-top:10px">${namesByScore}</div></div>`;
  }).join("");
  const aiBlock = syn.ai ? (
    `<div class="ai-section"><div class="ai-eyebrow">AI synthesis</div>`
    + `<h3>The real question</h3><p class="real-q">${syn.ai.the_real_question || ""}</p>`
    + `<h3>Biggest divergences</h3>`
    + (syn.ai.biggest_divergences || []).map(b => `<div class="ai-card"><div class="ai-card-title">${b.dim_label}</div><p>${b.what_emerged}</p><p><em>${b.likely_reading}</em></p><p class="prompt">→ ${b.conversation_prompt}</p></div>`).join("")
    + `<h3>Consensus areas</h3>`
    + (syn.ai.consensus_areas || []).map(c => `<div class="ai-card"><div class="ai-card-title">${c.dim_label}</div><p>${c.team_view}</p><p><em>${c.implication}</em></p></div>`).join("")
    + `<h3>What to discuss first</h3><ul>${(syn.ai.what_to_discuss_first || []).map(w => `<li>${w}</li>`).join("")}</ul>`
    + `</div>`
  ) : "";
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Team Readiness · ${session.frame.name || session.sessionCode}</title>`
    + `<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600&family=DM+Sans:wght@300;400;500&display=swap" rel="stylesheet">`
    + `<style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:'DM Sans',sans-serif;background:#1a393c;color:#f0f5f4;max-width:840px;margin:0 auto;padding:48px}`
    + `h1{font-family:'Cormorant Garamond',serif;font-size:32px;font-weight:600;margin-bottom:6px}h3{font-family:'Cormorant Garamond',serif;font-size:20px;font-weight:600;margin:24px 0 12px}`
    + `.eyebrow{font-size:10px;letter-spacing:0.22em;text-transform:uppercase;color:#8a7035;font-family:monospace;margin-bottom:16px}`
    + `.dim-row{padding:18px;background:#1f4347;border:1px solid #2d5a5e;border-radius:6px;margin-bottom:10px}`
    + `.dim-title{font-family:'Cormorant Garamond',serif;font-size:17px;font-weight:600}.dim-desc{font-size:11px;color:#a8c4c7;margin-top:2px;font-style:italic}`
    + `.ai-section{margin-top:36px;padding:24px;border:1px solid #c9a84c44;border-radius:6px;background:#c9a84c0a}`
    + `.ai-eyebrow{font-size:10px;letter-spacing:0.22em;text-transform:uppercase;color:#c9a84c;font-family:monospace;margin-bottom:12px}`
    + `.ai-card{margin-bottom:14px;padding:14px;background:#1f4347;border-radius:4px;border-left:3px solid #c9a84c}`
    + `.ai-card-title{font-family:'Cormorant Garamond',serif;font-size:15px;font-weight:600;margin-bottom:6px}`
    + `.ai-card p{font-size:13px;line-height:1.7;color:#d7e3e1;margin-top:4px}.prompt{color:#c9a84c;font-weight:500;margin-top:8px!important}`
    + `.real-q{font-style:italic;font-size:16px;line-height:1.6;color:#f0f5f4}`
    + `ul{padding-left:20px;font-size:13px;line-height:1.7;color:#d7e3e1}li{margin-bottom:6px}`
    + `.footer{margin-top:40px;padding-top:16px;border-top:1px solid #2d5a5e;font-size:10px;color:#6a9296;display:flex;justify-content:space-between}`
    + `@media print{body{background:white;color:#1a1a2e}.dim-row{background:#f9f9fb;border-color:#e5e7eb}.ai-section{background:#fffaf0;border-color:#c9a84c}.ai-card{background:#f9f9fb}.ai-card p,ul{color:#333}}</style></head>`
    + `<body><div class="eyebrow">Cultivating Leadership · Team readiness</div><h1>${(session.frame.name || "Team readiness").replace(/</g,'&lt;')}</h1>`
    + `<p style="font-size:13px;color:#a8c4c7;margin:8px 0 32px">${syn.overall.n_participants} participants · Team avg ${syn.overall.team_avg_score}/${syn.overall.overall_max} (${syn.overall.team_avg_band}) · Range ${syn.overall.score_range.min}–${syn.overall.score_range.max}</p>`
    + `<div class="eyebrow">By dimension</div>${dimRows}${aiBlock}`
    + `<div class="footer"><span>cultivatingleadership.com</span><span>Generated ${date}</span></div></body></html>`;
  triggerDownload(html, "team-readiness.html");
}


// ─── VISION TOOL ────────────────────────────────────────────────────────────

function VisionTool({ isMobile, onBack }) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [phase, setPhase] = useState("input");
  const [polishing, setPolishing] = useState(false);
  const [apiError, setApiError] = useState(null);
  const [done, setDone] = useState(false);
  const cur = VISION_STEPS[step];
  const total = VISION_STEPS.length;
  const curVal = answers[cur.id] || "";
  const allFilled = VISION_STEPS.every(s => (answers[s.id] || "").trim().length > 5);

  async function handlePolish() {
    setPolishing(true); setApiError(null);
    try {
      const prompt = "You are helping a leader write a culture change vision document. Polish and clarify the following raw notes into compelling, purposeful language. Preserve their authentic voice — avoid generic corporate language. Return ONLY valid JSON with exactly these keys: platform, vision, values, strategy, leadership, behaviours. No markdown, no preamble.\n\nRaw input:\n" + JSON.stringify(answers, null, 2);
      const text = await aiCall({ prompt, maxTokens: 1000 });
      const clean = text.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(clean);
      triggerDownload(generateVisionHTML(parsed, true));
      setDone(true);
    } catch (e) { setApiError("Something went wrong. Try the raw download instead."); }
    setPolishing(false);
  }

  if (done) {
    return (
      <div style={{ background: P.bg, color: P.text, ...H.body, minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px" }}>
        <div style={{ fontSize: "48px", marginBottom: "24px" }}>✦</div>
        <h2 style={{ ...H.heading, fontSize: "28px", fontWeight: 600, marginBottom: "12px" }}>Your vision document has been downloaded.</h2>
        <p style={{ fontSize: "15px", color: P.slate, marginBottom: "32px", textAlign: "center", maxWidth: "480px", lineHeight: 1.7 }}>This is a living document. Come back and re-do this exercise as your thinking sharpens.</p>
        <div style={{ display: "flex", gap: "12px" }}>
          <button onClick={() => { setDone(false); setPhase("input"); setStep(0); }} style={{ background: "transparent", border: `1px solid ${P.border}`, color: P.slate, padding: "10px 24px", borderRadius: "4px", cursor: "pointer", fontSize: "12px", letterSpacing: "0.08em", ...H.mono }}>Start again</button>
          <button onClick={onBack} style={{ background: "transparent", border: `1px solid ${P.border}`, color: P.slate, padding: "10px 24px", borderRadius: "4px", cursor: "pointer", fontSize: "12px", letterSpacing: "0.08em", ...H.mono }}>← Back to Tools</button>
        </div>
      </div>
    );
  }

  if (phase === "generate") {
    return (
      <div style={{ background: P.bg, color: P.text, ...H.body, minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px" }}>
        <h2 style={{ ...H.heading, fontSize: "28px", fontWeight: 600, marginBottom: "12px" }}>Your vision is ready.</h2>
        <p style={{ fontSize: "15px", color: P.slate, marginBottom: "32px", textAlign: "center", maxWidth: "480px", lineHeight: 1.7 }}>Download as-is in your own words, or let AI polish the language while preserving your voice.</p>
        {apiError && <p style={{ color: "#c94c4c", fontSize: "13px", marginBottom: "16px" }}>{apiError}</p>}
        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", justifyContent: "center" }}>
          <button onClick={() => { triggerDownload(generateVisionHTML(answers, false)); setDone(true); }} style={{ background: P.gold, border: "none", color: P.bg, padding: "12px 28px", borderRadius: "4px", cursor: "pointer", fontSize: "13px", letterSpacing: "0.06em", ...H.mono, fontWeight: 500 }}>Download raw</button>
          <button onClick={handlePolish} disabled={polishing} style={{ background: "transparent", border: `1px solid ${P.gold}`, color: P.gold, padding: "12px 28px", borderRadius: "4px", cursor: polishing ? "wait" : "pointer", fontSize: "13px", letterSpacing: "0.06em", ...H.mono, opacity: polishing ? 0.5 : 1 }}>{polishing ? "Polishing..." : "AI-polish & download"}</button>
        </div>
        <button onClick={() => setPhase("input")} style={{ marginTop: "24px", background: "none", border: "none", color: P.textDim, cursor: "pointer", fontSize: "12px", ...H.mono }}>← Go back and edit</button>
      </div>
    );
  }

  const NavBtn = ({ onClick, label }) => (
    <button onClick={onClick} style={{ background: "transparent", border: `1px solid ${P.border}`, color: P.slate, padding: "10px 24px", borderRadius: "4px", cursor: "pointer", fontSize: "12px", letterSpacing: "0.08em", ...H.mono }}>{label}</button>
  );

  return (
    <div style={{ background: P.bg, color: P.text, ...H.body, minHeight: "100vh" }}>
      <div style={{ background: P.surface, borderBottom: `1px solid ${P.border}`, padding: isMobile ? "16px 20px" : "20px 40px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <button onClick={onBack} style={{ background: "none", border: "none", color: P.slate, cursor: "pointer", fontSize: "12px", letterSpacing: "0.08em", ...H.mono }}>← Tools</button>
        <div style={{ fontSize: "10px", letterSpacing: "0.15em", color: P.goldDim, textTransform: "uppercase", ...H.mono }}>Step {step + 1} of {total}</div>
        <div style={{ width: "60px" }} />
      </div>

      {/* Progress bar */}
      <div style={{ height: "3px", background: P.border }}>
        <div style={{ height: "100%", width: `${((step + 1) / total) * 100}%`, background: P.gold, transition: "width 0.3s ease" }} />
      </div>

      <div style={{ maxWidth: "720px", margin: "0 auto", padding: isMobile ? "28px 20px 60px" : "48px 32px 80px" }}>
        <div style={{ fontSize: "10px", letterSpacing: "0.22em", textTransform: "uppercase", color: P.goldDim, marginBottom: "8px", ...H.mono }}>{cur.subtitle}</div>
        <h2 style={{ ...H.heading, fontSize: isMobile ? "22px" : "28px", fontWeight: 600, color: P.text, lineHeight: 1.2, marginBottom: "20px" }}>{cur.label}</h2>

        <p style={{ fontSize: "15px", color: P.slate, lineHeight: 1.8, marginBottom: "8px" }}>{cur.question}</p>
        <p style={{ fontSize: "12px", color: P.goldDim, lineHeight: 1.6, marginBottom: "20px", fontStyle: "italic" }}>Try this: {cur.prompt}</p>

        <textarea
          value={curVal}
          onChange={e => setAnswers(a => ({ ...a, [cur.id]: e.target.value }))}
          placeholder={cur.placeholder}
          rows={8}
          style={{ width: "100%", background: P.surface, border: `1px solid ${P.border}`, borderRadius: "4px", padding: "16px", color: P.text, fontSize: "14px", lineHeight: 1.75, fontFamily: "'DM Sans',sans-serif", resize: "vertical", outline: "none" }}
          onFocus={e => { e.target.style.borderColor = P.gold; }}
          onBlur={e => { e.target.style.borderColor = P.border; }}
        />

        <p style={{ fontSize: "11px", color: P.textDim, marginTop: "8px", lineHeight: 1.5 }}>{cur.hint}</p>

        <div style={{ display: "flex", justifyContent: "space-between", marginTop: "32px" }}>
          <NavBtn onClick={() => step > 0 ? setStep(s => s - 1) : onBack()} label={step === 0 ? "← Tools" : "← Previous"} />
          {step < total - 1
            ? <button onClick={() => setStep(s => s + 1)} style={{
                background: curVal.trim().length > 5 ? P.gold : "transparent",
                border: `1px solid ${curVal.trim().length > 5 ? P.gold : P.border}`,
                color: curVal.trim().length > 5 ? P.bg : P.textDim,
                padding: "10px 28px", borderRadius: "4px", cursor: "pointer",
                fontSize: "12px", letterSpacing: "0.08em", ...H.mono, transition: "all 0.2s" }}>Next →</button>
            : <button onClick={() => setPhase("generate")} disabled={!allFilled} style={{
                background: allFilled ? P.gold : "transparent",
                border: `1px solid ${allFilled ? P.gold : P.border}`,
                color: allFilled ? P.bg : P.textDim,
                padding: "10px 28px", borderRadius: "4px", cursor: allFilled ? "pointer" : "default",
                fontSize: "12px", letterSpacing: "0.08em", ...H.mono }}>Generate my vision →</button>
          }
        </div>
      </div>
    </div>
  );
}

// ─── READINESS TOOL ─────────────────────────────────────────────────────────

function ReadinessTool({ isMobile, onBack, initialView, initialJoinCode, initialViewCode }) {
  // ─── View state ───
  const [view, setView] = useState(initialView || "mode-chooser");
  // mode-chooser, solo-assess, solo-results,
  // facil-setup, facil-share, facil-dashboard, facil-synthesis, facil-delete-confirm,
  // part-join, part-assess, part-thanks, public-synthesis

  // ─── Shared assessment state ───
  const [scores, setScores] = useState({});
  const LABELS = ["Strongly disagree", "Somewhat disagree", "Somewhat agree", "Strongly agree"];

  // ─── Solo state ───
  const [soloAiOn, setSoloAiOn] = useState(true);
  const [soloCommentary, setSoloCommentary] = useState(null);
  const [soloCommentaryLoading, setSoloCommentaryLoading] = useState(false);
  const [soloCommentaryError, setSoloCommentaryError] = useState(null);

  // ─── Facilitator state ───
  const [frame, setFrame] = useState({ name: "", context: "", participants: "", deadline: "" });
  const [groupAiOn, setGroupAiOn] = useState(true);
  const [session, setSession] = useState(null);
  const [codeCopied, setCodeCopied] = useState(false);
  const [urlCopied, setUrlCopied] = useState(false);
  const [resultsUrlCopied, setResultsUrlCopied] = useState(false);
  const [synthesisLoading, setSynthesisLoading] = useState(false);
  const [synthesisError, setSynthesisError] = useState(null);

  // ─── Participant state ───
  const [joinCode, setJoinCode] = useState(initialJoinCode || "");
  const [partName, setPartName] = useState("");
  const [joinError, setJoinError] = useState(null);
  const [joinedSession, setJoinedSession] = useState(null);

  // Fetch read-only session when arriving via ?view=CODE (public-synthesis).
  useEffect(() => {
    if (!initialViewCode) return;
    let cancelled = false;
    (async () => {
      try {
        const s = await readinessStorage.getSession(initialViewCode.trim().toLowerCase());
        if (cancelled) return;
        if (!s) { setJoinError("Session not found. Check the link with whoever shared it."); return; }
        setSession(s);
      } catch (e) {
        if (!cancelled) setJoinError(e.message || "Could not load shared results.");
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialViewCode]);

  // ─── Derived ───
  function totalFor(dim, sm) {
    const m = sm || scores;
    return dim.questions.reduce((s, _, i) => s + (m[dim.id + "_" + i] || 0), 0);
  }
  const allAnswered = READINESS_DIMS.every(d => d.questions.every((_, i) => scores[d.id + "_" + i]));
  function setScore(dimId, qi, val) { setScores(s => ({ ...s, [dimId + "_" + qi]: val })); }

  // ─── Handlers ───
  function refreshSession() {
    if (!session) return;
    readinessStorage.getSession(session.sessionCode).then(s => { if (s) setSession(s); });
  }

  async function handleCreateSession() {
    if (!frame.name.trim()) return;
    const newSession = await readinessStorage.createSession(frame, groupAiOn);
    setSession(newSession);
    setView("facil-share");
  }

  async function handleSoloSubmit() {
    setView("solo-results");
    if (soloAiOn) {
      setSoloCommentaryLoading(true);
      setSoloCommentaryError(null);
      try {
        const result = await aiSoloCommentary(scores, READINESS_DIMS);
        setSoloCommentary(result);
      } catch (e) {
        setSoloCommentaryError("AI commentary unavailable in this preview. Your results above are complete on their own.");
      }
      setSoloCommentaryLoading(false);
    }
  }

  async function handleJoinSession() {
    setJoinError(null);
    if (!joinCode.trim() || !partName.trim()) {
      setJoinError("Please enter both the session code and your name.");
      return;
    }
    const s = await readinessStorage.getSession(joinCode.trim().toLowerCase());
    if (!s) {
      setJoinError("Session not found in this browser. Check the code with your facilitator. (Real cross-device group mode arrives when this ports to InciteU.)");
      return;
    }
    setJoinedSession(s);
    setScores({});
    setView("part-assess");
  }

  async function handleParticipantSubmit() {
    if (!joinedSession) return;
    await readinessStorage.contribute(joinedSession.sessionCode, partName.trim(), scores);
    setView("part-thanks");
  }

  async function handleRunSynthesis() {
    if (!session || session.contributions.length < 2) return;
    setSynthesisLoading(true);
    setSynthesisError(null);
    const deterministic = computeReadinessSynthesis(session.contributions, READINESS_DIMS);
    let aiPart = null;
    if (session.aiOn) {
      try {
        aiPart = await aiReadinessSynthesis(session, READINESS_DIMS);
      } catch (e) {
        setSynthesisError("AI synthesis unavailable in this preview. Showing data-only synthesis below — still useful.");
      }
    }
    const fullSynthesis = { ...deterministic, ai: aiPart };
    await readinessStorage.saveSynthesis(session.sessionCode, fullSynthesis);
    setSession(s => ({ ...s, synthesis: fullSynthesis }));
    setSynthesisLoading(false);
    setView("facil-synthesis");
  }

  async function handleDeleteSession() {
    if (!session) return;
    await readinessStorage.deleteSession(session.sessionCode);
    setSession(null);
    setFrame({ name: "", context: "", participants: "", deadline: "" });
    setScores({});
    setView("mode-chooser");
  }

  function copyCodeToClipboard() {
    if (!session) return;
    try { navigator.clipboard.writeText(session.sessionCode); setCodeCopied(true); setTimeout(() => setCodeCopied(false), 2000); } catch (e) {}
  }
  function participantUrlFor(code) {
    if (typeof window === "undefined") return "";
    return `${window.location.origin}${window.location.pathname}?join=${encodeURIComponent(code)}`;
  }
  function resultsUrlFor(code) {
    if (typeof window === "undefined") return "";
    return `${window.location.origin}${window.location.pathname}?view=${encodeURIComponent(code)}`;
  }
  function copyParticipantUrl() {
    if (!session) return;
    try { navigator.clipboard.writeText(participantUrlFor(session.sessionCode)); setUrlCopied(true); setTimeout(() => setUrlCopied(false), 2000); } catch (e) {}
  }
  function copyResultsUrl() {
    if (!session) return;
    try { navigator.clipboard.writeText(resultsUrlFor(session.sessionCode)); setResultsUrlCopied(true); setTimeout(() => setResultsUrlCopied(false), 2000); } catch (e) {}
  }

  // ─── Shared chrome bits ───
  const headerBar = (backLabel, backFn, eyebrow) => (
    <div style={{ background: P.surface, borderBottom: `1px solid ${P.border}`, padding: isMobile ? "16px 20px" : "20px 40px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
      <button onClick={backFn} style={{ background: "none", border: "none", color: P.slate, cursor: "pointer", fontSize: "12px", letterSpacing: "0.08em", ...H.mono }}>← {backLabel}</button>
      <div style={{ fontSize: "10px", letterSpacing: "0.15em", color: P.goldDim, textTransform: "uppercase", ...H.mono }}>{eyebrow}</div>
      <div style={{ width: "80px" }} />
    </div>
  );

  // ──────────────────────────────────────────────────────────────────────────
  // mode-chooser
  // ──────────────────────────────────────────────────────────────────────────
  if (view === "mode-chooser") {
    const modes = [
      { id: "solo", title: "Solo", desc: "Take the assessment alone. See where you sit across the six dimensions.", goTo: "solo-assess", icon: "◉" },
      { id: "join", title: "Join a group", desc: "Your team is running this together. Add your voice.", goTo: "part-join", icon: "→" },
      { id: "facil", title: "Run a group", desc: "Set up a team session. Everyone takes the assessment independently; you see where the team agrees and disagrees.", goTo: "facil-setup", icon: "◇" },
    ];
    return (
      <div style={{ background: P.bg, color: P.text, ...H.body, minHeight: "100vh" }}>
        {headerBar("Tools", onBack, "Readiness self-assessment")}
        <div style={{ maxWidth: "720px", margin: "0 auto", padding: isMobile ? "32px 20px 60px" : "60px 32px 80px" }}>
          <div style={{ fontSize: "10px", letterSpacing: "0.22em", textTransform: "uppercase", color: P.goldDim, marginBottom: "12px", ...H.mono }}>Choose your mode</div>
          <h2 style={{ ...H.heading, fontSize: isMobile ? "26px" : "32px", fontWeight: 600, lineHeight: 1.12, marginBottom: "12px" }}>How are you taking this?</h2>
          <p style={{ fontSize: "14px", color: P.slate, lineHeight: 1.8, marginBottom: "40px", maxWidth: "560px" }}>The assessment is the same in every mode. What changes is what you do with the results.</p>
          <div style={{ display: "grid", gap: "12px" }}>
            {modes.map(m => {
              const isSolo = m.id === "solo";
              const baseBg = isSolo ? P.whoFaint : P.surface;
              const baseBorder = isSolo ? P.who : P.border;
              const hoverBorder = isSolo ? P.who : P.gold;
              const accentColor = isSolo ? P.who : P.gold;
              return (
                <button key={m.id} onClick={() => setView(m.goTo)} style={{
                  background: baseBg, border: `1px solid ${baseBorder}`, borderRadius: "6px",
                  padding: isMobile ? "20px" : "24px 28px", cursor: "pointer", textAlign: "left",
                  transition: "border-color 0.15s, background 0.15s", color: P.text,
                  fontFamily: "'DM Sans',sans-serif",
                }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = hoverBorder; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = baseBorder; }}>
                  <div style={{ display: "flex", alignItems: "baseline", gap: "12px", marginBottom: "6px" }}>
                    <span style={{ color: accentColor, fontSize: "16px" }}>{m.icon}</span>
                    <div style={{ ...H.heading, fontSize: "18px", fontWeight: 600 }}>{m.title}</div>
                  </div>
                  <div style={{ fontSize: "13px", color: P.slate, lineHeight: 1.7, paddingLeft: "28px" }}>{m.desc}</div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // ──────────────────────────────────────────────────────────────────────────
  // assessment (shared by solo-assess and part-assess)
  // ──────────────────────────────────────────────────────────────────────────
  if (view === "solo-assess" || view === "part-assess") {
    const isPart = view === "part-assess";
    const backLabel = "Back";
    const backFn = isPart ? () => { setView("part-join"); setScores({}); } : () => setView("mode-chooser");
    const onSubmit = isPart ? handleParticipantSubmit : handleSoloSubmit;
    const submitLabel = isPart ? "Submit my answers →" : "See my results →";
    return (
      <div style={{ background: P.bg, color: P.text, ...H.body, minHeight: "100vh" }}>
        {headerBar(backLabel, backFn, isPart ? `Joining: ${joinedSession?.frame?.name || joinedSession?.sessionCode || ""}` : "Self-assessment · Solo")}
        {isPart && joinedSession && (
          <div style={{ background: joinedSession.aiOn ? `${P.gold}15` : P.surface, borderBottom: `1px solid ${P.border}`, padding: "10px 20px", textAlign: "center", fontSize: "11px", color: joinedSession.aiOn ? P.gold : P.slate, ...H.mono, letterSpacing: "0.06em" }}>
            AI synthesis is {joinedSession.aiOn ? "ON" : "OFF"} for this session · Your name will appear as "{partName}" in the facilitator's view
          </div>
        )}
        <div style={{ maxWidth: "720px", margin: "0 auto", padding: isMobile ? "28px 20px 60px" : "48px 32px 80px" }}>
          <div style={{ fontSize: "10px", letterSpacing: "0.22em", textTransform: "uppercase", color: P.goldDim, marginBottom: "12px", ...H.mono }}>Self-assessment</div>
          <h2 style={{ ...H.heading, fontSize: isMobile ? "24px" : "32px", fontWeight: 600, color: P.text, lineHeight: 1.12, marginBottom: "12px" }}>How ready are we, really?</h2>
          <p style={{ fontSize: "14px", color: P.slate, lineHeight: 1.8, marginBottom: isPart ? "40px" : "20px", maxWidth: "560px" }}>Rate each statement honestly — not how you wish things were, but how they actually are. There are no wrong answers. This is a mirror, not a test.</p>

          {!isPart && (
            <label style={{ display: "inline-flex", alignItems: "center", gap: "10px", cursor: "pointer", marginBottom: "32px", fontSize: "12px", color: P.slate, ...H.mono, letterSpacing: "0.06em" }}>
              <input type="checkbox" checked={soloAiOn} onChange={(e) => setSoloAiOn(e.target.checked)} style={{ accentColor: P.gold, width: "16px", height: "16px", cursor: "pointer" }} />
              Add AI commentary on my results
            </label>
          )}

          {READINESS_DIMS.map(d => (
            <div key={d.id} style={{ marginBottom: "40px" }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: "12px", marginBottom: "6px", paddingBottom: "12px", borderBottom: `1px solid ${P.border}` }}>
                <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: d.color, flexShrink: 0, marginBottom: "2px" }} />
                <div>
                  <div style={{ ...H.heading, fontSize: "17px", fontWeight: 600, color: P.text, lineHeight: 1.2 }}>{d.label}</div>
                  <div style={{ fontSize: "12px", color: P.slate, fontStyle: "italic", marginTop: "2px" }}>{d.desc}</div>
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "16px", paddingTop: "8px" }}>
                {d.questions.map((q, qi) => {
                  const key = d.id + "_" + qi;
                  const val = scores[key] || 0;
                  return (
                    <div key={qi}>
                      <p style={{ fontSize: "13px", color: P.slate, lineHeight: 1.7, marginBottom: "10px" }}>{q}</p>
                      <div style={{ display: "flex", gap: "6px", flexWrap: isMobile ? "wrap" : "nowrap" }}>
                        {LABELS.map((lbl, li) => {
                          const v = li + 1;
                          const isActive = val === v;
                          return (
                            <button key={li} onClick={() => setScore(d.id, qi, v)} style={{
                              flex: 1, padding: "8px 4px", border: `1px solid ${isActive ? d.color : P.border}`,
                              borderRadius: "4px", cursor: "pointer",
                              background: isActive ? d.color + "22" : "transparent",
                              color: isActive ? d.color : P.textDim,
                              fontSize: isMobile ? "10px" : "11px", lineHeight: 1.3, letterSpacing: "0.04em",
                              transition: "all 0.15s", textAlign: "center",
                              minWidth: isMobile ? "45%" : "auto", fontFamily: "'DM Sans',sans-serif"
                            }}>{lbl}</button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          <div style={{ display: "flex", justifyContent: "space-between", marginTop: "20px", flexWrap: "wrap", gap: "12px" }}>
            <button onClick={backFn} style={{ background: "transparent", border: `1px solid ${P.border}`, color: P.slate, padding: "10px 24px", borderRadius: "4px", cursor: "pointer", fontSize: "12px", letterSpacing: "0.08em", ...H.mono }}>← Back</button>
            <button onClick={onSubmit} disabled={!allAnswered} style={{
              background: allAnswered ? P.gold : "transparent",
              border: `1px solid ${allAnswered ? P.gold : P.border}`,
              color: allAnswered ? P.bg : P.textDim,
              padding: "10px 28px", borderRadius: "4px", cursor: allAnswered ? "pointer" : "default",
              fontSize: "12px", letterSpacing: "0.08em", ...H.mono
            }}>{submitLabel}</button>
          </div>
        </div>
      </div>
    );
  }

  // ──────────────────────────────────────────────────────────────────────────
  // solo-results
  // ──────────────────────────────────────────────────────────────────────────
  if (view === "solo-results") {
    const overallScore = READINESS_DIMS.reduce((s, d) => s + totalFor(d), 0);
    const overallMax = READINESS_DIMS.length * 12;
    const overall = bandFor(overallScore, overallMax);
    return (
      <div style={{ background: P.bg, color: P.text, ...H.body, minHeight: "100vh" }}>
        {headerBar("Edit answers", () => setView("solo-assess"), "Solo · Results")}
        <div style={{ maxWidth: "800px", margin: "0 auto", padding: isMobile ? "28px 20px 60px" : "48px 32px 80px" }}>
          <div style={{ background: overall.bg, border: `1px solid ${overall.color}44`, borderRadius: "6px", padding: "28px", marginBottom: "40px" }}>
            <div style={{ fontSize: "10px", letterSpacing: "0.22em", textTransform: "uppercase", color: overall.color, ...H.mono, marginBottom: "8px" }}>Overall readiness</div>
            <div style={{ display: "flex", alignItems: "baseline", flexWrap: "wrap" }}>
              <span style={{ ...H.heading, fontSize: "36px", fontWeight: 600, color: overall.color, marginRight: "12px" }}>{overallScore} / {overallMax}</span>
              <span style={{ fontSize: "14px", letterSpacing: "0.08em", textTransform: "uppercase", color: overall.color, ...H.mono }}>{overall.label}</span>
            </div>
            <p style={{ fontSize: "14px", color: P.slate, lineHeight: 1.7, marginTop: "12px" }}>
              {overall.label === "Working well" ? "You have strong conditions across most dimensions. The work ahead is about sustaining this foundation and moving deliberately into execution."
                : overall.label === "Foundations emerging" ? "You have real foundations to build on — and some important gaps to address first. Naming those gaps now is itself a form of readiness."
                : "Significant conditions are absent across multiple dimensions. This is important information — not a reason to stop, but a reason to be very deliberate about what you build first."}
            </p>
          </div>
          <div style={{ fontSize: "10px", letterSpacing: "0.22em", textTransform: "uppercase", color: P.textDim, marginBottom: "20px", ...H.mono }}>By dimension</div>
          {READINESS_DIMS.map(d => {
            const score = totalFor(d);
            const band = bandFor(score, 12);
            const pct = Math.round((score / 12) * 100);
            const commentary = soloCommentary?.by_label?.[d.label];
            return (
              <div key={d.id} style={{ background: P.surface, border: `1px solid ${P.border}`, borderRadius: "6px", padding: "20px", marginBottom: "12px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                  <div>
                    <div style={{ ...H.heading, fontSize: "17px", fontWeight: 600 }}>{d.label}</div>
                    <div style={{ fontSize: "11px", color: P.slate, marginTop: "2px" }}>{d.desc}</div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <span style={{ ...H.mono, fontSize: "13px", color: band.color }}>{score}/12</span>
                    <span style={{ fontSize: "11px", borderRadius: "3px", padding: "2px 10px", ...H.mono, letterSpacing: "0.06em", border: `1px solid ${band.color}44`, color: band.color, background: band.bg }}>{band.label}</span>
                  </div>
                </div>
                <div style={{ height: "4px", background: P.border, borderRadius: "2px" }}>
                  <div style={{ height: "100%", width: `${pct}%`, background: band.color, borderRadius: "2px", transition: "width 0.5s ease" }} />
                </div>
                {commentary && (
                  <div style={{ marginTop: "16px", paddingTop: "16px", borderTop: `1px solid ${P.border}`, fontSize: "13px", color: P.slate, lineHeight: 1.7, fontStyle: "italic" }}>{commentary}</div>
                )}
              </div>
            );
          })}

          {soloCommentaryLoading && (
            <div style={{ marginTop: "20px", padding: "16px", background: P.surface, border: `1px solid ${P.border}`, borderRadius: "6px", fontSize: "13px", color: P.slate, fontStyle: "italic", textAlign: "center" }}>AI is reading your results…</div>
          )}
          {soloCommentaryError && (
            <div style={{ marginTop: "20px", padding: "16px", background: `${P.gold}11`, border: `1px solid ${P.gold}44`, borderRadius: "6px", fontSize: "13px", color: P.gold }}>{soloCommentaryError}</div>
          )}

          <div style={{ display: "flex", gap: "12px", marginTop: "32px", flexWrap: "wrap" }}>
            <button onClick={() => downloadReadinessResults(READINESS_DIMS, totalFor)} style={{ background: P.gold, border: "none", color: P.bg, padding: "12px 28px", borderRadius: "4px", cursor: "pointer", fontSize: "13px", letterSpacing: "0.06em", ...H.mono, fontWeight: 500 }}>Download results</button>
            <button onClick={() => { setScores({}); setSoloCommentary(null); setSoloCommentaryError(null); setView("mode-chooser"); }} style={{ background: "transparent", border: `1px solid ${P.border}`, color: P.slate, padding: "12px 28px", borderRadius: "4px", cursor: "pointer", fontSize: "13px", letterSpacing: "0.06em", ...H.mono }}>Start over</button>
            <button onClick={onBack} style={{ background: "transparent", border: `1px solid ${P.border}`, color: P.slate, padding: "12px 28px", borderRadius: "4px", cursor: "pointer", fontSize: "13px", letterSpacing: "0.06em", ...H.mono }}>← Back to Tools</button>
          </div>
        </div>
      </div>
    );
  }

  // ──────────────────────────────────────────────────────────────────────────
  // facil-setup
  // ──────────────────────────────────────────────────────────────────────────
  if (view === "facil-setup") {
    const inputBase = { width: "100%", background: P.bg, color: P.text, border: `1px solid ${P.border}`, borderRadius: "4px", padding: "12px 14px", fontSize: "14px", fontFamily: "'DM Sans',sans-serif", marginBottom: "20px", outline: "none" };
    const labelBase = { display: "block", fontSize: "11px", letterSpacing: "0.12em", textTransform: "uppercase", color: P.goldDim, ...H.mono, marginBottom: "6px" };
    return (
      <div style={{ background: P.bg, color: P.text, ...H.body, minHeight: "100vh" }}>
        {headerBar("Back", () => setView("mode-chooser"), "Run a group · Setup")}
        <div style={{ maxWidth: "640px", margin: "0 auto", padding: isMobile ? "32px 20px 60px" : "48px 32px 80px" }}>
          <div style={{ fontSize: "10px", letterSpacing: "0.22em", textTransform: "uppercase", color: P.goldDim, marginBottom: "12px", ...H.mono }}>Set up your session</div>
          <h2 style={{ ...H.heading, fontSize: isMobile ? "24px" : "30px", fontWeight: 600, lineHeight: 1.15, marginBottom: "12px" }}>Frame the session</h2>
          <p style={{ fontSize: "14px", color: P.slate, lineHeight: 1.8, marginBottom: "32px" }}>You'll get a session code to share with the team. Everyone takes the assessment independently.</p>

          <label style={labelBase}>Session name *</label>
          <input type="text" value={frame.name} onChange={(e) => setFrame(f => ({ ...f, name: e.target.value }))} placeholder="Q2 leadership offsite" style={inputBase} />

          <label style={labelBase}>Context for the team (optional)</label>
          <textarea value={frame.context} onChange={(e) => setFrame(f => ({ ...f, context: e.target.value }))} placeholder="1-2 sentences. Helps AI interpret the divergences." rows={3} style={{ ...inputBase, resize: "vertical", lineHeight: 1.6 }} />

          <label style={labelBase}>Who's participating (optional)</label>
          <textarea value={frame.participants} onChange={(e) => setFrame(f => ({ ...f, participants: e.target.value }))} placeholder="Just for your reference — names you're expecting." rows={2} style={{ ...inputBase, resize: "vertical", lineHeight: 1.6 }} />

          <label style={labelBase}>Decision deadline (optional)</label>
          <input type="text" value={frame.deadline} onChange={(e) => setFrame(f => ({ ...f, deadline: e.target.value }))} placeholder="When does this conversation need to happen?" style={inputBase} />

          <label style={{ display: "flex", alignItems: "flex-start", gap: "10px", cursor: "pointer", margin: "8px 0 36px", padding: "16px", background: P.surface, border: `1px solid ${P.border}`, borderRadius: "4px" }}>
            <input type="checkbox" checked={groupAiOn} onChange={(e) => setGroupAiOn(e.target.checked)} style={{ accentColor: P.gold, width: "16px", height: "16px", cursor: "pointer", marginTop: "2px" }} />
            <div>
              <div style={{ fontSize: "13px", color: P.text, marginBottom: "4px", fontWeight: 500 }}>Add AI synthesis when I pull contributions</div>
              <div style={{ fontSize: "12px", color: P.slate, lineHeight: 1.6 }}>AI interprets divergences, names patterns, and suggests conversation prompts. Off = pure data view (scores, spread, names per dimension).</div>
            </div>
          </label>

          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
            <button onClick={handleCreateSession} disabled={!frame.name.trim()} style={{
              background: frame.name.trim() ? P.gold : "transparent",
              border: `1px solid ${frame.name.trim() ? P.gold : P.border}`,
              color: frame.name.trim() ? P.bg : P.textDim,
              padding: "12px 28px", borderRadius: "4px", cursor: frame.name.trim() ? "pointer" : "default",
              fontSize: "13px", letterSpacing: "0.06em", ...H.mono, fontWeight: 500,
            }}>Create session →</button>
            <button onClick={() => setView("mode-chooser")} style={{ background: "transparent", border: `1px solid ${P.border}`, color: P.slate, padding: "12px 28px", borderRadius: "4px", cursor: "pointer", fontSize: "13px", letterSpacing: "0.06em", ...H.mono }}>Cancel</button>
          </div>
        </div>
      </div>
    );
  }

  // ──────────────────────────────────────────────────────────────────────────
  // facil-share
  // ──────────────────────────────────────────────────────────────────────────
  if (view === "facil-share" && session) {
    return (
      <div style={{ background: P.bg, color: P.text, ...H.body, minHeight: "100vh" }}>
        {headerBar("Dashboard", () => setView("facil-dashboard"), "Session created")}
        <div style={{ maxWidth: "640px", margin: "0 auto", padding: isMobile ? "60px 20px" : "80px 32px", textAlign: "center" }}>
          <div style={{ fontSize: "10px", letterSpacing: "0.22em", textTransform: "uppercase", color: P.goldDim, marginBottom: "16px", ...H.mono }}>Share this code with your team</div>
          <div style={{ ...H.heading, fontSize: isMobile ? "44px" : "60px", fontWeight: 600, color: P.gold, marginBottom: "8px", letterSpacing: "0.02em" }}>{session.sessionCode}</div>
          <p style={{ fontSize: "13px", color: P.slate, marginBottom: "32px" }}>Anyone with this code can submit their reading. AI synthesis is {session.aiOn ? "ON" : "OFF"} for this session.</p>
          <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap", marginBottom: "24px" }}>
            <button onClick={copyCodeToClipboard} style={{ background: P.gold, border: "none", color: P.bg, padding: "12px 28px", borderRadius: "4px", cursor: "pointer", fontSize: "13px", letterSpacing: "0.06em", ...H.mono, fontWeight: 500 }}>{codeCopied ? "Copied ✓" : "Copy code"}</button>
            <button onClick={() => setView("facil-dashboard")} style={{ background: "transparent", border: `1px solid ${P.border}`, color: P.slate, padding: "12px 28px", borderRadius: "4px", cursor: "pointer", fontSize: "13px", letterSpacing: "0.06em", ...H.mono }}>Go to dashboard →</button>
          </div>
          {/* Direct participant link — works cross-device on InciteU */}
          <div style={{ padding: "16px 20px", background: P.surface, border: `1px solid ${P.border}`, borderRadius: "6px", marginBottom: "24px", textAlign: "left" }}>
            <div style={{ fontSize: "10px", letterSpacing: "0.18em", textTransform: "uppercase", color: P.goldDim, marginBottom: "8px", ...H.mono }}>Or share this link</div>
            <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
              <code style={{ flex: 1, minWidth: 0, fontSize: "12px", color: P.text, background: P.bg, padding: "8px 12px", borderRadius: "3px", border: `1px solid ${P.border}`, ...H.mono, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{participantUrlFor(session.sessionCode)}</code>
              <button onClick={copyParticipantUrl} style={{ background: "transparent", border: `1px solid ${P.gold}`, color: P.gold, padding: "8px 14px", borderRadius: "4px", cursor: "pointer", fontSize: "11px", letterSpacing: "0.08em", ...H.mono, whiteSpace: "nowrap" }}>{urlCopied ? "Copied ✓" : "Copy link"}</button>
            </div>
            <div style={{ fontSize: "11px", color: P.textDim, marginTop: "8px", fontStyle: "italic" }}>Opens directly in the Join screen with the code pre-filled.</div>
          </div>
          <div style={{ padding: "20px", background: P.surface, border: `1px solid ${P.border}`, borderRadius: "6px", textAlign: "left", fontSize: "13px", color: P.slate, lineHeight: 1.7 }}>
            <div style={{ fontSize: "11px", letterSpacing: "0.12em", textTransform: "uppercase", color: P.goldDim, marginBottom: "10px", ...H.mono }}>What participants will see</div>
            They'll choose "Join a group" from the Readiness tool (or follow the link above), enter the code, type their name, and take the same 18-statement assessment. Their answers land on your dashboard in real time.
          </div>
        </div>
      </div>
    );
  }

  // ──────────────────────────────────────────────────────────────────────────
  // facil-dashboard
  // ──────────────────────────────────────────────────────────────────────────
  if (view === "facil-dashboard" && session) {
    const n = session.contributions.length;
    const canSynthesize = n >= 2;
    return (
      <div style={{ background: P.bg, color: P.text, ...H.body, minHeight: "100vh" }}>
        {headerBar("Modes", () => setView("mode-chooser"), `Facilitating: ${session.frame.name}`)}
        <div style={{ maxWidth: "720px", margin: "0 auto", padding: isMobile ? "28px 20px 60px" : "48px 32px 80px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px", marginBottom: "32px" }}>
            <div>
              <div style={{ fontSize: "10px", letterSpacing: "0.22em", textTransform: "uppercase", color: P.goldDim, marginBottom: "8px", ...H.mono }}>Session</div>
              <div style={{ ...H.heading, fontSize: "26px", fontWeight: 600, marginBottom: "4px" }}>{session.frame.name}</div>
              <div style={{ fontSize: "13px", color: P.slate, ...H.mono, letterSpacing: "0.04em" }}>Code: <span style={{ color: P.gold }}>{session.sessionCode}</span> · AI: {session.aiOn ? "ON" : "OFF"}</div>
            </div>
            <button onClick={refreshSession} style={{ background: "transparent", border: `1px solid ${P.border}`, color: P.slate, padding: "8px 16px", borderRadius: "4px", cursor: "pointer", fontSize: "11px", letterSpacing: "0.08em", ...H.mono }}>↻ Refresh</button>
          </div>

          <div style={{ marginBottom: "32px" }}>
            <div style={{ fontSize: "10px", letterSpacing: "0.22em", textTransform: "uppercase", color: P.textDim, marginBottom: "12px", ...H.mono }}>Contributions ({n})</div>
            {n === 0 ? (
              <div style={{ padding: "24px", background: P.surface, border: `1px dashed ${P.border}`, borderRadius: "6px", textAlign: "center", fontSize: "13px", color: P.slate, fontStyle: "italic" }}>
                No one has submitted yet. Share the code <span style={{ color: P.gold, ...H.mono, fontStyle: "normal" }}>{session.sessionCode}</span> with your team.
              </div>
            ) : (
              <div style={{ display: "grid", gap: "8px" }}>
                {session.contributions.map((c, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 18px", background: P.surface, border: `1px solid ${P.border}`, borderRadius: "4px" }}>
                    <div style={{ fontSize: "14px", fontWeight: 500 }}>{c.name}</div>
                    <div style={{ fontSize: "11px", color: P.textDim, ...H.mono }}>submitted {new Date(c.submittedAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {session.frame.participants && (
            <div style={{ marginBottom: "32px", padding: "16px", background: P.surface, border: `1px solid ${P.border}`, borderRadius: "4px" }}>
              <div style={{ fontSize: "10px", letterSpacing: "0.22em", textTransform: "uppercase", color: P.textDim, marginBottom: "8px", ...H.mono }}>Expected participants</div>
              <div style={{ fontSize: "13px", color: P.slate, lineHeight: 1.7, whiteSpace: "pre-wrap" }}>{session.frame.participants}</div>
            </div>
          )}

          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginBottom: "20px" }}>
            <button onClick={handleRunSynthesis} disabled={!canSynthesize || synthesisLoading} style={{
              background: canSynthesize && !synthesisLoading ? P.gold : "transparent",
              border: `1px solid ${canSynthesize && !synthesisLoading ? P.gold : P.border}`,
              color: canSynthesize && !synthesisLoading ? P.bg : P.textDim,
              padding: "12px 28px", borderRadius: "4px",
              cursor: canSynthesize && !synthesisLoading ? "pointer" : "default",
              fontSize: "13px", letterSpacing: "0.06em", ...H.mono, fontWeight: 500,
            }}>{synthesisLoading ? "Synthesizing…" : session.synthesis ? "Re-run synthesis" : `Synthesize (${n} ${n === 1 ? "contribution" : "contributions"})`}</button>
            {session.synthesis && (
              <button onClick={() => setView("facil-synthesis")} style={{ background: "transparent", border: `1px solid ${P.gold}`, color: P.gold, padding: "12px 28px", borderRadius: "4px", cursor: "pointer", fontSize: "13px", letterSpacing: "0.06em", ...H.mono }}>View synthesis →</button>
            )}
            <button onClick={() => setView("facil-share")} style={{ background: "transparent", border: `1px solid ${P.border}`, color: P.slate, padding: "12px 24px", borderRadius: "4px", cursor: "pointer", fontSize: "13px", letterSpacing: "0.06em", ...H.mono }}>Share code</button>
          </div>

          {!canSynthesize && n > 0 && (
            <p style={{ fontSize: "12px", color: P.textDim, fontStyle: "italic" }}>Need at least 2 contributions before synthesis is meaningful.</p>
          )}

          {synthesisError && (
            <div style={{ marginTop: "20px", padding: "14px", background: `${P.gold}11`, border: `1px solid ${P.gold}44`, borderRadius: "4px", fontSize: "13px", color: P.gold }}>{synthesisError}</div>
          )}

          <div style={{ marginTop: "48px", paddingTop: "24px", borderTop: `1px solid ${P.border}` }}>
            <button onClick={() => setView("facil-delete-confirm")} style={{ background: "transparent", border: `1px solid ${P.border}`, color: P.textDim, padding: "8px 16px", borderRadius: "4px", cursor: "pointer", fontSize: "11px", letterSpacing: "0.08em", ...H.mono }}>Delete this session</button>
          </div>
        </div>
      </div>
    );
  }

  // ──────────────────────────────────────────────────────────────────────────
  // facil-delete-confirm
  // ──────────────────────────────────────────────────────────────────────────
  if (view === "facil-delete-confirm" && session) {
    return (
      <div style={{ background: P.bg, color: P.text, ...H.body, minHeight: "100vh" }}>
        {headerBar("Dashboard", () => setView("facil-dashboard"), "Delete session")}
        <div style={{ maxWidth: "560px", margin: "0 auto", padding: isMobile ? "60px 20px" : "80px 32px", textAlign: "center" }}>
          <div style={{ fontSize: "48px", color: "#c94c4c", marginBottom: "16px" }}>!</div>
          <h2 style={{ ...H.heading, fontSize: "26px", fontWeight: 600, marginBottom: "12px" }}>Delete this session?</h2>
          <p style={{ fontSize: "14px", color: P.slate, lineHeight: 1.7, marginBottom: "32px" }}>This will permanently remove the session, all <strong>{session.contributions.length}</strong> contributions, and any synthesis. This cannot be undone.</p>
          <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
            <button onClick={handleDeleteSession} style={{ background: "#c94c4c", border: "none", color: "#fff", padding: "12px 28px", borderRadius: "4px", cursor: "pointer", fontSize: "13px", letterSpacing: "0.06em", ...H.mono, fontWeight: 500 }}>Yes, delete</button>
            <button onClick={() => setView("facil-dashboard")} style={{ background: "transparent", border: `1px solid ${P.border}`, color: P.slate, padding: "12px 28px", borderRadius: "4px", cursor: "pointer", fontSize: "13px", letterSpacing: "0.06em", ...H.mono }}>Cancel</button>
          </div>
        </div>
      </div>
    );
  }

  // ──────────────────────────────────────────────────────────────────────────
  // facil-synthesis
  // ──────────────────────────────────────────────────────────────────────────
  if (view === "facil-synthesis" && session && session.synthesis) {
    const syn = session.synthesis;
    return (
      <div style={{ background: P.bg, color: P.text, ...H.body, minHeight: "100vh" }}>
        {headerBar("Dashboard", () => setView("facil-dashboard"), "Team synthesis")}
        <div style={{ maxWidth: "820px", margin: "0 auto", padding: isMobile ? "28px 20px 60px" : "48px 32px 80px" }}>
          <div style={{ fontSize: "10px", letterSpacing: "0.22em", textTransform: "uppercase", color: P.goldDim, marginBottom: "10px", ...H.mono }}>Team readiness</div>
          <h2 style={{ ...H.heading, fontSize: isMobile ? "26px" : "32px", fontWeight: 600, marginBottom: "8px" }}>{session.frame.name}</h2>
          <p style={{ fontSize: "13px", color: P.slate, marginBottom: "32px", ...H.mono, letterSpacing: "0.04em" }}>
            {syn.overall.n_participants} participants · Team avg {syn.overall.team_avg_score}/{syn.overall.overall_max} ({syn.overall.team_avg_band}) · Range {syn.overall.score_range.min}–{syn.overall.score_range.max}
          </p>

          {/* Per-dimension data — always shown */}
          <div style={{ fontSize: "10px", letterSpacing: "0.22em", textTransform: "uppercase", color: P.textDim, marginBottom: "16px", ...H.mono }}>By dimension</div>
          {syn.by_dimension.map(d => {
            const consensusColor = d.consensus_level === "high" ? "#6b9e7a" : d.consensus_level === "moderate" ? "#c9a84c" : "#c94c4c";
            const consensusLabel = d.consensus_level === "high" ? "High consensus" : d.consensus_level === "moderate" ? "Moderate spread" : "Low consensus";
            return (
              <div key={d.dim_id} style={{ background: P.surface, border: `1px solid ${P.border}`, borderRadius: "6px", padding: "20px", marginBottom: "12px" }}>
                <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", flexWrap: "wrap", gap: "12px", marginBottom: "10px" }}>
                  <div>
                    <div style={{ ...H.heading, fontSize: "17px", fontWeight: 600, color: d.color }}>{d.label}</div>
                    <div style={{ fontSize: "11px", color: P.slate, fontStyle: "italic", marginTop: "2px" }}>{d.desc}</div>
                  </div>
                  <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                    <span style={{ ...H.mono, fontSize: "12px", color: P.slate }}>Avg {d.team_avg}/12</span>
                    <span style={{ ...H.mono, fontSize: "11px", padding: "2px 8px", border: `1px solid ${consensusColor}44`, color: consensusColor, borderRadius: "3px", letterSpacing: "0.06em" }}>{consensusLabel}</span>
                  </div>
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", paddingTop: "10px", borderTop: `1px solid ${P.border}` }}>
                  {d.all_scores.map((p, i) => (
                    <div key={i} style={{ fontSize: "12px", padding: "4px 10px", background: P.bg, border: `1px solid ${d.color}33`, color: d.color, borderRadius: "3px", ...H.mono, letterSpacing: "0.04em" }}>
                      {p.name}: {p.score}/12
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          {/* AI synthesis section — only when AI is on AND succeeded */}
          {syn.ai && (
            <div style={{ marginTop: "40px", padding: "28px", background: `${P.gold}0a`, border: `1px solid ${P.gold}44`, borderRadius: "6px" }}>
              <div style={{ fontSize: "10px", letterSpacing: "0.22em", textTransform: "uppercase", color: P.gold, marginBottom: "12px", ...H.mono }}>AI synthesis</div>

              {syn.ai.the_real_question && (
                <div style={{ marginBottom: "28px" }}>
                  <div style={{ fontSize: "12px", color: P.slate, ...H.mono, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "8px" }}>The real question</div>
                  <p style={{ ...H.heading, fontSize: isMobile ? "18px" : "22px", fontStyle: "italic", lineHeight: 1.5, color: P.text }}>{syn.ai.the_real_question}</p>
                </div>
              )}

              {syn.ai.biggest_divergences && syn.ai.biggest_divergences.length > 0 && (
                <div style={{ marginBottom: "24px" }}>
                  <h3 style={{ ...H.heading, fontSize: "18px", fontWeight: 600, marginBottom: "12px" }}>Biggest divergences</h3>
                  {syn.ai.biggest_divergences.map((b, i) => (
                    <div key={i} style={{ marginBottom: "12px", padding: "16px", background: P.surface, borderRadius: "4px", borderLeft: `3px solid ${P.gold}` }}>
                      <div style={{ ...H.heading, fontSize: "15px", fontWeight: 600, marginBottom: "6px" }}>{b.dim_label}</div>
                      <p style={{ fontSize: "13px", color: P.slate, lineHeight: 1.7, marginBottom: "6px" }}>{b.what_emerged}</p>
                      <p style={{ fontSize: "13px", color: P.slate, lineHeight: 1.7, fontStyle: "italic", marginBottom: "8px" }}>{b.likely_reading}</p>
                      <p style={{ fontSize: "13px", color: P.gold, lineHeight: 1.7, fontWeight: 500 }}>→ {b.conversation_prompt}</p>
                    </div>
                  ))}
                </div>
              )}

              {syn.ai.consensus_areas && syn.ai.consensus_areas.length > 0 && (
                <div style={{ marginBottom: "24px" }}>
                  <h3 style={{ ...H.heading, fontSize: "18px", fontWeight: 600, marginBottom: "12px" }}>Consensus areas</h3>
                  {syn.ai.consensus_areas.map((c, i) => (
                    <div key={i} style={{ marginBottom: "12px", padding: "16px", background: P.surface, borderRadius: "4px", borderLeft: `3px solid ${P.gold}` }}>
                      <div style={{ ...H.heading, fontSize: "15px", fontWeight: 600, marginBottom: "6px" }}>{c.dim_label}</div>
                      <p style={{ fontSize: "13px", color: P.slate, lineHeight: 1.7, marginBottom: "6px" }}>{c.team_view}</p>
                      <p style={{ fontSize: "13px", color: P.slate, lineHeight: 1.7, fontStyle: "italic" }}>{c.implication}</p>
                    </div>
                  ))}
                </div>
              )}

              {syn.ai.what_to_discuss_first && syn.ai.what_to_discuss_first.length > 0 && (
                <div>
                  <h3 style={{ ...H.heading, fontSize: "18px", fontWeight: 600, marginBottom: "12px" }}>What to discuss first</h3>
                  <ul style={{ paddingLeft: "20px", fontSize: "14px", color: P.slate, lineHeight: 1.8 }}>
                    {syn.ai.what_to_discuss_first.map((w, i) => <li key={i} style={{ marginBottom: "6px" }}>{w}</li>)}
                  </ul>
                </div>
              )}
            </div>
          )}

          {!syn.ai && session.aiOn && (
            <div style={{ marginTop: "24px", padding: "16px", background: `${P.gold}11`, border: `1px solid ${P.gold}44`, borderRadius: "4px", fontSize: "13px", color: P.gold }}>
              AI synthesis wasn't available in this preview. The data view above stands on its own. AI synthesis will run automatically when this ports to InciteU.
            </div>
          )}

          {!session.aiOn && (
            <div style={{ marginTop: "24px", padding: "16px", background: P.surface, border: `1px solid ${P.border}`, borderRadius: "4px", fontSize: "13px", color: P.slate, fontStyle: "italic" }}>
              AI synthesis is off for this session. The data view above is the synthesis.
            </div>
          )}

          {/* Share-results read-only link */}
          <div style={{ marginTop: "36px", padding: "16px 20px", background: P.surface, border: `1px solid ${P.border}`, borderRadius: "6px" }}>
            <div style={{ fontSize: "10px", letterSpacing: "0.18em", textTransform: "uppercase", color: P.goldDim, marginBottom: "8px", ...H.mono }}>Share these results (read-only)</div>
            <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
              <code style={{ flex: 1, minWidth: 0, fontSize: "12px", color: P.text, background: P.bg, padding: "8px 12px", borderRadius: "3px", border: `1px solid ${P.border}`, ...H.mono, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{resultsUrlFor(session.sessionCode)}</code>
              <button onClick={copyResultsUrl} style={{ background: "transparent", border: `1px solid ${P.gold}`, color: P.gold, padding: "8px 14px", borderRadius: "4px", cursor: "pointer", fontSize: "11px", letterSpacing: "0.08em", ...H.mono, whiteSpace: "nowrap" }}>{resultsUrlCopied ? "Copied ✓" : "Copy link"}</button>
            </div>
            <div style={{ fontSize: "11px", color: P.textDim, marginTop: "8px", fontStyle: "italic" }}>Anyone with this link can view the synthesis. They cannot re-run, edit, or delete it.</div>
          </div>

          <div style={{ display: "flex", gap: "12px", marginTop: "24px", flexWrap: "wrap" }}>
            <button onClick={() => downloadGroupReadinessResults(session, READINESS_DIMS)} style={{ background: P.gold, border: "none", color: P.bg, padding: "12px 28px", borderRadius: "4px", cursor: "pointer", fontSize: "13px", letterSpacing: "0.06em", ...H.mono, fontWeight: 500 }}>Download report</button>
            <button onClick={handleRunSynthesis} disabled={synthesisLoading} style={{ background: "transparent", border: `1px solid ${P.border}`, color: P.slate, padding: "12px 28px", borderRadius: "4px", cursor: synthesisLoading ? "wait" : "pointer", fontSize: "13px", letterSpacing: "0.06em", ...H.mono, opacity: synthesisLoading ? 0.5 : 1 }}>{synthesisLoading ? "Re-running…" : "Re-run synthesis"}</button>
            <button onClick={() => setView("facil-dashboard")} style={{ background: "transparent", border: `1px solid ${P.border}`, color: P.slate, padding: "12px 28px", borderRadius: "4px", cursor: "pointer", fontSize: "13px", letterSpacing: "0.06em", ...H.mono }}>← Dashboard</button>
          </div>
        </div>
      </div>
    );
  }

  // ──────────────────────────────────────────────────────────────────────────
  // public-synthesis (read-only; reached via ?view=CODE)
  // ──────────────────────────────────────────────────────────────────────────
  if (view === "public-synthesis") {
    if (!session) {
      return (
        <div style={{ background: P.bg, color: P.text, ...H.body, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "40px" }}>
          <div style={{ textAlign: "center", maxWidth: "480px" }}>
            <div style={{ fontSize: "10px", letterSpacing: "0.22em", textTransform: "uppercase", color: P.goldDim, marginBottom: "12px", ...H.mono }}>{joinError ? "Could not load" : "Loading…"}</div>
            <h2 style={{ ...H.heading, fontSize: "22px", fontWeight: 600, marginBottom: "12px" }}>{joinError ? "Results unavailable" : "Fetching results"}</h2>
            <p style={{ fontSize: "14px", color: P.slate, lineHeight: 1.7, marginBottom: "24px" }}>{joinError || "Just a moment."}</p>
            <button onClick={() => { setView("mode-chooser"); setJoinError(null); }} style={{ background: "transparent", border: `1px solid ${P.border}`, color: P.slate, padding: "10px 24px", borderRadius: "4px", cursor: "pointer", fontSize: "12px", letterSpacing: "0.08em", ...H.mono }}>← Back to modes</button>
          </div>
        </div>
      );
    }
    if (!session.synthesis) {
      return (
        <div style={{ background: P.bg, color: P.text, ...H.body, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "40px" }}>
          <div style={{ textAlign: "center", maxWidth: "480px" }}>
            <div style={{ fontSize: "10px", letterSpacing: "0.22em", textTransform: "uppercase", color: P.goldDim, marginBottom: "12px", ...H.mono }}>Not yet available</div>
            <h2 style={{ ...H.heading, fontSize: "22px", fontWeight: 600, marginBottom: "12px" }}>The synthesis hasn't been generated yet</h2>
            <p style={{ fontSize: "14px", color: P.slate, lineHeight: 1.7, marginBottom: "24px" }}>Check back once the facilitator has run synthesis on the session.</p>
            <button onClick={() => setView("mode-chooser")} style={{ background: "transparent", border: `1px solid ${P.border}`, color: P.slate, padding: "10px 24px", borderRadius: "4px", cursor: "pointer", fontSize: "12px", letterSpacing: "0.08em", ...H.mono }}>← Back to modes</button>
          </div>
        </div>
      );
    }
    const syn = session.synthesis;
    return (
      <div style={{ background: P.bg, color: P.text, ...H.body, minHeight: "100vh" }}>
        <div style={{ background: P.surface, borderBottom: `1px solid ${P.border}`, padding: isMobile ? "16px 20px" : "20px 40px", textAlign: "center" }}>
          <div style={{ fontSize: "10px", letterSpacing: "0.15em", color: P.goldDim, textTransform: "uppercase", ...H.mono }}>Shared results · Read-only</div>
        </div>
        <div style={{ maxWidth: "820px", margin: "0 auto", padding: isMobile ? "28px 20px 60px" : "48px 32px 80px" }}>
          <div style={{ fontSize: "10px", letterSpacing: "0.22em", textTransform: "uppercase", color: P.goldDim, marginBottom: "10px", ...H.mono }}>Team readiness</div>
          <h2 style={{ ...H.heading, fontSize: isMobile ? "26px" : "32px", fontWeight: 600, marginBottom: "8px" }}>{session.frame.name}</h2>
          <p style={{ fontSize: "13px", color: P.slate, marginBottom: "32px", ...H.mono, letterSpacing: "0.04em" }}>
            {syn.overall.n_participants} participants · Team avg {syn.overall.team_avg_score}/{syn.overall.overall_max} ({syn.overall.team_avg_band}) · Range {syn.overall.score_range.min}–{syn.overall.score_range.max}
          </p>

          <div style={{ fontSize: "10px", letterSpacing: "0.22em", textTransform: "uppercase", color: P.textDim, marginBottom: "16px", ...H.mono }}>By dimension</div>
          {syn.by_dimension.map(d => {
            const consensusColor = d.consensus_level === "high" ? "#6b9e7a" : d.consensus_level === "moderate" ? "#c9a84c" : "#c94c4c";
            const consensusLabel = d.consensus_level === "high" ? "High consensus" : d.consensus_level === "moderate" ? "Moderate spread" : "Low consensus";
            return (
              <div key={d.dim_id} style={{ background: P.surface, border: `1px solid ${P.border}`, borderRadius: "6px", padding: "20px", marginBottom: "12px" }}>
                <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", flexWrap: "wrap", gap: "12px", marginBottom: "10px" }}>
                  <div>
                    <div style={{ ...H.heading, fontSize: "17px", fontWeight: 600, color: d.color }}>{d.label}</div>
                    <div style={{ fontSize: "11px", color: P.slate, fontStyle: "italic", marginTop: "2px" }}>{d.desc}</div>
                  </div>
                  <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                    <span style={{ ...H.mono, fontSize: "12px", color: P.slate }}>Avg {d.team_avg}/12</span>
                    <span style={{ ...H.mono, fontSize: "11px", padding: "2px 8px", border: `1px solid ${consensusColor}44`, color: consensusColor, borderRadius: "3px", letterSpacing: "0.06em" }}>{consensusLabel}</span>
                  </div>
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", paddingTop: "10px", borderTop: `1px solid ${P.border}` }}>
                  {d.all_scores.map((p, i) => (
                    <div key={i} style={{ fontSize: "12px", padding: "4px 10px", background: P.bg, border: `1px solid ${d.color}33`, color: d.color, borderRadius: "3px", ...H.mono, letterSpacing: "0.04em" }}>
                      {p.name}: {p.score}/12
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          {syn.ai && (
            <div style={{ marginTop: "40px", padding: "28px", background: `${P.gold}0a`, border: `1px solid ${P.gold}44`, borderRadius: "6px" }}>
              <div style={{ fontSize: "10px", letterSpacing: "0.22em", textTransform: "uppercase", color: P.gold, marginBottom: "12px", ...H.mono }}>AI synthesis</div>
              {syn.ai.the_real_question && (
                <div style={{ marginBottom: "28px" }}>
                  <div style={{ fontSize: "12px", color: P.slate, ...H.mono, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "8px" }}>The real question</div>
                  <p style={{ ...H.heading, fontSize: isMobile ? "18px" : "22px", fontStyle: "italic", lineHeight: 1.5, color: P.text }}>{syn.ai.the_real_question}</p>
                </div>
              )}
              {syn.ai.biggest_divergences && syn.ai.biggest_divergences.length > 0 && (
                <div style={{ marginBottom: "24px" }}>
                  <h3 style={{ ...H.heading, fontSize: "18px", fontWeight: 600, marginBottom: "12px" }}>Biggest divergences</h3>
                  {syn.ai.biggest_divergences.map((b, i) => (
                    <div key={i} style={{ marginBottom: "12px", padding: "16px", background: P.surface, borderRadius: "4px", borderLeft: `3px solid ${P.gold}` }}>
                      <div style={{ ...H.heading, fontSize: "15px", fontWeight: 600, marginBottom: "6px" }}>{b.dim_label}</div>
                      <p style={{ fontSize: "13px", color: P.slate, lineHeight: 1.7, marginBottom: "6px" }}>{b.what_emerged}</p>
                      <p style={{ fontSize: "13px", color: P.slate, lineHeight: 1.7, fontStyle: "italic", marginBottom: "8px" }}>{b.likely_reading}</p>
                      <p style={{ fontSize: "13px", color: P.gold, lineHeight: 1.7, fontWeight: 500 }}>→ {b.conversation_prompt}</p>
                    </div>
                  ))}
                </div>
              )}
              {syn.ai.consensus_areas && syn.ai.consensus_areas.length > 0 && (
                <div style={{ marginBottom: "24px" }}>
                  <h3 style={{ ...H.heading, fontSize: "18px", fontWeight: 600, marginBottom: "12px" }}>Consensus areas</h3>
                  {syn.ai.consensus_areas.map((c, i) => (
                    <div key={i} style={{ marginBottom: "12px", padding: "16px", background: P.surface, borderRadius: "4px", borderLeft: `3px solid ${P.gold}` }}>
                      <div style={{ ...H.heading, fontSize: "15px", fontWeight: 600, marginBottom: "6px" }}>{c.dim_label}</div>
                      <p style={{ fontSize: "13px", color: P.slate, lineHeight: 1.7, marginBottom: "6px" }}>{c.team_view}</p>
                      <p style={{ fontSize: "13px", color: P.slate, lineHeight: 1.7, fontStyle: "italic" }}>{c.implication}</p>
                    </div>
                  ))}
                </div>
              )}
              {syn.ai.what_to_discuss_first && syn.ai.what_to_discuss_first.length > 0 && (
                <div>
                  <h3 style={{ ...H.heading, fontSize: "18px", fontWeight: 600, marginBottom: "12px" }}>What to discuss first</h3>
                  <ul style={{ paddingLeft: "20px", fontSize: "14px", color: P.slate, lineHeight: 1.8 }}>
                    {syn.ai.what_to_discuss_first.map((w, i) => <li key={i} style={{ marginBottom: "6px" }}>{w}</li>)}
                  </ul>
                </div>
              )}
            </div>
          )}

          <div style={{ marginTop: "40px", paddingTop: "24px", borderTop: `1px solid ${P.border}`, fontSize: "12px", color: P.textDim, ...H.mono, letterSpacing: "0.04em" }}>
            Session code: <span style={{ color: P.slate }}>{session.sessionCode}</span>
          </div>
        </div>
      </div>
    );
  }

  // ──────────────────────────────────────────────────────────────────────────
  // part-join
  // ──────────────────────────────────────────────────────────────────────────
  if (view === "part-join") {
    const inputBase = { width: "100%", background: P.bg, color: P.text, border: `1px solid ${P.border}`, borderRadius: "4px", padding: "12px 14px", fontSize: "14px", fontFamily: "'DM Sans',sans-serif", marginBottom: "20px", outline: "none" };
    const labelBase = { display: "block", fontSize: "11px", letterSpacing: "0.12em", textTransform: "uppercase", color: P.goldDim, ...H.mono, marginBottom: "6px" };
    return (
      <div style={{ background: P.bg, color: P.text, ...H.body, minHeight: "100vh" }}>
        {headerBar("Back", () => setView("mode-chooser"), "Join a group")}
        <div style={{ maxWidth: "560px", margin: "0 auto", padding: isMobile ? "32px 20px 60px" : "60px 32px 80px" }}>
          <div style={{ fontSize: "10px", letterSpacing: "0.22em", textTransform: "uppercase", color: P.goldDim, marginBottom: "12px", ...H.mono }}>Add your voice</div>
          <h2 style={{ ...H.heading, fontSize: isMobile ? "26px" : "30px", fontWeight: 600, lineHeight: 1.15, marginBottom: "12px" }}>Join your team's session</h2>
          <p style={{ fontSize: "14px", color: P.slate, lineHeight: 1.8, marginBottom: "32px" }}>Your facilitator should have shared a session code with you. Enter it below along with your name.</p>

          <label style={labelBase}>Session code</label>
          <input type="text" value={joinCode} onChange={(e) => setJoinCode(e.target.value)} placeholder="forge-4827" style={inputBase} />

          <label style={labelBase}>Your name</label>
          <input type="text" value={partName} onChange={(e) => setPartName(e.target.value)} placeholder='Your first name, or type "anonymous"' style={inputBase} />

          {joinError && (
            <div style={{ padding: "12px 14px", background: "#c94c4c11", border: "1px solid #c94c4c44", borderRadius: "4px", fontSize: "13px", color: "#c94c4c", marginBottom: "20px" }}>{joinError}</div>
          )}

          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
            <button onClick={handleJoinSession} style={{ background: P.gold, border: "none", color: P.bg, padding: "12px 28px", borderRadius: "4px", cursor: "pointer", fontSize: "13px", letterSpacing: "0.06em", ...H.mono, fontWeight: 500 }}>Join →</button>
            <button onClick={() => setView("mode-chooser")} style={{ background: "transparent", border: `1px solid ${P.border}`, color: P.slate, padding: "12px 28px", borderRadius: "4px", cursor: "pointer", fontSize: "13px", letterSpacing: "0.06em", ...H.mono }}>Cancel</button>
          </div>
        </div>
      </div>
    );
  }

  // ──────────────────────────────────────────────────────────────────────────
  // part-thanks
  // ──────────────────────────────────────────────────────────────────────────
  if (view === "part-thanks" && joinedSession) {
    return (
      <div style={{ background: P.bg, color: P.text, ...H.body, minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px" }}>
        <div style={{ fontSize: "48px", marginBottom: "24px", color: P.gold }}>✦</div>
        <h2 style={{ ...H.heading, fontSize: "28px", fontWeight: 600, marginBottom: "12px", textAlign: "center" }}>Thanks, {partName}.</h2>
        <p style={{ fontSize: "14px", color: P.slate, marginBottom: "32px", textAlign: "center", maxWidth: "480px", lineHeight: 1.7 }}>
          Your answers have been recorded for <em>{joinedSession.frame.name}</em>. Your facilitator will pull everything together when the team has submitted.
        </p>
        <p style={{ fontSize: "12px", color: P.textDim, marginBottom: "32px", textAlign: "center", maxWidth: "440px", lineHeight: 1.7, fontStyle: "italic" }}>
          If you need to change your answers, enter the same session code and name again.
        </p>
        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", justifyContent: "center" }}>
          <button onClick={() => { setView("mode-chooser"); setJoinCode(""); setPartName(""); setJoinedSession(null); setScores({}); }} style={{ background: "transparent", border: `1px solid ${P.border}`, color: P.slate, padding: "10px 24px", borderRadius: "4px", cursor: "pointer", fontSize: "12px", letterSpacing: "0.08em", ...H.mono }}>Modes</button>
          <button onClick={onBack} style={{ background: "transparent", border: `1px solid ${P.border}`, color: P.slate, padding: "10px 24px", borderRadius: "4px", cursor: "pointer", fontSize: "12px", letterSpacing: "0.08em", ...H.mono }}>← Back to Tools</button>
        </div>
      </div>
    );
  }

  // Fallback — should never hit if state is consistent
  return (
    <div style={{ background: P.bg, color: P.text, ...H.body, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "40px" }}>
      <button onClick={() => setView("mode-chooser")} style={{ background: "transparent", border: `1px solid ${P.border}`, color: P.slate, padding: "10px 24px", borderRadius: "4px", cursor: "pointer", fontSize: "12px", letterSpacing: "0.08em", ...H.mono }}>Return to modes</button>
    </div>
  );
}

// ─── TOOLS PAGE ─────────────────────────────────────────────────────────────

const TOOL_CARDS = [
  { id: "vision", icon: "✦", color: P.gold,
    label: "How Clear Is Your Culture Story?",
    sub: "Six questions. See where your thinking is sharp — and where it breaks down.",
    desc: "Work through six prompts that build a complete culture change story: your burning platform, north star, values, strategic priorities, leadership priorities and target behaviours. Download the result as a clean, printable page — in your own words, or AI-polished.",
    note: "This exercise is not designed to 'get it right'. It's designed to show you which pieces are clear to you — and where the gaps are that need attention." },
  { id: "readiness", icon: "◉", color: P.pre,
    label: "Culture Change Readiness Self-Assessment",
    sub: "Eighteen statements across six dimensions. A mirror, not a test.",
    desc: "Rate your organisation honestly across the key conditions for culture change — from preconditions and leadership readiness to the clarity of your North Star and your capacity for both structured and emergent change work.",
    note: "Use this as a conversation starter with your leadership team. The gaps it reveals are more valuable than the scores." },
];

function ToolsPage({ isMobile, initialTool, readinessInitialView, readinessJoinCode, readinessViewCode }) {
  const [activeTool, setActiveTool] = useState(initialTool || null);

  if (activeTool === "vision") return <VisionTool isMobile={isMobile} onBack={() => setActiveTool(null)} />;
  if (activeTool === "readiness") return <ReadinessTool isMobile={isMobile} onBack={() => setActiveTool(null)} initialView={readinessInitialView} initialJoinCode={readinessJoinCode} initialViewCode={readinessViewCode} />;

  return (
    <div style={{ background: P.bg, color: P.text, ...H.body, minHeight: "100vh" }}>
      <div style={{ background: P.surface, borderBottom: `1px solid ${P.border}`, padding: isMobile ? "28px 20px" : "52px 56px 48px", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "relative", maxWidth: "640px" }}>
          <div style={{ fontSize: "17px", letterSpacing: "0.25em", color: P.goldDim, textTransform: "uppercase", marginBottom: "20px", ...H.mono }}>Tools for self-discovery</div>
          <h1 style={{ ...H.heading, fontSize: isMobile ? "24px" : "clamp(28px,4vw,44px)", fontWeight: 600, color: P.text, lineHeight: 1.08, marginBottom: "20px" }}>Think more clearly.<br /><span style={{ color: P.gold }}>Work it out on the page.</span></h1>
          <p style={{ fontSize: "17px", color: P.slate, lineHeight: 1.8, maxWidth: "520px" }}>These tools are mirrors, not tests. They help you see where your thinking is clear — and where the gaps are that need attention before you move.</p>
        </div>
      </div>

      <div style={{ maxWidth: "800px", margin: "0 auto", padding: isMobile ? "28px 20px 60px" : "48px 40px 80px" }}>
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: "20px" }}>
          {TOOL_CARDS.map(t => (
            <div key={t.id} onClick={() => setActiveTool(t.id)} style={{
              background: P.surface, border: `1px solid ${P.border}`, borderTop: `3px solid ${t.color}`,
              borderRadius: "6px", padding: "28px", cursor: "pointer", transition: "all 0.2s",
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = t.color; e.currentTarget.style.transform = "translateY(-2px)"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = P.border; e.currentTarget.style.borderTopColor = t.color; e.currentTarget.style.transform = "none"; }}
            >
              <div style={{ fontSize: "28px", marginBottom: "16px" }}>{t.icon}</div>
              <div style={{ ...H.heading, fontSize: "20px", fontWeight: 600, color: P.text, lineHeight: 1.2, marginBottom: "8px" }}>{t.label}</div>
              <div style={{ fontSize: "13px", color: t.color, letterSpacing: "0.04em", marginBottom: "16px", ...H.mono }}>{t.sub}</div>
              <div style={{ fontSize: "14px", color: P.slate, lineHeight: 1.7, marginBottom: "16px" }}>{t.desc}</div>
              <div style={{ fontSize: "12px", color: P.textDim, lineHeight: 1.6, fontStyle: "italic", borderTop: `1px solid ${P.border}`, paddingTop: "12px" }}>{t.note}</div>
              <div style={{ marginTop: "20px", fontSize: "12px", letterSpacing: "0.1em", textTransform: "uppercase", color: t.color, ...H.mono }}>Start →</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── MAIN APP ────────────────────────────────────────────────────────────────
// ─── BOIDS SIMULATION (inlined, re-themed to app palette) ──────────────────
// Canvas sky gradient intentionally preserved — boids are dark and need a
// light background to remain visible.

function BoidsSimulation() {
  const canvasRef = useRef(null);
  const stateRef = useRef({
    boids: [], predators: [], focalIdx: 0, running: false, time: 0, frame: 0,
  });

  const [showIntro, setShowIntro] = useState(true);
  const [useSep, setUseSep] = useState(true);
  const [useAli, setUseAli] = useState(true);
  const [useCoh, setUseCoh] = useState(true);
  const [sepWeight, setSepWeight] = useState(1.5);
  const [aliWeight, setAliWeight] = useState(1.0);
  const [cohWeight, setCohWeight] = useState(1.0);
  const [numBoids, setNumBoids] = useState(200);
  const [visionRadius, setVisionRadius] = useState(70);
  const [maxSpeed, setMaxSpeed] = useState(3.0);
  const [status, setStatus] = useState("press Start");
  const [paused, setPaused] = useState(false);

  const paramsRef = useRef({});
  paramsRef.current = { useSep, useAli, useCoh, sepWeight, aliWeight, cohWeight, visionRadius, maxSpeed };

  const W = 1180, BH = 620;
  const separationRadius = 28;
  const maxForce = 0.08;

  function rand(a, b) { return a + Math.random() * (b - a); }

  function makeBoids(n) {
    const arr = [];
    for (let i = 0; i < n; i++) {
      const angle = Math.random() * Math.PI * 2;
      arr.push({
        x: rand(80, W - 80), y: rand(80, BH - 80),
        vx: Math.cos(angle) * paramsRef.current.maxSpeed,
        vy: Math.sin(angle) * paramsRef.current.maxSpeed,
        shade: rand(0.7, 1.0), phase: Math.random() * Math.PI * 2,
        fSepX: 0, fSepY: 0, fAliX: 0, fAliY: 0, fCohX: 0, fCohY: 0,
        neighbors: [],
      });
    }
    stateRef.current.boids = arr;
    if (stateRef.current.focalIdx >= arr.length) stateRef.current.focalIdx = 0;
  }

  useEffect(() => { makeBoids(numBoids); /* eslint-disable-next-line */ }, []);
  useEffect(() => { makeBoids(numBoids); /* eslint-disable-next-line */ }, [numBoids]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    function limit(vx, vy, max) {
      const m = Math.hypot(vx, vy);
      if (m > max) return [(vx / m) * max, (vy / m) * max];
      return [vx, vy];
    }
    function setMag(vx, vy, mag) {
      const m = Math.hypot(vx, vy);
      if (m === 0) return [0, 0];
      return [(vx / m) * mag, (vy / m) * mag];
    }

    function step() {
      const p = paramsRef.current;
      const visSq = p.visionRadius * p.visionRadius;
      const sepSq = separationRadius * separationRadius;
      const boids = stateRef.current.boids;
      const predators = stateRef.current.predators;
      const focalIdx = stateRef.current.focalIdx;

      for (let i = 0; i < boids.length; i++) {
        const b = boids[i];
        const isFocal = i === focalIdx;
        if (isFocal) b.neighbors = [];
        let sepX = 0, sepY = 0, sepCount = 0;
        let aliX = 0, aliY = 0, aliCount = 0;
        let cohX = 0, cohY = 0, cohCount = 0;
        for (let j = 0; j < boids.length; j++) {
          if (j === i) continue;
          const o = boids[j];
          const dx = o.x - b.x, dy = o.y - b.y;
          const d2 = dx * dx + dy * dy;
          if (d2 < visSq && d2 > 0) {
            if (isFocal) b.neighbors.push(j);
            aliX += o.vx; aliY += o.vy; aliCount++;
            cohX += o.x; cohY += o.y; cohCount++;
            if (d2 < sepSq) {
              const d = Math.sqrt(d2);
              sepX -= dx / d; sepY -= dy / d; sepCount++;
            }
          }
        }
        let fsx = 0, fsy = 0, fax = 0, fay = 0, fcx = 0, fcy = 0;
        if (sepCount > 0) {
          sepX /= sepCount; sepY /= sepCount;
          [sepX, sepY] = setMag(sepX, sepY, p.maxSpeed);
          fsx = sepX - b.vx; fsy = sepY - b.vy;
          [fsx, fsy] = limit(fsx, fsy, maxForce);
        }
        if (aliCount > 0) {
          aliX /= aliCount; aliY /= aliCount;
          [aliX, aliY] = setMag(aliX, aliY, p.maxSpeed);
          fax = aliX - b.vx; fay = aliY - b.vy;
          [fax, fay] = limit(fax, fay, maxForce);
        }
        if (cohCount > 0) {
          cohX = cohX / cohCount - b.x; cohY = cohY / cohCount - b.y;
          [cohX, cohY] = setMag(cohX, cohY, p.maxSpeed);
          fcx = cohX - b.vx; fcy = cohY - b.vy;
          [fcx, fcy] = limit(fcx, fcy, maxForce);
        }
        if (isFocal) {
          b.fSepX = fsx * p.sepWeight; b.fSepY = fsy * p.sepWeight;
          b.fAliX = fax * p.aliWeight; b.fAliY = fay * p.aliWeight;
          b.fCohX = fcx * p.cohWeight; b.fCohY = fcy * p.cohWeight;
        }
        let ax = 0, ay = 0;
        if (p.useSep) { ax += fsx * p.sepWeight; ay += fsy * p.sepWeight; }
        if (p.useAli) { ax += fax * p.aliWeight; ay += fay * p.aliWeight; }
        if (p.useCoh) { ax += fcx * p.cohWeight; ay += fcy * p.cohWeight; }
        for (const pr of predators) {
          const dx = b.x - pr.x, dy = b.y - pr.y;
          const d = Math.hypot(dx, dy);
          if (d < 150 && d > 0) {
            const flee = (150 - d) / 150;
            ax += (dx / d) * flee * 1.0;
            ay += (dy / d) * flee * 1.0;
          }
        }
        const margin = 80;
        const turnFactor = 0.22;
        if (b.x < margin) ax += turnFactor;
        if (b.x > W - margin) ax -= turnFactor;
        if (b.y < margin) ay += turnFactor;
        if (b.y > BH - margin) ay -= turnFactor;
        b.vx += ax; b.vy += ay;
        [b.vx, b.vy] = limit(b.vx, b.vy, p.maxSpeed);
        const sp = Math.hypot(b.vx, b.vy);
        if (sp < p.maxSpeed * 0.5) [b.vx, b.vy] = setMag(b.vx, b.vy, p.maxSpeed * 0.5);
        b.x += b.vx; b.y += b.vy;
        if (b.x < 2) b.x = 2;
        if (b.x > W - 2) b.x = W - 2;
        if (b.y < 2) b.y = 2;
        if (b.y > BH - 2) b.y = BH - 2;
      }
    }

    function drawSky() {
      const g = ctx.createLinearGradient(0, 0, 0, BH);
      g.addColorStop(0, "#6fa8d6");
      g.addColorStop(0.55, "#a8cce5");
      g.addColorStop(1, "#cce2ee");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, BH);
      ctx.fillStyle = "rgba(255, 255, 255, 0.10)";
      for (let i = 0; i < 6; i++) {
        const cx = ((i * 197 + stateRef.current.time * 0.15) % (W + 200)) - 100;
        const cy = 60 + i * 90;
        ctx.beginPath();
        ctx.ellipse(cx, cy, 110, 14, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    function drawBird(b, scale, color) {
      const angle = Math.atan2(b.vy, b.vx);
      const flap = Math.sin(stateRef.current.time * 0.18 + b.phase) * 0.6 + 0.4;
      ctx.save();
      ctx.translate(b.x, b.y); ctx.rotate(angle); ctx.scale(scale, scale);
      ctx.strokeStyle = color; ctx.lineWidth = 1.6 / scale + 0.6;
      ctx.lineCap = "round"; ctx.lineJoin = "round"; ctx.fillStyle = color;
      const wingSpan = 7;
      const wingTip = -3 - flap * 2.5;
      const wingMid = -1.2;
      ctx.beginPath();
      ctx.moveTo(-wingSpan, wingTip);
      ctx.quadraticCurveTo(-3, wingMid, 0, 0);
      ctx.quadraticCurveTo(3, wingMid, wingSpan, wingTip);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(1.5, 0, 0.9, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    function drawFocalBird(b) {
      const angle = Math.atan2(b.vy, b.vx);
      const flap = Math.sin(stateRef.current.time * 0.18 + b.phase) * 0.5 + 0.5;
      ctx.save();
      ctx.translate(b.x, b.y); ctx.rotate(angle);
      ctx.fillStyle = "#facc15"; ctx.strokeStyle = "#78350f";
      ctx.lineWidth = 1.2; ctx.lineJoin = "round";
      const ws = 11; const tip = -4 - flap * 2;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(-4, -1, -ws, tip);
      ctx.quadraticCurveTo(-4, 2, 0, 1.5);
      ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(4, -1, ws, tip);
      ctx.quadraticCurveTo(4, 2, 0, 1.5);
      ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.beginPath();
      ctx.ellipse(1, 0, 4, 1.8, 0, 0, Math.PI * 2);
      ctx.fill(); ctx.stroke();
      ctx.beginPath();
      ctx.arc(4, 0, 1.8, 0, Math.PI * 2);
      ctx.fill(); ctx.stroke();
      ctx.restore();
    }

    function drawHawk(pr) {
      const g = ctx.createRadialGradient(pr.x, pr.y, 4, pr.x, pr.y, 150);
      g.addColorStop(0, "rgba(180, 30, 30, 0.30)");
      g.addColorStop(1, "rgba(180, 30, 30, 0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(pr.x, pr.y, 150, 0, Math.PI * 2);
      ctx.fill();
      const flap = Math.sin(stateRef.current.time * 0.08 + pr.phase) * 1.0 + 0.5;
      ctx.save();
      ctx.translate(pr.x, pr.y);
      pr.angle = (pr.angle || 0) + 0.005;
      ctx.rotate(pr.angle);
      ctx.strokeStyle = "#1a1a1a"; ctx.fillStyle = "#1a1a1a";
      ctx.lineWidth = 2.5; ctx.lineCap = "round"; ctx.lineJoin = "round";
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(-10, -3 - flap, -22, -2 - flap * 0.5);
      ctx.quadraticCurveTo(-12, 1, 0, 3);
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(10, -3 - flap, 22, -2 - flap * 0.5);
      ctx.quadraticCurveTo(12, 1, 0, 3);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(0, 2, 2.5, 6, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(0, -3, 2.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(-2, 7);
      ctx.lineTo(0, 12);
      ctx.lineTo(2, 7);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    function drawArrow(x1, y1, x2, y2, color) {
      ctx.strokeStyle = color; ctx.fillStyle = color;
      ctx.lineWidth = 3; ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
      const angle = Math.atan2(y2 - y1, x2 - x1);
      const head = 8;
      ctx.beginPath();
      ctx.moveTo(x2, y2);
      ctx.lineTo(x2 - head * Math.cos(angle - 0.4), y2 - head * Math.sin(angle - 0.4));
      ctx.lineTo(x2 - head * Math.cos(angle + 0.4), y2 - head * Math.sin(angle + 0.4));
      ctx.closePath();
      ctx.fill();
    }

    function draw() {
      drawSky();
      const boids = stateRef.current.boids;
      const predators = stateRef.current.predators;
      const focalIdx = stateRef.current.focalIdx;
      for (const pr of predators) drawHawk(pr);
      for (let i = 0; i < boids.length; i++) {
        if (i === focalIdx) continue;
        const b = boids[i];
        const isNeighbor = boids[focalIdx] && boids[focalIdx].neighbors.includes(i);
        if (isNeighbor) drawBird(b, 1.4, `rgba(40, 40, 60, ${0.9 * b.shade})`);
        else drawBird(b, 1.0, `rgba(20, 30, 50, ${0.75 * b.shade})`);
      }
      const focal = boids[focalIdx];
      if (focal) {
        ctx.strokeStyle = "rgba(253, 224, 71, 0.55)";
        ctx.lineWidth = 1.5;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.arc(focal.x, focal.y, paramsRef.current.visionRadius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
        const arrowScale = 250;
        const startGap = 18;
        const p = paramsRef.current;
        function drawForce(fx, fy, color) {
          const m = Math.hypot(fx, fy);
          if (m < 0.001) return;
          const ux = fx / m, uy = fy / m;
          const sx = focal.x + ux * startGap;
          const sy = focal.y + uy * startGap;
          const ex = focal.x + fx * arrowScale + ux * startGap;
          const ey = focal.y + fy * arrowScale + uy * startGap;
          drawArrow(sx, sy, ex, ey, color);
        }
        if (p.useSep) drawForce(focal.fSepX, focal.fSepY, "#ff6b6b");
        if (p.useAli) drawForce(focal.fAliX, focal.fAliY, "#4ade80");
        if (p.useCoh) drawForce(focal.fCohX, focal.fCohY, "#60a5fa");
        ctx.fillStyle = "rgba(253, 224, 71, 0.35)";
        ctx.beginPath();
        ctx.arc(focal.x, focal.y, 13, 0, Math.PI * 2);
        ctx.fill();
        drawFocalBird(focal);
      }
    }

    let rafId;
    function loop() {
      if (stateRef.current.running && !paused) {
        step();
        stateRef.current.time++;
        stateRef.current.frame++;
        if (stateRef.current.frame % 20 === 0) {
          const p = paramsRef.current;
          const rules = [];
          if (p.useSep) rules.push("SEP");
          if (p.useAli) rules.push("ALI");
          if (p.useCoh) rules.push("COH");
          const focal = stateRef.current.boids[stateRef.current.focalIdx];
          const nbrs = focal ? focal.neighbors.length : 0;
          setStatus(`birds: ${stateRef.current.boids.length}  ·  rules: ${rules.join("+") || "NONE"}  ·  focal sees ${nbrs} neighbors  ·  hawks: ${stateRef.current.predators.length}`);
        }
      }
      draw();
      rafId = requestAnimationFrame(loop);
    }
    loop();
    return () => cancelAnimationFrame(rafId);
  }, [paused]);

  function handleCanvasClick(e) {
    const canvas = canvasRef.current;
    const r = canvas.getBoundingClientRect();
    const x = (e.clientX - r.left) * (W / r.width);
    const y = (e.clientY - r.top) * (BH / r.height);
    let nearestIdx = -1;
    let nearestDist = 14;
    const boids = stateRef.current.boids;
    for (let i = 0; i < boids.length; i++) {
      const d = Math.hypot(boids[i].x - x, boids[i].y - y);
      if (d < nearestDist) { nearestDist = d; nearestIdx = i; }
    }
    if (nearestIdx >= 0) stateRef.current.focalIdx = nearestIdx;
    else stateRef.current.predators.push({ x, y, phase: Math.random() * Math.PI * 2, angle: 0 });
  }

  function handleContextMenu(e) { e.preventDefault(); stateRef.current.predators = []; }
  function handleStart() { setShowIntro(false); stateRef.current.running = true; }
  function handleReset() { stateRef.current.predators = []; makeBoids(numBoids); }

  const s = {
    root: { margin: 0, background: P.bg, color: P.text, fontFamily: "'DM Sans','Segoe UI',sans-serif", display: "flex", flexWrap: "wrap", fontSize: 17 },
    stage: { position: "relative", flexShrink: 0 },
    canvas: { display: "block", cursor: "crosshair", maxWidth: "100%" },
    panel: { padding: "26px 24px 32px", width: 340, background: P.surface, borderLeft: `1px solid ${P.border}`, overflowY: "auto", maxHeight: "100vh", flexShrink: 0 },
    h1: { fontSize: 22, margin: "0 0 6px", letterSpacing: "-0.01em", color: P.text, fontFamily: "'Cormorant Garamond',serif", fontWeight: 600 },
    sub: { fontSize: 17, color: P.slate, marginBottom: 22, lineHeight: 1.5 },
    section: { marginTop: 22, paddingTop: 22, borderTop: `1px solid ${P.border}` },
    sectionFirst: { marginTop: 0, paddingTop: 0, borderTop: "none" },
    sectionTitle: { fontSize: 17, textTransform: "uppercase", letterSpacing: "0.12em", color: P.goldDim, marginBottom: 14, fontWeight: 700, fontFamily: "'JetBrains Mono',monospace" },
    label: { display: "flex", justifyContent: "space-between", fontSize: 17, marginTop: 14, color: P.slate },
    val: { color: P.text, fontWeight: 600 },
    range: { width: "100%", marginTop: 5, accentColor: P.gold, height: 22 },
    endpoints: { display: "flex", justifyContent: "space-between", fontSize: 17, color: P.textDim, marginTop: 2, marginBottom: 2, textTransform: "uppercase", letterSpacing: "0.05em" },
    helpInline: { fontSize: 17, color: P.textDim, marginTop: 3, lineHeight: 1.4 },
    row: { display: "flex", gap: 10, marginTop: 16 },
    button: { flex: 1, background: P.bg, color: P.text, border: `1px solid ${P.border}`, padding: "11px 12px", cursor: "pointer", borderRadius: 4, fontSize: 17, fontFamily: "inherit", letterSpacing: "0.06em" },
    status: { position: "absolute", top: 14, left: 18, fontSize: 17, color: "#fff", fontFamily: "'JetBrains Mono',monospace", background: "rgba(20, 30, 50, 0.55)", padding: "6px 12px", borderRadius: 4 },
    helpOverlay: { position: "absolute", bottom: 14, left: 18, fontSize: 17, color: "#fff", background: "rgba(20, 30, 50, 0.55)", padding: "9px 14px", borderRadius: 4, lineHeight: 1.55 },
    legend: { position: "absolute", top: 14, right: 18, fontSize: 17, color: "#fff", background: "rgba(20, 30, 50, 0.55)", padding: "10px 14px", borderRadius: 4, lineHeight: 1.7 },
    legendRow: { display: "flex", alignItems: "center", gap: 8 },
    legendArrow: { display: "inline-block", width: 22, height: 3, borderRadius: 2 },
    intro: { position: "fixed", inset: 0, background: "rgba(15, 35, 38, 0.95)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, backdropFilter: "blur(6px)", padding: 20 },
    modal: { maxWidth: 680, background: P.surface, border: `1px solid ${P.border}`, borderTop: `3px solid ${P.gold}`, borderRadius: 8, padding: "42px 46px", color: P.text, fontSize: 17, lineHeight: 1.65, maxHeight: "95vh", overflowY: "auto", position: "relative" },
    tag: { color: P.gold, fontSize: 17, textTransform: "uppercase", letterSpacing: "0.18em", marginBottom: 16, fontWeight: 600, fontFamily: "'JetBrains Mono',monospace" },
    h2: { margin: "0 0 16px", fontSize: 32, color: P.text, letterSpacing: "0.01em", lineHeight: 1.15, fontFamily: "'Cormorant Garamond',serif", fontWeight: 600 },
    p: { margin: "0 0 16px", color: P.slate, fontSize: 17, lineHeight: 1.75 },
    rulesList: { margin: "22px 0 24px", display: "flex", flexDirection: "column", gap: 12 },
    playSection: { background: P.bg, border: `1px solid ${P.border}`, borderRadius: 6, padding: "18px 22px", margin: "20px 0 6px", fontSize: 17, color: P.slate, lineHeight: 1.65 },
    startBtn: { marginTop: 24, background: P.gold, color: P.bg, border: "none", padding: "16px 26px", borderRadius: 4, fontWeight: 700, cursor: "pointer", fontSize: 17, width: "100%", fontFamily: "inherit", letterSpacing: "0.12em", textTransform: "uppercase" },
  };

  const ruleColors = { separation: "#ff6b6b", alignment: "#4ade80", cohesion: "#60a5fa" };

  function RuleToggle({ rule, name, desc, on, onClick }) {
    const color = ruleColors[rule];
    return (
      <div onClick={onClick} style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 14px", background: P.bg, border: `1px solid ${on ? color : P.border}`, borderRadius: 6, marginBottom: 9, cursor: "pointer", userSelect: "none" }}>
        <div style={{ width: 14, height: 14, borderRadius: "50%", background: on ? color : P.border, border: `2px solid ${on ? "#fff" : P.borderLight}`, flexShrink: 0, boxShadow: on ? `0 0 8px ${color}` : "none" }} />
        <div>
          <div style={{ fontSize: 17, color: P.text, fontWeight: 600 }}>{name}</div>
          <div style={{ fontSize: 17, color: P.textDim, marginTop: 2, lineHeight: 1.35 }}>{desc}</div>
        </div>
      </div>
    );
  }

  function Rule({ num, color, name, desc }) {
    return (
      <div style={{ display: "flex", gap: 18, alignItems: "flex-start", background: P.bg, padding: "16px 20px", borderRadius: 6, borderLeft: `4px solid ${color}` }}>
        <div style={{ fontSize: 26, fontWeight: 800, lineHeight: 1, flexShrink: 0, width: 30, color, fontFamily: "'JetBrains Mono',monospace" }}>{num}</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: P.text, marginBottom: 4 }}>{name}</div>
          <div style={{ fontSize: 17, color: P.slate, lineHeight: 1.5 }}>{desc}</div>
        </div>
      </div>
    );
  }

  return (
    <div style={s.root}>
      {showIntro && (
        <div style={s.intro}>
          <div style={s.modal}>
            <button onClick={() => setShowIntro(false)} style={{ position: "absolute", top: 14, right: 16, background: "transparent", border: `1px solid ${P.border}`, color: P.slate, padding: "4px 12px", borderRadius: 4, cursor: "pointer", fontSize: 13, letterSpacing: "0.06em", fontFamily: "'JetBrains Mono',monospace" }}>✕ Close</button>
            <div style={s.tag}>Experimental sandbox · Emergent systems</div>
            <h2 style={s.h2}>Boids: a flock with no leader</h2>
            <p style={s.p}>In 1986, Craig Reynolds asked a simple question: what makes a flock of birds <i>flock</i>? There's no leader. No bird has a map. No bird can see the whole flock. Yet thousands of birds turn together as if they were a single organism.</p>
            <p style={s.p}>His answer was three rules. Each bird only watches its closest neighbors — the ones inside its <b>vision radius</b> — and obeys these:</p>
            <div style={s.rulesList}>
              <Rule num="1" color="#ff6b6b" name="Separation" desc="Don't crash into your neighbors. Steer away from anyone too close." />
              <Rule num="2" color="#4ade80" name="Alignment" desc="Fly the same direction your neighbors are flying. Match their average heading." />
              <Rule num="3" color="#60a5fa" name="Cohesion" desc="Don't get left behind. Steer toward the average position of your neighbors." />
            </div>
            <p style={s.p}>That's the entire program. No bird knows what "a flock" is. No bird is in charge. Yet a flock emerges.</p>
            <div style={s.playSection}>
              <b style={{ color: P.text }}>How to play:</b>
              <br /><br />• One bird is highlighted in <b style={{ color: "#facc15" }}>yellow</b> — that's the focal bird. You can see its vision radius (dashed circle), the neighbors it senses, and three colored arrows showing exactly how each rule is pushing it. <b style={{ color: P.text }}>Click any other bird to focus it.</b>
              <br /><br />• <b style={{ color: P.text }}>Toggle the three rules</b> and watch an arrow disappear.
              <br /><br />• <b style={{ color: P.text }}>Click empty sky</b> to drop a hawk. Right-click clears hawks.
            </div>
            <button style={s.startBtn} onClick={handleStart}>Start the flock</button>
          </div>
        </div>
      )}
      <div style={s.stage}>
        <canvas ref={canvasRef} width={W} height={BH} style={s.canvas} onClick={handleCanvasClick} onContextMenu={handleContextMenu} />
        <div style={s.status}>{status}</div>
        <div style={s.helpOverlay}>
          <b style={{ color: "#fde047" }}>Click bird</b> to focus · <b style={{ color: "#fde047" }}>Click sky</b> for hawk · <b style={{ color: "#fde047" }}>Right-click</b> clears hawks
        </div>
        <div style={s.legend}>
          <div style={s.legendRow}><span style={{ ...s.legendArrow, background: "#ff6b6b" }} /> Separation force</div>
          <div style={s.legendRow}><span style={{ ...s.legendArrow, background: "#4ade80" }} /> Alignment force</div>
          <div style={s.legendRow}><span style={{ ...s.legendArrow, background: "#60a5fa" }} /> Cohesion force</div>
        </div>
      </div>
      <div style={s.panel}>
        <h1 style={s.h1}>Controls</h1>
        <div style={s.sub}>Watch the focal bird (yellow). Toggle rules to see each force disappear.</div>
        <div style={{ ...s.section, ...s.sectionFirst }}>
          <div style={s.sectionTitle}>The Three Rules</div>
          <RuleToggle rule="separation" name="Separation" desc="Avoid crowding neighbors" on={useSep} onClick={() => setUseSep(!useSep)} />
          <RuleToggle rule="alignment" name="Alignment" desc="Match neighbors' heading" on={useAli} onClick={() => setUseAli(!useAli)} />
          <RuleToggle rule="cohesion" name="Cohesion" desc="Move toward neighbor center" on={useCoh} onClick={() => setUseCoh(!useCoh)} />
        </div>
        <div style={s.section}>
          <div style={s.sectionTitle}>Rule Weights</div>
          <label style={s.label}>Separation <span style={s.val}>{sepWeight.toFixed(2)}</span></label>
          <input type="range" min="0" max="300" value={sepWeight * 100} onChange={(e) => setSepWeight(+e.target.value / 100)} style={s.range} />
          <div style={s.endpoints}><span>Stay close</span><span>Stay far away</span></div>
          <label style={s.label}>Alignment to neighbor's direction <span style={s.val}>{aliWeight.toFixed(2)}</span></label>
          <input type="range" min="0" max="300" value={aliWeight * 100} onChange={(e) => setAliWeight(+e.target.value / 100)} style={s.range} />
          <div style={s.endpoints}><span>Ignore</span><span>Match exactly</span></div>
          <label style={s.label}>Distance from center of gravity <span style={s.val}>{cohWeight.toFixed(2)}</span></label>
          <input type="range" min="0" max="300" value={cohWeight * 100} onChange={(e) => setCohWeight(+e.target.value / 100)} style={s.range} />
          <div style={s.endpoints}><span>Far from center</span><span>Close to center</span></div>
        </div>
        <div style={s.section}>
          <div style={s.sectionTitle}>Other</div>
          <label style={s.label}>Number of birds <span style={s.val}>{numBoids}</span></label>
          <input type="range" min="20" max="500" value={numBoids} onChange={(e) => setNumBoids(+e.target.value)} style={s.range} />
          <label style={s.label}>Vision radius <span style={s.val}>{visionRadius}</span></label>
          <input type="range" min="20" max="180" value={visionRadius} onChange={(e) => setVisionRadius(+e.target.value)} style={s.range} />
          <div style={s.endpoints}><span>Low</span><span>High</span></div>
          <div style={s.helpInline}>How far each bird can see. ALL three rules use this — a bird only considers neighbors inside this circle.</div>
          <label style={s.label}>Max speed <span style={s.val}>{maxSpeed.toFixed(1)}</span></label>
          <input type="range" min="10" max="60" value={maxSpeed * 10} onChange={(e) => setMaxSpeed(+e.target.value / 10)} style={s.range} />
          <div style={s.endpoints}><span>Low</span><span>High</span></div>
        </div>
        <div style={s.row}>
          <button style={s.button} onClick={handleReset}>Reset</button>
          <button style={s.button} onClick={() => setPaused((p) => !p)}>{paused ? "Play" : "Pause"}</button>
        </div>
      </div>
    </div>
  );
}

// ─── GAMES PAGE ─────────────────────────────────────────────────────────────
function GamesPage({ isMobile }) {
  return (
    <div style={{ background: P.bg, color: P.text, ...H.body, minHeight: "100vh" }}>
      <div style={{ background: P.surface, borderBottom: `1px solid ${P.border}`, padding: isMobile ? "28px 20px" : "52px 56px 44px" }}>
        <div style={{ maxWidth: "760px" }}>
          <div style={{ fontSize: "17px", letterSpacing: "0.25em", color: P.goldDim, textTransform: "uppercase", marginBottom: "20px", ...H.mono }}>Experimental sandbox</div>
          <h1 style={{ ...H.heading, fontSize: isMobile ? "26px" : "clamp(30px,4vw,46px)", fontWeight: 600, color: P.text, lineHeight: 1.08, marginBottom: "20px" }}>
            <span style={{ color: P.gold, fontStyle: "italic" }}>Games &amp; experiments</span>
          </h1>
          <p style={{ fontSize: "17px", color: P.slate, lineHeight: 1.8, maxWidth: "640px", marginBottom: "14px" }}>This section is highly experimental. It is designed as a sandbox of fun tools that intuitively show concepts related to culture.</p>
          <p style={{ fontSize: "17px", color: P.slate, lineHeight: 1.8, maxWidth: "640px" }}>For now, enjoy our <strong style={{ color: P.text }}>boids</strong> simulation, which shows how a group can create an incredible outcome with no leader and very few rules.</p>
        </div>
      </div>
      <BoidsSimulation />
    </div>
  );
}

export default function Model() {
  // ─── URL-param deep-linking (read once on mount) ─────────────────────────
  // Supported: ?section=<tab>, ?tool=<vision|readiness>, ?join=<code>, ?view=<code>.
  // ?join and ?view both imply tool=readiness; ?join lands in part-join with the
  // code prefilled, ?view lands in public-synthesis. Re-parsing on every render
  // is unnecessary; this fires once and the rest is local state.
  const VALID_TABS = ["cover", "model", "help", "cases", "tools", "games"];
  const VALID_TOOLS = ["vision", "readiness"];
  const initialNav = (() => {
    if (typeof window === "undefined") return { tab: "cover" };
    const params = new URLSearchParams(window.location.search);
    const section = params.get("section");
    const tool = params.get("tool");
    const join = params.get("join");
    const view = params.get("view");
    if (join) {
      return { tab: "tools", initialTool: "readiness", readinessInitialView: "part-join", readinessJoinCode: join };
    }
    if (view) {
      return { tab: "tools", initialTool: "readiness", readinessInitialView: "public-synthesis", readinessViewCode: view };
    }
    const nav = { tab: VALID_TABS.includes(section) ? section : "cover" };
    if (VALID_TOOLS.includes(tool)) {
      nav.tab = "tools";
      nav.initialTool = tool;
    }
    return nav;
  })();
  const [tab, setTab] = useState(initialNav.tab);
  const [active, setActive] = useState(null);
  const panelRef = useRef(null);
  const isMobile = useWindowWidth() < 768;

  useEffect(() => {
    if (active && panelRef.current) {
      setTimeout(() => { panelRef.current.scrollIntoView({ behavior: "smooth", block: "start" }); }, 60);
    }
  }, [active]);

  useEffect(() => { setActive(null); }, [tab]);

  const node = NODES.find((n) => n.id === active);
  const TABS = [
    { id: "cover", label: "Start Here" },
    { id: "model", label: "The Model" },
    { id: "help", label: "How We Help" },
    { id: "cases", label: "Case Studies" },
    { id: "tools", label: "Tools" },
    { id: "games", label: "Games" },
  ];

  return (
    <>
      <SEO
        title="The Culture Change Model: A Living Systems Approach | InciteU"
        description="Most culture change models treat culture as a project. This one treats it as a living system — complicated enough to require discipline, complex enough to demand humility."
        path="/culture-change-model"
      />
      <style>{gf + `
        @keyframes slideDown{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)}}
        *{box-sizing:border-box;margin:0;padding:0}
        ::-webkit-scrollbar{width:5px;height:5px}
        ::-webkit-scrollbar-track{background:${P.bg}}
        ::-webkit-scrollbar-thumb{background:${P.border};border-radius:3px}
      `}</style>

      {/* ── PERSISTENT NAV BAR ── */}
      <div style={{ position: "sticky", top: 0, zIndex: 200, background: P.bg, borderBottom: `1px solid ${P.border}`, display: "flex", alignItems: "center", padding: isMobile ? "0 8px" : "0 40px", boxShadow: "0 2px 16px rgba(0,0,0,0.4)" }}>
        {!isMobile && <div style={{ fontSize: "17px", letterSpacing: "0.18em", color: P.text, textTransform: "uppercase", ...H.heading, fontWeight: 600, paddingRight: "32px", marginRight: "8px", borderRight: `1px solid ${P.border}`, whiteSpace: "nowrap", opacity: 0.55 }}>Cultivating Culture</div>}
        {TABS.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{ background: "transparent", border: "none", cursor: "pointer", padding: isMobile ? "16px 14px" : "18px 24px", fontSize: isMobile ? "11px" : "12px", letterSpacing: "0.10em", textTransform: "uppercase", fontFamily: "'DM Sans',sans-serif", flex: isMobile ? "1" : "none", color: tab === t.id ? P.gold : P.textDim, borderBottom: tab === t.id ? `2px solid ${P.gold}` : "2px solid transparent", marginBottom: "-1px", transition: "all 0.15s ease" }}>{t.label}</button>
        ))}
      </div>

      {/* ── PAGE CONTENT ── */}
      {tab === "cover" ? <CoverPage isMobile={isMobile} onNav={setTab} />
       : tab === "help" ? <HowWeHelpPage isMobile={isMobile} />
       : tab === "cases" ? <CaseStudiesPage isMobile={isMobile} />
       : tab === "tools" ? <ToolsPage isMobile={isMobile} initialTool={initialNav.initialTool} readinessInitialView={initialNav.readinessInitialView} readinessJoinCode={initialNav.readinessJoinCode} readinessViewCode={initialNav.readinessViewCode} />
       : tab === "games" ? <GamesPage isMobile={isMobile} />
       : (
        <div style={{ background: P.bg, color: P.text, ...H.body, minHeight: "100vh" }}>
          {/* ── HERO ── */}
          <div style={{ borderBottom: `1px solid ${P.border}`, background: P.surface, position: "relative", overflow: "hidden" }}>
                        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", position: "relative", minHeight: isMobile ? "auto" : "340px" }}>
              {/* LEFT */}
              <div style={{ padding: isMobile ? "28px 20px 24px" : "48px 44px 44px", borderRight: isMobile ? "none" : `1px solid ${P.border}`, borderBottom: "none", order: isMobile ? 2 : 0 }}>
                <div style={{ fontSize: "17px", letterSpacing: "0.25em", color: P.goldDim, textTransform: "uppercase", marginBottom: "20px", ...H.mono }}>Why this model is different</div>
                <h1 style={{ ...H.heading, fontSize: isMobile ? "26px" : "clamp(22px,2.8vw,38px)", fontWeight: 600, color: P.text, lineHeight: 1.1, marginBottom: "32px" }}>Most culture change models<br /><span style={{ color: P.gold }}>treat culture as a process.</span><br />We <span style={{ color: "#d4896a" }}>treat it like the living<br />system it is.</span></h1>
                <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: "20px 28px" }}>
                  {[
                    { icon: "✗", color: P.gold, label: "The common mistake", body: "Most frameworks assume culture is a problem to be solved — a project with a start, a plan, and an end state. They give you a roadmap and assume the territory will cooperate." },
                    { icon: "✓", color: "#d4896a", label: "Our approach", body: "We know culture is a living system — complicated enough to require discipline, complex enough to demand humility. Our model gives you a rigorous plan and the adaptive intelligence to navigate when that plan meets reality." },
                    { icon: "✗", color: P.gold, label: "What others miss", body: "Most models treat resistance as a failure. They skip the preconditions. They underestimate the middle. They assume leadership is already aligned. They confuse activity with change." },
                    { icon: "✓", color: "#d4896a", label: "What we believe", body: "Culture change is not a project. It's a permanent practice. It requires both the engineer and the ecologist — someone who can build a process and someone who can read the ecosystem. This model gives you both." },
                  ].map((item) => (
                    <div key={item.label} style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
                      <div style={{ fontSize: "18px", color: item.color, minWidth: "18px", marginTop: "1px", fontWeight: 700, lineHeight: 1 }}>{item.icon}</div>
                      <div>
                        <div style={{ fontSize: "17px", letterSpacing: "0.15em", textTransform: "uppercase", color: item.color, marginBottom: "4px" }}>{item.label}</div>
                        <div style={{ fontSize: "17px", color: P.slate, lineHeight: 1.65 }}>{item.body}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* RIGHT: diagram (desktop) or card stack (mobile) */}
              <div style={{ padding: isMobile ? "24px 20px 28px" : "48px 24px 32px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-start", borderBottom: isMobile ? `1px solid ${P.border}` : "none", order: isMobile ? 1 : 0 }}>
                <div style={{ fontSize: "17px", letterSpacing: "0.25em", color: P.goldDim, textTransform: "uppercase", marginBottom: "16px", alignSelf: "flex-start", ...H.mono }}>The model at a glance · {isMobile ? "tap" : "click"} to explore</div>

                {isMobile ? (
                  /* ── MOBILE: vertical card list ── */
                  <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: "13px" }}>
                    {["pre","who","why","what","how"].map((id) => NODES.find((n) => n.id === id)).map((n) => {
                      const isAct = active === n.id;
                      return (
                        <div key={n.id} onClick={() => setActive(isAct ? null : n.id)} style={{ background: isAct ? P.surfaceHover : P.surface, border: `1px solid ${isAct ? n.color : P.border}`, borderLeft: `3px solid ${n.color}`, borderRadius: "5px", padding: "12px 16px", cursor: "pointer", transition: "all 0.18s ease" }}>
                          <div style={{ fontSize: "17px", letterSpacing: "0.2em", color: n.color, textTransform: "uppercase", ...H.mono, marginBottom: "3px" }}>{n.icon} {n.label}</div>
                          <div style={{ ...H.heading, fontSize: "17px", fontWeight: 600, color: P.text, lineHeight: 1.2, marginBottom: "4px" }}>{n.subtitle}</div>
                          <div style={{ fontSize: "17px", color: P.slate, lineHeight: 1.5 }}>{n.summary}</div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  (() => {
                    const BW = 465, BH = 140;
                    const W = 580, SVG_H = 920;
                    const N = {
                      pre: { l: 55, t: 20, w: BW, h: BH },
                      who: { l: 115, t: 185, w: BW, h: BH },
                      why: { l: 0, t: 350, w: BW, h: BH },
                      what: { l: 100, t: 515, w: BW, h: BH },
                      how: { l: 35, t: 680, w: BW, h: BH },
                    };

                    const leftLoop = `M 75,700
                    C 10,600 -20,420 60,300
                    C 120,200 240,140 310,190
                    C 390,245 400,360 350,440
                    C 300,520 190,530 160,470
                    C 130,415 200,350 280,370`;
                    const rightLoop = `M 280,370
                    C 360,395 460,310 490,220
                    C 520,140 490,80  420,75
                    C 340,68  270,130 270,210
                    C 270,295 330,380 400,420
                    C 470,460 520,520 500,620
                    C 480,700 400,740 310,720
                    C 220,700 150,660 120,620`;

                    return (
                      <div style={{ position: "relative", width: W, maxWidth: "100%", height: SVG_H }}>
                        <svg width={W} height={SVG_H} viewBox={`0 0 ${W} ${SVG_H}`} style={{ position: "absolute", top: 0, left: 0, pointerEvents: "none", overflow: "visible" }}>
                          <defs>
                            <filter id="swirl-glow">
                              <feGaussianBlur stdDeviation="4" result="blur" />
                              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                            </filter>
                          </defs>
                          {[leftLoop, rightLoop].map((d, i) => (
                            <path key={`glow-${i}`} d={d} fill="none" stroke="#d5e8b2" strokeWidth="22" opacity="0.008" strokeLinecap="round" strokeLinejoin="round" filter="url(#swirl-glow)" />
                          ))}
                          {[leftLoop, rightLoop].map((d, i) => (
                            <path key={`body-${i}`} d={d} fill="none" stroke="#d5e8b2" strokeWidth="5" opacity="0.025" strokeLinecap="round" strokeLinejoin="round" />
                          ))}
                          {[leftLoop, rightLoop].map((d, i) => (
                            <path key={`line-${i}`} d={d} fill="none" stroke="#d5e8b2" strokeWidth="1.2" opacity="0.05" strokeLinecap="round" strokeLinejoin="round" />
                          ))}
                        </svg>
                        {NODES.map((n) => {
                          const pos = N[n.id];
                          const isAct = active === n.id;
                          return (
                            <div key={n.id} onClick={() => setActive(isAct ? null : n.id)}
                              onMouseEnter={(e) => (e.currentTarget.style.background = P.surfaceHover)}
                              onMouseLeave={(e) => (e.currentTarget.style.background = isAct ? P.surfaceHover : P.surface)}
                              style={{
                                position: "absolute", left: pos.l, top: pos.t, width: pos.w, height: pos.h,
                                background: isAct ? `${n.colorFaint}` : `${n.color}0a`,
                                border: `1px solid ${n.color}${isAct ? "cc" : "55"}`,
                                borderTop: `3px solid ${n.color}`, borderRadius: "5px",
                                padding: "12px 16px", cursor: "pointer", transition: "all 0.18s ease",
                                display: "flex", flexDirection: "column", justifyContent: "flex-start", gap: "2px",
                                boxShadow: isAct ? `0 0 20px ${n.colorFaint}` : `0 2px 8px rgba(0,0,0,0.4), inset 0 0 0 1px ${n.color}22`,
                                overflow: "hidden",
                              }}>
                              <div style={{ fontSize: "17px", letterSpacing: "0.12em", color: n.color, textTransform: "uppercase", ...H.mono, whiteSpace: "nowrap" }}>{n.icon} {n.label}</div>
                              <div style={{ ...H.heading, fontSize: "17px", fontWeight: 600, color: P.text, lineHeight: 1.15, marginBottom: "2px" }}>{n.subtitle}</div>
                              <div style={{ fontSize: "17px", color: P.slate, lineHeight: 1.45 }}>{n.summary}</div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()
                )}
              </div>
            </div>
          </div>

          {/* ── DETAIL PANEL ── */}
          {node && (
            <div ref={panelRef} style={{ borderTop: `2px solid ${node.color}`, background: P.surface, padding: isMobile ? "24px 16px" : "40px 48px", animation: "slideDown 0.22s ease" }}>
              {node.isHow ? <HowPanel onClose={() => setActive(null)} />
               : node.id === "why" ? <WhyPanel node={node} onClose={() => setActive(null)} />
               : node.id === "who" ? <WhoPanel node={node} onClose={() => setActive(null)} />
               : node.id === "what" ? <WhatPanel node={node} onClose={() => setActive(null)} />
               : <DetailPanel node={node} onClose={() => setActive(null)} />}
            </div>
          )}

          {/* ── FOOTER ── */}
          <div style={{ padding: isMobile ? "16px 20px" : "16px 48px", borderTop: `1px solid ${P.border}`, display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "8px" }}>
            <span style={{ fontSize: "17px", color: P.textDim, letterSpacing: "0.08em" }}>Click any dimension to explore</span>
            <div style={{ display: "flex", gap: "10px" }}>
              {["pre", "who", "why", "what", "how"].map((id) => {
                const n = NODES.find((x) => x.id === id);
                return <span key={n.id} onClick={() => setActive(active === n.id ? null : n.id)} style={{ fontSize: "17px", letterSpacing: "0.1em", color: n.color, cursor: "pointer", textTransform: "uppercase" }}>{n.label}</span>;
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
