
// ══════════════════════════════════════════════════════════════════
// CAPACITY_DETAILS — legacy alias to CAPACITY_DETAIL
// ══════════════════════════════════════════════════════════════════
// (CAPACITY_DETAILS retained as the legacy object below; no alias needed)
const CAPACITIES = ['egoist', 'veteran', 'lover', 'strategist', 'visionary'];

// Sub-archetype ordered list — 3 Pursuing + 3 Protecting.
// Used by calcScores to iterate and compute per-sub percentages.
const SUB_ARCHS = ['achiever', 'hedonist', 'adventurer', 'sentinel', 'warrior', 'evader'];

// Legacy alias — some helper code references ARCHS as the canonical key list.
// In the new model, ARCHS is contextual: SUB_ARCHS in Section 1 (drive), CAPACITIES in Sections 2-3.
const ARCHS = CAPACITIES;

// ══════════════════════════════════════════════════════════════════
// DRIVE DETAIL — the two primary motivational orientations
// ══════════════════════════════════════════════════════════════════
const DRIVE_DETAIL = {
  pursuing: {
    name: 'Pursuing',
    tagline: 'The approach drive',
    color: '#D4A854', bg: 'rgba(212,168,84,.08)', border: 'rgba(212,168,84,.35)',
    lead: "Pursue what supports flourishing. The Pursuing drive orients you toward what's alive, energizing, and worth approaching. When it's online you move toward people, ideas, and experiences that expand you.",
  },
  protecting: {
    name: 'Protecting',
    tagline: 'The avoid drive',
    color: '#A85454', bg: 'rgba(168,84,84,.08)', border: 'rgba(168,84,84,.35)',
    lead: "Avoid what threatens survival. The Protecting drive orients you toward what's risky, costly, or worth guarding against. When it's online you watch for danger and act to preserve what matters.",
  },
};

// ══════════════════════════════════════════════════════════════════
// SUB-ARCHETYPE DETAIL — the six flavors of how drives express
// Each has an 'access' (what this gives you) and 'limit' (where it caps you).
// This is the coaching content surfaced when a sub-archetype is identified.
// ══════════════════════════════════════════════════════════════════
const SUB_ARCH_DETAIL = {
  achiever: {
    name: 'Achiever', drive: 'pursuing',
    tagline: 'Drive — sustained pursuit',
    access: "Momentum, direction, the ability to set a target and push toward it. You build things, finish things, and people can count on you to deliver.",
    limit: "Identity fused with output. Burnout when you can't perform. Relationships and rest can feel like obstacles to optimize around.",
  },
  hedonist: {
    name: 'Hedonist', drive: 'pursuing',
    tagline: 'Reward responsiveness — present pleasure',
    access: "Vitality, presence, the ability to take in good things fully. You can feel what's alive in a moment and let it move you.",
    limit: "Avoiding discomfort that needs facing. \"If it doesn't feel good, it isn't right\" can become a trap that keeps you from hard truths.",
  },
  adventurer: {
    name: 'Adventurer', drive: 'pursuing',
    tagline: 'Fun seeking — novelty and exploration',
    access: "Curiosity, openness, willingness to try. You expand what's possible. New environments, new ideas, new people energize rather than threaten you.",
    limit: "Sustained focus and mastery can feel deadening. \"What's next?\" crowds out \"what is.\" Commitments can chafe.",
  },
  sentinel: {
    name: 'Sentinel', drive: 'protecting',
    tagline: 'Threat sensitivity — vigilance and anticipation',
    access: "Foresight, preparation, seeing what others miss. You spot risks early and plan around them. People feel safer because you're watching.",
    limit: "Anticipation crowds out the present. Vigilance becomes exhausting. Threats appear where there are none. Hard to rest.",
  },
  warrior: {
    name: 'Warrior', drive: 'protecting',
    tagline: 'Fight — active defense',
    access: "The capacity to confront, hold ground, refuse to back down. You\'ll defend what matters when others freeze. People know where you stand.",
    limit: "Fights you didn't need to pick. Conflict as default. The cost of constantly being on guard — to your body, your relationships, your peace.",
  },
  evader: {
    name: 'Evader', drive: 'protecting',
    tagline: 'Flight — strategic withdrawal',
    access: "The ability to step back, disengage, protect your energy. You know which battles to skip. You preserve yourself for what actually matters.",
    limit: "Avoidance dressed up as wisdom. Problems compound when not addressed. Isolation. The exit becomes the default instead of the option.",
  },
};


// ══════════════════════════════════════════════════════════════════
// SUB_ARCH_BY_DRIVE — maps drive → its 3 sub-archetype keys
// Used by calcScores to attribute Section 1 picks to the right drive
// and by topSubArch to sort sub-archetypes within a drive.
// ══════════════════════════════════════════════════════════════════
const SUB_ARCH_BY_DRIVE = {
  pursuing:   ['achiever', 'hedonist', 'adventurer'],
  protecting: ['sentinel', 'warrior', 'evader'],
};

// ══════════════════════════════════════════════════════════════════
// CAPACITY DETAIL — the five evolved capacities you USE to engage the world
// Each has a strength + shadow in BOTH Pursuing and Protecting modes.
// ══════════════════════════════════════════════════════════════════
const CAPACITY_DETAIL = {
  egoist: {
    name: 'Egoist', tagline: 'The body capacity', shortTag: 'Body',
    icon: '◉', color: '#C77C58', bg: 'rgba(199,124,88,.08)', border: 'rgba(199,124,88,.35)',
    lead: "Where pleasure and pain register. Sensation, interoception, instinct. The oldest capacity — the body itself, sensing the world before any thought arrives.",
    pursuingStrength: "Sensing what energizes you. Savoring pleasure. Being at home in your body. Trusting your gut as a source of information.",
    pursuingShadow: "Pursuit of pleasure becomes its own end. Disconnection from longer-term consequences. \"If it feels good, it must be right.\"",
    protectingStrength: "Body wisdom. The gut-no. Embodied early-warning of threat or wrongness. Listening when your body says stop.",
    protectingShadow: "Hypervigilance about bodily sensations. Somatic anxiety. Treating every signal as alarm. The body as enemy rather than ally.",
  },
  veteran: {
    name: 'Veteran', tagline: 'The memory capacity', shortTag: 'Memory',
    icon: '⟲', color: '#7B8189', bg: 'rgba(123,129,137,.08)', border: 'rgba(123,129,137,.35)',
    lead: "Where the body's wisdom gets encoded as patterns. Learned associations, anticipation, expectation. Memory as a working resource for the present.",
    pursuingStrength: "Drawing on experience. Anticipating with pleasure. Learning from what's worked. Letting past wins fuel current effort.",
    pursuingShadow: "Living in the past. Recycling old satisfactions. Resistance to the new. Pattern that no longer fits the territory.",
    protectingStrength: "Pattern recognition for threat. Cautioning from past harm. Not repeating mistakes. Memory as a sentinel that warns.",
    protectingShadow: "Worry and rumination. What-if loops. Replaying old wounds. Not allowing the past to be the past.",
  },
  lover: {
    name: 'Lover', tagline: 'The empathy capacity', shortTag: 'Empathy',
    icon: '♡', color: '#8B5E5E', bg: 'rgba(139,94,94,.08)', border: 'rgba(139,94,94,.35)',
    lead: "The shared social brain — what Play built between us. Reading others, feeling with others, building connection. The capacity most universally shared.",
    pursuingStrength: "Genuine connection. Reading people accurately. Offering warmth and presence. Building trust that lasts.",
    pursuingShadow: "Losing yourself in others' needs. Identity through relationships. Hard to know what you want apart from those around you.",
    protectingStrength: "Sensing others' distress. Protecting relationships. Reading the room. Knowing when something is off between people.",
    protectingShadow: "People-pleasing as armor. Boundary collapse. Avoiding conflict that's needed. Caretaking that costs the self.",
  },
  strategist: {
    name: 'Strategist', tagline: 'The imagination capacity', shortTag: 'Imagination',
    icon: '◈', color: '#5B6B8B', bg: 'rgba(91,107,139,.08)', border: 'rgba(91,107,139,.35)',
    lead: "Private simulation. Modeling future moves, weighing options, seeing patterns. The capacity for analytical reasoning and counterfactual thinking.",
    pursuingStrength: "Modeling futures. Finding creative paths. Seeing patterns others miss. Building elegant plans that actually work.",
    pursuingShadow: "Living in models more than reality. Planning instead of doing. The map mistaken for the territory.",
    protectingStrength: "Anticipating contingencies. Troubleshooting in advance. Risk assessment. Holding the long-arc consequences in view.",
    protectingShadow: "Analysis paralysis. Solving feelings instead of feeling them. Control as defense against uncertainty.",
  },
  visionary: {
    name: 'Visionary', tagline: 'The meaning capacity', shortTag: 'Meaning',
    icon: '✧', color: '#6B5B8B', bg: 'rgba(107,91,139,.08)', border: 'rgba(107,91,139,.35)',
    lead: "Where individual purpose and moral frame get constructed. Meaning-making, values, the sense that life has direction. The newest capacity.",
    pursuingStrength: "Sense of purpose. Meaning-making. Orientation toward what matters. The deep yes that carries you through difficulty.",
    pursuingShadow: "Idealism that ignores practical reality. Living for what should be at the cost of what is.",
    protectingStrength: "Holding the bigger picture under pressure. Refusing to compromise what matters. Moral courage when the heat rises.",
    protectingShadow: "Moral rigidity. Self-righteousness. Using meaning as an escape from messy reality. Principle over person.",
  },
};


// Legacy AD alias for old code that references AD[archetype]
const AD = {
  ...CAPACITY_DETAIL,
  ...DRIVE_DETAIL,
  hedonist: { ...DRIVE_DETAIL.pursuing, name: 'Pursuing' },
  warrior: { ...DRIVE_DETAIL.protecting, name: 'Protecting' },
};

