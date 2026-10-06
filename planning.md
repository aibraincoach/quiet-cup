# Quiet Cup — Planning

## CI execution decision — 2026-09-08

Actions is disabled. [CI_POLICY.md](CI_POLICY.md) records the owner ruling,
repository evidence, retained checks and outstanding provider blockers. This
entry does not mark unverified replacement checks as passed or completed.

## Vision

Quiet Cup helps someone on their phone find a nearby café that is quiet right
now. They open the app, see cafés around them on a map, can tell at a glance
which ones are calm, and can check how busy a café usually gets through the
day before they walk over.

Principles:

- **Honest signals.** Say whether a number is live, forecast or estimated.
  Never show a closed café as "quiet".
- **Free to run.** Prefer free and open data (OpenStreetMap, Overture,
  OpenFreeMap). Keep paid calls small, cached and on demand.
- **No servers.** The app is static files plus serverless functions that run on
  Vercel or Cloudflare (see "Hosting constraint").

The product definition and prioritised backlog live in **`tasks.md`**.

## Architecture as built

```
Browser (public/index.html, built from index.template.html)
  ├─ Google Maps JS API (map, legacy PlacesService.nearbySearch, legacy Autocomplete, google.maps.Marker)
  ├─ navigator.geolocation (fallback: San Francisco)
  └─ POST /api/busyness {venue_name, venue_address}
        └─ api/busyness.js (Vercel Node function)
              ├─ BestTime POST /api/v1/forecasts       (weekly forecast)
              ├─ BestTime POST /api/v1/forecasts/live  (live reading)
              └─ in-memory Map cache, 30 min TTL (lost on cold start)
```

Flow:

1. `initMap` creates the map and runs a café search at the starting centre,
   then asks for the user's location. When location resolves or fails it
   searches again from the new centre.
2. The café search (`type: cafe`, 800 m radius) puts an amber "?" pin per
   café, then requests busyness for every café 200 ms apart.
3. Each `/api/busyness` call makes two BestTime calls (forecast and live),
   converts the 6 AM–5 AM forecast into clock hours 0–23, and returns
   `{live, forecast, forecastThisHour, label, venueOpen}`. Upstream failures
   return `{noData: true}`.
4. Tapping a pin opens a bottom sheet with the percentage, a text label and a
   24-hour bar chart for today.

### Files

| File | Role |
|------|------|
| `index.template.html` | Whole frontend: markup, Tailwind classes, inline JS. |
| `build-index.js` | `npm run build`: writes `public/index.html` with `GMAPS_KEY` substituted. |
| `api/busyness.js` | Serverless proxy to BestTime with an in-memory cache. |
| `vercel.json` | `outputDirectory: public`. |
| `package.json` | Only a `build` script. No dependencies, no tests, no lint. |

### Environment variables

| Variable | Read by | When |
|----------|---------|------|
| `GMAPS_KEY` | `build-index.js:9` | Build time; baked into the browser page. Restrict by HTTP referrer. |
| `BESTTIME_PRIVATE_KEY` | `api/busyness.js:148` | Request time; server only. |

## Tech stack

| Layer | Today |
|-------|-------|
| Frontend | One HTML file, vanilla JS (ES5 style), no bundler. |
| Styling | Tailwind CSS from `cdn.tailwindcss.com` (prototype build), DM Sans from Google Fonts. |
| Map and places | Google Maps JavaScript API with the legacy Places library. |
| Busyness data | BestTime.app (paid; 100 free credits on sign-up). |
| Backend | One Vercel Node serverless function (`module.exports = (req, res)`). |
| Storage | None. Cache is per function instance and in memory. |
| Tests / lint | None. |

## Tools

- **Git and GitHub** for code and pull requests. Work on branches; open draft PRs; never merge or push to `main` (see `claude.md`).
- **Vercel** project `quiet-cup` builds and deploys (`npm run build`). Commits tagged `[skip ci]` skip the build (documentation only).
- **GitHub Actions is disabled.** Lint and tests must run on Vercel or Cloudflare (see `CI_POLICY.md`).
- **Node** for the build script. No package manager dependencies yet.

