import Link from "next/link";
import { formatViews, formatDuration, formatRelativeTime } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { CheckCircle2 } from "lucide-react";

export interface VideoCardData {
  id: string;
  slug: string;
  title: string;
  thumbnail_url: string | null;
  duration_seconds: number;
  view_count: number;
  published_at: string;
  category?: string;
  language?: string;
  creator: {
    username: string;
    display_name: string | null;
    avatar_url: string | null;
    is_verified: boolean;
  };
}

interface VideoCardProps {
  video: VideoCardData;
  className?: string;
}

export function VideoCard({ video, className }: VideoCardProps) {
  return (
    <article className={cn("video-card group", className)}>
      <Link href={`/watch/${video.slug || video.id}`} className="block">
        <div className="relative aspect-video rounded-[var(--radius)] overflow-hidden bg-[var(--background-card)]">
          {video.thumbnail_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={video.thumbnail_url}
              alt={video.title}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[var(--taranga-blue)] to-[var(--taranga-purple)]">
              <span className="text-white/60 text-sm font-medium">TARANGA</span>
            </div>
          )}
          <span className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded text-[11px] font-semibold bg-black/80 text-white tabular-nums">
            {formatDuration(video.duration_seconds)}
          </span>
          {video.language && video.language !== "en" && (
            <span className="absolute top-2 left-2 px-1.5 py-0.5 rounded text-[10px] font-medium bg-black/70 text-white uppercase">
              {video.language}
            </span>
          )}
        </div>

        <div className="flex gap-3 mt-2.5">
          <Link
            href={`/creator/${video.creator.username}`}
            className="shrink-0"
          >
            <div className="w-9 h-9 rounded-full bg-[var(--background-card)] border border-[var(--border)] overflow-hidden flex items-center justify-center text-xs font-semibold text-[var(--primary)]">
              {video.creator.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={video.creator.avatar_url}
                  alt=""
                  className="w-full h-full object-cover"
                />
              ) : (
                (video.creator.display_name || video.creator.username)
                  .charAt(0)
                  .toUpperCase()
              )}
            </div>
          </Link>

          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-medium leading-snug line-clamp-2 text-[var(--foreground)] group-hover:text-[var(--primary)] transition-colors">
              {video.title}
            </h3>
            <div className="mt-1 flex items-center gap-1 text-xs text-[var(--foreground-muted)]">
              <Link
                href={`/creator/${video.creator.username}`}
                className="hover:text-[var(--foreground)] transition-colors truncate"
              >
                {video.creator.display_name || video.creator.username}
              </Link>
              {video.creator.is_verified && (
                <CheckCircle2 className="w-3.5 h-3.5 text-[var(--primary)] shrink-0" />
              )}
            </div>
            <div className="mt-0.5 flex items-center gap-1.5 text-xs text-[var(--foreground-subtle)]">
              <span>{formatViews(video.view_count)} views</span>
              <span>·</span>
              <span>{formatRelativeTime(video.published_at)}</span>
              {video.category && (
                <>
                  <span>·</span>
                  <span className="capitalize">{video.category}</span>
                </>
              )}
            </div>
          </div>
        </div>
      </Link>
    </article>
  );
}
