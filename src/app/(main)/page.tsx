import { FeedTabs } from "@/components/video/FeedTabs";
import { CategoryPills } from "@/components/video/CategoryPills";
import { HomeFeed } from "@/components/feed/HomeFeed";
import { Suspense } from "react";

function FeedSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-6">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="space-y-2.5">
          <div className="aspect-video rounded-[var(--radius)] skeleton" />
          <div className="flex gap-3">
            <div className="w-9 h-9 rounded-full skeleton shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-full skeleton" />
              <div className="h-3 w-2/3 skeleton" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function HomePage() {
  return (
    <div className="max-w-[1400px] mx-auto px-3 md:px-6 py-4">
      <FeedTabs />
      <div className="mt-3 mb-5">
        <CategoryPills />
      </div>
      <Suspense fallback={<FeedSkeleton />}>
        <HomeFeed tab="for-you" />
      </Suspense>
    </div>
  );
}
