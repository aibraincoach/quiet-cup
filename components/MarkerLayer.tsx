"use client";

import { useEffect, useRef } from "react";
import { busynessColor } from "@/lib/colors";
import type { CafePlace } from "@/hooks/usePlaces";

function markerIconDataUrl(fillColor: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 28 28"><circle cx="14" cy="14" r="10" fill="${fillColor}" stroke="white" stroke-width="2"/></svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

type Props = {
  map: google.maps.Map | null;
  cafes: CafePlace[];
  busynessByPlaceId: Record<string, number>;
  selectedPlaceId: string | null;
  onSelect: (cafe: CafePlace) => void;
};

export function MarkerLayer({
  map,
  cafes,
  busynessByPlaceId,
  selectedPlaceId,
  onSelect,
}: Props) {
  const markersRef = useRef<Map<string, google.maps.Marker>>(new Map());

  useEffect(() => {
    if (!map) return;
    const markers = markersRef.current;
    const nextIds = new Set(cafes.map((c) => c.placeId));

    const toRemove: string[] = [];
    markers.forEach((m, id) => {
      if (!nextIds.has(id)) toRemove.push(id);
    });
    for (const id of toRemove) {
      markers.get(id)?.setMap(null);
      markers.delete(id);
    }

    for (const cafe of cafes) {
      let m = markers.get(cafe.placeId);
      if (!m) {
        m = new google.maps.Marker({
          map,
          position: cafe.location,
        });
        m.addListener("click", () => onSelect(cafe));
        markers.set(cafe.placeId, m);
      } else {
        m.setPosition(cafe.location);
      }

      const pct = busynessByPlaceId[cafe.placeId] ?? 50;
      const color = busynessColor(pct);
      const isSel = cafe.placeId === selectedPlaceId;
      const size = isSel ? 32 : 28;
      m.setZIndex(isSel ? google.maps.Marker.MAX_ZINDEX + 1 : undefined);
      m.setIcon({
        url: markerIconDataUrl(color),
        scaledSize: new google.maps.Size(size, size),
        anchor: new google.maps.Point(size / 2, size / 2),
      });
    }
  }, [map, cafes, busynessByPlaceId, onSelect, selectedPlaceId]);

  return null;
}
