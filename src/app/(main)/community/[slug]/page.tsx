import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { getIsMember } from "@/lib/actions/communities";
import { JoinButton } from "@/components/community/JoinButton";
import { CommunityPosts } from "@/components/community/CommunityPosts";
import { Users, Shield } from "lucide-react";
import { formatViews } from "@/lib/utils";

interface PageProps {
  params: Promise<{ slug: string }>;
}

const DEMO: Record<
  string,
  {
    name: string;
    description: string;
    member_count: number;
    rules: string[];
    category: string;
  }
> = {
  "anime-india": {
    name: "Anime India",
    description:
      "Discuss anime, manga & Japanese culture with Indian fans. Spoilers tagged.",
    member_count: 45200,
    rules: ["Be respectful", "Tag spoilers", "No piracy links", "Stay on topic"],
    category: "anime",
  },
  "gaming-india": {
    name: "Gaming India",
    description: "Indian gamers — PC, mobile, esports & more.",
    member_count: 89100,
    rules: ["No toxicity", "No cheating discussion", "English or regional OK"],
    category: "gaming",
  },
  "kannada-creators": {
    name: "Kannada Creators",
    description: "ಕನ್ನಡ content creators supporting each other.",
    member_count: 12800,
    rules: ["Support fellow creators", "Share feedback kindly"],
    category: "creators",
  },
  "ai-india": {
    name: "AI India",
    description: "AI research, tools, startups & learning in India.",
    member_count: 33400,
    rules: ["Share sources", "No hype without evidence"],
    category: "technology",
  },
  "cricket-fans": {
    name: "Cricket Fans",
    description: "Match discussions, memes & cricket culture.",
    member_count: 156000,
    rules: ["No personal attacks on players", "Memes welcome"],
    category: "sports",
  },
  "tech-kannada": {
    name: "Tech Kannada",
    description: "Technology explained in ಕನ್ನಡ.",
    member_count: 9200,
    rules: ["Prefer Kannada", "Help beginners"],
    category: "technology",
  },
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const demo = DEMO[slug];
  return {
    title: demo?.name || slug,
    description: demo?.description,
  };
}

export default async function CommunityPage({ params }: PageProps) {
  const { slug } = await params;

  let community: {
    id: string;
    slug: string;
    name: string;
    description: string | null;
    member_count: number;
    rules: unknown;
    category: string | null;
    icon_url: string | null;
    banner_url: string | null;
  } | null = null;

  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("communities")
      .select(
        "id, slug, name, description, member_count, rules, category, icon_url, banner_url"
      )
      .eq("slug", slug)
      .maybeSingle();
    community = data;
  } catch {
    // fallback
  }

  if (!community) {
    const demo = DEMO[slug];
    if (!demo) notFound();
    community = {
      id: `demo-${slug}`,
      slug,
      name: demo.name,
      description: demo.description,
      member_count: demo.member_count,
      rules: demo.rules,
      category: demo.category,
      icon_url: null,
      banner_url: null,
    };
  }

  const isDemo = community.id.startsWith("demo-");
  const isMember = isDemo ? false : await getIsMember(community.id);
  const rules = Array.isArray(community.rules)
    ? (community.rules as string[])
    : [];

  return (
    <div className="max-w-[1000px] mx-auto">
      <div className="h-28 md:h-40 bg-gradient-to-r from-[var(--taranga-blue)] to-[var(--taranga-purple)] relative">
        {community.banner_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={community.banner_url}
            alt=""
            className="w-full h-full object-cover"
          />
        )}
      </div>

      <div className="px-4 md:px-6 -mt-8 relative z-10 pb-10">
        <div className="flex items-end gap-4">
          <div className="w-20 h-20 rounded-[var(--radius-lg)] border-4 border-[var(--background)] bg-gradient-to-br from-[var(--taranga-electric)] to-[var(--taranga-magenta)] flex items-center justify-center overflow-hidden shrink-0">
            {community.icon_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={community.icon_url}
                alt=""
                className="w-full h-full object-cover"
              />
            ) : (
              <Users className="w-8 h-8 text-white" />
            )}
          </div>
          <div className="flex-1 min-w-0 pb-1">
            <h1 className="text-xl md:text-2xl font-bold">{community.name}</h1>
            <p className="text-sm text-[var(--foreground-muted)]">
              {formatViews(community.member_count)} members
              {community.category && (
                <span className="capitalize"> · {community.category}</span>
              )}
            </p>
          </div>
          {!isDemo && (
            <JoinButton
              communityId={community.id}
              slug={slug}
              initialJoined={isMember}
            />
          )}
        </div>

        {community.description && (
          <p className="mt-4 text-sm text-[var(--foreground-muted)] leading-relaxed max-w-2xl">
            {community.description}
          </p>
        )}

        {rules.length > 0 && (
          <div className="mt-6 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--background-card)] p-4">
            <div className="flex items-center gap-2 mb-3">
              <Shield className="w-4 h-4 text-[var(--primary)]" />
              <h2 className="text-sm font-semibold">Rules</h2>
            </div>
            <ol className="list-decimal list-inside space-y-1.5 text-sm text-[var(--foreground-muted)]">
              {rules.map((r, i) => (
                <li key={i}>{r}</li>
              ))}
            </ol>
          </div>
        )}

        {!isDemo ? (
          <CommunityPosts
            communityId={community.id}
            slug={slug}
            isMember={isMember}
          />
        ) : (
          <div className="mt-8 py-12 text-center text-sm text-[var(--foreground-muted)] border border-dashed border-[var(--border)] rounded-[var(--radius-lg)]">
            Seed this community in Supabase to enable join & posts.
          </div>
        )}
      </div>
    </div>
  );
}