// ══════════════════════════════════════════════════════════════════
// COACHING LIBRARY — reflection prompts for the results page
// Starter set. Each sub-archetype gets one access + one limit prompt;
// each capacity gets one strength + one shadow per mode.
// ══════════════════════════════════════════════════════════════════
const SUB_ARCH_PROMPTS = {
  achiever: {
    strength: "Where is your drive serving you right now? Notice the wins, the building, the momentum you've created.",
    limit: "Where is your worth getting tangled with your output? What would it cost to rest without earning it first?",
  },
  hedonist: {
    strength: "Where are you actually savoring what's alive in your week? Name the moments you let yourself receive.",
    limit: "What discomfort have you been avoiding that probably needs facing? What would it cost to stay with it?",
  },
  adventurer: {
    strength: "Where is your appetite for the new opening doors right now? What experiments are paying off?",
    limit: "What practice or relationship needs your sustained presence — not your next move, but your staying?",
  },
  sentinel: {
    strength: "Where is your vigilance protecting something real right now? What have you caught early because you were watching?",
    limit: "Where are you scanning for threats that aren't there? What's the cost of always being on?",
  },
  warrior: {
    strength: "Where is your willingness to confront serving what matters? What have you held the line on that needed holding?",
    limit: "What fight have you been picking that doesn't actually need fighting? Where could you stand down without losing yourself?",
  },
  evader: {
    strength: "Where is your strategic withdrawal genuinely protective right now? What did stepping back preserve?",
    limit: "What is compounding because you've been avoiding it? Where would showing up actually serve you?",
  },
};

const CAPACITY_PROMPTS = {
  egoist: {
    pursuingHigh: "Your body is a reliable source of information for you right now. Where else could you trust it more?",
    pursuingLow: "What signals from your body have you been overriding to keep performing? What would it cost to listen?",
    protectingHigh: "Your body knows when something is wrong before your mind does. How are you tracking that intelligence?",
    protectingLow: "When your body sends an alarm, do you treat it as data — or as something to push through? What's the cost of either?",
  },
  veteran: {
    pursuingHigh: "Your past experience is feeding the present well. Which patterns are still serving — and which have outlived their use?",
    pursuingLow: "What past wins could you draw on more deliberately? What would shift if you stopped starting from scratch?",
    protectingHigh: "Pattern recognition is keeping you safe. Where is past data still the right map — and where is the territory new?",
    protectingLow: "Where are old loops running on autopilot? What worry or rumination has stopped paying its rent?",
  },
  lover: {
    pursuingHigh: "Your capacity for genuine connection is alive. Who in your life is being met by it — and who's being missed?",
    pursuingLow: "Where have you let connection thin out? What relationship would deepen with even a small move toward it?",
    protectingHigh: "You read people sensitively under pressure. Where is that protective — and where does it tip into managing everyone's feelings instead of your own?",
    protectingLow: "Where is connection being sacrificed to avoid difficulty? What honest conversation are you holding back?",
  },
  strategist: {
    pursuingHigh: "Your analytical edge is finding good paths. Where is the planning serving — and where is it substituting for action?",
    pursuingLow: "What complexity have you been white-knuckling without a real model? Where would slowing down to think actually help?",
    protectingHigh: "Your ability to anticipate contingencies is real. Where is that foresight protective — and where has it tipped into trying to control the uncontrollable?",
    protectingLow: "What feeling have you been solving instead of feeling? What problem looks technical but is actually emotional?",
  },
  visionary: {
    pursuingHigh: "Your sense of purpose is online. How is it shaping your choices right now — and where could it shape them more?",
    pursuingLow: "What have you been doing without remembering why? Where has the meaning gone flat?",
    protectingHigh: "Your moral compass holds under pressure. Where is that protective — and where does it cross into rigidity?",
    protectingLow: "Where have you compromised something that matters and called it pragmatism? What's the cost?",
  },
};


// Subscale catalog — drawn from validated reference instruments. See Foundations.
const SUBSCALES = {
  // ── Section 1 sub-archetypes: BAS, BIS, FFFQ ──
  achiever: {
    drive:                  { name: 'Drive',                  src: 'BAS Drive'           },
  },
  hedonist: {
    reward_responsiveness:  { name: 'Reward Responsiveness',  src: 'BAS Reward Responsiveness' },
  },
  adventurer: {
    fun_seeking:            { name: 'Fun Seeking',            src: 'BAS Fun Seeking'     },
  },
  sentinel: {
    threat_sensitivity:     { name: 'Threat Sensitivity',     src: 'BIS'                 },
  },
  warrior: {
    fight:                  { name: 'Fight',                  src: 'FFFQ Fight'          },
  },
  evader: {
    flight:                 { name: 'Flight',                 src: 'FFFQ Flight'         },
  },
  // ── Section 2/3 capacities ──
  egoist: {
    sensory_pleasure:       { name: 'Sensory Pleasure',       src: 'TEPS Consummatory'   },
    body_savoring:          { name: 'Body Savoring',          src: 'SBI Moment'          },
    interoceptive_awareness:{ name: 'Interoceptive Awareness',src: 'MAIA-2 Noticing'     },
    body_vigilance:         { name: 'Body Vigilance',         src: 'BVS'                 },
    anxiety_sensitivity:    { name: 'Anxiety Sensitivity',    src: 'ASI-3 Physical'      },
    somatic_threat:         { name: 'Somatic Threat',         src: 'PHQ-15'              },
  },
  veteran: {
    anticipatory_pleasure:  { name: 'Anticipatory Pleasure',  src: 'TEPS-A'              },
    savoring_future:        { name: 'Savoring Future',        src: 'SBI Anticipating'    },
    reminiscing_positive:   { name: 'Reminiscing',            src: 'SBI Reminiscing'     },
    worry:                  { name: 'Worry',                  src: 'PSWQ'                },
    rumination:             { name: 'Rumination',             src: 'RRS Brooding'        },
    intolerance_uncertainty:{ name: 'Intolerance of Uncertainty', src: 'IUS'             },
  },
  lover: {
    empathic_concern:   { name: 'Empathic Concern',   src: 'IRI Empathic Concern' },
    perspective_taking: { name: 'Perspective Taking', src: 'IRI Perspective Taking' },
    personal_distress:  { name: 'Personal Distress',  src: 'IRI Personal Distress' },
  },
  strategist: {
    analytical_thinking:  { name: 'Analytical Thinking',  src: 'NFC'                  },
    cognitive_flexibility:{ name: 'Cognitive Flexibility', src: 'Cognitive Flexibility Scale' },
    future_consequences:  { name: 'Future Consequences',  src: 'CFC'                  },
  },
  visionary: {
    presence_of_meaning: { name: 'Presence of Meaning', src: 'MLQ Presence'    },
    search_for_meaning:  { name: 'Search for Meaning',  src: 'MLQ Search'      },
    self_transcendence:  { name: 'Self-Transcendence',  src: 'TCI / Reed'      },
    positive_reframing:  { name: 'Positive Reframing',  src: 'Brief COPE'      },
  },
};

// SUBSCALE_COUNTS — legacy, stubbed for backward compat
const SUBSCALE_COUNTS = {};
// ══════════════════════════════════════════════════════════════════
// CAPACITY DETAILS — source content for home modal + results deep-dive
// ══════════════════════════════════════════════════════════════════

