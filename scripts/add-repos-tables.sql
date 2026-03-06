-- Add GitHub repositories tracking table
CREATE TABLE IF NOT EXISTS public.github_repos (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  repo_owner text NOT NULL,
  repo_name text NOT NULL,
  repo_url text NOT NULL,
  description text,
  stars_count integer DEFAULT 0,
  language text,
  is_hidden boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  CONSTRAINT unique_repo_per_user UNIQUE (user_id, repo_owner, repo_name)
);

-- Folder-Repository mapping table
CREATE TABLE IF NOT EXISTS public.folder_repos (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  folder_id uuid NOT NULL REFERENCES public.folders(id) ON DELETE CASCADE,
  repo_id uuid NOT NULL REFERENCES public.github_repos(id) ON DELETE CASCADE,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  CONSTRAINT unique_folder_repo UNIQUE (folder_id, repo_id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_github_repos_user ON public.github_repos(user_id);
CREATE INDEX IF NOT EXISTS idx_github_repos_hidden ON public.github_repos(is_hidden);
CREATE INDEX IF NOT EXISTS idx_folder_repos_folder ON public.folder_repos(folder_id);
CREATE INDEX IF NOT EXISTS idx_folder_repos_repo ON public.folder_repos(repo_id);
