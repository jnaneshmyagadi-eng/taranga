import { Suspense } from "react";
import { LoginForm } from "./LoginForm";

function LoginSkeleton() {
  return (
    <div className="rounded-[var(--radius-xl)] border border-[var(--border)] bg-[var(--background-elevated)] p-6 md:p-8 shadow-lg animate-pulse">
      <div className="h-7 w-40 mx-auto mb-2 rounded bg-[var(--background-card)]" />
      <div className="h-4 w-56 mx-auto mb-6 rounded bg-[var(--background-card)]" />
      <div className="h-11 w-full mb-4 rounded-[var(--radius)] bg-[var(--background-card)]" />
      <div className="h-4 w-12 mx-auto my-6 rounded bg-[var(--background-card)]" />
      <div className="space-y-4">
        <div className="h-11 w-full rounded-[var(--radius)] bg-[var(--background-card)]" />
        <div className="h-11 w-full rounded-[var(--radius)] bg-[var(--background-card)]" />
        <div className="h-11 w-full rounded-[var(--radius)] bg-[var(--background-card)]" />
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginSkeleton />}>
      <LoginForm />
    </Suspense>
  );
}
