# Quiet Cup — Product Requirements

Source: the "Product definition" and "Constraints" sections of `tasks.md` (backlog of 2026-10-06). Item numbers (QC-xxx) point to the backlog entries that hold the detail.

**Status labels**

- **built**: in the code on `main` today.
- **Phase 1**: in the current rebuild (P0 and P1 items). Cafés only.
- **later**: after launch (P2 and P3 items), including place types other than cafés.

## Product

Quiet Cup helps anyone who is new to a city, or just passing through, find a place to open a laptop and work, undisturbed, right now, anywhere in the world.

A place counts if the business doesn't mind laptops:

| Place type | Status |
|------------|--------|
| Cafés and coffee shops | **Phase 1** (the current app finds cafés but doesn't judge them for work) |
| Restaurants and bars, at times when they tolerate laptops (QC-051) | **later** |
| Coworking spaces, with day-pass and hourly prices (QC-052) | **later** |
| Bookable work booths, such as station booths in Japan (QC-053) | **later** |

A good result has all of these: it's open long enough for a session; laptops are welcome; there are outlets and wifi; it's quiet enough to concentrate; you can probably get a seat, or book one; and for paid spaces, you know the price first.

Kid-focused, party, sports and live-music venues are excluded.

### What ships today (built)

The March 2026 hackathon build is a map of nearby cafés coloured by crowd level from BestTime. The audit in `planning.md` ("Current state (2026-10-06)") lists its confirmed bugs. Phase 1 replaces crowd level with a work score and retires BestTime (QC-016).

## Users

- **Traveller:** visiting a city for a few days, needs a place to work between meetings, doesn't know the neighbourhood or the language.
- **Newcomer:** recently moved, hasn't found "their" café yet.
- **Commuter in transit:** has an hour or two between trains and needs a seat, an outlet and quiet, possibly bookable.

## User stories

| # | As a… | I want to… | So that… | Status |
|---|-------|-----------|----------|--------|
| US-1 | visitor | see places near me on a map as soon as I open the app | I don't have to search first | **built** (cafés, Google Maps; with a wasted second search and a San Francisco fallback, fixed in QC-017) |
| US-2 | visitor | search for another area or address | I can plan ahead for where I'll be | **built** (legacy Autocomplete; moves to the current API in QC-011) |
| US-3 | worker | see at a glance which places are good to work in | I can pick one without opening each | **Phase 1** (pins encode the work score, QC-013, QC-020) |
| US-4 | worker | know whether a place is open, and for how long | I don't walk to a closed café or one closing in 20 minutes | **Phase 1** (QC-015) |
| US-5 | worker | see whether laptops are welcome, and whether there are outlets and wifi, with the evidence | I can trust the result | **Phase 1** (QC-010, QC-013) |
| US-6 | worker | see "Unknown" when the app isn't sure | I'm never misled by a guess | **Phase 1** (QC-013) |
| US-7 | worker | never be sent to a kid-focused, party, sports or live-music venue | I don't arrive somewhere loud | **Phase 1** (QC-012) |
| US-8 | worker | compare places in a list sorted best-first, and filter by outlets, wifi, quiet and "open 2+ hours" | I can choose quickly | **Phase 1** (QC-020) |
| US-9 | worker | tap a place to see its details | I can decide before walking over | **built** (bottom sheet with crowd level and hourly chart); **Phase 1** redesign around the work score (QC-020) |
| US-10 | person in a café | report "busy now", "outlets yes/no" or "laptops OK" in one tap | the next person gets live information | **later** (QC-030) |
| US-11 | visitor | add Quiet Cup to my home screen | it opens like an app | **later** (QC-032) |
| US-12 | visitor | see coworking prices and bookable booths before I go | I know the cost up front | **later** (QC-052, QC-053) |
| US-13 | visitor | ask "where should I go for the next 3 hours?" | the app picks for my session, not just by distance | **later** (QC-042) |
| US-14 | anyone | find a public page for a good café, or a city guide, from a search engine | I can discover Quiet Cup without the app | **later** (QC-040, QC-041) |
| US-15 | café owner | confirm my outlets, wifi and laptop policy | my listing is accurate | **later** (QC-043) |

## Technical requirements

### Hosting and platform

| Requirement | Status |
|-------------|--------|
| Runs on Vercel or Cloudflare only. No servers, no Raspberry Pi, no self-managed infrastructure. | **built** (Vercel static page plus one function) |
| The same code runs on both Vercel and Cloudflare; no platform-only APIs. | **Phase 1** (`api/busyness.js` is Vercel-only today and is deleted in QC-016) |
| Secrets live only in Vercel or Cloudflare environment variables; every exposed key is rotated. | **Phase 1** (QC-002) |
| Browser Google key restricted by HTTP referrer and API; a separate server key, locked to the Places API, for server calls. | **Phase 1** (QC-002) |

### Data

| Requirement | Status |
|-------------|--------|
| Café search and details from Google Places. | **built** (legacy `PlacesService`) |
| Use Google Places API (New) and `AdvancedMarkerElement`, so a new Google Cloud project works. | **Phase 1** (QC-011) |
| Request review and summary fields only when a café needs scoring, never on every search. | **Phase 1** (QC-011) |
| Opening hours and "minutes until close" from `currentOpeningHours`, in the café's own time zone (`utcOffsetMinutes`). | **Phase 1** (QC-015) |
| Startup makes one search, at the user's location; falls back to IP geolocation, then Calgary. | **Phase 1** (QC-017) |
| Crowd level from BestTime. | **built**; removed in **Phase 1** (QC-016) |
| Chain defaults for amenities, labelled "typical for this chain". | **later** (QC-031) |
| User reports override scores for 2–4 hours (crowd) or 30 days (amenities). | **later** (QC-030) |
| Coworking prices stored with source URL and date; warning when older than 90 days. | **later** (QC-052) |

### Scoring

| Requirement | Status |
|-------------|--------|
| Validate Jev on 40 known cafés (20 Calgary, 20 Tokyo) before building on it. Pin `jev-1.13.x`. | **Phase 1** (QC-010) |
| Hard-exclude kid, live-music and sports venues from Places flags; soft-penalise cocktails and groups; a missing flag means "unknown". | **Phase 1** (QC-012) |
| A 0–100 work score from laptop policy, outlets, wifi, quietness, venue type and open-hours runway, with quoted review evidence. | **Phase 1** (QC-013) |
| Scoring arithmetic and combination logic run in our own code, never in a model. | **Phase 1** (QC-013; rule 7 in `claude.md`) |
| Low-confidence answers display "Unknown". | **Phase 1** (QC-013) |

### Cost control and safety

| Requirement | Status |
|-------------|--------|
| Persistent cache keyed by `place_id`: scores 30 days, place details 24 hours; Upstash Redis or Cloudflare KV behind one interface. | **Phase 1** (QC-014; today's cache is in memory and lost on restart) |
| Server endpoints check the origin and rate-limit per IP; daily quota caps in Google Cloud Console. | **Phase 1** (QC-018) |

### Quality and process

| Requirement | Status |
|-------------|--------|
| Lint and tests run on every PR on Vercel or Cloudflare (GitHub Actions stays disabled, per `CI_POLICY.md`). Test scoring arithmetic, opening-hours runway, time zones and exclusion rules first. | **Phase 1** (QC-019) |
| Production CSS instead of the Tailwind CDN script. | **Phase 1** (QC-019) |
| All work goes through draft PRs reviewed by Raj; Cursor never merges or pushes to `main`. | **Phase 1** (rules in `claude.md`, QC-003, this PR) |

## Budget

| Item | Covered by | Limit |
|------|-----------|-------|
| Hosting, functions, AI Gateway (Jev, LLM extraction) | Vercel startup credits | $2,400, to be used within 12 months |
| Google Maps Platform (map, Places) | Billed separately, **not** covered by the credits | Keep within free monthly caps where possible; daily quota caps as a backstop (QC-018) |

## Success metrics

| Metric | Target | Source |
|--------|--------|--------|
| Jev agreement with Raj's judgements on high-confidence answers | About 80%, with honest low confidence elsewhere (go/no-go gate) | QC-010 |
| Closed cafés shown as a top option | Never | QC-015 |
| Excluded venue types (kid, party, sports, live music) shown as results | Never | QC-012 |
| Scoring calls per café | About one per 30 days, however many people view it | QC-014 |
| Searches per app open | One | QC-017 |
| Vercel spend | Within the $2,400 credits over 12 months | Constraints |
| Unauthenticated calls that reach Google or the model | Blocked by origin check and rate limit | QC-018 |
| PRs with lint and tests run | Every PR | QC-019 |

## Out of scope for Phase 1

- Place types other than cafés (QC-051 to QC-053).
- Accounts, favourites and payments. Booths link out to the operator (QC-053).
- Live crowd data. No legitimate free source exists on our hosting until user reports (QC-030).
- Renaming the product; decided separately in QC-050.
