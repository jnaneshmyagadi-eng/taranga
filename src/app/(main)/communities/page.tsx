import { isDemoFallbackEnabled } from "@/lib/demo";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Users } from "lucide-react";
import { formatViews } from "@/lib/utils";

export const metadata = {
  title: "Communities",
};

const DEMO_COMMUNITIES = [
  {
    id: "1",
    slug: "anime-india",
    name: "Anime India",
    description: "Discuss anime, manga & Japanese culture with Indian fans.",
    member_count: 45200,
    icon_url: null,
    category: "anime",
  },
  {
    id: "2",
    slug: "gaming-india",
    name: "Gaming India",
    description: "Indian gamers — PC, mobile, esports & more.",
    member_count: 89100,
    icon_url: null,
    category: "gaming",
  },
  {
    id: "3",
    slug: "kannada-creators",
    name: "Kannada Creators",
    description: "ಕನ್ನಡ content creators supporting each other.",
    member_count: 12800,
    icon_url: null,
    category: "creators",
  },
  {
    id: "4",
    slug: "ai-india",
    name: "AI India",
    description: "AI research, tools, startups & learning in India.",
    member_count: 33400,
    icon_url: null,
    category: "technology",
  },
  {
    id: "5",
    slug: "cricket-fans",
    name: "Cricket Fans",
    description: "Match discussions, memes & cricket culture.",
    member_count: 156000,
    icon_url: null,
    category: "sports",
  },
  {
    id: "6",
    slug: "tech-kannada",
    name: "Tech Kannada",
    description: "Technology explained in ಕನ್ನಡ.",
    member_count: 9200,
    icon_url: null,
    category: "technology",
  },
];

async function getCommunities() {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("communities")
      .select(
        "id, slug, name, description, icon_url, member_count, category"
      )
      .eq("is_private", false)
      .order("member_count", { ascending: false })
      .limit(24);
    if (data && data.length > 0) return data;
  } catch {
    // fallback
  }
  if (isDemoFallbackEnabled()) return DEMO_COMMUNITIES;
  return [];
}

export default async function CommunitiesPage() {
  const communities = await getCommunities();

  return (
    <div className="max-w-[1200px] mx-auto px-3 md:px-6 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Communities</h1>
          <p className="text-sm text-[var(--foreground-muted)] mt-1">
            Find your people. Belong across languages.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {communities.map((c) => (
          <Link
            key={c.id}
            href={`/community/${c.slug}`}
            className="group p-4 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--background-card)] hover:border-[var(--border-strong)] hover:shadow-md transition"
          >
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-[var(--radius)] bg-gradient-to-br from-[var(--taranga-electric)] to-[var(--taranga-purple)] flex items-center justify-center shrink-0 overflow-hidden">
                {c.icon_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={c.icon_url}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Users className="w-6 h-6 text-white" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="font-semibold group-hover:text-[var(--primary)] transition truncate">
                  {c.name}
                </h2>
                <p className="text-xs text-[var(--foreground-subtle)] mt-0.5">
                  {formatViews(c.member_count)} members
                </p>
              </div>
            </div>
            {c.description && (
              <p className="text-sm text-[var(--foreground-muted)] mt-3 line-clamp-2">
                {c.description}
              </p>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}
