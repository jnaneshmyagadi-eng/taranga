"use client";

import { useState, useTransition, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { postComment, deleteComment } from "@/lib/actions/interactions";
import { formatRelativeTime, cn } from "@/lib/utils";
import { Trash2, CornerDownRight } from "lucide-react";

export interface CommentRow {
  id: string;
  content: string;
  like_count: number;
  created_at: string;
  parent_id: string | null;
  user: {
    id: string;
    username: string;
    display_name: string | null;
    avatar_url: string | null;
    is_verified: boolean;
  } | null;
}

interface CommentSectionProps {
  videoId: string;
  initialCount?: number;
}

export function CommentSection({ videoId, initialCount = 0 }: CommentSectionProps) {
  const [comments, setComments] = useState<CommentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const [replyTo, setReplyTo] = useState<CommentRow | null>(null);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [sort, setSort] = useState<"newest" | "top">("newest");

  const loadComments = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    setCurrentUserId(user?.id ?? null);

    let q = supabase
      .from("video_comments")
      .select(
        `
        id, content, like_count, created_at, parent_id,
        user:profiles!video_comments_user_id_fkey (
          id, username, display_name, avatar_url, is_verified
        )
      `
      )
      .eq("video_id", videoId)
      .is("parent_id", null)
      .eq("is_hidden", false)
      .limit(50);

    if (sort === "top") {
      q = q.order("like_count", { ascending: false });
    } else {
      q = q.order("created_at", { ascending: false });
    }

    const { data } = await q;
    setComments((data as unknown as CommentRow[]) || []);
    setLoading(false);
  }, [videoId, sort]);

  useEffect(() => {
    loadComments();
  }, [loadComments]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    setError(null);
    startTransition(async () => {
      const res = await postComment(
        videoId,
        text.trim(),
        replyTo?.id
      );
      if (!res.success) {
        setError(res.error || "Failed to post");
        return;
      }
      setText("");
      setReplyTo(null);
      await loadComments();
    });
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      await deleteComment(id, videoId);
      setComments((c) => c.filter((x) => x.id !== id));
    });
  }

  return (
    <section className="mt-6" id="comments">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold">
          {initialCount > 0 ? `${initialCount} Comments` : "Comments"}
        </h2>
        <div className="flex gap-1">
          {(["newest", "top"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setSort(s)}
              className={cn(
                "px-3 py-1 rounded-full text-xs font-medium transition",
                sort === s
                  ? "bg-[var(--background-card)] text-[var(--foreground)]"
                  : "text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
              )}
            >
              {s === "newest" ? "Newest" : "Top"}
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mb-6">
        {replyTo && (
          <div className="flex items-center gap-2 text-xs text-[var(--foreground-muted)] mb-2">
            <CornerDownRight className="w-3.5 h-3.5" />
            Replying to @{replyTo.user?.username}
            <button
              type="button"
              className="text-[var(--primary)]"
              onClick={() => setReplyTo(null)}
            >
              Cancel
            </button>
          </div>
        )}
        <div className="flex gap-3">
          <div className="w-9 h-9 rounded-full bg-[var(--background-card)] border border-[var(--border)] shrink-0 flex items-center justify-center text-xs font-semibold text-[var(--primary)]">
            {currentUserId ? "You" : "?"}
          </div>
          <div className="flex-1">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={
                currentUserId
                  ? "Add a comment…"
                  : "Log in to comment"
              }
              disabled={!currentUserId || pending}
              rows={2}
              maxLength={2000}
              className={cn(
                "w-full px-3 py-2 rounded-[var(--radius)] bg-[var(--background-card)] border border-[var(--border)]",
                "text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[var(--ring)]",
                "placeholder:text-[var(--foreground-subtle)]"
              )}
            />
            {error && (
              <p className="text-xs text-[var(--danger)] mt-1">{error}</p>
            )}
            <div className="flex justify-end mt-2">
              <Button
                type="submit"
                size="sm"
                disabled={!currentUserId || !text.trim() || pending}
              >
                {pending ? "Posting…" : "Comment"}
              </Button>
            </div>
          </div>
        </div>
      </form>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-3">
              <div className="w-9 h-9 rounded-full skeleton" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-24 skeleton" />
                <div className="h-3 w-full skeleton" />
              </div>
            </div>
          ))}
        </div>
      ) : comments.length === 0 ? (
        <p className="text-sm text-[var(--foreground-muted)] py-8 text-center">
          No comments yet. Be the first to share your thoughts.
        </p>
      ) : (
        <ul className="space-y-5">
          {comments.map((c) => (
            <li key={c.id} className="flex gap-3 group">
              <div className="w-9 h-9 rounded-full bg-[var(--background-card)] border border-[var(--border)] overflow-hidden shrink-0 flex items-center justify-center text-xs font-semibold text-[var(--primary)]">
                {c.user?.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={c.user.avatar_url}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : (
                  (c.user?.display_name || c.user?.username || "?")
                    .charAt(0)
                    .toUpperCase()
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-medium">
                    {c.user?.display_name || c.user?.username}
                  </span>
                  <span className="text-xs text-[var(--foreground-subtle)]">
                    {formatRelativeTime(c.created_at)}
                  </span>
                </div>
                <p className="text-sm mt-0.5 whitespace-pre-wrap break-words">
                  {c.content}
                </p>
                <div className="flex items-center gap-3 mt-1.5">
                  <button
                    className="text-xs text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
                    onClick={() => setReplyTo(c)}
                  >
                    Reply
                  </button>
                  {currentUserId && c.user?.id === currentUserId && (
                    <button
                      className="text-xs text-[var(--foreground-muted)] hover:text-[var(--danger)] opacity-0 group-hover:opacity-100 transition"
                      onClick={() => handleDelete(c.id)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
