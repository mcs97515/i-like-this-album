import {
  searchAlbum,
  getAlbumInfo,
  getSimilarArtists,
  getArtistTopAlbums,
  type LastfmImage,
  type AlbumInfo,
} from "./lastfm";

type RawCandidate = {
  title: string;
  artist: string;
  url: string;
  imageUrl: string | null;
  mbid: string | null;
  score: number;
};

export type RecommendationCandidate = RawCandidate & {
  trackCount: number | null;
  tags: string[];
};

export type SeedAlbumInfo = {
  title: string;
  artist: string;
  url: string;
  imageUrl: string | null;
  mbid: string | null;
  tags: string[];
  trackCount: number | null;
};

export type RecommendationResult = {
  seed: SeedAlbumInfo;
  candidates: RecommendationCandidate[];
};

function pickImage(images?: LastfmImage[]): string | null {
  if (!images || images.length === 0) return null;
  const order = ["mega", "extralarge", "large", "medium", "small"];
  for (const size of order) {
    const found = images.find((img) => img.size === size && img["#text"]);
    if (found) return found["#text"];
  }
  return images.find((img) => img["#text"])?.["#text"] ?? null;
}

// Last.fm returns tracks.track as an array, OR a bare object for a 1-track
// release, OR omits it entirely. Normalize all three to a count.
function countTracks(info: AlbumInfo): number {
  const t = info.album.tracks?.track;
  if (!t) return 0;
  return Array.isArray(t) ? t.length : 1;
}

// Same array-vs-object quirk applies to tags.
function extractTags(info: AlbumInfo): string[] {
  const t = info.album.tags?.tag;
  if (!t) return [];
  const arr = Array.isArray(t) ? t : [t];
  return arr.map((x) => x.name);
}

// Run an async fn over items with a fixed number of concurrent workers.
async function mapWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  fn: (item: T) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let nextIndex = 0;

  async function worker() {
    while (nextIndex < items.length) {
      const current = nextIndex++;
      results[current] = await fn(items[current]);
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(concurrency, items.length) }, () => worker()),
  );
  return results;
}

export async function resolveSeedAlbum(query: string): Promise<SeedAlbumInfo | null> {
  const search = await searchAlbum(query, 1);
  const top = search.results.albummatches.album?.[0];
  if (!top) return null;

  const info = await getAlbumInfo(top.artist, top.name);
  return {
    title: info.album.name,
    artist: info.album.artist,
    url: info.album.url,
    imageUrl: pickImage(info.album.image),
    mbid: info.album.mbid || null,
    tags: extractTags(info),
    trackCount: countTracks(info),
  };
}

export async function generateRecommendations(
  seed: SeedAlbumInfo,
  candidateCount = 40,
  similarArtistCount = 25,
  albumsPerArtist = 5,
  maxPerArtist = 2,
  minTracks = 5,
): Promise<RecommendationCandidate[]> {
  const sim = await getSimilarArtists(seed.artist, similarArtistCount);
  const similarArtists = sim.similarartists.artist ?? [];
  if (similarArtists.length === 0) return [];

  // Collect raw candidates from each similar artist's top albums
  const albumGroups = await Promise.all(
    similarArtists.map(async (artist) => {
      try {
        const top = await getArtistTopAlbums(artist.name, albumsPerArtist);
        const artistMatch = parseFloat(artist.match) || 0;
        return (top.topalbums.album ?? []).map((album, i) => ({
          title: album.name,
          artist: artist.name,
          url: album.url,
          imageUrl: pickImage(album.image),
          mbid: album.mbid || null,
          score: artistMatch * (1 - i * 0.1),
        }));
      } catch {
        return [];
      }
    }),
  );

  // Dedupe by (artist, title), keep highest score
  const seen = new Map<string, RawCandidate>();
  for (const album of albumGroups.flat()) {
    const key = `${album.artist.toLowerCase()}|${album.title.toLowerCase()}`;
    const existing = seen.get(key);
    if (!existing || album.score > existing.score) {
      seen.set(key, album);
    }
  }
  seen.delete(`${seed.artist.toLowerCase()}|${seed.title.toLowerCase()}`);

  // Enrich each candidate with album.getInfo to learn track count + tags.
  // Concurrency-limited to stay within Last.fm's rate limit.
  const enriched = await mapWithConcurrency(
    Array.from(seen.values()),
    5,
    async (c): Promise<RecommendationCandidate> => {
      try {
        const info = await getAlbumInfo(c.artist, c.title);
        return { ...c, trackCount: countTracks(info), tags: extractTags(info) };
      } catch {
        return { ...c, trackCount: null, tags: [] };
      }
    },
  );

  // Drop singles / short releases. Keep anything we couldn't verify
  // (trackCount === null means enrichment failed) rather than punishing
  // a transient API hiccup by discarding a possibly-legit album.
  const albumsOnly = enriched.filter(
    (c) => c.trackCount === null || c.trackCount >= minTracks,
  );

  // Sort by score, then enforce per-artist cap when filling the result
  const sorted = albumsOnly.sort((a, b) => b.score - a.score);
  const result: RecommendationCandidate[] = [];
  const perArtist = new Map<string, number>();

  for (const c of sorted) {
    const key = c.artist.toLowerCase();
    const count = perArtist.get(key) ?? 0;
    if (count >= maxPerArtist) continue;
    result.push(c);
    perArtist.set(key, count + 1);
    if (result.length >= candidateCount) break;
  }

  return result;
}

export async function recommendFromQuery(
  query: string,
  candidateCount = 40,
): Promise<RecommendationResult | null> {
  const seed = await resolveSeedAlbum(query);
  if (!seed) return null;
  const candidates = await generateRecommendations(seed, candidateCount);
  return { seed, candidates };
}
