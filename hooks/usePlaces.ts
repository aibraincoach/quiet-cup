"use client";

import { useCallback, useEffect, useState } from "react";

const CAFE_RADIUS_M = 800;

export type CafePlace = {
  placeId: string;
  name: string;
  address: string;
  location: google.maps.LatLngLiteral;
};

function placeToCafe(p: google.maps.places.PlaceResult): CafePlace | null {
  if (!p.place_id || !p.geometry?.location || !p.name) return null;
  const address =
    p.vicinity ??
    p.formatted_address ??
    [p.name, p.vicinity].filter(Boolean).join(", ");
  return {
    placeId: p.place_id,
    name: p.name,
    address,
    location: {
      lat: p.geometry.location.lat(),
      lng: p.geometry.location.lng(),
    },
  };
}

export function usePlaces(
  map: google.maps.Map | null,
  center: google.maps.LatLngLiteral | null
) {
  const [cafes, setCafes] = useState<CafePlace[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = useCallback(() => {
    if (!map || !center) return;
    setLoading(true);
    setError(null);
    const svc = new google.maps.places.PlacesService(map);
    const req: google.maps.places.PlaceSearchRequest = {
      location: center,
      radius: CAFE_RADIUS_M,
      type: "cafe",
    };
    svc.nearbySearch(req, (results, status) => {
      setLoading(false);
      if (
        status !== google.maps.places.PlacesServiceStatus.OK &&
        status !== google.maps.places.PlacesServiceStatus.ZERO_RESULTS
      ) {
        setError(`Places search failed: ${status}`);
        setCafes([]);
        return;
      }
      const list = (results ?? [])
        .map(placeToCafe)
        .filter((x): x is CafePlace => x !== null);
      setCafes(list);
    });
  }, [map, center]);

  useEffect(() => {
    if (map && center) search();
  }, [map, center, search]);

  return { cafes, loading, error, refresh: search };
}
