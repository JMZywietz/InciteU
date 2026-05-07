import React, { useState, useEffect, useMemo } from 'react';
import { useAppNavigate } from '../lib/useAppNavigate.js';
import { synthesize, extractText } from '../lib/synthesize.js';
import { escapeHTML, downloadHTML } from '../lib/utils.js';

// ============================================================================
// LEADERSHIP STANCE ASSESSMENT
// ============================================================================
// Self-contained, scenario-based assessment that maps a user's leadership
// pattern across the five archetypes (Hedonist, Warrior, Lover, Strategist,
// Visionary) at baseline, under pressure, and in identity-defining moments.
//
// Design:
//   - 15 scenarios: 6 baseline + 7 pressure + 2 identity. All used per session.
//   - Each scenario presents 5 options (one per archetype). User ranks top 3.
//   - Top pick = 3 pts, 2nd = 2 pts, 3rd = 1 pt.
//   - Per-section per-archetype scores normalize to 0-100% by section max.
//   - Subscale scoring tracks specific subscales tagged on each option.
//   - Results: leading at baseline, under pressure, underused, gap analysis,
//     radar chart, optional subscale deep-dive, optional AI synthesis.
//
// Theming:
//   - Self-contained light/cream theme (matches Five Layers Deep) so the tool
//     reads as a focused, reflective experience independent of the dark site
//     chrome. Scoped via .lsa-* class names so it cannot bleed into the rest
//     of the site.
//
// AI:
//   - Synthesis is OPTIONAL. If /api/synthesize fails (e.g., env var not set),
//     the tool degrades gracefully with a message and the rule-based results
//     remain fully usable.
//
// Source: ported from the standalone five-layers-assessment.html prototype.
// ============================================================================

// ───────────────────────────────────────────────────────────────────────────
// DATA: archetypes, subscales, scenarios, archetype detail content
// ───────────────────────────────────────────────────────────────────────────

const ARCHS = ['hedonist', 'warrior', 'lover', 'strategist', 'visionary'];

const AD = {
  hedonist:   { icon: '☀', name: 'Hedonist',   tagline: 'The seeking drive',     color: '#D4A854', bg: 'rgba(212,168,84,.08)', border: 'rgba(212,168,84,.35)',
    lead:     "You navigate the world through pleasure, energy, and instinct. You're drawn to what feels alive and resist what feels deadening. Your gift is bringing vitality and appetite to everything you do. Watch for: avoiding discomfort that actually needs to be faced.",
    pressure: "You escape. You seek comfort, distraction, or pleasure to avoid pain. This can look like procrastination, avoidance, or \"it'll be fine\" optimism that isn't grounded.",
    underuse: "You may struggle with burnout, joylessness, or inability to rest. You've lost touch with what feels good and what gives you energy.",
  },
  warrior:    { icon: '⚔', name: 'Warrior',    tagline: 'The protective drive',  color: '#A85454', bg: 'rgba(168,84,84,.08)',  border: 'rgba(168,84,84,.35)',
    lead:     "You navigate the world through vigilance and resilience. You see threats others miss and you don't back down. Your gift is protecting what matters when others freeze. Watch for: seeing threats everywhere, even where there's safety.",
    pressure: "You fight or fortify. You get reactive, defensive, or hyper-focused on threat. This can look like aggression, rigidity, or an inability to trust.",
    underuse: "You may have weak boundaries, difficulty saying no, or a pattern of being taken advantage of. You struggle to protect yourself or others.",
  },
  lover:      { icon: '♡', name: 'Lover',      tagline: 'The empathy capacity',  color: '#8B5E5E', bg: 'rgba(139,94,94,.08)',  border: 'rgba(139,94,94,.35)',
    lead:     "You navigate the world through connection. You feel what others feel, often before they can name it. Your gift is building trust and making people feel seen. Watch for: losing yourself in others' needs, avoiding conflict to preserve harmony.",
    pressure: "You merge or people-please. You prioritize others' feelings over your own needs or the truth. This can look like boundary collapse or conflict avoidance.",
    underuse: "You may feel isolated, have difficulty with intimacy, or treat relationships instrumentally. Others may experience you as cold or detached.",
  },
  strategist: { icon: '◈', name: 'Strategist', tagline: 'The imagination capacity', color: '#5B6B8B', bg: 'rgba(91,107,139,.08)', border: 'rgba(91,107,139,.35)',
    lead:     "You navigate the world through analysis and planning. You model futures, weigh options, and see patterns. Your gift is clarity in complexity. Watch for: analysis paralysis, disconnecting from emotion to stay in your head.",
    pressure: "You overthink. You retreat into analysis, planning, and control. This can look like paralysis, emotional detachment, or \"solving\" feelings instead of feeling them.",
    underuse: "You may feel overwhelmed by complexity, make reactive decisions, or struggle to plan ahead. You're often surprised by foreseeable problems.",
  },
  visionary:  { icon: '✧', name: 'Visionary',  tagline: 'The meaning capacity',  color: '#6B5B8B', bg: 'rgba(107,91,139,.08)', border: 'rgba(107,91,139,.35)',
    lead:     "You navigate the world through meaning. You ask \"why\" before \"how\" and hold the long view. Your gift is keeping purpose alive when others get lost in tactics. Watch for: disconnection from practical reality, moral rigidity.",
    pressure: "You moralize or dissociate. You retreat to abstract principles or existential questioning. This can look like self-righteousness, impracticality, or checking out from the messy reality.",
    underuse: "You may feel adrift, purposeless, or stuck in routine. You do things without knowing why, and major decisions feel arbitrary.",
  },
};

const SUBSCALES = {
  hedonist:   { reward_responsiveness: 'Reward Responsiveness', drive: 'Drive', fun_seeking: 'Fun Seeking' },
  warrior:    { threat_sensitivity: 'Threat Sensitivity', fight: 'Fight', flight: 'Flight' },
  lover:      { empathic_concern: 'Empathic Concern', perspective_taking: 'Perspective Taking', personal_distress: 'Personal Distress' },
  strategist: { analytical_thinking: 'Analytical Thinking', cognitive_flexibility: 'Cognitive Flexibility', future_consequences: 'Future Consequences' },
  visionary:  { presence_of_meaning: 'Presence of Meaning', search_for_meaning: 'Search for Meaning', self_transcendence: 'Self-Transcendence' },
};

// Item counts per subscale per section (used for normalization)
const SUBSCALE_COUNTS = {
  hedonist: {
    reward_responsiveness: { baseline: 2, pressure: 1, identity: 1, total: 4 },
    drive:                 { baseline: 2, pressure: 1, identity: 1, total: 4 },
    fun_seeking:           { baseline: 2, pressure: 1, identity: 0, total: 3 },
  },
  warrior: {
    threat_sensitivity: { baseline: 5, pressure: 2, identity: 0, total: 7 },
    fight:              { baseline: 1, pressure: 3, identity: 2, total: 6 },
    flight:             { baseline: 0, pressure: 2, identity: 0, total: 2 },
  },
  lover: {
    empathic_concern:   { baseline: 4, pressure: 3, identity: 1, total: 8 },
    perspective_taking: { baseline: 2, pressure: 2, identity: 1, total: 5 },
    personal_distress:  { baseline: 0, pressure: 2, identity: 0, total: 2 },
  },
  strategist: {
    analytical_thinking:   { baseline: 5, pressure: 5, identity: 1, total: 11 },
    cognitive_flexibility: { baseline: 1, pressure: 1, identity: 0, total: 2 },
    future_consequences:   { baseline: 0, pressure: 1, identity: 1, total: 2 },
  },
  visionary: {
    presence_of_meaning: { baseline: 5, pressure: 2, identity: 1, total: 8 },
    search_for_meaning:  { baseline: 1, pressure: 4, identity: 0, total: 5 },
    self_transcendence:  { baseline: 0, pressure: 1, identity: 1, total: 2 },
  },
};

