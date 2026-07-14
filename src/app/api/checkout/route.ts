import { NextResponse } from "next/server";

import { getPriceId, getStripe, isStripeConfigured } from "@/lib/billing/stripe";
import { createAdminClient, isAdminClientConfigured } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { brand } from "@/config/brand";

/**
 * Starts a Stripe Checkout session for the signed-in user. Creates (or
 * reuses) their Stripe Customer, tagging everything with the Supabase
 * user id so the webhook can attribute events without guesswork.
 */
export async function POST(request: Request) {
  if (!isStripeConfigured() || !isAdminClientConfigured()) {
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

  let plan: string;
  try {
    const body = (await request.json()) as { plan?: string };
    plan = body.plan ?? "annual";
  } catch {
    plan = "annual";
  }
  if (plan !== "monthly" && plan !== "annual") {
    return NextResponse.json({ error: "Unknown plan." }, { status: 400 });
  }
  const priceId = getPriceId(plan);
  if (!priceId) {
    return NextResponse.json({ error: "Unknown plan." }, { status: 400 });
  }

  try {
    const stripe = getStripe();
    const admin = createAdminClient();

    // Reuse the customer if this user has checked out before.
    const { data: existing } = await admin
      .from("subscriptions")
      .select("stripe_customer_id")
      .eq("user_id", user.id)
      .maybeSingle();

    let customerId = existing?.stripe_customer_id ?? null;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { supabase_user_id: user.id },
      });
      customerId = customer.id;
      await admin.from("subscriptions").upsert({
        user_id: user.id,
        stripe_customer_id: customerId,
        status: "inactive",
      });
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      client_reference_id: user.id,
      line_items: [{ price: priceId, quantity: 1 }],
      subscription_data: {
        metadata: { supabase_user_id: user.id },
      },
      allow_promotion_codes: true,
      success_url: `${brand.siteUrl}/upgrade/success`,
      cancel_url: `${brand.siteUrl}/upgrade?canceled=1`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("Checkout failed:", err);
    return NextResponse.json(
      { error: "Could not start checkout. Please try again." },
      { status: 500 },
    );
  }
}
