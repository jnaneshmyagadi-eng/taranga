"use client";

import { useState, useTransition } from "react";
import {
  ThumbsUp,
  Bookmark,
  Share2,
  MessageCircle,
  Flag,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn, formatViews } from "@/lib/utils";
import {
  toggleLike,
  toggleSave,
} from "@/lib/actions/interactions";

interface VideoActionsProps {
  videoId: string;
  likeCount: number;
  commentCount: number;
  initialLiked?: boolean;
  initialSaved?: boolean;
  
}

export function VideoActions({
  videoId,
  likeCount: initialLikeCount,
  commentCount,
  initialLiked = false,
  initialSaved = false,
}: VideoActionsProps) {
  const [liked, setLiked] = useState(initialLiked);
  const [saved, setSaved] = useState(initialSaved);
  const [likeCount, setLikeCount] = useState(initialLikeCount);
  const [pending, startTransition] = useTransition();
  const [shareMsg, setShareMsg] = useState<string | null>(null);

  function handleLike() {
    const next = !liked;
    setLiked(next);
    setLikeCount((c) => c + (next ? 1 : -1));
    startTransition(async () => {
      const res = await toggleLike(videoId);
      if (!res.success) {
        setLiked(!next);
        setLikeCount((c) => c + (next ? -1 : 1));
      } else {
        setLiked(res.liked);
      }
    });
  }

  function handleSave() {
    const next = !saved;
    setSaved(next);
    startTransition(async () => {
      const res = await toggleSave(videoId);
      if (!res.success) setSaved(!next);
      else setSaved(res.saved);
    });
  }

  async function handleShare() {
    const url = typeof window !== "undefined" ? window.location.href : "";
    try {
      if (navigator.share) {
        await navigator.share({ title: "TARANGA", url });
      } else {
        await navigator.clipboard.writeText(url);
        setShareMsg("Link copied");
        setTimeout(() => setShareMsg(null), 2000);
      }
    } catch {
      // user cancelled
    }
  }

  return (
    <div className="flex items-center gap-1 flex-wrap">
      <Button
        variant="secondary"
        size="sm"
        className={cn(
          "rounded-full gap-1.5",
          liked && "bg-[var(--primary)]/15 text-[var(--primary)] border-[var(--primary)]/30"
        )}
        onClick={handleLike}
        disabled={pending}
      >
        <ThumbsUp className={cn("w-4 h-4", liked && "fill-current")} />
        <span className="tabular-nums">{formatViews(Math.max(0, likeCount))}</span>
      </Button>

      <a href="#comments">
        <Button
          variant="secondary"
          size="sm"
          className="rounded-full gap-1.5"
        >
          <MessageCircle className="w-4 h-4" />
          <span className="tabular-nums">{formatViews(commentCount)}</span>
        </Button>
      </a>

      <Button
        variant="secondary"
        size="sm"
        className={cn(
          "rounded-full gap-1.5",
          saved && "bg-[var(--accent)]/15 text-[var(--accent)] border-[var(--accent)]/30"
        )}
        onClick={handleSave}
        disabled={pending}
      >
        <Bookmark className={cn("w-4 h-4", saved && "fill-current")} />
        Save
      </Button>

      <Button
        variant="secondary"
        size="sm"
        className="rounded-full gap-1.5"
        onClick={handleShare}
      >
        <Share2 className="w-4 h-4" />
        {shareMsg || "Share"}
      </Button>

      <Button variant="ghost" size="icon-sm" className="ml-auto rounded-full" aria-label="Report">
        <Flag className="w-4 h-4 text-[var(--foreground-subtle)]" />
      </Button>
    </div>
  );
}
