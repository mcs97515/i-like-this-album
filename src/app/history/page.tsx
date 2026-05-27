import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getUserSearchHistory } from "@/lib/search";
import { TopBar } from "../_components/TopBar";
import { PageTransition } from "../_components/PageTransition";
import { Footer } from "../_components/Footer";

export default async function HistoryPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/");
  }

  const history = await getUserSearchHistory(session.user.id!);

  return (
    <main className="flex min-h-screen flex-col items-center gap-8 p-8">
      <TopBar user={session.user} />

      <PageTransition className="w-full max-w-3xl space-y-4">
        <h1 className="text-xl font-semibold">Your search history</h1>

        {history.length === 0 ? (
          <p className="text-gray-500">
            No searches yet.{" "}
            <Link href="/" className="underline">
              Search for an album
            </Link>{" "}
            to get started.
          </p>
        ) : (
          <ul className="flex flex-col">
            {history.map((s) => (
              <li key={s.id} className="my-1 transition-[margin,transform] duration-300 hover:my-2 hover:translate-x-1.5 active:my-2 active:translate-x-1.5">
                <Link
                  href={`/?q=${encodeURIComponent(s.query)}`}
                  className="flex items-center gap-4 rounded border border-gray-700 bg-gray-900 p-3 hover:bg-gray-700 active:bg-gray-700"
                >
                  {s.seedAlbum?.artUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={s.seedAlbum.artUrl}
                      alt=""
                      className="h-14 w-14 rounded object-cover"
                    />
                  ) : (
                    <div className="h-14 w-14 rounded bg-gray-200" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">
                      {s.seedAlbum?.title ?? s.query}
                    </p>
                    <p className="truncate text-sm text-gray-500">
                      {s.seedAlbum?.artist ?? "No album matched"}
                    </p>
                  </div>
                  <span className="shrink-0 text-xs text-gray-400">
                    {s.createdAt.toLocaleDateString()}{" "}
                    {s.createdAt.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </PageTransition>
      <Footer />
    </main>
  );
}
