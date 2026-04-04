import { useSearchParams } from "react-router";
import { useI18n } from "../components/i18n";
import { MyListingsContent } from "./MyListings";
import { MyRequestsContent } from "./MyRequests";

export function Activity() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get("tab") || "listings";
  const { t } = useI18n();

  return (
    <div className="max-w-lg mx-auto px-4 pt-4">
      <div className="flex gap-2 mb-4 bg-[#F3F4F6] p-1 rounded-xl">
        <button
          onClick={() => setSearchParams({ tab: "listings" })}
          className={`flex-1 py-2 rounded-lg text-sm transition-colors ${
            tab === "listings"
              ? "bg-white text-[#1E6B1E] font-medium shadow-sm"
              : "text-[#6B7280]"
          }`}
        >
          {t("myListings")}
        </button>
        <button
          onClick={() => setSearchParams({ tab: "requests" })}
          className={`flex-1 py-2 rounded-lg text-sm transition-colors ${
            tab === "requests"
              ? "bg-white text-[#1E6B1E] font-medium shadow-sm"
              : "text-[#6B7280]"
          }`}
        >
          {t("myRentalRequests")}
        </button>
      </div>

      {tab === "listings" ? <MyListingsContent /> : <MyRequestsContent />}
    </div>
  );
}
