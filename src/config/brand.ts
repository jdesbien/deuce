/**
 * Central branding config. Rename the app or change the voice here —
 * nothing else in the codebase hard-codes the name or tagline.
 *
 * Colors are defined as CSS custom properties in `src/app/globals.css`
 * (Tailwind v4 `@theme`); keep the two in sync if you rebrand colors.
 *
 * Voice (per rebrand brief): warm, inviting, talks to "you two".
 * Retired words: rivalry, settle scores, head-to-head, bragging rights,
 * opponent (outside game rules), crush, beat.
 */
export const brand = {
  name: "Cards4Couples",
  tagline: "Card games for two, made for closeness",
  description:
    "Learn a two-player card game, keep score together on one phone, and turn tonight into a phones-down date. 20 games, live scoreboards, made for couples.",
  /** Base URL for canonical links, OG tags, and share links. */
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  /** Suit glyph used as a lightweight logo mark. */
  logoGlyph: "♥",
} as const;

export type Brand = typeof brand;
