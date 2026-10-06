# Quiet Cup — Agent rules

Use this file at the start of every session when working on this repository.

<!-- BEGIN OWNER CI POLICY 2026-09-08 -->
## CI execution and spending — owner ruling, 2026-09-08

Read [CI_POLICY.md](CI_POLICY.md) before changing verification or deployment.
GitHub Actions is disabled repository-wide, including self-hosted and manual
workflows. Use verified Vercel/Cloudflare automation within existing allowances;
no additional paid usage, upgrades, local-machine fallback, or silent loss of
required checks. A blocked replacement stays blocked. This ruling supersedes
older instructions to run/re-enable Actions, buy CI capacity, or treat a green
deployment as proof that unconfigured tests ran. Other product rules remain.
<!-- END OWNER CI POLICY 2026-09-08 -->

## Rules

1. At the start of every session, read planning.md, then tasks.md, then claude.md.
2. Before you start work, check tasks.md. Work only on the item you were asked to do.
3. When you finish an item, mark it done in tasks.md with the date. Add any new items you find, using the three-part format: title, outcome, context.
4. Never merge, and never push to main. Work on a branch, open a draft PR, list the files you changed, then stop.
5. Before context is cleared, add a session summary to the end of claude.md.
6. Code must run on both Vercel and Cloudflare. Don't use platform-only APIs.
7. Keep scoring and arithmetic in code, not in a model.

## Handover protocol

1. Every prompt from the PM arrives as a single copy-paste block.
2. Every reply ends with a receipt: branch, PR link, files changed, what's done, what's blocked.

## File hygiene

- **Never** rename or restructure files without **explicit** instruction from the user.

## Product naming

- The app name is **Quiet Cup** (use this in docs, tasks, and user-facing copy unless the code still says otherwise).

## Session summaries

Append a short bullet under **Session Summaries** at the bottom of this file after substantive work. Include what changed and any follow-ups.

---

## Session Summaries

### 2026-03-26 — Documentation bootstrap

- Added four root docs: **`PRD.md`**, **`claude.md`**, **`planning.md`**, **`tasks.md`**.
- Documented the **actual** codebase: static **`index.html`** (vanilla JS, Tailwind CDN, Google Maps + Places), **`api/busyness.js`** (BestTime proxy + cache), **`vercel.json`** (SPA rewrite). No application code was modified in this session.
- Clarified in **`PRD.md`** that a prior Next.js/`@googlemaps/js-api-loader` stack is **not** what ships in the repo today.

### 2026-03-26 — Marker labels + BestTime no-data

- Map markers use **white numeric labels** inside the colored circle (**`?`** before data is loaded).
- When BestTime forecast fails, **`api/busyness.js`** returns **`noData: true`** with empty fields; the bottom sheet shows **“No busyness data available”** and hides meter + chart.

### 2026-03-26 — Pre-enrichment + floating venue names

- After **`nearbySearch`**, the client staggers **`POST /api/busyness`** (200 ms apart) for every café and updates markers as results land (**`Promise.allSettled`**).
- Each marker shows the venue name via **`google.maps.Marker`** **`label`** ( **`className: 'marker-label'`**, 11px **DM Sans**, **`#333`** text) with pill styling in **`index.html`** CSS — no **InfoWindow** for names.

### 2026-03-26 — Marker label instead of InfoWindow for venue names

- Removed **InfoWindow**-based name pills (close buttons); venue names use **`Marker`** **`label`** + **`.marker-label`** CSS only.

### 2026-03-26 — Google Maps key injection (Vercel)

- **Earlier attempt:** **`api/index.js`** + rewrites to inject **`GMAPS_KEY`** at request time; unreliable when static **`/`** wins over rewrites or the template is missing from the serverless bundle.
- **Current approach:** **`build-index.js`** + **`npm run build`**: write **`public/index.html`** from **`index.template.html`** with **`GMAPS_KEY`** substituted at **deploy build** time; **`vercel.json`** sets **`outputDirectory: public`** so Vercel accepts the build. **`public/index.html`** is **gitignored**.

### 2026-10-06 — Framework reset (docs only, branch `docs/framework-reset`)

- **`planning.md`** rewritten: vision, architecture as built, tech stack, tools, hosting constraint (Vercel or Cloudflare only, no servers), and a **Current state (2026-10-06)** audit: latest `main` commit, branches (no open PRs), tracked files with line counts, env vars, 11 claims checked (10 confirmed, 1 refuted as worded), and key strings in history.
- **`claude.md`**: replaced "Session startup" and "Task hygiene" with the **Rules** and **Handover protocol** sections; kept the CI policy block, file hygiene and naming.
- **`AGENTS.md`** created; points agents to `claude.md`.
- **`PRD.md`**: replaced the stale "Street Whisperer" sentence. No other PRD changes.
- **Blocked:** `quiet-cup-backlog.md` is not in the repo on any branch, so `tasks.md` was not replaced, QC-001 was not updated, and the PRD was not rewritten. Do these once the file is committed.
- **Follow-ups:** a Google Maps key (`AIzaSy…`) is in `main`'s history (commit `4e58cca`) and must be rotated or confirmed referrer-restricted. `api/busyness.js` is Vercel-only (Node `req, res`) and breaks rule 6.

### 2026-10-06 — Backlog and PRD (docs only, branch `docs/framework-reset`, PR #8)

- **`tasks.md`** replaced with the product backlog pasted by the PM (QC-001 to QC-054), kept as written. The 12 completed March items moved, with their dates, into a new **Done** section at the end.
- Checked the audit findings against QC-001, QC-002 and QC-016. The only missing detail was added to QC-016: the code reads only `BESTTIME_PRIVATE_KEY`; `BESTTIME_PUBLIC_KEY` is unused. No new items created.
- **`PRD.md`** rewritten from the backlog's "Product definition" and "Constraints": users, 15 user stories, technical requirements, budget, success metrics. Each requirement is labelled built, Phase 1 or later.
- `quiet-cup-backlog.md` was never committed (the backlog arrived in the prompt), so there was no file to delete.
- **Follow-ups:**
  - `planning.md`'s Vision still describes a "quiet café" finder and lists OpenFreeMap as a principle. It needs aligning with the backlog's product definition, and with QC-011's open question about keeping the Google map.
  - Both "docs out of date" bullets in QC-019 are already fixed by this PR (`PRD.md` and `planning.md` were rewritten). QC-019 can drop them.
  - QC-003 can be marked done once Raj approves PR #8.
