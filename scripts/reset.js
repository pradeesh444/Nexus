import { rm } from "node:fs/promises";
import { existsSync } from "node:fs";
if (existsSync(".env") && process.loadEnvFile) process.loadEnvFile(".env");
if (process.env.MONGODB_URI) {
  console.error(
    "Reset is restricted to local demo mode. No MongoDB data was changed.",
  );
  process.exit(1);
}
if (!process.argv.includes("--confirm")) {
  console.log(
    "Stop the server first. To erase all local demo changes, run: npm run reset-demo -- --confirm",
  );
  process.exit(0);
}
await rm(process.env.DATA_FILE || "data/workspace.json", { force: true });
console.log(
  "Local demo data removed. Restart the app to restore sample records.",
);
