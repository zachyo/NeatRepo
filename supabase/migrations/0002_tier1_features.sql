-- NeatRepo: schema changes for roadmap Tier 1 (Features 1, 5 and 6).
-- Run in the Supabase SQL editor BEFORE deploying the matching code.
-- Safe to re-run.

begin;

-- ─── Feature 1: nested folders ──────────────────────────────────────────────
alter table public.folders add column if not exists parent_id uuid;

-- Replace any existing FK on parent_id: deleting a folder must never cascade
-- through its subfolders (delete_folder_keep_children moves them up first).
do $$
declare r record;
begin
  for r in
    select con.conname
    from pg_constraint con
    join pg_attribute att
      on att.attrelid = con.conrelid and att.attnum = con.conkey[1]
    where con.conrelid = 'public.folders'::regclass
      and con.contype = 'f'
      and array_length(con.conkey, 1) = 1
      and att.attname = 'parent_id'
  loop
    execute format('alter table public.folders drop constraint %I', r.conname);
  end loop;
end $$;

update public.folders f
set parent_id = null
where f.parent_id is not null
  and not exists (
    select 1 from public.folders p
    where p.id = f.parent_id and p.created_by = f.created_by
  );

alter table public.folders
  add constraint folders_parent_id_fkey
  foreign key (parent_id) references public.folders(id) on delete set null;

-- ─── Features 5 and 6: manual order ─────────────────────────────────────────
-- Reorders write 1..n, and the default is epoch milliseconds, so anything
-- created later sorts after everything already ordered.
alter table public.folders add column if not exists position bigint;
alter table public.folder_repos add column if not exists position bigint;

with ordered as (
  select id,
         row_number() over (
           partition by created_by, parent_id
           order by is_pinned desc, last_opened desc nulls last, created_at desc
         ) as rn
  from public.folders
  where position is null
)
update public.folders f
set position = ordered.rn
from ordered
where f.id = ordered.id;

with ordered as (
  select fr.folder_id,
         fr.repo_id,
         row_number() over (
           partition by fr.folder_id
           order by r.updated_at desc nulls last, fr.added_at desc
         ) as rn
  from public.folder_repos fr
  join public.repositories r on r.id = fr.repo_id
  where fr.position is null
)
update public.folder_repos fr
set position = ordered.rn
from ordered
where fr.folder_id = ordered.folder_id
  and fr.repo_id = ordered.repo_id;

alter table public.folders
  alter column position set default ((extract(epoch from clock_timestamp()) * 1000)::bigint),
  alter column position set not null;
alter table public.folder_repos
  alter column position set default ((extract(epoch from clock_timestamp()) * 1000)::bigint),
  alter column position set not null;

-- ─── Feature 6: remembered sort per folder ──────────────────────────────────
alter table public.folders
  add column if not exists repo_sort text not null default 'updated';
alter table public.folders drop constraint if exists folders_repo_sort_check;
alter table public.folders
  add constraint folders_repo_sort_check
  check (repo_sort in ('manual', 'updated', 'stars', 'name', 'added'));

-- ─── Hierarchy rules ────────────────────────────────────────────────────────
-- Every write to parent_id passes through this trigger, so the API cannot
-- create a cycle, cross accounts, or exceed the depth limit.
-- SQLSTATE NR001 marks a user-correctable error; routes return it as a 400.
create or replace function public.folders_validate_parent()
returns trigger
language plpgsql
as $$
declare
  max_depth constant integer := 5;
  v_current uuid := new.parent_id;
  v_owner uuid;
  v_next uuid;
  v_parent_depth integer := 0;
  v_subtree_height integer := 1;
begin
  if new.parent_id is null then
    return new;
  end if;
  if tg_op = 'UPDATE' and new.parent_id is not distinct from old.parent_id then
    return new;
  end if;

  -- Serialize hierarchy changes per user so two concurrent moves cannot
  -- each pass validation and together form a cycle.
  perform pg_advisory_xact_lock(
    hashtextextended('neatrepo.folders:' || new.created_by::text, 0)
  );

  while v_current is not null loop
    if v_current = new.id then
      raise exception 'A folder cannot be moved into itself or one of its subfolders'
        using errcode = 'NR001';
    end if;

    select created_by, parent_id into v_owner, v_next
    from public.folders
    where id = v_current;

    if not found or v_owner <> new.created_by then
      raise exception 'Parent folder not found' using errcode = 'NR001';
    end if;

    v_parent_depth := v_parent_depth + 1;
    if v_parent_depth > max_depth then
      raise exception 'Folders can only be nested % levels deep', max_depth
        using errcode = 'NR001';
    end if;
    v_current := v_next;
  end loop;

  if tg_op = 'UPDATE' then
    with recursive subtree as (
      select id, 1 as depth from public.folders where parent_id = new.id
      union all
      select f.id, s.depth + 1
      from public.folders f
      join subtree s on f.parent_id = s.id
      where s.depth < max_depth
    )
    select coalesce(max(depth), 0) + 1 into v_subtree_height from subtree;
  end if;

  if v_parent_depth + v_subtree_height > max_depth then
    raise exception 'Folders can only be nested % levels deep', max_depth
      using errcode = 'NR001';
  end if;

  return new;
