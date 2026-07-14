import { UserRow } from "@/app/admin/users/UserRow";
import { searchProfiles } from "@/lib/queries/admin";
import { getCurrentUser } from "@/lib/queries/profiles";

export const metadata = { title: "Admin · Users" };

export default async function AdminUsersPage(
  props: PageProps<"/admin/users">,
) {
  const searchParams = await props.searchParams;
  const query = typeof searchParams.q === "string" ? searchParams.q : "";
  const [profiles, current] = await Promise.all([
    searchProfiles(query),
    getCurrentUser(),
  ]);

  return (
    <div>
      <form method="get" className="mb-4 flex gap-2">
        <input
          type="search"
          name="q"
          defaultValue={query}
          placeholder="Search by display name…"
          aria-label="Search users"
          className="w-full rounded-xl border border-line bg-card px-4 py-2.5 outline-none focus:border-primary"
        />
        <button
          type="submit"
          className="shrink-0 rounded-xl bg-primary px-4 py-2.5 font-semibold text-white hover:bg-primary-strong"
        >
          Search
        </button>
      </form>

      {profiles.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-line bg-card p-8 text-center text-ink-soft">
          No users found.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {profiles.map((profile) => (
            <UserRow
              key={profile.id}
              profile={profile}
              isSelf={profile.id === current?.user.id}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
