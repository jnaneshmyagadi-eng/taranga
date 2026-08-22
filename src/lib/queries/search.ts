import { createClient } from "@/lib/supabase/server";
import type { VideoCardData } from "@/components/video/VideoCard";

export interface SearchResult {
  videos: VideoCardData[];
  creators: {
    id: string;
    username: string;
    display_name: string | null;
    avatar_url: string | null;
    is_verified: boolean;
    bio: string | null;
  }[];
  communities: {
    id: string;
    slug: string;
    name: string;
    description: string | null;
    icon_url: string | null;
    member_count: number;
  }[];
}

export async function searchAll(
  query: string,
  filters: {
    language?: string | null;
    category?: string | null;
    type?: "all" | "videos" | "creators" | "communities";
  } = {}
): Promise<SearchResult> {
  const q = query.trim();
  if (!q) {
    return { videos: [], creators: [], communities: [] };
  }

  const supabase = await createClient();
  const result: SearchResult = {
    videos: [],
    creators: [],
    communities: [],
  };

  if (!filters.type || filters.type === "all" || filters.type === "videos") {
    let vq = supabase
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
      .or(`title.ilike.%${q}%,description.ilike.%${q}%`)
      .order("view_count", { ascending: false })
      .limit(24);

    if (filters.language) vq = vq.eq("language", filters.language);
    if (filters.category) vq = vq.eq("category", filters.category);

    const { data } = await vq;
    result.videos = ((data || []) as unknown as Array<{
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
    }>).map((row) => ({
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
  }

  if (!filters.type || filters.type === "all" || filters.type === "creators") {
    const { data } = await supabase
      .from("profiles")
      .select("id, username, display_name, avatar_url, is_verified, bio")
      .or(`username.ilike.%${q}%,display_name.ilike.%${q}%`)
      .limit(12);
    result.creators = data || [];
  }

  if (
    !filters.type ||
    filters.type === "all" ||
    filters.type === "communities"
  ) {
    const { data } = await supabase
      .from("communities")
      .select("id, slug, name, description, icon_url, member_count")
      .or(`name.ilike.%${q}%,description.ilike.%${q}%`)
      .eq("is_private", false)
      .limit(12);
    result.communities = data || [];
  }

  return result;
}
