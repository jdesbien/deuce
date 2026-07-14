import { FeedbackForm } from "@/app/feedback/FeedbackForm";

export const metadata = {
  title: "Feedback",
  description: "Tell us what to fix or what to build next.",
};

export default function FeedbackPage() {
  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <h1 className="mb-1 text-2xl font-bold">Tell us anything</h1>
      <p className="mb-6 text-ink-soft">
        A bug, a missing game, a rule we got wrong, an idea — it all lands
        straight with the maker.
      </p>
      <FeedbackForm />
    </div>
  );
}
