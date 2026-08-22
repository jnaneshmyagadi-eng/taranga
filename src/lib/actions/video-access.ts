"use server";

import { createClient } from "@/lib/supabase/server";

/**
 * Returns a signed URL for a private video asset path.
 * Never exposes service role to the client.
 */
export async function getSignedVideoUrl(
  storagePath: string,
  expiresInSeconds = 3600
): Promise<{ url: string | null; error: string | null }> {
  if (!storagePath) {
    return { url: null, error: "Missing path" };
  }

  // Already a full URL (e.g. external CDN)
  if (storagePath.startsWith("http://") || storagePath.startsWith("https://")) {
    return { url: storagePath, error: null };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Public videos can still use signed URLs for private bucket
  const { data, error } = await supabase.storage
    .from("videos")
    .createSignedUrl(storagePath, expiresInSeconds);

  if (error) {
    return { url: null, error: error.message };
  }

  return { url: data.signedUrl, error: null };
}

/**
 * Resolve playable sources for a video (signed when needed).
 */
export async function resolveVideoSources(videoId: string): Promise<
  {
    src: string;
    quality: string;
    type: string;
  }[]
> {
  const supabase = await createClient();
  const { data: assets } = await supabase
    .from("video_assets")
    .select("storage_path, quality, format, is_primary")
    .eq("video_id", videoId)
    .order("is_primary", { ascending: false });

  if (!assets || assets.length === 0) {
    return [];
  }

  const sources = [];
  for (const a of assets) {
    const { url } = await getSignedVideoUrl(a.storage_path);
    if (url) {
      sources.push({
        src: url,
        quality: a.quality || "auto",
        type: a.format === "m3u8" ? "application/x-mpegURL" : "video/mp4",
      });
    }
  }
  return sources;
}
