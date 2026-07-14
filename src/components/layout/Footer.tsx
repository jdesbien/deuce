import Link from "next/link";

import { brand } from "@/config/brand";

const footerLinks = [
  { href: "/games", label: "Games" },
  { href: "/feedback", label: "Feedback" },
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
] as const;

export function Footer() {
  return (
    <footer className="border-t border-line bg-card">
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-3 px-4 py-8 text-sm text-ink-soft sm:flex-row sm:justify-between">
        <p>
          <span aria-hidden className="mr-1 text-suit">
            {brand.logoGlyph}
          </span>
          {brand.name} — {brand.tagline.toLowerCase()}
        </p>
        <nav className="flex gap-5">
          {footerLinks.map((link) => (
            <Link key={link.href} href={link.href} className="hover:text-ink">
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