// Archetype detail content (for the results deep-dive panels)
const ARCHETYPE_DETAILS = {
  hedonist: {
    framing: "The Hedonist is the part of you that goes <em>toward</em> — toward pleasure, toward novelty, toward the thing that lights you up. But \"going toward\" decomposes into three different engines, and they don't always run together.",
    subscales: [
      { key: 'reward_responsiveness', name: 'Reward Responsiveness', desc: "The visceral, body-level response to good things happening. Savoring. The way some people light up when praised, taste their food, feel the moment land. This is your capacity to <strong>receive</strong> pleasure." },
      { key: 'drive',                 name: 'Drive',                 desc: "Sustained pursuit of what you want. Going after it. The persistent effort that closes the gap between desire and outcome. This is your capacity to <strong>go after</strong> pleasure." },
      { key: 'fun_seeking',           name: 'Fun Seeking',           desc: "Appetite for novelty and spontaneity. Willingness to act on impulse for new experience. Boredom intolerance, in the productive sense. This is your capacity to <strong>seek</strong> pleasure in unfamiliar territory." },
    ],
    combinations: [
      { id: 'achievement_runner',     label: 'Drive without Reward Responsiveness — the achievement runner',
        detect: (s) => s.drive >= 60 && s.reward_responsiveness <= 35,
        content: "Strong pursuit machinery, weak savoring machinery. You climb the ladder, hit the goal, get the promotion — and feel surprisingly little. The dopamine of pursuit isn't matched by satisfaction at arrival, so you immediately set the next goal. From outside it looks like drive. From inside it can feel like an inability to land. The fix isn't more drive; it's relearning Reward Responsiveness — the capacity to actually feel what you've already won." },
      { id: 'peaceful_underemployed', label: 'Reward Responsiveness without Drive',
        detect: (s) => s.reward_responsiveness >= 60 && s.drive <= 35,
        content: "You deeply enjoy life when good things arrive but don't chase them. Often peaceful, sometimes underemployed relative to your capacity. The pleasure machinery works beautifully on what's already in front of you; the pursuit machinery is comparatively quiet." },
      { id: 'dabbler',                label: 'Fun Seeking without Drive — the dabbler',
        detect: (s) => s.fun_seeking >= 60 && s.drive <= 35,
        content: "Many starts, few finishes. Strong appetite for the new, weak machinery for the long pursuit. Novelty is its own reward, and seeing things through can feel like a chore. Often creative, often scattered." },
      { id: 'disciplined_executor',   label: 'Drive without Fun Seeking — the disciplined executor',
        detect: (s) => s.drive >= 60 && s.fun_seeking <= 35,
        content: "You get things done but resist novelty. Effective in stable conditions; can become rigid in middle age as the world changes faster than your established patterns. The strength is reliability; the cost is adaptability." },
    ],
    also: "Hedonist subscales here are measured with 3–4 items each, so read your scores directionally rather than precisely.",
  },
  warrior: {
    framing: "The Warrior is the part of you that handles threat. Whether the threat is physical, social, professional, or emotional, the Warrior is what comes online. But \"handling threat\" isn't one capacity — it's how you detect threat, and how you respond to it.",
    subscales: [
      { key: 'threat_sensitivity', name: 'Threat Sensitivity', desc: "The anxious vigilance system. Scanning for risk, worrying about mistakes, anticipating what could go wrong. This is the <strong>detection</strong> layer. High Threat Sensitivity makes you see things others miss; it can also exhaust you." },
      { key: 'fight',              name: 'Fight',              desc: "Confrontational defense. Pushing back, holding ground, engaging the threat directly. The capacity to say no, to argue, to refuse to yield." },
      { key: 'flight',             name: 'Flight',             desc: "Escape and damage control. Securing position, getting out, minimizing exposure. Less glamorous than Fight but often the wiser choice. Good Flight is strategic withdrawal, not cowardice." },
    ],
    combinations: [
      { id: 'anxious_paralysis',  label: 'Threat Sensitivity without an active defense response — anxious paralysis',
        detect: (s) => s.threat_sensitivity >= 55 && s.fight <= 30 && s.flight <= 30,
        content: "The detection system is on, the action systems aren't. You see every risk, you can't pick a response, you ruminate. From the inside it feels like being trapped between possibilities. Common in people described as \"anxious overthinkers\" — but the underlying issue isn't the anxiety itself; it's the gap between detection and action." },
      { id: 'fight_uncalibrated', label: 'Fight without Threat Sensitivity — combat-ready but not alarm-aware',
        detect: (s) => s.fight >= 55 && s.threat_sensitivity <= 30,
        content: "You escalate conflicts that didn't need to escalate. Mistake everything for an attack. Pick battles for the wrong reasons. Often described as \"always angry\" — but the underlying issue is calibration, not aggression. The fix isn't to fight less; it's to detect more accurately first." },
    ],
    also: "The classical \"fight or flight\" framing is a simplification. Real-world threat response also includes <strong>Freeze</strong> (immobilization-as-information-gathering) and <strong>Tend-and-Befriend</strong> (turning toward others under stress, which tips Warrior into Lover territory).",
    uncovered: { name: 'Freeze', note: "Freeze gets a bad reputation but is often the most cognitively sophisticated mode under pressure — you're not paralyzed, you're gathering. Some of the best decision-makers freeze first, then act. The signature of an unhealthy Freeze is when it never resolves into action." },
  },
  lover: {
    framing: "The Lover is the part of you that turns toward other people — but \"turning toward\" has at least four distinct flavors, and the differences between them are some of the most consequential in adult life.",
    subscales: [
      { key: 'empathic_concern',   name: 'Empathic Concern',   desc: "Feeling <em>for</em> others. Warmth, tenderness, the heart-going-out response. Genuine care about another person's wellbeing." },
      { key: 'perspective_taking', name: 'Perspective Taking', desc: "Cognitive empathy. The capacity to see through someone else's eyes, model their mental state, understand why their position makes sense to them. This is empathy as a <strong>thinking</strong> operation." },
      { key: 'personal_distress',  name: 'Personal Distress',  desc: "Your own distress in response to others' distress. The \"I can't bear to see them in pain\" response. Looks like empathy but is technically about your nervous system, not theirs." },
    ],
    combinations: [
      { id: 'sustainable_helper',          label: 'Empathic Concern without Personal Distress — the sustainable helper',
        detect: (s) => s.empathic_concern >= 50 && s.personal_distress <= 30,
        content: "You feel for people, you show up, you help — and you go home and sleep. Your nervous system stays regulated even when theirs isn't. You can hear hard things without absorbing them. This is what mature empathy actually is, and it's rarer than the cultural conversation about empathy suggests." },
      { id: 'vulnerable_empath',           label: 'Empathic Concern with Personal Distress — the vulnerable empath',
        detect: (s) => s.empathic_concern >= 50 && s.personal_distress >= 50,
        content: "You feel for others <em>and</em> your own system floods with their distress. You're often extraordinarily attuned and effective in short bursts — and then you collapse. The classic codependent caregiver. The therapist who burns out. The friend who vanishes after a hard conversation because they need a week to recover. The work isn't to care less. It's to build the regulatory capacity that lets Empathic Concern operate without Personal Distress overwhelming it." },
      { id: 'cognitive_empathy_uncoupled', label: 'Perspective Taking without Empathic Concern',
        detect: (s) => s.perspective_taking >= 55 && s.empathic_concern <= 30,
        content: "Cognitive empathy uncoupled from warmth — the capacity to read someone perfectly without caring about them. It's a useful skill in negotiation, sales, and psychotherapy when paired with strong values; it's the central feature of dark-triad personalities when not." },
      { id: 'warm_projector',              label: 'Empathic Concern without Perspective Taking — the warm projector',
        detect: (s) => s.empathic_concern >= 55 && s.perspective_taking <= 30,
        content: "You care deeply but assume everyone shares your feelings. Often inadvertently invasive: \"I know just how you feel\" — when in fact you don't. The warmth is real; the model of the other person's actual experience is missing." },
    ],
    also: "The Empathic Concern × Personal Distress distinction is one of the most clinically important in personality psychology. It's the difference between sustainable caring and burnout-prone caring.",
    uncovered: { name: 'Fantasy / imaginative empathy', note: "A fourth Lover subscale — imaginative immersion in others' experiences, real or fictional — is described in the research but not measured by this 15-scenario assessment." },
  },
  strategist: {
    framing: "The Strategist is the part of you that thinks ahead, reads patterns, and tries to figure out what's actually going on. Three different cognitive capacities make up the Strategist, and the differences between them are easy to miss but hugely consequential.",
    subscales: [
      { key: 'analytical_thinking',   name: 'Analytical Thinking',   desc: "Preference for systematic evaluation, pattern recognition, complex problems. The \"thinks for fun\" trait. Distinct from intelligence — some very smart people don't enjoy thinking, and some less brilliant people love it." },
      { key: 'cognitive_flexibility', name: 'Cognitive Flexibility', desc: "Capacity to reframe, adapt plans, hold multiple representations of a situation simultaneously. The unstuck-ness factor. What lets you change your mind when the data changes." },
      { key: 'future_consequences',   name: 'Future Consequences',   desc: "Orientation toward long-term outcomes. The capacity to weigh what happens later against what's pleasant now. Some people feel the future as vividly as the present; others can barely make it real." },
    ],
    combinations: [
      { id: 'brittle_planner',     label: 'Future Consequences without Cognitive Flexibility — the brittle planner',
        detect: (s) => s.future_consequences >= 55 && s.cognitive_flexibility <= 30,
        content: "Future-oriented, builds detailed plans, lives by the long arc — and gets shattered when reality diverges from the plan. \"But the strategy said…\" Common in people who succeeded early through planning and then hit a wall they can't model their way through. The compound trait — plans well <em>and</em> adapts — is rarer than either component alone." },
      { id: 'situational_surfer', label: 'Cognitive Flexibility without Future Consequences — the situational surfer',
        detect: (s) => s.cognitive_flexibility >= 55 && s.future_consequences <= 30,
        content: "Adapts beautifully to whatever's happening but never builds a long arc. Resilient in the short term, drifting in the long term. The unstuck-ness is real and useful; the missing piece is direction-setting." },
    ],
    also: "Analytical Thinking is independent of intelligence in interesting ways. High-Analytical people enjoy thinking through problems even when they're not great at it; low-Analytical people may be brilliant but find sustained analysis exhausting.",
  },
  visionary: {
    framing: "The Visionary is the part of you that asks what your life is for. It's the meaning-making capacity — and it has more distinct components than any other archetype.",
    subscales: [
      { key: 'presence_of_meaning', name: 'Presence of Meaning', desc: "The felt sense that your life has purpose. \"I know why I'm here.\" A <strong>current state</strong> of meaningfulness." },
      { key: 'search_for_meaning',  name: 'Search for Meaning',  desc: "Active questioning of purpose. \"I'm working out why I'm here.\" A <strong>process</strong> of meaning-making. Importantly, not the inverse of Presence — they're partly orthogonal." },
      { key: 'self_transcendence',  name: 'Self-Transcendence',  desc: "Identification with something larger than yourself — legacy, contribution, future generations, the cause that outlasts you." },
    ],
    combinations: [
      { id: 'settled_meaning',     label: 'High Presence, low Search — settled meaning',
        detect: (s) => s.presence_of_meaning >= 60 && s.search_for_meaning <= 30,
        content: "\"I know my purpose and I'm not looking for more.\" Can be deep clarity. Can also be foreclosed — you stopped questioning at 25 and never reopened the question. Worth checking which one you're in." },
      { id: 'active_seeker',       label: 'Low Presence, high Search — active seeker',
        detect: (s) => s.presence_of_meaning <= 30 && s.search_for_meaning >= 60,
        content: "The meaning-quest is on. Often present in transitions, post-crisis recovery, mid-life pivots, spiritual openings. Uncomfortable but generative. The search itself is the work." },
      { id: 'reflective_grounded', label: 'High Presence, high Search — reflective and grounded',
        detect: (s) => s.presence_of_meaning >= 50 && s.search_for_meaning >= 50,
        content: "Has meaning, keeps questioning whether it's the right meaning. Tends to deepen over time. Often the most resilient pattern — the ground holds, and the inquiry continues." },
      { id: 'drifting',            label: 'Low Presence, low Search — drifting',
        detect: (s) => s.presence_of_meaning <= 30 && s.search_for_meaning <= 30,
        content: "Drifting without distress. Can be peaceful (think Buddhist non-grasping) or numbed (think mild depression). The two look identical from outside and feel completely different from inside. Worth checking which one is yours." },
      { id: 'small_meaning',       label: 'High Presence, low Self-Transcendence — fulfilled but personal',
        detect: (s) => s.presence_of_meaning >= 55 && s.self_transcendence <= 30,
        content: "You have meaning that's entirely about your own life — your craft, your family, your relationships. Fulfilled, just personal. Some people in meaning crises think the problem is Presence (no purpose) when it's actually Self-Transcendence (purpose exists but feels small)." },
    ],
    also: "<strong>Presence and Search are partly orthogonal</strong> — that's the key insight here. You can have a strong settled sense of meaning <em>and</em> be actively questioning it.",
    uncovered: { name: 'Spiritual Self-Transcendence and Positive Reframing', note: "Two further Visionary subscales described in the research are not measured by this 15-scenario assessment." },
  },
};

