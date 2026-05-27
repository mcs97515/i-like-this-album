import "dotenv/config";
import { prisma } from "../src/lib/prisma";

async function main() {
  console.log("Top-level keys on prisma:", Object.keys(prisma).filter(k => !k.startsWith("$") && !k.startsWith("_")));
  const userCount = await prisma.user.count();
  const accountCount = await prisma.account.count();
  const sessionCount = await prisma.session.count();
  console.log(`Users: ${userCount}, Accounts: ${accountCount}, Sessions: ${sessionCount}`);
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error("ERR:", e.message);
    process.exit(1);
  });
