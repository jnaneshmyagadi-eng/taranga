import type { Metadata } from "next";
import Link from "next/link";
import { searchAll } from "@/lib/queries/search";
import { VideoGrid } from "@/components/video/VideoGrid";
import { LANGUAGES, CATEGORIES, cn } from "@/lib/utils";
import { CheckCircle2, Users } from "lucide-react";

interface PageProps {
  searchParams: Promise<{
    q?: string;
    language?: string;
    category?: string;
    type?: string;
  }>;
}

export async function generateMetadata({
  searchParams,
}: PageProps): Promise<Metadata> {
  const { q } = await searchParams;
  return {
    title: q ? `Search: ${q}` : "Search",
  };
}

export default async function SearchPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const q = sp.q || "";
  const language = sp.language || null;
  const category = sp.category || null;
  const type = (sp.type as "all" | "videos" | "creators" | "communities") || "all";

  const results = q
    ? await searchAll(q, { language, category, type })
    : { videos: [], creators: [], communities: [] };

  const total =
    results.videos.length +
    results.creators.length +
    results.communities.length;

  return (
    <div className="max-w-[1400px] mx-auto px-3 md:px-6 py-4">
      <h1 className="text-xl font-bold mb-1">
        {q ? (
          <>
            Results for{" "}
            <span className="text-[var(--primary)]">&ldquo;{q}&rdquo;</span>
          </>
        ) : (
          "Search TARANGA"
        )}
      </h1>
      {q && (
        <p className="text-sm text-[var(--foreground-muted)] mb-4">
          {total} result{total !== 1 ? "s" : ""}
        </p>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-6">
        {[
          { id: "all", label: "All" },
          { id: "videos", label: "Videos" },
          { id: "creators", label: "Creators" },
          { id: "communities", label: "Communities" },
        ].map((t) => (
          <Link
            key={t.id}
            href={`/search?q=${encodeURIComponent(q)}&type=${t.id}${
              language ? `&language=${language}` : ""
            }${category ? `&category=${category}` : ""}`}
            className={cn(
              "px-3.5 py-1.5 rounded-full text-xs font-medium border transition",
              type === t.id
                ? "bg-[var(--foreground)] text-[var(--background)] border-transparent"
                : "border-[var(--border)] text-[var(--foreground-muted)] hover:border-[var(--border-strong)]"
            )}
          >
            {t.label}
          </Link>
        ))}
      </div>

      {/* Language filter chips */}
      <div className="flex flex-wrap gap-1.5 mb-6 overflow-x-auto">
        <Link
          href={`/search?q=${encodeURIComponent(q)}&type=${type}${
            category ? `&category=${category}` : ""
          }`}
          className={cn(
            "px-2.5 py-1 rounded-full text-[11px] font-medium border shrink-0",
            !language
              ? "bg-[var(--primary)] text-white border-transparent"
              : "border-[var(--border)] text-[var(--foreground-muted)]"
          )}
        >
          All languages
        </Link>
        {LANGUAGES.map((l) => (
          <Link
            key={l.code}
            href={`/search?q=${encodeURIComponent(q)}&type=${type}&language=${
              l.code
            }${category ? `&category=${category}` : ""}`}
            className={cn(
              "px-2.5 py-1 rounded-full text-[11px] font-medium border shrink-0",
              language === l.code
                ? "bg-[var(--primary)] text-white border-transparent"
                : "border-[var(--border)] text-[var(--foreground-muted)]"
            )}
          >
            {l.native}
          </Link>
        ))}
      </div>

      {!q && (
        <div className="py-16 text-center text-[var(--foreground-muted)]">
          <p className="text-sm">
            Search videos, creators, and communities across languages.
          </p>
          <p className="text-xs mt-2 text-[var(--foreground-subtle)]">
            Try: Kannada, cricket, AI, anime, Tamil comedy…
          </p>
        </div>
      )}

      {q && total === 0 && (
        <div className="py-16 text-center text-[var(--foreground-muted)] text-sm">
          No results found. Try a different query or language filter.
        </div>
      )}

      {/* Creators */}
      {results.creators.length > 0 && (
        <section className="mb-8">
          <h2 className="text-sm font-semibold text-[var(--foreground-muted)] uppercase tracking-wide mb-3">
            Creators
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {results.creators.map((c) => (
              <Link
                key={c.id}
                href={`/creator/${c.username}`}
                className="flex items-center gap-3 p-3 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--background-card)] hover:border-[var(--border-strong)] transition"
              >
                <div className="w-12 h-12 rounded-full bg-[var(--background)] border border-[var(--border)] overflow-hidden flex items-center justify-center text-sm font-semibold text-[var(--primary)] shrink-0">
                  {c.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={c.avatar_url}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    (c.display_name || c.username).charAt(0).toUpperCase()
                  )}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1 font-medium text-sm">
                    <span className="truncate">
                      {c.display_name || c.username}
                    </span>
                    {c.is_verified && (
                      <CheckCircle2 className="w-3.5 h-3.5 text-[var(--primary)] shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-[var(--foreground-subtle)] truncate">
                    @{c.username}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Communities */}
      {results.communities.length > 0 && (
        <section className="mb-8">
          <h2 className="text-sm font-semibold text-[var(--foreground-muted)] uppercase tracking-wide mb-3">
            Communities
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {results.communities.map((c) => (
              <Link
                key={c.id}
                href={`/community/${c.slug}`}
                className="flex items-center gap-3 p-3 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--background-card)] hover:border-[var(--border-strong)] transition"
              >
                <div className="w-12 h-12 rounded-[var(--radius)] bg-[var(--background)] border border-[var(--border)] flex items-center justify-center shrink-0">
                  {c.icon_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={c.icon_url}
                      alt=""
                      className="w-full h-full object-cover rounded-[var(--radius)]"
                    />
                  ) : (
                    <Users className="w-5 h-5 text-[var(--primary)]" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-sm truncate">{c.name}</p>
                  <p className="text-xs text-[var(--foreground-subtle)]">
                    {c.member_count} members
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Videos */}
      {results.videos.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-[var(--foreground-muted)] uppercase tracking-wide mb-3">
            Videos
          </h2>
          <VideoGrid videos={results.videos} />
        </section>
      )}
    </div>
  );
}
