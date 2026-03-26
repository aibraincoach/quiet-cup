# Quiet Cup — Product Requirements (as implemented)

## Product

**Quiet Cup** is a map-first web app that helps people see how busy nearby **cafes** are. The primary signal is **crowd level** (quiet vs busy), surfaced on a fullscreen map with colored markers and a detail panel after the user taps a venue.

The repository currently ships under the working title **Street Whisperer** in the HTML `<title>`; the product name for planning and copy is **Quiet Cup**.

## User flow (implemented)

1. The app loads a **fullscreen Google Map** (mobile-friendly viewport).
2. **Browser geolocation** requests the user’s position; on failure or denial, the map centers on a **San Francisco fallback** and shows a short message.
3. **Google Places** runs **`nearbySearch`** for `type: cafe` within **800 m** of the map center.
4. **Custom SVG circle markers** (28 px, white stroke) are colored by busyness: green (quiet), amber (moderate), red (busy). Until a venue has been loaded from the API, markers use a **default moderate** color.
5. **Tapping a marker** opens a **bottom sheet** (~40% viewport height): venue name, address, live busyness percentage, a text **label** (e.g. “Usually busy”), and a **24-hour bar chart** for “today” (hourly forecast), with the current hour highlighted.
6. A **floating search pill** at the top uses **Places Autocomplete**. Choosing a place **pans** the map to that location (zoom 15) and **re-runs** the cafe search from the new center.

## Stack (what exists in this repo)

| Layer | Implementation |
|--------|----------------|
| Frontend | **Single `index.template.html`** (vanilla JS); Vercel serves it through **`api/index.js`** with env-injected Maps key. |
| Styling | **Tailwind CSS** via **CDN** (`cdn.tailwindcss.com`); **DM Sans** from Google Fonts. |
| Map | **Google Maps JavaScript API** loaded by a dynamic `<script>` tag with `libraries=places`; map options include a **minimal custom style** (muted basemap, POI labels reduced). |
| Places | **`google.maps.places`**: `PlacesService.nearbySearch`, `Autocomplete` bound to the map. |
| API key (Maps) | **`GMAPS_KEY`** in Vercel env; **`api/index.js`** replaces `GMAPS_KEY_PLACEHOLDER` in the template (browser-visible key; restrict by HTTP referrer in Google Cloud). |
| Backend | **`api/busyness.js`** — Vercel **Node** serverless function (no `package.json` in repo). |
| Busyness data | **BestTime.app** REST API: **new forecast** (`POST /api/v1/forecasts`) and **live** (`POST /api/v1/forecasts/live`) using `BESTTIME_PRIVATE_KEY` (server env only). |
| Caching | In-memory **`Map`** in the serverless handler, **~30 minutes** TTL per venue name + address key. |
| Routing / deploy | **`vercel.json`**: rewrite **`/`** and non-`/api/*` paths to **`/api`** so static hosting does not bypass key injection. |

> **Note:** An earlier iteration used **Next.js 14 App Router** and **`@googlemaps/js-api-loader`**. The **current codebase** does not include Next.js or that loader; the PRD above matches **this** tree only.

## API contract (client ↔ server)

- **Endpoint:** `POST /api/busyness`
- **Body (JSON):** `{ "venue_name": string, "venue_address": string }` (from Places: name + `vicinity` or `formatted_address`).
- **Success (JSON):** `live`, `forecast` (24 clock-hour values), `forecastThisHour`, `label`, `venueOpen` (currently **`null`** in the handler).

## Non-goals / out of scope (current build)

- No user accounts, no persisted favorites.
- No list view or map/list toggle (see `tasks.md`).
- Venue type is fixed to **cafes** for the nearby search.

## Success criteria (product)

- On a phone, a user can open the app, allow location, see nearby cafes on the map, tap one, and read **current-ish busyness** plus **today’s hourly shape** without exposing BestTime private keys to the client.
