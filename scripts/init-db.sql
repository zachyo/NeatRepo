-- Create tables for RepoFolders app

-- Enable necessary extensions
create extension if not exists "uuid-ossp";

-- Users table (extends Supabase auth)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique,
  full_name text,
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- Workspaces table
create table if not exists public.workspaces (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  slug text unique not null,
  description text,
  owner_id uuid not null references auth.users(id) on delete cascade,
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- Workspace members
create table if not exists public.workspace_members (
  id uuid primary key default uuid_generate_v4(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text default 'member' check (role in ('owner', 'admin', 'member')),
  created_at timestamp with time zone default timezone('utc'::text, now()),
  unique(workspace_id, user_id)
);

-- Folders table
create table if not exists public.folders (
  id uuid primary key default uuid_generate_v4(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  parent_id uuid references public.folders(id) on delete cascade,
  name text not null,
  icon text default '📁',
  created_by uuid not null references auth.users(id),
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- Files table
create table if not exists public.files (
  id uuid primary key default uuid_generate_v4(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  folder_id uuid not null references public.folders(id) on delete cascade,
  name text not null,
  url text not null,
  file_type text,
  size bigint,
  created_by uuid not null references auth.users(id),
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- Folder members (sharing)
create table if not exists public.folder_members (
  id uuid primary key default uuid_generate_v4(),
  folder_id uuid not null references public.folders(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  permission text default 'view' check (permission in ('view', 'edit', 'admin')),
  created_at timestamp with time zone default timezone('utc'::text, now()),
  unique(folder_id, user_id)
);

-- Create indexes for better query performance
create index if not exists idx_workspaces_owner on public.workspaces(owner_id);
create index if not exists idx_workspace_members_workspace on public.workspace_members(workspace_id);
create index if not exists idx_workspace_members_user on public.workspace_members(user_id);
create index if not exists idx_folders_workspace on public.folders(workspace_id);
create index if not exists idx_folders_parent on public.folders(parent_id);
create index if not exists idx_files_workspace on public.files(workspace_id);
create index if not exists idx_files_folder on public.files(folder_id);
create index if not exists idx_folder_members_folder on public.folder_members(folder_id);
create index if not exists idx_folder_members_user on public.folder_members(user_id);

-- Enable Row Level Security
alter table public.profiles enable row level security;
alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;
alter table public.folders enable row level security;
alter table public.files enable row level security;
alter table public.folder_members enable row level security;

-- RLS Policies for profiles
create policy "Public profiles are viewable by everyone" on public.profiles
  for select using (true);

create policy "Users can update their own profile" on public.profiles
  for update using (auth.uid() = id);

create policy "Users can insert their own profile" on public.profiles
  for insert with check (auth.uid() = id);

-- RLS Policies for workspaces
create policy "Users can view their workspaces" on public.workspaces
  for select using (
    auth.uid() = owner_id or 
    exists (select 1 from public.workspace_members where workspace_id = id and user_id = auth.uid())
  );

create policy "Users can create workspaces" on public.workspaces
  for insert with check (auth.uid() = owner_id);

create policy "Owners can update their workspaces" on public.workspaces
  for update using (auth.uid() = owner_id);

create policy "Owners can delete their workspaces" on public.workspaces
  for delete using (auth.uid() = owner_id);

-- RLS Policies for workspace_members
create policy "Members can view workspace members" on public.workspace_members
  for select using (
    exists (
      select 1 from public.workspaces 
      where id = workspace_id and (owner_id = auth.uid() or exists (
        select 1 from public.workspace_members wm 
        where wm.workspace_id = workspace_id and wm.user_id = auth.uid()
      ))
    )
  );

create policy "Owners can manage workspace members" on public.workspace_members
  for all using (
    exists (
      select 1 from public.workspaces 
      where id = workspace_id and owner_id = auth.uid()
    )
  );

-- RLS Policies for folders
create policy "Users can view folders they have access to" on public.folders
  for select using (
    exists (
      select 1 from public.workspaces w
      where w.id = workspace_id and (
        w.owner_id = auth.uid() or
        exists (select 1 from public.workspace_members where workspace_id = w.id and user_id = auth.uid())
      )
    ) or
    exists (
      select 1 from public.folder_members 
      where folder_id = id and user_id = auth.uid()
    )
  );

create policy "Users can create folders in accessible workspaces" on public.folders
  for insert with check (
    exists (
      select 1 from public.workspaces w
      where w.id = workspace_id and (
        w.owner_id = auth.uid() or
        exists (select 1 from public.workspace_members where workspace_id = w.id and user_id = auth.uid())
      )
    )
  );

create policy "Users can update folders they have access to" on public.folders
  for update using (
    created_by = auth.uid() or
    exists (
      select 1 from public.workspaces w
      where w.id = workspace_id and w.owner_id = auth.uid()
    )
  );

-- RLS Policies for files
create policy "Users can view files they have access to" on public.files
  for select using (
    exists (
      select 1 from public.folders f
      where f.id = folder_id and (
        exists (
          select 1 from public.workspaces w
          where w.id = f.workspace_id and (
            w.owner_id = auth.uid() or
            exists (select 1 from public.workspace_members where workspace_id = w.id and user_id = auth.uid())
          )
        ) or
        exists (
          select 1 from public.folder_members 
          where folder_id = f.id and user_id = auth.uid()
        )
      )
    )
  );

create policy "Users can upload files to accessible folders" on public.files
  for insert with check (
    exists (
      select 1 from public.folders f
      where f.id = folder_id and (
        exists (
          select 1 from public.workspaces w
          where w.id = f.workspace_id and (
            w.owner_id = auth.uid() or
            exists (select 1 from public.workspace_members where workspace_id = w.id and user_id = auth.uid())
          )
        )
      )
    )
  );
