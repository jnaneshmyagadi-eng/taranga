"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import type { VideoCardData } from "@/components/video/VideoCard";
import { formatViews, cn } from "@/lib/utils";
import {
  Heart,
  MessageCircle,
  Share2,
  Volume2,
  VolumeX,
} from "lucide-react";
import { toggleLike } from "@/lib/actions/interactions";
import { isDemoFallbackEnabled, DEMO_SAMPLE_SHORT_MP4 } from "@/lib/demo";

interface ShortsFeedProps {
  initialShorts: VideoCardData[];
}

export function ShortsFeed({ initialShorts }: ShortsFeedProps) {
  const [index, setIndex] = useState(0);
  const [muted, setMuted] = useState(true);
  const [liked, setLiked] = useState<Record<string, boolean>>({});
  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartY = useRef(0);

  const shorts = initialShorts;
  const current = shorts[index];

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    function onWheel(e: WheelEvent) {
      e.preventDefault();
      if (e.deltaY > 30) setIndex((i) => Math.min(shorts.length - 1, i + 1));
      if (e.deltaY < -30) setIndex((i) => Math.max(0, i - 1));
    }

    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [shorts.length]);

  function onTouchStart(e: React.TouchEvent) {
    touchStartY.current = e.touches[0].clientY;
  }

  function onTouchEnd(e: React.TouchEvent) {
    const dy = touchStartY.current - e.changedTouches[0].clientY;
    if (dy > 50) setIndex((i) => Math.min(shorts.length - 1, i + 1));
    if (dy < -50) setIndex((i) => Math.max(0, i - 1));
  }

  async function handleLike() {
    if (!current) return;
    const next = !liked[current.id];
    setLiked((s) => ({ ...s, [current.id]: next }));
    if (!current.id.startsWith("demo-")) {
      await toggleLike(current.id);
    }
  }

  if (!current) {
    return (
      <div className="h-full flex items-center justify-center text-white/60 text-sm px-6 text-center">
        No shorts yet. Upload a short from Create.
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="h-full w-full relative overflow-hidden touch-none"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <video
        key={current.id}
        src={isDemoFallbackEnabled() ? DEMO_SAMPLE_SHORT_MP4 : ""}
        className="absolute inset-0 w-full h-full object-contain bg-black"
        autoPlay
        loop
        muted={muted}
        playsInline
        poster={current.thumbnail_url || undefined}
      />

      <div className="absolute inset-0 flex pointer-events-none">
        <div className="absolute right-3 bottom-28 flex flex-col items-center gap-5 pointer-events-auto">
          <button
            onClick={handleLike}
            className="flex flex-col items-center gap-1"
          >
            <div
              className={cn(
                "w-12 h-12 rounded-full bg-black/40 backdrop-blur flex items-center justify-center",
                liked[current.id] && "text-red-500"
              )}
            >
              <Heart
                className={cn(
                  "w-6 h-6",
                  liked[current.id] && "fill-current"
                )}
              />
            </div>
            <span className="text-white text-xs">
              {formatViews(current.view_count)}
            </span>
          </button>

          <Link
            href={`/watch/${current.slug}`}
            className="flex flex-col items-center gap-1"
          >
            <div className="w-12 h-12 rounded-full bg-black/40 backdrop-blur flex items-center justify-center">
              <MessageCircle className="w-6 h-6 text-white" />
            </div>
            <span className="text-white text-xs">Comment</span>
          </Link>

          <button className="flex flex-col items-center gap-1">
            <div className="w-12 h-12 rounded-full bg-black/40 backdrop-blur flex items-center justify-center">
              <Share2 className="w-6 h-6 text-white" />
            </div>
            <span className="text-white text-xs">Share</span>
          </button>

          <button
            onClick={() => setMuted((m) => !m)}
            className="w-12 h-12 rounded-full bg-black/40 backdrop-blur flex items-center justify-center"
          >
            {muted ? (
              <VolumeX className="w-5 h-5 text-white" />
            ) : (
              <Volume2 className="w-5 h-5 text-white" />
            )}
          </button>
        </div>

        <div className="absolute left-0 right-16 bottom-6 px-4 pointer-events-auto">
          <Link
            href={`/creator/${current.creator.username}`}
            className="flex items-center gap-2 mb-2"
          >
            <div className="w-9 h-9 rounded-full bg-white/20 overflow-hidden flex items-center justify-center text-xs font-bold text-white">
              {(current.creator.display_name || current.creator.username)
                .charAt(0)
                .toUpperCase()}
            </div>
            <span className="text-white font-semibold text-sm">
              @{current.creator.username}
            </span>
          </Link>
          <p className="text-white text-sm line-clamp-2 drop-shadow">
            {current.title}
          </p>
          <p className="text-white/60 text-xs mt-1">
            Swipe up for next · {index + 1}/{shorts.length}
          </p>
        </div>
      </div>
    </div>
  );
}
