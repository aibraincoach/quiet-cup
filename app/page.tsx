"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";
import { BottomSheet, type BusynessDetail } from "@/components/BottomSheet";
import { SearchBar } from "@/components/SearchBar";
import type { CafePlace } from "@/hooks/usePlaces";

const MapView = dynamic(
  () => import("@/components/Map").then((m) => m.MapView),
  { ssr: false, loading: () => null }
);

export default function HomePage() {
  const [mapInstance, setMapInstance] = useState<google.maps.Map | null>(null);
  const [searchCenter, setSearchCenter] =
    useState<google.maps.LatLngLiteral | null>(null);
  const [selected, setSelected] = useState<CafePlace | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [detail, setDetail] = useState<BusynessDetail | null>(null);
  const [busynessByPlaceId, setBusynessByPlaceId] = useState<
    Record<string, number>
  >({});
  const abortRef = useRef<AbortController | null>(null);

  const onMapReady = useCallback((m: google.maps.Map) => {
    setMapInstance(m);
  }, []);

  const onSelectCafe = useCallback((cafe: CafePlace) => {
    setSelected(cafe);
    setSheetOpen(true);
  }, []);

  const closeSheet = useCallback(() => {
    setSheetOpen(false);
    abortRef.current?.abort();
    abortRef.current = null;
  }, []);

  useEffect(() => {
    if (!sheetOpen || !selected) return;
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;

    setDetail({
      live: null,
      forecastThisHour: null,
      forecastDay: Array.from({ length: 24 }, () => 0),
      label: "",
      venueOpen: null,
      loading: true,
      error: null,
    });

    (async () => {
      try {
        const r = await fetch("/api/busyness", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            venue_name: selected.name,
            venue_address: selected.address,
          }),
          signal: ac.signal,
        });
        const data = await r.json();
        if (!r.ok) {
          throw new Error(
            typeof data?.error === "string" ? data.error : "Request failed"
          );
        }
        const live = typeof data.live === "number" ? data.live : null;
        const forecastThisHour =
          typeof data.forecastThisHour === "number"
            ? data.forecastThisHour
            : null;
        const forecast = Array.isArray(data.forecast)
          ? (data.forecast as number[])
          : [];
        const day =
          forecast.length === 24
            ? forecast
            : Array.from({ length: 24 }, (_, i) => forecast[i] ?? 0);

        setDetail({
          live,
          forecastThisHour,
          forecastDay: day,
          label: typeof data.label === "string" ? data.label : "",
          venueOpen:
            typeof data.venueOpen === "string" ? data.venueOpen : null,
          loading: false,
          error: null,
        });

        const markerPct = live ?? forecastThisHour ?? 50;
        setBusynessByPlaceId((prev) => ({
          ...prev,
          [selected.placeId]: markerPct,
        }));
      } catch (e) {
        if (e instanceof Error && e.name === "AbortError") return;
        setDetail({
          live: null,
          forecastThisHour: null,
          forecastDay: Array.from({ length: 24 }, () => 0),
          label: "",
          venueOpen: null,
          loading: false,
          error: e instanceof Error ? e.message : "Failed to load busyness",
        });
      }
    })();

    return () => ac.abort();
  }, [sheetOpen, selected]);

  return (
    <main className="relative h-dvh w-full">
      <MapView
        searchCenter={searchCenter}
        onMapReady={onMapReady}
        busynessByPlaceId={busynessByPlaceId}
        selectedPlaceId={selected?.placeId ?? null}
        onSelectCafe={onSelectCafe}
      />
      <SearchBar map={mapInstance} onLocationPicked={setSearchCenter} />
      <BottomSheet
        open={sheetOpen}
        place={selected}
        detail={detail}
        onClose={closeSheet}
      />
    </main>
  );
}
