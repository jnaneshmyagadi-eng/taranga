"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

const tabs = [
  { id: "for-you", label: "For You" },
  { id: "following", label: "Following" },
  { id: "trending", label: "Trending" },
  { id: "live", label: "Live" },
  { id: "regional", label: "Regional" },
];

export function FeedTabs() {
  const [active, setActive] = useState("for-you");

  return (
    <div className="flex gap-1 overflow-x-auto scrollbar-none -mx-1 px-1">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => setActive(tab.id)}
          className={cn(
            "shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200",
            active === tab.id
              ? "bg-[var(--primary)] text-white shadow-sm"
              : "bg-[var(--background-card)] text-[var(--foreground-muted)] hover:bg-[var(--background-hover)] hover:text-[var(--foreground)]"
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
