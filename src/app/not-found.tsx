import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/layout/Logo";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center">
      <Logo size="lg" />
      <h1 className="mt-8 text-4xl font-bold">404</h1>
      <p className="mt-2 text-[var(--foreground-muted)]">
        This page drifted away from the wave.
      </p>
      <Link href="/" className="mt-6">
        <Button>Back to Home</Button>
      </Link>
    </div>
  );
}
