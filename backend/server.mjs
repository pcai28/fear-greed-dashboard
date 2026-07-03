import { createApp } from "./src/app.js";
import { assertWaitlistLaunchReady, env } from "./src/config/env.js";

assertWaitlistLaunchReady();
const { app, dependencies } = createApp({ serveFrontend: env.isProduction });
const server = app.listen(env.port, env.host, () => {
  console.log(`Market Emotions API running at http://${env.host}:${env.port}`);
});

server.headersTimeout = 15_000;
server.requestTimeout = 20_000;
server.keepAliveTimeout = 5_000;

async function shutdown() {
  server.close(async () => {
    await dependencies.mongo.close();
    process.exit(0);
  });
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
