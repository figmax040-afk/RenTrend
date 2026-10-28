import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router";
import { ArrowLeft, ArrowUp } from "lucide-react";
import { useI18n } from "../components/i18n";
import { supabase } from "../../lib/supabase";
import { loginPath } from "../../lib/authRedirect";

type Message = {
  id: string;
  request_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  read_at: string | null;
};

type OtherUser = {
  id: string;
  name: string | null;
  email: string | null;
  avatar_url: string | null;
};

type RequestWithListing = {
  id: string;
  renter_id: string;
  listings: {
    id: string;
    title: string;
    image_url: string | null;
    owner_id: string;
  } | null;
};

function formatTime(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const isToday =
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear();

  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  if (isToday) return `${hh}:${mm}`;

  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${months[d.getMonth()]} ${d.getDate()}, ${hh}:${mm}`;
}

function displayName(user: OtherUser | null): string {
  if (user?.name) return user.name;
  if (user?.email) return user.email.split("@")[0];
  return "User";
}

export function Chat() {
  const { requestId } = useParams<{ requestId: string }>();
  const navigate = useNavigate();
  const { t, lang } = useI18n();

  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [otherUser, setOtherUser] = useState<OtherUser | null>(null);
  const [listingTitle, setListingTitle] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [realtimeUnavailable, setRealtimeUnavailable] = useState(false);
  const [listingRemoved, setListingRemoved] = useState(false);
  const [sendError, setSendError] = useState("");

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  function scrollToBottom() {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }

  useEffect(() => { scrollToBottom(); }, [messages]);

  // Mark unread messages as read
  useEffect(() => {
    if (!messages.length || !currentUserId) return;
    const unread = messages
      .filter((m) => m.sender_id !== currentUserId && !m.read_at)
      .map((m) => m.id);
    if (unread.length === 0) return;
    const readAt = new Date().toISOString();
    // Query builders are lazy: the update only runs once awaited/then'd
    supabase
      .from("messages")
      .update({ read_at: readAt })
      .in("id", unread)
      .then(({ error }) => {
        if (error) { console.error("Mark as read failed:", error); return; }
        setMessages((prev) => prev.map((m) => unread.includes(m.id) ? { ...m, read_at: readAt } : m));
      });
  }, [messages, currentUserId]);

  const load = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { navigate(loginPath()); return; }
    setCurrentUserId(user.id);

    const { data: request } = await supabase
      .from("requests")
      .select("*, listings(id, title, image_url, owner_id)")
      .eq("id", requestId)
      .single();

    if (!request) { navigate("/activity"); return; }

    const req = request as unknown as RequestWithListing;
    const isRenter = req.renter_id === user.id;
    const isLister = req.listings?.owner_id === user.id;
    if (!isRenter && !isLister) { navigate("/activity"); return; }

    setListingRemoved(!req.listings);
    setListingTitle(req.listings?.title ?? t("listingRemovedShort"));

    const { data: history } = await supabase
      .from("messages")
      .select("*")
      .eq("request_id", requestId)
      .order("created_at", { ascending: true });
    const msgs = (history as Message[]) || [];
    setMessages(msgs);

    // If the listing is gone, the owner can still be found from the message history
    const otherUserId = req.listings
      ? (isRenter ? req.listings.owner_id : req.renter_id)
      : msgs.find((m) => m.sender_id !== user.id)?.sender_id ?? null;
    if (otherUserId) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("id, name, email, avatar_url")
        .eq("id", otherUserId)
        .single();
      setOtherUser(profile ?? null);
    }

    setLoading(false);
  }, [requestId, navigate]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { load(); }, [load]);

  // Realtime subscription
  useEffect(() => {
    if (!requestId) return;

    const channel = supabase
      .channel(`chat:${requestId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `request_id=eq.${requestId}`,
        },
        (payload) => {
          setMessages((prev) => {
            // Avoid duplicates
            if (prev.some((m) => m.id === (payload.new as Message).id)) return prev;
            return [...prev, payload.new as Message];
          });
          scrollToBottom();
        }
      )
      .subscribe((status) => {
        if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          setRealtimeUnavailable(true);
        }
      });

    return () => { supabase.removeChannel(channel); };
  }, [requestId]);

  async function sendMessage() {
    if (!input.trim() || sending || !currentUserId || listingRemoved) return;
    setSending(true);
    setSendError("");
    const content = input.trim();
    setInput("");
    const { data: inserted, error } = await supabase
      .from("messages")
      .insert({
        request_id: requestId,
        sender_id: currentUserId,
        content,
      })
      .select()
      .single();
    if (error || !inserted) {
      setInput(content);
      setSendError(t("messageSendFailed"));
    } else {
      // Show it immediately; the realtime echo is de-duplicated by id
      setMessages((prev) => prev.some((m) => m.id === inserted.id) ? prev : [...prev, inserted as Message]);
    }
    setSending(false);
    inputRef.current?.focus();
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  const name = displayName(otherUser);
  const initial = name[0]?.toUpperCase() ?? "U";

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[100dvh] max-h-[100dvh] bg-[#F9FAFB]">
      {/* Sticky header */}
      <div className="sticky top-0 z-10 bg-white border-b border-[#E5E7EB] px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="text-[#6B7280] shrink-0">
          <ArrowLeft size={20} />
        </button>

        {/* Avatar */}
        {otherUser?.avatar_url ? (
          <img
            src={otherUser.avatar_url}
            alt={name}
            className="w-10 h-10 rounded-full object-cover shrink-0"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-brand flex items-center justify-center text-white shrink-0" style={{ fontWeight: 600, fontSize: 16 }}>
            {initial}
          </div>
        )}

        <div className="flex-1 min-w-0">
          <p className="text-[#1F2937] text-sm font-semibold truncate">{name}</p>
          <p className="text-[#9CA3AF] text-xs truncate">
            {lang === "zh" ? "關於：" : "Re: "}{listingTitle}
          </p>
        </div>
      </div>

      {/* Realtime unavailable notice */}
      {realtimeUnavailable && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 text-center">
          <p className="text-amber-700 text-xs">
            {lang === "zh"
              ? "即時更新不可用，請重新整理頁面以獲取最新訊息"
              : "Real-time updates unavailable. Refresh to see latest messages."}
          </p>
        </div>
      )}

      {listingRemoved && (
        <div className="bg-[#F3F4F6] border-b border-[#E5E7EB] px-4 py-2 text-center">
          <p className="text-[#6B7280] text-xs">{t("chatListingRemoved")}</p>
        </div>
      )}

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 pb-4 space-y-3">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center px-8">
              <div className="w-16 h-16 rounded-full bg-brand/10 flex items-center justify-center mx-auto mb-3">
                <span style={{ fontSize: 28 }}>💬</span>
              </div>
              <p className="text-[#1F2937] text-sm font-medium mb-1">{t("noMessages")}</p>
              <p className="text-[#9CA3AF] text-xs">
                {lang === "zh"
                  ? "詢問有關可用性、取貨地點或任何詳情。"
                  : "Ask about availability, pickup location, or any details."}
              </p>
            </div>
          </div>
        ) : (
          messages.map((msg) => {
            const isMine = msg.sender_id === currentUserId;
            return (
              <div key={msg.id} className={`flex flex-col ${isMine ? "items-end" : "items-start"}`}>
                <div
                  className={`max-w-[75%] px-4 py-2.5 text-sm ${
                    isMine
                      ? "bg-brand text-white rounded-2xl rounded-br-sm"
                      : "bg-white border border-[#E5E7EB] text-[#1F2937] rounded-2xl rounded-bl-sm"
                  }`}
                  style={{ wordBreak: "break-word" }}
                >
                  {msg.content}
                </div>
                <p className="text-[10px] text-[#9CA3AF] mt-0.5 px-1">
                  {formatTime(msg.created_at)}
                </p>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Sticky input footer — sits above mobile nav via pb-20 on wrapper */}
      <div className="sticky bottom-0 bg-white border-t border-[#E5E7EB] px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] mb-16 md:mb-0">
        {sendError && <p className="text-xs text-red-600 mb-2">{sendError}</p>}
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t("chatPlaceholder")}
            disabled={listingRemoved}
            rows={1}
            className="flex-1 px-4 py-2.5 rounded-xl border border-[#E5E7EB] bg-white text-sm resize-none focus:outline-none focus:border-brand leading-snug"
            style={{ maxHeight: 120, overflowY: "auto" }}
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || sending || listingRemoved}
            className="w-10 h-10 rounded-full bg-brand text-white flex items-center justify-center shrink-0 disabled:opacity-40 hover:bg-brand-hover transition-colors"
          >
            {sending ? (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <ArrowUp size={18} />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
