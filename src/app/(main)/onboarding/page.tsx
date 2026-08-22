"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { LANGUAGES, CATEGORIES, cn } from "@/lib/utils";

const STEPS = ["languages", "interests", "done"] as const;

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [languages, setLanguages] = useState<string[]>(["en"]);
  const [interests, setInterests] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  function toggleLanguage(code: string) {
    setLanguages((prev) =>
      prev.includes(code)
        ? prev.filter((c) => c !== code)
        : [...prev, code]
    );
  }

  function toggleInterest(id: string) {
    setInterests((prev) =>
      prev.includes(id)
        ? prev.filter((c) => c !== id)
        : [...prev, id]
    );
  }

  async function finish() {
    setLoading(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from("profiles")
          .update({
            languages,
            interests,
            preferred_categories: interests,
          })
          .eq("id", user.id);
      }
      router.push("/");
      router.refresh();
    } catch {
      router.push("/");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-10">
      <div className="mb-8">
        <div className="flex gap-2 mb-6">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={cn(
                "h-1 flex-1 rounded-full transition-colors",
                i <= step ? "bg-[var(--primary)]" : "bg-[var(--border)]"
              )}
            />
          ))}
        </div>
        <h1 className="text-2xl font-bold mb-2">
          {step === 0 && "Which languages do you speak?"}
          {step === 1 && "What are you into?"}
          {step === 2 && "You're all set"}
        </h1>
        <p className="text-[var(--foreground-muted)] text-sm">
          {step === 0 && "We'll personalize your feed and captions."}
          {step === 1 && "Pick a few so we can recommend better content."}
          {step === 2 && "Start exploring TARANGA — Watch. Create. Belong."}
        </p>
      </div>

      {step === 0 && (
        <div className="flex flex-wrap gap-2">
          {LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              onClick={() => toggleLanguage(lang.code)}
              className={cn(
                "px-4 py-2.5 rounded-full text-sm font-medium border transition-all",
                languages.includes(lang.code)
                  ? "bg-[var(--primary)] text-white border-transparent"
                  : "border-[var(--border)] text-[var(--foreground-muted)] hover:border-[var(--border-strong)]"
              )}
            >
              {lang.native}
            </button>
          ))}
        </div>
      )}

      {step === 1 && (
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => toggleInterest(cat.id)}
              className={cn(
                "px-4 py-2.5 rounded-full text-sm font-medium border transition-all",
                interests.includes(cat.id)
                  ? "bg-[var(--primary)] text-white border-transparent"
                  : "border-[var(--border)] text-[var(--foreground-muted)] hover:border-[var(--border-strong)]"
              )}
            >
              {cat.name}
            </button>
          ))}
        </div>
      )}

      {step === 2 && (
        <div className="text-center py-8">
          <div className="w-20 h-20 mx-auto mb-4 rounded-2xl gradient-brand flex items-center justify-center">
            <span className="text-3xl">🌊</span>
          </div>
          <p className="text-[var(--foreground-muted)]">
            Your personalized feed is ready.
          </p>
        </div>
      )}

      <div className="mt-10 flex gap-3">
        {step > 0 && step < 2 && (
          <Button variant="secondary" onClick={() => setStep(step - 1)}>
            Back
          </Button>
        )}
        {step < 2 ? (
          <Button
            className="flex-1"
            onClick={() => setStep(step + 1)}
            disabled={step === 0 && languages.length === 0}
          >
            Continue
          </Button>
        ) : (
          <Button className="flex-1" onClick={finish} disabled={loading}>
            {loading ? "Saving…" : "Start exploring"}
          </Button>
        )}
      </div>
    </div>
  );
}
