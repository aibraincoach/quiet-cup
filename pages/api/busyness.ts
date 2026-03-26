import type { NextApiRequest, NextApiResponse } from "next";
import {
  dayRawToClockHours,
  extractLiveNumbers,
  getTodayAnalysis,
  requestLiveBusyness,
  requestNewForecast,
} from "@/lib/besttime";
import { busynessLabel } from "@/lib/colors";

type Body = { venue_name?: string; venue_address?: string };

type OkResponse = {
  live: number | null;
  forecast: number[];
  forecastThisHour: number | null;
  label: string;
  venueOpen: string | null;
};

const cache = new Map<string, { at: number; body: OkResponse }>();
const CACHE_TTL_MS = 1000 * 60 * 30;

function cacheKey(name: string, address: string) {
  return `${name.trim().toLowerCase()}|${address.trim().toLowerCase()}`;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<OkResponse | { error: string }>
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const key = process.env.BESTTIME_PRIVATE_KEY;
  if (!key) {
    return res.status(503).json({
      error: "BestTime is not configured (missing BESTTIME_PRIVATE_KEY)",
    });
  }

  const body = req.body as Body;
  const venue_name = body?.venue_name?.trim();
  const venue_address = body?.venue_address?.trim();
  if (!venue_name || !venue_address) {
    return res.status(400).json({ error: "venue_name and venue_address required" });
  }

  const ck = cacheKey(venue_name, venue_address);
  const hit = cache.get(ck);
  if (hit && Date.now() - hit.at < CACHE_TTL_MS) {
    return res.status(200).json(hit.body);
  }

  try {
    const forecast = await requestNewForecast(key, venue_name, venue_address);
    const today = getTodayAnalysis(forecast);
    const forecastDay = dayRawToClockHours(today?.day_raw);
    const nowHour = new Date().getHours();
    const forecastThisHour = forecastDay[nowHour] ?? null;

    let live: number | null = null;
    try {
      const liveJson = await requestLiveBusyness(key, venue_name, venue_address);
      const nums = extractLiveNumbers(liveJson);
      live = nums.live ?? nums.forecastHour;
    } catch {
      live = forecastThisHour;
    }

    const labelPct = live ?? forecastThisHour ?? 50;

    const payload: OkResponse = {
      live,
      forecast: forecastDay,
      forecastThisHour,
      label: busynessLabel(labelPct),
      venueOpen: null,
    };

    cache.set(ck, { at: Date.now(), body: payload });
    return res.status(200).json(payload);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "BestTime request failed";
    return res.status(502).json({ error: msg });
  }
}
