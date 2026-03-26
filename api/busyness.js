const BESTTIME_FORECAST_URL = "https://besttime.app/api/v1/forecasts";
const BESTTIME_LIVE_URL = "https://besttime.app/api/v1/forecasts/live";

const cache = new Map();
const CACHE_TTL_MS = 1000 * 60 * 30;

function busynessLabel(pct) {
  if (pct < 20) return "Very quiet right now";
  if (pct < 40) return "Not too busy";
  if (pct < 60) return "A little busy";
  if (pct < 80) return "Usually busy";
  return "Very busy right now";
}

function dayRawToClockHours(dayRaw) {
  if (!dayRaw || dayRaw.length !== 24) {
    return Array.from({ length: 24 }, () => 0);
  }
  const out = Array.from({ length: 24 }, () => 0);
  for (let i = 0; i < 24; i++) {
    const clockHour = (6 + i) % 24;
    out[clockHour] = dayRaw[i] ?? 0;
  }
  return out;
}

function getTodayAnalysis(forecast) {
  const list = forecast.analysis;
  if (!list || !list.length) return undefined;
  const jsDay = new Date().getDay();
  const monday0Sunday6 = jsDay === 0 ? 6 : jsDay - 1;
  return (
    list.find((a) => a.day_info && a.day_info.day_int === monday0Sunday6) ||
    list[0]
  );
}

function extractLiveNumbers(live) {
  const a = live.analysis;
  let obj;
  if (Array.isArray(a) && a[0] && typeof a[0] === "object") {
    obj = a[0];
  } else if (a && typeof a === "object" && !Array.isArray(a)) {
    obj = a;
  }
  const nested =
    obj && typeof obj.analysis === "object" && obj.analysis !== null
      ? obj.analysis
      : obj;

  function pickNum(...keys) {
    for (const k of keys) {
      const v = (nested && nested[k]) ?? (obj && obj[k]);
      if (typeof v === "number" && !Number.isNaN(v)) return v;
      if (typeof v === "string" && v.trim() !== "") {
        const n = Number(v);
        if (!Number.isNaN(n)) return n;
      }
    }
    return null;
  }

  return {
    live: pickNum(
      "venue_live_busyness",
      "venue_live_busyness_percentage",
      "live_busyness"
    ),
    forecastHour: pickNum(
      "venue_forecasted_busyness",
      "forecasted_busyness",
      "venue_forecast_busyness"
    ),
  };
}

function buildParams(apiKeyPrivate, venueName, venueAddress) {
  const p = new URLSearchParams();
  p.set("api_key_private", apiKeyPrivate);
  p.set("venue_name", venueName);
  p.set("venue_address", venueAddress);
  return p;
}

async function requestNewForecast(apiKeyPrivate, venueName, venueAddress) {
  const url = `${BESTTIME_FORECAST_URL}?${buildParams(
    apiKeyPrivate,
    venueName,
    venueAddress
  )}`;
  const res = await fetch(url, { method: "POST" });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`BestTime forecast failed: ${res.status} ${text}`);
  }
  return res.json();
}

async function requestLiveBusyness(apiKeyPrivate, venueName, venueAddress) {
  const url = `${BESTTIME_LIVE_URL}?${buildParams(
    apiKeyPrivate,
    venueName,
    venueAddress
  )}`;
  const res = await fetch(url, { method: "POST" });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`BestTime live failed: ${res.status} ${text}`);
  }
  return res.json();
}

function cacheKey(name, address) {
  return `${name.trim().toLowerCase()}|${address.trim().toLowerCase()}`;
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let raw = "";
    req.on("data", (c) => {
      raw += c;
    });
    req.on("end", () => {
      try {
        resolve(raw ? JSON.parse(raw) : {});
      } catch (e) {
        reject(e);
      }
    });
    req.on("error", reject);
  });
}

module.exports = async (req, res) => {
  res.setHeader("Content-Type", "application/json");

  if (req.method !== "POST") {
    res.statusCode = req.method === "OPTIONS" ? 204 : 405;
    if (req.method !== "OPTIONS") {
      res.setHeader("Allow", "POST");
      res.end(JSON.stringify({ error: "Method not allowed" }));
    } else {
      res.end();
    }
    return;
  }

  const privateKey = process.env.BESTTIME_PRIVATE_KEY;
  if (!privateKey) {
    res.statusCode = 503;
    res.end(
      JSON.stringify({
        error: "BestTime is not configured (missing BESTTIME_PRIVATE_KEY)",
      })
    );
    return;
  }

  let body;
  try {
    body = await readJsonBody(req);
  } catch {
    res.statusCode = 400;
    res.end(JSON.stringify({ error: "Invalid JSON body" }));
    return;
  }

  const venue_name = (body.venue_name && String(body.venue_name).trim()) || "";
  const venue_address =
    (body.venue_address && String(body.venue_address).trim()) || "";

  if (!venue_name || !venue_address) {
    res.statusCode = 400;
    res.end(
      JSON.stringify({ error: "venue_name and venue_address required" })
    );
    return;
  }

  const ck = cacheKey(venue_name, venue_address);
  const hit = cache.get(ck);
  if (hit && Date.now() - hit.at < CACHE_TTL_MS) {
    res.statusCode = 200;
    res.end(JSON.stringify(hit.body));
    return;
  }

  try {
    const forecast = await requestNewForecast(
      privateKey,
      venue_name,
      venue_address
    );
    const today = getTodayAnalysis(forecast);
    const forecastDay = dayRawToClockHours(today && today.day_raw);
    const nowHour = new Date().getHours();
    const forecastThisHour =
      forecastDay[nowHour] !== undefined ? forecastDay[nowHour] : null;

    let live = null;
    try {
      const liveJson = await requestLiveBusyness(
        privateKey,
        venue_name,
        venue_address
      );
      const nums = extractLiveNumbers(liveJson);
      live = nums.live != null ? nums.live : nums.forecastHour;
    } catch {
      live = forecastThisHour;
    }

    const labelPct =
      live != null ? live : forecastThisHour != null ? forecastThisHour : 50;

    const payload = {
      live,
      forecast: forecastDay,
      forecastThisHour,
      label: busynessLabel(labelPct),
      venueOpen: null,
    };

    cache.set(ck, { at: Date.now(), body: payload });
    res.statusCode = 200;
    res.end(JSON.stringify(payload));
  } catch (e) {
    const msg =
      e instanceof Error ? e.message : "BestTime request failed";
    res.statusCode = 502;
    res.end(JSON.stringify({ error: msg }));
  }
};
