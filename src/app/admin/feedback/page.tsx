import { FeedbackRow } from "@/app/admin/feedback/FeedbackRow";
import { getFeedbackList } from "@/lib/queries/admin";

export const metadata = { title: "Admin · Feedback" };

export default async function AdminFeedbackPage() {
  const items = await getFeedbackList();

  return items.length === 0 ? (
    <p className="rounded-2xl border border-dashed border-line bg-card p-8 text-center text-ink-soft">
      No feedback yet. The public form lives at /feedback.
    </p>
  ) : (
    <ul className="flex flex-col gap-2">
      {items.map((item) => (
        <FeedbackRow key={item.id} item={item} />
      ))}
    </ul>
  );
}
