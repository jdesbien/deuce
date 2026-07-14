-- ============================================================
-- Deuce — initial schema
-- Tables: profiles, couples, games, sessions, feedback, app_settings
-- All tables have RLS enabled with explicit policies.
-- ============================================================

-- ------------------------------------------------------------
-- Enums
-- ------------------------------------------------------------
create type public.user_role as enum ('user', 'admin');
create type public.game_difficulty as enum ('easy', 'medium', 'hard');
create type public.game_status as enum ('draft', 'published');
create type public.session_winner as enum ('player1', 'player2', 'tie', 'abandoned');
create type public.feedback_status as enum ('new', 'read', 'resolved');

-- ------------------------------------------------------------
-- couples
-- ------------------------------------------------------------
create or replace function public.generate_invite_code()
returns text
language plpgsql
volatile
set search_path = public
as $$
declare
  -- Unambiguous alphabet: no 0/O, 1/I/L to keep codes easy to read aloud
  chars constant text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  code text;
begin
  loop
    code := '';
    for i in 1..6 loop
      code := code || substr(chars, floor(random() * length(chars))::int + 1, 1);
    end loop;
    exit when not exists (select 1 from public.couples where invite_code = code);
  end loop;
  return code;
end;
$$;

create table public.couples (
  id uuid primary key default gen_random_uuid(),
  invite_code text not null unique default public.generate_invite_code(),
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- profiles
-- ------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null default 'Player'
    check (char_length(display_name) between 1 and 40),
  avatar_emoji text not null default '🂡'
    check (char_length(avatar_emoji) between 1 and 8),
  role public.user_role not null default 'user',
  couple_id uuid references public.couples (id) on delete set null,
  created_at timestamptz not null default now()
);

create index profiles_couple_id_idx on public.profiles (couple_id);

-- Auto-create a profile row when a user signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(
      nullif(trim(new.raw_user_meta_data ->> 'display_name'), ''),
      nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''),
      split_part(new.email, '@', 1),
      'Player'
    )
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- A couple has at most 2 members. The advisory lock serializes
-- concurrent joins to the same couple so the count check is safe.
create or replace function public.enforce_couple_size()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.couple_id is not null
     and (tg_op = 'INSERT' or new.couple_id is distinct from old.couple_id) then
    perform pg_advisory_xact_lock(hashtext(new.couple_id::text));
    if (select count(*) from public.profiles
        where couple_id = new.couple_id and id <> new.id) >= 2 then
      raise exception 'This couple already has two members';
    end if;
  end if;
  return new;
end;
$$;

create trigger couple_size_check
  before insert or update of couple_id on public.profiles
  for each row execute function public.enforce_couple_size();

-- Only admins may change roles. auth.uid() is null for the service
-- role and the SQL editor, which stay allowed for admin bootstrap.
create or replace function public.prevent_role_escalation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role is distinct from old.role
     and auth.uid() is not null
     and not public.is_admin() then
    raise exception 'Only admins can change roles';
  end if;
  return new;
end;
$$;

-- ------------------------------------------------------------
-- Helper functions (security definer so RLS policies can consult
-- the profiles table without recursive policy evaluation)
-- ------------------------------------------------------------
create or replace function public.is_admin(uid uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = uid and role = 'admin'
  );
$$;

create or replace function public.current_couple_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select couple_id from public.profiles where id = auth.uid();
$$;

create trigger role_escalation_check
  before update of role on public.profiles
  for each row execute function public.prevent_role_escalation();

