"use client";

import { useState } from "react";
import { VideoPlayer, type VideoSource } from "./VideoPlayer";
import { DanmuLayer } from "@/components/danmu/DanmuLayer";

interface WatchPlayerProps {
  videoId: string;
  sources: VideoSource[];
  poster?: string | null;
  title?: string;
  durationSeconds?: number;
  initialTime?: number;
}

export function WatchPlayer({
  videoId,
  sources,
  poster,
  title,
  durationSeconds,
  initialTime,
}: WatchPlayerProps) {
  const [currentTime, setCurrentTime] = useState(initialTime || 0);

  return (
    <div className="relative">
      <VideoPlayer
        videoId={videoId}
        sources={sources}
        poster={poster}
        title={title}
        durationSeconds={durationSeconds}
        initialTime={initialTime}
        autoPlay
        onTimeUpdate={setCurrentTime}
      />
      <DanmuLayer videoId={videoId} currentTime={currentTime} />
    </div>
  );
}
