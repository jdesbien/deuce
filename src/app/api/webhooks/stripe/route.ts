import { NextResponse } from "next/server";
import type Stripe from "stripe";

import { getStripe } from "@/lib/billing/stripe";
import { createAdminClient, isAdminClientConfigured } from "@/lib/supabase/admin";

/**
 * Stripe webhook — the single writer of subscription state. Signature is
 * verified against the raw body; every handler derives the full row from
 * the current Stripe subscription object, so redelivered events simply
 * rewrite the same state (idempotent by construction).
 */

function periodEndIso(subscription: Stripe.Subscription): string | null {
  const epoch = subscription.items.data[0]?.current_period_end;
  return typeof epoch === "number"
    ? new Date(epoch * 1000).toISOString()
    : null;
}

async function resolveUserId(
  admin: ReturnType<typeof createAdminClient>,
  subscription: Stripe.Subscription,
  fallbackUserId?: string | null,
): Promise<string | null> {
  const fromMetadata = subscription.metadata?.supabase_user_id;
  if (fromMetadata) return fromMetadata;
  if (fallbackUserId) return fallbackUserId;
  const customerId =
    typeof subscription.customer === "string"
      ? subscription.customer
      : subscription.customer.id;
  const { data } = await admin
    .from("subscriptions")
    .select("user_id")
    .eq("stripe_customer_id", customerId)
    .maybeSingle();
  return data?.user_id ?? null;
}

async function syncSubscription(
  admin: ReturnType<typeof createAdminClient>,
  subscription: Stripe.Subscription,
  fallbackUserId?: string | null,
): Promise<void> {
  const userId = await resolveUserId(admin, subscription, fallbackUserId);
  if (!userId) {
    console.warn(
      `Stripe webhook: no Supabase user for subscription ${subscription.id}`,
    );
    return;
  }
  const customerId =
    typeof subscription.customer === "string"
      ? subscription.customer
      : subscription.customer.id;

  const { error } = await admin.from("subscriptions").upsert({
    user_id: userId,
    stripe_customer_id: customerId,
    stripe_subscription_id: subscription.id,
    status: subscription.status,
    price_id: subscription.items.data[0]?.price.id ?? null,
    current_period_end: periodEndIso(subscription),
  });
  if (error) {
    throw new Error(`Supabase write failed: ${error.message}`);
  }
}

async function syncByCustomer(
  stripe: Stripe,
  admin: ReturnType<typeof createAdminClient>,
  customerId: string,
): Promise<void> {
  const subscriptions = await stripe.subscriptions.list({
    customer: customerId,
    status: "all",
    limit: 1,
  });
  const subscription = subscriptions.data[0];
  if (subscription) await syncSubscription(admin, subscription);
}

export async function POST(request: Request) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret || !isAdminClientConfigured()) {
    return NextResponse.json(
      { error: "Webhook not configured." },
      { status: 503 },
    );
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature." }, { status: 400 });
  }

  const stripe = getStripe();
  const rawBody = await request.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err) {
    console.warn("Stripe signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  const admin = createAdminClient();

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        const subscriptionId =
          typeof session.subscription === "string"
            ? session.subscription
            : session.subscription?.id;
        if (subscriptionId) {
          const subscription =
            await stripe.subscriptions.retrieve(subscriptionId);
          await syncSubscription(admin, subscription, session.client_reference_id);
        }
        break;
      }
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        await syncSubscription(admin, event.data.object);
        break;
      }
      case "invoice.paid":
      case "invoice.payment_failed": {
        const invoice = event.data.object;
        const customerId =
          typeof invoice.customer === "string"
            ? invoice.customer
            : invoice.customer?.id;
        if (customerId) await syncByCustomer(stripe, admin, customerId);
        break;
      }
      default:
        // Unsubscribed event types are acknowledged and ignored.
        break;
    }
  } catch (err) {
    // Non-2xx tells Stripe to retry later — desired for transient failures.
    console.error(`Stripe webhook ${event.type} failed:`, err);
    return NextResponse.json({ error: "Handler failed." }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
