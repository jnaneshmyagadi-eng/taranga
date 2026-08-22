import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-4 bg-[var(--bg-base)]">
      <h1 className="text-4xl font-bold text-[var(--saffron)]">404</h1>
      <p className="text-[var(--text-secondary)]">This page drifted out of the feed.</p>
      <Link
        href="/"
        className="px-5 py-2.5 rounded-full bg-[var(--cyan)] text-[var(--bg-base)] font-medium hover:opacity-90 transition"
      >
        Back to TARANGA
      </Link>
    </div>
  );
}
