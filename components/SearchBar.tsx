"use client";

import { useEffect, useRef } from "react";

type Props = {
  map: google.maps.Map | null;
  onLocationPicked: (loc: google.maps.LatLngLiteral) => void;
};

export function SearchBar({ map, onLocationPicked }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const acRef = useRef<google.maps.places.Autocomplete | null>(null);

  useEffect(() => {
    if (!map || !inputRef.current || !window.google?.maps?.places) return;
    const input = inputRef.current;
    const ac = new google.maps.places.Autocomplete(input, {
      fields: ["geometry", "formatted_address", "name"],
    });
    acRef.current = ac;
    const listener = ac.addListener("place_changed", () => {
      const place = ac.getPlace();
      const loc = place.geometry?.location;
      if (!loc) return;
      const latLng = { lat: loc.lat(), lng: loc.lng() };
      map.panTo(latLng);
      map.setZoom(15);
      onLocationPicked(latLng);
    });
    return () => {
      listener.remove();
      acRef.current = null;
    };
  }, [map, onLocationPicked]);

  return (
    <div className="pointer-events-auto absolute left-1/2 top-4 z-30 w-[min(92vw,420px)] -translate-x-1/2">
      <input
        ref={inputRef}
        type="search"
        placeholder="Search address or place"
        autoComplete="off"
        className="w-full rounded-full border border-black/10 bg-white px-5 py-3 text-sm text-black/90 shadow-md outline-none ring-0 placeholder:text-black/40 focus:border-black/20 focus:shadow-lg"
      />
    </div>
  );
}
