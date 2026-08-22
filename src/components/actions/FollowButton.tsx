"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { toggleFollow } from "@/lib/actions/interactions";
import { cn } from "@/lib/utils";

interface FollowButtonProps {
  targetUserId: string;
  initialFollowing?: boolean;
  size?: "sm" | "default" | "lg";
  className?: string;
}

export function FollowButton({
  targetUserId,
  initialFollowing = false,
  size = "default",
  className,
}: FollowButtonProps) {
  const [following, setFollowing] = useState(initialFollowing);
  const [pending, startTransition] = useTransition();

  function handleClick() {
    const next = !following;
    setFollowing(next);
    startTransition(async () => {
      const res = await toggleFollow(targetUserId);
      if (!res.success) {
        setFollowing(!next);
      } else {
        setFollowing(res.following);
      }
    });
  }

  return (
    <Button
      variant={following ? "secondary" : "default"}
      size={size}
      className={cn("rounded-full min-w-[96px]", className)}
      onClick={handleClick}
      disabled={pending}
    >
      {following ? "Following" : "Follow"}
    </Button>
  );
}
