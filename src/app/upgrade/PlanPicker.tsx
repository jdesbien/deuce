"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

import type { PlanInterval } from "@/lib/billing/stripe";

const PLANS: Record<
  PlanInterval,
  { label: string; price: string; note: string }
> = {
  annual: {
    label: "Annual",
    price: "$14.99/year",
    note: "About $1.25 a month — the better deal",
  },
  monthly: {
    label: "Monthly",
    price: "$3.99/month",
    note: "Cancel anytime",
  },
};

function PlanPickerInner() {
  const searchParams = useSearchParams();
  const [plan, setPlan] = useState<PlanInterval>("annual");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(
    searchParams.get("canceled") === "1"
      ? "Checkout was canceled — no charge was made."
      : null,
  );

  async function checkout() {
    setPending(true);
    setError(null);
    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const data = (await response.json()) as { url?: string; error?: string };
      if (!response.ok || !data.url) {
        setError(data.error ?? "Could not start checkout. Please try again.");
        return;
      }
      window.location.assign(data.url);
    } catch (err) {
      console.error("Checkout failed:", err);
      setError("Could not start checkout. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div
        role="radiogroup"
        aria-label="Billing period"
        className="grid grid-cols-2 gap-2"
      >
        {(Object.keys(PLANS) as PlanInterval[]).map((key) => {
          const selected = plan === key;
          return (
            <button
              key={key}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => setPlan(key)}
              className={`rounded-2xl border p-4 text-left transition ${
                selected
                  ? "border-accent bg-accent-soft ring-2 ring-accent"
                  : "border-line bg-card hover:border-ink-soft"
              }`}
            >
              <p className="font-semibold">{PLANS[key].label}</p>
              <p className="text-lg font-bold">{PLANS[key].price}</p>
              <p className="mt-1 text-xs text-ink-soft">{PLANS[key].note}</p>
            </button>
          );
        })}
      </div>

      {error && (
        <p
          role="alert"
          className="rounded-xl bg-primary-soft px-4 py-3 text-sm font-medium text-primary-strong"
        >
          {error}
        </p>
      )}

      <button
        type="button"
        onClick={checkout}
        disabled={pending}
        className="rounded-xl bg-accent px-6 py-3.5 font-semibold text-white hover:bg-accent-strong disabled:opacity-60"
      >
        {pending ? "Opening checkout…" : `Go ad-free — ${PLANS[plan].price}`}
      </button>
    </div>
  );
}

export function PlanPicker() {
  return (
    <Suspense>
      <PlanPickerInner />
    </Suspense>
  );
}
