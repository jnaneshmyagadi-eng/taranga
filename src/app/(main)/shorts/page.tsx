import { createClient } from "@/lib/supabase/server";
import { ShortsFeed } from "@/components/shorts/ShortsFeed";
import type { VideoCardData } from "@/components/video/VideoCard";

export const metadata = {
  title: "Shorts",
};

async function getShorts(): Promise<VideoCardData[]> {
  try {
    const supabase = await createClient();
    const { data } = await supabase
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
      .eq("is_short", true)
      .order("published_at", { ascending: false })
      .limit(20);

    if (!data || data.length === 0) return [];

    return (data as unknown as Array<{
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
  } catch {
    return [];
  }
}

export default async function ShortsPage() {
  const shorts = await getShorts();

  return (
    <div className="fixed inset-0 md:left-60 top-0 md:top-14 bottom-16 md:bottom-0 bg-black z-30">
      <ShortsFeed initialShorts={shorts} />
    </div>
  );
}
