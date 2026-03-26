"use client";

import { BusynessChart } from "@/components/BusynessChart";
import type { CafePlace } from "@/hooks/usePlaces";

export type BusynessDetail = {
  live: number | null;
  forecastThisHour: number | null;
  forecastDay: number[];
  label: string;
  venueOpen: string | null;
  loading: boolean;
  error: string | null;
};

type Props = {
  open: boolean;
  place: CafePlace | null;
  detail: BusynessDetail | null;
  onClose: () => void;
};

export function BottomSheet({ open, place, detail, onClose }: Props) {
  if (!open || !place) return null;

  const now = new Date();
  const currentHour = now.getHours();

  return (
    <>
      <button
        type="button"
        aria-label="Close details"
        className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[2px]"
        onClick={onClose}
      />
      <div
        className="fixed inset-x-0 bottom-0 z-50 max-h-[40vh] rounded-t-3xl border border-black/5 bg-white/85 shadow-[0_-8px_40px_rgba(0,0,0,0.12)] backdrop-blur-xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="sheet-title"
      >
        <div className="mx-auto flex w-full max-w-lg flex-col gap-3 px-5 pb-6 pt-3">
          <div className="mx-auto h-1 w-10 rounded-full bg-black/15" />
          <div>
            <h2
              id="sheet-title"
              className="text-lg font-semibold tracking-tight text-black/90"
            >
              {place.name}
            </h2>
            <p className="mt-0.5 text-sm text-black/55">{place.address}</p>
          </div>

          {(detail == null || detail.loading) && (
            <p className="text-sm text-black/50">Loading busyness…</p>
          )}
          {detail?.error && (
            <p className="text-sm text-red-600/90">{detail.error}</p>
          )}
          {detail && !detail.loading && !detail.error && (
            <>
              <div className="flex flex-wrap items-baseline gap-2">
                <span className="text-3xl font-semibold tabular-nums text-black/90">
                  {detail.live != null
                    ? `${Math.round(detail.live)}%`
                    : detail.forecastThisHour != null
                      ? `${Math.round(detail.forecastThisHour)}%`
                      : "—"}
                </span>
                <span className="text-sm text-black/50">live busyness</span>
                {detail.venueOpen && (
                  <span className="ml-auto rounded-full bg-black/5 px-2 py-0.5 text-xs font-medium text-black/60">
                    {detail.venueOpen}
                  </span>
                )}
              </div>
              <p className="text-sm font-medium text-black/70">{detail.label}</p>
              <div>
                <p className="mb-1 text-xs font-medium uppercase tracking-wide text-black/40">
                  Today (by hour)
                </p>
                <BusynessChart
                  hourly={detail.forecastDay}
                  currentHour={currentHour}
                />
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
