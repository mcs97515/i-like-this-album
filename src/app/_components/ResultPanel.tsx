import { Suspense } from "react";
import Link from "next/link";
import type { SearchResult } from "@/lib/search";
import { AlbumCard, AlbumCardSkeleton } from "./AlbumCard";

export function ResultPanel({
  result,
  query,
  offset,
}: {
  result: SearchResult;
  query: string;
  offset: number;
}) {
  const { seed, recommendations, total } = result;
  const nextOffset = offset + recommendations.length;

  return (
    <div className="w-full max-w-4xl space-y-6">
      <div className="flex items-center gap-4 rounded border border-gray-700 bg-gray-900 p-4">
        {seed.artUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={seed.artUrl} alt="" className="h-24 w-24 rounded object-cover" />
        )}
        <div>
          <p className="text-sm text-gray-500">Showing recommendations for</p>
          <p className="text-2xl font-bold">{seed.title}</p>
          <p className="text-gray-700">{seed.artist}</p>
        </div>
      </div>

      {recommendations.length === 0 || !recommendations ? (
        <p className="text-gray-500">No recommendations available for this album.</p>
      ) : (
        <>
          <h2 className="text-xl font-semibold">You might also like:</h2>
          <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {recommendations.map((r) => (
              <Suspense key={r.id} fallback={<AlbumCardSkeleton />}>
                <AlbumCard r={r} />
              </Suspense>
            ))}
          </ul>

          <div className="flex justify-center pt-2">
            <Link
              href={`/?q=${encodeURIComponent(query)}&offset=${nextOffset}`}
              className="flex items-center gap-1.5 rounded border border-gray-700 bg-gray-900 px-6 py-2 text-white transition-all duration-150 hover:scale-105 hover:bg-white hover:text-gray-900 active:scale-105 active:bg-white active:text-gray-900"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
                <path d="M3 3v5h5"/>
              </svg>
              More Albums
            </Link>
          </div>

          <p className="text-center text-xs text-gray-400">
            Candidate pool: {total} albums · viewing {recommendations.length} per page
          </p>
        </>
      )}
    </div>
  );
}
