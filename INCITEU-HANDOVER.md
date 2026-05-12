# InciteU — Handover for Future Sessions

**Last updated:** May 12, 2026 (Two-paths landing + wizard relocation + paired-flow landings; Identity Box tool added)
**Owner:** Jen Zywietz (jennmay@gmail.com)
**Repo:** https://github.com/JMZywietz/InciteU
**Live site:** https://inciteu.vercel.app (custom domain pending → inciteu.com)

---

## TL;DR for Claude

Jen has a working React/Vite/Vercel site at `JMZywietz/InciteU`. It's a leadership development site with 9 working tools, 2 think pieces (including the Cynefin scrollytelling and Challenge Mapper added this session), and supporting pages. The homepage, About page, footer, and where-to-start wizard were all overhauled in the May 11 session.

**The most important thing in this document is §0.** Read it before doing anything else. Claude cannot see the rendered website, and pretending otherwise has burned multiple sessions. The rules in §0 exist because they were not followed and the consequences were bad.

The second most important: **for any push over ~15KB, hand the files to Jen for manual upload via the GitHub web UI rather than wrestling with the Composio API.** See §5 pitfall #5 and §3 fallback section. The API will get stuck on large strings and waste several turns.

Adding a new tool is a routine modular task (§4). Modifying existing pages requires fetching every relevant component file first (§0, §2). No exceptions, ever.

---

## §0 — What Claude can and cannot see (READ THIS FIRST)

**Claude cannot see the rendered InciteU website.** This is not a metaphor. It is literally true.

`web_fetch` on `inciteu.vercel.app` returns the bare React SPA shell — about a dozen meta tags, an empty root div, and nothing else. The actual rendered content is produced by JavaScript that Claude's tools cannot execute. Screenshots uploaded by Jen are the only way Claude can see what the site actually looks like.

What this means:

1. **No mockup or visual change is safe to render without source files.** Claude must fetch every component file (header, footer, hero, divider, icons, cards) before producing any visual deliverable. If Claude lacks the source for any element on screen, Claude must say so out loud, before rendering anything: "I haven't seen Footer.jsx; that part is a guess." Never silently fill in details.

2. **"Match the brand" is not the same as "match the code."** The handover lists colors and fonts (theme.js) and reusable styles (styles.js), but those are tokens, not layouts. Reproducing the brand language doesn't reproduce the site. Only fetching the source does.

3. **Mockups in standalone HTML are dangerous.** They look authoritative even when they're guesses. If Claude is building one, every component must be matched line-by-line to the actual React source. The moment Claude invents a header, a footer, an icon, a divider, or a button style without seeing the source for it, the mockup is misleading.

4. **Claude must not make creative changes that weren't authorized.** This includes font weights, tag substitutions (`<div>` → `<p>`), spacing tweaks, hover effects, or anything else not present in the source. The InciteU codebase is meticulously edited; "small improvements" are unauthorized substitutions. If Claude has an idea, it goes in a question, not in a deliverable.

5. **When in doubt, flag uncertainty before producing output.** "I'm about to render the homepage. I have HomePage.jsx, theme.js, and styles.js. I do NOT have Footer.jsx. Should I fetch it or render without a footer?" is the correct posture.

Failure to follow these rules has burned multiple sessions. Subsequent Claudes: do not repeat this.

---

## §1 — Architecture

