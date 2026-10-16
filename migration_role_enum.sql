-- ==============================================================================
-- MIGRATION: ROLE ENUM, PROFILE SYNC & GOOGLE OAUTH FIX
-- ==============================================================================
-- Run this in Supabase Dashboard -> SQL Editor.
-- This script:
-- 1. Creates the 'user_role' ENUM ('admin', 'user').
-- 2. Safely converts 'profiles.role' to the ENUM.
-- 3. Adds missing INSERT policy on 'profiles'.
-- 4. Automatically backfills any existing users from auth.users into profiles!
-- 5. Hardens the trigger with search_path = public so future signups auto-create profiles.
-- ==============================================================================

-- Step 1: Create the 'user_role' ENUM type if it doesn't already exist
do $$ begin
  create type public.user_role as enum ('admin', 'user');
exception
  when duplicate_object then null;
end $$;

-- Step 2: Drop any existing check constraint on 'role'
alter table public.profiles drop constraint if exists profiles_role_check;

do $$ 
declare
  con record;
begin
  for con in (
    select tc.constraint_name 
    from information_schema.table_constraints tc
    join information_schema.constraint_column_usage ccu 
      on tc.constraint_name = ccu.constraint_name
    where tc.table_name = 'profiles' 
      and ccu.column_name = 'role' 
      and tc.constraint_type = 'CHECK'
  ) loop
    execute 'alter table public.profiles drop constraint if exists ' || quote_ident(con.constraint_name);
  end loop;
end $$;

-- Step 3: Drop default and convert column to user_role ENUM safely
alter table public.profiles alter column role drop default;

alter table public.profiles
  alter column role type public.user_role
  using (
    case
      when role::text ilike 'admin%' then 'admin'::public.user_role
      else 'user'::public.user_role
    end
  );

alter table public.profiles
  alter column role set default 'user'::public.user_role;

alter table public.profiles
  alter column role set not null;

-- Step 4: Ensure complete RLS Policies on profiles with PII Privacy Protection
drop policy if exists "Public profiles are viewable by everyone" on public.profiles;
drop policy if exists "Users can insert own profile" on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;
drop policy if exists "Users can view own profile or admins can view all" on public.profiles;

-- Privacy hardening: Only the user themselves or an admin can view user profile & email
create policy "Users can view own profile or admins can view all" on public.profiles
  for select using (
    auth.uid() = id or
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'::public.user_role
    )
  );

create policy "Users can insert own profile" on public.profiles
  for insert with check (auth.uid() = id);

create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id);

-- Step 4b: Role Escalation Prevention Triggers (Stops any user from setting role = 'admin')
create or replace function public.protect_profile_role()
returns trigger as $$
begin
  -- If role is modified, block non-admin and non-service_role users
  if (new.role is distinct from old.role) then
    if (current_user not in ('service_role', 'postgres', 'supabase_admin')) then
      if not exists (
        select 1 from public.profiles
        where id = auth.uid() and role = 'admin'::public.user_role
      ) then
        raise exception 'Permission denied: Cannot modify user role.';
      end if;
    end if;
  end if;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists tr_protect_profile_role on public.profiles;
create trigger tr_protect_profile_role
  before update on public.profiles
  for each row execute function public.protect_profile_role();

create or replace function public.default_profile_role_on_insert()
returns trigger as $$
begin
  if (current_user not in ('service_role', 'postgres', 'supabase_admin')) then
    new.role := 'user'::public.user_role;
  end if;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists tr_default_profile_role_on_insert on public.profiles;
create trigger tr_default_profile_role_on_insert
  before insert on public.profiles
  for each row execute function public.default_profile_role_on_insert();

-- Step 5: Hardened trigger for new signups
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'picture', ''),
    'user'::public.user_role
  )
  on conflict (id) do update set
    email = excluded.email,
    full_name = coalesce(excluded.full_name, public.profiles.full_name),
    avatar_url = coalesce(nullif(excluded.avatar_url, ''), public.profiles.avatar_url);
  return new;
end;
$$ language plpgsql security definer set search_path = public;

-- Re-attach trigger
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Step 6: BACKFILL ALL EXISTING USERS FROM auth.users INTO public.profiles
-- (Sets creator email to admin, all other users to 'user')
insert into public.profiles (id, email, full_name, avatar_url, role)
select
  u.id,
  u.email,
  coalesce(u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name', split_part(u.email, '@', 1)),
  coalesce(u.raw_user_meta_data->>'avatar_url', u.raw_user_meta_data->>'picture', ''),
  case
    when lower(u.email) = 'abhinavderapur0@gmail.com' then 'admin'::public.user_role
    else 'user'::public.user_role
  end
from auth.users u
on conflict (id) do update set
  email = excluded.email,
  full_name = coalesce(excluded.full_name, public.profiles.full_name),
  avatar_url = coalesce(nullif(excluded.avatar_url, ''), public.profiles.avatar_url);

-- Step 7: Secure Songs Policies (Admins only for mutations)
drop policy if exists "Authenticated users can insert songs" on public.songs;
drop policy if exists "Authenticated users can update songs" on public.songs;
drop policy if exists "Authenticated users can delete songs" on public.songs;
drop policy if exists "Admins can insert songs" on public.songs;
drop policy if exists "Admins can update songs" on public.songs;
drop policy if exists "Admins can delete songs" on public.songs;

create policy "Admins can insert songs" on public.songs
  for insert with check (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role::text = 'admin'
    )
  );

create policy "Admins can update songs" on public.songs
  for update using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role::text = 'admin'
    )
  );

create policy "Admins can delete songs" on public.songs
  for delete using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role::text = 'admin'
    )
  );

-- Step 8: Hardened Storage Buckets Security (Blocks unauthenticated deletion and uploads)
drop policy if exists "Public read access to songs" on storage.objects;
drop policy if exists "Public/authenticated upload to songs" on storage.objects;
drop policy if exists "Public/authenticated delete songs" on storage.objects;
drop policy if exists "Admins can upload to songs" on storage.objects;
drop policy if exists "Admins can update songs storage" on storage.objects;
drop policy if exists "Admins can delete songs storage" on storage.objects;

drop policy if exists "Public read access to covers" on storage.objects;
drop policy if exists "Public/authenticated upload to covers" on storage.objects;
drop policy if exists "Public/authenticated delete covers" on storage.objects;
drop policy if exists "Admins can upload to covers" on storage.objects;
drop policy if exists "Admins can update covers storage" on storage.objects;
drop policy if exists "Admins can delete covers storage" on storage.objects;

-- Read access is public so all visitors can listen to audio and view artwork
create policy "Public read access to songs" on storage.objects
  for select using (bucket_id = 'songs');

create policy "Public read access to covers" on storage.objects
  for select using (bucket_id = 'covers');

-- Only verified Admins can upload to storage
create policy "Admins can upload to songs" on storage.objects
  for insert with check (
    bucket_id = 'songs' and
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role::text = 'admin'
    )
  );

create policy "Admins can upload to covers" on storage.objects
  for insert with check (
    bucket_id = 'covers' and
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role::text = 'admin'
    )
  );

-- Only verified Admins can delete from storage
create policy "Admins can delete songs storage" on storage.objects
  for delete using (
    bucket_id = 'songs' and
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role::text = 'admin'
    )
  );

create policy "Admins can delete covers storage" on storage.objects
  for delete using (
    bucket_id = 'covers' and
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role::text = 'admin'
    )
  );