// 15 scenarios: 6 baseline + 7 pressure + 2 identity
const POOL = [
  { id: 'B1', section: 'baseline', text: "You're starting a new project at work.", options: [
    { arch: 'hedonist',   sub: 'drive',                 text: "Jump into the parts that excite you most" },
    { arch: 'warrior',    sub: 'threat_sensitivity',    text: "Identify the biggest risks and figure out how to mitigate them early" },
    { arch: 'lover',      sub: 'empathic_concern',      text: "Make sure the right people are involved and everyone feels good about their role" },
    { arch: 'strategist', sub: 'analytical_thinking',   text: "Build a plan with milestones, dependencies, and contingencies" },
    { arch: 'visionary',  sub: 'presence_of_meaning',   text: "Get clear on why this project matters before diving into how" },
  ]},
  { id: 'B2', section: 'baseline', text: "You receive unexpected praise from someone you respect.", options: [
    { arch: 'hedonist',   sub: 'reward_responsiveness', text: "Feel great — soak it in, enjoy the moment" },
    { arch: 'warrior',    sub: 'threat_sensitivity',    text: "Wonder what they might want, or whether you've missed something" },
    { arch: 'lover',      sub: 'empathic_concern',      text: "Feel closer to them — it strengthens the relationship" },
    { arch: 'strategist', sub: 'analytical_thinking',   text: "Think about what specifically you did well so you can replicate it" },
    { arch: 'visionary',  sub: 'presence_of_meaning',   text: "Feel affirmed that you're on the right path" },
  ]},
  { id: 'B3', section: 'baseline', text: "You have to make a decision and there's no clear right answer.", options: [
    { arch: 'hedonist',   sub: 'drive',                 text: "Go with your gut — what feels right" },
    { arch: 'warrior',    sub: 'threat_sensitivity',    text: "Choose the option with the least downside" },
    { arch: 'lover',      sub: 'perspective_taking',    text: "Talk it through with people you trust" },
    { arch: 'strategist', sub: 'analytical_thinking',   text: "Analyze the options systematically — pros, cons, probabilities" },
    { arch: 'visionary',  sub: 'presence_of_meaning',   text: "Ask which option best serves what you ultimately care about" },
  ]},
  { id: 'B4', section: 'baseline', text: "A team you're part of is brainstorming ideas.", options: [
    { arch: 'hedonist',   sub: 'fun_seeking',           text: "Throw out bold, interesting ideas without worrying if they're practical yet" },
    { arch: 'warrior',    sub: 'threat_sensitivity',    text: "Point out which ideas have fatal flaws before the group gets too attached" },
    { arch: 'lover',      sub: 'perspective_taking',    text: "Make sure quieter voices are heard and people feel safe contributing" },
    { arch: 'strategist', sub: 'analytical_thinking',   text: "Organize the ideas into categories and evaluate them against criteria" },
    { arch: 'visionary',  sub: 'presence_of_meaning',   text: "Keep bringing the group back to the bigger picture — what are we actually trying to achieve?" },
  ]},
  { id: 'B5', section: 'baseline', text: "You learn something that changes your understanding of a topic you care about.", options: [
    { arch: 'hedonist',   sub: 'fun_seeking',           text: "Feel a rush of curiosity — want to explore more immediately" },
    { arch: 'warrior',    sub: 'threat_sensitivity',    text: "Reassess what you thought you knew — what else might be wrong?" },
    { arch: 'lover',      sub: 'empathic_concern',      text: "Want to share it with someone and discuss it together" },
    { arch: 'strategist', sub: 'cognitive_flexibility', text: "Start revising your mental model — how does this change your predictions?" },
    { arch: 'visionary',  sub: 'search_for_meaning',    text: "Wonder what this means at a deeper level — how does this shift what matters?" },
  ]},
  { id: 'B6', section: 'baseline', text: "You disagree with a decision your organization is making.", options: [
    { arch: 'hedonist',   sub: 'reward_responsiveness', text: "Express your frustration — it just doesn't feel right" },
    { arch: 'warrior',    sub: 'fight',                 text: "Prepare your objections carefully and pick the right moment to push back" },
    { arch: 'lover',      sub: 'empathic_concern',      text: "Talk to others who might feel the same — see if there's shared concern" },
    { arch: 'strategist', sub: 'analytical_thinking',   text: "Build a clear case with evidence and alternative proposals" },
    { arch: 'visionary',  sub: 'presence_of_meaning',   text: "Challenge whether the decision is consistent with the organization's stated values" },
  ]},
  { id: 'P1', section: 'pressure', text: "You're running late to something important.", options: [
    { arch: 'hedonist',   sub: null,                    text: "Don't stress too much — it'll be fine, people will understand" },
    { arch: 'warrior',    sub: 'flight',                text: "Drive faster, find shortcuts, do whatever it takes to minimize the damage" },
    { arch: 'lover',      sub: 'empathic_concern',      text: "Text ahead to let people know — you don't want them to worry" },
    { arch: 'strategist', sub: 'cognitive_flexibility', text: "Quickly calculate the fastest route and adjust the plan" },
    { arch: 'visionary',  sub: 'search_for_meaning',    text: "Ask yourself whether being late to this actually matters in the big picture" },
  ]},
  { id: 'P2', section: 'pressure', text: "Someone you care about is angry with you and you're not sure why.", options: [
    { arch: 'hedonist',   sub: null,                    text: "Try to lighten the mood or wait for it to blow over" },
    { arch: 'warrior',    sub: 'fight',                 text: "Brace yourself — figure out what you did and prepare to defend or fix it" },
    { arch: 'lover',      sub: 'personal_distress',     text: "Feel their pain — it hurts that they're hurting, regardless of who's right" },
    { arch: 'strategist', sub: 'analytical_thinking',   text: "Try to understand the root cause — what specifically triggered this?" },
    { arch: 'visionary',  sub: 'search_for_meaning',    text: "Reflect on whether this conflict points to a deeper misalignment in values" },
  ]},
  { id: 'P3', section: 'pressure', text: "You witness an injustice — someone being treated unfairly.", options: [
    { arch: 'hedonist',   sub: 'reward_responsiveness', text: "Feel outraged — your whole body reacts" },
    { arch: 'warrior',    sub: 'threat_sensitivity',    text: "Assess the situation — is it safe to intervene? What are the risks?" },
    { arch: 'lover',      sub: 'empathic_concern',      text: "Feel the other person's pain — your heart goes out to them" },
    { arch: 'strategist', sub: 'analytical_thinking',   text: "Think about the most effective way to address this — who has authority, what are the channels?" },
    { arch: 'visionary',  sub: 'presence_of_meaning',   text: "See it as a moral imperative — this is wrong and it matters beyond this moment" },
  ]},
  { id: 'P4', section: 'pressure', text: "You receive critical feedback that stings.", options: [
    { arch: 'hedonist',   sub: null,                    text: "Brush it off initially — you'll process it later when it doesn't sting so much" },
    { arch: 'warrior',    sub: 'fight',                 text: "Defend yourself — push back on the parts that are unfair" },
    { arch: 'lover',      sub: 'personal_distress',     text: "Wonder if the relationship is damaged — is the person upset with you?" },
    { arch: 'strategist', sub: 'analytical_thinking',   text: "Extract the useful information — what's accurate, what can you improve?" },
    { arch: 'visionary',  sub: 'search_for_meaning',    text: "Ask whether this feedback points to a gap between who you are and who you want to be" },
  ]},
  { id: 'P5', section: 'pressure', text: "You're in a group where conflict is rising and people are getting emotional.", options: [
    { arch: 'hedonist',   sub: 'fun_seeking',           text: "Try to inject humor or lightness to break the tension" },
    { arch: 'warrior',    sub: 'fight',                 text: "Hold your ground — don't let the emotional chaos make you back down" },
    { arch: 'lover',      sub: 'perspective_taking',    text: "Acknowledge what people are feeling — name the emotions in the room" },
    { arch: 'strategist', sub: 'analytical_thinking',   text: "Try to separate the emotional reactions from the actual problem to be solved" },
    { arch: 'visionary',  sub: 'presence_of_meaning',   text: "Remind the group what they're all here for — the shared purpose that transcends this disagreement" },
  ]},
  { id: 'P6', section: 'pressure', text: "You're facing a major life decision with significant consequences.", options: [
    { arch: 'hedonist',   sub: 'drive',                 text: "Trust your instincts — you usually know what feels right" },
    { arch: 'warrior',    sub: 'threat_sensitivity',    text: "Focus on protecting what you've built — minimize regret" },
    { arch: 'lover',      sub: 'perspective_taking',    text: "Consider how it affects the people closest to you" },
    { arch: 'strategist', sub: 'analytical_thinking',   text: "Build decision matrices, seek data, consult experts" },
    { arch: 'visionary',  sub: 'self_transcendence',    text: "Ask what you'll wish you had chosen when you look back at the end of your life" },
  ]},
  { id: 'P7', section: 'pressure', text: "You hear rumors about layoffs at your organization.", options: [
    { arch: 'hedonist',   sub: null,                    text: "Try not to think about it too much — worrying won't help" },
    { arch: 'warrior',    sub: 'flight',                text: "Update your resume, secure your position, prepare for the worst" },
    { arch: 'lover',      sub: 'empathic_concern',      text: "Check in with colleagues — how are people feeling? Who's vulnerable?" },
    { arch: 'strategist', sub: 'future_consequences',   text: "Assess the situation — read the financial signals, figure out which teams are at risk" },
    { arch: 'visionary',  sub: 'search_for_meaning',    text: "Reflect on whether this organization still aligns with what you want your career to stand for" },
  ]},
  { id: 'I1', section: 'identity', text: "You're asked to compromise on something you believe in to keep the peace.", options: [
    { arch: 'hedonist',   sub: null,                                              text: "It depends on how much it affects you personally — some battles aren't worth fighting" },
    { arch: 'warrior',    sub: 'fight',                                           text: "Refuse — if you compromise on this, where does it end?" },
    { arch: 'lover',      sub: 'perspective_taking',                              text: "Weigh the relationship — is the connection more important than being right?" },
    { arch: 'strategist', sub: 'future_consequences',                             text: "Assess the strategic implications — what precedent does this set?" },
    { arch: 'visionary',  sub: 'presence_of_meaning',                             text: "This is non-negotiable — some things matter more than peace" },
  ]},
  { id: 'I2', section: 'identity', text: "In the final hours of your life, what matters most to you?", options: [
    { arch: 'hedonist',   sub: ['reward_responsiveness', 'drive'],                text: "That you lived fully — tasted everything, held nothing back" },
    { arch: 'warrior',    sub: 'fight',                                           text: "That you protected the people and things that mattered — you held the line" },
    { arch: 'lover',      sub: 'empathic_concern',                                text: "That you loved well and were loved — the relationships were real" },
    { arch: 'strategist', sub: 'analytical_thinking',                             text: "That you made smart choices — built something, left things better than you found them" },
    { arch: 'visionary',  sub: 'self_transcendence',                              text: "That your life meant something — you served something larger than yourself" },
  ]},
];

