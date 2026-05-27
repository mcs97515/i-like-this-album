import type { SearchResult } from "@/lib/search";
import { StreamingLinks } from "./StreamingLinks";

type Recommendation = SearchResult["recommendations"][number];

async function fetchAppleMusicUrl(title: string, artist: string): Promise<string> {
  const query = encodeURIComponent(`${title} ${artist}`);
  const fallback = `https://music.apple.com/search?term=${encodeURIComponent(title)}`;
  try {
    const res = await fetch(
      `https://itunes.apple.com/search?term=${query}&media=music&entity=album&limit=1`,
      { cache: "force-cache" },
    );
    const data = await res.json();
    return data.results?.[0]?.collectionViewUrl ?? fallback;
  } catch {
    return fallback;
  }
}

export async function AlbumCard({ r }: { r: Recommendation }) {
  const { title, artist, artUrl } = r.recommended;
  const spotifyUrl = `https://open.spotify.com/search/${encodeURIComponent(`${title} ${artist}`)}`;
  const appleMusicUrl = await fetchAppleMusicUrl(title, artist);

  return (
    <li className="flex flex-col rounded border border-gray-700 bg-gray-900 p-3">
      {artUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={artUrl} alt="" className="aspect-square w-full rounded object-cover" />
      ) : (
        <div className="aspect-square w-full rounded bg-gray-800 flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-600">
            <path d="M9 18V5l12-2v13" />
            <circle cx="6" cy="18" r="3" />
            <circle cx="18" cy="16" r="3" />
          </svg>
        </div>
      )}
      <p className="line-clamp-2 text-sm font-medium mt-2">{title}</p>
      <div className="flex items-center justify-between gap-1 mt-auto pt-2">
        <p className="line-clamp-1 text-sm text-gray-500">{artist}</p>
        <StreamingLinks spotifyUrl={spotifyUrl} appleMusicUrl={appleMusicUrl} />
      </div>
    </li>
  );
}

export function AlbumCardSkeleton() {
  return (
    <li className="space-y-2 rounded border border-gray-700 bg-gray-900 p-3 animate-pulse">
      <div className="aspect-square w-full rounded bg-gray-800" />
      <div className="h-3 w-3/4 rounded bg-gray-800" />
      <div className="h-3 w-1/2 rounded bg-gray-800" />
    </li>
  );
}
