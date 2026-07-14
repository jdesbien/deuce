import Link from "next/link";
import { Suspense } from "react";

import { SignupForm } from "./SignupForm";

export const metadata = { title: "Sign up" };

export default function SignupPage() {
  return (
    <div className="mx-auto max-w-sm px-4 py-12">
      <h1 className="mb-1 text-2xl font-bold">Create your account</h1>
      <p className="mb-6 text-sm text-ink-soft">
        Free forever. Save your score history and link up with your partner.
      </p>
      <Suspense>
        <SignupForm />
      </Suspense>
      <p className="mt-6 text-center text-sm text-ink-soft">
        Already have an account?{" "}
        <Link
          href="/login"
          className="font-semibold text-primary hover:text-primary-strong"
        >
          Log in
        </Link>
      </p>
    </div>
  );
}
