# Quiet Cup — Tasks

## Completed

- ✅ **2026-03-26** — Map-first fullscreen UI with **Google Maps** + **Places** (`nearbySearch` cafés, **800 m** radius).
- ✅ **2026-03-26** — **Geolocation** with **SF fallback** and user-facing error messaging.
- ✅ **2026-03-26** — **Places Autocomplete** search pill; pans map and **re-runs** café search.
- ✅ **2026-03-26** — **Custom SVG circle markers** colored by busyness (green / amber / red); default moderate before data.
- ✅ **2026-03-26** — **Bottom sheet** on marker tap: name, address, live %, label, **24-hour** forecast chart for today.
- ✅ **2026-03-26** — **`api/busyness.js`**: BestTime **forecast** + **live**, **`day_raw` → clock hours**, flexible live field parsing, **30 min** in-memory cache.
- ✅ **2026-03-26** — **`vercel.json`** SPA rewrite for static **`index.html`** + `/api/*` functions.
- ✅ **2026-03-26** — Root docs: **`PRD.md`**, **`claude.md`**, **`planning.md`**, **`tasks.md`**.
- ✅ **2026-03-26** — **Marker labels** — busyness number (or **`?`**) in white, centered in the circle marker SVG.
- ✅ **2026-03-26** — **Graceful BestTime failure** — API returns **`noData`** payload; sheet shows venue + “No busyness data available”, no meter/chart.
- ✅ **2026-03-26** — **Pre-enrichment** — After each Places café search, **`/api/busyness`** is called for every result in the background (**200 ms** stagger, **`Promise.allSettled`**); markers update color + number as each response arrives.
- ✅ **2026-03-26** — **Venue name labels** — Each marker gets a persistent **`InfoWindow`** (**`disableAutoPan: true`**) with a small white pill (11px **DM Sans**) showing the café name under the dot.

## Up Next

- [ ] **BestTime open/closed** — Populate **`venueOpen`** (or equivalent) from **`day_info`** / **`venue_open_close_v2`** instead of always `null` in `api/busyness.js`; surface in the bottom sheet badge when meaningful.
- [ ] **List view** — Scrollable list of nearby cafés (name, distance, busyness snippet) synced with map results.
- [ ] **Map / list toggle** — UI control to switch or split between map-first and list-first layouts (mobile-friendly).
- [ ] **Filter bottom sheet** — Filters (e.g. radius, “open now”, busyness threshold) applied to Places results or client-side list.
- [ ] **Deploy to Vercel** — Project wired with env **`BESTTIME_PRIVATE_KEY`**; document/inject **Maps** key safely (referrer-restricted browser key); verify **`/api/busyness`** and **`index.html`** on production origin.
