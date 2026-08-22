import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import {
  getVideoByIdOrSlug,
  getRelatedVideos,
} from "@/lib/queries/videos";
import {
  getUserLiked,
  getUserSaved,
  getIsFollowing,
} from "@/lib/actions/interactions";
import { WatchPlayer } from "@/components/player/WatchPlayer";
import { resolveVideoSources } from "@/lib/actions/video-access";
import { isDemoFallbackEnabled, DEMO_SAMPLE_MP4 } from "@/lib/demo";
import { VideoActions } from "@/components/actions/VideoActions";
import { FollowButton } from "@/components/actions/FollowButton";
import { CommentSection } from "@/components/comments/CommentSection";
import { VideoCard } from "@/components/video/VideoCard";
import { formatViews, formatRelativeTime } from "@/lib/utils";
import { CheckCircle2 } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

interface PageProps {
  params: Promise<{ videoId: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { videoId } = await params;
  const video = await getVideoByIdOrSlug(videoId);
  if (!video) return { title: "Video not found" };
  return {
    title: video.title,
    description: video.description?.slice(0, 160) || video.title,
    openGraph: {
      title: video.title,
      description: video.description?.slice(0, 160) || undefined,
      type: "video.other",
      images: video.thumbnail_url ? [video.thumbnail_url] : [],
    },
  };
}

export default async function WatchPage({ params }: PageProps) {
  const { videoId } = await params;
  const video = await getVideoByIdOrSlug(videoId);

  if (!video) {
    notFound();
  }

  const supabase = await createClient();

  // Secure signed URLs for private video bucket
  let sources = await resolveVideoSources(video.id);
  // Development fallback only when no assets exist
  if (sources.length === 0 && isDemoFallbackEnabled()) {
    sources = [
      {
        src: DEMO_SAMPLE_MP4,
        quality: "720p",
        type: "video/mp4",
      },
    ];
  }

  const [liked, saved, following, related] = await Promise.all([
    getUserLiked(video.id),
    getUserSaved(video.id),
    video.creator ? getIsFollowing(video.creator.id) : Promise.resolve(false),
    getRelatedVideos(video.id, video.category, video.language),
  ]);

  // Initial watch position
  let initialTime = 0;
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const { data: hist } = await supabase
        .from("watch_history")
        .select("progress_seconds")
        .eq("user_id", user.id)
        .eq("video_id", video.id)
        .maybeSingle();
      if (hist?.progress_seconds) initialTime = hist.progress_seconds;
    }
  } catch {
    // ignore
  }

  return (
    <div className="max-w-[1600px] mx-auto px-0 md:px-4 py-0 md:py-4">
      <div className="flex flex-col lg:flex-row gap-4 lg:gap-6">
        {/* Main column */}
        <div className="flex-1 min-w-0">
          {/* Player */}
          <div className="md:rounded-[var(--radius)] overflow-hidden bg-black">
            <WatchPlayer
              videoId={video.id}
              sources={sources}
              poster={video.thumbnail_url}
              title={video.title}
              durationSeconds={video.duration_seconds || 0}
              initialTime={initialTime}
            />
          </div>

          <div className="px-3 md:px-0 mt-3 md:mt-4 space-y-3">
            {/* Title */}
            <h1 className="text-lg md:text-xl font-semibold leading-snug text-balance">
              {video.title}
            </h1>

            {/* Meta row */}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-[var(--foreground-muted)]">
              <span>{formatViews(Number(video.view_count))} views</span>
              <span>·</span>
              <span>
                {video.published_at
                  ? formatRelativeTime(video.published_at)
                  : "Unpublished"}
              </span>
              {video.language && (
                <>
                  <span>·</span>
                  <span className="uppercase text-xs font-medium px-1.5 py-0.5 rounded bg-[var(--background-card)]">
                    {video.language}
                  </span>
                </>
              )}
              {video.category && (
                <>
                  <span>·</span>
                  <span className="capitalize">{video.category}</span>
                </>
              )}
            </div>

            {/* Creator + actions */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 py-2 border-y border-[var(--border)]">
              {video.creator && (
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <Link
                    href={`/creator/${video.creator.username}`}
                    className="shrink-0"
                  >
                    <div className="w-11 h-11 rounded-full bg-[var(--background-card)] border border-[var(--border)] overflow-hidden flex items-center justify-center text-sm font-semibold text-[var(--primary)]">
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
                    <Link
                      href={`/creator/${video.creator.username}`}
                      className="flex items-center gap-1 font-medium hover:text-[var(--primary)] transition"
                    >
                      <span className="truncate">
                        {video.creator.display_name || video.creator.username}
                      </span>
                      {video.creator.is_verified && (
                        <CheckCircle2 className="w-4 h-4 text-[var(--primary)] shrink-0" />
                      )}
                    </Link>
                    <p className="text-xs text-[var(--foreground-subtle)]">
                      @{video.creator.username}
                    </p>
                  </div>
                  <FollowButton
                    targetUserId={video.creator.id}
                    initialFollowing={following}
                    size="sm"
                  />
                </div>
              )}
            </div>

            <VideoActions
              videoId={video.id}
              likeCount={video.like_count || 0}
              commentCount={video.comment_count || 0}
              initialLiked={liked}
              initialSaved={saved}
            />

            {/* Description */}
            {(video.description || (video.tags && video.tags.length > 0)) && (
              <div className="rounded-[var(--radius)] bg-[var(--background-card)] border border-[var(--border)] p-3 md:p-4">
                {video.description && (
                  <p className="text-sm whitespace-pre-wrap leading-relaxed">
                    {video.description}
                  </p>
                )}
                {video.tags && video.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {video.tags.map((tag) => (
                      <Link
                        key={tag}
                        href={`/search?q=${encodeURIComponent("#" + tag)}`}
                        className="text-xs text-[var(--primary)] hover:underline"
                      >
                        #{tag}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Comments */}
            <CommentSection
              videoId={video.id}
              initialCount={video.comment_count || 0}
            />
          </div>
        </div>

        {/* Recommended rail */}
        <aside className="w-full lg:w-80 xl:w-96 shrink-0 px-3 md:px-0 space-y-3">
          <h2 className="text-sm font-semibold text-[var(--foreground-muted)] uppercase tracking-wide">
            Recommended
          </h2>
          {related.length === 0 ? (
            <p className="text-sm text-[var(--foreground-subtle)]">
              No related videos yet.
            </p>
          ) : (
            <div className="flex flex-col gap-3">
              {related.map((v) => (
                <VideoCard key={v.id} video={v} />
              ))}
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