## Hosting constraint

- Hosting is **Vercel or Cloudflare only**. No servers, VMs, containers or
  long-running processes.
- Code must run on **both** platforms. Don't use platform-only APIs. Use web
  standard `Request`/`Response`, `fetch` and `URL`, and keep any platform glue
  in a thin adapter.
- Persistent state, if needed, must use a store available from both platforms
  over HTTP (for example Upstash Redis), within free allowances.
- No additional paid usage (see `CI_POLICY.md`).

Known gap: `api/busyness.js` uses the Node `(req, res)` signature and reads the
body from the Node request stream (`api/busyness.js:117-131`, `:134`). It runs on
Vercel only and does not yet meet this constraint.

## Current state (2026-10-06)

### 1. Latest commit on `main`

- **Hash:** `3d0c13d9606146bc4efc7a52dd6787c3e6528ffe`
- **Date:** 2026-09-08 15:49:14 -0600
- **Message:** `[skip ci] docs: enforce owner CI spending policy`

### 2. Other branches and open PRs

Open PRs: **none** (checked on GitHub, 2026-10-06).

| Branch | Last commit |
|--------|-------------|
| `claude/optimistic-mayer-77tcm4` | `3d0c13d` 2026-09-08 — same as `main` |
| `cursor/busyness-data-presentation-dc0a` | `e2194da` 2026-03-26 — Show busyness on markers and no-data state in sheet |
| `cursor/google-maps-key-injection-1d33` | `f39bdd8` 2026-03-26 — docs: align PRD/planning with index.template.html and /api SPA routing |
| `cursor/google-maps-key-injection-3689` | `50a07e1` 2026-03-26 — fix(vercel): emit public/index.html and set outputDirectory |
| `cursor/map-and-data-foundation-e70f` | `991771f` 2026-03-26 — chore: set default Google Maps key in index.html |
| `cursor/map-marker-labels-9b25` | `54e1d6e` 2026-03-26 — feat(vercel): serve / via api/index.js with GMAPS_KEY injection |
| `cursor/pre-enrichment-and-labels-9229` | `4f8c76b` 2026-03-26 — Pre-enrich busyness on search; persistent venue name InfoWindows |
| `docs/no-actions-2026-09-08` | `cae8623` 2026-09-08 — [skip ci] docs: enforce owner CI spending policy |

### 3. Tracked files on `main`

| File | Lines |
|------|------:|
| `.gitignore` | 1 |
| `CI_POLICY.md` | 65 |
| `PRD.md` | 48 |
| `api/busyness.js` | 238 |
| `build-index.js` | 13 |
| `claude.md` | 63 |
| `index.template.html` | 640 |
| `package.json` | 7 |
| `planning.md` | 97 |
| `tasks.md` | 30 |
| `vercel.json` | 3 |

### 4. Environment variables the code reads

- `GMAPS_KEY` — `build-index.js:9`
- `BESTTIME_PRIVATE_KEY` — `api/busyness.js:148`

(`window.QUIET_CUP_GMAPS_KEY` at `index.template.html:39-40` is a browser
global filled from `GMAPS_KEY` at build time, not an environment variable.)

### 5. Claims checked against code on `main`

