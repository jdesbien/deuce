import Link from "next/link";

import { HeaderAuth } from "@/components/layout/HeaderAuth";
import { brand } from "@/config/brand";

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-surface/95 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-2 px-3 sm:px-4">
        <Link
          href="/"
          className="flex shrink-0 items-center gap-1.5 text-base font-bold tracking-tight sm:text-lg"
        >
          <span aria-hidden className="text-suit">
            {brand.logoGlyph}
          </span>
          {brand.name}
        </Link>

        <nav className="flex items-center gap-0.5 sm:gap-2">
          <Link
            href="/games"
            className="rounded-lg px-2.5 py-2 text-sm font-medium text-ink-soft hover:bg-primary-soft hover:text-ink sm:px-3"
          >
            Games
          </Link>
          <HeaderAuth />
        </nav>
      </div>
    </header>
  );
}
