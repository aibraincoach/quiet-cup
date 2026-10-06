# Quiet Cup — Product Backlog

**Project:** Quiet Cup
**Owner:** Raj (product) · Claude (PM) · Cursor (engineering)
**Last updated:** 2026-10-06 16:50 MDT
**Repo:** github.com/aibraincoach/quiet-cup · **Live:** quiet-cup.vercel.app

## Product definition

Quiet Cup helps anyone who is new to a city, or just passing through, find a place to open a laptop and work, undisturbed, right now: anywhere in the world.

A place counts if the business doesn't mind laptops. That includes:
- cafés and coffee shops
- restaurants and bars at times when they tolerate laptops
- coworking spaces, with clear day-pass and hourly pricing
- bookable work booths, such as station booths in Japan

A good result has all of these:
- It's open long enough for a session.
- Laptops are welcome.
- There are outlets and wifi.
- It's quiet enough to concentrate.
- You can probably get a seat, or book one.
- For paid spaces, you know the price before you go.

Kid-focused, party, sports and live-music venues are excluded.

Phase 1 ships cafés only. Other place types follow in QC-050 to QC-053.

## Constraints

- **Hosting.** Runs on Vercel or Cloudflare only. No servers, no Raspberry Pi, no self-managed infrastructure.
- **Budget.**
  - $2,400 in Vercel startup credits, to be used within 12 months. These cover hosting, functions and AI Gateway.
  - Google Maps Platform is billed separately and is **not** covered by the credits.
- **Process.**
  - Cursor never merges or pushes to `main`.
  - All work goes through draft PRs reviewed by Raj.
  - Claude (PM) does not touch the repo.

## How to read this file

In the repo, this file is `tasks.md`.

Each item has three parts:
- **Title:** what the item is.
- **Outcome:** what "solved" looks like, in plain language.
- **Context:** everything we already know, so nobody has to re-investigate.

Status values: `todo`, `next`, `in progress`, `blocked`, `done`.
Priority values: P0 (now), P1 (this build), P2 (after launch), P3 (ambitious bets).

---

## P0: Before any building

### QC-001 · Get an accurate picture of the codebase today
`done` 2026-10-06 · Added 2026-10-06

**Outcome:** We have a verified snapshot of the repo: what's on `main`, what's deployed, which open PRs and branches exist, and which bugs are confirmed. Every later item starts from facts, not memory.

**Context:**
- **Snapshot:** `main` at `3d0c13d`. No open PRs before PR #8. The full snapshot is in `planning.md` under "Current state (2026-10-06)".
- **Confirmed bugs** (file and line):
  - UTC "today" and "this hour" on the server: `api/busyness.js:30`, `:196`. The page highlights local time instead (`index.template.html:414-415`).
  - `venueOpen` hard-coded to null: `api/busyness.js:221`.
  - Forecast shown as "live busyness": `api/busyness.js:207-211`, `index.template.html:117`, `:402-405`.
  - Threshold mismatch: colours `index.template.html:163-167`, labels `api/busyness.js:7-13`.
  - Chart scales to the day's maximum: `index.template.html:211-214`, `:219`.
  - Double search on startup: `index.template.html:614-615`.
  - San Francisco fallback: `index.template.html:139`, `:557`, `:577`.
  - No origin check or rate limit: `api/busyness.js:134-238`.
  - Legacy Google APIs: `index.template.html:458`, `:479`, `:495`, `:600`.
- **Partly refuted:** Bad requests do get distinct errors (`api/busyness.js:137-178`), but every BestTime failure returns the same `200 {noData:true}` (`:227-237`).
- **New finding:** `api/busyness.js` only runs on Vercel, which breaks the portability rule. QC-016 deletes it anyway.

### QC-002 · Rotate every key that was ever exposed
`next` · Added 2026-10-06

**Outcome:** Every credential that has ever appeared in a chat, a commit or a screenshot is revoked and replaced. The new keys live only in Vercel or Cloudflare environment variables.

