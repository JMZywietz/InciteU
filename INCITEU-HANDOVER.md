# InciteU — Handover for Future Sessions

**Last updated:** May 29, 2026 — ToolFeedback component added (commit `4da2739`). Earlier same day: Report UI + email live + autosave + self-survey + Word doc + §12. Earlier (May 28): Many Mirrors shipped (commit `80024ee`); its 8 API endpoints consolidated into the `[action]` router to fit Vercel's 12-function Hobby cap (repo now at 12/12); primary push path is now the GitHub REST API via token, with Composio as fallback. Earlier (May 23, late evening): Person.image added to JSON-LD + Formspree wired on contact form (commit `650fc8e`). Earlier same day: SEO scan audit, handover updated with web_fetch vs Composio API read-path lesson (commit `0e5ab3a`). Earlier-earlier same day: canonical, theme-color, og dimensions, robots.txt Disallow /api/, sitemap.xml casing fix (commit `48f0e89`).
**Owner:** Jen Zywietz (jennmay@gmail.com)
**Repo:** https://github.com/JMZywietz/InciteU
**Live site:** https://inciteu.vercel.app (custom domain pending → inciteu.com)

---


## 2026-05-29 — ToolFeedback component (commit `4da2739`)

**New file:** `src/components/ToolFeedback.jsx` — reusable end-of-tool micro-survey component.

**Wired into:** `src/tools/ManyMirrors.jsx` at two points:
- **Subject** — end of `report` step, inside `!isPublicView` guard (subjects only, not shared-results viewers). Prompts: "Did this tool help?" → thumbs → "What made it useful?" / "What could have made it more useful?"
- **Evaluator** — end of `eval-done` step. Different prompts: "Was this easy to use?" → thumbs → "What worked well?" / "What could have made it easier?"

**Formspree endpoint:** `mzdwwygz` (separate form from the contact form `xqejlbrk`). Fields sent: `tool` (hidden, e.g. "Many Mirrors"), `role` ("subject" or "evaluator"), `vote` ("up" or "down"), `comment` (optional text, omitted if blank).

**Component API** (`src/components/ToolFeedback.jsx`):
```jsx
<ToolFeedback
  formspreeId="mzdwwygz"   // required — renders null if missing or contains 'REPLACE'
  toolName="Many Mirrors"  // hidden field for Formspree segmentation
  role="subject"           // 'subject' | 'evaluator' | any string
  initialQuestion="Did this tool help?"
  positivePrompt="What made it useful?"
  negativePrompt="What could have made it more useful?"
/>
```
All props except `formspreeId` and `toolName` have sensible defaults. Drop the component anywhere — it self-contains its state, handles submission and errors, and shows "Thank you for the feedback." on success. A "Skip" link dismisses without submitting.

**Rolling out to other tools:** add the import + one JSX line at the natural completion point of each tool. The component works on both the site's standard `C.bgDeep` palette and ManyMirrors' sapphire override — the textarea uses `rgba(240,235,219,0.04)` background so it's transparent-friendly on any dark surface.

---

## 2026-05-29 — Report UI polish + email live + autosave + self-survey + Word doc

**Email (Resend) fully live.**
- Domain `inciteu.com` verified in Resend. DNS is at **GoDaddy** (nameservers `ns25/26.domaincontrol.com`) — add Resend DNS records there, not in Vercel.
- `RESEND_API_KEY` → Vercel → Environment Variables → Production. Without it the build still works; only email sending is skipped.
- Critical fix: invite emails were fire-and-forget (`sendInviteEmail(...)` not awaited). Vercel froze the function before the Resend fetch completed → `write ETIMEDOUT`. Fixed: `await Promise.allSettled(emailJobs)` in `create.js`; individual `try { await sendInviteEmail(...) } catch` in `[action].js`. **Always await async I/O before returning from a Vercel serverless function.**
- Dashboard link email: subject receives their dashboard URL on session create (if email provided). `sendDashboardLinkEmail` in `_lib.js`, called in `create.js`.

**Share link: tokenless evaluator support.**
`?code=X&v=e` (no `&t=`) now accepts submissions. The `responses` handler creates a self-identified evaluator from the typed name. Names are self-reported by design. Frontend guard: no token + blank name → "Please add your name." Autosave prevents data loss on stale-bundle reloads.

**Self-survey.**
- Second-person phrasing: `RECOMMENDED_QUESTIONS_SELF` map in `ManyMirrors.jsx` (no q5).
- Q5 dropped from self-survey — you cannot meaningfully identify your own blind spots. Only applies to the recommended set (detected via `isRecommendedQuestionSet()`).

**Autosave for both survey flows.**
`localStorage` keyed `mm_draft_{code}_{role}_{token|'shared'}`. Saved on every answer change; restored on re-entry; cleared on successful submit.

**Report UI — full visual design pattern in §12.**
Overview warm-gold collapsible box. Q-chip nav. Quotes first. Parallel colour-coded P/O/A boxes. Alignments/Gaps side-by-side boxes. `MirrorsArtwork` in report header (meta inside flex column to prevent gap). Font floor: ≥13px everywhere.

**Word doc: HTML-as-.doc, client-side, zero new serverless functions.**
`downloadReportAsWord()` builds an HTML string + triggers `.doc` download via `Blob`. No new npm dep; Word/Google Docs open it fine.

**GitHub PAT needs rotation** — used in plaintext throughout this session. Regenerate at GitHub → Settings → Developer settings → Personal access tokens.

---

## 2026-05-28 — Many Mirrors shipped + GitHub REST API push path + `[action]` router pattern

**Shipped:** Many Mirrors — a free 360-feedback tool ("A 360 for yourself"), sibling to LCP under Face What Is. Route `/tools/self/many-mirrors`. Main file `src/tools/ManyMirrors.jsx` (~2,340 lines). Backend under `api/sessions/mm/`. New dependency `resend` (email). Needs Vercel env var `RESEND_API_KEY` for invite emails (build and page work without it; only the email step is skipped).

**The big lesson — Vercel's 12-function Hobby cap.** On Vite (not Next.js) every file under `api/` is its own Serverless Function — there is no bundling. The Hobby plan allows no more than 12 functions per deployment. Files whose name starts with `_` (e.g. `_lib.js`, `_synth.js`) are libraries and do NOT count. Many Mirrors was first built as 8 separate endpoints; with the 9 functions already in the repo that totalled 17 and every deploy failed ("No more than 12 Serverless Functions…").

