import { useNavigate } from "react-router";
import { ArrowLeft, Recycle } from "lucide-react";

export function AdminRecycling() {
  const navigate = useNavigate();
  return (
    <div className="max-w-4xl mx-auto px-4 pt-4">
      <div className="flex items-center gap-3 mb-4">
        <button onClick={() => navigate("/admin")} className="text-[#6B7280]"><ArrowLeft size={20} /></button>
        <h2 className="text-[#1F2937]">Recycling Submissions</h2>
      </div>
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-16 h-16 rounded-full bg-[#6B7280]/10 flex items-center justify-center mb-4">
          <Recycle size={32} className="text-[#6B7280]" />
        </div>
        <p className="text-[#6B7280] text-sm">Recycling submissions coming soon</p>
      </div>
    </div>
  );
}
