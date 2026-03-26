"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Loader } from "@googlemaps/js-api-loader";
import { MarkerLayer } from "@/components/MarkerLayer";
import { useGeolocation } from "@/hooks/useGeolocation";
import { FALLBACK_CENTER } from "@/lib/mapDefaults";
import { usePlaces, type CafePlace } from "@/hooks/usePlaces";

const MINIMAL_MAP_STYLE: google.maps.MapTypeStyle[] = [
  { featureType: "poi", elementType: "labels", stylers: [{ visibility: "off" }] },
  {
    featureType: "poi.business",
    stylers: [{ visibility: "off" }],
  },
  {
    featureType: "transit",
    elementType: "labels.icon",
    stylers: [{ visibility: "off" }],
  },
  {
    featureType: "road",
    elementType: "labels.icon",
    stylers: [{ visibility: "off" }],
  },
  {
    featureType: "administrative",
    elementType: "labels",
    stylers: [{ visibility: "simplified" }],
  },
  { featureType: "water", stylers: [{ color: "#cfe8f3" }] },
  { featureType: "landscape", stylers: [{ color: "#f5f5f4" }] },
];

type Props = {
  searchCenter: google.maps.LatLngLiteral | null;
  onMapReady: (map: google.maps.Map) => void;
  busynessByPlaceId: Record<string, number>;
  selectedPlaceId: string | null;
  onSelectCafe: (cafe: CafePlace) => void;
};

export function MapView({
  searchCenter,
  onMapReady,
  busynessByPlaceId,
  selectedPlaceId,
  onSelectCafe,
}: Props) {
  const elRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const onMapReadyRef = useRef(onMapReady);
  onMapReadyRef.current = onMapReady;
  const searchCenterRef = useRef(searchCenter);
  searchCenterRef.current = searchCenter;
  const { coords, error: geoError, loading: geoLoading } = useGeolocation();
  const coordsRef = useRef(coords);
  coordsRef.current = coords;

  const center = searchCenter ?? coords ?? FALLBACK_CENTER;

  const loader = useMemo(() => {
    const key = process.env.NEXT_PUBLIC_GMAPS_KEY;
    if (!key) return null;
    return new Loader({
      apiKey: key,
      version: "weekly",
      libraries: ["places"],
    });
  }, []);

  useEffect(() => {
    if (!loader) return;
    const el = elRef.current;
    if (!el) return;

    let cancelled = false;
    (async () => {
      await loader.load();
      if (cancelled || !elRef.current) return;
      const start =
        searchCenterRef.current ??
        coordsRef.current ??
        FALLBACK_CENTER;
      const m = new google.maps.Map(elRef.current, {
        center: start,
        zoom: 15,
        disableDefaultUI: true,
        zoomControl: true,
        gestureHandling: "greedy",
        styles: MINIMAL_MAP_STYLE,
      });
      if (cancelled) return;
      setMap(m);
      onMapReadyRef.current(m);
    })();

    return () => {
      cancelled = true;
      setMap(null);
    };
  }, [loader]);

  useEffect(() => {
    if (!map || !center) return;
    map.panTo(center);
    map.setZoom(15);
  }, [map, center]);

  const { cafes, loading: placesLoading, error: placesError } = usePlaces(
    map,
    center ?? null
  );

  const showLoading = geoLoading || placesLoading;

  if (!loader) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-stone-200 px-6 text-center text-sm text-black/60">
        Set <code className="rounded bg-black/10 px-1">NEXT_PUBLIC_GMAPS_KEY</code>{" "}
        in <code className="rounded bg-black/10 px-1">.env.local</code> to load the
        map.
      </div>
    );
  }

  return (
    <div className="relative h-full w-full">
      <div ref={elRef} className="h-full w-full" />
      <MarkerLayer
        map={map}
        cafes={cafes}
        busynessByPlaceId={busynessByPlaceId}
        selectedPlaceId={selectedPlaceId}
        onSelect={onSelectCafe}
      />
      {showLoading && (
        <div className="pointer-events-none absolute bottom-24 left-1/2 z-20 -translate-x-1/2 rounded-full bg-black/70 px-4 py-2 text-xs font-medium text-white">
          Loading…
        </div>
      )}
      {geoError && !coords && !searchCenter && (
        <div className="absolute bottom-24 left-1/2 z-20 w-[min(90vw,360px)] -translate-x-1/2 rounded-2xl bg-white/90 px-4 py-3 text-center text-sm text-black/70 shadow-lg backdrop-blur">
          {geoError}. Map defaulted to San Francisco; enable location for your
          area.
        </div>
      )}
      {placesError && (
        <div className="absolute bottom-24 left-1/2 z-20 max-w-sm -translate-x-1/2 rounded-2xl bg-amber-50 px-4 py-2 text-center text-xs text-amber-900">
          {placesError}
        </div>
      )}
    </div>
  );
}
