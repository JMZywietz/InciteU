# InciteU Assessment Rebuild — Absence Mode Run 2026-05-19

## Status: rebuild applied, JSX validated, pushed to main

Absence mode run on 2026-05-19 produced a comprehensive rebuild of `src/tools/LeadershipCapacitiesAnalysis.jsx`:

### Applied changes
- **POOL** completely replaced — 15 scenarios in new shape (5 drive + 5 thriving + 5 protecting). Section keys renamed `baseline/pressure/identity` → `drive/thriving/protecting`.
- **New constants**: `DRIVES`, `SUB_ARCHS`, `SUB_ARCH_BY_DRIVE`, `CAPACITIES`, `DRIVE_DETAIL`, `SUB_ARCH_DETAIL`, `CAPACITY_DETAIL`, `SUB_ARCH_PROMPTS`, `CAPACITY_PROMPTS`. Old `ARCHS` and `AD` retained as compatibility aliases (`ARCHS = CAPACITIES`; `AD` spreads CAPACITY_DETAIL + DRIVE_DETAIL with hedonist/warrior keys mapped to drives).
- **SUBSCALES** rebuilt with new sub-archetype tags (BAS Drive / Reward Responsiveness / Fun Seeking, BIS Threat Sensitivity, FFFQ Fight / Flight) and new capacity sub-construct tags (TEPS, SBI, MAIA-2, BVS, ASI-3, PHQ-15, TEPS-A, PSWQ, RRS, IUS for Egoist + Veteran; existing IRI / NFC / CFS / CFC / MLQ / TCI tags preserved for Lover/Strategist/Visionary).
- **SUBSCALE_COUNTS** stubbed to `{}` (legacy keys invalid in new model).
- **CAPACITY_DETAILS** aliased to `CAPACITY_DETAIL`.
- **calcScores** completely rewritten — returns `{ drive: {thrivingPct, protectingPct, raw, max}, subArch: {raw, pct}, capacity: {raw, pct, max}, counts }`.
- **showResults / renderResults** rewritten — produces drive slider + click-to-expand sub-archetype panels + side-by-side capacity bar charts + coaching prompts.
- **buildSession** updated for new section names; section order now fixed (drive → thriving → protecting), not shuffled across sections.
- **renderScenario phaseLabels** updated.
- **CSS additions** (`.drive-slider`, `.subarch-panel`, `.cap-bars-grid`, `.r-prompts`) injected into LSA_CSS.
- **pg-foundations** new section added at top: "v3 model — two drives, five capacities" with full theoretical anchors (Panksepp SEEKING/FEAR/RAGE, Carver & White BAS, Gray BIS, FFFQ, Damasio somatic markers, Lisa Feldman Barrett constructed emotion, Robert Kegan subject-object, Susanne Cook-Greuter post-conventional stages).

### Known limitations / out of scope this run
- **pg-intro archetype boxes** still show old labels (Hedonist / Warrior / Lover / Strategist / Visionary). Modals gracefully no-op when clicked (guarded against missing legacy fields). Needs content update in iteration mode.
- **Existing pg-foundations cards** (HEDONIST / WARRIOR / LOVER / STRATEGIST / VISIONARY) preserved below the new v3 model section. They use old terminology and could be refactored or removed.
- **Email-results share link** disabled — encodeResults / decodeResults no longer match the new scoring shape.
- **buildBarSVG / buildRadarSVG / calcOverall / calcGap** retained as dead code (no callers; safe to delete later).
- **Coaching content** is a starter library — 1 strength + 1 limit per sub-archetype, 1 prompt per capacity per (thriving/protecting × high/low). Ready for content expansion.

### Validation
- esbuild JSX validation: clean (rc=0)
- File size: 255,007 chars (vs original 235,684, delta +19,323)
- Runtime flow verified by inspection: take assessment → buildSession → renderScenario × 15 → runProcessing → showResults → calcScores + renderResults → drive slider + capacity bars + prompts visible.

---



---

# Earlier handover

# InciteU — Assessment Rebuild Handover

