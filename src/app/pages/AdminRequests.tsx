import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft } from "lucide-react";
import { supabase } from "../../lib/supabase";

type Row = {
  id: string;
  renter_id: string;
  start_date: string;
  end_date: string;
  status: string;
  total_price: number;
  listings: { title: string } | null;
};

const statusColor: Record<string, string> = {
  pending:   "#F4A261",
  accepted:  "#22C55E",
  rejected:  "#EF4444",
  completed: "#6B7280",
};

function fmt(d: string) {
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function AdminRequests() {
  const navigate = useNavigate();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("requests")
      .select("id, renter_id, start_date, end_date, status, total_price, listings(title)")
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setRows((data as Row[]) ?? []);
        setLoading(false);
      });
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-4 pt-4">
      <div className="flex items-center gap-3 mb-4">
        <button onClick={() => navigate("/admin")} className="text-[#6B7280]"><ArrowLeft size={20} /></button>
        <h2 className="text-[#1F2937]">All Requests</h2>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-2 border-[#1E6B1E] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : rows.length === 0 ? (
        <p className="text-center text-[#6B7280] text-sm py-12">No requests yet</p>
      ) : (
        <div className="bg-white rounded-xl border border-[#E5E7EB] divide-y divide-[#E5E7EB]">
          {rows.map((r) => (
            <div key={r.id} className="flex items-center justify-between px-4 py-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm truncate" style={{ fontWeight: 500 }}>{r.listings?.title ?? "—"}</p>
                <p className="text-[10px] text-[#6B7280] mt-0.5">
                  {r.renter_id.slice(0, 8)}… · {fmt(r.start_date)} – {fmt(r.end_date)} · HK${r.total_price}
                </p>
              </div>
              <span
                className="ml-3 text-[10px] px-2 py-0.5 rounded-full whitespace-nowrap"
                style={{
                  backgroundColor: (statusColor[r.status] ?? "#6B7280") + "15",
                  color: statusColor[r.status] ?? "#6B7280",
                }}
              >
                {r.status}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
