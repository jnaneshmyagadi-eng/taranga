/**
 * Development-only demo fallbacks.
 * Production must never present demo content as real.
 *
 * Enable with:
 *   NEXT_PUBLIC_ENABLE_DEMO_FALLBACK=true
 *
 * Default: false (no fake content).
 */
export function isDemoFallbackEnabled(): boolean {
  return process.env.NEXT_PUBLIC_ENABLE_DEMO_FALLBACK === "true";
}

/** Public sample MP4 for local player testing only when demo fallback is on. */
export const DEMO_SAMPLE_MP4 =
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4";

export const DEMO_SAMPLE_SHORT_MP4 =
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4";
