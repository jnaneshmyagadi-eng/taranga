import { getFeedVideos, type FeedTab } from "@/lib/queries/videos";
import { InfiniteFeed } from "@/components/feed/InfiniteFeed";
import { createClient } from "@/lib/supabase/server";
import type { VideoCardData } from "@/components/video/VideoCard";
import { isDemoFallbackEnabled } from "@/lib/demo";

const DEMO_VIDEOS: VideoCardData[] = [
  {
    id: "demo-1",
    slug: "building-ai-agents-kannada",
    title: "Building AI Agents from Scratch — ಕನ್ನಡದಲ್ಲಿ | Full Course",
    thumbnail_url: null,
    duration_seconds: 1842,
    view_count: 128400,
    published_at: new Date(Date.now() - 1000 * 60 * 60 * 18).toISOString(),
    category: "technology",
    language: "kn",
    creator: {
      username: "techkannada",
      display_name: "Tech Kannada",
      avatar_url: null,
      is_verified: true,
    },
  },
  {
    id: "demo-2",
    slug: "cricket-highlights-ind-vs-aus",
    title: "India vs Australia — Match Highlights & Analysis",
    thumbnail_url: null,
    duration_seconds: 956,
    view_count: 890200,
    published_at: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    category: "sports",
    language: "hi",
    creator: {
      username: "cricketwave",
      display_name: "Cricket Wave",
      avatar_url: null,
      is_verified: true,
    },
  },
  {
    id: "demo-3",
    slug: "anime-recap-demon-slayer",
    title: "Demon Slayer Season 4 Explained — Every Detail You Missed",
    thumbnail_url: null,
    duration_seconds: 1240,
    view_count: 456000,
    published_at: new Date(Date.now() - 1000 * 60 * 60 * 36).toISOString(),
    category: "anime",
    language: "en",
    creator: {
      username: "animeindia",
      display_name: "Anime India",
      avatar_url: null,
      is_verified: true,
    },
  },
  {
    id: "demo-4",
    slug: "tamil-comedy-skit",
    title: "Office Politics — Tamil Comedy Skit | Must Watch",
    thumbnail_url: null,
    duration_seconds: 412,
    view_count: 2103000,
    published_at: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    category: "comedy",
    language: "ta",
    creator: {
      username: "madraasvibes",
      display_name: "Madras Vibes",
      avatar_url: null,
      is_verified: false,
    },
  },
  {
    id: "demo-5",
    slug: "learn-react-2026",
    title: "React 19 + Next.js 16 — Complete Beginner to Advanced",
    thumbnail_url: null,
    duration_seconds: 3600,
    view_count: 98700,
    published_at: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(),
    category: "education",
    language: "en",
    creator: {
      username: "codewithindia",
      display_name: "Code with India",
      avatar_url: null,
      is_verified: true,
    },
  },
  {
    id: "demo-6",
    slug: "classical-music-fusion",
    title: "Carnatic + Electronic Fusion Live Performance",
    thumbnail_url: null,
    duration_seconds: 1680,
    view_count: 342000,
    published_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    category: "music",
    language: "en",
    creator: {
      username: "soundofindia",
      display_name: "Sound of India",
      avatar_url: null,
      is_verified: true,
    },
  },
  {
    id: "demo-7",
    slug: "startup-story-bangalore",
    title: "How We Built a ₹100Cr Startup in Bangalore — Honest Story",
    thumbnail_url: null,
    duration_seconds: 1456,
    view_count: 567000,
    published_at: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
    category: "creators",
    language: "en",
    creator: {
      username: "founderfiles",
      display_name: "Founder Files",
      avatar_url: null,
      is_verified: true,
    },
  },
  {
    id: "demo-8",
    slug: "malayalam-travel-kerala",
    title: "Hidden Gems of Kerala — മലയാളം Travel Vlog",
    thumbnail_url: null,
    duration_seconds: 892,
    view_count: 189000,
    published_at: new Date(Date.now() - 1000 * 60 * 60 * 60).toISOString(),
    category: "entertainment",
    language: "ml",
    creator: {
      username: "keralatrails",
      display_name: "Kerala Trails",
      avatar_url: null,
      is_verified: false,
    },
  },
];

interface HomeFeedProps {
  tab?: FeedTab;
  category?: string | null;
}

export async function HomeFeed({ tab = "for-you", category }: HomeFeedProps) {
  let userId: string | null = null;
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    userId = user?.id ?? null;
  } catch {
    // no supabase
  }

  const { videos, nextCursor } = await getFeedVideos(tab, {
    limit: 12,
    category,
    userId,
  });

  const isDemo = videos.length === 0 && isDemoFallbackEnabled();
  const list = isDemo ? DEMO_VIDEOS : videos;

  if (videos.length === 0 && !isDemoFallbackEnabled()) {
    return (
      <div className="py-16 text-center text-[var(--foreground-muted)] text-sm">
        No videos yet. Be the first to create on TARANGA.
      </div>
    );
  }

  return (
    <InfiniteFeed
      initialVideos={list}
      initialCursor={isDemo ? null : nextCursor}
      tab={tab}
      category={category}
    />
  );
}
