"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { CATEGORIES, LANGUAGES, cn, slugify } from "@/lib/utils";
import {
  Upload,
  Film,
  Image as ImageIcon,
  Check,
  Loader2,
  X,
} from "lucide-react";

type Step = "upload" | "details" | "visibility" | "publishing" | "done";

export default function CreatePage() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const thumbRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<Step>("upload");
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [thumbFile, setThumbFile] = useState<File | null>(null);
  const [thumbPreview, setThumbPreview] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [language, setLanguage] = useState("en");
  const [tags, setTags] = useState("");
  const [visibility, setVisibility] = useState<"public" | "unlisted" | "private">(
    "public"
  );
  const [isShort, setIsShort] = useState(false);

  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [publishedId, setPublishedId] = useState<string | null>(null);

  function onFileSelect(f: File | null) {
    if (!f) return;
    const allowedTypes = [
      "video/mp4",
      "video/webm",
      "video/quicktime",
      "video/x-msvideo",
    ];
    const ext = f.name.split(".").pop()?.toLowerCase() || "";
    const allowedExt = ["mp4", "webm", "mov", "avi"];
    if (!allowedTypes.includes(f.type) && !allowedExt.includes(ext)) {
      setError("Unsupported format. Use MP4, WebM, or MOV.");
      return;
    }
    if (f.size > 2 * 1024 * 1024 * 1024) {
      setError("File too large (max 2GB)");
      return;
    }
    if (f.size < 1024) {
      setError("File appears empty or corrupt");
      return;
    }
    setError(null);
    setFile(f);
    setPreviewUrl(URL.createObjectURL(f));
    if (
      f.name.toLowerCase().includes("short") ||
      f.name.toLowerCase().includes("reel")
    ) {
      setIsShort(true);
    }
    setStep("details");
  }

  function onThumbSelect(f: File | null) {
    if (!f || !f.type.startsWith("image/")) return;
    setThumbFile(f);
    setThumbPreview(URL.createObjectURL(f));
  }

  async function handlePublish() {
    if (!file || !title.trim()) {
      setError("Title and video are required");
      return;
    }
    setStep("publishing");
    setError(null);
    setProgress(5);

    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setError("You must be logged in to upload");
        setStep("details");
        return;
      }

      const slug =
        slugify(title) +
        "-" +
        Math.random().toString(36).slice(2, 8);

      const { data: video, error: vErr } = await supabase
        .from("videos")
        .insert({
          creator_id: user.id,
          title: title.trim(),
          description: description.trim() || null,
          slug,
          category: category || null,
          language,
          tags: tags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean),
          visibility,
          status: "uploading",
          is_short: isShort,
        })
        .select("id")
        .single();

      if (vErr || !video) {
        throw new Error(vErr?.message || "Failed to create video record");
      }

      setProgress(20);

      const ext = file.name.split(".").pop() || "mp4";
      const storagePath = `${user.id}/${video.id}/original.${ext}`;

      const { error: upErr } = await supabase.storage
        .from("videos")
        .upload(storagePath, file, {
          cacheControl: "3600",
          upsert: false,
          contentType: file.type,
        });

      if (upErr) {
        await supabase
          .from("videos")
          .update({ status: "failed" })
          .eq("id", video.id);
        throw new Error(
          upErr.message.includes("Bucket")
            ? "Storage bucket 'videos' not configured. Create it in Supabase Storage (private)."
            : upErr.message
        );
      }

      setProgress(70);

      let thumbnailUrl: string | null = null;
      if (thumbFile) {
        const thumbPath = `${user.id}/${video.id}/thumb.jpg`;
        const { error: tErr } = await supabase.storage
          .from("thumbnails")
          .upload(thumbPath, thumbFile, {
            cacheControl: "3600",
            upsert: true,
            contentType: thumbFile.type,
          });
        if (!tErr) {
          const { data: pub } = supabase.storage
            .from("thumbnails")
            .getPublicUrl(thumbPath);
          thumbnailUrl = pub.publicUrl;
        }
      }

      setProgress(85);

      await supabase.from("video_assets").insert({
        video_id: video.id,
        storage_path: storagePath,
        quality: "original",
        format: ext,
        file_size_bytes: file.size,
        is_primary: true,
      });

      await supabase
        .from("videos")
        .update({
          status: "ready",
          published_at:
            visibility === "public" ? new Date().toISOString() : null,
          thumbnail_url: thumbnailUrl,
        })
        .eq("id", video.id);

      await supabase
        .from("profiles")
        .update({ is_creator: true })
        .eq("id", user.id);

      setProgress(100);
      setPublishedId(video.id);
      setStep("done");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Upload failed");
      setStep("details");
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-1">Create</h1>
      <p className="text-sm text-[var(--foreground-muted)] mb-8">
        Upload a video and share it with the world.
      </p>

      <div className="flex gap-2 mb-8">
        {(["upload", "details", "visibility", "done"] as const).map((s, i) => (
          <div
            key={s}
            className={cn(
              "h-1 flex-1 rounded-full transition",
              step === s ||
                (["details", "visibility", "publishing", "done"].includes(step) &&
                  i === 0) ||
                (["visibility", "publishing", "done"].includes(step) && i <= 1) ||
                (["publishing", "done"].includes(step) && i <= 2) ||
                (step === "done" && i <= 3)
                ? "bg-[var(--primary)]"
                : "bg-[var(--border)]"
            )}
          />
        ))}
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-[var(--radius)] bg-red-500/10 border border-red-500/30 text-sm text-red-400">
          {error}
        </div>
      )}

      {step === "upload" && (
        <div
          className="border-2 border-dashed border-[var(--border-strong)] rounded-[var(--radius-xl)] p-12 text-center cursor-pointer hover:border-[var(--primary)] transition"
          onClick={() => fileRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            onFileSelect(e.dataTransfer.files[0] || null);
          }}
        >
          <Upload className="w-12 h-12 mx-auto text-[var(--foreground-subtle)] mb-4" />
          <p className="font-medium mb-1">Drag & drop or click to upload</p>
          <p className="text-sm text-[var(--foreground-muted)]">
            MP4, WebM, MOV · up to 2GB
          </p>
          <input
            ref={fileRef}
            type="file"
            accept="video/*"
            className="hidden"
            onChange={(e) => onFileSelect(e.target.files?.[0] || null)}
          />
        </div>
      )}

      {(step === "details" || step === "visibility") && file && (
        <div className="space-y-5">
          <div className="flex gap-4 items-start">
            <div className="w-40 aspect-video rounded-[var(--radius)] bg-black overflow-hidden shrink-0 relative">
              {previewUrl && (
                <video
                  src={previewUrl}
                  className="w-full h-full object-cover"
                  muted
                />
              )}
              <div className="absolute bottom-1 right-1 px-1 py-0.5 rounded text-[10px] bg-black/80 text-white">
                <Film className="w-3 h-3 inline mr-0.5" />
                {(file.size / (1024 * 1024)).toFixed(1)} MB
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{file.name}</p>
              <button
                className="text-xs text-[var(--danger)] mt-1"
                onClick={() => {
                  setFile(null);
                  setPreviewUrl(null);
                  setStep("upload");
                }}
              >
                Remove
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Title *</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={100}
              className="w-full h-11 px-3 rounded-[var(--radius)] bg-[var(--background-card)] border border-[var(--border)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
              placeholder="An eye-catching title"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              maxLength={5000}
              className="w-full px-3 py-2 rounded-[var(--radius)] bg-[var(--background-card)] border border-[var(--border)] text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
              placeholder="Tell viewers about your video"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full h-11 px-3 rounded-[var(--radius)] bg-[var(--background-card)] border border-[var(--border)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
              >
                <option value="">Select</option>
                {CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">
                Language
              </label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full h-11 px-3 rounded-[var(--radius)] bg-[var(--background-card)] border border-[var(--border)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
              >
                {LANGUAGES.map((l) => (
                  <option key={l.code} value={l.code}>
                    {l.native}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">
              Tags (comma separated)
            </label>
            <input
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="w-full h-11 px-3 rounded-[var(--radius)] bg-[var(--background-card)] border border-[var(--border)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
              placeholder="ai, kannada, tutorial"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">
              Thumbnail
            </label>
            <div className="flex gap-3 items-center">
              {thumbPreview ? (
                <div className="relative w-32 aspect-video rounded-[var(--radius)] overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={thumbPreview}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                  <button
                    className="absolute top-1 right-1 p-0.5 rounded-full bg-black/60"
                    onClick={() => {
                      setThumbFile(null);
                      setThumbPreview(null);
                    }}
                  >
                    <X className="w-3.5 h-3.5 text-white" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => thumbRef.current?.click()}
                  className="w-32 aspect-video rounded-[var(--radius)] border border-dashed border-[var(--border-strong)] flex flex-col items-center justify-center gap-1 text-[var(--foreground-subtle)] hover:border-[var(--primary)] transition"
                >
                  <ImageIcon className="w-5 h-5" />
                  <span className="text-[10px]">Upload</span>
                </button>
              )}
              <input
                ref={thumbRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => onThumbSelect(e.target.files?.[0] || null)}
              />
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={isShort}
              onChange={(e) => setIsShort(e.target.checked)}
              className="rounded"
            />
            This is a Short (vertical short-form)
          </label>

          <div>
            <label className="block text-sm font-medium mb-1.5">
              Visibility
            </label>
            <div className="flex gap-2">
              {(["public", "unlisted", "private"] as const).map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setVisibility(v)}
                  className={cn(
                    "px-4 py-2 rounded-full text-sm font-medium border capitalize transition",
                    visibility === v
                      ? "bg-[var(--primary)] text-white border-transparent"
                      : "border-[var(--border)] text-[var(--foreground-muted)]"
                  )}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              variant="secondary"
              onClick={() => {
                setFile(null);
                setStep("upload");
              }}
            >
              Back
            </Button>
            <Button
              className="flex-1"
              onClick={handlePublish}
              disabled={!title.trim()}
            >
              Publish
            </Button>
          </div>
        </div>
      )}

      {step === "publishing" && (
        <div className="py-16 text-center space-y-4">
          <Loader2 className="w-10 h-10 mx-auto animate-spin text-[var(--primary)]" />
          <p className="font-medium">Uploading & processing…</p>
          <div className="max-w-xs mx-auto h-2 rounded-full bg-[var(--border)] overflow-hidden">
            <div
              className="h-full bg-[var(--primary)] transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-[var(--foreground-subtle)]">
            {progress}%
          </p>
        </div>
      )}

      {step === "done" && publishedId && (
        <div className="py-12 text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-full bg-emerald-500/20 flex items-center justify-center">
            <Check className="w-8 h-8 text-emerald-400" />
          </div>
          <h2 className="text-xl font-bold">Published!</h2>
          <p className="text-sm text-[var(--foreground-muted)]">
            Your video is live on TARANGA.
          </p>
          <div className="flex gap-3 justify-center pt-2">
            <Button
              variant="secondary"
              onClick={() => {
                setFile(null);
                setTitle("");
                setDescription("");
                setStep("upload");
                setPublishedId(null);
              }}
            >
              Upload another
            </Button>
            <Button onClick={() => router.push(`/watch/${publishedId}`)}>
              Watch now
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