const CAPACITY_DETAILS = {
  hedonist: {
    framing: "The Hedonist is the part of you that goes <em>toward</em> — toward pleasure, toward novelty, toward the thing that lights you up. But \"going toward\" decomposes into three different engines, and they don't always run together.",
    subscales: [
      { key:'reward_responsiveness', name:'Reward Responsiveness', desc:"The visceral, body-level response to good things happening. Savoring. The way some people light up when praised, taste their food, feel the moment land. This is your capacity to <strong>receive</strong> pleasure." },
      { key:'drive', name:'Drive', desc:"Sustained pursuit of what you want. Going after it. The persistent effort that closes the gap between desire and outcome. This is your capacity to <strong>go after</strong> pleasure." },
      { key:'fun_seeking', name:'Fun Seeking', desc:"Appetite for novelty and spontaneity. Willingness to act on impulse for new experience. Boredom intolerance, in the productive sense. This is your capacity to <strong>seek</strong> pleasure in unfamiliar territory." },
    ],
    combinations: [
      {
        id:'achievement_runner',
        label:'Drive without Reward Responsiveness — the achievement runner',
        // Drive ≥ 60% within capacity AND Reward Responsiveness ≤ 35% within capacity
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
    framing: "The Warrior is the part of you that handles threat. Whether the threat is physical, social, professional, or emotional, the Warrior is what comes online. But \"handling threat\" isn't one capacity — it's how you detect threat, and how you respond to it.",
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
        content: "The detection system is on, the action systems aren't. You see every risk, you can't pick a response, you ruminate. From the inside it feels like being trapped between possibilities. Common in people described as \"anxious overthinkers\" — but the underlying issue isn't the anxiety itself; it's the gap between detection and action."
      },
      {
        id:'fight_uncalibrated',
        label:'Fight without Threat Sensitivity — combat-ready but not alarm-aware',
        detect: (subPct) => subPct.fight >= 55 && subPct.threat_sensitivity <= 30,
        content: "You escalate conflicts that didn't need to escalate. Mistake everything for an attack. Pick battles for the wrong reasons. Often described as \"always angry\" — but the underlying issue is calibration, not aggression. The fix isn't to fight less; it's to detect more accurately first."
      }
    ],
    also: "The classical \"fight or flight\" framing is a simplification. Real-world threat response also includes <strong>Freeze</strong> (immobilization-as-information-gathering) and <strong>Tend-and-Befriend</strong> (turning toward others under stress, which tips Warrior into Lover territory). See the note below on uncovered subscales.",
    uncovered: {
      name: 'Freeze',
      note: "Freeze gets a bad reputation but is often the most cognitively sophisticated mode under pressure — you're not paralyzed, you're gathering. Some of the best decision-makers freeze first, then act. The signature of an unhealthy Freeze is when it never resolves into action."
    }
  },

  lover: {
    framing: "The Lover is the part of you that turns toward other people — but \"turning toward\" has at least four distinct flavors, and the differences between them are some of the most consequential in adult life.",
    subscales: [
      { key:'empathic_concern', name:'Empathic Concern', desc:"Feeling <em>for</em> others. Warmth, tenderness, the heart-going-out response. Genuine care about another person's wellbeing." },
      { key:'perspective_taking', name:'Perspective Taking', desc:"Cognitive empathy. The capacity to see through someone else's eyes, model their mental state, understand why their position makes sense to them. This is empathy as a <strong>thinking</strong> operation." },
      { key:'personal_distress', name:'Personal Distress', desc:"Your own distress in response to others' distress. The \"I can't bear to see them in pain\" response. Looks like empathy but is technically about your nervous system, not theirs." },
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
        content: "You care deeply but assume everyone shares your feelings. Often inadvertently invasive: \"I know just how you feel\" — when in fact you don't. The warmth is real; the model of the other person's actual experience is missing."
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
      { key:'analytical_thinking', name:'Analytical Thinking', desc:"Preference for systematic evaluation, pattern recognition, complex problems. The \"thinks for fun\" trait. Distinct from intelligence — some very smart people don't enjoy thinking, and some less brilliant people love it." },
      { key:'cognitive_flexibility', name:'Cognitive Flexibility', desc:"Capacity to reframe, adapt plans, hold multiple representations of a situation simultaneously. The unstuck-ness factor. What lets you change your mind when the data changes." },
      { key:'future_consequences', name:'Future Consequences', desc:"Orientation toward long-term outcomes. The capacity to weigh what happens later against what's pleasant now. Some people feel the future as vividly as the present; others can barely make it real." },
    ],
    combinations: [
      {
        id:'brittle_planner',
        label:'Future Consequences without Cognitive Flexibility — the brittle planner',
        detect: (subPct) => subPct.future_consequences >= 55 && subPct.cognitive_flexibility <= 30,
        content: "Future-oriented, builds detailed plans, lives by the long arc — and gets shattered when reality diverges from the plan. \"But the strategy said…\" Common in people who succeeded early through planning and then hit a wall they can't model their way through. The compound trait — plans well <em>and</em> adapts — is rarer than either component alone."
      },
      {
        id:'situational_surfer',
        label:'Cognitive Flexibility without Future Consequences — the situational surfer',
        detect: (subPct) => subPct.cognitive_flexibility >= 55 && subPct.future_consequences <= 30,
        content: "Adapts beautifully to whatever's happening but never builds a long arc. Resilient in the short term, drifting in the long term. The unstuck-ness is real and useful; the missing piece is direction-setting."
      }
    ],
    also: "Analytical Thinking is independent of intelligence in interesting ways. High-Analytical people enjoy thinking through problems even when they're not great at it; low-Analytical people may be brilliant but find sustained analysis exhausting. Coaching a low-Analytical, high-Future-Consequences person looks completely different from coaching a high-Analytical, low-Future-Consequences one — even though both might score \"high Strategist.\""
  },

  visionary: {
    framing: "The Visionary is the part of you that asks what your life is for. It's the meaning-making capacity — and it has more distinct components than any other capacity.",
    subscales: [
      { key:'presence_of_meaning', name:'Presence of Meaning', desc:"The felt sense that your life has purpose. \"I know why I'm here.\" A <strong>current state</strong> of meaningfulness." },
      { key:'search_for_meaning', name:'Search for Meaning', desc:"Active questioning of purpose. \"I'm working out why I'm here.\" A <strong>process</strong> of meaning-making. Importantly, not the inverse of Presence — they're partly orthogonal." },
      { key:'self_transcendence', name:'Self-Transcendence', desc:"Identification with something larger than yourself — legacy, contribution, future generations, the cause that outlasts you. The \"I served something bigger than me\" frame." },
    ],
    combinations: [
      {
        id:'settled_meaning',
        label:'High Presence, low Search — settled meaning',
        detect: (subPct) => subPct.presence_of_meaning >= 60 && subPct.search_for_meaning <= 30,
        content: "\"I know my purpose and I'm not looking for more.\" Can be deep clarity. Can also be foreclosed — you stopped questioning at 25 and never reopened the question. Worth checking which one you're in."
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
      note: "Two further Visionary subscales — <strong>Spiritual Self-Transcendence</strong> (identification with cosmos, openness to mystery, transpersonal experience) and <strong>Positive Reframing</strong> (the coping capacity that transforms difficulty into growth or meaning) — are described in the research but not measured by this 15-scenario assessment. Spiritual Self-Transcendence in particular is often the most distinctive subscale within the Visionary capacity."
    }
  },
};


// ══════════════════════════════════════════════════════════════════
// SCENARIO POOL — 15 scenarios (6 baseline · 7 pressure · 2 identity)
// All 15 used in every session; option order is randomized per scenario.
// Each option carries a subscale tag (or null for low-engagement Hedonist responses).
// ══════════════════════════════════════════════════════════════════

const POOL = [
  // ════════ SECTION 1 — DRIVE BALANCE + SUB-ARCHETYPES (5) ════════
  { id:'D1', section:'drive', text:"You wake up on a Saturday with no obligations.", options:[
    {arch:'achiever',   sub:'drive',                  text:"Get a head start on something important — set yourself up for the week"},
    {arch:'hedonist',   sub:'reward_responsiveness',  text:"Sleep in, make something delicious, do whatever feels good"},
    {arch:'adventurer', sub:'fun_seeking',            text:"Do something you've never done before — get out of routine, find some novelty"},
    {arch:'sentinel',   sub:'threat_sensitivity',     text:"Catch up on things that have been nagging at you — clear the decks"},
    {arch:'warrior',    sub:'fight',                  text:"Get physical and intense — train hard, compete, push your body"},
    {arch:'evader',     sub:'flight',                 text:"Pull back from everything. Rest. Disconnect."},
  ]},
  { id:'D2', section:'drive', text:"You disagree with a decision your organization is making.", options:[
    {arch:'achiever',   sub:'drive',                  text:"Build the counter-proposal — make a better answer the obvious choice"},
    {arch:'hedonist',   sub:'reward_responsiveness',  text:"Voice your frustration honestly — say what doesn't feel right"},
    {arch:'adventurer', sub:'fun_seeking',            text:"Treat it as a creative opening — what if we did this completely differently?"},
    {arch:'sentinel',   sub:'threat_sensitivity',     text:"Watch and document — gather information before you do anything"},
    {arch:'warrior',    sub:'fight',                  text:"Prepare your objections and push back hard at the right moment"},
    {arch:'evader',     sub:'flight',                 text:"Stay out of it — protect your energy, pick your battles"},
  ]},
  { id:'D3', section:'drive', text:"Your workload has become unsustainable.", options:[
    {arch:'achiever',   sub:'drive',                  text:"Strip everything but the highest-impact items — make the cut and execute"},
    {arch:'hedonist',   sub:'reward_responsiveness',  text:"Find the small pleasures in it — make the work as enjoyable as possible"},
    {arch:'adventurer', sub:'fun_seeking',            text:"Change something — your environment, your routine, the order — keep it fresh"},
    {arch:'sentinel',   sub:'threat_sensitivity',     text:"Quietly catalog what's at risk — what could break, where to put guardrails"},
    {arch:'warrior',    sub:'fight',                  text:"Power through — push harder, you can survive this"},
    {arch:'evader',     sub:'flight',                 text:"Pull back — disconnect, take time off, get away from it"},
  ]},
  { id:'D4', section:'drive', text:"You're facing a major life decision with significant consequences.", options:[
    {arch:'achiever',   sub:'drive',                  text:"Pick what opens the biggest doors — go where you can build something"},
    {arch:'hedonist',   sub:'reward_responsiveness',  text:"Trust your gut — which one feels most alive when you imagine it?"},
    {arch:'adventurer', sub:'fun_seeking',            text:"Pick the one that scares you a little — the unknown is where the growth is"},
    {arch:'sentinel',   sub:'threat_sensitivity',     text:"Focus on minimizing regret — what's safest, what protects what you've built"},
    {arch:'warrior',    sub:'fight',                  text:"Choose what you're willing to defend — commit and don't back down"},
    {arch:'evader',     sub:'flight',                 text:"Take the path of least disruption — keep your options open"},
  ]},
  { id:'D5', section:'drive', text:"You're in a negotiation and the other side is being difficult.", options:[
    {arch:'achiever',   sub:'drive',                  text:"Stay focused on the outcome — keep driving toward what you came for"},
    {arch:'hedonist',   sub:'reward_responsiveness',  text:"Find the rhythm — the back-and-forth can be its own kind of fun"},
    {arch:'adventurer', sub:'fun_seeking',            text:"Get creative — what's a totally different angle nobody's brought up?"},
    {arch:'sentinel',   sub:'threat_sensitivity',     text:"Slow down — watch for what they're going to do next, don't get caught off guard"},
    {arch:'warrior',    sub:'fight',                  text:"Hold firm — don't give ground because they're pushing"},
    {arch:'evader',     sub:'flight',                 text:"Look for an exit — find a way to disengage with minimal damage"},
  ]},

  // ════════ SECTION 2 — THRIVING-MODE CAPACITIES (5) ════════
  { id:'T1', section:'pursuing', text:"You're starting a new project at work.", options:[
    {arch:'egoist',     sub:'interoceptive_awareness', text:"Notice which parts of this you actually want. What parts give you energy or a feeling of enjoyment?"},
    {arch:'veteran',    sub:'anticipatory_pleasure',   text:"Let yourself anticipate what will feel good about this happening, and let that feeling sustain you"},
    {arch:'lover',      sub:'empathic_concern',        text:"Make sure the right people are involved and everyone feels good about their role"},
    {arch:'strategist', sub:'analytical_thinking',     text:"Build a plan with milestones, dependencies, and contingencies"},
    {arch:'visionary',  sub:'presence_of_meaning',     text:"Get clear on why this project matters before diving into how"},
  ]},
  { id:'T2', section:'pursuing', text:"You receive unexpected praise from someone you respect.", options:[
    {arch:'egoist',     sub:'body_savoring',           text:"Let it really land. Notice what you feel when you take it in."},
    {arch:'veteran',    sub:'reminiscing_positive',    text:"Come back to those words later. Let yourself enjoy the feeling again."},
    {arch:'lover',      sub:'empathic_concern',        text:"Feel closer to them — it strengthens the relationship"},
    {arch:'strategist', sub:'analytical_thinking',     text:"Think about what specifically you did well so you can replicate it"},
    {arch:'visionary',  sub:'presence_of_meaning',     text:"Feel affirmed that you're on the right path"},
  ]},
  { id:'T3', section:'pursuing', text:"You have to make a decision and there's no clear right answer.", options:[
    {arch:'egoist',     sub:'interoceptive_awareness', text:"Notice which option your body leans toward — there's information in the pull"},
    {arch:'veteran',    sub:'reminiscing_positive',    text:"Think back to similar choices and how they actually played out — what does your experience say?"},
    {arch:'lover',      sub:'perspective_taking',      text:"Talk it through with people you trust"},
    {arch:'strategist', sub:'analytical_thinking',     text:"Analyze the options systematically — pros, cons, probabilities"},
    {arch:'visionary',  sub:'presence_of_meaning',     text:"Ask which option best serves what you ultimately care about"},
  ]},
  { id:'T4', section:'pursuing', text:"A team you're part of is brainstorming ideas.", options:[
    {arch:'egoist',     sub:'interoceptive_awareness', text:"Notice which ideas spark something in you — where the energy goes when people speak"},
    {arch:'veteran',    sub:'reminiscing_positive',    text:"Build on what's worked before — what patterns can you bring in from past projects?"},
    {arch:'lover',      sub:'perspective_taking',      text:"Make sure quieter voices are heard and people feel safe contributing"},
    {arch:'strategist', sub:'analytical_thinking',     text:"Organize the ideas into categories and evaluate them against criteria"},
    {arch:'visionary',  sub:'presence_of_meaning',     text:"Keep bringing the group back to the bigger picture — what are we actually trying to achieve?"},
  ]},
  { id:'T5', section:'pursuing', text:"You learn something that changes your understanding of a topic you care about.", options:[
    {arch:'egoist',     sub:'body_savoring',           text:"Notice how it lands in your body — the click of something falling into place"},
    {arch:'veteran',    sub:'anticipatory_pleasure',   text:"Imagine where this could take you — what becomes possible now that you couldn't see before?"},
    {arch:'lover',      sub:'empathic_concern',        text:"Want to share it with someone and discuss it together"},
    {arch:'strategist', sub:'cognitive_flexibility',   text:"Start revising your mental model — how does this change your predictions?"},
    {arch:'visionary',  sub:'search_for_meaning',      text:"Wonder what this means at a deeper level — how does this shift what matters?"},
  ]},

  // ════════ SECTION 3 — PROTECTING-MODE CAPACITIES (5) ════════
  { id:'P1', section:'protecting', text:"You're running late to something important.", options:[
    {arch:'egoist',     sub:'body_vigilance',          text:"Feel your body tighten — adrenaline kicking in, urgency taking over"},
    {arch:'veteran',    sub:'worry',                   text:"Run through what's likely to go wrong — the awkward entrance, the catch-up afterward"},
    {arch:'lover',      sub:'empathic_concern',        text:"Text ahead to let people know — you don't want them to worry"},
    {arch:'strategist', sub:'cognitive_flexibility',   text:"Quickly calculate the fastest route and adjust the plan"},
    {arch:'visionary',  sub:'search_for_meaning',      text:"Ask yourself whether being late to this actually matters in the big picture"},
  ]},
  { id:'P2', section:'protecting', text:"Someone you care about is angry with you and you're not sure why.", options:[
    {arch:'egoist',     sub:'anxiety_sensitivity',     text:"Notice it in your body first — the knot in your stomach already knows something's wrong"},
    {arch:'veteran',    sub:'rumination',              text:"Replay recent interactions — when did something shift? What did you miss?"},
    {arch:'lover',      sub:'personal_distress',       text:"Feel their pain — it hurts that they're hurting, regardless of who's right"},
    {arch:'strategist', sub:'analytical_thinking',     text:"Try to understand the root cause — what specifically triggered this?"},
    {arch:'visionary',  sub:'search_for_meaning',      text:"Reflect on whether this conflict points to a deeper misalignment in values"},
  ]},
  { id:'P3', section:'protecting', text:"You witness an injustice — someone being treated unfairly.", options:[
    {arch:'egoist',     sub:'somatic_threat',          text:"Feel the heat rise — your whole body registering the wrongness of it"},
    {arch:'veteran',    sub:'worry',                   text:"Recognize the pattern — when have you seen this before? Where does it lead if no one stops it?"},
    {arch:'lover',      sub:'empathic_concern',        text:"Feel the other person's pain — your heart goes out to them"},
    {arch:'strategist', sub:'analytical_thinking',     text:"Think about the most effective way to address this — who has authority, what are the channels?"},
    {arch:'visionary',  sub:'presence_of_meaning',     text:"See it as a moral imperative — this is wrong and it matters beyond this moment"},
  ]},
  { id:'P4', section:'protecting', text:"You're in a group where conflict is rising and people are getting emotional.", options:[
    {arch:'egoist',     sub:'body_vigilance',          text:"Tune in to the room — the tightness, the rising heat, your own body's response"},
    {arch:'veteran',    sub:'worry',                   text:"Watch for what's coming — who's about to crack, where this is heading"},
    {arch:'lover',      sub:'perspective_taking',      text:"Acknowledge what people are feeling — name the emotions in the room"},
    {arch:'strategist', sub:'analytical_thinking',     text:"Try to separate the emotional reactions from the actual problem to be solved"},
    {arch:'visionary',  sub:'presence_of_meaning',     text:"Remind the group what they're all here for — the shared purpose that transcends this disagreement"},
  ]},
  { id:'P5', section:'protecting', text:"You're asked to compromise on something you believe in to keep the peace.", options:[
    {arch:'egoist',     sub:'interoceptive_awareness', text:"Feel where the no lives in your body — the part of you that won't move"},
    {arch:'veteran',    sub:'rumination',              text:"Run through what's happened other times you've compromised — what did it cost?"},
    {arch:'lover',      sub:'perspective_taking',      text:"Weigh the relationship — is the connection more important than being right?"},
    {arch:'strategist', sub:'future_consequences',     text:"Assess the strategic implications — what precedent does this set?"},
    {arch:'visionary',  sub:'presence_of_meaning',     text:"This is non-negotiable — some things matter more than peace"},
  ]},
];

// ══════════════════════════════════════════════════════════════════
// LIKERT BLOCK — Drive intensity (BAS/BIS independent measures)
// Injected after Section 1 forced-choice scenarios. Rated 1-5.
// Pursuing and Protecting scores are computed INDEPENDENTLY from
// these items and plotted on the 2x2 results grid.
// ══════════════════════════════════════════════════════════════════
const LIKERT_BLOCK = {
  id: 'likert-drive',
  type: 'likert',
  section: 'likert',
  text: 'How strongly is each drive active in you right now?',
  hint: 'Rate each statement on a 1-5 scale. 1 = not at all, 5 = very strongly. Both drives can be high at the same time.',
  items: [
    { id: 'p1', drive: 'pursuing',   text: 'I feel drawn toward new opportunities and possibilities.' },
    { id: 'p2', drive: 'pursuing',   text: 'I find myself energized by what could go well.' },
    { id: 'p3', drive: 'pursuing',   text: 'I am focused on what I want and how to reach it.' },
    { id: 'b1', drive: 'protecting', text: 'I feel attuned to what could go wrong.' },
    { id: 'b2', drive: 'protecting', text: 'I find myself energized by preventing problems.' },
    { id: 'b3', drive: 'protecting', text: 'I am focused on what I need to guard against.' },
  ],
};

const SESSION_COMPOSITION = { drive: 5, pursuing: 5, protecting: 5 };
const TOTAL_Q = 15;

// ══════════════════════════════════════════════════════════════════
// STATE
// ══════════════════════════════════════════════════════════════════

let state = {
  sessionScenarios: [],
  currentIdx: 0,
  answers: {},        // scenarioId -> ordered array of capacity keys (max 3)
  optionShuffles: {}, // scenarioId -> shuffled options array
  likertAnswers: {},  // Likert itemId -> 1-5 rating
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
    drive:      POOL.filter(s=>s.section==='drive'),
    pursuing:   POOL.filter(s=>s.section==='pursuing'),
    protecting: POOL.filter(s=>s.section==='protecting'),
  };
  const picked = [];
  // Section order: drive (Sec 1) -> Likert intensity check -> pursuing (Sec 2) -> protecting (Sec 3)
  for(const section of ['drive','pursuing','protecting']){
    const n = SESSION_COMPOSITION[section];
    picked.push(...shuffle(byType[section]).slice(0, n));
    if(section === 'drive'){
      picked.push(LIKERT_BLOCK);
    }
  }
  state.sessionScenarios = picked;
  state.currentIdx = 0;
  state.answers = {};
  state.optionShuffles = {};
  state.likertAnswers = {};
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
  if(s.type === 'likert'){
    const allAns = s.items.every(item => state.likertAnswers[item.id] !== undefined);
    if(!allAns) return;
  } else {
    const ans = state.answers[s.id];
    if(!ans || ans.length === 0) return;
  }
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

// Theory in Action: jump to a specific capacity section with smooth scroll
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
  const matchingPill = document.querySelector(`.tia-pill[href="#${targetId}"]`);
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

function renderLikert(block){
  const idx = state.currentIdx;
  const total = state.sessionScenarios.length;
  const pct = Math.round(((idx) / total) * 100);
  document.getElementById('prog-fill').style.width = pct + '%';
  document.getElementById('prog-lbl-l').textContent = 'Drive intensity check';
  document.getElementById('prog-lbl-r').textContent = answeredCount() + ' answered';
  document.getElementById('btn-back').style.visibility = idx === 0 ? 'hidden' : 'visible';

  const area = document.getElementById('slide-area');
  area.innerHTML = '';
  const wrap = document.createElement('div');
  wrap.className = 'fade-up';

  const itemsHTML = block.items.map(item => {
    const v = state.likertAnswers[item.id];
    const buttons = [1,2,3,4,5].map(n => {
      const sel = v === n;
      return `<button class="likert-btn${sel?' sel':''}" data-item="${item.id}" data-val="${n}">${n}</button>`;
    }).join('');
    return `<div class="likert-item">
      <div class="likert-text">${item.text}</div>
      <div class="likert-scale">${buttons}</div>
    </div>`;
  }).join('');

  wrap.innerHTML = `<div class="qcard">
    <div class="qphase"><span class="qphase-bar"></span>Drive intensity \u00b7 <span class="qphase-num">${block.items.length} items</span></div>
    <p class="qtext">${block.text}</p>
    <p class="qhint">${block.hint}</p>
    <div class="likert-scale-legend"><span>1 \u2014 not at all</span><span>5 \u2014 very strongly</span></div>
    <div class="likert-items">${itemsHTML}</div>
  </div>`;

  area.appendChild(wrap);

  const next = document.getElementById('btn-next');
  const allAnswered = block.items.every(item => state.likertAnswers[item.id] !== undefined);
  next.disabled = !allAnswered;
  next.textContent = isLast() ? 'See your results \u2192' : 'Continue \u2192';

  wrap.querySelectorAll('.likert-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const itemId = btn.dataset.item;
      const val = parseInt(btn.dataset.val, 10);
      state.likertAnswers[itemId] = val;
      wrap.querySelectorAll(`.likert-btn[data-item="${itemId}"]`).forEach(b => {
        b.classList.toggle('sel', parseInt(b.dataset.val,10) === val);
      });
      const allAns = block.items.every(item => state.likertAnswers[item.id] !== undefined);
      document.getElementById('btn-next').disabled = !allAns;
    });
  });
}