```
JMZywietz/InciteU/
├── api/synthesize.js              ← Vercel serverless: proxies to Anthropic API
├── src/
│   ├── main.jsx                   ← React entry (BrowserRouter)
│   ├── App.jsx                    ← Route definitions
│   ├── theme.js                   ← Brand: palette C, fonts F, GLOBAL_CSS, HERO_PHOTO
│   ├── styles.js                  ← Reusable styles: btn(), heading(), eyebrow, fieldLabel, fieldInput, btnHoverIn/Out
│   ├── components/                ← Header, Footer, HeroFlourish, OrganicDivider, icons, CategoryCard
│   ├── pages/                     ← Home, Bio, Contact, Think, WhereToStart (two-paths landing), Quiz (wizard)
│   ├── tools/                     ← 9 working tools (see §9)
│   ├── think/                     ← 2 think pieces (see §9)
│   └── lib/
│       ├── routes.js              ← Symbolic name → URL path map
│       ├── useAppNavigate.js      ← Hook: navigate('lcp') instead of '/tools/self/lcp'
│       ├── synthesize.js          ← AI helper: synthesize() + extractText()
│       └── utils.js               ← escapeHTML, downloadHTML
├── package.json                   ← React 18.3.1 + react-router-dom 6.26.2 + Vite 5.4.8
├── vite.config.js
├── vercel.json                    ← Rewrites all paths → /index.html (SPA)
├── public/                        ← Vite static asset root (created May 11 for about-enso.jpg)
│   └── about-enso.jpg            ← Self-hosted; referenced as src="/about-enso.jpg" in BioPage
└── index.html
```

**Stack:** React 18 + inline styles (no Tailwind, no CSS modules) + React Router v6 + Vite + Vercel + Anthropic API via serverless proxy at `/api/synthesize`.

**Brand constants** in `src/theme.js`:
- Background: `C.bgDeep #1F3937`, `C.bgCard #2A4744`
- Per-category card backgrounds: Self `#2A4744` (cool teal) / Team `#33403B` (warm earthy) / Org `#28464A` (cool blue-teal), each with hover variants
- Text: `C.cream #F0EBDB`, `C.creamMuted #C9C2AE`
- Accents: `C.sage #C5D49B`, `C.sageMuted #8FA876`
- Per-category accent colors (used in CategoryCard.jsx, NOT theme.js): Self `#C5D49B` (sage), Team `#E8C87A` (gold), Org `#8CBAC6` (blue)
- Fonts: `F.serif` = Cormorant Garamond, `F.sans` = Inter

**Homepage category cards** (renamed May 11, 2026 session):
- **Inward → "Live Well"** (variant=self) — *Who You Are · What Drives You · What Sustains You*
- **Outward → "Face What Is"** (variant=team) — *Understand Yourself · Understand Others · Understand Reality*; houses the Decision Toolkit
- **Forward → "Lead Well"** (variant=org) — *Set Direction · Make It Happen · Sustain & Renew*

CategoryCard.jsx now supports `toolGroups` (labeled sub-sections within a card) in addition to the flat `tools` array. The homepage uses `toolGroups`.

**Think page** cards have per-piece accent colors and backgrounds (Cynefin = sage/warm, Five Layers Deep = gold/cool).

---

## §2 — Component source URLs

**Fetch these before any visual work.** Every URL is the raw GitHub file. Claude can `web_fetch` these directly.

### Pages
- HomePage: https://raw.githubusercontent.com/JMZywietz/InciteU/main/src/pages/HomePage.jsx
- BioPage: https://raw.githubusercontent.com/JMZywietz/InciteU/main/src/pages/BioPage.jsx
- ContactPage: https://raw.githubusercontent.com/JMZywietz/InciteU/main/src/pages/ContactPage.jsx
- WhereToStartPage (two-paths landing): https://raw.githubusercontent.com/JMZywietz/InciteU/main/src/pages/WhereToStartPage.jsx
- QuizPage (wizard): https://raw.githubusercontent.com/JMZywietz/InciteU/main/src/pages/QuizPage.jsx
- ThinkPage: https://raw.githubusercontent.com/JMZywietz/InciteU/main/src/pages/ThinkPage.jsx

### Components
- Header: https://raw.githubusercontent.com/JMZywietz/InciteU/main/src/components/Header.jsx
- Footer: https://raw.githubusercontent.com/JMZywietz/InciteU/main/src/components/Footer.jsx
- HeroFlourish: https://raw.githubusercontent.com/JMZywietz/InciteU/main/src/components/HeroFlourish.jsx
- OrganicDivider: https://raw.githubusercontent.com/JMZywietz/InciteU/main/src/components/OrganicDivider.jsx
- CategoryCard: https://raw.githubusercontent.com/JMZywietz/InciteU/main/src/components/CategoryCard.jsx
- Icons (SelfIcon, TeamIcon, OrgIcon): https://raw.githubusercontent.com/JMZywietz/InciteU/main/src/components/icons.jsx

