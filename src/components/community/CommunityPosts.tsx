"use client";

import { useState, useTransition, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  createCommunityPost,
  deleteCommunityPost,
} from "@/lib/actions/communities";
import { formatRelativeTime, cn } from "@/lib/utils";
import { Trash2 } from "lucide-react";

interface Post {
  id: string;
  title: string | null;
  content: string;
  post_type: string;
  upvotes: number;
  comment_count: number;
  created_at: string;
  is_pinned: boolean;
  author: {
    id: string;
    username: string;
    display_name: string | null;
    avatar_url: string | null;
    is_verified: boolean;
  } | null;
}

interface CommunityPostsProps {
  communityId: string;
  slug: string;
  isMember: boolean;
}

export function CommunityPosts({
  communityId,
  slug,
  isMember,
}: CommunityPostsProps) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [showComposer, setShowComposer] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    setUserId(user?.id ?? null);

    const { data } = await supabase
      .from("community_posts")
      .select(
        `
        id, title, content, post_type, upvotes, comment_count, created_at, is_pinned,
        author:profiles!community_posts_author_id_fkey (
          id, username, display_name, avatar_url, is_verified
        )
      `
      )
      .eq("community_id", communityId)
      .eq("is_removed", false)
      .order("is_pinned", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(30);

    setPosts((data as unknown as Post[]) || []);
    setLoading(false);
  }, [communityId]);

  useEffect(() => {
    load();
  }, [load]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;
    setError(null);
    startTransition(async () => {
      const res = await createCommunityPost({
        communityId,
        slug,
        title: title.trim() || undefined,
        content: content.trim(),
      });
      if (!res.success) {
        setError(res.error || "Failed to post");
        return;
      }
      setTitle("");
      setContent("");
      setShowComposer(false);
      await load();
    });
  }

  function handleDelete(postId: string) {
    startTransition(async () => {
      await deleteCommunityPost(postId, communityId, slug);
      setPosts((p) => p.filter((x) => x.id !== postId));
    });
  }

  return (
    <div className="mt-8 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--foreground-muted)]">
          Posts
        </h2>
        {isMember && (
          <Button
            size="sm"
            variant={showComposer ? "secondary" : "default"}
            className="rounded-full"
            onClick={() => setShowComposer((s) => !s)}
          >
            {showComposer ? "Cancel" : "New post"}
          </Button>
        )}
      </div>

      {showComposer && isMember && (
        <form
          onSubmit={handleSubmit}
          className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--background-card)] p-4 space-y-3"
        >
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title (optional)"
            maxLength={200}
            className="w-full h-10 px-3 rounded-[var(--radius)] bg-[var(--background)] border border-[var(--border)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
          />
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Share with the community…"
            rows={4}
            maxLength={10000}
            required
            className="w-full px-3 py-2 rounded-[var(--radius)] bg-[var(--background)] border border-[var(--border)] text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
          />
          {error && (
            <p className="text-xs text-[var(--danger)]">{error}</p>
          )}
          <div className="flex justify-end">
            <Button type="submit" size="sm" disabled={pending || !content.trim()}>
              {pending ? "Posting…" : "Post"}
            </Button>
          </div>
        </form>
      )}

      {!isMember && (
        <p className="text-sm text-[var(--foreground-muted)] py-2">
          Join this community to post.
        </p>
      )}

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 rounded-[var(--radius)] skeleton" />
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div className="py-12 text-center text-sm text-[var(--foreground-muted)] border border-dashed border-[var(--border)] rounded-[var(--radius-lg)]">
          No posts yet. Start the conversation.
        </div>
      ) : (
        <ul className="space-y-3">
          {posts.map((p) => (
            <li
              key={p.id}
              className={cn(
                "rounded-[var(--radius)] border border-[var(--border)] bg-[var(--background-card)] p-4 group",
                p.is_pinned && "border-[var(--primary)]/40"
              )}
            >
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-full bg-[var(--background)] border border-[var(--border)] flex items-center justify-center text-xs font-semibold text-[var(--primary)] shrink-0">
                  {(p.author?.display_name || p.author?.username || "?")
                    .charAt(0)
                    .toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 text-sm flex-wrap">
                    <span className="font-medium">
                      {p.author?.display_name || p.author?.username}
                    </span>
                    <span className="text-xs text-[var(--foreground-subtle)]">
                      {formatRelativeTime(p.created_at)}
                    </span>
                    {p.is_pinned && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--primary)]/15 text-[var(--primary)] font-medium">
                        Pinned
                      </span>
                    )}
                  </div>
                  {p.title && (
                    <h3 className="font-semibold mt-1 text-[var(--foreground)]">
                      {p.title}
                    </h3>
                  )}
                  <p className="text-sm mt-1 whitespace-pre-wrap break-words text-[var(--foreground-muted)]">
                    {p.content}
                  </p>
                </div>
                {userId && p.author?.id === userId && (
                  <button
                    type="button"
                    onClick={() => handleDelete(p.id)}
                    className="opacity-0 group-hover:opacity-100 text-[var(--foreground-subtle)] hover:text-[var(--danger)] transition p-1"
                    aria-label="Delete post"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