-- ------------------------------------------------------------
-- games
-- ------------------------------------------------------------
create table public.games (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique
    check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title text not null check (char_length(title) between 1 and 80),
  summary text not null default '',
  difficulty public.game_difficulty not null default 'easy',
  avg_duration_minutes int not null default 15
    check (avg_duration_minutes between 1 and 600),
  deck_requirements text not null default 'Standard 52-card deck',
  tags text[] not null default '{}',
  instructions jsonb not null default '{}'::jsonb,
  scoring_template jsonb not null default '{"type": "tally"}'::jsonb,
  status public.game_status not null default 'draft',
  featured boolean not null default false,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index games_status_idx on public.games (status);
create index games_tags_idx on public.games using gin (tags);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger games_set_updated_at
  before update on public.games
  for each row execute function public.set_updated_at();

-- ------------------------------------------------------------
-- sessions (one play session of one game)
-- ------------------------------------------------------------
create table public.sessions (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references public.games (id) on delete cascade,
  couple_id uuid references public.couples (id) on delete set null,
  -- Nullable: guest sessions migrated on signup keep their original
  -- creator; account deletion nulls this out (couple history survives).
  created_by uuid references auth.users (id) on delete set null,
  player1_name text not null default 'Player 1'
    check (char_length(player1_name) between 1 and 40),
  player2_name text not null default 'Player 2'
    check (char_length(player2_name) between 1 and 40),
  winner public.session_winner,
  final_scores jsonb not null default '{}'::jsonb,
  rounds jsonb not null default '[]'::jsonb,
  started_at timestamptz not null default now(),
  ended_at timestamptz
);

create index sessions_couple_id_idx on public.sessions (couple_id);
create index sessions_created_by_idx on public.sessions (created_by);
create index sessions_game_id_idx on public.sessions (game_id);

-- Realtime: both partners subscribe to the session row for live sync.
alter publication supabase_realtime add table public.sessions;

-- ------------------------------------------------------------
-- feedback
-- ------------------------------------------------------------
create table public.feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete set null,
  email text check (email is null or char_length(email) <= 254),
  message text not null check (char_length(message) between 1 and 5000),
  page_context text,
  status public.feedback_status not null default 'new',
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- app_settings (single row, admin toggles)
-- ------------------------------------------------------------
create table public.app_settings (
  id boolean primary key default true check (id), -- forces a single row
  ads_enabled boolean not null default false,
  announcement_banner text,
  updated_at timestamptz not null default now()
);

insert into public.app_settings (id) values (true);

create trigger app_settings_set_updated_at
  before update on public.app_settings
  for each row execute function public.set_updated_at();

-- ------------------------------------------------------------
-- Couple linking RPCs (security definer: the join flow must look up
-- a couple by invite code before the caller is a member of it)
-- ------------------------------------------------------------
create or replace function public.create_couple()
returns public.couples
language plpgsql
security definer
set search_path = public
as $$
declare
  new_couple public.couples;
begin
  if auth.uid() is null then
    raise exception 'Must be signed in';
  end if;
  if (select couple_id from public.profiles where id = auth.uid()) is not null then
    raise exception 'You are already linked to a partner';
  end if;

  insert into public.couples (created_by)
  values (auth.uid())
  returning * into new_couple;

  update public.profiles set couple_id = new_couple.id where id = auth.uid();
  return new_couple;
end;
$$;

create or replace function public.join_couple(code text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  target public.couples;
begin
  if auth.uid() is null then
    raise exception 'Must be signed in';
  end if;
  if (select couple_id from public.profiles where id = auth.uid()) is not null then
    raise exception 'You are already linked to a partner';
  end if;

  select * into target from public.couples
  where invite_code = upper(trim(code));
  if not found then
    raise exception 'Invalid invite code';
  end if;

  -- The couple_size_check trigger enforces the 2-member cap.
  update public.profiles set couple_id = target.id where id = auth.uid();
  return target.id;
end;
$$;

create or replace function public.leave_couple()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Must be signed in';
  end if;
  -- The couple row (and its session history) is intentionally kept.
  update public.profiles set couple_id = null where id = auth.uid();
end;
$$;

-- ------------------------------------------------------------
-- Row Level Security
-- ------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.couples enable row level security;
alter table public.games enable row level security;
alter table public.sessions enable row level security;
alter table public.feedback enable row level security;
alter table public.app_settings enable row level security;

-- profiles ---------------------------------------------------
create policy "profiles: read own, partner, or admin"
  on public.profiles for select
  to authenticated
  using (
    id = (select auth.uid())
    or public.is_admin()
    or (couple_id is not null and couple_id = public.current_couple_id())
  );

create policy "profiles: users update their own"
  on public.profiles for update
  to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

create policy "profiles: admins update any"
  on public.profiles for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "profiles: admins delete"
  on public.profiles for delete
  to authenticated
  using (public.is_admin());

-- couples ----------------------------------------------------
create policy "couples: members, creator, or admin read"
  on public.couples for select
  to authenticated
  using (
    id = public.current_couple_id()
    or created_by = (select auth.uid())
    or public.is_admin()
  );

create policy "couples: admins delete"
  on public.couples for delete
  to authenticated
  using (public.is_admin());

-- games ------------------------------------------------------
create policy "games: published are public, drafts admin-only"
  on public.games for select
  to anon, authenticated
  using (status = 'published' or public.is_admin());

create policy "games: admins insert"
  on public.games for insert
  to authenticated
  with check (public.is_admin());

create policy "games: admins update"
  on public.games for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "games: admins delete"
  on public.games for delete
  to authenticated
  using (public.is_admin());

-- sessions ---------------------------------------------------
create policy "sessions: creator, couple members, or admin read"
  on public.sessions for select
  to authenticated
  using (
    created_by = (select auth.uid())
    or (couple_id is not null and couple_id = public.current_couple_id())
    or public.is_admin()
  );

create policy "sessions: authed users insert their own"
  on public.sessions for insert
  to authenticated
  with check (
    created_by = (select auth.uid())
    and (couple_id is null or couple_id = public.current_couple_id())
  );

create policy "sessions: creator or couple members update"
  on public.sessions for update
  to authenticated
  using (
    created_by = (select auth.uid())
    or (couple_id is not null and couple_id = public.current_couple_id())
  )
  with check (
    created_by = (select auth.uid())
    or (couple_id is not null and couple_id = public.current_couple_id())
  );

create policy "sessions: creator or admin delete"
  on public.sessions for delete
  to authenticated
  using (created_by = (select auth.uid()) or public.is_admin());

-- feedback ---------------------------------------------------
create policy "feedback: anyone can submit"
  on public.feedback for insert
  to anon, authenticated
  with check (user_id is null or user_id = (select auth.uid()));

create policy "feedback: admins read"
  on public.feedback for select
  to authenticated
  using (public.is_admin());

create policy "feedback: admins update"
  on public.feedback for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "feedback: admins delete"
  on public.feedback for delete
  to authenticated
  using (public.is_admin());

-- app_settings -----------------------------------------------
create policy "app_settings: everyone reads"
  on public.app_settings for select
  to anon, authenticated
  using (true);

create policy "app_settings: admins update"
  on public.app_settings for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ------------------------------------------------------------
-- Function grants: lock down definer functions to sane callers
-- ------------------------------------------------------------
revoke all on function public.create_couple() from public, anon;
revoke all on function public.join_couple(text) from public, anon;
revoke all on function public.leave_couple() from public, anon;
grant execute on function public.create_couple() to authenticated;
grant execute on function public.join_couple(text) to authenticated;
grant execute on function public.leave_couple() to authenticated;
grant execute on function public.is_admin(uuid) to anon, authenticated;
grant execute on function public.current_couple_id() to anon, authenticated;
