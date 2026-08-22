import Link from "next/link";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  showText?: boolean;
  size?: "sm" | "md" | "lg";
}

export function Logo({ className, showText = true, size = "md" }: LogoProps) {
  const sizes = {
    sm: { icon: 28, text: "text-lg" },
    md: { icon: 36, text: "text-xl" },
    lg: { icon: 48, text: "text-2xl" },
  };
  const s = sizes[size];

  return (
    <Link
      href="/"
      className={cn(
        "flex items-center gap-2.5 group select-none",
        className
      )}
    >
      <div
        className="relative flex items-center justify-center rounded-xl overflow-hidden"
        style={{ width: s.icon, height: s.icon }}
      >
        <svg
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full"
        >
          <defs>
            <linearGradient id="tarangaGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#22D3EE" />
              <stop offset="50%" stopColor="#3B82F6" />
              <stop offset="100%" stopColor="#8B5CF6" />
            </linearGradient>
          </defs>
          <rect width="48" height="48" rx="12" fill="url(#tarangaGrad)" />
          <path
            d="M14 14h20v5H28v15h-8V19H14V14z"
            fill="white"
            fillOpacity="0.95"
          />
          <path
            d="M12 34c3-3 6-3 9 0s6 3 9 0 6-3 9 0"
            stroke="white"
            strokeWidth="2.5"
            strokeLinecap="round"
            fill="none"
            opacity="0.9"
          />
        </svg>
      </div>
      {showText && (
        <span
          className={cn(
            "font-bold tracking-tight text-[var(--foreground)] group-hover:opacity-90 transition-opacity",
            s.text
          )}
        >
          TARANGA
        </span>
      )}
    </Link>
  );
}
