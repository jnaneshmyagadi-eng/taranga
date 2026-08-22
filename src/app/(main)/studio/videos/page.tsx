import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatViews, formatRelativeTime } from "@/lib/utils";

export const metadata: Metadata = {
  title: "My Videos · Studio",
  robots: { index: false, follow: false },
};

export default async function StudioVideosPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?redirect=/studio/videos");

  const { data: videos } = await supabase
    .from("videos")
    .select(
      "id, title, slug, status, visibility, view_count, like_count, comment_count, published_at, created_at, thumbnail_url, is_short"
    )
    .eq("creator_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  const list = videos || [];

  return (
    <div className="max-w-5xl mx-auto px-3 md:px-6 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Videos</h1>
        <Link
          href="/create"
          className="px-4 py-2 rounded-full bg-[var(--accent)] text-[var(--accent-foreground)] text-sm font-semibold"
        >
          Upload
        </Link>
      </div>

      {list.length === 0 ? (
        <p className="text-sm text-[var(--foreground-muted)] py-12 text-center">
          No videos.{" "}
          <Link href="/create" className="text-[var(--primary)]">
            Upload one
          </Link>
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[var(--foreground-subtle)] border-b border-[var(--border)]">
                <th className="py-2 pr-4 font-medium">Video</th>
                <th className="py-2 pr-4 font-medium">Status</th>
                <th className="py-2 pr-4 font-medium">Visibility</th>
                <th className="py-2 pr-4 font-medium tabular-nums">Views</th>
                <th className="py-2 font-medium">Created</th>
              </tr>
            </thead>
            <tbody>
              {list.map((v) => (
                <tr
                  key={v.id}
                  className="border-b border-[var(--border)] hover:bg-[var(--background-hover)]"
                >
                  <td className="py-3 pr-4">
                    <Link
                      href={
                        v.status === "ready"
                          ? `/watch/${v.slug || v.id}`
                          : "#"
                      }
                      className="flex items-center gap-3"
                    >
                      <div className="w-20 aspect-video rounded bg-[var(--background-card)] overflow-hidden shrink-0">
                        {v.thumbnail_url && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={v.thumbnail_url}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        )}
                      </div>
                      <span className="line-clamp-2 font-medium">
                        {v.title}
                        {v.is_short && (
                          <span className="ml-1 text-[10px] text-[var(--primary)]">
                            SHORT
                          </span>
                        )}
                      </span>
                    </Link>
                  </td>
                  <td className="py-3 pr-4 capitalize">{v.status}</td>
                  <td className="py-3 pr-4 capitalize">{v.visibility}</td>
                  <td className="py-3 pr-4 tabular-nums">
                    {formatViews(Number(v.view_count))}
                  </td>
                  <td className="py-3 text-[var(--foreground-subtle)]">
                    {formatRelativeTime(v.created_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