### Core
- App (routes): https://raw.githubusercontent.com/JMZywietz/InciteU/main/src/App.jsx
- Theme (palette, fonts, HERO_PHOTO): https://raw.githubusercontent.com/JMZywietz/InciteU/main/src/theme.js
- Styles (btn, heading, eyebrow, fields): https://raw.githubusercontent.com/JMZywietz/InciteU/main/src/styles.js
- Routes map: https://raw.githubusercontent.com/JMZywietz/InciteU/main/src/lib/routes.js
- useAppNavigate hook: https://raw.githubusercontent.com/JMZywietz/InciteU/main/src/lib/useAppNavigate.js
- synthesize helper: https://raw.githubusercontent.com/JMZywietz/InciteU/main/src/lib/synthesize.js
- utils (escapeHTML, downloadHTML): https://raw.githubusercontent.com/JMZywietz/InciteU/main/src/lib/utils.js

### Tools (Self / Inward)
- IdentityBox: https://raw.githubusercontent.com/JMZywietz/InciteU/main/src/tools/IdentityBox.jsx
- ThreeMoments: https://raw.githubusercontent.com/JMZywietz/InciteU/main/src/tools/ThreeMoments.jsx
- LCP (Working with your circle): https://raw.githubusercontent.com/JMZywietz/InciteU/main/src/tools/LCP.jsx
- LeadershipCapacitiesAnalysis: https://raw.githubusercontent.com/JMZywietz/InciteU/main/src/tools/LeadershipCapacitiesAnalysis.jsx
- FiveLives (Purpose): https://raw.githubusercontent.com/JMZywietz/InciteU/main/src/tools/FiveLives.jsx
- SmallestViableExperiment: https://raw.githubusercontent.com/JMZywietz/InciteU/main/src/tools/SmallestViableExperiment.jsx
- PurposeSmallMoves (paired-flow landing for Five Lives + SVE): https://raw.githubusercontent.com/JMZywietz/InciteU/main/src/tools/PurposeSmallMoves.jsx
- EmotionsAsInformation (paired-flow landing for Five Layers Deep + LCA): https://raw.githubusercontent.com/JMZywietz/InciteU/main/src/tools/EmotionsAsInformation.jsx

### Tools (Team / Together)
- ChallengeMapper (Decision Making): https://raw.githubusercontent.com/JMZywietz/InciteU/main/src/tools/ChallengeMapper.jsx
- PreMortem: https://raw.githubusercontent.com/JMZywietz/InciteU/main/src/tools/PreMortem.jsx

### Tools (Org / At scale)
- Readiness: https://raw.githubusercontent.com/JMZywietz/InciteU/main/src/tools/Readiness.jsx
- Vision: https://raw.githubusercontent.com/JMZywietz/InciteU/main/src/tools/Vision.jsx
- Culture model is hosted externally at https://qq5l85.csb.app/ (not in this repo)

### Think pieces
- FiveLayersDeep: https://raw.githubusercontent.com/JMZywietz/InciteU/main/src/think/FiveLayersDeep.jsx
- CynefinScrollytelling: https://raw.githubusercontent.com/JMZywietz/InciteU/main/src/think/CynefinScrollytelling.jsx

---

## §3 — Connecting to GitHub

Composio MCP is connected on Jen's account.
- **Account:** `github_tum-horse` (login: JMZywietz)
- **Default branch:** `main`
- **The tool that works:** `GITHUB_COMMIT_MULTIPLE_FILES` with `encoding: "utf-8"`. Do not use base64 — it bloats payloads and broke a previous session.

Verify connection at session start:
```
COMPOSIO_SEARCH_TOOLS query: {"use_case": "create or update file in GitHub repo on a branch", "known_fields": "owner:JMZywietz, repo:InciteU"}
```

