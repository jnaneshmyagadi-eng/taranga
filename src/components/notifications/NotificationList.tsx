"use client";

import { useTransition } from "react";
import Link from "next/link";
import { markNotificationRead } from "@/lib/actions/notifications";
import { formatRelativeTime, cn } from "@/lib/utils";
import {
  UserPlus,
  MessageCircle,
  Heart,
  Radio,
  Users,
  Bell,
} from "lucide-react";

interface NotificationItem {
  id: string;
  type: string;
  title: string | null;
  body: string | null;
  data: Record<string, unknown> | null;
  is_read: boolean;
  created_at: string;
  actor: {
    id: string;
    username: string;
    display_name: string | null;
    avatar_url: string | null;
  } | null;
}

function iconFor(type: string) {
  switch (type) {
    case "new_follower":
      return UserPlus;
    case "comment":
    case "reply":
      return MessageCircle;
    case "like":
      return Heart;
    case "live_starting":
      return Radio;
    case "community_activity":
      return Users;
    default:
      return Bell;
  }
}

export function NotificationList({
  initial,
}: {
  initial: NotificationItem[];
}) {
  const [pending, startTransition] = useTransition();
  const items = initial;

  function handleClick(id: string, isRead: boolean) {
    if (isRead) return;
    startTransition(async () => {
      await markNotificationRead(id);
    });
  }

  if (items.length === 0) {
    return (
      <div className="py-16 text-center text-sm text-[var(--foreground-muted)]">
        No notifications yet. Follow creators and join communities to stay in the loop.
      </div>
    );
  }

  return (
    <ul className="space-y-1">
      {items.map((n) => {
        const Icon = iconFor(n.type);
        const href =
          n.type === "new_follower" && n.actor
            ? `/creator/${n.actor.username}`
            : n.type === "community_activity" && n.data?.slug
              ? `/community/${n.data.slug}`
              : n.data?.video_id
                ? `/watch/${n.data.video_id}`
                : "#";

        return (
          <li key={n.id}>
            <Link
              href={href}
              onClick={() => handleClick(n.id, n.is_read)}
              className={cn(
                "flex items-start gap-3 p-3 rounded-[var(--radius)] transition hover:bg-[var(--background-hover)]",
                !n.is_read && "bg-[var(--primary)]/5"
              )}
            >
              <div
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center shrink-0",
                  !n.is_read
                    ? "bg-[var(--primary)]/15 text-[var(--primary)]"
                    : "bg-[var(--background-card)] text-[var(--foreground-muted)]"
                )}
              >
                <Icon className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm">
                  <span className="font-medium">
                    {n.title || n.type.replace(/_/g, " ")}
                  </span>
                  {n.body && (
                    <span className="text-[var(--foreground-muted)]">
                      {" "}
                      — {n.body}
                    </span>
                  )}
                </p>
                <p className="text-xs text-[var(--foreground-subtle)] mt-0.5">
                  {formatRelativeTime(n.created_at)}
                  {n.actor && (
                    <span> · @{n.actor.username}</span>
                  )}
                </p>
              </div>
              {!n.is_read && (
                <span className="w-2 h-2 rounded-full bg-[var(--primary)] mt-2 shrink-0" />
              )}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
