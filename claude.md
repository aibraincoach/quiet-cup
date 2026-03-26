# Quiet Cup — Agent rules

Use this file at the start of every session when working on this repository.

## Session startup

- Always read **`planning.md`** at the start of every new conversation.
- Always check **`tasks.md`** before starting work.

## Task hygiene

- Mark completed tasks **immediately** with **✅** and the **date** (ISO or clear calendar date).
- Add **newly discovered** tasks to **`tasks.md`** (under **Up Next** unless already done).
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
- **Current approach:** **`build-index.js`** + **`npm run build`**: write **`index.html`** from **`index.template.html`** with **`GMAPS_KEY`** substituted at **deploy build** time. Removed **`api/index.js`** and rewrite-heavy **`vercel.json`** so **`/`** is normal static HTML. **`index.html`** is **gitignored**.
