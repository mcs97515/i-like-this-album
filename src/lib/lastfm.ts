const LASTFM_BASE_URL = "https://ws.audioscrobbler.com/2.0/";
const USER_AGENT = "i-like-this-album/0.1";

type LastfmParams = Record<string, string>;

async function lastfmCall<T>(method: string, params: LastfmParams): Promise<T> {
  const apiKey = process.env.LASTFM_API_KEY;
  if (!apiKey) throw new Error("LASTFM_API_KEY is not set");

  const url = new URL(LASTFM_BASE_URL);
  url.searchParams.set("method", method);
  url.searchParams.set("api_key", apiKey);
  url.searchParams.set("format", "json");
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v);
  }

  const res = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
  if (!res.ok) {
    throw new Error(`Last.fm HTTP ${res.status}: ${await res.text()}`);
  }

  const data = await res.json();
  if (data.error) {
    throw new Error(`Last.fm API error ${data.error}: ${data.message}`);
  }
  return data as T;
}

// --- Narrow result types for the endpoints we use ---

export type LastfmImage = { "#text": string; size: "small" | "medium" | "large" | "extralarge" | "mega" | "" };

export type AlbumSearchResult = {
  results: {
    albummatches: {
      album: Array<{
        name: string;
        artist: string;
        url: string;
        image: LastfmImage[];
        mbid?: string;
      }>;
    };
  };
};

export type AlbumInfo = {
  album: {
    name: string;
    artist: string;
    mbid?: string;
    url: string;
    image: LastfmImage[];
    tags?: { tag: Array<{ name: string; url: string }> };
    tracks?: { track: Array<{ name: string; duration: string }> };
  };
};

export type SimilarArtists = {
  similarartists: {
    artist: Array<{ name: string; mbid?: string; url: string; match: string; image: LastfmImage[] }>;
  };
};

export type ArtistTopAlbums = {
  topalbums: {
    album: Array<{ name: string; mbid?: string; url: string; image: LastfmImage[]; playcount: string }>;
  };
};

// --- Endpoint wrappers ---

export function searchAlbum(query: string, limit = 10) {
  return lastfmCall<AlbumSearchResult>("album.search", { album: query, limit: String(limit) });
}

export function getAlbumInfo(artist: string, album: string) {
  return lastfmCall<AlbumInfo>("album.getInfo", { artist, album, autocorrect: "1" });
}

export function getSimilarArtists(artist: string, limit = 20) {
  return lastfmCall<SimilarArtists>("artist.getSimilar", {
    artist,
    limit: String(limit),
    autocorrect: "1",
  });
}

export function getArtistTopAlbums(artist: string, limit = 5) {
  return lastfmCall<ArtistTopAlbums>("artist.getTopAlbums", {
    artist,
    limit: String(limit),
    autocorrect: "1",
  });
}
