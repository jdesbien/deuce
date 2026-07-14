import Link from "next/link";

export const metadata = { title: "Welcome to Pro", robots: { index: false } };

export default function UpgradeSuccessPage() {
  return (
    <div className="mx-auto max-w-sm px-4 py-16 text-center">
      <p aria-hidden className="mb-3 animate-bounce text-5xl">
        🎉
      </p>
      <h1 className="text-2xl font-bold">You&apos;re Pro ♥</h1>
      <p className="mt-2 text-ink-soft">
        Thanks for supporting the app. Ads are gone for good — it might take
        a few seconds while your subscription registers.
      </p>
      <div className="mt-6 flex flex-col gap-3">
        <Link
          href="/dashboard"
          className="rounded-xl bg-accent px-6 py-3.5 font-semibold text-white hover:bg-accent-strong"
        >
          Back to your table
        </Link>
        <Link
          href="/settings"
          className="rounded-xl border border-line px-6 py-3.5 font-semibold hover:border-ink-soft"
        >
          Manage subscription
        </Link>
      </div>
    </div>
  );
}
