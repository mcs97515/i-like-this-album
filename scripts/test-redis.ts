import "dotenv/config";
import { redis } from "../src/lib/redis";

async function main() {
  await redis.set("test:hello", "world", "EX", 60);
  const val = await redis.get("test:hello");
  console.log("Redis round-trip:", val);
  console.log("REDIS_URL:", process.env.REDIS_URL);
  await redis.quit();
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error("ERR:", e);
    process.exit(1);
  });
