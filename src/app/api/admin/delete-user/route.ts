import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/queries/profiles";
import {
  createAdminClient,
  isAdminClientConfigured,
} from "@/lib/supabase/admin";

/**
 * Permanently deletes a user (auth record + cascading profile and
 * subscription; their sessions are kept with created_by nulled so a
 * partner's shared history survives). Requires the service-role key —
 * deleting auth users is not possible through RLS-scoped clients.
 */
export async function POST(request: Request) {
  const current = await getCurrentUser();
  if (current?.profile?.role !== "admin") {
    return NextResponse.json({ error: "Admins only." }, { status: 403 });
  }

  if (!isAdminClientConfigured()) {
    return NextResponse.json(
      {
        error:
          "User deletion needs SUPABASE_SERVICE_ROLE_KEY set in the server environment.",
      },
      { status: 503 },
    );
  }

  let userId: string | undefined;
  try {
    const body = (await request.json()) as { userId?: string };
    userId = body.userId;
  } catch {
    userId = undefined;
  }
  if (!userId) {
    return NextResponse.json({ error: "Missing userId." }, { status: 400 });
  }
  if (userId === current.user.id) {
    return NextResponse.json(
      { error: "You can't delete your own account from here." },
      { status: 400 },
    );
  }

  try {
    const admin = createAdminClient();
    const { error } = await admin.auth.admin.deleteUser(userId);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Delete user failed:", err);
    return NextResponse.json({ error: "Delete failed." }, { status: 500 });
  }
}
