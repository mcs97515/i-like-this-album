import "dotenv/config";
import { searchAlbum, getAlbumInfo, getSimilarArtists } from "../src/lib/lastfm";

async function main() {
  const search = await searchAlbum("OK Computer", 3);
  console.log("Top search results:");
  for (const a of search.results.albummatches.album) {
    console.log(`  - ${a.name} by ${a.artist}`);
  }

  const info = await getAlbumInfo("Radiohead", "OK Computer");
  console.log(`\nAlbum info: ${info.album.name} by ${info.album.artist}`);
  console.log(`  Tags: ${info.album.tags?.tag.map((t) => t.name).join(", ") ?? "(none)"}`);

  const sim = await getSimilarArtists("Radiohead", 5);
  console.log(`\nSimilar artists to Radiohead:`);
  for (const a of sim.similarartists.artist) {
    console.log(`  - ${a.name} (match: ${a.match})`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error("ERR:", e.message);
    process.exit(1);
  });
