// Loads the Google Maps JS API once and hands back the Places library.
// Uses the current Places API (AutocompleteSuggestion / Place); the legacy
// google.maps.places.Autocomplete widget isn't available to projects created
// after March 2025.

declare global { interface Window { google: any; } }

let placesPromise: Promise<any> | null = null;

export function loadPlaces(): Promise<any> {
  if (placesPromise) return placesPromise;
  const key = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  if (!key) return Promise.reject(new Error("VITE_GOOGLE_MAPS_API_KEY is not set"));

  placesPromise = new Promise<void>((resolve, reject) => {
    if (window.google?.maps?.importLibrary) { resolve(); return; }
    const cb = "__lendyMapsReady";
    (window as any)[cb] = () => resolve();
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${key}&loading=async&callback=${cb}`;
    script.async = true;
    script.onerror = () => reject(new Error("Google Maps failed to load"));
    document.head.appendChild(script);
  })
    .then(() => window.google.maps.importLibrary("places"))
    .catch((err) => { placesPromise = null; throw err; });

  return placesPromise;
}

export type PickedPlace = { address: string; lat: number; lng: number };

export function distanceKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