**Last updated:** May 19, 2026
**Owner:** Jen Zywietz (jennmay@gmail.com)
**Repo:** https://github.com/JMZywietz/InciteU
**Main handover (don't replace — extend):** https://raw.githubusercontent.com/JMZywietz/InciteU/main/INCITEU-HANDOVER.md
**Current LCA tool file:** https://raw.githubusercontent.com/JMZywietz/InciteU/main/src/tools/LeadershipCapacitiesAnalysis.jsx (235,684 chars)

---

## Read this first

The InciteU main handover doc (linked above) is the canonical source for everything about the codebase, deployment, component structure, and rules of engagement. **Read it before doing anything to code.** This document only covers the assessment rebuild — it does not replace the main handover.

**Rules carried over from the main handover (non-negotiable):**

1. Never change anything in the repo without Jen's explicit permission, including stylistic changes.
2. Always fetch the current state of any file you intend to touch before touching it.
3. Edits and commits happen via Composio `GITHUB_COMMIT_MULTIPLE_FILES` (use `upserts`, not `files`; use `encoding: "utf-8"`, never base64 for text).
4. Handover-doc updates go to `INCITEU-HANDOVER.md` on `main`. This doc you're reading lives in the same place (push as a new file alongside).
5. Don't fetch claude.ai/public/artifacts URLs — they return 403.

---

## TL;DR

The current LCA assessment uses a 5-archetype model with the legacy names: Hedonist, Warrior, Lover, Strategist, Visionary. A May 2026 session with Jen reworked the underlying theory into a **2-drive × 5-capacity** architecture, separating motivational orientation (Thriving / Protecting drives) from evolved apparatus (five capacities: Egoist, Veteran, Lover, Strategist, Visionary). The new assessment needs to be rebuilt to score these two dimensions independently — which is genuine architectural work, not a cosmetic relabel.

**The big move:** instead of scoring 5 flat archetypes, score (a) drive balance, (b) capacity profile when thriving, (c) capacity profile when under pressure. Three layers, each independently meaningful.

The existing scenario pool (32 scenarios) already pulls from well-validated psychometric scales (BAS/BIS, IRI, MLQ, cognitive flexibility). The new chat will need to **extend the same literature-borrowing approach to two capacities currently missing from coverage: Egoist (body) and Veteran (memory).**

---

## The theoretical model (what changed)

### Old: 5 archetypes, flat
The original model treated five archetypes as one ranked list. The assessment asked: "which of these five do you most often run?" This collapsed two distinct categories — motivational drives and evolved capacities — into a single dimension.

### New: 2 drives × 5 capacities, orthogonal axes

**Capacities (infrastructure)** — the evolved apparatus you USE to navigate the world. Five capacities in evolutionary sequence, oldest at top:

| Capacity | Description |
|---|---|
| **Egoist** | Body — where pleasure and pain register; sensation, interoception, instinct |
| **Veteran** | Memory — where the body's wisdom gets encoded as patterns; learned associations, anticipation |
| **Lover** | Empathy — the shared social brain; what Play built between us |
| **Strategist** | Imagination — private simulation; modeling future moves; analytical reasoning |
| **Visionary** | Meaning — individual purpose; moral frames; meaning-making |

**Drives (orientation)** — the motivational direction you point that apparatus:

| Drive | Description | Sub-types |
|---|---|---|
| **Thriving** (approach) | Pursue what supports flourishing | Achiever / Hedonist / Adventurer |
| **Protecting** (avoid) | Avoid what threatens survival | Sentinel / Warrior / Evader |

**Why this matters for the assessment:** two people who both score "Strategist" can have wildly different lived experiences. Thriving-Strategist uses imagination to spot opportunities; Protecting-Strategist uses imagination to anticipate threats and overthink. Same capacity, opposite mode. The flat model couldn't see this.

**The full 5×5 matrix** (capacities × drive-states) is the back-end engine that powers coaching prompts. The user-facing model is just two questions: "Which drive am I leaning on right now?" and "Which capacity am I leading with?"

The complete theoretical artifact (with all 25 emotion-territory cells, the Play-as-developmental-engine and Rage-two-paths notes, the Affect-substrate explanation, and Diagram 1 + Diagram 2) is in Jen's Google Drive as `inciteu-architecture-diagrams.html`. **Read that artifact before designing scoring rubrics** — every cell of the 5×5 matrix is a coaching target.

---

## The new assessment architecture

Three sections. Each independently meaningful. The user takes them in order; results integrate at the end.

### Section 1 — Drive Balance

**What it measures:** how much someone lives in Thriving (approach) vs. Protecting (avoid) at baseline.

**Borrowing from:** Carver & White (1994) BIS/BAS Scales — already partially used in the existing assessment (the `hedonist:drive`, `hedonist:fun_seeking`, `hedonist:reward_responsiveness`, `warrior:threat_sensitivity` items map directly to BAS Drive / BAS Fun Seeking / BAS Reward Responsiveness / BIS subscales). The 20-item BIS/BAS scale is the gold standard for approach/avoid motivation measurement.

**Recommended approach:** keep forced-choice format OR add a short Likert section. The existing items can be repurposed — they already measure these constructs.

**Output:** a balance point on the Thriving↔Protecting axis. Could be expressed as a percentage split (e.g., "62% Thriving / 38% Protecting") or as a single position on a spectrum.

### Section 2 — Thriving-Mode Capacities

**What it measures:** which capacities someone leans on when in approach mode (in their element, going after something).

**Five capacities scored in approach context.** Items framed as: "When I'm going after what I want / in my element / feeling alive..."

**Output:** top-2 and bottom-2 capacities when thriving.

### Section 3 — Protecting-Mode Capacities

**What it measures:** which capacities someone leans on under pressure (stressed, threatened, defensive).

**Five capacities scored in defensive context.** Items framed as: "When I'm stressed / feel threatened / something is wrong..."

**Output:** top-2 and bottom-2 capacities under pressure.

### Results page

A two-axis visualization: drive balance on one axis, capacity profile (split by mode) on the other. The 25-cell matrix becomes the back-end map; the coaching prompts target *cells the person doesn't visit*. Example:

> "You're Thriving-leaning at baseline, but under pressure you go straight to overthinking (Protecting-Strategist) and away from connection (Protecting-Lover). When you're stressed, try a Lover-Protecting move — call someone you trust and say 'help me think this through.'"

---

## Current scenario inventory

The existing `LeadershipCapacitiesAnalysis.jsx` file contains a `POOL` array of 32 scenarios (search for `const POOL = [` around char 142,900). Each scenario has 5 forced-choice options, one per archetype, each tagged with a psychometric sub-construct.

### Sub-constructs currently used

These tell us which validated scales each archetype draws from:

**`hedonist` archetype in current code (= Thriving drive in new model — BAS scale items):**
- `drive` — BAS Drive subscale
- `fun_seeking` — BAS Fun Seeking subscale
- `reward_responsiveness` — BAS Reward Responsiveness subscale

**`warrior` archetype in current code (= Protecting drive in new model — BIS + defensive cascade items):**
- `threat_sensitivity` — BIS subscale
- `fight` — defensive cascade
- `flight` — defensive cascade

**Lover (= Lover capacity — IRI):**
- `empathic_concern` — IRI Empathic Concern
- `personal_distress` — IRI Personal Distress
- `perspective_taking` — IRI Perspective Taking

**Strategist (= Strategist capacity — cognitive psychology):**
- `analytical_thinking` — analytic reasoning
- `cognitive_flexibility` — Cognitive Flexibility Scale (Martin & Rubin)
- `future_consequences` — Consideration of Future Consequences (Strathman et al.)

**Visionary (= Visionary capacity — meaning psychology):**
- `presence_of_meaning` — MLQ Presence subscale (Steger et al.)
- `search_for_meaning` — MLQ Search subscale
- `self_transcendence` — self-transcendence values (Reed, Maslow)

### What's missing

**Egoist (body capacity)** — no scenarios currently. The old "Hedonist" archetype was really the Thriving *drive*, not the body capacity. (Note: "Hedonist" is now a sub-type name under the Thriving drive — see naming section.) The body itself wasn't measured.

**Veteran (memory capacity)** — no scenarios currently. Memory as an evolved capacity is a new dimension not in the old model.

---

## Literature for the missing capacities

The existing scenarios already follow a clean pattern: each archetype pulls from 2-3 validated psychometric constructs. The same pattern should be applied to Egoist and Veteran.

### Egoist (body)

**Thriving-Egoist** — the body as approach apparatus:
- **TEPS** (Temporal Experience of Pleasure Scale; Gard et al. 2006) — Consummatory subscale measures hedonic capacity in the moment. Excellent fit.
- **Savoring Beliefs Inventory** (Bryant 2003) — Savoring the Moment subscale.
- **MAIA-2** (Multidimensional Assessment of Interoceptive Awareness, Mehling et al. 2018) — Noticing subscale; Body Listening subscale. The "tuning in to your body in a curious way" dimension.

**Protecting-Egoist** — the body as threat-detection apparatus:
- **Body Vigilance Scale** (Schmidt, Lerew, & Trakowski 1997) — measures attention to bodily sensations as potential threats.
- **Anxiety Sensitivity Index-3** (ASI-3; Taylor et al. 2007) — fear of body sensations. Physical Concerns subscale especially.
- **MAIA-2** — Not-Distracting and Not-Worrying subscales (inverse-scored capture the protecting-body pattern).
- **PHQ-15** somatic symptom items — for general body-threat-response patterns.

**Suggested sub-construct tags for new Egoist scenarios:**
- `sensory_pleasure` (Thriving-Egoist; TEPS Consummatory)
- `body_savoring` (Thriving-Egoist; SBI Moment)
- `interoceptive_awareness` (Thriving-Egoist; MAIA Noticing — can serve both modes depending on framing)
- `body_vigilance` (Protecting-Egoist; BVS)
- `anxiety_sensitivity` (Protecting-Egoist; ASI-3 Physical)
- `somatic_threat` (Protecting-Egoist; PHQ-15-style)

### Veteran (memory)

**Thriving-Veteran** — memory as approach apparatus:
- **TEPS-Anticipatory** (Gard et al.) — anticipating future pleasure. Direct fit.
- **Savoring Beliefs Inventory** — Anticipating subscale (looking forward), Reminiscing subscale (looking back at past positives).
- **Episodic Future Thinking** measures (Atance & O'Neill, Schacter et al.) — positive-valenced future projection.
- **Behavioral Activation Scale** (BAS) Drive items already overlap here (the "I go after things I want" pattern relies on memory of past rewards).

**Protecting-Veteran** — memory as threat-detection apparatus:
- **PSWQ** (Penn State Worry Questionnaire; Meyer et al. 1990) — pathological worry; anticipating future threats.
- **RRS** (Ruminative Responses Scale; Nolen-Hoeksema 1991) — Brooding and Reflection subscales; replaying past negative events.
- **Intolerance of Uncertainty Scale** (IUS; Freeston, Buhr & Dugas) — discomfort with not-knowing future outcomes.
- Loss aversion items adapted from Kahneman & Tversky's prospect theory work (though these are typically behavioral, not survey).

**Suggested sub-construct tags for new Veteran scenarios:**
- `anticipatory_pleasure` (Thriving-Veteran; TEPS-A)
- `savoring_future` (Thriving-Veteran; SBI Anticipating)
- `reminiscing_positive` (Thriving-Veteran; SBI Reminiscing)
- `worry` (Protecting-Veteran; PSWQ)
- `rumination` (Protecting-Veteran; RRS)
- `intolerance_uncertainty` (Protecting-Veteran; IUS)

---

## What the rebuild involves

This is a substantial restructuring, not a cosmetic update. Order of operations:

### 1. Audit existing scenarios

Go through the 32 scenarios in the `POOL` array. For each scenario, decide:
- Does it primarily probe **drive balance** (Section 1) — i.e., are the options sorting people on approach-vs-avoid? If yes, the legacy `hedonist`/`warrior` options become Thriving/Protecting items for Section 1.
- Does it primarily probe a **capacity in approach mode** (Section 2) — i.e., the scenario is set in a thriving / opportunity / approach context, and the options sort people by which capacity they'd lean on?
- Does it primarily probe a **capacity in defensive mode** (Section 3) — i.e., the scenario is set in a threat / pressure / stress context, and the options sort by capacity?

Many existing scenarios may fit cleanly into one section. Some may need reframing (e.g., rewriting the scenario's situational framing to make the approach/avoid context clearer).

### 2. Write new scenarios for Egoist and Veteran

For each of these two capacities, write Thriving-mode and Protecting-mode items pulling from the literature listed above. Match the existing scenario format (5 forced-choice options, one per capacity in Sections 2-3; or Likert items in Section 1 if going that route).

### 3. Decide format

Open question: keep forced-choice throughout, or use Likert for the drive-balance section? Forced-choice is what the codebase currently does and what users are familiar with. Likert is more standard for BIS/BAS and would let the drive-balance score be more nuanced. **Ask Jen.**

### 4. Restructure the scoring code

The `LSA_SCRIPT` block in `LeadershipCapacitiesAnalysis.jsx` does the scoring math. Currently scores 5 archetypes flat. Needs to:
- Score Section 1 separately as a Thriving/Protecting balance
- Score Sections 2 and 3 separately as 5-capacity profiles in each mode
- Generate a results object with three layers: `driveBalance`, `thriverCapacities`, `warriorCapacities`

### 5. Restructure the results page

The current results page shows the top-1 or top-3 archetypes with descriptions. New version needs:
- Drive balance visualization (Thriving↔Protecting axis)
- Capacity profile under Thriving mode (which 5 you use most when in approach)
- Capacity profile under Protecting mode (which 5 you use most under pressure)
- Coaching prompts that target underused cells in the 25-cell matrix (especially the cell at *current-drive-mode × least-used-capacity*)

### 6. Apply the full rename throughout

The naming has been finalized (see "Decisions already made" below). The current code uses `hedonist` and `warrior` as the OLD archetype identifiers. The new model splits these into separate drives (Thriving, Protecting) and sub-types (Achiever / Hedonist / Adventurer; Sentinel / Warrior / Evader). Note that **Hedonist has been relocated, not deleted** — it used to be the drive name; now it's a sub-type under Thriving. **Warrior has also been relocated** — it used to be the drive name; now it's a sub-type under Protecting.

The rename is mechanical in code but conceptually significant — every existing `hedonist`/`warrior` code reference needs to be re-classified by whether it's measuring (a) the drive itself, which becomes Thriving/Protecting, or (b) a sub-type style of expressing the drive, which becomes Achiever/Hedonist/Adventurer or Sentinel/Warrior/Evader. **Don't do this in isolation — it should ride along with the bigger restructuring.**

---

## Decisions already made (don't re-litigate)

These were settled in the May 2026 sessions. The new chat should treat them as fixed:

- **Capacities/substrates are vertical** in all diagrams; **drives are horizontal**. Never flip orientation.
- **Naming locked:** Thriving (drive), Protecting (drive), Egoist, Veteran, Lover, Strategist, Visionary (capacities). Sub-types: Achiever/Hedonist/Adventurer (Thriving), Sentinel/Warrior/Evader (Protecting).
- **Hedonist and Warrior have been relocated, not deleted.** Both used to be drive names; both are now sub-types. Hedonist is now a sub-type under the Thriving drive (Achiever / Hedonist / Adventurer). Warrior is now a sub-type under the Protecting drive (Sentinel / Warrior / Evader). Do not put them back as drive names.
- **Universal anchor + sub-types pattern** for certain cells in the 25-cell matrix (see the architecture diagrams HTML).
- **URL path `/tools/self/leadership-stance` is stable** for share-link continuity — do not change.
- **The assessment scoring restructure does not require restructuring the assessment's URL or page wrapper** — keep `LeadershipStanceAssessmentPage` as the export.

---

## Open questions for Jen

These are the decision points the new chat will hit:

1. **Forced-choice vs. Likert for Section 1?** Forced-choice keeps the format consistent; Likert gives more measurement precision for drive balance.
2. **How many items per section?** Current pool is 32 total. New structure might want ~6 items for Section 1 (drive balance, fewer needed because BIS/BAS items are efficient), then ~12 for Section 2 and ~12 for Section 3 (covering all 5 capacities with 2-3 items each). Total ~30 items.
3. **Should Section 1 be its own page, or integrated?** A separate page for drive balance might be clearer pedagogically.
4. **Results-page coaching prompts** — should they target the *bottom-2 cells in each mode*, or the *one most-underused cell across all 25*? The latter is more focused but might miss diversity.

---

## Canonical files (always fetch fresh before touching)

- Main handover: `https://raw.githubusercontent.com/JMZywietz/InciteU/main/INCITEU-HANDOVER.md`
- LCA tool: `https://raw.githubusercontent.com/JMZywietz/InciteU/main/src/tools/LeadershipCapacitiesAnalysis.jsx`
- App routing: `https://raw.githubusercontent.com/JMZywietz/InciteU/main/src/App.jsx`
- Theme tokens: `https://raw.githubusercontent.com/JMZywietz/InciteU/main/src/theme.js`
- Shared styles: `https://raw.githubusercontent.com/JMZywietz/InciteU/main/src/lib/routes.js`

## Reference artifacts (in Jen's Google Drive)

- `inciteu-architecture-diagrams.html` — the 5×5 matrix with all 25 cells, Diagram 1 (capacity chain), Diagram 2 (full drive-state × capacity matrix), and theoretical footnotes. Read this BEFORE designing scoring rubrics — every cell is a coaching target.

---

## How to open the new chat

A good first message from Jen will be: "Read this handover doc, then read the architecture-diagrams HTML, then come back to me with your understanding before doing anything." The new chat should:

1. Fetch the main InciteU handover doc (canonical rules)
2. Fetch this handover doc
3. Read the architecture-diagrams.html artifact
4. Fetch the current LCA file to inventory existing scenarios
5. Come back to Jen with: "Here's what I see. Here's what I think the assessment audit should look like. Here are the open questions I need you to answer before I touch any code."

Do not write code or touch the repo until Jen explicitly approves the plan.

---

*End of handover. The hard part isn't the words — it's remembering that capacities are infrastructure and drives are orientation, and that two people with the same capacity profile can be living completely different lives depending on which drive runs underneath. Build the assessment to see that.*
