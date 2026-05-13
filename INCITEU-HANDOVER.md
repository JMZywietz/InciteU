# InciteU — Handover for Future Sessions

**Last updated:** May 13, 2026 — late evening (Culture Change Model v9 lifted into InciteU as a self-contained sub-app at `/culture-change-model`; in-context Readiness with cross-device group mode + shareable URLs is live; Creative Collision shipped earlier the same session)
**Owner:** Jen Zywietz (jennmay@gmail.com)
**Repo:** https://github.com/JMZywietz/InciteU
**Live site:** https://inciteu.vercel.app (custom domain pending → inciteu.com)

---

## TL;DR for Claude

Jen has a working React/Vite/Vercel site at `JMZywietz/InciteU`. It's a leadership development site with 9 working tools, 2 think pieces (including the Cynefin scrollytelling and Challenge Mapper added this session), and supporting pages. The homepage, About page, footer, and where-to-start wizard were all overhauled in the May 11 session.

**The most important thing in this document is §0.** Read it before doing anything else. Claude cannot see the rendered website, and pretending otherwise has burned multiple sessions. The rules in §0 exist because they were not followed and the consequences were bad.

The second most important: **for any push over ~30KB, hand the files to Jen for manual upload via the GitHub web UI rather than wrestling with the Composio API.** See §5 pitfall #5 and §3 fallback section. The API will get stuck on large strings and waste several turns.

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
├── api/
│   ├── synthesize.js              ← Vercel serverless: proxies to Anthropic API (used by tools that synthesize ONE user's input)
│   ├── cc-storage.js              ← Cross-client storage (legacy)
│   ├── sessions.js                ← Flat action-verb session backend (Culture Change Model v9 in-context Readiness; commit bf88c97)
│   └── sessions/                  ← Path-routed multi-contributor backend (Facilitate Your Way; added May 13, 2026)
│       ├── create.js              ← POST: create session, generate code + facilitator token
│       ├── [code].js              ← GET: public config for session (no auth)
│       └── [code]/
│           ├── responses.js       ← POST: submit response (public); GET: list responses (facilitator auth)
│           ├── synthesize.js      ← POST: AI synthesize one question (facilitator auth)
│           └── results.js         ← GET: public read-only results (responses + syntheses)
├── src/
│   ├── main.jsx                   ← React entry (BrowserRouter)
│   ├── App.jsx                    ← Route definitions
│   ├── theme.js                   ← Brand: palette C, fonts F, GLOBAL_CSS, HERO_PHOTO
│   ├── styles.js                  ← Reusable styles: btn(), heading(), eyebrow, fieldLabel, fieldInput, btnHoverIn/Out
│   ├── apps/                      ← Self-contained sub-apps (lazy-loaded; zero imports from sibling source files)
│   │   └── CultureChangeModel.jsx ← v9 lift; lives at /culture-change-model; ~265 KB; in-context Readiness + Vision + Games
│   ├── components/                ← Header, Footer, HeroFlourish, OrganicDivider, icons, CategoryCard
│   ├── pages/                     ← Home, Bio, Contact, Think, WhereToStart (two-paths landing), Quiz (wizard)
│   ├── tools/                     ← 9 working tools (see §9)
│   ├── think/                     ← 2 think pieces (see §9)
│   └── lib/
│       ├── routes.js              ← Symbolic name → URL path map
│       ├── useAppNavigate.js      ← Hook: navigate('lcp') instead of '/tools/self/lcp'
│       ├── synthesize.js          ← AI helper: synthesize() + extractText()
│       └── utils.js               ← escapeHTML, downloadHTML
├── package.json                   ← React 18.3.1 + react-router-dom 6.26.2 + Vite 5.4.8 + @upstash/redis 1.34.x
├── vite.config.js
├── vercel.json                    ← Rewrites paths → /index.html EXCEPT /api/* (so serverless functions work alongside SPA routing)
├── public/                        ← Vite static asset root (created May 11 for about-enso.jpg)
│   └── about-enso.jpg            ← Self-hosted; referenced as src="/about-enso.jpg" in BioPage
└── index.html
```

**Stack:** React 18 + inline styles (no Tailwind, no CSS modules) + React Router v6 + Vite + Vercel + Anthropic API via serverless proxy at `/api/synthesize`. Multi-contributor tools (Facilitate Your Way) add **Upstash Redis** (via Vercel Marketplace) for session persistence — 30-day TTL on all keys.

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

CategoryCard.jsx supports `toolGroups` (labeled sub-sections within a card) in addition to the flat `tools` array. Each tool item now supports an optional `description` field rendered in italic serif below the name. The 'Available / Coming soon' badge has been retired; coming-soon tools (where `live: false`) are dimmed in place and show `description: 'Coming soon'`. The homepage uses `toolGroups`.

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
- CreativeCollision: https://raw.githubusercontent.com/JMZywietz/InciteU/main/src/tools/CreativeCollision.jsx
- FacilitateYourWay: https://raw.githubusercontent.com/JMZywietz/InciteU/main/src/tools/FacilitateYourWay.jsx

### Multi-contributor backend (Facilitate Your Way)
- create: https://raw.githubusercontent.com/JMZywietz/InciteU/main/api/sessions/create.js
- [code] (get config): https://raw.githubusercontent.com/JMZywietz/InciteU/main/api/sessions/%5Bcode%5D.js
- [code]/responses: https://raw.githubusercontent.com/JMZywietz/InciteU/main/api/sessions/%5Bcode%5D/responses.js
- [code]/synthesize: https://raw.githubusercontent.com/JMZywietz/InciteU/main/api/sessions/%5Bcode%5D/synthesize.js
- [code]/results: https://raw.githubusercontent.com/JMZywietz/InciteU/main/api/sessions/%5Bcode%5D/results.js

### Tools (Org / At scale)
- Readiness: https://raw.githubusercontent.com/JMZywietz/InciteU/main/src/tools/Readiness.jsx
- Vision: https://raw.githubusercontent.com/JMZywietz/InciteU/main/src/tools/Vision.jsx
- Culture model is now in-repo as a sub-app (see Sub-apps below). The original external scrollytelling at https://qq5l85.csb.app/ is the v9 codebase Jen lifted into InciteU on May 13, 2026.

### Think pieces
- FiveLayersDeep: https://raw.githubusercontent.com/JMZywietz/InciteU/main/src/think/FiveLayersDeep.jsx
- CynefinScrollytelling: https://raw.githubusercontent.com/JMZywietz/InciteU/main/src/think/CynefinScrollytelling.jsx

### Sub-apps
- CultureChangeModel (v9 lift, ~265 KB — large; fetch only when needed): https://raw.githubusercontent.com/JMZywietz/InciteU/main/src/apps/CultureChangeModel.jsx

### v9 sessions backend (Culture Change Model in-context Readiness)
- /api/sessions (flat action-verb endpoint): https://raw.githubusercontent.com/JMZywietz/InciteU/main/api/sessions.js
- src/lib/sessions.js (frontend adapter, not used by the v9 file itself — v9 duplicates the fetch inline): https://raw.githubusercontent.com/JMZywietz/InciteU/main/src/lib/sessions.js

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

**Use this whenever a commit involves more than ~30 KB of new file content in a single push.** The Composio API path that worked great for small edits (front-page tweaks, footer link adds — ~2 KB) struggles when a single file gets large. Symptoms: tool call hangs, payload truncation, JSON escaping issues, repeated workbench retries that go nowhere. This burned the second half of the May 11 session before we gave up and switched to manual upload.

How to hand off:

1. Build the file(s) locally, save to `/mnt/user-data/outputs/`.
2. Call `present_files` so they appear as downloadable attachments.
3. Tell Jen the exact target path in the repo (e.g. `src/pages/BioPage.jsx` overwrites existing; `public/about-enso.jpg` is a new file, may need the `public/` folder created via GitHub's "Add file → Upload files → type path with / in the filename" trick).
4. Vercel auto-deploys on commit just the same.

This is faster, not a workaround. It's the recommended path for any new page, any new image, or any single-file commit over ~30 KB. Small file edits (string changes, single-line additions, footer link tweaks) still go through `GITHUB_COMMIT_MULTIPLE_FILES` via Composio.

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

5. **Don't push large content (>~30 KB single-file) through Composio.** The May 11 session lost ~5 turns trying to push BioPage.jsx (17 KB) + about-enso.jpg (9 KB) via `COMPOSIO_MULTI_EXECUTE_TOOL` and the workbench. Inline string escaping and tool-call payload limits made it unreliable. **Just give Jen the files via `present_files` and ask her to upload through the GitHub web UI.** It takes her 90 seconds. Vercel deploys the same way. See §3 fallback.

   *Update (May 13, 2026 evening):* A later session successfully pushed `src/tools/CreativeCollision.jsx` at 144 KB and a follow-up at 148 KB via plain `GITHUB_CREATE_OR_UPDATE_FILE_CONTENTS` (auto-base64 encoding handled by Composio). Pattern: workbench fetches canonical → applies surgical Python `str.replace` patches → pushes back, in one cell. The 30 KB heuristic appears to have been about *inline base64 binary blobs* in the workbench (where the May 11 session was passing the JPEG byte string directly into a Python variable), not text content via the normal write tool. For text source files of any sane size, Composio works fine. Binary files (images) still go through manual upload.

6. Don't paste base64 inline in JSX — broke an earlier session. Plain utf-8 to `GITHUB_COMMIT_MULTIPLE_FILES` for source files; binary files (images) go to `public/` as separate base64-encoded upserts in the same commit, OR via manual upload (§3 fallback).

7. Don't introduce Tailwind, CSS-in-JS libraries, or component frameworks — site is intentionally minimal stack.

8. Don't put real-time AI calls directly to `api.anthropic.com` — always go through `synthesize()` helper.

9. Don't forget the 4 places a route lives: the page file, `routes.js`, `App.jsx`, and HomePage. Missing any one → broken navigation.

10. Don't push to a branch other than `main` unless Jen explicitly asks for a PR workflow.

11. Don't change `package.json` dependencies casually. Flag to Jen first.

12. Don't add a new tool category (Self/Team/Org) without asking. The 3-card structure is part of the IA.

13. **Don't assume your earlier file fetch is still current.** `GITHUB_COMMIT_MULTIPLE_FILES` overwrites the target paths with whatever's in the payload, so if a parallel session has touched the same files since your fetch, your commit will silently revert their work (or yours will get reverted by theirs, depending on push order). Two protections: (a) re-fetch the files you're about to modify immediately before pushing, especially if hours have passed or another session is open in parallel; (b) keep commits scoped narrowly — a smaller commit has a smaller surface area for clobbering. We hit this twice in a single session: once when the `de17854a` two-paths commit clobbered the Identity Box wire-up to routes.js/App.jsx/HomePage.jsx (tool file survived in a different directory; homepage card reverted to placeholder); and once on this very file — the handover doc itself was updated by a parallel session mid-draft, requiring a re-fetch and re-anchor before the update could land. **Applies to this doc as much as any source file.**

14. **Upstash Redis env var name gotcha.** Vercel's Marketplace integration ("Upstash for Redis") provisions credentials under the legacy `KV_REST_API_URL` and `KV_REST_API_TOKEN` names (kept for backward compat with Vercel's original KV product, which was sunset in December 2024). The `Redis.fromEnv()` constructor in `@upstash/redis` looks for `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` and will silently fail (returns an unconfigured client) if you rely on it. Construct the client explicitly instead: `new Redis({ url: process.env.KV_REST_API_URL, token: process.env.KV_REST_API_TOKEN })`. See `api/cc-storage.js` and `api/sessions/*.js` — both follow this pattern. Note: the integration also provisions `KV_REST_API_READ_ONLY_TOKEN`, `KV_URL`, and `REDIS_URL` — those are for other client patterns (read-only client, TCP-style connection strings) and aren't needed for the REST-based `@upstash/redis` SDK we're using.

---

## §6 — Outstanding setup (running list)

### Recently completed (May 13, 2026 session — late night) — Wizard + WhereToStartPage + Homepage two-level accordion refresh

Four atomic commits over the course of a single session. Built around mocking each non-trivial change before touching the repo, getting Jen's explicit sign-off on copy and structure, then pushing. Zero rollbacks across all four.

**Commit 1: Wizard + WhereToStart wiring for three previously-orphaned tools** — [`8d54048`](https://github.com/JMZywietz/InciteU/commit/8d54048a794b4d794f4e6ea0754c049e97a022fc) (`QuizPage.jsx`, `WhereToStartPage.jsx`).

- [x] **Identity Box** wired into Inward Q2 as the 4th option (`inward.identity` → `identity-box`). Wording: *"What am I working to project — and what am I working to protect?"* In the WhereToStart sequence Jen put it at position #2 (after Three Moments), with the framing: TM = "what shaped me", IB = "who I want to be seen as", Purpose = "who I want to be next", Emotions = "the many parts of me". The OUTCOMES entry has `secondary: 'purpose-small-moves'` so the wizard surfaces the identity → purpose pairing in the result card.
- [x] **Creative Collision** wired into Outward Q2 as `'collision'` → `creative-collision`. Wording: *"On my idea — I want to stress-test it with opposing perspectives."* Sequence position #7. Mode "Solo or with a team."
- [x] **Open Facilitation** wired into Outward Q2 as `'group'` → `facilitate-your-way`. Wording: *"On a group — I want to gather many voices and make sense of them together."* Sequence position #8. Mode "With a group" — first wizard outcome that is group-only.
- [x] **Outward Q2 restructured 3 options → 4** (`self / challenge / collision / group`) to mirror the homepage sub-buckets exactly: Understand Yourself (LCP) / Understand Reality (Cynefin) / Understand Others (CC, OF). Cynefin's option text rewritten — was *"I've got a challenge that I'm stuck on and need new perspectives"*, now *"On the situation — what kind of challenge am I actually facing?"* Per Jen: Cynefin = *type* of challenge; "perspectives" is CC and OF territory. The old `outward.others` → `challenge-mapper-stakeholders` route and its stale stub note (*"A dedicated stakeholder-perspectives tool is in the works"*) deleted.
- [x] **Sequence renumbered 1 → 11** to absorb the three new tools (Inward 1-4, Outward 5-8, Forward 9-11). Forward labels updated to homepage display names: *Vision* → *Culture Change Vision*, *Readiness* → *Culture Readiness Assessment*. Pre-Mortem label unchanged. "Begin with Three Moments →" CTA unchanged (TM still #1).

**Commit 2: WhereToStart sequence-card visual upgrade** — [`d60ab72`](https://github.com/JMZywietz/InciteU/commit/d60ab72e54141753eebd44a2fd033ea2f18b90b4) (`WhereToStartPage.jsx`).

- [x] **Each tool got a description** in Jen's exact wording (e.g., Three Moments → "What made us who we are today"). Format mirrors homepage CategoryCard pattern: name 15px cream, description 13px italic serif at `rgba(240,235,219,0.62)`, 12px vertical padding, `C.line` divider between items. Identity Box description: *"How we see ourselves, and what could be possible if we used that effort for something else"* — derived from the wizard description Jen approved.
- [x] **Intro paragraph rewritten** from *"Inward first — identity is the foundation for purpose. Then outward to see what is in front of you. Then forward to move it."* to *"Inward first. Who we are - our identity and our purpose - is the foundation of everything we do. Then outward, to see what is in front of you. Then forward to move into what's next."*
- [x] **Purpose label shortened** from *"Purpose (and the Small Moves to Live It)"* to *"Purpose"* in the sequence list; route still resolves to the paired-flow landing at `/tools/self/purpose-small-moves`.
- [x] **The Squeeze added at #12 as coming-soon** — dimmed name (`rgba(240,235,219,0.38)`), dimmed italic description (`rgba(240,235,219,0.3)`), no link/hover, same pattern as homepage placeholders. Sequential 1-12 numbering kept (no second-class unnumbered treatment).

**Commit 3: Homepage major refresh — hero/divider/CTA/accordion** — [`33bd773`](https://github.com/JMZywietz/InciteU/commit/33bd773856fa61a348e654d741c6c8d0a647bfcc) (`HomePage.jsx`, `CategoryCard.jsx`).

- [x] **Hero pruned**: tagline paragraph removed from inside hero. Hero is now title + Rohr cite only. Rohr cite's `marginBottom` set to 0 (was 56, no longer needed since the tagline that followed it has moved).
- [x] **New tagline below `<OrganicDivider />`**: three-line paragraph (lines split by `<br />`). Final v3 copy used sage accents on lines 1 and 3 (later edited in commit 4).
- [x] **Bolder "Curious where to start? →" CTA**: replaced `btn('primary')` with inline custom styles — solid sage fill, deep-teal text, 22×48 padding, 15px / 500 weight letter-spaced, sage glow halo on hover. Inverts to transparent+sage-text on hover for visual interest.
- [x] **Three parallel card taglines** (all replacing terser old versions):
  - Live Well: *"Do the inner work needed to become the best version of yourself possible"*
  - Face What Is: *"Recognize what's actually in front of you, not what you wish was"*
  - Lead Well: *"Set a direction, inspire others to join you, and keep experimenting and learning"*
- [x] **Two-level accordion** added to `CategoryCard.jsx`:
  - Cards collapsed by default. Click anywhere on the card header (initial version) or only the bottom-trigger row (final version, see commit 4) to toggle.
  - Each sub-bucket also collapsed by default. Click sub-bucket header to expand. Sub-bucket state preserved across card collapse/expand (independent state).
  - Chevrons rotate 90° on expand (▸ → ▾).
  - `minHeight: 380` removed from the card since collapsed cards are much shorter; was creating awkward dead space.
- [x] **Sub-bucket descriptions** added to the toolGroups data structure: one-line italic serif under each sub-bucket label (e.g., *Who You Are* → *"Where you came from, the image you maintain, and what shaped you"*). All nine sub-buckets across the three cards have descriptions. Initially 13px (matched homepage tool descriptions); bumped to 15px in commit 4 for hierarchy.
- [x] **Tool counts shown per card and per sub-bucket**: e.g., card-level *"5 tools · 1 coming soon"*; sub-bucket-level *"2 tools"*. Format kept neutral and tracked in a small helper `countString(total, coming)`.
- [x] **Tool reordering to match sequence arc**:
  - Live Well > Who You Are: swapped to `[Three Moments, Identity Box]` (arc positions 1, 2).
  - Lead Well > Make It Happen: swapped to `[Culture Readiness Assessment, The Squeeze]` (arc 10, 12).
  - Pre-Mortem stays in Set Direction with Vision (arc 9, 11) — sub-bucket conceptual grouping won over strict arc-order top-to-bottom flow. Confirmed with Jen during mock review.

**Commit 4: Homepage polish — text/color/footer/chevron-placement** — [`4d80323`](https://github.com/JMZywietz/InciteU/commit/4d803237876e3ac5c89f12fbf7c662fec91172a3) (`HomePage.jsx`, `CategoryCard.jsx`).

- [x] **Tagline line 3 rewritten + de-greened**: was *"If they help you, repay us by spreading them along to anywhere they will do good."* in sage; now *"If these tools help you, please share them with others who will use them for good."* in plain cream-muted, matching lines 1–2. Sage accent on line 1 (*"anyone who wants to transform themselves or others"*) kept.
- [x] **Card-level chevron relocated** — the top-right chevron from commit 3 was getting lost behind the corner icon decorations (Jen's call). Removed from the header entirely. Replaced with a full-width row at the bottom of every card: *"CLICK TO SEE MORE DETAIL ▸"* in the card's accent color, 12px sans uppercase letter-spaced. Chevron rotates to ▾ on expand; text flips to *"CLICK TO SEE LESS DETAIL"*. Bordered above with `C.line`. Hover gives a small gap-expand interaction. **Card header is now display-only — only this bottom row is the toggle.** Whole-card cursor stays `default`. Tool/sub-bucket clicks now use `stopPropagation()` to avoid bubbling.
- [x] **Sub-bucket description size bumped 13 → 15px**, opacity nudged 0.6 → 0.72 — gives a cleaner hierarchy between sub-bucket descriptions and the 13px tool descriptions inside them.
- [x] **Sub-bucket count line rewritten** — was *"2 TOOLS"* (10px uppercase tracked); now *"2 tools · click to see more"* / *"2 tools · click to see less"* (12px, lowercase, normal letter-spacing, regular weight; the "click to see more" half in italic to read as the inline call-to-action).
- [x] **Footer reflowed**: was centered stacked `<p>` + button; now flex-row with `justifyContent: 'space-between'`. Paragraph left-aligned and growing (`flex: '1 1 600px'`, `maxWidth: 900`), "Get in touch" button anchored on the right with `flexShrink: 0`. `flexWrap: 'wrap'` so the button drops below on narrow viewports — no horizontal scroll.

**Pre-push validation across all four commits:** every JSX file was passed through `npx esbuild --loader:.jsx=jsx --bundle=false --format=esm` before commit. Zero JSX errors landed on `main`. §5 pitfall #5 followed every time.

**Architecture file `routes.js` and `App.jsx` unchanged** — all four new tools wired in this session (Identity Box, Creative Collision, Open Facilitation, The Squeeze) already had route registrations from prior sessions. The Squeeze remains `live: false` with no actual page yet.

**Outstanding from this session:**

- [ ] **Standalone tool page titles still don't match homepage labels** — `Vision.jsx`, `Readiness.jsx`, `FiveLives.jsx`, `SmallestViableExperiment.jsx`. Was already flagged in the May 13 late-afternoon entry; this session's WhereToStartPage labels widen the gap. Trivial single-line edits per file once Jen confirms wording. Now also affects the wizard `OUTCOMES` titles in `QuizPage.jsx`.
- [ ] **Vercel deploy verification of accordion behavior** — eyes-on test of the homepage accordion (card-level + sub-bucket level) once Vercel rebuild lands. Test specifically: card click target only on bottom row; sub-bucket clicks don't bubble up to collapse the parent card; tool clicks don't collapse anything; sub-bucket state preserved across card re-collapse.
- [ ] **CategoryCard's `guideTo` prop is unused** — preserved in the component for backward compat but no current caller uses it. Safe to delete in a future cleanup or keep as a hook for future "guide me" patterns.
- [ ] **Possibly: bolder CTA spacing review on Vercel** — the new solid-sage button might look out of step with the brand's other outline-only buttons elsewhere. If it does, reverting to `btn('primary')` with different ambient framing (e.g., contained in a soft-bordered box) is one alternative.
- [ ] **§1 Architecture paragraph about `CategoryCard.jsx` is now slightly incomplete** — doesn't yet mention the two-level accordion behavior, the sub-bucket `description` field, or the bottom-row toggle pattern. Trivial single-paragraph rewrite; not done this session because Jen's "update the handover" instruction was specifically about logging this session's work in §6.
- [ ] **The Squeeze placeholder page** — listed in sequence #12 (coming-soon) and homepage Make-It-Happen sub-bucket (coming-soon). No actual file or route. Status unchanged from prior sessions.

**Key patterns / lessons from this session:**

1. **Multi-round elicitation before any code touches the repo** — Jen and Claude did 3-4 rounds of "show me the diff and ask the right questions, get sign-off, then push" before each commit. Result: four atomic commits, zero rollbacks. Pattern worth keeping for any non-trivial UI/copy refresh.
2. **HTML file mocks for "mock it up" requests** — the in-chat `visualize:show_widget` tool timed out (4-minute wait) early in this session. Pivoted to creating the mockup as `/mnt/user-data/outputs/inciteu-homepage-mockup.html` and delivering via `present_files`. Jen got a clickable mock in a real browser tab with the full InciteU palette and fonts; arguably better fidelity than the inline widget would have given. Pattern: if `visualize:read_me` hangs, don't retry — pivot to file-based HTML.
3. **CSS `max-height` transitions for accordion content** — `maxHeight: expanded ? 3000 : 0` with `overflow: hidden` and a transition gives clean expand/collapse without measuring content. Limitation: the magic ceiling must safely exceed any conceivable expanded content. Fine for homepage cards (largest expanded card ~1200px).
4. **`stopPropagation()` on inner click handlers** when ancestor elements have click handlers. CategoryCard had a brief subtle bug in commit 3 where clicking a tool would navigate AND trigger card collapse on the way out; commit 4 hardened it.
5. **Composio `GITHUB_COMMIT_MULTIPLE_FILES` argument shape** (recording here so the next session doesn't have to discover it again): requires `message` (not `commit_message`) and `upserts` (not `files`). Each item in `upserts` is `{path, content, encoding: 'utf-8'}`. The §3 "tool that works" note is correct but missed the field renames.

---

### Recently completed (May 13, 2026 session — late evening) — Culture Change Model v9 lift SHIPPED

The planning section immediately below records the decisions and the orphaned-backend question as they stood when this session opened. This section is the completion record.

- [x] **Sub-app live at `/culture-change-model`** — two commits: small wiring files at [`a597e9d`](https://github.com/JMZywietz/InciteU/commit/a597e9dd40183c73ca80b5cc8f155f846565178b) (Composio) and the 271 KB v9 file at [`b6bf85b`](https://github.com/JMZywietz/InciteU/commit/b6bf85b3408a4fc571f3a907be453315e66da35b) (manual upload via GitHub web UI, per the §3 fallback). Vercel build went red between the two commits and green again once the v9 file landed — expected, called out in the small-files commit message.
- [x] **Six surgical edits to v9 inside the file** — top-of-file LIFTING INSTRUCTIONS block + two backend-URL constants (`API_SYNTHESIZE_URL`, `API_SESSIONS_URL`); readinessStorage adapter swapped from localStorage to `/api/sessions`; aiCall swapped from direct anthropic.com to `/api/synthesize`; VisionTool's second inline fetch collapsed into `aiCall`; solo mode-chooser card got the sage tint + sage border to differentiate it from join/run; live participant URL panel added on facil-share with Copy-link button; share-results panel + new read-only `public-synthesis` view added on facil-synthesis; URL-param handler on the top-level Model component reads `?section=`, `?tool=`, `?join=CODE`, `?view=CODE` once on mount and threads through ToolsPage → ReadinessTool via props.
- [x] **Orphaned `api/sessions.js` is no longer orphaned** — the planning section below worried about whether to repurpose the flat `/api/sessions` endpoint or migrate v9 Readiness to the FYW path-based pattern and remove it. The lift went with **path (a) — reuse the flat endpoint**, not (b). Reason: the v9 file's existing `readinessStorage` adapter has five action-named methods (createSession / getSession / contribute / saveSynthesis / deleteSession) that map 1:1 to the flat `{action:'create'|'contribute'|'synthesis'|'delete'}` POST shape; refactoring the v9 adapter to FYW's path-routed shape would have meant ~50 call-site edits with no functional benefit. Both backends now coexist on Vercel: `api/sessions.js` (flat, v9) and `api/sessions/*` (path-routed, FYW).
- [x] **Sub-app architecture pattern introduced** — `src/apps/CultureChangeModel.jsx` is the first file under `src/apps/`. The pattern: self-contained sub-app, lazy-loaded via `React.lazy()`, internal navigation by state (not by react-router), own theme/styles/helpers, two backend URLs as top-of-file constants so the file can be lifted into a different host with two string changes. Use this pattern only when a tool is large enough (>50 KB) and self-coherent enough to justify the duplication; for modular tools the §4 playbook still applies.
- [x] **One Readiness, two front doors live** — canonical Readiness now lives inside the sub-app. `/tools/org/readiness` is a splash redirect to `/culture-change-model?section=tools&tool=readiness`. SEO is preserved. Solo / join-a-group / run-a-group all work cross-device via Upstash KV. Group mode now includes a copy-link participant URL on facil-share (drops them into Join with the code pre-filled) and a read-only share-results URL on facil-synthesis (no facil controls, no re-run, no delete).
- [x] **New Think-page card** — third entry on `/think` linking to `/culture-change-model`. Copy and color choices are Claude's draft, not Jen's — the card uses v9's own teal/gold palette so visually it previews the destination. Easy to recolor; the card is one entry in `THINK_PIECES` in `src/pages/ThinkPage.jsx`.
- [x] **Boids simulation is shipping as v9's Games tab** — note for future Claudes who see "Boids · emergence" in the §9 coming-soon list: it's inside v9 already. Leave the coming-soon list alone unless Jen says otherwise; the standalone Boids tool might still be planned as a separate thing.

**Key gotchas worth remembering:**

1. **`bash curl` cannot reach `raw.githubusercontent.com`** — the InciteU allowlist covers `github.com` but the `/raw/...` redirect resolves to a different host that's not on the list. Use `GITHUB_GET_REPOSITORY_CONTENT` via Composio instead. This blocker burned an entire previous session and was fixed in this one. Add this to the §3 connection-method preferences if it isn't there already.
2. **Composio's hard ceiling on `GITHUB_COMMIT_MULTIPLE_FILES`** — combined payload of ~16 KB across four files worked fine in one call. The 271 KB v9 file definitively did not fit (driving the commit from inside the workbench helps for code-to-execute parameter limits, but the underlying tool argument still has a per-call cap somewhere well under 100 KB). The §3 manual-upload fallback continues to be the right answer for anything >30 KB.
3. **Vercel builds fail loudly but live deploy stays up** — when the small-files commit landed without the v9 file, the build failed (App.jsx imported a non-existent module). The previous good deploy stayed live, so end-users saw no regression during the ~17-minute window between commits. Useful pattern: it's safe to land scaffolding ahead of a large manual upload as long as you'll do the upload promptly.
4. **The v9 file shouldn't be re-uploaded via Composio for routine edits** — future small-touch edits should be done via the GitHub web editor or a manual upload. The whole 271 KB has to round-trip on every commit; not worth wrestling with Composio for changes that fit in a textarea.
5. **The character-count from a Python r-string in the workbench differed slightly from local file sizes** — final commit verified by SHA + size + critical-substring checks on the deployed blob, not by character count. Trust the post-commit verification, not the staging-side counts.

### Recently completed (May 13, 2026 session — evening) — Culture Change Model v9 lift planning + Readiness backend

This session set up backend plumbing for a multi-mode Readiness tool, then pivoted to host that tool inside the lifted Culture Change Model v9 codebase rather than as a standalone re-implementation. No frontend was shipped beyond backend wiring. A dedicated handover for the v9 lift task lives separately as `V9-LIFT-HANDOVER.md` (in Jen's outputs, not committed) — drop that into the next chat to resume.

- [x] **`api/sessions.js` + `src/lib/sessions.js` shipped** — commit [`bf88c97`](https://github.com/JMZywietz/InciteU/commit/bf88c97a54976dc890f2531fdb37c866eb8295c5). Added a flat `/api/sessions` endpoint (action-verb POST: create/get/contribute/saveSynthesis/delete) plus a lightweight client helper at `src/lib/sessions.js` reading the same Upstash Redis instance Facilitate Your Way uses. **⚠ Status: currently orphaned in the live deploy** — nothing on the live site calls them. They were built for the standalone Readiness rewrite (also dropped, see below). Two paths when v9 lift starts: (a) repurpose for v9 Readiness group mode, OR (b) more likely, have v9 Readiness use the existing FYW endpoint pattern (`/api/sessions/[code]/responses` etc.) and **remove** the orphaned files. Jen's preference per this session: the v9 Readiness "should function nearly exactly the same as the Open Facilitation tool does now" — strongly implies (b).
- [x] **Decision: skip the 76 KB standalone Readiness rewrite upload** (path B chosen). The file is at `/mnt/user-data/outputs/Readiness.jsx` for reference only. The live standalone Readiness at `/tools/org/readiness` stays the ~16 KB solo-only version until v9 ships. Once v9 is live, this path becomes a splash page linking into v9.
- [x] **Architectural plan locked for v9 lift** — Culture Change Model v9 (Daniel = Jen's married pseudonym, no attribution issue) will be lifted as `src/apps/CultureChangeModel.jsx`:
  - Single self-contained file, lazy-loaded via React.lazy
  - Internal navigation by state (cover / model / tools / readiness / vision tabs)
  - Zero imports from `../theme.js`, `../styles.js`, `../lib/*` — own internal everything
  - Top-of-file "LIFTING INSTRUCTIONS" block with `API_SYNTHESIZE_URL` + `API_SESSIONS_URL` constants for easy white-label port
  - AI proxy via internal duplication of `synthesize.js` (~20 lines) rather than import — keeps file truly liftable
  - v9 visual identity preserved as-is (dark teal / gold palette, **not** matched to InciteU's design system)
  - New `PATHS.cultureChangeModel = '/culture-change-model'` (canonical marketing entry). One placeholder card on `/think`. Not on home page.
  - Sub-tool deep links via `?section=tools&tool=readiness` skip the Tools page and land directly inside the sub-tool
  - One Readiness, two front doors: in-v9 Readiness is canonical; standalone `/tools/org/readiness` becomes a splash redirecting in. Same eventual pattern for Vision (already in v9).
- [x] **Vercel Marketplace / Upstash for Redis verified live** — Jen confirmed the integration is in place from the May 13 FYW work; env vars `KV_REST_API_URL` and `KV_REST_API_TOKEN` already injected. Group-mode backend is reachable as soon as v9 Readiness is wired.

**Pattern note for future repo reads:** `web_fetch` is restricted to URLs in `userMemories`, and `bash curl` is blocked from `raw.githubusercontent.com` and the `github.com/.../raw/...` redirect pattern (both return "Host not in allowlist"). **`GITHUB_GET_REPOSITORY_CONTENT` via Composio works** — it returns base64 content + path metadata. Use it as the canonical "read a file from the repo" tool when web_fetch refuses.

### Recently completed (May 13, 2026 session — late afternoon) — Homepage IA refresh

- [x] **Tool descriptions replace badges on homepage** — commits [`cffdf81`](https://github.com/JMZywietz/InciteU/commit/cffdf81375fb704d571f0a8ffdecb53bae0ef1cc) (CategoryCard) and [`a483f9a`](https://github.com/JMZywietz/InciteU/commit/a483f9aa612af7c5ddf2f395bec9ac1b6f13929e) (HomePage). Replaced the "Available / Coming soon" right-side badge with a short italic-serif description under each tool name. Coming-soon tools now dimmed in place with description text "Coming soon". CategoryCard's `tools` items now support an optional `description` field; renders below `name` in `F.serif` italic at 13px, color `rgba(240,235,219,0.62)` for live tools (`rgba(240,235,219,0.3)` for coming-soon). All 11 live tools now have descriptions. Three are placeholders pending Jen's revision: Identity Box, LCP Self Assessment, Pre-Mortem.
- [x] **Tool renames on homepage display** — same commit. Note these are DISPLAY-ONLY renames; the symbolic route names in `routes.js` and URL paths are unchanged.
  - 'Purpose (and the Small Moves to Live It)' → 'Purpose and Small Moves'
  - 'Vision' → 'Culture Change Vision'  *(URL still `/tools/org/vision`)*
  - 'Readiness' → 'Culture Readiness Assessment'  *(URL still `/tools/org/readiness`)*
  Worth noting: the tool *page titles* (inside Vision.jsx, Readiness.jsx, FiveLives.jsx, SmallestViableExperiment.jsx) were NOT updated. Jen may want those updated to match the new homepage labels in a follow-up.
- [x] **Open Facilitation added to homepage** — commit [`0b8a1dc`](https://github.com/JMZywietz/InciteU/commit/0b8a1dcb4018e4c34029733b8a75084776645ff0). Placed under Face What Is → Understand Others. The route was already registered (`facilitate-your-way` → `/OpenFacilitation`); this commit just wired it into the homepage card list.

### Recently completed (May 13, 2026 session — earlier) — Facilitate Your Way

- [x] **Facilitate Your Way tool — multi-contributor sessions** — final commit chain ending [`b4c77a3`](https://github.com/JMZywietz/InciteU/commit/b4c77a327ba73b665563fa94dfdc693270e4d1d7). First tool with **backend persistence** — different shape from every other tool on the site. Lives at `/openfacilitation` (route name from routes.js). User flow:
  1. Facilitator clicks "Facilitate a session" → fills title, name, context, 1-5 questions → creates session → gets 6-char code + share link
  2. Contributors visit the share link (`?code=XXX&v=c`) → fill in name (optional) + responses → submit
  3. Facilitator returns to dashboard (reload retains access via stored token in localStorage) → "Refresh responses" → sees individual submissions
  4. Facilitator clicks "Synthesize All Questions with AI" → backend calls Anthropic with each question's responses → returns `{patterns, outliers, absences}` structured JSON → dashboard renders
  5. Facilitator clicks "Download as Word doc" → generates HTML/.doc with all syntheses + responses
  6. Facilitator clicks "Copy share-results link" → produces `?code=XXX&v=results` URL → anyone with link sees the public results view (responses + syntheses, no auth)
- [x] **Upstash Redis added** — installed via Vercel Marketplace, auto-injects `KV_REST_API_URL` and `KV_REST_API_TOKEN` env vars. Required for Facilitate Your Way only; doesn't affect other tools.
- [x] **`@upstash/redis` dependency added** — commit [`eb7c232`](https://github.com/JMZywietz/InciteU/commit/eb7c2328f3df833f3510f655655f53ef3fae8c46). Without this in package.json Vercel won't detect the serverless functions in `api/sessions/`.
- [x] **vercel.json rewrites fixed** — commit [`f8b3ada`](https://github.com/JMZywietz/InciteU/commit/f8b3ada9d2cfbf86bf705d6278dd7a4ed091290f). Old rule `source: "/(.*)"` was catching `/api/*` and sending it to index.html — broke ALL serverless functions silently. Fixed to `source: "/((?!api).*)"` (negative lookahead excludes /api).
- [x] **AI model name standardised** — endpoint at `api/sessions/[code]/synthesize.js` now uses `model: 'claude-sonnet-4-5'` (the working model name used by FiveLives, Vision, etc), not the dated `claude-sonnet-4-20250514` which 404s.

**Key learnings from this session — read before touching FYW or building another multi-contributor tool:**

1. **The /api/sessions/create endpoint returns ONLY `{code, facilitatorToken}`** — NOT the full config. The frontend must rebuild the full config locally from the title/questions/etc it already has. Doing `setConfig(data)` made config missing `.questions`, the dashboard crashed silently rendering `config.questions.map`, React unmounted, the boot useEffect re-ran with the URL code → routed user to contributor view. Symptom Jen saw: "I clicked Facilitate, it went white, then dumped me in contributor mode." This took an hour to diagnose because I kept chasing the wrong cause.

2. **Backend / frontend data shape mismatches were the second biggest time sink.** The synthesize endpoint returns `{synthesis: {patterns, outliers, absences}}` with each item as `{title, detail}`. The frontend was storing the wrapper (not the inner synthesis), using `absent` not `absences`, and rendering the objects as `<p>{p}</p>` (which renders nothing because React skips objects). Result: AI Synthesis box appeared but was completely empty. Three independent shape bugs in one box.

3. **1Password / password manager interference is almost always a red herring.** I spent an hour adding `autoComplete="off"`, `data-1p-ignore`, `data-lpignore`, `data-bwignore`, `data-form-type="other"`, `type="search"`, etc. to fight a "page flashes on every keystroke" symptom Jen described. NONE of it helped. The actual problem was something else entirely (and we never definitively diagnosed it — Jen confirmed it's fine now without those attributes). **If FiveLives uses plain `<input className="fl-input" style={...} value={...} onChange={...} placeholder="..." />` with zero password-manager attributes and works, copy that pattern.** Don't add ignore attributes preemptively.

4. **A regex that adds attributes to JSX `<input>` tags WILL break onChange handlers** if it's not balanced-brace aware. The pattern `<input[^>]*?/>` matches the `>` inside `onChange={(e) => ...}` thinking it's the tag close. Symptom: build fails with "Expected '}' but found 'data'" pointing at the onChange line. Use a brace-balanced parser, not regex.

5. **ALWAYS validate JSX before committing** — `npx esbuild test.jsx --bundle=false --format=esm` will catch all the issues above in <2 seconds. Each broken commit cost ~3 minutes of Vercel deploy + diagnosis. We had at least 3 failed Vercel builds before I added local validation.

6. **The share link routing tension** — facilitators clicking their own share link want different behavior than facilitators reloading the page. Solution: share link includes explicit `&v=c` flag for contributor mode. Boot useEffect: `if v=c → contribute view`; `else if stored token → dashboard`; `else → contribute view`. Reload without `v=c` → back to dashboard.

7. **Composio file uploads with brackets in filenames work** (e.g. `api/sessions/[code].js`, `api/sessions/[code]/synthesize.js`). I worried at one point they might not — they did. The verification was that the file appeared in GitHub at the right path after `GITHUB_COMMIT_MULTIPLE_FILES`.

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

- [ ] **v9 lift work in progress** — Culture Change Model v9 → `src/apps/CultureChangeModel.jsx`. Full plan in `V9-LIFT-HANDOVER.md` (in Jen's outputs from May 13 evening session). Two adapter swaps, four feature additions, structural wiring (lazy route, Think page card, splash for old Readiness path). v9 source staged at `/mnt/user-data/outputs/Culture_Change_Model_v9.jsx` (253 KB).
- [ ] **Decide fate of orphaned `api/sessions.js` + `src/lib/sessions.js`** (commit bf88c97) — most likely path: remove and use existing FYW endpoint pattern for v9 Readiness group mode.
- [ ] **Splash the standalone `/tools/org/readiness` route** once v9 is live — one-screen landing with single button to `/culture-change-model?section=tools&tool=readiness`.
- [ ] **Eventually: same treatment for `/tools/org/vision`** — v9 already has a Vision tool; once v9 ships, the standalone Vision becomes a splash too.
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
| Creative Collision (multi-contributor sessions) | `src/tools/CreativeCollision.jsx` | `/tools/team/creative-collision` | Yes (multi-stage synthesis: recommendation clusters, divergence map, bridging insights, cruxes, Six Hats missing-mode diagnostic) |
| Facilitate Your Way (multi-contributor sessions) | `src/tools/FacilitateYourWay.jsx` | `/openfacilitation` | Yes (per-question synthesis via backend) |
| Culture Change Model (sub-app — includes in-context Readiness + Vision + Boids/Games) | `src/apps/CultureChangeModel.jsx` | `/culture-change-model` | Yes (in-context Readiness group synthesis via `/api/sessions`; in-context Vision polish via `/api/synthesize`) |
| Readiness assessment (splash → in-context) | `src/tools/Readiness.jsx` | `/tools/org/readiness` | No — redirects to `/culture-change-model?section=tools&tool=readiness` |
| Vision builder | `src/tools/Vision.jsx` | `/tools/org/vision` | Yes (optional polish) |
| Five Layers Deep | `src/think/FiveLayersDeep.jsx` | `/think/five-layers-deep` | No |
| Cynefin Scrollytelling | `src/think/CynefinScrollytelling.jsx` | `/think/cynefin` | No |

Coming-soon tools (placeholders only, not built yet):
- Self: Possibilities, State Check
- Team: Stakeholder Shoes Walk, Post-Mortem, The Squeeze
- Org: Boids · emergence

### Full tool roadmap (Jen's vision, May 13, 2026)

Status legend: 🟢 Built and live · 🟡 Designed, not built · 🔴 Idea, no design yet

**Live Well (the inner work)**
- Who You Are: Identity Box 🟢 (anchor) · Three Moments 🟢 · Reactive Patterns 🟡 · Parts at the Table 🟡 · Feedback Mirror 🟡
- What Drives You: Purpose and Small Moves 🟢 (anchor) · Emotions as Information 🟢 · When Emotions Conflict (IFS) 🟡 · Values in Trade-offs 🟡
- What Sustains You: State Check 🟡 (uses ATL/BTL video) · Energy & Recovery 🔴 · Audio companions 🟡

**Face What Is (read reality)**
- Understand Yourself: LCP Debrief 🟢 (anchor) · Body Yes / Body No 🔴 · Story You're Telling Yourself 🟡
- Understand Others: Surfacing Perspectives 🔴 (anchor, not built) · Creative Collision 🟢 · Open Facilitation 🟢 · Stakeholder Shoes Walk 🔴 · Power Map 🔴
- Understand Reality: Cynefin & Challenge Mapper 🟢 (anchor) · Surf or Sink (Polarities) 🟡

**Lead Well (move forward)**
- Set Direction: Culture Change Vision 🟢 (org/culture level, anchor) · Pre-Mortem 🟢 (project level) · Why Change 🟡
- Make It Happen: Culture Readiness Assessment 🟢 (anchor) · The Squeeze 🟡 · Disagree to Deepen 🟡 · Strategic Subtraction 🔴 · Hard Conversations 🟡 · Repair After Rupture 🔴
- Sustain & Renew: Post-Mortem 🟡

Notes for future Claudes:
- Every tool fits the existing 3-bucket / 9-sub-bucket IA. There is no "Tools Library" — adding one was considered and rejected (would create IA debt). Place new tools where users would naturally look for them.
- Open Facilitation is conceptually a flavor of "Surfacing Perspectives" — async, AI-aided. When Surfacing Perspectives gets built, may want to think about how the two relate (anchor vs Wave 2, etc.). Not urgent.
- The handover doc's older "coming-soon tools" list (immediately above this roadmap) is the SHORTER list of just the *placeholders shown on the homepage*. The roadmap above is Jen's fuller vision.

---

## §10 — Multi-contributor session architecture (Facilitate Your Way)

Different shape from every other tool. Other tools are pure-frontend single-user experiences with optional AI synthesis via `/api/synthesize`. **Facilitate Your Way persists state server-side so multiple people can collaborate asynchronously.**

### Redis key schema

All keys 30-day TTL. Namespace: `fyw:` (facilitate your way).

```
fyw:{CODE}:config                       JSON: {code, title, contextBlurb, questions, facilitatorName, tokenHash, createdAt}
fyw:{CODE}:response:{contributorName}   JSON: {name, answers: {q1: '...', q2: '...'}, submittedAt}
fyw:{CODE}:synthesis:{questionId}       JSON: {questionId, questionText, responseCount, patterns, outliers, absences, synthesizedAt}
```

The contributor name as key means **one submission per named contributor** — re-submitting overwrites. Empty/anonymous submissions get bucketed under name `"Anonymous"`.

### Auth model

- **Facilitator token**: 24-byte hex random, returned ONCE on session creation, hashed with SHA-256 and stored in config. Token itself is stored client-side in `localStorage` keyed `fyw:{CODE}:token`. If user clears browser data, that token is lost forever and the facilitator cannot regain access (no recovery flow). Listed as a known limitation; can be revisited.
- **Contributor access**: just the 6-char code. No auth.
- **Public results view**: `?v=results` URL parameter unlocks read-only access to responses + syntheses via dedicated `/api/sessions/[code]/results` endpoint (no token check).

### URL parameters drive view selection

| URL | View |
|-----|------|
| `/openfacilitation` | Mode chooser (Facilitate vs Join) |
| `/openfacilitation?code=XXX` | If facilitator token in localStorage → dashboard; else → contributor form |
| `/openfacilitation?code=XXX&v=c` | Force contributor form (share links use this) |
| `/openfacilitation?code=XXX&v=results` | Public read-only results view |

### Endpoint summary

| Method | Path | Auth | Returns |
|--------|------|------|---------|
| POST | `/api/sessions/create` | none | `{code, facilitatorToken}` ← does NOT echo full config |
| GET | `/api/sessions/[code]` | none | Public config (tokenHash stripped) |
| POST | `/api/sessions/[code]/responses` | none | Submit response |
| GET | `/api/sessions/[code]/responses` | Bearer facilitator token | All responses + all syntheses |
| POST | `/api/sessions/[code]/synthesize` | Bearer facilitator token | `{synthesis: {patterns, outliers, absences, ...}}` |
| GET | `/api/sessions/[code]/synthesize` | Bearer facilitator token | `{syntheses: {questionId: {...}}}` |
| GET | `/api/sessions/[code]/results` | none | All responses + all syntheses, public |

### Required Vercel setup for this tool

1. Upstash Redis installed via Vercel Marketplace (auto-injects `KV_REST_API_URL` and `KV_REST_API_TOKEN`)
2. `ANTHROPIC_API_KEY` env var set
3. `@upstash/redis` in package.json (already added)

### Known limitations / future work

- No facilitator token recovery if browser data is cleared
- No way to delete a session before TTL expires
- No rate limiting on response submission
- No "session active / closed" toggle — anyone with the code can submit until 30 days TTL
- Results view doesn't auto-refresh — viewer must reload
- 1-5 questions max (UX choice, not technical)
- Question count fixed at session creation — can't add/remove after

---

*End of handover. This document lives in the repo; keep it current. When components are added, renamed, or moved, update §2 in the same commit.*
