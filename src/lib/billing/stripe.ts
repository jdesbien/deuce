import Stripe from "stripe";

/**
 * Server-only Stripe client. The SDK pins the Stripe API version it was
 * built against, which is the "pin your API version" the spec asks for —
 * upgrades happen when we deliberately bump the `stripe` package.
 */
export function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error("STRIPE_SECRET_KEY is not set.");
  }
  return new Stripe(key);
}

export function isStripeConfigured(): boolean {
  return Boolean(
    process.env.STRIPE_SECRET_KEY &&
      process.env.NEXT_PUBLIC_STRIPE_PRICE_MONTHLY &&
      process.env.NEXT_PUBLIC_STRIPE_PRICE_ANNUAL,
  );
}

export type PlanInterval = "monthly" | "annual";

export function getPriceId(plan: PlanInterval): string | null {
  const id =
    plan === "monthly"
      ? process.env.NEXT_PUBLIC_STRIPE_PRICE_MONTHLY
      : process.env.NEXT_PUBLIC_STRIPE_PRICE_ANNUAL;
  return id || null;
}

/** Stripe statuses that count as Pro. */
export const PRO_STATUSES = new Set(["active", "trialing"]);