const POINTS = [3, 2, 1]; // 1st pick = 3, 2nd = 2, 3rd = 1

// ───────────────────────────────────────────────────────────────────────────
// HELPERS
// ───────────────────────────────────────────────────────────────────────────

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildSession() {
  // Use all 15 in random order, but keep section order baseline → pressure → identity
  const baseline = POOL.filter((s) => s.section === 'baseline');
  const pressure = POOL.filter((s) => s.section === 'pressure');
  const identity = POOL.filter((s) => s.section === 'identity');
  return [...shuffle(baseline), ...shuffle(pressure), ...shuffle(identity)];
}

function calcScores(sessionScenarios, answers, optionShuffles) {
  const blank = () => ({ hedonist: 0, warrior: 0, lover: 0, strategist: 0, visionary: 0 });
  const scores = { baseline: blank(), pressure: blank(), identity: blank() };
  const counts = { baseline: 0, pressure: 0, identity: 0 };

  const subRaw = {};
  for (const arch of ARCHS) {
    subRaw[arch] = {};
    for (const subKey of Object.keys(SUBSCALES[arch])) {
      subRaw[arch][subKey] = { baseline: 0, pressure: 0, identity: 0 };
    }
  }

  sessionScenarios.forEach((s) => {
    counts[s.section]++;
    const ans = answers[s.id] || [];
    ans.forEach((arch, i) => {
      if (i < POINTS.length) {
        scores[s.section][arch] += POINTS[i];
        const opt = s.options.find((o) => o.arch === arch);
        if (opt && opt.sub) {
          const subKeys = Array.isArray(opt.sub) ? opt.sub : [opt.sub];
          subKeys.forEach((sk) => {
            if (subRaw[arch][sk]) subRaw[arch][sk][s.section] += POINTS[i];
          });
        }
      }
    });
  });

  const maxes = {
    baseline: counts.baseline * 3,
    pressure: counts.pressure * 3,
    identity: counts.identity * 3,
  };

  const pct = {};
  for (const sec of ['baseline', 'pressure', 'identity']) {
    pct[sec] = {};
    for (const a of ARCHS) {
      pct[sec][a] = maxes[sec] > 0 ? Math.round((scores[sec][a] / maxes[sec]) * 100) : 0;
    }
  }

  return { raw: scores, max: maxes, pct, subRaw };
}

function topN(scoreObj, n = 2) {
  return [...ARCHS].sort((a, b) => scoreObj[b] - scoreObj[a]).slice(0, n);
}
function bottomN(scoreObj, n = 2) {
  return [...ARCHS].sort((a, b) => scoreObj[a] - scoreObj[b]).slice(0, n);
}
function calcOverall(pct) {
  const out = {};
  for (const a of ARCHS) {
    out[a] = (pct.baseline[a] + pct.pressure[a] + pct.identity[a]) / 3;
  }
  return out;
}
function calcGap(pct) {
  const gap = {};
  for (const a of ARCHS) gap[a] = pct.baseline[a] - pct.pressure[a];
  return gap;
}

function computeSubPct(arch, subRaw) {
  // Convert section-by-section subscale scores to a single 0-100 % per subscale.
  // Sum raw points across sections, divide by max (= total items × 3).
  const out = {};
  for (const subKey of Object.keys(SUBSCALES[arch])) {
    const counts = SUBSCALE_COUNTS[arch][subKey];
    const totalItems = counts.total;
    const max = totalItems * 3;
    const sec = subRaw[arch][subKey];
    const raw = sec.baseline + sec.pressure + sec.identity;
    out[subKey] = max > 0 ? Math.round((raw / max) * 100) : 0;
  }
  return out;
}

// Radar SVG — five archetypes around a pentagon, baseline polygon + pressure polygon overlaid.
function buildRadarSVG(basePct, pressPct) {
  const cx = 240, cy = 200, maxR = 130;
  const labelR = maxR + 28;
  const angleFor = (i) => (-90 + i * 72) * Math.PI / 180;
  const pt = (i, frac) => {
    const a = angleFor(i);
    const r = maxR * frac;
    return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
  };
  const grid = [0.25, 0.5, 0.75, 1.0].map((level) => {
    const pts = ARCHS.map((_, i) => pt(i, level).map((n) => n.toFixed(1)).join(',')).join(' ');
    return `<polygon fill="none" stroke="#e8e3db" stroke-width="1" points="${pts}" />`;
  }).join('');
  const axes = ARCHS.map((_, i) => {
    const [x, y] = pt(i, 1);
    return `<line stroke="#e8e3db" stroke-width="1" x1="${cx}" y1="${cy}" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}" />`;
  }).join('');
  const baseFracs = ARCHS.map((a) => Math.max(0.02, basePct[a] / 100));
  const pressFracs = ARCHS.map((a) => Math.max(0.02, pressPct[a] / 100));
  const basePts = baseFracs.map((f, i) => pt(i, f).map((n) => n.toFixed(1)).join(',')).join(' ');
  const pressPts = pressFracs.map((f, i) => pt(i, f).map((n) => n.toFixed(1)).join(',')).join(' ');
  const baseDots = baseFracs.map((f, i) => {
    const [x, y] = pt(i, f);
    return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="3" fill="#fff" stroke="#D4A854" stroke-width="2" />`;
  }).join('');
  const pressDots = pressFracs.map((f, i) => {
    const [x, y] = pt(i, f);
    return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="3" fill="#fff" stroke="#A85454" stroke-width="2" />`;
  }).join('');
  const labels = ARCHS.map((arch, i) => {
    const a = angleFor(i);
    const x = cx + labelR * Math.cos(a);
    const y = cy + labelR * Math.sin(a);
    let anchor = 'middle';
    if (Math.cos(a) > 0.25) anchor = 'start';
    else if (Math.cos(a) < -0.25) anchor = 'end';
    let dy = '0.35em';
    if (Math.sin(a) < -0.5) dy = '0';
    else if (Math.sin(a) > 0.5) dy = '0.7em';
    const ad = AD[arch];
    return `<text x="${x.toFixed(1)}" y="${y.toFixed(1)}" text-anchor="${anchor}" dy="${dy}" fill="${ad.color}" font-family="'IBM Plex Mono', monospace" font-size="11" font-weight="700" letter-spacing="0.04em">${ad.icon} ${ad.name.toUpperCase()}</text>`;
  }).join('');
  return `<svg viewBox="0 0 480 400" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:auto;max-width:480px">
    ${grid}
    ${axes}
    <polygon fill="rgba(212,168,84,0.18)" stroke="#D4A854" stroke-width="2" points="${basePts}" />
    <polygon fill="rgba(168,84,84,0.18)" stroke="#A85454" stroke-width="2" stroke-dasharray="4,3" points="${pressPts}" />
    ${baseDots}
    ${pressDots}
    ${labels}
  </svg>`;
}

// ───────────────────────────────────────────────────────────────────────────
// SCOPED CSS — light/cream theme for the assessment
// ───────────────────────────────────────────────────────────────────────────