**Context:**
- **Exposed during the March hackathon:**
  - Google Maps key `AIzaSyADf1…`. It also sits in git history: it was committed to `index.html` before the build-time injection was added.
  - BestTime private and public keys.
  - The Raspberry Pi proxy key.
- **Status:** Unknown whether any were revoked.
- **Confirmed in git history** (audit, 2026-10-06): a Google key starting `AIzaSy` appears in three commits:
  - `4e58cca` on `main`: key added
  - `54e1d6e` on `main`: key removed
  - `991771f` on branch `cursor/map-and-data-foundation-e70f`: key added
- No `pri_` or `pub_` strings are in history; the BestTime keys only leaked through chat.
- **Fix:** Rotate the Google key; rewriting history isn't needed once it's revoked. Delete the stale `cursor/map-and-data-foundation-e70f` branch.
- **Google key restrictions:**
  - HTTP referrers: `quiet-cup.vercel.app/*` and `*.vercel.app/*`.
  - APIs: only the ones we use.
- **Server-side key:** Places API (New) server calls need a separate key, with no referrer restriction but locked to the Places API. Never expose it to the browser.

### QC-003 · Lock in the engineering rules
`in progress` (PR #8, branch `docs/framework-reset`) · Added 2026-10-06

**Outcome:** `claude.md` in the repo enforces how Cursor works, so the March incident of an unreviewed merge to `main` can't happen again.

**Context:** Add these rules:
- Never merge, and never push to `main`.
- Work on a branch, open a draft PR, list the changed files, then stop.
- No Vercel-only APIs, so the code stays portable to Cloudflare.
- Keep arithmetic and scoring logic in our own code, never in a model.

Existing rules to keep:
- Read `planning.md` and `tasks.md` at the start of every session.
- Mark tasks done with a date.

Also:
- This backlog replaces the contents of `tasks.md`, so the four-file framework (PRD, `claude.md`, `planning.md`, `tasks.md`) stays intact.
- Every prompt from the PM to Cursor is one copy-paste block. Every Cursor reply ends with a receipt: branch, PR link, files changed, done, blocked.
- Add an `AGENTS.md` that points to `claude.md`. Cursor loads `AGENTS.md` automatically; it doesn't load `claude.md` on its own.
- Remove "Street Whisperer" naming wherever it remains.

---

## P1: The rebuild

### QC-010 · Prove that Jev can judge a café from its reviews
`todo` · Added 2026-10-06

**Outcome:** Before building anything, we run 40 cafés we already know (20 in Calgary, 20 in Tokyo) through Jev and compare its answers with ours. The result is a clear go or no-go on review-based scoring.

**Context:**
- **What Jev is:** TypeSafe AI's "System One" decision model, launched 2026-09-15.
  - Input: a state (text or JSON) plus questions.
  - Question types: Choice (pick from options), Score (a position on a scale) and Noul (yes/no probability).
  - Returns calibrated probabilities instead of text.
- **Availability and cost:**
  - Available on Vercel AI Gateway, which our credits cover, and on Cloudflare Workers AI.
  - Claimed 40–400× cheaper than chat models for classification; output tokens are free.
- **Version:** Pin `jev-1.13.x`. The model is weeks old and third-party evaluation is thin.
- **Questions to test:**
  - laptops allowed
  - outlets
  - wifi
  - time limit
  - quietness (Score)
  - venue type: work-friendly / kid / party / neither (Choice)
- **Tokyo review keywords:** 電源 / コンセント (outlets), 作業 (working), PC禁止 (no laptops), 時間制限 (time limit), Wi-Fi.
- **Pass bar:** About 80% agreement on high-confidence answers, and honest low confidence where we're unsure.
- Raj supplies the ground-truth judgements.
- **Sources:** firecrawl.dev/blog/what-is-jev, greennode.ai/blog/what-is-jev, arxiv 2609.37647.

### QC-011 · Move to Google Places API (New)
`todo` · Added 2026-10-06

**Outcome:** Café search and details use Google's current API. A brand-new Google Cloud project works, and the app no longer depends on deprecated tools.

**Context:**
- **What's deprecated:** `PlacesService.nearbySearch` and `Autocomplete` (legacy) have not been available to new customers since 2025-03-01. `google.maps.Marker` is also deprecated; replace it with `AdvancedMarkerElement`.
- **Fields we need from the new API:**
  - `servesCoffee`
  - `dineIn`
  - `currentOpeningHours`
  - `goodForChildren`
  - `menuForChildren`
  - `liveMusic`
  - `goodForWatchingSports`
  - `servesCocktails`
  - `goodForGroups`
  - `restroom`
  - `reviews`
  - `reviewSummary` (AI-generated; regional availability is limited)
- **Pricing:** Review and summary fields sit in higher-priced tiers with smaller free monthly caps. Request them only when a café needs scoring, never on every search.
- **Unverified:** Google's terms may require Places data to appear on a Google map. If so, we keep the Google Maps map and don't switch to MapLibre. Check before any map-stack change.

### QC-012 · Exclude kid, party and sports venues
`todo` · Added 2026-10-06

**Outcome:** No result ever sends someone with a laptop to a family café, a bar with live music, or a sports screen.

**Context:**
- **Hard exclude** if any of these is true: `goodForChildren`, `menuForChildren`, `liveMusic` or `goodForWatchingSports`.
- **Soft penalty** for `servesCocktails` and `goodForGroups`.
- **Second check:** Jev's venue-type Choice from QC-010 catches places the flags miss, such as a café that hosts parties or has a play area.
- **Missing flags:** A missing flag means "unknown", not "false". Leave the decision to the Jev result.

### QC-013 · Score every café for work-friendliness
`todo` · Added 2026-10-06

**Outcome:** Each café gets a 0–100 work score with evidence the user can see, for example "Outlets: likely, mentioned in 4 reviews." It works in any language.

**Context:**
- **Pipeline:** Fetch reviews → run one Jev call over them (questions from QC-010) → combine the answers into a score in our own code → store the score and evidence.
- **Low confidence:** Show "Unknown", never a guess.
- **Inputs to the score:**
  - laptop policy (a time limit or a laptop ban is close to disqualifying)
  - outlets
  - wifi
  - quietness
  - venue type
  - open-hours runway (minutes until closing)
- **When to score:** The first time a café is viewed, then re-score every 30 days.
- **No LLM needed:** The evidence shown to users is quoted review snippets, so no text generation is required.

### QC-014 · Cache scores so cost grows with cafés, not visitors
`todo` · Added 2026-10-06

**Outcome:** Each café is scored about once a month however many people view it. Google and model costs stay predictable.

**Context:**
- **March lesson:** BestTime credits were exhausted in one evening. The app fetched about 40 calls per map view, and the cache lived in memory, so it vanished whenever the function restarted.
- **Store options:** Upstash Redis (on both Vercel and Cloudflare) or Cloudflare KV.
- **Portability:** Put the cache behind a small interface so either store works.
- **Cache key:** Google `place_id`, which is stable.
- **TTL:** 30 days for scores; 24 hours for place details.
- **Open question:** Confirm whether Marketplace Redis is billed against our Vercel credits.

### QC-015 · Show whether a café is open, and for how long
`todo` · Added 2026-10-06

**Outcome:** Closed cafés never look like the best option. Cafés closing within 60 minutes are flagged, because you can't start a session there.

**Context:**
- **Current bug:** `venueOpen` is hard-coded to null, so a closed café reads as quiet and gets a green pin. This is the worst possible failure for this product.
- **Fix:** Use `currentOpeningHours` from Places API (New).
- **Time zone:** Compute "minutes until close" in the café's own local time, using `utcOffsetMinutes` from Places. This also fixes the UTC bug.

### QC-016 · Retire BestTime
`todo` · Added 2026-10-06

**Outcome:** BestTime and its code are removed. Crowd information comes from our own signals instead (QC-030).

**Context:**
- **Why:** The free credits ran out on 2026-03-25. BestTime returned 404s for low-volume indie cafés (for example Particle Coffee, 831 17 Ave SW). Paid plans start around $29/month.
- **No substitute exists on our hosting:**
  - Google popular times is not in any official API.
  - Scraping it from Vercel or Cloudflare is blocked, because Google rejects datacenter IPs.
  - The Pi route was ruled out by our no-servers constraint.
- **What to delete:**
  - `api/busyness.js`
  - the forecast/live logic
  - the env vars `BESTTIME_PRIVATE_KEY` and `BESTTIME_PUBLIC_KEY`
- **Audit note (2026-10-06):** The code reads only `BESTTIME_PRIVATE_KEY` (`api/busyness.js:148`). `BESTTIME_PUBLIC_KEY` is not read anywhere in the repo; remove it from the Vercel project settings if it is set there.

### QC-017 · Fix the startup and location behaviour
`todo` · Added 2026-10-06

**Outcome:** The app makes one search, at the user's actual location. If location is denied, it falls back sensibly.

**Context:**
- **Current behaviour (per the audit):** The app searches San Francisco first, then searches again once geolocation returns, which wastes API calls.
- **Fix:**
  1. Wait for geolocation.
  2. If it's denied, use Vercel's or Cloudflare's IP geolocation headers.
  3. As a last resort, use Calgary (51.0447, -114.0719).

### QC-018 · Protect the server endpoints
`todo` · Added 2026-10-06

**Outcome:** Strangers can't run up our Google or model bills by calling our API directly.

**Context:**
- **Current gap:** `/api/busyness` has no origin check and no rate limit.
- **Fix:**
  - Check the origin.
  - Add a per-IP rate limit using the same cache store as QC-014.
  - Set daily quota caps in Google Cloud Console as a backstop.

### QC-019 · Lint, tests and docs that match the code
`todo` · Added 2026-10-06

**Outcome:** Every PR runs lint and tests. The docs describe the code that actually exists.

**Context:**
- **`CI_POLICY.md` (confirmed, 65 lines) requires:**
  - GitHub Actions stays disabled.
  - Checks run on Vercel or Cloudflare only.
  - No extra spending.
  - Lint and tests must actually run; a green deploy doesn't count.
  - `[skip ci]` only for reviewed docs-only commits.
  - A release stays blocked if checks or zero-spend can't be verified.
- **Current gap:** No lint or tests exist.
- **Test first:**
  - scoring arithmetic
  - opening-hours runway
  - time-zone handling
  - exclusion rules
- **Docs out of date:**
  - `PRD.md` says there is no `package.json`.
  - `planning.md` says pins aren't pre-fetched, but they are.
- **Production CSS:** Replace the Tailwind CDN script with plain CSS or a proper build.

### QC-020 · Redesign the map and list views around work-friendliness
`todo` · Added 2026-10-06

**Outcome:** At a glance, the map shows where the good places to work are. A list view, sorted best-first, makes them easy to compare. Filters cover outlets, wifi, quiet and "open 2+ hours".

**Context:**
- **Starting point:** Ines's hackathon wireframe (list view: coloured dot, name, walk time, opening hours, filter popover).
- **Earlier design critique:**
  - cards were too heavy
  - the dot was too dominant
  - the popover floated with no anchor
  - there was no map/list toggle
- **Current pins:** Labels use a margin hack. The detail panel is capped at 40% of the screen height, doesn't scroll and has no close control.
- **Change the colour meaning:** Pins currently encode crowd level; they should encode the work score.

---

## P2: After launch

### QC-030 · One-tap reports from people in the café
`todo` · Added 2026-10-06

**Outcome:** Anyone sitting in a café can report "busy now", "outlets: yes/no" or "laptops OK" in one tap. Reports confirm or correct the scored data in real time.

**Context:**
- **Why this matters:** This is the only free source of live crowd data available on our hosting.
- **Where it pays off first:** Busy areas (downtown Calgary, Shinjuku), because reports need a minimum number of users per area.
- **Reports beat scores:** Recent reports override Jev scores for 2–4 hours (crowd) or 30 days (amenities).
- **Data:** Store reports in the same cache or database. No accounts at first; use a device token and a rate limit.
- **Precedent:** Dengen Cafe, a Japanese app, built its whole outlet database from user and shop submissions.

### QC-031 · Known chain policies
`todo` · Added 2026-10-06

**Outcome:** Big chains get sensible defaults even with few reviews. For example, many Japanese Starbucks, Tully's and Doutor branches have outlets.

**Context:**
- **Design:** A small table of chain → default amenity probabilities, overridden by branch-level evidence.
- **Source material:** Japanese power-café (電源カフェ) sites list chains with outlets, such as Starbucks, Tully's, Doutor, Komeda, Renoir and Saint Marc.
- **Rule:** Never present a default as fact; label it "typical for this chain".

### QC-032 · Install it like an app
`todo` · Added 2026-10-06

**Outcome:** People can add Quiet Cup to their phone's home screen and it opens full-screen, like a native app.

**Context:**
- **What's needed:** Web app manifest, icons, `theme-color` and a service worker for offline shell caching.
- **Current state:** No `apple-touch-icon` exists yet. This was already listed in the March polish milestone.

---

## P2: Beyond cafés

### QC-050 · Decide whether the name still fits
`todo` · Added 2026-10-06

**Outcome:** We confirm the product name before building pages, city guides or a brand around it.

**Context:**
- "Quiet Cup" describes cafés. The product now covers coworking spaces, booths, restaurants and bars.
- Decide before QC-040 and QC-041, because those create public, indexed URLs.
- Owner: Raj.

### QC-051 · Restaurants and bars that welcome laptops
`todo` · Added 2026-10-06

**Outcome:** Restaurants and bars appear when they tolerate laptops, and only during the hours they do (for example, a bar that's quiet and laptop-friendly before 17:00).

**Context:**
- Reuse the QC-013 pipeline. Add a Jev question: "When are laptops OK?" with choices such as all day, off-peak only, never.
- QC-012 exclusions apply in full: sports, live music, kid-focused.
- Off-peak windows come from opening hours plus review evidence. Treat them as estimates and label them that way.

### QC-052 · Coworking spaces with prices
`todo` · Added 2026-10-06

**Outcome:** A visitor sees nearby coworking spaces with day-pass and hourly prices, in local currency, before they walk in.

**Context:**
- **Discovery:** Check whether Places API (New) has a coworking place type. Unverified.
- **Pricing:** No standard API exists. Prices sit on each operator's website.
  - Extracting a number is a text task, not a decision, so use an LLM through AI Gateway, not Jev. Our credits cover it.
  - Store each price with its source URL and the date it was read. Re-check every 30 days.
  - Never show a price older than 90 days without a warning.
- **Precedent:** Japanese work-café guides already list coworking prices next to cafés (for example, SHARE LOUNGE in Shibuya at ¥1,000/hour, before tax).

### QC-053 · Bookable work booths
`todo` · Added 2026-10-06

**Outcome:** In cities that have them, private work booths appear on the map with price and a link to book.

**Context:**
- **Market:** Japan has station and city booth networks, such as JR East's STATION BOOTH and Telecube. Exact coverage and pricing are unverified.
- **Data:** Comes from each operator. Check for a public location list or partner API first. Scraping an operator's site from Vercel or Cloudflare may be blocked or forbidden by its terms.
- **Booking:** Link out to the operator. Don't handle payments.

### QC-054 · Check the competition
`todo` · Added 2026-10-06

**Outcome:** Before we pitch "no app does this", we know what exists and where it falls short.

**Context:**
- A Japanese contact says no app exists for finding outlets (コンセント). Japanese apps and sites do exist, but they look like user-submitted lists focused on chains:
  - Dengen Cafe (dengen-cafe.com): iOS app, built from user and shop submissions.
  - Hack Space (hack-space.com): user-submitted.
  - Whether they're still maintained is unverified.
- Also review global apps for remote workers and coworking directories.
- Our angle to test: AI-scored evidence, any place type, every city, with prices.

---

## P3: Ambitious bets

### QC-040 · A page for every good café
`todo` · Added 2026-10-06

**Outcome:** Each scored café gets a public, shareable page (for example "Work at [café name], Shinjuku: outlets ✓, quiet, open until 23:00"). People find Quiet Cup through search engines, not just the app.

**Context:**
- **Data:** Built from the QC-013 cache. Pages are static or regenerated on demand, so they cost almost nothing on Vercel.
- **Check first:** Google Places terms limit how long Places content can be stored and redisplayed. Store `place_id` and our own scores freely, but review Google's caching rules for names, addresses and review snippets.

### QC-041 · City guides: "Best places to work in Tokyo"
`todo` · Added 2026-10-06

**Outcome:** Curated, auto-updated rankings per city and neighbourhood. These give the brand something to share and drive traffic.

**Context:**
- **Builds on:** QC-040.
- **Ranking:** Work score, plus how many reports confirm it (QC-030).
- **Launch cities:** Calgary and Vancouver (where Raj spends time) and Tokyo (the anchor use case).

### QC-042 · Smart suggestions: "Where should I go for the next 3 hours?"
`todo` · Added 2026-10-06

**Outcome:** The user sets session length, time needed for calls, and walking distance. Quiet Cup picks the best café for that session, not just the nearest decent one.

**Context:**
- **Mostly our own code:** The result is a ranking from score, open-hours runway, distance and recent reports.
- **Jev's role:** Jev can rerank a shortlist against the user's stated needs. Independent research has tested Jev for recommendation reranking (arxiv 2609.40241).

### QC-043 · Let cafés confirm their own details
`todo` · Added 2026-10-06

**Outcome:** Café owners can verify outlets, wifi and their laptop policy. This adds a trusted data source, and later a business model.

**Context:**
- **Signal value:** Owner-confirmed data is a strong signal, but it can be gamed. Weight it below recent user reports.
- **Prerequisite:** Needs some form of verification, such as a Google Business Profile link.
- **Revenue:** Deferred until we have usage.

---

## Done

Completed items carried over from the previous `tasks.md` (March 2026 hackathon build), with their original completion dates.

- ✅ **2026-03-26** — Map-first fullscreen UI with **Google Maps** + **Places** (`nearbySearch` cafés, **800 m** radius).
- ✅ **2026-03-26** — **Geolocation** with **SF fallback** and user-facing error messaging.
- ✅ **2026-03-26** — **Places Autocomplete** search pill; pans map and **re-runs** café search.
- ✅ **2026-03-26** — **Custom SVG circle markers** colored by busyness (green / amber / red); default moderate before data.
- ✅ **2026-03-26** — **Bottom sheet** on marker tap: name, address, live %, label, **24-hour** forecast chart for today.
- ✅ **2026-03-26** — **`api/busyness.js`**: BestTime **forecast** + **live**, **`day_raw` → clock hours**, flexible live field parsing, **30 min** in-memory cache.
- ✅ **2026-03-26** — **`vercel.json`** SPA fallback to **`/api`** (injected shell) + **`/api/*`** handlers (**`index.template.html`**, not static **`index.html`**).
- ✅ **2026-03-26** — Root docs: **`PRD.md`**, **`claude.md`**, **`planning.md`**, **`tasks.md`**.
- ✅ **2026-03-26** — **Marker labels** — busyness number (or **`?`**) in white, centered in the circle marker SVG.
- ✅ **2026-03-26** — **Graceful BestTime failure** — API returns **`noData`** payload; sheet shows venue + “No busyness data available”, no meter/chart.
- ✅ **2026-03-26** — **Pre-enrichment** — After each Places café search, **`/api/busyness`** is called for every result in the background (**200 ms** stagger, **`Promise.allSettled`**); markers update color + number as each response arrives.
- ✅ **2026-03-26** — **Venue name labels** — Each marker uses **`google.maps.Marker`** **`label`** (**`className: 'marker-label'`**, 11px **DM Sans**, **`#333`**) with pill CSS in **`index.template.html`** (no **InfoWindow**).