If it shows `has_active_connection: true` → proceed. If not → user reconnects via Composio.

---


### Fallback: hand the files to Jen for manual upload

**Use this whenever a commit involves more than ~15 KB of new file content in a single push.** The Composio API path that worked great for small edits (front-page tweaks, footer link adds — ~2 KB) struggles when a single file gets large. Symptoms: tool call hangs, payload truncation, JSON escaping issues, repeated workbench retries that go nowhere. This burned the second half of the May 11 session before we gave up and switched to manual upload.

How to hand off:

1. Build the file(s) locally, save to `/mnt/user-data/outputs/`.
2. Call `present_files` so they appear as downloadable attachments.
3. Tell Jen the exact target path in the repo (e.g. `src/pages/BioPage.jsx` overwrites existing; `public/about-enso.jpg` is a new file, may need the `public/` folder created via GitHub's "Add file → Upload files → type path with / in the filename" trick).
4. Vercel auto-deploys on commit just the same.

This is faster, not a workaround. It's the recommended path for any new page, any new image, or any single-file commit over ~15 KB. Small file edits (string changes, single-line additions, footer link tweaks) still go through `GITHUB_COMMIT_MULTIPLE_FILES` via Composio.

---

## §4 — Adding a new tool — end-to-end playbook

(Same as previous version; tools follow the existing pattern.)

### Step 1: Confirm the design with Jen
- Tool name, category (Self / Team / Org), user flow, AI usage, download format.
- Look at existing tools as templates (per §9).

### Step 2: Write the tool file
Create `src/tools/<ToolName>.jsx`. **Copy the structure of the closest existing tool. Do not write from scratch.**

Boilerplate every new tool needs:
```jsx
import React, { useState } from 'react';
import { C, F } from '../theme.js';
import { btn, btnHoverIn, btnHoverOut, eyebrow, heading, fieldLabel, fieldInput } from '../styles.js';
import { useAppNavigate } from '../lib/useAppNavigate.js';
// Optional, only if needed:
import { synthesize, extractText } from '../lib/synthesize.js';
import { escapeHTML, downloadHTML } from '../lib/utils.js';
```

**Style discipline:** pull from `C` palette and `styles.js`. Do not redefine colors, buttons, or headings. If something feels missing, flag it as a question — do not add a token.

**AI synthesis pattern:**
```jsx
const data = await synthesize({
  model: 'claude-sonnet-4-5',
  max_tokens: 800,
  messages: [{ role: 'user', content: prompt }],
});
const text = extractText(data);
```
Wrap in try/catch with a graceful fallback message.

### Step 3: Register the route
- Edit `src/lib/routes.js` — add `'your-tool': '/tools/<self|team|org>/your-tool'`
- Edit `src/App.jsx` — add import + `<Route>`

### Step 4: Surface on HomePage
- Edit `src/pages/HomePage.jsx` — add to the right `CategoryCard` tools array.

### Step 5: Build check (optional)
If a working `/home/claude/inciteu/` exists from a previous session:
```bash
cd /home/claude/inciteu && npx vite build
```

### Step 6: Commit
Use one atomic commit per logical change. `GITHUB_COMMIT_MULTIPLE_FILES` overwrites with the contents passed — always send the complete file contents.

---

## §5 — Common pitfalls to avoid

The first four are the most important. The rest were here in the previous version and remain.

1. **Don't invent components.** Header, Footer, OrganicDivider, HeroFlourish, CategoryCard, the icons, and the page files all exist as real React source. Fetch them (§2) before rendering anything visual. If Claude doesn't have a file, Claude says so before producing output, not after the fact.

2. **Don't take "creative license."** No font-weight tweaks, no `<div>` → `<p>` substitutions, no spacing adjustments, no new hover states, no rephrased copy, no rearranged sections — unless Jen has explicitly authorized that specific change. Anything else is an unauthorized substitution, even when it "feels minor."

3. **Don't claim to see the site.** If a mockup is being produced, name the iframe limitation up front: viewport-relative units (vh, vw, clamp) render at different sizes in the artifact iframe than they do in a full browser window. The mockup is an approximation of the source code, not of the visual experience.

4. **Don't push unauthorized changes back into the repo.** Every commit lists exactly the changes Jen approved. If anything else snuck in (a stray font-weight, a renamed prop), it gets removed before commit.

5. **Don't push large content (>~15 KB single-file) through Composio.** The May 11 session lost ~5 turns trying to push BioPage.jsx (17 KB) + about-enso.jpg (9 KB) via `COMPOSIO_MULTI_EXECUTE_TOOL` and the workbench. Inline string escaping and tool-call payload limits made it unreliable. **Just give Jen the files via `present_files` and ask her to upload through the GitHub web UI.** It takes her 90 seconds. Vercel deploys the same way. See §3 fallback.

6. Don't paste base64 inline in JSX — broke an earlier session. Plain utf-8 to `GITHUB_COMMIT_MULTIPLE_FILES` for source files; binary files (images) go to `public/` as separate base64-encoded upserts in the same commit, OR via manual upload (§3 fallback).

7. Don't introduce Tailwind, CSS-in-JS libraries, or component frameworks — site is intentionally minimal stack.

8. Don't put real-time AI calls directly to `api.anthropic.com` — always go through `synthesize()` helper.

9. Don't forget the 4 places a route lives: the page file, `routes.js`, `App.jsx`, and HomePage. Missing any one → broken navigation.

10. Don't push to a branch other than `main` unless Jen explicitly asks for a PR workflow.

11. Don't change `package.json` dependencies casually. Flag to Jen first.

12. Don't add a new tool category (Self/Team/Org) without asking. The 3-card structure is part of the IA.

13. **Don't assume your earlier file fetch is still current.** `GITHUB_COMMIT_MULTIPLE_FILES` overwrites the target paths with whatever's in the payload, so if a parallel session has touched the same files since your fetch, your commit will silently revert their work (or yours will get reverted by theirs, depending on push order). Two protections: (a) re-fetch the files you're about to modify immediately before pushing, especially if hours have passed or another session is open in parallel; (b) keep commits scoped narrowly — a smaller commit has a smaller surface area for clobbering. We hit this twice in a single session: once when the `de17854a` two-paths commit clobbered the Identity Box wire-up to routes.js/App.jsx/HomePage.jsx (tool file survived in a different directory; homepage card reverted to placeholder); and once on this very file — the handover doc itself was updated by a parallel session mid-draft, requiring a re-fetch and re-anchor before the update could land. **Applies to this doc as much as any source file.**

---

## §6 — Outstanding setup (running list)

### Recently completed (May 12, 2026 session)

- [x] **Homepage IA with sub-buckets** — commit [`f7f18ab`](https://github.com/JMZywietz/InciteU/commit/f7f18ab). Each CategoryCard now renders **sub-buckets** (Live Well: Who You Are / What Drives You / What Sustains You; Face What Is: Understand Yourself / Others / Reality; Lead Well: Set Direction / Make It Happen / Sustain & Renew). CategoryCard.jsx extended with optional `toolGroups` prop, backward compatible with the older flat `tools` prop.
- [x] **Paired-flow landing pages** — commit [`002adc3`](https://github.com/JMZywietz/InciteU/commit/002adc3). *Purpose (and the Small Moves to Live It)* at `/tools/self/purpose-small-moves` is a landing introducing Five Lives + Smallest Viable Experiment as a paired practice. *Emotions as Information* at `/tools/self/emotions-as-information` is a landing introducing Five Layers Deep + Leadership Capacities Analysis as a paired practice.
- [x] **Wizard rewrite for new IA** — commit [`bbadabbc`](https://github.com/JMZywietz/InciteU/commit/bbadabbc). Two questions instead of three (Layer → Intent; no Time question). Branched routing: Inward / Outward / Forward / Just exploring. "Just exploring" fast-path skips Q2 and goes straight to Five Layers Deep. Two outcomes have "Natural next" secondaries (LCP → Emotions paired; Vision ↔ Readiness). The "stakeholders" option under Outward routes to Cynefin & Challenge Mapper with a note that a dedicated Surfacing Perspectives tool is in development.
- [x] **Two-paths landing + wizard relocation + homepage CTA** — commit [`de17854a`](https://github.com/JMZywietz/InciteU/commit/de17854a). `/tools/where-to-start` is now a two-paths landing page with two cards: *The sequence* (8 tools numbered by bucket with per-bucket accent colors and a "Begin with Three Moments →" CTA) and *The quiz* (links to wizard). Wizard moved from `/tools/where-to-start` to `/tools/quiz`. Homepage gets a "Curious where to start? →" button between OrganicDivider and the 3 category cards.
- [x] **Culture Model prep callouts** — manual upload by Jen for Vision.jsx and Readiness.jsx (files were >16KB so Composio refused; uploaded via GitHub web UI). Both tools now have "Prep: read first" callouts pointing at the external Culture Model scrollytelling (https://qq5l85.csb.app/).
- [x] **Identity Box tool added** — commits [`c29f7a6`](https://github.com/JMZywietz/InciteU/commit/c29f7a6ab1c1cbbcedc5e7e6d392b3c63ee37e71) (tool file, 39KB pushed via Composio — worked, but per §3 fallback would have been a manual-upload candidate next time) and [`85e4832`](https://github.com/JMZywietz/InciteU/commit/85e4832987a6575e6085ced6a8a7e2da27fe4447) (routes.js / App.jsx / HomePage.jsx wire-up, re-applied after the `de17854a` two-paths commit clobbered the first attempt). Reflective exercise on what you work to project (outside the box) vs. protect (inside). Six-step wizard: intro → outside labels (3 short inputs) → inside labels (3 short inputs) → visual box with peelable labels and per-peel AI whispers → six reflection prompts ("a holiday from being X" / "5% less afraid of being seen as X") → review with optional full synthesis + PDF/email download. Lives at `/tools/self/identity-box`. Flips the placeholder card under "Who You Are" (first slot in Live Well) to live.

The recommended sequence on the two-paths page reflects a deliberate decision Jen articulated: *Identity is the foundation for purpose.* Order is Inward (Three Moments → Purpose → Emotions) → Outward (LCP → Cynefin & Challenge Mapper) → Forward (Vision → Readiness → Pre-Mortem). Don't rearrange without checking.

### Recently completed (May 11, 2026 session)

- [x] **Homepage update** — commit [`63bc6033`](https://github.com/JMZywietz/InciteU/commit/63bc6033). Added "Curious where to start?" CTA between OrganicDivider and category grid. Removed `guideTo="where-to-start"` from Self CategoryCard. Re-labeled Bio → About in Header nav. HeroFlourish kept on homepage hero (Jen wanted "the spiral back").
- [x] **Footer links** — commit [`f30956a0`](https://github.com/JMZywietz/InciteU/commit/f30956a0). Contact (internal `navigate('contact')`) and LinkedIn (`https://www.linkedin.com/in/jenniferdianemay/`, external) added under the existing "© InciteU · Jennifer May" copyline.
- [x] **WhereToStartPage wizard expanded** — already live (`73531dd2...`). Welcome → Layer (self/team/org/exploring) → Intent (branches by layer) → Time → Result. Covers all 9 tools + culture-model external link. Exploring branch skips intent, defaults to Three Moments.
- [x] **About page (BioPage.jsx) redesign** — handed off as files for manual upload at end of session, uploaded successfully via GitHub web UI. About page renders at `/bio`. Structure:
  - Hero with subtle flourish background; new line: *"I coach senior leaders and teams. The invitation, every time, is the same: take an honest look at where you are, decide who you want to become next, and do the joyful, often unglamorous work of getting there."*
  - **Why I created InciteU** — two-column with enso image (`/public/about-enso.jpg`) on right; sage-bordered callout pull-quote for "This website is here so that anyone who wants to transform themselves — or others — can build the mental, emotional, and physical resilience to do so."
  - **Why the Name InciteU** — three numbered belief cards in auto-fit grid with hover-lift state.
  - Logo wall preserved (Google / Microsoft / PepsiCo / WHO — flagged: Microsoft and WHO are NOT in the new canonical client list from the bio; need swap or extension).
  - **How I work** (merged from old "How I work" + "Before all this") with subsections: opening paragraphs, Clients (chip-styled tags listing 13 companies), Before this (McKinsey paragraphs first-person), Education & training (Harvard / Vrije / Kansas State + cert chips with year tags 2024 → 2009).
  - The lowercase italic sage "u" treatment is preserved only in the header brand mark. Body references use **CAPITAL** U styled with `{ color: C.sage, fontStyle: 'italic' }` (the `inlineU` style constant).

### Still pending

- [ ] `ANTHROPIC_API_KEY` in Vercel env vars — without this, AI tools fall back to "unavailable" but site otherwise works.
- [ ] Custom domain `inciteu.com` — point GoDaddy DNS to Vercel.
- [ ] Formspree ID — replace `REPLACE_WITH_YOUR_ID` in `src/pages/ContactPage.jsx`.
- [ ] Self-host hero photo — `HERO_PHOTO` in `theme.js` still points at Wix CDN. (About page's `about-enso.jpg` is the first self-hosted image, lives at `public/about-enso.jpg`. Pattern is established; HERO_PHOTO can follow.)
- [ ] Wayback Machine archive of old Wix site, then cancel Wix.
- [ ] **Logo wall vs client chips reconciliation.** The logo wall on the About page shows 4 placeholder logos (Google, Microsoft, PepsiCo, WHO). The new client chips list 13 companies from Jen's bio. Mismatches: Microsoft and WHO are in the wall but not the bio; PayPal, Careem/Uber, Novartis, Honeywell, World Bank, Kuwait Finance House, McKinsey, PWC, Achmea, Diageo, Cleveland Clinic AD are in the bio but not the wall. Jen's call: update wall to match bio, drop the wall, or keep both as redundant.
- [ ] **Tool outcome lines on homepage** — flagged option (a) from earlier sessions, never built. Five tools still need Jen's outcome-line wording: Leadership Capacities Analysis, Purpose (Five Lives), Smallest Viable Experiment, Decision Making, Culture model.
- [ ] **Wizard URL decision** — wizard now lives at `/tools/quiz`. Jen may want to rename to something less testy (e.g. `/tools/find-your-start` or `/tools/guide`). Trivial single-commit change in routes.js + App.jsx + WhereToStartPage.jsx's quiz card if so.

Past: the Pre-Mortem tool was already merged into the repo before the May 2026 session began (`src/tools/PreMortem.jsx`). It is NOT pending migration as an older version of this doc said.

---

## §7 — How a fresh session should open

1. **Read §0.** Then §2. The URLs in §2 are pre-fetched assets — Claude should fetch the ones relevant to the task at the start.
   - **Also re-fetch this handover doc itself** from `https://raw.githubusercontent.com/JMZywietz/InciteU/main/INCITEU-HANDOVER.md` at session start. The GitHub copy is canonical; any project-attached or context-window snapshot is stale by definition — and per pitfall #13, may have moved while you're working.
2. Ask Jen what we're working on today.
3. Before producing any visual deliverable, confirm out loud: "I have these source files: [list]. I'm missing these: [list]. Should I fetch the missing ones or proceed without them?"
4. If editing an existing tool or page, fetch its source with `web_fetch` (URL in §2) before making any change.
5. If editing components used across the site (Header, Footer, etc.), fetch ALL pages that use them to verify the change doesn't break anything visible.
6. Keep commits small and atomic. One feature = one commit. Send the complete updated file contents to `GITHUB_COMMIT_MULTIPLE_FILES`.

---

## §8 — Decision Toolkit architecture

The "Face What Is" card on the homepage contains a coherent **decision-making lifecycle** built around the Cynefin framework. The tools are listed in lifecycle order:

1. **Cynefin Scrollytelling** (`/think/cynefin`) — educational scrollytelling that teaches Cynefin from zero. Ends with a CTA that navigates to the Challenge Mapper. Lives in `src/think/` because it's educational content, but it's the entry point to the decision toolkit.
2. **Challenge Mapper** (`/tools/team/challenge-mapper`) — 5-step wizard: define a challenge, break it into sub-parts, map each to a Cynefin domain, pressure test the mapping, choose domain-appropriate next steps. Outputs an "Action Plan" as a Cynefin-styled grid with downloadable HTML.
3. **Stakeholder Shoes Walk** — *not yet built*. Before acting on a big decision, walk in each stakeholder's shoes. Map how the decision lands.
4. **Pre-Mortem** (`/tools/team/pre-mortem`) — stress-test the plan before executing.
5. **Post-Mortem** — *not yet built*. After the outcome: separate decision quality from outcome quality.
6. **The Squeeze** — *not yet built*. Fast (<5 min) structured debrief for safe-to-fail experiments. Six questions: what were you testing, what did you expect, what happened, what surprised you, so what, now what.

The Cynefin scrollytelling uses an extended color palette for domain coding:
- Clear: `C.cream` (#F0EBDB)
- Complicated: `#E8C87A` (warm gold)
- Complex: `C.sage` (#C5D49B)
- Chaotic: `#D4785C` (soft coral)

Both the scrollytelling and Challenge Mapper define these as local extensions: `const C = { ...baseC, creamMuted: '...', warmAccent: '#E8C87A', alert: '#D4785C' };`

---

## §9 — Quick reference — existing tools

| Tool | File | Route | Uses AI? |
|------|------|-------|----------|
| Identity Box | `src/tools/IdentityBox.jsx` | `/tools/self/identity-box` | Yes (peel-whispers + optional synthesis) |
| Three Moments | `src/tools/ThreeMoments.jsx` | `/tools/self/three-moments` | Yes (optional synthesis) |
| Using the Leadership Circle Profile Self Assessment (LCP) | `src/tools/LCP.jsx` | `/tools/self/lcp` | Yes (synthesis) |
| Leadership Capacities Analysis | `src/tools/LeadershipCapacitiesAnalysis.jsx` | `/tools/self/leadership-capacities` | Unknown — fetch the file |
| Purpose (Five Lives) | `src/tools/FiveLives.jsx` | `/tools/self/five-lives` | Unknown — fetch the file |
| Smallest Viable Experiment | `src/tools/SmallestViableExperiment.jsx` | `/tools/self/smallest-viable-experiment` | Unknown — fetch the file |
| Purpose (and the Small Moves to Live It) | `src/tools/PurposeSmallMoves.jsx` | `/tools/self/purpose-small-moves` | No (paired-flow landing for Five Lives + SVE) |
| Emotions as Information | `src/tools/EmotionsAsInformation.jsx` | `/tools/self/emotions-as-information` | No (paired-flow landing for Five Layers Deep + LCA) |
| Decision Making (Cynefin) & Challenge Mapper | `src/tools/ChallengeMapper.jsx` | `/tools/team/challenge-mapper` | Unknown — fetch the file |
| Pre-Mortem | `src/tools/PreMortem.jsx` | `/tools/team/pre-mortem` | Unknown — fetch the file |
| Culture model | (external, not in repo) | external link to `qq5l85.csb.app` | N/A |
| Readiness assessment | `src/tools/Readiness.jsx` | `/tools/org/readiness` | No |
| Vision builder | `src/tools/Vision.jsx` | `/tools/org/vision` | Yes (optional polish) |
| Five Layers Deep | `src/think/FiveLayersDeep.jsx` | `/think/five-layers-deep` | No |
| Cynefin Scrollytelling | `src/think/CynefinScrollytelling.jsx` | `/think/cynefin` | No |

Coming-soon tools (placeholders only, not built yet):
- Self: Possibilities
- Team: Stakeholder Shoes Walk, Post-Mortem, The Squeeze
- Org: Boids · emergence

---

*End of handover. This document lives in the repo; keep it current. When components are added, renamed, or moved, update §2 in the same commit.*