function renderScenario(){
  const s = currentScenario();
  if(s.type === 'likert'){
    renderLikert(s);
    return;
  }
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
    return `<button class="qopt${isSel?' sel':''}" data-arch="${o.arch}">
      <span class="qopt-circle">${orderNum}</span>
      <span>${o.text}</span>
    </button>`;
  }).join('');

  const phaseLabels = { drive:'Drive — what pulls you', pursuing:'Pursuing — approach mode', protecting:'Protecting — pressure mode' };
  const phaseScens = state.sessionScenarios.filter(x => x.section === s.section);
  const withinIdx = phaseScens.findIndex(x => x.id === s.id);
  const phaseLine = (phaseLabels[s.section] || s.section) + ' \u00b7 <span class="qphase-num">' + (withinIdx + 1) + ' of ' + phaseScens.length + '</span>';

  wrap.innerHTML = `<div class="qcard">
    <div class="qphase"><span class="qphase-bar"></span>${phaseLine}</div>
    <p class="qtext">${s.text}</p>
    <p class="qhint">Choose your top response. If you feel many strongly apply, you may choose up to 3.</p>
    <div class="qopts">${opts}</div>
  </div>`;

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
// SCORING — new model
// Section 1 (drive): scores Pursuing vs Protecting balance + sub-archetype distribution
// Sections 2 & 3 (pursuing/protecting): score capacity profile in each mode
// ══════════════════════════════════════════════════════════════════

