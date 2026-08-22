-- TARANGA Phase 3: Storage policies, Danmu rate limits, feed indexes, community posts helpers
-- Safe to run after schema.sql + 20260821_phase2_rpcs.sql
-- Non-destructive

-- ============================================================
-- STORAGE BUCKETS (idempotent)
-- ============================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('videos', 'videos', false, 2147483648, ARRAY['video/mp4','video/webm','video/quicktime','video/x-msvideo']),
  ('thumbnails', 'thumbnails', true, 5242880, ARRAY['image/jpeg','image/png','image/webp','image/gif']),
  ('avatars', 'avatars', true, 2097152, ARRAY['image/jpeg','image/png','image/webp']),
  ('covers', 'covers', true, 5242880, ARRAY['image/jpeg','image/png','image/webp']),
  ('captions', 'captions', false, 1048576, ARRAY['text/vtt','application/x-subrip','text/plain'])
ON CONFLICT (id) DO NOTHING;

-- Storage RLS: videos (private)
CREATE POLICY IF NOT EXISTS "Users can upload own videos"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'videos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY IF NOT EXISTS "Users can update own videos"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'videos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY IF NOT EXISTS "Users can delete own videos"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'videos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY IF NOT EXISTS "Authenticated can read videos"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'videos');

CREATE POLICY IF NOT EXISTS "Public read thumbnails"
  ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'thumbnails');

CREATE POLICY IF NOT EXISTS "Users upload own thumbnails"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'thumbnails'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY IF NOT EXISTS "Users delete own thumbnails"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'thumbnails'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY IF NOT EXISTS "Public read avatars"
  ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'avatars');

CREATE POLICY IF NOT EXISTS "Users manage own avatar"
  ON storage.objects FOR ALL TO authenticated
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text)
  WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY IF NOT EXISTS "Public read covers"
  ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'covers');

CREATE POLICY IF NOT EXISTS "Users manage own covers"
  ON storage.objects FOR ALL TO authenticated
  USING (bucket_id = 'covers' AND (storage.foldername(name))[1] = auth.uid()::text)
  WITH CHECK (bucket_id = 'covers' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY IF NOT EXISTS "Users manage own captions"
  ON storage.objects FOR ALL TO authenticated
  USING (bucket_id = 'captions' AND (storage.foldername(name))[1] = auth.uid()::text)
  WITH CHECK (bucket_id = 'captions' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY IF NOT EXISTS "Authenticated read captions"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'captions');

-- Danmu rate limit helper
CREATE OR REPLACE FUNCTION public.can_send_danmu(p_user_id UUID, p_video_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  recent_count INT;
BEGIN
  SELECT COUNT(*) INTO recent_count
  FROM danmu_messages
  WHERE user_id = p_user_id
    AND created_at > now() - interval '10 seconds';
  RETURN recent_count < 5;
END;
$$;

-- Feed indexes
CREATE INDEX IF NOT EXISTS idx_videos_status_published_at
  ON videos (status, published_at DESC NULLS LAST)
  WHERE status = 'ready' AND visibility = 'public';

CREATE INDEX IF NOT EXISTS idx_videos_creator_status
  ON videos (creator_id, status, published_at DESC);

CREATE INDEX IF NOT EXISTS idx_danmu_video_timestamp
  ON danmu_messages (video_id, video_timestamp);

CREATE INDEX IF NOT EXISTS idx_community_posts_community_created
  ON community_posts (community_id, created_at DESC)
  WHERE is_removed = false;
