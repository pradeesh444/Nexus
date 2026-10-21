import { existsSync } from "node:fs";
if (existsSync(".env") && process.loadEnvFile) process.loadEnvFile(".env");
const { createStore } = await import("./store.js");
const { createApp } = await import("./app.js");
try {
  const store = await createStore();
  const port = Number(process.env.PORT || 4000);
  const server = createApp(store).listen(
    port,
    process.env.HOST || "0.0.0.0",
    () =>
      console.log(
        `\nNexus ERP ready at http://localhost:${port}\nStorage: ${store.mode}\nDemo login: owner@nexus.demo / Demo@12345\n`,
      ),
  );
  for (const signal of ["SIGINT", "SIGTERM"])
    process.on(signal, () =>
      server.close(async () => {
        await store.close();
        process.exit(0);
      }),
    );
} catch (e) {
  console.error(`Could not start Nexus ERP: ${e.message}`);
  process.exit(1);
}
