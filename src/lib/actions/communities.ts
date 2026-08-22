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

export async function joinCommunity(communityId: string, slug: string) {
  const { supabase, user, error } = await requireUser();
  if (error || !user) return { success: false, error: error || "Unauthorized" };

  const { error: insErr } = await supabase.from("community_members").insert({
    community_id: communityId,
    user_id: user.id,
    role: "member",
  });

  if (insErr) {
    if (insErr.code === "23505") {
      return { success: true, joined: true };
    }
    return { success: false, error: insErr.message };
  }

  await supabase.from("recommendation_events").insert({
    user_id: user.id,
    event_type: "community_join",
    metadata: { community_id: communityId },
  });

  revalidatePath(`/community/${slug}`);
  revalidatePath("/communities");
  return { success: true, joined: true };
}

export async function leaveCommunity(communityId: string, slug: string) {
  const { supabase, user, error } = await requireUser();
  if (error || !user) return { success: false, error: error || "Unauthorized" };

  const { error: delErr } = await supabase
    .from("community_members")
    .delete()
    .eq("community_id", communityId)
    .eq("user_id", user.id);

  if (delErr) return { success: false, error: delErr.message };

  revalidatePath(`/community/${slug}`);
  revalidatePath("/communities");
  return { success: true, joined: false };
}

export async function createCommunityPost(payload: {
  communityId: string;
  slug: string;
  title?: string;
  content: string;
  postType?: "text" | "link";
}) {
  const { supabase, user, error } = await requireUser();
  if (error || !user) return { success: false, error: error || "Unauthorized", post: null };

  const content = payload.content.trim();
  if (!content || content.length > 10000) {
    return { success: false, error: "Invalid content", post: null };
  }

  const { data: membership } = await supabase
    .from("community_members")
    .select("id")
    .eq("community_id", payload.communityId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!membership) {
    return { success: false, error: "Join the community to post", post: null };
  }

  const { data, error: insErr } = await supabase
    .from("community_posts")
    .insert({
      community_id: payload.communityId,
      author_id: user.id,
      title: payload.title?.trim() || null,
      content,
      post_type: payload.postType || "text",
    })
    .select(
      `
      id, title, content, post_type, upvotes, comment_count, created_at, is_pinned,
      author:profiles!community_posts_author_id_fkey (
        id, username, display_name, avatar_url, is_verified
      )
    `
    )
    .single();

  if (insErr) return { success: false, error: insErr.message, post: null };

  revalidatePath(`/community/${payload.slug}`);
  return { success: true, post: data };
}

export async function deleteCommunityPost(
  postId: string,
  communityId: string,
  slug: string
) {
  const { supabase, user, error } = await requireUser();
  if (error || !user) return { success: false, error: error || "Unauthorized" };

  const { error: updErr } = await supabase
    .from("community_posts")
    .update({ is_removed: true })
    .eq("id", postId)
    .eq("author_id", user.id);

  if (updErr) return { success: false, error: updErr.message };

  revalidatePath(`/community/${slug}`);
  return { success: true };
}

export async function getIsMember(communityId: string): Promise<boolean> {
  const { supabase, user } = await requireUser();
  if (!user) return false;
  const { data } = await supabase
    .from("community_members")
    .select("id")
    .eq("community_id", communityId)
    .eq("user_id", user.id)
    .maybeSingle();
  return !!data;
}
