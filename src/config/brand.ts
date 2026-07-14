/**
 * Central branding config. Rename the app or change the voice here —
 * nothing else in the codebase hard-codes the name or tagline.
 *
 * Colors are defined as CSS custom properties in `src/app/globals.css`
 * (Tailwind v4 `@theme`); keep the two in sync if you rebrand colors.
 */
export const brand = {
  name: "Deuce",
  tagline: "Card games for two",
  description:
    "Rules and live scoreboards for two-player card games. Learn a game, keep score together, and build your head-to-head rivalry.",
  /** Base URL for canonical links, OG tags, and share links. */
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  /** Suit glyph used as a lightweight logo mark. */
  logoGlyph: "♦",
} as const;

export type Brand = typeof brand;