**The fix — the `[action]` router pattern (now the standard for collaborative tools).** The six per-session sub-endpoints (evaluators, responses, self, report, synthesize, delete) were consolidated into ONE dynamic function `api/sessions/mm/[code]/[action].js` that dispatches on `req.query.action` + method. URLs are unchanged, so `ManyMirrors.jsx` needed no edits. The synthesis/LLM logic moved to `api/sessions/mm/_synth.js` (underscore = free). Many Mirrors now costs 3 functions instead of 8 (commit `80024ee`).

**Current function budget: 12 / 12 — at the cap, zero headroom.** Any further collaborative tool will fail the build until either an existing tool is consolidated the same way (FacilitateYourWay's 5 endpoints are the next candidate → ~2-3) or the project moves to Vercel Pro (removes the ceiling; also the compliant plan for commercial/public use). Build every new collaborative tool with the `[action]` router from the start — never one-file-per-endpoint. See §5 and §11.

**New push path — see §3.** Established a direct GitHub REST API push path (Git Data API from `bash_tool`; `api.github.com` is allowlisted) using Jen's PAT, because the Composio web connector is currently broken (a claude.ai bug: after OAuth, the `Authorization: Bearer` header is not attached to MCP requests → "No Authorization: Bearer header on request"; not fixable from inside the chat). The REST API path is now primary; Composio is the fallback for when it works again.

---

## 2026-05-23 — SEO scan + first-pass fixes (commit `48f0e89`)

A Claude session ran the six standard SEO scans on inciteu.com (schema, SEO, canonical, breadcrumb, meta, robots) at Jen's request and shipped the safe, additive-only fixes from that audit. No changes to React components, theme.js, styles.js, or any user-facing copy.

**Shipped in commit [`48f0e89`](https://github.com/JMZywietz/InciteU/commit/48f0e89d06bff65e0f311783dcba75939eab76c5):**

- **`index.html`** — added 7 tags inline, preserving the existing 4-space indentation and all original content verbatim:
  - `<meta name="robots" content="index, follow" />` (explicit indexability)
  - `<meta name="theme-color" content="#1F3937" />` (colorizes mobile browser chrome with `bgDeep`)
  - `<link rel="canonical" href="https://inciteu.com/" />` (homepage self-referencing canonical; per-route canonicals will need react-helmet-async wiring, not done in this commit)
  - `<meta property="og:image:width" content="1200" />`, `og:image:height` 630, `og:image:alt`, `og:locale` en_US
- **`public/robots.txt`** — added `Disallow: /api/` so crawlers stop wasting budget on the serverless endpoints (`/api/sessions/*`, `/api/synthesize`)
- **`public/sitemap.xml`** — fixed `/openfacilitation` → `/OpenFacilitation` so the sitemap entry actually matches the case-sensitive route in `routes.js`. The lowercase version would have hit the catch-all redirect to `/`.

The audit findings beyond what was shipped: per-route titles/descriptions are still served from `index.html` defaults on the initial HTML response (every URL returns the same `<title>` — confirmed with `web_fetch` on `/` and `/bio`). `react-helmet-async` is installed but only affects the JS-rendered DOM, so social previews (LinkedIn, Slack, iMessage) and most raw-HTML SEO crawlers see the homepage tags everywhere. **Three meaningful follow-ups deferred** for a future session that can touch every page component: (1) per-route `<Helmet>` blocks with route-specific title, description, canonical, og:url; (2) `BreadcrumbList` JSON-LD per tool/think page; (3) `Article` schema on the `/think` pieces. Optional fourth: prerender at build time via a Vite plugin so the per-route meta is in the initial HTML response, not just the rendered DOM — that's the biggest single SEO improvement available but requires a build-system change worth scoping separately.

**Audit report delivered** to Jen as `inciteu-seo-scan-2026-05-23.docx` (not in repo; lives in her Claude outputs). External-tool follow-ups recommended in the doc: Google Search Console (step zero — confirms what's actually indexed), PageSpeed Insights, Google Rich Results Test, LinkedIn Post Inspector. The schema validator and Rich Results Test should both pass on the existing Person + Organization `@graph` — it's well-formed.

**Confirmed during the session:**
- `public/og-image.jpg` exists (55KB, blob `d13107c`). The OG image is real, social previews will render.
- The current `App.jsx` on `main` (commit `a597e9d`) has all 24 routes wired including Identity Box, Creative Collision, Facilitate Your Way, Quiz, Purpose Small Moves, Emotions as Information, Culture Change Model. The handover doc is correct on what's live.
- The sitemap already existed pre-session (committed at some earlier point) with 23 URLs — same count as `routes.js` (one URL per PATH). This session's only sitemap change was the casing fix.

**Key gotcha for future Claudes** (worth a §5 entry if pitfall #15 ever gets added): **`web_fetch` against raw.githubusercontent.com returns a CDN-cached older version of files than what's actually on `main`.** This session initially fetched `App.jsx` via `web_fetch` and got a stale version missing all the routes added since May 12 — which would have caused the sitemap to omit half the active tools. The fix: use `GITHUB_GET_REPOSITORY_CONTENT` via Composio (per the §3 fallback note), which goes through the API and returns the current SHA. The web_fetch path is fine for reading the handover doc itself or other content where mild staleness is OK, but not for source files you're about to edit. The diff between the two was significant — about a dozen missing imports and routes.

**Outstanding setup updated:**
- [ ] Per-route meta via react-helmet-async (the package is already installed)
- [ ] `BreadcrumbList` JSON-LD per tool/think page
- [ ] `Article` schema on `/think` pieces
- [ ] (Optional, heavier) Build-time prerender so initial HTML response carries per-route meta — biggest social-preview / SEO crawler payoff
- [ ] Verify post-deploy: `https://inciteu.com/robots.txt` shows `Disallow: /api/`; `/sitemap.xml` shows the corrected `/OpenFacilitation` casing; homepage view-source shows the new canonical + theme-color + og:image dimensions
- [ ] Submit `https://inciteu.com/sitemap.xml` to Google Search Console (assuming GSC is set up; verification meta is already in `index.html` from before this session)

---

## 2026-05-20 — pg-intro restructured to 2 drives × 5 capacities model

**⚠️ Coordination note (2026-05-20 evening):** Commit `e7bbebd` ("LCA v4: Thriving->Pursuing rename + Likert drive intensity + 2x2 grid results") inadvertently reverted the entire pg-intro restructure described in this section — it worked from a snapshot taken before the intro was rebuilt. A follow-up commit on 2026-05-20 restored the full pg-intro region and the four new CSS color tokens (`--P`, `--Pr`, `--E`, `--Ve`) on top of the v4 LSA_SCRIPT work. **Future LSA_SCRIPT pushes must preserve the pg-intro region (between the `<!-- INTRO -->` and `<!-- ASSESSMENT -->` markers) and the four new color tokens in `.lsa-root`.**

The Leadership Capacities Analysis intro page (`pg-intro` in `src/tools/LeadershipCapacitiesAnalysis.jsx`) was restructured from the flat 5-archetype model to the current 2 drives × 5 capacities architecture.

**Copy changes:**
- Title: "Five Core Capacities" → "Assess your Motivation and Capacity"
- Subtitle (new): "Two motivating drivers, Five abilities to navigate complexity"
- Three body paragraphs rewritten to introduce the evolutionary frame: amoeba-to-human drives + human-specific developmental capacities
- Two new section blocks: "— The Two Drives —" (Pursuing + Protecting) and "— The Five Capacities —" (Egoist + Veteran + Lover + Strategist + Visionary)
- Each section now has its own introductory paragraph (drives: predisposition vs momentary activation; capacities: complexity ordering with universal access)
- New "— Begin the assessment —" section header before the existing button block
- Typo fixes: "Chose" → "Choose"; "scenarions" → "scenarios"; "log in" → "login"

**Visual changes:**
- 4 new CSS color tokens added to `.lsa-root`: `--P` (Pursuing, gold), `--Pr` (Protecting, red), `--E` (Egoist, terracotta), `--Ve` (Veteran, slate)
- 4 new SVG icons: Pursuing (arrow in flight with motion lines — swapped from rising sun in same-day icon iteration), Protecting (battlement wall fortress with central gate — swapped from watchful eye in same-day icon iteration), Egoist (heartbeat / EKG pulse line — swapped from flame in same-day revision), Veteran (4 upward chevron service stripes, stroke-opacity gradient)
- Hedonist/Warrior boxes removed from intro (they are now sub-archetypes under Pursuing/Protecting in the deeper model — not top-level peers)
- Lover/Strategist/Visionary SVG icons retained; their copy tightened to single-verb box-names matching the body paragraph's "sense / remember / connect / imagine / find meaning" framing

**Modal-handler coordination caveat:**
- Drive boxes call `openArchModal('thriving')` / `openArchModal('protecting')` — modal data lives in the rebuilt `DRIVE_DETAIL` but the existing `openArchModal` legacy routing keys off `CAPACITY_DETAILS`, which doesn't have these keys. Result: tap is silent (graceful no-op via existing guards). Wiring those modals to the new data is a future pass.
- Egoist/Veteran boxes call `openArchModal('egoist')` / `openArchModal('veteran')` — same situation; data exists in new `CAPACITY_DETAIL` but legacy routing doesn't see it. Silent no-op until wired.
- Lover/Strategist/Visionary modals keep their existing keys and continue to work as before.

**Net file delta:** ~+3,600 chars in `src/tools/LeadershipCapacitiesAnalysis.jsx`. LSA_SCRIPT region untouched.

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
│   ├── about-enso.jpg            ← Self-hosted; referenced as src="/about-enso.jpg" in BioPage
│   ├── jen-may.jpg               ← Jen's headshot (86 KB); rendered in bio hero as 260px circle
│   └── og-image.jpg              ← Open Graph image for social sharing (added May 15 SEO session)
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
- ManyMirrors ("A 360 for yourself" — free 360-feedback; sibling to LCP): https://raw.githubusercontent.com/JMZywietz/InciteU/main/src/tools/ManyMirrors.jsx
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

### Multi-contributor backend (Many Mirrors) — `[action]` router pattern
- _lib.js (shared helpers; `_`-prefixed = NOT a counted function): https://raw.githubusercontent.com/JMZywietz/InciteU/main/api/sessions/mm/_lib.js
- _synth.js (synthesis/LLM pipeline; `_`-prefixed = NOT counted): https://raw.githubusercontent.com/JMZywietz/InciteU/main/api/sessions/mm/_synth.js
- create: https://raw.githubusercontent.com/JMZywietz/InciteU/main/api/sessions/mm/create.js
- [code] (public config for evaluator landing): https://raw.githubusercontent.com/JMZywietz/InciteU/main/api/sessions/mm/%5Bcode%5D.js
- [code]/[action] (ROUTER — evaluators | responses | self | synthesize | report | delete, dispatched on req.query.action + method): https://raw.githubusercontent.com/JMZywietz/InciteU/main/api/sessions/mm/%5Bcode%5D/%5Baction%5D.js

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

### Primary push path (current): GitHub REST API from `bash_tool`

As of 2026-05-28 the primary way to read and write the repo is the GitHub REST API directly from `bash_tool` — `api.github.com` is in the allowed network domains, so it works with no Composio and no local-filesystem access.

- Auth: Jen supplies her GitHub Personal Access Token in-session. ⚠️ NEVER commit the token to the repo (this file lives in a PUBLIC repo) and never store it in memory. Pass it only in the `Authorization` header.
- Atomic multi-file commit (preferred — one commit, one clean Vercel deploy, no partial states):
  1. `GET /repos/JMZywietz/InciteU/git/ref/heads/main` → base commit sha
  2. `GET …/git/commits/{sha}` → base tree sha
  3. `POST …/git/trees` with `base_tree` + entries: adds/updates as `{path, mode:"100644", type:"blob", content}`; deletions as `{path, mode:"100644", type:"blob", sha:null}`
  4. `POST …/git/commits` `{message, tree, parents:[base sha]}`
  5. `PATCH …/git/refs/heads/main` `{sha: new commit sha}`
- Single-file change (simpler): Contents API `PUT`/`DELETE /repos/.../contents/{path}` (needs the existing `sha` to update/delete), but it commits one file at a time → one deploy per file. Prefer the Git Data API for multi-file changes.
- Verify after push via the API (authenticated, no CDN lag), not `raw.githubusercontent.com` (caches ~5 min).
- Vercel auto-deploys on every push to `main`.

### Fallback path: Composio (use when it is working again)

⚠️ As of 2026-05-28 the Composio web connector is broken for claude.ai chat: after OAuth completes, claude.ai fails to attach the `Authorization: Bearer` header to MCP requests, so every Composio call 401s ("No Authorization: Bearer header on request"). This is an Anthropic-side bug (GitHub↔Composio itself is healthy) and cannot be fixed from inside the chat. When it works again, the Composio path below is fine for small edits.

Composio MCP is connected on Jen's account.
- **Account:** `github_tum-horse` (login: JMZywietz)
- **Default branch:** `main`
- **The tool that works:** `GITHUB_COMMIT_MULTIPLE_FILES` with `encoding: "utf-8"`. Do not use base64 — it bloats payloads and broke a previous session.

Verify connection at session start:
```
COMPOSIO_SEARCH_TOOLS query: {"use_case": "create or update file in GitHub repo on a branch", "known_fields": "owner:JMZywietz, repo:InciteU"}
```

If it shows `has_active_connection: true` → proceed. If not → user reconnects via Composio.

### Reading files from the repo — use Composio, NOT `web_fetch`

**Canonical read path:** `GITHUB_GET_REPOSITORY_CONTENT` via Composio (or the COMPOSIO_MULTI_EXECUTE_TOOL form). Returns base64-encoded current `main` content with no cache lag. This is the source of truth.

**`web_fetch` on `raw.githubusercontent.com` is NOT reliable for repo files.** It serves through a CDN that can lag by minutes to hours behind `main`, and the lag is not advertised in the response. Two cases burned in real sessions:

1. *May 15 session* (already documented in §6 pitfall #4): a freshly-pushed commit was invisible via raw URL for ~5 min while the API saw it instantly. Workaround there was to pin to a commit SHA on the API.
2. *May 23 (evening) session*: Claude opened the session by fetching `App.jsx` via `web_fetch` and got a version that was **~10 days stale**, missing the IdentityBox / CreativeCollision / FacilitateYourWay / Quiz / paired-flow / Culture Change Model imports. The handover doc described all of these as live; Claude assumed the handover was ahead of the code and was about to draft a sitemap that omitted ~half the live routes. Only switching to the Composio API path surfaced the truth: the code was current; `web_fetch` was lying.

**Rule:** at session start and any time before a push, fetch the file via Composio. If you must use `web_fetch` (e.g. to follow a URL from the §2 list as a quick orientation), treat the result as approximate and re-verify via Composio before relying on it for any edit decision.

For diffing what's about to be pushed against what's actually live, this is non-negotiable — see pitfall #13.

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
Use one atomic commit per logical change. Primary path: the GitHub REST API (Git Data API) from `bash_tool` — see §3. Send complete file contents (the tree `content` field replaces the whole file). Composio's `GITHUB_COMMIT_MULTIPLE_FILES` is the fallback for when the connector works again; it also overwrites with the contents passed, so always send the complete file.

Before committing a new collaborative (multi-endpoint) tool, check the function budget: the repo is at 12/12 on Vercel Hobby. Build new backends with the `[action]` router pattern (see §5 and §11), not one-file-per-endpoint.

---

## §5 — Common pitfalls to avoid

**⚠️ Vercel Hobby caps Serverless Functions at 12 per deployment.** On Vite, every file under `api/` is one function (no bundling); `_`-prefixed files do not count. The repo is currently at 12/12. A one-file-per-endpoint collaborative backend WILL fail the build ("No more than 12 Serverless Functions…"). Build multi-endpoint tools with the `[action]` router pattern (one dynamic `[code]/[action].js` dispatching on `req.query.action` + method; heavy logic in `_`-prefixed helpers) — see §11 and the 2026-05-28 entry. To grow further: consolidate FacilitateYourWay's endpoints the same way, or move to Vercel Pro.


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

   *Sub-lesson (May 23 evening):* Pre-push re-fetches save you not just from parallel-session clobbers but also from your own stale tool reads. The May 23 evening session opened with a `web_fetch` of `index.html`, `App.jsx`, and `routes.js` that turned out to be a CDN-cached snapshot from before the May 15 SEO commits. Drafted files based on that snapshot would have overwritten the live `index.html` (which already had canonical, theme-color, og dimensions added in commit `48f0e89`) with whitespace-only changes — and would have downgraded the live sitemap.xml from 23 URLs to 16. Only the pre-push verification (Composio fetch immediately before push) caught it. **Always re-fetch via Composio API immediately before push, regardless of how recently you fetched.** See also the new "Reading files from the repo" subsection in §3.

14. **Upstash Redis env var name gotcha.** Vercel's Marketplace integration ("Upstash for Redis") provisions credentials under the legacy `KV_REST_API_URL` and `KV_REST_API_TOKEN` names (kept for backward compat with Vercel's original KV product, which was sunset in December 2024). The `Redis.fromEnv()` constructor in `@upstash/redis` looks for `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` and will silently fail (returns an unconfigured client) if you rely on it. Construct the client explicitly instead: `new Redis({ url: process.env.KV_REST_API_URL, token: process.env.KV_REST_API_TOKEN })`. See `api/cc-storage.js` and `api/sessions/*.js` — both follow this pattern. Note: the integration also provisions `KV_REST_API_READ_ONLY_TOKEN`, `KV_URL`, and `REDIS_URL` — those are for other client patterns (read-only client, TCP-style connection strings) and aren't needed for the REST-based `@upstash/redis` SDK we're using.

---

## §6 — Outstanding setup (running list)

### Recently completed (May 23, 2026 session — late evening) — Person.image + Formspree shipped

Two small commits closing out concrete items from the post-audit outstanding list. Standard pre-push re-fetch discipline followed; both target files unchanged between fetch and push.

- [x] **Person.image added to JSON-LD** — commit [`650fc8e`](https://github.com/JMZywietz/InciteU/commit/650fc8e61e0231085ad61eb0c60d30fa49d22e77) (`index.html`). One-line insertion of `"image": "https://inciteu.com/jen-may.jpg"` between `"email"` and `"sameAs"` in the schema.org Person block. The headshot at `/public/jen-may.jpg` (86 KB, shipped May 15) is now machine-discoverable for Google Knowledge Panel + entity disambiguation. No visible change to users.
- [x] **Formspree wired on contact form** — same commit (`src/pages/ContactPage.jsx`). Placeholder `REPLACE_WITH_YOUR_ID` replaced with Jen's real Formspree endpoint ID (`xqejlbrk`). Free tier: 50 submissions/month, delivered to `jen@inciteu.com`. The mailto fallback path is preserved in code but no longer triggers (placeholder check now passes). First-submission confirmation email from Formspree is expected on the first real send — that's a one-time Formspree workflow step, not a bug.
- [x] **Item verifications during this session — no code changes needed:**
  * **`/public/favicon.svg` exists** (448 bytes, sage-on-deep-teal "iU" mark). The "favicon referenced but missing" flag in the prior two handover entries was wrong — the file is there and the browser tab favicon renders correctly. Both pending bullets cleared below.
  * **ANTHROPIC_API_KEY in Vercel** confirmed working (AI synthesis tools all functional).
  * **inciteu.com custom domain** confirmed working (apex resolves).
  * **Tool browser-tab titles already match Jen's preferred approach** ("keep descriptive subtitle" + "keep individual names for Five Lives / SVE"). The May 15 SEO work shipped them this way already — the §6 "tool page titles don't match homepage labels" item from older entries is closed.

**Outstanding from this session:**

- [ ] **Confirm first Formspree submission** — Jen should submit the form on `inciteu.com/contact` once Vercel finishes deploying (~60 sec). Formspree will email `jen@inciteu.com` asking her to confirm the form is hers; she clicks the link, and every submission after that lands cleanly. Standard Formspree onboarding step.
- [ ] **Google Search Console sitemap submission** — still outstanding from May 15. Sitemap is at `https://inciteu.com/sitemap.xml`. Manual GSC step Jen does.

**Key patterns / lessons from this session:**

1. **Some "outstanding items" in the handover are stale, not real.** Today the favicon was listed as missing in two separate places (the May 15 SEO entry and the May 23-evening entry I added earlier today). A 5-second Composio fetch of `public/` showed it's been there the whole time. **When closing outstanding items, verify each one against the live repo rather than trusting handover history.** Same lesson as pitfall #13 / §3 read-path subsection, just applied to a different failure mode.
2. **Composio MCP for one-string-edit commits is genuinely fast.** Two surgical replacements + push + verify took under 60 seconds. The §3 fallback (hand to Jen for manual upload) is only needed for >30 KB binary or large new files — for tiny text edits like these, Composio is the right tool.
3. **The contact form's mailto fallback is good defensive code.** Even before today's Formspree wire-up, the form did the right thing (opened the user's mail client with the message pre-filled). Worth keeping the pattern for any future external integrations — fail-soft to a working path the user can act on.

### Recently completed (May 23, 2026 session — evening) — SEO scan audit + handover update (no code shipped)

Session worked through the six-scan SEO audit (Schema / SEO / Canonical / Breadcrumb / Meta / Robots) and produced a printable DOCX report. **No code commits this session.** Drafted three fix files — `index.html`, `public/robots.txt`, `public/sitemap.xml` — but pre-push verification via Composio revealed that an earlier session that same day (commit `48f0e89`) plus the May 15 SEO foundation work had already shipped everything the audit recommended. Pushing the drafts would have been a no-op at best and a clobber at worst.

- [x] **SEO scan DOCX produced** — `/mnt/user-data/outputs/inciteu-seo-scan-2026-05-23.docx`, ~21 KB, six-section audit with pass/warn/fail tables and prioritized fix list. Suitable for handing to a developer or keeping as a record. Generated from repo audit (Composio reads of `index.html`, `vercel.json`, `package.json`, `App.jsx`, `routes.js`) plus live `web_fetch` of `inciteu.com` and `inciteu.com/bio` (which confirmed the per-route head problem before the May 15 Helmet work was discovered). Not committed to the repo — `present_files`-only deliverable.
- [x] **Verified live state of SEO infrastructure** — all the audit's recommended fixes are already on `main`:
  * `index.html` has canonical, theme-color, robots meta, og:image dimensions + alt + locale, full @graph JSON-LD with Person + Organization (the latter was already there from May 15).
  * `public/robots.txt` exists with `Disallow: /api/` and Sitemap pointer.
  * `public/sitemap.xml` exists with all 23 live routes (matches `routes.js` exactly).
  * `public/og-image.jpg` exists (55 KB, was a flagged concern in the audit before this was confirmed).
  * `react-helmet-async` is installed AND `<SEO>` component wired into all 23 page components per the May 15 work — so the per-route titles/descriptions/canonicals concern raised in the audit is also already addressed.
- [x] **Handover doc updated** — new §3 subsection on canonical read path; new pitfall #13 sub-lesson on `web_fetch` staleness; this §6 entry.

**Outstanding from this session:**

- [ ] **The audit DOCX is worth a 5-minute read for Jen** even though nothing needs to change — sections on what each scan looks for, plus the recommended external scans (PageSpeed Insights, Rich Results Test, Schema Validator, LinkedIn Post Inspector). External validation is the natural next step.
- [x] **Person `image` field in JSON-LD** — shipped same day in commit `650fc8e`. See next §6 entry above.
- [x] **`favicon.svg` referenced but missing** — verified false in commit `650fc8e` session. The file does exist at `/public/favicon.svg` (448 bytes); previous handover entries were wrong about this. No fix needed.

**Key patterns / lessons from this session:**

1. **`web_fetch` of `raw.githubusercontent.com` can serve content that is days or weeks stale.** Claude opened this session by fetching `App.jsx` and got a snapshot missing 10+ days of commits. The handover doc was ahead, the code was actually ahead too, but Claude's tool was stuck in the past. The fix is to make `GITHUB_GET_REPOSITORY_CONTENT` via Composio the canonical read path (now documented in §3) and re-fetch immediately before any push (added as a sub-lesson under pitfall #13).
2. **The pre-push re-fetch discipline pays off even when no parallel session is open.** Today's near-miss wasn't a clobber-race — it was Claude's own stale read. The same re-fetch step caught both. Worth doing for every commit, every time, regardless of perceived risk.
3. **An audit that produces no shippable changes is still valuable** when it confirms what is and isn't in place. The DOCX is the audit record; "all green except per-route" was a real finding before May 15 and "all green" is a real finding now. Jen now has documentation of the SEO state suitable for sharing with anyone who asks.
4. **Read pitfall #13 before doing anything that pushes — even an "obvious" small commit.** A second-guess re-fetch saved this session from a no-op-but-noisy commit (best case) or a downgrade of the live sitemap (worst case).

### Recently completed (May 15, 2026 session) — SEO foundation shipped (Helmet + 23 per-page tags + sitemap)

Full SEO scaffolding added in six atomic commits over a single session, following the paired companion doc `INCITEU-SEO-HANDOVER.md`. Discipline mirrored prior sessions: explicit step-by-step approval from Jen before every commit, fresh fetch of every file immediately before editing, `npx esbuild --loader:.jsx=jsx --bundle=false --format=esm` validation on every JSX change before push, zero rollbacks.

- [x] **Step 1 — `react-helmet-async` dep** — [`f048d5b`](https://github.com/JMZywietz/InciteU/commit/f048d5b31b9cd322c02d2012bba558401a203dc3) (`package.json`). One-line alphabetical insertion between `react-dom` and `react-router-dom`.
- [x] **Step 2 — `<HelmetProvider>` wrap** — [`c1a9592`](https://github.com/JMZywietz/InciteU/commit/c1a959274797b27b2cc3477a425f7a72dfdcbd17) (`src/main.jsx`). Final nesting: `StrictMode > HelmetProvider > BrowserRouter > App`.
- [x] **Step 3 — `index.html` site-wide defaults** — [`7451e5b`](https://github.com/JMZywietz/InciteU/commit/7451e5b41b7fcbdeb00610b3d5248cc5ea5ffdf8). New title, longer SEO-shaped description, `<meta author>`, full Open Graph block, full Twitter card block, and schema.org JSON-LD `@graph` with cross-referenced Person + Organization entities. Two intentional deviations from the SEO handover's draft: (a) Organization `"logo"` line dropped (no `logo.png` in `/public`); (b) Person `"image"` not added on Claude's own initiative — flagged as future enhancement once Jen decides. `<meta charset>`, viewport, favicon link, root div, main.jsx script tag all preserved byte-for-byte.
- [x] **Step 4 — Reusable `<SEO>` component** — [`d2e3877`](https://github.com/JMZywietz/InciteU/commit/d2e3877e2e3f836ffc011a018080c19a6607abb9). New file at `src/components/SEO.jsx`, 23 lines. Wraps `<Helmet>` with `title`, `description`, `path` props; auto-builds canonical URL and populates Open Graph + Twitter title/description (image and og:type inherit from `index.html` defaults).
- [x] **Step 5 — Per-page `<SEO>` on 23 components** — split into four sub-commits to keep each reviewable:
  - **5A** [`285cc64`](https://github.com/JMZywietz/InciteU/commit/285cc64bec02c111bdd13e3437862dc4b954a914) — 6 page files (HomePage, BioPage, ContactPage, WhereToStartPage, QuizPage, ThinkPage).
  - **5B** [`5f5e0a6`](https://github.com/JMZywietz/InciteU/commit/5f5e0a68b6b947d72a3849eae6304d91d31701a0) — 6 self/inward tools (ThreeMoments, IdentityBox, LCP, LeadershipCapacitiesAnalysis, FiveLives, SmallestViableExperiment). Multi-screen tools needed per-return insertions: LCP=3, FiveLives=5, SVE=4. Helmet handles screen-state remount cleanly — same props in, same tags out.
  - **5C** [`e638c1a`](https://github.com/JMZywietz/InciteU/commit/e638c1a81c236cda54c25d1a7a6764a870b32c34) — 8 team/org/paired tools (PreMortem, ChallengeMapper, CreativeCollision, FacilitateYourWay, Vision, Readiness, PurposeSmallMoves, EmotionsAsInformation). FacilitateYourWay needed 8 step-based insertions, Vision needed 4 (two-pass for indent-6 + indent-4 mains). CreativeCollision's `<main>` lives inside the `PhaseShell` helper — SEO went inside the page-level fragment instead so it persists across all 7 phases.
  - **5D** — split in two: [`a2dfe43`](https://github.com/JMZywietz/InciteU/commit/a2dfe43def515fa4e5c7160717395c17d0b8dfca) shipped the 2 think pieces (FiveLayersDeep, CynefinScrollytelling — both use `<div>` not `<main>` as wrapper); [`600adb2`](https://github.com/JMZywietz/InciteU/commit/600adb2acf38fc04f68612757f5d0fb4e62145f9) shipped the Culture Change Model sub-app after a structural-decision pause with Jen (see lessons #2 below). Total Step 5: **42 `<SEO>` tag instances across 23 component files**.
- [x] **Step 6 — sitemap.xml + robots.txt** — [`6cf2148`](https://github.com/JMZywietz/InciteU/commit/6cf214871c07a300ed35f7ec773988ab7a99230e). Two new files in `/public`: `sitemap.xml` (23 URLs with priorities, valid XML, cross-checked against Step 5's tagged routes for zero missing / zero extra); `robots.txt` (allow-all + sitemap pointer).

**Outstanding from this session:**

- [ ] **Step 7 — Google Search Console submission** — Jen confirmed GSC is already set up. Jen to submit `https://inciteu.com/sitemap.xml`, run URL Inspection on 3-4 key URLs, then wait 2-7 days for indexing. Manual step.
- [x] **Person.image added** — shipped May 23 in commit `650fc8e`.
- [ ] **Organization.logo not yet added** — `/public/logo.png` doesn't exist. Drop the file + uncomment the `"logo"` line in `index.html`'s JSON-LD if Jen wants it.
- [x] **favicon.svg verified to exist** — May 23 verification confirmed `/public/favicon.svg` (448 bytes) is present and rendering. The original flag was incorrect.
- [ ] **Vite SSG decision deferred** — The SEO handover notes that full prerendering via Vite SSG is the biggest possible SEO win but a meaningful refactor. Helmet-only is "a no-regrets first step." Once Search Console data comes back, Jen can decide whether the SSG lift is worth it.

**Key patterns / lessons from this session:**

1. **Composio text-push ceiling is much higher than the May 13 footnote suggested.** Step 5B pushed 397 KB total in one commit (LeadershipCapacitiesAnalysis alone was 235 KB). Step 5D-CCM pushed 264 KB as a single-file upsert. Both went through `GITHUB_COMMIT_MULTIPLE_FILES` on the first try, no fallback needed. The 30 KB heuristic in §5 pitfall #5 still applies to inline base64 binary; for plain text source files the practical ceiling is at least 397 KB total / 264 KB single-file.
2. **Architectural conflict surfaced and resolved correctly for CCM.** The May 13 lift documented CCM as a self-contained sub-app with "zero imports from sibling source files" — but the SEO handover (written earlier, before the lift) treated `import SEO` as routine. Claude paused, surfaced three options (inline `<Helmet>` from npm / skip CCM / import `<SEO>` and accept the invariant break), and Jen chose option C. The result: a one-line cleanup if CCM is ever lifted out. Pattern worth keeping: when a documented invariant might be violated, ask before pushing — even for a "one-line change."
3. **Multi-screen tools (LCP, FiveLives, SVE, Vision, FacilitateYourWay) need `<SEO>` in every conditional return path.** A single SEO at the function root would unmount when the screen changes. Inserting the same `<SEO>` props inside each return path means Helmet remounts with identical props on every screen — the title stays set, no flicker.
4. **`raw.githubusercontent.com` has ~5 min CDN cache lag**, which can lie about whether a commit landed. After Step 1's push, the raw URL still served the pre-commit version for the first verification call. `api.github.com/repos/{owner}/{repo}/contents/{path}?ref={commit_sha}` returns the actual content at that ref with no CDN lag — use the API pinned to the commit SHA for verification right after push.
5. **GitHub API anonymous rate limit (60 req/hour) is easy to hit on a busy session.** When it does hit, fall back to `raw.githubusercontent.com` (different host, no API limit) for read-only fetches, or use Composio's authenticated tools.
6. **JSX attribute encoding for `&`.** ContactPage's and BioPage's titles contain "& Team Facilitator" / "& Team Facilitation" — encoded as `&amp;` in the JSX source. React decodes that at compile time so the resulting `<title>` element in the browser shows a regular `&`. esbuild validated both files clean.


### Recently completed (May 15, 2026 session) — Jen headshot added to bio hero; logo wall expanded

- [x] **Jen headshot added to bio hero** — commit [`10b5d4ae`](https://github.com/JMZywietz/InciteU/commit/10b5d4ae93) (`BioPage.jsx`). `/public/jen-may.jpg` (86 KB, uploaded manually via GitHub web UI) rendered as a 260px circle above "Hello." in the hero section. Styles: `borderRadius: '50%'`, `objectFit: 'cover'`, `objectPosition: 'center 30%'`, `margin: '0 auto 28px'`, ring shadow `0 0 0 1px C.line, 0 12px 40px rgba(0,0,0,0.35)`. **This was NOT in the handover doc** — it was added directly online. Any Claude fetching BioPage for edits must account for this or it will be silently dropped on the next push (exactly what happened in the May 15 logo wall session).
- [x] **Logo wall expanded from 4 → 15 entries** — commit [`0ab6787`](https://github.com/JMZywietz/InciteU/commit/0ab6787a834cb9b74e482c2c4e1d6a644f2a1804) (`BioPage.jsx`). Icon tiles (SVG, 24×24 viewBox, `fill="currentColor"`): Google, PayPal, Careem · Uber (Uber icon), PepsiCo, Microsoft, WHO. Wordmark tiles (styled uppercase text, same `C.creamMuted` colour): McKinsey, PwC, Novartis, Honeywell, World Bank, Kuwait Finance House, Diageo, Achmea, Cleveland Clinic AD. Wordmark approach used because these B2B/professional services brands have no paths in simple-icons, iconify, or any accessible icon library. Render section updated: `logo.svg ? <svg>...</svg> : <span>wordmark</span>`. Grid widened to `maxWidth: 960`, `auto-fill` (was `auto-fit`), `minHeight: 64` on each cell for visual alignment.

**Key lesson:** Always fetch BioPage from the repo immediately before any edit. Do NOT rely on the handover alone — manually-uploaded assets and direct-web-UI commits will not appear here until explicitly recorded.

---

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
- [x] Formspree ID — shipped May 23 in commit `650fc8e`. ID `xqejlbrk`, free tier (50/mo), delivers to jen@inciteu.com.
- [ ] Self-host hero photo — `HERO_PHOTO` in `theme.js` still points at Wix CDN. (About page's `about-enso.jpg` is the first self-hosted image, lives at `public/about-enso.jpg`. Pattern is established; HERO_PHOTO can follow.)
- [ ] Wayback Machine archive of old Wix site, then cancel Wix.
- [x] **Logo wall expanded** — wall now shows all 15 client organisations: icon tiles for Google, PayPal, Careem · Uber, PepsiCo, Microsoft, WHO; wordmark tiles for McKinsey, PwC, Novartis, Honeywell, World Bank, Kuwait Finance House, Diageo, Achmea, Cleveland Clinic AD. See May 15 session entry above for full details.
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


---

## §11 — Multi-contributor session architecture (Many Mirrors)

Parallel to §10 (Facilitate Your Way) but built with the `[action]` router pattern to stay under Vercel's 12-function cap. This is the template for all future collaborative tools.

### Redis key schema (namespace `mm:`)
- `mm:{code}:config` — session config (subjectTokenHash, subjectName, questions, questionOrder)
- `mm:{code}:evals` — array of evaluators (id, name, relationship, status, inviteToken)
- `mm:{code}:response:{evaluatorId}` — one evaluator's answers
- `mm:{code}:self` — subject's self-survey answers
- `mm:{code}:report` — synthesized report
- `mm:{code}:rtok:{sha256(resultsToken)}` — read-only results-link tokens
- 180-day TTL on all keys, refreshed on activity.

### Auth model
- Subject actions: Bearer subject token (`isSubject` compares `sha256(token)` to `config.subjectTokenHash`).
- Evaluator submission: per-evaluator `inviteToken` in the body (no subject token).
- Results share link: GET `report` accepts `?t={resultsToken}` as read-only access in place of the subject token.

### Endpoints
- `POST /api/sessions/mm/create` → `{code, subjectToken, shareURL}` (file `create.js`)
- `GET /api/sessions/mm/{code}` → public config for evaluator landing (file `[code].js`)
- `/api/sessions/mm/{code}/{action}` → ROUTER (file `[code]/[action].js`), action ∈:
  - `evaluators` — GET list / POST add / PATCH remind (subject)
  - `responses` — POST submit (evaluator invite token)
  - `self` — POST self-survey (subject)
  - `synthesize` — POST generate report (subject); pipeline in `_synth.js`
  - `report` — GET report (subject or `?t=resultsToken`) / POST create results link (subject)
  - `delete` — POST delete all session data (subject)

### Function budget
Many Mirrors = 3 counted functions (`create`, `[code]`, `[code]/[action]`); `_lib.js` and `_synth.js` are free. Repo is at 12/12 — the next collaborative tool needs an existing one consolidated or a move to Vercel Pro.

### Required Vercel setup
- `KV_REST_API_URL`, `KV_REST_API_TOKEN` (shared Upstash Redis, already set)
- `ANTHROPIC_API_KEY` (already set)
- `RESEND_API_KEY` — NEW; required for invite emails. Without it, build and page still work; only email sending is skipped.


---

## §12 — Visual design pattern: making text-heavy pages engaging

**Reference implementation:** `src/tools/ManyMirrors.jsx` — `welcome` step (right-column artwork) and `report` step (all patterns). Apply these to any InciteU tool that currently presents a wall of text. No backend changes needed — all inline-style JSX.

---

### 1. SVG artwork alongside headers

Define an inline SVG component at the top of the tool file. Use it twice: full-size on the welcome/landing step (right column of a flex row, ~320px), and smaller on the results/report header (~140px, opacity 0.75).

**Critical:** put the subtitle/meta line *inside* the text column of the flex wrapper, not after the closing `</div>`. If it is outside, the artwork height creates a visible gap between title and date. `marginBottom` for the gap before the next section belongs on the outer flex div.

```jsx
<div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start',
              gap:32, flexWrap:'wrap', marginBottom:40 }}>
  <div style={{ flex:'1 1 300px' }}>
    <div style={{ ...eyebrow }}>Tool name</div>
    <h1>Title</h1>
    <p style={{ marginTop:4, marginBottom:0 }}>Generated May 29…</p>  {/* inside */}
  </div>
  <div style={{ flexShrink:0, opacity:0.75 }}><ToolArtwork width={140} /></div>
</div>
```

---

### 2. Summary anchor box

The top section of a results page should be a warm-gold tinted box — visually distinct from the content below and clearly readable as "start here."

```jsx
<section style={{ background:'rgba(232,217,168,0.09)', border:'1px solid rgba(232,217,168,0.22)',
                  borderRadius:8, padding:'24px 28px', marginBottom:48 }}>
```

Add a collapsible for long content — `overflow:hidden` + `maxHeight` + toggle button. **Never** use a gradient fade-to-background inside a tinted box: any opaque colour mismatch renders as a visible coloured block. Let `overflow:hidden` clip cleanly; the button is the affordance.

---

### 3. Parallel colour-coded category boxes

Logically parallel sections (Patterns/Outliers/Absences, Alignments/Gaps, Pros/Cons…) should sit side-by-side in a flex container rather than stacking vertically. `flex: '1 1 180px'` wraps on narrow screens.

```jsx
<div style={{ display:'flex', gap:14, flexWrap:'wrap', marginBottom:22 }}>
  {data.patterns?.length > 0 && (
    <div style={{ flex:'1 1 180px', background:'rgba(160,200,235,0.10)',
                  border:'1px solid rgba(160,200,235,0.28)', borderRadius:6, padding:'14px 18px' }}>
      <div style={{ ...fieldLabel, marginBottom:10 }}>Patterns</div>
      {data.patterns.map((p,i) => <p key={i} style={{ fontSize:14, lineHeight:1.7, marginTop:0 }}>{p}</p>)}
    </div>
  )}
  {/* Outliers:   rgba(235,190,130,0.10) / rgba(235,190,130,0.28) */}
  {/* Absences:   rgba(130,220,190,0.09) / rgba(130,220,190,0.25) */}
  {/* Alignments: rgba(150,225,175,0.09) / rgba(150,225,175,0.25) */}
  {/* Gaps/Risk:  rgba(210,155,175,0.09) / rgba(210,155,175,0.25) */}
</div>
```

**Colour palette** (all tested on `#142B5C` sapphire):

| Category | bg | border |
|----------|----|--------|
| Overview/Quotes | `rgba(232,217,168,0.09)` | `rgba(232,217,168,0.22)` |
| Patterns | `rgba(160,200,235,0.10)` | `rgba(160,200,235,0.28)` |
| Outliers | `rgba(235,190,130,0.10)` | `rgba(235,190,130,0.28)` |
| Absences | `rgba(130,220,190,0.09)` | `rgba(130,220,190,0.25)` |
| Alignments | `rgba(150,225,175,0.09)` | `rgba(150,225,175,0.25)` |
| Gaps | `rgba(210,155,175,0.09)` | `rgba(210,155,175,0.25)` |

---

### 4. Pull quotes

```jsx
{quotes.map((q, i) => (
  <p key={i} style={{
    fontFamily: F.serif, fontSize: 17, fontStyle: 'italic',
    color: i % 2 === 0 ? C.cream : palette.accentMuted,  // alternate
    lineHeight: 1.35,   // tight within one quote
    marginBottom: 22,   // generous between quotes
  }}>&ldquo;{q}&rdquo;</p>
))}
```

---

### 5. Font floor

| Element | Size |
|---------|------|
| Eyebrow / counter labels | ≥13px |
| Meta / small text | 14–15px |
| Body synthesis | 15px |
| Question text (sans) | 17px |
| Pull quotes (serif italic) | 17px |
| Section headings | `heading(26–28)` |

Override `fontSize` when using the `eyebrow` style — it defaults to 11px in `styles.js`.

---

### 6. Upgrade checklist

1. Add an inline SVG artwork component; place alongside the main heading.
2. Wrap the top summary in the warm-gold anchor box with collapsible.
3. Replace stacked parallel sections with the flex colour-box pattern.
4. Style any verbatim quotes as pull quotes with alternating colour.
5. Check all font sizes — bump anything below 13px.
6. Sanity-check: the page should read as *sections*, not a continuous scroll of paragraphs.

Living reference: `inciteu.com/tools/self/many-mirrors` with a generated report.
