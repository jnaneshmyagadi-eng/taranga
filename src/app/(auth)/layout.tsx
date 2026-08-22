import { Logo } from "@/components/layout/Logo";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12 bg-[var(--background)]">
      <div className="mb-8">
        <Logo size="lg" />
      </div>
      <div className="w-full max-w-md">{children}</div>
      <p className="mt-8 text-center text-sm text-[var(--foreground-subtle)]">
        India Creates. World Connects.
      </p>
    </div>
  );
}
