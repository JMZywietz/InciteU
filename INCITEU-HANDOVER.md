# InciteU — Handover for Future Sessions

**Last updated:** May 6, 2026
**Owner:** Jen Zywietz (jennmay@gmail.com)
**Repo:** https://github.com/JMZywietz/InciteU
**Live site:** Deployed on Vercel (custom domain pending → inciteu.com)

---

## TL;DR for Claude

Jen has a working React/Vite/Vercel site at `JMZywietz/InciteU`. It's a leadership development site with 4 working tools, 1 think piece, and supporting pages. **Adding a new tool is a routine modular task** — extract pattern from existing tools, drop into the right folder, add one route, push the commit. No rebuild, no migration, no monolith.

This doc is the playbook. Read it before doing anything.

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
│   ├── tools/                     ← The four interactive tools  ← NEW TOOLS GO HERE
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
{ name: 'Your Tool', desc: 'One-line teaser.', onClick: () => navigate('your-tool') }
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

## 4. Common Pitfalls to Avoid

1. **Don't paste base64 inline** — broke a previous session. Plain utf-8 to `GITHUB_COMMIT_MULTIPLE_FILES`.
2. **Don't introduce Tailwind, CSS-in-JS libraries, or component frameworks** — site is intentionally minimal stack.
3. **Don't redefine colors, buttons, or fonts** — pull from `theme.js`/`styles.js`.
4. **Don't put real-time AI calls directly to `api.anthropic.com`** — always go through `synthesize()` helper, which uses the Vercel proxy and keeps the API key out of the bundle.
5. **Don't forget the 4 places a route lives:** the page file, `routes.js`, `App.jsx`, and HomePage. Missing any one → broken navigation.
6. **Don't push to a branch other than `main`** unless Jen explicitly asks for a PR workflow. Vercel deploys main directly.
7. **Don't change `package.json` dependencies casually.** If a new tool genuinely needs a library, flag it to Jen first.
8. **Don't add a new tool category (Self/Team/Org)** without asking. The 3-card structure on HomePage is part of the IA.

---

## 5. Pre-Mortem Tool — Special Case

There's a separate `~1,678-line` Pre-Mortem tool (file likely called `premortem.jsx`) that Jen built earlier and intends to merge into this site. Its placeholder route is reserved at `/tools/team/pre-mortem`.

When Jen brings this up: it's the same migration pattern as the other tools, but bigger. Will likely need to:
- Strip out any direct `api.anthropic.com` calls and route through `synthesize()`
- Replace any `({ navigate })` prop pattern with `const navigate = useAppNavigate()` hook
- Drop into `src/tools/PreMortem.jsx`
- Wire up the existing reserved route

---

## 6. Outstanding Setup (as of last session)

These are Jen's tasks, not Claude's. Listed so future-Claude knows the state.

- [ ] **`ANTHROPIC_API_KEY` in Vercel env vars** — currently being set up. Without this, AI tools fall back to "unavailable" message but site otherwise works.
- [ ] **Custom domain** `inciteu.com` — point GoDaddy DNS to Vercel
- [ ] **Formspree ID** — replace `REPLACE_WITH_YOUR_ID` in `src/pages/ContactPage.jsx`
- [ ] **Self-host hero photo** — `HERO_PHOTO` in `theme.js` is still pointing at Wix CDN
- [ ] **Wayback Machine archive** of old Wix site, then cancel Wix
- [ ] **Pre-Mortem merge** (see §5)

---

## 7. How a Fresh Session Should Open

1. Read this doc end to end (it's not long).
2. Ask Jen: "What are we building today?"
3. If it's a new tool: walk through §3 with her — confirm name, category, flow, AI usage, download format **before** writing code.
4. If it's a fix to an existing tool: use `GITHUB_GET_REPOSITORY_CONTENT` to read current state, then commit changes via `GITHUB_COMMIT_MULTIPLE_FILES`.
5. If it's an env/Vercel/domain question: refer to §6 and the Vercel dashboard. Claude doesn't deploy — Vercel does, automatically, on push to `main`.

Keep commits small and atomic. One feature = one commit.

---

## 8. Quick Reference — Existing Tools

| Tool | File | Route | Uses AI? |
|------|------|-------|----------|
| ThreeMoments | `src/tools/ThreeMoments.jsx` | `/tools/self/three-moments` | Yes (optional synthesis) |
| LCP | `src/tools/LCP.jsx` | `/tools/self/lcp` | Yes (synthesis) |
| Readiness | `src/tools/Readiness.jsx` | `/tools/org/readiness` | No |
| Vision | `src/tools/Vision.jsx` | `/tools/org/vision` | Yes (optional polish) |
| Pre-Mortem | (not yet merged) | `/tools/team/pre-mortem` (reserved) | TBD |
| FiveLayersDeep | `src/think/FiveLayersDeep.jsx` | `/think/five-layers-deep` | No |

---

*End of handover. Keep it current — update this file in the repo when the architecture changes meaningfully.*
