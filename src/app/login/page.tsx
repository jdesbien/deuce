import Link from "next/link";
import { Suspense } from "react";

import { LoginForm } from "./LoginForm";

export const metadata = { title: "Log in" };

export default function LoginPage() {
  return (
    <div className="mx-auto max-w-sm px-4 py-12">
      <h1 className="mb-1 text-2xl font-bold">Welcome back</h1>
      <p className="mb-6 text-sm text-ink-soft">
        Log in to save scores and see your rivalry stats.
      </p>
      <Suspense>
        <LoginForm />
      </Suspense>
      <p className="mt-6 text-center text-sm text-ink-soft">
        New here?{" "}
        <Link
          href="/signup"
          className="font-semibold text-primary hover:text-primary-strong"
        >
          Create a free account
        </Link>
      </p>
    </div>
  );
}
