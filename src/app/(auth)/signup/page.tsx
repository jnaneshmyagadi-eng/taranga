"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    if (username.length < 3) {
      setError("Username must be at least 3 characters");
      setLoading(false);
      return;
    }

    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username: username.toLowerCase().replace(/[^a-z0-9_]/g, ""),
            display_name: displayName || username,
          },
        },
      });
      if (error) throw error;

      if (data.session) {
        router.push("/onboarding");
        router.refresh();
      } else {
        setMessage("Check your email to confirm your account.");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create account");
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleSignup() {
    setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/api/auth/callback?redirect=/onboarding`,
        },
      });
      if (error) throw error;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to start Google signup");
      setLoading(false);
    }
  }

  return (
    <div className="rounded-[var(--radius-xl)] border border-[var(--border)] bg-[var(--background-elevated)] p-6 md:p-8 shadow-lg">
      <h1 className="text-2xl font-bold text-center mb-1">Join TARANGA</h1>
      <p className="text-sm text-[var(--foreground-muted)] text-center mb-6">
        Create. Connect. Belong across languages.
      </p>

      {error && (
        <div className="mb-4 p-3 rounded-[var(--radius)] bg-red-500/10 border border-red-500/30 text-sm text-red-400">
          {error}
        </div>
      )}
      {message && (
        <div className="mb-4 p-3 rounded-[var(--radius)] bg-emerald-500/10 border border-emerald-500/30 text-sm text-emerald-400">
          {message}
        </div>
      )}

      <Button
        type="button"
        variant="secondary"
        className="w-full mb-4"
        onClick={handleGoogleSignup}
        disabled={loading}
      >
        Continue with Google
      </Button>

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-[var(--border)]" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-[var(--background-elevated)] px-2 text-[var(--foreground-subtle)]">
            or
          </span>
        </div>
      </div>

      <form onSubmit={handleSignup} className="space-y-4">
        <div>
          <label htmlFor="username" className="block text-sm font-medium mb-1.5">
            Username
          </label>
          <input
            id="username"
            type="text"
            required
            minLength={3}
            maxLength={30}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className={cn(
              "w-full h-11 px-3 rounded-[var(--radius)] bg-[var(--background-card)] border border-[var(--border)]",
              "text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
            )}
            placeholder="yourname"
          />
        </div>
        <div>
          <label htmlFor="displayName" className="block text-sm font-medium mb-1.5">
            Display name
          </label>
          <input
            id="displayName"
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className={cn(
              "w-full h-11 px-3 rounded-[var(--radius)] bg-[var(--background-card)] border border-[var(--border)]",
              "text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
            )}
            placeholder="Your Name"
          />
        </div>
        <div>
          <label htmlFor="email" className="block text-sm font-medium mb-1.5">
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={cn(
              "w-full h-11 px-3 rounded-[var(--radius)] bg-[var(--background-card)] border border-[var(--border)]",
              "text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
            )}
            placeholder="you@example.com"
          />
        </div>
        <div>
          <label htmlFor="password" className="block text-sm font-medium mb-1.5">
            Password
          </label>
          <input
            id="password"
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={cn(
              "w-full h-11 px-3 rounded-[var(--radius)] bg-[var(--background-card)] border border-[var(--border)]",
              "text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
            )}
            placeholder="Min 8 characters"
          />
        </div>
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Creating account…" : "Create account"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-[var(--foreground-muted)]">
        Already have an account?{" "}
        <Link href="/login" className="text-[var(--primary)] font-medium hover:underline">
          Log in
        </Link>
      </p>
    </div>
  );
}
