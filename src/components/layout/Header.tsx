import Link from "next/link";

import { brand } from "@/config/brand";
import { getCurrentUser } from "@/lib/queries/profiles";

export async function Header() {
  const current = await getCurrentUser();

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-surface/95 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-3 px-4">
        <Link
          href="/"
          className="flex items-center gap-2 text-lg font-bold tracking-tight"
        >
          <span aria-hidden className="text-primary">
            {brand.logoGlyph}
          </span>
          {brand.name}
        </Link>

        <nav className="flex items-center gap-1 sm:gap-2">
          <Link
            href="/games"
            className="rounded-lg px-3 py-2 text-sm font-medium text-ink-soft hover:bg-primary-soft hover:text-ink"
          >
            Games
          </Link>

          {current ? (
            <div className="flex items-center gap-1 sm:gap-2">
              <span
                className="max-w-28 truncate rounded-lg px-2 py-2 text-sm font-medium sm:max-w-40"
                title={current.profile?.display_name}
              >
                <span aria-hidden className="mr-1">
                  {current.profile?.avatar_emoji ?? "🂡"}
                </span>
                {current.profile?.display_name ?? "Player"}
              </span>
              <form action="/auth/signout" method="post">
                <button
                  type="submit"
                  className="rounded-lg px-3 py-2 text-sm font-medium text-ink-soft hover:bg-primary-soft hover:text-ink"
                >
                  Sign out
                </button>
              </form>
            </div>
          ) : (
            <div className="flex items-center gap-1 sm:gap-2">
              <Link
                href="/login"
                className="rounded-lg px-3 py-2 text-sm font-medium text-ink-soft hover:bg-primary-soft hover:text-ink"
              >
                Log in
              </Link>
              <Link
                href="/signup"
                className="rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-white hover:bg-primary-strong"
              >
                Sign up
              </Link>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}
