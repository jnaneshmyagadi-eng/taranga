import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { getCreatorVideos } from "@/lib/queries/videos";
import { getIsFollowing } from "@/lib/actions/interactions";
import { FollowButton } from "@/components/actions/FollowButton";
import { VideoGrid } from "@/components/video/VideoGrid";
import { formatViews } from "@/lib/utils";
import { CheckCircle2 } from "lucide-react";
import { isDemoFallbackEnabled } from "@/lib/demo";

interface PageProps {
  params: Promise<{ username: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { username } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("display_name, bio, username")
    .eq("username", username)
    .maybeSingle();
  if (!data) return { title: "Creator not found" };
  return {
    title: data.display_name || data.username,
    description: data.bio || `Watch videos from @${data.username} on TARANGA`,
  };
}

export default async function CreatorPage({ params }: PageProps) {
  const { username } = await params;
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "id, username, display_name, avatar_url, cover_url, bio, is_verified, is_creator, created_at"
    )
    .eq("username", username)
    .maybeSingle();

  if (!profile) {
    if (!isDemoFallbackEnabled()) notFound();
    const demoCreators: Record<
      string,
      {
        id: string;
        username: string;
        display_name: string;
        avatar_url: null;
        cover_url: null;
        bio: string;
        is_verified: boolean;
      }
    > = {
      techkannada: {
        id: "demo-techkannada",
        username: "techkannada",
        display_name: "Tech Kannada",
        avatar_url: null,
        cover_url: null,
        bio: "AI, coding & tech in ಕನ್ನಡ. Building the future from Bengaluru.",
        is_verified: true,
      },
      cricketwave: {
        id: "demo-cricketwave",
        username: "cricketwave",
        display_name: "Cricket Wave",
        avatar_url: null,
        cover_url: null,
        bio: "Match highlights, analysis & cricket culture across India.",
        is_verified: true,
      },
      animeindia: {
        id: "demo-animeindia",
        username: "animeindia",
        display_name: "Anime India",
        avatar_url: null,
        cover_url: null,
        bio: "Anime reviews, recaps & community for Indian fans.",
        is_verified: true,
      },
    };
    const demo = demoCreators[username];
    if (!demo) notFound();

    return (
      <CreatorView
        profile={{
          ...demo,
          is_creator: true,
          created_at: new Date().toISOString(),
        }}
        videos={[]}
        following={false}
        stats={{ followers: 12500, views: 1284000, videos: 42 }}
      />
    );
  }

  const [videos, following, followerCount, creatorProfile] = await Promise.all([
    getCreatorVideos(profile.id),
    getIsFollowing(profile.id),
    supabase
      .from("follows")
      .select("id", { count: "exact", head: true })
      .eq("following_id", profile.id)
      .then((r) => r.count || 0),
    supabase
      .from("creator_profiles")
      .select("total_views, total_videos, total_subscribers")
      .eq("user_id", profile.id)
      .maybeSingle()
      .then((r) => r.data),
  ]);

  return (
    <CreatorView
      profile={profile}
      videos={videos}
      following={following}
      stats={{
        followers:
          creatorProfile?.total_subscribers || followerCount || 0,
        views: Number(creatorProfile?.total_views) || 0,
        videos: creatorProfile?.total_videos || videos.length,
      }}
    />
  );
}

function CreatorView({
  profile,
  videos,
  following,
  stats,
}: {
  profile: {
    id: string;
    username: string;
    display_name: string | null;
    avatar_url: string | null;
    cover_url: string | null;
    bio: string | null;
    is_verified: boolean;
    is_creator?: boolean;
    created_at: string;
  };
  videos: import("@/components/video/VideoCard").VideoCardData[];
  following: boolean;
  stats: { followers: number; views: number; videos: number };
}) {
  return (
    <div className="max-w-[1400px] mx-auto">
      <div className="relative h-32 md:h-48 bg-gradient-to-br from-[var(--taranga-blue)] via-[var(--taranga-purple)] to-[var(--taranga-magenta)]">
        {profile.cover_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={profile.cover_url}
            alt=""
            className="w-full h-full object-cover"
          />
        )}
      </div>

      <div className="px-4 md:px-6 -mt-12 md:-mt-16 relative z-10">
        <div className="flex flex-col sm:flex-row sm:items-end gap-4">
          <div className="w-24 h-24 md:w-32 md:h-32 rounded-full border-4 border-[var(--background)] bg-[var(--background-card)] overflow-hidden flex items-center justify-center text-2xl font-bold text-[var(--primary)] shrink-0">
            {profile.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profile.avatar_url}
                alt=""
                className="w-full h-full object-cover"
              />
            ) : (
              (profile.display_name || profile.username).charAt(0).toUpperCase()
            )}
          </div>

          <div className="flex-1 min-w-0 pb-2">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl md:text-2xl font-bold truncate">
                {profile.display_name || profile.username}
              </h1>
              {profile.is_verified && (
                <CheckCircle2 className="w-5 h-5 text-[var(--primary)] shrink-0" />
              )}
            </div>
            <p className="text-sm text-[var(--foreground-muted)]">
              @{profile.username}
            </p>
          </div>

          <FollowButton
            targetUserId={profile.id}
            initialFollowing={following}
            className="shrink-0"
          />
        </div>

        {profile.bio && (
          <p className="mt-3 text-sm text-[var(--foreground-muted)] max-w-2xl leading-relaxed">
            {profile.bio}
          </p>
        )}

        <div className="flex gap-6 mt-4 text-sm">
          <div>
            <span className="font-semibold tabular-nums">
              {formatViews(stats.followers)}
            </span>{" "}
            <span className="text-[var(--foreground-muted)]">followers</span>
          </div>
          <div>
            <span className="font-semibold tabular-nums">
              {formatViews(stats.views)}
            </span>{" "}
            <span className="text-[var(--foreground-muted)]">views</span>
          </div>
          <div>
            <span className="font-semibold tabular-nums">{stats.videos}</span>{" "}
            <span className="text-[var(--foreground-muted)]">videos</span>
          </div>
        </div>

        <div className="flex gap-1 mt-6 border-b border-[var(--border)]">
          {["Videos", "Shorts", "Playlists", "About"].map((tab, i) => (
            <button
              key={tab}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition ${
                i === 0
                  ? "border-[var(--primary)] text-[var(--primary)]"
                  : "border-transparent text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="py-6">
          {videos.length > 0 ? (
            <VideoGrid videos={videos} />
          ) : (
            <div className="py-12 text-center text-[var(--foreground-muted)] text-sm">
              No public videos yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
