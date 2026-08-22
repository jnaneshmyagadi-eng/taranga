"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { VideoCard, type VideoCardData } from "@/components/video/VideoCard";
import { createClient } from "@/lib/supabase/client";
import type { FeedTab } from "@/lib/queries/videos";

interface InfiniteFeedProps {
  initialVideos: VideoCardData[];
  initialCursor: string | null;
  tab?: FeedTab;
  category?: string | null;
}

const PAGE_SIZE = 12;

async function fetchMore(
  tab: FeedTab,
  cursor: string | null,
  category: string | null
): Promise<{ videos: VideoCardData[]; nextCursor: string | null }> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let query = supabase
    .from("videos")
    .select(
      `
      id, slug, title, thumbnail_url, duration_seconds,
      view_count, published_at, category, language, is_short, creator_id,
      creator:profiles!videos_creator_id_fkey (
        id, username, display_name, avatar_url, is_verified
      )
    `
    )
    .eq("status", "ready")
    .eq("visibility", "public")
    .eq("is_short", false)
    .order("published_at", { ascending: false })
    .limit(PAGE_SIZE + 1);

  if (cursor) {
    query = query.lt("published_at", cursor);
  }
  if (category) {
    query = query.eq("category", category);
  }

  if (tab === "following" && user) {
    const { data: following } = await supabase
      .from("follows")
      .select("following_id")
      .eq("follower_id", user.id);
    const ids = (following || []).map((f) => f.following_id);
    if (ids.length === 0) return { videos: [], nextCursor: null };
    query = query.in("creator_id", ids);
  }

  if (tab === "trending") {
    query = query
      .gte(
        "published_at",
        new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
      )
      .order("view_count", { ascending: false });
  }

  if (tab === "regional") {
    query = query.in("language", [
      "hi",
      "kn",
      "ta",
      "te",
      "ml",
      "mr",
      "bn",
      "gu",
      "pa",
      "or",
      "as",
    ]);
  }

  const { data, error } = await query;
  if (error || !data) return { videos: [], nextCursor: null };

  const rows = data as unknown as Array<{
    id: string;
    slug: string | null;
    title: string;
    thumbnail_url: string | null;
    duration_seconds: number | null;
    view_count: number;
    published_at: string | null;
    category: string | null;
    language: string;
    creator: {
      username: string;
      display_name: string | null;
      avatar_url: string | null;
      is_verified: boolean;
    } | null;
  }>;

  const hasMore = rows.length > PAGE_SIZE;
  const slice = hasMore ? rows.slice(0, PAGE_SIZE) : rows;
  const nextCursor =
    hasMore && slice.length
      ? slice[slice.length - 1].published_at
      : null;

  const videos: VideoCardData[] = slice.map((row) => ({
    id: row.id,
    slug: row.slug || row.id,
    title: row.title,
    thumbnail_url: row.thumbnail_url,
    duration_seconds: row.duration_seconds || 0,
    view_count: Number(row.view_count) || 0,
    published_at: row.published_at || new Date().toISOString(),
    category: row.category || undefined,
    language: row.language,
    creator: {
      username: row.creator?.username || "unknown",
      display_name: row.creator?.display_name || null,
      avatar_url: row.creator?.avatar_url || null,
      is_verified: row.creator?.is_verified || false,
    },
  }));

  return { videos, nextCursor };
}

export function InfiniteFeed({
  initialVideos,
  initialCursor,
  tab = "for-you",
  category = null,
}: InfiniteFeedProps) {
  const [videos, setVideos] = useState(initialVideos);
  const [cursor, setCursor] = useState(initialCursor);
  const [hasMore, setHasMore] = useState(!!initialCursor);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const sentinelRef = useRef<HTMLDivElement>(null);
  const loadingRef = useRef(false);
  const seenIds = useRef(new Set(initialVideos.map((v) => v.id)));

  const loadMore = useCallback(() => {
    if (loadingRef.current || !hasMore || !cursor) return;
    loadingRef.current = true;
    setError(null);

    startTransition(async () => {
      try {
        const { videos: more, nextCursor } = await fetchMore(
          tab,
          cursor,
          category
        );
        const unique = more.filter((v) => !seenIds.current.has(v.id));
        unique.forEach((v) => seenIds.current.add(v.id));
        setVideos((prev) => [...prev, ...unique]);
        setCursor(nextCursor);
        setHasMore(!!nextCursor && unique.length > 0);
      } catch {
        setError("Failed to load more. Tap to retry.");
      } finally {
        loadingRef.current = false;
      }
    });
  }, [tab, cursor, category, hasMore]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) loadMore();
      },
      { rootMargin: "400px" }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [loadMore]);

  if (videos.length === 0) {
    return (
      <div className="py-16 text-center text-[var(--foreground-muted)] text-sm">
        No videos yet. Be the first to create on TARANGA.
      </div>
    );
  }

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-6">
        {videos.map((video) => (
          <VideoCard key={video.id} video={video} />
        ))}
      </div>

      <div ref={sentinelRef} className="h-8" />

      {(pending || loadingRef.current) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-6 mt-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-2.5">
              <div className="aspect-video rounded-[var(--radius)] skeleton" />
              <div className="flex gap-3">
                <div className="w-9 h-9 rounded-full skeleton shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-full skeleton" />
                  <div className="h-3 w-2/3 skeleton" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {error && (
        <button
          type="button"
          onClick={loadMore}
          className="mx-auto mt-4 block text-sm text-[var(--primary)] hover:underline"
        >
          {error}
        </button>
      )}

      {!hasMore && videos.length > 0 && (
        <p className="text-center text-xs text-[var(--foreground-subtle)] py-8">
          You&apos;re all caught up
        </p>
      )}
    </div>
  );
}
