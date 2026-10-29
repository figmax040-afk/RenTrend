import { useSearchParams } from "react-router";
import { useI18n } from "../components/i18n";
import { MyListingsContent } from "./MyListings";
import { MyRequestsContent } from "./MyRequests";
import { MessagesContent } from "./Messages";

const tabs = [
  { key: "listings", label: "myListings" },
  { key: "requests", label: "myRentalRequests" },
  { key: "messages", label: "messages" },
] as const;

export function Activity() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get("tab") || "listings";
  const { t } = useI18n();

  return (
    <div className="max-w-lg mx-auto px-4 pt-4">
      <div className="flex gap-1 mb-4 bg-[#F3F4F6] p-1 rounded-xl">
        {tabs.map((tb) => (
          <button
            key={tb.key}
            onClick={() => setSearchParams({ tab: tb.key })}
            className={`flex-1 py-2 px-1 rounded-lg text-xs sm:text-sm transition-colors ${
              tab === tb.key
                ? "bg-white text-brand font-medium shadow-sm"
                : "text-[#6B7280]"
            }`}
          >
            {t(tb.label)}
          </button>
        ))}
      </div>

      {tab === "messages" ? <MessagesContent /> : tab === "requests" ? <MyRequestsContent /> : <MyListingsContent />}
    </div>
  );
}
