import { useEffect, useRef, useState } from "react";
import { MapPin } from "lucide-react";
import { loadPlaces, type PickedPlace } from "../../lib/googleMaps";

type Suggestion = { id: string; main: string; secondary: string; prediction: any };

type Props = {
  value: string;
  onChange: (text: string) => void; // typing; the parent should drop any saved coordinates
  onPick: (place: PickedPlace) => void;
  placeholder?: string;
  className?: string; // classes for the <input>
};

// Text input with Hong Kong place suggestions from Google Places.
// If Maps can't load, it still works as a plain text field.
export function LocationInput({ value, onChange, onPick, placeholder, className }: Props) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const places = useRef<any>(null);
  const session = useRef<any>(null);
  const lastQuery = useRef("");
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadPlaces()
      .then((lib) => { places.current = lib; })
      .catch((err) => console.error("Places unavailable:", err));
  }, []);

  // Close the list when clicking elsewhere
  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  function handleType(text: string) {
    onChange(text);
    lastQuery.current = text;
    const lib = places.current;
    if (!lib || text.trim().length < 2) { setSuggestions([]); return; }
    session.current ??= new lib.AutocompleteSessionToken();
    lib.AutocompleteSuggestion.fetchAutocompleteSuggestions({
      input: text,
      includedRegionCodes: ["hk"],
      sessionToken: session.current,
    })
      .then(({ suggestions: res }: { suggestions: any[] }) => {
        if (lastQuery.current !== text) return; // a newer keystroke won
        setSuggestions(
          res.filter((s) => s.placePrediction).slice(0, 5).map((s) => ({
            id: s.placePrediction.placeId,
            main: s.placePrediction.mainText?.text ?? s.placePrediction.text.text,
            secondary: s.placePrediction.secondaryText?.text ?? "",
            prediction: s.placePrediction,
          })),
        );
        setOpen(true);
      })
      .catch((err: unknown) => console.error("Place suggestions failed:", err));
  }

  async function pick(s: Suggestion) {
    setOpen(false);
    setSuggestions([]);
    try {
      const place = s.prediction.toPlace();
      await place.fetchFields({ fields: ["displayName", "formattedAddress", "location"] });
      session.current = null; // a pick ends the billing session
      const address = s.secondary ? `${s.main}, ${s.secondary}` : s.main;
      onPick({ address, lat: place.location.lat(), lng: place.location.lng() });
    } catch (err) {
      console.error("Place details failed:", err);
      onChange(s.main);
    }
  }

  return (
    <div ref={boxRef} className="relative">
      <input
        type="text"
        value={value}
        onChange={(e) => handleType(e.target.value)}
        onFocus={() => suggestions.length > 0 && setOpen(true)}
        placeholder={placeholder}
        autoComplete="off"
        className={className}
      />
      {open && suggestions.length > 0 && (
        <ul className="absolute z-30 left-0 right-0 mt-1 bg-white border border-[#E5E7EB] rounded-xl shadow-lg overflow-hidden">
          {suggestions.map((s) => (
            <li key={s.id}>
              <button
                type="button"
                onClick={() => pick(s)}
                className="w-full flex items-start gap-2 px-3 py-2 text-left hover:bg-brand-soft"
              >
                <MapPin size={14} className="text-brand mt-0.5 shrink-0" />
                <span className="min-w-0">
                  <span className="block text-sm text-[#1F2937] truncate">{s.main}</span>
                  {s.secondary && <span className="block text-xs text-[#6B7280] truncate">{s.secondary}</span>}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