const POINTS = [3, 2, 1]; // 1st pick = 3, 2nd = 2, 3rd = 1

function calcScores(){
  const blankCap = () => ({egoist:0, veteran:0, lover:0, strategist:0, visionary:0});
  const blankSub = () => ({achiever:0, hedonist:0, adventurer:0, sentinel:0, warrior:0, evader:0});

  const subArchScores = blankSub();          // Section 1 sub-archetype totals
  const driveScores = { pursuing:0, protecting:0 }; // Section 1 drive aggregate
  const capScores = { pursuing: blankCap(), protecting: blankCap() }; // Sections 2 & 3
  const counts = { drive:0, pursuing:0, protecting:0 };

  state.sessionScenarios.forEach(s => {
    counts[s.section]++;
    const ans = state.answers[s.id] || [];
    ans.forEach((pick, i) => {
      if(i >= POINTS.length) return;
      const pts = POINTS[i];
      if(s.section === 'drive'){
        // pick is a sub-archetype key
        if(subArchScores[pick] !== undefined){
          subArchScores[pick] += pts;
          const drv = SUB_ARCH_BY_DRIVE.pursuing.includes(pick) ? 'pursuing' : 'protecting';
          driveScores[drv] += pts;
        }
      } else {
        // pick is a capacity key; s.section is 'pursuing' or 'protecting'
        if(capScores[s.section] && capScores[s.section][pick] !== undefined){
          capScores[s.section][pick] += pts;
        }
      }
    });
  });

  // Max possible per scenario = 3+2+1 = 6 (if user uses all 3 picks)
  const maxPer = 6;
  const driveMax = counts.drive * maxPer;
  const capMax = { pursuing: counts.pursuing * maxPer, protecting: counts.protecting * maxPer };

  // INDEPENDENT drive scores from Likert items (1-5 scale).
  // Each drive's score is the normalized mean of its 3 items, 0-100.
  // Pursuing and Protecting can both be high, both be low, or any combination.
  const pItems = LIKERT_BLOCK.items.filter(i => i.drive === 'pursuing');
  const bItems = LIKERT_BLOCK.items.filter(i => i.drive === 'protecting');
  const sumLikert = (items) => items.reduce((acc, item) => acc + (state.likertAnswers[item.id] || 0), 0);
  // Normalize: raw min = n (all 1s), raw max = 5n (all 5s). Map to 0-100.
  const normLikert = (sum, n) => n > 0 ? Math.round(((sum - n) / (4 * n)) * 100) : 0;
  const pursuingScore   = Math.max(0, Math.min(100, normLikert(sumLikert(pItems), pItems.length)));
  const protectingScore = Math.max(0, Math.min(100, normLikert(sumLikert(bItems), bItems.length)));
  // Legacy zero-sum balance preserved as a back-compat field (used by some legacy code paths).
  const driveTotal = driveScores.pursuing + driveScores.protecting;
  const drivePct = driveTotal > 0
    ? Math.round((driveScores.pursuing / driveTotal) * 100)
    : 50;

  // Sub-archetype as % of total Section 1 points
  const subPct = {};
  for(const k of SUB_ARCHS){
    subPct[k] = driveTotal > 0 ? Math.round((subArchScores[k] / driveTotal) * 100) : 0;
  }

  // Capacity % of max per section
  const capPct = { pursuing:{}, protecting:{} };
  for(const sec of ['pursuing','protecting']){
    for(const c of CAPACITIES){
      capPct[sec][c] = capMax[sec] > 0 ? Math.round((capScores[sec][c] / capMax[sec]) * 100) : 0;
    }
  }

  return {
    drive: {
      pursuingScore: pursuingScore,         // INDEPENDENT 0-100 from Likert
      protectingScore: protectingScore,     // INDEPENDENT 0-100 from Likert
      // Back-compat aliases (legacy code reads these)
      pursuingPct: pursuingScore,
      protectingPct: protectingScore,
      // Legacy zero-sum balance (forced-choice only; preserved for any old callers)
      legacyBalancePct: drivePct,
      raw: driveScores, max: driveMax
    },
    subArch: { raw: subArchScores, pct: subPct },
    capacity: { raw: capScores, pct: capPct, max: capMax },
    counts,
  };
}

function topNCap(scoreObj, n=2){
  return [...CAPACITIES].sort((a,b) => scoreObj[b] - scoreObj[a]).slice(0, n);
}
function bottomNCap(scoreObj, n=2){
  return [...CAPACITIES].sort((a,b) => scoreObj[a] - scoreObj[b]).slice(0, n);
}
function topSubArch(scoreObj, drive){
  const subs = SUB_ARCH_BY_DRIVE[drive];
  return [...subs].sort((a,b) => scoreObj[b] - scoreObj[a]);
}

// ══════════════════════════════════════════════════════════════════
// RENDER RESULTS — new model
// 1. Drive slider (Pursuing :: Protecting) with click-to-expand sub-archetype detail
// 2. Side-by-side bar charts (Pursuing-mode capacities | Protecting-mode capacities)
// 3. Coaching prompts based on top sub-archetypes + top/bottom capacities
// ══════════════════════════════════════════════════════════════════

// ══════════════════════════════════════════════════════════════════
// SHOW RESULTS — bridge from completed assessment to rendered results
// ══════════════════════════════════════════════════════════════════
function showResults(){
  const scored = calcScores();
  _lastScored = scored;  // legacy global for emailResults/share link
  const resultsContent = document.getElementById('results-content');
  if(resultsContent){
    resultsContent.innerHTML = renderResults(scored);
  }
  showPage('pg-results');
  window.scrollTo({top:0,behavior:'smooth'});
}

function renderResults(scored){
  const drvT = scored.drive.pursuingPct;
  const drvP = scored.drive.protectingPct;
  const thrCaps = scored.capacity.pct.pursuing;
  const prtCaps = scored.capacity.pct.protecting;

  // Top sub-archetypes within each drive
  const topThriverSubs = topSubArch(scored.subArch.raw, 'pursuing');
  const topProtectorSubs = topSubArch(scored.subArch.raw, 'protecting');

  // Top + bottom capacities per mode
  const thrTop = topNCap(thrCaps, 2);
  const thrBot = bottomNCap(thrCaps, 2);
  const prtTop = topNCap(prtCaps, 2);
  const prtBot = bottomNCap(prtCaps, 2);

  // ── 2x2 Drive Grid (Pursuing vs Protecting, independent) ──
  const driveGrid = build2x2Grid(drvT, drvP);

  // ── Sub-archetype expandable panels ──
  const subPanels = buildSubArchPanels(scored.subArch.pct, topThriverSubs, topProtectorSubs);

  // ── Capacity bar charts (side by side) ──
  const capBars = buildCapacityBars(thrCaps, prtCaps, thrTop, prtTop, thrBot, prtBot);

  // ── Quadrant for headline interpretation ──
  const quadrant = drvT >= 50 && drvP < 50  ? 'bold'
                 : drvT >= 50 && drvP >= 50 ? 'driven'
                 : drvT < 50  && drvP >= 50 ? 'guarded'
                 : 'disengaged';

  // ── Headline ──
  const headlineHTML = buildHeadline(quadrant, drvT, drvP, topThriverSubs[0], topProtectorSubs[0], thrTop[0], prtTop[0]);

  // ── Coaching prompts ──
  const promptsHTML = buildCoachingPrompts(topThriverSubs[0], topProtectorSubs[0], thrTop, thrBot, prtTop, prtBot);

  return `
    <div class="r-headline">${headlineHTML}</div>

    <h2 class="r-sec-title">Your drive balance</h2>
    <p class="r-sec-sub">Each drive is rated independently. Both can be high (driven), both low (disengaged), or one dominant. Your dot marks where you sit.</p>
    ${driveGrid}
    ${subPanels}

    <h2 class="r-sec-title">Your capacity profile</h2>
    <p class="r-sec-sub">Which of the five capacities you lean on most — split by whether you're in approach mode or under pressure.</p>
    ${capBars}

    <h2 class="r-sec-title">Reflections</h2>
    ${promptsHTML}
  `;
}

