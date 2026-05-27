import { auth, signIn } from "@/lib/auth";
import { searchAndRecommend } from "@/lib/search";
import { SearchForm } from "./_components/SearchForm";
import { ResultPanel } from "./_components/ResultPanel";
import { TopBar } from "./_components/TopBar";
import { ThumbsUpIcon } from "./_components/ThumbsUpIcon";
import { PageTransition } from "./_components/PageTransition";
import { Footer } from "./_components/Footer";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; offset?: string }>;
}) {
  const session = await auth();
  const params = await searchParams;

  if (!session?.user) {
    return (
      <main className="relative flex min-h-screen flex-col items-center justify-center gap-6 overflow-hidden p-8">
        <span className="pointer-events-none absolute top-[45%] left-1/2 -translate-x-1/2 -translate-y-1/2 inline-block opacity-5 animate-spin-3d-slow">
          <ThumbsUpIcon size={400} />
        </span>
        <h1 className="text-4xl font-bold">I Like This Album.</h1>
        <form
          action={async () => {
            "use server";
            await signIn("google", { redirectTo: "/" });
          }}
        >
          <button
            type="submit"
            className="rounded bg-gray-700 px-6 py-3 text-white opacity:100 hover:bg-gray-500"
          >
            Sign in with Google
          </button>
        </form>
      </main>
    );
  }

  const query = params.q?.trim();
  const offset = params.offset
    ? Math.max(0, parseInt(params.offset, 10) || 0)
    : 0;

  const result = query
    ? await searchAndRecommend(session.user.id!, query, offset, 5)
    : null;

  return (
    <main className="flex min-h-screen flex-col items-center gap-8 p-8">
      <TopBar user={session.user} />

      <PageTransition>
        <SearchForm initialQuery={query} />

        {query && !result && (
          <p className="text-gray-500">
            Couldn&rsquo;t find any album matching &ldquo;{query}&rdquo;.
          </p>
        )}

        {result && <ResultPanel result={result} query={query!} offset={offset} />}
      </PageTransition>
      <Footer />
    </main>
  );
}
