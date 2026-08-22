"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Users,
  Clapperboard,
  Radio,
  TrendingUp,
  Gamepad2,
  Sparkles,
  Music,
  GraduationCap,
  Cpu,
  MapPin,
  BookOpen,
  Bookmark,
  Settings,
  LayoutDashboard,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "./Logo";

const mainNav = [
  { href: "/", label: "Home", icon: Home },
  { href: "/following", label: "Following", icon: Users },
  { href: "/shorts", label: "Shorts", icon: Clapperboard },
  { href: "/live", label: "Live", icon: Radio },
  { href: "/trending", label: "Trending", icon: TrendingUp },
];

const categories = [
  { href: "/communities", label: "Communities", icon: Users },
  { href: "/category/gaming", label: "Gaming", icon: Gamepad2 },
  { href: "/category/anime", label: "Anime", icon: Sparkles },
  { href: "/category/music", label: "Music", icon: Music },
  { href: "/category/education", label: "Education", icon: GraduationCap },
  { href: "/category/technology", label: "Technology", icon: Cpu },
  { href: "/category/regional", label: "Regional", icon: MapPin },
  { href: "/category/history", label: "History", icon: BookOpen },
];

const bottomNav = [
  { href: "/saved", label: "Saved", icon: Bookmark },
  { href: "/studio", label: "Creator Studio", icon: LayoutDashboard },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="desktop-only fixed left-0 top-0 bottom-0 z-40 w-60 flex flex-col border-r border-[var(--border)] bg-[var(--background)]">
      <div className="flex items-center h-14 px-4 border-b border-[var(--border)]">
        <Logo size="sm" />
      </div>

      <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-6">
        <div className="space-y-0.5">
          {mainNav.map((item) => {
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-[var(--radius)] text-sm font-medium transition-colors",
                  isActive
                    ? "bg-[var(--background-card)] text-[var(--primary)]"
                    : "text-[var(--foreground-muted)] hover:bg-[var(--background-hover)] hover:text-[var(--foreground)]"
                )}
              >
                <Icon className="w-5 h-5 shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </div>

        <div>
          <p className="px-3 mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--foreground-subtle)]">
            Explore
          </p>
          <div className="space-y-0.5">
            {categories.map((item) => {
              const isActive = pathname.startsWith(item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-[var(--radius)] text-sm font-medium transition-colors",
                    isActive
                      ? "bg-[var(--background-card)] text-[var(--primary)]"
                      : "text-[var(--foreground-muted)] hover:bg-[var(--background-hover)] hover:text-[var(--foreground)]"
                  )}
                >
                  <Icon className="w-5 h-5 shrink-0" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      </nav>

      <div className="border-t border-[var(--border)] p-3 space-y-0.5">
        {bottomNav.map((item) => {
          const isActive = pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-[var(--radius)] text-sm font-medium transition-colors",
                isActive
                  ? "bg-[var(--background-card)] text-[var(--primary)]"
                  : "text-[var(--foreground-muted)] hover:bg-[var(--background-hover)] hover:text-[var(--foreground)]"
              )}
            >
              <Icon className="w-5 h-5 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </div>
    </aside>
  );
}
