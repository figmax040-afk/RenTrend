import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft, Download, TrendingUp } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { supabase } from "../../lib/supabase";
import { useI18n } from "../components/i18n";

type EarningRow = {
  id: string;
  listing_id: string;
  listing_title: string;
  renter_id: string;
  renter_name: string;
  start_date: string;
  end_date: string;
  total_price: number;
  created_at: string;
};

type ChartPoint = { month: string; amount: number };

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function getLast6Months(): { key: string; label: string }[] {
  const months = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() - i);
    months.push({
      key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
      label: d.toLocaleDateString("en-US", { month: "short" }),
    });
  }
  return months;
}

export function Earnings() {
  const navigate = useNavigate();
  const { t } = useI18n();
  const [rows, setRows] = useState<EarningRow[]>([]);
  const [chartData, setChartData] = useState<ChartPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate("/login"); return; }

      // 1. Get user's listings
      const { data: listingsData, error: lErr } = await supabase
        .from("listings")
        .select("id, title")
        .eq("owner_id", user.id);

      if (lErr) { setError(lErr.message); setLoading(false); return; }

      const listings = listingsData ?? [];
      if (listings.length === 0) { setLoading(false); return; }

      const listingMap: Record<string, string> = Object.fromEntries(listings.map((l) => [l.id, l.title]));
      const listingIds = listings.map((l) => l.id);

      // 2. Get completed requests for those listings
      const { data: reqData, error: rErr } = await supabase
        .from("requests")
        .select("id, listing_id, renter_id, start_date, end_date, total_price, created_at")
        .in("listing_id", listingIds)
        .eq("status", "completed")
        .order("created_at", { ascending: false });

      if (rErr) { setError(rErr.message); setLoading(false); return; }

      const requests = reqData ?? [];

      // 3. Fetch renter profiles
      const renterIds = [...new Set(requests.map((r) => r.renter_id))];
      let profileMap: Record<string, string> = {};
      if (renterIds.length > 0) {
        const { data: profileData } = await supabase
          .from("profiles")
          .select("id, name")
          .in("id", renterIds);
        profileMap = Object.fromEntries((profileData ?? []).map((p) => [p.id, p.name ?? "User"]));
      }

      const earningRows: EarningRow[] = requests.map((r) => ({
        id: r.id,
        listing_id: r.listing_id,
        listing_title: listingMap[r.listing_id] ?? "—",
        renter_id: r.renter_id,
        renter_name: profileMap[r.renter_id] ?? "User",
        start_date: r.start_date,
        end_date: r.end_date,
        total_price: r.total_price,
        created_at: r.created_at,
      }));

      setRows(earningRows);

      // Build 6-month chart data
      const months = getLast6Months();
      const byMonth: Record<string, number> = {};
      for (const m of months) byMonth[m.key] = 0;
      for (const r of earningRows) {
        const key = r.created_at.slice(0, 7);
        if (byMonth[key] !== undefined) byMonth[key] += r.total_price;
      }
      setChartData(months.map((m) => ({ month: m.label, amount: byMonth[m.key] })));

      setLoading(false);
    }
    load();
  }, [navigate]);

  const totalEarned = rows.reduce((s, r) => s + r.total_price, 0);
  const currentMonth = new Date().toISOString().slice(0, 7);
  const thisMonth = rows
    .filter((r) => r.created_at.startsWith(currentMonth))
    .reduce((s, r) => s + r.total_price, 0);
  const completedCount = rows.length;
  const hasData = rows.length > 0;

  function exportCSV() {
    const headers = ["Item", "Renter", "Start Date", "End Date", "Amount (HKD)"];
    const csvRows = rows.map((r) => [
      `"${r.listing_title.replace(/"/g, '""')}"`,
      `"${r.renter_name}"`,
      r.start_date,
      r.end_date,
      r.total_price,
    ]);
    const csv = [headers, ...csvRows].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "lendy-earnings.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-8 h-8 border-2 border-[#1E6B1E] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 pt-4 pb-10">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate("/profile")} className="text-[#6B7280]"><ArrowLeft size={20} /></button>
        <h2 className="text-[#1F2937]">{t("myEarnings")}</h2>
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 px-4 py-3 rounded-xl mb-4">{error}</p>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-2 mb-1">
        {[
          { label: t("totalEarned"), value: `HK$${totalEarned}` },
          { label: t("thisMonth"), value: `HK$${thisMonth}` },
          { label: t("completed"), value: String(completedCount) },
        ].map(({ label, value }) => (
          <div key={label} className="bg-white rounded-xl border border-[#E5E7EB] p-3 text-center">
            <p className="text-lg text-[#1E6B1E]" style={{ fontWeight: 600 }}>{value}</p>
            <p className="text-[10px] text-[#6B7280] mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      <p className="text-xs text-[#6B7280] text-center mt-1 mb-4">
        {t("earningsCompletedOnly")}
      </p>

      {/* Bar chart */}
      <div className="bg-white rounded-xl border border-[#E5E7EB] p-4 mb-6">
        <p className="text-sm mb-3" style={{ fontWeight: 500 }}>{t("earningsLast6Months")}</p>
        {hasData ? (
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={chartData} margin={{ top: 0, right: 4, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#6B7280" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#6B7280" }} axisLine={false} tickLine={false} />
              <Tooltip
                formatter={(value: number) => [`HK$${value}`, "Earnings"]}
                contentStyle={{ borderRadius: "0.75rem", border: "1px solid #E5E7EB", fontSize: 12 }}
              />
              <Bar dataKey="amount" fill="#1E6B1E" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <TrendingUp size={28} className="text-[#D1D5DB] mb-2" />
            <p className="text-sm text-[#9CA3AF]">{t("earningsEmptyChart")}</p>
          </div>
        )}
      </div>

      {/* Rental history */}
      <div className="mb-6">
        <p className="text-sm mb-3" style={{ fontWeight: 500 }}>{t("rentalHistory")}</p>
        {rows.length === 0 ? (
          <div className="bg-white rounded-xl border border-[#E5E7EB] p-6 text-center">
            <p className="text-sm text-[#6B7280]">{t("earningsEmptyHistory")}</p>
            <button
              onClick={() => navigate("/create")}
              className="mt-3 px-5 py-2 bg-[#1E6B1E] text-white rounded-xl text-sm"
            >
              {t("createListing")}
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-[#E5E7EB] divide-y divide-[#E5E7EB]">
            {rows.map((r) => (
              <div key={r.id} className="flex items-center justify-between px-4 py-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm truncate" style={{ fontWeight: 500 }}>{r.listing_title}</p>
                  <p className="text-[10px] text-[#6B7280] mt-0.5">
                    {r.renter_name} · {fmtDate(r.start_date)} – {fmtDate(r.end_date)}
                  </p>
                </div>
                <span className="ml-3 text-sm text-[#1E6B1E]" style={{ fontWeight: 600 }}>HK${r.total_price}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Export button */}
      {hasData && (
        <button
          onClick={exportCSV}
          className="w-full py-3 border border-[#E5E7EB] rounded-xl text-sm text-[#6B7280] flex items-center justify-center gap-2 hover:border-[#1E6B1E] hover:text-[#1E6B1E] transition-colors"
        >
          <Download size={16} />
          {t("exportSummary")}
        </button>
      )}
    </div>
  );
}
