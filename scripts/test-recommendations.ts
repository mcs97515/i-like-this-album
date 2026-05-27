import "dotenv/config";
import { recommendFromQuery } from "../src/lib/recommendations";

async function main() {
  const result = await recommendFromQuery("OK Computer", 10);
  if (!result) {
    console.log("No album found.");
    return;
  }

  console.log(`Seed: ${result.seed.title} by ${result.seed.artist} [${result.seed.trackCount} tracks]`);
  console.log(`\nTop ${result.candidates.length} recommendations:`);
  for (const c of result.candidates) {
    const tracks = c.trackCount === null ? "?" : String(c.trackCount);
    console.log(`  ${c.score.toFixed(3)}  [${tracks.padStart(2)} trk]  ${c.title} — ${c.artist}`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error("ERR:", e);
    process.exit(1);
  });