function buildHeadline(quadrant, drvT, drvP, topThr, topPro, topThrCap, topProCap){
  const subThr = SUB_ARCH_DETAIL[topThr];
  const subPro = SUB_ARCH_DETAIL[topPro];
  const capThr = CAPACITY_DETAIL[topThrCap];
  const capPro = CAPACITY_DETAIL[topProCap];
  const pCol = DRIVE_DETAIL.pursuing.color;
  const bCol = DRIVE_DETAIL.protecting.color;
  const quadLines = {
    bold:       `Your <strong style="color:${pCol}">Pursuing</strong> drive is strong (${drvT}%) while <strong style="color:${bCol}">Protecting</strong> is quieter (${drvP}%) \u2014 you lean bold and approach-oriented.`,
    driven:     `Both your <strong style="color:${pCol}">Pursuing</strong> (${drvT}%) and <strong style="color:${bCol}">Protecting</strong> (${drvP}%) drives are running hot \u2014 the high-output, internally-conflicted pattern.`,
    guarded:    `Your <strong style="color:${bCol}">Protecting</strong> drive is strong (${drvP}%) while <strong style="color:${pCol}">Pursuing</strong> is quieter (${drvT}%) \u2014 vigilance over expansion right now.`,
    disengaged: `Both your <strong style="color:${pCol}">Pursuing</strong> (${drvT}%) and <strong style="color:${bCol}">Protecting</strong> (${drvP}%) drives are quiet \u2014 could be rest, restoration, or a need for re-engagement.`,
  };
  const drvLine = quadLines[quadrant] || quadLines.driven;
  return `
    <p class="r-headline-line">${drvLine}</p>
    <p class="r-headline-line">When Pursuing is active, you lead with <strong style="color:${subThr.drive === 'pursuing' ? pCol : bCol}">${subThr.name}</strong> energy and reach for the <strong style="color:${capThr.color}">${capThr.name}</strong> capacity.</p>
    <p class="r-headline-line">When Protecting is active, you lead with <strong style="color:${bCol}">${subPro.name}</strong> energy and reach for the <strong style="color:${capPro.color}">${capPro.name}</strong> capacity.</p>
  `;
}

function build2x2Grid(pursuingScore, protectingScore){
  const tColor = DRIVE_DETAIL.pursuing.color;
  const pColor = DRIVE_DETAIL.protecting.color;
  // SVG viewBox: 100x100 inner, with margin for axis labels.
  // X-axis = Protecting (0 left -> 100 right). Y-axis = Pursuing (100 top -> 0 bottom, so cy = 100 - pursuing).
  const cx = Math.max(0, Math.min(100, protectingScore));
  const cy = Math.max(0, Math.min(100, 100 - pursuingScore));
  const highPursue  = pursuingScore  >= 50;
  const highProtect = protectingScore >= 50;
  const quadrant = highPursue && !highProtect ? 'bold'
                 : highPursue && highProtect  ? 'driven'
                 : !highPursue && highProtect ? 'guarded'
                 : 'disengaged';
  const quadLabels = {
    bold:       { name: 'Bold / Risk-taking',   desc: 'Approach is strong, threat awareness is muted. You move on opportunities, sometimes before checking the downside.' },
    driven:     { name: 'Driven / Conflicted',  desc: 'Both systems are running hot. High output, often paired with internal tension \u2014 the classic anxious-achiever pattern.' },
    guarded:    { name: 'Guarded / Withdrawn',  desc: 'Threat awareness is strong, approach is muted. You prioritize safety, sometimes at the cost of opportunity.' },
    disengaged: { name: 'Disengaged / At rest', desc: 'Neither system is strongly active. Could be rest, recovery, or burnout \u2014 context matters.' },
  };
  const q = quadLabels[quadrant];
  const shade = (qkey) => qkey === quadrant ? 'rgba(255,193,7,0.18)' : 'rgba(255,255,255,0.025)';
  return `
    <div class="grid-2x2-wrap">
      <svg class="grid-2x2" viewBox="-14 -10 132 124" preserveAspectRatio="xMidYMid meet">
        <rect x="0"  y="0"  width="50" height="50" fill="${shade('bold')}"       />
        <rect x="50" y="0"  width="50" height="50" fill="${shade('driven')}"     />
        <rect x="0"  y="50" width="50" height="50" fill="${shade('disengaged')}" />
        <rect x="50" y="50" width="50" height="50" fill="${shade('guarded')}"    />
        <rect x="0" y="0" width="100" height="100" fill="none" stroke="rgba(255,255,255,0.45)" stroke-width="0.6"/>
        <line x1="50" y1="0" x2="50" y2="100" stroke="rgba(255,255,255,0.25)" stroke-width="0.5" stroke-dasharray="2,2"/>
        <line x1="0" y1="50" x2="100" y2="50" stroke="rgba(255,255,255,0.25)" stroke-width="0.5" stroke-dasharray="2,2"/>
        <text x="25" y="7"   text-anchor="middle" font-size="3.6" fill="rgba(255,255,255,0.85)" font-weight="600">Bold</text>
        <text x="25" y="11"  text-anchor="middle" font-size="2.6" fill="rgba(255,255,255,0.55)">risk-taking</text>
        <text x="75" y="7"   text-anchor="middle" font-size="3.6" fill="rgba(255,255,255,0.85)" font-weight="600">Driven</text>
        <text x="75" y="11"  text-anchor="middle" font-size="2.6" fill="rgba(255,255,255,0.55)">conflicted</text>
        <text x="25" y="94"  text-anchor="middle" font-size="3.6" fill="rgba(255,255,255,0.85)" font-weight="600">Disengaged</text>
        <text x="25" y="98"  text-anchor="middle" font-size="2.6" fill="rgba(255,255,255,0.55)">low / low</text>
        <text x="75" y="94"  text-anchor="middle" font-size="3.6" fill="rgba(255,255,255,0.85)" font-weight="600">Guarded</text>
        <text x="75" y="98"  text-anchor="middle" font-size="2.6" fill="rgba(255,255,255,0.55)">withdrawn</text>
        <text x="50" y="-3.5" text-anchor="middle" font-size="3.4" fill="${tColor}" font-weight="600">\u2191 Pursuing</text>
        <text x="-2"  y="51"  text-anchor="end"    font-size="2.4" fill="rgba(255,255,255,0.55)">low</text>
        <text x="-2"  y="2.5" text-anchor="end"    font-size="2.4" fill="rgba(255,255,255,0.55)">high</text>
        <text x="104" y="51"  text-anchor="start"  font-size="3.4" fill="${pColor}" font-weight="600">Protecting \u2192</text>
        <text x="0"   y="108" text-anchor="middle" font-size="2.4" fill="rgba(255,255,255,0.55)">low</text>
        <text x="100" y="108" text-anchor="middle" font-size="2.4" fill="rgba(255,255,255,0.55)">high</text>
        <circle cx="${cx}" cy="${cy}" r="4.5" fill="none" stroke="#fff" stroke-width="0.7" opacity="0.5"/>
        <circle cx="${cx}" cy="${cy}" r="2.6" fill="#fff" stroke="#000" stroke-width="0.5"/>
      </svg>
      <div class="grid-2x2-quadrant">
        <div class="grid-2x2-label">${q.name}</div>
        <div class="grid-2x2-desc">${q.desc}</div>
        <div class="grid-2x2-scores">
          <span style="color:${tColor}">Pursuing ${pursuingScore}%</span>
          <span style="color:${pColor}">Protecting ${protectingScore}%</span>
        </div>
      </div>
    </div>
  `;
}

// Legacy linear slider kept for any callers that still reference it
function buildDriveSlider(thrPct, prtPct){
  const tColor = DRIVE_DETAIL.pursuing.color;
  const pColor = DRIVE_DETAIL.protecting.color;
  return `
    <div class="drive-slider">
      <div class="drive-slider-bar">
        <div class="drive-slider-thr" style="width:${thrPct}%;background:${tColor}"></div>
        <div class="drive-slider-prt" style="width:${prtPct}%;background:${pColor}"></div>
        <div class="drive-slider-marker" style="left:${thrPct}%"></div>
      </div>
      <div class="drive-slider-labels">
        <span class="drive-label-l" style="color:${tColor}">Pursuing ${thrPct}%</span>
        <span class="drive-label-r" style="color:${pColor}">Protecting ${prtPct}%</span>
      </div>
    </div>
  `;
}

function buildSubArchPanels(subPct, topThr, topPro){
  const panelFor = (drv, topList) => {
    const driveD = DRIVE_DETAIL[drv];
    const items = topList.map((k, i) => {
      const d = SUB_ARCH_DETAIL[k];
      const p = SUB_ARCH_PROMPTS[k];
      const isTop = i === 0;
      const pct = subPct[k] || 0;
      return `
        <div class="subarch-item${isTop ? ' subarch-top' : ''}">
          <div class="subarch-head">
            <span class="subarch-name" style="color:${driveD.color}">${d.name}</span>
            <span class="subarch-pct">${pct}% of Section 1 picks</span>
          </div>
          <div class="subarch-tagline">${d.tagline}</div>
          <div class="subarch-access"><strong>Gives you access to:</strong> ${d.access}</div>
          <div class="subarch-limit"><strong>Limits you here:</strong> ${d.limit}</div>
          ${isTop ? `<div class="subarch-prompt"><em>${p.strength}</em></div><div class="subarch-prompt"><em>${p.limit}</em></div>` : ''}
        </div>
      `;
    }).join('');
    return `
      <details class="subarch-panel" style="border-color:${driveD.border};background:${driveD.bg}">
        <summary class="subarch-summary" style="color:${driveD.color}">
          ${driveD.name} sub-archetypes — click to expand
        </summary>
        <div class="subarch-body">${items}</div>
      </details>
    `;
  };
  return panelFor('pursuing', topThr) + panelFor('protecting', topPro);
}

