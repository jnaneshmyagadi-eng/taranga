"use client";

import Link from "next/link";
import { Search, Bell } from "lucide-react";
import { Logo } from "./Logo";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface HeaderProps {
  user?: {
    id: string;
    username: string;
    avatar_url?: string | null;
    display_name?: string | null;
  } | null;
  unreadCount?: number;
}

export function Header({ user, unreadCount = 0 }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 safe-top">
      <div className="glass border-b border-[var(--border)]">
        <div className="flex items-center justify-between h-14 px-3 md:px-4 max-w-[1600px] mx-auto">
          <div className="flex items-center gap-2 md:hidden">
            <Logo showText size="sm" />
          </div>
          <div className="hidden md:block w-0" />

          <div className="flex-1 max-w-xl mx-2 md:mx-8">
            <form action="/search" method="get" className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--foreground-subtle)]" />
              <input
                type="search"
                name="q"
                placeholder="Search videos, creators, communities..."
                className={cn(
                  "w-full h-10 pl-10 pr-4 rounded-full bg-[var(--background-card)] border border-[var(--border)]",
                  "text-sm text-[var(--foreground)] placeholder:text-[var(--foreground-subtle)]",
                  "focus:outline-none focus:ring-2 focus:ring-[var(--ring)] focus:border-transparent",
                  "transition-shadow"
                )}
              />
            </form>
          </div>

          <div className="flex items-center gap-1 md:gap-2">
            <Link href="/notifications" className="relative">
              <Button variant="ghost" size="icon-sm" className="relative">
                <Bell className="w-5 h-5" />
              </Button>
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-[var(--danger)] text-white text-[10px] font-bold flex items-center justify-center">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </Link>

            {user ? (
              <Link
                href={`/creator/${user.username}`}
                className="flex items-center gap-2 ml-1"
              >
                <div className="w-8 h-8 rounded-full bg-[var(--background-card)] border border-[var(--border)] overflow-hidden flex items-center justify-center text-sm font-semibold text-[var(--primary)]">
                  {user.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={user.avatar_url}
                      alt={user.display_name || user.username}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    (user.display_name || user.username).charAt(0).toUpperCase()
                  )}
                </div>
              </Link>
            ) : (
              <div className="flex items-center gap-2 ml-1">
                <Link href="/login">
                  <Button variant="ghost" size="sm">
                    Log in
                  </Button>
                </Link>
                <Link href="/signup" className="hidden sm:inline-flex">
                  <Button variant="default" size="sm">
                    Sign up
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
