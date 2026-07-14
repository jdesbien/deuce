-- Sessions reference games by content slug instead of a games-table uuid.
-- Game content ships with the app (src/data/games.json); the games table
-- stays in place for the future admin milestone. The sessions table is
-- empty at this point, so the column swap is safe.

alter table public.sessions drop column game_id;

alter table public.sessions
  add column game_slug text not null
  check (game_slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$');

create index sessions_game_slug_idx on public.sessions (game_slug);

-- Fast lookup of a couple's active (unfinished) session per game — used
-- by the realtime shared-scoreboard flow.
create index sessions_active_couple_idx
  on public.sessions (couple_id, game_slug)
  where ended_at is null;
