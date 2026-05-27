import "dotenv/config";
import { prisma } from "../src/lib/prisma";
import { recommendFromQuery } from "../src/lib/recommendations";
import {
  persistRecommendations,
  getStoredRecommendations,
  recordSearch,
} from "../src/lib/search";

async function main() {
  const user = await prisma.user.findFirstOrThrow();
  console.log(`Using user: ${user.email}`);

  console.log("\nGenerating recommendations for 'OK Computer'...");
  const result = await recommendFromQuery("OK Computer", 20);
  if (!result) {
    console.log("No album found.");
    return;
  }

  console.log(`Seed: ${result.seed.title} by ${result.seed.artist}`);
  console.log(`Generated ${result.candidates.length} candidates.`);

  console.log("\nPersisting...");
  const { seedAlbumId, candidateCount } = await persistRecommendations(result);
  console.log(`Stored. Seed album id: ${seedAlbumId}, candidates persisted: ${candidateCount}`);

  console.log("\nRecording search...");
  const searchId = await recordSearch(user.id, "OK Computer", seedAlbumId);
  console.log(`Search id: ${searchId}`);

  console.log("\nReading back page 1 (top 5):");
  const page1 = await getStoredRecommendations(seedAlbumId, 0, 5);
  for (const r of page1) {
    console.log(`  ${r.position.toString().padStart(2)}. ${r.recommended.title} — ${r.recommended.artist} (score ${r.score?.toFixed(3)})`);
  }

  console.log("\nReading back page 2 (next 5, refresh):");
  const page2 = await getStoredRecommendations(seedAlbumId, 5, 5);
  for (const r of page2) {
    console.log(`  ${r.position.toString().padStart(2)}. ${r.recommended.title} — ${r.recommended.artist} (score ${r.score?.toFixed(3)})`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error("ERR:", e);
    process.exit(1);
  });
