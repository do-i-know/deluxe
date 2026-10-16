-- ==============================================================================
-- DELUXE MUSIC: SUPABASE DATABASE & STORAGE SCHEMA
-- ==============================================================================
-- Run this script in your Supabase Project -> SQL Editor to initialize:
-- 1. Database tables (profiles, songs, playlists, playlist_songs, favorites, listener_chat)
-- 2. Storage buckets ('songs' for MP3/audio and 'covers' for album art)
-- 3. Row Level Security (RLS) policies allowing public read, authenticated upload & admin management
-- ==============================================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Create ENUM type for User Roles
do $$ begin
  create type public.user_role as enum ('admin', 'user');
exception
  when duplicate_object then null;
end $$;

-- 1. PROFILES TABLE (Extends Supabase auth.users)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  full_name text,
  avatar_url text,
  role public.user_role default 'user'::public.user_role not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. SONGS TABLE
create table if not exists public.songs (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  artist text not null,
  album text default 'Single',
  genre text default 'Retro',
  duration numeric default 0, -- Duration in seconds
  song_url text not null,      -- Public URL from Supabase Storage or external
  cover_url text default '',   -- Public URL of album artwork
  storage_path text default '',-- Bucket path e.g. "songs/1234_eona.mp3"
  plays_count integer default 0,
  is_featured boolean default false,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. PLAYLISTS TABLE
create table if not exists public.playlists (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  description text default '',
  cover_url text default '',
  user_id uuid references auth.users(id) on delete cascade not null,
  is_public boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. PLAYLIST SONGS JUNCTION
create table if not exists public.playlist_songs (
  id uuid default gen_random_uuid() primary key,
  playlist_id uuid references public.playlists(id) on delete cascade not null,
  song_id uuid references public.songs(id) on delete cascade not null,
  position integer default 0,
  added_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (playlist_id, song_id)
);

-- 5. FAVORITES (LIKED SONGS)
create table if not exists public.favorites (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  song_id uuid references public.songs(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (user_id, song_id)
);

-- 6. LISTENER LOUNGE CHAT (Deluxe Music Live Vibe)
create table if not exists public.listener_chat (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete set null,
  user_name text not null,
  avatar_url text default '',
  message text not null,
  is_admin boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

alter table public.profiles enable row level security;
alter table public.songs enable row level security;
alter table public.playlists enable row level security;
alter table public.playlist_songs enable row level security;
alter table public.favorites enable row level security;
alter table public.listener_chat enable row level security;

-- Profiles Policies: Privacy hardened - Users can only view their own profile, Admins view all
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

-- Role Escalation Prevention Triggers (Stops users from elevating themselves to admin)
create or replace function public.protect_profile_role()
returns trigger as $$
begin
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

-- Songs Policies: Anyone can view; Only authenticated Admins can insert/update/delete
create policy "Songs are viewable by everyone" on public.songs
  for select using (true);

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

-- Playlists Policies
create policy "Public playlists viewable by all" on public.playlists
  for select using (is_public or auth.uid() = user_id);

create policy "Users can manage own playlists" on public.playlists
  for all using (auth.uid() = user_id);

-- Playlist Songs Policies
create policy "Playlist items viewable by all" on public.playlist_songs
  for select using (true);

create policy "Users can manage songs in their playlists" on public.playlist_songs
  for all using (
    exists (
      select 1 from public.playlists
      where id = playlist_songs.playlist_id and user_id = auth.uid()
    )
  );

-- Favorites Policies
create policy "Users can view their favorites" on public.favorites
  for select using (auth.uid() = user_id);

create policy "Users can insert their favorites" on public.favorites
  for insert with check (auth.uid() = user_id);

create policy "Users can delete their favorites" on public.favorites
  for delete using (auth.uid() = user_id);

-- Listener Chat Policies (Prevent spoofing is_admin)
create policy "Chat messages viewable by all" on public.listener_chat
  for select using (true);

create policy "Anyone can post chat message" on public.listener_chat
  for insert with check (
    is_admin = false or
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role::text = 'admin'
    )
  );

-- ==============================================================================
-- STORAGE BUCKETS CONFIGURATION (Supabase Storage)
-- ==============================================================================

-- Create 'songs' bucket for audio files (.mp3, .wav, .m4a)
insert into storage.buckets (id, name, public)
values ('songs', 'songs', true)
on conflict (id) do nothing;

-- Create 'covers' bucket for artwork (.jpg, .png, .webp)
insert into storage.buckets (id, name, public)
values ('covers', 'covers', true)
on conflict (id) do nothing;

-- Storage Policies for 'songs' bucket
create policy "Public read access to songs" on storage.objects
  for select using (bucket_id = 'songs');

create policy "Admins can upload to songs" on storage.objects
  for insert with check (
    bucket_id = 'songs' and
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role::text = 'admin'
    )
  );

create policy "Admins can update songs storage" on storage.objects
  for update using (
    bucket_id = 'songs' and
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role::text = 'admin'
    )
  );

create policy "Admins can delete songs storage" on storage.objects
  for delete using (
    bucket_id = 'songs' and
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role::text = 'admin'
    )
  );

-- Storage Policies for 'covers' bucket
create policy "Public read access to covers" on storage.objects
  for select using (bucket_id = 'covers');

create policy "Admins can upload to covers" on storage.objects
  for insert with check (
    bucket_id = 'covers' and
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role::text = 'admin'
    )
  );

create policy "Admins can update covers storage" on storage.objects
  for update using (
    bucket_id = 'covers' and
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

-- ==============================================================================
-- AUTO-SYNC USER ON SIGNUP TRIGGER
-- ==============================================================================
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'picture', ''),
    case
      when lower(new.email) = 'abhinavderapur0@gmail.com' then 'admin'::public.user_role
      else 'user'::public.user_role
    end
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

-- Trigger on auth.users insert
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ==============================================================================
-- INITIAL SEED SONGS (Matches original tracks with Deluxe Music aesthetic)
-- ==============================================================================
insert into public.songs (title, artist, album, genre, duration, song_url, cover_url, is_featured)
values
  (
    'EONA - Emotional Ambient Pop',
    'Rockot',
    'Ambient Horizons',
    'Retro Ambient',
    210,
    '/songs/eona.mp3',
    'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&auto=format&fit=crop&q=80',
    true
  ),
  (
    'Brain Implant - Cyberpunk Action',
    'soundbay',
    'Neo Delhi 2077',
    'Cyber Sci-Fi',
    124,
    '/songs/brain-implant.mp3',
    'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=600&auto=format&fit=crop&q=80',
    true
  ),
  (
    'Gorila - Retro Street Grooves',
    'Alex_MakeMusic',
    'Bazaar Sessions',
    'Vintage Beats',
    182,
    '/songs/gorila.mp3',
    'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600&auto=format&fit=crop&q=80',
    false
  ),
  (
    'Jungle Waves - Drum & Bass Odyssey',
    'DIMMYSAD',
    'Monsoon Rhythms',
    'Electronic',
    205,
    '/songs/jungle-waves.mp3',
    'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80',
    true
  ),
  (
    'Showreel Theme - Golden Era Vibes',
    'MFCC',
    'Retro Lounge Vol. 1',
    'Retro Lounge',
    195,
    '/songs/showreel.mp3',
    'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=600&auto=format&fit=crop&q=80',
    false
  )
on conflict do nothing;