| | Claim | Verdict | Evidence |
|---|---|---|---|
| a | "Today" and "this hour" are calculated in UTC on the server. | **CONFIRMED** | `api/busyness.js:30` (`new Date().getDay()`) and `:196` (`new Date().getHours()`) use the function's local clock, which is UTC on Vercel (and Cloudflare). The client highlights the user's local hour instead (`index.template.html:414-415`), so chart and number can disagree. |
| b | `venueOpen` is always null. | **CONFIRMED** | `api/busyness.js:221` hard-codes `venueOpen: null`; the noData path (`:227-237`) omits it. The client badge (`index.template.html:408-413`) never shows. |
| c | Forecasts are labelled as "live". | **CONFIRMED** | Server sets `live` to the live endpoint's forecasted value (`api/busyness.js:207`) or to `forecastThisHour` when the live call fails (`:209-211`). Client shows it under the fixed caption "live busyness" (`index.template.html:117`, `:402-405`). |
| d | Pin colour thresholds (33/66) differ from label thresholds (20/40/60/80). | **CONFIRMED** | Colours: `index.template.html:163-167`. Labels: `api/busyness.js:7-13`. |
| e | The chart scales to the day's maximum, not 0–100. | **CONFIRMED** | `index.template.html:211-214` finds the day's max; `:219` scales each bar to `v / max`. |
| f | All failures return the same noData response. | **REFUTED** (as worded) | Request errors are distinct: 405 wrong method (`api/busyness.js:137-146`), 503 missing key (`:148-157`), 400 bad JSON (`:159-166`), 400 missing fields (`:168-178`). But **every BestTime failure** (bad key, no credits, timeout, venue not found) collapses into one identical `200 {noData: true}` (`:227-237`), which also uses different field names (`forecasted`, `hourly`) from the success shape. |
| g | The café search runs twice on startup. | **CONFIRMED** | `initMap` calls `runPlacesSearch()` (`index.template.html:614`) and then `startGeolocation()` (`:615`), whose success, error and unsupported paths all call `applyCenter()` (`:561`, `:572`, `:581`), which calls `runPlacesSearch()` again (`:548`). Each search also triggers busyness calls for every café found (`:538`). |
| h | The location fallback is San Francisco. | **CONFIRMED** | `index.template.html:139` (`37.7749, -122.4194`); messages at `:557` and `:577`. |
| i | `/api/busyness` has no origin check or rate limit. | **CONFIRMED** | The handler (`api/busyness.js:134-238`) checks method, key, body and fields only. No `Origin`/`Referer` check, no throttling, no CORS headers. Anyone can spend BestTime credits. |
| j | Legacy `PlacesService`, `Autocomplete` and `google.maps.Marker` are in use. | **CONFIRMED** | `PlacesService`: `index.template.html:495`. `Autocomplete`: `:600`. `google.maps.Marker`: `:458`, `:479`. Google stopped offering `PlacesService` and `Autocomplete` to new customers on 2025-03-01; `Marker` is deprecated in favour of `AdvancedMarkerElement`. |
| k | `CI_POLICY.md` exists. | **CONFIRMED** | `CI_POLICY.md` (65 lines, owner ruling 2026-09-08). It requires: GitHub Actions stays disabled (no enabling, dispatching or adding workflows, including self-hosted); required CI runs on Vercel or Cloudflare only, with no local fallback; no additional spending, upgrades or paid services; lint and tests must run explicitly (a green deploy is not proof); verification tied to the exact commit and preview; production data kept out of CI; `[skip ci]` only for reviewed documentation-only commits; releases stay blocked if checks or zero-spend can't be verified. |

### 6. Key-like strings in git history

Searched all branches for strings starting with `AIza`, `pri_` and `pub_`.

| Prefix | Commit | Date | On `main`? | Change |
|--------|--------|------|-----------|--------|
| `AIzaSy` | `4e58cca` (first app commit, merged as PR #1) | 2026-03-25 | Yes | Added as default `window.QUIET_CUP_GMAPS_KEY` in `index.html` |
| `AIzaSy` | `991771f` "chore: set default Google Maps key in index.html" | 2026-03-26 | No (`cursor/map-and-data-foundation-e70f`) | Added the same key |
| `AIzaSy` | `54e1d6e` "feat(vercel): serve / via api/index.js with GMAPS_KEY injection" | 2026-03-26 | Yes | Removed the key |

- One distinct Google API key (`AIzaSy…`) is in history. It is not in the
  current tree, but it remains readable in `main`'s history and on one branch.
  Treat it as exposed: rotate it, or at minimum confirm it is
  HTTP-referrer-restricted in Google Cloud.
- No `pri_` or `pub_` (BestTime) strings were found.
