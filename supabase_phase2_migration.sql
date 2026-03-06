-- Add is_pinned to folders table
ALTER TABLE public.folders ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN NOT NULL DEFAULT false;

-- Add is_favorite to repositories table
ALTER TABLE public.repositories ADD COLUMN IF NOT EXISTS is_favorite BOOLEAN NOT NULL DEFAULT false;

-- Add github_access_token to users table for background sync
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS github_access_token TEXT;


ALTER TABLE public.users ADD COLUMN IF NOT EXISTS is_public BOOLEAN NOT NULL DEFAULT false;
