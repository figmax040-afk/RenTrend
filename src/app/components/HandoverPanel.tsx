import { useEffect, useRef, useState } from "react";
import { Video, CheckCircle, Circle, Lock, X, Play } from "lucide-react";
import { useI18n } from "./i18n";
import { supabase } from "../../lib/supabase";
import { fill } from "../../demo/strings";
import { escrowOf } from "./EscrowTracker";
import { refreshDemoProfile } from "../../demo/useDemoProfile";

type Stage = "pickup" | "return";
type Role = "renter" | "lender";

export type HandoverRequest = {
  id: string;
  status: string;
  escrow_status?: string | null;
  pickup_clip_at?: string | null;
  pickup_clip_seconds?: number | null;
  pickup_renter_ok_at?: string | null;
  pickup_lender_ok_at?: string | null;
  return_clip_at?: string | null;
  return_clip_seconds?: number | null;
  return_renter_ok_at?: string | null;
  return_lender_ok_at?: string | null;
};

// Recorded clips stay in memory on this device (video storage is mocked); the database keeps the timestamp.
const localClips = new Map<string, string>();

function fmtTime(iso: string) {
  return new Date(iso).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

/** Pickup and return video handovers. Each needs a clip and both parties' "Confirm condition". */
export function HandoverPanel<R extends HandoverRequest>({ request, role, onUpdated }: {
  request: R;
  role: Role;
  onUpdated: (row: R) => void;
}) {
  const { t } = useI18n();
  const [recording, setRecording] = useState<Stage | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const escrow = escrowOf(request);
  if (escrow === "unpaid" || escrow === "refunded") {
    if (request.status !== "accepted") return null;
    return (
      <div className="bg-white rounded-xl border border-[#E5E7EB] p-4 mb-4">
        <p className="text-sm text-[#1F2937] flex items-center gap-1.5" style={{ fontWeight: 600 }}>
          <Video size={16} className="text-brand" />{t("handoverTitle")}
        </p>
        <p className="text-xs text-[#9CA3AF] mt-1 flex items-center gap-1"><Lock size={11} />{t("payFirst")}</p>
      </div>
    );
  }

  const pickupDone = !!request.pickup_renter_ok_at && !!request.pickup_lender_ok_at;

  async function save(patch: Record<string, unknown>) {
    setBusy(true);
    setError("");
    const { data, error: err } = await supabase.from("requests").update(patch).eq("id", request.id).select("*").single();
    setBusy(false);
    if (err || !data) { setError(err?.message ?? "Update failed"); return; }
    // Both confirmed the return: the database released the escrow and completed the rental
    if (data.status === "completed") refreshDemoProfile();
    onUpdated(data as R);
  }

  async function saveClip(stage: Stage, seconds: number, url: string | null) {
    if (url) localClips.set(`${request.id}:${stage}`, url);
    setRecording(null);
    // A new clip needs fresh confirmations from both sides
    await save({
      [`${stage}_clip_at`]: new Date().toISOString(),
      [`${stage}_clip_seconds`]: seconds,
      [`${stage}_renter_ok_at`]: null,
      [`${stage}_lender_ok_at`]: null,
    });
  }

  function confirm(stage: Stage) {
    save({ [`${stage}_${role}_ok_at`]: new Date().toISOString() });
  }

  return (
    <div className="bg-white rounded-xl border border-[#E5E7EB] p-4 mb-4">
      <p className="text-sm text-[#1F2937] flex items-center gap-1.5" style={{ fontWeight: 600 }}>
        <Video size={16} className="text-brand" />{t("handoverTitle")}
      </p>
      <p className="text-xs text-[#6B7280] mt-1 mb-3">{t("handoverIntro")}</p>

      <StageBlock stage="pickup" request={request} role={role} locked={false} busy={busy}
        onRecord={() => setRecording("pickup")} onConfirm={() => confirm("pickup")} />
      <StageBlock stage="return" request={request} role={role} locked={!pickupDone} busy={busy}
        onRecord={() => setRecording("return")} onConfirm={() => confirm("return")} />

      {error && <p className="text-xs text-red-600 mt-2">{error}</p>}
      <p className="text-[10px] text-[#9CA3AF] mt-2">{t("clipLocalNote")}</p>

      {recording && (
        <Recorder
          title={t(recording === "pickup" ? "recordPickup" : "recordReturn")}
          onCancel={() => setRecording(null)}
          onSave={(sec, url) => saveClip(recording, sec, url)}
        />
      )}
    </div>
  );
}

function StageBlock({ stage, request, role, locked, busy, onRecord, onConfirm }: {
  stage: Stage; request: HandoverRequest; role: Role; locked: boolean; busy: boolean;
  onRecord: () => void; onConfirm: () => void;
}) {
  const { t } = useI18n();
  const clipAt = request[`${stage}_clip_at` as const];
  const clipSec = request[`${stage}_clip_seconds` as const] ?? 0;
  const renterOk = !!request[`${stage}_renter_ok_at` as const];
  const lenderOk = !!request[`${stage}_lender_ok_at` as const];
  const mineOk = role === "renter" ? renterOk : lenderOk;
  const bothOk = renterOk && lenderOk;
  const localUrl = localClips.get(`${request.id}:${stage}`);
  const [showReplay, setShowReplay] = useState(false);

  return (
    <div className={`rounded-xl border p-3 mb-2 ${bothOk ? "border-[#22C55E]/40 bg-[#22C55E]/5" : "border-[#E5E7EB]"}`}>
      <div className="flex items-center justify-between">
        <p className="text-sm text-[#1F2937]" style={{ fontWeight: 500 }}>{t(stage === "pickup" ? "pickupHandover" : "returnHandover")}</p>
        {bothOk && <CheckCircle size={16} className="text-[#22C55E]" />}
      </div>

      {locked ? (
        <p className="text-xs text-[#9CA3AF] mt-1 flex items-center gap-1"><Lock size={11} />{t("returnLocked")}</p>
      ) : (
        <>
          {clipAt ? (
            <div className="flex items-center gap-2 mt-1">
              <p className="text-xs text-[#6B7280]">{fill(t("clipSaved"), { time: fmtTime(clipAt), sec: clipSec })}</p>
              {localUrl && (
                <button onClick={() => setShowReplay(!showReplay)} className="text-xs text-brand flex items-center gap-0.5">
                  <Play size={11} />{t("replayClip")}
                </button>
              )}
            </div>
          ) : (
            <p className="text-xs text-[#9CA3AF] mt-1">{t("clipNeeded")}</p>
          )}
          {showReplay && localUrl && <video src={localUrl} controls className="w-full rounded-lg mt-2 bg-black" />}

          <div className="flex gap-3 mt-2 text-[11px]">
            {([["renterLabel", renterOk], ["lenderLabel", lenderOk]] as const).map(([label, ok]) => (
              <span key={label} className={`flex items-center gap-1 ${ok ? "text-[#15803D]" : "text-[#9CA3AF]"}`}>
                {ok ? <CheckCircle size={12} /> : <Circle size={12} />}
                {t(label)}: {t(ok ? "confirmedLabel" : "waitingLabel")}
              </span>
            ))}
          </div>

          {!bothOk && (
            <div className="flex gap-2 mt-3">
              <button
                onClick={onRecord}
                disabled={busy}
                className="flex-1 py-2 rounded-xl border border-brand text-brand text-xs flex items-center justify-center gap-1 disabled:opacity-50"
              >
                <Video size={13} />{t(stage === "pickup" ? "recordPickup" : "recordReturn")}
              </button>
              <button
                onClick={onConfirm}
                disabled={busy || !clipAt || mineOk}
                className="flex-1 py-2 rounded-xl bg-brand text-white text-xs disabled:opacity-40"
              >
                {mineOk ? t("youConfirmed") : t("confirmCondition")}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

/** Uses the device camera when it can; otherwise a placeholder recorder that just times the clip. */
function Recorder({ title, onCancel, onSave }: { title: string; onCancel: () => void; onSave: (seconds: number, url: string | null) => void }) {
  const { t } = useI18n();
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startRef = useRef(0);
  const [camera, setCamera] = useState<"loading" | "on" | "off">("loading");
  const [isRecording, setIsRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    let cancelled = false;
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") { setCamera("off"); return; }
    navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" }, audio: false })
      .then((stream) => {
        if (cancelled) { stream.getTracks().forEach((tr) => tr.stop()); return; }
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
        setCamera("on");
      })
      .catch(() => { if (!cancelled) setCamera("off"); });
    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((tr) => tr.stop());
    };
  }, []);

  useEffect(() => {
    if (!isRecording) return;
    const id = setInterval(() => setElapsed(Math.floor((Date.now() - startRef.current) / 1000)), 250);
    return () => clearInterval(id);
  }, [isRecording]);

  function start() {
    startRef.current = Date.now();
    setElapsed(0);
    if (camera === "on" && streamRef.current) {
      chunksRef.current = [];
      const rec = new MediaRecorder(streamRef.current);
      rec.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      rec.start();
      recorderRef.current = rec;
    }
    setIsRecording(true);
  }

  function stop() {
    const seconds = Math.max(1, Math.round((Date.now() - startRef.current) / 1000));
    setIsRecording(false);
    const rec = recorderRef.current;
    if (rec && rec.state !== "inactive") {
      rec.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: rec.mimeType || "video/webm" });
        onSave(seconds, URL.createObjectURL(blob));
      };
      rec.stop();
    } else {
      onSave(seconds, null);
    }
  }

  const mm = String(Math.floor(elapsed / 60)).padStart(2, "0");
  const ss = String(elapsed % 60).padStart(2, "0");

  return (
    <div className="fixed inset-0 bg-black/60 z-[60] flex items-end md:items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md p-4 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-[#1F2937]" style={{ fontWeight: 600 }}>{title}</p>
          <button onClick={onCancel} className="text-[#6B7280]" aria-label={t("close")}><X size={18} /></button>
        </div>
        <div className="relative rounded-xl overflow-hidden bg-[#123B47] aspect-video flex items-center justify-center">
          <video ref={videoRef} autoPlay muted playsInline className={`w-full h-full object-cover ${camera === "on" ? "" : "hidden"}`} />
          {camera !== "on" && <Video size={40} className="text-white/40" />}
          {isRecording && (
            <span className="absolute top-2 left-2 flex items-center gap-1.5 bg-black/50 text-white text-xs px-2 py-1 rounded-full">
              <span className="w-2 h-2 rounded-full bg-[#EF4444] animate-pulse" />REC {mm}:{ss}
            </span>
          )}
        </div>
        {camera === "off" && <p className="text-xs text-[#B45309]">{t("cameraUnavailable")}</p>}
        <p className="text-xs text-[#6B7280]">{t("recordingTip")}</p>
        {isRecording ? (
          <button onClick={stop} className="w-full py-3 bg-[#EF4444] text-white rounded-xl text-sm">{t("stopAndSave")}</button>
        ) : (
          <button onClick={start} disabled={camera === "loading"} className="w-full py-3 bg-brand text-white rounded-xl text-sm disabled:opacity-50">
            {t("startRecording")}
          </button>
        )}
      </div>
    </div>
  );
}