const LSA_CSS = `
  .lsa-root {
    --lsa-bg: #FAF8F5;
    --lsa-surface: #FFFFFF;
    --lsa-surface2: #F5F2EE;
    --lsa-text: #1a1a1a;
    --lsa-text2: #4a4a4a;
    --lsa-text3: #888;
    --lsa-border: #e8e3db;
    --lsa-border2: #d4cec6;
    --lsa-fdisplay: 'Playfair Display', Georgia, serif;
    --lsa-fbody: 'Source Serif 4', Georgia, serif;
    --lsa-fmono: 'IBM Plex Mono', monospace;
    background: var(--lsa-bg);
    color: var(--lsa-text);
    font-family: var(--lsa-fbody);
    line-height: 1.7;
    padding: 60px 20px 80px;
    min-height: 80vh;
  }
  .lsa-root *, .lsa-root *::before, .lsa-root *::after { box-sizing: border-box; }

  .lsa-inner { max-width: 720px; margin: 0 auto; }
  .lsa-wide { max-width: 880px; margin: 0 auto; }

  .lsa-back { display: inline-block; color: var(--lsa-text3); text-decoration: none; font-family: var(--lsa-fmono); font-size: 11px; letter-spacing: 0.18em; text-transform: uppercase; margin-bottom: 32px; cursor: pointer; }
  .lsa-back:hover { color: var(--lsa-text); }

  .lsa-eyebrow { font-family: var(--lsa-fmono); font-size: 10px; font-weight: 700; letter-spacing: 0.18em; text-transform: uppercase; color: var(--lsa-text3); margin-bottom: 18px; }
  .lsa-h1 { font-family: var(--lsa-fdisplay); font-size: clamp(36px, 7vw, 62px); font-weight: 800; letter-spacing: -0.03em; line-height: 1.04; margin: 0 0 14px; color: var(--lsa-text); }
  .lsa-sub { font-size: clamp(16px, 2.5vw, 20px); color: var(--lsa-text2); font-style: italic; margin-bottom: 32px; }
  .lsa-body { font-size: 15px; color: var(--lsa-text2); line-height: 1.78; margin-bottom: 14px; }
  .lsa-note { font-size: 13px; color: var(--lsa-text3); line-height: 1.6; font-style: italic; margin-bottom: 30px; }

  .lsa-section-label { font-family: var(--lsa-fmono); font-size: 9px; font-weight: 700; letter-spacing: 0.24em; text-transform: uppercase; color: var(--lsa-text3); text-align: center; margin-bottom: 8px; }

  .lsa-arch-grid { display: flex; flex-wrap: wrap; justify-content: center; gap: 14px; margin: 24px 0 36px; }
  .lsa-archbox { background: var(--lsa-surface); border: 1px solid; border-radius: 12px; padding: 22px 18px 20px; text-align: center; width: 200px; }
  .lsa-ab-icon { font-size: 28px; line-height: 1; margin-bottom: 8px; display: block; }
  .lsa-ab-eyebrow { font-family: var(--lsa-fmono); font-size: 10px; font-weight: 600; letter-spacing: 0.16em; text-transform: uppercase; margin-bottom: 4px; }
  .lsa-ab-name { font-family: var(--lsa-fdisplay); font-size: 17px; font-weight: 700; color: var(--lsa-text); margin-bottom: 6px; line-height: 1.2; }
  .lsa-ab-desc { font-size: 12px; color: var(--lsa-text2); line-height: 1.55; }

  .lsa-btn { display: inline-block; background: var(--lsa-text); color: var(--lsa-bg); text-decoration: none; font-family: var(--lsa-fmono); font-size: 12px; font-weight: 600; letter-spacing: 0.18em; text-transform: uppercase; padding: 14px 32px; border-radius: 4px; border: none; cursor: pointer; transition: background 0.25s ease, opacity 0.25s ease; }
  .lsa-btn:hover { background: #2A2A2A; }
  .lsa-btn:disabled { opacity: 0.4; cursor: not-allowed; }
  .lsa-btn-secondary { background: transparent; color: var(--lsa-text3); border: 1px solid var(--lsa-border2); }
  .lsa-btn-secondary:hover { background: var(--lsa-surface2); color: var(--lsa-text); }

  /* Scenario page */
  .lsa-progress { display: flex; align-items: center; justify-content: space-between; font-family: var(--lsa-fmono); font-size: 10px; letter-spacing: 0.18em; text-transform: uppercase; color: var(--lsa-text3); margin-bottom: 24px; }
  .lsa-progress-bar { height: 3px; background: var(--lsa-border); border-radius: 2px; margin-bottom: 32px; overflow: hidden; }
  .lsa-progress-fill { height: 100%; background: var(--lsa-text2); transition: width 0.3s ease; }
  .lsa-section-pill { display: inline-block; padding: 4px 12px; border-radius: 999px; font-family: var(--lsa-fmono); font-size: 9px; font-weight: 700; letter-spacing: 0.14em; text-transform: uppercase; margin-bottom: 18px; }
  .lsa-section-pill.lsa-baseline { background: rgba(143,168,118,0.12); color: #5D7A47; }
  .lsa-section-pill.lsa-pressure { background: rgba(168,84,84,0.12); color: #A85454; }
  .lsa-section-pill.lsa-identity { background: rgba(107,91,139,0.12); color: #6B5B8B; }
  .lsa-prompt { font-family: var(--lsa-fdisplay); font-size: clamp(22px, 4vw, 30px); font-weight: 700; line-height: 1.3; color: var(--lsa-text); margin: 0 0 12px; }
  .lsa-prompt-instructions { font-size: 13px; color: var(--lsa-text3); font-style: italic; margin-bottom: 24px; }

  .lsa-options { display: flex; flex-direction: column; gap: 12px; }
  .lsa-option { display: flex; align-items: flex-start; gap: 14px; padding: 16px 18px; background: var(--lsa-surface); border: 1.5px solid var(--lsa-border); border-radius: 8px; cursor: pointer; transition: border-color 0.18s ease, background 0.18s ease; text-align: left; font-family: inherit; }
  .lsa-option:hover { border-color: var(--lsa-border2); background: var(--lsa-surface2); }
  .lsa-option.lsa-selected { border-color: var(--lsa-text); background: var(--lsa-surface2); }
  .lsa-option-rank { flex-shrink: 0; width: 28px; height: 28px; border-radius: 50%; border: 1.5px solid var(--lsa-border2); display: flex; align-items: center; justify-content: center; font-family: var(--lsa-fmono); font-size: 12px; font-weight: 700; color: var(--lsa-text3); background: var(--lsa-bg); }
  .lsa-option.lsa-selected .lsa-option-rank { border-color: var(--lsa-text); background: var(--lsa-text); color: var(--lsa-bg); }
  .lsa-option-text { font-size: 15px; line-height: 1.6; color: var(--lsa-text); flex: 1; }

  .lsa-cap-hint { font-size: 12px; color: var(--lsa-text3); margin-top: 14px; font-style: italic; min-height: 18px; transition: color 0.2s ease; }
  .lsa-cap-hint.lsa-flash { color: #A85454; }

  .lsa-nav-row { display: flex; justify-content: space-between; align-items: center; margin-top: 32px; gap: 12px; flex-wrap: wrap; }

  /* Results page */
  .lsa-result-block { padding: 24px 26px; border-radius: 8px; margin-bottom: 14px; border: 1px solid; }
  .lsa-result-eyebrow { font-family: var(--lsa-fmono); font-size: 10px; font-weight: 700; letter-spacing: 0.18em; text-transform: uppercase; margin-bottom: 8px; }
  .lsa-result-title { font-family: var(--lsa-fdisplay); font-size: 22px; font-weight: 700; line-height: 1.2; margin-bottom: 10px; color: var(--lsa-text); }
  .lsa-result-text { font-size: 14.5px; line-height: 1.7; color: var(--lsa-text2); }
  .lsa-result-text strong { color: var(--lsa-text); }

  .lsa-radar-wrap { background: var(--lsa-surface); border: 1px solid var(--lsa-border); border-radius: 12px; padding: 30px 20px; margin: 24px 0; text-align: center; }
  .lsa-radar-legend { display: flex; justify-content: center; gap: 24px; font-family: var(--lsa-fmono); font-size: 10px; letter-spacing: 0.12em; text-transform: uppercase; color: var(--lsa-text2); margin-top: 14px; flex-wrap: wrap; }
  .lsa-legend-swatch { display: inline-block; width: 14px; height: 4px; vertical-align: middle; margin-right: 6px; border-radius: 2px; }

  .lsa-deep-toggle { display: flex; justify-content: center; margin: 24px 0; }
  .lsa-deep-panel { padding: 24px 28px; background: var(--lsa-surface); border: 1px solid var(--lsa-border); border-radius: 12px; margin-bottom: 14px; }
  .lsa-deep-panel-hdr { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; padding-bottom: 14px; border-bottom: 1px solid var(--lsa-border); }
  .lsa-deep-panel-icon { font-size: 22px; line-height: 1; }
  .lsa-deep-panel-name { font-family: var(--lsa-fdisplay); font-size: 18px; font-weight: 700; }
  .lsa-deep-panel-eyebrow { font-family: var(--lsa-fmono); font-size: 9px; font-weight: 700; letter-spacing: 0.16em; text-transform: uppercase; }
  .lsa-framing { font-size: 14.5px; line-height: 1.7; color: var(--lsa-text2); margin-bottom: 16px; font-style: italic; }
  .lsa-framing em { color: var(--lsa-text); }
  .lsa-sub-list { display: flex; flex-direction: column; gap: 12px; margin-bottom: 14px; }
  .lsa-sub-item { padding-left: 14px; border-left: 3px solid; }
  .lsa-sub-item-head { display: flex; justify-content: space-between; align-items: baseline; gap: 8px; flex-wrap: wrap; margin-bottom: 4px; }
  .lsa-sub-item-name { font-family: var(--lsa-fdisplay); font-size: 14px; font-weight: 700; color: var(--lsa-text); }
  .lsa-sub-item-pct { font-family: var(--lsa-fmono); font-size: 11px; font-weight: 600; }
  .lsa-sub-bar-track { height: 4px; background: var(--lsa-border); border-radius: 2px; margin: 6px 0 8px; }
  .lsa-sub-bar-fill { height: 100%; border-radius: 2px; transition: width 0.4s ease; }
  .lsa-sub-item-desc { font-size: 13px; color: var(--lsa-text2); line-height: 1.6; }
  .lsa-sub-item-desc strong { color: var(--lsa-text); }
  .lsa-sub-item-desc em { color: var(--lsa-text); }
  .lsa-combo { padding: 14px 18px; background: var(--lsa-surface2); border-left: 3px solid var(--lsa-text2); border-radius: 4px; margin-bottom: 10px; }
  .lsa-combo-label { font-family: var(--lsa-fmono); font-size: 9.5px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: var(--lsa-text2); margin-bottom: 6px; }
  .lsa-combo-content { font-size: 13.5px; line-height: 1.65; color: var(--lsa-text2); }
  .lsa-combo-content em { color: var(--lsa-text); }
  .lsa-also { font-size: 12.5px; color: var(--lsa-text3); line-height: 1.6; font-style: italic; margin-top: 12px; padding-top: 12px; border-top: 1px solid var(--lsa-border); }
  .lsa-uncovered { margin-top: 14px; padding: 12px 14px; background: var(--lsa-surface2); border-radius: 6px; border-left: 3px solid var(--lsa-text3); }
  .lsa-uncovered-hdr { font-family: var(--lsa-fmono); font-size: 9px; font-weight: 700; letter-spacing: 0.14em; text-transform: uppercase; color: var(--lsa-text3); margin-bottom: 4px; }
  .lsa-uncovered-name { font-family: var(--lsa-fdisplay); font-size: 13px; font-weight: 700; color: var(--lsa-text2); margin-bottom: 4px; }
  .lsa-uncovered-note { font-size: 12px; color: var(--lsa-text2); line-height: 1.55; }

  .lsa-synth-card { background: var(--lsa-surface); border: 1px solid var(--lsa-border); border-radius: 12px; padding: 28px 30px; margin: 32px 0; }
  .lsa-synth-eyebrow { font-family: var(--lsa-fmono); font-size: 10px; font-weight: 700; letter-spacing: 0.18em; text-transform: uppercase; color: #6B5B8B; margin-bottom: 10px; }
  .lsa-synth-title { font-family: var(--lsa-fdisplay); font-size: 22px; font-weight: 700; margin-bottom: 8px; color: var(--lsa-text); }
  .lsa-synth-sub { font-size: 14px; color: var(--lsa-text3); margin-bottom: 18px; font-style: italic; }
  .lsa-synth-body { font-size: 15px; line-height: 1.75; color: var(--lsa-text2); white-space: pre-wrap; }
  .lsa-synth-error { font-size: 13px; color: #A85454; line-height: 1.6; font-style: italic; }

  .lsa-actions { display: flex; gap: 12px; margin-top: 36px; flex-wrap: wrap; }

  @media (max-width: 540px) {
    .lsa-archbox { width: 100%; max-width: 320px; }
    .lsa-result-block { padding: 20px; }
  }

  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;0,800;1,400&family=Source+Serif+4:ital,wght@0,300;0,400;0,600;0,700;1,300;1,400&family=IBM+Plex+Mono:wght@400;500;600;700&display=swap');
`;

