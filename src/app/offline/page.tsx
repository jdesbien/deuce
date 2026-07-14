import Link from "next/link";

export const metadata = { title: "Offline", robots: { index: false } };

export default function OfflinePage() {
  return (
    <div className="mx-auto max-w-sm px-4 py-16 text-center">
      <p aria-hidden className="mb-2 text-4xl">
        ♥
      </p>
      <h1 className="text-2xl font-bold">No signal — no problem</h1>
      <p className="mt-2 text-ink-soft">
        You&apos;re offline, but any game rules and scoreboards you&apos;ve
        opened before are still available. Guest scoreboards keep working —
        scores save on this device and sync up when you&apos;re back online.
      </p>
      <Link
        href="/games"
        className="mt-6 inline-block rounded-xl bg-accent px-6 py-3.5 font-semibold text-white hover:bg-accent-strong"
      >
        Open the game library
      </Link>
    </div>
  );
}
