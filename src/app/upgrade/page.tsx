import { isStripeConfigured } from "@/lib/billing/stripe";
import { getIsPro } from "@/lib/queries/subscriptions";
import { ManageSubscriptionButton } from "@/app/upgrade/ManageSubscriptionButton";
import { PlanPicker } from "@/app/upgrade/PlanPicker";

export const metadata = {
  title: "Go ad-free",
  description:
    "Cards4Couples Pro removes ads for good — keep game night just the two of you.",
};

export default async function UpgradePage() {
  const isPro = await getIsPro();
  const billingReady = isStripeConfigured();

  return (
    <div className="mx-auto max-w-md px-4 py-12 text-center">
      <p aria-hidden className="mb-2 text-4xl">
        ♥
      </p>
      <h1 className="text-2xl font-bold">Keep it just the two of you</h1>
      <p className="mt-2 text-ink-soft">
        Pro removes every ad, for good. Same app, same games, nothing between
        you and game night.
      </p>

      <div className="mt-8">
        {isPro ? (
          <div className="rounded-2xl border border-line bg-card p-6">
            <p className="font-semibold">You&apos;re Pro — thank you! ♥</p>
            <p className="mt-1 text-sm text-ink-soft">
              Manage your plan, payment method, or cancel anytime.
            </p>
            <div className="mt-4">
              <ManageSubscriptionButton />
            </div>
          </div>
        ) : billingReady ? (
          <PlanPicker />
        ) : (
          <div className="rounded-2xl border border-dashed border-line bg-card p-6 text-ink-soft">
            <p className="font-medium text-ink">Pro is almost ready</p>
            <p className="mt-1 text-sm">
              Subscriptions aren&apos;t switched on yet — check back soon.
            </p>
          </div>
        )}
      </div>

      <p className="mt-6 text-xs text-ink-soft">
        Payments are handled by Stripe. Cancel anytime from Settings.
      </p>
    </div>
  );
}
