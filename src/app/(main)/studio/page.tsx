import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatViews } from "@/lib/utils";
import {
  Eye,
  Clock,
  Users,
  ThumbsUp,
  MessageCircle,
  Video,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Creator Studio",
  robots: { index: false, follow: false },
};

export default async function StudioPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirect=/studio");
  }

  const { data: videos } = await supabase
    .from("videos")
    .select(
      "id, title, slug, view_count, like_count, comment_count, duration_seconds, status, published_at, thumbnail_url"
    )
    .eq("creator_id", user.id)
    .order("published_at", { ascending: false, nullsFirst: false })
    .limit(20);

  const list = videos || [];
  const totalViews = list.reduce((s, v) => s + Number(v.view_count || 0), 0);
  const totalLikes = list.reduce((s, v) => s + Number(v.like_count || 0), 0);
  const totalComments = list.reduce(
    (s, v) => s + Number(v.comment_count || 0),
    0
  );
  const watchTimeSec = list.reduce(
    (s, v) => s + Number(v.duration_seconds || 0) * Number(v.view_count || 0),
    0
  );

  const { count: followerCount } = await supabase
    .from("follows")
    .select("id", { count: "exact", head: true })
    .eq("following_id", user.id);

  const stats = [
    {
      label: "Views",
      value: formatViews(totalViews),
      icon: Eye,
    },
    {
      label: "Est. watch time",
      value:
        watchTimeSec > 3600
          ? `${(watchTimeSec / 3600).toFixed(1)}h`
          : `${Math.round(watchTimeSec / 60)}m`,
      icon: Clock,
    },
    {
      label: "Followers",
      value: formatViews(followerCount || 0),
      icon: Users,
    },
    {
      label: "Likes",
      value: formatViews(totalLikes),
      icon: ThumbsUp,
    },
    {
      label: "Comments",
      value: formatViews(totalComments),
      icon: MessageCircle,
    },
    {
      label: "Videos",
      value: String(list.length),
      icon: Video,
    },
  ];

  return (
    <div className="max-w-5xl mx-auto px-3 md:px-6 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Creator Studio</h1>
          <p className="text-sm text-[var(--foreground-muted)] mt-0.5">
            Your channel at a glance
          </p>
        </div>
        <Link
          href="/create"
          className="px-4 py-2 rounded-full bg-[var(--accent)] text-[var(--accent-foreground)] text-sm font-semibold hover:opacity-90 transition"
        >
          Upload
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-8">
        {stats.map((s) => (
          <div
            key={s.label}
            className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--background-card)] p-4"
          >
            <div className="flex items-center gap-2 text-[var(--foreground-muted)] mb-2">
              <s.icon className="w-4 h-4" />
              <span className="text-xs font-medium uppercase tracking-wide">
                {s.label}
              </span>
            </div>
            <p className="text-2xl font-bold tabular-nums">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-2 mb-4 overflow-x-auto">
        {[
          { href: "/studio", label: "Overview" },
          { href: "/studio/videos", label: "Videos" },
          { href: "/studio/analytics", label: "Analytics" },
          { href: "/studio/comments", label: "Comments" },
        ].map((t) => (
          <Link
            key={t.href}
            href={t.href}
            className={`px-3.5 py-1.5 rounded-full text-xs font-medium border shrink-0 ${
              t.href === "/studio"
                ? "bg-[var(--foreground)] text-[var(--background)] border-transparent"
                : "border-[var(--border)] text-[var(--foreground-muted)]"
            }`}
          >
            {t.label}
          </Link>
        ))}
      </div>

      <h2 className="text-sm font-semibold text-[var(--foreground-muted)] uppercase tracking-wide mb-3">
        Recent videos
      </h2>

      {list.length === 0 ? (
        <div className="py-12 text-center text-sm text-[var(--foreground-muted)] border border-dashed border-[var(--border)] rounded-[var(--radius-lg)]">
          No videos yet.{" "}
          <Link href="/create" className="text-[var(--primary)] hover:underline">
            Upload your first video
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {list.map((v) => (
            <Link
              key={v.id}
              href={v.status === "ready" ? `/watch/${v.slug || v.id}` : "/studio/videos"}
              className="flex items-center gap-3 p-3 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--background-card)] hover:border-[var(--border-strong)] transition"
            >
              <div className="w-28 aspect-video rounded bg-[var(--background)] overflow-hidden shrink-0">
                {v.thumbnail_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={v.thumbnail_url}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[10px] text-[var(--foreground-subtle)]">
                    No thumb
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium line-clamp-1">{v.title}</p>
                <p className="text-xs text-[var(--foreground-subtle)] mt-0.5 capitalize">
                  {v.status} · {formatViews(Number(v.view_count))} views ·{" "}
                  {formatViews(Number(v.like_count))} likes
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
