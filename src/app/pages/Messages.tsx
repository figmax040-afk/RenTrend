import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { useI18n } from "../components/i18n";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { supabase } from "../../lib/supabase";
import { loginPath } from "../../lib/authRedirect";
import { fetchPublicProfiles } from "../../lib/publicProfiles";
import listingPlaceholder from "../../assets/listing-placeholder.svg";

type ThreadRow = {
  id: string;
  renter_id: string;
  owner_id: string;
  listing_title: string | null;
  listings: { id: string; title: string; image_url: string | null } | null;
};

type InboxItem = {
  id: string;
  otherName: string;
  otherAvatar: string | null;
  title: string;
  image: string;
  role: "renting" | "lending";
  lastMessage: string;
  lastAt: string;
  lastMine: boolean;
  unread: number;
};

function formatWhen(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) {
    return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  }
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

/** Inbox: every conversation you're in, newest first. Shown as the Messages tab in Activity. */
export function MessagesContent() {
  const navigate = useNavigate();
  const { t, isZh, zh } = useI18n();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<InboxItem[]>([]);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate(loginPath()); return; }

      // RLS returns only threads the user is in
      const { data: threadData } = await supabase
        .from("chat_threads")
        .select("id, renter_id, owner_id, listing_title, listings(id, title, image_url)");
      const threads = (threadData ?? []) as unknown as ThreadRow[];
      if (threads.length === 0) { setItems([]); setLoading(false); return; }

      const { data: msgData } = await supabase
        .from("messages")
        .select("thread_id, sender_id, content, created_at, read_at")
        .in("thread_id", threads.map((th) => th.id))
        .order("created_at", { ascending: false })
        .limit(1000);
      const msgs = msgData ?? [];

      const profiles = await fetchPublicProfiles(
        threads.map((th) => (th.renter_id === user.id ? th.owner_id : th.renter_id))
      );

      const inbox: InboxItem[] = [];
      for (const th of threads) {
        const threadMsgs = msgs.filter((m) => m.thread_id === th.id);
        // Opened but never used: not a conversation yet
        if (threadMsgs.length === 0) continue;
        const last = threadMsgs[0];
        const other = profiles[th.renter_id === user.id ? th.owner_id : th.renter_id];
        inbox.push({
          id: th.id,
          otherName: other?.name || "User",
          otherAvatar: other?.avatar_url ?? null,
          title: th.listings?.title ?? th.listing_title ?? t("listingRemovedShort"),
          image: th.listings?.image_url ?? listingPlaceholder,
          role: th.renter_id === user.id ? "renting" : "lending",
          lastMessage: last.content,
          lastAt: last.created_at,
          lastMine: last.sender_id === user.id,
          unread: threadMsgs.filter((m) => m.sender_id !== user.id && !m.read_at).length,
        });
      }
      inbox.sort((a, b) => b.lastAt.localeCompare(a.lastAt));
      setItems(inbox);
      setLoading(false);
    }
    load();
  }, [navigate]); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-12 px-6">
        <p className="text-sm text-[#1F2937] mb-1" style={{ fontWeight: 500 }}>{t("noConversations")}</p>
        <p className="text-xs text-[#6B7280] mb-4">{t("noConversationsHint")}</p>
        <button onClick={() => navigate("/browse")} className="text-sm text-brand">
          {t("browse")} →
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {items.map((it) => (
        <button
          key={it.id}
          onClick={() => navigate(`/messages/${it.id}`)}
          className="w-full bg-white rounded-xl border border-[#E5E7EB] p-3 flex gap-3 items-center text-left hover:border-brand transition-colors"
        >
          <div className="relative shrink-0">
            {it.otherAvatar ? (
              <img src={it.otherAvatar} alt={it.otherName} className="w-12 h-12 rounded-full object-cover" />
            ) : (
              <div className="w-12 h-12 rounded-full bg-brand flex items-center justify-center text-white" style={{ fontWeight: 600 }}>
                {it.otherName[0]?.toUpperCase()}
              </div>
            )}
            <ImageWithFallback src={it.image} alt="" className="absolute -bottom-1 -right-1 w-6 h-6 rounded-md object-cover border-2 border-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-sm text-[#1F2937] truncate" style={{ fontWeight: it.unread ? 600 : 500 }}>{it.otherName}</p>
              <span className="text-[10px] text-[#9CA3AF] shrink-0">
                {it.role === "renting" ? t("chatRenting") : t("chatLending")}
              </span>
              <span className="ml-auto text-[10px] text-[#9CA3AF] shrink-0">{formatWhen(it.lastAt)}</span>
            </div>
            <p className="text-xs text-[#9CA3AF] truncate">{it.title}</p>
            <div className="flex items-center gap-2">
              <p className={`text-xs truncate flex-1 ${it.unread ? "text-[#1F2937]" : "text-[#6B7280]"}`}>
                {it.lastMine && (isZh ? zh("你：") : "You: ")}{it.lastMessage}
              </p>
              {it.unread > 0 && (
                <span className="min-w-4 h-4 px-1 bg-[#EF4444] text-white rounded-full flex items-center justify-center text-[9px] shrink-0">
                  {it.unread > 9 ? "9+" : it.unread}
                </span>
              )}
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}
