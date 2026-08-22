"use client";

import {
  useEffect,
  useRef,
  useState,
  useCallback,
  type FormEvent,
} from "react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { Settings2, Send } from "lucide-react";

export interface DanmuMessage {
  id: string;
  content: string;
  color?: string | null;
  position_y?: number | null;
  video_timestamp?: number | null;
  user_id?: string | null;
  created_at?: string;
}

interface DanmuLayerProps {
  videoId: string;
  currentTime: number;
  enabled?: boolean;
  className?: string;
}

const COLORS = [
  "#22D3EE",
  "#F472B6",
  "#F59E0B",
  "#A78BFA",
  "#34D399",
  "#FFFFFF",
  "#F97316",
];

const PRESETS = ["🔥", "😂", "❤️", "WOW", "OMG", "Kannada ❤️", "Tamil 🔥", "Hindi 😂"];

export function DanmuLayer({
  videoId,
  currentTime,
  enabled: enabledProp = true,
  className,
}: DanmuLayerProps) {
  const [enabled, setEnabled] = useState(enabledProp);
  const [density, setDensity] = useState(0.7);
  const [speed, setSpeed] = useState(1);
  const [opacity, setOpacity] = useState(0.9);
  const [showSettings, setShowSettings] = useState(false);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connected, setConnected] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const lanesRef = useRef<number[]>([]);
  const lastSendRef = useRef(0);
  const channelRef = useRef<ReturnType<
    ReturnType<typeof createClient>["channel"]
  > | null>(null);

  const spawnDanmu = useCallback(
    (msg: DanmuMessage) => {
      if (!enabled || !containerRef.current) return;
      const container = containerRef.current;
      const el = document.createElement("div");
      el.className = "danmu-item";
      el.textContent = msg.content;
      el.style.color = msg.color || COLORS[Math.floor(Math.random() * COLORS.length)];
      el.style.opacity = String(opacity);
      el.style.fontSize = `${14 + Math.floor(density * 4)}px`;
      el.style.left = "100%";
      el.style.top = `${Math.max(5, Math.min(85, (msg.position_y ?? Math.random()) * 100))}%`;
      el.style.transition = `transform ${8 / speed}s linear`;
      container.appendChild(el);

      requestAnimationFrame(() => {
        el.style.transform = `translateX(calc(-100vw - 100%))`;
      });

      const duration = (8000 / speed);
      setTimeout(() => {
        el.remove();
      }, duration + 200);
    },
    [enabled, opacity, density, speed]
  );

  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;

    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!cancelled) setUserId(user?.id ?? null);
    })();

    const channel = supabase
      .channel(`danmu:${videoId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "danmu_messages",
          filter: `video_id=eq.${videoId}`,
        },
        (payload) => {
          const row = payload.new as DanmuMessage;
          if (
            row.video_timestamp == null ||
            Math.abs((row.video_timestamp || 0) - currentTime) < 8
          ) {
            spawnDanmu(row);
          }
        }
      )
      .on("broadcast", { event: "danmu" }, (payload) => {
        const msg = payload.payload as DanmuMessage;
        if (msg) spawnDanmu(msg);
      })
      .subscribe((status) => {
        setConnected(status === "SUBSCRIBED");
      });

    channelRef.current = channel;

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [videoId, spawnDanmu]);

  useEffect(() => {
    if (!enabled) return;
    const supabase = createClient();
    let active = true;

    (async () => {
      const { data } = await supabase
        .from("danmu_messages")
        .select("id, content, color, position_y, video_timestamp, user_id, created_at")
        .eq("video_id", videoId)
        .gte("video_timestamp", Math.max(0, currentTime - 1))
        .lte("video_timestamp", currentTime + 0.5)
        .order("video_timestamp", { ascending: true })
        .limit(8);

      if (!active || !data) return;
      data.forEach((m) => spawnDanmu(m as DanmuMessage));
    })();

    return () => {
      active = false;
    };
  }, [Math.floor(currentTime), videoId, enabled, spawnDanmu]);

  async function sendDanmu(content: string) {
    const trimmed = content.trim();
    if (!trimmed || sending) return;

    if (!userId) {
      setError("Log in to send Danmu");
      return;
    }

    const now = Date.now();
    if (now - lastSendRef.current < 1500) {
      setError("Slow down");
      return;
    }
    lastSendRef.current = now;

    if (trimmed.length > 100) {
      setError("Max 100 characters");
      return;
    }

    setSending(true);
    setError(null);

    const color = COLORS[Math.floor(Math.random() * COLORS.length)];
    const position_y = 0.1 + Math.random() * 0.7;

    spawnDanmu({
      id: `local-${now}`,
      content: trimmed,
      color,
      position_y,
      video_timestamp: currentTime,
      user_id: userId,
    });

    try {
      const supabase = createClient();

      const ch = channelRef.current;
      if (ch) {
        await ch.send({
          type: "broadcast",
          event: "danmu",
          payload: {
            id: `bc-${now}`,
            content: trimmed,
            color,
            position_y,
            video_timestamp: currentTime,
            user_id: userId,
          },
        });
      }

      const { error: insErr } = await supabase.from("danmu_messages").insert({
        video_id: videoId,
        user_id: userId,
        content: trimmed,
        color,
        position_y,
        video_timestamp: currentTime,
      });

      if (insErr) {
        setError(insErr.message.includes("Rate limit") ? "Rate limit" : insErr.message);
      }
    } catch {
      setError("Failed to send");
    } finally {
      setSending(false);
      setInput("");
    }
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    sendDanmu(input);
  }

  return (
    <div className={cn("absolute inset-0 pointer-events-none z-10", className)}>
      {enabled && (
        <div
          ref={containerRef}
          className="danmu-layer absolute inset-0 overflow-hidden"
          aria-hidden
        />
      )}

      <div className="absolute bottom-14 left-2 right-2 md:left-3 md:right-auto pointer-events-auto flex flex-col gap-2 max-w-md">
        {!connected && (
          <span className="text-[10px] text-amber-300 bg-black/50 px-2 py-0.5 rounded self-start">
            Reconnecting Danmu…
          </span>
        )}

        <form onSubmit={onSubmit} className="flex gap-1.5 items-center">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            maxLength={100}
            placeholder={userId ? "Send Danmu…" : "Log in for Danmu"}
            disabled={!userId || sending}
            className="flex-1 h-9 px-3 rounded-full bg-black/55 text-white text-sm border border-white/15 placeholder:text-white/40 focus:outline-none focus:ring-1 focus:ring-[var(--taranga-cyan)]"
          />
          <button
            type="submit"
            disabled={!userId || sending || !input.trim()}
            className="h-9 w-9 rounded-full bg-[var(--taranga-cyan)]/90 text-black flex items-center justify-center disabled:opacity-40"
            aria-label="Send Danmu"
          >
            <Send className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setShowSettings((s) => !s)}
            className="h-9 w-9 rounded-full bg-black/55 text-white flex items-center justify-center border border-white/15"
            aria-label="Danmu settings"
          >
            <Settings2 className="w-4 h-4" />
          </button>
        </form>

        {error && (
          <span className="text-[10px] text-red-300 px-1">{error}</span>
        )}

        <div className="flex gap-1 overflow-x-auto scrollbar-none">
          {PRESETS.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => sendDanmu(p)}
              disabled={!userId || sending}
              className="shrink-0 px-2.5 py-1 rounded-full bg-black/50 text-white text-xs border border-white/10 hover:bg-black/70 disabled:opacity-40"
            >
              {p}
            </button>
          ))}
        </div>

        {showSettings && (
          <div className="bg-black/80 border border-white/15 rounded-lg p-3 text-white text-xs space-y-2">
            <label className="flex items-center justify-between gap-3">
              <span>Danmu</span>
              <button
                type="button"
                onClick={() => setEnabled((e) => !e)}
                className={cn(
                  "px-2 py-0.5 rounded-full text-[11px] font-medium",
                  enabled ? "bg-[var(--taranga-cyan)] text-black" : "bg-white/20"
                )}
              >
                {enabled ? "ON" : "OFF"}
              </button>
            </label>
            <label className="flex items-center justify-between gap-3">
              <span>Density</span>
              <input
                type="range"
                min={0.3}
                max={1}
                step={0.1}
                value={density}
                onChange={(e) => setDensity(Number(e.target.value))}
                className="w-24 accent-[var(--taranga-cyan)]"
              />
            </label>
            <label className="flex items-center justify-between gap-3">
              <span>Speed</span>
              <input
                type="range"
                min={0.5}
                max={2}
                step={0.25}
                value={speed}
                onChange={(e) => setSpeed(Number(e.target.value))}
                className="w-24 accent-[var(--taranga-cyan)]"
              />
            </label>
            <label className="flex items-center justify-between gap-3">
              <span>Opacity</span>
              <input
                type="range"
                min={0.3}
                max={1}
                step={0.1}
                value={opacity}
                onChange={(e) => setOpacity(Number(e.target.value))}
                className="w-24 accent-[var(--taranga-cyan)]"
              />
            </label>
          </div>
        )}
      </div>
    </div>
  );
}
