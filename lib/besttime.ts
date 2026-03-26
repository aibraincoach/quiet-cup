const BESTTIME_FORECAST_URL = "https://besttime.app/api/v1/forecasts";
const BESTTIME_LIVE_URL = "https://besttime.app/api/v1/forecasts/live";

export type BestTimeForecastResponse = {
  status?: string;
  venue_info?: {
    venue_name?: string;
    venue_address?: string;
    venue_open?: string;
    venue_id?: string;
  };
  analysis?: Array<{
    day_info?: { day_int?: number; day_text?: string };
    day_raw?: number[];
  }>;
};

export type BestTimeLiveResponse = {
  status?: string;
  venue_info?: Record<string, unknown>;
  analysis?: Record<string, unknown> | Record<string, unknown>[];
};

function buildParams(
  apiKeyPrivate: string,
  venueName: string,
  venueAddress: string
): URLSearchParams {
  const p = new URLSearchParams();
  p.set("api_key_private", apiKeyPrivate);
  p.set("venue_name", venueName);
  p.set("venue_address", venueAddress);
  return p;
}

export async function requestNewForecast(
  apiKeyPrivate: string,
  venueName: string,
  venueAddress: string
): Promise<BestTimeForecastResponse> {
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
  return res.json() as Promise<BestTimeForecastResponse>;
}

export async function requestLiveBusyness(
  apiKeyPrivate: string,
  venueName: string,
  venueAddress: string
): Promise<BestTimeLiveResponse> {
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
  return res.json() as Promise<BestTimeLiveResponse>;
}

/** BestTime day window: index 0 = 6 AM … index 23 = 5 AM next day */
export function dayRawToClockHours(dayRaw: number[] | undefined): number[] {
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

export function getTodayAnalysis(forecast: BestTimeForecastResponse) {
  const list = forecast.analysis;
  if (!list?.length) return undefined;
  const jsDay = new Date().getDay();
  const monday0Sunday6 = jsDay === 0 ? 6 : jsDay - 1;
  return (
    list.find((a) => a.day_info?.day_int === monday0Sunday6) ?? list[0]
  );
}

export function extractLiveNumbers(live: BestTimeLiveResponse): {
  live: number | null;
  forecastHour: number | null;
} {
  const a = live.analysis;
  let obj: Record<string, unknown> | undefined;
  if (Array.isArray(a) && a[0] && typeof a[0] === "object") {
    obj = a[0] as Record<string, unknown>;
  } else if (a && typeof a === "object" && !Array.isArray(a)) {
    obj = a as Record<string, unknown>;
  }
  const nested =
    obj && typeof obj.analysis === "object" && obj.analysis !== null
      ? (obj.analysis as Record<string, unknown>)
      : obj;

  const pickNum = (...keys: string[]): number | null => {
    for (const k of keys) {
      const v = nested?.[k] ?? obj?.[k];
      if (typeof v === "number" && !Number.isNaN(v)) return v;
      if (typeof v === "string" && v.trim() !== "") {
        const n = Number(v);
        if (!Number.isNaN(n)) return n;
      }
    }
    return null;
  };

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
