"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { joinCommunity, leaveCommunity } from "@/lib/actions/communities";

interface JoinButtonProps {
  communityId: string;
  slug: string;
  initialJoined?: boolean;
}

export function JoinButton({
  communityId,
  slug,
  initialJoined = false,
}: JoinButtonProps) {
  const [joined, setJoined] = useState(initialJoined);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleClick() {
    setError(null);
    const next = !joined;
    setJoined(next);
    startTransition(async () => {
      const res = next
        ? await joinCommunity(communityId, slug)
        : await leaveCommunity(communityId, slug);
      if (!res.success) {
        setJoined(!next);
        setError(res.error || "Failed");
      }
    });
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        variant={joined ? "secondary" : "default"}
        className="rounded-full min-w-[88px]"
        onClick={handleClick}
        disabled={pending}
      >
        {joined ? "Joined" : "Join"}
      </Button>
      {error && <span className="text-[10px] text-[var(--danger)]">{error}</span>}
    </div>
  );
}
