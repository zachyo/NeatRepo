-- NeatRepo: schema changes for roadmap Bugs 3, 4, 5, 6, 7 and 12.
-- Run in the Supabase SQL editor BEFORE deploying the matching code.
-- Safe to re-run.

begin;

-- ─── Bug 3: per-folder visibility ────────────────────────────────────────────
alter table public.folders
  add column if not exists is_public boolean not null default false;

-- ─── Bug 4: repositories unique per (user, GitHub repo) ─────────────────────
-- Drop any unique constraint/index that covers github_repo_id alone.
do $$
declare r record;
begin
  for r in
    select con.conname
    from pg_constraint con
    join pg_class rel on rel.oid = con.conrelid
    join pg_namespace ns on ns.oid = rel.relnamespace
    where ns.nspname = 'public'
      and rel.relname = 'repositories'
      and con.contype = 'u'
      and con.conkey = array[(
        select attnum from pg_attribute
        where attrelid = rel.oid and attname = 'github_repo_id'
      )]::smallint[]
  loop
    execute format('alter table public.repositories drop constraint %I', r.conname);
  end loop;

  for r in
    select i.relname as idxname
    from pg_index x
    join pg_class i on i.oid = x.indexrelid
    join pg_class t on t.oid = x.indrelid
    join pg_namespace ns on ns.oid = t.relnamespace
    where ns.nspname = 'public'
      and t.relname = 'repositories'
      and x.indisunique and not x.indisprimary
      and x.indnatts = 1
      and x.indkey[0] = (
        select attnum from pg_attribute
        where attrelid = t.oid and attname = 'github_repo_id'
      )
  loop
    execute format('drop index if exists public.%I', r.idxname);
  end loop;
end $$;

alter table public.repositories
  drop constraint if exists repositories_user_repo_unique;
alter table public.repositories
  add constraint repositories_user_repo_unique unique (user_id, github_repo_id);

-- ─── Bug 5: cascading deletes ───────────────────────────────────────────────
-- Replace existing FKs on these columns with ON DELETE CASCADE versions.
do $$
declare r record;
begin
  for r in
    select rel.relname as tbl, con.conname
    from pg_constraint con
    join pg_class rel on rel.oid = con.conrelid
    join pg_namespace ns on ns.oid = rel.relnamespace
    join pg_attribute att on att.attrelid = rel.oid and att.attnum = con.conkey[1]
    where ns.nspname = 'public'
      and con.contype = 'f'
      and array_length(con.conkey, 1) = 1
      and (rel.relname, att.attname) in (
        ('folders', 'created_by'),
        ('repositories', 'user_id'),
        ('folder_repos', 'folder_id'),
        ('folder_repos', 'repo_id')
      )
  loop
    execute format('alter table public.%I drop constraint %I', r.tbl, r.conname);
  end loop;
end $$;

-- Remove orphans first so the new FKs can be validated.
delete from public.folder_repos fr
  where not exists (select 1 from public.folders f where f.id = fr.folder_id)
     or not exists (select 1 from public.repositories r where r.id = fr.repo_id);
delete from public.folders f
  where not exists (select 1 from public.users u where u.id = f.created_by);
delete from public.repositories r
  where not exists (select 1 from public.users u where u.id = r.user_id);

alter table public.folders
  add constraint folders_created_by_fkey
  foreign key (created_by) references public.users(id) on delete cascade;
alter table public.repositories
  add constraint repositories_user_id_fkey
  foreign key (user_id) references public.users(id) on delete cascade;
alter table public.folder_repos
  add constraint folder_repos_folder_id_fkey
  foreign key (folder_id) references public.folders(id) on delete cascade;
alter table public.folder_repos
  add constraint folder_repos_repo_id_fkey
  foreign key (repo_id) references public.repositories(id) on delete cascade;

-- ─── Bug 6: repos added by hand survive sync pruning ────────────────────────
alter table public.repositories
  add column if not exists added_manually boolean not null default false;

-- ─── Bug 7: resumable full re-sync ──────────────────────────────────────────
alter table public.users add column if not exists sync_page integer;
alter table public.users add column if not exists sync_run_started_at timestamptz;
alter table public.users add column if not exists last_synced_at timestamptz;

-- ─── Bug 12: distinct languages per user ────────────────────────────────────
create or replace function public.get_user_languages(p_user_id uuid)
returns table (language text)
language sql
stable
as $$
  select distinct r.language
  from public.repositories r
  where r.user_id = p_user_id
    and r.language is not null
  order by r.language;
$$;

revoke all on function public.get_user_languages(uuid) from public, anon, authenticated;

-- ─── Indexes for the queries the app runs ───────────────────────────────────
create index if not exists idx_folders_created_by on public.folders(created_by);
create index if not exists idx_repositories_user_id on public.repositories(user_id);
create index if not exists idx_folder_repos_folder_id on public.folder_repos(folder_id);
create index if not exists idx_folder_repos_repo_id on public.folder_repos(repo_id);

commit;

-- ─── Bug 13: drop unused template tables ────────────────────────────────────
-- Run separately once you've confirmed nothing else uses them. CASCADE drops
-- dependent views/FKs, so double-check in the Table Editor first.
--
-- drop table if exists public.github_repos cascade;
-- drop table if exists public.folder_members cascade;
-- drop table if exists public.files cascade;
-- drop table if exists public.workspace_members cascade;
-- drop table if exists public.workspaces cascade;
-- drop table if exists public.profiles cascade;
