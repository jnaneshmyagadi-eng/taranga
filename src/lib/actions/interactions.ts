"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { supabase, user: null, error: "Not authenticated" as const };
  }
  return { supabase, user, error: null };
}

export async function toggleLike(videoId: string) {
  const { supabase, user, error } = await requireUser();
  if (error || !user) return { success: false, error: error || "Unauthorized", liked: false };

  const { data: existing } = await supabase
    .from("video_likes")
    .select("id")
    .eq("video_id", videoId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing) {
    const { error: delErr } = await supabase
      .from("video_likes")
      .delete()
      .eq("id", existing.id);
    if (delErr) return { success: false, error: delErr.message, liked: true };
    revalidatePath(`/watch/${videoId}`);
    return { success: true, liked: false };
  }

  const { error: insErr } = await supabase.from("video_likes").insert({
    video_id: videoId,
    user_id: user.id,
  });
  if (insErr) return { success: false, error: insErr.message, liked: false };

  await supabase.from("recommendation_events").insert({
    user_id: user.id,
    video_id: videoId,
    event_type: "like",
  });

  revalidatePath(`/watch/${videoId}`);
  return { success: true, liked: true };
}

export async function getUserLiked(videoId: string): Promise<boolean> {
  const { supabase, user } = await requireUser();
  if (!user) return false;
  const { data } = await supabase
    .from("video_likes")
    .select("id")
    .eq("video_id", videoId)
    .eq("user_id", user.id)
    .maybeSingle();
  return !!data;
}

export async function toggleFollow(targetUserId: string) {
  const { supabase, user, error } = await requireUser();
  if (error || !user) return { success: false, error: error || "Unauthorized", following: false };
  if (user.id === targetUserId) {
    return { success: false, error: "Cannot follow yourself", following: false };
  }

  const { data: existing } = await supabase
    .from("follows")
    .select("id")
    .eq("follower_id", user.id)
    .eq("following_id", targetUserId)
    .maybeSingle();

  if (existing) {
    const { error: delErr } = await supabase
      .from("follows")
      .delete()
      .eq("id", existing.id);
    if (delErr) return { success: false, error: delErr.message, following: true };
    revalidatePath(`/creator`);
    return { success: true, following: false };
  }

  const { error: insErr } = await supabase.from("follows").insert({
    follower_id: user.id,
    following_id: targetUserId,
  });
  if (insErr) return { success: false, error: insErr.message, following: false };

  await supabase.from("notifications").insert({
    user_id: targetUserId,
    type: "new_follower",
    title: "New follower",
    body: "Someone started following you",
    actor_id: user.id,
    data: { follower_id: user.id },
  });

  await supabase.from("recommendation_events").insert({
    user_id: user.id,
    event_type: "follow",
    metadata: { target_user_id: targetUserId },
  });

  revalidatePath(`/creator`);
  return { success: true, following: true };
}

export async function getIsFollowing(targetUserId: string): Promise<boolean> {
  const { supabase, user } = await requireUser();
  if (!user) return false;
  const { data } = await supabase
    .from("follows")
    .select("id")
    .eq("follower_id", user.id)
    .eq("following_id", targetUserId)
    .maybeSingle();
  return !!data;
}

export async function toggleSave(videoId: string) {
  const { supabase, user, error } = await requireUser();
  if (error || !user) return { success: false, error: error || "Unauthorized", saved: false };

  const { data: existing } = await supabase
    .from("video_saves")
    .select("id")
    .eq("video_id", videoId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing) {
    const { error: delErr } = await supabase
      .from("video_saves")
      .delete()
      .eq("id", existing.id);
    if (delErr) return { success: false, error: delErr.message, saved: true };
    return { success: true, saved: false };
  }

  const { error: insErr } = await supabase.from("video_saves").insert({
    video_id: videoId,
    user_id: user.id,
  });
  if (insErr) return { success: false, error: insErr.message, saved: false };

  await supabase.from("recommendation_events").insert({
    user_id: user.id,
    video_id: videoId,
    event_type: "save",
  });

  return { success: true, saved: true };
}

export async function getUserSaved(videoId: string): Promise<boolean> {
  const { supabase, user } = await requireUser();
  if (!user) return false;
  const { data } = await supabase
    .from("video_saves")
    .select("id")
    .eq("video_id", videoId)
    .eq("user_id", user.id)
    .maybeSingle();
  return !!data;
}

export async function recordWatchProgress(payload: {
  videoId: string;
  progressSeconds: number;
  durationSeconds: number;
}) {
  const { supabase, user } = await requireUser();
  const { videoId, progressSeconds, durationSeconds } = payload;
  const completion =
    durationSeconds > 0
      ? Math.min(1, progressSeconds / durationSeconds)
      : 0;
  const completed = completion >= 0.9;

  if (user) {
    await supabase.from("watch_history").upsert(
      {
        user_id: user.id,
        video_id: videoId,
        progress_seconds: Math.floor(progressSeconds),
        completed,
        last_watched_at: new Date().toISOString(),
      },
      { onConflict: "user_id,video_id" }
    );
  }

  await supabase.from("recommendation_events").insert({
    user_id: user?.id ?? null,
    video_id: videoId,
    event_type: completed ? "complete" : "watch",
    watch_seconds: Math.floor(progressSeconds),
    metadata: { completion_rate: completion },
  });

  if (progressSeconds < 5) {
    await supabase.rpc("increment_view_count", { vid: videoId }).maybeSingle();
  }

  return { success: true };
}

export async function postComment(videoId: string, content: string, parentId?: string) {
  const { supabase, user, error } = await requireUser();
  if (error || !user) return { success: false, error: error || "Unauthorized", comment: null };

  const trimmed = content.trim();
  if (!trimmed || trimmed.length > 2000) {
    return { success: false, error: "Invalid comment", comment: null };
  }

  const { data, error: insErr } = await supabase
    .from("video_comments")
    .insert({
      video_id: videoId,
      user_id: user.id,
      content: trimmed,
      parent_id: parentId || null,
    })
    .select(
      `
      id, content, like_count, created_at, parent_id,
      user:profiles!video_comments_user_id_fkey (
        id, username, display_name, avatar_url, is_verified
      )
    `
    )
    .single();

  if (insErr) return { success: false, error: insErr.message, comment: null };

  await supabase.rpc("increment_comment_count", { vid: videoId }).maybeSingle();

  await supabase.from("recommendation_events").insert({
    user_id: user.id,
    video_id: videoId,
    event_type: "comment",
  });

  revalidatePath(`/watch/${videoId}`);
  return { success: true, comment: data };
}

export async function deleteComment(commentId: string, videoId: string) {
  const { supabase, user, error } = await requireUser();
  if (error || !user) return { success: false, error: error || "Unauthorized" };

  const { error: delErr } = await supabase
    .from("video_comments")
    .delete()
    .eq("id", commentId)
    .eq("user_id", user.id);

  if (delErr) return { success: false, error: delErr.message };
  revalidatePath(`/watch/${videoId}`);
  return { success: true };
}
