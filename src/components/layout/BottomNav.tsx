"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Clapperboard,
  Plus,
  Users,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "Home", icon: Home },
  { href: "/shorts", label: "Shorts", icon: Clapperboard },
  { href: "/create", label: "Create", icon: Plus, isCreate: true },
  { href: "/communities", label: "Communities", icon: Users },
  { href: "/profile", label: "Profile", icon: User },
];

export function BottomNav() {
  const pathname = usePathname();

  if (
    pathname.startsWith("/watch") ||
    pathname.startsWith("/studio") ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/signup") ||
    pathname.startsWith("/onboarding")
  ) {
    return null;
  }

  return (
    <nav className="mobile-only fixed bottom-0 left-0 right-0 z-50 safe-bottom">
      <div className="glass border-t border-[var(--border)]">
        <div className="flex items-center justify-around h-16 px-1">
          {navItems.map((item) => {
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);
            const Icon = item.icon;

            if (item.isCreate) {
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex flex-col items-center justify-center -mt-5"
                >
                  <div className="create-btn flex items-center justify-center w-14 h-14 rounded-full gradient-saffron shadow-lg shadow-orange-500/30">
                    <Plus className="w-7 h-7 text-[var(--accent-foreground)] stroke-[2.5]" />
                  </div>
                </Link>
              );
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center justify-center gap-0.5 min-w-[64px] py-1 transition-colors",
                  isActive
                    ? "text-[var(--primary)]"
                    : "text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
                )}
              >
                <Icon
                  className={cn("w-6 h-6", isActive && "stroke-[2.5]")}
                />
                <span className="text-[10px] font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