function buildCapacityBars(thrPcts, prtPcts, thrTop, prtTop, thrBot, prtBot){
  const max = Math.max(
    ...CAPACITIES.map(c => thrPcts[c] || 0),
    ...CAPACITIES.map(c => prtPcts[c] || 0),
    1
  );
  const barFor = (cap, pct, isTop, isBot) => {
    const d = CAPACITY_DETAIL[cap];
    const w = Math.round((pct / max) * 100);
    const cls = isTop ? 'cap-bar-top' : (isBot ? 'cap-bar-bot' : '');
    return `
      <div class="cap-bar-row ${cls}">
        <span class="cap-bar-label" style="color:${d.color}">${d.icon} ${d.name}</span>
        <div class="cap-bar-track">
          <div class="cap-bar-fill" style="width:${w}%;background:${d.color}"></div>
        </div>
        <span class="cap-bar-pct">${pct}</span>
      </div>
    `;
  };
  const column = (title, pcts, top, bot, drvKey) => {
    const titleColor = DRIVE_DETAIL[drvKey].color;
    const rows = CAPACITIES.map(c => barFor(c, pcts[c] || 0, top.includes(c), bot.includes(c))).join('');
    return `
      <div class="cap-col">
        <h3 class="cap-col-title" style="color:${titleColor}">${title}</h3>
        <p class="cap-col-sub">When ${drvKey} is active</p>
        ${rows}
      </div>
    `;
  };
  return `
    <div class="cap-bars-grid">
      ${column('Pursuing-mode capacities', thrPcts, thrTop, thrBot, 'pursuing')}
      ${column('Protecting-mode capacities', prtPcts, prtTop, prtBot, 'protecting')}
    </div>
    <div class="cap-legend">
      <span><span class="cap-legend-dot cap-bar-top"></span>strongest in that mode</span>
      <span><span class="cap-legend-dot cap-bar-bot"></span>least used in that mode</span>
    </div>
  `;
}

function buildCoachingPrompts(topThr, topPro, thrTop, thrBot, prtTop, prtBot){
  const lines = [];
  // Top sub-archetype prompts for each drive
  if(topThr){
    const p = SUB_ARCH_PROMPTS[topThr];
    const d = SUB_ARCH_DETAIL[topThr];
    lines.push(`<li><strong style="color:${DRIVE_DETAIL.pursuing.color}">${d.name}</strong> — ${p.strength}</li>`);
    lines.push(`<li><strong style="color:${DRIVE_DETAIL.pursuing.color}">${d.name}</strong> — ${p.limit}</li>`);
  }
  if(topPro){
    const p = SUB_ARCH_PROMPTS[topPro];
    const d = SUB_ARCH_DETAIL[topPro];
    lines.push(`<li><strong style="color:${DRIVE_DETAIL.protecting.color}">${d.name}</strong> — ${p.strength}</li>`);
    lines.push(`<li><strong style="color:${DRIVE_DETAIL.protecting.color}">${d.name}</strong> — ${p.limit}</li>`);
  }
  // Top capacity in Pursuing + bottom capacity in Pursuing
  if(thrTop[0]){
    const d = CAPACITY_DETAIL[thrTop[0]];
    const p = CAPACITY_PROMPTS[thrTop[0]];
    lines.push(`<li><strong style="color:${d.color}">${d.name} (Pursuing)</strong> — ${p.pursuingHigh}</li>`);
  }
  if(thrBot[0]){
    const d = CAPACITY_DETAIL[thrBot[0]];
    const p = CAPACITY_PROMPTS[thrBot[0]];
    lines.push(`<li><strong style="color:${d.color}">${d.name} (Pursuing)</strong> — ${p.pursuingLow}</li>`);
  }
  // Top capacity in Protecting + bottom capacity in Protecting
  if(prtTop[0]){
    const d = CAPACITY_DETAIL[prtTop[0]];
    const p = CAPACITY_PROMPTS[prtTop[0]];
    lines.push(`<li><strong style="color:${d.color}">${d.name} (Protecting)</strong> — ${p.protectingHigh}</li>`);
  }
  if(prtBot[0]){
    const d = CAPACITY_DETAIL[prtBot[0]];
    const p = CAPACITY_PROMPTS[prtBot[0]];
    lines.push(`<li><strong style="color:${d.color}">${d.name} (Protecting)</strong> — ${p.protectingLow}</li>`);
  }
  return `<ul class="r-prompts">${lines.join('')}</ul>`;
}

function emailResults(){
  // v3 model: share-link encoding disabled (incompatible with new scoring shape)
  let hash = '';
  const base = window.location.origin + window.location.pathname;
  const url  = hash ? (base + '#r=' + hash) : base;
  const subject = encodeURIComponent('My Leadership Capacities Analysis results');
  const body = encodeURIComponent(
    'Here are my Leadership Capacities Analysis results:' + '\n\n' +
    url + '\n\n' +
    'This link encodes my results — bookmark or save the email to revisit anytime.' + '\n'
  );
  window.location.href = 'mailto:?subject=' + subject + '&body=' + body;
}

// ══════════════════════════════════════════════════════════════════
// CAPACITY DETAIL MODAL
// Opened from home page archboxes (no scores yet) and from results
// page deep-dive section (with scored data → conditional combos).
// ══════════════════════════════════════════════════════════════════

let _archModalOpen = false;
let _archModalReturnFocus = null;
let _lastScored = null;  // stashed so the results-page deep-dive buttons can access it

function openArchModal(arch, scored){
  // scored is optional — when present, we surface matching combinations
  const details = CAPACITY_DETAILS[arch];
  if(!details) return;
  const ad = AD[arch];
  // v3 model: bail out cleanly if legacy modal fields are missing
  if(!details.subscales || !Array.isArray(details.subscales)) return;
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
  let iconHTML = `<div style="font-size:48px;color:${ad.color};text-align:center;margin-bottom:14px">${ad.icon}</div>`;
  const sourceBox = document.querySelector(`.archbox[onclick*="'${arch}'"] svg`);
  if(sourceBox){
    iconHTML = `<div class="arch-modal-icon-wrap" style="display:flex;justify-content:center">${sourceBox.outerHTML.replace('class="archbox-icon"', 'class="arch-modal-icon"')}</div>`;
  }

  // Subscale list
  const subList = details.subscales.map(s => `
    <div class="arch-sub-item" style="border-left-color:${ad.color}">
      <div class="arch-sub-item-name">${s.name}</div>
      <div class="arch-sub-item-desc">${s.desc}</div>
    </div>`).join('');

  // Combinations — only shown when scored data is provided AND a combination matches
  let combosHTML = '';
  if(scored && scored.subRaw){
    const subPct = computeSubPct(arch, scored.subRaw);
    const matched = details.combinations.filter(c => {
      try { return c.detect(subPct); } catch(e){ return false; }
    });
    if(matched.length > 0){
      combosHTML = `
        <div style="margin-top:24px;padding-top:22px;border-top:1px solid var(--border)">
          <div style="font-family:var(--fm);font-size:9px;font-weight:700;letter-spacing:.16em;color:${ad.color};text-transform:uppercase;margin-bottom:14px">Your pattern</div>
          ${matched.map(c => `
            <div style="margin-bottom:18px;padding:14px 16px;background:var(--surface2);border-left:3px solid ${ad.color};border-radius:6px">
              <div style="font-family:var(--fd);font-size:14.5px;font-weight:700;color:var(--text);margin-bottom:8px;line-height:1.35">${c.label}</div>
              <div style="font-size:13px;color:var(--text2);line-height:1.65">${c.content}</div>
            </div>`).join('')}
        </div>`;
    }
  }

  // "Also worth knowing" — always shown
  let alsoHTML = '';
  if(details.also){
    alsoHTML = `
      <div style="margin-top:22px;padding-top:18px;border-top:1px dashed var(--border)">
        <div style="font-family:var(--fm);font-size:9px;font-weight:700;letter-spacing:.16em;color:var(--text3);text-transform:uppercase;margin-bottom:10px">Also worth knowing</div>
        <div style="font-size:13px;color:var(--text2);line-height:1.7">${details.also}</div>
      </div>`;
  }

  // Uncovered subscales note
  let uncoveredHTML = '';
  if(details.uncovered){
    uncoveredHTML = `
      <div class="arch-uncovered">
        <div class="arch-uncovered-hdr">Not measured by this assessment</div>
        <div class="arch-uncovered-name">${details.uncovered.name}</div>
        <div class="arch-uncovered-note">${details.uncovered.note}</div>
        <div class="arch-uncovered-cta">A more comprehensive assessment is in development. If you're interested in measuring these capacities, please <a href="mailto:hello@inciteleadership.com?subject=Five%20Layers%20Deep%20—%20comprehensive%20assessment" style="color:inherit;border-bottom:1px solid var(--text3)">get in touch</a>.</div>
      </div>`;
  }

  content.innerHTML = `
    <div class="arch-modal-hdr">
      ${iconHTML}
      <div class="arch-modal-eyebrow" style="color:${ad.color}">The ${ad.name}</div>
      <div class="arch-modal-title" id="arch-modal-title">${ARCH_TITLES[arch] || ad.name}</div>
    </div>
    <div class="arch-modal-body">
      <p class="arch-modal-framing">${details.framing}</p>
      <div class="arch-sub-list">${subList}</div>
      ${combosHTML}
      ${alsoHTML}
      ${uncoveredHTML}
    </div>`;

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


// ──────────────────────────────────────────────────────────────────
// THEORY-IN-ACTION inline expansion (results-page deep dive)
// ──────────────────────────────────────────────────────────────────
const LSA_TIA_BLOCKS = (typeof window !== "undefined" && window.LSA_TIA_BLOCKS) || {};

let _archDeepOpen = null;
function toggleArchDeep(arch){
  const panel = document.getElementById('arch-deep-panel');
  if(!panel) return;
  const allBtns = document.querySelectorAll('.arch-deep-btn');
  // If clicking the already-open capacity, close it
  if(_archDeepOpen === arch){
    panel.classList.remove('open');
    panel.innerHTML = '';
    allBtns.forEach(b => b.classList.remove('active'));
    _archDeepOpen = null;
    return;
  }
  // Otherwise, open the chosen capacity
  panel.innerHTML = LSA_TIA_BLOCKS[arch] || '';
  panel.classList.add('open');
  allBtns.forEach(b => b.classList.remove('active'));
  const activeBtn = document.getElementById('arch-deep-btn-' + arch);
  if(activeBtn) activeBtn.classList.add('active');
  _archDeepOpen = arch;
  // Smooth scroll the panel into view, anchored just below the button
  requestAnimationFrame(() => {
    if(activeBtn){
      const btnRect = activeBtn.getBoundingClientRect();
      const targetY = window.pageYOffset + btnRect.bottom - 20;
      window.scrollTo({ top: targetY, behavior: 'smooth' });
    }
  });
}

// Wrapper used by results-page deep-dive buttons — uses the stashed scored data
function openArchModalFromResults(arch){
  if(_lastScored && _lastScored.subRaw){
    openArchModal(arch, _lastScored);
  } else {
    openArchModal(arch);
  }
}

// Helper: compute within-capacity subscale percentages for combination detection
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
      content.innerHTML = `<div class="sub-content-intro">Subscales are drawn from validated reference instruments — see <a href="#foundations" onclick="openFoundations(event)" style="color:inherit;text-decoration:underline">Theoretical foundations</a> for full citations and the coverage matrix. Percentages are within-capacity: the proportion of available points you scored on that subscale.</div>` + renderSubscaleAnalysis(scored.subRaw);
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
  // Calculate per-subscale percentages and per-capacity totals
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

  // Sort capacities by their total subscale-coded score (descending)
  const sortedArchs = ARCHS.slice().sort((a,b) => out[b].total - out[a].total);

  return sortedArchs.map(arch => {
    const ad = AD[arch];
    const data = out[arch];

    // Sort subscales within capacity by percentage
    const sortedSubs = Object.entries(data.subscales)
      .map(([key, info]) => ({ key, ...info }))
      .sort((a,b) => b.pct - a.pct);

    const dominantSub = sortedSubs[0];
    const interp = subscaleInterpretation(arch, dominantSub, sortedSubs);
    const note = subscaleNote(arch);

    const bars = sortedSubs.map(s => `
      <div class="sub-row">
        <div class="sub-row-label">
          <span class="sub-row-name">${s.label}</span>
          <span class="sub-row-meta">${s.items} item${s.items !== 1 ? 's' : ''}</span>
        </div>
        <div class="sub-row-bar">
          <div class="sub-bar-track"><div class="sub-bar-fill" style="width:${s.pct}%;background:${ad.color}"></div></div>
          <span class="sub-row-pct">${s.pct}%</span>
        </div>
      </div>
    `).join('');

    return `<div class="sub-card" style="border-left-color:${ad.color}">
      <div class="sub-card-hdr">
        <span class="sub-card-icon">${ad.icon}</span>
        <span class="sub-card-name" style="color:${ad.color}">${ad.name}</span>
        <span class="sub-card-pct">${data.pct}% within capacity</span>
      </div>
      <div class="sub-rows">${bars}</div>
      ${interp ? `<p class="sub-interp">${interp}</p>` : ''}
      ${note ? `<p class="sub-note">${note}</p>` : ''}
    </div>`;
  }).join('');
}