end;
$$;

drop trigger if exists folders_validate_parent on public.folders;
create trigger folders_validate_parent
  before insert or update of parent_id on public.folders
  for each row execute function public.folders_validate_parent();

-- Deletes a folder and moves its direct subfolders up to its parent.
-- Returns false when the folder does not exist or belongs to someone else.
create or replace function public.delete_folder_keep_children(
  p_user_id uuid,
  p_folder_id uuid
)
returns boolean
language plpgsql
as $$
declare
  v_parent uuid;
begin
  perform pg_advisory_xact_lock(
    hashtextextended('neatrepo.folders:' || p_user_id::text, 0)
  );

  select parent_id into v_parent
  from public.folders
  where id = p_folder_id and created_by = p_user_id
  for update;

  if not found then
    return false;
  end if;

  update public.folders
  set parent_id = v_parent, updated_at = now()
  where parent_id = p_folder_id and created_by = p_user_id;

  delete from public.folders
  where id = p_folder_id and created_by = p_user_id;

  return true;
end;
$$;

-- Sets the order of sibling folders. Every id must be a folder the user owns
-- directly under p_parent_id (null means top level).
create or replace function public.reorder_folders(
  p_user_id uuid,
  p_parent_id uuid,
  p_folder_ids uuid[]
)
returns void
language plpgsql
as $$
declare
  v_expected integer := coalesce(array_length(p_folder_ids, 1), 0);
  v_matched integer;
begin
  select count(distinct f.id) into v_matched
  from public.folders f
  where f.id = any(p_folder_ids)
    and f.created_by = p_user_id
    and f.parent_id is not distinct from p_parent_id;

  if v_matched <> v_expected then
    raise exception 'Some folders could not be reordered' using errcode = 'NR001';
  end if;

  update public.folders f
  set position = o.ord
  from unnest(p_folder_ids) with ordinality as o(id, ord)
  where f.id = o.id;
end;
$$;

-- Sets the manual order of repos in a folder the user owns.
create or replace function public.reorder_folder_repos(
  p_user_id uuid,
  p_folder_id uuid,
  p_repo_ids uuid[]
)
returns void
language plpgsql
as $$
declare
  v_expected integer := coalesce(array_length(p_repo_ids, 1), 0);
  v_matched integer;
begin
  if not exists (
    select 1 from public.folders
    where id = p_folder_id and created_by = p_user_id
  ) then
    raise exception 'Folder not found' using errcode = 'NR001';
  end if;

  select count(distinct fr.repo_id) into v_matched
  from public.folder_repos fr
  where fr.folder_id = p_folder_id
    and fr.repo_id = any(p_repo_ids);

  if v_matched <> v_expected then
    raise exception 'Some repositories could not be reordered' using errcode = 'NR001';
  end if;

  update public.folder_repos fr
  set position = o.ord
  from unnest(p_repo_ids) with ordinality as o(id, ord)
  where fr.folder_id = p_folder_id
    and fr.repo_id = o.id;
end;
$$;

revoke all on function public.delete_folder_keep_children(uuid, uuid) from public, anon, authenticated;
revoke all on function public.reorder_folders(uuid, uuid, uuid[]) from public, anon, authenticated;
revoke all on function public.reorder_folder_repos(uuid, uuid, uuid[]) from public, anon, authenticated;

-- ─── Indexes for the queries the app runs ───────────────────────────────────
create index if not exists idx_folders_parent_id on public.folders(parent_id);
create index if not exists idx_folders_owner_parent_position
  on public.folders(created_by, parent_id, position);
create index if not exists idx_folder_repos_folder_position
  on public.folder_repos(folder_id, position);

commit;
