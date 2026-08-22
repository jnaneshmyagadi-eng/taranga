import { createClient } from "@/lib/supabase/server";
import type { VideoCardData } from "@/components/video/VideoCard";

export type FeedTab = "for-you" | "following" | "trending" | "live" | "regional";

export interface VideoWithCreator {
  id: string;
  slug: string | null;
  title: string;
  description: string | null;
  thumbnail_url: string | null;
  duration_seconds: number | null;
  view_count: number;
  like_count: number;
  comment_count: number;
  published_at: string | null;
  category: string | null;
  language: string;
  tags: string[];
  is_short: boolean;
  creator_id: string;
  creator: {
    id: string;
    username: string;
    display_name: string | null;
    avatar_url: string | null;
    is_verified: boolean;
  } | null;
}

function mapToCard(row: VideoWithCreator): VideoCardData {
  return {
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
  };
}

export async function getFeedVideos(
  tab: FeedTab = "for-you",
  options: {
    limit?: number;
    cursor?: string;
    category?: string | null;
    language?: string | null;
    userId?: string | null;
  } = {}
): Promise<{ videos: VideoCardData[]; nextCursor: string | null }> {
  const { limit = 20, cursor, category, language, userId } = options;
  const supabase = await createClient();

  let query = supabase
    .from("videos")
    .select(
      `
      id, slug, title, description, thumbnail_url, duration_seconds,
      view_count, like_count, comment_count, published_at, category, language, tags, is_short, creator_id,
      creator:profiles!videos_creator_id_fkey (
        id, username, display_name, avatar_url, is_verified
      )
    `
    )
    .eq("status", "ready")
    .eq("visibility", "public")
    .eq("is_short", false)
    .order("published_at", { ascending: false })
    .limit(limit + 1);

  if (cursor) {
    query = query.lt("published_at", cursor);
  }

  if (category) {
    query = query.eq("category", category);
  }

  if (language) {
    query = query.eq("language", language);
  }

  if (tab === "following" && userId) {
    const { data: following } = await supabase
      .from("follows")
      .select("following_id")
      .eq("follower_id", userId);
    const ids = (following || []).map((f) => f.following_id);
    if (ids.length === 0) {
      return { videos: [], nextCursor: null };
    }
    query = query.in("creator_id", ids);
  }

  if (tab === "trending") {
    query = query
      .gte("published_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
      .order("view_count", { ascending: false });
  }

  if (tab === "regional") {
    query = query.in("language", ["hi", "kn", "ta", "te", "ml", "mr", "bn", "gu", "pa", "or", "as"]);
  }

  const { data, error } = await query;

  if (error) {
    console.error("getFeedVideos error:", error.message);
    return { videos: [], nextCursor: null };
  }

  const rows = (data || []) as unknown as VideoWithCreator[];
  const hasMore = rows.length > limit;
  const slice = hasMore ? rows.slice(0, limit) : rows;
  const nextCursor =
    hasMore && slice.length > 0
      ? slice[slice.length - 1].published_at
      : null;

  return {
    videos: slice.map(mapToCard),
    nextCursor,
  };
}

export async function getVideoByIdOrSlug(
  idOrSlug: string
): Promise<VideoWithCreator | null> {
  const supabase = await createClient();

  const isUuid =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      idOrSlug
    );

  let query = supabase
    .from("videos")
    .select(
      `
      id, slug, title, description, thumbnail_url, duration_seconds,
      view_count, like_count, comment_count, share_count, save_count,
      published_at, category, language, tags, is_short, creator_id, status, visibility,
      creator:profiles!videos_creator_id_fkey (
        id, username, display_name, avatar_url, is_verified, bio
      )
    `
    )
    .eq("status", "ready")
    .limit(1);

  if (isUuid) {
    query = query.eq("id", idOrSlug);
  } else {
    query = query.eq("slug", idOrSlug);
  }

  const { data, error } = await query.maybeSingle();

  if (error || !data) {
    return null;
  }

  return data as unknown as VideoWithCreator;
}

export async function getRelatedVideos(
  videoId: string,
  category: string | null,
  language: string,
  limit = 12
): Promise<VideoCardData[]> {
  const supabase = await createClient();

  let query = supabase
    .from("videos")
    .select(
      `
      id, slug, title, thumbnail_url, duration_seconds,
      view_count, published_at, category, language, creator_id,
      creator:profiles!videos_creator_id_fkey (
        id, username, display_name, avatar_url, is_verified
      )
    `
    )
    .eq("status", "ready")
    .eq("visibility", "public")
    .eq("is_short", false)
    .neq("id", videoId)
    .order("view_count", { ascending: false })
    .limit(limit);

  if (category) {
    query = query.eq("category", category);
  } else if (language) {
    query = query.eq("language", language);
  }

  const { data } = await query;
  return ((data || []) as unknown as VideoWithCreator[]).map(mapToCard);
}

export async function getCreatorVideos(
  creatorId: string,
  options: { limit?: number; shortsOnly?: boolean } = {}
): Promise<VideoCardData[]> {
  const { limit = 24, shortsOnly = false } = options;
  const supabase = await createClient();

  const { data } = await supabase
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
    .eq("creator_id", creatorId)
    .eq("status", "ready")
    .eq("visibility", "public")
    .eq("is_short", shortsOnly)
    .order("published_at", { ascending: false })
    .limit(limit);

  return ((data || []) as unknown as VideoWithCreator[]).map(mapToCard);
}
