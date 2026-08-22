-- Phase 2 helper RPCs (safe to run after base schema)

CREATE OR REPLACE FUNCTION public.increment_view_count(vid UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.videos
  SET view_count = view_count + 1
  WHERE id = vid;
END;
$$;

CREATE OR REPLACE FUNCTION public.increment_comment_count(vid UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.videos
  SET comment_count = comment_count + 1
  WHERE id = vid;
END;
$$;

GRANT EXECUTE ON FUNCTION public.increment_view_count(UUID) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.increment_comment_count(UUID) TO authenticated, anon;
