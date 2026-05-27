import { prisma } from "./prisma";
import { redis } from "./redis";
import type {
  RecommendationResult,
  SeedAlbumInfo,
  RecommendationCandidate,
} from "./recommendations";
import { resolveSeedAlbum, generateRecommendations } from "./recommendations";

type AlbumInput = {
  lastfmUrl: string;
  mbid?: string | null;
  title: string;
  artist: string;
  artUrl?: string | null;
  tags?: string[];
  trackCount?: number | null;
};

async function upsertAlbum(input: AlbumInput) {
  const { tags, trackCount, ...rest } = input;
  const updateData = {
    ...rest,
    ...(tags && tags.length > 0 ? { tags } : {}),
    ...(trackCount != null ? { trackCount } : {}),
  };
  try {
    return await prisma.album.upsert({
      where: { lastfmUrl: rest.lastfmUrl },
      create: { ...rest, tags: tags ?? [], trackCount: trackCount ?? null },
      update: updateData,
    });
  } catch (e: unknown) {
    if ((e as { code?: string })?.code === "P2002" && rest.mbid) {
      return prisma.album.update({ where: { mbid: rest.mbid }, data: updateData });
    }
    throw e;
  }
}

function seedToInput(seed: SeedAlbumInfo): AlbumInput {
  return {
    lastfmUrl: seed.url,
    mbid: seed.mbid,
    title: seed.title,
    artist: seed.artist,
    artUrl: seed.imageUrl,
    tags: seed.tags,
    trackCount: seed.trackCount,
  };
}

function candidateToInput(c: RecommendationCandidate): AlbumInput {
  return {
    lastfmUrl: c.url,
    mbid: c.mbid,
    title: c.title,
    artist: c.artist,
    artUrl: c.imageUrl,
    tags: c.tags,
    trackCount: c.trackCount,
  };
}

export async function persistRecommendations(
  result: RecommendationResult,
): Promise<{ seedAlbumId: string; candidateCount: number }> {
  const seedAlbum = await upsertAlbum(seedToInput(result.seed));

  const candidateAlbums = await Promise.all(
    result.candidates.map((c) => upsertAlbum(candidateToInput(c))),
  );

  await Promise.all(
    result.candidates.map((c, position) =>
      prisma.albumRecommendation.upsert({
        where: {
          seedAlbumId_recommendedId: {
            seedAlbumId: seedAlbum.id,
            recommendedId: candidateAlbums[position].id,
          },
        },
        create: {
          seedAlbumId: seedAlbum.id,
          recommendedId: candidateAlbums[position].id,
          position,
          score: c.score,
        },
        update: {
          position,
          score: c.score,
          computedAt: new Date(),
        },
      }),
    ),
  );

  return { seedAlbumId: seedAlbum.id, candidateCount: candidateAlbums.length };
}

export async function getStoredRecommendations(
  seedAlbumId: string,
  offset = 0,
  limit = 5,
) {
  return prisma.albumRecommendation.findMany({
    where: { seedAlbumId },
    orderBy: { position: "asc" },
    skip: offset,
    take: limit,
    include: { recommended: true },
  });
}

export async function recordSearch(
  userId: string,
  query: string,
  seedAlbumId: string | null,
): Promise<string> {
  const search = await prisma.search.create({
    data: { userId, query, seedAlbumId },
  });
  return search.id;
}

export async function getUserSearchHistory(userId: string, limit = 50) {
  const searches = await prisma.search.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: { seedAlbum: true },
  });

  const seen = new Set<string>();
  const deduped: typeof searches = [];
  for (const s of searches) {
    const key = s.seedAlbumId ?? s.query;
    if (!seen.has(key)) {
      seen.add(key);
      deduped.push(s);
      if (deduped.length >= limit) break;
    }
  }
  return deduped;
}

export type SearchResult = {
  seed: Awaited<ReturnType<typeof upsertAlbum>>;
  recommendations: Awaited<ReturnType<typeof getStoredRecommendations>>;
  offset: number;
  total: number;
};

// The shape we cache in Redis: the full candidate pool for one query.
type CachedPool = {
  seed: SearchResult["seed"];
  allRecs: SearchResult["recommendations"];
};

const CACHE_TTL_SECONDS = 60 * 60 * 24; // 24 hours

async function cacheGet(key: string): Promise<CachedPool | null> {
  try {
    const raw = await redis.get(key);
    return raw ? (JSON.parse(raw) as CachedPool) : null;
  } catch {
    return null; // Redis down -> treat as a miss, never break search
  }
}

async function cacheSet(key: string, value: CachedPool): Promise<void> {
  try {
    await redis.set(key, JSON.stringify(value), "EX", CACHE_TTL_SECONDS);
  } catch {
    // Redis down -> skip caching; not fatal
  }
}

export async function searchAndRecommend(
  userId: string,
  query: string,
  offset = 0,
  limit = 5,
): Promise<SearchResult | null> {
  const cacheKey = `recs:${query.toLowerCase().trim()}`;

  // L1: Redis
  let pool = await cacheGet(cacheKey);

  // Cache miss -> L2 (Postgres) and L3 (Last.fm)
  if (!pool) {
    const seed = await resolveSeedAlbum(query);
    if (!seed) return null;

    const seedAlbum = await upsertAlbum(seedToInput(seed));
    let allRecs = await getStoredRecommendations(seedAlbum.id, 0, 100);

    if (allRecs.length === 0) {
      const candidates = await generateRecommendations(seed, 40);
      await persistRecommendations({ seed, candidates });
      allRecs = await getStoredRecommendations(seedAlbum.id, 0, 100);
    }

    pool = { seed: seedAlbum, allRecs };
    await cacheSet(cacheKey, pool);
  }

  // Record the search for history — always, even on a cache hit
  if (offset === 0) {
    await recordSearch(userId, query, pool.seed.id);
  }

  // Paginate the pool with wrap-around
  const { seed, allRecs } = pool;
  if (allRecs.length === 0) {
    return { seed, recommendations: [], offset, total: 0 };
  }
  const effectiveLimit = Math.min(limit, allRecs.length);
  const startIdx = offset % allRecs.length;
  const page = Array.from(
    { length: effectiveLimit },
    (_, i) => allRecs[(startIdx + i) % allRecs.length],
  );

  return { seed, recommendations: page, offset, total: allRecs.length };
}
