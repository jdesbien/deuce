import { NextResponse } from "next/server";

import { getStripe, isStripeConfigured } from "@/lib/billing/stripe";
import { brand } from "@/config/brand";
import { createClient } from "@/lib/supabase/server";

/**
 * Opens the Stripe Customer Portal so subscribers manage their payment
 * method or cancel without any custom billing UI.
 */
export async function POST() {
  if (!isStripeConfigured()) {
    return NextResponse.json(
      { error: "Billing isn't configured yet." },
      { status: 503 },
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Please log in first." }, { status: 401 });
  }

  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("stripe_customer_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!subscription?.stripe_customer_id) {
    return NextResponse.json(
      { error: "No subscription found for this account." },
      { status: 404 },
    );
  }

  try {
    const stripe = getStripe();
    const session = await stripe.billingPortal.sessions.create({
      customer: subscription.stripe_customer_id,
      return_url: `${brand.siteUrl}/settings`,
    });
    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("Portal session failed:", err);
    return NextResponse.json(
      { error: "Could not open the billing portal. Please try again." },
      { status: 500 },
    );
  }
}
