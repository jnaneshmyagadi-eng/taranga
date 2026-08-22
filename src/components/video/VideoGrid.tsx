import { VideoCard, type VideoCardData } from "./VideoCard";

interface VideoGridProps {
  videos: VideoCardData[];
}

export function VideoGrid({ videos }: VideoGridProps) {
  if (!videos || videos.length === 0) {
    return (
      <div className="py-16 text-center text-[var(--foreground-muted)] text-sm">
        No videos to show.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-6">
      {videos.map((video) => (
        <VideoCard key={video.id} video={video} />
      ))}
    </div>
  );
}
