# InciteU — Handover for Future Sessions

**Last updated:** May 6, 2026
**Owner:** Jen Zywietz (jennmay@gmail.com)
**Repo:** https://github.com/JMZywietz/InciteU
**Live site:** Deployed on Vercel (custom domain pending → inciteu.com)

---

## TL;DR for Claude

Jen has a working React/Vite/Vercel site at `JMZywietz/InciteU`. It's a leadership development site with 5 working tools, 1 think piece, and supporting pages. **Adding a new tool is a routine modular task** — extract pattern from existing tools, drop into the right folder, add one route, push the commit. No rebuild, no migration, no monolith.

This doc is the playbook. Read it before doing anything. **§9 has the artifact URL registry — read URLs from there, never try to fetch claude.ai/public/artifacts/* (web_fetch returns 403 on those).**

---

## 1. Architecture (memorize this)

```
JMZywietz/InciteU/
├── api/synthesize.js              ← Vercel serverless: proxies to Anthropic API
├── src/
│   ├── main.jsx                   ← React entry (BrowserRouter)
│   ├── App.jsx                    ← Route definitions  ← EDIT WHEN ADDING A ROUTE
│   ├── theme.js                   ← Brand: palette C, fonts F, GLOBAL_CSS, HERO_PHOTO
│   ├── styles.js                  ← Reusable styles: btn(), heading(), eyebrow, fieldLabel, fieldInput, btnHoverIn/Out
│   ├── components/                ← Header, Footer, HeroFlourish, OrganicDivider, icons, CategoryCard
│   ├── pages/                     ← Top-level pages (Home, Bio, Contact, ThinkPage, WhereToStartPage)
│   ├── tools/                     ← Five interactive tools  ← NEW TOOLS GO HERE
│   ├── think/                     ← Long-form think pieces  ← NEW THINK PIECES GO HERE
│   └── lib/
│       ├── routes.js              ← Symbolic name → URL path map  ← EDIT WHEN ADDING A ROUTE
│       ├── useAppNavigate.js      ← Hook: navigate('lcp') instead of '/tools/self/lcp'
│       ├── synthesize.js          ← AI helper: synthesize() + extractText()
│       └── utils.js               ← escapeHTML, downloadHTML
├── package.json                   ← React 18.3.1 + react-router-dom 6.26.2 + Vite 5.4.8
├── vite.config.js
├── vercel.json                    ← Rewrites all paths → /index.html (SPA)
└── index.html
```

**Stack:**
- Plain React 18 with **inline styles** (NO Tailwind, NO CSS modules — just `style={{}}`)
- React Router v6 for routing
- Vite for build
- Vercel for hosting (auto-deploys from `main`)
- Anthropic API via Vercel serverless proxy at `/api/synthesize`

**Brand constants (from `src/theme.js`):**
- `C.bgDeep` `#1F3937`, `C.bgCard` `#2A4744`, `C.cream` `#F0EBDB`, `C.sage` `#C5D49B`
- `F.serif` = Cormorant Garamond, `F.sans` = Inter
- Always import from `theme.js` and `styles.js`. **Don't redefine colors or buttons.**

---

## 2. Connecting to GitHub (every session)

Composio MCP is connected on Jen's account. Connection details:
- **Account:** `github_tum-horse` (login: JMZywietz)
- **Default branch:** `main`
- **The tool that works:** `GITHUB_COMMIT_MULTIPLE_FILES` with `encoding: "utf-8"`

**Don't** use base64 encoding via the workbench — it bloats payloads and broke a previous session. Plain utf-8 strings passed to `GITHUB_COMMIT_MULTIPLE_FILES` work clean every time.

Verify connection at session start:
```
COMPOSIO_SEARCH_TOOLS query: {"use_case": "create or update file in GitHub repo on a branch", "known_fields": "owner:JMZywietz, repo:InciteU"}
```

If it shows `has_active_connection: true` → proceed. If not → user needs to reconnect via Composio.

---

## 3. Adding a New Tool — End-to-End Playbook

There are **two patterns** for new tools. Pick the right one before writing code:

- **Pattern A: Native React tool** — the tool's UI lives entirely inside the InciteU site, written in React. Examples: ThreeMoments, Readiness, Vision, LCP. Use this when you're building the tool from scratch or porting a self-contained interaction. Most new tools that don't already exist as published Claude artifacts use this.
- **Pattern B: Linked Claude artifact** — the tool's actual UI lives in a published Claude artifact at `claude.ai/public/artifacts/<uuid>`, and InciteU just provides a brand-styled intro page with a button that opens it in a new tab. Example: Premortem. Use this when the tool already exists as a published artifact, when you specifically want to avoid Anthropic API costs, or when the tool needs Claude's UI capabilities the React site doesn't provide.

§3 below covers Pattern A. For Pattern B, see §4.

### Step 1: Confirm the design with Jen
Before writing code, get clear on:
- **What's the tool called?** (e.g. "Decision Audit", "Power Map", "Stakeholder Heat-Check")
- **Which category does it sit in?** Self / Team / Org → determines route prefix
- **What's the user flow?** Steps, questions, output format. Look at existing tools as templates:
  - **ThreeMoments** = multi-step wizard with optional AI synthesis at the end
  - **Readiness** = self-assessment with scored dimensions, banded results, downloadable HTML
  - **Vision** = guided long-form text builder with optional AI polish
  - **LCP** = pick-from-options with diagonal-tension synthesis (most similar to what most new tools want)
- **Does it use AI?** If yes → import `synthesize` and `extractText` from `lib/synthesize.js`
- **Does it produce a download?** If yes → use `downloadHTML` from `lib/utils.js` and follow the HTML doc pattern from ThreeMoments/Readiness/Vision

### Step 2: Write the tool file
Create `src/tools/<ToolName>.jsx`. **Copy the structure of the closest existing tool**, don't write from scratch.

Boilerplate every new tool needs:
```jsx
import React, { useState } from 'react';
import { C, F } from '../theme.js';
import { btn, btnHoverIn, btnHoverOut, eyebrow, heading, fieldLabel, fieldInput } from '../styles.js';
import { useAppNavigate } from '../lib/useAppNavigate.js';
// Optional, only if needed:
import { synthesize, extractText } from '../lib/synthesize.js';
import { escapeHTML, downloadHTML } from '../lib/utils.js';

export default function YourToolPage() {
  const navigate = useAppNavigate();
  // ... state, handlers ...
  return (
    <main style={{ animation: 'fadeIn 0.4s ease', minHeight: '80vh', padding: '60px 6vw 80px', maxWidth: 820, margin: '0 auto' }}>
      <a onClick={(e) => { e.preventDefault(); navigate('home'); }} href="#"
         style={{ display: 'inline-block', color: C.creamMuted, textDecoration: 'none', fontSize: 12, letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 40, cursor: 'pointer' }}>
        ← Back to tools
      </a>
      {/* tool body */}
    </main>
  );
}
```

**Style discipline:**
- No new color values — always pull from `C` palette in `theme.js`
- No new button styles — use `btn('primary')` or `btn('secondary')` from `styles.js`
- No new heading sizes — use `heading(48)`, `heading(40)`, etc.
- Eyebrow caps text uses `eyebrow` style
- For form fields, use `fieldLabel` and `fieldInput`
- If any of the above feels insufficient, **flag it to Jen first** before adding new tokens — keeping the visual system tight is non-negotiable

**AI synthesis pattern (if needed):**
```jsx
const data = await synthesize({
  model: 'claude-sonnet-4-5',
  max_tokens: 800,
  messages: [{ role: 'user', content: prompt }],
});
const text = extractText(data);
```
Always wrap in try/catch and provide a graceful fallback message ("AI synthesis is unavailable right now. Your reflections above stand on their own."). The proxy may fail if the env var isn't set yet.

### Step 3: Register the route
Two files to edit:

**`src/lib/routes.js`** — add the symbolic name → path mapping:
```js
'your-tool': '/tools/<self|team|org>/your-tool',
```

**`src/App.jsx`** — add the import and `<Route>`:
```jsx
import YourToolPage from './tools/YourTool.jsx';
// ...
<Route path="/tools/<self|team|org>/your-tool" element={<YourToolPage />} />
```

### Step 4: Surface it on HomePage
The user has to be able to find the tool. Edit `src/pages/HomePage.jsx` to add it under the right `CategoryCard` (Self / Team / Org). Pattern:
```jsx
{ name: 'Your Tool', live: true, to: 'your-tool' }
```

### Step 5: (Optional) Add to WhereToStartPage
If the tool fits the 3-question wizard logic, add it to the recommendation map in `src/pages/WhereToStartPage.jsx`. If the existing wizard branches don't reach it cleanly, leave it off rather than forcing it.

### Step 6: Local build check (optional but smart)
If there's a working `/home/claude/inciteu/` from a previous session:
```bash
cd /home/claude/inciteu && npx vite build
```
If `dist/` builds clean, the JSX is valid. Catches typos before they hit GitHub. Skip if not in a sandbox where the project lives — Vercel will catch errors on its own deploy too.

### Step 7: Commit and push
Use **one** atomic commit per logical change. Pattern that works:

```
COMPOSIO_MULTI_EXECUTE_TOOL → GITHUB_COMMIT_MULTIPLE_FILES
{
  "owner": "JMZywietz",
  "repo": "InciteU",
  "branch": "main",
  "message": "Add <ToolName> tool: <one-line description>",
  "upserts": [
    { "path": "src/tools/<ToolName>.jsx", "content": "<full file>", "encoding": "utf-8" },
    { "path": "src/lib/routes.js", "content": "<full file>", "encoding": "utf-8" },
    { "path": "src/App.jsx", "content": "<full file>", "encoding": "utf-8" },
    { "path": "src/pages/HomePage.jsx", "content": "<full file>", "encoding": "utf-8" }
  ]
}
```

Pass the **complete** file contents for every file in `upserts` — `GITHUB_COMMIT_MULTIPLE_FILES` overwrites with whatever you send. To see current state of a file before editing it, use `GITHUB_GET_REPOSITORY_CONTENT` first.

### Step 8: Verify
After commit succeeds, Vercel auto-deploys from `main` in ~30 seconds. Jen confirms by visiting the live URL. Done.

---

## 4. Pattern B: Tool that links to a published Claude artifact

Use this when the tool's actual UI is a published Claude artifact at `claude.ai/public/artifacts/<uuid>` and you just need to integrate it into InciteU. The integration is a small InciteU-styled intro page that explains what the tool is, then a primary button that opens the artifact in a new tab.

The Premortem tool is the reference implementation: see `src/tools/PreMortem.jsx`.

### ⚠️ Critical: how to know the artifact URL

**`web_fetch` returns 403 on every `claude.ai/public/artifacts/*` URL.** Don't try to fetch the artifact to read its contents — it won't work. Instead:

1. **Read the URL from §9 of this doc** (the artifact URL registry). If a Pattern B tool already exists, its URL is recorded there.
2. **Ask Jen for the URL** if she's adding a new artifact-backed tool that isn't in §9 yet.
3. **After committing**, add or update the entry in §9 so future-Claude can find it.

Do NOT try to open the artifact yourself with `web_fetch` and report back its contents. Even if Jen pastes the URL in chat, you only need the URL string — never the artifact's HTML.

### Step 1: Confirm with Jen
- **What's the tool called?** Becomes the page heading and the Team/Self/Org card label.
- **Which category?** Self / Team / Org.
- **One-paragraph description of what the tool does.** This goes in the intro page — use Jen's actual words, don't paraphrase. Quote her two-sentence definition + elaboration if she gives you one.
- **Anything important about who it's for / when to use it?** Becomes a sage callout box on the intro page (e.g. "This tool can be used alone or with a team.").
- **The artifact URL.** Get this from Jen directly.

### Step 2: Write the intro page file
Create `src/tools/<ToolName>.jsx`. Copy the structure of `src/tools/PreMortem.jsx` — it's the reference. Key elements:

- Constant at the top: `const <TOOLNAME>_URL = 'https://claude.ai/public/artifacts/<uuid>';`
- Eyebrow: "A Self/Team/Org tool"
- `heading(60)` with the tool name in serif italic sage
- Jen's description as two paragraphs: serif 22px lead, then sans 15px elaboration in `creamMuted`
- Sage-bordered callout box for the "who it's for" line
- `heading(28)` "How this tool works" with a 3-step numbered list (matching LCP's pattern)
- Primary button: `<a href={URL} target="_blank" rel="noopener noreferrer" style={{ ...btn('primary'), textDecoration: 'none' }}>Open the <Tool> tool ↗</a>`
- Secondary button: `<button onClick={() => navigate('home')} style={btn('secondary')}>Back to all tools</button>`
- Small italic note at bottom: "Opens in a new tab. The tool itself runs as a published Claude artifact."

### Step 3: Register the route
Same as Pattern A, Step 3. `routes.js` and `App.jsx`.

### Step 4: Surface it on HomePage
Same as Pattern A, Step 4. `HomePage.jsx`, the right CategoryCard, with `live: true, to: '<tool-name>'`.

### Step 5: Update §9 of this handover doc
Add a row to the artifact URL registry. This is non-optional — it's the only place future sessions will be able to discover the URL.

### Step 6: Commit
One atomic commit, same as Pattern A Step 7. Files touched: the new tool intro page + App.jsx + HomePage.jsx + INCITEU-HANDOVER.md.

### Why this pattern (and what it doesn't do)
- **No Anthropic API costs** — the artifact runs on Anthropic's published-artifact infrastructure, not on Jen's API key.
- **No iframe** — claude.ai sets `X-Frame-Options` headers that block iframe embedding (verified). Always opens in a new tab.
- **The artifact's own UI is not styled to match InciteU** — visitors see the InciteU shell on the way in, but the actual tool experience is whatever the artifact looks like. That's a real tradeoff. Worth it for free, but flag it to Jen if she expects pixel-perfect brand continuity through the whole flow.

---

## 5. Common Pitfalls to Avoid

1. **Don't paste base64 inline** — broke a previous session. Plain utf-8 to `GITHUB_COMMIT_MULTIPLE_FILES`.
2. **Don't introduce Tailwind, CSS-in-JS libraries, or component frameworks** — site is intentionally minimal stack.
3. **Don't redefine colors, buttons, or fonts** — pull from `theme.js`/`styles.js`.
4. **Don't put real-time AI calls directly to `api.anthropic.com`** — always go through `synthesize()` helper, which uses the Vercel proxy and keeps the API key out of the bundle.
5. **Don't forget the 4 places a route lives:** the page file, `routes.js`, `App.jsx`, and HomePage. Missing any one → broken navigation.
6. **Don't push to a branch other than `main`** unless Jen explicitly asks for a PR workflow. Vercel deploys main directly.
7. **Don't change `package.json` dependencies casually.** If a new tool genuinely needs a library, flag it to Jen first.
8. **Don't add a new tool category (Self/Team/Org)** without asking. The 3-card structure on HomePage is part of the IA.
9. **Don't `web_fetch` a `claude.ai/public/artifacts/*` URL.** Returns 403. Use §9 (artifact URL registry) or ask Jen directly for the URL. The fetch will fail every time.

---

## 6. Outstanding Setup

These are Jen's tasks, not Claude's. Listed so future-Claude knows the state.

- [ ] **`ANTHROPIC_API_KEY` in Vercel env vars** — not yet set. Without this, the AI tools (ThreeMoments, LCP, Vision) fall back to "AI synthesis is unavailable" message but site otherwise works. Jen plans to fund $5 of API credits with a $5/month spending cap when she's ready.
- [ ] **Custom domain** `inciteu.com` — point GoDaddy DNS to Vercel.
- [ ] **Formspree ID** — replace `REPLACE_WITH_YOUR_ID` in `src/pages/ContactPage.jsx`.
- [ ] **Self-host hero photo** — `HERO_PHOTO` in `theme.js` is still pointing at Wix CDN.
- [ ] **Wayback Machine archive** of old Wix site, then cancel Wix.

---

## 7. How a Fresh Session Should Open

1. Read this doc end to end (it's not long).
2. Ask Jen: "What are we building today?"
3. If it's a new native React tool: walk through §3 with her — confirm name, category, flow, AI usage, download format **before** writing code.
4. If it's a new tool backed by a published Claude artifact: walk through §4 — confirm name, category, description, and ask for the artifact URL. Don't try to fetch the URL.
5. If it's a fix to an existing tool: use `GITHUB_GET_REPOSITORY_CONTENT` to read current state, then commit changes via `GITHUB_COMMIT_MULTIPLE_FILES`.
6. If it's an env/Vercel/domain question: refer to §6 and the Vercel dashboard. Claude doesn't deploy — Vercel does, automatically, on push to `main`.

Keep commits small and atomic. One feature = one commit. When you add a Pattern B tool, also update §9 of this doc in the same commit.

---

## 8. Quick Reference — Existing Tools

| Tool | File | Route | Pattern | Uses AI? |
|------|------|-------|---------|----------|
| ThreeMoments | `src/tools/ThreeMoments.jsx` | `/tools/self/three-moments` | A (native) | Yes (optional synthesis) |
| LCP | `src/tools/LCP.jsx` | `/tools/self/lcp` | A (native) | Yes (synthesis) |
| Readiness | `src/tools/Readiness.jsx` | `/tools/org/readiness` | A (native) | No |
| Vision | `src/tools/Vision.jsx` | `/tools/org/vision` | A (native) | Yes (optional polish) |
| Premortem | `src/tools/PreMortem.jsx` | `/tools/team/pre-mortem` | B (artifact) | Yes (via published artifact) |
| FiveLayersDeep | `src/think/FiveLayersDeep.jsx` | `/think/five-layers-deep` | A (native) | No |

---

## 9. Published Artifact URL Registry

For every Pattern B tool, the published Claude artifact URL it links to. **This is the single source of truth for these URLs** — future-Claude reads from this list rather than trying to `web_fetch` claude.ai (which returns 403).

| Tool | Artifact URL | Category | Notes |
|------|-------------|----------|-------|
| Premortem | `https://claude.ai/public/artifacts/b6fdfb33-8a4a-4237-b58d-0f24d5cb814e` | Team | Tested, working. Opens in new tab. |

**When adding a new Pattern B tool:** add a row here in the same commit that introduces the tool. Without it, future sessions can't find the URL.

**When updating an existing artifact:** if Jen replaces a published artifact with a new version (different UUID), update the URL here AND in the corresponding tool file's URL constant. Both must change together.

---

## 10. Other URL References (non-artifact)

External URLs the site links to that aren't published Claude artifacts. Recorded here so future-Claude doesn't have to dig through the codebase.

| Reference | URL | Where it's used |
|-----------|-----|----------------|
| Culture model (CodeSandbox) | `https://qq5l85.csb.app/` | Org card on HomePage, external link |
| Leadership Circle Profile | `https://leadershipcircle.com` | LCP intro page, external link to free assessment |

---

*End of handover. Keep it current — update this file in the repo when the architecture changes meaningfully, and always update §9 when adding a Pattern B tool.*
