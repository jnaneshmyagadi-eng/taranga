"use client";

import {
  useRef,
  useState,
  useEffect,
  useCallback,
  type SyntheticEvent,
} from "react";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  Settings,
  SkipBack,
  SkipForward,
} from "lucide-react";
import { cn, formatDuration } from "@/lib/utils";
import { recordWatchProgress } from "@/lib/actions/interactions";

export interface VideoSource {
  src: string;
  type?: string;
  quality?: string;
}

export interface Chapter {
  title: string;
  startSeconds: number;
  endSeconds?: number;
}

export interface CaptionTrack {
  src: string;
  srcLang: string;
  label: string;
  default?: boolean;
}

interface VideoPlayerProps {
  sources: VideoSource[];
  poster?: string | null;
  title?: string;
  videoId: string;
  durationSeconds?: number;
  chapters?: Chapter[];
  captions?: CaptionTrack[];
  initialTime?: number;
  autoPlay?: boolean;
  className?: string;
  onTimeUpdate?: (seconds: number) => void;
  onEnded?: () => void;
}

const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

export function VideoPlayer({
  sources,
  poster,
  title,
  videoId,
  durationSeconds = 0,
  chapters = [],
  captions = [],
  initialTime = 0,
  autoPlay = false,
  className,
  onTimeUpdate,
  onEnded,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const lastProgressWrite = useRef(0);

  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(initialTime);
  const [duration, setDuration] = useState(durationSeconds);
  const [buffered, setBuffered] = useState(0);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [speed, setSpeed] = useState(1);
  const [showSettings, setShowSettings] = useState(false);
  const [activeQuality, setActiveQuality] = useState(
    sources.find((s) => s.quality === "auto")?.quality ||
      sources[0]?.quality ||
      "auto"
  );
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const primarySrc =
    sources.find((s) => s.quality === activeQuality)?.src ||
    sources[0]?.src ||
    "";

  const resetHideTimer = useCallback(() => {
    setShowControls(true);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => {
      if (playing) setShowControls(false);
    }, 3000);
  }, [playing]);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (initialTime > 0) v.currentTime = initialTime;
  }, [initialTime]);

  useEffect(() => {
    return () => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
  }, []);

  const persistProgress = useCallback(
    (time: number, dur: number) => {
      const now = Date.now();
      if (now - lastProgressWrite.current < 10000 && time < dur - 2) return;
      lastProgressWrite.current = now;
      recordWatchProgress({
        videoId,
        progressSeconds: time,
        durationSeconds: dur || durationSeconds,
      }).catch(() => {});
    },
    [videoId, durationSeconds]
  );

  function togglePlay() {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) {
      v.play().catch(() => setError("Playback failed"));
    } else {
      v.pause();
    }
  }

  function onPlay() {
    setPlaying(true);
    setLoading(false);
    resetHideTimer();
  }

  function onPause() {
    setPlaying(false);
    setShowControls(true);
    const v = videoRef.current;
    if (v) persistProgress(v.currentTime, v.duration || duration);
  }

  function onTimeUpdateHandler(e: SyntheticEvent<HTMLVideoElement>) {
    const v = e.currentTarget;
    setCurrentTime(v.currentTime);
    onTimeUpdate?.(v.currentTime);
    if (v.buffered.length > 0) {
      setBuffered(v.buffered.end(v.buffered.length - 1));
    }
    persistProgress(v.currentTime, v.duration || duration);
  }

  function onLoadedMetadata(e: SyntheticEvent<HTMLVideoElement>) {
    setDuration(e.currentTarget.duration);
    setLoading(false);
  }

  function onWaiting() {
    setLoading(true);
  }

  function onCanPlay() {
    setLoading(false);
  }

  function onError() {
    setError("Unable to load video");
    setLoading(false);
  }

  function onEndedHandler() {
    setPlaying(false);
    setShowControls(true);
    persistProgress(duration || durationSeconds, duration || durationSeconds);
    onEnded?.();
  }

  function seek(ratio: number) {
    const v = videoRef.current;
    if (!v || !duration) return;
    v.currentTime = ratio * duration;
    setCurrentTime(v.currentTime);
  }

  function onProgressClick(e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    seek(ratio);
  }

  function toggleMute() {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    setMuted(v.muted);
  }

  function changeVolume(val: number) {
    const v = videoRef.current;
    if (!v) return;
    v.volume = val;
    setVolume(val);
    setMuted(val === 0);
  }

  function changeSpeed(s: number) {
    const v = videoRef.current;
    if (!v) return;
    v.playbackRate = s;
    setSpeed(s);
    setShowSettings(false);
  }

  async function toggleFullscreen() {
    const el = containerRef.current;
    if (!el) return;
    if (!document.fullscreenElement) {
      await el.requestFullscreen().catch(() => {});
      setFullscreen(true);
    } else {
      await document.exitFullscreen().catch(() => {});
      setFullscreen(false);
    }
  }

  function skip(seconds: number) {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = Math.max(0, Math.min(duration, v.currentTime + seconds));
  }

  const progressPct = duration > 0 ? (currentTime / duration) * 100 : 0;
  const bufferedPct = duration > 0 ? (buffered / duration) * 100 : 0;

  if (!primarySrc) {
    return (
      <div
        className={cn(
          "relative aspect-video bg-[var(--background-card)] rounded-[var(--radius)] flex items-center justify-center",
          className
        )}
      >
        <p className="text-[var(--foreground-muted)] text-sm">
          No playable source available
        </p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative aspect-video bg-black rounded-[var(--radius)] overflow-hidden group select-none",
        className
      )}
      onMouseMove={resetHideTimer}
      onMouseLeave={() => playing && setShowControls(false)}
      onClick={togglePlay}
    >
      <video
        ref={videoRef}
        className="w-full h-full object-contain"
        poster={poster || undefined}
        playsInline
        preload="metadata"
        autoPlay={autoPlay}
        onPlay={onPlay}
        onPause={onPause}
        onTimeUpdate={onTimeUpdateHandler}
        onLoadedMetadata={onLoadedMetadata}
        onWaiting={onWaiting}
        onCanPlay={onCanPlay}
        onError={onError}
        onEnded={onEndedHandler}
        crossOrigin="anonymous"
      >
        <source src={primarySrc} type={sources[0]?.type || "video/mp4"} />
        {captions.map((c) => (
          <track
            key={c.srcLang}
            kind="captions"
            src={c.src}
            srcLang={c.srcLang}
            label={c.label}
            default={c.default}
          />
        ))}
      </video>

      {loading && !error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/30 pointer-events-none">
          <div className="w-10 h-10 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        </div>
      )}

      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 gap-3">
          <p className="text-white text-sm">{error}</p>
          <button
            className="px-4 py-2 rounded-full bg-white/10 text-white text-sm hover:bg-white/20"
            onClick={(e) => {
              e.stopPropagation();
              setError(null);
              setLoading(true);
              videoRef.current?.load();
              videoRef.current?.play().catch(() => {});
            }}
          >
            Retry
          </button>
        </div>
      )}

      {!playing && !loading && !error && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-16 h-16 rounded-full bg-black/50 flex items-center justify-center backdrop-blur-sm">
            <Play className="w-8 h-8 text-white fill-white ml-1" />
          </div>
        </div>
      )}

      <div
        className={cn(
          "absolute inset-x-0 bottom-0 transition-opacity duration-300",
          showControls || !playing ? "opacity-100" : "opacity-0"
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent pointer-events-none" />

        <div className="relative px-3 pb-3 pt-8">
          <div
            ref={progressRef}
            className="relative h-1.5 mb-3 cursor-pointer group/progress"
            onClick={onProgressClick}
          >
            <div className="absolute inset-0 rounded-full bg-white/20" />
            <div
              className="absolute inset-y-0 left-0 rounded-full bg-white/40"
              style={{ width: `${bufferedPct}%` }}
            />
            <div
              className="absolute inset-y-0 left-0 rounded-full bg-[var(--taranga-electric)]"
              style={{ width: `${progressPct}%` }}
            />
            <div
              className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-[var(--taranga-electric)] shadow opacity-0 group-hover/progress:opacity-100 transition-opacity"
              style={{ left: `calc(${progressPct}% - 7px)` }}
            />
          </div>

          <div className="flex items-center gap-1 text-white">
            <button
              className="p-2 hover:bg-white/10 rounded-full transition"
              onClick={togglePlay}
              aria-label={playing ? "Pause" : "Play"}
            >
              {playing ? (
                <Pause className="w-5 h-5 fill-white" />
              ) : (
                <Play className="w-5 h-5 fill-white" />
              )}
            </button>

            <button
              className="p-2 hover:bg-white/10 rounded-full transition hidden sm:block"
              onClick={() => skip(-10)}
              aria-label="Back 10s"
            >
              <SkipBack className="w-4 h-4" />
            </button>
            <button
              className="p-2 hover:bg-white/10 rounded-full transition hidden sm:block"
              onClick={() => skip(10)}
              aria-label="Forward 10s"
            >
              <SkipForward className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-1 group/vol">
              <button
                className="p-2 hover:bg-white/10 rounded-full transition"
                onClick={toggleMute}
                aria-label={muted ? "Unmute" : "Mute"}
              >
                {muted || volume === 0 ? (
                  <VolumeX className="w-5 h-5" />
                ) : (
                  <Volume2 className="w-5 h-5" />
                )}
              </button>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={muted ? 0 : volume}
                onChange={(e) => changeVolume(Number(e.target.value))}
                className="w-0 group-hover/vol:w-20 transition-all opacity-0 group-hover/vol:opacity-100 h-1 accent-[var(--taranga-electric)]"
              />
            </div>

            <span className="text-xs tabular-nums text-white/90 ml-1">
              {formatDuration(Math.floor(currentTime))} /{" "}
              {formatDuration(Math.floor(duration || durationSeconds))}
            </span>

            <div className="flex-1" />

            {chapters.length > 0 && (
              <span className="text-xs text-white/70 hidden md:inline mr-2">
                {chapters.length} chapters
              </span>
            )}

            <div className="relative">
              <button
                className="p-2 hover:bg-white/10 rounded-full transition"
                onClick={() => setShowSettings((s) => !s)}
                aria-label="Settings"
              >
                <Settings className="w-5 h-5" />
              </button>
              {showSettings && (
                <div className="absolute bottom-full right-0 mb-2 w-40 rounded-lg bg-[var(--background-elevated)] border border-[var(--border)] shadow-lg py-1 text-sm text-[var(--foreground)]">
                  <p className="px-3 py-1.5 text-xs text-[var(--foreground-subtle)] uppercase tracking-wide">
                    Speed
                  </p>
                  {SPEEDS.map((s) => (
                    <button
                      key={s}
                      className={cn(
                        "w-full text-left px-3 py-1.5 hover:bg-[var(--background-hover)]",
                        speed === s && "text-[var(--primary)] font-medium"
                      )}
                      onClick={() => changeSpeed(s)}
                    >
                      {s === 1 ? "Normal" : `${s}x`}
                    </button>
                  ))}
                  {sources.length > 1 && (
                    <>
                      <p className="px-3 py-1.5 text-xs text-[var(--foreground-subtle)] uppercase tracking-wide mt-1 border-t border-[var(--border)]">
                        Quality
                      </p>
                      {sources.map((s) => (
                        <button
                          key={s.quality || s.src}
                          className={cn(
                            "w-full text-left px-3 py-1.5 hover:bg-[var(--background-hover)]",
                            activeQuality === s.quality &&
                              "text-[var(--primary)] font-medium"
                          )}
                          onClick={() => {
                            setActiveQuality(s.quality || "auto");
                            setShowSettings(false);
                          }}
                        >
                          {s.quality || "Default"}
                        </button>
                      ))}
                    </>
                  )}
                </div>
              )}
            </div>

            <button
              className="p-2 hover:bg-white/10 rounded-full transition"
              onClick={toggleFullscreen}
              aria-label={fullscreen ? "Exit fullscreen" : "Fullscreen"}
            >
              {fullscreen ? (
                <Minimize className="w-5 h-5" />
              ) : (
                <Maximize className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </div>

      {title && showControls && (
        <div className="absolute top-0 inset-x-0 p-3 bg-gradient-to-b from-black/60 to-transparent md:hidden pointer-events-none">
          <p className="text-white text-sm font-medium line-clamp-1">{title}</p>
        </div>
      )}
    </div>
  );
}
