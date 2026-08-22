"use client";

import { useState } from "react";
import { cn, CATEGORIES } from "@/lib/utils";

export function CategoryPills() {
  const [active, setActive] = useState<string | null>(null);

  return (
    <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1 -mx-1 px-1">
      <button
        onClick={() => setActive(null)}
        className={cn(
          "shrink-0 px-3.5 py-1.5 rounded-full text-xs font-medium border transition-all",
          active === null
            ? "bg-[var(--foreground)] text-[var(--background)] border-transparent"
            : "bg-transparent text-[var(--foreground-muted)] border-[var(--border)] hover:border-[var(--border-strong)] hover:text-[var(--foreground)]"
        )}
      >
        All
      </button>
      {CATEGORIES.map((cat) => (
        <button
          key={cat.id}
          onClick={() => setActive(cat.id)}
          className={cn(
            "shrink-0 px-3.5 py-1.5 rounded-full text-xs font-medium border transition-all",
            active === cat.id
              ? "bg-[var(--foreground)] text-[var(--background)] border-transparent"
              : "bg-transparent text-[var(--foreground-muted)] border-[var(--border)] hover:border-[var(--border-strong)] hover:text-[var(--foreground)]"
          )}
        >
          {cat.name}
        </button>
      ))}
    </div>
  );
}