function subscaleInterpretation(arch, dominant, sortedSubs){
  // Skip interpretation if dominant score is 0 (user didn't engage with this capacity)
  if(dominant.pct === 0) return `You didn't engage with <strong>${AD[arch].name}</strong> responses on this assessment, so subscale-level patterns can't be read.`;

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
      text += ` <strong>${bottom.label}</strong> (${bottom.pct}%) is comparatively underused.`;
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

// ══════════════════════════════════════════════════════════════════
// BAR CHART (default results graph — toggle with radar)
// ══════════════════════════════════════════════════════════════════
function buildBarSVG(basePct, pressPct, gap){
  const width = 480;
  const padTop = 20;
  const padLeft = 110;
  const padRight = 60;
  const rowH = 56;
  const barH = 14;
  const barGap = 4;
  const maxBarW = width - padLeft - padRight;
  const height = padTop + ARCHS.length * rowH + 8;

  let body = '';
  ARCHS.forEach((arch, i) => {
    const ad = AD[arch];
    const y = padTop + i * rowH;
    const baseW = (basePct[arch] / 100) * maxBarW;
    const pressW = (pressPct[arch] / 100) * maxBarW;
    const g = gap[arch];
    const yBase = y;
    const yPress = y + barH + barGap;

    body += `<text class="bar-label" x="${padLeft - 12}" y="${y + barH + barGap/2 + 5}" text-anchor="end" fill="${ad.color}"><tspan class="bar-label-icon">${ad.icon}</tspan> <tspan font-weight="600">${ad.name}</tspan></text>`;

    body += `<rect class="bar-track" x="${padLeft}" y="${yBase}" width="${maxBarW}" height="${barH}" fill="#000" fill-opacity="0.04" rx="2"/>`;
    body += `<rect class="bar-base" x="${padLeft}" y="${yBase}" width="${Math.max(2, baseW).toFixed(1)}" height="${barH}" fill="#D4A854" fill-opacity="0.55" stroke="#D4A854" stroke-width="0.6" rx="2"/>`;
    body += `<text class="bar-pct" x="${padLeft + Math.max(2, baseW) + 6}" y="${yBase + barH - 3}" fill="${ad.color}">${basePct[arch]}</text>`;

    body += `<rect class="bar-track" x="${padLeft}" y="${yPress}" width="${maxBarW}" height="${barH}" fill="#000" fill-opacity="0.04" rx="2"/>`;
    body += `<rect class="bar-press" x="${padLeft}" y="${yPress}" width="${Math.max(2, pressW).toFixed(1)}" height="${barH}" fill="#A85454" fill-opacity="0.55" stroke="#A85454" stroke-width="0.6" rx="2"/>`;
    body += `<text class="bar-pct" x="${padLeft + Math.max(2, pressW) + 6}" y="${yPress + barH - 3}" fill="${ad.color}">${pressPct[arch]}</text>`;

    if(g >= 10){
      const labelX = width - 8;
      body += `<text class="bar-gap" x="${labelX}" y="${y + barH + barGap/2 + 5}" text-anchor="end" fill="${ad.color}" opacity="0.65">−${g}</text>`;
    }
  });

  return `<svg class="bar-svg" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet">${body}</svg>`;
}

// ══════════════════════════════════════════════════════════════════
// RESULTS-PAGE TOGGLE HELPERS
// ══════════════════════════════════════════════════════════════════
function setGraphMode(mode){
  const barEl = document.getElementById('graph-bar');
  const radarEl = document.getElementById('graph-radar');
  const bTog = document.getElementById('graph-tog-bar');
  const rTog = document.getElementById('graph-tog-radar');
  if(!barEl || !radarEl || !bTog || !rTog) return;
  if(mode === 'bar'){
    barEl.style.display = '';
    radarEl.style.display = 'none';
    bTog.classList.add('active');
    rTog.classList.remove('active');
  } else {
    barEl.style.display = 'none';
    radarEl.style.display = '';
    bTog.classList.remove('active');
    rTog.classList.add('active');
  }
}

function toggleGoingDeeper(){
  const content = document.getElementById('going-deeper-content');
  const tog = document.getElementById('going-deeper-toggle');
  if(!content || !tog) return;
  if(content.style.display === 'none'){
    content.style.display = 'flex';
    tog.textContent = 'Hide component scores ▲';
  } else {
    content.style.display = 'none';
    tog.textContent = 'Show component scores ▼';
  }
}

function showAllCapacities(){
  const others = document.getElementById('arch-deep-grid-others');
  const btn = document.getElementById('show-all-btn');
  if(!others || !btn) return;
  if(others.style.display === 'none'){
    others.style.display = '';
    btn.textContent = 'Hide other capacities ▲';
  } else {
    others.style.display = 'none';
    btn.textContent = 'Show all 5 capacities ▼';
  }
}


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
    return `<polygon class="radar-grid" points="${pts.join(' ')}" />`;
  }).join('');

  // Axes
  const axes = ARCHS.map((_, i) => {
    const [x, y] = pt(i, 1);
    return `<line class="radar-axis" x1="${cx}" y1="${cy}" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}" />`;
  }).join('');

  // Polygons
  const baseFracs = ARCHS.map(a => Math.max(0.02, basePct[a] / 100));
  const pressFracs = ARCHS.map(a => Math.max(0.02, pressPct[a] / 100));

  const basePts = baseFracs.map((f, i) => pt(i, f).map(n => n.toFixed(1)).join(',')).join(' ');
  const pressPts = pressFracs.map((f, i) => pt(i, f).map(n => n.toFixed(1)).join(',')).join(' ');

  // Vertex dots
  const baseDots = baseFracs.map((f, i) => {
    const [x, y] = pt(i, f);
    return `<circle class="radar-pt" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="3" stroke="#D4A854" />`;
  }).join('');
  const pressDots = pressFracs.map((f, i) => {
    const [x, y] = pt(i, f);
    return `<circle class="radar-pt" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="3" stroke="#A85454" />`;
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
    return `<text class="radar-label" x="${x.toFixed(1)}" y="${y.toFixed(1)}" text-anchor="${anchor}" dy="${dy}" fill="${ad.color}">
      <tspan class="radar-label-icon">${ad.icon}</tspan> ${ad.name}
    </text>`;
  }).join('');

  return `<svg class="radar-svg" viewBox="0 0 480 400" xmlns="http://www.w3.org/2000/svg">
    ${grid}
    ${axes}
    <polygon class="radar-poly-base" points="${basePts}" />
    <polygon class="radar-poly-press" points="${pressPts}" />
    ${baseDots}
    ${pressDots}
    ${labels}
  </svg>`;
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
      // legacy share-link decoder block disabled (incompatible with new scoring shape)
      showPage('pg-results');
    }
  }
});