// ───────────────────────────────────────────────────────────────────────────
// COMPONENT
// ───────────────────────────────────────────────────────────────────────────

export default function LeadershipStanceAssessmentPage() {
  const navigate = useAppNavigate();

  const [page, setPage] = useState('intro'); // intro | assess | results
  const [sessionScenarios, setSessionScenarios] = useState(() => buildSession());
  const [optionShuffles, setOptionShuffles] = useState({});
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState({}); // scenarioId -> [arch1, arch2, arch3]
  const [capFlash, setCapFlash] = useState(false);
  const [showSubscales, setShowSubscales] = useState(false);
  const [synthState, setSynthState] = useState({ status: 'idle', text: '', error: '' });
  // status: idle | loading | done | error

  // Build per-scenario shuffled options once when session is created
  useEffect(() => {
    const map = {};
    sessionScenarios.forEach((s) => {
      map[s.id] = shuffle(s.options);
    });
    setOptionShuffles(map);
  }, [sessionScenarios]);

  const totalQ = sessionScenarios.length;
  const currentScenario = sessionScenarios[currentIdx];
  const currentAnswer = (currentScenario && answers[currentScenario.id]) || [];
  const isLast = currentIdx === sessionScenarios.length - 1;

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  function pickOption(arch) {
    if (!currentScenario) return;
    const s = currentScenario;
    const existing = answers[s.id] || [];
    if (existing.includes(arch)) {
      // Toggle off — remove and shift
      const next = existing.filter((a) => a !== arch);
      setAnswers({ ...answers, [s.id]: next });
      return;
    }
    if (existing.length >= 3) {
      // Cap reached — flash hint
      setCapFlash(true);
      setTimeout(() => setCapFlash(false), 1200);
      return;
    }
    setAnswers({ ...answers, [s.id]: [...existing, arch] });
  }

  function navBack() {
    if (currentIdx === 0) return;
    setCurrentIdx(currentIdx - 1);
    scrollToTop();
  }
  function navNext() {
    if (isLast) {
      setPage('results');
      scrollToTop();
      return;
    }
    setCurrentIdx(currentIdx + 1);
    scrollToTop();
  }

  function startAssessment() {
    setPage('assess');
    setCurrentIdx(0);
    setAnswers({});
    setSessionScenarios(buildSession());
    scrollToTop();
  }
  function retake() {
    setSessionScenarios(buildSession());
    setAnswers({});
    setCurrentIdx(0);
    setShowSubscales(false);
    setSynthState({ status: 'idle', text: '', error: '' });
    setPage('assess');
    scrollToTop();
  }

  // ─────────────────────────────────────────────────────────────────────────
  // INTRO
  // ─────────────────────────────────────────────────────────────────────────
  if (page === 'intro') {
    return (
      <div className="lsa-root">
        <style>{LSA_CSS}</style>
        <div className="lsa-inner">
          <a className="lsa-back" onClick={(e) => { e.preventDefault(); navigate('home'); }} href="#">← Back to tools</a>
          <div className="lsa-eyebrow">Self-assessment · 15 scenarios</div>
          <h1 className="lsa-h1">Leadership Stance Assessment</h1>
          <p className="lsa-sub">Which of the five archetypes do you lead with — and which go quiet under pressure?</p>
          <p className="lsa-body">
            This assessment maps your leadership stance across five evolutionary archetypes that show up
            in every adult: the <strong>Hedonist</strong>, <strong>Warrior</strong>, <strong>Lover</strong>,
            <strong> Strategist</strong>, and <strong>Visionary</strong>.
          </p>
          <p className="lsa-body">
            You'll see 15 short scenarios. For each, rank the top three responses that feel most like you —
            most natural first. The point isn't to pick "the right answer." It's to notice your patterns:
            where you start, where you go when stressed, and which capacities are quietest in you right now.
          </p>
          <p className="lsa-note">
            Takes 5–7 minutes. No signup. Your answers stay in this browser tab — nothing is saved or sent.
          </p>

          <div className="lsa-section-label">The five archetypes</div>
          <div className="lsa-arch-grid">
            {ARCHS.map((a) => {
              const ad = AD[a];
              return (
                <div key={a} className="lsa-archbox" style={{ borderColor: ad.border, background: ad.bg }}>
                  <span className="lsa-ab-icon" style={{ color: ad.color }}>{ad.icon}</span>
                  <div className="lsa-ab-eyebrow" style={{ color: ad.color }}>{ad.name}</div>
                  <div className="lsa-ab-name">{ad.tagline}</div>
                </div>
              );
            })}
          </div>

          <div className="lsa-actions">
            <button className="lsa-btn" onClick={startAssessment}>Begin →</button>
          </div>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // ASSESSMENT
  // ─────────────────────────────────────────────────────────────────────────
  if (page === 'assess') {
    if (!currentScenario || !optionShuffles[currentScenario.id]) {
      return <div className="lsa-root"><style>{LSA_CSS}</style><div className="lsa-inner"><div className="lsa-body">Loading…</div></div></div>;
    }
    const shuffled = optionShuffles[currentScenario.id];
    const ans = currentAnswer;
    const filledCount = ans.length;
    const canProceed = filledCount >= 1; // require at least 1, encourage 3
    const sectionLabel = currentScenario.section.charAt(0).toUpperCase() + currentScenario.section.slice(1);
    const progress = ((currentIdx) / totalQ) * 100;

    return (
      <div className="lsa-root">
        <style>{LSA_CSS}</style>
        <div className="lsa-inner">
          <a className="lsa-back" onClick={(e) => { e.preventDefault(); if (window.confirm('Leave the assessment? Your progress will be lost.')) navigate('home'); }} href="#">← Back to tools</a>

          <div className="lsa-progress">
            <span>Scenario {currentIdx + 1} of {totalQ}</span>
            <span>{sectionLabel}</span>
          </div>
          <div className="lsa-progress-bar"><div className="lsa-progress-fill" style={{ width: `${progress}%` }} /></div>

          <span className={`lsa-section-pill lsa-${currentScenario.section}`}>{sectionLabel}</span>

          <h2 className="lsa-prompt">{currentScenario.text}</h2>
          <p className="lsa-prompt-instructions">You can choose up to three. Click the response that feels <em>most</em> like you first, then your second-most, then your third.</p>

          <div className="lsa-options">
            {shuffled.map((opt) => {
              const rank = ans.indexOf(opt.arch);
              const selected = rank >= 0;
              return (
                <button
                  key={opt.arch}
                  type="button"
                  className={`lsa-option${selected ? ' lsa-selected' : ''}`}
                  onClick={() => pickOption(opt.arch)}
                >
                  <span className="lsa-option-rank">{selected ? rank + 1 : '·'}</span>
                  <span className="lsa-option-text">{opt.text}</span>
                </button>
              );
            })}
          </div>

          <div className={`lsa-cap-hint${capFlash ? ' lsa-flash' : ''}`}>
            {capFlash
              ? "You can only rank three — tap a selected option to deselect it first."
              : filledCount < 3
                ? `Pick ${3 - filledCount} more, or continue with what you have.`
                : "All three picked. Continue when ready."}
          </div>

          <div className="lsa-nav-row">
            <button
              className="lsa-btn lsa-btn-secondary"
              onClick={navBack}
              disabled={currentIdx === 0}
            >
              ← Back
            </button>
            <button
              className="lsa-btn"
              onClick={navNext}
              disabled={!canProceed}
            >
              {isLast ? 'See my results →' : 'Next →'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // RESULTS
  // ─────────────────────────────────────────────────────────────────────────
  return <ResultsView
    sessionScenarios={sessionScenarios}
    answers={answers}
    optionShuffles={optionShuffles}
    showSubscales={showSubscales}
    setShowSubscales={setShowSubscales}
    synthState={synthState}
    setSynthState={setSynthState}
    onRetake={retake}
    onBackToTools={() => navigate('home')}
  />;
}

// ───────────────────────────────────────────────────────────────────────────
// RESULTS VIEW
// ───────────────────────────────────────────────────────────────────────────

function ResultsView({ sessionScenarios, answers, optionShuffles, showSubscales, setShowSubscales, synthState, setSynthState, onRetake, onBackToTools }) {
  const scored = useMemo(() => calcScores(sessionScenarios, answers, optionShuffles), [sessionScenarios, answers, optionShuffles]);
  const overall = useMemo(() => calcOverall(scored.pct), [scored]);
  const gap = useMemo(() => calcGap(scored.pct), [scored]);

  const leadTop = topN(scored.pct.baseline, 2);
  const pressTop = topN(scored.pct.pressure, 2);
  const overallBottom = bottomN(overall, 2);
  const underTop = overallBottom; // two least-used overall

  // Largest gap (positive = goes offline under pressure; negative = comes online under pressure)
  const gapEntries = ARCHS.map((a) => [a, gap[a]]);
  gapEntries.sort((x, y) => y[1] - x[1]); // largest positive first
  const gapArch = gapEntries[0][0];
  const gapVal = gapEntries[0][1];

  const radarSVG = buildRadarSVG(scored.pct.baseline, scored.pct.pressure);

  async function handleSynthesize() {
    setSynthState({ status: 'loading', text: '', error: '' });
    const summary = `Leadership Stance Assessment results:
- Baseline (top 2): ${leadTop.map((a) => `${AD[a].name} ${scored.pct.baseline[a]}%`).join(', ')}
- Under pressure (top 2): ${pressTop.map((a) => `${AD[a].name} ${scored.pct.pressure[a]}%`).join(', ')}
- Underused overall (bottom 2): ${underTop.map((a) => `${AD[a].name} ${Math.round(overall[a])}%`).join(', ')}
- Largest gap (baseline minus pressure): ${AD[gapArch].name} ${gapVal > 0 ? '+' : ''}${gapVal}%
- Full baseline %: ${ARCHS.map((a) => `${AD[a].name}=${scored.pct.baseline[a]}`).join(', ')}
- Full pressure %: ${ARCHS.map((a) => `${AD[a].name}=${scored.pct.pressure[a]}`).join(', ')}
- Full identity %: ${ARCHS.map((a) => `${AD[a].name}=${scored.pct.identity[a]}`).join(', ')}`;

    const prompt = `You are reading the results of a leadership stance assessment that maps a person across five archetypes: Hedonist (seeking drive), Warrior (protective drive), Lover (empathy capacity), Strategist (imagination capacity), Visionary (meaning capacity).

Here are this person's results:

${summary}

Write a thoughtful, integrated 4–6 sentence reflection that:
1. Names the specific pattern (not just "you are high X" — what does this combination of high/low/gap mean as a stance?)
2. Identifies the most useful tension or growing edge for this person to notice (often the gap between baseline and pressure, or the underused capacity)
3. Speaks directly to the person ("you") in a warm, observant tone — like a thoughtful coach who has seen many of these

Do not list the scores back. Do not use bullet points. Do not start with "Based on..." or "Your results show...". Start with the observation itself. Avoid generic platitudes.`;

    try {
      const data = await synthesize({
        model: 'claude-sonnet-4-5',
        max_tokens: 600,
        messages: [{ role: 'user', content: prompt }],
      });
      const text = extractText(data);
      if (!text) throw new Error('empty response');
      setSynthState({ status: 'done', text, error: '' });
    } catch (err) {
      setSynthState({
        status: 'error',
        text: '',
        error: 'AI synthesis is unavailable right now. Your reflections above stand on their own — and the rule-based interpretation below covers the same ground in a more structured way.',
      });
    }
  }

  function downloadResults() {
    // Build a self-contained HTML document with scores, archetypes, gap analysis, and (if generated) AI synthesis.
    const dateStr = new Date().toISOString().slice(0, 10);

    const archBlock = (arch, kind) => {
      const ad = AD[arch];
      const text = ad[kind] || '';
      return `<div class="archblock" style="border-color:${ad.color}66;background:${ad.bg};">
        <div class="archblock-eyebrow" style="color:${ad.color};">${ad.icon} ${escapeHTML(ad.name)} · ${kind === 'lead' ? 'leading' : kind === 'pressure' ? 'under pressure' : 'underused'}</div>
        <div class="archblock-text">${escapeHTML(text)}</div>
      </div>`;
    };

    const synthBlock = synthState.status === 'done'
      ? `<section class="synth"><div class="synth-eyebrow">AI synthesis</div>
         <div class="synth-text">${escapeHTML(synthState.text).replace(/\n/g, '<br>')}</div></section>`
      : '';

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8">
<title>Leadership Stance Assessment · Results</title>
<style>
  body { font-family: Georgia, 'Source Serif 4', serif; max-width: 760px; margin: 40px auto; padding: 0 24px; color: #1a1a1a; line-height: 1.7; background: #FAF8F5; }
  h1 { font-family: 'Playfair Display', Georgia, serif; font-size: 36px; font-weight: 800; margin: 0 0 8px; letter-spacing: -0.02em; }
  h2 { font-family: 'Playfair Display', Georgia, serif; font-size: 22px; font-weight: 700; margin: 36px 0 14px; }
  .eyebrow { font-size: 11px; letter-spacing: 0.22em; text-transform: uppercase; color: #888; font-family: monospace; margin-bottom: 16px; }
  .sub { font-size: 16px; color: #4a4a4a; font-style: italic; margin-bottom: 36px; }
  .scoretable { width: 100%; border-collapse: collapse; margin: 16px 0 28px; font-size: 14px; }
  .scoretable th, .scoretable td { padding: 10px 12px; border-bottom: 1px solid #e8e3db; text-align: left; }
  .scoretable th { font-family: monospace; font-size: 10px; letter-spacing: 0.12em; text-transform: uppercase; color: #888; }
  .scoretable td.archname { font-family: 'Playfair Display', Georgia, serif; font-weight: 700; }
  .scoretable td.num { text-align: right; font-family: monospace; }
  .archblock { padding: 18px 22px; border-radius: 6px; border: 1px solid; margin-bottom: 12px; }
  .archblock-eyebrow { font-family: monospace; font-size: 11px; font-weight: 700; letter-spacing: 0.16em; text-transform: uppercase; margin-bottom: 8px; }
  .archblock-text { font-size: 14.5px; color: #2a2a2a; line-height: 1.7; }
  .gap { padding: 18px 22px; background: #f0ede8; border-left: 3px solid #6B5B8B; border-radius: 4px; margin: 16px 0 28px; }
  .gap-eyebrow { font-family: monospace; font-size: 10px; font-weight: 700; letter-spacing: 0.18em; text-transform: uppercase; color: #6B5B8B; margin-bottom: 6px; }
  .gap-text { font-size: 14.5px; color: #2a2a2a; line-height: 1.7; }
  .synth { padding: 24px 26px; background: #fff; border: 1px solid #e8e3db; border-radius: 8px; margin: 28px 0; }
  .synth-eyebrow { font-family: monospace; font-size: 10px; font-weight: 700; letter-spacing: 0.18em; text-transform: uppercase; color: #6B5B8B; margin-bottom: 10px; }
  .synth-text { font-size: 15px; color: #2a2a2a; line-height: 1.75; }
  .footer { margin-top: 48px; padding-top: 20px; border-top: 1px solid #E0DFD2; font-size: 11px; color: #999; text-align: center; font-family: monospace; letter-spacing: 0.1em; text-transform: uppercase; }
</style></head><body>

<div class="eyebrow">InciteU · Self-assessment</div>
<h1>Leadership Stance Assessment</h1>
<p class="sub">A snapshot of your stance across the five archetypes — at baseline, under pressure, and in identity-defining moments.</p>

<h2>Your scores</h2>
<table class="scoretable">
  <thead>
    <tr><th>Archetype</th><th>Baseline</th><th>Pressure</th><th>Identity</th><th>Overall</th></tr>
  </thead>
  <tbody>
    ${ARCHS.map((a) => `<tr>
      <td class="archname" style="color:${AD[a].color};">${AD[a].icon} ${escapeHTML(AD[a].name)}</td>
      <td class="num">${scored.pct.baseline[a]}%</td>
      <td class="num">${scored.pct.pressure[a]}%</td>
      <td class="num">${scored.pct.identity[a]}%</td>
      <td class="num">${Math.round(overall[a])}%</td>
    </tr>`).join('')}
  </tbody>
</table>

<h2>Where you lead from</h2>
${leadTop.map((a) => archBlock(a, 'lead')).join('')}

<h2>Where you go under pressure</h2>
${pressTop.map((a) => archBlock(a, 'pressure')).join('')}

<h2>What's quiet right now</h2>
${underTop.map((a) => archBlock(a, 'underuse')).join('')}

<h2>The gap to notice</h2>
<div class="gap">
  <div class="gap-eyebrow">Largest baseline → pressure gap</div>
  <div class="gap-text">
    <strong>${escapeHTML(AD[gapArch].name)}</strong>
    ${gapVal > 0
      ? ` drops <strong>${gapVal} points</strong> from baseline (${scored.pct.baseline[gapArch]}%) to pressure (${scored.pct.pressure[gapArch]}%). This is the capacity that goes quietest when stress arrives.`
      : gapVal < 0
        ? ` actually rises by <strong>${Math.abs(gapVal)} points</strong> under pressure — pressure activates this archetype rather than shutting it down.`
        : ` stays flat from baseline to pressure.`}
  </div>
</div>

${synthBlock}

<div class="footer">From InciteU · ${dateStr}</div>
</body></html>`;

    downloadHTML(html, `leadership-stance-${dateStr}.html`);
  }

  return (
    <div className="lsa-root">
      <style>{LSA_CSS}</style>
      <div className="lsa-wide">
        <a className="lsa-back" onClick={(e) => { e.preventDefault(); onBackToTools(); }} href="#">← Back to tools</a>
        <div className="lsa-eyebrow">Your results</div>
        <h1 className="lsa-h1">Your <em style={{ fontStyle: 'italic' }}>leadership stance</em>.</h1>
        <p className="lsa-sub">A snapshot of where you lead from, where you go under pressure, and what's quiet right now.</p>

        {/* Radar chart */}
        <div className="lsa-radar-wrap">
          <div dangerouslySetInnerHTML={{ __html: radarSVG }} />
          <div className="lsa-radar-legend">
            <span><span className="lsa-legend-swatch" style={{ background: '#D4A854' }} /> Baseline</span>
            <span><span className="lsa-legend-swatch" style={{ background: '#A85454', borderTop: '1px dashed #A85454' }} /> Under pressure</span>
          </div>
        </div>

        {/* Where you lead from */}
        <h2 className="lsa-h1" style={{ fontSize: 26, marginTop: 32, marginBottom: 16 }}>Where you lead from</h2>
        {leadTop.map((arch) => {
          const ad = AD[arch];
          return (
            <div key={`lead-${arch}`} className="lsa-result-block" style={{ background: ad.bg, borderColor: ad.border }}>
              <div className="lsa-result-eyebrow" style={{ color: ad.color }}>{ad.icon} {ad.name} · {scored.pct.baseline[arch]}% at baseline</div>
              <div className="lsa-result-title">{ad.tagline}</div>
              <div className="lsa-result-text">{ad.lead}</div>
            </div>
          );
        })}

        {/* Where you go under pressure */}
        <h2 className="lsa-h1" style={{ fontSize: 26, marginTop: 32, marginBottom: 16 }}>Where you go under pressure</h2>
        {pressTop.map((arch) => {
          const ad = AD[arch];
          return (
            <div key={`press-${arch}`} className="lsa-result-block" style={{ background: ad.bg, borderColor: ad.border }}>
              <div className="lsa-result-eyebrow" style={{ color: ad.color }}>{ad.icon} {ad.name} · {scored.pct.pressure[arch]}% under pressure</div>
              <div className="lsa-result-title">When the heat is on…</div>
              <div className="lsa-result-text">{ad.pressure}</div>
            </div>
          );
        })}

        {/* What's quiet */}
        <h2 className="lsa-h1" style={{ fontSize: 26, marginTop: 32, marginBottom: 16 }}>What's quiet right now</h2>
        {underTop.map((arch) => {
          const ad = AD[arch];
          return (
            <div key={`under-${arch}`} className="lsa-result-block" style={{ background: ad.bg, borderColor: ad.border }}>
              <div className="lsa-result-eyebrow" style={{ color: ad.color }}>{ad.icon} {ad.name} · {Math.round(overall[arch])}% overall</div>
              <div className="lsa-result-title">The capacity worth growing</div>
              <div className="lsa-result-text">{ad.underuse}</div>
            </div>
          );
        })}

        {/* Gap analysis */}
        <h2 className="lsa-h1" style={{ fontSize: 26, marginTop: 32, marginBottom: 16 }}>The gap to notice</h2>
        <div className="lsa-result-block" style={{ background: '#f0ede8', borderColor: '#d4cec6' }}>
          <div className="lsa-result-eyebrow" style={{ color: '#6B5B8B' }}>Largest baseline → pressure gap</div>
          <div className="lsa-result-title">{AD[gapArch].icon} {AD[gapArch].name}</div>
          <div className="lsa-result-text">
            {gapVal > 0
              ? <>Drops <strong>{gapVal} points</strong> — from <strong>{scored.pct.baseline[gapArch]}%</strong> at baseline to <strong>{scored.pct.pressure[gapArch]}%</strong> under pressure. This is the capacity that goes quietest when stress arrives. Worth noticing — what happens to your access to this when the temperature rises?</>
              : gapVal < 0
                ? <>Actually <strong>rises by {Math.abs(gapVal)} points</strong> under pressure. Pressure activates this archetype rather than shutting it down — which is a relatively unusual pattern, and worth understanding.</>
                : <>Stays roughly flat from baseline to pressure — your full archetype profile is consistent across calm and stress.</>}
          </div>
        </div>

        {/* AI Synthesis */}
        <div className="lsa-synth-card">
          <div className="lsa-synth-eyebrow">AI synthesis · optional</div>
          <div className="lsa-synth-title">A reflection on your specific pattern</div>
          <p className="lsa-synth-sub">A short, personalized read of your stance — not a verdict, just another angle.</p>
          {synthState.status === 'idle' && (
            <button className="lsa-btn" onClick={handleSynthesize}>Synthesize my pattern</button>
          )}
          {synthState.status === 'loading' && (
            <p className="lsa-result-text" style={{ fontStyle: 'italic' }}>Reading your pattern…</p>
          )}
          {synthState.status === 'done' && (
            <div className="lsa-synth-body">{synthState.text}</div>
          )}
          {synthState.status === 'error' && (
            <p className="lsa-synth-error">{synthState.error}</p>
          )}
        </div>

        {/* Subscale toggle */}
        <div className="lsa-deep-toggle">
          <button className="lsa-btn lsa-btn-secondary" onClick={() => setShowSubscales((s) => !s)}>
            {showSubscales ? 'Hide subscale deep-dive ▲' : 'Show subscale deep-dive ▼'}
          </button>
        </div>

        {showSubscales && (
          <div>
            {ARCHS.map((arch) => {
              const ad = AD[arch];
              const detail = ARCHETYPE_DETAILS[arch];
              if (!detail) return null;
              const subPct = computeSubPct(arch, scored.subRaw);
              const matchingCombos = (detail.combinations || []).filter((c) => c.detect(subPct));
              return (
                <div key={`deep-${arch}`} className="lsa-deep-panel">
                  <div className="lsa-deep-panel-hdr" style={{ borderColor: ad.border }}>
                    <span className="lsa-deep-panel-icon" style={{ color: ad.color }}>{ad.icon}</span>
                    <div>
                      <div className="lsa-deep-panel-eyebrow" style={{ color: ad.color }}>{ad.tagline}</div>
                      <div className="lsa-deep-panel-name">{ad.name}</div>
                    </div>
                  </div>
                  <p className="lsa-framing" dangerouslySetInnerHTML={{ __html: detail.framing }} />
                  <div className="lsa-sub-list">
                    {detail.subscales.map((sub) => (
                      <div key={sub.key} className="lsa-sub-item" style={{ borderColor: ad.color }}>
                        <div className="lsa-sub-item-head">
                          <span className="lsa-sub-item-name">{sub.name}</span>
                          <span className="lsa-sub-item-pct" style={{ color: ad.color }}>{subPct[sub.key]}%</span>
                        </div>
                        <div className="lsa-sub-bar-track"><div className="lsa-sub-bar-fill" style={{ width: `${subPct[sub.key]}%`, background: ad.color }} /></div>
                        <div className="lsa-sub-item-desc" dangerouslySetInnerHTML={{ __html: sub.desc }} />
                      </div>
                    ))}
                  </div>
                  {matchingCombos.length > 0 && (
                    <div>
                      {matchingCombos.map((c) => (
                        <div key={c.id} className="lsa-combo">
                          <div className="lsa-combo-label">{c.label}</div>
                          <div className="lsa-combo-content" dangerouslySetInnerHTML={{ __html: c.content }} />
                        </div>
                      ))}
                    </div>
                  )}
                  {detail.also && <div className="lsa-also" dangerouslySetInnerHTML={{ __html: detail.also }} />}
                  {detail.uncovered && (
                    <div className="lsa-uncovered">
                      <div className="lsa-uncovered-hdr">Not measured here</div>
                      <div className="lsa-uncovered-name">{detail.uncovered.name}</div>
                      <div className="lsa-uncovered-note" dangerouslySetInnerHTML={{ __html: detail.uncovered.note }} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <div className="lsa-actions">
          <button className="lsa-btn" onClick={downloadResults}>Download my results</button>
          <button className="lsa-btn lsa-btn-secondary" onClick={onRetake}>Retake assessment</button>
          <button className="lsa-btn lsa-btn-secondary" onClick={onBackToTools}>Back to tools</button>
        </div>
      </div>
    </div>
  );
}
